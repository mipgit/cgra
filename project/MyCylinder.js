import {CGFobject} from '../lib/CGF.js';

export class MyCylinder extends CGFobject {
    constructor(scene, slices) {
        super(scene);
        this.slices = slices;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const alphaAng = 2 * Math.PI / this.slices;
        const bottomRing = [];
        const topRing = [];

        for (let i = 0; i < this.slices; i++) {
            const ang = i * alphaAng;
            const cA = Math.cos(ang);
            const sA = Math.sin(ang);

            bottomRing.push(this.vertices.length / 3);
            this.vertices.push(cA, 0, -sA);
            this.normals.push(cA, 0, -sA);
            this.texCoords.push(i / this.slices, 1);

            topRing.push(this.vertices.length / 3);
            this.vertices.push(cA, 1, -sA);
            this.normals.push(cA, 0, -sA);
            this.texCoords.push(i / this.slices, 0);
        }

        const bottomCenterIndex = this.vertices.length / 3;
        this.vertices.push(0, 0, 0);
        this.normals.push(0, -1, 0);
        this.texCoords.push(0.5, 0.5);

        const topCenterIndex = this.vertices.length / 3;
        this.vertices.push(0, 1, 0);
        this.normals.push(0, 1, 0);
        this.texCoords.push(0.5, 0.5);

        for (let i = 0; i < this.slices; i++) {
            const next = (i + 1) % this.slices;

            // side faces
            this.indices.push(bottomRing[i], topRing[i], topRing[next]);
            this.indices.push(bottomRing[i], topRing[next], bottomRing[next]);

            // bottom cap
            this.indices.push(bottomCenterIndex, bottomRing[next], bottomRing[i]);

            // top cap
            this.indices.push(topCenterIndex, topRing[i], topRing[next]);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}