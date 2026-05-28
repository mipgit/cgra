import {CGFobject} from '../lib/CGF.js';

export class MyPetal extends CGFobject {
    constructor(scene, profile = {}) {
        super(scene);
        this.profile = {
            widthAmp:   0.34,   // max half-width
            widthPow:   0.80,   // inside sin(): >1 = pointed, <1 = blunt/broad
            widthShape: 0.65,   // outer exponent: <1 = puffier, >1 = thinner
            cupAmp:     0.14,   // forward cup near base
            curlAmount: 0.09,   // tip arcs back (t^3 coefficient); negative = curls forward
            ...profile,
        };
        this.initBuffers();
    }

    initBuffers() {
        const T = 0.007;          // half-thickness
        const ROWS = 10;
        const TIP_Y = 0.90;
        const P = this.profile;

        const widthAt = t => P.widthAmp * Math.pow(Math.sin(Math.PI * Math.pow(t, P.widthPow)), P.widthShape);
        const cupAt   = t => P.cupAmp * Math.sin(Math.PI * Math.pow(t, 0.95)) - P.curlAmount * t * t * t;

        const rawV = [], rawTex = [];
        rawV.push(0, 0, 0);
        rawTex.push(0.5, 1.0);
        for (let r = 1; r <= ROWS - 1; r++) {
            const t = r / ROWS;
            const y = t * TIP_Y;
            const w = widthAt(t);
            const z = cupAt(t);
            rawV.push(-w, y, z); rawTex.push(0.5 - w * 1.5, 1.0 - t);
            rawV.push( w, y, z); rawTex.push(0.5 + w * 1.5, 1.0 - t);
        }
        rawV.push(0, TIP_Y, cupAt(1.0));
        rawTex.push(0.5, 0.0);

        const NV = rawV.length / 3;
        const TIP_IDX = NV - 1;

        // Faces: base triangle + row-by-row quads + tip triangle
        const rawIdx = [];
        rawIdx.push(0, 2, 1);
        for (let r = 1; r < ROWS - 1; r++) {
            const L0 = 1 + 2*(r-1), R0 = L0 + 1;
            const L1 = 1 + 2*r,     R1 = L1 + 1;
            rawIdx.push(L0, R0, R1,  L0, R1, L1);
        }
        const Llast = 1 + 2*(ROWS-2), Rlast = Llast + 1;
        rawIdx.push(Llast, Rlast, TIP_IDX);

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
        // Perimeter CCW from front: base, up right side (R1..R(ROWS-1)), tip, down left side (L(ROWS-1)..L1)
        const perim = [0];
        for (let r = 1; r <= ROWS - 1; r++) perim.push(1 + 2*(r-1) + 1); // R rows
        perim.push(TIP_IDX);
        for (let r = ROWS - 1; r >= 1; r--) perim.push(1 + 2*(r-1));    // L rows back down
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
