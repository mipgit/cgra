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

            vCount += 4;
        }
    }

    // draw the top and bottom caps
    // we need separate vertices for the caps because the normals are different (vertical vs horizontal)

    // bottom cap (z = 0)
    var bottomCenterIndex = this.vertices.length / 3;
    
    // push center vertex
    this.vertices.push(0, 0, 0);
    this.normals.push(0, 0, -1); 

    // [ush perimeter vertices
    for (var i = 0; i <= this.slices; i++) {
        var ang = i * alphaAng;
        var x = Math.cos(ang);
        var y = Math.sin(ang);
        
        this.vertices.push(x, y, 0);
        this.normals.push(0, 0, -1); // normal points down
    }

    // push indices
    for (var i = 0; i < this.slices; i++) {
        // center is at bottomCenterIndex
        // the perimeter starts at bottomCenterIndex + 1
        var p1 = bottomCenterIndex + 1 + i;
        var p2 = bottomCenterIndex + 1 + i + 1;
        
        this.indices.push(bottomCenterIndex, p2, p1);
    }

    // top cap (z = 1)
    var topCenterIndex = this.vertices.length / 3;

    // push center vertex
    this.vertices.push(0, 0, 1);
    this.normals.push(0, 0, 1); // normal points up

    // push perimeter vertices
    for (var i = 0; i <= this.slices; i++) {
        var ang = i * alphaAng;
        var x = Math.cos(ang);
        var y = Math.sin(ang);
        
        this.vertices.push(x, y, 1);
        this.normals.push(0, 0, 1);
    }

    // push indices
    for (var i = 0; i < this.slices; i++) {
        var p1 = topCenterIndex + 1 + i;
        var p2 = topCenterIndex + 1 + i + 1;

        this.indices.push(topCenterIndex, p1, p2);
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  updateBuffers() {}
}
