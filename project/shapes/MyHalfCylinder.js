import { CGFobject } from "../../lib/CGF.js";

export class MyHalfCylinder extends CGFobject {
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

        // from angle PI to 2*PI
        var startAng = Math.PI;
        var endAng = 2 * Math.PI;
        var alphaAng = (endAng - startAng) / this.slices;
        
        // Z centered from -0.5 to 0.5 to match other simple geometric objects
        var zStart = -0.5;
        var h = 1 / this.stacks;

        for (var j = 0; j <= this.stacks; j++) {
            var z = zStart + j * h;
            for (var i = 0; i <= this.slices; i++) {
                var ang = startAng + i * alphaAng;
                var ca = Math.cos(ang);
                var sa = Math.sin(ang);

                // radius is 1. x goes from -1 to 1. y goes from 0 to -1 to 0.
                this.vertices.push(ca, sa, z);
                
                this.normals.push(-ca, -sa, 0);

                // TexCoords
                var u = i / this.slices;
                var v = j / this.stacks;
                this.texCoords.push(u, v);
            }
        }

        // Indices
        for (var j = 0; j < this.stacks; j++) {
            for (var i = 0; i < this.slices; i++) {
                var bl = j * (this.slices + 1) + i;
                var br = j * (this.slices + 1) + (i + 1);
                var tl = (j + 1) * (this.slices + 1) + i;
                var tr = (j + 1) * (this.slices + 1) + (i + 1);

                this.indices.push(tl, br, bl);
                this.indices.push(tl, tr, br);

                this.indices.push(bl, br, tl);
                this.indices.push(br, tr, tl);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}
