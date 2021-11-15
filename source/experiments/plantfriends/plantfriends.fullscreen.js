'use strict';

window.onload = function()
{
    var cvs = document.getElementById('cvs')

	width = window.innerWidth - 16;
	height = window.innerHeight - 16;

    cvs.width = width;
    cvs.height = height;
    ctx = cvs.getContext('2d');
	
	init();
};
