'use strict';
var // Simulation options
      width = 359
    , rule = [0, 0, 0, 1, 1, 0, 1, 0]

    // Display options
    , height = 250
    , delay = 10

    // skynet
    , cells = []
    , cvs = null
    , ctx = null
    , timer = null;

window.onload = function()
{
    var   i
        , rule_input = document.getElementById('rulecode')
        , rule_form = document.getElementById('ruleform')
        , randomize_form = document.getElementById('randomize');

    cvs = document.getElementById('cvs');
    cvs.width = width;
    cvs.height = height;

    ctx = cvs.getContext('2d');
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, width, height);
    
    rule_input.value = rule[0] + '' + rule[1] + '' + rule[2] + '' + rule[3] + '' + rule[4] + '' + rule[5] + '' + rule[6] + '' + rule[7];
    rule_form.onsubmit = function()
    {
        var rulecode = rule_input.value;
        if (rulecode.length !== 8)
        {
            alert('Needs 8 bits maybe?');
            return false;
        }
        for (i = 0; i < 8; i++)
        {
            if (rulecode[i] !== '0' && rulecode[i] !== '1')
            {
                alert('Zeros or ones only plz. :[');
                return false;
            }
        }
        rule[0] = parseInt(rulecode[0], 10); rule[1] = parseInt(rulecode[1], 10);
        rule[2] = parseInt(rulecode[2], 10); rule[3] = parseInt(rulecode[3], 10);
        rule[4] = parseInt(rulecode[4], 10); rule[5] = parseInt(rulecode[5], 10);
        rule[6] = parseInt(rulecode[6], 10); rule[7] = parseInt(rulecode[7], 10);
        init();
        draw();
        return false;
    };
    randomize_form.onsubmit = function()
    {
        randomize();
        draw();
        return false;
    };
    
    init();
    draw();
    timer = setInterval(iterate, delay);
};

function init()
{
    var i;

    cells = new Array(width);
    for (i = 0; i < width; i++)
    {
        cells[i] = 0;
    }
    cells[Math.floor(width / 2)] = 1;
}

function randomize()
{
    var i;

    cells = new Array(width);
    for (i = 0; i < width; i++)
    {
        cells[i] = Math.floor(Math.random() * 2);
    }
}

function iterate()
{
    var   i
        , set
        , line = new Array(width);
    
    for (i = 0; i < width; i++)
    {
        set = 0;

        if (i > 0)
        {
            set += 4 * cells[i - 1];
        }
        else
        {
            set += 4 * cells[width - 1];
        }

        set += 2 * cells[i];

        if (i < width - 1)
        {
            set += cells[i + 1];
        }
        else
        {
            set += cells[0];
        }

        line[i] = rule[7 - set];
    }
    
    cells = line;
    draw();
}

function draw()
{
    var i;

    ctx.drawImage(cvs, 0, 1, width, height - 1, 0, 0, width, height - 1);
    for (i = 0; i < width; i++)
    {
        if (cells[i] === 0)
        {
            ctx.fillStyle = 'rgb(255,255,255)';
        }
        else
        {
            ctx.fillStyle = 'rgb(0,0,0)';
        }
        ctx.fillRect(i, height - 1, 1, 1);
    }
}
