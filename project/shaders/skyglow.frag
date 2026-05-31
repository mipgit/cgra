#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec3 vPosition;

uniform sampler2D uSampler;
uniform vec3 uSunDir;

// Cloud uniform parameters
uniform float uTime;
uniform float uCloudAlpha;
uniform float uCloudScale;
uniform float uCloudDensityCutoff;

out vec4 fragColor;

// Simple pseudo-random hash
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Value Noise - Smooth and simple
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f); // Smooth interpolation
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    // 1. Base sky color from texture
    vec3 sky = texture(uSampler, vTexCoord).rgb;
    vec3 finalColor = sky;

    // 2. Compute sun contribution parameters
    vec3 dir = normalize(vPosition);
    float sunAmount = max(dot(dir, normalize(uSunDir)), 0.0);

    float glow = pow(sunAmount, 4096.0);
    float halo = pow(sunAmount, 8192.0);

    vec3 sunColor = vec3(1.0, 0.95, 0.75);

    // 3. Simple animated cloud layer
    if (uCloudAlpha > 0.0 && vPosition.y > -0.1) {
        // Planar mapping to project clouds flat in the sky
        float yVal = max(vPosition.y + 0.1, 0.05);
        vec2 uv = (vPosition.xz / yVal) * uCloudScale + vec2(uTime * 0.015, uTime * 0.005);
        
        // Single cheap call to noise (highly optimized)
        float density = noise(uv * 3.0);
        
        // Horizon fade and smooth cloud edges
        float horizonFade = smoothstep(-0.1, 0.3, vPosition.y);
        float cloudCutoff = smoothstep(uCloudDensityCutoff, uCloudDensityCutoff + 0.35, density) * horizonFade;
        
        if (cloudCutoff > 0.0) {
            // Soft light gray cloud color
            vec3 cloudColor = vec3(0.96, 0.96, 0.98);
            finalColor = mix(finalColor, cloudColor, cloudCutoff * uCloudAlpha);
        }
    }

    // 4. Add sun glow and halo on top of the clouds
    finalColor += sunColor * halo * 0.35;
    finalColor += sunColor * glow * 1.5;

    fragColor = vec4(finalColor, 1.0);
}