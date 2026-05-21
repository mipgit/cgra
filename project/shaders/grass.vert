attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uTime;
uniform float uWindStrength;
uniform float uWindSpeed;

uniform sampler2D uHeightmap;
uniform float uHeightScale;

varying float vHeight;
varying vec2 vBladePos;

void main() {
    vec3 pos = aVertexPosition;

    // aVertexNormal.y = normalized blade height (0 at base, 1 at tip)
    float h = aVertexNormal.y;
    float tipFactor = h * h;

    float phase = pos.x * 0.3 + pos.z * 0.2;
    pos.x += sin(uTime * uWindSpeed + phase) * uWindStrength * tipFactor;
    pos.z += cos(uTime * uWindSpeed * 0.7 + phase + 1.0) * uWindStrength * 0.4 * tipFactor;

    // Lift the blade onto the heightmap-displaced terrain
    vec2 uv = vec2((pos.x + 100.0) / 200.0, (pos.z + 100.0) / 200.0);
    float terrainH = dot(texture2D(uHeightmap, uv).rgb, vec3(0.299, 0.587, 0.114));
    pos.y += (terrainH - 0.5) * uHeightScale;

    vHeight   = h;
    vBladePos = vec2(aVertexPosition.x, aVertexPosition.z);

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
