precision mediump float;
uniform sampler2D uTexture;
uniform int uUseTexture;
varying vec4 vColor;

void main() {
    if (uUseTexture == 1) {
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        gl_FragColor = texColor * vColor;
    } else {
        gl_FragColor = vColor;
    }
}