attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float uTime;
uniform float uPhase;     // per-instance offset so bales don't sync
uniform float uBobAmp;
uniform float uBobOmega;

varying vec2 vTexCoord;
varying float vPulse;

void main() {
    vec3 pos = aVertexPosition;

    // Whole-mesh bob along Y
    float bob = sin(uTime * uBobOmega + uPhase) * uBobAmp;
    pos.y += bob;

    // Pass a 0..1 pulse signal to the fragment shader
    vPulse = 0.5 + 0.5 * sin(uTime * uBobOmega + uPhase);

    vTexCoord = aTextureCoord;
    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
