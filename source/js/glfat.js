'use strict';

/**
 * @fileOverview glFat JavaScript WebGL Toy
 * @author Derrick Staples (broiledmeat ENRAGED gmail LOBSTER com)
 * @version 0.1
 */

var glFat = function(element_id, width, height)
{
    /** @type {Canvas} */
    this.canvas = document.getElementById(element_id);
    this.context = this.canvas.getContext('webgl', { antialias: false });
    this.canvas.width = width;
    this.canvas.height = height;

    this.context.viewport(0, 0, this.context.drawingBufferWidth, this.context.drawingBufferHeight);
    this.clear([0.5, 0.5, 0.5]);

    return this;
};

glFat.prototype.setupSimpleFragmentShader = function(vertex_source, fragment_source)
{
    this.createBuffer([
        -1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0
    ]);

    var material = this.createMaterial(vertex_source, fragment_source);
    glubc.useMaterial(material);

    var that = this;
    function renderFunc()
    {
        window.requestAnimationFrame(renderFunc, that.canvas);
        glubc.context.drawArrays(glubc.context.TRIANGLES, 0, 6);
    }

    return renderFunc;
};


glFat.prototype.loadShader = function(source, type)
{
    var shader = this.context.createShader(type);

    this.context.shaderSource(shader, source);
    this.context.compileShader(shader);

    var compiled = this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)
    if (!compiled)
    {
        throw 'Error compiling shader `' + this.context.getShaderInfoLog(shader) + '`.';
    }

    return shader;
};

glFat.prototype.loadVertexShader = function(source) { return this.loadShader(source, this.context.VERTEX_SHADER); };
glFat.prototype.loadFragmentShader = function(source) { return this.loadShader(source, this.context.FRAGMENT_SHADER); };

glFat.prototype.createMaterial = function(vertex_source, fragment_source)
{
    var material = this.context.createProgram();
    var vertex_shader = this.loadVertexShader(vertex_source);
    var fragment_shader = this.loadFragmentShader(fragment_source);

    this.context.attachShader(material, vertex_shader);
    this.context.attachShader(material, fragment_shader);

    this.context.linkProgram(material);

    var linked = this.context.getProgramParameter(material, this.context.LINK_STATUS);
    if (!linked)
    {
        throw 'Error creating material `' + this.context.getProgramInfoLog(material); + '`. ';
    }

    var position_attr = this.context.getAttribLocation(material, 'vertPosition');
    this.context.enableVertexAttribArray(position_attr);
    this.context.vertexAttribPointer(position_attr, 3, this.context.FLOAT, false, 0, 0);

    var color_attr = this.context.getAttribLocation(material, 'vertColor');
    this.context.enableVertexAttribArray(color_attr);
    this.context.vertexAttribPointer(color_attr, 4, this.context.FLOAT, false, 0, 0);

    return material;
};

glFat.prototype.useMaterial = function(material)
{
    this.context.useProgram(material);

    var err_code = this.context.getError();
    if (err_code != 0)
    {
        var info_log = this.context.getProgramInfoLog(material);
        throw 'Error using material, code `' + err_code + '`. ' + info_log;
    }
};

glFat.prototype.createBuffer = function(verts)
{
    var  buffer = this.context.createBuffer();

    this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(verts), this.context.STATIC_DRAW);

    var err_code = this.context.getError();
    if (err_code != 0)
    {
        throw 'Error creating buffer, code `' + err_code + '`.';
    }

    return buffer;
};

glFat.prototype.clear = function(color)
{
    if (color.length == 4)
    {
        this.context.clearColor(color[0], color[1], color[2], color[3]);
    }
    else
    {
        this.context.clearColor(color[0], color[1], color[2], 1.0);
    }
    this.context.clear(this.context.COLOR_BUFFER_BIT);
};

glFat.prototype.getElementText = function(element_id)
{
    var element = document.getElementById(element_id);

    if (element == null || !('text' in element))
    {
        throw "Unable to find element named `" + element_id + "`.";
    }

    return element.text;
};