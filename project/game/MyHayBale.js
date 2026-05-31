import { CGFobject, CGFappearance, CGFtexture } from '../../lib/CGF.js';

// Hay bale - State machine:
//   'free'      -> sits on ground at this.position; arrow renders above it
//   'carried'   -> controller has handed it to the wagon; position is overwritten
//                 each frame to sit on the wagon's back (slot 0 or 1)
//   'stored'    -> delivered to the barn and left visible inside it
//   'delivered' -> reserved for non-visible removal
export class MyHayBale extends CGFobject {
    constructor(scene, position) {
        super(scene);
        this.position = position;       // [x, y, z]
        this.initialPosition = [...position];
        this.heading  = Math.random() * Math.PI * 2; // visual variety
        this.initialHeading = this.heading;
        this.pitch    = 0;
        this.size     = { x: 0.7, y: 0.7, z: 0.9 };
        this.radius   = 0.6;            // pickup proximity
        this.state    = 'free';

        this.appearance = new CGFappearance(scene);
        this.appearance.setAmbient(0.40, 0.40, 0.40, 1);
        this.appearance.setDiffuse(0.80, 0.80, 0.80, 1);
        this.appearance.setSpecular(0.05, 0.05, 0.05, 1);
        this.appearance.setShininess(10);
        
        this.texture = new CGFtexture(scene, 'textures/haybale.png');
        this.appearance.setTexture(this.texture);
        this.appearance.setTextureWrap('REPEAT', 'REPEAT');

        this.initBuffers();
    }

    initBuffers() {
        this.vertices = []; this.normals = []; this.indices = []; this.texCoords = [];
        const faces = [
            { n: [ 1, 0, 0], v: [[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5],[ 0.5,-0.5, 0.5]] },
            { n: [-1, 0, 0], v: [[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5],[-0.5,-0.5,-0.5]] },
            { n: [ 0, 1, 0], v: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]] },
            { n: [ 0,-1, 0], v: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]] },
            { n: [ 0, 0, 1], v: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]] },
            { n: [ 0, 0,-1], v: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]] },
        ];
        let i = 0;
        for (const f of faces) {
            for (const p of f.v) { this.vertices.push(...p); this.normals.push(...f.n); }
            this.indices.push(i, i+1, i+2,  i, i+2, i+3);
            this.texCoords.push(0, 1, 1, 1, 1, 0, 0, 0); // basic mapping for each face
            i += 4;
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    // Called by controller when this bale is 'carried'. Slot is 0 or 1.
    // Places the bale on top of the wagon bed base.
    followWagon(wagonController, slot) {
        const forwardX = Math.cos(wagonController.heading);
        const forwardZ = -Math.sin(wagonController.heading);

        // Right vector (perpendicular to forward)
        const rightX = Math.sin(wagonController.heading);
        const rightZ = Math.cos(wagonController.heading);
        
        // Offset along the wagon's length (X axis in local space)
    
        const localXOffset = 0.8; 
        
        // Offset along the wagon's width (Z axis in local space)
        // Slot 0 is on the left, Slot 1 is on the right
        const localZOffset = slot === 0 ? 0.5 : -0.5;

        // Local Y offset is 1.6 (top of the bed base)
        const localYOffset = 1.6;

        // Apply wagon pitch (rotation around local Z axis)
        const pitch = wagonController.pitch;
        const rotatedX = localXOffset * Math.cos(pitch) - localYOffset * Math.sin(pitch);
        const rotatedY = localXOffset * Math.sin(pitch) + localYOffset * Math.cos(pitch);

        this.position[0] = wagonController.position[0] + forwardX * rotatedX + rightX * localZOffset;
        this.position[1] = wagonController.position[1] + rotatedY;
        this.position[2] = wagonController.position[2] + forwardZ * rotatedX + rightZ * localZOffset;
        
        // Rotate 90 degrees relative to wagon heading
        this.heading = wagonController.heading + Math.PI / 2;
        this.pitch = pitch;
    }

    display() {
        if (this.state === 'delivered') return;
        const s = this.scene;
        s.pushMatrix();
        
        // Translate to the bottom center of the bale
        s.translate(this.position[0], this.position[1], this.position[2]);
        
        // Apply rotations
        s.rotate(this.heading, 0, 1, 0);
        if (this.state === 'carried') {
            s.rotate(this.pitch, 0, 0, 1);
        }
        
        // Translate up by half size so the bottom rests on this.position
        s.translate(0, this.size.y * 0.5, 0);
        s.scale(this.size.x, this.size.y, this.size.z);
        
        this.appearance.apply();
        super.display();
        s.popMatrix();
    }
}
