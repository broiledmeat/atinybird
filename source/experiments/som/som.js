'use strict';
var // options
      size = 25
    , sample_size = 12

    // display
    , draw_scale = 8
    , delay = 10

    // globals
    , iterating = false
    , timer = null
    , cvs = null
    , ctx = null
    , status_cvs = null
    , status_ctx = null
    , u_data = []
    , bmu_data = []
    , w_data = []
    , radius = null
    , sqrt2pi = Math.sqrt(Math.PI * 2);

window.onload = function()
{
    var   samples_input = document.getElementById('samples')
        , size_input = document.getElementById('size')
        , scale_input = document.getElementById('scale')
        , delay_input = document.getElementById('delay')
        , settings_form = document.getElementById('settings');

    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');
    status_cvs = document.getElementById('status_cvs');
    status_ctx = status_cvs.getContext('2d');

    samples_input.value = sample_size;
    size_input.value = size;
    scale_input.value = draw_scale;
    delay_input.value = delay;
    settings_form.onsubmit = function()
    {
        sample_size = parseInt(samples_input.value, 10);
        size = parseInt(size_input.value, 10);
        draw_scale = parseInt(scale_input.value, 10);
        delay = parseInt(delay_input.value, 10);
        
        if (draw_scale < 6)
        {
            draw_scale = 6;
            scale_input.value = draw_scale;
        }
        
        init();
        return false;
    };

    init();
};

function gauss(dist, sigma)
{
    return Math.exp(-dist / (2 * sigma * sigma)) / (sigma * sqrt2pi);
}

function init()
{
    clearTimeout(timer);

    cvs.width = size * draw_scale;
    cvs.height = size * draw_scale;

    status_cvs.width = size * draw_scale;
    status_cvs.height = 8;

    randomizeDataMaps();
    radius = 1;

    status_ctx.fillStyle = 'rgb(255, 255, 255)';
    status_ctx.fillRect(0, 0, size * draw_scale, 8);
    
    draw();
    timer = setInterval(iterate, delay);
}

function iterate()
{
    var   x, y
        , x1, y1
        , x2, y2
        , w, d, t
        , u, u_id
        , bmu_x, bmu_y, bmu_dist
        , dist;

    if (!iterating)
    {
        iterating = true;

        u_id = Math.floor(Math.random() * u_data.length);
        u = u_data[u_id];

        bmu_x = null;
        bmu_y = null;
        bmu_dist = null;
        
        if (bmu_data[u_id] !== null)
        {
            bmu_x = bmu_data[u_id][0];
            bmu_y = bmu_data[u_id][1];
            
            w = getCell(w_data, bmu_x, bmu_y);
            bmu_dist = Math.pow(w[0] - u[0], 2) + Math.pow(w[1] - u[1], 2) + Math.pow(w[2] - u[2], 2);
        }
        
        for (y = 0; y < size; y++)
        {
            for (x = 0; x < size; x++)
            {
                w = getCell(w_data, x, y);
            
                dist = Math.pow(w[0] - u[0], 2) + Math.pow(w[1] - u[1], 2) + Math.pow(w[2] - u[2], 2);
                if (bmu_dist === null || dist < bmu_dist)
                {
                    bmu_x = x;
                    bmu_y = y;
                    bmu_dist = dist;
                }
            }
        }
        
        x1 = bmu_x - Math.floor(radius * size * size);
        y1 = bmu_y - Math.floor(radius * size * size);
        x2 = bmu_x + Math.floor(radius * size * size);
        y2 = bmu_y + Math.floor(radius * size * size);
        
        if (x1 < 0) { x1 = 0; }
        if (y1 < 0) { y1 = 0; }
        if (x2 >= size) { x2 = size - 1; }
        if (y2 >= size) { y2 = size - 1; }
        
        for (y = y1; y <= y2; y++)
        {
            for (x = x1; x <= x2; x++)
            {
                d = (bmu_x - x) * (bmu_x - x) + (bmu_y - y) * (bmu_y - y);
                
                if (d <= radius * size * size)
                {
                    w = getCell(w_data, x, y);
                    t = gauss(d, radius * size);
                    
                    w[0] += t * (u[0] - w[0]);
                    w[1] += t * (u[1] - w[1]);
                    w[2] += t * (u[2] - w[2]);
                }
            }
        }
        
        bmu_data[u_id] = [bmu_x, bmu_y];

        radius -= 0.001 / sample_size;
        if (radius <= 0)
        {
            radius = 0;
            clearInterval(timer);
        }
        
        draw();
        iterating = false;
    }
}

function draw()
{
    var   i
        , x, y
        , b;

    for (y = 0; y < size; y++)
    {
        for (x = 0; x < size; x++)
        {
            ctx.fillStyle = getRGB(getCell(w_data, x, y));
            ctx.fillRect(x * draw_scale, y * draw_scale, draw_scale, draw_scale);
        }
    }
    
    for (i = 0; i < bmu_data.length; i++)
    {
        b = bmu_data[i];
        
        if (b !== null)
        {
            x = bmu_data[i][0] * draw_scale;
            y = bmu_data[i][1] * draw_scale;
            
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.strokeRect(x, y, draw_scale, draw_scale);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.strokeRect(x + 1, y + 1, draw_scale - 2, draw_scale - 2);
            ctx.fillStyle = getRGB(u_data[i]);
            ctx.fillRect(x + 2, y + 2, draw_scale - 4, draw_scale - 4);
        }
    }
    
    status_ctx.fillStyle = 'rgb(30,45,30)';
    status_ctx.fillRect(0, 0, (1 - radius) * (size * draw_scale), 8);
}

function emptyUDataMap()
{
    var   i
        , data;

    data = new Array(sample_size);
    for (i = 0; i < data.length; i++)
    {
        data[i] = [0, 0, 0];
    }
    return data;
}

function emptyBMUDataMap()
{
    var   i
        , data;

    data = new Array(sample_size);
    for (i = 0; i < data.length; i++)
    {
        data[i] = null;
    }
    return data;
}

function emptyWDataMap()
{
    var   i
        , data;

    data = new Array(size * size);
    for (i = 0; i < data.length; i++)
    {
        data[i] = [0, 0, 0];
    }
    return data;
}

function randomizeDataMaps()
{
    var i, j;

    u_data = emptyUDataMap();
    bmu_data = emptyBMUDataMap();
    w_data = emptyWDataMap();

    for (i = 0; i < u_data.length; i++)
    {
        for (j = 0; j < 3; j++)
        {
            u_data[i][j] = Math.random() * 256;
        }
    }
    
    for (i = 0; i < w_data.length; i++)
    {
        for (j = 0; j < 3; j++)
        {
            w_data[i][j] = Math.random() * 256;
        }
    }
}

function getCell(data, x, y)
{
    return data[(y * size) + x];
}

function setCell(data, x, y, val)
{
    data[(y * size) + x] = val;
}

function getRGB(val)
{
    var r, g, b;

    r = Math.floor(val[0]);
    g = Math.floor(val[1]);
    b = Math.floor(val[2]);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}
