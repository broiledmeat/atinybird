'use strict';
var // Cell options
      screen_width = 500
    , screen_height = 250

    // globals
    , glubc = null
;

window.onload = function()
{
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

	var renderer = new THREE.WebGLRenderer();
};
