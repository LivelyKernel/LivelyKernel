///////////////////////////////////////////////////////////////////////////////
// Extensions to String instances
///////////////////////////////////////////////////////////////////////////////

Object.extend(String.prototype, {
    asString: function() { // so code can treat, eg, Texts like Strings
        return this;
    },

    empty: function() {
      return this == '';
    },

    blank: function() {
      return /^\s*$/.test(this);
    },

    size: function() { // so code can treat, eg, Texts like Strings
        return this.length;
    },

    include: function(pattern) {
        return this.indexOf(pattern) > -1;
    },

    startsWith: function(pattern) {
        return this.indexOf(pattern) === 0;
    },
    startsWithVowel: function() {
        var char = this[0];
        return char === 'A' || char === 'E' || char === 'I' || char === 'O' || char === 'U' ||
            char === 'a' || char === 'e' || char === 'i' || char === 'o' || char === 'u' || false
    },


    endsWith: function(pattern) {
        var d = this.length - pattern.length;
        return d >= 0 && this.lastIndexOf(pattern) === d;
    },

    truncate: function(length, truncation) {
        length = length || 30;
        truncation = truncation === undefined ? '...' : truncation;
        return this.length > length ? this.slice(0, length - truncation.length) + truncation : String(this);
    },
    regExpEscape: function() {
    //from google' closure library

      return this.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
          replace(/\x08/g, '\\x08');
    },


    strip: function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    },

    camelize: function() {
        var parts = this.split('-'),
            len = parts.length;
        if (len == 1) return parts[0];

        var camelized = this.charAt(0) == '-' ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1) : parts[0];

        for (var i = 1; i < len; i++)
        camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

        return camelized;
    },

    capitalize: function() {
        if (this.length < 1) {
            return this;
        }
        return this.charAt(0).toUpperCase() + this.slice(1);
    },

    toQueryParams: function(separator) {
        var match = this.strip().match(/([^?#]*)(#.*)?$/);
        if (!match) {
            return {};
        }
        var hash = match[1].split(separator || '&').inject({}, function(hash, pair) {
            if ((pair = pair.split('='))[0]) {
                var key = decodeURIComponent(pair.shift());
                var value = pair.length > 1 ? pair.join('=') : pair[0];
                if (value != undefined) value = decodeURIComponent(value);

                if (key in hash) {
                    if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
                    hash[key].push(value);
                } else hash[key] = value;
            }
            return hash;
        });
        return hash;
    },

    toArray: function() {
        return this.split('');
    },

    succ: function() {
        return this.slice(0, this.length - 1) + String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    },

    times: function(count) {
        return count < 1 ? '' : new Array(count + 1).join(this);
    },

    // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
    hashCode: function() {
        var hash = 0, len = this.length;
        if (len == 0) return hash;
        for (var i = 0; i < len; i++) {
            var c = this.charCodeAt(i);
            hash = ((hash<<5)-hash) + c;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

});

///////////////////////////////////////////////////////////////////////////////
// Global Helper - Strings
///////////////////////////////////////////////////////////////////////////////

Global.Strings = {

    format: function Strings$format() {
        return Strings.formatFromArray(Array.from(arguments));
    },

    // adapted from firebug lite
    formatFromArray: function Strings$formatFromArray(objects) {
        var self = objects.shift();
        if (!self) { console.log("Error in Strings>>formatFromArray, first arg is undefined"); };

        function appendText(object, string) {
            return "" + object;
        }

        function appendObject(object, string) {
            return "" + object;
        }

        function appendInteger(value, string) {
            return value.toString();
        }

        function appendFloat(value, string, precision) {
            if (precision > -1) return value.toFixed(precision);
            else return value.toString();
        }

        function appendObject(value, string) { return Objects.inspect(value); }

        var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat, o: appendObject};
        var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;

        function parseFormat(fmt) {
            var oldFmt = fmt;
            var parts = [];

            for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
                var type = m[8] || m[5],
                    appender = type in appenderMap ? appenderMap[type] : appendObject,
                    precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
                parts.push(fmt.substr(0, m[0][0] == "%" ? m.index : m.index + 1));
                parts.push({appender: appender, precision: precision});

                fmt = fmt.substr(m.index + m[0].length);
            }
            if (fmt)
                parts.push(fmt.toString());

            return parts;
        };

        var parts = parseFormat(self),
            str = "",
            objIndex = 0;

        for (var i = 0; i < parts.length; ++i) {
            var part = parts[i];
            if (part && typeof(part) == "object") {
                var object = objects[objIndex++];
                str += (part.appender || appendText)(object, str, part.precision);
            } else {
                str += appendText(part, str);
            }
        }
        return str;
    },

    withDecimalPrecision: function(str, precision) {
        var floatValue = parseFloat(str);
        return isNaN(floatValue) ? str : floatValue.toFixed(precision);
    },

    indent: function (str, indentString, depth) {
        if (!depth || depth <= 0) return str;
        while (depth > 0) { depth--; str = indentString + str; }
        return str;
    },

    removeSurroundingWhitespaces: function(str) {
        function removeTrailingWhitespace(string) {
            while (string.length > 0 && /\s|\n|\r/.test(string[string.length - 1]))
                string = string.substring(0, string.length - 1);
            return string;
        }
        function removeLeadingWhitespace(string) {
            return string.replace(/^[\n\s]*(.*)/, '$1');
        }
        return removeLeadingWhitespace(removeTrailingWhitespace(str));
    },

    print: function print(obj) {
        if (obj && Array.isArray(obj)) {
            return '[' + obj.map(function(ea) { return print(ea); }) + ']';
        }
        if (typeof obj !== "string") {
            return String(obj);
        }
        var result = String(obj);
        result = result.replace(/\n/g, '\\n\\\n');
        result = result.replace(/(")/g, '\\$1');
        result = '\"' + result + '\"';
        return result;
    },

    lines: function(str) {
        return str.split(/\n\r?/);
    },

    nonEmptyLines: function(str) {
        return Strings.lines(str).reject(function(line) {
            return line == ''
        });
    },

    tokens: function(str, regex) {
        // Strings.tokens(' a b c')
        // => ['a', 'b', 'c']
        regex = regex || /\s+/;
        return str.split(regex).reject(function(tok) { return /^\s*$/.test(tok); });
    },

    printNested: function(list, depth) {
        depth = depth || 0;
        var s = ""
        list.forEach(function(ea) {
            if (ea instanceof Array) {
                s += Strings.printNested(ea, depth + 1)
            } else {
                s +=  Strings.indent(ea +"\n", '  ', depth);
            }
        })
        return s
    },

    camelCaseString: function(s) {
        return s.split(" ").invoke('capitalize').join("")
    },

    tableize: function(s, options) {
        // string => array
        // Strings.tableize('a b c\nd e f')
        //   => [[a, b, c], [d, e, f]]
        // can also parse csv like
        // csv = '"Symbol","Name","LastSale",\n'
        //     + '"FLWS","1-800 FLOWERS.COM, Inc.","5.65",\n'
        //     + '"FCTY","1st Century Bancshares, Inc","5.65",'
        // csvTable = Strings.tableize(companiesCSV, /^\s*"|","|",?\s*$/g)
        options = options || {};
        var splitter = options.cellSplitter || /\s+/,
            emptyStringRe = /^\s*$/,
            convertTypes = options.hasOwnProperty('convertTypes') ? !!options.convertTypes : true,
            lines = Strings.lines(s), table = [];
        for (var i = 0; i < lines.length; i++) {
            var tokens = Strings.tokens(lines[i], splitter);
            if (convertTypes) {
                tokens = tokens.map(function(tok) {
                    if (tok.match(emptyStringRe)) return tok;
                    var num = Number(tok);
                    if (!Global.isNaN(num)) return num;
                    var date = new Date(tok);
                    if (!Global.isNaN(+date)) return date;
                    return tok;
                });
            }
            if (tokens.length > 0) table.push(tokens);
        }
        return table;
    },

    pad: function(string, n, left) {
        return left ? ' '.times(n) + string : string + ' '.times(n);
    },

    printTable: function(tableArray, options) {
        // array => string
        // Strings.printTable([[a, b, c], [d, e, f]]) => 'a b c\nd e f'
        var columnWidths = [],
            separator = (options && options.separator) || ' ',
            alignLeftAll = !options || !options.align || options.align === 'left',
            alignRightAll = options && options.align === 'right';
        function alignRight(columnIndex) {
            if (alignLeftAll) return false;
            if (alignRightAll) return true;
            return options
                && Object.isArray(options.align)
                && options.align[columnIndex] === 'right';
        }
        tableArray.forEach(function(row) {
            row.forEach(function(cellVal, i) {
                if (columnWidths[i] === undefined) columnWidths[i] = 0;
                columnWidths[i] = Math.max(columnWidths[i], String(cellVal).length);
            });
        });
        return tableArray.collect(function(row) {
            return row.collect(function(cellVal, i) {
                var cellString = String(cellVal);
                return Strings.pad(cellString,
                                   columnWidths[i] - cellString.length,
                                   alignRight(i));
            }).join(separator);
        }).join('\n');
    },

    newUUID: function() {
        // copied from Martin's UUID class
        var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        }).toUpperCase();
        return id;
    },

    unescapeCharacterEntities: function(s) {
        // like &uml;
        var div = XHTMLNS.create('div');
        div.innerHTML = s;
        return div.textContent;
    },

    createDataURI: function(content, mimeType) {
        // window.open(Strings.createDataURI('<h1>test</h1>', 'text/html'));
        mimeType = mimeType || "text/plain";
        return "data:" + mimeType
             + ";base64," + btoa(content);
    },

    quote: function(str) {
        return '"' + str.replace(/"/g, '\\"') + '"';
    },

    md5: function (string) {
        // http://www.myersdaily.org/joseph/javascript/md5-text.html

    	function cmn(q, a, b, x, s, t) {
			a = add32(add32(a, q), add32(x, t));
			return add32((a << s) | (a >>> (32 - s)), b);
		}


		function ff(a, b, c, d, x, s, t) {
			return cmn((b & c) | ((~b) & d), a, b, x, s, t);
		}

		function gg(a, b, c, d, x, s, t) {
			return cmn((b & d) | (c & (~d)), a, b, x, s, t);
		}

		function hh(a, b, c, d, x, s, t) {
			return cmn(b ^ c ^ d, a, b, x, s, t);
		}

		function ii(a, b, c, d, x, s, t) {
			return cmn(c ^ (b | (~d)), a, b, x, s, t);
		}



		function md5cycle(x, k) {
			var a = x[0], b = x[1], c = x[2], d = x[3];

			a = ff(a, b, c, d, k[0], 7, -680876936);
			d = ff(d, a, b, c, k[1], 12, -389564586);
			c = ff(c, d, a, b, k[2], 17,  606105819);
			b = ff(b, c, d, a, k[3], 22, -1044525330);
			a = ff(a, b, c, d, k[4], 7, -176418897);
			d = ff(d, a, b, c, k[5], 12,  1200080426);
			c = ff(c, d, a, b, k[6], 17, -1473231341);
			b = ff(b, c, d, a, k[7], 22, -45705983);
			a = ff(a, b, c, d, k[8], 7,  1770035416);
			d = ff(d, a, b, c, k[9], 12, -1958414417);
			c = ff(c, d, a, b, k[10], 17, -42063);
			b = ff(b, c, d, a, k[11], 22, -1990404162);
			a = ff(a, b, c, d, k[12], 7,  1804603682);
			d = ff(d, a, b, c, k[13], 12, -40341101);
			c = ff(c, d, a, b, k[14], 17, -1502002290);
			b = ff(b, c, d, a, k[15], 22,  1236535329);

			a = gg(a, b, c, d, k[1], 5, -165796510);
			d = gg(d, a, b, c, k[6], 9, -1069501632);
			c = gg(c, d, a, b, k[11], 14,  643717713);
			b = gg(b, c, d, a, k[0], 20, -373897302);
			a = gg(a, b, c, d, k[5], 5, -701558691);
			d = gg(d, a, b, c, k[10], 9,  38016083);
			c = gg(c, d, a, b, k[15], 14, -660478335);
			b = gg(b, c, d, a, k[4], 20, -405537848);
			a = gg(a, b, c, d, k[9], 5,  568446438);
			d = gg(d, a, b, c, k[14], 9, -1019803690);
			c = gg(c, d, a, b, k[3], 14, -187363961);
			b = gg(b, c, d, a, k[8], 20,  1163531501);
			a = gg(a, b, c, d, k[13], 5, -1444681467);
			d = gg(d, a, b, c, k[2], 9, -51403784);
			c = gg(c, d, a, b, k[7], 14,  1735328473);
			b = gg(b, c, d, a, k[12], 20, -1926607734);

			a = hh(a, b, c, d, k[5], 4, -378558);
			d = hh(d, a, b, c, k[8], 11, -2022574463);
			c = hh(c, d, a, b, k[11], 16,  1839030562);
			b = hh(b, c, d, a, k[14], 23, -35309556);
			a = hh(a, b, c, d, k[1], 4, -1530992060);
			d = hh(d, a, b, c, k[4], 11,  1272893353);
			c = hh(c, d, a, b, k[7], 16, -155497632);
			b = hh(b, c, d, a, k[10], 23, -1094730640);
			a = hh(a, b, c, d, k[13], 4,  681279174);
			d = hh(d, a, b, c, k[0], 11, -358537222);
			c = hh(c, d, a, b, k[3], 16, -722521979);
			b = hh(b, c, d, a, k[6], 23,  76029189);
			a = hh(a, b, c, d, k[9], 4, -640364487);
			d = hh(d, a, b, c, k[12], 11, -421815835);
			c = hh(c, d, a, b, k[15], 16,  530742520);
			b = hh(b, c, d, a, k[2], 23, -995338651);

			a = ii(a, b, c, d, k[0], 6, -198630844);
			d = ii(d, a, b, c, k[7], 10,  1126891415);
			c = ii(c, d, a, b, k[14], 15, -1416354905);
			b = ii(b, c, d, a, k[5], 21, -57434055);
			a = ii(a, b, c, d, k[12], 6,  1700485571);
			d = ii(d, a, b, c, k[3], 10, -1894986606);
			c = ii(c, d, a, b, k[10], 15, -1051523);
			b = ii(b, c, d, a, k[1], 21, -2054922799);
			a = ii(a, b, c, d, k[8], 6,  1873313359);
			d = ii(d, a, b, c, k[15], 10, -30611744);
			c = ii(c, d, a, b, k[6], 15, -1560198380);
			b = ii(b, c, d, a, k[13], 21,  1309151649);
			a = ii(a, b, c, d, k[4], 6, -145523070);
			d = ii(d, a, b, c, k[11], 10, -1120210379);
			c = ii(c, d, a, b, k[2], 15,  718787259);
			b = ii(b, c, d, a, k[9], 21, -343485551);

			x[0] = add32(a, x[0]);
			x[1] = add32(b, x[1]);
			x[2] = add32(c, x[2]);
			x[3] = add32(d, x[3]);

		}


		function md51(s) {
			txt = '';
			var n = s.length,
			state = [1732584193, -271733879, -1732584194, 271733878], i;
			for (i=64; i<=n; i+=64) {
				md5cycle(state, md5blk(s.substring(i-64, i)));
			}
			s = s.substring(i-64);
			var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], sl=s.length;
			for (i=0; i<sl; i++) 	tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
			tail[i>>2] |= 0x80 << ((i%4) << 3);
			if (i > 55) {
				md5cycle(state, tail);
				i=16;
				while (i--) { tail[i] = 0 }
	//			for (i=0; i<16; i++) tail[i] = 0;
			}
			tail[14] = n*8;
			md5cycle(state, tail);
			return state;
		}

		/* there needs to be support for Unicode here,
		 * unless we pretend that we can redefine the MD-5
		 * algorithm for multi-byte characters (perhaps
		 * by adding every four 16-bit characters and
		 * shortening the sum to 32 bits). Otherwise
		 * I suggest performing MD-5 as if every character
		 * was two bytes--e.g., 0040 0025 = @%--but then
		 * how will an ordinary MD-5 sum be matched?
		 * There is no way to standardize text to something
		 * like UTF-8 before transformation; speed cost is
		 * utterly prohibitive. The JavaScript standard
		 * itself needs to look at this: it should start
		 * providing access to strings as preformed UTF-8
		 * 8-bit unsigned value arrays.
		 */
		function md5blk(s) { 		/* I figured global was faster.   */
			var md5blks = [], i; 	/* Andy King said do it this way. */
			for (i=0; i<64; i+=4) {
			md5blks[i>>2] = s.charCodeAt(i)
			+ (s.charCodeAt(i+1) << 8)
			+ (s.charCodeAt(i+2) << 16)
			+ (s.charCodeAt(i+3) << 24);
			}
			return md5blks;
		}

		var hex_chr = '0123456789abcdef'.split('');

		function rhex(n)
		{
			var s='', j=0;
			for(; j<4; j++)	s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]	+ hex_chr[(n >> (j * 8)) & 0x0F];
			return s;
		}

		function hex(x) {
			var l=x.length;
			for (var i=0; i<l; i++)	x[i] = rhex(x[i]);
			return x.join('');
		}

		/* this function is much faster,
		so if possible we use it. Some IEs
		are the only ones I know of that
		need the idiotic second function,
		generated by an if clause.  */

		function add32(a, b) {
			return (a + b) & 0xFFFFFFFF;
		}

		if (hex(md51("hello")) != "5d41402abc4b2a76b9719d911017c592") {
			function add32(x, y) {
				var lsw = (x & 0xFFFF) + (y & 0xFFFF),
				msw = (x >> 16) + (y >> 16) + (lsw >> 16);
				return (msw << 16) | (lsw & 0xFFFF);
			}
		}

		return hex(md51(string));
	},

    reMatches: function(string, re) {
        var matches = [];
        string.replace(re, function(match, idx) {
            matches.push({match: match, start: idx, end: idx + match.length}); });
        return matches;
    },

    peekRight: function(string, start, needle) {
        string = string.slice(start);
        if (Object.isString(needle)) {
            var idx = string.indexOf(needle);
            return idx === -1 ? null : idx + start;
        } else if (Object.isRegExp(needle)) {
            var matches = this.reMatches(string, needle);
            return matches[0] ? matches[0].start : null;
        }
        return null;
    },

    peekLeft: function(string, start, needle) {
        string = string.slice(0, start);
        if (Object.isString(needle)) {
            var idx = string.lastIndexOf(needle);
            return idx === -1 ? null : idx;
        } else if (Object.isRegExp(needle)) {
            var matches = this.reMatches(string, needle);
            return matches.last() ? matches.last().start : null;
        }
        return null;
    },

    lineIndexComputer: function(string) {
        // returns a function that will accept a character position and return
        // its line number in string. If the char pos is outside of the line
        // ranges -1 is returned
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // line ranges: list of numbers, each line has two entries:
        // i -> start of line, i+1 -> end of line
        var lineRanges = Strings.lines(string).reduce(function(lineIndexes, line) {
            var lastPos = lineIndexes.last() || -1;
            return lineIndexes.concat([lastPos+1, lastPos + 1 + line.length]);
        }, []);
        // FIXME, this is O(n). Make cumputation more efficient, binary lookup?
        return function(pos) {
            for (var line = 0; line < lineRanges.length; line+=2)
                if (pos >= lineRanges[line] && pos <= lineRanges[line+1])
                    return line / 2;
            return -1;
        }
    }
};
