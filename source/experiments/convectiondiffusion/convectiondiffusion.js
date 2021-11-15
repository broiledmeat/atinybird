'use strict';
var // Cell options
      width = 40
    , height = 40
    , change_u = 0.1
    , vector_strength = 0.35

    // Display options
    , color_sets =
        [
            ['adrift in dreams', [[11,72,107], [59,134,134], [121,189,154], [168,219,168], [207,240,158]]],
            ['hanger management', [[184,42,102], [184,195,178], [241,227,193], [221,206,189], [76,90,95]]],
            ['war', [[35,15,43], [242,29,85], [235,235,188], [188,227,197], [130,179,174]]],
            ['rgbw', [[0,0,255], [0,255,0], [255,0,0], [255,255,255]]],
            ['white-black', [[0,0,0], [255,255,255]]],
            ['barf', [[0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255]]]
        ]
    , color_set = color_sets[0][1]
    , draw_scale = 8
    , delay = 10

    // globals
    , cvs = null
    , ctx = null
    , img = null
    , draw_id = null
    , timer = null
    , u_data = []
    , v_data = []
    , u_gen = []
    , high_u = 0
    , low_u = 0
    , noise2d = new SimplexNoise.SimplexNoise2D()
    , draw_func

    // constants
    , TWO_PI = Math.PI * 2;

window.onload = function()
{
    var   i
        , width_input = document.getElementById('width')
        , height_input = document.getElementById('height')
        , scale_input = document.getElementById('scale')
        , delay_input = document.getElementById('delay')
        , change_u_input = document.getElementById('cu')
        , strength_input = document.getElementById('strength')
        , palette_input = document.getElementById('palette')
        , settings_form = document.getElementById('settings');

    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');

    width_input.value = width;
    height_input.value = height;
    scale_input.value = draw_scale;
    delay_input.value = delay;
    change_u_input.value = change_u;
    strength_input.value = vector_strength;
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
        draw_scale = parseInt(scale_input.value ,10);
        delay = parseInt(delay_input.value, 10);
        change_u = parseFloat(change_u_input.value);
        vector_strength = parseFloat(strength_input.value);
        color_set = color_sets[parseInt(palette_input.value, 10)][1];
        init();
        return false;
    };

    init();
};

function init()
{
    var i;

    clearTimeout(timer);

    cvs.width = width * draw_scale;
    cvs.height = height * draw_scale;
    img = ctx.createImageData(cvs.width, cvs.height);

    for (i = 0; i < (img.width * img.height * 4) + 3; i++)
    {
        img.data[i] = 255;
    }
    
    if (draw_scale == 1)
    {
        draw_func = drawImg;
    }
    else
    {
        draw_func = drawImgScaled;
    }

    noise2d.randomizePermutations();
    randomizeDataMaps();
    timer = setInterval(iterate, delay);
}

function iterate()
{
    var   x, y
        , u, v
        , dux, duy
        , lu
        , vx, vy
        , nu
        , uu, ud, ul, ur
        , orig_low_u, orig_diff_u;

    orig_low_u = low_u;
    orig_diff_u = high_u - low_u;

    low_u = 1;
    high_u = 0;

    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            u = getCell(u_data, x, y);
            v = getCell(v_data, x, y);
            ul = getCell(u_data, x - 1, y);
            ur = getCell(u_data, x + 1, y);
            uu = getCell(u_data, x, y - 1);
            ud = getCell(u_data, x, y + 1);
            dux = (ur - ul) / 2;
            duy = (ud - uu) / 2;
            lu = (u * -4) + ur + ul + uu + ud;
            vx = Math.cos(v) * vector_strength;
            vy = Math.sin(v) * vector_strength;
            nu = u + ((change_u * lu) + ((vx * dux) + (vy * duy)));

            // Scale nu so high_u and low_u never converge and implode
            nu = (nu - orig_low_u) / orig_diff_u;

            if (nu > high_u)
            {
                high_u = nu;
            }
            if (nu < low_u)
            {
                low_u = nu;
            }

            setCell(u_gen, x, y, nu);
        }
    }

    u_data = u_gen.slice();

    if (draw_id === null)
    {
        draw_id = requestAnimationFrame(draw_func);
    }
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
    draw_id = null;
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
    draw_id = null;
}

function emptyDataMap()
{
    var   i
        , data = [];

    for (i = 0; i < width * height; i++)
    {
        data.push(0);
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
    high_u = 1;
    low_u = 0;

    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            u = Math.random();
            setCell(u_data, x, y, u);
            setCell(v_data, x, y, noise2d.noise(x / width, y / height) * TWO_PI);

            if (u > high_u)
            {
                high_u = u;
            }
            if (u < low_u)
            {
                low_u = u;
            }
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

    i = val * (color_set.length - 1);
    j = i - (i|0);
    
    ca = color_set[(i + 1)|0];
    cb = color_set[i|0];
    if (ca === undefined) { return cb; }

    r = ((j * ca[0]) + ((1 - j) * cb[0]))|0;
    g = ((j * ca[1]) + ((1 - j) * cb[1]))|0;
    b = ((j * ca[2]) + ((1 - j) * cb[2]))|0;
    return [r, g, b];
}
