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

        // Store interface reference in the scene for camera changes
        this.scene.interface = this;

        
        // init GUI. For more information on the methods, check:
        // https://github.com/dataarts/dat.gui/blob/master/API.md
        this.gui = new dat.GUI();

        //Checkbox element in GUI
        this.gui.add(this.scene, 'displayAxis').name('axis');

        // Camera selection
        this.gui.add(this.scene, 'selectedCamera', ['Wagon', 'Orbit', 'Birds Eye'])
              .name('Camera Mode')
              .onChange((val) => {
                  this.scene.updateCameraMode(val);
                  if (document.activeElement) document.activeElement.blur();
              });


        
        // Enhanced Clouds controls
        const cloudsFolder = this.gui.addFolder('Enhanced Clouds');
        cloudsFolder.add(this.scene, 'cloudSpeed', 0.0, 4.0, 0.1).name('Wind Speed');
        cloudsFolder.add(this.scene, 'shaderCloudAlpha', 0.0, 1.0, 0.05).name('Alpha/Density');
        cloudsFolder.add(this.scene, 'shaderCloudScale', 0.1, 1.5, 0.05).name('Scale');
        cloudsFolder.add(this.scene, 'shaderCloudDensity', 0.2, 0.7, 0.02).name('Cutoff');
        cloudsFolder.open();

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