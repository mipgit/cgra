// Flower shader — one batched mesh for stem/leaf/petal/bloom.
// aVertexNormal carries (baseX, heightRatio, baseZ) for wind sway, NOT a surface normal.
// aTextureCoord is (-1,-1) for non-textured parts.

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;
attribute vec3 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float uTime;
uniform float uWindStrength;
uniform float uWindSpeed;

varying vec3 vColor;
varying vec2 vTexCoord;

void main() {
    vec3 pos = aVertexPosition;

    float baseX = aVertexNormal.x;
    float h     = aVertexNormal.y;
    float baseZ = aVertexNormal.z;

    float phase = baseX * 0.3 + baseZ * 0.2;
    pos.x += sin(uTime * uWindSpeed       + phase)       * uWindStrength       * h;
    pos.z += cos(uTime * uWindSpeed * 0.7 + phase + 1.0) * uWindStrength * 0.4 * h;

    vColor    = aVertexColor;
    vTexCoord = aTextureCoord;
    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
