import {CGFobject} from '../lib/CGF.js';
import {MyStem}   from './MyStem.js';
import {MyLeaf}   from './MyLeaf.js';
import {MyPetal}  from './MyPetal.js';
import {MySphere} from './MySphere.js';

// Bakes a list of flower instances into one batched mesh, like MyGrassField does for
// blades. Per-flower transforms are baked into vertex positions at construction; the
// shader only adds wind sway. One draw call per field instead of one per flower part.
export class MyFlowerField extends CGFobject {
    constructor(scene, instances) {
        super(scene);
        this.instances = instances;

        // Shared low-poly templates
        this.stemTpl  = new MyStem(scene, 6, 4);
        this.leafTpl  = new MyLeaf(scene);
        this.bloomTpl = new MySphere(scene, 8, 5, false);

        // Per-species petal templates, built lazily so each species gets a distinct silhouette
        this.petalTpls = new Map();

        this.sunDir = normalize([0.3, 0.95, 0.25]);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices  = [];
        this.normals   = [];   // repurposed as (baseX, heightRatio, baseZ) for sway
        this.colors    = [];   // pre-shaded RGB, custom attribute
        this.texCoords = [];   // (u,v) for petals, (-1,-1) sentinel for non-textured parts
        this.indices   = [];

        for (const inst of this.instances) this._bakeFlower(inst);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();

        // aVertexColor is not one of CGF's built-in attributes, so we manage the buffer
        const gl = this.scene.gl;
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
    }

    display() {
        const gl = this.scene.gl;
        const program = this.scene.activeShader.program;
        const colorLoc = gl.getAttribLocation(program, 'aVertexColor');
        if (colorLoc >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(colorLoc);
        }
        super.display();
        if (colorLoc >= 0) gl.disableVertexAttribArray(colorLoc);
    }

    _bakeFlower(inst) {
        const p  = inst.params;
        const fx = inst.x, fz = inst.z;
        const sh = p.stemHeight;

        // Flower-level rotation, same order as the original per-frame code applied
        const R = composeRot(inst.rot, inst.tiltX, inst.tiltZ);

        const stemHue  = [0.20, 0.60, 0.15];
        const leafHue  = [0.22, 0.58, 0.14];
        const petalHue = p.petalColor.map(c => c / 255);
        const bloomHue = p.bloomColor.map(c => c / 255);

        // Stem
        this._bakePart(this.stemTpl, {
            xform: (v) => [v[0], v[1] * sh, v[2]],
            normalXform: (n) => n,
            R, fx, fz, sh, color: stemHue,
        });

        // Leaves
        const attachY = p.leafHeight * sh;
        for (let i = 0; i < p.leafCount; i++) {
            const azimuth   = (i / p.leafCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
            const leafScale = p.leafScale * (1.0 + (Math.random() - 0.5) * 0.18);
            const ay        = attachY + (Math.random() - 0.5) * 0.04 * sh;
            const curlX     = (Math.random() - 0.5) * 0.25;
            const M = mulM3(rotY(azimuth), mulM3(rotZ(-p.leafSpread), rotX(curlX)));

            this._bakePart(this.leafTpl, {
                xform: (v) => {
                    const s = [v[0]*leafScale, v[1]*leafScale, v[2]*leafScale];
                    const r = applyM3(M, s);
                    return [r[0], r[1] + ay, r[2]];
                },
                normalXform: (n) => applyM3(M, n),
                R, fx, fz, sh, color: leafHue,
            });
        }

        // Petals — push base out by ~85% of bloomRadius so they frame the centre disc
        const petalOff = p.bloomRadius * 0.85;
        const petalCount = Math.round(p.petalCount);

        const drawRing = (count, baseAz, scaleMul, extraTilt) => {
            for (let i = 0; i < count; i++) {
                const azimuth  = baseAz + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
                const tiltJit  = (Math.random() - 0.5) * 0.16;
                const rollJit  = (Math.random() - 0.5) * 0.18;
                const sc       = p.petalScale * scaleMul * (1.0 + (Math.random() - 0.5) * 0.12);
                const xRot     = -(Math.PI/2 - (p.petalTilt + extraTilt) + tiltJit);
                const M = mulM3(rotY(azimuth), mulM3(rotX(xRot), rotZ(rollJit)));

                this._bakePart(this._petalTplFor(inst), {
                    xform: (v) => {
                        const s = [v[0]*sc, v[1]*sc + petalOff, v[2]*sc];
                        const r = applyM3(M, s);
                        return [r[0], r[1] + sh, r[2]];
                    },
                    normalXform: (n) => applyM3(M, n),
                    R, fx, fz, sh, color: petalHue, textured: true,
                });
            }
        };

        // Outer ring, then optional inner ring offset by half-angle, smaller, tilted up more
        drawRing(petalCount, 0, 1.0, 0);
        if (p.ringCount === 2) {
            const innerCount = Math.max(4, Math.round(petalCount * 0.7));
            drawRing(innerCount, Math.PI / petalCount, 0.68, 0.35);
        }

        // Bloom centre — species can opt out via bloomRadius = 0 (e.g. tulips)
        if (p.bloomRadius > 0.005) {
            const flatness = p.bloomFlatness;
            const discY    = sh + p.bloomRadius * flatness * 0.5;
            const br       = p.bloomRadius;
            this._bakePart(this.bloomTpl, {
                xform: (v) => [v[0] * br, v[1] * br * flatness + discY, v[2] * br],
                normalXform: (n) => n,
                R, fx, fz, sh, color: bloomHue, bloomTag: true,
            });
        }
    }

    _petalTplFor(inst) {
        const p = inst.petalProfile || {};
        // Key on quantized profile so flowers with the same silhouette bucket share a mesh.
        // Profile fields are already quantized in MyScene.makeFlower → small set of templates.
        const key = `${inst.speciesId || 'default'}:${p.widthAmp}:${p.widthPow}:${p.cupAmp}:${p.curlAmount}`;
        let tpl = this.petalTpls.get(key);
        if (!tpl) {
            tpl = new MyPetal(this.scene, inst.petalProfile);
            this.petalTpls.set(key, tpl);
        }
        return tpl;
    }

    // Walk a template mesh, apply part + flower transforms, write vertices into the field
    // buffer with baked Lambert lighting and sway metadata.
    _bakePart(template, ctx) {
        const tv = template.vertices, tn = template.normals, ti = template.indices;
        const ttc = template.texCoords;
        const base = this.vertices.length / 3;
        const { xform, normalXform, R, fx, fz, sh, color, textured, bloomTag } = ctx;

        for (let i = 0; i < tv.length; i += 3) {
            const localV = [tv[i], tv[i+1], tv[i+2]];
            const localN = [tn[i], tn[i+1], tn[i+2]];

            const flowerLocal  = xform(localV);
            const flowerLocalN = normalize(normalXform(localN));

            // xform returns the vertex in flower-local space, so its Y is the height
            const heightRatio = Math.max(0, Math.min(1, flowerLocal[1] / sh));

            const wPos  = applyM3(R, flowerLocal);
            const wNorm = normalize(applyM3(R, flowerLocalN));

            // Baked shading: a bit of Lambert from the sun + darker near the base
            const ndotl = Math.max(0, wNorm[0]*this.sunDir[0] + wNorm[1]*this.sunDir[1] + wNorm[2]*this.sunDir[2]);
            const shade = 0.55 + 0.30 * ndotl + 0.15 * heightRatio;

            // No Y offset here — the flower shader lifts the whole flower onto the
            // heightmap-displaced terrain at draw time using baseXZ in aVertexNormal.
            this.vertices.push(wPos[0] + fx, wPos[1], wPos[2] + fz);
            this.normals.push(fx, heightRatio, fz);
            this.colors.push(color[0]*shade, color[1]*shade, color[2]*shade);

            if (textured) {
                const k = (i / 3) * 2;
                this.texCoords.push(ttc[k], ttc[k + 1]);
            } else if (bloomTag) {
                // Encode the bloom-local XZ into texCoord (offset by +10 so the shader can
                // distinguish bloom from petal/stem). Template is a unit sphere, so localV[0],
                // localV[2] are already in [-1, 1] — perfect for a disc-floret domain.
                this.texCoords.push(10.0 + localV[0], 10.0 + localV[2]);
            } else {
                this.texCoords.push(-1, -1);
            }
        }
        for (const idx of ti) this.indices.push(base + idx);
    }
}

// Row-major 3x3 matrix helpers
function rotX(a) { const c=Math.cos(a), s=Math.sin(a); return [1,0,0, 0,c,-s, 0,s,c]; }
function rotY(a) { const c=Math.cos(a), s=Math.sin(a); return [c,0,s,  0,1,0,  -s,0,c]; }
function rotZ(a) { const c=Math.cos(a), s=Math.sin(a); return [c,-s,0, s,c,0,  0,0,1]; }

function mulM3(A, B) {
    const r = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
        r[i*3+j] = A[i*3]*B[j] + A[i*3+1]*B[3+j] + A[i*3+2]*B[6+j];
    return r;
}

function applyM3(M, v) {
    return [
        M[0]*v[0] + M[1]*v[1] + M[2]*v[2],
        M[3]*v[0] + M[4]*v[1] + M[5]*v[2],
        M[6]*v[0] + M[7]*v[1] + M[8]*v[2],
    ];
}

function normalize(v) {
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return len > 0 ? [v[0]/len, v[1]/len, v[2]/len] : [0, 1, 0];
}

// Matches the per-frame transform order: Rx(tiltZ) · Rz(tiltX) · Ry(rotY)
function composeRot(rotYa, tiltX, tiltZ) {
    return mulM3(rotX(tiltZ), mulM3(rotZ(tiltX), rotY(rotYa)));
}
