#version 300 es
precision highp float;

in vec2 vTexCoord;
uniform sampler2D uSampler; // base terrain texture (from appearance)
uniform sampler2D uSampler2; // heightmap
uniform sampler2D uPathTexture; // path texture
uniform vec3 uSunDir; // sun direction in terrain local coordinates
uniform float uHeightScale;
uniform vec2 uTexelSize;
uniform float uPathWidth;
uniform float uPathWaveAmplitude;
uniform float uPathWaveFrequency;

out vec4 fragColor;

void main() {
    // Tile the grass texture much finer than 1:1 across the plane so it reads as grass
    // on the distant slopes instead of one washed-out smear. Heightmap and path keep
    // using the original UV below.
    vec3 base = texture(uSampler, vTexCoord * 20.0).rgb;
    vec3 pathTexel = texture(uPathTexture, vTexCoord * 20.0).rgb;

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

    float slopeBoost = 2.0;
    vec3 normal = normalize(vec3(-dHx * slopeBoost, -dHy * slopeBoost, 1.0));
    vec3 lightDir = normalize(uSunDir);

    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.35;
    float shade = ambient + diffuse * 0.75;
    shade = clamp(shade, 0.30, 1.0);

    // Create dirt path with texture
    float pathCenterY = 0.5 + sin(vTexCoord.x * uPathWaveFrequency) * uPathWaveAmplitude;
    float distFromPath = abs(vTexCoord.y - pathCenterY);
    float pathMask = step(distFromPath, uPathWidth);
    
    vec3 finalColor = mix(base, pathTexel, pathMask);

    fragColor = vec4(finalColor * shade, 1.0);
}