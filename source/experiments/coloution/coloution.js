'use strict';

const WIDTH = 800;
const HEIGHT = 600;

class ImageDataRow
{
    /**
     * @param {CanvasRenderingContext2D} context
     */
    constructor(context)
    {
        this._image_data = context.createImageData(context.canvas.width, 1);
        this._buffer = new ArrayBuffer(this._image_data.data.length);
        this._buffer8 = new Uint8ClampedArray(this._buffer);
        this._buffer32 = new Uint32Array(this._buffer);
    }

    /**
     * @returns {Uint32Array}
     */
    get buffer()
    {
        return this._buffer32;
    }

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {Number} x
     * @param {Number} y
     */
    draw(context, x, y)
    {
        this._image_data.data.set(this._buffer8);
        context.putImageData(this._image_data, x, y);
    }
}

class Coloution
{
    /**
     * @param {Number} width
     * @param {Number} height
     */
    constructor(width, height)
    {
        const mutation_degree = 0.1;
        this._mutation_hi = (256 * mutation_degree) | 0;
        this._mutation_low = -1 * (this._mutation_hi / 2) | 0;

        this._canvas = document.createElement("canvas");
        this._canvas.width = width;
        this._canvas.height = height;
        this._context = this._canvas.getContext("2d");
        this._cells_current = new ImageDataRow(this._context);
        this._cells_previous = new ImageDataRow(this._context);
        this._parents = new Uint32Array(3);

        this._attached_canvases = {};

        this._last_iterate_time = 0;
        this._draw_func = this._draw;

        this.randomize();
    }

    /**
     * @returns {number}
     */
    get _width()
    {
        return this._canvas.width;
    }

    /**
     * @returns {number}
     */
    get _height()
    {
        return this._canvas.height;
    }

    start()
    {
        requestAnimationFrame(t => this._draw_func(t));
    }

    randomize()
    {
        const current = this._cells_current.buffer;
        const previous = this._cells_previous.buffer;
        for (let i = 0; i < this._width; i++)
        {
            current[i] = previous[i] = (Math.random() * 256 * 256 * 256) | 0;
        }
    }

    /**
     * @param {HTMLCanvasElement} element
     */
    attach_canvas(element)
    {
        this._attached_canvases[element] = element.getContext("2d");
    }

    toggle_history()
    {
        this._draw_func = this._draw_func === this._draw
            ? this._draw_no_history
            : this._draw;
    }

    _push_to_attached_canvases()
    {
        for (const canvas in this._attached_canvases)
        {
            const context = this._attached_canvases[canvas];
            context.drawImage(this._canvas, 0, 0, this._width, this._height);
        }
    }

    _draw(time)
    {
        requestAnimationFrame(t => this._draw_func(t));

        const steps = this._get_steps(time);

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
            this._cells_current.draw(context, 0, height - (steps - step));
        }

        this._push_to_attached_canvases();
    }

    _draw_no_history(time)
    {
        requestAnimationFrame(t => this._draw_func(t));

        const steps = this._get_steps(time);

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
        const current = this._cells_current;
        for (let y = 0; y < height; y++)
        {
            current.draw(context, 0, y);
        }

        this._push_to_attached_canvases()
    }

    /**
     * @returns {number}
     */
    _get_steps(time)
    {
        const deltaTime = time - this._last_iterate_time;
        const steps = Math.floor(deltaTime / 3);

        if (steps > 0)
        {
            this._last_iterate_time = time;
        }

        return Math.min(steps, 32);
    }

    _iterate()
    {
        const width = this._width;
        const mutation_hi = this._mutation_hi;
        const mutation_low = this._mutation_low;
        const parents = this._parents;
        const current = this._cells_current.buffer;
        const previous = this._cells_previous.buffer;

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
            let r = (Math.random() * 3) | 0;
            let t = parents[r];
            parents[r] = parents[2];
            parents[2] = t;

            r = (Math.random() * 3) | 0;
            t = parents[r];
            parents[r] = parents[1];
            parents[1] = t;

            // Get a color segment from each parent
            let color = (parents[0] & 0xff0000) | (parents[1] & 0x00ff00) | (parents[2] & 0x0000ff);

            // Mutate a random color segment
            let j = (Math.random() * 3) | 0;
            t = ((color & (0xff << (j * 8))) >> (j * 8)) + ((Math.random() * mutation_hi) + mutation_low) | 0;
            t = Math.max(0, Math.min(255, t));

            // Mask out the old color segment, and insert the new one
            color = (0xff << 24) | (color & (0xffffff ^ (0xff << (j * 8)))) | (t << (j * 8));

            current[i] = color;
        }

        let swap = this._cells_previous;
        this._cells_previous = this._cells_current;
        this._cells_current = swap;
    }
}

window.onload = function()
{
    const canvas = document.getElementById("cvs");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.imageSmoothingEnabled = false;

    const coloution = new Coloution(WIDTH, HEIGHT);
    coloution.attach_canvas(canvas);
    coloution.start();

    const randomize_button = document.getElementById("randomize");
    const toggle_history_button = document.getElementById("toggle_history");

    randomize_button.onclick = () =>
    {
        coloution.randomize();
        return false;
    };
    toggle_history_button.onclick = () =>
    {
        coloution.toggle_history();
        return false;
    };
};
