import { CGFobject } from "../lib/CGF.js";

export class MySphere extends CGFobject {
  constructor(scene, slices, stacks) {
    super(scene);
    this.slices = slices;
    this.stacks = stacks;
    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [];
    this.indices = [];
    this.normals = [];
    this.texCoords = [];

    for (let stack = 0; stack <= this.stacks; stack++) {
      const phi = (Math.PI * stack) / this.stacks;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      for (let slice = 0; slice <= this.slices; slice++) {
        const theta = (2 * Math.PI * slice) / this.slices;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        const x = sinPhi * cosTheta;
        const y = cosPhi;
        const z = sinPhi * sinTheta;

        this.vertices.push(x, y, z);
        // Inverted normals so inside face is lit properly
        this.normals.push(-x, -y, -z);
        this.texCoords.push(slice / this.slices, stack / this.stacks);
      }
    }

    // Reversed winding for inside-facing
    for (let stack = 0; stack < this.stacks; stack++) {
      for (let slice = 0; slice < this.slices; slice++) {
        const a = stack * (this.slices + 1) + slice;
        const b = a + this.slices + 1;
        this.indices.push(a, b, a + 1);
        this.indices.push(b, b + 1, a + 1);
      }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }
}
