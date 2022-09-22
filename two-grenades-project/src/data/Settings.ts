import * as datGui from "dat.gui";

/**
 * Global parameters
 */
export class Settings {

    static isDebugMode = false;
    static assetsPath = './assets/';

    // render
    static readonly BG_COLOR = 0x0;
    static AA_TYPE = 1; // 0 - none, 1 - FXAA, 2 - SMAA

    // debug modes
    static TEST_MODE = false;

    // game
    static readonly METER_SIZE = 20;

    // utils
    static datGui: datGui.GUI;

};
