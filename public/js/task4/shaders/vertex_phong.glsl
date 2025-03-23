attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
attribute vec2 aTexCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform vec3 uLightPositionEye;
uniform float uShininess;
uniform bool uUseSpecular;
uniform mediump int uLightingModel;
varying vec3 vPositionEye;
varying vec3 vNormalEye;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    vPositionEye = (uModelViewMatrix * aPosition).xyz;
    vNormalEye = normalize(uNormalMatrix * aNormal);
    vColor = aColor;
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * vec4(vPositionEye, 1.0);
}