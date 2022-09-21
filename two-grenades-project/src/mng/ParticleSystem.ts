import * as THREE from "three";
import { FrontEvents } from "../events/FrontEvents";
import { ThreeLoader } from "../loaders/ThreeLoader";
import { LinearSpline, MyMath } from "../utils/MyMath";

const _VS = `
uniform float pointMultiplier;

attribute float size;
attribute vec4 clr;

varying vec4 vColor;

void main() {
    vColor = clr;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * mvPosition;
    //gl_PointSize = pointMultiplier / gl_Position.w;
    gl_PointSize = size * pointMultiplier / gl_Position.w;
}
`;

const _FS = `
uniform sampler2D diffuseTexture;

varying vec4 vColor;

void main() {
    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vColor;
}
`;

type ParticleSystemParams = {
    parent: THREE.Object3D;
    camera: THREE.Camera;
    frequency?: number; // how many particles in second
    lifeTime?: number;
    gravity?: THREE.Vector3;
    position?: THREE.Vector3; // basic start position
    deltaPosition?: {
        x?: { min: number, max: number },
        y?: { min: number, max: number },
        z?: { min: number, max: number }
    },
    velocity?: THREE.Vector3; // start velocity
    deltaVelocity?: {
        x?: { min: number, max: number },
        y?: { min: number, max: number },
        z?: { min: number, max: number }
    },
    size?: { min: number, max: number },
    sizeFactor?: number,
    color?: number | 'random',
    alphaChange?: { t: number, val: number }[],
    scaleFactorChange?: { t: number, val: number }[],
    sorting?: boolean
};

type ParticleData = {
    position: THREE.Vector3;
    startSize: number;
    size: number;
    color: THREE.Color;
    alpha: number;
    lifeTime: number;
    lifeProgress: number;
    rotation: number;
    velocity: THREE.Vector3;
};

export class ParticleSystem {
    private _params: ParticleSystemParams;
    private uniforms: any;
    private material: THREE.ShaderMaterial;
    private geometry: THREE.BufferGeometry;
    private points: THREE.Points;
    private particles: ParticleData[];

    private alphaSpline: LinearSpline;
    private scaleFactorSpline: LinearSpline;

    // inner params
    private addParticleTime = 0;
    private startAlpha = 1;
    private startScale = 1;
    private prevPosition: THREE.Vector3;

    constructor(aParams: ParticleSystemParams) {
        this._params = aParams;

        if (!this._params.position) this._params.position = new THREE.Vector3();
        if (!this._params.gravity) this._params.gravity = new THREE.Vector3();
        if (!this._params.velocity) this._params.velocity = new THREE.Vector3();
        if (!this._params.frequency) this._params.frequency = 50;
        if (!this._params.lifeTime) this._params.lifeTime = 5;
        if (!this._params.size) this._params.size = { min: 1, max: 1 };
        if (!this._params.sizeFactor) this._params.sizeFactor = 1;
        if (!this._params.color) this._params.color = 0xffffff;
        if (!this._params.deltaPosition) this._params.deltaPosition = {};
        if (!this._params.deltaVelocity) this._params.deltaVelocity = {};

        this.prevPosition = this._params.position.clone();

        this.uniforms = {
            diffuseTexture: {
                value: ThreeLoader.getInstance().getTexture('particleCircle')
            },
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan(.02 * 60.0 * Math.PI / 180))
            }
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this.particles = [];

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
        this.geometry.setAttribute('clr', new THREE.Float32BufferAttribute([], 4));

        this.points = new THREE.Points(this.geometry, this.material);

        this._params.parent.add(this.points);

        if (this._params.alphaChange) {
            this.alphaSpline = new LinearSpline(this.simpleLinerSpline);
            for (let i = 0; i < this._params.alphaChange.length; i++) {
                const a = this._params.alphaChange[i];
                this.alphaSpline.addPoint(a.val, a.t);
            }
            this.startAlpha = this._params.alphaChange[0].val;
        }

        if (this._params.scaleFactorChange) {
            this.scaleFactorSpline = new LinearSpline(this.simpleLinerSpline);
            for (let i = 0; i < this._params.scaleFactorChange.length; i++) {
                const sf = this._params.scaleFactorChange[i];
                this.scaleFactorSpline.addPoint(sf.val, sf.t);
            }
            this.startScale = this._params.scaleFactorChange[0].val;
        }

        //this.addParticles();
        //this.updateGeometry();

        FrontEvents.onWindowResizeSignal.add(this.onWindowResize, this);
    }

    private simpleLinerSpline(t, a, b) {
        return a + t * (b - a);
    }

    public get params(): ParticleSystemParams {
        return this._params;
    }
    
    public get position(): THREE.Vector3 {
        return this._params.position;
    }
    

    private onWindowResize() {
        this.uniforms.pointMultiplier.value = window.innerHeight / (2.0 * Math.tan(.02 * 60.0 * Math.PI / 180));
    }

    private addParticles(count: number, dt: number) {
        let dtPosition = this._params.position.clone().sub(this.prevPosition).negate();
        //  console.log('dtPosition: ', dtPosition);
        this.prevPosition.copy(this._params.position);

        for (let i = 0; i < count; i++) {
            let velocity = this._params.velocity.clone();
            let dv = this._params.deltaVelocity;
            if (dv.x) velocity.x += MyMath.randomInRange(dv.x.min, dv.x.max);
            if (dv.y) velocity.y += MyMath.randomInRange(dv.y.min, dv.y.max);
            if (dv.z) velocity.z += MyMath.randomInRange(dv.z.min, dv.z.max);

            let posVelFactor = Math.random() * dt;
            let posVelAdd = velocity.clone().multiplyScalar(posVelFactor).add(dtPosition);
            let posIncrement = dtPosition.clone().multiplyScalar(Math.random()).add(posVelAdd);

            let pos = this._params.position.clone().add(posIncrement);
            let dp = this._params.deltaPosition;
            if (dp.x) pos.x += MyMath.randomInRange(dp.x.min, dp.x.max);
            if (dp.y) pos.y += MyMath.randomInRange(dp.y.min, dp.y.max);
            if (dp.z) pos.z += MyMath.randomInRange(dp.z.min, dp.z.max);

            let clr: THREE.Color;
            if (this._params.color == 'random') {
                clr = new THREE.Color(Math.random(), Math.random(), Math.random());
            }
            else {
                clr = new THREE.Color(this._params.color);
            }

            let size = MyMath.randomInRange(this._params.size.min, this._params.size.max);

            let pData: ParticleData = {
                position: pos,
                startSize: size,
                size: size * this.startScale,
                color: clr,
                alpha: this.startAlpha,
                lifeTime: this._params.lifeTime,
                lifeProgress: 0,
                rotation: 0,
                velocity: velocity
            };
            this.particles.push(pData);
        }
    }

    private updateGeometry() {
        const positions = [];
        const sizes = [];
        const colors = [];

        for (let p of this.particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            sizes.push(p.size);
            colors.push(p.color.r, p.color.g, p.color.b, p.alpha);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        this.geometry.setAttribute('clr', new THREE.Float32BufferAttribute(colors, 4));

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.clr.needsUpdate = true;

    }

    private updateParticles(dt: number) {

        for (const p of this.particles) {
            p.lifeProgress += dt;
            if (p.lifeProgress >= p.lifeTime) continue;
            let lifeProgress = p.lifeProgress / p.lifeTime;

            // alpha
            if (this.alphaSpline) {
                p.alpha = this.alphaSpline.get(lifeProgress);
            }

            // size
            if (this.scaleFactorSpline) {
                p.size = p.startSize * this.scaleFactorSpline.get(lifeProgress) * this.params.sizeFactor;
            }

            // pos
            p.position.add(p.velocity.clone().multiplyScalar(dt));

            p.velocity.add(this._params.gravity.clone().multiplyScalar(dt));
        }

        this.particles = this.particles.filter(p => {
            return p.lifeProgress < p.lifeTime;
        });
    
        // sort
        if (this._params.sorting == true) {
            this.particles.sort((a, b) => {
                const d1 = this._params.camera.position.distanceTo(a.position);
                const d2 = this._params.camera.position.distanceTo(b.position);
                if (d1 > d2) return -1;
                if (d1 < d2) return 1;
                return 0;
            });
        }
    }

    free() {
        FrontEvents.onWindowResizeSignal.remove(this.onWindowResize, this);
        this.particles = [];
        this.updateGeometry();
        this._params = null;
        this.uniforms = null;
        this.material = null;
        this.geometry = null;
        this.points = null;
        this.alphaSpline = null;
        this.scaleFactorSpline = null;
        this.particles = null;
    }

    update(dt: number) {
        let tr = 1 / this._params.frequency;
        this.addParticleTime += dt;
        if (this.addParticleTime >= tr) {
            let cnt = Math.floor(this.addParticleTime / tr);
            this.addParticles(cnt, this.addParticleTime);
            this.addParticleTime %= tr;
        }
        this.updateParticles(dt);
        this.updateGeometry();
    }


}