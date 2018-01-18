precision mediump float;

uniform sampler2D uSampler;

varying vec2 outTexCoord;

void main()
{
    gl_FragColor = texture2D(uSampler, outTexCoord);
}
