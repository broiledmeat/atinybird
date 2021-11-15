/*
    /   /         |
   |   |          |    A Program Written In C
   |   |          |    By Nathaniel Staples
   |   |          |    And Shea McCombs
    \   \         |    Copyright 2009
*/

#include <stdlib.h>
#include <SDL.h>

#define WIDTH 320
#define HEIGHT 240

#define MUTATION_DEGREE 0.1
#define MUTATION_INT 256 * MUTATION_DEGREE

int randInt(int max);
void putPixel(SDL_Surface *surface, int x, int y, Uint32 pixel);
Uint32 *randomCells();

int main()
{
	SDL_Init(SDL_INIT_VIDEO);
	atexit(SDL_Quit);

	SDL_Surface *screen = SDL_SetVideoMode(WIDTH, HEIGHT, 24, SDL_HWSURFACE | SDL_DOUBLEBUF);
	SDL_Rect src = { 0, 1, WIDTH, HEIGHT - 1 };
	SDL_Event event;
	Uint32 *cells = randomCells();
	Uint32 *new_cells = malloc(WIDTH * sizeof(Uint32));
	short done = 0;
	int i, j;

	while (!done)
	{
		while (SDL_PollEvent(&event))
		{
			switch (event.type)
			{
				case SDL_KEYUP:
					switch (event.key.keysym.sym)
					{
						case SDLK_ESCAPE:
							done = 1;
							break;
					}
			}
		}

		SDL_BlitSurface(screen, &src, screen, NULL);
		
		for (i = 0; i < WIDTH; i++)
		{
			Uint32 new_cell, red, green, blue;
			Uint32 parents[3];
			int r;

			parents[0] = cells[i];
			if (i == 0)
			{
				if (randInt(10) > 5) parents[1] = cells[i];
					else parents[1] = cells[i + 1];
				parents[2] = cells[i + 1];
			}
			else if (i == WIDTH - 1)
			{
				if (randInt(10) > 5) parents[1] = cells[i];
					else parents[1] = cells[i - 1];
				parents[2] = cells[i - 1];
			}
			else
			{
				parents[1] = cells[i - 1];
				parents[2] = cells[i + 1];
			}

			for (j = 0; j < 3; j++)
			{
				r = randInt(3);
				short int shift = j * 8;
				Uint32 mask = 0xFF << shift;
				new_cell = (new_cell & ~mask) | (parents[r] & mask);
			}
			
			red = new_cell & 0x0000FF;
			green = (new_cell & 0x00FF00) >> 8;
			blue = (new_cell & 0xFF0000) >> 16;

			r = randInt(MUTATION_INT * 2) - MUTATION_INT;
					
			int channel_result;
			switch (randInt(3))
			{
				case 0:
					channel_result = red + r;
					if (channel_result < 0) red = 0;
						else if (channel_result > 255) red = 255;
						else red = channel_result;
				case 1:
					channel_result = green + r;
					if (channel_result < 0) green = 0;
						else if (channel_result > 255) green = 255;
						else green = channel_result;
				case 2:
					channel_result = blue + r;
					if (channel_result < 0) blue = 0;
						else if (channel_result > 255) blue = 255;
						else blue = channel_result;
			}

			new_cell = red | (green << 8) | (blue << 16);
			new_cells[i] = new_cell;
		}
		memcpy(cells, new_cells, WIDTH * sizeof(Uint32));

		for (i = 0; i < WIDTH; i++)
		{
			putPixel(screen, i, HEIGHT - 1, cells[i]);
		}

		SDL_Flip(screen);
	}
	return 0;
}

int randInt(int max)
{
	return rand() / (int)(((unsigned)RAND_MAX + 1) / max);
}

Uint32 *randomCells()
{
	Uint32 *cells = malloc(WIDTH * sizeof(Uint32));

	int i;
	for (i = 0; i < WIDTH; i++)
	{
		cells[i] = randInt(0xffffff);
	}

	return cells;
}

void putPixel(SDL_Surface *surface, int x, int y, Uint32 pixel)
{
	int bpp = surface->format->BytesPerPixel;
	Uint8 *p = (Uint8 *)surface->pixels + y * surface->pitch + x * bpp;
	switch (bpp)
	{
		case 1:
			*p = pixel;
			break;
		case 2:
			*(Uint16 *)p = pixel;
			break;
		case 3:
			if (SDL_BYTEORDER == SDL_BIG_ENDIAN)
			{
				p[0] = (pixel >> 16) & 0xff;
				p[1] = (pixel >> 8) & 0xff;
				p[2] = pixel & 0xff;
			}
			else
			{
				p[0] = pixel & 0xff;
				p[1] = (pixel >> 8) & 0xff;
				p[2] = (pixel >> 16) & 0xff;
			}
			break;
		case 4:
			*(Uint32 *)p = pixel;
			break;
	}
}
