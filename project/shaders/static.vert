#version 300 es
precision highp float;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;
in vec3 aVertexColor;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform sampler2D uHeightmap;
uniform float uHeightScale;

out vec3 vColor;
out vec2 vTexCoord;

void main() {
    vec3 pos = aVertexPosition;

    float baseX = aVertexNormal.x;
    float baseZ = aVertexNormal.z;

    vec2 uv = vec2((baseX + 100.0) / 200.0, (baseZ + 100.0) / 200.0);
    float terrainH = dot(texture(uHeightmap, uv).rgb, vec3(0.299, 0.587, 0.114));
    pos.y += (terrainH - 0.5) * uHeightScale;

    vColor = aVertexColor;
    vTexCoord = aTextureCoord;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
