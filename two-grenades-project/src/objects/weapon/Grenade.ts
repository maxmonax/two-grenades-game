import * as THREE from 'three';

export enum GrenadeEffect {
    Fire = 'Fire',
    Ice = 'Ice',
    Poison = 'Poison'
};

export type GrenadeParams = {
    throwForce: number;
    explosionForce: number;
    effectName: GrenadeEffect;
};

export abstract class Grenade extends THREE.Group {
    protected _params: GrenadeParams;
    protected _mesh: THREE.Mesh;

    constructor(aParams: GrenadeParams) {
        super();
        this._params = aParams;
        this.initMesh();
    }
    
    public get throwForce(): number {
        return this._params.throwForce;
    }
    
    public get explosionForce(): number {
        return this._params.explosionForce;
    }

    public get effectName(): GrenadeEffect {
        return this._params.effectName;
    }

    protected abstract initMesh();

}