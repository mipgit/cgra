import {CGFobject} from '../../lib/CGF.js';

export class MyLeaf extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        const T = 0.016; // half-thickness — total leaf depth = 2T

        // [y, halfWidth, foldAngle] — fold peaks at widest point
        const rowDef = [
            [0.00, 0.000, 0.00],
            [0.06, 0.040, 0.12],
            [0.13, 0.090, 0.26],
            [0.20, 0.125, 0.38],
            [0.28, 0.140, 0.45],
            [0.35, 0.130, 0.43],
            [0.40, 0.090, 0.36],
            [0.44, 0.050, 0.22],
            [0.46, 0.000, 0.00],
        ];
        const N = rowDef.length;

        // ── helpers ───────────────────────────────────────────────────
        const sub  = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
        const add  = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
        const scl  = (v, s) => [v[0]*s, v[1]*s, v[2]*s];
        const crs  = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
        const nrm  = (v) => { const l = Math.sqrt(v[0]**2+v[1]**2+v[2]**2); return l>1e-9 ? scl(v,1/l) : [0,0,1]; };

        // ── center-surface positions ──────────────────────────────────
        // cPos[r][0] = left, cPos[r][1] = right
        const cPos = rowDef.map(([y, w, f]) => {
            const cf = Math.cos(f), sf = Math.sin(f);
            return [[-w*cf, y, w*sf], [w*cf, y, w*sf]];
        });

        // ── vertex normals via cross product ─────────────────────────
        // across = right−left, along = pos[r+1]−pos[r−1]
        const sNorm = [];          // surface normals [r][s]
        for (let r = 0; r < N; r++) {
            const across = sub(cPos[r][1], cPos[r][0]);
            const rp = Math.max(0, r-1), rn = Math.min(N-1, r+1);
            sNorm.push([
                nrm(crs(across, sub(cPos[rn][0], cPos[rp][0]))),
                nrm(crs(across, sub(cPos[rn][1], cPos[rp][1]))),
            ]);
        }

        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        const push = (pos, n, u, v) => {
            this.vertices.push(...pos);
            this.normals.push(...n);
            this.texCoords.push(u, 1 - v / 0.46);
        };

        // ── vertex blocks ─────────────────────────────────────────────
        // Block F (front):  indices 0 … 2N-1     layout: L0,R0,L1,R1,…
        // Block B (back):   indices 2N … 4N-1
        // Block EL (left edge):  4N … 6N-1       layout: fL,bL per row
        // Block ER (right edge): 6N … 8N-1       layout: fR,bR per row

        const BF = 0, BB = 2*N, BEL = 4*N, BER = 6*N;

        for (let r = 0; r < N; r++) {
            const y = rowDef[r][0];
            for (let s = 0; s < 2; s++) {
                const n = sNorm[r][s];
                // front
                push(add(cPos[r][s], scl(n,  T)), n, s, y);
                // (right vertex of left loop written in next iteration — handled below)
            }
        }
        // Actually let me redo this loop cleanly:
        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];

        // Front block (BF)
        for (let r = 0; r < N; r++) {
            const y = rowDef[r][0];
            for (let s = 0; s < 2; s++) {
                const n = sNorm[r][s];
                push(add(cPos[r][s], scl(n,  T)), n, s, y);
            }
        }
        // Back block (BB)
        for (let r = 0; r < N; r++) {
            const y = rowDef[r][0];
            for (let s = 0; s < 2; s++) {
                const n = sNorm[r][s];
                push(add(cPos[r][s], scl(n, -T)), [-n[0],-n[1],-n[2]], s, y);
            }
        }
        // Left-edge block (BEL) — outward normal = (−cf, 0, sf)
        for (let r = 0; r < N; r++) {
            const [y, ,fold] = rowDef[r];
            const cf = Math.cos(fold), sf = Math.sin(fold);
            const en = [-cf, 0, sf];
            const n  = sNorm[r][0];
            push(add(cPos[r][0], scl(n,  T)), en, 0, y); // front-left
            push(add(cPos[r][0], scl(n, -T)), en, 0, y); // back-left
        }
        // Right-edge block (BER) — outward normal = (+cf, 0, sf)
        for (let r = 0; r < N; r++) {
            const [y, ,fold] = rowDef[r];
            const cf = Math.cos(fold), sf = Math.sin(fold);
            const en = [cf, 0, sf];
            const n  = sNorm[r][1];
            push(add(cPos[r][1], scl(n,  T)), en, 1, y); // front-right
            push(add(cPos[r][1], scl(n, -T)), en, 1, y); // back-right
        }

        this.indices = [];

        // Front face — CCW from front
        for (let r = 0; r < N-1; r++) {
            const L0=BF+2*r, R0=BF+2*r+1, L1=BF+2*(r+1), R1=BF+2*(r+1)+1;
            this.indices.push(L0,R0,L1, R0,R1,L1);
        }
        // Back face — reversed winding
        for (let r = 0; r < N-1; r++) {
            const L0=BB+2*r, R0=BB+2*r+1, L1=BB+2*(r+1), R1=BB+2*(r+1)+1;
            this.indices.push(L0,L1,R0, R0,L1,R1);
        }
        // Left edge — outward normal = (−cf, 0, sf)
        // Correct winding verified by cross-product: (bL,fL,bL+1) and (fL,fL+1,bL+1)
        for (let r = 0; r < N-1; r++) {
            const fL0=BEL+2*r, bL0=BEL+2*r+1, fL1=BEL+2*(r+1), bL1=BEL+2*(r+1)+1;
            this.indices.push(bL0,fL0,bL1, fL0,fL1,bL1);
        }
        // Right edge — outward normal = (+cf, 0, sf)
        for (let r = 0; r < N-1; r++) {
            const fR0=BER+2*r, bR0=BER+2*r+1, fR1=BER+2*(r+1), bR1=BER+2*(r+1)+1;
            this.indices.push(fR0,bR0,fR1, bR0,bR1,fR1);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
