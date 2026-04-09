import {CGFobject} from '../lib/CGF.js';
import { MyQuad } from "./MyQuad.js";

export class MyUnitCubeQuad extends CGFobject {
    constructor(scene, top, front, right, back, left, bottom){
        super(scene);
        this.quad = new MyQuad(scene);

        this.top = top;
        this.front = front;
        this.right = right;
        this.back = back;
        this.left = left;
        this.bottom = bottom;

    }

    display(){

        // front
        this.scene.pushMatrix();
        this.scene.translate(0,0, 0.5);
        if (this.front) this.front.bind();
        this.quad.display();
        this.scene.popMatrix();

        // right
        this.scene.pushMatrix();
        this.scene.translate(-0.5,0,0);
        this.scene.rotate(90 * Math.PI / 180, 0, 1, 0);
        if (this.right) this.right.bind();
        this.quad.display();
        this.scene.popMatrix();

        // back
        this.scene.pushMatrix();
        this.scene.translate(0.5,0,0);
        this.scene.rotate(-90 * Math.PI / 180, 0, 1, 0);
        if (this.back) this.back.bind();
        this.quad.display();
        this.scene.popMatrix();

        // left
        this.scene.pushMatrix();
        this.scene.translate(0,0, -0.5);
        if (this.left) this.left.bind();
        this.quad.display();
        this.scene.popMatrix();
        
        // top ?
        this.scene.pushMatrix();
        this.scene.translate(0,0.5,0);
        this.scene.rotate(90 * Math.PI / 180, 1, 0, 0);
        this.quad.display();
        this.scene.popMatrix();


        // bottom
        this.scene.pushMatrix();
        this.scene.translate(0,-0.5,0);
        this.scene.rotate(90 * Math.PI / 180, 1, 0, 0);
        if (this.bottom) this.bottom.bind();
        this.quad.display();
        this.scene.popMatrix();

    }

    
}