import { CGFshader } from '../lib/CGF.js';
import { MyWagon }    from './MyWagon.js';
import { MyRock }     from './MyRock.js';
import { MyHayBale }  from './MyHayBale.js';
import { MyBarn }     from './MyBarn.js';
import { MyPinArrow } from './MyPinArrow.js';

// Owns input, world objects, the per-frame loop, and the draw of everything
// game-related. MyScene only constructs us and forwards update/display.
export class MyGameController {
    constructor(scene, opts = {}) {
        this.scene = scene;

        // ---- Game state ----
        this.state = 'idle'; // 'idle' | 'running' | 'gameover'
        this.score = 0;
        this.elapsed = 0;
        this.balesDelivered = 0;
        this.lastDamage = 0;
        this.lastRestore = 0;
        this.hpDecayPerSec = 1.5;
        this._lastRockHitT = -1;
        this.hp = 100;
        this.maxHp = 100;

        // ---- Input ----
        this.keys = new Set();
        this.prevKeys = new Set();
        this._onKeyDown = (e) => { this.keys.add(e.code); };
        this._onKeyUp   = (e) => { this.keys.delete(e.code); };
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup',   this._onKeyUp);

        // ---- Heightmap sampler (CPU copy of textures/heightmap.png) ----
        this.heightScale = opts.heightScale ?? 7.0;
        this.terrainHalfExtent = opts.terrainHalfExtent ?? 100.0;
        this._hmReady = false;
        this._initHeightmap(opts.heightmapUrl ?? 'textures/heightmap.png');
        this.sampleGroundY = (x, z) => this._sampleGroundY(x, z);

        // ---- Wagon ----
        this.wagon = new MyWagon(scene);
        this.wagon.position[0] = 0;
        this.wagon.position[2] = 0;
        this.wagon.heading = 0;

        // ---- Barn ----
        this.barn = new MyBarn(scene, [15, 0, -8], 5.5);

        // ---- World objects (placed deferred so heightmap can settle Y) ----
        this.rocks = [];
        this.bales = [];
        this._spawnWorld();

        // ---- Pin arrow + its shader (reused for every visible free bale) ----
        this.pinArrow = new MyPinArrow(scene, 16);
        this.pinArrowShader = new CGFshader(scene.gl, 'shaders/pinarrow.vert', 'shaders/pinarrow.frag');
        this.pinArrowShader.setUniformsValues({
            uTime: 0.0,
            uPhase: 0.0,
            uBobAmp: 0.25,
            uBobOmega: 2.8,
            uBaseColor: [1.0, 0.85, 0.20],
            uHiColor:   [1.0, 0.35, 0.10],
        });
    }

    // ---- Heightmap ----
    _initHeightmap(url) {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.width; c.height = img.height;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
            this._hmData = ctx.getImageData(0, 0, img.width, img.height).data;
            this._hmW = img.width; this._hmH = img.height;
            this._hmReady = true;
            // Re-anchor world objects' Y to ground now that we can sample
            this._reseatToGround();
        };
        img.src = url;
    }
    _sampleGroundY(x, z) {
        if (!this._hmReady) return 0;
        const u = (x + this.terrainHalfExtent) / (2 * this.terrainHalfExtent);
        const v = (z + this.terrainHalfExtent) / (2 * this.terrainHalfExtent);
        if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
        const fx = u * (this._hmW - 1), fy = v * (this._hmH - 1);
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const x1 = Math.min(this._hmW - 1, x0 + 1), y1 = Math.min(this._hmH - 1, y0 + 1);
        const tx = fx - x0, ty = fy - y0;
        const lum = (px, py) => {
            const i = (py * this._hmW + px) * 4;
            const d = this._hmData;
            return (0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]) / 255;
        };
        const l00 = lum(x0,y0), l10 = lum(x1,y0), l01 = lum(x0,y1), l11 = lum(x1,y1);
        const l0  = l00 * (1 - tx) + l10 * tx;
        const l1  = l01 * (1 - tx) + l11 * tx;
        return ((l0 * (1 - ty) + l1 * ty) - 0.5) * this.heightScale;
    }
    _reseatToGround() {
        for (const r of this.rocks) r.position[1] = this._sampleGroundY(r.position[0], r.position[2]);
        for (const b of this.bales) if (b.state === 'free') b.position[1] = this._sampleGroundY(b.position[0], b.position[2]);
        this.barn.position[1] = this._sampleGroundY(this.barn.position[0], this.barn.position[2]);
    }

    // ---- Spawning ----
    _spawnWorld() {
        const RANGE = 28;                // half-extent of play area around spawn
        const onPath = this.scene.onPath ?? (() => false);
        const placed = [{ x: 0, z: 0, r: 3 }];                          // wagon spawn buffer
        placed.push({ x: this.barn.position[0], z: this.barn.position[2], r: this.barn.activationRadius + 1 });

        const tryPlace = (minR, maxTries = 40) => {
            for (let t = 0; t < maxTries; t++) {
                const x = (Math.random() * 2 - 1) * RANGE;
                const z = (Math.random() * 2 - 1) * RANGE;
                if (onPath(x, z)) continue;
                let ok = true;
                for (const p of placed) {
                    const dx = x - p.x, dz = z - p.z;
                    if (dx*dx + dz*dz < (minR + p.r) * (minR + p.r)) { ok = false; break; }
                }
                if (ok) { placed.push({ x, z, r: minR }); return [x, z]; }
            }
            return null;
        };

        // Bales
        const baleCount = 8;
        for (let i = 0; i < baleCount; i++) {
            const p = tryPlace(1.5);
            if (!p) continue;
            this.bales.push(new MyHayBale(this.scene, [p[0], 0, p[1]]));
        }
    }

    _pressed(code) { return this.keys.has(code) && !this.prevKeys.has(code); }

    // ---- Per-frame ----
    update(dt) {
        if (this.state === 'idle' && this.keys.size > 0) this.state = 'running';
        if (this.state === 'gameover' && this._pressed('KeyR')) this._reset();

        if (this.state === 'running') {
            // Driving input
            const throttling = this.keys.has('KeyW') || this.keys.has('KeyS');
            if (this.keys.has('KeyW')) this.wagon.accelerate(dt);
            if (this.keys.has('KeyS')) this.wagon.brake(dt);
            if (!throttling) this.wagon.coast(dt);
            let target = 0;
            if (this.keys.has('KeyA')) target += this.wagon.maxSteer;
            if (this.keys.has('KeyD')) target -= this.wagon.maxSteer;
            this.wagon.setSteeringTarget(target);

            this.wagon.hp = Math.max(0, this.wagon.hp - this.hpDecayPerSec * dt);
            this.elapsed += dt;
            this.score = Math.floor(this.elapsed);
        }

        // Wagon integrates physics regardless of state (settles after gameover)
        this.wagon.update(dt, this.sampleGroundY);

        if (this.state === 'running') {
            this._handleRockCollisions();
            this._handlePickupDrop();
            this._handleDelivery();
            if (this.wagon.hp <= 0) this.state = 'gameover';
        }

        // Carried bales follow the wagon every frame so they don't pop
        let slot = 0;
        for (const b of this.wagon.bales) { b.followWagon(this.wagon, slot++); }

        this.prevKeys = new Set(this.keys);
        this.hp = this.wagon.hp;
        this._syncHUD();
    }

    _syncHUD() {
        // Defensive: don't crash if DOM isn't ready yet
        const scoreEl = document.getElementById('hud-score');
        const hpText  = document.getElementById('hud-hp-text');
        const hpBar   = document.getElementById('hud-hp-bar');
        const baleEl  = document.getElementById('hud-bales');
        const idle    = document.getElementById('idle-hint');
        const over    = document.getElementById('gameover-overlay');

        if (scoreEl) scoreEl.textContent = this.score;
        if (hpText)  hpText.textContent  = Math.ceil(this.wagon.hp);
        if (hpBar)   hpBar.style.transform = `scaleX(${Math.max(0, this.wagon.hp / this.wagon.maxHp)})`;
        if (baleEl)  baleEl.textContent = this.balesDelivered;

        if (idle) {
            idle.classList.toggle('visible', this.state === 'idle');
        }
        if (over) {
            over.classList.toggle('visible', this.state === 'gameover');
        }
    }

    _handleRockCollisions() {
        const w = this.wagon;
        const half = w.bodySize.x * 0.5;

        // Helper genérico para aplicar dano/colisão
        const applyCollision = (objX, objZ, objRadius) => {
            const dx = w.position[0] - objX;
            const dz = w.position[2] - objZ;
            const d2 = dx*dx + dz*dz;
            const r = objRadius + half;
            
            if (d2 >= r * r) return; // Não bateu

            // Sofre Dano
            if (this.elapsed - this._lastRockHitT > 0.4) {
                w.hp = Math.max(0, w.hp - 10);
                this.lastDamage = this.score;
                this._lastRockHitT = this.elapsed;
            }
            // Afasta fisicamente o carro
            const d = Math.sqrt(d2) || 0.0001;
            const push = (r - d) + 0.04;
            w.position[0] += (dx / d) * push;
            w.position[2] += (dz / d) * push;
            w.speed *= 0.3;
        };

        // Verifica colisão com todas as Pedras geradas na cena
        // Multiplicamos o scale por 1.2 porque as pedras são largas
        for (const rock of this.scene.rockInstances) {
            applyCollision(rock.x, rock.z, rock.scale * 1.2);
        }

        // Verifica colisão com todas as Árvores geradas na cena
        // Multiplicamos o scale por 0.4 porque apenas o tronco tem colisão
        for (const tree of this.scene.treeInstances) {
            applyCollision(tree.x, tree.z, tree.scale * 0.4);
        }
    }

    _handlePickupDrop() {
        const w = this.wagon;

        // Pickup: nearest free bale within range, only if there's room
        if (this._pressed('KeyP') && w.bales.length < 2) {
            let nearest = null, nearestD2 = Infinity;
            for (const b of this.bales) {
                if (b.state !== 'free') continue;
                const dx = b.position[0] - w.position[0];
                const dz = b.position[2] - w.position[2];
                const d2 = dx*dx + dz*dz;
                const range = (b.radius + w.bodySize.z * 0.5 + 0.2);
                if (d2 < range * range && d2 < nearestD2) { nearest = b; nearestD2 = d2; }
            }
            if (nearest) {
                nearest.state = 'carried';
                w.bales.push(nearest);
            }
        }

        // Drop: pop the most-recently picked bale, place behind the wagon
        if (this._pressed('KeyL') && w.bales.length > 0) {
            const b = w.bales.pop();
            b.state = 'free';
            // Drop just behind the wagon (opposite heading), snapped to ground
            const back = -(w.bodySize.z * 0.6);
            const bx = w.position[0] + Math.sin(w.heading) * back;
            const bz = w.position[2] + Math.cos(w.heading) * back;
            b.position[0] = bx;
            b.position[2] = bz;
            b.position[1] = this._sampleGroundY(bx, bz);
            b.heading = w.heading;
        }
    }

    _handleDelivery() {
        const w = this.wagon;
        const dx = w.position[0] - this.barn.position[0];
        const dz = w.position[2] - this.barn.position[2];
        const inZone = (dx*dx + dz*dz) < (this.barn.activationRadius * this.barn.activationRadius);
        this.barn.isActive = inZone;
        if (inZone && w.bales.length > 0) {
            for (const b of w.bales) { b.state = 'delivered'; }
            this.balesDelivered += w.bales.length;
            w.bales.length = 0;
            // Restore some HP per delivery batch
            w.hp = Math.min(w.maxHp, w.hp + 15);
            this.lastRestore = this.score;
        }
    }

    _reset() {
        this.wagon.position = [0, 0, 0];
        this.wagon.heading = 0;
        this.wagon.steering = 0;
        this.wagon.steeringTarget = 0;
        this.wagon.speed = 0;
        this.wagon.hp = this.wagon.maxHp;
        this.hp = this.wagon.maxHp;
        this.wagon.bales = [];
        this.score = 0;
        this.elapsed = 0;
        this.balesDelivered = 0;
        this.lastDamage = 0;
        this.lastRestore = 0;
        this._lastRockHitT = -1;
        for (const b of this.bales) { b.state = 'free'; }
        this._reseatToGround();
        this.state = 'running';
    }

    // ---- Drawing ----
    display() {
        const s = this.scene;

        // Standard-shaded world objects
        s.setActiveShader(s.defaultShader);
        for (const b of this.bales) b.display();
        this.barn.display();
        this.wagon.display();

        // Pin arrows above visible free bales (custom shader, no culling because
        // the cone is shaded purely on emission and we don't care about backfaces)
        const now = performance.now() / 1000;
        s.gl.disable(s.gl.CULL_FACE);
        s.setActiveShader(this.pinArrowShader);
        for (let i = 0; i < this.bales.length; i++) {
            const bale = this.bales[i];
            if (bale.state !== 'free') continue;
            const dx = bale.position[0] - this.wagon.position[0];
            const dz = bale.position[2] - this.wagon.position[2];
            if (dx*dx + dz*dz > 40 * 40) continue; // near-visibility filter
            this.pinArrowShader.setUniformsValues({
                uTime: now,
                uPhase: i * 1.7,
            });
            s.pushMatrix();
            s.translate(bale.position[0], bale.position[1] + 1.8, bale.position[2]);
            s.scale(0.7, 0.9, 0.7);
            this.pinArrow.display();
            s.popMatrix();
        }
        s.setActiveShader(s.defaultShader);
        s.gl.enable(s.gl.CULL_FACE);
    }
}
