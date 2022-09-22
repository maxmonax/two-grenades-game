import { Grenade, GrenadeEffect } from './Grenade';

export class IceGrenade extends Grenade {

    constructor() {
        super({
            throwForce: 1.5,
            explosionForce: 1,
            effectName: GrenadeEffect.Ice
        });
    }

    protected initMesh() {
        
    }
    
}