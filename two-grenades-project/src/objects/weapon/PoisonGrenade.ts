import * as THREE from 'three';
import { Settings } from '../../data/Settings';
import { TextureAlias } from '../../data/TextureData';
import { ParticleSystem } from '../../effects/ParticleSystem';
import { FrontEvents } from '../../events/FrontEvents';
import { ThreeLoader } from '../../utils/loaders/ThreeLoader';
import { Grenade, GrenadeEffect, GrenadeState } from './Grenade';

export class PoisonGrenade extends Grenade {

    constructor() {
        super({
            throwForceMin: 0.5 * 6 * Settings.METER_SIZE,
            throwForceMax: 1.5 * 6 * Settings.METER_SIZE,
            explosionRadius: 2 * Settings.METER_SIZE,
            damage: 60,
            effect: GrenadeEffect.Poison
        });
    }

    protected initMesh() {
        let geom = new THREE.SphereBufferGeometry(Settings.METER_SIZE * 0.1);
        let mat = new THREE.MeshStandardMaterial({
            color: 0x00FF00
        });
        this._mesh = new THREE.Mesh(geom, mat);
        this.add(this._mesh);
    }

    createTrailEffect(aParent: THREE.Object3D, aCamera: THREE.Camera) {

        this._trailEffect = new ParticleSystem({

            texture: ThreeLoader.getInstance().getTexture(TextureAlias.particleCircle),
            onWindowResizeSignal: FrontEvents.onWindowResizeSignal,
            parent: aParent,
            camera: aCamera,
            frequency: 100,
            lifeTime: 0.15,
            size: { min: 0.1, max: 1. },

            position: this.position.clone(),
            deltaPosition: {
                x: { min: -1, max: 1 },
                y: { min: -1, max: 1 },
                z: { min: -1, max: 1 }
            },

            velocity: new THREE.Vector3(0, 0, 0),
            deltaVelocity: {
                x: { min: -2, max: 2 },
                y: { min: -2, max: 2 },
                z: { min: -2, max: 2 }
            },

            color: 0x00ff00,
            alphaChange: [
                { t: 0, val: 1 },
                { t: 0.5, val: 1 },
                { t: 1.0, val: 0 }
            ],
            scaleFactorChange: [
                { t: 0, val: 4 },
                { t: 0.5, val: 2 },
                { t: 0.2, val: 1 },
                { t: 1, val: 0 },
            ]

        });

    }

    explode(aParent: THREE.Object3D, aCamera: THREE.Camera) {
        
        this._trailEffect.activated = false;
        this._mesh.visible = false;

        this._state = GrenadeState.Explosion;

        // effect

        const dtVelocity = 180;

        this._explosionEffect = new ParticleSystem({

            texture: ThreeLoader.getInstance().getTexture(TextureAlias.particleCircle),
            onWindowResizeSignal: FrontEvents.onWindowResizeSignal,
            parent: aParent,
            camera: aCamera,
            frequency: 1000,
            lifeTime: .3,
            size: { min: 0.1, max: 1. },

            position: this.position.clone(),
            deltaPosition: {
                x: { min: -1, max: 1 },
                y: { min: -1, max: 1 },
                z: { min: -1, max: 1 }
            },

            velocity: new THREE.Vector3(0, 0, 0),
            deltaVelocity: {
                x: { min: -dtVelocity, max: dtVelocity },
                y: { min: -dtVelocity, max: dtVelocity },
                z: { min: -dtVelocity, max: dtVelocity }
            },

            color: 0x00ff00,
            alphaChange: [
                { t: 0, val: 1 },
                { t: 0.5, val: 1 },
                { t: 1.0, val: 0 }
            ],
            scaleFactorChange: [
                { t: 0, val: 2 },
                { t: 0.5, val: 1 },
                { t: 1, val: 0 },
            ]

        });

        setTimeout(() => {
            this._explosionEffect.activated = false;
        }, 100);

    }
    
}