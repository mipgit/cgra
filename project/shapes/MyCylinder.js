import { CGFobject } from "../../lib/CGF.js";

export class MyCylinder extends CGFobject {
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

    var alphaAng = 2 * Math.PI / this.slices;
    var h = 1 / this.stacks;

    // Simplified grid: (stacks+1) rows x slices columns — no duplicates.
    // Vertex at row j, column i → index = j * slices + i
    // Adjacent faces share the vertices on their common edge,
    // so each vertex has ONE normal used by both neighbouring faces.
    for (var j = 0; j <= this.stacks; j++) {
      for (var i = 0; i < this.slices; i++) {
        var ang = i * alphaAng;
        var ca = Math.cos(ang);
        var sa = Math.sin(ang);

        this.vertices.push(ca, sa, j * h);
        this.normals.push(ca, sa, 0);   // radial, already unit length
      }
    }

    // Reference each shared vertex more than once in the index list
    for (var j = 0; j < this.stacks; j++) {
      for (var i = 0; i < this.slices; i++) {
        var nextI = (i + 1) % this.slices;

        var bl = j       * this.slices + i;
        var br = j       * this.slices + nextI;
        var tl = (j + 1) * this.slices + i;
        var tr = (j + 1) * this.slices + nextI;

        // Same winding as MyPrism
        this.indices.push(tl, bl, br);
        this.indices.push(br, tr, tl);

        this.indices.push(br, bl, tl);
        this.indices.push(tl, tr, br);
      }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  updateBuffers() {}
}
