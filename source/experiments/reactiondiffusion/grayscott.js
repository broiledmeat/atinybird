import {blCanvas} from "/js/birdlib/canvas.mjs";
import {PALETTES, getPaletteArgb} from "/js/birdlib/color.mjs";
import {appendButtonInput, appendPaletteInput, appendRangeInput} from "/js/birdlib/form.mjs";

const WIDTH = 300;
const HEIGHT = 300;

class GrayScott extends blCanvas
{
    /**
     * @param {Number} width
     * @param {Number} height
     */
    constructor(width, height)
    {
        super(width, height);

        this.palette = PALETTES[Object.keys(PALETTES)[0]];
        this.uChange = 0.16;
        this.vChange = 0.08;
        this.fChange = 0.035;
        this.kChange = 0.065;
        this.luChange = 0.5;
        this.lvChange = 0.5;
        this._initBoxScale = 0.15;

        const length = width * height;
        this._uHigh = 0;
        this._uLow = 0;
        this._uCurrent = new Float32Array(length);
        this._uPrevious = new Float32Array(length);
        this._vCurrent = new Float32Array(length);
        this._vPrevious = new Float32Array(length);

        this._imageBuffer = this.createBuffer(width, height);
        this._lastIterateTime = 0;

        this.randomize();
    }

    start()
    {
        requestAnimationFrame(t => this._draw(t));
    }

    randomize()
    {
        const uPrevious = this._uPrevious;
        const vPrevious = this._vPrevious;

        this._uHigh = 0;
        this._uLow = 1;

        for (let y = 0; y < this._height; y++)
        {
            for (let x = 0; x < this._width; x++)
            {
                this._setCell(uPrevious, x, y, 1);
                this._setCell(vPrevious, x, y, 0);
            }
        }

        let w = Math.round(this._width * this._initBoxScale);
        let h = Math.round(this._height * this._initBoxScale);
        let rx = Math.floor((this._width / 2) - (w / 2));
        let ry = Math.floor((this._height / 2) - (h / 2));

        for (let y = 0; y < h; y++)
        {
            for (let x = 0; x < w; x++)
            {
                let u = 0.5 + ((Math.random() * 0.02) - 0.01);
                let v = 0.25 + ((Math.random() * 0.02) - 0.01);

                this._setCell(uPrevious, rx + x, ry + y, u);
                this._setCell(vPrevious, rx + x, ry + y, v);

                this._uHigh = Math.max(this._uHigh, u);
                this._uLow = Math.min(this._uLow, u);
            }
        }
    }

    /**
     * @param {Number} value
     * @returns {Number}
     * @private
     */
    _getColor(value)
    {
        const i = (value - this._uLow) / (this._uHigh - this._uLow);
        return getPaletteArgb(this.palette, i);
    }

    _draw(time)
    {
        requestAnimationFrame(t => this._draw(t));

        const steps = this._getSteps(time);

        if (steps === 0)
        {
            return;
        }

        for (let _ = 0; _ < steps; _++)
        {
            this._iterate();
        }

        const buffer = this._imageBuffer.buffer;
        const width = this._width;
        const height = this._height;
        const uCurrent = this._uCurrent;

        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                let cell = this._getCell(uCurrent, x, y);
                buffer[(y * width) + x] = this._getColor(cell);
            }
        }

        this._imageBuffer.draw(this._context, 0, 0);
        this.pushToAttachedCanvases();
    }

    _wrapWidth(x)
    {
        return ((x % this._width) + this._width) % this._width;
    }

    _wrapHeight(y)
    {
        return ((y % this._height) + this._height) % this._height;
    }

    /**
     * @param {Float32Array} data
     * @param {Number} x
     * @param {Number} y
     * @param {Number} value
     * @private
     */
    _setCell(data, x, y, value)
    {
        x = this._wrapWidth(x);
        y = this._wrapHeight(y);
        data[(y * this._width) + x] = value;
    }

    /**
     * @param {Float32Array} data
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     * @private
     */
    _getCell(data, x, y)
    {
        x = this._wrapWidth(x);
        y = this._wrapHeight(y);
        return data[(y * this._width) + x];
    }

    /**
     * @returns {number}
     */
    _getSteps(time)
    {
        const deltaTime = time - this._lastIterateTime;
        const steps = Math.floor(deltaTime / 3);

        if (steps > 0)
        {
            this._lastIterateTime = time;
        }

        return Math.min(steps, 32);
    }

    _iterate()
    {
        const width = this._width;
        const height = this._height;
        const uCurrent = this._uCurrent;
        const uPrevious = this._uPrevious;
        const vCurrent = this._vCurrent;
        const vPrevious = this._vPrevious;
        const uChange = this.uChange;
        const vChange = this.vChange;
        const fChange = this.fChange;
        const kChange = this.kChange;
        const luChange = this.luChange;
        const lvChange = this.lvChange;

        let uHigh = 0;
        let uLow = 1;

        let u, v, lu, lv, nu, nv;

        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                u = this._getCell(uPrevious, x, y);
                v = this._getCell(vPrevious, x, y);
                lu = ((u * -4) +
                    this._getCell(uPrevious, x + 1, y) +
                    this._getCell(uPrevious, x - 1, y) +
                    this._getCell(uPrevious, x, y + 1) +
                    this._getCell(uPrevious, x, y - 1));
                lv = ((v * -4) +
                    this._getCell(vPrevious, x + 1, y) +
                    this._getCell(vPrevious, x - 1, y) +
                    this._getCell(vPrevious, x, y + 1) +
                    this._getCell(vPrevious, x, y - 1));
                nu = u + ((uChange * (lu * luChange)) - (u * v * v) + (fChange * (1 - u)));
                nv = v + ((vChange * (lv * lvChange)) + (u * v * v) - ((fChange + kChange) * v));

                this._setCell(uCurrent, x, y, nu);
                this._setCell(vCurrent, x, y, nv);

                uHigh = Math.max(uHigh, nu);
                uLow = Math.min(uLow, nu);
            }
        }

        this._uHigh = uHigh;
        this._uLow = uLow;

        const uSwap = this._uPrevious;
        this._uPrevious = this._uCurrent;
        this._uCurrent = uSwap;

        const vSwap = this._vPrevious;
        this._vPrevious = this._vCurrent;
        this._vCurrent = vSwap;

    }
}

window.onload = function()
{
    const canvas = document.getElementById("cvs");
    canvas.width = WIDTH * 1.5;
    canvas.height = HEIGHT * 1.5;
    canvas.imageSmoothingEnabled = false;

    const grayScott = new GrayScott(WIDTH, HEIGHT);
    grayScott.attachCanvas(canvas);
    grayScott.start();

    const form = document.getElementById("settings");
    appendPaletteInput(form, "Palette", palette => grayScott.palette = palette);
    appendRangeInput(form, "U", () => grayScott.uChange * 100, value => grayScott.uChange = value / 100, 0, 32);
    appendRangeInput(form, "V", () => grayScott.vChange * 100, value => grayScott.vChange = value / 100, 0, 16);
    appendRangeInput(form, "LU", () => grayScott.luChange * 100, value => grayScott.luChange = value / 100, 0, 100);
    appendRangeInput(form, "LV", () => grayScott.lvChange * 100, value => grayScott.lvChange = value / 100, 0, 100);
    appendRangeInput(form, "F", () => grayScott.fChange * 100, value => grayScott.fChange = value / 100, 0, 6);
    appendRangeInput(form, "K", () => grayScott.kChange * 100, value => grayScott.kChange = value / 100, 0, 12);
    appendButtonInput(form, "Reset", () => grayScott.randomize());
};