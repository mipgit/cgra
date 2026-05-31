#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vNormal;
varying vec3 vLocalPos;

float hash(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec3(1.0, 0.0, 0.0));
    float c = hash(i + vec3(0.0, 1.0, 0.0));
    float d = hash(i + vec3(1.0, 1.0, 0.0));
    float e = hash(i + vec3(0.0, 0.0, 1.0));
    float g = hash(i + vec3(1.0, 0.0, 1.0));
    float h = hash(i + vec3(0.0, 1.0, 1.0));
    float k = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(
        mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
        mix(mix(e, g, f.x), mix(h, k, f.x), f.y),
        f.z
    );
}

void main() {
    // Bay horse: warm reddish-brown body, near-black mane/tail/legs.
    // Fits the earthy farm palette (wood wagon, hay bales, dirt path).
    vec3 bodyColor   = vec3(0.58, 0.27, 0.09);
    vec3 pointsColor = vec3(0.07, 0.04, 0.02);

    // Natural coat texture — subtle variation within the same hue family.
    // Two frequencies blend for a slightly organic surface; no paint patches.
    float n1 = vnoise(vLocalPos * 2.5);
    float n2 = vnoise(vLocalPos * 7.0);
    vec3 coat = bodyColor * (0.88 + (n1 * 0.6 + n2 * 0.4) * 0.24);

    // Mane: top of neck and back, near the spine (z ≈ 0)
    float maneY = smoothstep(2.1, 2.7, vLocalPos.y);
    float maneZ = 1.0 - smoothstep(0.0, 0.38, abs(vLocalPos.z));
    coat = mix(coat, pointsColor, maneY * maneZ * 0.90);

    // Forelock: top of head (forward, high up)
    float forelockX = smoothstep(1.5, 2.3, vLocalPos.x);
    float forelockY = smoothstep(1.8, 2.5, vLocalPos.y);
    coat = mix(coat, pointsColor, forelockX * forelockY * 0.78);

    // Tail: rear of horse (negative x), mid-height flowing downward
    float tailX = 1.0 - smoothstep(-2.0, -1.1, vLocalPos.x);
    float tailY = smoothstep(0.6, 1.5, vLocalPos.y);
    coat = mix(coat, pointsColor, tailX * tailY * 0.84);

    // Dark legs: bay trait — near-black from hooves up to the knee (~y=0.6)
    // Narrow z mask keeps this on the legs rather than the belly underside.
    float legY = 1.0 - smoothstep(0.0, 0.60, vLocalPos.y);
    float legZ = 1.0 - smoothstep(0.20, 0.52, abs(vLocalPos.z));
    coat = mix(coat, pointsColor, legY * legZ * 0.76);

    // Lighting matching the scene (terrain: ambient 0.35, diffuse 0.75, clamp 0.30–1.0)
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vec3(0.40, 0.85, 0.35));
    float ndl   = max(dot(N, L), 0.0);
    float shade = clamp(0.35 + ndl * 0.75, 0.30, 1.0);

    gl_FragColor = vec4(coat * shade, 1.0);
}
