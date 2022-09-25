import { ThreeLoader } from './utils/loaders/ThreeLoader';
import { Signal } from './events/Signal';
import { TEXTURE_LOAD_LIST } from './data/TextureData';
import { Settings } from './data/Settings';
import { LogMng } from './utils/LogMng';
import { MODEL_LOAD_LIST } from './data/ModelData';

export class GamePreloader {
    private _loader: ThreeLoader;
    private _isDefaultLoaded = false;
    private _isLoadingInProcess = false;

    onLoadCompleteSignal = new Signal();
    onLoadProgressSignal = new Signal();

    start() {
        if (this._isDefaultLoaded || this._isLoadingInProcess) {
            LogMng.warn(``);
            return;
        }
        this._isDefaultLoaded = true;
        this._isLoadingInProcess = true;
        // init ThreeLoader
        this._loader = ThreeLoader.getInstance({
            isDebugMode: Settings.isDebugMode
        });
        this._loader.onLoadUpdateSignal.add(this.onLoadUpdate, this);
        this._loader.onLoadCompleteSignal.add(this.onLoadComplete, this);
        this.addAssetsToLoader();
        this._loader.start();
    }
    
    private addAssetsToLoader() {

        let assetsPath = Settings.assetsPath;

        // models
        for (let i = 0; i < MODEL_LOAD_LIST.length; i++) {
            const item = MODEL_LOAD_LIST[i];
            this._loader.model(item.alias, assetsPath + item.file);
        }

        // textures
        for (let i = 0; i < TEXTURE_LOAD_LIST.length; i++) {
            const item = TEXTURE_LOAD_LIST[i];
            this._loader.texture(item.alias, assetsPath + item.file);
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
