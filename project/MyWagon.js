import { CGFobject, CGFappearance } from "../lib/CGF.js";
import { MyUnitCubeQuad } from "./MyUnitCubeQuad.js";
import { MyWagonWheel } from "./MyWagonWheel.js";

export class MyWagon extends CGFobject {
    constructor(scene) {
        super(scene);
        this.box = new MyUnitCubeQuad(scene);
        this.wheel = new MyWagonWheel(scene);

        this.initMaterials();
    }

    initMaterials() {
        this.woodMaterial = new CGFappearance(this.scene);
        this.woodMaterial.setAmbient(0.4, 0.25, 0.1, 1.0);
        this.woodMaterial.setDiffuse(0.6, 0.35, 0.15, 1.0);
        this.woodMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.woodMaterial.setShininess(10.0);

        this.clothMaterial = new CGFappearance(this.scene);
        this.clothMaterial.setAmbient(0.8, 0.8, 0.8, 1.0);
        this.clothMaterial.setDiffuse(0.9, 0.9, 0.9, 1.0);
        this.clothMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.clothMaterial.setShininess(10.0);
    }

    display() {
        this.scene.pushMatrix();

        // --- Materials & Body ---
        this.woodMaterial.apply();

        // 1. Bed base
        this.scene.pushMatrix();
        this.scene.translate(0, 1.5, 0); 
        this.scene.scale(5, 0.2, 2.5);
        this.box.display();
        this.scene.popMatrix();

        // 2. Side walls
        // Left
        this.scene.pushMatrix();
        this.scene.translate(0, 2.1, 1.15);
        this.scene.scale(5, 1.0, 0.2);
        this.box.display();
        this.scene.popMatrix();
        // Right
        this.scene.pushMatrix();
        this.scene.translate(0, 2.1, -1.15);
        this.scene.scale(5, 1.0, 0.2);
        this.box.display();
        this.scene.popMatrix();

        // Front Seat Box
        this.scene.pushMatrix();
        this.scene.translate(2.0, 2.1, 0);
        this.scene.scale(0.8, 1.0, 2.1);
        this.box.display();
        this.scene.popMatrix();

        // Back Wall
        this.scene.pushMatrix();
        this.scene.translate(-2.4, 2.1, 0);
        this.scene.scale(0.2, 1.0, 2.1);
        this.box.display();
        this.scene.popMatrix();

        // Tongue (Front Pole)
        this.scene.pushMatrix();
        this.scene.translate(3.5, 1.5, 0);
        this.scene.scale(4, 0.2, 0.2);
        this.box.display();
        this.scene.popMatrix();

        // Tongue Cross
        this.scene.pushMatrix();
        this.scene.translate(5.0, 1.5, 0);
        this.scene.scale(0.2, 0.2, 1.5);
        this.box.display();
        this.scene.popMatrix();

        // Axles
        // Back Axle
        this.scene.pushMatrix();
        this.scene.translate(-1.5, 1.2, 0);
        this.scene.scale(0.3, 0.3, 3);
        this.box.display();
        this.scene.popMatrix();

        // Front Axle
        this.scene.pushMatrix();
        this.scene.translate(1.5, 1.0, 0);
        this.scene.scale(0.3, 0.3, 3);
        this.box.display();
        this.scene.popMatrix();


        // Wheels
        // Back Right
        this.scene.pushMatrix();
        this.scene.translate(-1.5, 1.2, -1.5);
        this.scene.scale(0.7, 0.7, 0.7);
        this.wheel.display();
        this.scene.popMatrix();

        // Back Left
        this.scene.pushMatrix();
        this.scene.translate(-1.5, 1.2, 1.5);
        this.scene.scale(0.7, 0.7, 0.7);
        this.wheel.display();
        this.scene.popMatrix();

        // Front Right
        this.scene.pushMatrix();
        this.scene.translate(1.5, 1.0, -1.5);
        this.scene.scale(0.6, 0.6, 0.6); // Front wheels usually smaller
        this.wheel.display();
        this.scene.popMatrix();

        // Front Left
        this.scene.pushMatrix();
        this.scene.translate(1.5, 1.0, 1.5);
        this.scene.scale(0.6, 0.6, 0.6);
        this.wheel.display();
        this.scene.popMatrix();


        // --- Cover / Canopy ---
        // More segments for smoother arch
        let numSegments = 9;
        let coverRadius = 1.5;
        let archAngleStep = Math.PI / numSegments;
        let panelWidth = 2 * coverRadius * Math.tan(archAngleStep / 2) + 0.05;
        
        let coverLength = 2.6;
        let coverX = -1.1; // covers half the wagon


        for (let i = 0; i < numSegments; i++) {
            let angle = -Math.PI / 2 + (i + 0.5) * archAngleStep;
            
            // Cloth Panel
            this.scene.pushMatrix();
            this.scene.translate(coverX, 2.6 + coverRadius * Math.cos(angle), -coverRadius * Math.sin(angle));
            this.scene.rotate(-angle, 1, 0, 0); // Rotate around X
            this.scene.scale(coverLength, 0.12, panelWidth);
            this.clothMaterial.apply();
            this.box.display();
            this.scene.popMatrix();

            // Wooden arch support ribs
            this.woodMaterial.apply();
            
            let numRibs = 3;
            for(let j = 0; j < numRibs; j++) {
                let ribX = coverX - coverLength/2 + j*(coverLength/(numRibs-1));
                this.scene.pushMatrix();
                this.scene.translate(ribX, 2.6 + (coverRadius-0.08) * Math.cos(angle), - (coverRadius-0.08) * Math.sin(angle));
                this.scene.rotate(-angle, 1, 0, 0);
                this.scene.scale(0.12, 0.12, panelWidth - 0.05);
                this.box.display();
                this.scene.popMatrix();
            }
        }

        this.scene.popMatrix();
    }
}
