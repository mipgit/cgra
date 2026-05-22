precision mediump float;

varying vec3 vColor;
varying vec2 vTexCoord;

// vTexCoord dispatch:
//   stem / leaf  →  (-1, -1)         flat color
//   petal        →  x ≈ 0..1, y in [0,1]
//   bloom centre →  (10 + xLocal, 10 + zLocal), where xLocal,zLocal ∈ [-1,1]

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth value noise (bilinearly interpolated hash) — organic, not blocky
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Layered noise (fBm) for soft, multi-scale mottling
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * vnoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    // ── Stem / leaf — flat baked color ────────────────────────────────
    if (vTexCoord.x < 0.0) {
        gl_FragColor = vec4(vColor, 1.0);
        return;
    }

    // ── Bloom centre — procedural disc-floret pattern ─────────────────
    if (vTexCoord.x > 5.0) {
        vec2 local = vTexCoord - vec2(10.0, 10.0);   // [-1, 1]
        float r = length(local);

        // Golden-angle phyllotaxis — static, never looks like it's spinning
        float c = 0.085;
        float nEst = (r * r) / (c * c);
        float nBase = floor(nEst);
        float minDist = 1.0;
        for (int i = -12; i <= 12; i++) {
            float n = nBase + float(i);
            n = max(n, 0.0);
            float sr = c * sqrt(n);
            float theta = fract(n * 0.3819660113) * 6.28318530718;
            vec2 seed = sr * vec2(cos(theta), sin(theta));
            float d = length(local - seed);
            minDist = min(minDist, d);
        }

        // Florets shrink slightly toward the rim
        float size = mix(1.0, 0.75, smoothstep(0.0, 1.0, r));
        float floret = smoothstep(0.10 * size, 0.02 * size, minDist);

        // Darker disc base, bright floret tips
        vec3 baseCol = vColor * 0.55;
        vec3 tipCol  = vColor * 1.25;
        vec3 col = mix(baseCol, tipCol, floret);

        // Soft organic noise over the disc
        col *= 0.92 + 0.12 * fbm(local * 5.0);

        // Outer rim darkens slightly — disc edge against petals
        col *= mix(1.0, 0.82, smoothstep(0.85, 1.0, r));

        gl_FragColor = vec4(col, 1.0);
        return;
    }

    // ── Petal — procedural color, veins, mottling ─────────────────────
    float lateral = vTexCoord.x;
    float radial  = clamp(1.0 - vTexCoord.y, 0.0, 1.0);   // 0 = base, 1 = tip
    float fromMid = clamp(abs(lateral - 0.5) * 2.0, 0.0, 1.0);

    // Base → tip gradient via multiplier-on-mix, so the shading factor is
    // ≤1 and pale species don't clip toward pure white
    vec3 col = vColor * mix(1.05, 0.86, radial);

    // Rim darkening
    col *= mix(1.0, 0.86, smoothstep(0.65, 1.0, fromMid));

    // Radial veins fanning from the petal base (0.5, 1.0)
    vec2 fromBase = vec2(lateral - 0.5, 1.0 - vTexCoord.y);
    float distFromBase = length(fromBase);
    float angleFromBase = atan(fromBase.x, fromBase.y);   // 0 = straight up
    float veinPattern = abs(sin(angleFromBase * 7.0));
    float veins = pow(veinPattern, 24.0);
    // veins converge at base (fade there) and dissolve near the tip
    veins *= smoothstep(0.06, 0.30, distFromBase);
    veins *= 1.0 - smoothstep(0.80, 1.05, distFromBase);
    col += vec3(0.06, 0.045, 0.025) * veins;

    // Organic mottling — fBm, not stripes
    float n = fbm(vTexCoord * 4.0);
    col *= 0.94 + 0.10 * n;

    gl_FragColor = vec4(col, 1.0);
}
