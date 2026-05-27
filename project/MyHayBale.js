import { CGFobject, CGFappearance } from '../lib/CGF.js';

// Hay bale — small tan box for now. State machine:
//   'free'      → sits on ground at this.position; arrow renders above it
//   'carried'   → controller has handed it to the wagon; position is overwritten
//                 each frame to sit on the wagon's back (slot 0 or 1)
//   'delivered' → consumed at the barn; controller stops drawing it.
export class MyHayBale extends CGFobject {
    constructor(scene, position) {
        super(scene);
        this.position = position;       // [x, y, z]
        this.heading  = Math.random() * Math.PI * 2; // visual variety
        this.size     = { x: 0.7, y: 0.55, z: 0.9 };
        this.radius   = 0.6;            // pickup proximity
        this.state    = 'free';

        this.appearance = new CGFappearance(scene);
        this.appearance.setAmbient(0.30, 0.25, 0.10, 1);
        this.appearance.setDiffuse(0.90, 0.78, 0.30, 1);
        this.appearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.appearance.setShininess(8);

        this.initBuffers();
    }

    initBuffers() {
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

    // Called by controller when this bale is 'carried'. Slot is 0 or 1.
    // Places the bale on top of the wagon body, stacked along its length so two
    // bales don't overlap.
    followWagon(wagon, slot) {
        const off  = (slot === 0 ? -0.35 : 0.35) * wagon.bodySize.z;
        const fx   = Math.sin(wagon.heading) * off;
        const fz   = Math.cos(wagon.heading) * off;
        this.position[0] = wagon.position[0] + fx;
        this.position[1] = wagon.position[1] + wagon.bodySize.y + this.size.y * 0.5;
        this.position[2] = wagon.position[2] + fz;
        this.heading     = wagon.heading;
    }

    display() {
        if (this.state === 'delivered') return;
        const s = this.scene;
        s.pushMatrix();
        s.translate(this.position[0], this.position[1] + this.size.y * 0.5, this.position[2]);
        s.rotate(this.heading, 0, 1, 0);
        s.scale(this.size.x, this.size.y, this.size.z);
        this.appearance.apply();
        super.display();
        s.popMatrix();
    }
}
