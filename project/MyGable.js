import { CGFobject } from '../lib/CGF.js';

export class MyGable extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        // coincidir com as mesmas medidas internas do telhado
        const xBase = 0.5, yBase = 0.0;
        const xMid = 0.35, yMid = 0.7;
        const xTop = 0.0,  yTop = 1.2;

        const addVertex = (x, y, nz) => {
            this.vertices.push(x, y, 0);
            this.normals.push(0, 0, nz);
            this.texCoords.push(0, 0);
        };

        const createFace = (nz) => {
            const base = this.vertices.length / 3;
            addVertex(-xBase, yBase, nz);
            addVertex(xBase, yBase, nz);
            addVertex(-xMid, yMid, nz);
            addVertex(xMid, yMid, nz);
            addVertex(xTop, yTop, nz);

            if (nz > 0) { // Aponta para a frente
                this.indices.push(base, base+1, base+3, base, base+3, base+2);
                this.indices.push(base+2, base+3, base+4);
            } else { // Aponta para trás
                this.indices.push(base, base+3, base+1, base, base+2, base+3);
                this.indices.push(base+2, base+4, base+3);
            }
        };

        createFace(1);  // Face da Frente
        createFace(-1); // Face de Trás

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}