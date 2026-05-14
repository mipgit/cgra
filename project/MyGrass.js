import {CGFobject} from '../lib/CGF.js';

export class MyGrass extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [
            // Left blade
            -0.15, 0,   0,
             0,    0,   0,
            -0.25, 1.0, 0,
            // Center blade
            -0.08, 0,   0,
             0.08, 0,   0,
             0,    1.3, 0,
            // Right blade
             0,    0,   0,
             0.15, 0,   0,
             0.25, 1.0, 0,
        ];

        this.normals = [
            0, 0, 1,  0, 0, 1,  0, 0, 1,
            0, 0, 1,  0, 0, 1,  0, 0, 1,
            0, 0, 1,  0, 0, 1,  0, 0, 1,
        ];

        this.texCoords = [
            0,    1,  0.5,  1,  0.25, 0,
            0.25, 1,  0.75, 1,  0.5,  0,
            0.5,  1,  1,    1,  0.75, 0,
        ];

        this.indices = [
            0, 1, 2,
            3, 4, 5,
            6, 7, 8,
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
