#version 300 es
precision highp float;

in vec4 aPosition;
in vec3 aNormal;
in vec4 aColor;
in vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

out vec3 vPositionEye;
out vec3 vNormalEye;
out vec4 vColor;
out vec2 vTexCoord;

void main() {
    vPositionEye = (uModelViewMatrix * aPosition).xyz;
    vNormalEye = normalize(uNormalMatrix * aNormal);
    vColor = aColor;
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * vec4(vPositionEye, 1.0);
}