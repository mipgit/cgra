import { CGFobject, CGFappearance } from '../../lib/CGF.js';

/**
 * MyRock
 * @constructor
 * @param scene - Reference to MyScene object
 * @param position - Array [x, y, z] for world placement
 * @param radius - Collision radius
 */
export class MyRock extends CGFobject {
    constructor(scene, position, radius = 1.0) {
        super(scene);
        this.position = position;       
        this.radius   = radius;         
        this.size     = radius * 1.6;   
        
        this.appearance = new CGFappearance(scene);
        this.appearance.setAmbient(0.18, 0.18, 0.20, 1);
        this.appearance.setDiffuse(0.45, 0.45, 0.48, 1);
        this.appearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.appearance.setShininess(8);
        
        this.initBuffers();
    }

    initBuffers() {
        const rawVertices = [
            0.376, -0.231, 0.312,  0.500, -0.214, -0.084, 0.467, -0.047, -0.065, 
            0.329, 0.139, 0.172,   0.243, -0.022, -0.394, -0.150, 0.231, -0.148, 
            -0.329, 0.075, -0.376, -0.104, -0.007, -0.442,-0.110, -0.173, -0.451,
            -0.371, -0.165, -0.434,-0.165, -0.186, -0.170, 0.237, -0.188, -0.403,  
            -0.385, -0.187, 0.036,  0.116, -0.227, 0.451,  0.185, 0.050, 0.327,    
            -0.273, 0.082, 0.020,  -0.500, -0.166, -0.290, -0.400, 0.037, -0.217   
        ];

        const rawIndices = [
            0, 1, 2,     0, 2, 3,     3, 2, 4,     3, 4, 5,     
            6, 7, 8,     6, 8, 9,     10, 11, 1,   10, 1, 0,    
            1, 11, 4,    1, 4, 2,     12, 13, 14,  12, 14, 15,  
            10, 0, 13,   10, 13, 12,  0, 3, 14,    0, 14, 13,   
            3, 5, 15,    3, 15, 14,   6, 9, 16,    6, 16, 17,   
            5, 4, 7,     5, 7, 6,     4, 11, 8,    4, 8, 7,     
            11, 10, 9,   11, 9, 8,    10, 12, 16,  10, 16, 9,   
            12, 15, 17,  12, 17, 16,  15, 5, 6,    15, 6, 17    
        ];

        const rawTexCoords = [
            0.014, 0.871, 0.238, 0.867, 0.024, 0.964, 0.240, 0.958,
            0.428, 0.862, 0.430, 0.952, 0.648, 0.549, 0.868, 0.283,
            0.559, 0.993, 0.570, 0.858, 0.282, 0.465, 0.635, 0.461,
            0.963, 0.744, 0.665, 0.715, 0.519, 0.739, 0.098, 0.502,
            0.417, 0.191, 0.331, 0.428
        ];


        const makeFlat = (vertices, indices, texCoords, round = 3) => {
            const verts = [];
            const normals = [];
            const tex = [];
            const inds = [];
            const pow = Math.pow(10, round);
            const r3 = v => Math.round(v * pow) / pow;

            for (let i = 0; i < indices.length; i += 3) {
                const ia = indices[i] * 3;
                const ib = indices[i + 1] * 3;
                const ic = indices[i + 2] * 3;

                const ax = vertices[ia], ay = vertices[ia + 1], az = vertices[ia + 2];
                const bx = vertices[ib], by = vertices[ib + 1], bz = vertices[ib + 2];
                const cx = vertices[ic], cy = vertices[ic + 1], cz = vertices[ic + 2];

                const ux = bx - ax, uy = by - ay, uz = bz - az;
                const vx = cx - ax, vy = cy - ay, vz = cz - az;
                let nx = uy * vz - uz * vy;
                let ny = uz * vx - ux * vz;
                let nz = ux * vy - uy * vx;
                const nlen = Math.hypot(nx, ny, nz) || 1.0;
                nx /= nlen; ny /= nlen; nz /= nlen;

                const base = verts.length / 3;
                verts.push(r3(ax), r3(ay), r3(az), r3(bx), r3(by), r3(bz), r3(cx), r3(cy), r3(cz));
                normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);

                if (texCoords && texCoords.length >= (indices[i + 2] + 1) * 2) {
                    const ua = texCoords[indices[i] * 2];
                    const va = texCoords[indices[i] * 2 + 1];
                    const ub = texCoords[indices[i + 1] * 2];
                    const vb = texCoords[indices[i + 1] * 2 + 1];
                    const uc = texCoords[indices[i + 2] * 2];
                    const vc = texCoords[indices[i + 2] * 2 + 1];
                    tex.push(ua, va, ub, vb, uc, vc);
                }

                inds.push(base, base + 1, base + 2);
            }

            return { vertices: verts, normals: normals, texCoords: tex.length ? tex : null, indices: inds };
        };

        const flat = makeFlat(rawVertices, rawIndices, rawTexCoords, 3);
        this.vertices = flat.vertices;
        this.normals = flat.normals;
        if (flat.texCoords) this.texCoords = flat.texCoords;
        this.indices = flat.indices;

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        const s = this.scene;
        s.pushMatrix();
        s.translate(this.position[0], this.position[1], this.position[2]);
        s.scale(this.size, this.size, this.size);
        this.appearance.apply();
        super.display(); // Desenha a geometria construída no initBuffers
        s.popMatrix();
    }
}