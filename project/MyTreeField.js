import { MyTree } from './MyTree.js';

export class MyTreeField {
    constructor(scene, instances) {
        this.scene = scene;
        this.instances = instances;
        this.tree = new MyTree(scene);
    }

    display() {
        const scene = this.scene;
        for (const inst of this.instances) {
            const h = scene.getHeight ? scene.getHeight(inst.x, inst.z) : -3.0;
            scene.pushMatrix();
            scene.translate(inst.x, h, inst.z);
            scene.rotate(inst.rotY, 0, 1, 0);
            scene.scale(inst.scale, inst.scale, inst.scale);
            this.tree.display();
            scene.popMatrix();
        }
    }
}
