import { CGFobject } from '../lib/CGF.js';
import { MyRock } from './MyRock.js';

export class MyRockField extends CGFobject {
    constructor(scene, instances) {
        super(scene);
        this.instances = instances;
        this.template = new MyRock(scene);
        this.sunDir = [0.3, 0.95, 0.25];
        this.initBuffers();
    }

    initBuffers() {
        this.vertices  = [];
        this.normals   = [];
        this.colors    = [];
        this.texCoords = [];
        this.indices   = [];

        for (const inst of this.instances) this._bakeRock(inst);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();

        const gl = this.scene.gl;
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
    }

    display() {
        const gl = this.scene.gl;
        const program = this.scene.activeShader.program;
        const colorLoc = gl.getAttribLocation(program, 'aVertexColor');
        if (colorLoc >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(colorLoc);
        }
        super.display();
        if (colorLoc >= 0) gl.disableVertexAttribArray(colorLoc);
    }

    _bakeRock(inst) {
        const tv = this.template.vertices;
        const tn = this.template.normals;
        const ti = this.template.indices;
        const ttc = this.template.texCoords;
        const base = this.vertices.length / 3;

        const { x: fx, z: fz, scale: s, rotY } = inst;
        const cosR = Math.cos(rotY), sinR = Math.sin(rotY);

        for (let i = 0; i < tv.length; i += 3) {
            const lx = tv[i], ly = tv[i+1], lz = tv[i+2];
            const nx = tn[i], ny = tn[i+1], nz = tn[i+2];

            const rx = lx * cosR - lz * sinR;
            const rz = lx * sinR + lz * cosR;

            const wx = rx * s + fx;
            const wy = ly * s;
            const wz = rz * s + fz;

            const rnx = nx * cosR - nz * sinR;
            const rnz = nx * sinR + nz * cosR;

            const ndotl = Math.max(0, rnx * this.sunDir[0] + ny * this.sunDir[1] + rnz * this.sunDir[2]);
            const shade = 0.35 + 0.65 * ndotl;

            this.vertices.push(wx, wy, wz);
            this.normals.push(fx, 1.0, fz);
            this.colors.push(0.5 * shade, 0.45 * shade, 0.40 * shade);
            this.texCoords.push(0, 0);
        }

        for (const idx of ti) this.indices.push(base + idx);
    }
}
