'use strict';

window.onload = function()
{
    var   cvs = document.getElementById('cvs')
        , stats_cvs = document.getElementById('stats_cvs');

    cvs.width = width;
    cvs.height = height;
    ctx = cvs.getContext('2d');

    stats_cvs.width = width;
    stats_cvs.height = 32;
    stats_ctx = stats_cvs.getContext('2d');

	init();
};

function goFullscreen()
{
	timer = clearInterval(timer);
	window.open('fullscreen.html', 'Plant Friends', 'fullscreen=yes, scrollbars=no');
}
