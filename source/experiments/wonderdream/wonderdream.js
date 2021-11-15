'use strict';
var   // Cell options
      width = 49
    , height = 64

      // Display options
    , draw_scale = 6
    , delay = 10

      // globals
    , cvs = null
    , ctx = null
    , img = null
    , timer = null
    , draw_id = null
    , simplex_field = null
    , simplex_time = 0
    , noise3d = new SimplexNoise.SimplexNoise3D()
    , fluid_field = null
    ;

window.onload = function()
{
    var settings_form = document.getElementById('settings');

    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');


    settings_form.onsubmit = function()
    {
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
    simplex_field = new Array(width * height);

    for (i = 0; i < (img.width * img.height * 4) + 3; i++)
    {
        img.data[i] = 255;
    }

    //fluid_vector_field = new Array(width * height);
    //fluid_strength_field = new Array(width * height);
    //setCell(fluid_strength_field, 10, 10, 1.0);

    fluid_field = new NavierStokes.NavierStokes(width, height);
    fluid_field.setDensity(20, 5, 10);
    fluid_field.setVelocity(20, 5, 0.1, 0.0);
    fluid_field.setVelocity(21, 5, 0.1, 0.1);

    noise3d.randomizePermutations();
    timer = setInterval(iterate, delay);
}

function iterate()
{
    var   x, y
        , u;

    fluid_field.update();

    u = fluid_field.getDensity(20, 5);
    //console.log(u);
    if (!isFinite(u) || isNaN(u))
    {
        clearInterval(timer);

    }

    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            //u = noise3d.noise(x / width / 0.3, y / height / 0.3, simplex_time) * 0.333;
            //setCell(simplex_field, x, y, u);
        }
    }

    simplex_time += 0.004;

    if (draw_id === null)
    {
        draw_id = requestAnimationFrame(draw);
    }
}


function draw()
{
    var   x, y
        , u, v
        , i, iy, ix, c, val;
  
    for (y = 0; y < height; y++)
    {
        for (x = 0; x < width; x++)
        {
            val = fluid_field.getDensity(x, y);
            val = Math.max(0, Math.min(1, val));
            c = getColor(val);

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
    val = (13 + (val * (230 - 13)))|0;
    return [val, val, val];
}
