import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import * as datGui from "dat.gui";
import { Config } from "./data/Config";
import { FrontEvents } from "./events/FrontEvents";
import { InputMng } from "./input/InputMng";
import { DeviceInfo } from "./utils/DeviceInfo";
import { WorldScene } from "./scenes/GameScene";
import { Params } from "./data/Params";

type Passes = {
    composer: EffectComposer;
    renderPass: RenderPass;
    fxaaPass?: ShaderPass;
    smaaPass?: SMAAPass;
};

export class GameEngine {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private passes: Passes;
    private stats: Stats;
    private clock: THREE.Clock;
    private renderPixelRatio = 1;
    private worldScene: WorldScene;

    constructor() {

        this.setDebug();
        this.setRenderer();
        this.setScene();
        this.setPasses();
        this.setInput();
        this.setGame();
        this.setDebugGui();
        this.setStats();
        
        FrontEvents.onWindowResizeSignal.add(this.onWindowResize, this);
        
        this.clock = new THREE.Clock();

        this.animate();

    }

    private setDebug() {
        if (Config.isDebugMode) {
            Params.datGui = new datGui.GUI();
        }
    }

    private setRenderer() {
        let domContainer = Config.domCanvasParent;
        let w = domContainer.clientWidth;
        let h = domContainer.clientHeight;

        const clearColor = new THREE.Color(Config.BG_COLOR);

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

    private setScene() {
        const w = Config.domCanvasParent.clientWidth;
        const h = Config.domCanvasParent.clientHeight;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 1000);
        this.camera.position.set(10, 0, 10);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.add(this.camera);
    }

    private setPasses() {
        const w = Config.domCanvasParent.clientWidth;
        const h = Config.domCanvasParent.clientHeight;

        this.passes = {
            composer: new EffectComposer(this.renderer),
            renderPass: new RenderPass(this.scene, this.camera)
        };

        this.passes.composer.setPixelRatio(1);

        let aaPass: ShaderPass | SMAAPass;
        switch (Config.AA_TYPE) {
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
                break;
        }

        this.passes.composer.addPass(this.passes.renderPass);
        if (aaPass) this.passes.composer.addPass(aaPass);
    }

    private setInput() {
        InputMng.getInstance({
            inputDomElement: Config.domCanvasParent,
            desktop: DeviceInfo.getInstance().desktop,
            isRightClickProcessing: false
        });
    }

    private setGame() {
        this.worldScene = new WorldScene({
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera
        });
        this.worldScene.init();
        this.worldScene.showScene();
        this.scene.add(this.worldScene);
    }

    private setDebugGui() {
        const gui = Params.datGui;
        if (Config.isDebugMode) {
            const LOCAL_PARAMS = {
                axiesHelper: false
            };
            let testFolder = gui.addFolder('Test');
            testFolder.add(LOCAL_PARAMS, 'axiesHelper').onChange((value) => {
                // GameEvents.onDebugAxeHelperVisibleChange.dispatch(value);
            });
            testFolder.open();
        }
    }

    private setStats() {
        if (Config.isDebugMode) {
            this.stats = new Stats();
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(this.stats.dom);
        }
    }

    private onWindowResize() {
        if (!this.renderer || !this.camera) return;
        let w = Config.domCanvasParent.clientWidth;
        let h = Config.domCanvasParent.clientHeight;
        this.renderer.setSize(w, h);
        this.passes.composer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        
        switch (Config.AA_TYPE) {
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
        
        if (Config.isDebugMode) this.stats.begin();
        this.update(dt);
        if (Config.isDebugMode) this.stats.end();

        requestAnimationFrame(() => this.animate());
    }

}
