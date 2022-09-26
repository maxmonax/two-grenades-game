import * as THREE from 'three';
import { Settings } from '../data/Settings';
import { Grenade, GrenadeEffect, GrenadeParams, GrenadeState } from "../objects/weapon/Grenade";
import { LogMng } from '../utils/LogMng';
import { GameView } from "./GameView";

type GameDataParams = {
    view: GameView;
    grenadeForceMax: number;
};

type GrenadeData = {
    effect: GrenadeEffect;
    pos: THREE.Vector3;
    force: number;
    velocity: THREE.Vector3;
    grenadeView: Grenade;
};

/**
 * Game Model
 */
export class GameData {
    private _view: GameView;
    private _grenades: GrenadeData[];
    private _grenadeForceMax = 0;
    private _grenadeForce = 0;
    // world params
    private _gravity = 9.8;
    isGrenadeActivated = false;

    constructor(aParams: GameDataParams) {
        this._view = aParams.view;
        this._grenades = [];
        this._grenadeForceMax = aParams.grenadeForceMax;
    }
    
    public get grenadeForceMax(): number {
        return this._grenadeForceMax;
    }

    get grenadeForce(): number {
        return this._grenadeForce;
    }

    set grenadeForce(v: number) {
        this._grenadeForce = Math.max(0, Math.min(v, this._grenadeForceMax));
    }

    addGrenade(aEffect: GrenadeEffect, aPos: THREE.Vector3) {

        let grenadeView = this._view.addGrenade(aEffect, aPos);
        let forceFactor = this._grenadeForce / this._grenadeForceMax;
        let dtForce = grenadeView.throwForceMax - grenadeView.throwForceMin;
        let force = grenadeView.throwForceMin + (dtForce * forceFactor);
        let vel = new THREE.Vector3(force, force, 0);

        LogMng.debug(`addGrenade:`);
        LogMng.debug(`forceFactor: ${forceFactor}`);
        LogMng.debug(`dtForce: ${dtForce}`);
        LogMng.debug(`force: ${force}`);

        this._grenades.push({
            // id: id,
            effect: aEffect,
            pos: aPos,
            force: force,
            velocity: vel,
            grenadeView: grenadeView
        });

    }

    private updateGrenades(dt: number) {

        for (let i = this._grenades.length - 1; i >= 0; i--) {
            const grena = this._grenades[i];

            switch (grena.grenadeView.state) {
                case GrenadeState.Fly:
                    grena.velocity.y -= this._gravity * Settings.METER_SIZE * dt;
                    grena.pos.add(grena.velocity.clone().multiplyScalar(dt));
                    grena.grenadeView.position.copy(grena.pos);
                    if (grena.pos.y <= 0) {
                        this._view.explodeGrenade(grena.grenadeView);
                    }
                    break;
                
                case GrenadeState.Destroyed:

                    break;
            
                default:
                    break;
            }

        }
    }
    
    update(dt: number) {

        if (this.isGrenadeActivated) {
            this.grenadeForce += dt;
        }

        this.updateGrenades(dt);

    }

}