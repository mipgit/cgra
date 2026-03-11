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
			-0.5, -0.5, -0.5,	//0 back
			-0.5, 0.5, -0.5,	//1 back
			0.5, 0.5, -0.5,	//2 back
			0.5, -0.5, -0.5,	//3 back
			-0.5, -0.5, 0.5,	//4 front
			-0.5, 0.5, 0.5,	//5 front
			0.5, 0.5, 0.5,	//6 front
			0.5, -0.5, 0.5	//7 front
		 ];

		//Counter-clockwise reference of vertices
		this.indices = [
			0, 1, 2,	0, 2, 3,	// back face
			7, 6, 5, 	7, 5, 4,	// front face
			6, 2, 1,    6, 1, 5,    // upper face 
		 	3, 7, 4,    3, 4, 0,    // lower face
			3, 2, 6,	3, 6, 7,    // right face
			4, 5, 1,    4, 1, 0,    // left face

			
		];

		//The defined indices (and corresponding vertices)
		//will be read in groups of three to draw triangles
		this.primitiveType = this.scene.gl.TRIANGLES;

		this.initGLBuffers();
	}
}

