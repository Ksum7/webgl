attribute vec4 aPosition;
attribute vec4 aColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec4 vColor;
varying vec4 vPosition;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vPosition = aPosition;
    vColor = aColor;
}