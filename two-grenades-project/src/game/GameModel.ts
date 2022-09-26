import * as THREE from 'three';
import { Settings } from '../data/Settings';
import { Signal } from '../events/Signal';
import { Grenade, GrenadeEffect, GrenadeState } from "../objects/weapon/Grenade";
import { LogMng } from '../utils/LogMng';
import { MyMath } from '../utils/MyMath';
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
    grenadeObj: Grenade;
    isPlayer: boolean;
};

/**
 * Game Model with Data and Logic
 */
export class GameModel {

    private _view: GameView;
    private _grenades: GrenadeData[];
    private _grenadeForceMax = 0;
    private _grenadeForce = 0;
    // world params
    private _gravity = 9.8;
    // flags
    isGrenadeCharged = false;
    // events
    onGrenadeDestroyedSignal = new Signal();


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
    
    throwPlayerGrenade() {

        let effect = this._view.guiGrenadeEffect;
        let pos = this._view.getPlayerGrenadeReleasePos();
        let grenadeObj = this._view.addGrenade(effect, pos);
        let forceFactor = this._grenadeForce / this._grenadeForceMax;
        let dtForce = grenadeObj.throwForceMax - grenadeObj.throwForceMin;
        let force = grenadeObj.throwForceMin + (dtForce * forceFactor);
        let vel = new THREE.Vector3(force, force, 0);

        this._grenades.push({
            effect: effect,
            pos: pos,
            force: force,
            velocity: vel,
            grenadeObj: grenadeObj,
            isPlayer: true
        });

    }

    throwEnemyGrenade() {
        let effects = Object.keys(GrenadeEffect);
        let effect = effects[MyMath.randomIntInRange(0, effects.length - 1)];
        let pos = this._view.getEnemyGrenadeReleasePos();
        let grenadeObj = this._view.addGrenade(effect as GrenadeEffect, pos);
        let force = MyMath.randomInRange(grenadeObj.throwForceMin, grenadeObj.throwForceMax);
        let vel = new THREE.Vector3(-force, force, 0);

        this._grenades.push({
            effect: effect as GrenadeEffect,
            pos: pos,
            force: force,
            velocity: vel,
            grenadeObj: grenadeObj,
            isPlayer: false
        });
    }

    private updateGrenades(dt: number) {

        for (let i = this._grenades.length - 1; i >= 0; i--) {
            const grenaData = this._grenades[i];
            let grenaObj = grenaData.grenadeObj;

            switch (grenaObj.state) {

                case GrenadeState.Fly:

                    grenaData.velocity.y -= this._gravity * Settings.METER_SIZE * dt;
                    grenaData.pos.add(grenaData.velocity.clone().multiplyScalar(dt));
                    grenaObj.position.copy(grenaData.pos);

                    if (grenaData.pos.y <= 0) {
                        this._view.explodeGrenade(grenaObj);

                        if (grenaData.isPlayer) {
                            // check enemy
                            let enemyPers = this._view.getEnemyPers();
                            let dist = grenaObj.position.distanceTo(enemyPers.position);
                            if (dist < Settings.METER_SIZE * 2) {
                                // damage
                                enemyPers.hp -= grenaObj.damage;
                                LogMng.debug(`Enemy get a Damage ${grenaObj.damage}`);
                            }
                        }
                        else {
                            // check player
                            let playerPers = this._view.getPlayerPers();
                            let dist = grenaObj.position.distanceTo(playerPers.position);
                            if (dist < Settings.METER_SIZE * 2) {
                                // damage
                                playerPers.hp -= grenaObj.damage;
                                LogMng.debug(`Player get a Damage ${grenaObj.damage}`);
                            }
                        }

                    }
                    break;
                
                case GrenadeState.Destroyed:

                    grenaObj.free();
                    this._grenades.splice(i, 1);
                    this.onGrenadeDestroyedSignal.dispatch();

                    break;
            
            }

        }
    }
    
    update(dt: number) {

        if (this.isGrenadeCharged) this.grenadeForce += dt;
        this.updateGrenades(dt);

    }

}