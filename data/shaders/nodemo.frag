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
    float wave = texture2D(uFFT, vec2(0.2 + pos.x * 0.4)).x;
    float fft = texture2D(uFFT, vec2(0.0)).x;
    vec4 logo = texture2D(uSampler, pos * 0.35 + wave * 0.05 * vec2(sin(pos.y + uTime), cos(pos.x + uTime)));
    vec2 range = vec2(0.49, 0.5) - 0.2;
    float radius = 0.3 + abs(sin(fft * 2.0)) * 0.5;

    range += sin(cos(wave) * 40.0) * 0.1;
    range.x -= sin(wave + length(pos.x - 0.5) * 0.1) * length(pos.x - 0.5) * 0.2;
    range.y += sin(wave + length(pos.x - 0.5) * 0.1) * length(pos.x - 0.5) * 0.2;


    if (pos.y > range.x && pos.y < range.y)
    {
        gl_FragColor = vec4(1.0);
    }
    else if (length(pos - 0.5) < radius)
    {
        gl_FragColor = logo;
    }
    else
    {
        discard;
    }

}
