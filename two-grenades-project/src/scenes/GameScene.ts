import * as THREE from 'three';
import * as datGui from "dat.gui";
import { ThreeLoader } from '../utils/loaders/ThreeLoader';
import { FSM } from '../utils/states/FSM';
import { InputMng } from '../input/InputMng';
import { GameLocation as BattleLand } from '../objects/location/GameLocation';
import gsap from 'gsap';
import { FrontEvents } from '../events/FrontEvents';
import { Character } from '../objects/characters/Character';
import { Settings } from '../data/Settings';
import { CharacterFactory } from '../objects/characters/CharacterFactory';
import { LightFactory } from '../objects/lights/LightFactory';
import { SunLight } from '../objects/lights/SunLight';
import { GrenadeEffect } from '../objects/weapon/Grenade';
import { GameGui } from '../gui/GameGui';

enum States {
    GameInit = 'GameInit',
    Game = 'Game',
    GameOver = 'GameOver'
};

type WorldInitParams = {
    renderer: THREE.Renderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
};

export class WorldScene extends THREE.Group {
    
    private _renderer: THREE.Renderer;
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;
    private _cameraTarget: THREE.Vector3;
    
    private _fsm: FSM;

    private _colliders: THREE.Object3D[] = [];

    private _playerPers: Character;
    private _enemyPers: Character;
    
    private _sunDirLight: SunLight;
    private _ambientLight: THREE.AmbientLight;

    private _gui: GameGui;
    

    constructor(aParams: WorldInitParams) {
        super();

        this._renderer = aParams.renderer;   
        this._scene = aParams.scene;
        this._camera = aParams.camera;

        this.initCamera();
        this.initEnvironment();
        this.initObjects();
        this.initPersonages();
        this.initGameGui();
        this.initEvents();

        // states
        this._fsm = new FSM();
        this._fsm.addState(States.GameInit, this, this.stateGameInitEnter);
        this._fsm.addState(States.Game, this, this.stateGameEnter);
        this._fsm.addState(States.GameOver, this, this.stateGameOverEnter);
        this._fsm.startState(States.GameInit);

    }

    private initCamera() {
        this._camera.position.set(
            0,
            Settings.METER_SIZE * 5,
            Settings.METER_SIZE * 10
        );
        this._cameraTarget = new THREE.Vector3();
        this._camera.lookAt(this._cameraTarget);
        this.updateCameraFov();
        this.add(this._camera);
    }

    private initEnvironment() {

        // ambient light
        this._ambientLight = LightFactory.getAmbientLight({
            color: 0xFFFFFF,
            intensity: 0.4
        });
        this.add(this._ambientLight);

        // sun light
        this._sunDirLight = LightFactory.getSunLight({
            color: 0xffffff,
            x: -1500, y: 3000, z: 1500,
            intensity: 1.0,
            shadow: {
                w: 1024 * 2, h: 1024 * 2, near: 1, far: 5000, size: 512 * 2, bias: 0.00005
            }
        });
        this._sunDirLight.target = this._camera;
        this.add(this._sunDirLight);

        // skybox
        let t = ThreeLoader.getInstance().getTexture('skybox');
        const rt = new THREE.WebGLCubeRenderTarget(t.image.height);
        rt.fromEquirectangularTexture(this._renderer as any, t);
        this._scene.background = rt;

    }

    private initObjects() {

        const TILE_SIZE = Settings.METER_SIZE * 80;

        let land = new BattleLand({ floorSize: TILE_SIZE });
        land.position.set(0, 0, 0);
        this.add(land);
        this._colliders.push(land);

        if (Settings.isDebugMode) {
            let axHelper = new THREE.AxesHelper(Settings.METER_SIZE * 50);
            this.add(axHelper);
        }

    }

    private initPersonages() {

        const CHARACTER_SCALE = Settings.METER_SIZE / 10 * 1 / 10;
        const DIST = Settings.METER_SIZE * 6;

        this._playerPers = CharacterFactory.getPlayerCharacter(CHARACTER_SCALE);
        this._playerPers.position.set(-DIST, 0, 0);
        this._playerPers.rotation.y = Math.PI / 2;
        this.add(this._playerPers);

        this._enemyPers = CharacterFactory.getEnemyCharacter(CHARACTER_SCALE);
        this._enemyPers.position.set(DIST, 0, 0);
        this._enemyPers.rotation.y = -Math.PI / 2;
        this.add(this._enemyPers);

    }

    initGameGui() {
        this._gui = new GameGui(Settings.datGui);
    }

    private initEvents() {
        FrontEvents.onWindowResizeSignal.add(() => {
            this.updateCameraFov();
        }, this);
    }

    private stateGameInitEnter() {

        // camera animation
        const mSize = Settings.METER_SIZE;
        this._camera.position.set(-mSize * 20, mSize / 2, mSize * 30);
        gsap.to(this._camera.position, {
            x: -mSize * 4,
            y: mSize * 12,
            z: mSize * 5,
            duration: 2,
            ease: 'sine.inOut',
            onUpdate: () => {
                this._camera.lookAt(this._cameraTarget);
            },
            onComplete: () => {
                this._fsm.startState(States.Game);
            }
        });

    } 
    
    private stateGameEnter() {

    }

    private stateGameOverEnter() {
        
    }
    
    private updateCameraFov() {
        const values = [
            { ar: .4, fov: 110 },
            { ar: .5, fov: 95 },
            { ar: .6, fov: 85 },
            { ar: .7, fov: 75 },
            { ar: .9, fov: 65 },
            { ar: 1.2, fov: 55 },
            { ar: 100, fov: 45 },
        ];
        const ar = innerWidth / innerHeight;
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (ar <= v.ar) {
                if (this._camera.fov != v.fov) {
                    this._camera.fov = v.fov;
                    this._camera.updateProjectionMatrix();
                }
                break;
            }
        }
    }

    update(dt: number) {

        this._fsm.update(dt);

        // personages
        if (this._playerPers) this._playerPers.update(dt);
        if (this._enemyPers) this._enemyPers.update(dt);

        // sun
        this._sunDirLight.updatePosition(this._camera.position);

    }


}
