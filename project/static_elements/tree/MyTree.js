import { CGFappearance } from '../../../lib/CGF.js';
import { MyCone } from './MyCone.js';
import { MyCylinder } from './MyCylinder.js';

export class MyTree {
    constructor(scene) {
        this.scene = scene;
        // Criar os componentes com 8 lados para o estilo low poly
        this.trunk = new MyCylinder(scene, 8);
        this.top = new MyCone(scene, 8);
        
        // Definição simples de materiais (Cores)
        this.trunkMaterial = new CGFappearance(scene);
        this.trunkMaterial.setAmbient(0.4, 0.25, 0.15, 1.0); // Castanho
        this.trunkMaterial.setDiffuse(0.4, 0.25, 0.15, 1.0);

        this.leavesMaterial = new CGFappearance(scene);
        this.leavesMaterial.setAmbient(0.2, 0.5, 0.3, 1.0);  // Verde
        this.leavesMaterial.setDiffuse(0.2, 0.5, 0.3, 1.0);
    }

    display() {
        const gl = this.scene.gl;
        gl.disable(gl.CULL_FACE);

        // ---- TRONCO ----
        this.scene.pushMatrix();
            this.trunkMaterial.apply();
            this.scene.scale(0.3, 1.5, 0.3); // Tronco alto e fino
            this.trunk.display();
        this.scene.popMatrix();

        // ---- COPA (Empilhamento de Cones) ----
        this.leavesMaterial.apply();

        // Cone 1 (O de baixo, maior)
        this.scene.pushMatrix();
            this.scene.translate(0, 1.2, 0); // Posicionado logo acima do tronco
            this.scene.scale(1.5, 1.2, 1.5); // Largo e achatado
            this.top.display();
        this.scene.popMatrix();

        // Cone 2 (O do meio, médio)
        this.scene.pushMatrix();
            this.scene.translate(0, 2.0, 0); // Mais acima
            this.scene.scale(1.2, 1.1, 1.2); // Um pouco menor
            this.top.display();
        this.scene.popMatrix();

        // Cone 3 (O do topo, pequeno e pontiagudo)
        this.scene.pushMatrix();
            this.scene.translate(0, 2.8, 0); // No topo da árvore
            this.scene.scale(0.9, 1.0, 0.9); // Mais estreito
            this.top.display();
        this.scene.popMatrix();

        gl.enable(gl.CULL_FACE);
    }
}