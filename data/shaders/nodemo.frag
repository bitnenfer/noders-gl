precision mediump float;

#define MAX_STEPS 100
#define EPSILON 0.001
#define MAX_DIST 30.0

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uFFT;

const float PI = 3.141592653589793;
const vec3 UP = vec3(0.0, 1.0, 0.0);

float snoise(vec4 v);

float sdfDisplacement(vec3 p, float delta) {
    return sin(delta * p.x) * sin(delta * p.y) * sin(delta * p.z);
}

float sdfSphere(vec3 origin, float radius) {
    return length(origin) - radius;
}

float sdfBox(vec3 origin, vec3 dimensions)
{
    vec3 dist = abs(origin) - dimensions;
    return min(max(dist.x, max(dist.y, dist.z)), 0.0) + length(max(dist, 0.0));
}

vec2 sdfCombine(vec2 a, vec2 b)
{
    return a.x < b.x ? a : b;
}
vec2 sdfSCombine(vec2 a, vec2 b, float k) {
    float res = exp(-k * a.x) + exp(-k * b.x);
    return vec2(-log(res) / k, a.x < b.x ? a.y : b.y);
}
float sdfSmin(float a, float b, float k) {
    float res = exp(-k * a) + exp(-k * b);
    return -log(res) / k;
}

vec3 getScene(vec3 position)
{
    vec4 fft = texture2D(uFFT, vec2(0.0));
    float noise = snoise(fft);
    float box = sdfBox(position + vec3(0.0, -2.0, 0.0), vec3(2.0, 0.5, 2.0));
    float sphere = sdfSphere(position + vec3(0.0, sin(uTime), cos(uTime)), 1.0);
    float mixSurfaces = sdfSmin(sdfDisplacement(position, sin(uTime + position.x)) + sphere, box, 10.0);
    return vec3(mixSurfaces);
}

vec3 getNormal(vec3 p, float edelta) {
    vec2 e = vec2(0.0, EPSILON * edelta);
    return normalize(vec3(
        getScene(p + e.yxx).r - getScene(p - e.yxx).r,
        getScene(p + e.xyx).r - getScene(p - e.xyx).r,
        getScene(p + e.xxy).r - getScene(p - e.xxy).r
    ));
}

vec3 getLight(float dist, vec3 pos, vec3 dir, float specDelta, float edelta, vec3 diffuseColor, vec3 specularColor, vec3 ambientColor) {
    if (dist < EPSILON) {
        vec3 normal = getNormal(pos, edelta);
        float diffuse = max(0.0, dot(-dir, normal));
        float specular = pow(diffuse, specDelta);
        vec3 color = vec3((diffuseColor * diffuse) + (specularColor * specular) + ambientColor);
        return color;
    } else {
        return vec3(0.0);
    }
}

// Source: http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm
float getShadow(in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
    float res = 1.0;
    float t = mint;
    for( int i=0; i<32; i++ )
    {
        float h = getScene( ro + rd*t ).x;
        res = min( res, 2.0*h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<0.001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

void main()
{
    vec3 cameraOrigin = vec3(0.0, 0.0, -4.0);
    vec3 cameraTarget = vec3(0.0, 0.0, 0.0);
    vec3 cameraDirection = normalize(cameraTarget - cameraOrigin);
    vec3 cameraRight = normalize(cross(UP, cameraOrigin));
    vec3 cameraUp = cross(cameraDirection, cameraRight);
    vec2 screenPosition = (-1.0 + 2.0 * gl_FragCoord.xy / uResolution) * (uResolution.x / uResolution.y);
    vec3 rayDirection = normalize(cameraRight * screenPosition.x + cameraUp * screenPosition.y + cameraDirection);
    float total = 0.0;
    float dist = EPSILON;
    vec3 position = cameraOrigin;

    for (int rayStep = 0; rayStep < MAX_STEPS; ++rayStep)
    {
        if (dist < EPSILON || total > MAX_DIST) break;

        dist = getScene(position).x;
        total += dist;
        position += dist * rayDirection;
    }

    vec3 lightDir = vec3(0.5, 1.0, 1.0);
    //float dist, vec3 pos, vec3 dir, float specDelta, float edelta
    float shadowFactor = getShadow(position, -lightDir, 0.01, 2.5);
    vec3 diffuseSpecular = getLight(dist, position, lightDir, 12.0, 0.1, vec3(0.5, 0.4, 0.4)  * shadowFactor, vec3(0.001), vec3(0.2));

    /*
if (L > 1) shadow = GetShadow(pos, lightPos, 0.01, 2.5);
        vec3 light = GetLight(vec3(1.0, 1.0, 0.0) * 0.5, vec3(specularity), vec4(1.0), lightPos, pos, eye);
        color += light * shadow;

    */

    gl_FragColor = vec4(diffuseSpecular, 1.0);

}

//  Simplex 4D Noise 
//  by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

vec4 grad4(float j, vec4 ip){
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

  return p;
}

float snoise(vec4 v){
  const vec2  C = vec2( 0.138196601125010504,  // (5 - sqrt(5))/20  G4
                        0.309016994374947451); // (sqrt(5) - 1)/4   F4
// First corner
  vec4 i  = floor(v + dot(v, C.yyyy) );
  vec4 x0 = v -   i + dot(i, C.xxxx);

// Other corners

// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
  vec4 i0;

  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
//  i0.x = dot( isX, vec3( 1.0 ) );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;

//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;

  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

  //  x0 = x0 - 0.0 + 0.0 * C 
  vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
  vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
  vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
  vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

// Permutations
  i = mod(i, 289.0); 
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
// Gradients
// ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
// 7*7*6 = 294, which is close to the ring size 17*17 = 289.

  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

// Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));

// Mix contributions from the five corners
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

}