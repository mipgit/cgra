import { CGFobject } from '../lib/CGF.js';

export class MyGambrelRoof extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        // Perfil base (coincidir com as medidas da empena)
        const xBase = 0.5, yBase = 0.0;
        const xMid = 0.35, yMid = 0.7;
        const xTop = 0.0,  yTop = 1.2;
        
        // --- PARÂMETROS DA ESPESSURA ---
        const t = 0.06;   // Espessura da chapa do telhado
        const ohX = 0.06; // O quanto o beiral sai para as laterais
        const ohY = 0.05; // O quanto o beiral desce
        const ohZ = 0.08; // O quanto o telhado sai para a frente/trás das paredes

        const zF = 0.5 + ohZ;   // Z da Frente do telhado
        const zB = -0.5 - ohZ;  // Z de Trás do telhado
        
        // 5 Pontos de DENTRO (coincidir com as medidas do celeiro)
        const inR = [
            [xBase, yBase], [xMid, yMid], [xTop, yTop], [-xMid, yMid], [-xBase, yBase]
        ];
        
        // 5 Pontos de FORA 
        const outR = [
            [xBase + ohX, yBase - ohY],      // Beiral Direito
            [xMid + t + 0.02, yMid + t],     // Cotovelo Direito
            [xTop, yTop + t * 1.5],          // Cume do Telhado
            [-xMid - t - 0.02, yMid + t],    // Cotovelo Esquerdo
            [-xBase - ohX, yBase - ohY]      // Beiral Esquerdo
        ];

        const addFace = (p1, p2, p3, p4, normal) => {
            const base = this.vertices.length / 3;
            this.vertices.push(...p1, ...p2, ...p3, ...p4);
            this.normals.push(...normal, ...normal, ...normal, ...normal);
            this.texCoords.push(0, 1, 1, 1, 1, 0, 0, 0);
            this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        };

        // Gerar a malha sólida (4 blocos)
        for(let i = 0; i < 4; i++) {
            const iA = inR[i], iB = inR[i+1];
            const oA = outR[i], oB = outR[i+1];
            
            const iA_F = [iA[0], iA[1], zF], iA_B = [iA[0], iA[1], zB];
            const iB_F = [iB[0], iB[1], zF], iB_B = [iB[0], iB[1], zB];
            const oA_F = [oA[0], oA[1], zF], oA_B = [oA[0], oA[1], zB];
            const oB_F = [oB[0], oB[1], zF], oB_B = [oB[0], oB[1], zB];

            // Calcular a normal externa
            const dx = oB[0] - oA[0], dy = oB[1] - oA[1];
            const len = Math.sqrt(dx*dx + dy*dy);
            const nx = dy/len, ny = -dx/len;

            // Construir as 4 faces do bloco
            addFace(oB_F, oA_F, oA_B, oB_B, [nx, ny, 0]);      // Topo (Externo)
            addFace(iA_F, iB_F, iB_B, iA_B, [-nx, -ny, 0]);    // Fundo (Interno)
            addFace(iA_F, oA_F, oB_F, iB_F, [0, 0, 1]);        // Frente (Borda)
            addFace(oA_B, iA_B, iB_B, oB_B, [0, 0, -1]);       // Trás (Borda)
        }

        // Tapar os beirais (as pontinhas de baixo)
        const oR_F = [...outR[0], zF], oR_B = [...outR[0], zB];
        const iR_F = [...inR[0], zF],  iR_B = [...inR[0], zB];
        addFace(oR_B, oR_F, iR_F, iR_B, [0.7, -0.7, 0]); // Remate Direito

        const oL_F = [...outR[4], zF], oL_B = [...outR[4], zB];
        const iL_F = [...inR[4], zF],  iL_B = [...inR[4], zB];
        addFace(iL_B, iL_F, oL_F, oL_B, [-0.7, -0.7, 0]); // Remate Esquerdo

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}