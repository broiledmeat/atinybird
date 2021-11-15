'use strict';

/**
 * @fileOverview libQLeaf JavaScript quadtree implementation
 * @author Derrick Staples (broiledmeat ENRAGED gmail LOBSTER com)
 * @version 0.6
 */

/** @namespace */
var QLeaf = (function()
{
    /** @scope QLeaf */
    return {
        /**
         * Container class for values stored within the tree.
         * @class
         * @property {QLeaf.TreeNode} parent
         * @property {number} x
         * @property {number} y
         * @property value
         * @param {number} x
         * @param {number} y
         * @param value
         */
        TreeElement: function(x, y, value)
        {
            this.id = null;
            this.parent = null;
            this.x = x;
            this.y = y;
            this.value = value;
        },
    
        /**
         * Container class for stored elements or other nodes.
         * @class
         * @property {QLeaf.TreeNode} parent
         * @property {QLeaf.TreeElement[]} elements
         * @property {QLeaf.TreeNode[]} nodes
         * @property {number} x
         * @property {number} y
         * @property {number} width
         * @property {number} height
         * @property {number} depth
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         */
        TreeNode: function(x, y, width, height)
        {
            this.id = null;
            this.parent = null;
            this.elements = null;
            this.nodes = null;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.depth = 0;
        },
        
        /**
         * Describes a line and allows clipping to a rectangle.
         * @class
         * @private√
         * @property {number} ax X coordinate for the start point.
         * @property {number} ay Y coordinate for the start point.
         * @property {number} bx X coordinate for the end point.
         * @property {number} by Y coordinate for the end point.
         * @property {number} tMin Temporary value for clipping the start point.
         * @property {number} tMax Temporary value for clipping the end point.
         * @param {number} ax
         * @param {number} ay
         * @param {number} bx
         * @param {number} by
         */
        ClipLine: function(ax, ay, bx, by)
        {
            this.ax = ax; this.ay = ay;
            this.bx = bx; this.by = by;
            this.px = bx - ax; this.py = by - ay;
            this.tMin = 0; this.tMax = 1;
        },
    
        /**
         * QuadTree value store
         * @class
         * @property {QLeaf.TreeNode} root Root node of the tree
         * @property {number} max_elements_per_node Maximum elements per node before subdivision.
         * @property {number} max_tree_depth Maximum allowed node depth in the tree.
         * @property {number} element_count Total number of elements contained in the tree.
         * @property {number} node_count Total number of nodes contained in the tree.
         * @param {number} width
         * @param {number} height
         * @param {number} [max_elements_per_node=5]
         * @param {number} [max_tree_depth=15]
         */
        QuadTree: function(width, height, max_elements_per_node, max_tree_depth)
        {
            this.root = new QLeaf.TreeNode(0, 0,
                                           ((width !== undefined) ? width : 1),
                                           ((height !== undefined) ? width : 1));
            this.max_elements_per_node = ((max_elements_per_node !== undefined) ? max_elements_per_node : 5);
            this.max_tree_depth = ((max_tree_depth !== undefined) ? max_tree_depth : 15);
            this.element_count = 0;
            this.node_count = 0;
        }
    };
}());

/**
 * Adjusts tMin and tMax as necessary.
 * @param {number} p Projection value.
 * @param {number} d Distance value.
 */
QLeaf.ClipLine.prototype.checkClip = function(p, d)
{
    var a;

    if (p === 0)
    {
        if (d < 0)
        {
            return false;
        }
    }
    else
    {
        a = d / p;
        if (p < 0)
        {
            if (a > this.tMax)
            {
                return false;
            }
            else if (a > this.tMin)
            {
                this.tMin = a;
            }
        }
        else
        {
            if (a < this.tMin)
            {
                return false;
            }
            else if (a < this.tMax)
            {
                this.tMax = a;
            }
        }
    }

    return true;
};

/**
 * Test if the line intersects the described rectangle.
 * @param {number} ax Left edge position of the rectangle.
 * @param {number} ay Top edge position of the rectangle.
 * @param {number} bx Right edge position of the rectangle.
 * @param {number} by Bottom edge position of the rectangle.
 * @returns {Boolean}
 */
QLeaf.ClipLine.prototype.clipsRect = function(ax, ay, bx, by)
{
    // Use the Liang-Barsky algorithm to check if the line intersects
    // any point of a rectangle.
    if (this.checkClip(-this.px, this.ax - ax))
    {
        if (this.checkClip(this.px, bx - this.bx))
        {
            if (this.checkClip(-this.py, this.ay - ay))
            {
                if (this.checkClip(this.py, by - this.by))
                {
                    return true;
                }
            }
        }
    }

    return false;
};

/*
 * Count all elements in a node
 * @param {TreeNode} node
 * @return {number}
 */
QLeaf.QuadTree.prototype.countElements = function(node)
{
    var   i
        , count = 0;
    
    // Starting from the node specified by the node_id, recurse down
    // its children and count all elements.
    if (node.elements !== null)
    {
        count += node.elements.length;
    }
    if (node.nodes !== null)
    {
        for (i = 0; i < node.nodes.length; i++)
        {
            count += this.countElements(node.nodes[i]);
        }
    }

    return count;
};

/**
 * Splits a node, creating child nodes and distributing the nodes elements
 * amongst the children.
 * @param {QLeaf.TreeNode} node
 */
QLeaf.QuadTree.prototype.subdivideNode = function(node)
{
    var   i, p
        , w, h
        , rx, ry
        , nodeTL, nodeTR
        , nodeBR, nodeBL
        , element
        , newNode;

    // Divide a node in to four child nodes, moving all of its
    // elements in to the appropriate child nodes.
    w = node.width / 2;
    h = node.height / 2;
    rx = node.x + w;
    ry = node.y + h;
    if (node.nodes === null)
    {
        nodeTL = new QLeaf.TreeNode(node.x, node.y, w, h);
        nodeTR = new QLeaf.TreeNode(rx,     node.y, w, h);
        nodeBR = new QLeaf.TreeNode(rx,     ry,     w, h);
        nodeBL = new QLeaf.TreeNode(node.x, ry,     w, h);
        nodeTL.parent = node; nodeTR.parent = node;
        nodeBL.parent = node; nodeBR.parent = node;
        nodeTL.depth = node.depth + 1; nodeTR.depth = node.depth + 1;
        nodeBL.depth = node.depth + 1; nodeBR.depth = node.depth + 1;
        node.nodes = [nodeTL, nodeTR, nodeBR, nodeBL];
        this.node_count += 4;
    }
    for (i = 0; i < node.elements.length; i++)
    {
        element = node.elements[i];
        p = 0;
        if (element.y < ry)
        {
            if (element.x >= rx)
            {
                p = 1;
            }
        }
        else
        {
            p = 3;
            if (element.x >= rx)
            {
                p = 2;
            }
        }
        
        newNode = node.nodes[p];
        if (newNode.elements === null)
        {
            newNode.elements = [];
        }
        element.parent = newNode;
        newNode.elements.push(element);
    }

    node.elements = null;
    
    // Check if any subnodes still have more than the maximum allowed
    // elements within them. If so, subdivide them as well.
    for (i = 0; i < node.nodes.length; i++)
    {
        if (node.nodes[i].elements !== null && node.nodes[i].elements.length > this.max_elements)
        {
            this.subdivideNode(node.nodes[i]);
        }
    }
};

/**
 * Move all elements that reside under a node and its child nodes, in to
 * the node, and delete all of its child nodes.
 * @param {QLeaf.TreeNode} node
 */
QLeaf.QuadTree.prototype.unifyNode = function(node)
{
    var   i, j
        , subnode
        , element;

    // Bring all elements inside a node (including its child nodes,)
    // and bring them in to the node, destroying any child nodes in
    // the process.
    if (node.elements === null)
    {
        node.elements = [];
    }
    if (node.nodes !== null)
    {
        for (i = 0; i < node.nodes.length; i++)
        {
            subnode = node.nodes[i];
            this.unifyNode(subnode);
            if (subnode.elements !== null)
            {
                for (j = 0; j < subnode.elements.length; j++)
                {
                    element = subnode.elements[j];
                    element.parent = node;
                    node.elements.push(element);
                }
            }
            delete node.nodes[i];
            this.node_count--;
        }
    }
    node.nodes = null;
};

/**
 * Wraps a value in a TreeElement class, and inserts it in to the tree.
 * @param {number} x
 * @param {number} y
 * @param value
 * @return {QLeaf.TreeElement}
 */
QLeaf.QuadTree.prototype.add = function(x, y, value)
{
    var   node
        , element
        , rw, rh
        , rx, ry
        , p;
    
    // Adds a new element to the quadtree.
    node = this.root;
    element = new QLeaf.TreeElement(x, y, value);
    rw = node.width;
    rh = node.height;
    rx = x;
    ry = y;
    while (1)
    {
        // Starting from the root node, drill down the tree until
        // a node with no child nodes is found.
        if (node.nodes === null)
        {
            if (node.elements === null)
            {
                node.elements = [];
            }
            // Add the element to the node
            element.parent = node;
            node.elements.push(element);
            break;
        }
        else
        {
            p = 0;
            if (ry < rh / 2)
            {
                if (rx >= rw / 2)
                {
                    p = 1;
                }
            }
            else
            {
                p = 3;
                if (rx >= rw / 2)
                {
                    p = 2;
                }
            }
            rw /= 2;
            rh /= 2;
            if (rx >= rw)
            {
                rx = rx % rw;
            }
            if (ry >= rh)
            {
                ry = ry % rh;
            }
            node = node.nodes[p];
        }
    }
    // Subdivide the node if it exceeds the maximum number of elements.
    if (node.elements.length > this.max_elements_per_node && node.depth < this.max_tree_depth)
    {
        this.subdivideNode(node);
    }
    this.element_count++;

    return element;
};

/**
 * Removes an element from the tree.
 * @param {QLeaf.TreeElement} element
 */
QLeaf.QuadTree.prototype.remove = function(element)
{
    var   i
        , node;

    // Remove an element, unifying nodes on up the tree as needed.
    node = element.parent;
    for (i = 0; i < node.elements.length; i++)
    {
        if (node.elements[i] === element)
        {
            node.elements.splice(i, 1);
            break;
        }
    }
    element = null;
    this.element_count--;

    if (node.parent !== null)
    {
        node = node.parent;
        while (1)
        {
            if (this.countElements(node) <= this.max_elements_per_node)
            {
                this.unifyNode(node);
                node = node.parent;
                if (node === null)
                {
                    break;
                }
            }
            else
            {
                break;
            }
        }
    }
};

/**
 * Find all elements in a node and its child nodes.
 * @param {QLeaf.TreeNode} [node=QLeaf.QuadTree.root]
 * @return {QLeaf.TreeElement[]}
 */
QLeaf.QuadTree.prototype.getInNode = function(node) {
    var i
        , values;

    // Return an array of element node IDs that reside in a node and
    // its child nodes.
    if (node === undefined) {
        node = this.root;
    }
    values = [];
    if (node.elements !== null)
    {
        values = values.concat(node.elements);
    }
    if (node.nodes !== null)
    {
        for (i = 0; i < node.nodes.length; i++)
        {
            values = values.concat(this.getInNode(node.nodes[i]));
        }
    }

    return values;
};

/**
 * Find all elements in the tree.
 * @return {QLeaf.TreeElement[]}
 */
QLeaf.QuadTree.prototype.getAll = function()
{
    return this.getInNode(this.root);
};

/**
 * Find all elements that lie within a given circle.
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {QLeaf.TreeNode} [node=QLeaf.QuadTree.root]
 * @return {QLeaf.TreeElement[]}
 */
QLeaf.QuadTree.prototype.getInCircle = function(x, y, radius, node)
{
    var   i
        , minDist
        , nx, ny
        , elements, element;

    // Returns an array of element IDs that are in range of the
    // coordinate specified.
    if (node === undefined) { node = this.root; }

    minDist = Math.pow(radius, 2);

    if (x < node.x || x > node.x + node.width || y < node.y || y > node.y + node.height)
    {
        // If the epicenter of the search radius is outside the
        // current node, find the closest point on the edge of
        // the node to the epicenter.
        nx = x;
        ny = y;
        if (nx < node.x) { nx = node.x; }
            else if (nx > node.x + node.width) { nx = node.x + node.width; }
        if (ny < node.y) { ny = node.y; }
            else if (ny > node.y + node.height) { ny = node.y + node.height; }
        // If the closest point is out of range, return with an
        // empty array.
        if (Math.pow(y - ny, 2) + Math.pow(x - nx, 2) > minDist) { return []; }
    }
    // Find the furthest point on the edge of the node from the
    // epicenter.
    nx = node.x;
    ny = node.y;
    if (x < node.x + (node.width / 2)) { nx = node.x + node.width; }
    if (y < node.y + (node.height / 2)) { ny = node.y + node.height; }
    // If that point is within range, return all elements in the node
    // and its child nodes.
    if (Math.pow(nx - x, 2) + Math.pow(ny - y, 2) <= minDist)
    {
        return this.getInNode(node);
    }
    else
    {
        // The range is somewhat covering the current node, so we
        // have to drill down in to its child nodes, or check
        // individual elements within it.
        elements = [];
        if (node.elements !== null)
        {
            for (i = 0; i < node.elements.length; i++)
            {
                element = node.elements[i];
                if (Math.pow(element.x - x, 2) + Math.pow(element.y - y, 2) <= minDist) { elements.push(element); }
            }
        }
        if (node.nodes !== null)
        {
            for (i = 0; i < node.nodes.length; i++)
            {
                elements = elements.concat(this.getInCircle(x, y, radius, node.nodes[i]));
            }
        }
        return elements;
    }
};

/**
 * Find all elements that lie within a given 90 degree rectangle.
 * @param {number} ax Left edge position of rectangle
 * @param {number} ay Top edge position of rectangle
 * @param {number} bx Right edge position of rectangle
 * @param {number} by Bottom edge position of rectangle
 * @param {QLeaf.TreeNode} [node=QLeaf.QuadTree.root]
 * @return {QLeaf.TreeElement[]}
 */
QLeaf.QuadTree.prototype.getInRectangle = function(ax, ay, bx, by, node)
{
    var   i
        , ex, ey
        , tx, ty
        , contCount
        , element
        , elements;

    // Returns an array of element IDs that are within the triangle
    // specified by the given coordinates.
    if (node === undefined) { node = this.root; }

    if (ax > bx) { tx = ax; ax = bx; bx = tx; }
    if (ay > by) { ty = ay; ay = by; by = ty; }

    ex = node.x + node.width;
    ey = node.y + node.height;

    // Get a count of how many of the 4 corners of the node are inside
    // the rectangle.
    contCount =
        (node.x >= ax && node.x < bx && node.y >= ay && node.y < by) +
        (ex >= ax && ex < bx && node.y >= ay && node.y < by) +
        (node.x >= ax && node.x < bx && ey >= ay && ey < by) +
        (ex >= ax && ex < bx && ey >= ay && ey < by);

    // If all corners are inside, we know that all elements in the
    // node will be as well.
    if (contCount === 4) { return this.getInNode(node); }
    // If no corners are inside, test if the rectangle is completely
    // outside of the node. Return an empty array if so.
    if (contCount === 0 && (ax > ex || bx < node.x || ay > ey || by < node.y)) { return []; }

    elements = [];
    // Check all elements in the current node, and add them to the
    // list of element IDs to return if they are within the rectangle.
    if (node.elements !== null)
    {
        for (i = 0; i < node.elements.length; i++)
        {
            element = node.elements[i];
            if (element.x >= ax && element.x < bx && element.y >= ay && element.y < by) { elements.push(element); }
        }
    }
    // Recurse down all the nodes child nodes.
    if (node.nodes !== null)
    {
        for (i = 0; i < node.nodes.length; i++)
        {
            elements = elements.concat(this.getInRectangle(ax, ay, bx, by, node.nodes[i]));
        }
    }

    return elements;
};

/**
 * Find all elements that lie within a given triangle.
 * @param {number} ax X position of triangle point A
 * @param {number} ay Y position of triangle point A
 * @param {number} bx X position of triangle point B
 * @param {number} by Y position of triangle point B
 * @param {number} cx X position of triangle point C
 * @param {number} cy Y position of triangle point C
 * @param {QLeaf.TreeNode} [node=QLeaf.QuadTree.node]
 * @return {QLeaf.TreeElement[]}
 */
QLeaf.QuadTree.prototype.getInTriangle = function(ax, ay, bx, by, cx, cy, node)
{
    var   i
        , sx, sy
        , ex, ey
        , v0, v1, v2
        , dot00, dot01, dot11, dot02, dot12
        , invDenom
        , contCount
        , v, u
        , elements, element;
    
    // Returns an array of element IDs that are within the triangle
    // specified by the given coordinates. This is pretty grotesque.
    // A lot of nice little helper functions have been obliterated for
    // the sake of speed.
    if (node === undefined) { node = this.root; }

    sx = node.x;
    sy = node.y;
    ex = node.x + node.width;
    ey = node.y + node.height;

    v0 = [cx - ax, cy - ay];
    v1 = [bx - ax, by - ay];
    dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
    dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
    dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
    invDenom = 1 / ((dot00 * dot11) - (dot01 * dot01));

    // Get a count of how many of the 4 corners of the node are inside
    // the triangle.
    contCount = 0;
    
        // top left
        v2 = [sx - ax, sy - ay];
        dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);
        u = ((dot11 * dot02) - (dot01 * dot12)) * invDenom;
        v = ((dot00 * dot12) - (dot01 * dot02)) * invDenom;
        if (u > 0 && v > 0 && u + v < 1) { contCount++; }

        // top right
        v2 = [ex - ax, sy - ay];
        dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);
        u = ((dot11 * dot02) - (dot01 * dot12)) * invDenom;
        v = ((dot00 * dot12) - (dot01 * dot02)) * invDenom;
        if (u > 0 && v > 0 && u + v < 1) { contCount++; }

        // bottom left
        v2 = [sx - ax, ey - ay];
        dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);
        u = ((dot11 * dot02) - (dot01 * dot12)) * invDenom;
        v = ((dot00 * dot12) - (dot01 * dot02)) * invDenom;
        if (u > 0 && v > 0 && u + v < 1) { contCount++; }

        // bottom right
        v2 = [ex - ax, ey - ay];
        dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);
        u = ((dot11 * dot02) - (dot01 * dot12)) * invDenom;
        v = ((dot00 * dot12) - (dot01 * dot02)) * invDenom;
        if (u > 0 && v > 0 && u + v < 1) { contCount++; }
    

    // If all corners are inside, we know that all elements in the
    // node will be as well.
    if (contCount === 4) { return this.getInNode(node); }

    // If no corners are inside, check if any of the triangle corners
    // are within the node. If not, check if the three edges of the
    // triangle intersect the node. If all of these fails, return an
    // empty array.
    if (
        contCount === 0 &&
        !(ax >= sx && ax < ex && ay >= sy && ay < ey) &&
        !(bx >= sx && bx < ex && by >= sy && by < ey) &&
        !(cx >= sx && cx < ex && cy >= sy && cy < ey) &&
        !(new QLeaf.ClipLine(ax, ay, bx, by).clipsRect(sx, sy, ex, ey)) &&
        !(new QLeaf.ClipLine(bx, by, cx, cy).clipsRect(sx, sy, ex, ey)) &&
        !(new QLeaf.ClipLine(cx, cy, ax, ay).clipsRect(sx, sy, ex, ey)))
    {
        return [];
    }

    elements = [];
    // Check all elements in the current node, and add them to the
    // list of element IDs to return if they are within the triangle.
    if (node.elements !== null)
    {
        for (i = 0; i < node.elements.length; i++)
        {
            element = node.elements[i];
            v2 = [element.x - ax, element.y - ay];
            dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
            dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);
            u = ((dot11 * dot02) - (dot01 * dot12)) * invDenom;
            v = ((dot00 * dot12) - (dot01 * dot02)) * invDenom;
            if (u > 0 && v > 0 && u + v < 1) { elements.push(element); }
        }
    }

    // Recurse down all the nodes child nodes.
    if (node.nodes !== null)
    {
        for (i = 0; i < node.nodes.length; i++)
        {
            elements = elements.concat(this.getInTriangle(ax, ay, bx, by, cx, cy, node.nodes[i]));
        }
    }

    return elements;
};
