import { CGFobject, CGFappearance, CGFtexture } from "../../lib/CGF.js";
import { MyUnitCubeQuad } from "../shapes/MyUnitCubeQuad.js";
import { MyWagonWheel } from "./MyWagonWheel.js";
import { MyHalfCylinder } from "../shapes/MyHalfCylinder.js";

/**
 * Displays the wagon model with controller-provided state.
 * movement logic is in MyWagonController.
 */
export class MyWagon extends CGFobject {
    constructor(scene, controller) {
        super(scene);
        this.controller = controller;
        
        // Components
        this.box = new MyUnitCubeQuad(scene);
        this.wheel = new MyWagonWheel(scene);
        this.halfCylinder = new MyHalfCylinder(scene, 6, 1);

        this.initMaterials(); 
    }

    initMaterials() {
        this.woodMaterial = new CGFappearance(this.scene);
        this.woodMaterial.setAmbient(0.4, 0.25, 0.1, 1.0);
        this.woodMaterial.setDiffuse(0.6, 0.35, 0.15, 1.0);

        this.clothMaterial = new CGFappearance(this.scene);
        this.clothMaterial.setAmbient(0.8, 0.8, 0.8, 1.0);
        this.clothMaterial.setDiffuse(0.9, 0.9, 0.9, 1.0);
        this.clothMaterial.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.clothMaterial.setShininess(10.0);

        this.woodTexture = new CGFtexture(this, "textures/wood.jpg");
        this.woodMaterial.setTexture(this.woodTexture);
    }

    /**
     * displayModel() - Renders the detailed wagon geometry
     * Called from display() after setting up transformations.
     */
    displayModel() {
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
        let rearAngle = -this.controller.rearWheelAngle;
        let frontAngle = -this.controller.frontWheelAngle;

        // Back Right
        this.scene.pushMatrix();
        this.scene.translate(-1.5, 1.2, -1.5);
        this.scene.rotate(rearAngle, 0, 0, 1);
        this.scene.scale(0.7, 0.7, 0.7);
        this.wheel.display();
        this.scene.popMatrix();

        // Back Left
        this.scene.pushMatrix();
        this.scene.translate(-1.5, 1.2, 1.5);
        this.scene.rotate(rearAngle, 0, 0, 1);
        this.scene.scale(0.7, 0.7, 0.7);
        this.wheel.display();
        this.scene.popMatrix();

        // Front Right - WITH STEERING ROTATION
        this.scene.pushMatrix();
        this.scene.translate(1.5, 1.0, -1.5);
        this.scene.rotate(this.controller.getSteeringAngle(), 0, 1, 0);
        this.scene.rotate(frontAngle, 0, 0, 1);
        this.scene.scale(0.6, 0.6, 0.6);
        this.wheel.display();
        this.scene.popMatrix();

        // Front Left - WITH STEERING ROTATION
        this.scene.pushMatrix();
        this.scene.translate(1.5, 1.0, 1.5);
        this.scene.rotate(this.controller.getSteeringAngle(), 0, 1, 0);
        this.scene.rotate(frontAngle, 0, 0, 1);
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
            
            // Cloth Panel (undulating between ribs)
            this.clothMaterial.apply();
            let numRibs = 3;
            let spanLen = coverLength / (numRibs - 1);
            let sagAmount = 0.15; // depth of the sag

            for(let j = 0; j < numRibs - 1; j++) {
                let spanCenterX = coverX - coverLength/2 + spanLen/2 + j*spanLen;
                
                this.scene.pushMatrix();
                this.scene.translate(spanCenterX, 2.6 + coverRadius * Math.cos(angle), -coverRadius * Math.sin(angle));
                this.scene.rotate(-angle, 1, 0, 0); 
                this.scene.scale(spanLen / 2, sagAmount, panelWidth);
                this.halfCylinder.display();
                this.scene.popMatrix();
            }

            // Wooden arch support ribs
            this.woodMaterial.apply();
            
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
    }

    display() {
        // Get state from controller
        const pos = this.controller.getPosition();
        const heading = this.controller.getHeading();
        const pitch = this.controller.getPitch();

        // Apply world transformation from controller state
        this.scene.pushMatrix();
        this.scene.translate(pos[0], pos[1], pos[2]);
        this.scene.rotate(heading, 0, 1, 0);
        this.scene.rotate(pitch, 0, 0, 1);

        // Render detailed wagon model
        this.displayModel();

        this.scene.popMatrix();
    }
}
