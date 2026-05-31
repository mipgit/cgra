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

        // Enhanced Clouds controls
        const cloudsFolder = this.gui.addFolder('Enhanced Clouds');
        cloudsFolder.add(this.scene, 'cloudSpeed', 0.0, 4.0, 0.1).name('Wind Speed');
        cloudsFolder.add(this.scene, 'shaderCloudAlpha', 0.0, 1.0, 0.05).name('Alpha/Density');
        cloudsFolder.add(this.scene, 'shaderCloudScale', 0.1, 1.5, 0.05).name('Scale');
        cloudsFolder.add(this.scene, 'shaderCloudDensity', 0.2, 0.7, 0.02).name('Cutoff');
        cloudsFolder.open();

        return true;
    }
}