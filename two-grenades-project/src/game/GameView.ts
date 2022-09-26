import * as THREE from 'three';
import gsap from 'gsap';
import { Settings } from '../data/Settings';
import { TextureAlias } from '../data/TextureData';
import { FrontEvents } from '../events/FrontEvents';
import { GameGui } from '../gui/GameGui';
import { Character, CharAnimation, CharAnimEvent } from '../objects/characters/Character';
import { CharacterFactory } from '../objects/characters/CharacterFactory';
import { LightFactory } from '../objects/lights/LightFactory';
import { SunLight } from '../objects/lights/SunLight';
import { GameLocation } from '../objects/location/GameLocation';
import { ThreeLoader } from '../utils/loaders/ThreeLoader';
import { InputMng } from '../input/InputMng';
import { Signal } from '../events/Signal';
import { LogMng } from '../utils/LogMng';
import { Grenade, GrenadeEffect } from '../objects/weapon/Grenade';
import { FireGrenade } from '../objects/weapon/FireGrenade';
import { IceGrenade } from '../objects/weapon/IceGrenade';
import { PoisonGrenade } from '../objects/weapon/PoisonGrenade';
import { IUpdatable } from '../interfaces/IUpdatable';

type GameViewParams = {
    renderer: THREE.Renderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
};

export class GameView {

    private _renderer: THREE.Renderer;
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;
    private _cameraTarget: THREE.Vector3;
    // environment
    private _sunDirLight: SunLight;
    private _ambientLight: THREE.AmbientLight;
    // main container
    private _groupMain: THREE.Group;
    // game objects
    private _playerPers: Character;
    private _enemyPers: Character;
    private _indicatorSize = Settings.METER_SIZE * 1.5;
    private _forceIndicator: THREE.Mesh;
    private _objects: IUpdatable[] = [];

    private _gui: GameGui;

    onInputDownSignal = new Signal();
    onInputUpSignal = new Signal();
    onPlayerThrowActionSignal = new Signal();


    constructor(aParams: GameViewParams) {

        this._renderer = aParams.renderer;
        this._scene = aParams.scene;
        this._camera = aParams.camera;

        this._groupMain = new THREE.Group();
        this._scene.add(this._groupMain);

        this.initCamera();
        this.initEnvironment();
        this.initObjects();
        this.initPersonages();
        this.initGameGui();
        this.initEvents();

    }

    protected logDebug(aMsg: string, aData?: any) {
        LogMng.debug(`GameView -> ${aMsg}`);
        if (aData && Settings.isDebugMode) console.log(aData);
    }

    protected logWarn(aMsg: string, aData?: any) {
        LogMng.warn(`GameView -> ${aMsg}`);
        if (aData) console.log(aData);
    }

    protected logError(aMsg: string, aData?: any) {
        LogMng.error(`GameView -> ${aMsg}`);
        if (aData) console.log(aData);
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
        this._groupMain.add(this._camera);
    }

    private initEnvironment() {

        // ambient light
        this._ambientLight = LightFactory.getAmbientLight({
            color: 0xFFFFFF,
            intensity: 0.4
        });
        this._groupMain.add(this._ambientLight);

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
        this._groupMain.add(this._sunDirLight);

        // skybox
        let t = ThreeLoader.getInstance().getTexture(TextureAlias.skybox);
        const rt = new THREE.WebGLCubeRenderTarget(t.image.height);
        rt.fromEquirectangularTexture(this._renderer as any, t);
        this._scene.background = rt;

    }

    private initObjects() {

        const TILE_SIZE = Settings.METER_SIZE * 80;

        let land = new GameLocation({ floorSize: TILE_SIZE });
        land.position.set(0, 0, 0);
        this._groupMain.add(land);

        if (Settings.isDebugMode) {
            let axHelper = new THREE.AxesHelper(Settings.METER_SIZE * 50);
            this._groupMain.add(axHelper);
        }

        // indicator
        let indicatorGeom = new THREE.CylinderGeometry(Settings.METER_SIZE * 0.05, Settings.METER_SIZE * 0.05,
            this._indicatorSize);
        let indicatorMat = new THREE.MeshStandardMaterial({
            color: 0xFF0000
        });
        this._forceIndicator = new THREE.Mesh(indicatorGeom, indicatorMat);
        this._forceIndicator.rotation.z = Math.PI / 2;
        this._forceIndicator.visible = false;
        this._groupMain.add(this._forceIndicator);

    }

    private initPersonages() {

        const CHARACTER_SCALE = Settings.METER_SIZE / 10 * 1 / 10;
        const DIST = Settings.METER_SIZE * 6;

        this._playerPers = CharacterFactory.getPlayerCharacter(CHARACTER_SCALE);
        this._playerPers.position.set(-DIST, 0, 0);
        this._playerPers.rotation.y = Math.PI / 2;
        this._groupMain.add(this._playerPers);

        this._enemyPers = CharacterFactory.getEnemyCharacter(CHARACTER_SCALE);
        this._enemyPers.position.set(DIST, 0, 0);
        this._enemyPers.rotation.y = -Math.PI / 2;
        this._groupMain.add(this._enemyPers);

    }

    private initGameGui() {
        this._gui = new GameGui(Settings.datGui);
    }

    private initEvents() {

        FrontEvents.onWindowResizeSignal.add(() => {
            this.updateCameraFov();
        }, this);

        let inMng = InputMng.getInstance();
        inMng.onInputDownSignal.add(this.onInputDown, this);
        inMng.onInputUpSignal.add(this.onInputUp, this);

    }

    private onInputDown() {
        this.onInputDownSignal.dispatch();
    }

    private onInputUp() {
        this.onInputUpSignal.dispatch();
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

    get guiGrenadeEffect(): GrenadeEffect {
        return this._gui.grenadeEffect;
    }

    cameraInitAnimation(cb?: Function, ctx?: any) {

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
                if (cb) cb.call(ctx);
            }
        });

    }

    playerThrowAnim() {

        console.log(`playerThrowAnim...`);

        this._playerPers.onAnimationEventSignal.addOnce((aEventName: string) => {
            if (aEventName == CharAnimEvent.throw) {
                this.onPlayerThrowActionSignal.dispatch();
            }
        });
        this._playerPers.playAnimation(CharAnimation.throw);

    }

    getPlayerGrenadeReleasePos(): THREE.Vector3 {
        let res = this._playerPers.position.clone();
        res.x += Settings.METER_SIZE * 0.8;
        res.y += Settings.METER_SIZE;
        res.z -= Settings.METER_SIZE * 0.2;
        return res;
    }

    updatePlayerForceIndicator(aParams: {
        progress: number,
        visible: boolean
    }) {
        this._forceIndicator.scale.y = aParams.progress;
        this._forceIndicator.position.copy(this._playerPers.position);
        this._forceIndicator.position.x += this._indicatorSize * aParams.progress / 2;
        this._forceIndicator.visible = aParams.visible;
    }

    addGrenade(aEffect: GrenadeEffect, aPos: THREE.Vector3): Grenade {

        let grena: Grenade;

        switch (aEffect) {

            case GrenadeEffect.Fire:
                grena = new FireGrenade();
                grena.position.copy(aPos);
                this._groupMain.add(grena);
                break;
            
            case GrenadeEffect.Ice:
                grena = new IceGrenade();
                grena.position.copy(aPos);
                this._groupMain.add(grena);
                break;
            
            case GrenadeEffect.Poison:
                grena = new PoisonGrenade();
                grena.position.copy(aPos);
                this._groupMain.add(grena);
                break;
            
            default:
                this.logWarn(`addGrenade -> Unknown grenade effect: ${aEffect}`);
                break;
            
        }

        grena.createTrailEffect(this._groupMain, this._camera);
        this._objects.push(grena);

        return grena;
    }

    explodeGrenade(aGrenade: Grenade) {
        aGrenade.explode(this._groupMain, this._camera);
    }

    update(dt: number) {

        // personages
        if (this._playerPers) this._playerPers.update(dt);
        if (this._enemyPers) this._enemyPers.update(dt);

        // sun
        this._sunDirLight.updatePosition(this._camera.position);

        // effects
        for (let i = 0; i < this._objects.length; i++) {
            this._objects[i].update(dt);
        }

    }

}