import { Grenade, GrenadeEffect } from './Grenade';

export class FireGrenade extends Grenade {

    constructor() {
        super({
            throwForce: 1,
            explosionForce: 2,
            effectName: GrenadeEffect.Fire
        });
    }

    protected initMesh() {
        
    }
    
}