import { ThreeLoader } from './loaders/ThreeLoader';
import { Signal } from './events/Signal';
import { Config } from './data/Config';
import { TextureAlias, TEXTURE_LOAD_DATA } from './data/TextureData';

export class Preloader {
    private loader: ThreeLoader;
    private currLoadPerc = 0;
    private isDefaultLoaded = false;
    private _isLoadingInProcess = false;

    onLoadCompleteSignal = new Signal();
    onLoadProgressSignal = new Signal();

    constructor() {
        this.loader = ThreeLoader.getInstance({
            isDebugMode: Config.isDebugMode
        });
    }
    
    loadInitPack() {
        if (this.isDefaultLoaded || this._isLoadingInProcess) return;
        this.isDefaultLoaded = true;
        this._isLoadingInProcess = true;
        this.loader.onLoadUpdateSignal.add(this.onLoadUpdate, this);
        this.loader.onLoadCompleteSignal.add(this.onLoadComplete, this);
        this.addInitAssetsToLoader();
        this.loader.start();
    }
    
    private addInitAssetsToLoader() {

        let assetsPath = Config.assetsPath;

        // characters
        assetsPath = Config.assetsPath + 'characters/';
        this.loader.model('charBot', `${assetsPath}BotTPose.fbx`);
        this.loader.model('charBotIdleAnim', `${assetsPath}Bot_Crouch_Idle_Anim.fbx`);

        this.loader.model('charSwat', `${assetsPath}SwatTPose.fbx`);
        this.loader.model('charSwatIdleAnim', `${assetsPath}Swat_Crouch_Idle_Anim.fbx`);

        // load textures

        assetsPath = Config.assetsPath + '';

        for (let i = 0; i < TEXTURE_LOAD_DATA.length; i++) {
            const item = TEXTURE_LOAD_DATA[i];
            let filePath = item.file;
            filePath = assetsPath + filePath;
            this.loader.texture(item.alias, filePath);
        }

    }

    private onLoadUpdate(aPerc: number) {
        if (aPerc - this.currLoadPerc > 10) {
            this.currLoadPerc = aPerc;
            this.onLoadProgressSignal.dispatch(this.currLoadPerc);
            if (Config.isDebugMode) {
                console.log('loading: ', this.currLoadPerc);
            }
        }
    }

    private onLoadComplete() {
        this._isLoadingInProcess = false;
        this.onLoadCompleteSignal.dispatch();
    }

}
