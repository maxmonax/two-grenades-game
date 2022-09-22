import { ThreeLoader } from './loaders/ThreeLoader';
import { Signal } from './events/Signal';
import { TEXTURE_LOAD_LIST } from './data/TextureData';
import { Settings } from './data/Settings';

export class GameLoader {
    private _loader: ThreeLoader;
    private _isDefaultLoaded = false;
    private _isLoadingInProcess = false;

    onLoadCompleteSignal = new Signal();
    onLoadProgressSignal = new Signal();

    constructor() {
        this._loader = ThreeLoader.getInstance({
            isDebugMode: Settings.isDebugMode
        });
    }
    
    loadInitPack() {
        if (this._isDefaultLoaded || this._isLoadingInProcess) return;
        this._isDefaultLoaded = true;
        this._isLoadingInProcess = true;
        this._loader.onLoadUpdateSignal.add(this.onLoadUpdate, this);
        this._loader.onLoadCompleteSignal.add(this.onLoadComplete, this);
        this.addInitAssetsToLoader();
        this._loader.start();
    }
    
    private addInitAssetsToLoader() {

        let assetsPath = Settings.assetsPath;

        // characters
        assetsPath = Settings.assetsPath + 'characters/';
        this._loader.model('charBot', `${assetsPath}BotTPose.fbx`);
        this._loader.model('charBotIdleAnim', `${assetsPath}Bot_Crouch_Idle_Anim.fbx`);
        this._loader.model('charBotGrenadeAnim', `${assetsPath}Bot_Grenade_Throw_Anim.fbx`);
        this._loader.model('charBotDeathAnim', `${assetsPath}Bot_Crouch_Death_Anim.fbx`);

        this._loader.model('charSwat', `${assetsPath}SwatTPose.fbx`);
        this._loader.model('charSwatIdleAnim', `${assetsPath}Swat_Crouch_Idle_Anim.fbx`);
        this._loader.model('charSwatGrenadeAnim', `${assetsPath}Swat_Grenade_Throw_Anim.fbx`);
        this._loader.model('charSwatDeathAnim', `${assetsPath}Swat_Crouch_Death_Anim.fbx`);

        // textures
        assetsPath = Settings.assetsPath;
        for (let i = 0; i < TEXTURE_LOAD_LIST.length; i++) {
            const item = TEXTURE_LOAD_LIST[i];
            let filePath = item.file;
            filePath = assetsPath + filePath;
            this._loader.texture(item.alias, filePath);
        }

    }

    private onLoadUpdate(aProgressPercent: number) {
        this.onLoadProgressSignal.dispatch(aProgressPercent);
    }

    private onLoadComplete() {
        this._isLoadingInProcess = false;
        this.onLoadCompleteSignal.dispatch();
    }

}
