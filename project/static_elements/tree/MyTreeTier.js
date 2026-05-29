import { CGFobject } from '../../../lib/CGF.js';

export class MyTreeTier extends CGFobject {
    constructor(scene, slices, bottomRadius, topRadius) {
        super(scene);
        this.slices = slices;
        this.bottomR = bottomRadius;
        this.topR = topRadius;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const alphaAng = (2 * Math.PI) / this.slices;
        let index = 0;

        // Faces Laterais (Cada face é separada das outras para criar Flat Shading)
        for (let i = 0; i < this.slices; i++) {
            const a1 = i * alphaAng;
            const a2 = (i + 1) * alphaAng;

            // 4 Vértices desta face específica
            const v1 = [this.bottomR * Math.cos(a1), 0, -this.bottomR * Math.sin(a1)];
            const v2 = [this.bottomR * Math.cos(a2), 0, -this.bottomR * Math.sin(a2)];
            const v3 = [this.topR * Math.cos(a1), 1, -this.topR * Math.sin(a1)];
            const v4 = [this.topR * Math.cos(a2), 1, -this.topR * Math.sin(a2)];

            // Normal perpendicular a esta face
            const am = (a1 + a2) / 2;
            const nx = Math.cos(am);
            const nz = -Math.sin(am);
            const ny = this.bottomR - this.topR; // Inclinação da parede
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            const normal = [nx/len, ny/len, nz/len];

            // Inserir vértices e 4 normais idênticas para ter arestas afiadas
            this.vertices.push(...v1, ...v2, ...v3, ...v4);
            this.normals.push(...normal, ...normal, ...normal, ...normal);
            this.texCoords.push(0, 1, 1, 1, 0, 0, 1, 0);

            // Dois triângulos para fechar o rectângulo/trapézio da face
            this.indices.push(index, index + 1, index + 2);
            this.indices.push(index + 1, index + 3, index + 2);

            index += 4;
        }

        // Tampa da Base (Para fechar o buraco por baixo)
        for (let i = 0; i < this.slices; i++) {
            const a1 = i * alphaAng;
            const a2 = (i + 1) * alphaAng;
            this.vertices.push(
                0, 0, 0,
                this.bottomR * Math.cos(a2), 0, -this.bottomR * Math.sin(a2),
                this.bottomR * Math.cos(a1), 0, -this.bottomR * Math.sin(a1)
            );
            this.normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
            this.texCoords.push(0.5, 0.5, 0, 0, 1, 1);
            this.indices.push(index, index + 1, index + 2);
            index += 3;
        }

        // Tampa do Topo (Só faz se não for o bico final da árvore onde o raio é 0)
        if (this.topR > 0) {
            for (let i = 0; i < this.slices; i++) {
                const a1 = i * alphaAng;
                const a2 = (i + 1) * alphaAng;
                this.vertices.push(
                    0, 1, 0,
                    this.topR * Math.cos(a1), 1, -this.topR * Math.sin(a1),
                    this.topR * Math.cos(a2), 1, -this.topR * Math.sin(a2)
                );
                this.normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
                this.texCoords.push(0.5, 0.5, 0, 0, 1, 1);
                this.indices.push(index, index + 1, index + 2);
                index += 3;
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}