import {CGFinterface, dat} from '../lib/CGF.js';

/**
* MyInterface
* @constructor
*/
export class MyInterface extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        // call CGFinterface init
        super.init(application);
        
        // init GUI. For more information on the methods, check:
        // https://github.com/dataarts/dat.gui/blob/master/API.md
        this.gui = new dat.GUI();

        //Checkbox element in GUI
        this.gui.add(this.scene, 'displayAxis').name('Display Axis');

        // Tangram pieces
        this.gui.add(this.scene, 'displayDiamond').name('Diamond');
        this.gui.add(this.scene, 'displayParallelogram').name('Parallelogram');
        this.gui.add(this.scene, 'displayTriangle').name('Medium Triangle');
        this.gui.add(this.scene, 'displayTriangleBig1').name('Big Triangle 1');
        this.gui.add(this.scene, 'displayTriangleBig2').name('Big Triangle 2');
        this.gui.add(this.scene, 'displayTriangleSmall1').name('Small Triangle 1');
        this.gui.add(this.scene, 'displayTriangleSmall2').name('Small Triangle 2');

        //Slider element in GUI
        this.gui.add(this.scene, 'scaleFactor', 0.1, 5).name('Scale Factor');

        return true;
    }
}