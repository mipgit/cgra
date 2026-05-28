#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 uBaseColor;
uniform vec3 uHiColor;

varying vec2 vTexCoord;
varying float vPulse;

void main() {
    // Pulse between base + hi colour. Use as emissive — no lighting needed,
    // arrow should pop above the grass regardless of sun angle.
    vec3 col = mix(uBaseColor, uHiColor, vPulse);
    gl_FragColor = vec4(col, 1.0);
}
