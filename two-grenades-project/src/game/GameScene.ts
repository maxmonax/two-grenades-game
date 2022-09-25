import * as THREE from 'three';
import { FSM } from '../utils/states/FSM';
import { InputMng } from '../input/InputMng';
import { GameView } from './GameView';
import { GameData } from './GameData';
import { LogMng } from '../utils/LogMng';

enum States {
    GameInit = 'GameInit',
    PlayerTurn = 'PlayerTurn',
    PlayerThrow = 'PlayerThrow',
    EnemyTurn = 'EnemyTurn',
    EnemyThrow = 'EnemyThrow',
    GameOver = 'GameOver'
};

/**
 * Game Controller
 */
export class GameScene {
    
    private _model: GameData;
    private _view: GameView;

    private _fsm: FSM;

    constructor(aRenderer: THREE.Renderer, aScene: THREE.Scene, aCamera: THREE.PerspectiveCamera) {

        // init view
        this._view = new GameView({
            renderer: aRenderer,
            scene: aScene,
            camera: aCamera
        });

        // init model
        this._model = new GameData({
            view: this._view,
            grenadeForceMax: 10
        });

        this.initEvents();

        // states
        this._fsm = new FSM();
        this._fsm.addState(States.GameInit, this, this.stateGameInitEnter);
        this._fsm.addState(States.PlayerTurn, this, this.statePlayerTurnEnter, this.statePlayerTurnUpdate);
        this._fsm.addState(States.PlayerThrow, this, this.statePlayerThrowEnter);
        this._fsm.addState(States.GameOver, this, this.stateGameOverEnter);
        this._fsm.startState(States.GameInit);

    }

    private initEvents() {
        
    }

    private stateGameInitEnter() {

        this._view.cameraInitAnimation(() => {
            this._fsm.startState(States.PlayerTurn);
        });

    } 
    
    private statePlayerTurnEnter() {

        this._view.onInputDownSignal.addOnce(() => {

            this._model.grenadeForce = 0;
            this._model.isGrenadeActivated = true;

            this._view.onInputUpSignal.addOnce(() => {
                this._model.isGrenadeActivated = false;
                this._fsm.startState(States.PlayerThrow);
            });

        });

    }

    private statePlayerTurnUpdate(dt: number) {

        this._model.update(dt);

        if (this._model.isGrenadeActivated && this._model.grenadeForce == this._model.grenadeForceMax) {
            this._model.isGrenadeActivated = false;
            this._fsm.startState(States.PlayerThrow);
        }

    }

    private statePlayerThrowEnter() {
        
        this._view.onPlayerThrowActionSignal.addOnce(() => {
            LogMng.debug('throw grenade!');
        });
        this._view.playerThrowAnim();

    }

    private stateGameOverEnter() {
        
    }

    update(dt: number) {
        
        this._fsm.update(dt);
        this._model.update(dt);
        this._view.update(dt);

    }


}
