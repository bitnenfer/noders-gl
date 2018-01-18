precision mediump float;

uniform vec3 uLightDir;
uniform vec3 uAmbient;
uniform vec3 uDiffuse;

varying vec3 outNormal;

void main()
{
    vec3 L = normalize(uLightDir);
    vec3 N = normalize(outNormal);

    float diffuse = max(dot(N, L), 0.0);

    gl_FragColor = vec4(uAmbient + (uDiffuse * diffuse), 1.0);

}
