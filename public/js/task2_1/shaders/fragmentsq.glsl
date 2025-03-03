precision mediump float;
varying vec4 vColor;
varying vec4 vPosition;

void main() {
    float stripeWidth = 0.05;

    vec4 color;
    if (mod(vPosition.x, 2.0 * stripeWidth) < stripeWidth) {
        color = vColor;
    } else {
        color = vec4(1, 1, 1, 1);
    }

    gl_FragColor = color;
}