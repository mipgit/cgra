import { CGFobject, CGFappearance } from '../lib/CGF.js';
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

        // Materials per piece - high specular, color matching tangram
        // diamond (green)
        this.matDiamond = new CGFappearance(scene);
        this.matDiamond.setAmbient(0.0, 0.3, 0.0, 1.0);
        this.matDiamond.setDiffuse(0.0, 0.8, 0.0, 1.0);
        this.matDiamond.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.matDiamond.setShininess(80.0);
        
        // parallelogram (yellow)
        this.matParallelogram = new CGFappearance(scene);
        this.matParallelogram.setAmbient(0.3, 0.3, 0.0, 1.0);
        this.matParallelogram.setDiffuse(0.9, 0.9, 0.0, 1.0);
        this.matParallelogram.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.matParallelogram.setShininess(80.0);

        // small triangle 1 (red)
        this.matTriangleSmall1 = new CGFappearance(scene);
        this.matTriangleSmall1.setAmbient(0.3, 0.0, 0.0, 1.0);
        this.matTriangleSmall1.setDiffuse(0.9, 0.0, 0.0, 1.0);
        this.matTriangleSmall1.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.matTriangleSmall1.setShininess(80.0);

        // small triangle 2 (purple)
        this.matTriangleSmall2 = new CGFappearance(scene);
        this.matTriangleSmall2.setAmbient(0.2, 0.1, 0.3, 1.0);
        this.matTriangleSmall2.setDiffuse(0.7, 0.4, 1.0, 1.0);
        this.matTriangleSmall2.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.matTriangleSmall2.setShininess(80.0);

        // large triangle 1 (blue)
        this.matTriangleBig1 = new CGFappearance(scene);
        this.matTriangleBig1.setAmbient(0.0, 0.0, 0.3, 1.0);
        this.matTriangleBig1.setDiffuse(0.0, 0.0, 0.9, 1.0);
        this.matTriangleBig1.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.matTriangleBig1.setShininess(80.0);

        // large triangle 2 (orange)
        this.matTriangleBig2 = new CGFappearance(scene);
        this.matTriangleBig2.setAmbient(0.3, 0.15, 0.0, 1.0);
        this.matTriangleBig2.setDiffuse(1.0, 0.5, 0.0, 1.0);
        this.matTriangleBig2.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.matTriangleBig2.setShininess(80.0);

        // medium triangle (purple)
        this.matTriangle = new CGFappearance(scene);
        this.matTriangle.setAmbient(0.3, 0.15, 0.15, 1.0);
        this.matTriangle.setDiffuse(0.9, 0.5, 0.5, 1.0);
        this.matTriangle.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.matTriangle.setShininess(80.0);
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
        this.scene.customMaterial.apply();
        this.diamond.display();
        this.scene.popMatrix();

        // parallelogram (yellow)
        this.scene.pushMatrix();

		this.scene.translate(2 * Math.cos(45 * Math.PI / 180), 2 * Math.sin(45 * Math.PI / 180), 0);
        this.scene.rotate(180 * Math.PI / 180, 1, 0, 0);
        this.scene.rotate(45 * Math.PI / 180, 0, 0, 1);
        
		this.matParallelogram.apply();
        this.parallelogram.display();
        this.scene.popMatrix();

        // small triangle 1 (red)
        this.scene.pushMatrix();

        this.scene.translate(-1 * Math.cos(-45 * Math.PI / 180), -1 * Math.sin(-45 * Math.PI / 180), 0);
        this.scene.rotate(-45 * Math.PI / 180, 0, 0, 1);
        
		this.matTriangleSmall1.apply();
        this.triangleSmall1.display();
        this.scene.popMatrix();

        // small triangle 2 (purple)
        this.scene.pushMatrix();

        this.scene.translate(-3 * Math.cos(45 * Math.PI / 180), -1 * Math.sin(45 * Math.PI / 180), 0);
        this.scene.rotate(45 * Math.PI / 180, 0, 0, 1);
        
		this.matTriangleSmall2.apply();
        this.triangleSmall2.display();
        this.scene.popMatrix();

        // large triangle 1 (blue)
        this.scene.pushMatrix();

        this.scene.translate(0, 2 * Math.sin(-45 * Math.PI / 180), 0);
        this.scene.rotate(-45 * Math.PI / 180, 0, 0, 1);

        this.matTriangleBig1.apply();
        this.triangleBig1.display();
        this.scene.popMatrix();

        // large triangle 2 (orange)
        this.scene.pushMatrix();

        this.scene.translate(0, -2 * Math.sin(135 * Math.PI / 180), 0);
        this.scene.rotate(135 * Math.PI / 180, 0, 0, 1);

        this.matTriangleBig2.apply();
        this.triangleBig2.display();
        this.scene.popMatrix();

		// medium triangle (purple)
		this.scene.pushMatrix();
		this.scene.translate(2* Math.cos(-135 * Math.PI / 180), 0, 0);
		this.scene.rotate(-135 * Math.PI / 180, 0, 0, 1);

		this.matTriangle.apply();
		this.triangle.display();
		this.scene.popMatrix();
    }

    // the console log was warning for these missing functions...
    setPieceColor() {

    }

    updateBuffers() {
        
    }
}
