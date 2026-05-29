import { CGFobject, CGFappearance } from '../../../lib/CGF.js';
import { MyTreeTier } from './MyTreeTier.js'; 

export class MyTree extends CGFobject {
    constructor(scene) {
        super(scene);
        
        const sides = 9;
        
        // Tronco 
        this.trunk = new MyTreeTier(scene, sides, 0.2, 0.2);
        
        // 4 Camadas da copa. 
        this.tier1 = new MyTreeTier(scene, sides, 1.2, 0.6); 
        this.tier2 = new MyTreeTier(scene, sides, 1.0, 0.45);
        this.tier3 = new MyTreeTier(scene, sides, 0.8, 0.3);
        this.tier4 = new MyTreeTier(scene, sides, 0.6, 0.0); // Bico
        
        // --- MATERIAIS ---
        this.trunkMaterial = new CGFappearance(scene);
        this.trunkMaterial.setAmbient(0.3, 0.15, 0.1, 1.0); 
        this.trunkMaterial.setDiffuse(0.35, 0.25, 0.2, 1.0);
        this.trunkMaterial.setSpecular(0, 0, 0, 1); 

        this.leavesMaterial = new CGFappearance(scene);
        this.leavesMaterial.setAmbient(0.02, 0.10, 0.04, 1.0);  
        this.leavesMaterial.setDiffuse(0.05, 0.22, 0.08, 1.0);   
        this.leavesMaterial.setSpecular(0.0, 0.0, 0.0, 1.0);   
        this.leavesMaterial.setShininess(1.0);
    }

    display() {
        this.scene.pushMatrix();

        // ---- TRONCO ----
        this.trunkMaterial.apply();
        this.scene.pushMatrix();
            this.scene.scale(1, 1.4, 1);
            this.trunk.display();
        this.scene.popMatrix();

        // ---- COPA ----
        this.leavesMaterial.apply();

        // Camada 1
        this.scene.pushMatrix();
            this.scene.translate(0, 0.8, 0); 
            this.scene.scale(1, 1.1, 1); 
            this.tier1.display();
        this.scene.popMatrix();

        // Camada 2
        this.scene.pushMatrix();
            this.scene.translate(0, 1.6, 0); 
            this.scene.scale(1, 1.1, 1);
            this.scene.rotate(Math.PI / 12, 0, 1, 0); // 15 graus
            this.tier2.display();
        this.scene.popMatrix();

        // Camada 3
        this.scene.pushMatrix();
            this.scene.translate(0, 2.4, 0); 
            this.scene.scale(1, 1.1, 1);
            this.scene.rotate(Math.PI / 6, 0, 1, 0); // 30 graus
            this.tier3.display();
        this.scene.popMatrix();

        // Camada 4 (Bico)
        this.scene.pushMatrix();
            this.scene.translate(0, 3.2, 0); 
            this.scene.scale(1, 1.2, 1); // Deixei a 1.2 no Y para o bico ficar afiado
            this.scene.rotate(Math.PI / 4, 0, 1, 0); // 45 graus
            this.tier4.display();
        this.scene.popMatrix();

        this.scene.popMatrix();
    }
}