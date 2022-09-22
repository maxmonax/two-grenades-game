import * as THREE from 'three';

export class SunLight extends THREE.DirectionalLight {

    private _deltaPos: THREE.Vector3;

    constructor(color, intensity, x0, y0, z0) {
        super(color, intensity);
        this._deltaPos = new THREE.Vector3(x0, y0, z0);
    }
    
    updatePosition(aPivot: THREE.Vector3) {
        let pos = aPivot.clone().add(this._deltaPos);
        this.position.copy(pos);
    }

}