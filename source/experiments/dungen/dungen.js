'use strict';

var DunGen = (function()
{
    return {
        Zones: null
        , Tiles: null
        , Map: null
    };
}());

DunGen.Zones = {
    Void: 0
    , Open: 1
};

DunGen.Tiles = {
    Void: 0
    , Floor: 1
    , Wall: 2
    , Door: 3
};

DunGen.Map = function(width, height)
{
    var _width = width
        , _height = height
        , _zones = []
        , _tiles = []
        , i;

    this.__defineGetter__('Width', function()
    {
        return _width;
    });
    this.__defineGetter__('Height', function()
    {
        return _height;
    });
    this.__defineGetter__('MinRoomSize', function()
    {
        return [5, 5];
    });
    this.__defineGetter__('MaxRoomSize', function()
    {
        return [15, 15];
    });
    this.getZone = function(x, y)
    {
        return _zones[(y * _width) + x];
    };
    this.setZone = function(x, y, v)
    {
        if (x >= 0 && y >= 0 && x < _width && y < _height)
        {
            _zones[(y * _width) + x] = v;
        }
    };
    this.getTile = function(x, y)
    {
        return _tiles[(y * _width) + x];
    };
    this.setTile = function(x, y, v)
    {
        if (x >= 0 && y >= 0 && x < _width && y < _height)
        {
            _tiles[(y * _width) + x] = v;
        }
    };

    _zones = new Array(_width * _height);
    _tiles = new Array(_width * _height);
    for (i = 0; i < _width * _height; i++)
    {
        _zones[i] = DunGen.Zones.Void;
        _tiles[i] = DunGen.Tiles.Void;
    }
};

DunGen.Map.generatePieces_pieces = [
    // Square Room
    [   '####O####',
        '#.......#',
        '#.......#',
        '#.......#',
        'O.......O',
        '#.......#',
        '#.......#',
        '#.......#',
        '####O####'],
    // Hallway
    [   '#########',
        'O.......O',
        '#########'],
    // L Hallway
    [   '######',
        'O....#',
        '####.#',
        '   #.#',
        '   #.#',
        '   #O#'],
    // T Hallway
    [   '#########',
        'O.......O',
        '####.####',
        '   #.#   ',
        '   #.#   ',
        '   #O#   '],
    // + Hallway
    [   '   #O#   ',
        '   #.#   ',
        '   #.#   ',
        '####.####',
        'O.......O',
        '####.####',
        '   #.#   ',
        '   #.#   ',
        '   #O#   '],
    // L Room
    [   '####O####        ',
        '#.......#        ',
        '#.......#        ',
        '#.......#        ',
        'O.......O        ',
        '#.......#        ',
        '#.......#        ',
        '#.......#        ',
        '#.......####O####',
        '#...............#',
        '#...............#',
        '#...............#',
        'O...............O',
        '#...............#',
        '#...............#',
        '#...............#',
        '####O#######O####'],
    // Big Room
    [   '####O#######O####',
        '#...............#',
        '#...............#',
        '#...............#',
        'O...............O',
        '#...............#',
        '#...............#',
        '#...............#',
        '#...............#',
        '#...............#',
        '#...............#',
        '#...............#',
        'O...............O',
        '#...............#',
        '#...............#',
        '#...............#',
        '####O#######O####'],
    // Long Room
    [   '####O#######O####',
        '#...............#',
        '#...............#',
        '#...............#',
        'O...............O',
        '#...............#',
        '#...............#',
        '#...............#',
        '####O#######O####'],
];

DunGen.Map.prototype.generatePieces = function()
{
    var that = this;

    var can_place_piece = function(piece, x, y)
    {
        var x_len = piece.length + 1;
        var y_len = Math.max.apply(null, piece.map(function(x) { return x.length; }));

        if (x < 0 || y < 0 || (x + x_len + 2) >= that.Width || (y + y_len + 2) >= that.Height)
        {
            return false;
        }

        for (var j = 0; j < piece.length; j++)
        {
            var line = piece[j];
            for (var i = 0; i < line.length; i++)
            {
                if (that.getTile(x + i, y + j) === DunGen.Tiles.Floor && ['.', '#'].indexOf(line[i]) > -1)
                {
                    return false;
                }
            }
        }
        return true;
    };

    var get_piece_doors = function(piece, x, y)
    {
        var doors = [];
        for (var j = 0; j < piece.length; j++)
        {
            var line = piece[j];
            for (var i = 0; i < line.length; i++)
            {
                if (line[i] === 'O')
                {
                    doors.push([x + i, y + j]);
                }
            }
        }
        return doors;
    };

    var rotate_piece = function(piece)
    {
        var new_piece = [];
        var x_len = piece.length + 1;
        var y_len = Math.max.apply(null, piece.map(function(x) { return x.length; }));

        for (var j = 0; j < y_len; j++)
        {
            new_piece.push('');
            for (var i = 0; i < x_len; i++)
            {
                var y = piece.length - i;
                if (y < piece.length && j < piece[y].length)
                {
                    new_piece[j] += piece[y][j];
                }
            }
        }
        return new_piece;
    };

    var place_piece = function(piece, x, y)
    {
        for (var j = 0; j < piece.length; j++)
        {
            var line = piece[j];
            for (var i = 0; i < line.length; i++)
            {
                var tile = DunGen.Tiles.Void;
                if (line[i] === '.') { tile = DunGen.Tiles.Floor; }
                else if (line[i] === '#') { tile = DunGen.Tiles.Wall; }
                else if (line[i] === 'O') { tile = DunGen.Tiles.Door; }
                if (tile != DunGen.Tiles.Void)
                {
                    that.setTile(x + i, y + j, tile);
                }
            }
        }
    };

    var shuffle_array = function(array)
    {
        var shuffled_array = array.slice(0);
        var idx = shuffled_array.length;

        while (idx > 0)
        {
            var rand_idx = Math.floor(Math.random() * idx);
            idx--;

            var t = shuffled_array[idx];
            shuffled_array[idx] = shuffled_array[rand_idx];
            shuffled_array[rand_idx] = t;
        }

        return shuffled_array;
    };

    var start_piece = DunGen.Map.generatePieces_pieces[0];
    var start_x = Math.floor((this.Width / 2) - (DunGen.Map.generatePieces_pieces[0].length / 2));
    var start_y = Math.floor((this.Height / 2) - (DunGen.Map.generatePieces_pieces[0][0].length / 2));
    var available_doors = get_piece_doors(start_piece, start_x, start_y);
    var placed_doors = [];
    place_piece(start_piece, start_x, start_y);

    var tries = 0;
    while (true)
    {
        var piece = DunGen.Map.generatePieces_pieces[Math.floor(Math.random() * DunGen.Map.generatePieces_pieces.length)];
        for (var i = Math.floor(Math.random() * 3); i > 0; i--)
        {
            piece = rotate_piece(piece);
        }

        var piece_doors = shuffle_array(get_piece_doors(piece, 0, 0));
        available_doors = shuffle_array(available_doors);

        var placed = false;
        for (var i = 0; i < piece_doors.length; i++)
        {
            for (var j = 0; j < available_doors.length; j++)
            {
                var x = available_doors[j][0] - piece_doors[i][0];
                var y = available_doors[j][1] - piece_doors[i][1];
                if (can_place_piece(piece, x, y))
                {
                    piece_doors.splice(i, 1);
                    for (var k = 0; k < piece_doors.length; k++)
                    {
                        piece_doors[k][0] += x;
                        piece_doors[k][1] += y;
                    }
                    place_piece(piece, x, y);
                    placed_doors.push(available_doors[j]);
                    available_doors.splice(j, 1);
                    available_doors = available_doors.concat(piece_doors);
                    placed = true;
                    break;
                }
            }

            if (placed)
            {
                break;
            }
        }

        if (tries++ > (30 + (Math.random() * 30)))
        {
            break;
        }
    }

    for (var i = 0; i < available_doors.length; i++)
    {
        var x = available_doors[i][0];
        var y = available_doors[i][1];
        var remove = true;

        // Keep some matching doors
        for (var j = 0; j < available_doors.length; j++)
        {
            if (i != j && x === available_doors[j][0] && y === available_doors[j][1])
            {
                remove = Math.random() < 0.4;
                break;
            }
        }

        if (remove)
        {
            that.setTile(x, y, DunGen.Tiles.Wall);
        }
    }

    for (var i = 0; i < placed_doors.length; i++)
    {
        var x = placed_doors[i][0];
        var y = placed_doors[i][1];
        var remove = false;

        // Always remove hallways
        if (that.getTile(x - 1, y - 1) === DunGen.Tiles.Wall && that.getTile(x + 1, y - 1) === DunGen.Tiles.Wall &&
            that.getTile(x - 1, y + 1) === DunGen.Tiles.Wall && that.getTile(x + 1, y + 1) === DunGen.Tiles.Wall)
        {
            remove = true;
        }

        if (remove)
        {
            that.setTile(x, y, DunGen.Tiles.Floor);
        }
    }
};
