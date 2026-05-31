import {CGFobject} from '../../lib/CGF.js';

export class MyStem extends CGFobject {
    constructor(scene, slices = 8, stacks = 4) {
        super(scene);
        this.slices = slices;
        this.stacks = stacks;
        this.initBuffers();
    }

    initBuffers() {
        // S-curve spine: normalized height 0→1.
        // Top returns to x=0 so the stem tip aligns exactly with the bloom centre.
        const yLevels = [0, 0.28, 0.52, 0.76, 1.0];
        const xCurve  = [0, 0.008, 0.018, 0.012, 0.000];
        const radii   = [0.020, 0.017, 0.014, 0.011, 0.009];

        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        const N = yLevels.length;
        const S = this.slices;

        // For each spine level, emit a ring of vertices
        for (let i = 0; i < N; i++) {
            const cx = xCurve[i];
            const cy = yLevels[i];
            const r  = radii[i];

            // Approximate outward normal tilt from spine tangent
            let tx = 0, ty = 1;
            if (i < N - 1) {
                tx = xCurve[i+1] - xCurve[i];
                ty = yLevels[i+1] - yLevels[i];
            } else {
                tx = xCurve[i] - xCurve[i-1];
                ty = yLevels[i] - yLevels[i-1];
            }
            const tlen = Math.sqrt(tx*tx + ty*ty);
            tx /= tlen; ty /= tlen;

            for (let j = 0; j <= S; j++) {
                const angle = (j / S) * 2 * Math.PI;
                const cosA  = Math.cos(angle);
                const sinA  = Math.sin(angle);

                // Vertex position: ring around the spine point
                this.vertices.push(
                    cx + r * cosA,
                    cy + r * (-tx),   // slight lean correction on y
                    r * sinA
                );

                // Outward normal (simplified cylindrical, not corrected for lean)
                this.normals.push(cosA, 0, sinA);

                this.texCoords.push(j / S, cy);
            }
        }

        // Quad indices between consecutive rings
        for (let i = 0; i < N - 1; i++) {
            for (let j = 0; j < S; j++) {
                const a = i * (S + 1) + j;
                const b = a + 1;
                const c = a + (S + 1);
                const d = c + 1;
                this.indices.push(a, c, b,  b, c, d);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
