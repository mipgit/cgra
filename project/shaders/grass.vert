attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uTime;
uniform float uWindStrength;
uniform float uWindSpeed;

varying float vHeight;
varying vec2 vBladePos;

void main() {
    vec3 pos = aVertexPosition;

    // aVertexNormal.y = normalized local blade height (0=base, 1=tip)
    // CGF always binds normals, unlike texcoords which require an active texture
    float h = aVertexNormal.y;
    float tipFactor = h * h;

    float phase = pos.x * 0.3 + pos.z * 0.2;
    pos.x += sin(uTime * uWindSpeed + phase) * uWindStrength * tipFactor;
    pos.z += cos(uTime * uWindSpeed * 0.7 + phase + 1.0) * uWindStrength * 0.4 * tipFactor;

    vHeight   = h;
    vBladePos = vec2(aVertexPosition.x, aVertexPosition.z);

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
