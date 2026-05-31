import {CGFobject} from '../../lib/CGF.js';

export class MyQuad extends CGFobject {
    constructor(scene){
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [
            -0.5, -0.5, 0,  // 0 (bottom-left)
             0.5, -0.5, 0,  // 1 (bottom-right)
            -0.5,  0.5, 0,  // 2 (top-left)
             0.5,  0.5, 0   // 3 (top-right)
        ];

        this.indices = [
            0, 1, 2, // First triangle 
            1, 3, 2  // Second triangle 
        ];

        this.texCoords = [
            0, 1,  // 0
            1, 1,  // 1
            0, 0,  // 2
            1, 0   // 3
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