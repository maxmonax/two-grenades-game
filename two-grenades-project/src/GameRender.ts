import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import * as datGui from "dat.gui";
import { FrontEvents } from "./events/FrontEvents";
import { InputMng } from "./input/InputMng";
import { DeviceInfo } from "./utils/DeviceInfo";
import { GameScene } from "./game/GameScene";
import { Settings } from "./data/Settings";
import { LogMng } from "./utils/LogMng";

type Passes = {
    composer: EffectComposer;
    renderPass: RenderPass;
    fxaaPass?: ShaderPass;
    smaaPass?: SMAAPass;
};

export class GameRender {

    private _renderer: THREE.WebGLRenderer;
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;
    private _passes: Passes;
    private _stats: Stats;
    private _clock: THREE.Clock;
    private _renderPixelRatio = 1;
    private _worldScene: GameScene;

    constructor(aDomCanvasParent: HTMLElement) {

        this.initDebug();
        this.initRenderer(aDomCanvasParent);
        this.initScene();
        this.initPasses();
        this.initInput(aDomCanvasParent);
        this.initGameScene();
        this.initStats();
        this.initEvents();

        this._clock = new THREE.Clock();
        this.animate();

    }

    private initDebug() {
        Settings.datGui = new datGui.GUI();

        if (Settings.isDebugMode) {
            // any debug gui fields

        }
    }

    private initRenderer(aDomCanvasParent: HTMLElement) {
        let domContainer = aDomCanvasParent;
        let w = domContainer.clientWidth;
        let h = domContainer.clientHeight;

        const clearColor = new THREE.Color(Settings.BG_COLOR);

        this._renderer = new THREE.WebGLRenderer({
            antialias: false
        });
        this._renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this._renderer.setSize(w, h);
        this._renderer.setClearColor(clearColor);
        this._renderPixelRatio = this._renderer.getPixelRatio();
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        this._renderer.outputEncoding = THREE.sRGBEncoding;
        this._renderer.toneMapping = THREE.LinearToneMapping;
        this._renderer.toneMappingExposure = 0.8;

        domContainer.appendChild(this._renderer.domElement);
    }

    private initScene() {
        const w = innerWidth;
        const h = innerHeight;

        this._scene = new THREE.Scene();

        this._camera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
        this._camera.position.set(10, 0, 10);
        this._camera.lookAt(new THREE.Vector3(0, 0, 0));
        this._scene.add(this._camera);
    }

    private initPasses() {
        const w = innerWidth;
        const h = innerHeight;

        this._passes = {
            composer: new EffectComposer(this._renderer),
            renderPass: new RenderPass(this._scene, this._camera)
        };

        this._passes.composer.setPixelRatio(1);

        // anti-aliasing pass
        let aaPass: ShaderPass | SMAAPass;
        switch (Settings.AA_TYPE) {
            case 1:
                // FXAA
                aaPass = this._passes.fxaaPass = new ShaderPass(FXAAShader);
                this._passes.fxaaPass.material.uniforms['resolution'].value.x = 1 / (w * this._renderPixelRatio);
                this._passes.fxaaPass.material.uniforms['resolution'].value.y = 1 / (h * this._renderPixelRatio);
                break;

            case 2:
                // SMAA
                aaPass = this._passes.smaaPass = new SMAAPass(w, h);
                break;

            default:
                LogMng.warn(`GameEngine -> Unknown anti-aliasing type: ${Settings.AA_TYPE}`);
                break;
        }

        this._passes.composer.addPass(this._passes.renderPass);
        if (aaPass) this._passes.composer.addPass(aaPass);
    }

    private initInput(aDomCanvasParent: HTMLElement) {
        InputMng.getInstance({
            inputDomElement: aDomCanvasParent,
            desktop: DeviceInfo.getInstance().desktop,
            isRightClickProcessing: false
        });
    }

    private initGameScene() {
        this._worldScene = new GameScene(this._renderer, this._scene, this._camera);
    }
    
    private initStats() {
        if (Settings.isDebugMode) {
            this._stats = new Stats();
            this._stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(this._stats.dom);
        }
    }

    private initEvents() {
        FrontEvents.onWindowResizeSignal.add(this.onWindowResize, this);
    }

    private onWindowResize() {
        if (!this._renderer || !this._camera) return;
        let w = innerWidth;
        let h = innerHeight;
        this._renderer.setSize(w, h);
        this._passes.composer.setSize(w, h);
        this._camera.aspect = w / h;
        this._camera.updateProjectionMatrix();
        
        switch (Settings.AA_TYPE) {
            case 1:
                this._passes.fxaaPass.material.uniforms['resolution'].value.x = 1 / (w * this._renderPixelRatio);
                this._passes.fxaaPass.material.uniforms['resolution'].value.y = 1 / (h * this._renderPixelRatio);
                break;
        }
    }

    private render() {
        this._passes.composer.render();
    }

    private update(dt: number) {
        this._worldScene.update(dt);
        this.render();
    }

    private animate() {
        let dt = this._clock.getDelta();
        
        if (Settings.isDebugMode) this._stats.begin();
        this.update(dt);
        if (Settings.isDebugMode) this._stats.end();

        requestAnimationFrame(() => this.animate());
    }

}
