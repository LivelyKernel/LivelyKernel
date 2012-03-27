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

module('lively.Network').requires('lively.bindings', 'lively.NoMoreModels', 'lively.Data').toRun(function(thisModule) {
    
Object.subclass('URL', {
    splitter: new RegExp('(http:|https:|file:)' + '(//[^/:]*(:[0-9]+)?)?' + '(/.*)?'),
    pathSplitter: new RegExp("([^\\?#]*)(\\?[^#]*)?(#.*)?"),
    
    initialize: function(/*...*/) { // same field names as window.location
        dbgOn(!arguments[0]);
        if (Object.isString(arguments[0].valueOf())) {
            var urlString = arguments[0];
            var result = urlString.match(this.splitter);
            if (!result) throw new Error("malformed URL string '" + urlString + "'");
            this.protocol = result[1]; 
            if (!result[1]) 
                throw new Error("bad url " + urlString + ", " + result);
            this.hostname = result[2] && result[2].substring(2).split(':')[0]; // skip the leading slashes and remove port
            this.port = result[3] && parseInt(result[3].substring(1)); // skip the colon

            var fullpath = result[4];
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
            var spec = arguments[0];
            this.protocol = spec.protocol || "http";
            this.port = spec.port;
            this.hostname = spec.hostname;
            this.pathname = spec.pathname || "";
            if (spec.search !== undefined) this.search = spec.search;
            if (spec.hash !== undefined) this.hash = spec.hash;
        }
    },
    
    inspect: function() {
        return JSON.serialize(this);
    },
    
    toString: function() {
        return this.protocol + "//" + this.hostname + (this.port ? ":" + this.port : "") + this.fullPath();
    },

    fullPath: function() {
        return this.pathname + (this.search || "") + (this.hash || "");
    },
    
    isLeaf: function() {
        return !this.fullPath().endsWith('/');
    },
    
    // POSIX style
    dirname: function() {
        var p = this.pathname;
        var slash = p.endsWith('/') ? p.lastIndexOf('/', p.length - 2) : p.lastIndexOf('/');
        return p.substring(0, slash + 1);
    },

    filename: function() {
        var p = this.pathname;
        var slash = p.endsWith('/') ? p.lastIndexOf('/', p.length - 2) : p.lastIndexOf('/');
        return p.substring(slash + 1);
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

    toQueryString: function(record) {
        var results = [];
        Properties.forEachOwn(record, function(p, value) {
            results.push(encodeURIComponent(p) + "=" + encodeURIComponent(String(value)));
        });
        return results.join('&');
    },

    withQuery: function(record) {
        return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname: this.pathname,
            search: "?" + this.toQueryString(record), hash: this.hash});
    },
    
    withoutQuery: function() {
        return new URL({protocol: this.protocol, port: this.port, hostname: this.hostname, pathname: this.pathname});
    },

    getQuery: function() {
        var s = this.toString();
        if (!s.include("?"))
            return {};
        return s.toQueryParams();
    },
    
    eq: function(url) {
        if (!url) return false;
        return url.protocol == this.protocol &&
            url.port == this.port &&
            url.normalizedHostname() == this.normalizedHostname() &&
            url.pathname == this.pathname &&
            url.search == this.search &&
            url.hash == this.hash;
    },
    isIn: function(origin) {
        return origin.normalizedHostname() == this.normalizedHostname() &&
            this.fullPath().startsWith(origin.fullPath());
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

    toLiteral: function() {
        // URLs are literal
        return Object.clone(this);
    },
    
    toExpression: function() {
        // this does not work with the new prototype.js (rev 2808) anymore
        // return 'new URL(JSON.unserialize(\'' + JSON.serialize(this) + '\'))';
        return Strings.format('new URL({protocol: "%s", hostname: "%s", pathname: "%s"})',
            this.protocol, this.hostname, this.pathname);
    },

    withRelativePartsResolved: function() {
        var urlString = this.toString(),
            result = urlString;
        // resolve ..
        do {
            urlString = result;
            result = urlString.replace(/\/[^\/]+\/\.\./, '')
        } while(result != urlString)
        // foo//bar --> foo/bar
        result = result.replace(/([^:])[\/]+/g, '$1/')
        // foo/./bar --> foo/bar
        result = result.replace(/\/\.\//g, '/')
        return new URL(result)
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

});

// create URLs often needed
Object.extend(URL, {
    source: new URL(document.URL),
    codeBase: (function setURLCodeBase() {
        var url;
        try { url = new URL(Config.codeBase) } catch(e) {
            console.warn('Cannot correctly set URL.codeBase because of ' + e);
            url = new URL(document.URL).getDirectory();
        }
        return url.withRelativePartsResolved();
    })(),
    root: new URL(Config.rootPath),
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
        domain: new URL(Global.document.location.protocol + '//' + Global.document.location.host)
    },
});

Object.extend(URL, {
    
    create: function(string) { return new URL(string) },

    ensureAbsoluteURL: function(urlString) {
        return /^http.*/.test(urlString) ?
        new URL(urlString) :
        URL.source.notSvnVersioned().getDirectory().withRelativePath(urlString);
    },
    ensureAbsoluteCodeBaseURL: function(urlString) {
        return /^http.*/.test(urlString) ?
            new URL(urlString) :
            URL.codeBase.withRelativePath(urlString);
    },
    ensureAbsoluteRootPathURL: function(urlString) {
        return /^http.*/.test(urlString) ?
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

});


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
        return this.transport.readyState === 4
    },

    isSuccess: function() {
        var code = this.transport.status;
        return code >= 200 && code < 300;
    },
},
'accessing', {
    setException: function(e) { this.exception = e },

    toString: function() {
        return Strings.format("#<NetRequestStatus{%s,%s,%s}>", this.method, this.url, this.exception || this.transport.status);
    },

    requestString: function() { return this.method + " " + decodeURIComponent(this.url) },

    code: function() { return this.transport.status },

    getResponseHeader: function(name) { return this.transport.getResponseHeader(name) },

});


View.subclass('NetRequest', {
    documentation: "a view that writes the contents of an http request into the model",

    // see XMLHttpRequest documentation for the following:
    Unsent: 0,
    Opened: 1,
    HeadersReceived: 2,
    Loading: 3,
    Done: 4,

    formals: [
        "+Status",  // Updated once, when request is {Done} with the value returned from 'getStatus'.
        "+ReadyState", // Updated on every state transition of the request.
        "+ResponseXML", // Updated at most once, when request state is {Done}, with the parsed XML document retrieved.
        "+ResponseText", // Updated at most once, when request state is {Done}, with the text content retrieved.
        "+ResponseHeaders",  // Updated at most once, when request state is {Done}, with the response headers retrieved.
        "StreamContent",
        "Progress",
    ],

    initialize: function($super, modelPlug) {
        this.transport = new XMLHttpRequest();
        this.requestNetworkAccess();
        this.transport.onreadystatechange = this.onReadyStateChange.bind(this);
        this.isSync = false;
        this.isBinary = false;
        this.requestHeaders = {};
        $super(modelPlug)
    },

    enableProgress: function() {
        console.log("enableProgress")
        // FIXME onprogress leads to strange 101 errors when no internet connection available
        this.transport.onprogress = this.onProgress.bind(this);
        if (!UserAgent.isTouch && this.transport.upload !== undefined) // FIXME crashes Mobile Safari && IE9+
            this.transport.upload.onprogress = this.onProgress.bind(this);
    },

    requestNetworkAccess: function() {
        if (Global.netscape && Global.location.protocol == "file:") {       
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
            if (this.transport.getAllResponseHeaders() !== undefined)
                this.setResponseHeaders(this.getResponseHeaders());
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

    get: function(url) { return this.request("GET", URL.makeProxied(url), null) },

    put: function(url, content) { return this.request("PUT", URL.makeProxied(url), content) },

    post: function(url, content) { return this.request("POST", URL.makeProxied(url), content) },

    propfind: function(url, depth, content) {
        this.setContentType("text/xml"); // complain if it's set to something else?
        if (depth != 0 && depth != 1)
            depth = "infinity";
        this.setRequestHeaders({ "Depth" : depth });
        return this.request("PROPFIND", URL.makeProxied(url), content);
    },

    report: function(url, content) { return this.request("REPORT", URL.makeProxied(url), content) },

    mkcol: function(url, content) { return this.request("MKCOL", URL.makeProxied(url), content) },

    del: function(url) {
        // http://www.webdav.org/specs/rfc2518.html#rfc.section.8.6.2
        this.setRequestHeaders({ "Depth" : "infinity" });
        return this.request("DELETE", URL.makeProxied(url));
    },

    copy: function(url, destUrl, overwrite) {
        this.setRequestHeaders({ "Destination" : destUrl.toString() });
        if (overwrite) this.setRequestHeaders({ "Overwrite" : 'T' });
        return this.request("COPY", URL.makeProxied(url));
    },
    move: function(url, destUrl, overwrite) {
        this.setRequestHeaders({ "Destination" : destUrl.toString() });
        if (overwrite) this.setRequestHeaders({ "Overwrite" : 'T' });
        return this.request("MOVE", URL.makeProxied(url));
    },


    lock: function(url, owner) {
        this.setRequestHeaders({Timeout: 'Infinite, Second-30'});
        var content = Strings.format('<?xml version="1.0" encoding="utf-8" ?> \n\
        <D:lockinfo xmlns:D=\'DAV:\'> \n\
        <D:lockscope><D:exclusive/></D:lockscope> \n\
        <D:locktype><D:write/></D:locktype> \n\
        <D:owner>%s</D:owner> \n\
        </D:lockinfo>', owner || 'unknown user');
        return this.request("LOCK", URL.makeProxied(url), content);
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
        return this.request("UNLOCK", URL.makeProxied(url));
    },
    head: function(url) { return this.request("HEAD", URL.makeProxied(url), null) },

    toString: function() { return "#<NetRequest{"+ this.method + " " + this.url + "}>" },

});


// extend your objects with this trait if you don't want to deal with error reporting yourself.
NetRequestReporterTrait = {
    setRequestStatus: function(status) {
        // update the model if there is one
        if (this.getModel && this.getModel() && this.getModel().setRequestStatus)
            this.getModel().setRequestStatus(status);
        
        var world = lively.morphic.World.current();
        // some formatting for alerting. could be moved elsewhere
        var request = status.requestString();
        var tooLong = 80;
        if (request.length > tooLong) {
            var arr = [];
            for (var i = 0; i < request.length; i += tooLong) {
                arr.push(request.substring(i, i + tooLong));
            }
            request = arr.join("..\n");
        }
        // error reporting
        if (status.exception) {
            world.alert("exception " + status.exception + " accessing\n" + request);
        } else if (status.code() >= 300) {
            if (status.code() == 301) {
                // FIXME reissue request? need the 'Location' response header for it
                world.alert("HTTP/301: Moved to " + status.getResponseHeader("Location") + "\non " + request);
            } else if (status.code() == 401) {
                world.alert("not authorized to access\n" + request); 
                // should try to authorize
            } else if (status.code() == 412) {
                console.log("the resource was changed elsewhere\n" + request);
            } else if (status.code() == 423) {
                world.alert("the resource is locked\n" + request);
            } else {
                world.alert("failure to\n" + request + "\ncode " + status.code());
            }
        } else  console.log("status " + status.code() + " on " + status.requestString());
    }
};

// convenience base class with built in handling of errors
Object.subclass('NetRequestReporter', NetRequestReporterTrait);



View.subclass('Resource'/*, NetRequestReporterTrait*/, {
    documentation: "a remote document that can be fetched, stored and queried for metadata",
    // FIXME: should probably encapsulate content type

    formals: ["ContentDocument", //:XML
        "ContentText", //:String
        "URL", // :URL
        "RequestStatus", // :NetRequestStatus
        "ResponseHeaders",
        "Progress",
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

    removeNetRequestReporterTrait: function() {
        delete this.setRequestStatus;
        this.setRequestStatus = function(status) {
            if (this.getModel && this.getModel() && this.getModel().setRequestStatus)
                this.getModel().setRequestStatus(status);
        }.bind(this);
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
    },

});

Object.subclass('SVNVersionInfo', {

    documentation: 'This object wraps svn infos from report or propfind requests',

    initialize: function(spec) {
        // possible properties of spec:
        // rev, date, author, url, change, content
        for (name in spec) {
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
    },
    
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

        return new SVNVersionInfo({rev: rev, date: date, author: author, shortName: shortName, url: name, fileSize: fileSize});
},
});

Object.subclass('WebResource',
'documentation', {
    connections: ['status', 'content', 'contentDocument', 'isExisting', 'subCollections', 'subDocuments', 'progress', 'readystate', 'versions', 'headRevision'],
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
            this.getRepoURL().toString(),
            {
                model: {
                    url: self.getURL().toString(),
                    getURL: function() { return this.url },
                    setURL: function(url) { this.url = url },
                    setRequestStatus: function(reqStatus) { self.status = reqStatus; self.isExisting = reqStatus.isSuccess() },
                    setContentText: function(string) { self.content = string },
                    setContentDocument: function(doc) { self.contentDocument = doc },
                    setResponseHeaders: function(obj) { self.responseHeaders = obj },
                    setProgress: function(progress) { self.progress = progress },
                    setHeadRevision: function(rev) { self.headRevision = rev },
                    getHeadRevision: function() { return self.headRevision },
                    setMetadata: function(metadata) { self.versions = metadata },
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
                setMetadata: 'setMetadata',
            });
        resource.isShowingProgress = this.isShowingProgress;
        // resource.removeNetRequestReporterTrait();
        return resource
    },

    createNetRequest: function() {
        var self = this;
        var request = new NetRequest({
                model: {
                    setStatus: function(reqStatus) { self.status = reqStatus; self.isExisting = reqStatus.isSuccess() },
                    setResponseText: function(string) { self.content = string },
                    setResponseXML: function(doc) { self.contentDocument = doc },
                    setResponseHeaders: function(obj) { self.responseHeaders = obj },
                    setReadyState: function(readyState) { self.readystate = readyState },
                    setProgress: function(progress) { self.progress = progress },
                    setStreamContent: function(content) { self.content = content;  self.streamContent = content  },
                },
                setStatus: 'setStatus',
                setResponseText: 'setResponseText',
                setResponseXML: 'setResponseXML',
                setResponseHeaders: 'setResponseHeaders',
                setReadyState: 'setReadyState',
                setProgress: 'setProgress',
                setStreamContent: 'setStreamContent',
        });
        if (this.isSync())
            request.beSync();
        if (this.requestHeaders)
            request.requestHeaders = this.requestHeaders;
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
            webR.status = status;
            if (req.readyState == loadStates.DONE) {
                webR.isExisting = status.isSuccess();
                if (req.responseText !== undefined)
                    webR.content = req.responseText;
                if (req.responseXML !== undefined)
                    webR.contentDocument = req.responseXML;
                if (req.getAllResponseHeaders() !== undefined)
                    webR.responseHeaders = extractHeaders(req)
            }

                    // setReadyState: function(readyState) { self.readystate = readyState },
                    // setProgress: function(progress) { self.progress = progress },
                    // setStreamContent: function(content) { self.content = content },
        };

        function onProgress(evt) {
            webR.progressEvent = evt;
            // var percentComplete = (e.position / e.totalSize)*100;
        };
        // register event handlers
        req.onreadystatechange = onReadyStateChange;

        if (method === 'PUT' || method === 'POST') {
            req.upload.addEventListener("progress", onProgress, false);
            // req.upload.addEventListener("load", transferComplete, false);
            // req.upload.addEventListener("error", transferFailed, false);
            // req.upload.addEventListener("abort", transferCanceled, false);
        } else {
            req.addEventListener("progress", onProgress, false);
        }

        // to be more or less compatible with the netRequest object -- fixme should simplified
        return {
            request: function(content) {
                var proxiedUrl = URL.makeProxied(url);
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
    },

},
'private', {
    temporaryChangeURLAndDo: function(otherURL, func) {
        var temp = this._url;
        this._url = otherURL;
        var result = func.call(this)
        this._url = temp;
        return result;
    },
},
'accessing', {
    getURL: function() { return this._url; },
    getRepoURL: function() {
        return new URL(Config.rootPath) // FIXME repo!
    },

    getName: function() { return this.getURL().filename(); },
    isCollection: function() { return !this.getURL().isLeaf() },
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
},
'progress', {
    enableShowingProgress: function() { this.isShowingProgress = true; return this },
    createProgressBar: function(label) {
        // this.enableShowingProgress();
        // var labelFunc = Object.isString(labelOrFunc) ?
            // function() { return labelOrFunc } : labelOrFunc;
		if (!Config.isNewMorphic) return this;
        var progressBar = lively.morphic.World.current().addStatusProgress(label);
        connect(this, 'progressEvent', progressBar, 'setValue',
            {converter: function(rpe) { return (rpe.loaded / rpe.total) }});
        connect(this, 'status', progressBar, 'remove', {
            updater: function($upd, status) { if (status.isDone()) $upd() }});
        return this;
    },

},
'DEPRECATED', {
    copyTo: function(url) {
        var otherResource = new WebResource(url);
        otherResource.create();
        new NetRequest().copy(this.getURL(), url, true /*overwrite*/);
        return otherResource;
    },

},
'debugging', {
    statusMessage: function(successMsg, failureMessage, onlyOnce) {
        this.successMsg = successMsg;
        this.failureMessage = failureMessage;
        var world = Config.isNewMorphic ? lively.morphic.World.current() : lively.morphic.World.current();
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

    toString: function() { return 'WebResource(' + this.getURL() + ')' },
},
'request headers', {

    setRequestHeaders: function(headers) {
        this.requestHeaders = headers;
        return this;
    },
    addHeaderForRequiredRevision: function(rev) {
        if (!rev) return;
        var local = this.getURL().relativePathFrom(this.getRepoURL()),
            ifHeader = Strings.format('(["%s//%s"])', rev, local);
        console.log('Creating if header: ' + ifHeader);
        this.requestHeaders["If"] = ifHeader;
    },
    addContentType: function(contentType) {
        this.requestHeaders["Content-Type"] = contentType || '';
    },

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
                resource.fetch(this.isSync(), this.requestHeaders, rev);
            })
            return this;
        }
        // use a helper so that connections to this are not triggered when
        // location XML is written to content/contentDocument
        var helper = new WebResource(this.getURL());
        helper.setSync(this.isSync())
        connect(helper, 'revAndLocations', this, 'get', {
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
        connect(helper, 'revAndLocations', this, 'get', {
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
    put: function(content, contentType, requiredRevision) {
        this.content = this.convertContent(content || '');
        if (requiredRevision) this.addHeaderForRequiredRevision(requiredRevision);
        if (contentType) this.addContentType(contentType)
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
        var request = this.createNetRequest();
        request.del(this.getURL());
        return this;
    },
    newMethod: function() {
        // enter comment here
    },


    post: function(content, contentType) {
        this.content = content;
        var request = this.createNetRequest();
        if (contentType)
            request.setContentType(contentType);
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
                connect(repoWebR, 'headRevision', this, 'headRevision', {removeAfterUpdate: true});
                connect(this, 'headRevision', this, 'getVersions', {removeAfterUpdate: true});
                repoWebR.getHeadRevision();
                return this;
            }
        }
        res.fetchMetadata(this.isSync(), this.requestHeaders, startRev, endRev, null);
        return this;
    },

    getHeadRevision: function() {
        var res = this.createResource();
        res.fetchHeadRevision(this.isSync());
        return this;
    },

    getProperties: function(optRequestHeaders, rev) {
        var res = this.createResource();
        res.fetchProperties(this.isSync(), optRequestHeaders, rev);
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
    },
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
                    connect(self, 'contentDocument', self, 'pvtProcessForLocationRequest', {
                        removeAfterUpdate: true});
                    self.report(content);
                }
            }
        if (this.headRevision) {
            reportRequester.action(this.headRevision)
        } else {
            connect(self, 'headRevision', reportRequester, 'action', {removeAfterUpdate: true});
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
    pvtProcessPropfindForSubElements: function(doc) {
        if (!this.status.isSuccess())
            throw new Error('Cannot access subElements of ' + this.getURL());
        // FIXME: resolve prefix "D" to something meaningful?
        var nodes = new Query("/D:multistatus/D:response").findAll(doc.documentElement)
        var urlQ = new Query('D:href');
        nodes.shift(); // remove first since it points to this WebResource
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            var urlNode = urlQ.findFirst(nodes[i]);
            var url = urlNode.textContent || urlNode.text; // text is FIX for IE9+
            if (/!svn/.test(url)) continue;// ignore svn dirs
            var child = new WebResource(this.getURL().withPath(url));
            var revNode = nodes[i].getElementsByTagName('version-name')[0];
            if (revNode) child.headRevision = Number(revNode.textContent);
            result.push(child);
        }
        this.subCollections = result.select(function(ea) { return ea.isCollection() });
        this.subDocuments = result.select(function(ea) { return !ea.isCollection() });
    },
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
    },
});


// make WebResource async
Object.extend(WebResource, {
    create: function(url) { return new this(url) },
});

}); // end of module

