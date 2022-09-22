import * as THREE from "three";
import { Settings } from "../data/Settings";
import { TextureAlias } from "../data/TextureData";
import { ThreeLoader } from "../loaders/ThreeLoader";

export class Wall extends THREE.Group {

    constructor() {

        super();

        let loader = ThreeLoader.getInstance();

        const wallWidth = 1 * Settings.METER_SIZE;
        const wallHeight = 1.2 * Settings.METER_SIZE;
        const wallLength = 4;
        let cubeGeom = new THREE.BoxGeometry(wallWidth, wallHeight, wallWidth);

        let cubeTexture = loader.getTexture(TextureAlias.bricks).clone();
        let repeatValue = wallWidth / Settings.METER_SIZE;
        cubeTexture.repeat.set(repeatValue, repeatValue);
        cubeTexture.wrapS = THREE.RepeatWrapping;
        cubeTexture.wrapT = THREE.RepeatWrapping;
        cubeTexture.offset.set(0, 0);
        cubeTexture.needsUpdate = true;

        let cubeMat = new THREE.MeshStandardMaterial({
            map: cubeTexture
        });

        for (let i = 0; i < wallLength; i++) {
            let cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
            cubeMesh.position.x = 0;
            cubeMesh.position.y = wallHeight / 2;
            cubeMesh.position.z = -wallWidth * (wallLength - 1) / 2 + i * wallWidth;
            cubeMesh.castShadow = true;
            cubeMesh.receiveShadow = true;
            this.add(cubeMesh);
        }

    }

}
