#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform sampler2D uSampler2; // heightmap on texture unit 1
uniform float uHeightScale; // terrain height multiplier

out vec2 vTexCoord;

void main() {
    vec3 hm = texture(uSampler2, aTextureCoord).rgb;
    float h = dot(hm, vec3(0.299, 0.587, 0.114));
    float centeredHeight = h - 0.5;
    vec3 displacedPos = aVertexPosition + aVertexNormal * (centeredHeight * uHeightScale);
    gl_Position = uPMatrix * uMVMatrix * vec4(displacedPos, 1.0);
    vTexCoord = aTextureCoord;
}