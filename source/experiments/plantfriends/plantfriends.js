'use strict';
var // options
      spore_radius = 30
    , seed_radius = 20
    , audio_bank_count = 5
    , audio_enabled = false

    // consts
    , frequencies = [200, 225, 250, 300, 333.3]

    // display
    , width = 535
    , height = 400
    , interval = 10

    // globals
    , max_population = Math.floor(width * height * 0.004)
    , draw_id = null
    , ctx = null
    , stats_ctx = null
    , stats_counts = new Int32Array(64|0)
    , stats_frame = (interval / 2)|0
    , stats_frame_trigger = stats_frame
    , audio_ctx = null
    , audio_banks = []
    , plants = null
    , timer = null;

function Plant(x, y)
{
    this.tree_ref = null;
    this.x = x;
    this.y = y;
    this.age = 0.0;
    this.health = 1.0;
    this.hue = 0;
    this.neighbors = [];
}

Plant.prototype.colorStyle = function()
{
    return 'hsla(' + (this.hue|0) + ', 100%, 50%, ' + this.health + ')';
};

function Plants(width, height)
{
    this.tree = new QLeaf.QuadTree(width, height, 5, 15);

    this.addPlant = function(plant)
    {
        var i;

        plant.neighbors = this.tree.getInCircle(plant.x, plant.y, spore_radius);
        plant.tree_ref = this.tree.add(plant.x, plant.y, plant);

        for (i = 0; i < plant.neighbors.length; i++)
        {
            plant.neighbors[i].value.neighbors.push(plant.tree_ref);
        }

        i = ((plant.hue / 360) * stats_counts.length)|0;
        stats_counts[i]++;

    };
    
    this.removePlant = function(plant)
    {
        var   i
            , n;

        for (i = 0; i < plant.neighbors.length; i++)
        {
            n = plant.neighbors[i].value.neighbors;
            n.splice(n.indexOf(plant.tree_ref), 1);
        }

        i = ((plant.hue / 360) * stats_counts.length)|0;
        stats_counts[i]--;

        this.tree.remove(plant.tree_ref);
        plant = null;
    };
}

function init()
{
    var   i
        , plant
        , enable_audio_checkbox = document.getElementById('enable_audio');

    enable_audio_checkbox.onclick = function()
    {
        audio_enabled = enable_audio_checkbox.checked;
        if (audio_enabled)
        {
            create_audio_nodes();
        }
        else
        {
            destroy_audio_nodes();
        }
    };

    plants = new Plants(width, height);
    for (i = 0; i < max_population / 2; i++)
    {
        plant = new Plant(width * Math.random(), height * Math.random());
        plant.age = Math.random();
        plant.hue = Math.random() * 360;
        plants.addPlant(plant);
    }
    
    timer = setInterval(iterate, interval);
}

function iterate()
{
    var   i
        , elements
        , plant, other_plant, new_plant
        , hue, hue_x, hue_y
        , x, y;

    elements = plants.tree.getAll();

    for (i = 0; i < elements.length; i++)
    {
        plant = elements[i].value;
        plant.age += 0.0025;
        if (plant.age > 1.0)
        {
            plant.health -= 0.015 * Math.random();
            if (plant.health <= 0.0)
            {
                plants.removePlant(plant);
                continue;
            }
        }

        // Is the plant capable of spawning?
        if (plant.age > 0.7 && plant.health > 0.9 && plant.neighbors.length >= 2)
        {
            // Random check to spawn
            if (Math.random() > 0.985 + (0.015 * (plants.tree.element_count / max_population)))
            {
                // Get neighbor to spawn with
                other_plant = plant.neighbors[(plant.neighbors.length * Math.random())|0].value;

                // Mixed the plants and neighbors hue and mutate it
                hue_x = (Math.cos(plant.hue / 180.0 * Math.PI) + Math.cos(other_plant.hue / 180.0 * Math.PI)) / 2;
                hue_y = (Math.sin(plant.hue / 180.0 * Math.PI) + Math.sin(other_plant.hue / 180.0 * Math.PI)) / 2;
                hue = Math.atan2(hue_y, hue_x) * 180.0 / Math.PI;
                hue += ((0.1 * Math.random()) - 0.05) * 360.0;
                hue = mod(hue, 360.0);

                // Find a location for the new plant
                x = plant.x + ((seed_radius * Math.random()) - (seed_radius / 2));
                y = plant.y + ((seed_radius * Math.random()) - (seed_radius / 2));
                x = mod(x, width);
                y = mod(y, height);

                // Make the new plant
                new_plant = new Plant(x, y);
                new_plant.hue = hue;
                plants.addPlant(new_plant);

                if (audio_enabled)
                {
                    // Play audio for the new plant
                    var nodes = get_audio_nodes();
                    if (nodes != null)
                    {
                        var   oscillator = nodes[0]
                            , gain = nodes[1]
                            , fade = 0.5
                            , duration = 2 + (Math.random() * 2);

                        var octave = 1 + (((Math.abs(180 - hue) / 180) * 5) | 0);
                        var frequency = frequencies[((hue % 10) / frequencies.length) | 0];
                        oscillator.frequency.value = frequency * octave;

                        gain.gain.value = 0.001;
                        gain.gain.linearRampToValueAtTime(0.05, audio_ctx.currentTime + fade);
                        gain.gain.linearRampToValueAtTime(0.05, audio_ctx.currentTime + fade + duration);
                        gain.gain.linearRampToValueAtTime(0, audio_ctx.currentTime + fade + duration + fade);
                    }
                }
            }
        }
    }

    if (draw_id == null)
    {
        draw_id = requestAnimationFrame(draw);
    }
}

function draw()
{
    var   i
        , plant, elements
        , size
        , y
        , w, h;

    ctx.fillStyle = 'hsl(0, 0%, 5%)';
    ctx.fillRect(0, 0, width, height);

    elements = plants.tree.getAll();
    for (i = 0; i < elements.length; i++) {
        plant = elements[i].value;

        size = 1;
        if (plant.age < 1.0)
        {
            size *= 3 * plant.age;
        }
        else
        {
            size *= 3;
        }
        size *= 0.85 + (0.15 * plant.health);

        ctx.fillStyle = plant.colorStyle();
//        ctx.fillRect(plant.x, plant.y, size, size);
        ctx.beginPath();
        ctx.arc(plant.x, plant.y, size, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
    }

    // Stats
    if (stats_ctx != null)
    {
        stats_frame++;
        if (stats_frame >= stats_frame_trigger)
        {
            stats_frame = 0;

            var   chunk = 0
                , max = (elements.length / stats_counts.length) * 1.1;

            for (i = 0; i < stats_counts.length; i++)
            {
                max = Math.max(max + 0.025, stats_counts[i]);
            }

            w = stats_ctx.canvas.width;
            h = stats_ctx.canvas.height;
            stats_ctx.fillStyle = 'hsl(0, 0%, 5%)';
            stats_ctx.fillRect(0, 0, w, h);

            for (i = 0; i < w; i++)
            {
                chunk = ((i / w) * stats_counts.length)|0;
                y = (h - ((stats_counts[chunk] / max) * h))|0;
                stats_ctx.fillStyle = 'hsl(' + ((i / stats_ctx.canvas.width) * 360) + ', 100%, 40%)';
                stats_ctx.fillRect(i, y, 1, 1);
                stats_ctx.fillStyle = 'hsl(' + ((i / stats_ctx.canvas.width) * 360) + ', 25%, 30%)';
                stats_ctx.fillRect(i, y + 1, 1, h - y);
            }
        }
    }

    draw_id = null;
}

function mod(dividend, divisor)
{
    var mod = dividend % divisor;
    if (mod < 0)
    {
        mod = divisor + dividend;
    }
    return mod;
}

function get_audio_nodes()
{
    var   i;

    for (i = 0; i < audio_banks.length; i++)
    {
        if (audio_banks[i][1].gain.value == 0)
        {
            return audio_banks[i];
        }
    }

    return null;
}

function create_audio_nodes()
{
    var i, gain, oscillator;

    audio_ctx = new (window.AudioContext||window.webkitAudioContext);

    for (i = audio_banks.length; i < audio_bank_count; i++)
    {
        gain = audio_ctx.createGain();
        gain.connect(audio_ctx.destination);
        gain.gain.value = 0;

        oscillator = audio_ctx.createOscillator();
        oscillator.connect(gain);
        oscillator.start(0);

        audio_banks.push([oscillator, gain]);
    }
}

function destroy_audio_nodes()
{
    var   i;

    for (i = 0; i < audio_banks.length; i++)
    {
        audio_banks[i][0].disconnect(audio_banks[i][1]);
        audio_banks[i][0].stop(0);
        audio_banks[i][1].disconnect(audio_ctx.destination);
    }

    audio_banks = [];
    audio_ctx = null;
}
