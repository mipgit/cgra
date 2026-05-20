import {CGFobject} from '../lib/CGF.js';

export class MyPetal extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        const T = 0.013; // half-thickness

        // Shape matching FBX proportions — wider at mid, gently cupped in Z
        const rawV = [
             0,     0,    0,     // 0  base
            -0.10,  0.07, 0.01, // 1  lower left
             0.10,  0.07, 0.01, // 2  lower right
            -0.24,  0.22, 0.04, // 3  mid-low left
             0.24,  0.22, 0.04, // 4  mid-low right
            -0.28,  0.42, 0.07, // 5  widest left
             0.28,  0.42, 0.07, // 6  widest right
            -0.18,  0.62, 0.04, // 7  upper left
             0.18,  0.62, 0.04, // 8  upper right
             0,     0.78, 0.01, // 9  tip
        ];
        const rawIdx = [
            0, 2, 1,
            1, 2, 4,  1, 4, 3,
            3, 4, 6,  3, 6, 5,
            5, 6, 8,  5, 8, 7,
            7, 8, 9,
        ];
        const rawTex = [
            0.5,1.0, 0.2,0.93, 0.8,0.93, 0.04,0.73, 0.96,0.73,
            0.0,0.48, 1.0,0.48, 0.18,0.24, 0.82,0.24, 0.5,0.0,
        ];

        const NV = 10; // rawV.length / 3

        // ── smooth surface normals via face-normal accumulation ──────
        const acc = Array.from({length: NV}, () => [0,0,0]);
        for (let i = 0; i < rawIdx.length; i += 3) {
            const [a, b, c] = [rawIdx[i], rawIdx[i+1], rawIdx[i+2]];
            const e1 = [rawV[3*b]-rawV[3*a], rawV[3*b+1]-rawV[3*a+1], rawV[3*b+2]-rawV[3*a+2]];
            const e2 = [rawV[3*c]-rawV[3*a], rawV[3*c+1]-rawV[3*a+1], rawV[3*c+2]-rawV[3*a+2]];
            const n  = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
            for (const vi of [a,b,c]) { acc[vi][0]+=n[0]; acc[vi][1]+=n[1]; acc[vi][2]+=n[2]; }
        }
        const nrm = v => { const l=Math.sqrt(v[0]**2+v[1]**2+v[2]**2); return l>0?[v[0]/l,v[1]/l,v[2]/l]:[0,0,1]; };
        const vn = acc.map(nrm);

        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        const push = (pos, n, u, v) => {
            this.vertices.push(...pos); this.normals.push(...n); this.texCoords.push(u, v);
        };

        // ── Front face (0..NV-1): pos + vn*T ────────────────────────
        for (let i = 0; i < NV; i++) {
            const [x,y,z] = [rawV[3*i], rawV[3*i+1], rawV[3*i+2]];
            const n = vn[i];
            push([x+n[0]*T, y+n[1]*T, z+n[2]*T], n, rawTex[2*i], rawTex[2*i+1]);
        }
        // ── Back face (NV..2NV-1): pos - vn*T, negated normals ──────
        for (let i = 0; i < NV; i++) {
            const [x,y,z] = [rawV[3*i], rawV[3*i+1], rawV[3*i+2]];
            const n = vn[i];
            push([x-n[0]*T, y-n[1]*T, z-n[2]*T], [-n[0],-n[1],-n[2]], rawTex[2*i], rawTex[2*i+1]);
        }

        // ── Edge vertices (2NV..4NV-1) ────────────────────────────────
        // Perimeter CCW from front: right side up, left side down
        const perim = [0, 2, 4, 6, 8, 9, 7, 5, 3, 1];
        const NP = perim.length;

        // Outward edge normal per edge: (dy, -dx, 0) for a CCW polygon
        const edgeOut = perim.map((vi, i) => {
            const ni = perim[(i+1)%NP];
            const dx = rawV[3*ni]   - rawV[3*vi];
            const dy = rawV[3*ni+1] - rawV[3*vi+1];
            return [dy, -dx, 0];
        });

        // Vertex edge normals: average of the two adjacent edge normals
        const vEdgeN = perim.map((_, i) => {
            const prev = edgeOut[(i-1+NP)%NP];
            const curr = edgeOut[i];
            return nrm([prev[0]+curr[0], prev[1]+curr[1], 0]);
        });

        // Emit 2 verts per perimeter vertex (front-side, back-side)
        const EB = 2 * NV;
        for (let i = 0; i < NP; i++) {
            const vi = perim[i];
            const [x,y,z] = [rawV[3*vi], rawV[3*vi+1], rawV[3*vi+2]];
            const sn = vn[vi];
            const en = vEdgeN[i];
            push([x+sn[0]*T, y+sn[1]*T, z+sn[2]*T], en, rawTex[2*vi], rawTex[2*vi+1]);
            push([x-sn[0]*T, y-sn[1]*T, z-sn[2]*T], en, rawTex[2*vi], rawTex[2*vi+1]);
        }

        // ── Front face indices ────────────────────────────────────────
        for (let i = 0; i < rawIdx.length; i += 3)
            this.indices.push(rawIdx[i], rawIdx[i+1], rawIdx[i+2]);

        // ── Back face indices (reversed winding, +NV) ────────────────
        for (let i = 0; i < rawIdx.length; i += 3)
            this.indices.push(rawIdx[i]+NV, rawIdx[i+2]+NV, rawIdx[i+1]+NV);

        // ── Edge quad indices ─────────────────────────────────────────
        // winding (fA, bA, fB) and (bA, bB, fB) gives outward normals
        for (let i = 0; i < NP; i++) {
            const next = (i+1) % NP;
            const fA = EB+2*i,     bA = EB+2*i+1;
            const fB = EB+2*next,  bB = EB+2*next+1;
            this.indices.push(fA, bA, fB,  bA, bB, fB);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
