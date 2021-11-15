'use strict';
var // Cell options
      width = 500
    , mutation_degree = 0.1

    // Display options
    , height = 250
    , wait = 10

    // globals
    , cvs = null
    , ctx = null
    , timer = null
    , cells_a = new Uint32Array(width)
    , cells_b = new Uint32Array(width)
    , cells_cur = cells_a
    , cells_old = cells_b
    , parents = new Uint32Array(3)
    , mutation_hi = (256 * mutation_degree)|0
    , mutation_low = -1 * (mutation_hi / 2)|0
    , draw_id = null
    , draw = null;

window.onload = function()
{
    var   randomize_button = document.getElementById('randomize')
        , toggle_history_button = document.getElementById('toggle_history');

    cvs = document.getElementById('cvs');
    cvs.width = width;
    cvs.height = height;
    ctx = cvs.getContext('2d');

    randomize_button.onclick = function()
    {
        init();
        return false;
    };
    toggle_history_button.onclick = function()
    {
        if (draw === drawWithHistory)
        {
            toggle_history_button.value = 'show history';
            draw = drawLarge;
        }
        else
        {
            toggle_history_button.value = 'hide history';
            draw = drawWithHistory;
        }
        return false;
    };

    draw = drawWithHistory;
    init();
};

function init()
{
    clearTimeout(timer);
    randomize();
    draw();
    timer = setInterval(iterate, wait);
}

function iterate()
{
    var   i, j
        , r, t
        , color;

    for (i = 0; i < width; i++)
    {
        parents[0] = cells_old[i];
        if (i === 0)
        {
            parents[1] = cells_old[width - 1];
            parents[2] = cells_old[i + 1];
        }
        else if (i === width - 1)
        {
            parents[1] = cells_old[i - 1];
            parents[2] = cells_old[0];
        }
        else
        {
            parents[1] = cells_old[i - 1];
            parents[2] = cells_old[i + 1];
        }

        // Randomize parents
        r = (Math.random() * 3)|0;
        t = parents[r];
        parents[r] = parents[2];
        parents[2] = t;

        r = (Math.random() * 3)|0;
        t = parents[r];
        parents[r] = parents[1];
        parents[1] = t;

        // Get a color segment from each parent
        color = (parents[0] & 0xff0000) | (parents[1] & 0x00ff00) | (parents[2] & 0x0000ff);

        // Mutate a random color segment
        j = (Math.random() * 3)|0;
        t = ((color & (0xff << (j * 8))) >> (j * 8)) + ((Math.random() * mutation_hi) + mutation_low)|0;
        if (t < 0) { t = 0; }
        else if (t > 255) { t = 255; }

        // Mask out the old color segment, and insert the new one
        color = (color & (0xffffff ^ (0xff << (j * 8)))) | (t << (j * 8));

        cells_cur[i] = color;
    }

    if (draw_id === null)
    {
        draw_id = requestAnimationFrame(draw);
    }

    t = cells_old;
    cells_old = cells_cur;
    cells_cur = t;
}

function randomize()
{
    var i;

    for (i = 0; i < width; i++)
    {
        cells_cur[i] = cells_old[i] = (Math.random() * 256 * 256 * 256)|0;
    }
}

function drawWithHistory()
{
    var   i
        , cell;

    ctx.drawImage(cvs, 0, 1, width, height - 1,
        0, 0, width, height - 1);
    for (i = 0; i < width; i++)
    {
        cell = cells_cur[i];
        ctx.fillStyle = '#' + (('000000' + cell.toString(16)).slice(-6));
        ctx.fillRect(i, height - 1, 1, 1);
    }

    draw_id = null;
}

function drawLarge()
{
    var   i
        , cell;

    for (i = 0; i < width; i++)
    {
        cell = cells_cur[i];
        ctx.fillStyle = '#' + (('000000' + cell.toString(16)).slice(-6));
        ctx.fillRect(i, 0, 1, height);
    }

    draw_id = null;
}
