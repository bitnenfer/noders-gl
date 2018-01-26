precision mediump float;

uniform sampler2D uRT;
uniform vec2 uResolution;
uniform int uPassIndex;
uniform int uPassCount;

const mat3 kernel = mat3(
    +0.0, +0.0, +0.0,
    +0.0, +1.0, +0.0,
    +0.0, +0.0, +0.0
);

vec2 offsets[9];

void main()
{
	const float sampleSize = 1.0; 
    vec2 uv = gl_FragCoord.xy / uResolution;
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
        vec3 s0 = texture2D(uRT, uv + offsets[index * 3 + 0]).rgb;
        vec3 s1 = texture2D(uRT, uv + offsets[index * 3 + 1]).rgb;
        vec3 s2 = texture2D(uRT, uv + offsets[index * 3 + 2]).rgb;
        vec3 kernelRow = kernel[index];
        vec3 rowValue = s0 * kernelRow[0] + s1 * kernelRow[1] + s2 * kernelRow[2];

        accum += rowValue;
    }

    gl_FragColor = vec4(accum, 1.0);
}
