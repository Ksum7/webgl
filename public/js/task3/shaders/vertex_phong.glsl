attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
varying vec3 vPositionEye;
varying vec3 vNormalEye;
varying vec4 vColor;

void main() {
    vPositionEye = (uModelViewMatrix * aPosition).xyz;
    vNormalEye = normalize(uNormalMatrix * aNormal);
    vColor = aColor;
    gl_Position = uProjectionMatrix * vec4(vPositionEye, 1.0);
}