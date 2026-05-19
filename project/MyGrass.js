import {CGFobject} from '../lib/CGF.js';

export class MyGrass extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [
            // Blade A — wider base, tapers to tip
            -0.09,  0,    0,
             0.09,  0,    0,
            -0.07,  0.55, 0.05,
             0.07,  0.55, 0.05,
             0.01,  1.4,  0,

            // Blade B — 90° rotated
             0,     0,   -0.09,
             0,     0,    0.09,
             0.05,  0.55, 0.07,
             0.01,  1.4,  0,

            // Blade C — diagonal, fills gap from top view
            -0.06,  0,   -0.06,
             0.06,  0,    0.06,
             0.04,  0.55, 0.04,
             0.01,  1.4,  0,
        ];

        this.normals = [
            // Blade A
            0, 0, 1,  0, 0, 1,  0, 0.2, 1,  0, 0.2, 1,  0, 1, 0,
            // Blade B
            1, 0, 0,  1, 0, 0,  1, 0.2, 0,  1, 1,   0,
            // Blade C (diagonal)
            -0.7, 0, 0.7,  -0.7, 0, 0.7,  -0.7, 0.2, 0.7,  -0.7, 1, 0.7,
        ];

        this.texCoords = [
            // Blade A
            0.0, 1.0,  1.0, 1.0,  0.0, 0.5,  1.0, 0.5,  0.5, 0.0,
            // Blade B
            0.0, 1.0,  1.0, 1.0,  1.0, 0.5,  0.5, 0.0,
            // Blade C
            0.0, 1.0,  1.0, 1.0,  1.0, 0.5,  0.5, 0.0,
        ];

        this.indices = [
            // Blade A
            0, 1, 3,   0, 3, 2,   2, 3, 4,
            // Blade B
            5, 6, 7,   5, 7, 8,
            // Blade C
            9, 10, 11,  9, 11, 12,
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
