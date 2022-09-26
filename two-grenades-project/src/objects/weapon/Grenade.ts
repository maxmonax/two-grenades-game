import * as THREE from 'three';
import { ParticleSystem } from '../../effects/ParticleSystem';
import { IUpdatable } from '../../interfaces/IUpdatable';

export enum GrenadeEffect {
    Fire = 'Fire',
    Ice = 'Ice',
    Poison = 'Poison'
};

export enum GrenadeState {
    Fly = 'Fly',
    Explosion = 'Explosion',
    Destroyed = 'Destroyed'
};

export type GrenadeParams = {
    throwForceMin: number;
    throwForceMax: number;
    explosionForce: number;
    effectName: GrenadeEffect;
};

export abstract class Grenade extends THREE.Group implements IUpdatable {

    protected _params: GrenadeParams;
    protected _mesh: THREE.Mesh;
    protected _trailEffect: ParticleSystem;
    protected _explosionEffect: ParticleSystem;
    protected _state: GrenadeState;

    constructor(aParams: GrenadeParams) {
        super();
        this._params = aParams;
        this._state = GrenadeState.Fly;
        this.initMesh();
    }
    
    public get throwForceMin(): number {
        return this._params.throwForceMin;
    }

    public get throwForceMax(): number {
        return this._params.throwForceMax;
    }
    
    public get explosionForce(): number {
        return this._params.explosionForce;
    }

    public get effectName(): GrenadeEffect {
        return this._params.effectName;
    }
    
    public get state(): string {
        return this._state;
    }

    protected abstract initMesh();

    abstract createTrailEffect(aParent: THREE.Object3D, aCamera: THREE.Camera);
    
    abstract explode(aParent: THREE.Object3D, aCamera: THREE.Camera);

    update(dt: number) {
        
        if (this._trailEffect) {
            this._trailEffect.position.copy(this.position);
            this._trailEffect.update(dt);
        }

        switch (this._state) {
            case GrenadeState.Explosion:
                if (this._explosionEffect) {
                    this._explosionEffect.update(dt);
                    if (!this._explosionEffect.activated && this._explosionEffect.particlesCount <= 0) {
                        this._state = GrenadeState.Destroyed;
                    }
                }
                break;
        }

    }

}