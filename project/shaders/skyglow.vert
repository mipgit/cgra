#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

out vec2 vTexCoord;
out vec3 vPosition;

void main() {
    vTexCoord = aTextureCoord;
    vPosition = aVertexPosition;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}