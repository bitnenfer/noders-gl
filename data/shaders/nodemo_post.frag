precision mediump float;

uniform sampler2D uRT;
uniform sampler2D uFFT;
uniform float uTime;
uniform vec2 uResolution;
uniform int uPassIndex;
uniform int uPassCount;

const mat3 identity = mat3(
    +0.0, +0.0, +0.0,
    +0.0, +1.0, +0.0,
    +0.0, +0.0, +0.0
);

const mat3 gaussian = mat3(
    +0.077847, +0.123317, +0.077847,
    +0.123317, +0.195346, +0.123317,
    +0.077847, +0.123317, +0.077847
);

const mat3 edges = mat3(
    -1.0, +0.0, +0.0,
    +0.0, +2.0, +0.0,
    +0.0, +0.0, -1.0
);

const mat3 sharpen = mat3(
    -1.0, -1.0, -1.0,
    -1.0, +9.0, -1.0,
    -1.0, -1.0, -1.0    
);

vec2 offsets[9];

vec3 getColor(sampler2D texture, vec2 texCoord, mat3 kernel, float sampleSize);

void main()
{
    float sampleSize = sin(texture2D(uFFT, vec2(0.0))).x * 10.0; 
    vec2 uv = gl_FragCoord.xy / uResolution;
    
    gl_FragColor = vec4(getColor(uRT, uv, edges, sampleSize), 1.0);
    if (length(uv - 0.5) > 0.2 - abs(sin(sampleSize * 0.36)) * 0.25 && length(uv - 0.5) < 0.2 + abs(sin(sampleSize * 0.33)) * 0.25)
        gl_FragColor += vec4(
            max(sin(uTime + sampleSize / 10.0), 0.5), 
            max(cos(uTime + sampleSize / 5.0), 0.5), 
            max(sin(uTime + -sampleSize / 2.0), 0.5),
            1.0            
        );
}

vec3 getColor(sampler2D texture, vec2 texCoord, mat3 kernel, float sampleSize)
{
    vec2 pixelSize = (1.0 / uResolution) * sampleSize;
    vec3 accum = vec3(0.0);

    // setup offsets
    offsets[0] = vec2(-1.0, -1.0) * pixelSize;
    offsets[1] = vec2(+0.0, -1.0) * pixelSize;
    offsets[2] = vec2(+1.0, -1.0) * pixelSize;
    offsets[3] = vec2(-1.0, +0.0) * pixelSize;
    offsets[4] = vec2(+0.0, +0.0) * pixelSize;
    offsets[5] = vec2(+1.0, +0.0) * pixelSize;
    offsets[6] = vec2(-1.0, +1.0) * pixelSize;
    offsets[7] = vec2(+0.0, +1.0) * pixelSize;
    offsets[8] = vec2(+1.0, +1.0) * pixelSize;

    for (int index = 0; index < 3; ++index)
    {
        vec3 s0 = texture2D(uRT, texCoord + offsets[index * 3 + 0]).rgb;
        vec3 s1 = texture2D(uRT, texCoord + offsets[index * 3 + 1]).rgb;
        vec3 s2 = texture2D(uRT, texCoord + offsets[index * 3 + 2]).rgb;
        vec3 kernelRow = kernel[index];
        vec3 rowValue = s0 * kernelRow[0] + s1 * kernelRow[1] + s2 * kernelRow[2];

        accum += rowValue;
    }

    return accum;
}