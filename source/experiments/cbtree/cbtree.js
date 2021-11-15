'use strict';
var // options
      initial_u = 300
    , grow_t = 0.1
    , branch_d = 0.85
    , branch_t = 0.5
    
    // globals
    , genNodes = []
    , width = 1200
    , height = 420
    , delay = 10
    , ctx = null
    , timer = null

    // constants
    , HALF_PI = Math.PI / 2
    , TWO_PI = Math.PI * 2;

window.onload = function()
{
    var   canvas = document.getElementById('cvs')
        , initial_u_input = document.getElementById('initial_u')
        , grow_t_input = document.getElementById('grow_t')
        , branch_d_input = document.getElementById('branch_d')
        , settings_form = document.getElementById('settings');

    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');

    initial_u_input.value = initial_u;
    grow_t_input.value = grow_t;
    branch_d_input.value = branch_d;
    settings_form.onsubmit = function()
    {
        initial_u = parseFloat(initial_u_input.value);
        grow_t = parseFloat(grow_t_input.value);
        branch_d = parseFloat(branch_d_input.value);
        init();
        return false;
    };

    init();
};

function init()
{
    var   i
        , rootNode;

    genNodes = [];

    for (i = 0; i < 6; i++)
    {
        rootNode = new TreeNode();
        rootNode.parent = rootNode;
        rootNode.root = rootNode;
        rootNode.u = initial_u;
        rootNode.o_u = rootNode.u;
        rootNode.origin = [(i * 200) + 100, height - 10];
        rootNode.hue = Math.random() * 255;

        genNodes.push(rootNode);
    }

    ctx.fillStyle = 'rgb(210, 220, 255)';
    ctx.fillRect(0, 0, width, height);

    timer = setInterval(iterate, delay);
}

function iterate()
{
    var   i
        , stop = true
        , child = null
        , branch = null
        , genNode;

    for (i = genNodes.length - 1; i >= 0; i--)
    {
        genNode = genNodes[i];

        stop = false;
        child = new TreeNode();
        child.parent = genNode;
        child.root = genNode.root;
        child.hue = child.parent.hue + ((Math.random() * 10) - 5);
        child.v = genNode.v + 1;
        child.r = (genNode.o_r + (genNode.r + ((Math.random() * grow_t) - (grow_t / 2)))) / 2;
        child.u = genNode.u - (Math.random() + 1);
        child.o_u = genNode.o_u;
        child.o_r = genNode.r;

        child.origin = [ genNode.origin[0] + Math.sin(child.r + Math.PI)
                       , genNode.origin[1] + Math.cos(child.r + Math.PI) ];
        renderTreeNode(child);

        if (child.u <= 0)
        {
            renderDeadTreeNode(child);
            genNodes.splice(i, 1);
            continue;
        }

        genNodes[i] = child;

        // branch
        if (child.v >= 10 && Math.random() > branch_d && Math.random() > 1 - ((initial_u - child.u) / initial_u))
        {
            branch = new TreeNode();
            branch.parent = child;
            branch.root = child.root;
            branch.hue = branch.parent.hue + ((Math.random() * 20) - 10);
            branch.v = child.v;
            branch.r = child.r + (Math.random() > 0.5 ? HALF_PI : -1 * HALF_PI) + ((Math.random() * branch_t) - (branch_t / 2));
            branch.r = (branch.r + (child.r * (Math.random() * 0.5) + 0.5)) / 2;
            branch.u = child.u * (Math.random() * 0.8);
            branch.o_u = branch.u;
            branch.o_r = branch.r;

            branch.origin = [ child.origin[0] + Math.sin(child.r + Math.PI)
                            , child.origin[1] + Math.cos(child.r + Math.PI) ];
            renderTreeNode(branch);

            genNodes.push(branch);
        }
    }

    if (stop)
    {
        clearTimeout(timer);
    }
}

function renderTreeNode(treeNode)
{
    ctx.lineWidth = (treeNode.u / initial_u) * 3;

    if (ctx.lineWidth < 1)
    {
        ctx.lineWidth = 1;
    }

    ctx.strokeStyle = 'rgb(60, 20, 30)';
    ctx.beginPath();
    ctx.moveTo(treeNode.parent.origin[0], treeNode.parent.origin[1]);
    ctx.lineTo(treeNode.origin[0], treeNode.origin[1]);
    ctx.stroke();
}

function renderDeadTreeNode(treeNode)
{
    ctx.fillStyle = 'hsl(' + treeNode.hue + ', 100%, 50%)';
    ctx.arc(treeNode.origin[0], treeNode.origin[1], 1.5, 0, TWO_PI, true);
    ctx.fill();
}

function TreeNode()
{
    this.parent = null;
    this.root = null;
    this.hue = 0;
    this.children = [];
    this.origin = [0, 0];
    this.r = 0.0;
    this.u = 0.0;
    this.v = 0;
    this.o_r = this.r;
    this.o_u = this.u;
}
