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


        
        // Dropdown for sky texture selection
        this.gui.add(this.scene, 'selectedTexture', ['just_blue', 'cloudy_sky', 'farm_road'])
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