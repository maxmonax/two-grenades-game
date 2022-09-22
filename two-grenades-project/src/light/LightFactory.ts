import * as THREE from 'three';
import { SunLight } from './SunLight';

type AmbientLightParams = {
    color: number;
    intensity: number;
}

type DirrectionalLightParams = {
    color: number;
    x: number;
    y: number;
    z: number;
    intensity: number;
    shadow?: {
        w: number;
        h: number;
        near: number;
        far: number;
        size: number;
        bias: number;
    };
};

export class LightFactory {

    static getAmbientLight(aParams: AmbientLightParams): THREE.AmbientLight {
        let light = new THREE.AmbientLight(aParams.color, aParams.intensity);
        return light;
    }

    static getSunLight(aParams: DirrectionalLightParams): SunLight {

        let light = new SunLight(aParams.color, aParams.intensity, aParams.x, aParams.y, aParams.z);
        light.castShadow = true;

        light.shadow.mapSize.width = aParams.shadow.w;
        light.shadow.mapSize.height = aParams.shadow.h;

        light.shadow.camera.left = -aParams.shadow.size;
        light.shadow.camera.bottom = -aParams.shadow.size;
        light.shadow.camera.right = aParams.shadow.size;
        light.shadow.camera.top = aParams.shadow.size;

        light.shadow.camera.near = aParams.shadow.near;
        light.shadow.camera.far = aParams.shadow.far;

        light.shadow.bias = aParams.shadow.bias;

        light.position.set(aParams.x, aParams.y, aParams.z);
        
        return light;

    }

}