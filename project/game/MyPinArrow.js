import { CGFobject } from '../../lib/CGF.js';

// Pinpointing arrow — a cone with apex pointing down, base up. Controller
// reuses one instance for every visible free bale; per-instance bob/pulse
// phase is a uniform set before each draw call.
export class MyPinArrow extends CGFobject {
    constructor(scene, slices = 16) {
        super(scene);
        this.slices = slices;
        this.baseRadius = 0.35;
        this.height = 0.9;             // local size; controller can scale further
        this.initBuffers();
    }

    initBuffers() {
        const N = this.slices;
        const r = this.baseRadius;
        const h = this.height;

        this.vertices = []; this.normals = []; this.indices = []; this.texCoords = [];

        // Apex (one vertex per side-triangle so per-side normals stay correct)
        // Side triangles emitted as N independent triangles: apex_i, base_i, base_i+1.
        for (let i = 0; i < N; i++) {
            const a0 = (i     / N) * 2 * Math.PI;
            const a1 = ((i+1) / N) * 2 * Math.PI;
            const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r;
            const x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;

            // Side normal — approximate by averaging base midpoint outward + slope up
            const mx = (x0 + x1) * 0.5, mz = (z0 + z1) * 0.5;
            const len = Math.sqrt(mx*mx + mz*mz) || 1;
            const nx = mx / len, nz = mz / len;
            // Slope component: from apex (0,0,0) to base midpoint (mx,h,mz)
            const ny = r / Math.sqrt(r*r + h*h);
            const sx = nx * (h / Math.sqrt(r*r + h*h));
            const sz = nz * (h / Math.sqrt(r*r + h*h));

            // apex
            this.vertices.push(0, 0, 0); this.normals.push(sx, ny, sz); this.texCoords.push(0.5, 0);
            // base i
            this.vertices.push(x0, h, z0); this.normals.push(sx, ny, sz); this.texCoords.push(i/N, 1);
            // base i+1
            this.vertices.push(x1, h, z1); this.normals.push(sx, ny, sz); this.texCoords.push((i+1)/N, 1);

            const base = i * 3;
            this.indices.push(base, base + 1, base + 2);
        }

        // Top cap so the arrow doesn't look hollow from above
        const capCenterIdx = this.vertices.length / 3;
        this.vertices.push(0, h, 0); this.normals.push(0, 1, 0); this.texCoords.push(0.5, 0.5);
        const capStart = this.vertices.length / 3;
        for (let i = 0; i <= N; i++) {
            const a = (i / N) * 2 * Math.PI;
            this.vertices.push(Math.cos(a) * r, h, Math.sin(a) * r);
            this.normals.push(0, 1, 0);
            this.texCoords.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a));
        }
        for (let i = 0; i < N; i++) {
            this.indices.push(capCenterIdx, capStart + i, capStart + i + 1);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
