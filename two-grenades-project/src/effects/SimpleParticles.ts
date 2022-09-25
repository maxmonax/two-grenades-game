import * as THREE from "three";
import { Signal } from "../events/Signal";
import { LinearSpline, MyMath } from "../utils/MyMath";

type SimpleParticlesParams = {
    parent: THREE.Object3D;
    texture: THREE.Texture;
    onWindowResizeSignal: Signal;
    radius?: number;
    segmentsW?: number;
    segmentsH?: number;
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
    scale: number;
    color: THREE.Color;
    alpha: number;
    lifeTime: number;
    lifeProgress: number;
    rotation: number;
    velocity: THREE.Vector3;
};

export class SimpleParticles {
    private _params: SimpleParticlesParams;
    private particles: THREE.Sprite[];
    // splines
    private alphaSpline: LinearSpline;
    private scaleFactorSpline: LinearSpline;
    // inner params
    private addParticleTime = 0;
    private startAlpha = 1;
    private startScale = 1;
    private prevPosition: THREE.Vector3;

    constructor(aParams: SimpleParticlesParams) {
        this._params = aParams;

        if (!this._params.radius) this._params.radius = 1;
        if (!this._params.segmentsW) this._params.segmentsW = 10;
        if (!this._params.segmentsH) this._params.radius = 10;
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

        this.particles = [];

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

    }

    private simpleLinerSpline(t, a, b) {
        return a + t * (b - a);
    }

    public get params(): SimpleParticlesParams {
        return this._params;
    }
    
    public get position(): THREE.Vector3 {
        return this._params.position;
    }

    
    public set velocity(v: THREE.Vector3) {
        this._params.velocity = v;
    }

    private addParticles(count: number, dt: number) {
        let dtPosition = this._params.position.clone().sub(this.prevPosition).negate();
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
                scale: size * this.startScale,
                color: clr,
                alpha: this.startAlpha,
                lifeTime: this._params.lifeTime,
                lifeProgress: 0,
                rotation: 0,
                velocity: velocity
            };

            let mat = new THREE.SpriteMaterial({
                map: this._params.texture,
                color: clr,
                blending: THREE.AdditiveBlending,
                transparent: true,
                alphaTest: 0.01,
                // opacity: 0.9,
                opacity: 0.5,
                depthTest: true,
                depthWrite: false,
            });
            this._params.texture.needsUpdate = true;
            
            let sprite = new THREE.Sprite(mat);
            sprite.position.copy(pos);
            sprite.scale.set(size, size, size);
            sprite['pData'] = pData;
            sprite['mat'] = mat;
            this.params.parent.add(sprite);
            this.particles.push(sprite);
        }
    }

    private updateParticles(dt: number) {

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const sprite = this.particles[i];
            let p: ParticleData = sprite['pData'];
            let mat: THREE.SpriteMaterial = sprite['mat'];
            p.lifeProgress += dt;
            if (p.lifeProgress >= p.lifeTime) {
                sprite.visible = false;
                this.params.parent.remove(sprite);
                this.particles.splice(i, 1);
                continue;
            }
            let lifePercent = p.lifeProgress / p.lifeTime;

            // alpha
            if (this.alphaSpline) {
                p.alpha = this.alphaSpline.get(lifePercent);
                mat.opacity = p.alpha;
            }

            // size
            if (this.scaleFactorSpline) {
                p.scale = p.startSize * this.scaleFactorSpline.get(lifePercent) * this.params.sizeFactor;
                sprite.scale.set(p.scale, p.scale, p.scale);
            }

            // pos
            p.position.add(this._params.velocity.clone().multiplyScalar(dt));
            sprite.position.copy(p.position);

            p.velocity.add(this._params.gravity.clone().multiplyScalar(dt));
        }

    }

    free() {
        this.particles = [];
        this._params = null;
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
    }

}