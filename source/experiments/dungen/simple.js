'use strict';

var
// options
    width = 150,
    height = 150,
    draw_mult = 3,
    generators = [
        ['Pieces', 'generatePieces'],
    ],
    generator = null,

// globals
    canvas = null,
    ctx = null,
    map = null;

window.onload = function()
{
    var generator_input = document.getElementById('generator')
        , settings_form = document.getElementById('settings')
        , i;

    canvas = document.getElementById('canvas');
    canvas.width = width * draw_mult;
    canvas.height = height * draw_mult;
    ctx = canvas.getContext('2d');

    generator = generators[0][1];

    generator_input.innerHTML = '';
    for (i = 0; i < generators.length; i++)
    {
        generator_input.innerHTML += '<option value="' + i + '">' + generators[i][0] + '</option>';
    }

    generator_input.onchange = function()
    {
        generator = generators[parseInt(generator_input.value, 10)][1];
    };

    settings_form.onsubmit = function()
    {
        init();
        return false;
    };

    init();
};


function init()
{
    map = new DunGen.Map(width, height);
    map[generator]();

    drawZones();
    drawTiles();
}


function drawZones()
{
    var x, y
        , zone, fillStyle;

    for (y = 0; y < map.Height; y++)
    {
        for (x = 0; x < map.Width; x++)
        {
            zone = map.getZone(x, y);
            fillStyle = 'rgb(255, 255, 0)';

            if (zone === DunGen.Zones.Void)
            {
                fillStyle = 'rgb(0, 0, 0)';
            }
            else if (zone === DunGen.Zones.Open)
            {
                fillStyle = 'rgb(64, 64, 128)';
            }

            ctx.fillStyle = fillStyle;
            ctx.fillRect(x * draw_mult, y * draw_mult, draw_mult, draw_mult);
        }
    }
}

function drawTiles()
{
    var x, y
        , tile, fillStyle;

    for (y = 0; y < map.Height; y++)
    {
        for (x = 0; x < map.Width; x++)
        {
            tile = map.getTile(x, y);
            fillStyle = null;

            if (tile === DunGen.Tiles.Floor)
            {
                fillStyle = 'rgb(32, 32, 64)';
            }
            else if (tile === DunGen.Tiles.Wall)
            {
                fillStyle = 'rgb(96, 96, 128)';
            }
            else if (tile === DunGen.Tiles.Door)
            {
                fillStyle = 'rgb(128, 64, 64)';
            }

            if (fillStyle != null)
            {
                ctx.fillStyle = fillStyle;
                ctx.fillRect(x * draw_mult, y * draw_mult, draw_mult, draw_mult);
            }
        }
    }
}
