/*
    Copyright (c) 2010 Derek Watson
    Copyright (c) 2007 Steven Levithan

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/

/*
    jsUri
    version 1.1.0

    Uri parsing, manipulation and stringification.

    For library updates or issues, visit http://code.google.com/p/jsuri/

    This software incorporates MIT-licence dcode from parseUri (http://blog.stevenlevithan.com/archives/parseuri).
*/

jsUri = function (s) {
    if (s == undefined)
        s = '';
    this._uri = this.parseUri(s);
    this._query = new jsUri.query(this._uri.query);
}

jsUri.options = {
    strictMode: false,
    key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
    q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

jsUri.prototype = {};

// parseUri(str) parses the supplied uri and returns an object containing its components
jsUri.prototype.parseUri = function(str) {
    var o = jsUri.options,
                m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
                uri = {},
                i = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
}

// toString() stringifies the current state of the uri
jsUri.prototype.toString = function () {

    var s = '';
    var is = function (s) { return (s != null && s != ''); }

    if (is(this.protocol())) {
        s += this.protocol();
        if (this.protocol().indexOf(':') != this.protocol().length - 1) {
            s += ':';
        }
        s += '//';
    }
    else {
        if (this.hasAuthorityPrefix() && is(this.host()))
            s += '//';
    }

    if (is(this.userInfo()) && is(this.host())) {
        s += this.userInfo();
        if (this.userInfo().indexOf('@') != this.userInfo().length - 1)
            s += '@';
    }

    if (is(this.host())) {
        s += this.host();
        if (is(this.port()))
            s += ':' + this.port();
    }

    if (is(this.path()))
        s += this.path();
    else
        if (is(this.host()) && (is(this.query().toString()) || is(this.anchor())))
            s += '/';

    if (is(this.query().toString())) {
        if (this.query().toString().indexOf('?') != 0)
            s += '?';
        s += this.query().toString();
    }

    if (is(this.anchor())) {
        if (this.anchor().indexOf('#') != 0)
            s += '#';
        s += this.anchor();
    }

    return s;
}


/*
    Basic get/set functions for all properties
*/

jsUri.prototype.protocol = function(val) {
    if (typeof val != 'undefined') {
        this._uri.protocol = val;
    }
    return this._uri.protocol;
}

// hasAuthorityPrefix: if there is no protocol, the leading // can be enabled or disabled
jsUri.prototype.hasAuthorityPrefix = function(val) {

    if (typeof val != 'undefined') {
        this._hasAuthorityPrefix = val;
    }

    if (this._hasAuthorityPrefix == null)
        return (this._uri.source.indexOf('//') != -1);
    else
        return this._hasAuthorityPrefix;
}

jsUri.prototype.userInfo = function(val) {
    if (typeof val != 'undefined') {
        this._uri.userInfo = val;
    }
    return this._uri.userInfo;
}

jsUri.prototype.host = function(val) {
    if (typeof val != 'undefined') {
        this._uri.host = val;
    }
    return this._uri.host;
}

jsUri.prototype.port = function(val) {
    if (typeof val != 'undefined') {
        this._uri.port = val;
    }
    return this._uri.port;
}

jsUri.prototype.path = function(val) {
    if (typeof val != 'undefined') {
        this._uri.path = val;
    }
    return this._uri.path;
}

jsUri.prototype.query = function(val) {
    if (typeof val != 'undefined') {
        this._query = new jsUri.query(val);
    }
    return this._query;
}

jsUri.prototype.anchor = function(val) {
    if (typeof val != 'undefined') {
        this._uri.anchor = val;
    }
    return this._uri.anchor;
}


/*
    Fluent setters for jsUri uri properties
*/

jsUri.prototype.setProtocol = function (val) {
    this.protocol(val);
    return this;
}

jsUri.prototype.setHasAuthorityPrefix = function (val) {
    this.hasAuthorityPrefix(val);
    return this;
}

jsUri.prototype.setUserInfo = function (val) {
    this.userInfo(val);
    return this;
}

jsUri.prototype.setHost = function (val) {
    this.host(val);
    return this;
}

jsUri.prototype.setPort = function (val) {
    this.port(val);
    return this;
}

jsUri.prototype.setPath = function (val) {
    this.path(val);
    return this;
}

jsUri.prototype.setQuery = function (val) {
    this.query(val);
    return this;
}

jsUri.prototype.setAnchor = function (val) {
    this.anchor(val);
    return this;
}


/*
    jsUri.query
    query string parsing, parameter manipulation and stringification
*/

jsUri.query = function (q) {
    this.params = this.parseQuery(q);
}

jsUri.query.prototype = {};

// toString() returns a string representation of the internal state of the object
jsUri.query.prototype.toString = function () {

    var s = '';
    for (var p=0, len=this.params.length; p<len; p++) {
        var param = this.params[p];
        var joined = param.join('=');
        if (s.length > 0)
            s += '&';
        s += param.join('=');
    }
    return s;
}

// parseQuery(q) parses the uri query string and returns a multi-dimensional array of the components
jsUri.query.prototype.parseQuery = function(q) {

    var arr = [];

    if (q == null || q == '')
        return arr;

    var params = q.toString().split(/[&;]/);

	for(var i = 0, len = params.length; i < len; i++){
		var param = params[i];
        var keyval = param.split('=');
        arr.push([ keyval[0], keyval[1] ]);
    }
	
    return arr;
}

jsUri.query.prototype.decode = function (s) {
    s = decodeURIComponent(s);
    s = s.replace('+', ' ');
    return s;
}

// getQueryParamValues(key) returns the first query param value found for the key 'key'
jsUri.prototype.getQueryParamValue = function (key) {
    for (var p=0, len = this.query().params.length; p<len; p++) {
        var param = this.query().params[p];
        if (this.query().decode(key) == this.query().decode(param[0]))
            return param[1];
    }
}

// getQueryParamValues(key) returns an array of query param values for the key 'key'
jsUri.prototype.getQueryParamValues = function (key) {
    var arr = [];
    for (var p=0, len=this.query().params.length; p<len; p++) {
        var param = this.query().params[p];
        if (this.query().decode(key) == this.query().decode(param[0]))
            arr.push(param[1]);
    }
    return arr;
}

// deleteQueryParam(key) removes all instances of parameters named (key) 
// deleteQueryParam(key, val) removes all instances where the value matches (val)
jsUri.prototype.deleteQueryParam = function (key, val) {

    var arr = [];

    for (var p=0, len=this.query().params.length; p<len; p++) {
        var param = this.query().params[p];
        if (arguments.length == 2 && this.query().decode(param[0]) == this.query().decode(key) && this.query().decode(param[1]) == this.query().decode(val))
            continue;
        else if (arguments.length == 1 && this.query().decode(param[0]) == this.query().decode(key))
            continue;

        arr.push(param);
    }

    this.query().params = arr;
    return this;
}

// addQueryParam(key, val) Adds an element to the end of the list of query parameters
// addQueryParam(key, val, index) adds the param at the specified position (index)
jsUri.prototype.addQueryParam = function (key, val, index) {

    if (arguments.length == 3 && index != -1) {
        index = Math.min(index, this.query().params.length);
        this.query().params.splice(index, 0, [key, val]);
    }
    else if (arguments.length > 0)
        this.query().params.push([key, val]);
    
    return this;
}

// replaceQueryParam(key, newVal) deletes all instances of params named (key) and replaces them with the new single value
// replaceQueryParam(key, newVal, oldVal) deletes only instances of params named (key) with the value (val) and replaces them with the new single value
// this function attempts to preserve query param ordering
jsUri.prototype.replaceQueryParam = function (key, newVal, oldVal) {

    if (arguments.length == 3) {
        var index = -1;
        for (var p=0, len=this.query().params.length; p<len; p++) {
            var param = this.query().params[p];
            if (this.query().decode(param[0]) == this.query().decode(key) && decodeURIComponent(param[1]) == this.query().decode(oldVal)) {
                index = p;
                break;
            }
        }
        return this.deleteQueryParam(key, oldVal).addQueryParam(key, newVal, index);
    }
    else {
        var index = -1;
        for (var p=0, len=this.query().params.length; p<len; p++) {
            var param = this.query().params[p];
            if (this.query().decode(param[0]) == this.query().decode(key)) {
                index = p;
                break;
            }
        }
        return this.deleteQueryParam(key).addQueryParam(key, newVal, index);
    }
}

// clone() returns a new, identical jsUri instance
jsUri.prototype.clone = function () {
    return new jsUri(this.toString());
}
