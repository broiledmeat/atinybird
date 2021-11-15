'use strict';

/**
 * @fileOverview SimplexNoise JavaScript simplex noise implimentation ported
 * from http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
 * @author Derrick Staples (broiledmeat ENRAGED gmail LOBSTER com)
 * @version 0.2
 */

/** @namespace */
var SimplexNoise = (function()
{
    /** @scope SimplexNoise */
    return {
        /**
         * 2 Dimensional SimplexNoise Generator
         * @class
         * @property {number[]} permutations
         */
        SimplexNoise2D: function()
        {
            this.permutations = null;
        },

        /***
         * 3 Dimensional SimplexNoise Generator
         * @class
         * @property {number[]} permutations
         */
        SimplexNoise3D: function()
        {
            this.permutations = null;
        }
    };
}());


SimplexNoise.SimplexNoise2D.prototype.GRADIENTS = [[1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
                                                   [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
                                                   [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]];
SimplexNoise.SimplexNoise2D.prototype.SKEW_FACTOR = 0.5 * (Math.sqrt(3.0) - 1.0);
SimplexNoise.SimplexNoise2D.prototype.DESKEW_FACTOR = (3.0 - Math.sqrt(3.0)) / 6.0;

/**
 * @param {number[]} g
 * @param {number} x
 * @param {number} y
 */
SimplexNoise.SimplexNoise2D.prototype.dotProduct = function(g, x, y)
{
    return g[0] * x + g[1] * y;
};

/**
 * Randomize the permutation table used for noise generation.
 */
SimplexNoise.SimplexNoise2D.prototype.randomizePermutations = function()
{
    var   i, idx, val
        , size = 256;

    // Create a list twice the needed size, as it saves not having to do array wrapping.
    this.permutations = new Array(size * 2);
    for (i = 0; i < size; i++)
    {
        this.permutations[i] = i;
    }
    for (i = size - 1; i >= 0; i--)
    {
        // Randomize the array.
        idx = (Math.random() * i)|0;
        val = this.permutations[i];
        this.permutations[i] = this.permutations[idx];
        this.permutations[idx] = val;
        // Duplicate values to the second half of the array.
        this.permutations[i + size] = this.permutations[i];
    }
};

/**
 * Get the noise value at the given coordinates.
 * @param xin
 * @param yin
 * @returns {number}
 */
SimplexNoise.SimplexNoise2D.prototype.noise = function(xin, yin)
{
    var   n0, n1, n2
        , s, i, j, t
        , X0, Y0, x0, y0
        , x1, y1, x2, y2
        , i1, j1
        , ii, jj
        , gi0, gi1, gi2
        , t0, t1, t2;

    s = (xin + yin) * this.SKEW_FACTOR;
    i = (xin + s)|0;
    j = (yin + s)|0;

    t = (i + j) * this.DESKEW_FACTOR;
    X0 = i - t;
    Y0 = j - t;
    x0 = xin - X0;
    y0 = yin - Y0;

    if (x0 > y0) { i1 = 1; j1 = 0; }
        else { i1 = 0; j1 = 1; }

    x1 = x0 - i1 + this.DESKEW_FACTOR;
    y1 = y0 - j1 + this.DESKEW_FACTOR;
    x2 = x0 - 1 + 2 * this.DESKEW_FACTOR;
    y2 = y0 - 1 + 2 * this.DESKEW_FACTOR;

    ii = i & 255;
    jj = j & 255;
    gi0 = this.permutations[ii + this.permutations[jj]] % 12;
    gi1 = this.permutations[ii + i1 + this.permutations[jj + j1]] % 12;
    gi2 = this.permutations[ii + 1 + this.permutations[jj + 1]] % 12;

    t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0)
    {
        n0 = 0;
    }
    else
    {
        t0 *= t0;
        n0 = t0 * t0 * this.dotProduct(this.GRADIENTS[gi0], x0, y0);
    }

    t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0)
    {
        n1 = 0;
    }
    else
    {
        t1 *= t1;
        n1 = t1 * t1 * this.dotProduct(this.GRADIENTS[gi1], x1, y1);
    }

    t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0)
    {
        n2 = 0;
    }
    else
    {
        t2 *= t2;
        n2 = t2 * t2 * this.dotProduct(this.GRADIENTS[gi2], x2, y2);
    }

    return (1.0 + (70.0 * (n0 + n1 + n2))) / 2.0;
};


SimplexNoise.SimplexNoise3D.prototype.GRADIENTS = [[0,1,1,1],  [0,1,1,-1],  [0,1,-1,1],  [0,1,-1,-1],
                                                   [0,-1,1,1], [0,-1,1,-1], [0,-1,-1,1], [0,-1,-1,-1],
                                                   [1,0,1,1],  [1,0,1,-1],  [1,0,-1,1],  [1,0,-1,-1],
                                                   [-1,0,1,1], [-1,0,1,-1], [-1,0,-1,1], [-1,0,-1,-1],
                                                   [1,1,0,1],  [1,1,0,-1],  [1,-1,0,1],  [1,-1,0,-1],
                                                   [-1,1,0,1], [-1,1,0,-1], [-1,-1,0,1], [-1,-1,0,-1],
                                                   [1,1,1,0],  [1,1,-1,0],  [1,-1,1,0],  [1,-1,-1,0],
                                                   [-1,1,1,0], [-1,1,-1,0], [-1,-1,1,0], [-1,-1,-1,0]];
SimplexNoise.SimplexNoise3D.prototype.SKEW_FACTOR = 1.0 / 3.0;
SimplexNoise.SimplexNoise3D.prototype.DESKEW_FACTOR = 1.0 / 6.0;

/**
 * @param {number[]} g
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
SimplexNoise.SimplexNoise3D.prototype.dotProduct = function(g, x, y, z)
{
    return g[0] * x + g[1] * y + g[2] * z;
};

/**
 * Randomize the permutation table used for noise generation.
 */
SimplexNoise.SimplexNoise3D.prototype.randomizePermutations = function()
{
    var   i, idx, val
        , size = 256;

    // Create a list twice the needed size, as it saves not having to do array wrapping.
    this.permutations = new Array(size * 2);
    for (i = 0; i < size; i++)
    {
        this.permutations[i] = i;
    }
    for (i = size - 1; i >= 0; i--)
    {
        // Randomize the array.
        idx = (Math.random() * i)|0;
        val = this.permutations[i];
        this.permutations[i] = this.permutations[idx];
        this.permutations[idx] = val;
        // Duplicate values to the second half of the array.
        this.permutations[i + size] = this.permutations[i];
    }
};

/**
 * Get the noise value at the given coordinates.
 * @param xin
 * @param yin
 * @param zin
 * @returns {number}
 */
SimplexNoise.SimplexNoise3D.prototype.noise = function(xin, yin, zin)
{
    var   n0, n1, n2, n3
        , s, i, j, k, t
        , X0, Y0, Z0, x0, y0, z0
        , x1, y1, z1, x2, y2, z2, x3, y3, z3
        , i1, j1, k1, i2, j2, k2
        , ii, jj, kk
        , gi0, gi1, gi2, gi3
        , t0, t1, t2, t3;

    s = (xin + yin + zin) * this.SKEW_FACTOR;
    i = (xin + s)|0;
    j = (yin + s)|0;
    k = (zin + s)|0;

    t = (i + j + k) * this.DESKEW_FACTOR;
    X0 = i - t;
    Y0 = j - t;
    Z0 = k - t;
    x0 = xin - X0;
    y0 = yin - Y0;
    z0 = zin - Z0;

    if (x0 >= y0)
    {
        if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } // X Y Z order
        else if(x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } // X Z Y order
        else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } // Z X Y order
    }
    else
    {
        if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } // Z Y X order
        else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } // Y Z X order
        else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } // Y X Z order
    }

    x1 = x0 - i1 + this.DESKEW_FACTOR;
    y1 = y0 - j1 + this.DESKEW_FACTOR;
    z1 = z0 - k1 + this.DESKEW_FACTOR;
    x2 = x0 - i2 + 2.0 * this.DESKEW_FACTOR;
    y2 = y0 - j2 + 2.0 * this.DESKEW_FACTOR;
    z2 = z0 - k2 + 2.0 * this.DESKEW_FACTOR;
    x3 = x0 - 1.0 + 3.0 * this.DESKEW_FACTOR;
    y3 = y0 - 1.0 + 3.0 * this.DESKEW_FACTOR;
    z3 = z0 - 1.0 + 3.0 * this.DESKEW_FACTOR;

    ii = i & 255;
    jj = j & 255;
    kk = k & 255;
    gi0 = this.permutations[ii + this.permutations[jj + this.permutations[kk]]] % 12;
    gi1 = this.permutations[ii + i1 + this.permutations[jj + j1 + this.permutations[kk + k1]]] % 12;
    gi2 = this.permutations[ii + i2 + this.permutations[jj + j2 + this.permutations[kk + k2]]] % 12;
    gi3 = this.permutations[ii + 1 + this.permutations[jj + 1 + this.permutations[kk + 1]]] % 12;

    t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0)
    {
        n0 = 0.0
    }
    else
    {
        t0 *= t0;
        n0 = t0 * t0 * this.dotProduct(this.GRADIENTS[gi0], x0, y0, z0);
    }

    t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0)
    {
        n1 = 0.0
    }
    else
    {
        t1 *= t1;
        n1 = t1 * t1 * this.dotProduct(this.GRADIENTS[gi1], x1, y1, z1);
    }

    t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0)
    {
        n2 = 0.0
    }
    else
    {
        t2 *= t2;
        n2 = t2 * t2 * this.dotProduct(this.GRADIENTS[gi2], x2, y2, z2);
    }

    t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0)
    {
        n3 = 0.0
    }
    else
    {
        t3 *= t3;
        n3 = t3 * t3 * this.dotProduct(this.GRADIENTS[gi3], x3, y3, z3);
    }

    return (1.0 + (32.0 * (n0 + n1 + n2 + n3))) / 2.0;
};