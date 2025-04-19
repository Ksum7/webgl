precision mediump float;
attribute vec3 aPosition;
attribute vec4 aColor;
attribute float aSize;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
varying vec4 vColor;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
    gl_PointSize = aSize; 
    vColor = aColor;
}