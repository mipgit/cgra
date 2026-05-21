precision mediump float;

uniform sampler2D uPetalTex;

varying vec3 vColor;
varying vec2 vTexCoord;

void main() {
    // Petals carry valid UVs and sample the texture; other parts use sentinel (-1,-1).
    if (vTexCoord.x >= 0.0) {
        vec3 tex = texture2D(uPetalTex, vTexCoord).rgb;
        gl_FragColor = vec4(vColor * tex, 1.0);
    } else {
        gl_FragColor = vec4(vColor, 1.0);
    }
}
