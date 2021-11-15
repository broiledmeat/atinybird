'use strict';
var // Display options
      width = 500
    , height = 500

    // Options
    , initial_elements = 10000
    , elements_per_node = 5
    , max_depth = 20
    , palette = 0
    , palettes = [
            ['adrift in dreams', [[11,72,107], [59,134,134], [121,189,154], [168,219,168], [207,240,158]]],
            ['hanger management', [[184,42,102], [184,195,178], [241,227,193], [221,206,189], [76,90,95]]],
            ['war', [[35,15,43], [242,29,85], [235,235,188], [188,227,197], [130,179,174]]],
            ['rgbw', [[0,0,255], [0,255,0], [255,0,0], [255,255,255]]],
            ['white-black', [[0,0,0], [255,255,255]]],
            ['barf', [[0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255], [0,255,255], [255,0,255]]]
        ]

    // globals
    , ctx = null
    , status_div = null
    , pop_time = 0
    , points = null;

function Point(x, y, hue)
{
    this.x = x;
    this.y = y;
    this.hue = hue;
}

// Return a plants rgb string that the ctx context can use
Point.prototype.rgbStyle = function()
{
    var   i
        , h, s, v
        , r, g, b
        , p1, p2, p3;

    h = this.hue * 6;
    s = 1.0;
    v = 1.0;
    r = 0;
    g = 0;
    b = 0;
    
    i = Math.floor(h);
    p1 = v * (1 - s);
    p2 = v * (1 - s * (h - i));
    p3 = v * (1 - s * (1 - (h - i)));
    
    if      (i === 0) { r = v;  g = p3; b = p1; }
    else if (i === 1) { r = p2; g = v;  b = p1; }
    else if (i === 2) { r = p1; g = v;  b = p3; }
    else if (i === 3) { r = p1; g = p2; b = v;  }
    else if (i === 4) { r = p3; g = p1; b = v;  }
    else              { r = v;  g = p1; b = p2; }

    return 'rgb(' + Math.floor(r * 256) + ',' + Math.floor(g * 256) + ',' + Math.floor(b * 256) + ')';
};

function Points(width, height, elements_per_node)
{
    this.tree = new QLeaf.QuadTree(width, height, elements_per_node, max_depth);

    this.addPoint = function(x, y, hue)
    {
        this.tree.add(x, y, new Point(x, y, hue));
    };
    
    this.removePoint = function(point)
    {
        this.tree.remove(point);
    };
}

window.onload = function()
{
    var   i
        , cvs = document.getElementById('cvs')
        , elements_input = document.getElementById('elements')
        , per_node_input = document.getElementById('pernode')
        , max_depth_input = document.getElementById('maxdepth')
        , palette_input = document.getElementById('palette')
        , settings_form = document.getElementById('settings')
        , create_form = document.getElementById('create')
        , delete_form = document.getElementById('delete');

    cvs.width = width;
    cvs.height = height;
    ctx = cvs.getContext('2d');

    status_div = document.getElementById('status');
    
    elements_input.value = initial_elements;
    max_depth_input.value = max_depth;
    per_node_input.value = elements_per_node;
    palette_input.innerHTML = '';
    for (i = 0; i < palettes.length; i++)
    {
        palette_input.innerHTML += '<option value="' + i + '">' + palettes[i][0] + '</option>';
    }
    palette_input.onchange = function()
    {
        palette = parseInt(palette_input.value, 10);
        draw();
    };
    
    settings_form.onsubmit = function()
    {
        initial_elements = parseInt(elements_input.value, 10);
        elements_per_node = parseInt(per_node_input.value, 10);
        max_depth = parseInt(max_depth_input.value, 10);
        init();
        return false;
    };

    create_form.onsubmit = function()
    {
        createRandomElements();
        draw();
        return false;
    };

    delete_form.onsubmit = function()
    {
        deleteRandomElements();
        draw();
        return false;
    };

    init();
};

function init()
{
    var   i
        , start, end;

    points = new Points(width, height, elements_per_node);
 
    start = new Date().getTime();
    for (i = 0; i < initial_elements; i++)
    {
        points.addPoint(width * Math.random(), height * Math.random(), Math.random());
    }
    end = new Date().getTime();
    pop_time = end - start;
    
    draw();
}

// Wipes the screen and draw nodes
function draw()
{
    var   i
        , start, end
        , elements, point
        , trielements, rectelements, circelements
        , ax, ay
        , bx, by
        , cx, cy
        , x, y, r;

    status_div.innerHTML = 'Count: ' + points.tree.element_count + ' elements, ' + points.tree.node_count + ' nodes<br>';
    status_div.innerHTML += 'Elements Per Node: ' + points.tree.max_elements_per_node + ', Max Node Depth: ' + points.tree.max_tree_depth + '<br>';
    status_div.innerHTML += 'Time Taken:<br>&nbsp;Populate: ' + pop_time + 'ms<br>';
    
    drawNodeBox(points.tree.root);

    start = new Date().getTime();
    elements = points.tree.getAll();
    end = new Date().getTime();
    status_div.innerHTML += '&nbsp;Get all: ' + (end - start) + 'ms<br>';
    
    ctx.fillStyle = getRGBFromPalette(1, 0.2);

    // Triangle
    ax = 30; ay = 30;
    bx = 120; by = 30;
    cx = 75; cy = 120;
    start = new Date().getTime();
    trielements = points.tree.getInTriangle(ax, ay, bx, by, cx, cy);
    end = new Date().getTime();
    status_div.innerHTML += '&nbsp;Get in triangle: ' + (end - start) + 'ms<br>';

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.fill();
    
    // Rectangle
    ax = 180; ay = 30;
    bx = 270; by = 120;
    start = new Date().getTime();
    rectelements = points.tree.getInRectangle(ax, ay, bx, by);
    end = new Date().getTime();
    status_div.innerHTML += '&nbsp;Get in rectangle: ' + (end - start) + 'ms<br>';
    ctx.fillRect(ax, ay, bx - ax, by - ay);
    
    // Circle
    x = 225; y = 225;
    r = 50;
    start = new Date().getTime();
    circelements = points.tree.getInCircle(x, y, r);
    end = new Date().getTime();
    status_div.innerHTML += '&nbsp;Get in circle: ' + (end - start) + 'ms<br>';
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.fill();
    
    for (i = 0; i < elements.length; i++)
    {
        point = elements[i].value;
        ctx.fillStyle = point.rgbStyle();
        ctx.fillRect(point.x, point.y, 1, 1);
    }

    for (i = 0; i < trielements.length; i++)
    {
        point = trielements[i].value;
        ctx.fillStyle = point.rgbStyle();
        ctx.fillRect(point.x - 0.5, point.y - 0.5, 2, 2);
    }

    for (i = 0; i < rectelements.length; i++)
    {
        point = rectelements[i].value;
        ctx.fillStyle = point.rgbStyle();
        ctx.fillRect(point.x - 0.5, point.y - 0.5, 2, 2);
    }

    for (i = 0; i < circelements.length; i++)
    {
        point = circelements[i].value;
        ctx.fillStyle = point.rgbStyle();
        ctx.fillRect(point.x - 0.5, point.y - 0.5, 2, 2);
    }
}

// Recurse through a node and draw division boxes
function drawNodeBox(node)
{
    var   i
        , c;

    if ((node.elements !== null && node.elements.length > 0) || node.nodes !== null)
    {
        if (Math.floor(node.width) > 0 && Math.floor(node.height) > 0)
        {
            c = node.depth / 25;
            if (c > 1) { c = 1; }
            ctx.fillStyle = getRGBFromPalette(c);
            ctx.fillRect(node.x, node.y, node.width, node.height);
        }
    }
    
    if (node.nodes !== null)
    {
        for (i = 0; i < node.nodes.length; i++)
        {
            drawNodeBox(node.nodes[i]);
        }
    }
}

function createRandomElements()
{
    var i;

    for (i = 0; i < Math.floor(Math.random() * 5) + 5; i++)
    {
        points.addPoint(width * Math.random(), height * Math.random(), Math.random());
    }
}

function deleteRandomElements()
{
    var   i
        , elements;
    
    elements = points.tree.getAll();
    for (i = 0; i < elements.length; i++)
    {
        if (Math.random() > 0.99)
        {
            points.removePoint(elements[i]);
        }
    }
}

function getRGBFromPalette(val, alpha)
{
    'use strict';
    var   i, j
        , ca, cb
        , r, g, b;

    i = val * (palettes[palette][1].length - 1);
    j = i - Math.floor(i);
    ca = palettes[palette][1][Math.ceil(i)];
    cb = palettes[palette][1][Math.floor(i)];
    r = Math.floor((j * ca[0]) + ((1 - j) * cb[0]));
    g = Math.floor((j * ca[1]) + ((1 - j) * cb[1]));
    b = Math.floor((j * ca[2]) + ((1 - j) * cb[2]));

    if (alpha === undefined || alpha === null) { return 'rgb(' + r + ',' + g + ',' + b + ')'; }
        else { return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'; }
}
