precision mediump float;

uniform sampler2D uSampler;
uniform vec3 uLightDir;
uniform vec3 uAmbient;
uniform vec3 uDiffuse;

varying vec2 outTexCoord;
varying vec3 outNormal;

void main()
{
    vec3 L = normalize(uLightDir);
    vec3 N = normalize(outNormal);

    float diffuse = max(dot(N, L), 0.0);

    gl_FragColor = texture2D(uSampler, outTexCoord) * vec4(uAmbient + (uDiffuse * diffuse), 1.0);

}
