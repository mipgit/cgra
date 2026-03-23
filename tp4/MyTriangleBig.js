import {CGFobject} from '../lib/CGF.js';
/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyTriangleBig extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
	}
	
	initBuffers() {
		this.vertices = [
			-2, 0, 0,	//0 front
			0, 2, 0,	//1 front
			2, 0, 0,	//2 front
			-2, 0, 0,	//3 back
			0, 2, 0,	//4 back
			2, 0, 0,	//5 back

		];

		//Counter-clockwise reference of vertices
		this.indices = [
			2, 1, 0,
			5, 3, 4
		];

		this.normals = [
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, -1,
			0, 0, -1,
			0, 0, -1,
		];

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}
}

