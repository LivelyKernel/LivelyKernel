module('lively.CrayonColors').requires().toRun(function() {

Object.subclass('CrayonColors');
Object.extend(CrayonColors, {
	colorTableNames: function() {
		return ["cayenne asparagus clover teal midnight plum tin nickel",
			"mocha fern moss ocean eggplant maroon steel aluminum",
			"maraschino lemon spring turquoise blueberry magenta iron magnesium",
			"tangerine lime seafoam aqua grape strawberry tungsten silver",
			"salmon banana flora ice orchid bubblegum lead mercury",
			"cantaloupe honeydew spindrift sky lavender carnation licorice snow"]
	},
	colorNames: function() {
		return this.colorTableNames().join(' ').split(' ');
	},

	aluminum: new Color(0.662, 0.662, 0.662),
	aqua:  new Color(0.0, 0.556, 1.0),
	asparagus:  new Color(0.564, 0.584, 0.0),
	banana:  new Color(0.983, 1.0, 0.357),
	blueberry:  new Color(0.227, 0.0, 1.0),
	bubblegum:  new Color(1.0, 0.396, 1.0),
	cantaloupe:  new Color(1.0, 0.843, 0.4),
	carnation:  new Color(1.0, 0.458, 0.862),
	cayenne:  new Color(0.619, 0.0, 0.0),
	clover:  new Color(0.0, 0.591, 0.0),
	eggplant:  new Color(0.365, 0.0, 0.599),
	fern:  new Color(0.207, 0.591, 0.0),
	flora:  new Color(0.141, 1.0, 0.388),
	grape:  new Color(0.65, 0.0, 1.0),
	honeydew:  new Color(0.784, 1.0, 0.369),
	ice:  new Color(0.25, 1.0, 1.0),
	iron:  new Color(0.372, 0.369, 0.372),
	lavender:  new Color(0.897, 0.412, 1.0),
	lead:  new Color(0.129, 0.129, 0.129),
	lemon:  new Color(0.979, 1.0, 0.0),
	licorice:  new Color(0, 0, 0),
	lime:  new Color(0.384, 1.0, 0.0),
	magenta:  new Color(1.0, 0, 1.0),
	magnesium:  new Color(0.753, 0.753, 0.753),
	maraschino:  new Color(1.0, 0, 0),
	maroon:  new Color(0.619, 0.0, 0.321),
	mercury:  new Color(0.921, 0.921, 0.921),
	midnight:  new Color(0.113, 0.0, 0.599),
	mocha:  new Color(0.603, 0.309, 0.0),
	moss:  new Color(0.0, 0.591, 0.285),
	nickel:  new Color(0.572, 0.572, 0.572),
	ocean:  new Color(0.0, 0.309, 0.595),
	orchid:  new Color(0.513, 0.435, 1.0),
	plum:  new Color(0.627, 0.0, 0.595),
	salmon:  new Color(1.0, 0.439, 0.455),
	seafoam:  new Color(0.0, 1.0, 0.521),
	silver:  new Color(0.839, 0.839, 0.839),
	sky:  new Color(0.384, 0.839, 1.0),
	snow:  new Color(1.0, 1.0, 1.0),
	spindrift:  new Color(0.215, 1.0, 0.827),
	spring:  Color.green,
	steel:  new Color(0.474, 0.474, 0.474),
	strawberry:  new Color(1.0, 0.0, 0.58),
	tangerine:  new Color(1.0, 0.56, 0.0),
	teal:  new Color(0.0, 0.584, 0.58),
	tin:  new Color(0.568, 0.568, 0.568),
	tungsten:  new Color(0.258, 0.258, 0.258),
	turquoise:  new Color(0, 1.0, 1.0),
});


}) // end of module