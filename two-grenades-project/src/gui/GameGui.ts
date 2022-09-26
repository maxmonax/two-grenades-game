import { GrenadeEffect } from "../objects/weapon/Grenade";

type GuiData = {
    grenadeEffect: string;
};

export class GameGui {
    private _gui: dat.GUI;
    private _guiData: GuiData;

    constructor(aDatGui: dat.GUI) {

        this._gui = aDatGui;

        const GRENADE_LIST = Object.keys(GrenadeEffect);
        this._guiData = {
            grenadeEffect: GRENADE_LIST[0]
        };

        let sceneFolder = this._gui.addFolder('Game');
        sceneFolder.add(this._guiData, 'grenadeEffect', GRENADE_LIST);
        sceneFolder.open();
        
    }
    
    public get grenadeEffect(): GrenadeEffect {
        return this._guiData.grenadeEffect as GrenadeEffect;
    }
    

}