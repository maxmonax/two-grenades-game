import { GrenadeEffect } from "../objects/weapon/Grenade";

type GuiData = {
    grenadeType: string;
};

export class GameGui {
    private _gui: dat.GUI;
    private _guiData: GuiData;

    constructor(aDatGui: dat.GUI) {
        this._gui = aDatGui;

        const GRENADE_LIST = Object.keys(GrenadeEffect);
        this._guiData = {
            grenadeType: GRENADE_LIST[0]
        };

        let sceneFolder = this._gui.addFolder('Game');
        sceneFolder.add(this._guiData, 'grenadeType', GRENADE_LIST);
        sceneFolder.open();
        
    }

}