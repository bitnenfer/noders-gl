precision mediump float;

uniform sampler2D uRT;
uniform sampler2D uFFT;
uniform sampler2D uNoise;
uniform float uTime;
uniform vec2 uResolution;
uniform int uPassIndex;
uniform int uPassCount;
uniform float uMediaTime;

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
    float sampleSize = sin(texture2D(uFFT, vec2(0.0))).x * 40.0; 
    float fft = sin(texture2D(uFFT, vec2(0.0))).x;
    vec2 uv = gl_FragCoord.xy / uResolution;
    float wave = texture2D(uFFT, vec2(0.2 + uv.x * 0.4)).x;
    float pw = 0.001;
    float speed = 1.0;
    float noisePow = 2.0;
    float noiseScale = 2.0;
    vec2 range = vec2(0.497, 0.5) - 0.2;

    if (uMediaTime < 26.5 || uMediaTime > 123.0) 
    {
        sampleSize = 0.0;
        pw = 10.0;
        speed *= 0.1;
        noisePow = 0.2;
        noiseScale = 1.0;
        range.x -= cos(sin(uMediaTime) + wave * 20.0) * length(0.5 - uv.x) * 0.05;
        range.y += cos(sin(uMediaTime) + wave * 20.0) * length(0.5 - uv.x) * 0.05;
    }
    else
    {
        range *= 0.0;
        if ((uMediaTime > 53.5 && uMediaTime < 81.5)||
            (uMediaTime > 94.5 && uMediaTime < 122.5))
        {
            uv.x += 0.1 + (cos(sin(sampleSize) * 0.8) * 0.1) - 0.2;
        }
        noiseScale = 1.0 + 0.5 * abs(sin(fft));
    }

    vec4 noiseTex = texture2D(uNoise, noiseScale * uv + vec2(0.0, -uMediaTime * speed));

    if (uPassIndex < 1)
    {
        if (uv.y > range.x && uv.y < range.y)
        {
            gl_FragColor = vec4(0.2, 0.0, 1.0, 1.0) * (0.2 - pow(distance(uv, vec2(0.5)), 2.0));
        }
        gl_FragColor += vec4(getColor(uRT, uv, edges, sampleSize), 1.0);
    }
    else
    {
        gl_FragColor = vec4(getColor(uRT, uv, sharpen, sin(uMediaTime + wave)), 1.0);
        return;
    }

    if (length(uv - 0.5) > 0.40 - max(abs(sin(fft)) * 0.25, 0.05) &&
        length(uv - 0.5) < 0.2 + abs(sin(wave + fft)) * 0.22)
    {

         gl_FragColor +=  vec4(
            0.8 * max(sin(uv.y / uv.x * wave * 20.0 + sampleSize / 10.0), 0.5), 
            0.2 * max(cos(uv.y - uv.x * wave * 10.0 + sampleSize / 5.0), 0.5), 
            1.0 * max(sin(uv.y * uv.x * wave * 20.0 + -sampleSize / 2.0), 0.5),
            1.0        
        );
    }
    else if (length(uv - vec2(0.5)) < 0.23 - min(abs(sin(fft)) * 0.3, 0.1))
    {
        gl_FragColor += pow(noiseTex.x, noisePow) * vec4(
           0.5 *uv.y + 0.1 * cos(sin(wave * 10.5)),
            wave,
            0.3 * cos(wave * 0.1),
            1.0
        ) * 2.0 * pow(1.0 - distance(uv, vec2(0.5)), pw);
    }
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