precision mediump float;

uniform sampler2D uSampler;
uniform sampler2D uNoise;
uniform sampler2D uFFT;
uniform vec2 uResolution;
uniform float uTime;

void main()
{
    // range 0.0 to 1.0 fragment coord
    vec2 pos = gl_FragCoord.xy / uResolution; 

    gl_FragColor = vec4(pos, 0.0, 1.0);
}
