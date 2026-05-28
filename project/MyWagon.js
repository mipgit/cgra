import { CGFobject, CGFappearance } from '../lib/CGF.js';

// Placeholder wagon: a colored box + the controller-facing contract.
// Friend swaps display() and the box geometry with the detailed horse-wagon model
// when ready; the fields and methods below are the only things the controller depends on.
export class MyWagon extends CGFobject {
    constructor(scene) {
        super(scene);

        // Contract state — read/written by MyGameController
        this.position = [0, 0, 0];      // world XYZ; Y set by terrain sampling
        this.heading = 0;               // radians, yaw around Y
        this.steering = 0;              // current wheel angle (smoothed)
        this.steeringTarget = 0;        // where steering is lerping toward
        this.speed = 0;                 // signed: forward +, reverse −
        this.pitch = 0;                 // tilt along heading axis, from terrain slope
        this.hp = 100;
        this.maxHp = 100;
        this.bales = [];                // currently carried bales (max 2)

        // Tunables — kinematic feel
        this.wheelbase   = 1.8;
        this.maxSpeed    = 8.0;
        this.reverseMax  = 3.0;
        this.accelRate   = 4.0;
        this.brakeRate   = 8.0;
        this.coastDecel  = 5.0;         // deceleration when neither W nor S is held
        this.maxSteer    = Math.PI / 4;
        this.steerLerp   = 6.0;         // higher = snappier wheel return

        // Visual stub
        this.bodySize = { x: 1.4, y: 0.9, z: 2.4 };
        this.appearance = new CGFappearance(scene);
        this.appearance.setAmbient(0.25, 0.15, 0.10, 1);
        this.appearance.setDiffuse(0.75, 0.45, 0.25, 1);
        this.appearance.setSpecular(0.1, 0.1, 0.1, 1);
        this.appearance.setShininess(20);

        this.initBuffers();
    }

    initBuffers() {
        // Unit box, 24 verts (per-face normals). Scaled in display().
        this.vertices = [];
        this.normals  = [];
        this.indices  = [];
        const faces = [
            { n: [ 1, 0, 0], v: [[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5],[ 0.5,-0.5, 0.5]] },
            { n: [-1, 0, 0], v: [[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5],[-0.5,-0.5,-0.5]] },
            { n: [ 0, 1, 0], v: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]] },
            { n: [ 0,-1, 0], v: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]] },
            { n: [ 0, 0, 1], v: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]] },
            { n: [ 0, 0,-1], v: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]] },
        ];
        let i = 0;
        for (const f of faces) {
            for (const p of f.v) { this.vertices.push(...p); this.normals.push(...f.n); }
            this.indices.push(i, i+1, i+2,  i, i+2, i+3);
            i += 4;
        }
        this.texCoords = new Array((this.vertices.length / 3) * 2).fill(0);
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    // ---- Controller-facing API ----

    setSteeringTarget(t) {
        const m = this.maxSteer;
        this.steeringTarget = Math.max(-m, Math.min(m, t));
    }

    accelerate(dt) {
        this.speed = Math.min(this.maxSpeed, this.speed + this.accelRate * dt);
    }

    brake(dt) {
        if (this.speed > 0) {
            this.speed = Math.max(0, this.speed - this.brakeRate * dt);
        } else {
            this.speed = Math.max(-this.reverseMax, this.speed - this.accelRate * dt);
        }
    }

    // Coast to a stop when no throttle/brake is held. Controller calls this
    // only on frames where neither W nor S is pressed.
    coast(dt) {
        const dec = this.coastDecel * dt;
        if (this.speed > 0)      this.speed = Math.max(0, this.speed - dec);
        else if (this.speed < 0) this.speed = Math.min(0, this.speed + dec);
    }

    // Per-frame integration. Controller supplies dt and a ground-Y sampler.
    update(dt, sampleGroundY) {
        // Smooth steering toward target
        const k = 1 - Math.exp(-this.steerLerp * dt);
        this.steering += (this.steeringTarget - this.steering) * k;

        if (Math.abs(this.speed) < 0.02) this.speed = 0;

        // Bicycle model: heading from steering & speed
        if (Math.abs(this.speed) > 1e-4) {
            this.heading += (this.speed / this.wheelbase) * Math.tan(this.steering) * dt;
        }

        // Integrate position. Heading 0 → facing +Z.
        this.position[0] += Math.sin(this.heading) * this.speed * dt;
        this.position[2] += Math.cos(this.heading) * this.speed * dt;

        // Stick to terrain (controller passes a sampler; falls back to flat).
        // Sample at front + back + centre so the wagon both follows AND pitches
        // with the slope — otherwise it ghost-floats over hills.
        if (sampleGroundY) {
            const halfLen = this.bodySize.z * 0.5;
            const fx = Math.sin(this.heading) * halfLen;
            const fz = Math.cos(this.heading) * halfLen;
            const yFront = sampleGroundY(this.position[0] + fx, this.position[2] + fz);
            const yBack  = sampleGroundY(this.position[0] - fx, this.position[2] - fz);
            this.position[1] = (yFront + yBack) * 0.5;
            this.pitch = Math.atan2(yFront - yBack, 2 * halfLen);
        } else {
            this.position[1] = 0;
            this.pitch = 0;
        }
    }

    display() {
        const s = this.scene;
        s.pushMatrix();
        s.translate(this.position[0], this.position[1] + this.bodySize.y * 0.5, this.position[2]);
        s.rotate(this.heading, 0, 1, 0);
        s.rotate(-this.pitch, 1, 0, 0);
        s.scale(this.bodySize.x, this.bodySize.y, this.bodySize.z);
        this.appearance.apply();
        super.display();
        s.popMatrix();

        // Tiny direction marker so heading is obvious during dev — front face cue.
        s.pushMatrix();
        const fwdX = Math.sin(this.heading) * this.bodySize.z * 0.55;
        const fwdZ = Math.cos(this.heading) * this.bodySize.z * 0.55;
        s.translate(this.position[0] + fwdX, this.position[1] + this.bodySize.y * 0.5, this.position[2] + fwdZ);
        s.scale(0.25, 0.25, 0.25);
        this.appearance.apply();
        super.display();
        s.popMatrix();
    }
}
