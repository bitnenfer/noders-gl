precision mediump float;

uniform sampler2D uRT;
uniform vec2 uResolution;

void main()
{
	vec2 uv = gl_FragCoord.xy / uResolution;
	gl_FragColor = texture2D(uRT, uv);
}
