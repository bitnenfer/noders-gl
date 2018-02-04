precision mediump float;

uniform vec3 uLightDir;
uniform vec3 uAmbient;
uniform vec3 uDiffuse;
uniform vec3 uSpecular;
uniform float uShininess;
uniform sampler2D uSampler;

varying vec3 outNormal;
varying vec3 outView;
varying vec2 outTexCoord;

void main()
{
    vec3 L = normalize(uLightDir);
    vec3 N = normalize(outNormal);
    vec3 V = normalize(outView);
    vec3 H = normalize(N + L);

    float diffuse = max(dot(N, L), 0.0);
    float specular = pow(max(dot(N, H), 0.0), uShininess);

    vec4 baseColor = texture2D(uSampler, outTexCoord);

    gl_FragColor = baseColor * vec4(uAmbient + (uDiffuse * diffuse) + (uSpecular * specular), 1.0);

}
