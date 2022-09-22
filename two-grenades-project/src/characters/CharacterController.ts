import * as THREE from 'three';
import { Character } from "./Character";


type CameraOrbitControlParams = {
    domElement: any;
    camera: THREE.Camera;
    minDist: number;
    maxDist: number;
    cameraTarget: THREE.Vector3;
};

type Params = {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cameraTarget: THREE.Vector3;
    pers: Character;
    orbitParams: CameraOrbitControlParams;
    colliders: THREE.Object3D[]
};
                        
export class CharacterController {
                            
    private _params: Params;
    private _character: Character;
    private _isDebugMode = false;
    // debug
    debugArrows: THREE.ArrowHelper[];

    constructor(aParams: Params) {

        this._params = aParams;
        this._character = aParams.pers;

    }

    public set personage(aPers: Character) {
        this._character = aPers;
    }
    
    public get personage(): Character {
        return this._character;
    }

    public set isDebugMode(aValue: boolean) {
        this._isDebugMode = aValue;
    }

    public get isDebugMode(): boolean {
        return this._isDebugMode;
    }
    
    private clearDebugArrows() {
        for (let i = 0; i < this.debugArrows?.length; i++) {
            const arrow = this.debugArrows[i];
            this._params.scene.remove(arrow);
        }
        this.debugArrows = [];
    }

    private addDebugArrow(dir, pos, dist, color) {
        let arrow = new THREE.ArrowHelper(dir, pos, dist, 0x00ff00);
        this._params.scene.add(arrow);
        this.debugArrows.push(arrow);
    }

    update(dt: number) {

        this.clearDebugArrows();

        const controlObject = this._character;
        const _R = controlObject.quaternion.clone();

        controlObject.quaternion.copy(_R);

        const forwardVelocity = new THREE.Vector3(0, 0, 1);
        forwardVelocity.applyQuaternion(controlObject.quaternion);
        forwardVelocity.normalize();
        
        const upVelocity = new THREE.Vector3(0, 1, 0);
        upVelocity.applyQuaternion(controlObject.quaternion);
        upVelocity.normalize();

        let totalVelocity = forwardVelocity.clone().add(upVelocity);

        controlObject.position.add(totalVelocity);
        
    }

}