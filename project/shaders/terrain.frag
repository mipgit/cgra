#version 300 es
precision highp float;

in vec2 vTexCoord;
uniform sampler2D uSampler; // base terrain texture (from appearance)
uniform sampler2D uSampler2; // heightmap
uniform vec3 uSunDir; // sun direction in terrain local coordinates
uniform float uHeightScale;
uniform vec2 uTexelSize;

out vec4 fragColor;

void main() {
    vec3 base = texture(uSampler, vTexCoord).rgb;

    vec2 texel = max(uTexelSize, vec2(1.0 / 1024.0));

    vec3 hmL = texture(uSampler2, vTexCoord - vec2(texel.x, 0.0)).rgb;
    vec3 hmR = texture(uSampler2, vTexCoord + vec2(texel.x, 0.0)).rgb;
    vec3 hmD = texture(uSampler2, vTexCoord - vec2(0.0, texel.y)).rgb;
    vec3 hmU = texture(uSampler2, vTexCoord + vec2(0.0, texel.y)).rgb;

    float hL = dot(hmL, vec3(0.299, 0.587, 0.114));
    float hR = dot(hmR, vec3(0.299, 0.587, 0.114));
    float hD = dot(hmD, vec3(0.299, 0.587, 0.114));
    float hU = dot(hmU, vec3(0.299, 0.587, 0.114));

    float dHx = (hR - hL) * uHeightScale;
    float dHy = (hU - hD) * uHeightScale;

    vec3 normal = normalize(vec3(-dHx, -dHy, 1.0));
    vec3 lightDir = normalize(uSunDir);

    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.60;
    float shade = ambient + diffuse * 0.40;
    shade = clamp(shade, 0.65, 1.05);

    fragColor = vec4(base * shade, 1.0);
}