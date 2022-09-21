import { LogMng } from "./LogMng";

export type Point = {
    x: number;
    y: number;
};

export class RectABCD {
    a: Point;
    b: Point;
    c: Point;
    d: Point;
    constructor(a: Point, b: Point, c: Point, d: Point) {
        this.a = a; this.b = b; this.c = c; this.d = d;
    }
}

export class MyMath {

    public static randomInRange(aMin: number, aMax: number, auto = false): number {
        if (auto && aMin > aMax) {
            var tmp = aMin;
            aMin = aMax;
            aMax = tmp;
        }
        return Math.random() * Math.abs(aMax - aMin) + aMin;
    }

    public static randomIntInRange(aMin: number, aMax: number): number {
        return Math.round(MyMath.randomInRange(aMin, aMax));
    }

    public static clamp(x, min, max): number {
        return Math.min(Math.max(x, min), max);
    }

    public static sat(x: number): number {
        return this.clamp(x, 0, 1);
    }

    public static lerp(a, b, t): number {
        return a + (b - a) * t;
    }

    public static toRadian(aDeg: number): number {
        return aDeg * Math.PI / 180;
    }

    public static toDeg(aRad: number): number {
        return aRad * 180 / Math.PI;
    }

    public static easeInOutSine(t: number): number {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    public static easeOutCirc(x: number): number {
        return Math.sqrt(1 - Math.pow(x - 1, 2));
    }

    public static easeInExpo(x: number): number {
        return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }

    public static easeInOutQubic(x: number): number {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    public static easeInOutQuart(x: number): number {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    }

    /**
     * Convert a hex string (#FFAA22 or #FA2) to RGB
     * @param aHexColorStr 
     * @returns 
     */
    public static strHexToRGB(aHexColorStr: string): { r: number, g: number, b: number } {
        //LogMng.debug(`aHexColorStr: ${aHexColorStr}`);

        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        // let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        // let newHexColor = aHexColorStr.replace(shorthandRegex, function (m, r, g, b) {
        //     return r + r + g + g + b + b;
        // });
        // LogMng.debug(`newHexColor: ${newHexColor}`);

        // let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(newHexColor);
        // LogMng.debug(`result: ${result}`);

        let newHex = aHexColorStr.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b);
        //LogMng.debug(`newHex: ${newHex}`);

        let res: number[] = newHex.substring(1).match(/.{2}/g).map(x => parseInt(x, 16));
        //LogMng.debug(`res: ${res}`);
        //console.log(res);

        return res ? {
            r: res[0],
            g: res[1],
            b: res[2]
        } : null;
    }

    /**
     * Convert hex num (0x2266FF) to RGB
     * @param aHexNum 
     * @returns RGB 0..255
     */
    public static hexToRGB(aHexNum: number): { r: number, g: number, b: number } {
        let res = {
            r: (aHexNum >> 16) & 255,
            g: (aHexNum >> 8) & 255,
            b: aHexNum & 255
        };
        return res;
    }

    /**
     * 
     * @param c number in 0-255 format
     * @returns 
     */
    static byteToHexStr(c: number): string {
        let hex = c.toString(16);
        //LogMng.debug(`componentToHex: c = ${c}, hex = ${hex}`);
        return hex.length == 1 ? "0" + hex : hex;
    }

    /**
     * Convert RGB to Hex string
     * @param r Red in format 0 - 255
     * @param g Green in format 0 - 255
     * @param b Blue in format 0 - 255
     * @returns 
     */
    public static rgbToHexStr(r: number, g: number, b: number): string {
        return "#" + this.byteToHexStr(r) + this.byteToHexStr(g) + this.byteToHexStr(b);
    }

    // public static rgbToHex(r: number, g: number, b: number): number {
    //     return r * 10000 + g * 100 + b;
    // }

    /**
     * Lerp 2 colors in hex
     * @param aColor1 
     * @param aColor2 
     * @param t 
     * @returns rgb in 0..255 
     */
    public static lerpColors(aColor1: number, aColor2: number, t: number, isNormalize = false): {
        r: number,
        g: number,
        b: number
    } {

        // debugger;

        let rgb1 = this.hexToRGB(aColor1);
        let rgb2 = this.hexToRGB(aColor2);
        let rgb = {
            r: Math.floor(this.lerp(rgb1.r, rgb2.r, t)),
            g: Math.floor(this.lerp(rgb1.g, rgb2.g, t)),
            b: Math.floor(this.lerp(rgb1.b, rgb2.b, t))
        };

        if (isNormalize) {
            rgb.r /= 255;
            rgb.g /= 255;
            rgb.b /= 255;
        }

        return rgb;
    }

    public static getVectorLength(x1: number, y1: number, x2: number, y2: number): number {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public static IsPointInTriangle(ax, ay, bx, by, cx, cy, px, py: number): boolean {
        var b0x, b0y, c0x, c0y, p0x, p0y: number;
        var m, l: number; // мю и лямбда
        var res = false;
        // переносим треугольник точкой А в (0;0).
        b0x = bx - ax; b0y = by - ay;
        c0x = cx - ax; c0y = cy - ay;
        p0x = px - ax; p0y = py - ay;
        //
        m = (p0x * b0y - b0x * p0y) / (c0x * b0y - b0x * c0y);
        if (m >= 0 && m <= 1) {
            l = (p0x - m * c0x) / b0x;
            if (l >= 0 && (m + l) <= 1)
                res = true;
        }
        return res;
    }

    public static isPointInRect(rect: RectABCD, p: Point): boolean {
        return MyMath.IsPointInTriangle(rect.a.x, rect.a.y, rect.b.x, rect.b.y, rect.c.x, rect.c.y, p.x, p.y) &&
            MyMath.IsPointInTriangle(rect.c.x, rect.c.y, rect.d.x, rect.d.y, rect.a.x, rect.a.y, p.x, p.y);
    }

    public static isPointInCircle(x: number, y: number, cx: number, cy: number, r: number): boolean {
        return MyMath.getVectorLength(x, y, cx, cy) <= r;
    }

    public static isCirclesIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        return MyMath.getVectorLength(x1, y1, x2, y2) <= r1 + r2;
    }

}

export class LinearSpline {
    private _points: {val, t}[];
    private _lerp: Function;

    constructor(aLerp?: Function) {
        this._points = [];
        if (aLerp) {
            this._lerp = aLerp;
        }
        else {
            this._lerp = MyMath.lerp;
        }
    }

    addPoint(val, t: number) {
        this._points.push({ val: val, t: t });
    }

    get(t: number) {

        let id1 = 0;

        for (let i = 0; i < this._points.length; i++) {
            id1 = i;
            if (this._points[i].t >= t) break;
            
        }

        let id2 = id1;

        for (let i = this._points.length - 1; i >= 0; i--) {
            id2 = i;
            if (this._points[i].t <= t) break;
        }

        if (id1 == id2) {
            return this._points[id1].val;
        }

        // example:
        // [ 0.1, 0.3, 0.5, 0.8 ]
        // t = 0.05
        // id1 = 0, id2 = 0
        // t = 0.5
        // id1 = 2, id2 = 2

        return this._lerp(
            this._points[id1].val,
            this._points[id2].val,
            (t - this._points[id1].t) / (this._points[id2].t - this._points[id1].t)
        );

    }

}