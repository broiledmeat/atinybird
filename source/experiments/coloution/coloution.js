import {blCanvas} from "/js/birdlib.mjs";

const WIDTH = 800;
const HEIGHT = 600;

class Coloution extends blCanvas
{
    /**
     * @param {Number} width
     * @param {Number} height
     */
    constructor(width, height)
    {
        super(width, height);

        // Previously, these did some math to end up with 25, -12. Manually set these for clarity, with a slightly
        // lower high value as to not allow long term mutation to skew too bright.
        this._mutationHigh = 24.75;
        this._mutationLow = -12;

        this._cellsCurrent = this.createBuffer(width, 1);
        this._cells_previous = this.createBuffer(width, 1);
        this._parents = new Uint32Array(3);

        this._lastIterateTime = 0;
        this._drawFunc = this._draw;

        this.randomize();
    }

    start()
    {
        requestAnimationFrame(t => this._drawFunc(t));
    }

    randomize()
    {
        const current = this._cellsCurrent.buffer;
        const previous = this._cells_previous.buffer;
        for (let i = 0; i < this._width; i++)
        {
            current[i] = previous[i] = (Math.random() * 256 * 256 * 256) | 0;
        }
    }


    toggleHistory()
    {
        this._drawFunc = this._drawFunc === this._draw
            ? this._drawNoHistory
            : this._draw;
    }

    _draw(time)
    {
        requestAnimationFrame(t => this._drawFunc(t));

        const steps = this._getSteps(time);

        if (steps === 0)
        {
            return;
        }

        const context = this._context;
        const width = this._width;
        const height = this._height;
        const clip_height = this._height - steps;

        this._context.drawImage(
            this._canvas,
            0, steps, width, clip_height,
            0, 0, width, clip_height);

        for (let step = 0; step < steps; step++)
        {
            this._iterate();
            this._cellsCurrent.draw(context, 0, height - (steps - step));
        }

        this.pushToAttachedCanvases();
    }

    _drawNoHistory(time)
    {
        requestAnimationFrame(t => this._drawFunc(t));

        const steps = this._getSteps(time);

        if (steps === 0)
        {
            return;
        }

        for (let _ = 0; _ < steps; _++)
        {
            this._iterate();
        }

        const context = this._context;
        const height = this._height;
        const current = this._cellsCurrent;
        for (let y = 0; y < height; y++)
        {
            current.draw(context, 0, y);
        }

        this.pushToAttachedCanvases()
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
        const mutation_high = this._mutationHigh;
        const mutation_low = this._mutationLow;
        const parents = this._parents;
        const current = this._cellsCurrent.buffer;
        const previous = this._cells_previous.buffer;
        const alpha = 0xff000000;
        let r = 0;
        let t = 0;
        let color = 0;

        for (let i = 0; i < width; i++)
        {
            parents[0] = previous[i];
            if (i === 0)
            {
                parents[1] = previous[width - 1];
                parents[2] = previous[i + 1];
            }
            else if (i === width - 1)
            {
                parents[1] = previous[i - 1];
                parents[2] = previous[0];
            }
            else
            {
                parents[1] = previous[i - 1];
                parents[2] = previous[i + 1];
            }

            // Randomize parents
            r = (Math.random() * 3) | 0;
            t = parents[r];
            parents[r] = parents[2];
            parents[2] = t;

            r = (Math.random() * 2) | 0;
            t = parents[r];
            parents[r] = parents[1];
            parents[1] = t;

            // Get a color segment from each parent
            color = (parents[0] & 0xff0000) | (parents[1] & 0x00ff00) | (parents[2] & 0x0000ff);

            // Mutate a random color segment
            r = ((Math.random() * 3) | 0) * 8;
            t = ((color & (0xff << r)) >> r) + ((Math.random() * mutation_high) + mutation_low);
            t = Math.max(0, Math.min(255, t)) | 0;

            // Mask out the old color segment, and insert the new one
            color = alpha | (color & (0xffffff ^ (0xff << r))) | (t << r);

            current[i] = color;
        }

        let swap = this._cells_previous;
        this._cells_previous = this._cellsCurrent;
        this._cellsCurrent = swap;
    }
}

window.onload = function()
{
    const canvas = document.getElementById("cvs");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.imageSmoothingEnabled = false;

    const coloution = new Coloution(WIDTH, HEIGHT);
    coloution.attachCanvas(canvas);
    coloution.start();

    const randomizeButton = document.getElementById("randomize");
    const toggleHistoryButton = document.getElementById("toggle_history");

    randomizeButton.onclick = () =>
    {
        coloution.randomize();
        return false;
    };
    toggleHistoryButton.onclick = () =>
    {
        coloution.toggleHistory();
        return false;
    };
};
