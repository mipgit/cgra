import {CGFobject} from '../../lib/CGF.js';

export class MyQuad extends CGFobject {
    constructor(scene){
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [
            -0.5, -0.5, 0,  // 0
            0.5, 0.5, 0,    // 1
            -0.5, 0.5, 0,   // 2
            0.5, -0.5, 0    // 3
        ];

        this.indices = [
            0, 1, 2,
            0, 3, 1,
            3, 0, 1,
            0, 2, 1
        ];

        this.texCoords = [
            0, 1,  // 0
            1, 0,  // 1
            0, 0,  // 2
            1, 1   // 3
        ];

        this.normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
		this.initGLBuffers();
    }
}