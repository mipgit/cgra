import {CGFobject} from '../lib/CGF.js';
/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyUnitCube extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
	}
	
	initBuffers() {
		this.vertices = [
			// front
			-0.5, -0.5, 0.5,	//0
			 0.5, -0.5, 0.5,	//1
			 0.5,  0.5, 0.5,	//2
			-0.5,  0.5, 0.5,	//3
			// back
			 0.5, -0.5, -0.5,	//4
			-0.5, -0.5, -0.5,	//5
			-0.5,  0.5, -0.5,	//6
			 0.5,  0.5, -0.5,	//7
			// top	
			-0.5,  0.5,  0.5,	//8
			 0.5,  0.5,  0.5,	//9
			 0.5,  0.5, -0.5,	//10
			-0.5,  0.5, -0.5,	//11
			// bottom	
			-0.5, -0.5, -0.5,	//12
			 0.5, -0.5, -0.5,	//13
			 0.5, -0.5,  0.5,	//14
			-0.5, -0.5,  0.5,	//15
			// right	
			 0.5, -0.5,  0.5,	//16
			 0.5, -0.5, -0.5,	//17
			 0.5,  0.5, -0.5,	//18
			 0.5,  0.5,  0.5,	//19
			// left	
			-0.5, -0.5, -0.5,	//20
			-0.5, -0.5,  0.5,	//21
			-0.5,  0.5,  0.5,	//22
			-0.5,  0.5, -0.5	//23
		];

		//Counter-clockwise reference of vertices
		this.indices = [
			0, 1, 2,	 0, 2, 3,		// front face
			4, 5, 6,	 4, 6, 7,		// back face
			8, 9, 10,	 8, 10, 11,		// upper face
			12, 13, 14,	 12, 14, 15,	// lower face
			16, 17, 18,	 16, 18, 19,	// right face
			20, 21, 22,	 20, 22, 23,	// left face
		];

		this.normals = [
			// front
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			// back
			0, 0, -1,
			0, 0, -1,
			0, 0, -1,
			0, 0, -1,
			// top
			0, 1, 0,
			0, 1, 0,
			0, 1, 0,
			0, 1, 0,
			// bottom
			0, -1, 0,
			0, -1, 0,
			0, -1, 0,
			0, -1, 0,
			// right
			1, 0, 0,
			1, 0, 0,
			1, 0, 0,
			1, 0, 0,
			// left
			-1, 0, 0,
			-1, 0, 0,
			-1, 0, 0,
			-1, 0, 0,
		];

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}


    updateBuffers() {
        
    }
}

