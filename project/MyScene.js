import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFtexture, CGFshader } from "../lib/CGF.js";
import { MySphere } from "./MySphere.js";
import { MyPlane } from "./MyPlane.js";
import { MyGrass } from "./MyGrass.js";

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
    this.sphere = new MySphere(this, 50, 50);
    this.terrain = new MyPlane(this, 100);
    
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
    this.sunAppearance.setEmission(2.0, 1.8, 1.2, 1.0);
    this.sunAppearance.setDiffuse(0, 0, 0, 1);
    this.sunAppearance.setAmbient(0, 0, 0, 1);
    this.sunAppearance.setSpecular(0, 0, 0, 1);

    // coordinates for the just_blue
    this.sunU = 4919 / 8192;
    this.sunV = 1387 / 4096;

    // terrain shaders
    this.terrainShader = new CGFshader(this.gl, "shaders/terrain.vert", "shaders/terrain.frag");
    this.heightmapTexture = new CGFtexture(this, "textures/heightmap.png");
    this.pathTexture = new CGFtexture(this, "textures/path.jpg");
    this.terrainShader.setUniformsValues({ uSampler2: 1 });
    this.terrainShader.setUniformsValues({ uPathTexture: 3 });
    this.terrainShader.setUniformsValues({ uHeightScale: 7.0 });
    this.terrainShader.setUniformsValues({ uTexelSize: [1.0 / 1024.0, 1.0 / 1024.0] });
    
    // Dirt path 
    this.pathWidth = 0.06;
    this.pathWaveAmplitude = 0.12;
    this.pathWaveFrequency = 4.0;
    this.terrainShader.setUniformsValues({
      uPathWidth: this.pathWidth,
      uPathWaveAmplitude: this.pathWaveAmplitude,
      uPathWaveFrequency: this.pathWaveFrequency
    });

    // terrain appearance
    this.terrainAppearance = new CGFappearance(this);
    this.terrainAppearance.setAmbient(0.3, 0.3, 0.3, 1);
    this.terrainAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.terrainAppearance.setSpecular(0, 0, 0, 1);
    this.terrainAppearance.setEmission(0, 0, 0, 1);
    this.terrainAppearance.setShininess(10);
    this.terrainTexture = new CGFtexture(this, "textures/just_green.jpeg");
    this.terrainAppearance.setTexture(this.terrainTexture);
    this.terrainAppearance.setTextureWrap('REPEAT', 'REPEAT');

    this.floor = new MyPlane(this, 10);

    this.grass = new MyGrass(this);
    this.pinkGrassAppearance = new CGFappearance(this);
    this.pinkGrassAppearance.setAmbient(0.9, 0.4, 0.6, 1);
    this.pinkGrassAppearance.setDiffuse(1.0, 0.5, 0.7, 1);
    this.pinkGrassAppearance.setSpecular(0, 0, 0, 1);
    this.pinkGrassAppearance.setEmission(0, 0, 0, 1);
    this.pinkGrassAppearance.setShininess(5);

    this.floorAppearance = new CGFappearance(this);
    this.floorAppearance.setAmbient(0.2, 0.6, 0.2, 1);
    this.floorAppearance.setDiffuse(0.3, 0.7, 0.3, 1);
    this.floorAppearance.setSpecular(0, 0, 0, 1);
    this.floorAppearance.setEmission(0, 0, 0, 1);
    this.floorAppearance.setShininess(5);


    //Objects connected to MyInterface
    this.displayAxis = true;
  }

  initLights() {
    // Sun light
    this.lights[0].setPosition(0, 0, 0, 1);
    this.lights[0].setAmbient(1.0, 1.0, 1.0, 1.0);  
    this.lights[0].setDiffuse(2.0, 2.0, 2.0, 1.0);  // talvez diminuir
    this.lights[0].setSpecular(1.5, 1.5, 1.425, 1.0);
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
    this.scale(100, 100, 100);
    // Disable culling to see both sides
    this.gl.disable(this.gl.CULL_FACE);
    this.skyAppearance.apply();
    this.sphere.display();
    // Re-enable culling
    this.gl.enable(this.gl.CULL_FACE);
    this.popMatrix();

    this.setActiveShader(this.defaultShader);



    // terrain
    this.pushMatrix();
    this.rotate(-Math.PI / 2, 1, 0, 0);  // Make horizontal (X-Z plane)
    //this.translate(0, 0, -0.5);  // Position below camera at y=-0.5
    this.scale(200,200,1);

    // Convert world sun direction to terrain local space (terrain uses Rx(-90deg)).
    const terrainSunDir = [sunDir[0], -sunDir[2], sunDir[1]];
    this.setActiveShader(this.terrainShader);
    this.terrainShader.setUniformsValues({ uSunDir: terrainSunDir });
    this.heightmapTexture.bind(1); // must match uSampler2 = 1
    this.pathTexture.bind(3); // must match uPathTexture = 3

    this.terrainAppearance.apply();
    this.terrain.display();

    this.setActiveShader(this.defaultShader);

    
 
    
    this.pushMatrix();
    this.rotate(-Math.PI / 2, 1, 0, 0);
    this.translate(0, 0, -0.5);
    this.scale(80, 80, 1);
    this.floorAppearance.apply();
    this.floor.display();
    this.popMatrix();

    // Pink grass piece sitting on the floor
    this.pushMatrix();
    this.translate(0, -0.5, 0);
    this.pinkGrassAppearance.apply();
    this.grass.display();

    this.popMatrix();

    // ---- END Primitive drawing section
  }
}
