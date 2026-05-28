import { CGFobject } from "../lib/CGF.js";
import { MyUnitCubeQuad } from "./MyUnitCubeQuad.js";
import { MyCylinder } from "./MyCylinder.js";
import { MyHollowCylinder } from "./MyHollowCylinder.js";

export class MyWagonWheel extends CGFobject {
    constructor(scene) {
        super(scene);
        this.box = new MyUnitCubeQuad(scene);
        this.hub = new MyCylinder(scene, 12, 1);
        this.rim = new MyHollowCylinder(scene, 16, 1, 0.85, 1.0);
    }

    display() {
        this.scene.pushMatrix();

        // Hub 
        this.scene.pushMatrix();
        this.scene.scale(0.3, 0.3, 0.3);
        this.scene.translate(0, 0, -0.5);
        this.hub.display();
        this.scene.popMatrix();

        // Rim
        this.scene.pushMatrix();
        this.scene.scale(1.51, 1.51, 0.5); 
        this.scene.translate(0, 0, -0.5); // Center it
        this.rim.display();
        this.scene.popMatrix();

        let numSpokes = 16; 
        let angleStep = (Math.PI * 2) / numSpokes;
        let R = 1.5; // Spoke length
        
        // Spokes 
        for (let i = 0; i < numSpokes; i++) {
            this.scene.pushMatrix();
            this.scene.rotate(i * angleStep, 0, 0, 1);

            this.scene.pushMatrix();
            this.scene.translate(0, R / 2, 0);
            this.scene.scale(0.06, R, 0.06);
         
            this.box.display();
            this.scene.popMatrix();

            this.scene.popMatrix();
        }

        this.scene.popMatrix();
    }
}
