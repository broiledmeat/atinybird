'use strict';
var // Options
      wrap = true
    , width = 40
    , height = 40
    , cell_size = 8
    , delay = 5

    // Globals
    , ctx = null
    , cells = new Array(width * height)
    , old_cells = null
    , timer = null;

window.onload = function()
{
    var   cvs = document.getElementById('cvs')
        , randomize_form = document.getElementById('randomize');

    cvs.width = width * cell_size;
    cvs.height = height * cell_size;
    ctx = cvs.getContext('2d')
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    
    randomize_form.onsubmit = function()
    {
        randomizeCells();
        return false;
    };
    
    randomizeCells();
    timer = setInterval(iterate, delay);
};

function iterate()
{
    var   j, i
        , count
        , n;

    old_cells = cells.slice(0);
    
    ctx.fillRect(0, 0, width * cell_size, height * cell_size);

    for (j = 0; j < height; j++)
    {
        for (i = 0; i < width; i++)
        {
            count = 0;
            n = 0;
            if (getOldCell(i - 1, j - 1)) { count++; n |= 1;   }
            if (getOldCell(i    , j - 1)) { count++; n |= 2;   }
            if (getOldCell(i + 1, j - 1)) { count++; n |= 4;   }
            if (getOldCell(i - 1, j    )) { count++; n |= 8;   }
            if (getOldCell(i + 1, j    )) { count++; n |= 16;  }
            if (getOldCell(i - 1, j + 1)) { count++; n |= 32;  }
            if (getOldCell(i    , j + 1)) { count++; n |= 64;  }
            if (getOldCell(i + 1, j + 1)) { count++; n |= 128; }
            if (count < 2 || count > 3) { cellOff(i, j); }
            if (count === 3) {
                cellOn(i, j);
                ctx.beginPath();
                if (n & 1) {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i - 1) * cell_size) + (cell_size / 2), ((j - 1) * cell_size) + (cell_size / 2));
                }
                if (n & 2)
                {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i    ) * cell_size) + (cell_size / 2), ((j - 1) * cell_size) + (cell_size / 2));
                }
                if (n & 4)
                {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i + 1) * cell_size) + (cell_size / 2), ((j - 1) * cell_size) + (cell_size / 2));
                }
                if (n & 8)
                {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i - 1) * cell_size) + (cell_size / 2), ((j    ) * cell_size) + (cell_size / 2));
                }
                if (n & 16)
                {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i + 1) * cell_size) + (cell_size / 2), ((j    ) * cell_size) + (cell_size / 2));
                }
                if (n & 32)
                {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i - 1) * cell_size) + (cell_size / 2), ((j + 1) * cell_size) + (cell_size / 2));
                }
                if (n & 64)
                {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i    ) * cell_size) + (cell_size / 2), ((j + 1) * cell_size) + (cell_size / 2));
                }
                if (n & 128)
                {
                    ctx.moveTo((i * cell_size) + (cell_size / 2), (j * cell_size) + (cell_size / 2));
                    ctx.lineTo(((i + 1) * cell_size) + (cell_size / 2), ((j + 1) * cell_size) + (cell_size / 2));
                }
                ctx.stroke();
            }
        }
    }
}

function randomizeCells()
{
    var j, i;

    for (j = 0; j < height; j++)
    {
        for (i = 0; i < width; i++)
        {
            if (Math.random() > 0.5)
            {
                cellOn(i, j);
            }
            else
            {
                cellOff(i, j);
            }
        }
    }
}

function cellOn(x, y)
{
    cells[(y * width) + x] = true;
};

function cellOff(x, y)
{
    cells[(y * width) + x] = false;
}

function getOldCell(x, y)
{
    if (wrap)
    {
        if (x < 0) { x += width; }
        if (y < 0) { y += height; }
        if (x >= width) { x -= width; }
        if (y >= height) { y -= height; }
    }
    else if (x < 0 || y < 0 || x >= width || y >= height)
    {
        return null;
    }
    return old_cells[(y * width) + x];
}
