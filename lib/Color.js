// http://upshots.org/javascript/javascript-color-class

(function(){

	var Events = {
		RGB_UPDATED : 'RGBUpdated',
		HSL_UPDATED : 'HSLUpdated',
		HSV_UPDATED : 'HSVUpdated',
		HEX_UPDATED : 'HexUpdated',
		INT_UPDATED : 'IntUpdated',
		UPDATED : 'updated'
	};

	var namedColors = {
		'transparent':'rgba(0, 0, 0, 0)','aliceblue':'#F0F8FF','antiquewhite':'#FAEBD7','aqua':'#00FFFF','aquamarine':'#7FFFD4',
		'azure':'#F0FFFF','beige':'#F5F5DC','bisque':'#FFE4C4','black':'#000000','blanchedalmond':'#FFEBCD','blue':'#0000FF','blueviolet':'#8A2BE2',
		'brown':'#A52A2A','burlywood':'#DEB887','cadetblue':'#5F9EA0','chartreuse':'#7FFF00','chocolate':'#D2691E','coral':'#FF7F50',
		'cornflowerblue':'#6495ED','cornsilk':'#FFF8DC','crimson':'#DC143C','cyan':'#00FFFF','darkblue':'#00008B','darkcyan':'#008B8B','darkgoldenrod':'#B8860B',
		'darkgray':'#A9A9A9','darkgrey':'#A9A9A9','darkgreen':'#006400','darkkhaki':'#BDB76B','darkmagenta':'#8B008B','darkolivegreen':'#556B2F',
		'darkorange':'#FF8C00','darkorchid':'#9932CC','darkred':'#8B0000','darksalmon':'#E9967A','darkseagreen':'#8FBC8F','darkslateblue':'#483D8B',
		'darkslategray':'#2F4F4F','darkslategrey':'#2F4F4F','darkturquoise':'#00CED1','darkviolet':'#9400D3','deeppink':'#FF1493','deepskyblue':'#00BFFF',
		'dimgray':'#696969','dimgrey':'#696969','dodgerblue':'#1E90FF','firebrick':'#B22222','floralwhite':'#FFFAF0','forestgreen':'#228B22',
		'fuchsia':'#FF00FF','gainsboro':'#DCDCDC','ghostwhite':'#F8F8FF','gold':'#FFD700','goldenrod':'#DAA520','gray':'#808080','grey':'#808080',
		'green':'#008000','greenyellow':'#ADFF2F','honeydew':'#F0FFF0','hotpink':'#FF69B4','indianred':'#CD5C5C','indigo':'#4B0082','ivory':'#FFFFF0',
		'khaki':'#F0E68C','lavender':'#E6E6FA','lavenderblush':'#FFF0F5','lawngreen':'#7CFC00','lemonchiffon':'#FFFACD','lightblue':'#ADD8E6',
		'lightcoral':'#F08080','lightcyan':'#E0FFFF','lightgoldenrodyellow':'#FAFAD2','lightgray':'#D3D3D3','lightgrey':'#D3D3D3','lightgreen':'#90EE90',
		'lightpink':'#FFB6C1','lightsalmon':'#FFA07A','lightseagreen':'#20B2AA','lightskyblue':'#87CEFA','lightslategray':'#778899',
		'lightslategrey':'#778899','lightsteelblue':'#B0C4DE','lightyellow':'#FFFFE0','lime':'#00FF00','limegreen':'#32CD32','linen':'#FAF0E6',
		'magenta':'#FF00FF','maroon':'#800000','mediumaquamarine':'#66CDAA','mediumblue':'#0000CD','mediumorchid':'#BA55D3','mediumpurple':'#9370D8',
		'mediumseagreen':'#3CB371','mediumslateblue':'#7B68EE','mediumspringgreen':'#00FA9A','mediumturquoise':'#48D1CC','mediumvioletred':'#C71585',
		'midnightblue':'#191970','mintcream':'#F5FFFA','mistyrose':'#FFE4E1','moccasin':'#FFE4B5','navajowhite':'#FFDEAD','navy':'#000080','oldlace':'#FDF5E6',
		'olive':'#808000','olivedrab':'#6B8E23','orange':'#FFA500','orangered':'#FF4500','orchid':'#DA70D6','palegoldenrod':'#EEE8AA',
		'palegreen':'#98FB98','paleturquoise':'#AFEEEE','palevioletred':'#D87093','papayawhip':'#FFEFD5','peachpuff':'#FFDAB9','peru':'#CD853F',
		'pink':'#FFC0CB','plum':'#DDA0DD','powderblue':'#B0E0E6','purple':'#800080','red':'#FF0000','rosybrown':'#BC8F8F','royalblue':'#4169E1',
		'saddlebrown':'#8B4513','salmon':'#FA8072','sandybrown':'#F4A460','seagreen':'#2E8B57','seashell':'#FFF5EE','sienna':'#A0522D','silver':'#C0C0C0',
		'skyblue':'#87CEEB','slateblue':'#6A5ACD','slategray':'#708090','slategrey':'#708090','snow':'#FFFAFA','springgreen':'#00FF7F',
		'steelblue':'#4682B4','tan':'#D2B48C','teal':'#008080','thistle':'#D8BFD8','tomato':'#FF6347','turquoise':'#40E0D0','violet':'#EE82EE'
	};
	
	var absround = function(number){
		return (0.5 + number) << 0;
	};

	var hue2rgb = function(a, b, c) {  
		if(c < 0) c += 1;
		if(c > 1) c -= 1;
		if(c < 1/6) return a + (b - a) * 6 * c;
		if(c < 1/2) return b;
		if(c < 2/3) return a + (b - a) * (2/3 - c) * 6;
		return a;
	};

	var p2v = function(p){
		return isPercent.test(p) ? absround(parseInt(p) * 2.55) : p;
	};
	
	var isHex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
	var isHSL = /^hsla?\((\d{1,3}?),\s*(\d{1,3}%),\s*(\d{1,3}%)(,\s*[01]?\.?\d*)?\)$/;
	var isRGB = /^rgba?\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?)(,\s*[01]?\.?\d*)?\)$/;
	var isPercent = /^\d+(\.\d+)*%$/;

	var hexBit = /([0-9a-f])/gi;
	var leadHex = /^#/;

	var matchHSL = /^hsla?\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%(,\s*([01]?\.?\d*))?\)$/;
	var matchRGB = /^rgba?\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?)(,\s*([01]?\.?\d*))?\)$/;
	
	function Color(value){

		this._listeners = {};

		this.subscribe(Events.RGB_UPDATED, this._RGBUpdated);
		this.subscribe(Events.HEX_UPDATED, this._HEXUpdated);
		this.subscribe(Events.HSL_UPDATED, this._HSLUpdated);
		this.subscribe(Events.HSV_UPDATED, this._HSVUpdated);
		this.subscribe(Events.INT_UPDATED, this._INTUpdated);
		
		this.parse(value);

	};

	Color.prototype._decimal = 0;  
	Color.prototype._hex = '#000000';  
	Color.prototype._red = 0;  
	Color.prototype._green = 0;  
	Color.prototype._blue = 0;  
	Color.prototype._hue = 0;  
	Color.prototype._saturation = 0;  
	Color.prototype._lightness = 0;  
	Color.prototype._brightness = 0;  
	Color.prototype._alpha = 1;  	
	
	Color.prototype.parse = function(value){
		if(typeof value == 'undefined'){
			return this;
		};
		switch(true){
			case isFinite(value) :
				this.decimal(value);
				this.output = Color.INT;
				return this;
			case (value instanceof Color) :
				this.copy(value);
				return this;
			default : 
				switch(typeof value) {
					case 'object' :
						this.set(value);
						return this;
					case 'string' :
						switch(true){
							case (namedColors.hasOwnProperty(value)) :
								value = namedColors[value];
								var stripped = value.replace(leadHex, '');
								this.decimal(parseInt(stripped, 16));
								return this;
							case isHex.test(value) :
								var stripped = value.replace(leadHex, '');
								if(stripped.length == 3) {
									stripped = stripped.replace(hexBit, '$1$1');
								};
								this.decimal(parseInt(stripped, 16));
								return this;
							case isRGB.test(value) :
								var parts = value.match(matchRGB);
								this.red(p2v(parts[1]));
								this.green(p2v(parts[2]));
								this.blue(p2v(parts[3]));
								this.alpha(parseFloat(parts[5]) || 1);
								this.output = (isPercent.test(parts[1]) ? 2 : 1) + (parts[5] ? 2 : 0);
								return this;
							case isHSL.test(value) :  
								var parts = value.match(matchHSL);
								this.hue(parseInt(parts[1]));
								this.saturation(parseInt(parts[2]));
								this.lightness(parseInt(parts[3]));
								this.alpha(parseFloat(parts[5]) || 1);
								this.output = parts[5] ? 6: 5; 
								return this;
						};
				};		
			
		};
		return this;
	};

	
	Color.prototype.clone = function(){
		return new Color(this.decimal());
	};
	
	Color.prototype.copy = function(color){
		this.set(color.decimal());
		return this;
	};
	
	Color.prototype.set = function(key, value){
		if(arguments.length == 1){
			if(typeof key == 'object'){
				for(var p in key){
					if(typeof this[p] == 'function'){
						this[p](key[p]);					
					};
				};
			} else if(isFinite(key)){
				this.decimal(key);
			}
		} else if(typeof this[key] == 'function'){
			this[key](value);
		};
		return this;
	};
	
	Color.prototype.interpolate = function(destination, factor){
		if(!(destination instanceof Color)){
			destination = new Color(destination);
		};
		this._red = absround( +(this._red) + (destination._red - this._red) * factor );
		this._green = absround( +(this._green) + (destination._green - this._green) * factor );
		this._blue = absround( +(this._blue) + (destination._blue - this._blue) * factor );
		this._alpha = absround( +(this._alpha) + (destination._alpha - this._alpha) * factor );
		this.broadcast(Events.RGB_UPDATED);
		this.broadcast(Events.UPDATED);
		return this;
	};

	Color.prototype._RGB2HSL = function(){

		var r = this._red / 255;
		var g = this._green / 255;
		var b = this._blue / 255;

		var max = Math.max(r, g, b);
		var min = Math.min(r, g, b);
		var l = (max + min) / 2;
		var v = max;

		if(max == min) {
			this._hue = 0;
			this._saturation = 0;
			this._lightness = absround(l * 100);
			this._brightness = absround(v * 100);
			return;
		};

		var d = max - min;
		var s = d / ( ( l <= 0.5) ? (max + min) : (2 - max - min) );
		var h = ((max == r)
			? (g - b) / d + (g < b ? 6 : 0)
			: (max == g)
			 ? ((b - r) / d + 2)
			 : ((r - g) / d + 4)) / 6;

		this._hue = absround(h * 360);
		this._saturation = absround(s * 100);
		this._lightness = absround(l * 100);
		this._brightness = absround(v * 100);
	};
	
	Color.prototype._HSL2RGB = function(){
		var h = this._hue / 360;
		var s = this._saturation / 100;
		var l = this._lightness / 100;
		var q = l < 0.5	? l * (1 + s) : (l + s - l * s);
		var p = 2 * l - q;
		this._red = absround(hue2rgb(p, q, h + 1/3) * 255);
		this._green = absround(hue2rgb(p, q, h) * 255);
		this._blue = absround(hue2rgb(p, q, h - 1/3) * 255);
	};
	
	Color.prototype._HSV2RGB = function(){  
		var h = this._hue / 360;
		var s = this._saturation / 100;
		var v = this._brightness / 100;
		var r = 0;
		var g = 0;
		var b = 0;
		var i = Math.floor(h * 6);
		var f = h * 6 - i;
		var p = v * (1 - s);
		var q = v * (1 - f * s);
		var t = v * (1 - (1 - f) * s);
		switch(i % 6){
			case 0 :
				r = v, g = t, b = p;
				break;
			case 1 :
				r = q, g = v, b = p;
				break;
			case 2 :
				r = p, g = v, b = t;
				break;
			case 3 :
				r = p, g = q, b = v;
				break;
			case 4 :
				r = t, g = p, b = v
				break;
			case 5 :
				r = v, g = p, b = q;
				break;
		}
		this._red = absround(r * 255);
		this._green = absround(g * 255);
		this._blue = absround(b * 255);
	};
	
	Color.prototype._INT2HEX = function(){
		var x = this._decimal.toString(16);
		x = '000000'.substr(0, 6 - x.length) + x;
		this._hex = '#' + x.toUpperCase();
	};
	
	Color.prototype._INT2RGB = function(){
		this._red = this._decimal >> 16;
		this._green = (this._decimal >> 8) & 0xFF;
		this._blue = this._decimal & 0xFF;
	};
	
	Color.prototype._HEX2INT = function(){
		this._decimal = parseInt(this._hex, 16);
	};
	
	Color.prototype._RGB2INT = function(){
		this._decimal = (this._red << 16 | (this._green << 8) & 0xffff | this._blue);
	};

	Color.prototype._RGBUpdated = function(){
		this._RGB2INT();  
		this._RGB2HSL();  
		this._INT2HEX();  
	};
	Color.prototype._HSLUpdated = function(){
		this._HSL2RGB();  
		this._RGB2INT();  
		this._INT2HEX();  
	};
	Color.prototype._HSVUpdated = function(){
		this._HSV2RGB();  
		this._RGB2INT();  
		this._INT2HEX();  
	};
	Color.prototype._HEXUpdated = function(){
		this._HEX2INT();  
		this._INT2RGB();  
		this._RGB2HSL();  
	};
	Color.prototype._INTUpdated = function(){
		this._INT2RGB();  
		this._RGB2HSL();  
		this._INT2HEX();  
	};
	
	Color.prototype._broadcastUpdate = function(){
		this.broadcast(Event.UPDATED);
	};
	
	Color.prototype.decimal = function(value){
		return this._handle('_decimal', value, Events.INT_UPDATED);
	};
	
	Color.prototype.hex = function(value){
		return this._handle('_hex', value, Events.HEX_UPDATED);
	};
	
	Color.prototype.red = function(value){
		return this._handle('_red', value, Events.RGB_UPDATED);
	};
	
	Color.prototype.green = function(value){
		return this._handle('_green', value, Events.RGB_UPDATED);
	};	
	
	Color.prototype.blue = function(value){
		return this._handle('_blue', value, Events.RGB_UPDATED);
	};
	
	Color.prototype.hue = function(value){
		return this._handle('_hue', value, Events.HSL_UPDATED);
	};	
	
	Color.prototype.saturation = function(value){
		return this._handle('_saturation', value, Events.HSL_UPDATED);
	};	
		
	Color.prototype.lightness = function(value){
		return this._handle('_lightness', value, Events.HSL_UPDATED);
	};		
	
	Color.prototype.brightness = function(value){
		return this._handle('_brightness', value, Events.HSV_UPDATED);
	};
	
	Color.prototype.alpha = function(value){
		return this._handle('_alpha', value);
	};
	
	Color.prototype._handle = function(prop, value, event){
		if(typeof this[prop] != 'undefined'){
			if(typeof value != 'undefined'){
				if(value != this[prop]){
					this[prop] = value;
					if(event){
						this.broadcast(event);
					};
				};
				this.broadcast(Event.UPDATED);
			};
		};
		return this[prop];
	};	
	
	Color.prototype.getHex = function(){
		return this._hex;
	};
	
	Color.prototype.getRGB = function(){
		var components = [absround(this._red), absround(this._green), absround(this._blue)];
		return 'rgb(' + components.join(', ') + ')';
	};
	
	Color.prototype.getPRGB = function(){
		var components = [absround(100 * this._red / 255) + '%', absround(100 * this._green / 255) + '%', absround(100 * this._blue / 255) + '%'];
		return 'rgb(' + components.join(', ') + ')';
	};
	
	Color.prototype.getRGBA = function(){
		var components = [absround(this._red), absround(this._green), absround(this._blue), this._alpha];
		return 'rgba(' + components.join(', ') + ')';
	};
	
	Color.prototype.getPRGBA = function(){
		var components = [absround(100 * this._red / 255) + '%', absround(100 * this._green / 255) + '%', absround(100 * this._blue / 255) + '%', this._alpha];
		return 'rgba(' + components.join(', ') + ')';
	};
	
	Color.prototype.getHSL = function(){
		var components = [absround(this._hue), absround(this._saturation) + '%', absround(this._lightness) + '%'];
		return 'hsl(' + components.join(', ') + ')';
	};
	
	Color.prototype.getHSLA = function(){
		var components = [absround(this._hue), absround(this._saturation) + '%', absround(this._lightness) + '%', this._alpha];
		return 'hsla(' + components.join(', ') + ')';
	};
	
	Color.prototype.format = function(string){
		var tokens = {
			r : this._red,
			g : this._green,
			b : this._blue,
			h : this._hue,
			s : this._saturation,
			l : this._lightness,
			v : this._brightness,
			a : this._alpha,
			x : this._hex,
			d : this._decimal
		};
		for(var token in tokens){
			string = string.split('%' + token + '%').join(tokens[token]);
		};
		return string;
	};
	
	Color.prototype.output = 0;

	Color.HEX = 0;  
	Color.RGB = 1;  
	Color.PRGB = 2;  
	Color.RGBA = 3;  
	Color.PRGBA = 4;  
	Color.HSL = 5;  
	Color.HSLA = 6;  
	Color.INT = 7;  

	Color.prototype.toString = function(){
		switch(this.output){
			case 0 :  
				return this.getHex();
			case 1 :  
				return this.getRGB();
			case 2 :  
				return this.getPRGB();
			case 3 :  
				return this.getRGBA();
			case 4 :  
				return this.getPRGBA();
			case 5 :  
				return this.getHSL();
			case 6 :  
				return this.getHSLA();
			case 7 :  
				return this._decimal;
		};
		return this.getHex();
	};
	
	Color.prototype._listeners = null;
	Color.prototype._isSubscribed = function(type){
		return this._listeners[type] != null;
	};
	
	Color.prototype.subscribe = function(type, callback){
		if(!this._isSubscribed(type)) {
			this._listeners[type] = [];
		};
		this._listeners[type].push(callback);
	};	
	
	Color.prototype.unsubscribe = function(type, callback){
		if(!this._isSubscribed(type)) {
			return;
		};
		var stack = this._listeners[type];
		for(var i = 0, l = stack.length; i < l; i++){
			if(stack[i] === callback){
				stack.splice(i, 1);
				return this.unsubscribe(type, callback);
			};
		};
	};	
	
	Color.prototype.broadcast = function(type, params){
		if(!this._isSubscribed(type)) {
			return;
		}
		var stack = this._listeners[type];
		var l = stack.length;
		for(var i = 0; i < l; i++) {
			stack[i].apply(this, params);
		}
	};	
	
	Color.prototype.tween = function(duration, color){
		if(!(color instanceof Color)){
			color = new Color(color);
		};
		var start = +(new Date());
		var ref = this;
		this.broadcast('tweenStart');
		var interval = setInterval(function(){
			var ellapsed = +(new Date()) - start;
			var delta = Math.min(1, ellapsed / duration);
			ref.interpolate(color, delta);
			ref.broadcast('tweenProgress');
			if(delta == 1){
				clearInterval(interval);
				ref.broadcast('tweenComplete');
			};
		}, 20);
		return interval;  
	};
	
	Color.prototype.bind = function(object, property){
		var ref = this;
		this.subscribe('updated', function(){
			object[property] = ref.toString();
		});
	};	
	
	Color.random = function(){
		return new Color(absround(Math.random() * 16777215));
	};	
	
	Color.bind = function(object, property){
		var color = new Color(object[property]);
		color.bind(object, property);
		return color;
	};
		
	Color.Events = Events;
	return this.Color = window.Color = Color;
	
})();
