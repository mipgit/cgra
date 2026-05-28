#version 300 es
precision highp float;

in vec3 vColor;
in vec2 vTexCoord;

out vec4 fragColor;

void main() {
    fragColor = vec4(vColor, 1.0);
}
