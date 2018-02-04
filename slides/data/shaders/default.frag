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
            float limit = 30.0;
            float v = sin(limit * pixelPos.x + sin(time) * 0.5) + 
                        cos(limit * 0.5 * pixelPos.y - time * 2.0) +
                        sin(limit * (pixelPos.x + pixelPos.y)) +
                        sin(limit * sqrt((pixelPos.x + 0.5) * (pixelPos.x + 0.5) + (pixelPos.y + 0.5) * (pixelPos.y + 0.5)) + time);

            gl_FragColor = vec4(sin(v * 3.14),
                                cos(v * 3.14 + 2.0 * 3.14 / 3.0),
                                sin(v * 3.14 + 4.0 * 3.14 / 3.0),
                                1.0);
        }
    }
    else
    {
        gl_FragColor = nextSlide;
    }

}
