import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFtexture, CGFshader } from "../lib/CGF.js";
import { MySphere } from "./MySphere.js";
import { MyPlane } from "./MyPlane.js";
import { MyGrassField } from "./MyGrassField.js";
import { MyFlower } from "./MyFlower.js";

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


    this.floor = new MyPlane(this, 10);
    this.flower = new MyFlower(this);   // single shared instance, reused for all patches

    // ── Flower patch generation ──────────────────────────────────────
    const pastelPalette = [
      [255, 182, 193], // pink
      [230, 190, 255], // lavender
      [255, 218, 185], // peach
      [255, 255, 180], // pale yellow
      [180, 255, 210], // mint
      [200, 162, 200], // lilac
      [173, 216, 230], // sky blue
      [255, 200, 210], // rose
      [255, 240, 180], // cream
      [210, 245, 205], // pale green
    ];

    const rand = (lo, hi) => lo + Math.random() * (hi - lo);
    const randi = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    // grass roots at world Y=0, tips at Y≈0.25–0.53
    // flowers root at Y=0 too; stemHeight 0.22–0.48 puts bloom right at grass tip level
    const makeFlower = (pcx, pcz, spread = 3.0) => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * spread;
      const petalScale = rand(0.20, 0.50);
      const bloomRadius = rand(petalScale / 8, petalScale / 3);
      // each flower picks its own colour — mixed species within a patch
      const col = pastelPalette[Math.floor(Math.random() * pastelPalette.length)];
      const jitter = () => clamp(Math.round((Math.random() - 0.5) * 25), -50, 50);
      const petalColor = col.map(c => clamp(c + jitter(), 155, 255));
      return {
        x:   pcx + Math.cos(angle) * r,
        z:   pcz + Math.sin(angle) * r,
        rot: Math.random() * Math.PI * 2,
        params: {
          stemHeight:  rand(0.2, 0.6),   // bloom at Y 0.22–0.48, grass tip level
          leafCount:   randi(1, 4),
          leafHeight:  rand(0.2, 0.4),
          leafScale:   rand(0.3, 0.7),
          leafSpread:  rand(0.3, 0.9),
          bloomRadius,
          petalCount:  randi(6, 12),
          petalScale,
          petalTilt:   rand(0.3, 0.5),
          petalColor,
        },
      };
    };

    this.flowerInstances = [];

    // Center patch — always present, denser
    for (let f = 0; f < randi(12, 18); f++)
      this.flowerInstances.push(makeFlower(0, 0, 2.2));

    // Scattered patches across the field
    const patchCount = 28;
    for (let p = 0; p < patchCount; p++) {
      const pcx = rand(-55, 55);
      const pcz = rand(-55, 55);
      const flowersInPatch = randi(8, 16);
      for (let f = 0; f < flowersInPatch; f++)
        this.flowerInstances.push(makeFlower(pcx, pcz, 3.5));
    }

    this.grassShader = new CGFshader(this.gl, "shaders/grass.vert", "shaders/grass.frag");
    this.grassShader.setUniformsValues({
        uColor: [0.2, 0.6, 0.15, 1.0],
        uWindStrength: 0.08,
        uWindSpeed: 1.5,
        uTime: 0.0,
    });

    this.deadGrassShader = new CGFshader(this.gl, "shaders/grass.vert", "shaders/grass.frag");
    this.deadGrassShader.setUniformsValues({
        uColor: [0.52, 0.42, 0.14, 1.0],
        uWindStrength: 0.04,
        uWindSpeed: 0.8,
        uTime: 0.0,
    });

    this.windStrength = 0.08;
    this.windSpeed = 1.5;

    // Helper: split a positions array into MyGrassField chunks (max 4000/chunk for Uint16 safety)
    const makeFields = (positions) => {
        const CHUNK = 4000;
        const fields = [];
        for (let i = 0; i < positions.length; i += CHUNK)
            fields.push(new MyGrassField(this, positions.slice(i, i + CHUNK)));
        return fields;
    };

    // Green grass — dense, full world coverage
    const greenPositions = [];
    const gridStep = 1;
    const gridRange = 50;
    for (let gx = -gridRange; gx <= gridRange; gx += gridStep) {
        for (let gz = -gridRange; gz <= gridRange; gz += gridStep) {
            const cx = gx + (Math.random() - 0.5) * gridStep * 0.6;
            const cz = gz + (Math.random() - 0.5) * gridStep * 0.6;
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.sqrt(Math.random()) * 2.2;
                greenPositions.push({
                    x: cx + Math.cos(angle) * r,
                    z: cz + Math.sin(angle) * r,
                    rot: Math.random() * Math.PI * 2,
                    tilt: (Math.random() - 0.5) * 0.4,
                    scale: 0.18 + Math.random() * 0.2,
                });
            }
        }
    }
    this.grassFields = makeFields(greenPositions);

    // Dead grass — sparse scattered patches
    const deadPositions = [];
    for (let i = 0; i < 18; i++) {
        const pcx = (Math.random() - 0.5) * 70;
        const pcz = (Math.random() - 0.5) * 70;
        const count = 25 + Math.floor(Math.random() * 30);
        for (let j = 0; j < count; j++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 3.5;
            deadPositions.push({
                x: pcx + Math.cos(angle) * r,
                z: pcz + Math.sin(angle) * r,
                rot: Math.random() * Math.PI * 2,
                tilt: (Math.random() - 0.5) * 0.6,
                scale: 0.18 + Math.random() * 0.22,
            });
        }
    }
    this.deadGrassFields = makeFields(deadPositions);

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
    this.skyAppearance.setTexture(this.textures[this.selectedTexture]);
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


    this.pushMatrix();
    this.rotate(-Math.PI / 2, 1, 0, 0);
    this.translate(0, 0, -0.5);
    this.scale(80, 80, 1);
    this.floorAppearance.apply();
    this.floor.display();
    this.popMatrix();

    // Grass
    const now = performance.now() / 1000.0;
    this.gl.disable(this.gl.CULL_FACE);
    this.setActiveShader(this.grassShader);
    this.grassShader.setUniformsValues({ uTime: now });
    for (const f of this.grassFields) f.display();
    this.setActiveShader(this.deadGrassShader);
    this.deadGrassShader.setUniformsValues({ uTime: now });
    for (const f of this.deadGrassFields) f.display();
    this.setActiveShader(this.defaultShader);
    this.gl.enable(this.gl.CULL_FACE);

    // Flower patches
    this.gl.disable(this.gl.CULL_FACE);
    for (const inst of this.flowerInstances) {
      this.pushMatrix();
      this.translate(inst.x, -0.5, inst.z);
      this.rotate(inst.rot, 0, 1, 0);
      this.flower.display(inst.params);
      this.popMatrix();
    }
    this.gl.enable(this.gl.CULL_FACE);

    // ---- END Primitive drawing section
  }
}
