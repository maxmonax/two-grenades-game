import { Grenade, GrenadeEffect } from './Grenade';

export class PoisonGrenade extends Grenade {

    constructor() {
        super({
            throwForce: 2,
            explosionForce: 2,
            effectName: GrenadeEffect.Poison
        });
    }

    protected initMesh() {
        
    }
    
}