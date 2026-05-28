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

        return true;
    }
}