import * as THREE from 'three';
import { Settings } from '../../data/Settings';
import { TextureAlias } from '../../data/TextureData';
import { ParticleSystem } from '../../effects/ParticleSystem';
import { FrontEvents } from '../../events/FrontEvents';
import { ThreeLoader } from '../../utils/loaders/ThreeLoader';
import { Grenade, GrenadeEffect } from './Grenade';

export class IceGrenade extends Grenade {

    constructor() {
        super({
            throwForceMin: 0.3 * 10 * Settings.METER_SIZE,
            throwForceMax: 1.5 * 10 * Settings.METER_SIZE,
            explosionForce: 1,
            effectName: GrenadeEffect.Ice
        });
    }

    protected initMesh() {
        let geom = new THREE.SphereBufferGeometry(Settings.METER_SIZE * 0.1);
        let mat = new THREE.MeshStandardMaterial({
            color: 0x00FFFF
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

            color: 0x00ffff,
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
        
    }

}