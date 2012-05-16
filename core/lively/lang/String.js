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

    endsWith: function(pattern) {
        var d = this.length - pattern.length;
        return d >= 0 && this.lastIndexOf(pattern) === d;
    },

    truncate: function(length, truncation) {
        length = length || 30;
        truncation = truncation === undefined ? '...' : truncation;
        return this.length > length ? this.slice(0, length - truncation.length) + truncation : String(this);
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

});

///////////////////////////////////////////////////////////////////////////////
// Global Helper - Strings
///////////////////////////////////////////////////////////////////////////////

Strings = {
    format: function Strings$format() {
        return Strings.formatFromArray($A(arguments));
    },

    // adapted from firebug lite
    formatFromArray: function Strings$formatFromArray(objects) {
        var self = objects.shift();
        if(!self) {console.log("Error in Strings>>formatFromArray, self is undefined")};

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
            dbgOn(!value.toFixed);
            if (precision > -1) return value.toFixed(precision);
            else return value.toString();
        }

        var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat};
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
        while (depth > 0) {
            depth--;
            str = indentString + str;
        }
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

    print: function(obj) {
        if (obj && obj.constructor && obj.constructor === Array) {
            return '[' + obj.map(function(ea) { return Strings.print(ea) }) + ']';
        }
        if (typeof obj !== "string") {
            return String(obj);
        }
        var result = String(obj);
        result = result.replace(/\n/g, '\\n\\\n')
        result = result.replace(/("|')/g, '\\$1')
        result = '\'' + result + '\'';
        return result
    },

    lines: function(str) {
        return str.split(/\n\r?/);
    },

    tokens: function(str, regex) {
        regex = regex || /\s+/;
        return str.split(regex);
    },

    printNested: function(list, depth) {
        depth = depth || 0;
        var s = ""
        list.forEach(function(ea) {
            if (ea instanceof Array)
                s += Strings.printNested(ea, depth + 1)
            else
                s +=  Strings.indent(ea +"\n", '  ', depth);
        })
        return s
    },

    camelCaseString: function(s) {
        return s.split(" ").invoke('capitalize').join("")
    },

    tableize: function(s) {
        return Strings.lines(s).collect(function(ea) {
            return Strings.tokens(ea)
        })
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
		return div.textContent
	},
};