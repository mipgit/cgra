import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFtexture, CGFshader } from "../lib/CGF.js";
import { MySphere } from "./MySphere.js";
import { MyPlane } from "./MyPlane.js";

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

    //Enable textures
    this.enableTextures(true);

    //Initialize scene objects
    this.axis = new CGFaxis(this);

    // Sky sphere with texture on inside
    this.sphere = new MySphere(this, 50, 50);
    
    // Load all sky textures
    this.textures = {
      'basic': new CGFtexture(this, "textures/basic.jpg"),
      'farm_road': new CGFtexture(this, "textures/farm_road.jpg"),
      'full_clouds': new CGFtexture(this, "textures/full_clouds.jpg"),
      'just_blue': new CGFtexture(this, "textures/just_blue.jpg")
    };
    
    this.skyShader = new CGFshader(this.gl, "shaders/skyglow.vert", "shaders/skyglow.frag");

    // Sky appearance with texture - using TP5 style settings
    this.skyAppearance = new CGFappearance(this);
    this.skyAppearance.setAmbient(0.3, 0.3, 0.3, 1);
    this.skyAppearance.setDiffuse(0.7, 0.7, 0.7, 1);
    this.skyAppearance.setSpecular(0, 0, 0, 1);
    this.skyAppearance.setEmission(0, 0, 0, 1);
    this.skyAppearance.setShininess(120);
    this.selectedTexture = 'just_blue';
    this.skyAppearance.setTexture(this.textures[this.selectedTexture]);
    this.skyAppearance.setTextureWrap('REPEAT', 'REPEAT');

    // Sun
    this.sunAppearance = new CGFappearance(this);
    this.sunAppearance.setEmission(1.0, 0.9, 0.6, 1.0); 
    this.sunAppearance.setDiffuse(0, 0, 0, 1);
    this.sunAppearance.setAmbient(0, 0, 0, 1);
    this.sunAppearance.setSpecular(0, 0, 0, 1);

    // coordinates for the just_blue
    this.sunU = 4919 / 8192;
    this.sunV = 1387 / 4096;


    // Floor with dirt path in center and grass on sides
    this.grassLeft = new MyPlane(this, 50);
    this.dirtPath = new MyPlane(this, 50);
    this.grassRight = new MyPlane(this, 50);
    
    // Grass appearance
    this.grassAppearance = new CGFappearance(this);
    this.grassAppearance.setAmbient(0.3, 0.3, 0.3, 1);
    this.grassAppearance.setDiffuse(0.7, 0.7, 0.7, 1);
    this.grassAppearance.setSpecular(0, 0, 0, 1);
    this.grassAppearance.setEmission(0, 0, 0, 1);
    this.grassAppearance.setShininess(10);
    this.grassTexture = new CGFtexture(this, "textures/grass.jpg");
    this.grassAppearance.setTexture(this.grassTexture);
    this.grassAppearance.setTextureWrap('REPEAT', 'REPEAT');
    
    // Dirt appearance
    this.dirtAppearance = new CGFappearance(this);
    this.dirtAppearance.setAmbient(0.3, 0.3, 0.3, 1);
    this.dirtAppearance.setDiffuse(0.7, 0.7, 0.7, 1);
    this.dirtAppearance.setSpecular(0, 0, 0, 1);
    this.dirtAppearance.setEmission(0, 0, 0, 1);
    this.dirtAppearance.setShininess(10);
    this.dirtTexture = new CGFtexture(this, "textures/dirt.jpg");
    this.dirtAppearance.setTexture(this.dirtTexture);
    this.dirtAppearance.setTextureWrap('REPEAT', 'REPEAT');

    //Objects connected to MyInterface
    this.displayAxis = true;
  }

  initLights() {
    // Sun light
    this.lights[0].setPosition(0, 0, 0, 1);
    this.lights[0].setAmbient(0.05, 0.05, 0.05, 1.0);
    this.lights[0].setDiffuse(1.0, 1.0, 0.95, 1.0);
    this.lights[0].setSpecular(1.0, 1.0, 0.95, 1.0);
    this.lights[0].setConstantAttenuation(1.0);
    this.lights[0].setLinearAttenuation(0.0);
    this.lights[0].setQuadraticAttenuation(0.0);
    this.lights[0].enable();
    this.lights[0].update();
  }

  initCameras() {
    this.camera = new CGFcamera(
      0.4,
      0.1,
      500,
      vec3.fromValues(0, 0.5, 10),   // Camera at center x=0, z=10, slightly elevated
      vec3.fromValues(0, 0.5, 0)     // Looking at center
    );
  }

  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }

  updateTexture() {
    this.skyAppearance.setTexture('this.textures[this.selectedTexture]');
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

    // sun calculations 
    let theta = this.sunU * 2 * Math.PI;
    let phi = this.sunV * Math.PI;

    // slightly less then skybox scale (20)
    let distance = 39.0;

    let sunX = distance * Math.sin(phi) * Math.cos(theta);
    let sunY = distance * Math.cos(phi);
    let sunZ = distance * Math.sin(phi) * Math.sin(theta);

    let sunDir = vec3.fromValues(sunX, sunY, sunZ);
    vec3.normalize(sunDir, sunDir);

    // sun light
    this.lights[0].setPosition(sunX, sunY, sunZ, 1);
    this.lights[0].update();

    // Draw axis
    if (this.displayAxis) this.axis.display();

    
    // ---- BEGIN Primitive drawing section

    // Sky sphere — centered at 0,0,0 with scale 20
    // shader for sun
    this.setActiveShader(this.skyShader);
    this.skyShader.setUniformsValues({
      uSunDir: [sunDir[0], sunDir[1], sunDir[2]]
    });

    this.pushMatrix();
    this.scale(40, 40, 40);
    // Disable culling to see both sides
    this.gl.disable(this.gl.CULL_FACE);
    this.skyAppearance.apply();
    this.sphere.display();
    // Re-enable culling
    this.gl.enable(this.gl.CULL_FACE);
    this.popMatrix();

    this.setActiveShader(this.defaultShader);


    // Floor - grass on sides, dirt path in center
    // Total width 30: grass(10.5) + dirt(9) + grass(10.5)
    this.pushMatrix();
    this.rotate(-Math.PI / 2, 1, 0, 0);  // Make horizontal (X-Z plane)
    this.translate(0, 0, -0.5);  // Position below camera at y=-0.5
    
    // Left grass strip (35% of width = 10.5 units)
    this.pushMatrix();
    this.translate(-9.75, 0, 0);  // Position on left
    this.scale(10.5, 100, 1);  // Width 10.5, length 100 (long path)
    this.grassAppearance.apply();
    this.grassLeft.display();
    this.popMatrix();
    
    // Center dirt path (30% of width = 9 units)
    this.pushMatrix();
    this.translate(0, 0, 0);  // Center
    this.scale(9, 100, 1);  // Width 9, length 100
    this.dirtAppearance.apply();
    this.dirtPath.display();
    this.popMatrix();
    
    // Right grass strip (35% of width = 10.5 units)
    this.pushMatrix();
    this.translate(9.75, 0, 0);  // Position on right
    this.scale(10.5, 100, 1);  // Width 10.5, length 100
    this.grassAppearance.apply();
    this.grassRight.display();
    this.popMatrix();
    
    this.popMatrix();

    // ---- END Primitive drawing section
  }
}
