import { CGFobject, CGFappearance } from '../lib/CGF.js';
import { MyCube } from './MyCube.js';
import { MyGambrelRoof } from './MyGambrelRoof.js'; 
import { MyGable } from './MyGable.js';


export class MyBarn extends CGFobject {
    constructor(scene, position, activationRadius = 5.0, scale = 1.5) {
        super(scene);
        
        // Anel e Posição
        this.position = position;
        this.activationRadius = activationRadius;
        this.isActive = false; // Controlador altera isto
        this.ring = new MyRing(this.scene, 1.0, 0.85, 48);

        // Escala e Componentes
        this.scale = scale;
        this.cube = new MyCube(scene);
        this.roof = new MyGambrelRoof(scene);
        this.gable = new MyGable(scene);

        // --- MATERIAIS DO CELEIRO ---
        this.redMat = new CGFappearance(scene);
        this.redMat.setAmbient(0.6, 0.15, 0.15, 1);
        this.redMat.setDiffuse(0.7, 0.2, 0.2, 1);

        this.whiteMat = new CGFappearance(scene);
        this.whiteMat.setAmbient(0.8, 0.8, 0.8, 1);
        this.whiteMat.setDiffuse(0.95, 0.95, 0.95, 1);

        this.roofMat = new CGFappearance(scene);
        this.roofMat.setAmbient(0.2, 0.2, 0.2, 1);
        this.roofMat.setDiffuse(0.3, 0.3, 0.3, 1);

        this.glassMat = new CGFappearance(scene);
        this.glassMat.setAmbient(0.3, 0.5, 0.7, 1.0);  
        this.glassMat.setDiffuse(0.4, 0.7, 0.9, 1.0);  
        this.glassMat.setSpecular(0.8, 0.9, 1.0, 1.0); 
        this.glassMat.setShininess(50);

        // --- MATERIAIS DO ANEL---
        this.ringInactive = new CGFappearance(scene);
        this.ringInactive.setAmbient(0.20, 0.20, 0.20, 1);
        this.ringInactive.setDiffuse(0.40, 0.40, 0.40, 1);
        this.ringInactive.setEmission(0.05, 0.05, 0.05, 1);
        this.ringInactive.setSpecular(0, 0, 0, 1);

        this.ringActive = new CGFappearance(scene);
        this.ringActive.setAmbient(0.15, 0.35, 0.15, 1);
        this.ringActive.setDiffuse(0.30, 0.80, 0.30, 1);
        this.ringActive.setEmission(0.20, 0.55, 0.20, 1);
        this.ringActive.setSpecular(0, 0, 0, 1);
    }

    display() {
        const s = this.scene; 

        const width = 5.0 * this.scale;
        const height = 3.5 * this.scale;
        const depth = 5.0 * this.scale;
        const roofHeight = 2.0 * this.scale;
        const trimSize = 0.15 * this.scale; 
        const eps = 0.01; 

        s.pushMatrix();
        s.translate(this.position[0], this.position[1], this.position[2]);


        // ==========================================
        // 1. CORPO PRINCIPAL (Cubo sólido vermelho)
        // ==========================================
        this.scene.pushMatrix();
            this.scene.translate(0, height / 2, 0);
            this.scene.scale(width, height, depth);
            this.redMat.apply();
            this.cube.display();
        this.scene.popMatrix();

        // ==========================================
        // 2. EMPENAS VERMELHAS 
        // ==========================================
        this.redMat.apply();
        
        // Empena Frontal (Alineada com a face frontal do cubo)
        this.scene.pushMatrix();
            this.scene.translate(0, height, depth / 2 - eps); // -eps para colar bem à parede
            // IMPORTANTE: A largura é a mesma do celeiro, não do telhado.
            this.scene.scale(width, roofHeight, 1); 
            this.gable.display();
        this.scene.popMatrix();

        // Empena Traseira (Alinhada com a face traseira do cubo)
        this.scene.pushMatrix();
            this.scene.translate(0, height, -depth / 2 + eps);
            this.scene.scale(width, roofHeight, 1);
            this.gable.display();
        this.scene.popMatrix();

        // ==========================================
        // 3. TELHADO GAMBREL SÓLIDO
        // ==========================================
        this.scene.pushMatrix();
            this.scene.translate(0, height, 0);
            this.scene.scale(width, roofHeight, depth); 
            this.roofMat.apply();
            this.roof.display();
        this.scene.popMatrix();

        // ==========================================
        // 4.1 VIGAS VERTICAIS CORE
        // ==========================================
        this.whiteMat.apply();
        const cornerX = width / 2 + trimSize / 2;
        const cornerZ = depth / 2 + trimSize / 2;

        const corners = [
            [cornerX, cornerZ], [-cornerX, cornerZ], 
            [cornerX, -cornerZ], [-cornerX, -cornerZ]
        ];

        corners.forEach(pos => {
            this.scene.pushMatrix();
                this.scene.translate(pos[0], height / 2, pos[1]);
                this.scene.scale(trimSize, height, trimSize);
                this.cube.display();
            this.scene.popMatrix();
        });


        // ==========================================
        // 4.2 VIGAS VERTICAIS CENTRAIS (Costas e Laterais)
        // ==========================================
        
        // Viga Tras
        this.scene.pushMatrix();
            // X = 0 (meio), Z igual aos cantos traseiros
            this.scene.translate(0, height / 2, -depth / 2 - trimSize / 2);
            this.scene.scale(trimSize, height, trimSize);
            this.cube.display();
        this.scene.popMatrix();

        // Viga Esq
        this.scene.pushMatrix();
            // X igual aos cantos esquerdos, Z = 0 (meio)
            this.scene.translate(-width / 2 - trimSize / 2, height / 2, 0);
            this.scene.scale(trimSize, height, trimSize);
            this.cube.display();
        this.scene.popMatrix();

        // Viga Dir
        this.scene.pushMatrix();
            // X igual aos cantos direitos, Z = 0 (meio)
            this.scene.translate(width / 2 + trimSize / 2, height / 2, 0);
            this.scene.scale(trimSize, height, trimSize);
            this.cube.display();
        this.scene.popMatrix();


        // ==========================================
        // 4.3 VIGAS HORIZONTAIS 
        // ==========================================
        
        // Viga Frente
        this.scene.pushMatrix();
            // Colocada em Y = height (na costura entre o cubo e as empenas)
            this.scene.translate(0, height, depth / 2 + trimSize / 2);
            // Largura do celeiro + a espessura dos 2 postes laterais
            this.scene.scale(width + trimSize * 2, trimSize, trimSize);
            this.cube.display();
        this.scene.popMatrix();

        // Viga Tras
        this.scene.pushMatrix();
            this.scene.translate(0, height, -depth / 2 - trimSize / 2);
            this.scene.scale(width + trimSize * 2, trimSize, trimSize);
            this.cube.display();
        this.scene.popMatrix();

        // Viga Lateral Esq
        this.scene.pushMatrix();
            this.scene.translate(-width / 2 - trimSize / 2, height, 0);
            this.scene.scale(trimSize, trimSize, depth + trimSize * 2);
            this.cube.display();
        this.scene.popMatrix();

        // Viga Lateral Dir
        this.scene.pushMatrix();
            this.scene.translate(width / 2 + trimSize / 2, height, 0);
            this.scene.scale(trimSize, trimSize, depth + trimSize * 2);
            this.cube.display();
        this.scene.popMatrix();

        // ==========================================
        // 5. JANELA
        // ==========================================
        this.scene.pushMatrix();
            // Coloca no centro em Z do gable (depth/2)
            this.scene.translate(0, height + 0.6 * this.scale, depth / 2 + trimSize/2);
            this.scene.scale(0.8 * this.scale, 0.8 * this.scale, trimSize);
            this.cube.display();
        this.scene.popMatrix();

        s.popMatrix(); //fechamos celeiro





        

        // ==========================================
        // 7. ANEL DE ATIVAÇÃO
        // ==========================================
        s.pushMatrix();
            // Mantém-se encostado ao chão (Y + 0.02)
            s.translate(this.position[0], this.position[1] + 0.02, this.position[2]);
            s.scale(this.activationRadius, 1, this.activationRadius);
            (this.isActive ? this.ringActive : this.ringInactive).apply();
            this.ring.display();
        s.popMatrix();
    }
}

// ==================================================
// CLASSE SECUNDÁRIA DO ANEL 
// ==================================================
class MyRing extends CGFobject {
    constructor(scene, outerR = 1.0, innerR = 0.85, segments = 48) {
        super(scene);
        this.outerR = outerR;
        this.innerR = innerR;
        this.segments = segments;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = []; this.normals = []; this.indices = []; this.texCoords = [];
        const N = this.segments;
        for (let i = 0; i <= N; i++) {
            const a = (i / N) * 2 * Math.PI;
            const c = Math.cos(a), s = Math.sin(a);
            this.vertices.push(c * this.outerR, 0, s * this.outerR);
            this.normals.push(0, 1, 0);
            this.texCoords.push(i / N, 0);
            this.vertices.push(c * this.innerR, 0, s * this.innerR);
            this.normals.push(0, 1, 0);
            this.texCoords.push(i / N, 1);
        }
        for (let i = 0; i < N; i++) {
            const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
            this.indices.push(a, c, b,  b, c, d);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}