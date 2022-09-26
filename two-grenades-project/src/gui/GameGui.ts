import { Signal } from "../events/Signal";
import { GrenadeEffect } from "../objects/weapon/Grenade";

type GuiData = {
    grenadeEffect: string;
    restart: Function;
};

export class GameGui {
    private _gui: dat.GUI;
    private _guiData: GuiData;
    onRestartClickSignal = new Signal();

    constructor(aDatGui: dat.GUI) {

        this._gui = aDatGui;

        const GRENADE_LIST = Object.keys(GrenadeEffect);
        this._guiData = {
            grenadeEffect: GRENADE_LIST[0],
            restart: () => {
                this.onRestartClickSignal.dispatch();
            }
        };

        let sceneFolder = this._gui.addFolder('Game');
        sceneFolder.add(this._guiData, 'grenadeEffect', GRENADE_LIST);
        sceneFolder.add(this._guiData, 'restart');
        sceneFolder.open();
        
    }
    
    public get grenadeEffect(): GrenadeEffect {
        return this._guiData.grenadeEffect as GrenadeEffect;
    }
    

}