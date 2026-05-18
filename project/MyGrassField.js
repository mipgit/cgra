import {CGFobject} from '../lib/CGF.js';

// Bakes a chunk of grass blade positions into one CGFobject (one draw call).
// Keep each instance under 5000 blades to stay within the Uint16 index limit.
export class MyGrassField extends CGFobject {
    constructor(scene, positions) {
        super(scene);
        this.positions = positions;
        this.initBuffers();
    }

    initBuffers() {
        const tv = [
            // Blade A
            -0.09, 0,    0,
             0.09, 0,    0,
            -0.07, 0.55, 0.05,
             0.07, 0.55, 0.05,
             0.01, 1.4,  0,
            // Blade B
             0,    0,   -0.09,
             0,    0,    0.09,
             0.05, 0.55, 0.07,
             0.01, 1.4,  0,
            // Blade C
            -0.06, 0,   -0.06,
             0.06, 0,    0.06,
             0.04, 0.55, 0.04,
             0.01, 1.4,  0,
        ];
        const ti = [0,1,3, 0,3,2, 2,3,4, 5,6,7, 5,7,8, 9,10,11, 9,11,12];
        const NVERTS = 13;

        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        for (let p = 0; p < this.positions.length; p++) {
            const {x, z, rot, tilt, scale} = this.positions[p];
            const cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt);
            const cosRot  = Math.cos(rot),  sinRot  = Math.sin(rot);
            const base = p * NVERTS;

            for (let v = 0; v < NVERTS; v++) {
                let vx = tv[v*3]   * scale;
                let vy = tv[v*3+1] * scale;
                let vz = tv[v*3+2] * scale;

                let ty = vy * cosTilt - vz * sinTilt;
                let tz = vy * sinTilt + vz * cosTilt;
                vy = ty; vz = tz;

                let tx = vx * cosRot + vz * sinRot;
                tz    = -vx * sinRot + vz * cosRot;
                vx = tx; vz = tz;

                this.vertices.push(vx + x, vy - 0.5, vz + z);
                // normals.y encodes normalized local height (0=base, 1=tip) — used by shader for wind tip factor
                this.normals.push(0, tv[v*3+1] / 1.4, 0);
                this.texCoords.push(0.5, 0.5);
            }

            for (const idx of ti) this.indices.push(base + idx);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
