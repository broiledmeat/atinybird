'use strict';

var   g_width = 300
    , g_height = 300

    , g_ctx = null
    , g_image = null;

window.onload = function()
{
    var canvas = document.getElementById('cvs');

    canvas.width = g_width;
    canvas.height = g_height;
    g_ctx = canvas.getContext('2d');

    init();
};

function init()
{
    g_ctx.fillStyle = 'rgb(210, 220, 255)';
    g_ctx.fillRect(0, 0, g_width, g_height);

    set_image_from_search('butts');
}

function set_image_from_search(term)
{
    var xmlhttp = new XMLHttpRequest();
    var url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyAL5vnFUqg__reEmX648C6oKckOTnatOfI' +
              '&cx=014844121793212715124:74gg8ossxkm&fileType=png%2C+jpg&imgType=photo&searchType=image' +
              '&fields=items%2Flink&q=' + term;

    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            var results = JSON.parse(xmlhttp.responseText);
            if (results == null || results.items == null || results.items.length == 0)
            {
                return;
            }

            var img = new Image();
            img.onload = function()
            {
                set_image(img);
            };
            //img.crossOrigin = "anonymous";
            img.src = results.items[Math.floor(Math.random() * results.items.length)].link;
        }
    };
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
}

function set_image(image)
{
    var cvs = document.createElement('canvas');
    var ctx = cvs.getContext("2d");
    cvs.width = image.width;
    cvs.height = image.height;
    ctx.drawImage(image, 0, 0, cvs.width, cvs.height);
    var img_data = ctx.getImageData(0, 0, cvs.width, cvs.height);

    // grayscale
    for(var i = 0; i < img_data.data.length; i += 4)
    {
        var grayscale = (0.33 * img_data.data[i]) + (0.5 * img_data.data[i + 1]) + (0.15 * img_data.data[i + 2]);
        //img_data.data[i] = grayscale;
        //img_data.data[i+1] = grayscale;
        //img_data.data[i+2] = grayscale;
    }

    g_image = image;
    g_ctx.drawImage(cvs, 0, 0, g_width, g_height);
}
