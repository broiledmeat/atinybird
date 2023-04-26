export class blCanvas
{
    /**
     * @param {Number} width
     * @param {Number} height
     */
    constructor(width, height)
    {
        this._width = width;
        this._height = height;

        this._canvas = document.createElement("canvas");
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._context = this._canvas.getContext("2d");

        this._attachedCanvases = {};
    }

    /**
     * @param {HTMLCanvasElement} element
     */
    attachCanvas(element)
    {
        this._attachedCanvases[element] = element.getContext("2d");
    }

    pushToAttachedCanvases()
    {
        for (const canvas in this._attachedCanvases)
        {
            const context = this._attachedCanvases[canvas];
            context.drawImage(this._canvas, 0, 0, context.canvas.width, context.canvas.height);
        }
    }

    /**
     * @param {Number} width
     * @param {Number} height
     */
    createBuffer(width, height)
    {
        return new blContextImageBuffer(this._context, width, height);
    }
}

class blContextImageBuffer
{
    /**
     * @param {CanvasRenderingContext2D} context
     * @param {Number} width
     * @param {Number} height
     */
    constructor(context, width, height)
    {
        this._width = width || context.canvas.width;
        this._height = height || context.canvas.height;
        this._image_data = context.createImageData(this._width, this._height);
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