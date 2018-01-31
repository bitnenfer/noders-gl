precision mediump float;

uniform sampler2D uSampler;
uniform sampler2D uNoise;
uniform sampler2D uFFT;
uniform vec2 uResolution;
uniform float uTime;

void main()
{
    float fft = (texture2D(uFFT, vec2(0.0)) +
                texture2D(uFFT, vec2(0.1)) + 
                texture2D(uFFT, vec2(0.2)) + 
                texture2D(uFFT, vec2(0.3)) + 
                texture2D(uFFT, vec2(0.4)) + 
                texture2D(uFFT, vec2(0.5)) + 
                texture2D(uFFT, vec2(0.6))).x / 7.0;

    // range 0.0 to 1.0 fragment coord
    vec2 pos = gl_FragCoord.xy / uResolution; 
    vec4 logo = texture2D(uSampler, pos * 0.35 + fft * 0.05 * vec2(sin(pos.y + uTime), cos(pos.x + uTime)));
    vec2 range = vec2(0.5, 0.51);
    float radius = 0.1 + abs(sin(fft * 2.0)) * 0.5;

    range += sin(uTime + pos.x * fft * 10.0) * 0.15;

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
