import { FireGrenade } from "./FireGrenade";
import { Grenade, GrenadeEffect } from "./Grenade";
import { IceGrenade } from "./IceGrenade";
import { PoisonGrenade } from "./PoisonGrenade";

export class WeaponFactory {

    static getFireGrenade(): Grenade {
        return new FireGrenade();
    }

    static getIceGrenade(): Grenade {
        return new IceGrenade();
    }

    static getPoisonGrenade(): Grenade {
        return new PoisonGrenade();
    }

    static getGrenadeByEffect(aEffect: GrenadeEffect): Grenade {

        switch (aEffect) {
            case GrenadeEffect.Fire:
                return this.getFireGrenade();
                break;
        
            case GrenadeEffect.Ice:
                return this.getIceGrenade();
                break;
            
            case GrenadeEffect.Poison:
                return this.getPoisonGrenade();
                break;
        }        

    }

}