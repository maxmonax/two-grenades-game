import * as THREE from 'three';
import { FSM } from '../utils/states/FSM';
import { InputMng } from '../input/InputMng';
import { GameView } from './GameView';
import { GameModel } from './GameModel';
import { LogMng } from '../utils/LogMng';
import { CharAnimation } from '../objects/characters/Character';

enum States {
    GameInit = 'GameInit',
    PlayerTurn = 'PlayerTurn',
    PlayerThrow = 'PlayerThrow',
    EnemyThrow = 'EnemyThrow',
    GameOver = 'GameOver'
};

/**
 * Game Controller
 */
export class GameScene {
    
    private _model: GameModel;
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
        this._model = new GameModel({
            view: this._view,
            grenadeForceMax: 5
        });

        // states
        this._fsm = new FSM();
        this._fsm.addState(States.GameInit, this, this.stateGameInitEnter);
        this._fsm.addState(States.PlayerTurn, this, this.statePlayerTurnEnter, this.statePlayerTurnUpdate);
        this._fsm.addState(States.PlayerThrow, this, this.statePlayerThrowEnter);
        this._fsm.addState(States.EnemyThrow, this, this.stateEnemyThrowEnter);
        this._fsm.addState(States.GameOver, this, this.stateGameOverEnter);
        this._fsm.startState(States.GameInit);

    }

    private stateGameInitEnter() {
        this._view.cameraInitAnimation(() => {
            this._fsm.startState(States.PlayerTurn);
        });
    } 
    
    private statePlayerTurnEnter() {

        LogMng.debug(`Player Turn...`);

        let isDown = false;
        let inMng = InputMng.getInstance();

        this._model.grenadeForce = 0;
        this._view.updatePlayerForceIndicator({
            progress: 0,
            visible: true
        });

        let onDown = () => {
            isDown = true;
            this._model.grenadeForce = 0;
            this._model.isGrenadeCharged = true;
        };

        let onUp = () => {
            if (!isDown) return;
            inMng.onInputDownSignal.remove(onDown, this);
            inMng.onInputUpSignal.remove(onUp, this);
            this._model.isGrenadeCharged = false;
            this._fsm.startState(States.PlayerThrow);
        };
         
        inMng.onInputDownSignal.add(onDown, this);
        inMng.onInputUpSignal.add(onUp, this);

    }

    private statePlayerTurnUpdate(dt: number) {

        this._model.update(dt);

        this._view.updatePlayerForceIndicator({
            progress: this._model.grenadeForce / this._model.grenadeForceMax,
            visible: true
        });

        if (this._model.isGrenadeCharged && this._model.grenadeForce == this._model.grenadeForceMax) {
            this._model.isGrenadeCharged = false;
            this._fsm.startState(States.PlayerThrow);
        }

    }

    private statePlayerThrowEnter() {
        
        let onPlayerThrowAction = () => {
            this._view.onPlayerThrowActionSignal.remove(onPlayerThrowAction, this);
            this._model.throwPlayerGrenade();
        };

        let onGrenadeDestroyed = () => {

            this._model.onGrenadeDestroyedSignal.remove(onGrenadeDestroyed, this);

            let enemyPers = this._view.getEnemyPers();
            if (enemyPers.hp == 0) {
                LogMng.debug(`Player WIN!`);
                enemyPers.playAnimation(CharAnimation.death);
                this._fsm.startState(States.GameOver);
            }
            else {
                this._fsm.startState(States.EnemyThrow);
            }

        };

        this._view.updatePlayerForceIndicator({
            progress: 0,
            visible: false
        });

        this._view.onPlayerThrowActionSignal.addOnce(onPlayerThrowAction, this);
        this._model.onGrenadeDestroyedSignal.addOnce(onGrenadeDestroyed, this);

        this._view.playerThrowAnim();

    }

    private stateEnemyThrowEnter() {

        LogMng.debug(`Enemy Turn...`);

        let onEnemyThrowAction = () => {
            this._view.onEnemyThrowActionSignal.remove(onEnemyThrowAction, this);
            this._model.throwEnemyGrenade();
        };

        let onGrenadeDestroyed = () => {

            this._model.onGrenadeDestroyedSignal.remove(onGrenadeDestroyed, this);

            let playerPers = this._view.getPlayerPers();
            if (playerPers.hp == 0) {
                LogMng.debug(`Enemy WIN!`);
                playerPers.playAnimation(CharAnimation.death);
                this._fsm.startState(States.GameOver);
            }
            else {
                this._fsm.startState(States.PlayerTurn);
            }

        };

        this._view.onEnemyThrowActionSignal.addOnce(onEnemyThrowAction, this);
        this._model.onGrenadeDestroyedSignal.addOnce(onGrenadeDestroyed, this);

        this._view.enemyThrowAnim();
    }

    private stateGameOverEnter() {
        let onRestart = () => {
            this._view.guiRestartSignal.remove(onRestart, this);
            this._view.restart();
            this._fsm.startState(States.PlayerTurn);
        };
        this._view.guiRestartSignal.addOnce(onRestart, this);
    }

    update(dt: number) {
        
        this._fsm.update(dt);
        this._model.update(dt);
        this._view.update(dt);

    }


}
