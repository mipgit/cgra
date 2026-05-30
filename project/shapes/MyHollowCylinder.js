import { CGFobject } from "../../lib/CGF.js";

export class MyHollowCylinder extends CGFobject {
    constructor(scene, slices, stacks, innerRadius = 0.5, outerRadius = 1.0) {
        super(scene);
        this.slices = slices;
        this.stacks = stacks;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        let tempNormals = [];

        var alphaAng = 2 * Math.PI / this.slices;
        var h = 1 / this.stacks;
        let vertexCount = 0;

        // Outer cylinder vertices
        for (let j = 0; j <= this.stacks; j++) {
            for (let i = 0; i < this.slices; i++) {
                let angle = i * alphaAng;
                let x = Math.cos(angle) * this.outerRadius;
                let y = Math.sin(angle) * this.outerRadius;
                let z = j * h;
                
                this.vertices.push(x, y, z);
                tempNormals.push([0, 0, 0]);
                vertexCount++;
            }
        }

        // Inner cylinder vertices
        let outerVertexCount = vertexCount;
        for (let j = 0; j <= this.stacks; j++) {
            for (let i = 0; i < this.slices; i++) {
                let angle = i * alphaAng;
                let x = Math.cos(angle) * this.innerRadius;
                let y = Math.sin(angle) * this.innerRadius;
                let z = j * h;
                
                this.vertices.push(x, y, z);
                tempNormals.push([0, 0, 0]);
                vertexCount++;
            }
        }

        // Build outer cylinder side faces and accumulate normals
        for (let j = 0; j < this.stacks; j++) {
            for (let i = 0; i < this.slices; i++) {
                let current = j * this.slices + i;
                let next = j * this.slices + ((i + 1) % this.slices);
                let currentNext = (j + 1) * this.slices + i;
                let nextNext = (j + 1) * this.slices + ((i + 1) % this.slices);

                // Triangle 1
                this.indices.push(current, currentNext, next);
                this.indices.push(next, currentNext, current);
                
                // Triangle 2
                this.indices.push(next, currentNext, nextNext);
                this.indices.push(nextNext, currentNext, next);
                
                // Calculate face normal for outer cylinder (pointing outward)
                let i1 = current * 3;
                let v1 = [this.vertices[i1], this.vertices[i1+1], this.vertices[i1+2]];
                
                let angle = i * alphaAng;
                let nx = Math.cos(angle);
                let ny = Math.sin(angle);
                
                tempNormals[current][0] += nx;
                tempNormals[current][1] += ny;
                tempNormals[next][0] += nx;
                tempNormals[next][1] += ny;
                tempNormals[currentNext][0] += nx;
                tempNormals[currentNext][1] += ny;
                tempNormals[nextNext][0] += nx;
                tempNormals[nextNext][1] += ny;
            }
        }

        // Build inner cylinder side faces
        for (let j = 0; j < this.stacks; j++) {
            for (let i = 0; i < this.slices; i++) {
                let current = outerVertexCount + j * this.slices + i;
                let next = outerVertexCount + j * this.slices + ((i + 1) % this.slices);
                let currentNext = outerVertexCount + (j + 1) * this.slices + i;
                let nextNext = outerVertexCount + (j + 1) * this.slices + ((i + 1) % this.slices);

                this.indices.push(current, next, currentNext);
                this.indices.push(next, nextNext, currentNext);

                this.indices.push(currentNext, next, current);
                this.indices.push(currentNext, nextNext, next);
                
                // Inward pointing normal
                let angle = i * alphaAng;
                let nx = -Math.cos(angle);
                let ny = -Math.sin(angle);
                
                tempNormals[current][0] += nx;
                tempNormals[current][1] += ny;
                tempNormals[next][0] += nx;
                tempNormals[next][1] += ny;
                tempNormals[currentNext][0] += nx;
                tempNormals[currentNext][1] += ny;
                tempNormals[nextNext][0] += nx;
                tempNormals[nextNext][1] += ny;
            }
        }

        // Normalize and add all normals
        for (let i = 0; i < tempNormals.length; i++) {
            let len = Math.sqrt(tempNormals[i][0] * tempNormals[i][0] + tempNormals[i][1] * tempNormals[i][1] + tempNormals[i][2] * tempNormals[i][2]);
            if (len === 0) len = 1;
            this.normals.push(tempNormals[i][0] / len, tempNormals[i][1] / len, tempNormals[i][2] / len);
        }

        // Top ring face (z = 1) - normal points up (0, 0, 1)
        let topOuterStart = this.stacks * this.slices;
        let topInnerStart = outerVertexCount + this.stacks * this.slices;
        for (let i = 0; i < this.slices; i++) {
            let outerCurrent = topOuterStart + i;
            let outerNext = topOuterStart + ((i + 1) % this.slices);
            let innerCurrent = topInnerStart + i;
            let innerNext = topInnerStart + ((i + 1) % this.slices);

            // Outer triangle
            this.indices.push(outerCurrent, outerNext, innerNext);
            // Inner triangle
            this.indices.push(outerCurrent, innerNext, innerCurrent);
        }
        // Add top face normals
        for (let i = topOuterStart; i < topOuterStart + this.slices; i++) {
            this.normals[i * 3] = 0;
            this.normals[i * 3 + 1] = 0;
            this.normals[i * 3 + 2] = 1;
        }
        for (let i = topInnerStart; i < topInnerStart + this.slices; i++) {
            this.normals[i * 3] = 0;
            this.normals[i * 3 + 1] = 0;
            this.normals[i * 3 + 2] = 1;
        }

        // Bottom ring face (z = 0) - normal points down (0, 0, -1)
        let bottomOuterStart = 0;
        let bottomInnerStart = outerVertexCount;
        for (let i = 0; i < this.slices; i++) {
            let outerCurrent = bottomOuterStart + i;
            let outerNext = bottomOuterStart + ((i + 1) % this.slices);
            let innerCurrent = bottomInnerStart + i;
            let innerNext = bottomInnerStart + ((i + 1) % this.slices);

            // Outer triangle
            this.indices.push(outerCurrent, innerNext, outerNext);
            // Inner triangle
            this.indices.push(outerCurrent, innerCurrent, innerNext);
        }
        // Add bottom face normals
        for (let i = bottomOuterStart; i < bottomOuterStart + this.slices; i++) {
            this.normals[i * 3] = 0;
            this.normals[i * 3 + 1] = 0;
            this.normals[i * 3 + 2] = -1;
        }
        for (let i = bottomInnerStart; i < bottomInnerStart + this.slices; i++) {
            this.normals[i * 3] = 0;
            this.normals[i * 3 + 1] = 0;
            this.normals[i * 3 + 2] = -1;
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
