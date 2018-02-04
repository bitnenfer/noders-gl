precision mediump float;

attribute vec3 inPosition;
attribute vec2 inTexCoord;

varying vec2 outTexCoord;

void main()
{
    gl_Position = vec4(inPosition, 1.0);
    
    outTexCoord = inTexCoord;
}
