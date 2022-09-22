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
import { WorldScene } from "./scenes/GameScene";
import { Settings } from "./data/Settings";
import { LogMng } from "./utils/LogMng";

type Passes = {
    composer: EffectComposer;
    renderPass: RenderPass;
    fxaaPass?: ShaderPass;
    smaaPass?: SMAAPass;
};

export class GameRender {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private passes: Passes;
    private stats: Stats;
    private clock: THREE.Clock;
    private renderPixelRatio = 1;
    private worldScene: WorldScene;

    constructor(aDomCanvasParent: HTMLElement) {

        this.initDebug();
        this.initRenderer(aDomCanvasParent);
        this.initScene();
        this.initPasses();
        this.initInput(aDomCanvasParent);
        this.initGameScene();
        this.initStats();
        this.initEvents();

        this.clock = new THREE.Clock();
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

        this.renderer = new THREE.WebGLRenderer({
            antialias: false
        });
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this.renderer.setSize(w, h);
        this.renderer.setClearColor(clearColor);
        this.renderPixelRatio = this.renderer.getPixelRatio();
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 0.8;

        domContainer.appendChild(this.renderer.domElement);
    }

    private initScene() {
        const w = innerWidth;
        const h = innerHeight;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
        this.camera.position.set(10, 0, 10);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.add(this.camera);
    }

    private initPasses() {
        const w = innerWidth;
        const h = innerHeight;

        this.passes = {
            composer: new EffectComposer(this.renderer),
            renderPass: new RenderPass(this.scene, this.camera)
        };

        this.passes.composer.setPixelRatio(1);

        // anti-aliasing pass
        let aaPass: ShaderPass | SMAAPass;
        switch (Settings.AA_TYPE) {
            case 1:
                // FXAA
                aaPass = this.passes.fxaaPass = new ShaderPass(FXAAShader);
                this.passes.fxaaPass.material.uniforms['resolution'].value.x = 1 / (w * this.renderPixelRatio);
                this.passes.fxaaPass.material.uniforms['resolution'].value.y = 1 / (h * this.renderPixelRatio);
                break;

            case 2:
                // SMAA
                aaPass = this.passes.smaaPass = new SMAAPass(w, h);
                break;

            default:
                LogMng.warn(`GameEngine -> Unknown anti-aliasing type: ${Settings.AA_TYPE}`);
                break;
        }

        this.passes.composer.addPass(this.passes.renderPass);
        if (aaPass) this.passes.composer.addPass(aaPass);
    }

    private initInput(aDomCanvasParent: HTMLElement) {
        InputMng.getInstance({
            inputDomElement: aDomCanvasParent,
            desktop: DeviceInfo.getInstance().desktop,
            isRightClickProcessing: false
        });
    }

    private initGameScene() {
        this.worldScene = new WorldScene({
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera
        });
        this.scene.add(this.worldScene);
    }
    
    private initStats() {
        if (Settings.isDebugMode) {
            this.stats = new Stats();
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(this.stats.dom);
        }
    }

    private initEvents() {
        FrontEvents.onWindowResizeSignal.add(this.onWindowResize, this);
    }

    private onWindowResize() {
        if (!this.renderer || !this.camera) return;
        let w = innerWidth;
        let h = innerHeight;
        this.renderer.setSize(w, h);
        this.passes.composer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        
        switch (Settings.AA_TYPE) {
            case 1:
                this.passes.fxaaPass.material.uniforms['resolution'].value.x = 1 / (w * this.renderPixelRatio);
                this.passes.fxaaPass.material.uniforms['resolution'].value.y = 1 / (h * this.renderPixelRatio);
                break;
        }
    }

    private render() {
        this.passes.composer.render();
    }

    private update(dt: number) {
        this.worldScene.update(dt);
        this.render();
    }

    private animate() {
        let dt = this.clock.getDelta();
        
        if (Settings.isDebugMode) this.stats.begin();
        this.update(dt);
        if (Settings.isDebugMode) this.stats.end();

        requestAnimationFrame(() => this.animate());
    }

}
