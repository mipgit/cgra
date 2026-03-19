import { CGFobject } from "../lib/CGF.js";

export class MyPrism extends CGFobject {
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

    var ang = 0;
    var alphaAng = 2*Math.PI/this.slices;
    var h = 1/this.stacks;
    var vCount = 0;

    for (var j = 0; j < this.stacks; j++){
        for (var i = 0; i < this.slices; i++ ){
            ang = i * alphaAng;
            var nextAng = (i + 1) * alphaAng;

            var sa = Math.sin(ang);
            var sn = Math.sin(nextAng);
            var ca = Math.cos(ang);
            var cn = Math.cos(nextAng);

            this.vertices.push(ca, sa, j*h);
            this.vertices.push(cn, sn, j*h);
            this.vertices.push(ca, sa, (j+1)*h);
            this.vertices.push(cn, sn, (j+1)*h);

            
            var midAng = ang + alphaAng/2;
            var sm = Math.sin(midAng);
            var cm = Math.cos(midAng);

            this.normals.push(cm, sm, 0);
            this.normals.push(cm, sm, 0);
            this.normals.push(cm, sm, 0);
            this.normals.push(cm, sm, 0);

            // define indices relative to current count
            // 1st triangle
            this.indices.push(vCount + 2, vCount, vCount + 1);
            // 2nd triangle
            this.indices.push(vCount + 1, vCount + 3, vCount + 2);

            // inverted order
            this.indices.push(vCount + 1, vCount, vCount + 2);
            this.indices.push(vCount + 2, vCount + 3, vCount + 1);

            vCount += 4;
        }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  updateBuffers() {}
}
