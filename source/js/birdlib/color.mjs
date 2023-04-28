export const PALETTES =
    {
        "adrift in dreams": [[11, 72, 107], [59, 134, 134], [121, 189, 154], [168, 219, 168], [207, 240, 158]],
        "hanger management": [[184, 42, 102], [184, 195, 178], [241, 227, 193], [221, 206, 189], [76, 90, 95]],
        "war": [[35, 15, 43], [242, 29, 85], [235, 235, 188], [188, 227, 197], [130, 179, 174]],
        "rgbw": [[0, 0, 255], [0, 255, 0], [255, 0, 0], [255, 255, 255]],
        "white-black": [[0, 0, 0], [255, 255, 255]],
        "barf": [[0, 255, 255], [255, 0, 255], [0, 255, 255], [255, 0, 255], [0, 255, 255], [255, 0, 255], [0, 255, 255], [255, 0, 255], [0, 255, 255], [255, 0, 255]],
    };

/**
 * @param {Number[]} palette
 * @param {Number} value
 * @returns {Number}
 */
export const getPaletteArgb = (palette, value) =>
{
    let i = value * (palette.length - 1);
    let j = 0;
    let ca = palette[0];
    let cb = palette[0];

    if (i + 1 >= palette.length)
    {
        ca = palette[palette.length - 1];
        cb = palette[palette.length - 1];
    }
    else if (i > 0)
    {
        j = i - (i | 0);
        ca = palette[(i + 1) | 0];
        cb = palette[i | 0];
    }

    return (0xff << 24) |
        ((((j * ca[0]) + ((1 - j) * cb[0])) | 0) << 16) |
        ((((j * ca[1]) + ((1 - j) * cb[1])) | 0) << 8) |
        (((j * ca[2]) + ((1 - j) * cb[2])) | 0);
}