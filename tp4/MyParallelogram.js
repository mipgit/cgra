import {CGFobject} from '../lib/CGF.js';
/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyParallelogram extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
	}
	
	initBuffers() {
		this.vertices = [
			0, 0, 0,	//0 front
			1, 1, 0,	//1 front
			3, 1, 0,	//2 front
			2, 0, 0, 	//3 front
			0, 0, 0,	//4 back
			1, 1, 0,	//5 back
			3, 1, 0,	//6 back
			2, 0, 0, 	//7 back
		];

		//Counter-clockwise reference of vertices
		this.indices = [
			0, 3, 1,
			3, 2, 1, //front
			4, 5, 7,
			7, 5, 6, //back
		];

		this.normals = [
			0, 0,  1,  0, 0,  1,  0, 0,  1,  0, 0,  1,  // front
			0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  // back
		];

		this.texCoords = [
			// front
			0.25, 0.75,
			0.5, 1,
			1, 1,
			0.75, 0.75,
			
			// back
			0.25, 0.75,
			0.5, 1,
			1, 1,
			0.75, 0.75
		];

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}
}

