/*global Config, require, Class, WebResource, $A*/
/*jshint evil: true, scripturl: true, loopfunc: true, laxbreak: true, immed: true, lastsemic: true, debug: true, regexp: false*/

(function bootstrapLively(Global) {
    var hostString = Global.document && document.location.host,
        useMinifiedLibs = hostString && hostString.indexOf('localhost') === -1;

    /*
    * Detects browsers with help of the userAgent property of the navigator object.
    * Lookup for browsers happens by the name of the application.
    * Versions are searched with the default attempt that it follows the
    * application name devided by as slash (e.g. Chrome/21.0.2).
    *
    * The object can be initialized with a specification array of the form:
    *    [{browser: "BrowserName", version: "2.0", versionPrefix: "prefix"}, ...]
    * The property versionPrefix is an optional property and can be omitted. It
    * should be set when the version can not be found using the default attempt.
    * With versionPrefix set the version for this browser will be searched by
    * looking for the prefix and returning the string that comes after a slash
    * (e.g. PREFIX/2.0 would return 2.0).
    *
    * Version numbers can be specified as you like but the object will only use
    * the first two components of the version - the rest will be ignored.
    */
    var BrowserDetector = function(optSpec) {
        var that = {},
            spec = optSpec || [{
                browser: "Chrome",
                version: "10"
            }, {
                browser: "Firefox",
                version: "4"
            }, {
                browser: "Safari",
                version: "5",
                versionPrefix: "Version"
            }],
            userAgent = Global['navigator'] ? navigator.userAgent : '';

        that.detectBrowser = function(optSpec) {
            var fullSpec = optSpec || spec,
                browser = this.browser,
                browserSpec,
                filterBrowsers = function(browserSpec) {
                    return browserSpec.browser;
                },
                browserCount,
                i = 0;

            if (this.browser === undefined || browser === null) {
                browserSpec = spec.map(filterBrowsers);
                browserCount = browserSpec.length;
                while (userAgent.indexOf(browserSpec[i]) < 0
                    && i <= browserCount) {
                    i += 1;
                }
                if (i < browserCount) {
                    this.browser = browserSpec[i];
                    this.browserSpecPointer = i;
                } else {
                    this.browser = "NOT DETECTED";
                    this.browserSpecPointer = -1;
                }
            }
            return this.browser;
        };

        that.browserSpec = function() {
            if (this.browserSpecPointer !== undefined && this.browserSpecPointer >= 0) {
                return this.spec[this.browserSpecPointer];
            }
            return null;
        };

        that.extractVersion = function(prefix) {
            var uaInfo = userAgent.split(' '),
                uaInfoCount = uaInfo.length,
                i = 0;
            while (uaInfo[i].indexOf(prefix) < 0) { i += 1; }
            return uaInfo[i].split('/')[1];
        };

        that.detectVersion = function(optBrowserSpec) {
            var browserSpec = optBrowserSpec || this.browserSpec(),
                browser = browserSpec ? browserSpec.browser : this.browser,
                versionPrefix;

            if (browserSpec === null && browser === undefined) {
                browser = this.detectBrowser();
                if (browser !== "NOT DETECTED") {
                    browserSpec = this.browserSpec();
                }
            }
            if (browser === "NOT DETECTED") {
                this.version = "NOT DETECTED";
            }
            if (this.version === undefined || this.version === null) {
                versionPrefix = browserSpec.versionPrefix;
                if (versionPrefix !== undefined) {
                    this.version = this.extractVersion(versionPrefix);
                } else {
                    this.version = this.extractVersion(browser);
                }
            }
            return this.version;
        };

        that.detect = function() {
            this.browser = null;
            this.version = null;
            this.detectBrowser();
            this.detectVersion();
        };

        that.isFirefox = function() {
            return this.browser === 'Firefox';
        };

        that.isFireBug = function() {
            return (this.isFirefox()
                    && Global.console && Global.console.firebug !== undefined);
        };

        that.isNodejs = function() {
            return (typeof process !== 'undefined') && !!process.versions.node;
        };

        that.isSpecSatisfied = function() {
            var matchingSpec = this.browserSpec(),
                specVersion,
                detectedVersion,
                shortenVersionString = function(versionString) {
                    var versionComponents = versionString.split(".");
                    return versionComponents.slice(0, 2).join(".");
                };
            if (matchingSpec === null || matchingSpec === undefined) {
                return false;
            }
            specVersion = shortenVersionString(matchingSpec.version);
            detectedVersion = shortenVersionString(this.version);
            return parseFloat(specVersion) <= parseFloat(detectedVersion);
        };

        that.printSpec = function() {
            var items = this.spec.length,
                item,
                i,
                specString = "";
            for (i = 0; i < items; i += 1) {
                item = this.spec[i];
                specString += item.browser + " >= v" + item.version + "\n";
            }
            return specString.slice(0, specString.length - 1);
        };

        that.spec = spec;
        that.detect();

        return that;
    };

    // run detection a first time
    var browserDetector = new BrowserDetector();

    (function setupGlobal() {
        if (browserDetector.isNodejs()) {
            // Now setup a DOM and window object
            var jsdom = require("jsdom").jsdom,
                world = {__LivelyClassName__: "lively.morphic.World",
                         __SourceModuleName__: "Global.lively.morphic.Core",
                        submorphs:[],scripts:[],id:0,
                        shape: {id:1, __isSmartRef__: true}},
                shape = {__LivelyClassName__: "lively.morphic.Shapes.Rectangle",
                         __SourceModuleName__: "Global.lively.morphic.Shapes"},
                worldData = {id:0,registry:{0:world,1:shape,isSimplifiedRegistry: true}},
                worldDataJson = JSON.stringify(worldData),
                body = '<script type="text/x-lively-world">'+worldDataJson+'</script>',
                markup = '<html><head><title>Lively</title></head><body>'+body+'</body></html>',
                doc = jsdom(markup);
            Global = doc.createWindow();
            Global.window = window = Global;
            Global.document = document = doc;
            Global.console = console;
            Global.Event = {};
            Global.getSelection = function() {};
            Global.UserAgent = {isNodeJS: true};
            Global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            Global._require = module.parent.require.bind(module.parent); // native NodeJS require
            Global.__dirname = require('path').dirname(module.parent.filename);
            module.exports = Global;
        }
        // "Global" is the lively accessor to the toplevel JS scope
        Global.Global = Global;
    })();

    (function ensureConfig() {
        if (!Global.Config) Global.Config = {};
        Config = Global.Config;
    })();

    (function setupLively() {
        var lively = Global.lively;
        if (!lively) { lively = Global.lively = {}; }
        if (!lively.whenLoaded) {
            if (!Config.finishLoadingCallbacks) {
                Config.finishLoadingCallbacks = [];
            }
            lively.whenLoaded = function(callback) {
                Config.finishLoadingCallbacks.push(callback);
            };
        }
        lively.useMinifiedLibs = useMinifiedLibs;
    })();

    (function setupConsole() {
        var platformConsole = Global.console
                           || (Global.window
                             && window.parent
                             && window.parent.console)
                           || {},
            required = ['log', 'group', 'groupEnd', 'warn', 'assert',
                        'error'];
        function emptyFunc() { }
        for (var i = 0; i < required.length; i++) {
            if (!platformConsole[required[i]]) {
                platformConsole[required[i]] = emptyFunc;
            }
        }
        Global.console = platformConsole;

        if (browserDetector.isFireBug()) return;

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
                            if (consumerFunc) {
                                consumerFunc.apply(consumers[i], arguments);
                            }
                        }
                    };
                })(props[i]);
            }
            platformConsole.wasWrapped = true;
        }

        function removeWrappers() {
            for (var name in platformConsole) {
                if (name[0] !== '$') continue;
                var realName = name.substring(1, name.length);
                platformConsole[realName] = platformConsole[name];
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

        width: function() {
            return document.documentElement.clientWidth || 800;
        },
        height: function() {
            return document.documentElement.clientHeight || 800;
        },

        buildBackground: function() {
            var div1 = document.createElement('div');
            div1.setAttribute('id', this.id);
            div1.setAttribute('style', "position: fixed;"
                                     + " left: 0px;"
                                     + " top: 0px;"
                                     + " background-color: "
                                     +   "rgba(100,100,100,0.7);"
                                     + " overflow: auto");
            div1.style.width = this.width() + 'px';
            div1.style.height = this.height() + 'px';

            return div1;
        },

        buildLoadingLogo: function() {
            var logoAndText = document.createElement('div');
            logoAndText.setAttribute('id', this.logoId);
            logoAndText.setAttribute('style', "position: fixed;"
                                            + " margin-left:auto;"
                                            + " margin-right:auto;"
                                            + " width: 80px;"
                                            + " background-color: white;");

            var logo = document.createElement('img');
            logo.setAttribute('style', "width: 80px; height: 80px;");

            var text = document.createElement('div');
            text.setAttribute('style', "text-align:center;"
                                     + " font-family: sans-serif;"
                                     + " font-size: large;"
                                     + " color: gray");
            text.textContent = 'Loading';

            logoAndText.style.top = (this.height() / 2 - 100) + 'px';
            logoAndText.style.left = (this.width() / 2 - 40) + 'px';
            logo.src = Global.LivelyLoader.codeBase + 'media/loading.gif';

            logoAndText.appendChild(logo);
            logoAndText.appendChild(text);

            this.logo = logoAndText;

            return logoAndText;
        },

        setLogoText: function(string) {
            if (!this.logo) return;
            var text = this.logo.getElementsByTagName('div')[0];
            text.textContent = string;
        },

        buildBrokenWorldMessage: function() {
            var el = document.createElement('div'),
                text1 = document.createTextNode('An error occurred. '
                                               + 'If the world does not load '
                                               + 'you can visit '),
                text2 = document.createTextNode(' for help.'),
                link = document.createElement('a'),
                repairURL = Config.rootPath + 'BrokenWorldRepairSite.xhtml?'
                          + 'brokenWorldURL=' + document.location.href;

            el.setAttribute('id', this.brokenWorldMsgId);
            el.setAttribute('style', "position: fixed"
                                   + "; margin-left:auto"
                                   + "; margin-right:auto"
                                   + "; padding: 5px"
                                   + "; background-color: white"
                                   + "; font-family: Arial,times"
                                   + "; color: red"
                                   + "; font-size: large-x;");

            el.style.top = (this.height() / 2 - 70) + 'px';
            el.style.left = (this.width() / 2 - 290) + 'px';

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
                var msg = this.buildBrokenWorldMessage();
                document.getElementById(this.id).appendChild(msg);
            }
        },

        buildConsole: function() {
            var console = document.createElement('pre'), self = this;
            console.setAttribute('id', this.consoleId);
            console.setAttribute('style', "position: absolute;"
                                        + " top: 0px;"
                                        + " font-family: monospace;"
                                        + " color: rgb(0,255,64);"
                                        + " font-size: medium;"
                                        + " padding-bottom: 20px;");
            this.console = console;
            if (browserDetector.isFireBug()) return console;

            function addLine(str, style) {
                style = style || '';
                var line = document.createElement('div');

                // html5 does not support cdata sections in the document. if
                // the creation fails with a NOT_SUPPORTED_ERR, we simply
                // create a text node.
                var textElement;
                try {
                  textElement = document.xmlVersion ?
                        document.createCDATASection(str) : document.createTextNode(str);
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
                    line.scrollIntoViewIfNeeded();
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

            Global.console.addConsumer(this.consoleProxy);

            return console;
        },

        removeConsole: function() {
            var console = this.console;
            this.console = null;
            if (!console || browserDetector.isFireBug()) return;
            this.removeElement(console);
            if (!this.consoleProxy) return;
            Global.console.removeConsumer(this.consoleProxy);
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
            a.setAttribute('style', "position: fixed;"
                                  + " right: 170px;"
                                  + " top: 20px;"
                                  + " width: 70px;"
                                  + " text-align:center;"
                                  + " font-family: monospace;"
                                  + " border: 1px solid;"
                                  + " border-color: rgb(100,100,100);"
                                  + " color: rgb(100,100,100)");
            a.setAttribute('href',
                           'javascript:LoadingScreen.toggleConsole();');
            a.textContent = 'console';
            return a;
        },
        buildCloseButton: function() {
            var a = document.createElement('a');
            a.setAttribute('style', "position: fixed;"
                                  + " right: 90px;"
                                  + " top: 20px;"
                                  + " width: 70px;"
                                  + " text-align:center;"
                                  + " font-family: monospace;"
                                  + " border: 1px solid;"
                                  + " border-color: rgb(100,100,100);"
                                  + " color: rgb(100,100,100)");
            a.setAttribute('href', 'javascript:LoadingScreen.remove();');
            a.textContent = 'close';
            return a;
        },

        buildBrowserMessage: function (optMessage) {
            var message = document.createElement('pre'),
                defaultMessageText,
                messageText;
            if (!browserDetector.isSpecSatisfied()) {
                defaultMessageText = "HINT !\nLively Kernel works best with:\n"
                                    + browserDetector.printSpec();
                messageText = optMessage || defaultMessageText;
                message.setAttribute('style', 'position: fixed;'
                                            + 'left: 90px; top: 20px;'
                                            + 'text-align: left;'
                                            + 'font-family: monospace;'
                                            + 'margin: 0 0 0 0;'
                                            + 'padding: 0px 10px 0px 10px;'
                                            + 'border: 1px solid;'
                                            + 'border-color: rgb(100,100,100);'
                                            + 'color: rgb(100,0,0)'
                );
                message.textContent = messageText;
            }
            return message;
        },

        build: function() {
            var background = this.buildBackground(),
                loadingLogo = this.buildLoadingLogo(),
                consoleButton = this.buildConsoleButton(),
                closeButton = this.buildCloseButton(),
                browserMessage = this.buildBrowserMessage(),
                console = this.buildConsole();

            background.appendChild(loadingLogo);
            background.appendChild(consoleButton);
            background.appendChild(closeButton);
            background.appendChild(browserMessage);

            return background;
        },

        add: function(optLogoText) {
            if (!this.domElement) {
                this.domElement = this.build();
            }
            document.body.appendChild(this.domElement);
            if (optLogoText) this.setLogoText(optLogoText);
        },

        remove: function() {
            this.removeConsole();
            this.removeElement(this.domElement);
        },

        removeElement: function(el) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }
    };

    Global.JSLoader = {

        SVGNamespace: 'http:\/\/www.w3.org/2000/svg',
        XLINKNamespace: 'http:\/\/www.w3.org/1999/xlink',
        LIVELYNamespace: 'http:\/\/www.experimentalstuff.com/Lively',

        require: function(relPath) {
            // for use with NodeJS
            var pathLib = require('path'),
                parentDir = pathLib.dirname(module.parent.filename),
                absPath = pathLib.resolve(parentDir, relPath),
                path = 'file://' + absPath + (/\.js$/.test(absPath) ? '' : '.js'),
                loaded = false,
                that = this,
                cb;
            Global.lively.whenLoaded(function() {
                that.loadJs(path, function() {
                    console.log("loaded " + path);
                    loaded = true;
                    if (cb) cb();
                });
            });
            return {
                toRun: function(toRunCB) {
                    if (loaded) {
                        console.log("already loaded");
                        toRunCB();
                    } else {
                        console.log("wait for loading");
                        cb = toRunCB;
                    }
                }
            };
        },
        loadJs: browserDetector.isNodejs() ?
            function(url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
                console.log('loading ' + url);
                var path = url;
                //var path = url.match(/(^http|^file):\/\/(.*)/)[2];
                var scriptEl = window.document.createElement("script");
                scriptEl.src = path;
                window.document.body.appendChild(scriptEl);
                if (onLoadCb) {
                    scriptEl.onload = onLoadCb;
                }
                return Global;
            } :
            function(url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
                if (okToUseCache === undefined) okToUseCache = true;
                if (this.scriptInDOM(url)) {
                    var msg = 'script ' + url + ' already loaded or loading';
                    console.log(msg);
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
                    xmlNamespace = parentNode.namespaceURI, el;

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
                console.log(exactUrl);
                return loadSync ?
                    this.loadSync(exactUrl, onLoadCb, el) :
                    this.loadAsync(exactUrl, onLoadCb, el);
            },

        loadSync: function(url, onLoadCb, script) {
            if (this.isCSS(url)) {
                console.log('skipping eval for css: ' + url);
                if (typeof onLoadCb === 'function') onLoadCb();
                return;
            }
            var source = this.getSync(url);
            if (!source) { console.warn('Could not load %s', url); return; }
            try {
                eval(source);
            } catch (e) {
                console.error('Error when loading %s: %s\n%s', url, e, e.stack);
            }
            if (typeof onLoadCb === 'function') onLoadCb();
        },

        loadAsync: function(url, onLoadCb, script) {
            if (script.namespaceURI === this.SVGNamespace) {
                script.setAttributeNS(this.XLINKNamespace, 'href', url);
            } else if (this.isCSS(url)) {
                script.setAttribute("href", url);
                if (typeof onLoadCb === 'function') onLoadCb(); // huh?
            } else {
                script.setAttributeNS(null, 'src', url);
            }

            if (onLoadCb) script.onload = onLoadCb;
            script.setAttributeNS(null, 'async', true);
        },

        loadCombinedModules: function(combinedFileUrl, callback, hash) {
            // If several modules are combined in one file they can be loaded
            // with this method. The method will ensure that all included
            // modules are loaded. If they have required modules that are not
            // included in the combined file, those will be loaded as well.

            var lively = Global.lively,
                originalLoader = this,
                combinedLoader = {

                    expectToLoadModules: function(relativePaths) {
                        // urls like http://foo.org/lively/Text.js
                        var i, len = relativePaths.length;
                        this.expectedModuleURLs = new Array(len);
                        for (i = 0; i < len; i++) {
                            this.expectedModuleURLs[i] =
                                Global.LivelyLoader.codeBase + relativePaths[i];
                        }

                        // modules like lively.Text
                        this.expectedModules = new Array(len);
                        for (i = 0; i < len; i++) {
                            var moduleName = relativePaths[i]
                                             .replace(/\//g, '.')
                                             .replace(/\.js$/g, '');
                            this.expectedModules[i] = moduleName;
                        }

                        // create script tags that are found when tested if a
                        // file is already loaded
                        this.expectedModuleURLs.forEach(function(url) {
                            var script = document.createElement('script');
                            script.setAttribute('id', url);
                            document.getElementsByTagName('head')[0]
                                .appendChild(script);
                        });
                    },

                    includedInCombinedFile: function(url) {
                        return this.expectedModuleURLs
                            && this.expectedModuleURLs.indexOf(url) >= 0;
                    },

                    loadJs: function(url) {
                        console.log('load file that is not in'
                                   + ' combined modules: ' + url);
                        if (!this.includedInCombinedFile(url)) {
                            originalLoader.loadJs(url);
                        }
                    },

                    scriptInDOM: function(url) {
                        return originalLoader.scriptInDOM(url)
                            || this.includedInCombinedFile(url);
                    }

                },

                callCallback = function() {
                    Global.JSLoader = originalLoader;
                    // FIXME
                    // Filter out the modules already loaded
                    var allModules = combinedLoader.expectedModules,
                        realModules = allModules.select(function(ea) {
                            // FIXME, better now throw error in Class.forName
                            return !ea.include('lively-libs')
                                && Class.forName(ea) !== undefined;
                        });
                    lively.require(realModules).toRun(callback);
                };

            if (this.scriptInDOM(combinedFileUrl)) { callCallback(); return; }

            // while loading the combined file we replace the loader
            Global.JSLoader = combinedLoader;
            this.loadJs(combinedFileUrl, callCallback,
                        false, false, hash);
        },

        loadAll: function(urls, cb) {
            [].concat(urls).reverse().reduce(function(loadPrevious, url) {
                return function() { Global.JSLoader.loadJs(url, loadPrevious); };
            }, function() { if (cb) cb(); })();
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
            return el.getAttributeNS(this.XLINKNamespace, 'href')
                || el.getAttribute('src');
        },

        getScripts: function() {
            return document.getElementsByTagName('script');
        },

        scriptInDOM: function(url) {
            return this.scriptsThatLinkTo(url).length > 0;
        },

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
            // FIXME duplicated from URL class in lively. Network actually
            // lively.Core should require lively.Network -- but lively.Network
            // indirectly lively.Core ====>>> FIX that!!!
            var protocolMatch = urlString.match(/(^[^:]+:\/\/)(.*)/),
                protocol = protocolMatch[1],
                result = protocolMatch[2];
            // resolve ..
            do {
                urlString = result;
                result = urlString.replace(/\/[^\/]+\/\.\./, '');
            } while (result !== urlString);
            // foo//bar --> foo/bar
            result = result.replace(/([^:])[\/]+/g, '$1/');
            // foo/./bar --> foo/bar
            result = result.replace(/\/\.\//g, '/');
            return protocol + result;
        },

        scriptElementLinksTo: function(el, url) {
            if (!el.getAttribute) return false;
            // FIXME use namespace consistently
            if (el.getAttribute('id') === url) return true;
            var link = this.getLinkAttribute(el);
            if (!link) return false;
            if (url === link) return true;
            var linkString = this.makeAbsolute(link),
                urlString = this.makeAbsolute(url);
            return linkString === urlString;
        },

        currentDir: browserDetector.isNodejs() ?
            function() { return "file://" + __dirname + '/'; } :
            function() {
                return this.dirOfURL(document.location.href.toString());
            },

        dirOfURL: function(url) {
            return this.removeQueries(url)
                       .substring(0, url.lastIndexOf('/') + 1);
        },

        makeAbsolute: function(urlString) {
            urlString = this.removeQueries(urlString);
            if (!urlString.match(/^http|^file/)) {
                // make absolute
                urlString = this.currentDir() + urlString;
            }
            return this.resolveURLString(urlString);
        },

        makeUncached: function(urlString, cacheQuery) {
            cacheQuery = cacheQuery || new Date().getTime();
            return urlString
                 + (urlString.indexOf('?') === -1 ? '?' : '&')
                 + cacheQuery;
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
            var req = this.getSyncReq(url, forceUncached);
            return req.status < 400 ? req.responseText : null;
        },

        getSyncStatus: function(url, forceUncached) {
            return this.getSyncReq(url, forceUncached).status;
        },

        isCSS: function(url) {
            return url.match(/\.css$/) || url.match(/\.css\?/);
        }
    };

    // TODO: Something is wrong with the lively-libs, use debug only to
    // activate loading on ios 5
    var libsFile = /*useMinifiedLibs ? 'lib/lively-libs.js' :*/ 'lib/lively-libs-debug.js',
        libsFiles = [libsFile],
        bootstrapFiles = [
            'lively/Migration.js',
            'lively/JSON.js',
            'lively/lang/Object.js',
            'lively/lang/Function.js',
            'lively/lang/String.js',
            'lively/lang/Array.js',
            'lively/lang/Number.js',
            'lively/lang/Date.js',
            'lively/lang/Worker.js',
            'lively/defaultconfig.js',
            'lively/Base.js',
            'lively/ModuleSystem.js'
        ],
        codeBase = (function findCodeBase() {
            var codeBase = Global.Config && Config.codeBase,
                parentDir;
            if (codeBase) return codeBase;
            if (browserDetector.isNodejs()) {
                parentDir = Global.JSLoader.currentDir() + '../';
                return Config.codeBase = Global.JSLoader.makeAbsolute(parentDir);
            }
            // search for script that links to "bootstrap.js" and construct
            // the codeBase path from its path
            var bootstrapFileName = 'bootstrap.js',
                scripts = Global.JSLoader.getScripts(),
                i = 0, node, urlFound;
            while (!urlFound && (node = scripts[i++])) {
                var url = Global.JSLoader.getLinkAttribute(node);
                if (url && (url.indexOf(bootstrapFileName) >= 0)) {
                    urlFound = url;
                }
            }
            if (!urlFound) {
                console.warn('Cannot find codebase, have to guess...');
                return Global.JSLoader.dirOfURL(Global.location.href.toString());
            }
            parentDir = Global.JSLoader.dirOfURL(urlFound) + '../';
            codeBase = Global.JSLoader.makeAbsolute(parentDir);
            console.log('Codebase is ' + codeBase);
            return Config.codeBase = codeBase;
        })(),
        rootPath = (function findRootPath() {
            var rootPath = Global.Config && Config.rootPath;
            if (rootPath) return rootPath;
            if (Global.Config && Config.standAlone) {
                // copied from Config.getDocumentDirectory,
                // Config not yet available...
                var url = document.URL;
                rootPath = url.substring(0, url.lastIndexOf('/') + 1);
                return Config.rootPath = rootPath;
            }
            if (codeBase) {
                var parentDir = Global.JSLoader.dirOfURL(codeBase) + '../';
                rootPath = Global.JSLoader.makeAbsolute(parentDir);
                console.log('Root path is ' + rootPath);
                return Config.rootPath = rootPath;
            }
            console.warn('Cannot find rootPath, have to guess...');
            var currentUrl = Global.location.href.toString();
            return Config.rootPath = Global.JSLoader.dirOfURL(currentUrl);
        })();

    // ------- generic load support ----------
    Global.LivelyLoader = {
        libsFile: libsFile,
        libsFiles: libsFiles,
        bootstrapFiles: bootstrapFiles,
        codeBase: codeBase,
        rootPath: rootPath,

        installWatcher: function(target, propName, haltWhenChanged) {
            // observe slots, for debugging
            var newPropName = '__' + propName;
            target[newPropName] = target[propName];
            target.__defineSetter__(propName, function(v) {
                target[newPropName] = v;
                console.log(target.toString()
                           + '.' + propName
                           + ' changed: ' + v);
                if (haltWhenChanged) debugger;
            });
            target.__defineGetter__(propName, function() {
                return target[newPropName];
            });
            console.log('Watcher for ' + target
                       + '.' + propName + ' installed');
        },

        //
        // ------- load world ---------------
        //
        loadMain: function(doc, startupFunc) {
            LoadingScreen.add('Loading');
            var bootstrapModules = [
                'lively.lang.Closure',
                'lively.lang.UUID',
                'lively.bindings',
                'lively.LocalStorage',
                'lively.Main'
            ];
            require(bootstrapModules).toRun(function() {
                lively.Config.loadUserConfigModule();
                var loader = lively.Main.getLoader(doc);
                lively.bindings.connect(loader, 'finishLoading',
                                        LoadingScreen, 'remove');
                if (startupFunc) {
                    loader.startupFunc = startupFunc;
                    lively.bindings.connect(loader, 'finishLoading',
                                            loader, 'startupFunc');
                }
                loader.systemStart(doc);
            });
        },

        startFromSerializedWorld: function(startupFunc) {
            this.bootstrap(this.loadMain.bind(this, document, startupFunc));
            return true;
        },

        bootstrap: function(thenDoFunc) {
            var url = Global.JSLoader.currentDir(),
                dontBootstrap = Config.standAlone
                             || url.indexOf('dontBootstrap=true') >= 0;
            if (dontBootstrap) { thenDoFunc(); return }

            var cb = this.codeBase,
                optimizedLoading = !url.match('quickLoad=false')
                                && !url.match('!svn')
                                && url.match('webwerkstatt')
                                && url.match('lively-kernel.org');

            if (optimizedLoading) {
                console.log('optimized loading enabled');
                var hashUrl = cb + 'generated/combinedModulesHash.txt',
                    combinedModulesUrl = cb + 'generated/combinedModules.js',
                    hash = Global.JSLoader.getSync(hashUrl, true/*uncached*/);
                Global.JSLoader.loadCombinedModules(
                    combinedModulesUrl, thenDoFunc, hash);
                return;
            }

            Global.JSLoader.resolveAndLoadAll(cb, [this.libsFiles], function() {
                (function setupjQuery(Global) {
                    var lively = Global.lively,
                        jQuery = Global.jQuery;
                    // we still are adding jQuery to Global but this is DEPRECATED
                    // We need to be able to run with libraries requiring different jQuery versions
                    // so we will restrict "our" to lively.$ in the future
                    Global.$ = lively.$ = jQuery.noConflict(/*true -- really removes $*/);
                })(Global);
                Global.JSLoader.resolveAndLoadAll(cb, Global.LivelyLoader.bootstrapFiles, thenDoFunc);
            });
        }

    };

    Global.EmbededLoader = {

        //
        // ------- embedd world in another page ---------------
        //
        addWorld: function(worldURL, targetElement) {
            this.worldURL = worldURL;
            this.targetElement = targetElement;
            Global.LivelyLoader.bootstrap(function() {
                Global.EmbededLoader.embedAndLoadWorld(worldURL, targetElement);
            });
        },

        embedAndLoadWorld: function(worldURL, targetElement) {
            console.log('Fetching ' + worldURL);
            var doc = new WebResource(worldURL).get().contentDocument;
            this.convertCDATASections(doc.documentElement);
            var canvas = document.importNode(
                doc.getElementById('canvas'), true);
            $A(canvas.getElementsByTagName('script')).forEach(function(e) {
                e.parentElement.removeChild(e);
            });
            var div = document.createElement('div');
            div.style['page-break-before'] = 'always';
            div.style['page-break-inside'] = 'avoid';
            div.appendChild(canvas);
            targetElement.appendChild(div);

            Config.isEmbedded = true;

            var worldElement;
            // SVG detection
            if (canvas.getElementsByTagName('g').length > 0) {
                // FIXME ugly hack: width/height not properly saved in canvas
                // element so reset it to the width/height of the rect of the
                // worldmorph
                Config.resizeScreenToWorldBounds = false;
                worldElement = canvas.getElementsByTagName('g')[0];
                var world = worldElement.childNodes[0];
                canvas.setAttribute(
                    "width", world.width.baseVal.value.toString() + 'px');
                canvas.setAttribute(
                    "height", world.height.baseVal.value.toString() + 'px');
            } else {
                // FIXME!!!
                Config.resizeScreenToWorldBounds = false;
                canvas.setAttribute(
                    "width", targetElement.clientWidth + 'px');
                canvas.setAttribute(
                    "height", targetElement.clientHeight + 'px');
                worldElement = canvas.getElementsByTagName('div')[0];
                worldElement.setAttribute(
                    "width", targetElement.clientWidth + 'px');
                worldElement.setAttribute(
                    "height", targetElement.clientHeight + 'px');
                var pos = targetElement.getAttribute('lively:position');
                if (pos) {
                    var values = pos.split(' ');
                    canvas.style.position = 'absolute';
                    canvas.style.left = values[0];
                    canvas.style.top = values[1];
                }
            }
            document.body.style.cursor = null;
            Global.LivelyLoader.loadMain(canvas);
        },

        convertCDATASections: function(el) {
            // CDATA sections are not allowed in (X)HTML documents....
            if (el.nodeType === document.CDATA_SECTION_NODE) {
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
            return attr && attr !== '';
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

    Global.LivelyMigrationSupport = {
        // increase this value by hand if you make a change that effects
        // object layout LivelyMigrationSupport.migrationLevel
        migrationLevel: 7,
        documentMigrationLevel: 0,
        migrationLevelNodeId: 'LivelyMigrationLevel',
        moduleRenameDict: {},
        worldJsoTransforms: [],

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
        },

        addWorldJsoTransform: function(func) {
            this.worldJsoTransforms.push(func);
        },

        applyWorldJsoTransforms: function(jso) {
            this.worldJsoTransforms.forEach(function(func) { jso = func(jso) });
            return jso;
        },

        fixCSS: function(doc) {
            var styles = document.getElementsByTagName('style')
            for (var i = styles.length-1; i >= 0; i--) {
                styles[i].parentNode.removeChild(styles[i]);
            }
        }
    };

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-
    // initializing bootstrap
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-
    var domLoaded;
    if (browserDetector.isNodejs()) {
        domLoaded = true;
    } else {
        domLoaded = false;
        Global.addEventListener('DOMContentLoaded', function() { domLoaded = true; }, true);
    }

    function setupExitWarning() {
        Global.addEventListener('beforeunload', function(evt) {
            if (!!Global.Config.askBeforeQuit) {
                var msg = "Lively Kernel data may be lost if not saved.";
                evt.returnValue = msg;
                return msg;
            } else {
                return undefined;
            }
        }, true);
    }

    function initBrowserBootstrap() {
        LoadingScreen.add();
        if (!domLoaded) {
            Global.addEventListener('DOMContentLoaded', initBrowserBootstrap, true);
            return;
        }
        Global.removeEventListener('DOMContentLoaded', initBrowserBootstrap, true);
        setupExitWarning();
        if (Global.document) {
            Global.LivelyMigrationSupport.setDocumentMigrationLevel(document);
            Global.LivelyMigrationSupport.fixCSS(document);
        }
        var startupFunc = Config.onStartWorld;
        if (Global.LivelyLoader.startFromSerializedWorld(startupFunc)) return;
        console.warn("Lively startup failed");
    }

    function initNodejsBootstrap() {
        // remove libs, JSON:
        Global.LivelyLoader.bootstrapFiles = [
            'lib/lively-libs-nodejs.js'].concat(Global.LivelyLoader.bootstrapFiles);
        var bootstrapModules = [
            'lively.lang.Closure',
            'lively.lang.UUID',
            'lively.bindings',
            'lively.Main'
        ];
        Global.LivelyLoader.bootstrap(function() {
            // need to use Lively's global eval because it creates functions
            // with proper Function.prototype extensions
            var finished = Global.eval('(' + function() {
                var loader = lively.Main.getLoader(document);
                loader.systemStart(document);
                console.log('bootstrap done');
            } + ')');
            Global.require(bootstrapModules).toRun(finished);
        });
    }

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // application cache related
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    Global.lively.ApplicationCache = {
        appCache: Global.applicationCache,

        isActive: (function usesAppCache(appCache) {
                return appCache
                    && appCache.status !== appCache.UNCACHED
                    && !!document.getElementsByTagName('html')[0].getAttribute('manifest');
            })(Global.applicationCache),

        appCacheHandlersInstalled: false,

        setupAppCacheHandlers: function(remove) {
            if (this.appCacheHandlersInstalled && !remove) return;
            if (!this.appCacheHandlersInstalled && remove) return;
            var method = remove ? 'removeEventListener' : 'addEventListener';
            console.log('%s appcache event handlers...', remove ? 'Uninstalling' : 'Installing');
            ['checking','downloading','progress','updateready','error','noupdate','cached','obsolete'].forEach(function(evtName) {
                var handlerName = 'on' + evtName.charAt(0).toUpperCase() + evtName.slice(1);
                var handler = this['_'+handlerName] || (this['_'+handlerName] = this[handlerName].bind(this));
                this.appCache[method](evtName, handler, false);
            }, this);
            this.appCacheHandlersInstalled = !remove;
        },

        update: function() { return this.appCache.update(); },

        signal: function(type, evt, message) {
            if (!lively.bindings || !lively.bindings.signal) return;
            lively.bindings.signal(this, type, {evt: evt, message: message});
        },

        // Checking for an update. Always the first event fired in the sequence.
        onChecking: function(evt) {
            var msg = 'Application cache is checking if there are new sources to load...'
            console.log(msg);
            this.signal('checking', evt, msg);
        },

        // An update was found. The browser is fetching resources.
        onDownloading: function(evt) {
            var msg = 'Application cache is fetching content...';
            console.log(msg);
            this.signal('checking', evt, msg);
        },

        onProgress: function(evt) {
            if (!evt.lengthComputable) return;
            var msg = 'Application cache progress ' + evt.loaded/evt.total;
            this.signal('progress', evt, msg);
        },

        // Fired when the manifest resources have been newly redownloaded.
        onUpdateready: function(evt) {
            console.log('Application cache successfully loaded new content.');
            this.appCache = Global.applicationCache;
            try {
                // FIXME rk 2013-03-06: sometimes this throws a DOM error?
                this.appCache.swapCache();
                this.setupAppCacheHandlers(true);
                this.appCache = Global.applicationCache;
                this.setupAppCacheHandlers();
            } catch(e) {
                console.error(e);
            }
            var msg = 'A newer version of Lively is available.\n'
                    + 'You can safely continue to work or reload\n'
                    + 'this world to get the updates.';
            this.signal('updateready', evt, msg);
            lively.whenLoaded(function(world) {
                world.createStatusMessage(msg, {extent: pt(280, 68), openAt: 'topRight', removeAfter: 20*1000});
            });
        },

        // The manifest returns 404 or 410, the download failed,
        // or the manifest changed while the download was in progress.
        onError: function(evt) {
            var msg = 'Error occured while loading the application cache: ' + evt;
            console.log(msg)
            this.signal('error', evt, msg);
        },

        // Fired after the first download of the manifest.
        onNoupdate: function(evt) {
            console.log('noupdate');
            lively.whenLoaded(function(world) {
                var msg = "Lively is up-to-date."
                world.createStatusMessage(msg, {openAt: 'topRight', removeAfter: 3000});
            });
            this.signal('noupdate', evt, '');
        },

        // Fired after the first cache of the manifest.
        onCached: function(evt) {
            var msg = 'Sources are now cached.';
            console.log(msg);
            this.signal('cached', evt, msg);
        },

        // Fired if the manifest file returns a 404 or 410.
        // This results in the application cache being deleted.
        onObsolete: function(evt) {
            var msg = 'Application cache not available';
            console.log(msg);
            this.signal('obsolete', evt, msg);
            lively.whenLoaded(function(world) {
                var msg = "It appears that the Lively server is not\n"
                        + "available. You can continue to use the\n"
                        + "system but server-dependent services\n"
                        + "might not be accessible.\n"
                        + "Please check the server.\n"
                world.createStatusMessage(msg, {extent: pt(280, 98), openAt: 'topRight'})
            });
        }
    }

    function initOnAppCacheLoad(thenDo) {
        var appCache = Global.applicationCache;
        LoadingScreen.add();
        lively.ApplicationCache.setupAppCacheHandlers();
        thenDo && thenDo();
    }

    // -=-=-=-=-=-=-=-
    // let it run
    // -=-=-=-=-=-=-=-
    (function startWorld(startupFunc) {
        if (browserDetector.isNodejs()) {
            initNodejsBootstrap();
        } else if (lively.ApplicationCache.isActive) {
            initOnAppCacheLoad(initBrowserBootstrap);
        } else {
            initBrowserBootstrap();
        }
    })();

})((typeof window !== "undefined" && window)
 || (typeof global !== "undefined" && global)
 || this);
