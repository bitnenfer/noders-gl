precision mediump float;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat4 uInvModelView;

attribute vec3 inPosition;
attribute vec2 inTexCoord;
attribute vec3 inNormal;

varying vec3 outNormal;
varying vec2 outTexCoord;

void main()
{
    gl_Position = uProjection * uView * uModel * vec4(inPosition, 1.0);

    outTexCoord = inTexCoord;
    outNormal = vec3(uInvModelView * vec4(inNormal, 0.0));
}
