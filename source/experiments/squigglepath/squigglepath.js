'use strict';
var // display
      width = 140
    , height = 100
    , box_size = 3
    , colors= ['rgb(0,0,0)', 'rgb(220,220,220)', 'rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(255,0,255)', 'rgb(255,255,0)']

    // globals
    , cvs = null
    , ctx = null
    , cells = [];

window.onload = function()
{
	cvs = document.getElementById('canvas');
	cvs.width = width * box_size;
    cvs.height = height * box_size;
	ctx = cvs.getContext('2d');
	
	document.getElementById('randomize').onsubmit = function()
	{
		clearMap();
		randomSquiggle();
		draw();
		return false;
	};

	initMap();
	clearMap();
	randomSquiggle();
	draw();
};

function randomSquiggle()
{
    var   x1, y1
        , x2, y2
        , d, xd, yd;

	x1 = Math.floor(Math.random() * width);
	y1 = Math.floor(Math.random() * height);
	x2 = Math.floor(Math.random() * width);
	y2 = Math.floor(Math.random() * height);
	d = Math.floor(Math.random() * 16);
	xd = Math.floor(Math.random() * 16);
	yd = Math.floor(Math.random() * 16);
	
	makeSquigglePath(x1, y1, x2, y2, d, xd, yd);

	setTile(x1, y1, 2);
	setTile(x2, y2, 3);
}

function makeSquigglePath(x1, y1, x2, y2, divisions, x_diff, y_diff)
{
    var   i
        , x_step, y_step
        , px, py
        , x, y;

	x_step = (x2 - x1) / (divisions + 1);
	y_step = (y2 - y1) / (divisions + 1);
	
	px = x1;
	py = y1;
	for (i = 0; i <= divisions; i++)
	{
		x = x2;
		y = y2;
		if (i < divisions)
		{
			x = (x1 + Math.floor((i + 1) * x_step)) + Math.floor(((Math.random() * (x_diff * 2)) - x_diff));
			y = (y1 + Math.floor((i + 1) * y_step)) + Math.floor(((Math.random() * (y_diff * 2)) - y_diff));
			if (x < 0) { x = 0; }
			if (x > width) { x = width - 2; }
			if (y < 0) { y = 0; }
			if (y > height) { y = height - 3; }
		}
		makePath(px, py, x, y);
		px = x;
		py = y;
	}
}

function makePath(x1, y1, x2, y2, vertical_first)
{
	if (vertical_first === null)
	{
		vertical_first = Math.random() > 0.5;
	}
	if (vertical_first)
	{
		makeVertLine(x1, y1, y2, 1);
		makeHorizLine(x1, y2, x2, 1);
	}
	else
	{
		makeHorizLine(x1, y1, x2, 1);
		makeVertLine(x2, y1, y2, 1);
	}
}

function makeVertLine(x, y1, y2, type)
{
    var y, ty;

	if (y1 > y2)
	{
		ty = y1;
		y1 = y2;
		y2 = ty;
	}

	for (y = y1; y <= y2; y++)
	{
		if (!getTile(x, y)) { setTile(x, y, type); }
	}
}

function makeHorizLine(x1, y, x2, type)
{
    var x, tx;
	if (x1 > x2)
	{
		tx = x1;
		x1 = x2;
		x2 = tx;
	}

	for (x = x1; x <= x2; x++)
	{
		if (!getTile(x, y)) { setTile(x, y, type); }
	}
}

function initMap()
{
	cells = new Array(width * height);
}

function clearMap()
{
    var i;
    
	for (i = 0; i < width * height; i++)
	{
		cells[i] = 0;
	}
}

function getTile(x, y)
{
	if (x > width || y > height) { return null; }
	return cells[(y * width) + x];
}

function setTile(x, y, type)
{
	if (x > width || y > height) { return; }
	cells[(y * width) + x] = type;
}

function draw()
{
    var   x, y
        , t;

	ctx.fillStyle = colors[0];
	ctx.fillRect(0, 0, width * box_size, height * box_size);
	
	for (y = 0; y < height; y++)
	{
		for (x = 0; x < width; x++)
		{
			t = getTile(x, y);
			if (t > 0)
			{
				ctx.fillStyle = colors[t];
				ctx.fillRect(x * box_size, y * box_size, box_size, box_size);
			}
		}
	}
}
