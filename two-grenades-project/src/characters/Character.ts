import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { ThreeLoader } from '../loaders/ThreeLoader';
import { LogMng } from '../utils/LogMng';

export type CharacterParams = {
    modelAlias: string,
    scale?: number;
};

export class Character extends THREE.Group {

    protected _params: CharacterParams;
    protected _innerDummy: THREE.Group;
    protected _pers: THREE.Group;
    protected _mixer: THREE.AnimationMixer;
    protected _animations: any; // { [id: string]: THREE.AnimationClip };
    protected _currAnimName: string;
    protected _animationStartTime: number;
    protected _action: THREE.AnimationAction;

    protected _acceleration: THREE.Vector3;
    protected _decceleration: THREE.Vector3;
    protected _velocity: THREE.Vector3;


    constructor() {
        super();
        this._innerDummy = new THREE.Group();
        this.add(this._innerDummy);
        this._animations = {};
    }

    protected logDebug(aMsg: string) {
        LogMng.debug(`Personage(class): ${aMsg}`);
    }

    protected logWarn(aMsg: string) {
        LogMng.warn(`Personage(class): ${aMsg}`);
    }

    protected getAnimationTime(): number {
        return Date.now() - this._animationStartTime;
    }

    public get params(): CharacterParams {
        return this._params;
    }

    get animationName(): string {
        return this._currAnimName;
    }

    get acceleration(): THREE.Vector3 {
        return this._acceleration;
    }

    get decceleration(): THREE.Vector3 {
        return this._decceleration;
    }

    get velocity(): THREE.Vector3 {
        return this._velocity;
    }

    init(aParams: CharacterParams) {

        this._params = aParams;
        let loader = ThreeLoader.getInstance();

        let model = loader.getModel(this._params.modelAlias, true);

        this._pers = SkeletonUtils.clone(model) as THREE.Group;

        this._pers['parentObject'] = this;

        this._pers.traverse((obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
                obj['parentObject'] = this;
            }
        });

        let scale = this._params.scale || 1;
        this._pers.scale.set(scale, scale, scale);
        this._innerDummy.add(this._pers);
        this._mixer = new THREE.AnimationMixer(this._pers);

        let factor = 100;
        this._acceleration = new THREE.Vector3(1 * scale, 0.0025, 50 * scale).multiplyScalar(factor);
        this._decceleration = new THREE.Vector3(-0.0005 * scale, -0.0001, -50.0 * scale).multiplyScalar(factor);
        this._velocity = new THREE.Vector3();

    }

    addDebugLine(aColor: number, aPoints: THREE.Vector3[]) {
        const material = new THREE.LineBasicMaterial({
            color: aColor
        });
        const geometry = new THREE.BufferGeometry().setFromPoints(aPoints);
        const line = new THREE.Line(geometry, material);
        this._innerDummy.add(line);
    }

    addAnimation(aParams: {
        animAlias: string,
        key?: string,
        newKey?: string,
        timeScale?: number
    }) {
        let loader = ThreeLoader.getInstance();
        let model = loader.getModel(aParams.animAlias, true);
        if (!model) {
            this.logWarn(`model == NULL for animation alias: ${aParams.animAlias}`);
            return;
        }
        let anims: any[] = model['animations'];
        if (!anims) {
            this.logWarn(`model.animations == NULL for animation alias: ${aParams.animAlias}`);
            return;
        }
        if (anims.length <= 0) {
            this.logWarn(`model.animations.length == 0 for animation alias: ${aParams.animAlias}`);
            return;
        }

        let animKey = aParams.newKey || aParams.key;

        if (this._animations[animKey] != null) {
            this.logWarn(`animation already exists, alias: ${aParams.animAlias}`);
            return;
        }

        let clipAction = this._mixer.clipAction(anims[0]);

        this._animations[animKey] = {
            clip: anims[0],
            action: clipAction,
            timeScale: aParams.timeScale
        };
    }

    playAnimation(aName: string, aParams: {
        crossTime?: number
    } = {}) {

        if (this._currAnimName == aName) return;
        // if (this._nextAnimName == aName) return;

        // this.logDebug(`playAnimation() -> animName = ${aName}`);
        
        // if (this._currAnimName == 'falling' && this._nextAnimName == 'idle') {
        //     debugger;
        // }

        if (!this._animations[aName]) {
            this.logWarn(`playAnimation() -> no animation named ${aName}`);
            return;
        }
        let clip = this._animations[aName].clip;
        let newAction = this._animations[aName].action;
        let timeScale = this._animations[aName].timeScale;
        if (!clip) {
            this.logWarn(`playAnimation(): undefined animation name: ${aName}`);
            return;
        }

        if (this._action) {
            const prevAction = this._action;
            newAction.time = 0.0;
            newAction.enabled = true;
            newAction.setEffectiveTimeScale(1.0);
            newAction.setEffectiveWeight(1.0);
            newAction.crossFadeFrom(prevAction, aParams.crossTime ? aParams.crossTime : 0.5, true);
            if (timeScale != null) newAction['timeScale'] = timeScale;
            newAction.play();
        }
        else {
            newAction.play();
        }

        this._animationStartTime = Date.now();
        // this._nextAnimName = aName;
        this._currAnimName = aName;
        this._action = newAction;
    }

    update(dt: number) {
        if (this._mixer) this._mixer.update(dt);

        // turn update
        let turnSpd = 1;
        switch (this._currAnimName) {
            
            case 'idle':
                turnSpd = 10;
                break;
            
            case 'walk':
                break;
            
            case 'run':
                break;
        
            default:
                break;
        }

    }

}