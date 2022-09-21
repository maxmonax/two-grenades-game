import { Preloader } from './Preloader';
import { GameEngine } from './GameEngine';
import { Config } from './data/Config';
import { LogMng } from "./utils/LogMng";
import * as MyUtils from './utils/MyUtils';

type InitParams = {
    assetsPath: string;
    domCanvasParent: HTMLElement;
    onLoadProgress?: (status: number) => void;
    onLoadComplete?: () => void;
};

export class GameStarter {

    private _initParams: InitParams;
    private _preloader: Preloader;
    private _inited = false;

    init(aParams: InitParams) {

        if (this._inited) {
            LogMng.warn('GameStarter -> Game is already inited!');
            return;
        }
        this._inited = true;

        this._initParams = aParams;

        // init debug mode
        Config.isDebugMode = window.location.hash === '#debug';

        // LogMng settings
        if (!Config.isDebugMode) LogMng.setMode(LogMng.MODE_RELEASE);
        LogMng.system('log mode: ' + LogMng.getMode());

        // Config setups
        Config.assetsPath = this._initParams.assetsPath;
        Config.domCanvasParent = this._initParams.domCanvasParent;

        // GET Params
        this.readGETParams();

        // Preloader
        this.startPreloader();

    }

    private readGETParams() {

        const names = ['aa', 'test'];

        for (let i = 0; i < names.length; i++) {
            const n = names[i];
            let val = MyUtils.getQueryValue(n);
            if (val != null && val != undefined) {
                switch (i) {

                    case 0: // aa
                        Config.AA_TYPE = Number(val);
                        LogMng.debug('Config.AA_TYPE = ' + Config.AA_TYPE);
                        break;
                    
                    case 1: // test
                        Config.TEST_MODE = Number(val) == 1;
                        LogMng.debug('Config.TEST_MODE = ' + Config.TEST_MODE);
                        break;
                    
                }
            }
        }

    }

    private startPreloader() {
        this._preloader = new Preloader();

        let extOnLoadProgress: Function; 
        if (typeof this._initParams.onLoadProgress === 'function') {
            extOnLoadProgress = this._initParams.onLoadProgress;
        }

        this._preloader.onLoadProgressSignal.add((aProgressPercent: number) => {
            LogMng.debug(`loading: ${aProgressPercent}`);
            if (extOnLoadProgress) extOnLoadProgress(aProgressPercent);
        }, this);

        this._preloader.onLoadCompleteSignal.addOnce(() => {
            this.onLoadingComplete();
            if (typeof this._initParams.onLoadComplete === 'function') {
                this._initParams.onLoadComplete();
            }
        }, this);

        this._preloader.loadInitPack();
    }

    private onLoadingComplete() {
        new GameEngine();
    }

}
