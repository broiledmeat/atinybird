import {blCanvas} from "/js/birdlib/canvas.mjs";
import {PALETTES} from "/js/birdlib/color.mjs";

const WIDTH = 300;
const HEIGHT = 300;

class ConvectionDiffusion extends blCanvas
{
    /**
     * @param {Number} width
     * @param {Number} height
     */
    constructor(width, height)
    {
        super(width, height);

        this._uChange = 0.1;
        this._vectorStrength = 0.35;

        const length = width * height;
        this._uHigh = 0;
        this._uLow = 0;
        this._uCurrent = new Float32Array(length);
        this._uPrevious = new Float32Array(length);
        this._vCurrent = new Float32Array(length);

        this._palette = PALETTES[Object.keys(PALETTES)[0]];

        this._noise = new SimplexNoise.SimplexNoise2D();
        this._imageBuffer = this.createBuffer(width, height);

        this._lastIterateTime = 0;

        this.randomize();
    }

    /**
     * @param {Number[]} value
     */
    set palette(value)
    {
        this._palette = value;
    }

    /**
     * @returns {Number}
     */
    get uChange()
    {
        return this._uChange;
    }

    /**
     * @param {Number} value
     */
    set uChange(value)
    {
        this._uChange = value;
    }

    /**
     * @returns {Number}
     */
    get vectorStrength()
    {
        return this._vectorStrength;
    }

    /**
     * @param {Number} value
     */
    set vectorStrength(value)
    {
        this._vectorStrength = value;
    }

    start()
    {
        requestAnimationFrame(t => this._draw(t));
    }

    randomize()
    {
        const uCurrent = this._uCurrent;
        const uPrevious = this._uPrevious;
        const vCurrent = this._vCurrent;

        this._uHigh = 0;
        this._uLow = 1;

        this._noise.randomizePermutations();

        for (let y = 0; y < this._height; y++)
        {
            for (let x = 0; x < this._width; x++)
            {
                let u = Math.random();
                this._uHigh = Math.max(u, this._uHigh);
                this._uLow = Math.min(u, this._uLow);
                this._setCell(uCurrent, x, y, u);
                this._setCell(uPrevious, x, y, u);

                let v = this._noise.noise(x / this._width, y / this._height) * Math.PI * 2;
                this._setCell(vCurrent, x, y, v);
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
        let i = value * (this._palette.length - 1);
        let j = i - (i | 0);

        let ca = this._palette[(i + 1) | 0];
        let cb = this._palette[i | 0];

        if (cb === undefined) {
            // console.log(`bad color! ${i} ${i | 0}`)
            return 0xffff00ff;
        }

        if (ca === undefined)
        {
            return cb;
        }

        return (0xff << 24) |
            ((((j * ca[0]) + ((1 - j) * cb[0])) | 0) << 16) |
            ((((j * ca[1]) + ((1 - j) * cb[1])) | 0) << 8) |
            (((j * ca[2]) + ((1 - j) * cb[2])) | 0);
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
                // let cell = this._getCell(uCurrent, x, y);
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
        const steps = Math.floor(deltaTime / 20);

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
        const uChange = this._uChange;
        const vectorStrength = this._vectorStrength;
        const uLowOriginal = this._uLow;
        const uDiffOriginal = this._uHigh - this._uLow;

        let uHigh = 0;
        let uLow = 1;

        let u, v, ul, ur, uu, ud, dux, duy, lu, vx, vy, nu;

        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                u = this._getCell(uPrevious, x, y);
                v = this._getCell(vCurrent, x, y);
                ul = this._getCell(uPrevious, x - 1, y);
                ur = this._getCell(uPrevious, x + 1, y);
                uu = this._getCell(uPrevious, x, y - 1);
                ud = this._getCell(uPrevious, x, y + 1);
                dux = (ur - ul) / 2;
                duy = (ud - uu) / 2;
                lu = (u * -4) + ur + ul + uu + ud;
                vx = Math.cos(v) * vectorStrength;
                vy = Math.sin(v) * vectorStrength;
                nu = u + ((uChange * lu) + ((vx * dux) + (vy * duy)));

                // Scale nu so high_u and low_u never converge and implode
                nu = (nu - uLowOriginal) / uDiffOriginal;
                this._setCell(uCurrent, x, y, nu);

                uHigh = Math.max(uHigh, nu);
                uLow = Math.min(uLow, nu);
            }
        }

        this._uHigh = uHigh;
        this._uLow = uLow;

        const swap = this._uPrevious;
        this._uPrevious = this._uCurrent;
        this._uCurrent = swap;

    }
}


window.onload = () =>
{
    const canvas = document.getElementById("cvs");
    canvas.width = WIDTH * 1.5;
    canvas.height = HEIGHT * 1.5;
    canvas.imageSmoothingEnabled = false;

    const convectionDiffusion = new ConvectionDiffusion(WIDTH, HEIGHT);
    convectionDiffusion.attachCanvas(canvas);
    convectionDiffusion.start();

    let settingsForm = document.getElementById("settings");
    let uChangeInput = document.getElementById("cu");
    let vectorStrengthInput = document.getElementById("strength");
    let paletteInput = document.getElementById("palette")

    uChangeInput.value = convectionDiffusion.uChange;
    vectorStrengthInput.value = convectionDiffusion.vectorStrength;
    for (const name of Object.keys(PALETTES))
    {
        paletteInput.innerHTML += `<option value="${name}">${name}</option>`;
    }

    paletteInput.onchange = function()
    {
        convectionDiffusion.palette = PALETTES[paletteInput.value];
    };

    settingsForm.onsubmit = () =>
    {
        convectionDiffusion.uChange = parseFloat(uChangeInput.value);
        convectionDiffusion.vectorStrength = parseFloat(vectorStrengthInput.value);
        convectionDiffusion.randomize();
        return false;
    }
};