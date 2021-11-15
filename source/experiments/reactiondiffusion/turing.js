'use strict'
var // Cell options
      width = 60
    , height = 60
    , change_u = 2.6
    , change_v = 24.0

    // Display options
    , color_sets =
        [
            ['war', [[35,15,43], [242,29,85], [235,235,188], [188,227,197], [130,179,174]]],
            ['adrift in dreams', [[11,72,107], [59,134,134], [121,189,154], [168,219,168], [207,240,158]]],
            ['hanger management', [[184,42,102], [184,195,178], [241,227,193], [221,206,189], [76,90,95]]],
            ['rgbw', [[0,0,255], [0,255,0], [255,0,0], [255,255,255]]],
            ['white-black', [[0,0,0], [255,255,255]]],
            ['barf', [[0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255]]]
        ]
    , color_set = color_sets[0][1]
    , draw_scale = 5
    , delay = 10

    // Init some stuff
    , ctx = null
    , img = null
    , timer = null
    , u_data = []
    , v_data = []
    , u_gen = []
    , v_gen = []
    , high_u = 0
    , low_u = 0
    , draw_func = null;

window.onload = function()
{
    var   i
        , width_input = document.getElementById('width')
        , height_input = document.getElementById('height')
        , scale_input = document.getElementById('scale')
        , delay_input = document.getElementById('delay')
        , change_u_input = document.getElementById('cu')
        , change_v_input = document.getElementById('cv')
        , palette_input = document.getElementById('palette')
        , settings_form = document.getElementById('settings');

    width_input.value = width;
    height_input.value = height;
    scale_input.value = draw_scale;
    delay_input.value = delay;
    change_u_input.value = change_u;
    change_v_input.value = change_v;
    palette_input.innerHTML = '';
    for (i = 0; i < color_sets.length; i++)
    {
        palette_input.innerHTML += '<option value="' + i + '">' + color_sets[i][0] + '</option>';
    }
    palette_input.onchange = function()
    {
        color_set = color_sets[parseInt(palette_input.value, 10)][1];
    };
    settings_form.onsubmit = function()
    {
        width = parseInt(width_input.value, 10);
        height = parseInt(height_input.value, 10);
        draw_scale = parseInt(scale_input.value, 10);
        delay = parseInt(delay_input.value, 10);
        change_u = parseFloat(change_u_input.value);
        change_v = parseFloat(change_v_input.value);

        init();
        return false;
    };

    init();
};

function init()
{
    var   i
        , cvs = document.getElementById('cvs');

    clearTimeout(timer);

    cvs.width = width * draw_scale;
    cvs.height = height * draw_scale;

    ctx = cvs.getContext('2d');
    img = ctx.createImageData(width * draw_scale, height * draw_scale);

    for (i = 0; i < (img.width * img.height * 4) + 3; i++)
    {
        img.data[i] = 255;
    }
    
    if (draw_scale === 1)
    {
        draw_func = drawImg;
    }
    else
    {
        draw_func = drawImgScaled;
    }

    randomizeDataMaps();
    timer = setInterval(iterate, delay);
}

function iterate()
{
    var   x, y
        , u, v
        , diu, div
        , reu, rev
        , nu, nv;

    low_u = high_u;
    high_u = 0;

    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            u = getCell(u_data, x, y);
            v = getCell(v_data, x, y);
            
            diu = change_u * (getCell(u_data, x + 1, y) - (2.0 * u) + getCell(u_data, x - 1, y) + getCell(u_data, x, y + 1) - (2.0 * u) + getCell(u_data, x, y - 1));
            reu = (u * v) - u - 12.0;
            nu = u + (0.01 * (reu + diu));
            if (nu < 0.0) { nu = 0.0; }

            div = change_v * (getCell(v_data, x + 1, y) - (2.0 * v) + getCell(v_data, x - 1, y) + getCell(v_data, x, y + 1) - (2.0 * v) + getCell(v_data, x, y - 1));
            rev = 16.0 - (u * v);
            nv = v + (0.01 * (rev + div));
            if (nv < 0.0) { nv = 0.0; }

            if (nu > high_u)
            {
                high_u = nu;
            }
            if (nu < low_u)
            {
                low_u = nu;
            }

            setCell(u_gen, x, y, nu);
            setCell(v_gen, x, y, nv);
        }
    }

    u_data = u_gen.slice();
    v_data = v_gen.slice();
    draw_func();
}

function drawImg()
{
    var   x, y
        , i, c;
  
    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            c = getColor(getCell(u_data, x, y));
            i = ((y * width * draw_scale * draw_scale) + (x * draw_scale)) * 4;
            img.data[i    ] = c[0];
            img.data[i + 1] = c[1];
            img.data[i + 2] = c[2];
        }
    }

    ctx.putImageData(img, 0, 0);
}

function drawImgScaled()
{
    var   x, y
        , u, v
        , i, iy, ix, c;
  
    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            c = getColor(getCell(u_data, x, y));

            i = (y * width * draw_scale * draw_scale) + (x * draw_scale);
            for (v = 0; v < draw_scale; v++)
            {
                iy = i + (v * width * draw_scale);
                for (u = 0; u < draw_scale; u++)
                {
                    ix = (iy + u) * 4;
                    img.data[ix    ] = c[0];
                    img.data[ix + 1] = c[1];
                    img.data[ix + 2] = c[2];
                }
            }
        }
    }

    ctx.putImageData(img, 0, 0);
}

function emptyDataMap()
{
    var   i
        , data = new Array(width * height);

    for (i = 0; i < width * height; i++)
    {
        data[i] = 0;
    }

    return data;
}

function randomizeDataMaps()
{
    var   x, y
        , u;

    u_data = emptyDataMap();
    v_data = emptyDataMap();
    u_gen = emptyDataMap();
    v_gen = emptyDataMap();
    high_u = 0;
    low_u = 12;

    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            u = (Math.random() * 12.0) + (Math.random() * 2.0);

            if (u > high_u)
            {
                high_u = u;
            }

            if (u < low_u)
            {
                low_u = u;
            }

            setCell(u_data, x, y, u);
            setCell(v_data, x, y, (Math.random() * 12.0) + (Math.random() * 2.0));
        }
    }
}

function getCell(data, x, y)
{
    if (x === -1) { x = width - 1; } else if (x === width) { x = 0; }
    if (y === -1) { y = height - 1; } else if (y === height) { y = 0; }
    return data[(y * width) + x];
}

function setCell(data, x, y, val)
{
    if (x === -1) { x = width - 1; } else if (x === width) { x = 0; }
    if (y === -1) { y = height - 1; } else if (y === height) { y = 0; }
    data[(y * width) + x] = val;
}

function getColor(val)
{
    var   i, j
        , ca, cb
        , r, g, b;

    i = ((val - low_u) / (high_u - low_u)) * (color_set.length - 1);
    j = i - (i|0);
    
    ca = color_set[(i + 1)|0];
    cb = color_set[i|0];
    if (ca === undefined) { return cb; }

    r = ((j * ca[0]) + ((1 - j) * cb[0]))|0;
    g = ((j * ca[1]) + ((1 - j) * cb[1]))|0;
    b = ((j * ca[2]) + ((1 - j) * cb[2]))|0;
    return [r, g, b];
}
