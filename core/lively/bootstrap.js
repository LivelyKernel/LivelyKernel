var isFirefox = window.navigator.userAgent.indexOf('Firefox') > -1;
var isFireBug = isFirefox && window.console && window.console.firebug !== undefined;

function livelyConfigExists() { return typeof Config !== "undefined" }

(function setupLively(Global) {
    var lively = Global.lively;
    if (!lively) { lively = Global.lively = {}; }

    if (!lively.whenLoaded) {
        if (!Config.finishLoadingCallbacks) {
            Config.finishLoadingCallbacks = [];
        }
        lively.whenLoaded = function(callback) {
            Config.finishLoadingCallbacks.push(callback);
        }
    }
})(this);

(function setupConsole() {

    var platformConsole = window.console ||
        (window.parent && window.parent.console) ||
        {};

    var required = ['log', 'group', 'groupEnd', 'warn', 'assert', 'error'],
        emptyFunc = function() { };
    for (var i = 0; i < required.length; i++) {
        if (!platformConsole[required[i]]) {
            platformConsole[required[i]] = emptyFunc;
        }
    }
    window.console = platformConsole;

    if (isFireBug) return;

    var consumers = platformConsole.consumers = [];
    platformConsole.wasWrapped = false;

    function addWrappers() {
        if (platformConsole.wasWrapped) return;

        var props = [];
        for (var name in platformConsole) props.push(name);

        for (var i = 0; i < props.length; i++) {
            (function(name) {
                var func = platformConsole[name];
                platformConsole['$' + name] = func;
                if (typeof func !== 'function') return;
                platformConsole[name] = function(/*arguments*/) {
                    func.apply(platformConsole, arguments);
                    for (var i = 0; i < consumers.length; i++) {
                        var consumerFunc = consumers[i][name];
                        if (consumerFunc) consumerFunc.apply(consumers[i], arguments);
                    }
                };
            })(props[i]);
        }
        platformConsole.wasWrapped = true;
    }

    function removeWrappers() {
        for (var name in platformConsole) {
            if (name[0] !== '$') continue;
            platformConsole[name.substring(1, name.length)] = platformConsole[name];
            delete platformConsole[name];
        }
    }

    platformConsole.addConsumer = function(c) {
        addWrappers();
        consumers.push(c);
    };
    platformConsole.removeConsumer = function(c) {
        var idx = consumers.indexOf(c);
        if (idx >= 0) consumers.splice(idx, 1);
        if (consumers.length === 0) removeWrappers();
    };

})();

var LoadingScreen = {

    id : 'loadingScreen',
    consoleId : 'loadingConsole',
    logoId: 'loadingLogo',
    brokenWorldMsgId: 'loadingBrokenWorldMsg',

    width: function() { return document.documentElement.clientWidth || 800 },
    height: function() { return document.documentElement.clientHeight || 800 },

    buildBackground: function() {
        var div1 = document.createElement('div')
        div1.setAttribute('id', this.id);
        div1.setAttribute('style', "position: fixed; left: 0px; top: 0px; background-color: rgba(100,100,100,0.7); overflow: auto");
        div1.style.width = this.width() + 'px'
        div1.style.height = this.height() + 'px'

        return div1
    },

    buildLoadingLogo: function() {
        var logoAndText = document.createElement('div')
        logoAndText.setAttribute('id', this.logoId);
        logoAndText.setAttribute('style', "position: fixed; margin-left:auto; margin-right:auto; width: 80px; height: 108px; background-color: white;");

        var logo = document.createElement('img')
        logo.setAttribute('style', "width: 80px; height: 80px;");

        var text = document.createElement('div')
        text.setAttribute('style', "text-align:center; font-family: sans-serif; font-size: large; color: gray")
        text.textContent = 'Loading';

        logoAndText.style['top'] = (this.height() / 2 - 100) + 'px'
        logoAndText.style['left'] = (this.width() / 2 - 40) + 'px'
        logo.src = LivelyLoader.codeBase + 'media/loading.gif';

        logoAndText.appendChild(logo);
        logoAndText.appendChild(text);

        this.logo = logoAndText;

        return logoAndText;
    },

    buildBrokenWorldMessage: function() {
        var el = document.createElement('div'),
            text1 = document.createTextNode('An error occurred. If the world does not load you can visit '),
            text2 = document.createTextNode(' for help.'),
            link = document.createElement('a'),
            repairURL = Config.rootPath + 'BrokenWorldRepairSite.xhtml?brokenWorldURL=' + document.location.href;

        el.setAttribute('id', this.brokenWorldMsgId);
        el.setAttribute('style', "position: fixed; margin-left:auto; margin-right:auto; padding: 5px; background-color: white; font-family: Arial,times; color: red; font-size: large-x;");

        el.style['top'] = (this.height() / 2 - 70) + 'px'
        el.style['left'] = (this.width() / 2 - 290) + 'px'

        link.style.color = 'red';
        link.setAttribute('href', repairURL);
        link.setAttribute('target', '_blank');
        link.textContent = 'the repair page';

        el.appendChild(text1);
        el.appendChild(link);
        el.appendChild(text2);

        return el;
    },

    ensureBrokenWorldMessage: function() {
        this.removeElement(this.logo);
        if (!document.getElementById(this.brokenWorldMsgId)) {
             document.getElementById(this.id).appendChild(this.buildBrokenWorldMessage());
        }
    },

    buildConsole: function() {
        var console = document.createElement('pre'), self = this;
        console.setAttribute('id', this.consoleId);
        console.setAttribute('style', "position: absolute; top: 0px; font-family: monospace; color: rgb(0,255,64); font-size: medium; padding-bottom: 20px;");
        this.console = console;
        if (isFireBug) return console;

        function addLine(str, style) {
            style = style || '';
            var line = document.createElement('div');

            // html5 does not support cdata sections in the document. if
            // the creation fails with a NOT_SUPPORTED_ERR, we simply
            // create a text node.
            var textElement;
            try {
              textElement = document.createCDATASection(str);
            } catch (e) {
              if (e.name === "NOT_SUPPORTED_ERR") {
                textElement = document.createTextNode(str);
              } else {
                throw e;
              }
            }

            line.appendChild(textElement);
            line.setAttribute('style', style);
            console.appendChild(line);
            if (console.parentNode && line.scrollIntoViewIfNeeded)
                line.scrollIntoViewIfNeeded()
        }

        this.consoleProxy = {
            log: function(msg) { addLine(msg) },
            warn: function(msg) { addLine(msg, 'color: yellow;') },
            error: function(msg) {
                if (!console.parentNode) self.toggleConsole();
                addLine(msg, 'color: red; font-size: large;');
                self.ensureBrokenWorldMessage();
            }
        };

        window.console.addConsumer(this.consoleProxy)

        return console;
    },

    removeConsole: function() {
        var console = this.console;
        this.console = null;
        if (!console || isFireBug) return;
        this.removeElement(console);
        if (!this.consoleProxy) return
        window.console.removeConsumer(this.consoleProxy)
        this.consoleProxy = null;
    },

    toggleConsole: function() {
        if (!this.console) this.buildConsole();
        if (this.console.parentNode) {
            this.removeElement(this.console);
        } else {
            this.domElement.appendChild(this.console);
        }
    },

    buildConsoleButton: function() {
        var a = document.createElement('a');
        a.setAttribute('style', "position: fixed; right: 170px; top: 20px; width: 70px; text-align:center; font-family: monospace; border: 1px solid; border-color: rgb(100,100,100); color: rgb(100,100,100)");
        a.setAttribute('href', 'javascript:LoadingScreen.toggleConsole()');
        a.textContent = 'console';
        return a;
    },
    buildCloseButton: function() {
        var a = document.createElement('a');
        a.setAttribute('style', "position: fixed; right: 90px; top: 20px; width: 70px; text-align:center; font-family: monospace; border: 1px solid; border-color: rgb(100,100,100); color: rgb(100,100,100)");
        a.setAttribute('href', 'javascript:LoadingScreen.remove();');
        a.textContent = 'close';
        return a;
    },

    build: function() {
        var background = this.buildBackground(),
            loadingLogo = this.buildLoadingLogo(),
            consoleButton = this.buildConsoleButton(),
            closeButton = this.buildCloseButton(),
            console = this.buildConsole();

        background.appendChild(loadingLogo);
        background.appendChild(consoleButton);
        background.appendChild(closeButton);

        return background;
    },

    add: function() {
        if (!this.domElement) {
            this.domElement = this.build();
        }
        document.body.appendChild(this.domElement);
    },

    remove: function() {
        this.removeConsole();
        this.removeElement(this.domElement);
    },

    removeElement: function(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
};

var JSLoader = {

    SVGNamespace: 'http:\/\/www.w3.org/2000/svg',
    XLINKNamespace: 'http:\/\/www.w3.org/1999/xlink',
    LIVELYNamespace: 'http:\/\/www.experimentalstuff.com/Lively',

    loadJs: function(url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
        if (this.scriptInDOM(url)) {
            console.log('script ' + url + ' already loaded or loading');
            return null;
        }
        // it's called loadJs, not loadCSS !!!
        var css = this.isCSS(url);

        // adapt URL
        var exactUrl = url;
        if ((exactUrl.indexOf('!svn') <= 0) && !okToUseCache) {
            exactUrl = this.makeUncached(exactUrl, cacheQuery);
        }

        // create and configure script tag
        var parentNode = this.findParentScriptNode(),
            xmlNamespace = parentNode.namespaceURI,
            el;

        if (css) {
            el = document.createElementNS(xmlNamespace, 'link');
            el.setAttributeNS(null, "rel", "stylesheet");
            el.setAttributeNS(null, "type", "text/css");
        } else { //assuming js
            el = document.createElementNS(xmlNamespace, 'script');
            el.setAttributeNS(null, 'type', 'text/ecmascript');
        }

        parentNode.appendChild(el);
        el.setAttributeNS(null, 'id', url);

        return loadSync ?
            this.loadSync(exactUrl, onLoadCb, el) :
            this.loadAsync(exactUrl, onLoadCb, el);
    },

    loadSync: function(url, onLoadCb, script) {
        if (this.isCSS(url)) {
            console.log('skipping eval for css: ' + url );
            if (typeof onLoadCb === 'function') onLoadCb();
            return;
        }
        var source = this.getSync(url);
        try {
            eval(source);
        } catch(e) {
            console.error('Error when loading ' + url + ': ' + e + '\n' + e.stack);
        }
        if (typeof onLoadCb === 'function') onLoadCb();
    },

    loadAsync: function(url, onLoadCb, script) {
        if (script.namespaceURI == this.SVGNamespace) {
            script.setAttributeNS(this.XLINKNamespace, 'href', url);
        } else if (this.isCSS(url)) {
            script.setAttribute("href",url);
            if (typeof onLoadCb === 'function') onLoadCb(); // huh?
        } else {
            script.setAttributeNS(null, 'src', url);
        }

        if (onLoadCb) script.onload = onLoadCb;
        script.setAttributeNS(null, 'async', true);
    },


    loadCombinedModules: function(combinedFileUrl, callback, hash) {
        // If several modules are combined in one file they can be loaded with this method.
        // The method will ensure that all included modules are loaded. If they
        // have required modules that are not included in the combined file, those will
        // be loaded as well.

        var originalLoader = this,
            combinedLoader = {

                expectToLoadModules: function(listOfRelativePaths) {
                    // urls like http://lively-kernel.org/repository/webwerkstatt/lively/Text.js
                    this.expectedModuleURLs = new Array(listOfRelativePaths.length);
                    var i, len = listOfRelativePaths.length;
                    for (i = 0; i < len; i++) {
                        this.expectedModuleURLs[i] = LivelyLoader.codeBase + listOfRelativePaths[i];
                    }

                    // modules like lively.Text
                    this.expectedModules = new Array(len);
                    for (i = 0; i < len; i++) {
                        var moduleName = listOfRelativePaths[i].replace(/\//g, '.');
                        moduleName = moduleName.replace(/\.js$/g, '');
                        this.expectedModules[i] = moduleName;
                    }

                    // create script tags that are found when tested if a file is already loaded
                    this.expectedModuleURLs.forEach(function(url) {
                        var script = document.createElement('script');
                        script.setAttribute('id', url);
                        document.getElementsByTagName('head')[0].appendChild(script);
                    });
                },

                includedInCombinedFile: function(scriptUrl) {
                    return this.expectedModuleURLs && this.expectedModuleURLs.indexOf(scriptUrl) >= 0;
                },

                loadJs: function(url) {
                    console.log('load file that is not in combined modules: ' + url);
                    if (!this.includedInCombinedFile(url)) originalLoader.loadJs(url);
                },

                scriptInDOM: function(url) {
                    return originalLoader.scriptInDOM(url) || this.includedInCombinedFile(url);
                }

            },

            callCallback = function() {
                window.JSLoader = originalLoader;
                // FIXME
                // Filter out the modules already loaded
                var realModules = combinedLoader.expectedModules.select(function(ea) {
                    // FIXME, better now throw error in Class.forName
                    return !ea.include('lively-libs') && Class.forName(ea) !== undefined;
                });
                require(realModules).toRun(callback);

            };

        if (this.scriptInDOM(combinedFileUrl)) { callCallback(); return; }

        // while loading the combined file we replace the loader
        JSLoader = combinedLoader;

        this.loadJs(combinedFileUrl, callCallback, undefined, undefined, hash);
    },

    loadAll: function(urls, cb) {
        urls.reverse().reduce(function(loadPrevious, url) {
            return function() { JSLoader.loadJs(url, loadPrevious); };
        }, function() { cb && cb(); })();
    },

    resolveAndLoadAll: function(baseURL, urls, cb) {
        for (var i = 0; i < urls.length; i++) {
            urls[i] = baseURL + urls[i];
        }
        return this.loadAll(urls, cb);
    },

    findParentScriptNode: function() {
        var node = document.getElementsByTagName('head')[0];
        if (!node) throw new Error('Cannot find parent node for scripts');
        return node;
    },

    getLinkAttribute: function(el) {
        return el.getAttributeNS(this.XLINKNamespace, 'href') || el.getAttribute('src');
    },

    getScripts: function() { return document.getElementsByTagName('script'); },

    scriptInDOM: function(url) { return this.scriptsThatLinkTo(url).length > 0; },

    scriptsThatLinkTo: function(url) {
        var scriptsFound = [],
            allScripts = this.getScripts();
        for (var i = 0; i < allScripts.length; i++) {
            if (this.scriptElementLinksTo(allScripts[i], url)) {
                scriptsFound.push(allScripts[i]);
            }
        }
        return scriptsFound;
    },

    removeQueries: function(url) { return url.split('?')[0]; },

    resolveURLString: function(urlString) {
        // FIXME duplicated from URL class in lively. Network
        // actually lively.Core should require lively.Network -- but lively.Network indirectly
        // lively.Core ====>>> FIX that!!!
        var result = urlString;
        // resolve ..
        do {
            urlString = result;
            result = urlString.replace(/\/[^\/]+\/\.\./, '');
        } while (result != urlString);
        // foo//bar --> foo/bar
        result = result.replace(/([^:])[\/]+/g, '$1/');
        // foo/./bar --> foo/bar
        result = result.replace(/\/\.\//g, '/');
        return result;
    },

    scriptElementLinksTo: function(el, url) {
        if (!el.getAttribute) return false;
        // FIXME use namespace consistently
        if (el.getAttribute('id') == url) return true;
        var link = this.getLinkAttribute(el);
        if (!link) return false;
        if (url == link) return true;
        var linkString = this.makeAbsolute(link),
            urlString = this.makeAbsolute(url);
        return linkString == urlString;
    },

    currentDir: function() {
        return this.dirOfURL(document.location.href.toString());
    },

    dirOfURL: function(url) {
        return this.removeQueries(url).substring(0, url.lastIndexOf('/') + 1);
    },

    makeAbsolute: function(urlString) {
        urlString = this.removeQueries(urlString);
        if (!urlString.match(/^http/)) {
            // make absolute
            urlString = this.currentDir() + urlString;
        }
        return this.resolveURLString(urlString);
    },

    makeUncached: function(urlString, cacheQuery) {
        cacheQuery = cacheQuery || new Date().getTime();
        return urlString + (urlString.indexOf('?') == -1 ? '?' : '&') + cacheQuery;
    },

    removeAllScriptsThatLinkTo: function(url) {
        var scripts = this.scriptsThatLinkTo(url);
        for (var i = 0; i < scripts.length; i++) {
            scripts[i].parentNode.removeChild(scripts[i]);
        }
    },

    getSyncReq: function(url, forceUncached) {
        if (typeof WebResource !== "undefined") {
            var webR = new WebResource(url);
            if (forceUncached) webR.forceUncached();
            var webRGet = webR.get();
            return {
                status: webRGet.status.code(),
                responseText: webRGet.content
            };
        }

        var req = new XMLHttpRequest();
        if (forceUncached) url = this.makeUncached(url);
        req.open('GET', url, false/*sync*/);
        req.send();
        return req;
    },

    getSync: function(url, forceUncached) {
        return this.getSyncReq(url, forceUncached).responseText;
    },

    getSyncStatus: function(url, forceUncached) {
        return this.getSyncReq(url, forceUncached).status;
    },

    isCSS: function(url){
        return url.match(/\.css$/) || url.match(/\.css\?/);
    }
};

var LivelyLoader = {

    //
    // ------- generic load support ----------
    //
    libsFile: 'lib/lively-libs.js',

    codeBase: (function findCodeBase() {
        // search for script that links to "bootstrap.js" and
        // construct the codeBase path from its path
        if (window.Config && Config.codeBase !== undefined)
            return Config.codeBase;

        var bootstrapFileName = 'bootstrap.js',
            scripts = JSLoader.getScripts(),
            i = 0, node, urlFound;

        while (!urlFound && (node = scripts[i++])) {
            var url = JSLoader.getLinkAttribute(node);
            if (url && (url.indexOf(bootstrapFileName) >= 0)) urlFound = url;
        }

        if (!urlFound) {
            console.warn('Cannot find codebase, have to guess...');
            return JSLoader.dirOfURL(window.location.href.toString());
        }

        var codeBase = JSLoader.makeAbsolute(JSLoader.dirOfURL(urlFound) + '../');
        console.log('Codebase is ' + codeBase);

        return codeBase;
    })(),

    rootPath: (function findRootPath() {

        if (window.Config && Config.rootPath !== undefined) {
            return Config.rootPath;
        }

        if (window.Config && Config.standAlone) {
            // copied from Config.getDocumentDirectory,
            // Config not yet available...
            var url = document.URL;
            return url.substring(0, url.lastIndexOf('/') + 1);
        }

        var bootstrapFileName = 'bootstrap.js',
            scripts = JSLoader.getScripts(),
            i = 0, node, urlFound;

        while (!urlFound && (node = scripts[i++])) {
            var url = JSLoader.getLinkAttribute(node);
            if (url && (url.indexOf(bootstrapFileName) >= 0)) urlFound = url;
        }

        if (!urlFound) {
            console.warn('Cannot find bootstrap.js, have to guess...');
            return JSLoader.dirOfURL(window.location.href.toString());
        }
        var rootPath = JSLoader.makeAbsolute(urlFound.match(/(.*)core\/lively\/(.*)/)[1]);
        console.log('Root path is ' + rootPath);

        return rootPath;
    })(),

    modulePaths: (function setModulePaths() {
        if (!window.Config) { window.Config = {}; }
        // FIXME this is webwerkstatt specific
        var defaultPaths = ['users/', 'projects/', 'documentation/', 'server/'];
        if (Config.modulePaths === undefined) {
            Config.modulePaths = defaultPaths;
        } else {
            Config.modulePaths = Config.modulePaths.concat(defaultPaths);
        }
        return Config.modulePaths;
    })(),

    installWatcher: function(target, propName, haltWhenChanged) {
        // observe slots, for debugging
        var newPropName = '__' + propName;
        target[newPropName] = target[propName];
        target.__defineSetter__(propName, function(v) {
            target[newPropName] = v;
            console.log(target.toString() + '.' + propName + ' changed: ' + v);
            if (haltWhenChanged) debugger;
        });
        target.__defineGetter__(propName, function() { return target[newPropName]; });
        console.log('Watcher for ' + target + '.' + propName + ' installed');
    },

    createConfigObject: function() {
        // Should have addtional logic for the case when no no window object exist...
        if (!window.Config) window.Config = {};
        window.Config.codeBase = this.codeBase;
        window.Config.rootPath = this.rootPath;
        window.Config.modulePaths = this.modulePaths;
    },

    //
    // ------- load world ---------------
    //
    loadMain: function(canvas, startupFunc) {
        lively.Config.loadUserConfigModule();
        require('lively.bindings', 'lively.Main').toRun(function() {
            var loader = lively.Main.getLoader(canvas);
            lively.bindings.connect(loader, 'finishLoading', LoadingScreen, 'remove');
            if (startupFunc) {
                loader.startupFunc = startupFunc;
                lively.bindings.connect(loader, 'finishLoading', loader, 'startupFunc');
            }
            loader.systemStart(canvas);
        });
    },

    startFromSerializedWorld: function(startupFunc) {
        if (!livelyConfigExists() || !Config.isNewMorphic) return false;
        var self = this;

        LoadingScreen.add();
        this.bootstrap(function() {
            self.loadMain(document.body, startupFunc);
        });
        return true;
    },

    bootstrap: function(thenDoFunc) {
        this.createConfigObject();
        var url = document.URL,
            dontBootstrap = Config.standAlone || url.indexOf('dontBootstrap=true') >= 0;

        if (dontBootstrap) { thenDoFunc(); return };

        var codeBase = this.codeBase,
            optimizedLoading = !url.match('quickLoad=false')
                            && !url.match('!svn')
                            && url.match('webwerkstatt')
                            && url.match('lively-kernel.org');

        if (optimizedLoading) {
            console.log('optimized loading enabled');
            var hashUrl = codeBase + 'generated/combinedModulesHash.txt',
                combinedModulesUrl = codeBase + 'generated/combinedModules.js',
                hash = JSLoader.getSync(hashUrl, true/*uncached*/);
            JSLoader.loadCombinedModules(combinedModulesUrl, thenDoFunc, hash);
            return;
        }

        var modules = [
            this.libsFile,
            'lively/Migration.js',
            'lively/JSON.js',
            'lively/lang/Object.js',
            'lively/lang/Function.js',
            'lively/lang/String.js',
            'lively/lang/Array.js',
            'lively/lang/Number.js',
            'lively/lang/Date.js',
            'lively/defaultconfig.js',
            'lively/localconfig.js',
            'lively/Base.js',
            'lively/lang/Closure.js',   // FIXME: require module instead
            'lively/lang/UUID.js',      // FIXME: require module instead
            'lively/LocalStorage.js'    // FIXME: require module instead
        ];
        JSLoader.resolveAndLoadAll(codeBase, modules, thenDoFunc);
    }

};

var EmbededLoader = {

    //
    // ------- embedd world in another page ---------------
    //
    addWorld: function(worldURL, targetElement) {
        this.worldURL = worldURL;
        this.targetElement = targetElement;
        LivelyLoader.bootstrap(function() {
            EmbededLoader.embedAndLoadWorld(worldURL, targetElement);
        });
    },

    embedAndLoadWorld: function(worldURL, targetElement) {
        console.log('Fetching ' + worldURL);
        var doc = new WebResource(worldURL).get().contentDocument;
        this.convertCDATASections(doc.documentElement);
        var canvas = document.importNode(doc.getElementById('canvas'), true);
        $A(canvas.getElementsByTagName('script')).forEach(function(e) {
            e.parentElement.removeChild(e);
        });
        var div = document.createElement('div');
        // div.setAttribute('style', "page-break-before: always; page-break-inside: avoid;");
        div.style['page-break-before'] = 'always';
        div.style['page-break-inside'] = 'avoid';
        div.appendChild(canvas);
        targetElement.appendChild(div);

        Config.isEmbedded = true;

        var worldElement;
        // SVG detection
        if (canvas.getElementsByTagName('g').length > 0) {
            // FIXME ugly hack: width/height not properly saved in canvas element so reset it to the
            // width/height of the rect of the worldmorph
            Config.resizeScreenToWorldBounds = false;
            worldElement = canvas.getElementsByTagName('g')[0];
            canvas.setAttribute("width", worldElement.childNodes[0].width.baseVal.value.toString()
                                       + 'px');
            canvas.setAttribute("height", worldElement.childNodes[0].height.baseVal.value.toString()
                                        + 'px');
        } else {
            // FIXME!!!
            Config.resizeScreenToWorldBounds = false;
            canvas.setAttribute("width", targetElement.clientWidth + 'px');
            canvas.setAttribute("height", targetElement.clientHeight + 'px');
            worldElement = canvas.getElementsByTagName('div')[0];
            worldElement.setAttribute("width", targetElement.clientWidth + 'px');
            worldElement.setAttribute("height", targetElement.clientHeight + 'px');
            var pos = targetElement.getAttribute('lively:position')
            if (pos) {
                var values = pos.split(' ');
                canvas.style.position = 'absolute';
                canvas.style.left = values[0];
                canvas.style.top = values[1];
            }
        }
        document.body.style.cursor = null;
        LivelyLoader.loadMain(canvas);
    },

    convertCDATASections: function(el) {
        // CDATA sections are not allowed in (X)HTML documents....
        if (el.nodeType == document.CDATA_SECTION_NODE) {
            var text = el.ownerDocument.createTextNode(el.data),
                parent = el.parentNode;
            parent.removeChild(el);
            parent.appendChild(text);
        }

        for (var i = 0; i < el.childNodes.length; i++) {
            this.convertCDATASections(el.childNodes[i]);
        }
    },

    getWorldAttributeFrom: function(el) {
        // return el.getAttributeNS(JSLoader.LIVELYNamespace, 'world');
        // arghh! I HATE XML Namespaces!
        return el.getAttribute('lively:world');
    },

    isLivelyCanvas: function(el) {
        if (!el || !el.getAttribute) return false;
        var attr = this.getWorldAttributeFrom(el);
        return attr && attr != '';
    },

    findLivelyCanvasIn: function(element) {
        if (this.isLivelyCanvas(element)) return element;
        for (var i = 0; i < element.childNodes.length; i++)
            return this.findLivelyCanvasIn(element.childNodes[i]);
    },

    embedLively: function() {
        var canvas = this.findLivelyCanvasIn(document.body);
        if (!canvas) return;
        var ownUrl = document.location.href,
            url = ownUrl.substring(0, ownUrl.lastIndexOf('/') + 1)
                + this.getWorldAttributeFrom(canvas);
        this.addWorld(url, canvas);
    }
};

var LivelyMigrationSupport = {
    // increase this value by hand if you make a change that effects object layout
    // LivelyMigrationSupport.migrationLevel
    migrationLevel: 4,
    documentMigrationLevel: 0,
    migrationLevelNodeId: 'LivelyMigrationLevel',
    moduleRenameDict: {},

    extractMigrationLevel: function(doc) {
        // LivelyMigrationSupport.extractMigrationLevel(document);
        var node = doc.getElementById(this.migrationLevelNodeId);
        return node ? Number(node.textContent) : 0;
    },

    setDocumentMigrationLevel: function(doc) {
        this.documentMigrationLevel = this.extractMigrationLevel(doc);
    },

    // module renaming
    fixModuleName: function(name) {
        if (/^Global\./.test(name)) name = name.substring(7/*Global.*/);
        if (/^\.\.\//.test(name)) name = name.substring(3/*../*/);
        for (var oldName in this.moduleRenameDict) {
            if (oldName === name) return this.moduleRenameDict[oldName];
        }
        return name;
    },

    addModuleRename: function(oldName, newName, migrationLevel) {
        this.moduleRenameDict[oldName] = newName;
    }

};


(function startWorld(startupFunc) {
    window.addEventListener('DOMContentLoaded', function() {
        LivelyMigrationSupport.setDocumentMigrationLevel(document);
        if (LivelyLoader.startFromSerializedWorld(startupFunc)) return;
        console.warn("Lively startup failed'");
    }, true);

    window.addEventListener('beforeunload', function(evt) {
        if (livelyConfigExists() && (window.Config.askBeforeQuit !== true) {
            var msg = "Lively Kernel data may be lost if not saved.";
            evt.returnValue = msg;
            return msg;
        } else {
            return undefined;
        }
    }, true);
})(livelyConfigExists() && Config.onStartWorld);
