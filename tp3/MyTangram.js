import { CGFobject } from '../lib/CGF.js';
import { MyDiamond } from "./MyDiamond.js";
import { MyTriangle } from "./MyTriangle.js";
import { MyParallelogram } from "./MyParallelogram.js";
import { MyTriangleSmall } from "./MyTriangleSmall.js";
import { MyTriangleBig } from "./MyTriangleBig.js";

export class MyTangram extends CGFobject {
    constructor(scene) {
        super(scene);
        this.diamond      = new MyDiamond(scene);
        this.triangle     = new MyTriangle(scene);
        this.parallelogram = new MyParallelogram(scene);
        this.triangleSmall1 = new MyTriangleSmall(scene);
        this.triangleSmall2 = new MyTriangleSmall(scene);
        this.triangleBig1   = new MyTriangleBig(scene);
        this.triangleBig2   = new MyTriangleBig(scene);

        this.parts = [
            this.diamond,
            this.triangle,
            this.parallelogram,
            this.triangleSmall1,
            this.triangleSmall2,
            this.triangleBig1,
            this.triangleBig2,
        ];
    }

    enableNormalViz() {
        for (const part of this.parts)
            part.enableNormalViz();
    }

    disableNormalViz() {
        for (const part of this.parts)
            part.disableNormalViz();
    }

    display() {
        // diamond (green) - matrix multiplication
        const angle = 45 * Math.PI / 180;

        var tra = [
            1.0,  0.0,  0.0,  0.0,
            0.0,  1.0,  0.0,  0.0,
            0.0,  0.0,  1.0,  0.0,
            Math.cos(angle), Math.sin(angle), 0.0, 1.0,
        ];

        var rot = [
             Math.cos(angle), Math.sin(angle), 0.0, 0.0,
            -Math.sin(angle), Math.cos(angle), 0.0, 0.0,
             0.0,             0.0,             1.0, 0.0,
             0.0,             0.0,             0.0, 1.0,
        ];

        this.scene.pushMatrix();
        this.scene.multMatrix(tra);
        this.scene.multMatrix(rot);
        this.scene.setDiffuse(0, 1, 0, 1);
        this.diamond.display();
        this.scene.popMatrix();

        // parallelogram (yellow)
        this.scene.pushMatrix();

		this.scene.translate(2 * Math.cos(45 * Math.PI / 180), 2 * Math.sin(45 * Math.PI / 180), 0);
        this.scene.rotate(180 * Math.PI / 180, 1, 0, 0);
        this.scene.rotate(45 * Math.PI / 180, 0, 0, 1);
        
		this.scene.setDiffuse(1, 1, 0, 1);
        this.parallelogram.display();
        this.scene.popMatrix();

        // small triangle 1 (red)
        this.scene.pushMatrix();

        this.scene.translate(-1 * Math.cos(-45 * Math.PI / 180), -1 * Math.sin(-45 * Math.PI / 180), 0);
        this.scene.rotate(-45 * Math.PI / 180, 0, 0, 1);
        
		this.scene.setDiffuse(1, 0, 0, 1);
        this.triangleSmall1.display();
        this.scene.popMatrix();

        // small triangle 2 (purple)
        this.scene.pushMatrix();

        this.scene.translate(-3 * Math.cos(45 * Math.PI / 180), -1 * Math.sin(45 * Math.PI / 180), 0);
        this.scene.rotate(45 * Math.PI / 180, 0, 0, 1);
        
		this.scene.setDiffuse(0.7, 0.4, 1, 1);
        this.triangleSmall2.display();
        this.scene.popMatrix();

        // large triangle 1 (blue)
        this.scene.pushMatrix();

        this.scene.translate(0, 2 * Math.sin(-45 * Math.PI / 180), 0);
        this.scene.rotate(-45 * Math.PI / 180, 0, 0, 1);

        this.scene.setDiffuse(0, 0, 1, 1);
        this.triangleBig1.display();
        this.scene.popMatrix();

        // large triangle 2 (orange)
        this.scene.pushMatrix();

        this.scene.translate(0, -2 * Math.sin(135 * Math.PI / 180), 0);
        this.scene.rotate(135 * Math.PI / 180, 0, 0, 1);

        this.scene.setDiffuse(1, 0.5, 0, 1);
        this.triangleBig2.display();
        this.scene.popMatrix();

		// medium triangle (purple)
		this.scene.pushMatrix();
		this.scene.translate(2* Math.cos(-135 * Math.PI / 180), 0, 0);
		this.scene.rotate(-135 * Math.PI / 180, 0, 0, 1);

		this.scene.setDiffuse(0.9, 0.5, 0.5, 1);
		this.triangle.display();
		this.scene.popMatrix();
    }

    // the console log was warning for these missing functions...
    setPieceColor() {

    }

    updateBuffers() {
        
    }
}
