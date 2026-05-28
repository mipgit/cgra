import {CGFobject} from '../../../lib/CGF.js';

export class MyCone extends CGFobject {
    constructor(scene, slices) {
        super(scene);
        this.slices = slices; // Número de lados (ex: 8)
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const alphaAng = 2 * Math.PI / this.slices;
        const ring = [];

        for (let i = 0; i < this.slices; i++) {
            const ang = i * alphaAng;
            const cA = Math.cos(ang);
            const sA = Math.sin(ang);

            ring.push(this.vertices.length / 3);
            this.vertices.push(cA, 0, -sA);

            // normal simples para a face lateral
            const ny = 0.6;
            this.normals.push(cA, ny, -sA);

            this.texCoords.push(i / this.slices, 1);
        }

        const apexIndex = this.vertices.length / 3;
        this.vertices.push(0, 1, 0);
        this.normals.push(0, 1, 0);
        this.texCoords.push(0.5, 0);

        const baseCenterIndex = this.vertices.length / 3;
        this.vertices.push(0, 0, 0);
        this.normals.push(0, -1, 0);
        this.texCoords.push(0.5, 0.5);

        for (let i = 0; i < this.slices; i++) {
            const next = (i + 1) % this.slices;
            this.indices.push(ring[i], apexIndex, ring[next]);
            this.indices.push(baseCenterIndex, ring[next], ring[i]);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}