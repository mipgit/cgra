import { CGFshader } from '../../lib/CGF.js';
import { MyWagonController } from './MyWagonController.js';
import { MyWagon }    from './MyWagon.js';
import { MyHayBale }  from './MyHayBale.js';
import { MyBarn }     from '../static_elements/barn/MyBarn.js';
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
        this.wagonBoundsRadius = opts.wagonBoundsRadius ?? 95.0;
        this.cameraBoundsRadius = opts.cameraBoundsRadius ?? 98.0;

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
        this.wagonController = new MyWagonController();
        this.wagonController.position[0] = -40;
        this.wagonController.position[2] = -40;
        this.wagonController.heading = -Math.PI/4;
        this._baleBatchSize = 8;
        
        this.wagon = new MyWagon(scene, this.wagonController);

        // ---- Barn ----
        this.barn = new MyBarn(scene, [3, 0, -8], 10, 3.0);
        this.barn.rotation = 7*Math.PI/6;
        this.barn.deliveryCenter = this._barnDeliveryCenter();

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
    _barnLocalToWorld(localX, localY, localZ) {
        const rot = this.barn.rotation;
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);

        return [
            this.barn.position[0] + localX * cosR + localZ * sinR,
            this.barn.position[1] + localY,
            this.barn.position[2] - localX * sinR + localZ * cosR,
        ];
    }
    _barnDeliveryCenter() {
        const deliveryOffset = this.barn.activationRadius + (2.5 * this.barn.scale);
        const [x, , z] = this._barnLocalToWorld(0, 0, deliveryOffset);
        return [x, this._sampleGroundY(x, z), z];
    }
    _barnStoragePosition(index) {
        const xSlots = [-0.8, 0.0, 0.8];
        const zSlots = [-0.5, 0.15];
        const localX = xSlots[index % xSlots.length] * this.barn.scale;
        const localZ = zSlots[Math.floor(index / xSlots.length) % zSlots.length] * this.barn.scale;
        return this._barnLocalToWorld(localX, 0, localZ);
    }
    _constrainWagonToBounds() {
        const w = this.wagonController;
        const x = w.position[0];
        const z = w.position[2];
        const dist = Math.hypot(x, z);

        if (dist <= this.wagonBoundsRadius || dist < 1e-6) {
            return;
        }

        const scale = this.wagonBoundsRadius / dist;
        w.position[0] = x * scale;
        w.position[2] = z * scale;
        w.position[1] = this._sampleGroundY(w.position[0], w.position[2]);
    }
    _constrainCameraToBounds() {
        if (!this.scene.camera) return;

        const cam = this.scene.camera;
        let pos = [...cam.position];
        const target = cam.target;

        // 1. Ground constraint
        const groundY = this._sampleGroundY(pos[0], pos[2]);
        const minHeightAboveGround = 1.0; 
        if (pos[1] < groundY + minHeightAboveGround) {
            pos[1] = groundY + minHeightAboveGround;
        }

        // 2. Sphere constraint
        const posDist = Math.hypot(pos[0], pos[1], pos[2]);
        const targetDist = Math.hypot(target[0], target[1], target[2]);
        const dist = Math.max(posDist, targetDist);

        if (dist > this.cameraBoundsRadius && dist > 1e-6) {
            const scale = this.cameraBoundsRadius / dist;
            pos[0] *= scale;
            pos[1] *= scale;
            pos[2] *= scale;
            cam.setTarget(vec3.fromValues(target[0] * scale, target[1] * scale, target[2] * scale));
        }

        cam.setPosition(vec3.fromValues(pos[0], pos[1], pos[2]));
    }
    _reseatToGround() {
        for (const r of this.rocks) r.position[1] = this._sampleGroundY(r.position[0], r.position[2]);
        for (const b of this.bales) if (b.state === 'free') b.position[1] = this._sampleGroundY(b.position[0], b.position[2]);
        this.barn.position[1] = this._sampleGroundY(this.barn.position[0], this.barn.position[2]);
    }

    _spawnBales(count) {
        const RANGE = 28;
        const onPath = this.scene.onPath ?? (() => false);
        const [deliveryX, , deliveryZ] = this._barnDeliveryCenter();
        const placed = [{ x: 0, z: 0, r: 3 }];
        placed.push({ x: -40, z: -40, r: 8.0 }); // wagon starting position safety zone
        placed.push({ x: this.barn.position[0], z: this.barn.position[2], r: this.barn.activationRadius + 1 });
        placed.push({ x: deliveryX, z: deliveryZ, r: this.barn.activationRadius + 1 });

        for (const bale of this.bales) {
            if (!bale || !bale.position) continue;
            placed.push({ x: bale.position[0], z: bale.position[2], r: bale.radius + 0.2 });
        }

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

        for (let i = 0; i < count; i++) {
            const p = tryPlace(1.5);
            if (!p) continue;
            const bale = new MyHayBale(this.scene, [p[0], 0, p[1]]);
            bale.position[1] = this._sampleGroundY(p[0], p[1]);
            this.bales.push(bale);
        }
    }

    // ---- Spawning ----
    _spawnWorld() {
        this._spawnBales(this._baleBatchSize);
    }

    _pressed(code) { return this.keys.has(code) && !this.prevKeys.has(code); }

    // ---- Per-frame ----
    update(dt) {
        if (this.state === 'idle' && this.keys.size > 0) this.state = 'running';
        if (this.state === 'gameover' && this._pressed('KeyR')) this._reset();

        if (this.state === 'running') {
            // Driving input
            const throttling = this.keys.has('KeyW') || this.keys.has('KeyS');
            if (this.keys.has('KeyW')) this.wagonController.accelerate(dt);
            if (this.keys.has('KeyS')) this.wagonController.brake(dt);
            if (!throttling) this.wagonController.coast(dt);
            let target = 0;
            if (this.keys.has('KeyA')) target += this.wagonController.maxSteeringAngle;
            if (this.keys.has('KeyD')) target -= this.wagonController.maxSteeringAngle;
            this.wagonController.setSteeringTarget(target);

            this.wagonController.hp = Math.max(0, this.wagonController.hp - this.hpDecayPerSec * dt);
            this.elapsed += dt;
            this.score = Math.floor(this.elapsed);
        }

        // Wagon integrates physics regardless of state (settles after gameover)
        this.wagonController.update(dt, this.sampleGroundY, this.scene.onPath);
        this._constrainWagonToBounds();
        this._handleCollisions();

        if (this.state === 'running') {
            // Allow barn delivery to consume the L key press
            const delivered = this._handleDelivery();
            this._handlePickupDrop(delivered);
            
            if (this.wagonController.hp <= 0) this.state = 'gameover';
        }

        // Carried bales follow the wagon every frame so they don't pop
        let slot = 0;
        for (const b of this.wagonController.bales) { b.followWagon(this.wagonController, slot++); }

        this._updateCamera();

        this.prevKeys = new Set(this.keys);
        this.hp = this.wagonController.hp;
        this._syncHUD();
    }

    _updateCamera() {
        if (!this.scene.camera) return;

        const wp = this.wagonController.position;
        const cam = this.scene.camera;

        if (this.scene.selectedCamera === 'Orbit') {
            const tx = wp[0];
            const ty = wp[1] + 3;
            const tz = wp[2];

            const dx = cam.position[0] - cam.target[0];
            const dy = cam.position[1] - cam.target[1];
            const dz = cam.position[2] - cam.target[2];

            cam.setTarget(vec3.fromValues(tx, ty, tz));
            cam.setPosition(vec3.fromValues(tx + dx, ty + dy, tz + dz));
        } else if (this.scene.selectedCamera === 'Wagon') {
            // Camera 2: Improved follow camera that always follows and rotates with the wagon
            const heading = this.wagonController.heading;
            const followDist = 25;
            const followHeight = 5.5;

            // Vector pointing behind the wagon
            const bx = -Math.cos(heading);
            const bz = Math.sin(heading);

            const cx = wp[0] + bx * followDist;
            const cy = wp[1] + followHeight;
            const cz = wp[2] + bz * followDist;

            cam.setPosition(vec3.fromValues(cx, cy, cz));

            // Vector pointing slightly in front of the wagon for the target
            const forwardX = Math.cos(heading);
            const forwardZ = -Math.sin(heading);
            const lookAheadDist = 2;

            const tx = wp[0] + forwardX * lookAheadDist;
            const ty = wp[1] + 3; // slightly above ground level
            const tz = wp[2] + forwardZ * lookAheadDist;
            cam.setTarget(vec3.fromValues(tx, ty, tz));
        }

        this._constrainCameraToBounds();
    }

    _syncHUD() {
        // Defensive: don't crash if DOM isn't ready yet
        const scoreEl = document.getElementById('hud-score');
        const hpText  = document.getElementById('hud-hp-text');
        const hpBar   = document.getElementById('hud-hp-bar');
        const baleEl  = document.getElementById('hud-bales');
        const idle    = document.getElementById('idle-hint');
        const over    = document.getElementById('gameover-overlay');
        const prompt  = document.getElementById('pickup-prompt');
        const dropPrompt = document.getElementById('drop-prompt');

        if (scoreEl) scoreEl.textContent = this.score;
        if (hpText)  hpText.textContent  = Math.ceil(this.wagonController.hp);
        if (hpBar)   hpBar.style.transform = `scaleX(${Math.max(0, this.wagonController.hp / this.wagonController.maxHp)})`;
        if (baleEl)  baleEl.textContent = this.balesDelivered;

        if (idle) {
            idle.classList.toggle('visible', this.state === 'idle');
        }
        if (over) {
            over.classList.toggle('visible', this.state === 'gameover');
        }

        const w = this.wagonController;

        let canDrop = false;
        if (this.state === 'running' && w.bales.length > 0) {
            const [cx, , cz] = this._barnDeliveryCenter();
            const dx = w.position[0] - cx;
            const dz = w.position[2] - cz;
            if ((dx * dx + dz * dz) < (this.barn.activationRadius * this.barn.activationRadius)) {
                canDrop = true;
            }
        }

        if (dropPrompt) {
            dropPrompt.classList.toggle('visible', canDrop);
        }

        if (prompt) {
            let canPickup = false;
            // Only allow pickup prompt if not displaying the drop prompt
            if (this.state === 'running' && w.bales.length < 2 && !canDrop) {
                for (const b of this.bales) {
                    if (b.state !== 'free') continue;
                    const dx = b.position[0] - w.position[0];
                    const dz = b.position[2] - w.position[2];
                    const d2 = dx * dx + dz * dz;
                    const range = (b.radius + w.bodySize.z * 0.5 + 0.2);
                    if (d2 < range * range) {
                        canPickup = true;
                        break;
                    }
                }
            }
            prompt.classList.toggle('visible', canPickup);
        }
    }

    _handleCollisions() {
        const w = this.wagonController;

        // --- Helper: check if a circle collides with the wagon OBB ---
        const checkWagonCollisionWithCircle = (cx, cz, circleR) => {
            const heading = w.heading;
            const dx = cx - w.position[0];
            const dz = cz - w.position[2];

            // Rotate circle center into wagon's local space (using positive heading)
            const cosH = Math.cos(heading);
            const sinH = Math.sin(heading);
            const lx = dx * cosH - dz * sinH;
            const lz = dx * sinH + dz * cosH;

            // Wagon dimensions: length 5.0 (half 2.5), width 2.5 (half 1.25)
            const halfL = 2.5;
            const halfW = 1.25;

            const closestX = Math.max(-halfL, Math.min(halfL, lx));
            const closestZ = Math.max(-halfW, Math.min(halfW, lz));

            const diffX = lx - closestX;
            const diffZ = lz - closestZ;
            const distSq = diffX * diffX + diffZ * diffZ;

            if (distSq >= circleR * circleR) return null;

            let overlap, pushWx, pushWz;
            if (distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                overlap = circleR - dist;
                const localPushX = diffX / dist;
                const localPushZ = diffZ / dist;

                // Rotate push vector back to world space (using heading)
                pushWx = localPushX * cosH + localPushZ * sinH;
                pushWz = -localPushX * sinH + localPushZ * cosH;
            } else {
                const overlapX = halfL - Math.abs(lx);
                const overlapZ = halfW - Math.abs(lz);
                let localPushX = 0, localPushZ = 0;
                if (overlapX < overlapZ) {
                    localPushX = lx >= 0 ? 1 : -1;
                    overlap = overlapX + circleR;
                } else {
                    localPushZ = lz >= 0 ? 1 : -1;
                    overlap = overlapZ + circleR;
                }
                pushWx = localPushX * cosH + localPushZ * sinH;
                pushWz = -localPushX * sinH + localPushZ * cosH;
            }

            return {
                pushX: -pushWx * overlap,
                pushZ: -pushWz * overlap
            };
        };

        // --- Helper: check if a circle collides with the rotated barn OBB ---
        const checkCircleCollisionWithBarn = (circleX, circleZ, circleR) => {
            const rot = this.barn.rotation;
            const dx = circleX - this.barn.position[0];
            const dz = circleZ - this.barn.position[2];

            const cosR = Math.cos(rot);
            const sinR = Math.sin(rot);
            const lx = dx * cosR - dz * sinR;
            const lz = dx * sinR + dz * cosR;

            const halfW = 2.0 * this.barn.scale; // 6.0
            const halfD = 2.5 * this.barn.scale; // 7.5

            const closestX = Math.max(-halfW, Math.min(halfW, lx));
            const closestZ = Math.max(-halfD, Math.min(halfD, lz));

            const diffX = lx - closestX;
            const diffZ = lz - closestZ;
            const distSq = diffX * diffX + diffZ * diffZ;

            if (distSq >= circleR * circleR) return null;

            let overlap, pushLx, pushLz;
            if (distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                overlap = circleR - dist;
                pushLx = diffX / dist;
                pushLz = diffZ / dist;
            } else {
                const overlapX = halfW - Math.abs(lx);
                const overlapZ = halfD - Math.abs(lz);
                if (overlapX < overlapZ) {
                    pushLx = lx >= 0 ? 1 : -1;
                    overlap = overlapX + circleR;
                } else {
                    pushLz = lz >= 0 ? 1 : -1;
                    overlap = overlapZ + circleR;
                }
            }

            const pushWx = pushLx * cosR + pushLz * sinR;
            const pushWz = -pushLx * sinR + pushLz * cosR;

            return {
                pushX: pushWx * overlap,
                pushZ: pushWz * overlap
            };
        };

        // 1. Rock Collisions
        for (const rock of this.scene.rockInstances) {
            const collision = checkWagonCollisionWithCircle(rock.x, rock.z, rock.scale * 0.3);
            if (collision) {
                w.position[0] += collision.pushX;
                w.position[2] += collision.pushZ;
                w.speed *= 0.3;
                if (this.elapsed - this._lastRockHitT > 0.4) {
                    w.hp = Math.max(0, w.hp - 10);
                    this.lastDamage = this.score;
                    this._lastRockHitT = this.elapsed;
                }
            }
        }

        // 2. Tree Collisions
        for (const tree of this.scene.treeInstances) {
            const collision = checkWagonCollisionWithCircle(tree.x, tree.z, tree.scale * 0.4);
            if (collision) {
                w.position[0] += collision.pushX;
                w.position[2] += collision.pushZ;
                w.speed *= 0.3;
            }
        }

        // 3. Barn Collision (Direct OBB vs OBB via Separating Axis Theorem)
        if (this.barn) {
            const rotB = this.barn.rotation;
            const headingW = w.heading;

            // Centers
            const cAx = w.position[0];
            const cAz = w.position[2];
            const cBx = this.barn.position[0];
            const cBz = this.barn.position[2];

            // Distance vector T from A (Wagon) to B (Barn)
            const Tx = cBx - cAx;
            const Tz = cBz - cAz;

            // Box A (Wagon) local axes in world space
            const U0Ax = Math.cos(headingW);
            const U0Az = -Math.sin(headingW);
            const U1Ax = Math.sin(headingW);
            const U1Az = Math.cos(headingW);

            const e0A = 2.5;  // Wagon half-length (local X)
            const e1A = 1.25; // Wagon half-width (local Z)

            // Box B (Barn) local axes in world space
            const U0Bx = Math.cos(rotB);
            const U0Bz = -Math.sin(rotB);
            const U1Bx = Math.sin(rotB);
            const U1Bz = Math.cos(rotB);

            const e0B = 2.0 * this.barn.scale; // Barn half-width (local X) = 6.0
            const e1B = 2.5 * this.barn.scale; // Barn half-depth (local Z) = 7.5

            // The 4 candidate separating axes to test
            const axes = [
                { x: U0Ax, z: U0Az },
                { x: U1Ax, z: U1Az },
                { x: U0Bx, z: U0Bz },
                { x: U1Bx, z: U1Bz }
            ];

            let minOverlap = Infinity;
            let bestAxis = null;
            let collided = true;

            for (const axis of axes) {
                const len = Math.hypot(axis.x, axis.z);
                if (len < 1e-5) continue;
                const Lx = axis.x / len;
                const Lz = axis.z / len;

                // Project center distance onto separating axis L
                const D = Math.abs(Tx * Lx + Tz * Lz);

                // Project Box A (Wagon) radius onto separating axis L
                const RA = e0A * Math.abs(U0Ax * Lx + U0Az * Lz) + e1A * Math.abs(U1Ax * Lx + U1Az * Lz);

                // Project Box B (Barn) radius onto separating axis L
                const RB = e0B * Math.abs(U0Bx * Lx + U0Bz * Lz) + e1B * Math.abs(U1Bx * Lx + U1Bz * Lz);

                const R = RA + RB;
                const overlap = R - D;

                if (overlap <= 0) {
                    collided = false; // A separating axis exists, no collision!
                    break;
                }

                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    bestAxis = { x: Lx, z: Lz };
                }
            }

            if (collided && bestAxis) {
                // Determine push-out direction (away from Barn)
                const dot = Tx * bestAxis.x + Tz * bestAxis.z;
                const sign = dot >= 0 ? 1 : -1;

                w.position[0] += -sign * bestAxis.x * minOverlap;
                w.position[2] += -sign * bestAxis.z * minOverlap;
                w.speed *= -0.2; // slight bounce
            }
        }
    }

    _handlePickupDrop(skipDrop) {
        const w = this.wagonController;

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
        if (!skipDrop && this._pressed('KeyL') && w.bales.length > 0) {
            const b = w.bales.pop();
            b.state = 'free';
            // Drop just behind the wagon (opposite heading), snapped to ground
            const back = -(w.bodySize.z * 0.6);
            const bx = w.position[0] + Math.cos(w.heading) * back;
            const bz = w.position[2] - Math.sin(w.heading) * back;
            b.position[0] = bx;
            b.position[2] = bz;
            b.position[1] = this._sampleGroundY(bx, bz);
            b.heading = w.heading;
        }
    }

    _handleDelivery() {
        const w = this.wagonController;
        const [cx, , cz] = this._barnDeliveryCenter();
        const dx = w.position[0] - cx;
        const dz = w.position[2] - cz;
        const inZone = (dx*dx + dz*dz) < (this.barn.activationRadius * this.barn.activationRadius);
        this.barn.isActive = inZone;
        
        if (inZone && w.bales.length > 0 && this._pressed('KeyL')) {
            const storedCount = this.bales.filter(bale => bale.state === 'stored').length;
            w.bales.forEach((b, offset) => {
                const position = this._barnStoragePosition(storedCount + offset);
                b.state = 'stored';
                b.position[0] = position[0];
                b.position[1] = position[1];
                b.position[2] = position[2];
                b.heading = this.barn.rotation;
            });
            this.balesDelivered += w.bales.length;
            w.bales.length = 0;
            // Restore some HP per delivery batch
            w.hp = Math.min(w.maxHp, w.hp + 15);
            this.lastRestore = this.score;
            this._maybeRefillBales();
            return true;
        }
        return false;
    }

    _maybeRefillBales() {
        const hasFreeBales = this.bales.some(b => b.state === 'free');
        if (hasFreeBales) return;
        if (this.wagonController.bales.length > 0) return;
        if (this.state !== 'running') return;

        this._spawnBales(this._baleBatchSize);
    }

    _reset() {
        this.wagonController.position = [-40, 0, -40];
        this.wagonController.heading = -Math.PI/4;
        this.wagonController.steeringAngle = 0;
        this.wagonController.steeringTarget = 0;
        this.wagonController.frontWheelAngle = 0;
        this.wagonController.rearWheelAngle = 0;
        this.wagonController.speed = 0;
        this.wagonController.hp = this.wagonController.maxHp;
        this.hp = this.wagonController.maxHp;
        this.wagonController.bales = [];
        this.score = 0;
        this.elapsed = 0;
        this.balesDelivered = 0;
        this.lastDamage = 0;
        this.lastRestore = 0;
        this._lastRockHitT = -1;

        // Keep only the initial batch of bales and reset them
        this.bales = this.bales.slice(0, this._baleBatchSize);
        for (const b of this.bales) {
            b.state = 'free';
            b.position = [...b.initialPosition];
            b.heading = b.initialHeading;
        }

        this._reseatToGround();
        this.state = 'running';
    }

    // ---- Drawing ----
    display() {
        const s = this.scene;

        // Standard-shaded world objects
        s.setActiveShader(s.defaultShader);
        for (const b of this.bales) b.display();
        this.barn.deliveryCenter = this._barnDeliveryCenter();
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
            const dx = bale.position[0] - this.wagonController.position[0];
            const dz = bale.position[2] - this.wagonController.position[2];
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
