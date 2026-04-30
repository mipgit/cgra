#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec3 vPosition;

uniform sampler2D uSampler;
uniform vec3 uSunDir;

out vec4 fragColor;

void main() {
    vec3 sky = texture(uSampler, vTexCoord).rgb;

    vec3 dir = normalize(vPosition);
    float sunAmount = max(dot(dir, normalize(uSunDir)), 0.0);

    float glow = pow(sunAmount, 4096.0);
    float halo = pow(sunAmount, 8192.0);

    vec3 sunColor = vec3(1.0, 0.95, 0.75);

    vec3 finalColor = sky;
    finalColor += sunColor * halo * 0.35;
    finalColor += sunColor * glow * 1.5;

    fragColor = vec4(finalColor, 1.0);
}