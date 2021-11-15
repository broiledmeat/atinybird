'use strict';

/**
 * @fileOverview Navier-Stokes javascript implementation ported
 * from http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf
 * @author Derrick Staples (broiledmeat ENRAGED gmail LOBSTER com)
 * @version 0.1
 */

/** @namespace */
var NavierStokes = (function()
{
    /** @scope SimplexNoise */
    return {
        /**
         * Navier-Stokes
         * @class
         * @property {number} width
         * @property {number} height
         * @property {number[]} velocity_u
         * @property {number[]} velocity_v
         * @property {number[]} density
         */
        NavierStokes: function(width, height)
        {
            this.width = width;
            this.height = height;

            var size = (width + 2) * (height + 2);
            this.density = new Float32Array(size);
            this.velocity_u = new Float32Array(size);
            this.velocity_v = new Float32Array(size);
            this.density_prev = new Float32Array(size);
            this.velocity_u_prev = new Float32Array(size);
            this.velocity_v_prev = new Float32Array(size);

        }
    };
}());


NavierStokes.NavierStokes.prototype.update = function()
{
    //this.updateVelocity(this.velocity_u, this.velocity_v, this.velocity_u_prev, this.velocity_v_prev, 1, 1);
    this.updateDensity(0.5, 1.0);
};


/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} val
 */
NavierStokes.NavierStokes.prototype.setDensity = function(x, y, val)
{
    console.log(this.density_prev[this.getIndex(x + 1, y + 1)], this.density[this.getIndex(x + 1, y + 1)]);
    this.density_prev[this.getIndex(x + 1, y + 1)] = val;
    console.log(this.density_prev[this.getIndex(x + 1, y + 1)], this.density[this.getIndex(x + 1, y + 1)]);
    //this.density[this.getIndex(x + 1, y + 1)] = val;
};


/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
NavierStokes.NavierStokes.prototype.getDensity = function(x, y)
{
    return this.density[this.getIndex(x + 1, y + 1)];
};


/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} horiz
 * @param {number} vert
 */
NavierStokes.NavierStokes.prototype.setVelocity = function(x, y, horiz, vert)
{
    this.velocity_u_prev[this.getIndex(x + 1, y + 1)] = horiz;
    this.velocity_v_prev[this.getIndex(x + 1, y + 1)] = vert;
    this.velocity_u[this.getIndex(x + 1, y + 1)] = horiz;
    this.velocity_v[this.getIndex(x + 1, y + 1)] = vert;
};


NavierStokes.NavierStokes.prototype.updateDensity = function(diff, dt)
{
    var temp;

    this.addSource(this.density, this.density_prev, dt);
    temp = this.density_prev; this.density_prev = this.density; this.density = temp;
    this.diffuse(0, this.density, this.density_prev, diff, dt);
    //temp = this.density_prev; this.density_prev = this.density; this.density = temp;
    //this.advect(0, x, x0, u, v, dt);
};

NavierStokes.NavierStokes.prototype.updateVelocity = function(u, v, u0, v0, visc, dt)
{
    var temp;

    this.addSource(u, u0, dt);
    this.addSource(v, v0, dt);
    temp = u; u = u0; u0 = temp;
    this.diffuse(1, u, u0, visc, dt);
    temp = v; v = v0; v0 = temp;
    this.diffuse(2, v, v0, visc, dt);
    this.project(u, v, u0, v0);
    temp = u; u = u0; u0 = temp;
    temp = v; v = v0; v0 = temp;
    this.advect(1, u, u0, u0, v0, dt);
    this.advect(2, v, v0, u0, v0, dt);
    this.project(u, v, u0, v0);
};

/**
 * Get the cell index for the given coordinates.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
NavierStokes.NavierStokes.prototype.getIndex = function(x, y)
{
    return ((x|0) + ((y|0) * (this.width + 2)))|0;
};


/**
 *
 * @param {number[]} field
 * @param {number[]} source_field
 * @param {number} dt
 */
NavierStokes.NavierStokes.prototype.addSource = function(field, source_field, dt)
{
    var   i;

    for (i = 0; i < field.length; i++)
    {
        field[i] += dt * source_field[i];
    }
};


/**
 *
 * @param {number} b
 * @param {number[]} field
 * @param {number[]} field_prev
 * @param {number} diff
 * @param {number} dt
 */
NavierStokes.NavierStokes.prototype.diffuse = function(b, field, field_prev, diff, dt)
{
    //var   i, j, k, val
    //    , a = dt * diff * this.width * this.height;
    //
    //for (k = 0; k < 20; k++)
    //{
    //    for (i = 1; i <= this.width; i++)
    //    {
    //        for (j = 1; j <= this.height; j++)
    //        {
    //            val = (field_prev[this.getIndex(i, j)] +
    //                   a * (field_prev[this.getIndex(i - 1, j)] + field_prev[this.getIndex(i + 1, j)] +
    //                        field_prev[this.getIndex(i, j - 1)] + field_prev[this.getIndex(i, j + 1)])) /
    //                  (1 + (4 * a));
    //            field[this.getIndex(i, j)] = val;
    //        }
    //    }
    //}
    //
    //this.set_boundaries(b, field);

    // constant decay
    var i, a = 0.2 * dt;
    for (i = 0; i < field.length; i++)
    {
        field[i] -= a; //field_prev[i] - a;
        if (field[i] < 0)
        {
            field[i] = 0;
        }
    }
    this.set_boundaries(b, field);
};


/**
 *
 * @param {number} b
 * @param {number[]} density
 * @param {number[]} density_prev
 * @param {number[]} velocity_u
 * @param {number[]} velocity_v
 * @param {number} dt
 */
NavierStokes.NavierStokes.prototype.advect = function(b, density, density_prev, velocity_u, velocity_v, dt)
{
    var   i, j
        , x, y, val
        , i0, i1, j0, j1
        , s0, s1, t0, t1
        , dt0 = dt * Math.sqrt(this.width * this.height);

    for (j = 1; j <= this.height; j++)
    {
        for (i = 1; i <= this.width; i++)
        {
            x = i - dt0 * velocity_u[this.getIndex(i, j)];
            x = Math.max(0.5, Math.min(this.width + 0.5, x));
            y = j - dt0 * velocity_v[this.getIndex(i, j)];
            y = Math.max(0.5, Math.min(this.height + 0.5, y));
            i0 = x|0;
            i1 = i0 + 1;
            j0 = y|0;
            j1 = j0 + 1;
            s1 = x - i0;
            s0 = 1 - s1;
            t1 = y - j0;
            t0 = 1 - t1;
            val = s0 *
                  (t0 * density_prev[this.getIndex(i0, j0)] + t1 * density_prev[this.getIndex(i0, j1)]) +
                  s1 *
                  (t0 * density_prev[this.getIndex(i1, j0)] + t1 * density_prev[this.getIndex(i1, j1)]);
            density[this.getIndex(i, j)] = val;
        }
    }

    this.set_boundaries(b, density);
};


/**
 *
 * @param {number[]} velocity_u
 * @param {number[]} velocity_v
 * @param {number[]} p
 * @param {number[]} div
 */
NavierStokes.NavierStokes.prototype.project = function(velocity_u, velocity_v, p, div)
{
    var   i, j, k
        , h = 1 / Math.sqrt(this.width * this.height);

    for (i = 1; i <= this.width; i++)
    {
        for (j = 1; j <= this.height; j++)
        {
            div[this.getIndex(i, j)] = -0.5 * h * (velocity_u[this.getIndex(i + 1, j)] -
                                                    velocity_u[this.getIndex(i - 1, j)] +
                                                    velocity_v[this.getIndex(i, j + 1)] -
                                                    velocity_v[this.getIndex(i, j - 1)]);
            p[this.getIndex(i, j)] = 0;
        }
    }
    this.set_boundaries(0, div);
    this.set_boundaries(0, p);

    for (k = 0; k < 20; k++)
    {
        for (i = 1; i <= this.width; i++)
        {
            for (j = 1; j <= this.height; j++)
            {
                p[this.getIndex(i, j)] = (div[this.getIndex(i, j)] +
                                           p[this.getIndex(i + 1, j)] -
                                           p[this.getIndex(i - 1, j)] +
                                           p[this.getIndex(i, j + 1)] -
                                           p[this.getIndex(i, j - 1)]) / 4;
            }
        }
        this.set_boundaries(0, p);
    }

    for (i = 1; i <= this.width; i++)
    {
        for (j = 1; j <= this.height; j++)
        {
            velocity_u[this.getIndex(i, j)] -= 0.5 * (p[this.getIndex(i + 1, j)] - p[this.getIndex(i - 1, j)]) / h;
            velocity_v[this.getIndex(i, j)] -= 0.5 * (p[this.getIndex(i, j + 1)] - p[this.getIndex(i, j - 1)]) / h;
        }
    }
    this.set_boundaries(1, velocity_u);
    this.set_boundaries(2, velocity_v);
};


/**
 *
 * @param {number} b
 * @param {number[]} field
 */
NavierStokes.NavierStokes.prototype.set_boundaries = function(b, field)
{
    //var i;
    //
    //for (i = 1; i <= this.width; i++)
    //{
    //    field[this.getIndex(i, 0)] = b == 1 ? -field[this.getIndex(i, 1)] : field[this.getIndex(i, 1)];
    //    field[this.getIndex(i, this.height + 1)] = b == 1 ? -field[this.getIndex(i, this.height)] :
    //        field[this.getIndex(i, this.height)];
    //}
    //
    //for (i = 1; i <= this.height; i++)
    //{
    //    field[this.getIndex(0, i)] = b == 1 ? -field[this.getIndex(1, i)] : field[this.getIndex(1, i)];
    //    field[this.getIndex(this.width + 1, i)] = b == 1 ? -field[this.getIndex(this.width, i)] :
    //        field[this.getIndex(this.width, i)];
    //}
    //
    //field[this.getIndex(0, 0)] = 0.5 * (field[this.getIndex(1, 0)] + field[this.getIndex(0, 1)]);
    //field[this.getIndex(0, this.height + 1)] = 0.5 *
    //    (field[this.getIndex(1, this.height + 1)] + field[this.getIndex(0, this.height)]);
    //field[this.getIndex(this.width + 1, 0)] = 0.5 *
    //    (field[this.getIndex(this.width, 0)] + field[this.getIndex(this.width + 1, 1)]);
    //field[this.getIndex(this.width + 1, this.height + 1)] = 0.5 *
    //    (field[this.getIndex(this.width, this.height + 1)] + field[this.getIndex(this.width + 1, this.height)]);
};