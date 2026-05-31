import {CGFobject} from '../../lib/CGF.js';
import { MyQuad } from "./MyQuad.js";

export class MyUnitCubeQuad extends CGFobject {
    constructor(scene){
        super(scene);
        this.quad1 = new MyQuad(scene);
        this.quad2 = new MyQuad(scene);
        this.quad3 = new MyQuad(scene);
        this.quad4 = new MyQuad(scene);
        this.quad5 = new MyQuad(scene);
        this.quad6 = new MyQuad(scene);
    }

    display(){
        // Front (+Z)
        this.scene.pushMatrix();
        this.scene.translate(0, 0, 0.5);
        this.quad1.display();
        this.scene.popMatrix();

        // Left (-X) -> rotates by -90 deg around Y
        this.scene.pushMatrix();
        this.scene.translate(-0.5, 0, 0);
        this.scene.rotate(-Math.PI / 2, 0, 1, 0);
        this.quad2.display();
        this.scene.popMatrix();

        // Right (+X) -> rotates by +90 deg around Y
        this.scene.pushMatrix();
        this.scene.translate(0.5, 0, 0);
        this.scene.rotate(Math.PI / 2, 0, 1, 0);
        this.quad3.display();
        this.scene.popMatrix();

        // Back (-Z) -> rotates by 180 deg around Y
        this.scene.pushMatrix();
        this.scene.translate(0, 0, -0.5);
        this.scene.rotate(Math.PI, 0, 1, 0);
        this.quad4.display();
        this.scene.popMatrix();

        // Top (+Y) -> rotates by -90 deg around X
        this.scene.pushMatrix();
        this.scene.translate(0, 0.5, 0);
        this.scene.rotate(-Math.PI / 2, 1, 0, 0);
        this.quad5.display();
        this.scene.popMatrix();

        // Bottom (-Y) -> rotates by +90 deg around X
        this.scene.pushMatrix();
        this.scene.translate(0, -0.5, 0);
        this.scene.rotate(Math.PI / 2, 1, 0, 0);
        this.quad6.display();
        this.scene.popMatrix();
    }
}