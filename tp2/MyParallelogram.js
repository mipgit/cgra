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
			0, 0, 0,	//0 frente
			1, 1, 0,	//1 frente
			3, 1, 0,	//2 frente
			2, 0, 0, 	//3 frente
			0, 0, 0,	//4 trás
			1, 1, 0,	//5 trás
			3, 1, 0,	//6 trás
			2, 0, 0, 	//7 trás
		];

		//Counter-clockwise reference of vertices
		this.indices = [
			0, 3, 1,
			3, 2, 1, //frente
			4, 5, 7,
			7, 5, 6, //trás
		];

		this.normals = [
			0, 0,  1,  0, 0,  1,  0, 0,  1,  0, 0,  1,  // frente
			0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  // trás
		];

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}
}

