'use strict';
var // display
      width = 320
    , height = 200
    , delay = 1000

    // globals
    , ctx = null
    , timer = null
    , ground_heights = []
    , colors = {
	   'grass':	'rgb(80,220,0)',
	   'ground':	'rgb(0,180,0)'
      };

window.onload = function()
{
    var cvs = document.getElementById('cvs');

    cvs.width = width;
    cvs.height = height;
    ctx = cvs.getContext('2d');

	init();
};

function init()
{
	clearTimeout(timer);

	initGame();
	draw();
    timer = setInterval(init, delay);
}

function iterate()
{
}

function draw()
{
    var i;

	// Background
	ctx.fillStyle = 'rgb(0,30,70)';
	ctx.fillRect(0, 0, width, height);
	
	// Grass and ground
	for (i = 0; i < width; i++)
	{
		ctx.fillStyle = colors['grass'];
		ctx.fillRect(i, ground_heights[i], 1, 1);
		ctx.fillStyle = colors['ground'];
		ctx.fillRect(i, ground_heights[i] + 1, 1, height - (ground_heights[i] + 1));
	}
	
	// Octopi
	i = (Math.random() * width)|0; drawOctopus(i, ground_heights[i], 'rgb(255,0,0)');
	i = (Math.random() * width)|0; drawOctopus(i, ground_heights[i], 'rgb(0,255,0)');
    i = (Math.random() * width)|0; drawOctopus(i, ground_heights[i], 'rgb(0,0,255)');
	i = (Math.random() * width)|0; drawOctopus(i, ground_heights[i], 'rgb(255,255,0)');
}

function drawOctopus(x, y, color)
{
	ctx.fillStyle = color;
	ctx.fillRect(x - 1, y - 6, 3, 5);
	ctx.fillRect(x - 2, y - 5, 1, 3);
	ctx.fillRect(x + 2, y - 5, 1, 3);
	ctx.fillRect(x - 2, y - 1, 5, 1);
	ctx.fillRect(x - 4, y, 2, 1);
	ctx.fillRect(x - 1, y, 1, 1);
	ctx.fillRect(x + 1, y, 1, 1);
	ctx.fillRect(x + 3, y, 2, 1);
	ctx.fillStyle = 'rgb(180,180,180)';
	ctx.fillRect(x - 1, y - 4, 1, 1);
	ctx.fillRect(x + 1, y - 4, 1, 1);
}

function initGame()
{
    var   data
        , h, min_h, max_h, avg_h
        , i;

	// Generate landscape
	ground_heights = [];
	data = generateNoise(width, 1, Math.floor(Math.random() * 16) + 8, 0.85);
	min_h = 10;
	max_h = height - 5;
	avg_h = height - Math.floor(height * ((Math.random() * 0.3) + 0.2));

	for (i = 0; i < width; i++)
	{
		h = avg_h + data[i] * (height / 6);
		if (h < min_h) { h = min_h; }
		if (h > max_h) { h = max_h; }
		ground_heights.push(h|0);
	}
}

function generateNoise(size, frequency, octaves, persistence)
{
    var   i, j
        , data = []
        , octave, octaveFrequency
        , numSamples, randomValues
        , parameter, parameterFraction, parameterA, parameterB
        , persistenceValue, interpolatedValue
        , stepSize;

	for (i = 0; i < size; i++)
	{
		data[i] = 0.0;
	}
	
	for (octave = 0; octave < octaves; octave++)
	{
		octaveFrequency = frequency * (octave + 1);
		numSamples = ((octaveFrequency + 1)|0) * 2;
		
		randomValues = [];
		
		for (i = 0; i < numSamples; i++)
		{
			randomValues[i] = (Math.random() * 2) - 1;
		}
		
		stepSize = octaveFrequency / size;
		
		if (stepSize <= 1.0)
		{
			for (j = 0; j < size; j++)
			{
				parameter = j * stepSize;
				
				parameterFraction = parameter - (parameter|0);
				parameterA = parameter|0;
				parameterB = (parameter + 1)|0;
				
				persistenceValue = Math.pow(persistence, octave);
				interpolatedValue = (randomValues[parameterA] * (1 - parameterFraction)) + randomValues[parameterB] * parameterFraction;
				
				data[j] += interpolatedValue * persistenceValue;
			}
		}
	}
	
	return data;
}
