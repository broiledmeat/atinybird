#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

attribute vec3 vertPosition;
attribute vec4 vertColor;
varying lowp vec4 fragColor;

void main(void)
{
	gl_Position = vec4(vertPosition, 1.0);
	fragColor = vertColor;
}