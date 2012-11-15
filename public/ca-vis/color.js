/*
 * Represents a color.  You'd think that a library for this would already exist
 * -- and you'd be right.  There's a jQuery library for dealing with colors that
 * can convert between HSV and RGB and parse CSS color names.  Unfortunately, it
 * uses the same jQuery field ($.color) as a different implementation with an
 * incompatible interface that flot bundles and uses, so we can't use it here.
 * Thanks for nothing, client-side Javascript, jQuery, and flot, whose namespace
 * decisions have brought us here.
 *
 * The HSV <-> RGB conversion routines are ported from the implementations by
 * Eugene Vishnevsky:
 *
 *   http://www.cs.rit.edu/~ncs/color/t_convert.html
 */
function gColor()
{
	var rgb, space;

	if (arguments.length === 1) {
		this.css = arguments[0];
		rgb = d3.rgb(this.css);
		this.rgb = [ rgb.r, rgb.g, rgb.b ];
		return;
	}

	switch (arguments[1]) {
	case 'rgb':
	case 'hsv':
		space = arguments[1];
		break;
	default:
		throw ('unsupported color space: ' + arguments[1]);
	}

	this[space] = arguments[0];
}

gColor.prototype.hue = function ()
{
	if (!this.hsv)
		this.rgbToHsv();

	return (this.hsv[0]);
};

gColor.prototype.saturation = function ()
{
	if (!this.hsv)
		this.rgbToHsv();

	return (this.hsv[1]);
};

gColor.prototype.value = function ()
{
	if (!this.hsv)
		this.rgbToHsv();

	return (this.hsv[2]);
};

gColor.prototype.rgbToHsv = function ()
{
	var r = this.rgb[0], g = this.rgb[1], b = this.rgb[2];
	var min, max, delta;
	var h, s, v;

	r /= 255;
	g /= 255;
	b /= 255;

	min = Math.min(r, g, b);
	max = Math.max(r, g, b);
	v = max;

	delta = max - min;

	if (max === 0) {
		s = 0;
		h = 0;
	} else {
		s = delta / max;

		if (r == max)
			h = (g - b) / delta;
		else if (g == max)
			h = 2 + (b - r) / delta;
		else
			h = 4 + (r - g) / delta;

		h *= 60;

		if (h < 0)
			h += 360;
	}

	this.hsv = [ h, s, v ];
};

gColor.prototype.hsvToRgb = function ()
{
	/*
	 * Convert from HSV to RGB.  Ported from the Java implementation by
	 * Eugene Vishnevsky:
	 *
	 *   http://www.cs.rit.edu/~ncs/color/t_convert.html
	 */
	var h = this.hsv[0], s = this.hsv[1], v = this.hsv[2];
	var r, g, b;
	var i;
	var f, p, q, t;

	if (s === 0) {
		/*
		 * A saturation of 0.0 is achromatic (grey).
		 */
		r = g = b = v;

		this.rgb = [ Math.round(r * 255), Math.round(g * 255),
		    Math.round(b * 255) ];
		return;
	}

	h /= 60; // sector 0 to 5

	i = Math.floor(h);
	f = h - i; // fractional part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));

	switch (i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;

		case 1:
			r = q;
			g = v;
			b = p;
			break;

		case 2:
			r = p;
			g = v;
			b = t;
			break;

		case 3:
			r = p;
			g = q;
			b = v;
			break;

		case 4:
			r = t;
			g = p;
			b = v;
			break;

		default: // case 5:
			r = v;
			g = p;
			b = q;
			break;
	}

	this.rgb = [ Math.round(r * 255),
	    Math.round(g * 255), Math.round(b * 255)];
};

gColor.prototype.css = function ()
{
	if (!this.rgb)
		this.hsvToRgb();

	return ('rgb(' + this.rgb.join(', ') + ')');
};

gColor.prototype.toString = function ()
{
	return (this.css());
};

// Joyent branding colors.
var oranges = ['#FEC1A0','#FE9359','#FD651B', '#B24710', '#652806'];
var coolGreys = ['#edebea','#d0cecc','#b9b7b4','#979592','#5c5954'];
var browns = ['#c3bdb3','#968b79','#695a40','#493e2d','#29231a'];
var moreBrowns = ['#e6e3d5','#d3cfb5','#c1ba95','#878369','#4d4a3c'];
var blues = ['#b5cad5','#7da2b5','#467b96','#305669','#1c313c'];
var blueGreys = ['#a3aaad','#5e6970','#182a33','#121d23','#0a1014'];

var gColors = [];
var gBaseColors = [ '#edc240', '#afd8f8', '#cb4b4b', '#4da74d', '#9440ed' ];
var gMaxSeries;

/*
 * Expand the base set of colors using simple variations.
 */
function gInitColors() {
	var ii, jj, base, color, saturation;
	var saturations = [ 1.0, 0.5 ];

	for (ii = 0; ii < saturations.length; ii++) {
		for (jj = 0; jj < gBaseColors.length; jj++) {
			base = new gColor(gBaseColors[jj]);
			saturation = base.saturation() * saturations[ii];
			color = new gColor(
			    [ base.hue(), saturation, base.value() ], 'hsv');
			gColors.push(color);
		}
	}

	gMaxSeries = gColors.length - 1;
}
