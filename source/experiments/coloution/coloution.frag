#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

varying lowp vec4 fragColor;

void main(void)
{
	gl_FragColor = fragColor;
}