import {CGFobject} from '../lib/CGF.js';
/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyDiamond extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
	}
	
	initBuffers() {
		this.vertices = [
			-1, 0, 0,	//0 front
			0, -1, 0,	//1 front
			0, 1, 0,	//2 front
			1, 0, 0,	//3 front
			-1, 0, 0,	//4 back
			0, -1, 0,	//5 back
			0, 1, 0,	//6 back
			1, 0, 0		//7 back
		];

		//Counter-clockwise reference of vertices
		this.indices = [
			0, 1, 2,
			1, 3, 2,
			6, 5, 4,
			6, 7, 5
		];

		this.normals = [
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, -1,
			0, 0, -1,
			0, 0, -1,
			0, 0, -1,
		];

		this.texCoords = [
			// front
			0.0, 0.5, // 0: left
			0.25, 0.75, // 1: bottom
			0.25, 0.25, // 2: top
			0.5, 0.5, // 3: right
			
			// back
			0.0, 0.5,
			0.25, 0.75,
			0.25, 0.25,
			0.5, 0.5
		];
		

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}
}

