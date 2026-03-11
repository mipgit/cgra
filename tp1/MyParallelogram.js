import {CGFobject} from '../lib/CGF.js';
/**
 * MyParallelogram
 * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
 */
export class MyParallelogram extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
	}
	
	initBuffers() {
		this.vertices = [
			0, 0, 0,	//0
			2, 0, 0,	//1
			1, 1, 0,    //2
			3, 1, 0     //3
		];

		// Front face (CCW) + back face (CW reversed) for double-sided rendering
		this.indices = [
			0, 1, 2,	// front
			1, 3, 2,	// front
			2, 1, 0,	// back
			3, 1, 2		// back
		];

		// One normal per vertex, pointing towards the viewer (+Z)
		this.normals = [
			0, 0, 1,	//0
			0, 0, 1,	//1
			0, 0, 1,	//2
			0, 0, 1		//3
		];

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}
}

