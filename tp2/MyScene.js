import { CGFscene, CGFcamera, CGFaxis } from "../lib/CGF.js";
import { MyDiamond } from "./MyDiamond.js";
import { MyTriangle } from "./MyTriangle.js";
import { MyParallelogram } from "./MyParallelogram.js";
import { MyTriangleSmall } from "./MyTriangleSmall.js";
import { MyTriangleBig } from "./MyTriangleBig.js";

/**
 * MyScene
 * @constructor
 */
export class MyScene extends CGFscene {
  constructor() {
    super();
  }
  init(application) {
    super.init(application);
    
    this.initCameras();
    this.initLights();

    //Background color
    this.gl.clearColor(255.0, 255.0, 255.0, 1.0);

    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    //Initialize scene objects
    this.axis = new CGFaxis(this);

    // Tangram pieces (7 total)
    this.diamond        = new MyDiamond(this);
    this.parallelogram  = new MyParallelogram(this);
    this.triangle       = new MyTriangle(this);
    this.triangleBig1   = new MyTriangleBig(this);
    this.triangleBig2   = new MyTriangleBig(this);
    this.triangleSmall1 = new MyTriangleSmall(this);
    this.triangleSmall2 = new MyTriangleSmall(this);

    //Objects connected to MyInterface
    this.displayAxis        = true;
    this.displayDiamond     = true;
    this.displayParallelogram = true;
    this.displayTriangle    = true;
    this.displayTriangleBig1   = true;
    this.displayTriangleBig2   = true;
    this.displayTriangleSmall1 = true;
    this.displayTriangleSmall2 = true;
    this.scaleFactor = 1;
  }
  initLights() {
    this.lights[0].setPosition(15, 2, 5, 1);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].enable();
    this.lights[0].update();
  }
  initCameras() {
    this.camera = new CGFcamera(
      0.4,
      0.1,
      500,
      vec3.fromValues(15, 15, 15),
      vec3.fromValues(0, 0, 0)
    );
  }
  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }
  display() {
    // ---- BEGIN Background, camera and axis setup
    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();
    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    // Draw axis
    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

    var sca = [
      this.scaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      this.scaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      this.scaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
    ];

    this.multMatrix(sca);

    // ---- BEGIN Primitive drawing section

    // --- Diamond (square) ---
    this.pushMatrix();
    // TODO: position the diamond
    // this.translate(x, y, 0);
    // this.rotate(angle, 0, 0, 1);
    if (this.displayDiamond) this.diamond.display();
    this.popMatrix();

    // --- Parallelogram ---
    this.pushMatrix();
    // TODO: position the parallelogram
    // this.translate(x, y, 0);
    // this.rotate(angle, 0, 0, 1);
    if (this.displayParallelogram) this.parallelogram.display();
    this.popMatrix();

    // --- Medium Triangle ---
    this.pushMatrix();
    // TODO: position the medium triangle
    // this.translate(x, y, 0);
    // this.rotate(angle, 0, 0, 1);
    if (this.displayTriangle) this.triangle.display();
    this.popMatrix();

    // --- Big Triangle 1 ---
    this.pushMatrix();
    // TODO: position big triangle 1
    // this.translate(x, y, 0);
    // this.rotate(angle, 0, 0, 1);
    if (this.displayTriangleBig1) this.triangleBig1.display();
    this.popMatrix();

    // --- Big Triangle 2 ---
    this.pushMatrix();
    // TODO: position big triangle 2
    // this.translate(x, y, 0);
    // this.rotate(angle, 0, 0, 1);
    if (this.displayTriangleBig2) this.triangleBig2.display();
    this.popMatrix();

    // --- Small Triangle 1 ---
    this.pushMatrix();
    // TODO: position small triangle 1
    // this.translate(x, y, 0);
    // this.rotate(angle, 0, 0, 1);
    if (this.displayTriangleSmall1) this.triangleSmall1.display();
    this.popMatrix();

    // --- Small Triangle 2 ---
    this.pushMatrix();
    // TODO: position small triangle 2
    // this.translate(x, y, 0);
    // this.rotate(angle, 0, 0, 1);
    if (this.displayTriangleSmall2) this.triangleSmall2.display();
    this.popMatrix();

    // ---- END Primitive drawing section
  }
}
