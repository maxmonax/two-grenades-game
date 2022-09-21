import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as datGui from "dat.gui";
import { ThreeLoader } from '../loaders/ThreeLoader';
import { LogMng } from '../utils/LogMng';
import { Config } from '../data/Config';
import { MyMath } from '../utils/MyMath';
import { FSM } from '../states/FSM';
import { InputMng } from '../input/InputMng';
import { TestLand } from '../objects/lands/TestLand';

const WORLD_CONFIG = {
    AMBIENT_COLOR: 0xFFFFFF,
    AMBIENT_COLOR_INTENS: 0.4,
    CHARACTER_SCALE: Config.METER_SIZE / 10 * 1 / 10,
    TILE_SIZE: Config.METER_SIZE * 40
};

enum States {
    CombatInit = 'CombatInit',
    Combat = 'Combat'
};

const CAMERA_PARAMS = {
    maxDist: Config.METER_SIZE * 20,
    minDist: Config.METER_SIZE,
    startPos: {
        x: 0,
        y: Config.METER_SIZE * 5,
        z: Config.METER_SIZE * 10
    },
};

type DirLightParams = {
    color: number;
    x: number;
    y: number;
    z: number;
    intens: number;
    shadow?: {
        w: number;
        h: number;
        near: number;
        far: number;
        size: number;
        bias: number;
    };
};

type Sunparams = {
    params: DirLightParams;
    cameraDeltaPosition: THREE.Vector3;
}

const SUN_CONFIG: Sunparams = {
    params: {
        color: 0xffffff,
        x: 1000, y: 2000, z: 1000,
        intens: 1.0,
        shadow: {
            w: 1024 * 2, h: 1024 * 2, near: 1, far: 5000, size: 512 * 2, bias: 0.00005
        }
    },
    cameraDeltaPosition: new THREE.Vector3(1000, 3000, 2000)
};

export class WorldScene extends THREE.Group {

    private _inited = false;
    private fsm: FSM;

    private renderer: THREE.Renderer;
    private scene: THREE.Scene;

    private camera: THREE.PerspectiveCamera;
    private cameraTarget: THREE.Vector3;
    private camOrbitCtrl: OrbitControls;
    
    private colliders: THREE.Object3D[] = [];
    
    private sunDirLight: THREE.DirectionalLight;
    private ambientLight: THREE.AmbientLight;


    constructor(aParams: {
        renderer: THREE.Renderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera
    }) {

        super();

        this.renderer = aParams.renderer;   
        this.scene = aParams.scene;
        this.camera = aParams.camera;

        // camera
        this.cameraTarget = new THREE.Vector3();

        // this.debugArrows = [];

    }

    public get inited(): boolean {
        return this._inited;
    }

    init() {
        if (this.inited) return;
        this._inited = true;

        this.camera.position.set(
            CAMERA_PARAMS.startPos.x,
            CAMERA_PARAMS.startPos.y,
            CAMERA_PARAMS.startPos.z
        );
        this.camera.lookAt(this.cameraTarget);
        this.add(this.camera);

        // scene
        this.initObjects();

        // sky
        this.initSky();

        // characters

        // fog
        this.createFog();

        // states
        this.fsm = new FSM();

        // controls

    }

    finit() {
        if (!this.inited) return;
        this._inited = false;
        this.fsm.free();
        // this.stateMachine = null;
        LogMng.debug('HangarScene: finit() start...');
        while (this.children.length) {
            this.remove(this.children[0]);
        }
    }

    private addDirLight(aParams: DirLightParams): THREE.DirectionalLight {
        let light: THREE.DirectionalLight;

        light = new THREE.DirectionalLight(aParams.color, aParams.intens);
        light.castShadow = true;

        light.shadow.mapSize.width = aParams.shadow.w;
        light.shadow.mapSize.height = aParams.shadow.h;

        light.shadow.camera.left = -aParams.shadow.size;
        light.shadow.camera.bottom = -aParams.shadow.size;
        light.shadow.camera.right = aParams.shadow.size;
        light.shadow.camera.top = aParams.shadow.size;

        light.shadow.camera.near = aParams.shadow.near;
        light.shadow.camera.far = aParams.shadow.far;

        // light.shadow.bias = 0.0006;
        light.shadow.bias = aParams.shadow.bias;
                
        if (Config.isDebugMode) {
                    
            // if (Params.datGui) Params.datGui.add(light.shadow, 'bias', -0.0001, 0.0001, 0.00001);

            let camHelper = new THREE.DirectionalLightHelper(light);
            camHelper.visible = false;
            this.add(camHelper);

            let helper = new THREE.CameraHelper(light.shadow.camera);
            helper.visible = false;
            this.add(helper);

        }

        light.position.set(aParams.x, aParams.y, aParams.z);
        this.add(light);

        return light;
    }

    private initObjects() {

        const tSize = WORLD_CONFIG.TILE_SIZE;
        const mcpScale = WORLD_CONFIG.CHARACTER_SCALE;
        const oldMcpScale = 2.54;

        let land = new TestLand({ floorSize: WORLD_CONFIG.TILE_SIZE });
        land.position.set(0, 0, 0);
        this.add(land);
        this.colliders.push(land);

        if (Config.isDebugMode) {
            let axHelper = new THREE.AxesHelper(Config.METER_SIZE * 50);
            axHelper.visible = false;
            this.add(axHelper);
        }

    }

    private initSky() {

        let loader = ThreeLoader.getInstance();

        // sun dir light
        this.sunDirLight = this.addDirLight(SUN_CONFIG.params);
        this.sunDirLight.target = this.camera;

        // ambient light
        this.ambientLight = new THREE.AmbientLight(WORLD_CONFIG.AMBIENT_COLOR, WORLD_CONFIG.AMBIENT_COLOR_INTENS);
        this.add(this.ambientLight);

        // skybox
        let t = loader.getTexture('skybox');
        const rt = new THREE.WebGLCubeRenderTarget(t.image.height);
        rt.fromEquirectangularTexture(this.renderer as any, t);
        this.scene.background = rt;

    }

    private createFog() {
        
    }

    initGuiSettings(gui: datGui.GUI) {

        if (!this.inited) return;

        let sceneFolder = gui.addFolder('Scene');

        sceneFolder.open();

    }

    showScene() {

        // camera
        // this.camera.position.set(-CAMERA_PARAMS.maxDist / 2, CAMERA_PARAMS.maxDist / 4, -CAMERA_PARAMS.maxDist / 10).add(this.activePers.position);
        this.add(this.camera);

        // fog
        this.createFog();
        
        this.visible = true;
    }

    private getObjectUnderMouse(): THREE.Object3D {
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(InputMng.getInstance().normalInputPos, this.camera);
        let intersects = raycaster.intersectObjects(this.children, true);
        for (let i = 0; i < intersects.length; i++) {
            // debugger;
            const obj = intersects[i].object;
            if (obj.type.indexOf('Helper') >= 0) continue;
            return obj;
        }
        return null;
    }

    update(dt: number) {

        if (!this._inited) return;

        this.fsm.update(dt);

        this.sunDirLight.position.copy(this.camera.position).add(SUN_CONFIG.cameraDeltaPosition);

    }


}
