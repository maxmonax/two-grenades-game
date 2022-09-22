import * as THREE from 'three';
import * as datGui from "dat.gui";
import { ThreeLoader } from '../loaders/ThreeLoader';
import { FSM } from '../states/FSM';
import { InputMng } from '../input/InputMng';
import { TestLand as BattleLand } from '../objects/lands/TestLand';
import gsap from 'gsap';
import { FrontEvents } from '../events/FrontEvents';
import { Character } from '../characters/Character';
import { Settings } from '../data/Settings';
import { CharacterFactory } from '../characters/CharacterFactory';
import { LightFactory } from '../light/LightFactory';
import { SunLight } from '../light/SunLight';

enum States {
    CombatInit = 'CombatInit',
    Combat = 'Combat'
};

type WorldInitParams = {
    renderer: THREE.Renderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
};

export class WorldScene extends THREE.Group {
    
    private renderer: THREE.Renderer;
    private scene: THREE.Scene;
    
    private camera: THREE.PerspectiveCamera;
    private cameraTarget: THREE.Vector3;
    
    private fsm: FSM;

    private colliders: THREE.Object3D[] = [];

    private playerPers: Character;
    private enemyPers: Character;
    
    private sunDirLight: SunLight;
    private ambientLight: THREE.AmbientLight;


    constructor(aParams: WorldInitParams) {
        super();

        this.renderer = aParams.renderer;   
        this.scene = aParams.scene;
        this.camera = aParams.camera;

        this.initCamera();
        this.initEnvironment();
        this.initObjects();
        this.initPersonages();
        this.initEvents();

        // states
        this.fsm = new FSM();
        this.fsm.addState(States.CombatInit, this, this.stateCombatInitEnter);
        this.fsm.addState(States.Combat, this, this.stateCombatEnter);
        this.fsm.startState(States.CombatInit);

    }

    private initCamera() {
        this.camera.position.set(
            0,
            Settings.METER_SIZE * 5,
            Settings.METER_SIZE * 10
        );
        this.cameraTarget = new THREE.Vector3();
        this.camera.lookAt(this.cameraTarget);
        this.updateCameraFov();
        this.add(this.camera);
    }

    private initEnvironment() {

        // ambient light
        this.ambientLight = LightFactory.getAmbientLight({
            color: 0xFFFFFF,
            intensity: 0.4
        });
        this.add(this.ambientLight);

        // sun light
        this.sunDirLight = LightFactory.getSunLight({
            color: 0xffffff,
            x: -1500, y: 3000, z: 1500,
            intensity: 1.0,
            shadow: {
                w: 1024 * 2, h: 1024 * 2, near: 1, far: 5000, size: 512 * 2, bias: 0.00005
            }
        });
        this.sunDirLight.target = this.camera;
        this.add(this.sunDirLight);

        // skybox
        let t = ThreeLoader.getInstance().getTexture('skybox');
        const rt = new THREE.WebGLCubeRenderTarget(t.image.height);
        rt.fromEquirectangularTexture(this.renderer as any, t);
        this.scene.background = rt;

    }

    private initObjects() {

        const TILE_SIZE = Settings.METER_SIZE * 80;

        let land = new BattleLand({ floorSize: TILE_SIZE });
        land.position.set(0, 0, 0);
        this.add(land);
        this.colliders.push(land);

        if (Settings.isDebugMode) {
            let axHelper = new THREE.AxesHelper(Settings.METER_SIZE * 50);
            this.add(axHelper);
        }

    }

    private initPersonages() {

        const CHARACTER_SCALE = Settings.METER_SIZE / 10 * 1 / 10;
        const DIST = Settings.METER_SIZE * 6;

        this.playerPers = CharacterFactory.getPlayerCharacter(CHARACTER_SCALE);
        this.playerPers.position.set(-DIST, 0, 0);
        this.playerPers.rotation.y = Math.PI / 2;
        this.add(this.playerPers);

        this.enemyPers = CharacterFactory.getEnemyCharacter(CHARACTER_SCALE);
        this.enemyPers.position.set(DIST, 0, 0);
        this.enemyPers.rotation.y = -Math.PI / 2;
        this.add(this.enemyPers);

    }

    private initEvents() {
        FrontEvents.onWindowResizeSignal.add(() => {
            this.updateCameraFov();
        }, this);
    }

    initGameGui(gui: datGui.GUI) {
        let sceneFolder = gui.addFolder('GameScene');
        sceneFolder.open();
    }

    private stateCombatInitEnter() {

        // init game GUI
        

        // camera animation
        const mSize = Settings.METER_SIZE;
        this.camera.position.set(-mSize * 20, mSize / 2, mSize * 30);
        gsap.to(this.camera.position, {
            x: -mSize * 4,
            y: mSize * 12,
            z: mSize * 5,
            duration: 2,
            ease: 'sine.inOut',
            onUpdate: () => {
                this.camera.lookAt(this.cameraTarget);
            },
            onComplete: () => {
                this.fsm.startState(States.Combat);
            }
        });
    } 
    
    private stateCombatEnter() {
        


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
                if (this.camera.fov != v.fov) {
                    this.camera.fov = v.fov;
                    this.camera.updateProjectionMatrix();
                }
                break;
            }
        }
    }

    update(dt: number) {

        this.fsm.update(dt);

        // personages
        if (this.playerPers) this.playerPers.update(dt);
        if (this.enemyPers) this.enemyPers.update(dt);

        // sun
        this.sunDirLight.updatePosition(this.camera.position);

    }


}
