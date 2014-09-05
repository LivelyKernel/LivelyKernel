/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Network.js.  Networking capabilities.
 *
 * Note: In a browser-based implementation of our system,
 * most of the necessary networking functionality is
 * inherited from the browser.
 */

module('lively.Network').requires('lively.bindings', 'lively.Data', 'lively.net.WebSockets').toRun(function(thisModule) {

(function saveNativeURLObject() {
    if (Global.URL && !lively.Class.isClass(Global.URL)) {
        Global._URL = Global.URL;
    }
})();

Object.subclass('URL',
"settings", {
    isURL: true,
    splitter: new RegExp('^(http|https|file)://([^/:]*)(:([0-9]+))?(/.*)?$'),
    pathSplitter: new RegExp("([^\\?#]*)(\\?[^#]*)?(#.*)?"),
},
'initializing', {

    initialize: function(/*...*/) { // same field names as window.location
        var firstArg = arguments[0];
        if (!firstArg) throw new Error("URL constructor expecting string or URL parameter");
        if (Object.isString(firstArg.valueOf())) {
            var urlString = firstArg;
            var result = urlString.match(this.splitter);
            if (!result) throw new Error("malformed URL string '" + urlString + "'");
            this.protocol = result[1];
            if (!result[1])
                throw new Error("bad url " + urlString + ", " + result);
            this.hostname = result[2]; // empty means localhost
            this.port = result[4] && parseInt(result[4]);

            var fullpath = result[5];
            if (fullpath) {
                result = fullpath.match(this.pathSplitter);
                this.pathname = result[1];
                this.search = result[2];
                this.hash = result[3];
            } else {
                this.pathname = "/";
                this.search = "";
                this.hash = "";
            }
        } else { // spec is either an URL or window.location
            var spec = firstArg;
            this.protocol = spec.protocol || "http";
            this.port = spec.port;
            this.hostname = spec.hostname;
            this.pathname = spec.pathname || "";
            if (spec.search !== undefined) this.search = spec.search;
            if (spec.hash !== undefined) this.hash = spec.hash;
        }
    },
},
"accessing", {

    inspect: function() {
        return JSON.serialize(this);
    },

    toString: function() {
        return this.protocol + "://" + this.hostname + (this.port ? ":" + this.port : "") + this.fullPath();
    },

    fullPath: function() {
        return this.pathname + (this.search || "") + (this.hash || "");
    },

    isLeaf: function() {
        return !this.fullPath().endsWith('/');
    },

    dirname: function() {
        // POSIX style
        var p = this.pathname;
        var slash = p.endsWith('/') ? p.lastIndexOf('/', p.length - 2) : p.lastIndexOf('/');
        return p.substring(0, slash + 1);
    },

    filename: function() {
        var p = this.pathname;
        var slash = p.endsWith('/') ? p.lastIndexOf('/', p.length - 2) : p.lastIndexOf('/');
        return p.substring(slash + 1);
    },

    extension: function() {
        if (!this.isLeaf()) return '';
        var fn = this.filename(), idx = fn.lastIndexOf('.');
        return idx === -1 ? '' : fn.slice(idx+1);
    },

    normalizedHostname: function() {
        return this.hostname.replace(/^www\.(.*)/, '$1');
    },

    getDirectory: function() {
        return this.withPath(this.dirname());
    },

    asDirectory: function() {
        return this.fullPath().endsWith('/') ?
            this : new URL(this.withoutQuery().toString() + '/');
    },

    getAllParentDirectories: function() {
        var url = this, all = [], max = 100;;
        do {
            max--;
            if (max == 0) throw new Error('Endless loop in URL>>getAllParentDirectories?')
            all.push(url);
            url = url.getDirectory();
        } while (url.fullPath() != '/')
        return all.reverse();
    },

    toQueryString: function(record) {
        var results = [];
        Properties.forEachOwn(record, function(p, value) {
            results.push(encodeURIComponent(p) + "=" + encodeURIComponent(String(value)));
        });
        return results.join('&');
    },

    getQuery: function() {
        var s = this.toString();
        if (!s.include("?"))
            return {};
        return s.toQueryParams();
    },

    parseHash: function() {
        return this.hash ? decodeURIComponent(this.hash)
            .replace(/^#/, '').split('&').invoke('split', '=')
            .reduce(function(hashMap, keyVal) {
                hashMap[keyVal[0]] = keyVal[1]; return hashMap }, {}) : {};
    },

    toLiteral: function() {
        // URLs are literal
        return Object.clone(this);
    },

    toExpression: function() {
        // this does not work with the new prototype.js (rev 2808) anymore
        // return 'new URL(JSON.unserialize(\'' + JSON.serialize(this) + '\'))';
        return Strings.format('new URL({protocol: "%s", hostname: "%s", pathname: "%s"})',
            this.protocol, this.hostname, this.pathname);
    }

},
"conversion", {

    withPath: function(path) {
        var result = path.match(this.pathSplitter);
        if (!result) return null;
        return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname:
            result[1], search: result[2], hash: result[3] });
    },

    withRelativePath: function(pathString) {
        if (pathString.startsWith('/')) {
            if (this.pathname.endsWith('/'))
                pathString = pathString.substring(1);
        } else {
            if (!this.pathname.endsWith('/'))
                pathString = "/" + pathString;
        }
        return this.withPath(this.pathname + pathString);
    },

    withFilename: function(filename) {
        if (filename == "./" || filename == ".") // a bit of normalization, not foolproof
            filename = "";
        var dirPart = this.isLeaf() ? this.dirname() : this.fullPath();
        return new URL({protocol: this.protocol, port: this.port,
            hostname: this.hostname, pathname: dirPart + filename});
    },

    withQuery: function(record) {
        return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname: this.pathname,
            search: "?" + this.toQueryString(record), hash: this.hash});
    },

    withoutQuery: function() {
        return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname: this.pathname});
    },

    withRelativePartsResolved: function() {
        var path = this.fullPath(),
            result = path;
        // /foo/../bar --> /bar
        do {
            path = result;
            result = path.replace(/\/[^\/]+\/\.\./, '');
        } while (result != path);
        // foo//bar --> foo/bar
        result = result.replace(/([^:])[\/]+/g, '$1/');
        // foo/./bar --> foo/bar
        result = result.replace(/\/\.\//g, '/');
        return this.withPath(result);
    },


    relativePathFrom: function(origin) {
        function checkPathes(path1, path2) {
            var paths1 = path1.split('/'),
                paths2 = path2.split('/');

            paths1.shift();
            paths2.shift();

            for (var i = 0; i < paths2.length; i++) {
                if (!paths1[i] || (paths1[i] != paths2[i]))
                    break;
            }

            // now that's some JavaScript FOO
            var result = '../'.times(paths2.length - i - 1) + paths1.splice(i, paths1.length).join('/');
            return result;
        }

        if (origin.normalizedHostname() != this.normalizedHostname())
            throw new Error('hostname differs in relativePathFrom ' + origin + ' vs ' + this);
        var myPath = this.withRelativePartsResolved().pathname,
            otherPath = origin.withRelativePartsResolved().pathname;
        if (myPath == otherPath) return '';
        var relPath = checkPathes(myPath, otherPath);
        if (!relPath)
            throw new Error('pathname differs in relativePathFrom ' + origin + ' vs ' + this);
        return relPath;
    },

    saveRelativePathFrom: function(url) {
        // if hostname of this and url is the same just return #relativePathFrom
        // otherwise return the whole relative path of this
        return this.hostname === url.hostname ? this.relativePathFrom(url) : this.pathname.replace(/^\/?/, '');
    }

},
"comparison", {

    eq: function(url) {
        if (!url) return false;
        return url.protocol == this.protocol &&
            url.port == this.port &&
            url.normalizedHostname() == this.normalizedHostname() &&
            url.pathname == this.pathname &&
            url.search == this.search &&
            url.hash == this.hash;
    },

    eqDomain: function(url) {
        if (!url) return false;
        return url.protocol == this.protocol &&
            url.port == this.port &&
            url.normalizedHostname() == this.normalizedHostname();
    },

    isIn: function(origin) {
        return origin.normalizedHostname() == this.normalizedHostname() &&
            this.fullPath().startsWith(origin.fullPath());
    }

},
"svn support", {

    svnWorkspacePath: function() {
        // heuristics to figure out the Subversion path
        var path = this.pathname;
        // note that the trunk/branches/tags convention is only a convention
        var index = path.lastIndexOf('trunk');
        if (index < 0) index = path.lastIndexOf('branches');
        if (index < 0) index = path.lastIndexOf('tags');
        if (index < 0) return null;
        return path.substring(index);
    },

    svnVersioned: function(repo, revision) {
        var relative = this.relativePathFrom(repo);
        return repo.withPath(repo.pathname + "!svn/bc/" + revision + "/" + relative);
    },

    notSvnVersioned: function() {
        // concatenates the two ends of the url
        // "http://localhost/livelyBranch/proxy/wiki/!svn/bc/187/test/index.xhtml"
        // --> "http://localhost/livelyBranch/proxy/wiki/index.xhtml"
        return this.withPath(this.fullPath().replace(/(.*)!svn\/bc\/[0-9]+\/(.*)/, '$1$2'));
    },
},
"lively support", {

    asWebResource: function() { return new WebResource(this) },

    asModuleName: function() {
        var urlString = this.withRelativePartsResolved().toString(),
            basePrefix = urlString.substring(0, Config.codeBase.length),
            prefix = urlString.substring(0, Config.rootPath.length),
            moduleName = '',
            result = '';
        if (basePrefix === Config.codeBase) {
            moduleName = urlString.substring(Config.codeBase.length);
        } else if (prefix === Config.rootPath) {
            // TODO what if location is not in Config.modulePaths?
            moduleName = urlString.substring(Config.rootPath.length);
        } else {
            return '';
        }
        if (moduleName.substring(moduleName.length - 3) === '.js') {
            moduleName = moduleName.substring(0, moduleName.length - 3);
        }
        return moduleName.replace(/\//g, '.');
    },

    withoutTimemachinePath: function() {
        var pn = this.pathname,
            match = pn.match(/^\/timemachine\/[^\/]+/);
        return match ?
            URL.fromLiteral(Object.merge([this, {pathname: pn.replace(match, '')}])) :
            this;
    }

});

// create URLs often needed
Object.extend(URL, {
    source: new URL(Config.location.toString()),
    codeBase: (function setURLCodeBase() {
        var url;
        try { url = new URL(Config.codeBase) } catch(e) {
            console.warn('Cannot correctly set URL.codeBase because of ' + e);
            url = new URL(Config.location.toString()).getDirectory();
        }
        return url.withRelativePartsResolved();
    })(),
    root: (function setURLRootPath() {
        var url;
        try { url = new URL(Config.rootPath) } catch(e) {
            console.warn('Cannot correctly set URL.rootPath because of ' + e);
            url = new URL(Config.location.toString()).getDirectory();
        }
        return url.withRelativePartsResolved();
    })(),
    nodejsBase: (function setNodejsBaseURL() {
        try {
            return new URL(Config.rootPath).withRelativePartsResolved().withFilename('nodejs/');
        } catch(e) {};
        return null;
    })()
})

Object.extend(URL, {
    proxy: (function() {
        if (!Config.proxyURL) {
            if (URL.source.protocol.startsWith("file"))
                console.log("loading from localhost, proxying won't work");
            return URL.source.withFilename("proxy/");
        } else {
            var str = Config.proxyURL;
            if (!str.endsWith('/')) str += '/';
            return new URL(str);
        }
    })(),
});

Object.extend(URL, {
    // FIXME: better names?
    common: {
        wiki:   URL.proxy.withFilename('lively-wiki/'),
        repository: URL.proxy.withFilename('lively-kernel/'),
        project: URL.proxy.withFilename('lively-project/'),  // currently lively-kernel.org
        domain: new URL(Config.location.protocol + '//' + Config.location.host)
    },
});

Object.extend(URL, {

    create: function(string) { return new URL(string) },

    ensureAbsoluteURL: function(urlString) {
        return /^(http|file).*/.test(urlString) ?
        new URL(urlString) :
        URL.source.notSvnVersioned().getDirectory().withRelativePath(urlString);
    },
    ensureAbsoluteCodeBaseURL: function(urlString) {
        return /^(http|file).*/.test(urlString) ?
            new URL(urlString) :
            URL.codeBase.withRelativePath(urlString);
    },
    ensureAbsoluteRootPathURL: function(urlString) {
        return /^(http|file).*/.test(urlString) ?
            new URL(urlString) :
            new URL(Config.rootPath).withRelativePath(urlString);
    },
    fromLiteral: function(literal) {
        return new URL(literal)
    },

    makeProxied: function makeProxied(url) {
        url = url instanceof URL ? url : new URL(url);
        var px = this.proxy;
        if (!px) return url;
        if (px.normalizedHostname() != url.normalizedHostname()) // FIXME  protocol?
            return px.withFilename(url.hostname + (url.port ? ':' + url.port : '') + url.fullPath());
        if (px.port != url.port)
            return px.withFilename(url.hostname + ":" + url.port + url.fullPath());
        if (px.hostname != url.hostname) // one has prefix www, the other not
            return new URL({
                protocol: url.protocol,
                port: url.port,
                hostname: px.hostname, // arghhh
                pathname: url.pathname,
                search: url.search,
                hash: url.hash
            })
        return url;
    },

    isURL: function(obj) {
        if (!obj) return false;
        if (obj.isURL) return true;
        return /^(http|file).*/.test(String(obj));
    }

});

(function setupNativeURLObject() {
    Functions.own(Global._URL).forEach(function(name) { 
        Global.URL[name] = Global._URL[name];
    });
})();

Object.subclass('NetRequestStatus',
'documentation', {
    documentation: "nice parsed status information, returned by NetRequest.getStatus when request done",
},
'initialization', {
    initialize: function(method, url, transport) {
        this.method = method;
        this.url = url;
        this.transport = transport;
        this.exception = null;
    },
},
'testing', {
    isDone: function() {
        // transport.DONE not defined in all browsers, so use constant
        return this.transport.readyState === 4;
    },

    isSuccess: function() {
        var code;
        try {
            code = this.transport.status;
        } catch (e) {
            // sometimes the browser throws an error when trying
            // to access transport.status too early
            return false;
        }
        return code >= 200 && code < 300;
    },

    isForbidden: function() {
        var code;
        try {
            code = this.transport.status;
        } catch (e) {
            // sometimes the browser throws an error when trying
            // to access transport.status too early
            return false;
        }
        return code == 403;
    }

},
'accessing', {
    setException: function(e) { this.exception = e },

    toString: function() {
        return Strings.format("Request status (%s): %s", this.requestString(), this.exception || this.transport.status);
    },

    requestString: function() { return this.method + " " + decodeURIComponent(this.url) },

    code: function() { return this.transport.status },

    getResponseHeader: function(name) { return this.transport.getResponseHeader(name) },

});

View.subclass('NetRequest',
'settings', {
    documentation: "a view that writes the contents of an http request into the model",
    useProxy: true,
    // see XMLHttpRequest documentation for the following:
    Unsent: 0,
    Opened: 1,
    HeadersReceived: 2,
    Loading: 3,
    Done: 4
},
'initializing', {
    initialize: function($super, modelPlug) {
        this.transport = new XMLHttpRequest();
        this.requestNetworkAccess();
        this.transport.onreadystatechange = this.onReadyStateChange.bind(this);
        this.isSync = false;
        this.isBinary = false;
        this.requestHeaders = {};
        $super(modelPlug)
    }
},
'accessing', {

    // Updated once, when request is {Done} with the value returned from
    // 'getStatus':
    setStatus:           function(val) { return this._Status = val; },
    // Updated on every state transition of the request:
    setReadyState:       function(val) { return this._ReadyState = val; },
    // Updated at most once, when request state is {Done}, with the parsed XML
    // document retrieved:
    setResponseXML:      function(val) { return this._ResponseXML = val; },
    // Updated at most once, when request state is {Done}, with the text
    // content retrieved:
    setResponseText:     function(val) { return this._ResponseText = val; },
    // Updated at most once, when request state is {Done}, with the response
    // headers retrieved:
    setResponseHeaders:  function(val) { return this._ResponseHeaders = val; },
    getStreamContent:    function() { return this._StreamContent; },
    setStreamContent:    function(val) { return this._StreamContent = val; },
    getProgress:         function() { return this._Progress; },
    setProgress:         function(val) { return this._Progress = val; },

    enableProgress: function() {
        console.log("enableProgress")
        // FIXME onprogress leads to strange 101 errors when no internet connection available
        this.transport.onprogress = this.onProgress.bind(this);
        if (!UserAgent.isTouch && this.transport.upload !== undefined) // FIXME crashes Mobile Safari && IE9+
            this.transport.upload.onprogress = this.onProgress.bind(this);
    },

    requestNetworkAccess: function() {
        if (Global.netscape && Config.location.protocol == "file:") {
            try {
                netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
                console.log("requested browser read privilege");
                return true;
            } catch (er) {
                console.log("no privilege granted: " + er);
                return false;
            }
        }
    },

    beSync: function() {
        this.isSync = true;
        return this;
    },

    beBinary: function() {
        this.isBinary = true;
        return this;
    },

    onReadyStateChange: function() {
        this.setReadyState(this.getReadyState());
        if (this.getReadyState() === this.Loading) { // For comet networking
            this.setStatus(this.getStatus());
            var hasResponseText = false;
            try {
                // FIX for IE9+ if responseText is not available yet
                hasResponseText = this.transport.responseText;
            } catch (e) { console.warn('Request\'s response text is not available yet.'); }
            if (hasResponseText !== undefined) {
                var allContent = this.getResponseText(),
                    newStart = this._streamContentLength ? this._streamContentLength : 0,
                    newContent = allContent.substring(newStart);
                newContent = /^([^\n\r]*)/.exec(newContent)[1]; // remove line breaks
                this.setStreamContent(newContent);
                this._streamContentLength = allContent.length;
            }
        }
        if (this.getReadyState() === this.Done) {
            this.setStatus(this.getStatus());
            if (this.transport.responseText !== undefined)
                this.setResponseText(this.getResponseText());
            if (this.transport.responseXML !== undefined)
                this.setResponseXML(this.getResponseXML());
            try {
                if (this.transport.getAllResponseHeaders() !== undefined)
                    this.setResponseHeaders(this.getResponseHeaders());
            } catch(e) {} // ignore responses without headers
                          // (e.g. when using file:// requests)
            this.disconnectModel(); // autodisconnect?
        }
    },

    onProgress: function(progress) { this.setProgress(progress) },

    setRequestHeaders: function(record) {
        Properties.forEachOwn(record, function(prop, value) {
            this.requestHeaders[prop] = value;
        }, this);
    },

    setContentType: function(string) {
        // valid before send but after open?
        this.requestHeaders["Content-Type"] = string;
    },

    getReadyState: function() { return this.transport.readyState },

    getResponseText: function() { return this.transport.responseText || "" },

    getResponseXML: function() { return this.transport.responseXML || "" },

    getResponseHeaders: function() {
        var headerString = this.transport.getAllResponseHeaders(),
            headerObj = {};
        headerString.split('\r\n').each(function(ea) {
            var splitter = ea.indexOf(':');
            if (splitter != -1) {
                headerObj[ea.slice(0, splitter)] = ea.slice(splitter + 1).trim();
                // as headers should be case-insensitiv, add lower case headers (for Safari)
                headerObj[ea.slice(0, splitter).toLowerCase()] = ea.slice(splitter + 1).trim();
            }
        });
        return headerObj;
    },

    getStatus: function() { return new NetRequestStatus(this.method, this.url, this.transport) },

    request: function(method, url, content) {
        try {
            this.url = url;
            this.method = method.toUpperCase();
            this.transport.open(this.method, url.toString(), !this.isSync);
            Properties.forEachOwn(this.requestHeaders, function(p, value) {
                this.transport.setRequestHeader(p, value);
                }, this);
            if (!this.isBinary)
                this.transport.send(content || '');
            else
                this.transport.sendAsBinary(content || '');
            if (Global.isFirefox && this.isSync) // mr: FF does not use callback when sync
                this.onReadyStateChange();
            return this;
        } catch (er) {
            var status = this.getStatus();
            status.setException(er);
            this.setStatus(status);
            throw er;
        }
    },

    get: function(url) { return this.request("GET", this.useProxy ? URL.makeProxied(url) : String(url), null) },

    put: function(url, content) { return this.request("PUT", this.useProxy ? URL.makeProxied(url) : String(url), content) },

    post: function(url, content) { return this.request("POST", this.useProxy ? URL.makeProxied(url) : String(url), content) },

    propfind: function(url, depth, content) {
        this.setContentType("text/xml"); // complain if it's set to something else?
        if (depth != 0 && depth != 1)
            depth = "infinity";
        this.setRequestHeaders({ "Depth" : depth });
        return this.request("PROPFIND", this.useProxy ? URL.makeProxied(url) : String(url), content);
    },

    report: function(url, content) { return this.request("REPORT", this.useProxy ? URL.makeProxied(url) : String(url), content) },

    mkcol: function(url, content) { return this.request("MKCOL", this.useProxy ? URL.makeProxied(url) : String(url), content) },

    del: function(url) {
        // http://www.webdav.org/specs/rfc2518.html#rfc.section.8.6.2
        this.setRequestHeaders({ "Depth" : "infinity" });
        return this.request("DELETE", this.useProxy ? URL.makeProxied(url) : String(url));
    },

    copy: function(url, destUrl, overwrite) {
        this.setRequestHeaders({ "Destination" : destUrl.toString() });
        if (overwrite) this.setRequestHeaders({ "Overwrite" : 'T' });
        return this.request("COPY", this.useProxy ? URL.makeProxied(url) : String(url));
    },
    move: function(url, destUrl, overwrite) {
        this.setRequestHeaders({ "Destination" : destUrl.toString() });
        if (overwrite) this.setRequestHeaders({ "Overwrite" : 'T' });
        return this.request("MOVE", this.useProxy ? URL.makeProxied(url) : String(url));
    },


    lock: function(url, owner) {
        this.setRequestHeaders({Timeout: 'Infinite, Second-30'});
        var content = Strings.format('<?xml version="1.0" encoding="utf-8" ?> \n\
        <D:lockinfo xmlns:D=\'DAV:\'> \n\
        <D:lockscope><D:exclusive/></D:lockscope> \n\
        <D:locktype><D:write/></D:locktype> \n\
        <D:owner>%s</D:owner> \n\
        </D:lockinfo>', owner || 'unknown user');
        return this.request("LOCK", this.useProxy ? URL.makeProxied(url) : String(url), content);
    },

    unlock: function(url, lockToken, force) {
        if (force) {
            var req = new NetRequest().beSync().propfind(url);
            var xml = req.getResponseXML() || stringToXML(req.getResponseText());
            var q = new Query('/descendant::*/D:lockdiscovery/descendant::*/D:locktoken/D:href');
            var tokenElement = q.findFirst(xml);
            if (!tokenElement) // no lock token, assume that resource isn't locked
            return req;
            lockToken = tokenElement.textContent;
        }
        this.setRequestHeaders({'Lock-Token': '<' + lockToken + '>'});
        return this.request("UNLOCK", this.useProxy ? URL.makeProxied(url) : String(url));
    },
    head: function(url) { return this.request("HEAD", this.useProxy ? URL.makeProxied(url) : String(url), null) },

    toString: function() { return "#<NetRequest{"+ this.method + " " + this.url + "}>" }

});


View.subclass('Resource', {
    documentation: "a remote document that can be fetched, stored and queried for metadata",
    // FIXME: should probably encapsulate content type

    formals: [
        "ContentDocument", //:XML
        "ContentText", //:String
        "URL", // :URL
        "RequestStatus", // :NetRequestStatus
        "ResponseHeaders",
        "Progress"
    ],

    createNetRequest: function() {
        return new NetRequest({
            model: this,
            setResponseXML: "setContentDocument",
            setResponseText: 'setContentText',
            setStatus: "setRequestStatus",
            setResponseHeaders: "setResponseHeaders",
            setProgress: 'setProgress'
        });
    },

    initialize: function(plug, contentType) {
        this.contentType  = contentType;
        this.connectModel(plug);
    },

    deserialize: Functions.Empty, // stateless besides the model and content type

    toString: function() {
        return "#<Resource{" + this.getURL() + "}>";
    },

    updateView: function(aspect, source) {
        var p = this.modelPlug;
        if (!p) return;
        switch (aspect) {
            case p.getURL:
            this.onURLUpdate(this.getURL()); // request headers?
            break;
        }
    },

    onURLUpdate: function(url) {
        return this.fetch(url);
    },

    fetch: function(sync, optRequestHeaders) {
        // fetch the document content itself
        var req = this.createNetRequest();
        if (sync) req.beSync();
        if (this.contentType) req.setContentType(this.contentType);
        if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
        if (this.isShowingProgress) req.enableProgress();
        req.get(this.getURL());
        return req;
    },

    fetchProperties: function(optSync, optRequestHeaders) {
        var req = this.createNetRequest();
        if (optSync) req.beSync();
        if (this.contentType) req.setContentType(this.contentType);
        if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
        req.propfind(this.getURL(), 1);
        return req;
    },

    store: function(content, optSync, optRequestHeaders) {
        // FIXME: check document type
        if ((Global.Document && content instanceof Document) || (Global.Node && content instanceof Node)) {
            content = Exporter.stringify(content);
        }
        var req = this.createNetRequest();
        if (optSync) req.beSync();
        if (this.contentType) req.setContentType(this.contentType);
        if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
        if (this.isShowingProgress)    req.enableProgress();
        req.put(this.getURL(), content);
        return req;
    },

});

Resource.subclass('SVNResource', {

    formals: Resource.prototype.formals.concat(['Metadata', 'HeadRevision', 'LocationHistory']),

    createNetRequest: function() {
        return new NetRequest({
            model: this,
            setResponseXML: "setContentDocument",
            setResponseText: 'setContentText',
            setStatus: "setRequestStatus",
            setResponseHeaders: "setResponseHeaders",
            setProgress: 'setProgress'
        });
    },

    initialize: function($super, repoUrl, plug, contentType) {
        this.repoUrl = repoUrl.toString();
        $super(plug, contentType);
    },

    getLocalUrl: function() {
        return new URL(this.getURL()).relativePathFrom(new URL(this.repoUrl)).toString();
    },

    fetchHeadRevision: function(optSync) {
        var req = new NetRequest({
            model: this,
            setResponseXML: "pvtSetHeadRevFromDoc",
            setStatus: "setRequestStatus",
            setProgress: 'setProgress'
        });
        if (optSync) req.beSync();
        req.propfind(this.getURL(), 1);
        return req;
    },

    fetch: function($super, optSync, optRequestHeaders, rev) {
        var req;
        if (rev) {
            this.withBaselineUriDo(rev, function() { req = $super(optSync, optRequestHeaders) });
        } else {
            req = $super(optSync, optRequestHeaders);
        };
        return req;
    },

    store: function($super, content, optSync, optRequestHeaders, optHeadRev) {
        // if optHeadRev is not undefined than the store will only succeed
        // if the head revision of the resource is really optHeadRev
        if (optHeadRev) {
            var headers = optRequestHeaders ? optRequestHeaders : {};
            //determine local path of resource
            //var local = new URL(this.getURL()).relativePathFrom(new URL(this.repoUrl));
            var local = this.getURL().toString().substring(this.repoUrl.toString().length);
            if (local.startsWith('/')) local = local.slice(1); // remove leading slash
            var ifHeader = Strings.format('(["%s//%s"])', optHeadRev, local);
            console.log('Creating if header: ' + ifHeader);
            Object.extend(headers, {'If': ifHeader});
        }
        return $super(content, optSync, headers);
    },

    del: function(sync, optRequestHeaders) {
        var req = new NetRequest(this.createNetRequest());
        if (sync) req.beSync();
        if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
        req.del(this.getURL());
        return req;
    },

    fetchProperties: function($super, optSync, optRequestHeaders, rev) {
        var req;
        if (rev) {
            this.withBaselineUriDo(rev, function() { req = $super(optSync, optRequestHeaders) });
        } else {
            req = $super(optSync, optRequestHeaders);
        };
        return req;
    },

    fetchMetadata: function(optSync, optRequestHeaders, startRev, endRev, reportDepth) {
        // get the whole history if startRev is undefined
        // FIXME: in this case the getHeadRevision will be called synchronous
        if (!startRev) {
            this.fetchHeadRevision(true);
            startRev = this.getHeadRevision();
        }
        this.reportDepth = reportDepth; // FIXME quick hack, needed in 'pvtScanLog...'
        var req = new NetRequest({
            model: this,
            setResponseXML: "pvtScanLogReportForVersionInfos",
            setStatus: "setRequestStatus",
            setProgress: 'setProgress'
        });
        if (optSync) req.beSync();
        if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
        req.report(this.getURL(), this.pvtRequestMetadataXML(startRev, endRev));
        return req;
    },
    fetchLocationHistory: function(optSync, optRequestHeaders, pegRev, locationRev, reportDepth) {
        locationRev = locationRev || 0;
        this.reportDepth = reportDepth; // FIXME quick hack, needed in 'pvtScanLog...'
        var req = new NetRequest({
            model: this,
            setResponseXML: "pvtScanLogReportForLocationHistory",
            setStatus: "setRequestStatus",
            setProgress: 'setProgress'
        });
        if (optSync) req.beSync();
        if (optRequestHeaders) req.setRequestHeaders(optRequestHeaders);
        req.report(this.getURL(), this.pvtRequestLocationXML(pegRev, locationRev));
        return req;
    },


    pvtSetHeadRevFromDoc: function(xml) {
        if (!xml) return;
        /* The response contains the properties of the specified file or directory,
        e.g. the revision (= version-name) */
        var revisionNode = xml.getElementsByTagName('version-name')[0];
        if (!revisionNode) return;
        this.setHeadRevision(Number(revisionNode.textContent));
    },

    pvtScanLogReportForVersionInfos: function(logReport) {
        // FIXME Refactor: method object?

        var errorMsg = this.findErrorInLogReport(logReport);
        if (errorMsg) { alert(errorMsg); return }

        var depth = this.reportDepth,
            logItemQ = new Query('//S:log-item'),
            versionInfos = [],
            repoUrl = this.repoUrl,
            result = logItemQ.findAll(logReport);

        for (var i = 0; i < result.length; i++) {
            var logElement= result[i];
            var spec = {};
            for (var j = 0; j < logElement.childNodes.length; j++) {
                var logProp = logElement.childNodes[j];
                switch(logProp.tagName) {
                    case 'D:version-name':
                        spec.rev = Number(logProp.textContent); break;
                    case 'D:creator-displayname':
                        spec.author = logProp.textContent; break;
                    case 'S:date':
                        spec.date = logProp.textContent; break;
                    case 'S:added-path':
                    case 'S:modified-path':
                    case 'S:deleted-path':
                    case 'S:replaced-path':
                        var relPath = logProp.textContent;
                        if (depth && relPath.split('/').length-1 > depth)
                            continue;
                        //relPath = relPath.slice(1); // remove trailing /
                        if (repoUrl.endsWith(relPath))
                            spec.url = repoUrl; // hmmm???
                        else
                            spec.url = repoUrl.toString() + relPath.slice(1);
                        if (!spec.changes) spec.changes = [];
                        var type = logProp.tagName.split('-').first();
                        var url = logProp.tagName.include('modified-path') ? logProp.textContent : null;
                        spec.changes.push({type: type, url : url});
                        break;
                    default:
                }
            };
            if (!spec.url) continue;
            spec.url = new URL(spec.url);
            versionInfos.push(new SVNVersionInfo(spec));
        };
        // newest version first
        versionInfos = versionInfos.sortBy(function(vInfo) { return vInfo.rev }).reverse();
        this.setMetadata(versionInfos);
    },

    pvtScanLogReportForVersionInfosTrace: function(logReport) {
        lively.lang.Execution.trace(this.pvtScanLogReportForVersionInfos.curry(logReport).bind(this));
    },
    pvtScanLogReportForLocationHistory: function(logReport) {
        var errorMsg = this.findErrorInLogReport(logReport);
        if (errorMsg) { alert(errorMsg); return }

        var locationQ = new Query('S:get-locations-report//S:location[@path]'),
            pathElement = locationQ.findFirst(logReport),
            path = pathElement.getAttribute('path'),
            rev = Number(pathElement.getAttribute('rev')),
            history = this.getLocationHistory() || {};
        history[rev] = path;
        this.setLocationHistory(history);
    },


    pvtRequestMetadataXML: function(startRev, endRev) {
        return Strings.format(
            '<S:log-report xmlns:S="svn:" xmlns:D="DAV:">' +
            '<S:start-revision>%s</S:start-revision>' +
            '<S:end-revision>%s</S:end-revision>' +
            '<S:discover-changed-paths/>' +
            '<S:path></S:path>' +
            '<S:all-revprops/>' +
            '</S:log-report>', startRev, endRev || 0);
    },
    pvtRequestLocationXML: function(pegRev, pastRev) {
        return Strings.format(
            '<S:get-locations xmlns:S="svn:">' +
                '<S:path></S:path>' +
                '<S:peg-revision>%s</S:peg-revision>' +
                '<S:location-revision>%s</S:location-revision>' +
            '</S:get-locations>', pegRev, pastRev);
    },
    findErrorInLogReport: function(logReport) {
        // check for error response, query.find will throw error so use try block
        var errorQ = new Query('D:error//m:human-readable');
        try {
            var errorDesc = errorQ.findFirst(logReport),
                msg = Strings.format('Error in report of %s: %s', this.getURL(), errorDesc.textContent);
            return msg;
        } catch(e) {
            return null;
        }
    },

    withBaselineUriDo: function(rev, doFunc) {
        var tempUrl = this.getURL();
        this.setURL(this.createVersionURLString(rev));
        doFunc();
        this.setURL(tempUrl);
    },

    createVersionURLString: function(rev) {
        return this.repoUrl + '/!svn/bc/' + rev + '/' + this.getLocalUrl();
    }

});

Object.subclass('SVNVersionInfo', {

    documentation: 'This object wraps svn infos from report or propfind requests',

    initialize: function(spec) {
        // possible properties of spec:
        // rev, date, author, url, change, content
        for (var name in spec) {
            var val = spec[name];
            if (name == 'date') {
                if (Object.isString(val)) {
                    this.date = this.parseUTCDateString(val);
                } else if (val instanceof Date) {
                    this.date = val;
                }
            } else {
                this[name] = val;
            }
        }
        if (!this.author)
            this.author = '(no author)';
        if (!this.date)
            this.date = new Date();
    },

    parseUTCDateString: function(dateString) {
        var yearElems = dateString.slice(0,10).split('-').collect(function(ea) {return Number(ea)});
        var timeElems = dateString.slice(11,19).split(':').collect(function(ea) {return Number(ea)});
        return new Date(yearElems[0], yearElems[1]-1, yearElems[2], timeElems[0], timeElems[1], timeElems[2])
    },

    toString: function() {
        // does not work when evaluate {new SVNVersionInfo() + ""} although toStrings() works fine. *grmph*
        // string = Strings.format('%s, %s, %s, Revision %s',
        //     this.author, this.date.toTimeString(), this.date.toDateString(), this.rev);
        // string = new String(string);
        // string.orig = this;
        // TODO work around Serialization bug
        var timeString = this.date.toTimeString ?
            this.date.toTimeString() :
            'no time';

        var dateString = this.date.toDateString ?
            this.date.toDateString() :
            'no date';

        return Strings.format('%s, %s, %s, Rev. %s',
            this.author, timeString, dateString, this.rev);
    },

    toExpression: function() {
        return Strings.format('new SVNVersionInfo({rev: %s, url: %s, date: %s, author: %s, change: %s, fileSize: %s})',
        this.rev, toExpression(this.url), toExpression(this.date),
        toExpression(this.author), toExpression(this.change), toExpression(this.fileSize));
    }

});

Object.extend(SVNVersionInfo, {
    fromPropfindNode: function(node) {
        // FIXME cleanup --> Similar code exists  in lively.Network -> pvtSetMeta...sth
        // rk 2/22/10: the namespace tag lp1 is required by Firefox
        var prefix = UserAgent.fireFoxVersion ? 'lp1:' : '';

        var versionTag = node.getElementsByTagName(prefix + 'version-name')[0];
        var rev = versionTag ? Number(versionTag.textContent) : 0;

        var dateTag = node.getElementsByTagName(prefix + 'getlastmodified')[0];
        var date = new Date(dateTag ? dateTag.textContent : 'Mon, 01 Jan 1900 00:00:00 GMT');

        var authorTag = node.getElementsByTagName(prefix + 'creator-displayname')[0];
        var author = authorTag ? authorTag.textContent : 'anonymous';

        var sizeTag = node.getElementsByTagName(prefix + 'getcontentlength')[0];
        var fileSize = sizeTag ? Number(sizeTag.textContent) : -1;

        // FIXME: resolve prefix "D" to something meaningful?
        var nameQ = new Query("D:href");
        var result = nameQ.findFirst(node);
        var name = result && decodeURIComponent(result.textContent);
        var slash = name.endsWith('/') ? name.lastIndexOf('/', name.length - 2) : name.lastIndexOf('/');
        var shortName = name.substring(slash + 1);

        return new SVNVersionInfo({
            rev: rev,
            date: date,
            author: author,
            shortName: shortName,
            url: name,
            fileSize: fileSize
        });
    }
});

Object.subclass('WebResource',
'documentation', {
    connections: ['status',
                  'content',
                  'contentDocument',
                  'isExisting',
                  'subCollections',
                  'subDocuments',
                  'progress',
                  'readystate',
                  'versions',
                  'headRevision',
                  'lastModified']
},
'initializing', {
    initialize: function(url) {
        this._url = new URL(url);
        this.beSync();
        this.reset();
    },

    reset: function() {
        this.beText();
        this.status = null;
        this.content = null;
        this.contentDocument = null;
        this.isExisting = null;
        this.subResources = null;
        this.requestHeaders = {};
        this.responseHeaders = {};
    },

    createResource: function() {
        var self = this;
        var resource = new SVNResource(
            this.getRepoURL().toString(), {
                model: {
                    url: self.getURL().toString(),
                    getURL: function() { return this.url },
                    setURL: function(url) { this.url = url },
                    setRequestStatus: function(reqStatus) {
                        self.status = reqStatus; self.isExisting = reqStatus.isSuccess() },
                    setContentText: function(string) { self.content = string },
                    setContentDocument: function(doc) { self.contentDocument = doc },
                    setResponseHeaders: function(obj) { self.responseHeaders = obj },
                    setProgress: function(progress) { self.progress = progress },
                    setHeadRevision: function(rev) { self.headRevision = rev },
                    getHeadRevision: function() { return self.headRevision },
                    setMetadata: function(metadata) { self.versions = metadata }
                },
                getURL: 'getURL',
                setURL: 'setURL',
                setRequestStatus: 'setRequestStatus',
                setContentText: 'setContentText',
                setContentDocument: 'setContentDocument',
                setResponseHeaders: 'setResponseHeaders',
                setProgress: 'setProgress',
                setHeadRevision: 'setHeadRevision',
                getHeadRevision: 'getHeadRevision',
                setMetadata: 'setMetadata'
            });
        resource.isShowingProgress = this.isShowingProgress;
        return resource;
    },

    createNetRequest: function() {
        var self = this,
            request = new NetRequest({
                model: {
                    setStatus: function(reqStatus) {
                        if (reqStatus.isSuccess()) {
                            self.setLastModificationDateFromXHR(request.transport);
                        }
                        self.status = reqStatus;
                        self.isExisting = reqStatus.isSuccess();
                    },
                    setResponseText: function(string) { self.content = string },
                    setResponseXML: function(doc) { self.contentDocument = doc },
                    setResponseHeaders: function(obj) { self.responseHeaders = obj },
                    setReadyState: function(readyState) { self.readystate = readyState },
                    setProgress: function(progress) { self.progress = progress },
                    setStreamContent: function(content) {
                        self.content = content;  self.streamContent = content  }
                },
                setStatus: 'setStatus',
                setResponseText: 'setResponseText',
                setResponseXML: 'setResponseXML',
                setResponseHeaders: 'setResponseHeaders',
                setReadyState: 'setReadyState',
                setProgress: 'setProgress',
                setStreamContent: 'setStreamContent'
        });
        if (this.isSync()) request.beSync();
        if (this.requestHeaders) request.requestHeaders = this.requestHeaders;
        if (this._noProxy) request.useProxy = false;
        this.xhr = request.transport;
        return request;
    },
    createXMLHTTPRequest: function(method) {
        // objects to  work with
        method = method.toUpperCase();
        var webR = this,
            url = this.getURL(),
            requestHeaders = this.requestHeaders,
            isSync = this.isSync(),
            req = new XMLHttpRequest(),
            loadStates = {UNSENT: 0, OPENED: 1, HEADERSRECEIVED: 2, LOADING: 3, DONE: 4};

        // helper functions
        function createStatus () { return new NetRequestStatus(method, url, req) };
        function extractHeaders(req) {
            var headerString = req.getAllResponseHeaders(),
                headerObj = {};
            headerString.split('\r\n').forEach(function(ea) {
                var splitter = ea.indexOf(':');
                if (splitter != -1) {
                    headerObj[ea.slice(0, splitter)] = ea.slice(splitter + 1).trim();
                    // as headers should be case-insensitiv, add lower case headers (for Safari)
                    headerObj[ea.slice(0, splitter).toLowerCase()] = ea.slice(splitter + 1).trim();
                }
            });
            return headerObj;
        };
        function onReadyStateChange() {
            var status = createStatus();
            // do this before setting status so that the properties are
            // already available when connections to status are updated
            if (req.readyState == loadStates.DONE) {
                webR.setLastModificationDateFromXHR(req);
            }
            webR.status = status;
            if (req.readyState == loadStates.DONE) {
                webR.isExisting = status.isSuccess();
                if (req.responseText !== undefined)
                    webR.content = req.responseText;
                if (req.responseXML !== undefined)
                    webR.contentDocument = req.responseXML;
                if (req.getAllResponseHeaders() !== undefined)
                    webR.responseHeaders = extractHeaders(req);
            }
        };

        function onProgress(evt) {
            webR.progressEvent = evt;
            // var percentComplete = (e.position / e.totalSize)*100;
        };
        // register event handlers
        req.onreadystatechange = onReadyStateChange;

        if (method === 'PUT' || method === 'POST') {
            req.upload.addEventListener("progress", onProgress, false);
            // req.upload.addEventListener("load", transferComplete, false);
            // req.upload.addEventListener("error", transferFailed, false);
            // req.upload.addEventListener("abort", transferCanceled, false);
        } else {
            req.addEventListener("progress", onProgress, false);
        }

        this.xhr = req;

        var proxied = !this._noProxy;
        // to be more or less compatible with the netRequest object -- fixme should simplified
        return {
            request: function(content) {
                var proxiedUrl = proxied ? URL.makeProxied(url) : url;
                req.open(method, proxiedUrl.toString(), !isSync);
                Properties.forEachOwn(requestHeaders, function(p, value) {
                    req.setRequestHeader(p, value);
                });
                var sendSelector = webR.isBinary() && req.sendAsBinary ? 'sendAsBinary' : 'send';
                try {
                    req[sendSelector](content);
                    if (Global.isFirefox && isSync) // mr: FF does not use callback when sync
                        onReadyStateChange();
                } catch (er) {
                    webR.status = createStatus();
                    throw er;
                }
            }
        }
    }

},
'private', {
    temporaryChangeURLAndDo: function(otherURL, func) {
        var temp = this._url;
        this._url = otherURL;
        var result = func.call(this)
        this._url = temp;
        return result;
    },

    setLastModificationDateFromXHR: function(xhr) {
        try {
            var dateString = xhr.getResponseHeader("last-modified")
                          || xhr.getResponseHeader("Date");
            if (dateString) this.lastModified = new Date(dateString);
        } catch (e) {} // ignore errors when headers are missing
                       // (e.g. when making file:// requests)
    }
},
'accessing', {
    getURL: function() { return this._url; },
    getRepoURL: function() {
        return new URL(Config.rootPath) // FIXME repo!
    },

    getName: function() { return this.getURL().filename(); },
    isCollection: function() { return !this.getURL().isLeaf() },
    getJSON: function() {
        try { return JSON.parse(this.content); } catch(e) { return {error: e} }
    },
    whenDone: function(callback) {
        // run callback when request is done. arguments to callback: content, status
        lively.bindings.connect(this, 'content', callback, 'call', {
            updater: function($upd, content) {
                var status = this.sourceObj.status;
                if (!status || !status.isDone()) return;
                $upd(null, content, status);
            }, removeAfterUpdate: true});
        return this;
    },
    withJSONWhenDone: function(callback) {
        var webR = this;
        return this.whenDone(function(content, status) {
            var json;
            try { json = JSON.parse(content); } catch(e) { json = {error: e} }
            callback.call(null, json, status); });
    }
},
'configuration', {
    isSync: function() { return this._isSync; },
    beSync: function() { this._isSync = true; return this; },
    beAsync: function() { this._isSync = false; return this; },
    setSync: function(bool) { this._isSync = bool; return this; },

    isBinary: function() { return this._isBinary; },
    beBinary: function() { this._isBinary = true; return this; },
    beText: function() { this._isBinary = false; return this; },

    forceUncached: function() {
        this._url = this.getURL().withQuery({time: new Date().getTime()});
        return this;
    },

    noProxy: function() { this._noProxy = true; return this; }
},
'progress', {
    enableShowingProgress: function() { this.isShowingProgress = true; return this },
    createProgressBar: function(label) {
        // this.enableShowingProgress();
        // var labelFunc = Object.isString(labelOrFunc) ?
            // function() { return labelOrFunc } : labelOrFunc;
        var progressBar = lively.morphic.World.current().addStatusProgress(label);
        lively.bindings.connect(this, 'progressEvent', progressBar, 'setValue',
            {converter: function(rpe) { return (rpe.loaded / rpe.total) }});
        lively.bindings.connect(this, 'status', progressBar, 'remove', {
            updater: function($upd, status) { if (status.isDone()) $upd() }});
        return this;
    }

},
'DEPRECATED', {
    copyTo: function(url) {
        var otherResource = new WebResource(url);
        otherResource.create();
        new NetRequest().copy(this.getURL(), url, true /*overwrite*/);
        return otherResource;
    }

},
'debugging', {
    statusMessage: function(successMsg, failureMessage, onlyOnce) {
        this.successMsg = successMsg;
        this.failureMessage = failureMessage;
        var world = lively.morphic.World.current();
        if (!world) return this;
        lively.bindings.connect(this, 'status', world, 'setStatusMessage', {
            updater: function($upd, status) {
                if (!status.isDone()) return;
                var m1 = this.sourceObj.successMsg,
                    m2 = this.sourceObj.failureMessage;
                if (status.isSuccess() && m1) $upd(m1, Color.green, 4)
                else if (m2) $upd(m2 + ' (code ' + status.code() + ')', Color.red, 6)
            },
            removeAfterUpdate: onlyOnce
        });
        return this
    },

    toString: function() { return 'WebResource(' + this.getURL() + ')' }
},
'request headers', {

    setRequestHeaders: function(headers) {
        this.requestHeaders = Object.merge([this.requestHeaders || {}, headers]);
        return this;
    },

    addHeaderForPutRequirements: function(options) {
        var rev = options.requiredSVNRevision,
            date = options.ifUnmodifiedSince;
        if (rev) {
            var local = this.getURL().relativePathFrom(this.getRepoURL()),
                ifHeader = Strings.format('(["%s//%s"])', rev, local);
            this.requestHeaders["If"] = ifHeader;
        } else if (date) {
            var dateString = date.toGMTString ? date.toGMTString() : date.toString();
            this.requestHeaders["if-unmodified-since"] = dateString;
        }
    },
    addContentType: function(contentType) {
        this.requestHeaders["Content-Type"] = contentType || '';
    },
    addNoCacheHeader: function() {
        this.setRequestHeaders({"Cache-Control": 'no-cache'});
        return this;
    }

},
'HTTP methods', {

    get: function(rev, contentType, urlOfPastVersion) {
        if (!rev) {
            var req = this.createNetRequest()
            if (contentType) req.setContentType(contentType);
            req.get(this.getURL());
            return this;
        }
        if (urlOfPastVersion) {
            this.temporaryChangeURLAndDo(urlOfPastVersion, function() {
                var resource = this.createResource();
                if (contentType) resource.contentType = contentType;
                this.xhr = resource.fetch(this.isSync(), this.requestHeaders, rev);
            })
            return this;
        }
        // use a helper so that connections to this are not triggered when
        // location XML is written to content/contentDocument
        var helper = new WebResource(this.getURL());
        helper.setSync(this.isSync())
        lively.bindings.connect(helper, 'revAndLocations', this, 'get', {
            updater: function($upd, revAndPath) { $upd(rev, contentType, revAndPath[rev]) },
            varMapping: {rev: rev, contentType: contentType}});
        helper.getLocationInRev(rev, this.headRevision);
        return this;
    },
    get2: function(rev, contentType, urlOfPastVersion) {
        if (!rev) {
            if (contentType) this.addContentType(contentType);
            var req = this.createXMLHTTPRequest('GET');
            req.request();
            return this;
        }
        if (urlOfPastVersion) {
            this.temporaryChangeURLAndDo(urlOfPastVersion, function() {
                var resource = this.createResource();
                if (contentType) resource.contentType = contentType;
                resource.fetch(this.isSync(), this.requestHeaders, rev);
            })
            return this;
        }
        // use a helper so that connections to this are not triggered when
        // location XML is written to content/contentDocument
        var helper = new WebResource(this.getURL());
        helper.setSync(this.isSync())
        lively.bindings.connect(helper, 'revAndLocations', this, 'get', {
            updater: function($upd, revAndPath) { $upd(rev, contentType, revAndPath[rev]) },
            varMapping: {rev: rev, contentType: contentType}});
        helper.getLocationInRev(rev, this.headRevision);
        return this;
    },

    put_DEPRECATED: function(content, contentType, requiredRevision) {
        this.content = this.convertContent(content);
        var resource = this.createResource();
        if (contentType)
            resource.contentType = contentType;
        resource.store(content, this.isSync(), this.requestHeaders, requiredRevision);

        return this;
    },

    put: function(content, contentType, options) {
        // options: {requiredSVNRevision: String || Number}
        options = options || {};
        contentType = contentType || options.contentType;
        this.content = this.convertContent(content || '');
        this.addHeaderForPutRequirements(options);
        if (contentType) this.addContentType(contentType)
        this.addNoCacheHeader();
        var req = this.createXMLHTTPRequest('PUT');
        req.request(this.content);
        return this;
    },

    create: function() {
        if (!this.isCollection()) return this.put('');
        var request = this.createNetRequest();
        request.mkcol(this.getURL());
        return this;
    },

    del: function() {
        // this mehod intentionally not called delete because some JS engines
        // throw an error when parsing "keywords" as object key names
        var request = this.createNetRequest();
        request.del(this.getURL());
        return this;
    },

    post: function(content, contentType) {
        this.content = content;
        var request = this.createNetRequest();
        if (contentType) {
            request.setContentType(contentType);
        }
        request.post(this.getURL(), content);
        return this;
    },

    exists: function() {
        // for async use this.get().isExisting directly
        try {
            return this.beSync().head().status.isSuccess()
        } catch(e) {
            return false;
        }
    },
    head: function() {
        var request = this.createNetRequest();
        request.head(this.getURL());
        return this;
    },

    propfind: function(depth) {
        if (!depth) depth = 1;
        var req = this.createNetRequest();
        req.propfind(this.getURL(), depth);
        return this;
    },

    report: function(content) {
        var req = this.createNetRequest();
        req.report(this.getURL(), content);
        return this;
    },

    getSubElements: function(depth) {
        lively.bindings.connect(this, 'contentDocument', this, 'pvtProcessPropfindForSubElements', {removeAfterUpdate: true});
        this.propfind(depth);
        return this;
    },

    copyTo: function(url) {
        var request = this.createNetRequest();
        request.copy(this.getURL(), url, true /*overwrite*/);
        return this;
    },
    moveTo: function(url) {
        var request = this.createNetRequest();
        request.move(this.getURL(), url, true /*overwrite*/);
        return this;
    },

    getVersions: function(startRev, endRev) {
        var res = this.createResource();
        if (!startRev) {
            if (this.headRevision) {
                startRev = this.headRevision;
            } else {
                // FIXME if endRev is passed in, it's forgotten here...

                // we are using the headRev of the whoe repository here because if a file
                // gets indirectly moved (one of its containing dirs is moved), its headRev
                // would not be updated but its URL would not point to the file in the
                // history. Using the global headRev fixes this.
                var repoWebR = new WebResource(res.repoUrl);
                lively.bindings.connect(repoWebR, 'headRevision', this, 'headRevision', {removeAfterUpdate: true});
                lively.bindings.connect(this, 'headRevision', this, 'getVersions', {removeAfterUpdate: true});
                repoWebR.getHeadRevision();
                return this;
            }
        }
        this.xhr = res.fetchMetadata(this.isSync(), this.requestHeaders, startRev, endRev, null);
        return this;
    },

    getHeadRevision: function() {
        var res = this.createResource();
        res.fetchHeadRevision(this.isSync());
        return this;
    },

    getProperties: function(optRequestHeaders, rev) {
        var res = this.createResource();
        this.xhr = res.fetchProperties(this.isSync(), optRequestHeaders, rev);
        return this;
    },

    ensureExistance: function() {
        var url = this.getURL();
        url.getAllParentDirectories().forEach(function(ea) {
            var webR = new WebResource(ea);
            if (!webR.exists()) {
                console.log('creating ' + webR.getURL());
                webR.create();
            }
        })
        return this;
    }

},
'version specific', {
    getLocationInRev: function(rev) {
        var self = this,
            reportRequester = {
                action: function(headRev) {
                    var content = Strings.format(
                        '<S:get-locations xmlns:S="svn:">' +
                            '<S:path></S:path>' +
                            '<S:peg-revision>%s</S:peg-revision>' +
                            '<S:location-revision>%s</S:location-revision>' +
                        '</S:get-locations>', headRev, rev);
                    lively.bindings.connect(self, 'contentDocument', self, 'pvtProcessForLocationRequest', {
                        removeAfterUpdate: true});
                    self.report(content);
                }
            }
        if (this.headRevision) {
            reportRequester.action(this.headRevision)
        } else {
            lively.bindings.connect(self, 'headRevision', reportRequester, 'action', {removeAfterUpdate: true});
            this.getHeadRevision();
        }
        return this;
    },

},
'XML querying', {
    pvtProcessForLocationRequest: function(doc) {
        var revAndLocations = {},
            locations = doc.getElementsByTagName('location');
        for (var i = 0; i < locations.length; i++) {
            var rev = locations[i].getAttribute('rev'),
                path = locations[i].getAttribute('path');
            revAndLocations[rev] = this.getRepoURL().withFilename(path);
        }
        // set it when retrieved so that connections work
        this.revAndLocations = revAndLocations;
    },

    ensureDavXmlNs: function(doc) {
        // FIXME read xmlds:D or xmlns:d instead of guessing
        var tmp,
            davNs;
        if (this.davNs) {
          return this.davNs
        }
        try {
            tmp = new Query("/D:multistatus").findFirst(doc.documentElement);
            davNs = "D";
        } catch (e) {
            try {
                tmp = new Query("/d:multistatus").findFirst(doc.documentElement);
                davNs = "d";
            } catch (e) {
            }
        }
        this.davNs = davNs;
        return davNs;
    },

    pvtProcessPropfindForSubElements: function(doc) {
        if (!this.status.isSuccess()) {
            console.warn('Cannot access subElements of ' + this.getURL());
            this.subCollections = [];
            this.subDocuments = [];
        } else {
            this.pvtProcessPropfindResults(doc);
        }
    },

    pvtProcessPropfindResults: function(doc) {
        var result = [];
        if (!this.status.isSuccess()) return;
        var davNs = this.ensureDavXmlNs(doc),
            nodes = new Query("/" + davNs + ":multistatus/" + davNs + ":response").findAll(doc.documentElement),
            urlQ = new Query(davNs + ':href');
        nodes.shift(); // remove first since it points to this WebResource
        for (var i = 0; i < nodes.length; i++) {
            var urlNode = urlQ.findFirst(nodes[i]),
                url = urlNode.textContent || urlNode.text; // text is FIX for IE9+
            if (/!svn/.test(url)) continue;// ignore svn dirs
            try {
                // Try to fix url in case it was proxied
                URL.root.relativePathFrom(this.getURL()); // may throw error
                var child = new WebResource(url.startsWith('/') ?
                    URL.root.withPath(url) : URL.root.withFilename(url)
                );
            } catch (e) {
                var child = new WebResource(this.getURL().withPath(url));
            }
            var revNode = nodes[i].getElementsByTagName('version-name')[0];
            if (revNode) child.headRevision = Number(revNode.textContent);
            result.push(child);
        }
        this.subCollections = result.select(function(ea) { return ea.isCollection() });
        this.subDocuments = result.select(function(ea) { return !ea.isCollection() });
    }
},
'conversion', {
    convertContent: function(content) {
        // if requiredRevision is set then put will only succeed if the resource has
        // the revision number requiredRevision
        if (this.isBinary()) {
            // from http://code.google.com/p/chromium/issues/detail?id=35705#c6
            var byteValue = function(x) { return x.charCodeAt(0) & 0xff },
                ords = Array.prototype.map.call(content, byteValue),
                ui8a = new Uint8Array(ords);
            content = ui8a.buffer;
        }
        if ((Global.Document && content instanceof Document) ||
                (Global.Node && content instanceof Node)) {
            content = Exporter.stringify(content);
        } else if (content.xml) { // serialization FIX for IE9+
            content = content.xml;
        }
        return content;
    }
},
'canceling', {
    abort: function() {
        return this.xhr && this.xhr.abort();
    }
});


// make WebResource async
Object.extend(WebResource, {
    create: function(url) { return new this(url) }
});

}); // end of module
