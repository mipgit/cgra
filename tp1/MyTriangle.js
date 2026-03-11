import {CGFobject} from '../lib/CGF.js';
/**
<<<<<<< HEAD
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
=======
 * MyTriangle
 * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
>>>>>>> tp2-mariana
 */
export class MyTriangle extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
	}
	
	initBuffers() {
		this.vertices = [
			-1, 1, 0,	//0
			-1, -1, 0,	//1
			1, -1, 0	//2
		];

		//Counter-clockwise reference of vertices
		this.indices = [
			0, 1, 2
		];

		// One normal per vertex, pointing towards the viewer (+Z)
		this.normals = [
			0, 0, 1,	//0
			0, 0, 1,	//1
			0, 0, 1		//2
		];

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}
}

