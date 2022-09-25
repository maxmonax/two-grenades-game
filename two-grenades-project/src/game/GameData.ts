import { GameView } from "./GameView";

type GameDataParams = {
    view: GameView;
    grenadeForceMax: number;
};

export class GameData {
    private _view: GameView;
    private _grenadeForceMax = 0;
    private _grenadeForce = 0;
    isGrenadeActivated = false;

    constructor(aParams: GameDataParams) {
        this._view = aParams.view;
        this._grenadeForceMax = aParams.grenadeForceMax;
    }
    
    public get grenadeForceMax(): number {
        return this._grenadeForceMax;
    }

    get grenadeForce(): number {
        return this._grenadeForce;
    }

    set grenadeForce(v: number) {
        this._grenadeForce = Math.max(0, Math.min(v, this._grenadeForceMax));
    }
    
    update(dt: number) {

        if (this.isGrenadeActivated) {
            this.grenadeForce += dt;
        }

    }

}