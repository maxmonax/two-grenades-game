import * as datGui from "dat.gui";

/**
 * Global parameters
 */
export class Settings {

    // sources
    static assetsPath = './assets/';

    // modes
    static isDebugMode = false;

    // render
    static readonly BG_COLOR = 0x0;
    static AA_TYPE = 1; // 0 - none, 1 - FXAA, 2 - SMAA

    // game
    static readonly METER_SIZE = 20;

    // utils
    static datGui: datGui.GUI;

};
