import { CGFobject, CGFshader } from "../lib/CGF.js";

/**
 * Multi-frame horse — 4 spliced OBJs (Paint Horse body + walking horse legs)
 * cycled to produce a real walking animation. No vertex-shader leg swing;
 * the leg positions come straight from the geometry of each frame.
 *
 * Slot order matches the 4-beat walking footfall LH → LF → RH → RF.
 *   spliced_c → LH lifted
 *   spliced_d → LF lifted (mirrored walk_b)
 *   spliced_a → RH lifted
 *   spliced_b → RF lifted
 *
 * Cycle rate scales with controller.speed; when stopped, the current frame
 * is held (no swap to a different mesh so the body doesn't teleport).
 *
 * Fragment shader paints a procedural coat: light brown base + darker
 * manchas + mane along the spine. No texture file needed.
 */
export class MyHorse extends CGFobject {
    constructor(scene, opts = {}) {
        super(scene);

        this.targetHeight = opts.targetHeight ?? 3.0;
        this.flipHeadTail = opts.flipHeadTail ?? false;

        // Five unique meshes loaded once; frameSequence picks the playback
        // order — the neutral pose appears twice in the cycle as a transition
        // beat between the LH→RF and RH→LF half-cycles.
        this.urls = opts.urls ?? [
            'objects/horse_neutral.obj',     // slot 0 — all hooves down
            'objects/horse_spliced_a.obj',   // slot 1 — RH lifted? (see splice log)
            'objects/horse_spliced_b.obj',   // slot 2 — RF lifted
            'objects/horse_spliced_c.obj',   // slot 3 — LH lifted
            'objects/horse_spliced_d.obj',   // slot 4 — LF lifted (mirrored b)
        ];
        // Cycle order: normal → c → b → normal → a → d
        this.frameSequence = opts.frameSequence ?? [0, 3, 2, 0, 1, 4];
        this.meshes = new Array(this.urls.length).fill(null);
        this.framesReady = 0;
        this._lastFrame = 0;
        // When set to a slot index, displayModel renders that frame instead of
        // cycling (used by the debug test mode in MyScene).
        this.overrideSlot = null;

        this.coatShader = new CGFshader(scene.gl, 'shaders/horse.vert', 'shaders/horse.frag');

        // Animation ease-in state.
        // _animSpeedT lags behind the real speedT so the cycle starts slow.
        // _walkPhase accumulates frame index locally (avoids absolute-time jumping).
        this._animSpeedT = 0;
        this._walkPhase  = 0;
        this._lastT      = undefined;

        this.urls.forEach((u, i) => this._load(u, i));
    }

    async _load(url, slot) {
        const text = await (await fetch(url)).text();
        const positions = [], normals = [], tris = [];

        for (const ln of text.split('\n')) {
            if (ln.length < 2 || ln[0] === '#') continue;
            if (ln.startsWith('v ')) {
                const p = ln.split(/\s+/);
                positions.push(+p[1], +p[2], +p[3]);
            } else if (ln.startsWith('vn ')) {
                const p = ln.split(/\s+/);
                normals.push(+p[1], +p[2], +p[3]);
            } else if (ln.startsWith('f ')) {
                const corners = ln.trim().split(/\s+/).slice(1).map(t => {
                    const parts = t.split('/');
                    return [+parts[0] - 1, parts.length >= 3 ? +parts[2] - 1 : -1];
                });
                for (let k = 1; k < corners.length - 1; k++) {
                    tris.push(
                        corners[0][0], corners[0][1],
                        corners[k][0], corners[k][1],
                        corners[k+1][0], corners[k+1][1],
                    );
                }
            }
        }

        // All 4 spliced files share the Paint Horse body, so they have nearly
        // identical bboxes. Use SHARED reference values so the body lines up
        // exactly when frames swap (no teleport).
        const REF_SRC_HEIGHT = 78;
        const REF_SRC_CY     = -34;
        const REF_SRC_CX     = 8;
        const scl = this.targetHeight / REF_SRC_HEIGHT;

        // Per-mesh hooves Y so each frame still lands hooves at world y=0.
        let minZ = Infinity;
        for (let i = 2; i < positions.length; i += 3) {
            if (positions[i] < minZ) minZ = positions[i];
        }

        const sx = this.flipHeadTail ? -1 : 1;
        const verts = [], nrms = [], uvs = [], idx = [];

        for (let t = 0; t < tris.length / 6; t++) {
            for (let k = 0; k < 3; k++) {
                const pi = tris[t*6 + k*2]     * 3;
                const ni = tris[t*6 + k*2 + 1] * 3;

                const wx = -(positions[pi + 1] - REF_SRC_CY) * sx * scl;
                const wy =  (positions[pi + 2] - minZ) * scl;
                const wz =  (positions[pi]     - REF_SRC_CX) * scl;
                verts.push(wx, wy, wz);

                if (ni >= 0 && ni < normals.length) {
                    const nx = normals[ni], ny = normals[ni + 1], nz = normals[ni + 2];
                    nrms.push(-ny * sx, nz, nx);
                } else {
                    nrms.push(0, 1, 0);
                }

                uvs.push(0, 0);
                idx.push(verts.length / 3 - 1);
            }
        }

        this.meshes[slot] = new _HorseMesh(this.scene, verts, nrms, uvs, idx);
        this.framesReady++;
    }

    displayModel(controller = null) {
        if (this.framesReady === 0) return;

        // Slot select: override wins (debug test mode picks a raw slot 0..4);
        // otherwise step through frameSequence at the current cycle rate.
        let slot;
        if (this.overrideSlot != null) {
            slot = Math.max(0, Math.min(this.meshes.length - 1, this.overrideSlot));
        } else {
            slot = this.frameSequence[this._lastFrame];
            const speed  = controller ? Math.abs(controller.speed) : 0;
            const speedT = Math.min(1, speed / 6);

            // Compute dt from wall time (capped at 50 ms to ignore tab-switch spikes).
            const now = performance.now() / 1000;
            const dt  = this._lastT !== undefined ? Math.min(now - this._lastT, 0.05) : 0;
            this._lastT = now;

            if (speedT > 0.05 && this.frameSequence.length > 1) {
                // Exponential ease-in (~0.1 s time constant) — starts slow, tracks speed fast.
                this._animSpeedT += (speedT - this._animSpeedT) * Math.min(1.0, 10.0 * dt);
                // 6-frame sequence: need ~8-10 Hz at full speed for 1.3-1.7 gait cycles/sec.
                const cycleHz = 2.0 + this._animSpeedT * 8.0;
                this._walkPhase += cycleHz * dt;
                const idx = Math.floor(this._walkPhase) % this.frameSequence.length;
                this._lastFrame = idx;
                slot = this.frameSequence[idx];
            } else {
                // Stopped — reset ease-in so next start begins slow again.
                this._animSpeedT = 0;
            }
        }
        const mesh = this.meshes[slot];
        if (!mesh) return;

        const s = this.scene;
        s.setActiveShader(this.coatShader);
        const gl = s.gl;
        gl.disable(gl.CULL_FACE);
        mesh.display();
        gl.enable(gl.CULL_FACE);
        s.setActiveShader(s.defaultShader);
    }
}

class _HorseMesh extends CGFobject {
    constructor(scene, vertices, normals, texCoords, indices) {
        super(scene);
        this.vertices  = vertices;
        this.normals   = normals;
        this.texCoords = texCoords;
        this.indices   = indices;
        this.primitiveType = scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
    initBuffers() {}
}
