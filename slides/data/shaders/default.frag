precision mediump float;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform float uScroll;
uniform float uTime;
uniform int uSlide;
uniform vec2 uResolution;

varying vec2 outTexCoord;

void main()
{
    float time = uScroll * 0.5;
    vec2 pixelPos = gl_FragCoord.xy / uResolution;
    vec4 currSlide = texture2D(uTex0, outTexCoord);
    vec4 nextSlide = texture2D(uTex1, outTexCoord);
    vec4 transition = texture2D(uTex2, outTexCoord + vec2(0, uScroll));

    if (transition.x >= uTime)
    {
        gl_FragColor = currSlide;
        if (uSlide == 0 &&
            (
                (pixelPos.y < 0.35) ||
                (pixelPos.y > 0.70)
            )

        )
        {
                float value = 0.0;
                float freq = 8.0;

                value = sin(time + pixelPos.x * freq) + 
                        sin(time + pixelPos.y * freq) + 
                        sin(time + (pixelPos.x + pixelPos.y) * freq) + 
                        cos(time + sqrt(length(pixelPos - 0.5)) * freq * 2.0);

                gl_FragColor = vec4(
                    cos(value),
                    sin(value), 
                    sin(value * 3.14 * 2.0), 
                    1.0
                );
        }
    }
    else
    {
        gl_FragColor = nextSlide;
    }

}
