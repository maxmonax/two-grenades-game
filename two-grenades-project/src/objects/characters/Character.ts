import * as THREE from 'three';
import { LoopRepeat } from 'three';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { Signal } from '../../events/Signal';
import { ThreeLoader } from '../../utils/loaders/ThreeLoader';
import { LogMng } from '../../utils/LogMng';

export enum CharAnimation {
    idle = 'idle',
    throw = 'throw',
    death = 'death'
};

export enum CharAnimEvent {
    throw = 'throw'
};

export type CharacterParams = {
    modelAlias: string;
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

    onAnimationEventSignal = new Signal();
    onAnimationFinishedSignal = new Signal();

    constructor() {
        super();
        this._innerDummy = new THREE.Group();
        this.add(this._innerDummy);
        this._animations = {};
    }

    protected logDebug(aMsg: string) {
        LogMng.debug(`Character => ${aMsg}`);
    }

    protected logWarn(aMsg: string) {
        LogMng.warn(`Character => ${aMsg}`);
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
        this._mixer.addEventListener('loop', (e) => {
            // console.log(e);
            this.onAnimationLoop(e);
        });

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
        timeScale?: number,
        repeat?: number,
        nextAnimAlias?: string,
        timeEvents?: {
            time: number,
            eventName: string
        }[]
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
            timeScale: aParams.timeScale,
            repeat: aParams.repeat | Number.MAX_VALUE,
            repeatCounter: 0,
            nextAnimAlias: aParams.nextAnimAlias,
            timeEvents: aParams.timeEvents
        };
        
    }

    playAnimation(aName: string, aParams: {
        crossTime?: number
    } = {}) {

        if (this._currAnimName == aName) return;

        if (!this._animations[aName]) {
            this.logWarn(`playAnimation() -> no animation named ${aName}`);
            return;
        }
        let clip = this._animations[aName].clip;
        let newAction: THREE.AnimationAction = this._animations[aName].action;
        let timeScale = this._animations[aName].timeScale;
        this._animations[aName].repeatCounter = this._animations[aName].repeat;
        if (!clip) {
            this.logWarn(`playAnimation(): undefined animation name: ${aName}`);
            return;
        }

        if (this._action) {
            const prevAction = this._action;
            newAction.enabled = true;
            newAction.timeScale = 1;
            newAction.setEffectiveTimeScale(1.0);
            newAction.setEffectiveWeight(1.0);
            newAction.time = 0;
            newAction.crossFadeFrom(prevAction, aParams.crossTime ? aParams.crossTime : 0.5, true);
            if (timeScale != null) newAction['timeScale'] = timeScale;
            newAction.play();
        }
        else {
            newAction.play();
        }

        this._animationStartTime = Date.now();
        this._currAnimName = aName;
        this._action = newAction;
    }

    private onAnimationLoop(aData) {
        let action: THREE.AnimationAction = aData.action;
        if (!action) return;

        // get animation data
        let anim: any;

        for (const key in this._animations) {
            const element = this._animations[key];
            if (element.action == action) {
                anim = element;
                break;
            }
        }

        if (!anim) return;

        if (anim.repeat && anim.repeatCounter > 0) {
            let cnt = --anim.repeatCounter;
            if (cnt <= 0) {
                if (anim.nextAnimAlias) {
                    anim.action.timeScale = 0;
                    anim.action.time = anim.action.duration;
                    this.onAnimationFinishedSignal.dispatch(this._currAnimName);
                    this.playAnimation(anim.nextAnimAlias);
                }
                else {
                    anim.action.timeScale = 0;
                    anim.action.time = anim.action.duration;
                    this.onAnimationFinishedSignal.dispatch(this._currAnimName);
                }
            }
        }
    }

    update(dt: number) {

        if (this._mixer) this._mixer.update(dt);

        let timeEvents = this._animations[this._currAnimName].timeEvents;
        if (timeEvents) {
            let actTime = this._action.time;
            for (let i = 0; i < timeEvents.length; i++) {
                const evt = timeEvents[i];
                if (actTime > evt.time && actTime - dt < evt.time) {
                    // event
                    this.onAnimationEventSignal.dispatch(evt.eventName);
                }
            }
        }
        // console.log(this._action.time);

    }

}