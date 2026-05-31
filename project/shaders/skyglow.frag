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

// Simple pseudo-random hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Value Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Cubic Hermite interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Fractal Brownian Motion (FBM) - sums octaves of noise
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial alignment artifacts
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
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

    // 3. Shader-based animated cloud layer (render only on upper dome)
    if (uCloudAlpha > 0.0 && vPosition.y > -0.1) {
        // Planar mapping: project sphere coordinate onto flat horizontal plane at y = 1.0
        float yVal = max(vPosition.y + 0.1, 0.05);
        vec2 cloudUV = (vPosition.xz / yVal) * uCloudScale;
        
        // Wind speed over time
        vec2 windOffset = vec2(uTime * 0.02, uTime * 0.007);
        vec2 uv = cloudUV + windOffset;
        
        // Compute base FBM cloud density
        float density = fbm(uv);
        
        // Second higher-frequency noise layer for detailing
        float densityDetail = fbm(uv * 2.3 - windOffset * 0.4);
        float combinedDensity = mix(density, densityDetail, 0.25);
        
        // Fade out smoothly towards the horizon
        float horizonFade = smoothstep(-0.1, 0.3, vPosition.y);
        combinedDensity *= horizonFade;
        
        // Thresholding to form distinct cloud structures (wider transition for soft, wispy clouds)
        float cloudCutoff = smoothstep(uCloudDensityCutoff, uCloudDensityCutoff + 0.35, combinedDensity);

        
        if (cloudCutoff > 0.0) {
            // AAA lighting trick: offset UV towards the sun to approximate volumetric light transmittance
            vec2 lightOffset = normalize(uSunDir.xz) * 0.07;
            float densityLight = fbm(uv - lightOffset);
            float shadow = smoothstep(0.0, 1.0, combinedDensity - densityLight);
            
            // Cloud colors (ambient base vs shaded areas)
            vec3 baseCloudColor = vec3(0.96, 0.96, 0.98);
            vec3 shadedCloudColor = vec3(0.68, 0.70, 0.76);
            
            // Interpolate cloud base coloring with volumetric shadow estimation
            vec3 cloudCol = mix(shadedCloudColor, baseCloudColor, 1.0 - shadow * 0.55);
            
            // Backlit / rim lighting effect when looking near the sun
            float sunRim = pow(sunAmount, 10.0);
            cloudCol += sunColor * sunRim * 0.35 * (1.0 - shadow);
            
            // Mix clouds onto base sky color
            finalColor = mix(finalColor, cloudCol, cloudCutoff * uCloudAlpha);
        }
    }

    // 4. Add sun glow and halo on top of everything (shining through/around clouds)
    finalColor += sunColor * halo * 0.35;
    finalColor += sunColor * glow * 1.5;

    fragColor = vec4(finalColor, 1.0);
}