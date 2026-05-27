import { CGFobject, CGFappearance } from '../lib/CGF.js';

// Placeholder rock — grey box. Friend swaps the mesh + display() for the
// real procedural rock (with vertex-perturbation shader) later. Controller
// only depends on { position, radius }.
export class MyRock extends CGFobject {
    constructor(scene, position, radius = 1.0) {
        super(scene);
        this.position = position;       // [x, y, z]; y set by terrain sampler in controller
        this.radius   = radius;         // collision radius
        this.size     = radius * 1.6;   // visual box edge
        this.appearance = new CGFappearance(scene);
        this.appearance.setAmbient(0.18, 0.18, 0.20, 1);
        this.appearance.setDiffuse(0.45, 0.45, 0.48, 1);
        this.appearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.appearance.setShininess(8);
        this.initBuffers();
    }

    initBuffers() {
        // Same unit-box pattern as MyWagon. Top/bottom face order is reversed
        // so all 6 face normals point outward.
        this.vertices = []; this.normals = []; this.indices = [];
        const faces = [
            { n: [ 1, 0, 0], v: [[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5],[ 0.5,-0.5, 0.5]] },
            { n: [-1, 0, 0], v: [[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5],[-0.5,-0.5,-0.5]] },
            { n: [ 0, 1, 0], v: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]] },
            { n: [ 0,-1, 0], v: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]] },
            { n: [ 0, 0, 1], v: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]] },
            { n: [ 0, 0,-1], v: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]] },
        ];
        let i = 0;
        for (const f of faces) {
            for (const p of f.v) { this.vertices.push(...p); this.normals.push(...f.n); }
            this.indices.push(i, i+1, i+2,  i, i+2, i+3);
            i += 4;
        }
        this.texCoords = new Array((this.vertices.length / 3) * 2).fill(0);
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        const s = this.scene;
        s.pushMatrix();
        s.translate(this.position[0], this.position[1] + this.size * 0.5, this.position[2]);
        s.scale(this.size, this.size, this.size);
        this.appearance.apply();
        super.display();
        s.popMatrix();
    }
}
