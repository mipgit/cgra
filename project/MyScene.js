import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFtexture, CGFshader } from "../lib/CGF.js";
import { MySphere } from "./MySphere.js";
import { MyPlane } from "./MyPlane.js";
import { MyGrassField } from "./MyGrassField.js";
import { MyFlowerField } from "./MyFlowerField.js";
import { MyGameController } from "./MyGameController.js";

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

    // Flower patch generation
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
    // Warm centres — gold, amber, deep amber, brown, dark
    const bloomPalette = [
      [240, 195, 45],
      [220, 160, 40],
      [200, 130, 35],
      [140, 90,  30],
      [90,  60,  25],
    ];

    const rand = (lo, hi) => lo + Math.random() * (hi - lo);
    const randi = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    // Each flower derives stem / petal / bloom / leaf from one baseSize using species ratios,
    // so a flower's parts stay proportional. baseSize stays close to grass tip height (~0.53)
    // so blooms peek just above the canopy.
    const jitterPct = (pct) => 1.0 + (Math.random() - 0.5) * 2 * pct;

    const makeFlower = (pcx, pcz, spread, species) => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * spread;

      const baseSize    = rand(species.baseSizeLo, species.baseSizeHi);
      const stemHeight  = baseSize * jitterPct(0.06);                   // ±6 %
      const petalScale  = baseSize * species.petalRatio * jitterPct(0.08);
      const bloomRadius = petalScale * species.bloomRatio * jitterPct(0.08);
      const leafScale   = baseSize * species.leafRatio  * jitterPct(0.10);

      // Pick one of the patch's 2–4 petal hues so a colony shows variety but stays coherent
      const baseHue = species.petalHues[Math.floor(Math.random() * species.petalHues.length)];
      const jitter = () => clamp(Math.round((Math.random() - 0.5) * 22), -50, 50);
      const petalColor = baseHue.map(c => clamp(c + jitter(), 150, 255));
      const baseBloom = species.bloomHues[Math.floor(Math.random() * species.bloomHues.length)];
      const bloomColor = baseBloom.map(c => clamp(c + (Math.random() - 0.5) * 22, 30, 255));

      const ringCount = (Math.random() < species.doubleRingChance) ? 2 : 1;

      const sp = species.petalProfile;
      const qStep = 0.02;
      const q = (v) => Math.round(v / qStep) * qStep;
      const petalProfile = {
          widthAmp:   q(sp.widthAmp   * (1.0 + (Math.random() - 0.5) * 0.16)),
          widthPow:   q(sp.widthPow   * (1.0 + (Math.random() - 0.5) * 0.14)),
          widthShape: sp.widthShape,
          cupAmp:     q(sp.cupAmp     + (Math.random() - 0.5) * 0.06),
          curlAmount: q(sp.curlAmount + (Math.random() - 0.5) * 0.06),
      };

      return {
        x:        pcx + Math.cos(angle) * r,
        z:        pcz + Math.sin(angle) * r,
        rot:      Math.random() * Math.PI * 2,
        tiltX:    (Math.random() - 0.5) * 0.4,
        tiltZ:    (Math.random() - 0.5) * 0.4,
        speciesId:    species.id,
        petalProfile,
        params: {
          stemHeight,
          leafCount:   randi(2, 4),
          leafHeight:  rand(0.25, 0.55),
          leafScale,
          leafSpread:  rand(0.4, 0.9),
          bloomRadius,
          bloomFlatness: rand(0.35, 0.55),
          bloomColor,
          petalCount:  randi(species.petalCountLo, species.petalCountHi),
          petalScale,
          petalTilt:   rand(species.petalTiltLo, species.petalTiltHi),
          petalColor,
          ringCount,
        },
      };
    };

    // Three archetypes; each patch picks 2–4 petal hues + 1–2 bloom hues for variety.
    const pickHues = (palette, lo, hi) => {
      const n = randi(lo, hi);
      const pool = palette.slice();
      const out = [];
      for (let i = 0; i < n && pool.length; i++)
        out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      return out;
    };
    const makeSpecies = () => {
      const archetype = Math.random();
      const petalHues = pickHues(pastelPalette, 2, 4);
      const bloomHues = pickHues(bloomPalette, 1, 2);
      if (archetype < 0.4) {
        // Daisy-like — narrow pointed petals
        return { id: 'daisy', petalHues, bloomHues,
          petalProfile: { widthAmp: 0.28, widthPow: 1.30, widthShape: 0.55, cupAmp: 0.05, curlAmount: 0.02 },
          baseSizeLo: 0.65, baseSizeHi: 0.90,
          petalRatio: 0.38, bloomRatio: 0.30, leafRatio: 0.50,
          petalCountLo: 10, petalCountHi: 14,
          petalTiltLo: 0.18, petalTiltHi: 0.36,
          doubleRingChance: 0.15 };
      } else if (archetype < 0.75) {
        // Lush bloom — wide round petals, slight cup
        return { id: 'lush', petalHues, bloomHues,
          petalProfile: { widthAmp: 0.42, widthPow: 0.70, widthShape: 0.85, cupAmp: 0.18, curlAmount: 0.06 },
          baseSizeLo: 0.80, baseSizeHi: 1.15,
          petalRatio: 0.46, bloomRatio: 0.32, leafRatio: 0.56,
          petalCountLo: 7, petalCountHi: 10,
          petalTiltLo: 0.30, petalTiltHi: 0.50,
          doubleRingChance: 0.30 };
      } else {
        // Tulip-like — cupped petals that curl forward (negative curlAmount)
        return { id: 'tulip', petalHues, bloomHues,
          petalProfile: { widthAmp: 0.34, widthPow: 1.00, widthShape: 0.70, cupAmp: 0.28, curlAmount: -0.04 },
          baseSizeLo: 0.75, baseSizeHi: 1.05,
          petalRatio: 0.42, bloomRatio: 0.0, leafRatio: 0.52,
          petalCountLo: 5, petalCountHi: 8,
          petalTiltLo: 0.55, petalTiltHi: 0.80,
          doubleRingChance: 0.10 };
      }
    };

    // True when (x, z) falls on the dirt path — same sin-wave centerline the terrain
    // fragment shader uses, so we can avoid placing grass/flowers on the track.
    const pw = this.pathWidth, pa = this.pathWaveAmplitude, pf = this.pathWaveFrequency;
    const onPath = (x, z) => {
      const u = (x + 100) / 200;
      const v = (z + 100) / 200;
      return Math.abs(v - (0.5 + Math.sin(u * pf) * pa)) < pw;
    };
    // Expose for the game controller so spawned rocks/bales/barn dodge the road
    this.onPath = onPath;

    // Density falloff: full density inside DETAIL_FULL, thins down to a minimum density
    // at the meadow edge so the whole terrain stays covered without ever going bare.
    const DETAIL_FULL = 60, DETAIL_EDGE = 110, MIN_DENSITY = 0.35;
    const tooFar = (x, z) => {
      const d = Math.sqrt(x*x + z*z);
      if (d <= DETAIL_FULL) return false;
      const t = Math.min(1, (d - DETAIL_FULL) / (DETAIL_EDGE - DETAIL_FULL));
      const density = 1.0 - t * (1.0 - MIN_DENSITY);
      return Math.random() > density;
    };

    this.flowerInstances = [];

    // Center patch — denser, one deliberate species (only if the centre isn't on the path)
    if (!onPath(0, 0)) {
      const sp = makeSpecies();
      for (let f = 0; f < randi(10, 14); f++) {
        const fl = makeFlower(0, 0, 2.5, sp);
        if (!onPath(fl.x, fl.z) && !tooFar(fl.x, fl.z)) this.flowerInstances.push(fl);
      }
    }

    // Scattered patches across the full meadow extent
    const patchCount = 90;
    for (let p = 0; p < patchCount; p++) {
      const pcx = rand(-DETAIL_EDGE, DETAIL_EDGE);
      const pcz = rand(-DETAIL_EDGE, DETAIL_EDGE);
      if (onPath(pcx, pcz) || tooFar(pcx, pcz)) continue;
      const sp  = makeSpecies();
      const flowersInPatch = randi(10, 22);
      for (let f = 0; f < flowersInPatch; f++) {
        const fl = makeFlower(pcx, pcz, rand(3.0, 5.5), sp);
        if (!onPath(fl.x, fl.z) && !tooFar(fl.x, fl.z)) this.flowerInstances.push(fl);
      }
    }

    this.grassShader = new CGFshader(this.gl, "shaders/grass.vert", "shaders/grass.frag");
    this.grassShader.setUniformsValues({
        uColor: [0.2, 0.6, 0.15, 1.0],
        uWindStrength: 0.08,
        uWindSpeed: 1.5,
        uTime: 0.0,
        uHeightmap: 1,
        uHeightScale: 7.0,
    });

    // Flower shader — one shader for the whole batched flower mesh, wind sway like grass
    this.flowerShader = new CGFshader(this.gl, "shaders/flower.vert", "shaders/flower.frag");
    this.flowerShader.setUniformsValues({
        uWindStrength: 0.08,
        uWindSpeed: 1.5,
        uTime: 0.0,
        uPetalTex: 0,
        uHeightmap: 1,
        uHeightScale: 7.0,
    });
    this.petalTexture = new CGFtexture(this, "textures/petal.png");

    this.deadGrassShader = new CGFshader(this.gl, "shaders/grass.vert", "shaders/grass.frag");
    this.deadGrassShader.setUniformsValues({
        uColor: [0.52, 0.42, 0.14, 1.0],
        uWindStrength: 0.04,
        uWindSpeed: 0.8,
        uTime: 0.0,
        uHeightmap: 1,
        uHeightScale: 7.0,
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

    // Bake flowers into batched fields — 40 per chunk keeps each under the Uint16 limit
    const FLOWER_CHUNK = 40;
    this.flowerFields = [];
    for (let i = 0; i < this.flowerInstances.length; i += FLOWER_CHUNK)
        this.flowerFields.push(new MyFlowerField(this, this.flowerInstances.slice(i, i + FLOWER_CHUNK)));

    // Green grass — covers the full meadow extent; tooFar() thins density toward the edge
    const greenPositions = [];
    const gridStep = 2;
    for (let gx = -DETAIL_EDGE; gx <= DETAIL_EDGE; gx += gridStep) {
        for (let gz = -DETAIL_EDGE; gz <= DETAIL_EDGE; gz += gridStep) {
            const cx = gx + (Math.random() - 0.5) * gridStep * 0.6;
            const cz = gz + (Math.random() - 0.5) * gridStep * 0.6;
            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.sqrt(Math.random()) * 2.2;
                const x = cx + Math.cos(angle) * r;
                const z = cz + Math.sin(angle) * r;
                if (onPath(x, z) || tooFar(x, z)) continue;
                greenPositions.push({
                    x, z,
                    rot: Math.random() * Math.PI * 2,
                    tilt: (Math.random() - 0.5) * 0.4,
                    scale: 0.18 + Math.random() * 0.2,
                });
            }
        }
    }
    this.grassFields = makeFields(greenPositions);

    // Dead grass — sparse scattered patches, same path + distance filters
    const deadPositions = [];
    for (let i = 0; i < 18; i++) {
        const pcx = (Math.random() - 0.5) * 2 * DETAIL_EDGE;
        const pcz = (Math.random() - 0.5) * 2 * DETAIL_EDGE;
        if (onPath(pcx, pcz) || tooFar(pcx, pcz)) continue;
        const count = 25 + Math.floor(Math.random() * 30);
        for (let j = 0; j < count; j++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 3.5;
            const x = pcx + Math.cos(angle) * r;
            const z = pcz + Math.sin(angle) * r;
            if (onPath(x, z) || tooFar(x, z)) continue;
            deadPositions.push({
                x, z,
                rot: Math.random() * Math.PI * 2,
                tilt: (Math.random() - 0.5) * 0.6,
                scale: 0.18 + Math.random() * 0.22,
            });
        }
    }
    this.deadGrassFields = makeFields(deadPositions);

    //Objects connected to MyInterface
    this.displayAxis = true;

    // Game controller (wagon + input + state). Must come last so the
    // heightmap URL matches the textures path used above.
    this.controller = new MyGameController(this, {
      heightScale: 7.0,
      terrainHalfExtent: 100.0,
      heightmapUrl: 'textures/heightmap.png',
    });
    this.setUpdatePeriod(1000 / 60);
    this._lastT = null;
  }

  update(t) {
    if (this._lastT == null) { this._lastT = t; return; }
    const dt = Math.min(0.1, (t - this._lastT) / 1000);
    this._lastT = t;
    if (this.controller) this.controller.update(dt);
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

    
 
    
    this.popMatrix();   // pops the terrain matrix

    // Grass — sample the same heightmap as the terrain so blades sit on the displaced ground
    const now = performance.now() / 1000.0;
    this.heightmapTexture.bind(1);
    this.gl.disable(this.gl.CULL_FACE);
    this.setActiveShader(this.grassShader);
    this.grassShader.setUniformsValues({ uTime: now });
    for (const f of this.grassFields) f.display();
    this.setActiveShader(this.deadGrassShader);
    this.deadGrassShader.setUniformsValues({ uTime: now });
    for (const f of this.deadGrassFields) f.display();
    this.setActiveShader(this.defaultShader);
    this.gl.enable(this.gl.CULL_FACE);

    // Flowers — one draw call per batched field, wind sway in shader matches the grass
    this.gl.disable(this.gl.CULL_FACE);
    this.setActiveShader(this.flowerShader);
    this.petalTexture.bind(0);
    this.heightmapTexture.bind(1);
    this.flowerShader.setUniformsValues({ uTime: now });
    for (const f of this.flowerFields) f.display();
    this.setActiveShader(this.defaultShader);
    this.gl.enable(this.gl.CULL_FACE);

    // Game controller (wagon for now; bales/rocks/barn/arrows later)
    if (this.controller) {
      this.setActiveShader(this.defaultShader);
      this.controller.display();
    }

    // ---- END Primitive drawing section
  }
}
