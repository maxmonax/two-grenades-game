import * as THREE from "three";
import { Settings } from "../../data/Settings";
import { TextureAlias } from "../../data/TextureData";
import { ThreeLoader } from "../../loaders/ThreeLoader";
import { Wall } from "../Wall";

export class TestLand extends THREE.Group {

    constructor(aParams: {
        floorSize: number,
    }) {

        super();

        let loader = ThreeLoader.getInstance();

        const size = aParams.floorSize;
        const h = 2;
        let floorGeom = new THREE.BoxGeometry(size, h, size);

        let repeatValue = size / Settings.METER_SIZE / 4;
        let floorTexture = loader.getTexture(TextureAlias.grass).clone();
        floorTexture.repeat.set(repeatValue, repeatValue);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.needsUpdate = true;

        let floorMat = new THREE.MeshStandardMaterial({
            map: floorTexture
        });

        let floorMesh = new THREE.Mesh(floorGeom, floorMat);
        floorMesh.position.y = -1;
        floorMesh.receiveShadow = true;
        this.add(floorMesh);

        let wall = new Wall();
        wall.position.x = -Settings.METER_SIZE * 4;
        this.add(wall);

        wall = new Wall();
        wall.position.x = Settings.METER_SIZE * 4;
        this.add(wall);

    }

}