import {CGFappearance} from '../lib/CGF.js';
import {MyStem} from './MyStem.js';
import {MyLeaf} from './MyLeaf.js';
import {MySphere} from './MySphere.js';
import {MyPetal} from './MyPetal.js';

export class MyFlower {
    constructor(scene) {
        this.scene = scene;

        this.stem = new MyStem(scene, 8, 4);
        this.leaf = new MyLeaf(scene);
        this.bloomDisc = new MySphere(scene, 16, 8, false);
        this.petal = new MyPetal(scene);

        this.petalApp = new CGFappearance(scene);
        this.petalApp.setSpecular(0.08, 0.08, 0.08, 1);
        this.petalApp.setEmission(0, 0, 0, 1);
        this.petalApp.setShininess(12);

        this.stemApp = new CGFappearance(scene);
        this.stemApp.setAmbient(0.08, 0.30, 0.05, 1);
        this.stemApp.setDiffuse(0.14, 0.46, 0.09, 1);
        this.stemApp.setSpecular(0.02, 0.06, 0.01, 1);
        this.stemApp.setEmission(0, 0, 0, 1);
        this.stemApp.setShininess(10);

        this.leafApp = new CGFappearance(scene);
        this.leafApp.setAmbient(0.10, 0.35, 0.06, 1);
        this.leafApp.setDiffuse(0.18, 0.52, 0.10, 1);
        this.leafApp.setSpecular(0.02, 0.08, 0.01, 1);
        this.leafApp.setEmission(0, 0, 0, 1);
        this.leafApp.setShininess(8);

        this.bloomApp = new CGFappearance(scene);
        this.bloomApp.setAmbient(0.40, 0.28, 0.01, 1);
        this.bloomApp.setDiffuse(0.75, 0.55, 0.05, 1);
        this.bloomApp.setSpecular(0.15, 0.10, 0.02, 1);
        this.bloomApp.setEmission(0.05, 0.03, 0.00, 1);
        this.bloomApp.setShininess(20);
    }

    display(p) {
        const s = this.scene;
        s.pushMatrix();

        // Stem — only Y scaled
        s.pushMatrix();
        s.scale(1, p.stemHeight, 1);
        this.stemApp.apply();
        this.stem.display();
        s.popMatrix();

        // Leaves — attached at absolute Y on the stem
        this.leafApp.apply();
        const attachY = p.leafHeight * p.stemHeight;
        for (let i = 0; i < p.leafCount; i++) {
            const azimuth = (i / p.leafCount) * Math.PI * 2;
            s.pushMatrix();
            s.translate(0, attachY, 0);
            s.rotate(azimuth, 0, 1, 0);      // distribute around stem
            s.rotate(-p.leafSpread, 0, 0, 1); // tilt outward from stem
            s.scale(p.leafScale, p.leafScale, p.leafScale);
            this.leaf.display();
            s.popMatrix();
        }

        // Full ring of petals — base at bloom centre, disc drawn after to cover bases
        const col = p.petalColor.map(c => c / 255);
        this.petalApp.setAmbient(col[0]*0.5, col[1]*0.5, col[2]*0.5, 1);
        this.petalApp.setDiffuse(col[0], col[1], col[2], 1);
        this.petalApp.apply();
        const petalCount = Math.round(p.petalCount);
        for (let i = 0; i < petalCount; i++) {
            const azimuth = (i / petalCount) * Math.PI * 2;
            s.pushMatrix();
            s.translate(0, p.stemHeight, 0);
            s.rotate(azimuth, 0, 1, 0);                        // distribute around stem
            s.rotate(-(Math.PI/2 - p.petalTilt), 1, 0, 0);    // lay flat + tilt up
            s.scale(p.petalScale, p.petalScale, p.petalScale);
            this.petal.display();
            s.popMatrix();
        }

        // Bloom disc — drawn last so it sits on top of petal bases
        this.bloomApp.apply();
        s.pushMatrix();
        // Place disc at the Y where the petal surface is exactly bloomRadius from the axis
        const discY = p.stemHeight + p.bloomRadius * Math.tan(p.petalTilt);
        s.translate(0, discY, 0);
        s.scale(p.bloomRadius, p.bloomRadius * 0.35, p.bloomRadius);
        this.bloomDisc.display();
        s.popMatrix();

        s.popMatrix();
    }
}
