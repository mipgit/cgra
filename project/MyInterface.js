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
        this.gui.add(this.scene, 'displayAxis').name('axis');
        
        // Dropdown for sky texture selection
        this.gui.add(this.scene, 'selectedTexture', ['basic', 'farm_road', 'full_clouds', 'just_blue'])
              .name('sky')
              .onChange(() => this.scene.updateTexture());

        // Debug: hide the wagon and show a single horse OBJ at origin so we
        // can inspect each spliced file in isolation.
        const horseFolder = this.gui.addFolder('horse test');
        horseFolder.add(this.scene, 'horseTestMode').name('test mode');
        horseFolder.add(this.scene, 'horseTestSlot', {
            'neutral':              0,
            'spliced_a':            1,
            'spliced_b (RF lift)':  2,
            'spliced_c (LH lift)':  3,
            'spliced_d (LF lift)':  4,
        }).name('which obj');
        horseFolder.open();

        return true;
    }
}