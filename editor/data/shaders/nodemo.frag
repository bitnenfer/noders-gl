precision mediump float;

uniform sampler2D uSampler;
uniform sampler2D uNoise;
uniform sampler2D uNoiseTunnel;
uniform sampler2D uFFT;
uniform vec2 uResolution;
uniform float uTime;
uniform float uMediaTime;

void main()
{

    // range 0.0 to 1.0 fragment coord
    vec2 pos = gl_FragCoord.xy / uResolution;
    float wave = texture2D(uFFT, vec2(0.2 + pos.x * 0.4)).x;
    float fft = texture2D(uFFT, vec2(0.0)).x;
    
    vec4 logo = texture2D(uSampler, pos * 0.35 + wave * 0.05 * vec2(sin(fft* pos.y + uMediaTime), cos(fft* pos.x + uMediaTime)));
    vec2 range = vec2(0.49, 0.5) - 0.2;
    float radius = 0.3 + abs(sin(fft * 2.0)) * 0.25;

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
    else if ((uMediaTime > 53.5 && uMediaTime < 81.5)||
            (uMediaTime > 94.5 && uMediaTime < 122.5))
    {
        vec2 pixelPos = gl_FragCoord.xy / uResolution;
        vec4 noise = texture2D(uNoiseTunnel, pixelPos) * 2.0;
        float time = uMediaTime * 50.5;
        float freq = 20.0;
        float value = 
            sin((time + noise.x * 2.0) + sqrt(1.0 / length(pixelPos - 0.5)) * freq);

        float scale = 5.0 * pow(length(pixelPos - 0.5), 3.0);
        gl_FragColor = vec4(
            (value * (1.0 / length(pixelPos - 0.5))) * scale,
            (value * (length(pixelPos - 0.5))) * scale,
            (value * wave) * scale,
            1.0
        );
    }
    else
    {
        discard;
    }

}
