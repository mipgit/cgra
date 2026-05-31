attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uWalkPhase;
uniform float uSpeed;

varying vec3 vNormal;
varying vec3 vLocalPos;

void main() {
    vec3 pos = aVertexPosition;
    
    // Procedural leg animation for the back legs
    // The horse faces +X, so back legs have negative x.
    // Use a lower threshold (1.9) to avoid the belly.
    if (pos.y < 1.9 && uSpeed > 0.1) {
        float legFactor = clamp((1.9 - pos.y) / 1.7, 0.0, 1.0);
        float side = (pos.z > 0.0) ? 1.0 : -1.0;
        
        // Back legs (x < -0.4)
        if (pos.x < -0.4) {
            // Synchronize with the 6-frame sequence
            float cyclePhase = uWalkPhase * 1.047197; 
            float phase = cyclePhase - 1.047197 + 1.5708; 
            if (side < 0.0) phase += 3.14159; 
            
            float s = sin(phase);
            // Stronger falloff (pow 2.0) keeps the top of the leg more static
            float lift = max(0.0, s) * pow(legFactor, 2.0); 
            
            // 1. Point to the front: push lower leg forward
            pos.x += lift * 0.5 * legFactor;
            
            // 2. Bend the knee forward
            float bend = lift * 0.4 * sin(legFactor * 3.14159);
            pos.x += bend;
            
            // 3. Vertical step (reduced height)
            pos.y += lift * 0.4;
        }
    }

    vNormal   = normalize(mat3(uNMatrix) * aVertexNormal);
    vLocalPos = pos;
    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
