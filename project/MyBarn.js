import { CGFobject, CGFappearance } from '../lib/CGF.js';

// PLACEHOLDER barn + delivery zone. THIS BOX IS NOT THE REAL BARN — a teammate
// is building the actual barn model and will swap the box geometry + boxApp
// here. It's rendered in unmistakable dev-magenta on purpose so nobody mistakes
// it for finished art. What you DO own and keep: the activation ring + its
// colour-change logic.
// Controller writes:
//   isActive : true when the wagon is inside the activation radius (ring
//              turns from dim grey to bright green — the spec's "state
//              change visual")
export class MyBarn extends CGFobject {
    constructor(scene, position, activationRadius = 5.0) {
        super(scene);
        this.isPlaceholder = true;                 // swap-me flag for the teammate
        this.label = 'PLACEHOLDER_BARN';
        this.position = position;
        this.activationRadius = activationRadius;
        this.isActive = false;
        this.size = { x: 4.0, y: 5.0, z: 6.0 }; // box stand-in dims

        // Dev-magenta "missing asset" colour — screams placeholder so it never
        // gets mistaken for the real barn mesh.
        this.boxApp = new CGFappearance(scene);
        this.boxApp.setAmbient(0.40, 0.0, 0.40, 1);
        this.boxApp.setDiffuse(1.0, 0.0, 1.0, 1);
        this.boxApp.setEmission(0.25, 0.0, 0.25, 1);
        this.boxApp.setSpecular(0.0, 0.0, 0.0, 1);
        this.boxApp.setShininess(8);

        // Ring appearances — swapped based on isActive
        this.ringInactive = new CGFappearance(scene);
        this.ringInactive.setAmbient(0.20, 0.20, 0.20, 1);
        this.ringInactive.setDiffuse(0.40, 0.40, 0.40, 1);
        this.ringInactive.setEmission(0.05, 0.05, 0.05, 1);
        this.ringInactive.setSpecular(0, 0, 0, 1);

        this.ringActive = new CGFappearance(scene);
        this.ringActive.setAmbient(0.15, 0.35, 0.15, 1);
        this.ringActive.setDiffuse(0.30, 0.80, 0.30, 1);
        this.ringActive.setEmission(0.20, 0.55, 0.20, 1);
        this.ringActive.setSpecular(0, 0, 0, 1);

        this.initBuffers();
    }

    initBuffers() {
        // ---- Box (same pattern as MyWagon/MyRock) ----
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

        // ---- Ring (annulus) — built as its own CGFobject so we can swap appearance ----
        this.ring = new MyRing(this.scene, 1.0, 0.85, 48);
    }

    display() {
        const s = this.scene;

        // Barn box
        s.pushMatrix();
        s.translate(this.position[0], this.position[1] + this.size.y * 0.5, this.position[2]);
        s.scale(this.size.x, this.size.y, this.size.z);
        this.boxApp.apply();
        super.display();
        s.popMatrix();

        // Activation ring — flat on the ground, slight lift to avoid z-fighting
        s.pushMatrix();
        s.translate(this.position[0], this.position[1] + 0.02, this.position[2]);
        s.scale(this.activationRadius, 1, this.activationRadius);
        (this.isActive ? this.ringActive : this.ringInactive).apply();
        this.ring.display();
        s.popMatrix();
    }
}

// Flat annulus on Y=0, inner radius = innerR * 1.0, outer radius = 1.0
// (scaled by caller). N segments around the circle.
class MyRing extends CGFobject {
    constructor(scene, outerR = 1.0, innerR = 0.85, segments = 48) {
        super(scene);
        this.outerR = outerR;
        this.innerR = innerR;
        this.segments = segments;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = []; this.normals = []; this.indices = []; this.texCoords = [];
        const N = this.segments;
        for (let i = 0; i <= N; i++) {
            const a = (i / N) * 2 * Math.PI;
            const c = Math.cos(a), s = Math.sin(a);
            // outer
            this.vertices.push(c * this.outerR, 0, s * this.outerR);
            this.normals.push(0, 1, 0);
            this.texCoords.push(i / N, 0);
            // inner
            this.vertices.push(c * this.innerR, 0, s * this.innerR);
            this.normals.push(0, 1, 0);
            this.texCoords.push(i / N, 1);
        }
        for (let i = 0; i < N; i++) {
            const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
            // Wound so the ring is visible from above (normal +Y)
            this.indices.push(a, c, b,  b, c, d);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
