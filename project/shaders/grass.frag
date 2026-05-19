precision mediump float;

uniform vec4 uColor;

varying float vHeight;
varying vec2 vBladePos;

void main() {
    float h = fract(sin(dot(vBladePos, vec2(127.1, 311.7))) * 43758.5453);
    vec3 col = uColor.rgb + vec3(h * 0.06 - 0.01, h * 0.12 - 0.02, -0.03);
    float brightness = 0.45 + 0.55 * vHeight;
    gl_FragColor = vec4(col * brightness, 1.0);
}
