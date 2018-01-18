precision mediump float;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

attribute vec3 inPosition;

void main()
{
    gl_Position = uProjection * uView * uModel * vec4(inPosition, 1.0);
}
