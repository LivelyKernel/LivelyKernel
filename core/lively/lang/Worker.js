//////////////////////////////////////////////////////////
// Simplyfying the usage of the browser's Worker object //
//////////////////////////////////////////////////////////

/*** Usage ***
var worker = lively.Worker.create(function() {
    // code inside this function is run in the worker context
    // when the worker is created
    setInterval(function() {
        self.postMessage('Worker is still running...');
    }, 1000);
    self.postMessage("Init done!");
});
worker.onMessage = function(evt) { show(evt.data); }
worker.postMessage({command: "eval", source: "3+4"}); // direct eval
worker.run(function(a, b) { postMessage(a+b); }, 1, 2); // run with arguments
(function() { worker.postMessage({command: "close"}); }).delay(5);
*/

lively.Worker = {
    isAvailable: !!Global.Worker,
    pool: [],
    createInPool: function(customInitFunc, autoShutdownDelay/*ms*/) {
        var worker = this.create(customInitFunc);
        if (autoShutdownDelay) {
            var shutdownCode =  Strings.format("self.terminateIfNotBusyIn(%s);", autoShutdownDelay);
            worker.postMessage({command: 'eval', source: shutdownCode});
        }
        lively.Worker.pool.push(worker);
        lively.bindings.connect(worker, 'ready', lively.Worker.pool, 'remove', {
            updater: function($upd, readyState) { if (readyState) return; $upd(this.sourceObj); }});
        return worker;
    },
    create: function(customInitFunc) {
        // This code is triggered in the UI process directly after the
        // creation of the worker and sends the setup message to the worker
        // for initializing it.
        function init(worker) {
            var bootstrapFiles = LivelyLoader.bootstrapFiles.map(function(url) {
                return url.startsWith('http:') ? url : URL.root.toString() + url; });
            worker.postMessage({
                command: 'setup',
                options: {
                    locationDirectory: JSLoader.currentDir(),
                    bootstrapFiles: bootstrapFiles,
                    codeBase: lively.Config.codeBase,
                    rootPath: lively.Config.rootPath,
                    nodeJSURL: lively.Config.nodeJSURL,
                    location: (function() {
                        var loc = {};
                        ["hash","host","hostname","href","origin","pathname","port","protocol","search"].forEach(function(name) {
                            loc[name] = lively.Config.location[name]; });
                        return loc;
                    })()
                }
            });
            worker.onmessage = function(evt) {
                if (evt.data.workerReady !== undefined) { worker.ready = !!evt.data.workerReady; return; }
                if (worker.onMessage) worker.onMessage(evt);
            }
            worker.errors = [];
            worker.onerror = function(evt) {
                console.error(evt);
                worker.errors.push(evt);
                if (worker.onError) worker.onError(evt);
            }
            worker.run = function(/*func, args*/) {
                var args = Array.from(arguments), doFunc = args.shift(),
                    code = Strings.format('(%s).apply(self, evt.data.args);', doFunc);
                this.basicRun({func: doFunc, args: args, useWhenDone: false});
            }
            worker.basicRun = function(options) {
                // options = {
                //   func: FUNCTION,
                //   args: ARRAY,  /*transported to worker and applied to func*/
                //   useWhenDone: BOOL
                /* If true, func receives a callback as first parameter that should be called
                   with two arguments: (error, result) to indicate worker func is done. */
                var func = options.func,
                    args = options.args,
                    passInWhenDoneCallback = !!options.useWhenDone,
                    codeTemplate = passInWhenDoneCallback ?
                        'self.isBusy = true;\n'
                      + 'function whenDone(err, result) { self.isBusy = false; postMessage({type: "runResponse", error: err, result: result}); }\n'
                      + '(%s).apply(self, [whenDone].concat(evt.data.args));' :
                        ';(%s).apply(self, evt.data.args);',
                    code = Strings.format(codeTemplate, func);
                worker.postMessage({command: 'eval', silent: true, source: code, args: args || []});
            }
        }

        // This code is run inside the worker and initializes it. It installs
        // a console.log method since since this is not available by default.
        function workerSetupCode() {
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            // yoshiki and robert, 05/08/13: Inserted code that sets up the lively context
            // and globals of Lively:
            function initGlobals(options) {
                // 1) establish required objects
                Global = this;
                Global.window = Global;
                Global.lively = {
                    whenLoaded: function(callback) {
                        // currently ignored in worker
                        Global.Config.finishLoadingCallbacks.push(callback);
                    }
                };
                Global.console = Global.console || (function() {
                    var c = {};
                    ['log', 'error', 'warn'].forEach(function(name) {
                        c[name] = function(/*args*/) {
                            var string = arguments[0];
                            for (var i = 1; i < arguments.length; i++)
                                string = string.replace('%s', arguments[i]);
                            postMessage({
                                type: name,
                                message: ['[', name.toUpperCase(), '] ', string].join('')
                            });
                        };
                    });
                    return c;
                })();
                if (!Global.Config) Global.Config = lively.Config = {
                    codeBase: options.codeBase,
                    rootPath: options.rootPath,
                    nodeJSURL: options.nodeJSURL,
                    location: options.location,
                    modulePaths: [],
                    finishLoadingCallbacks: []
                };
                Config.location.toString = function() { return this.href; }
                if (!Global.document) Global.document = {
                    location: Config.location,
                    URL: Config.location.toString()
                }
                var loadedURLs = [];
                Global.JSLoader = {
                    loadJs: function(url, callback) {
                        // var match = url.match(/http:\/\/[^\/]+(\/?.*)/);
                        // if (match && match[1]) url = match[1];
                        loadedURLs.push(url);
                        try { importScripts(url); } catch(e) {
                            console.error(url + ' could not be loaded in worker: ' + e);
                        }
                    },
                    currentDir: function () { return options.locationDirectory; },
                    isLoading: function(url) { return loadedURLs.indexOf(url) !== -1; }
                }
                Global.LivelyMigrationSupport = {
                    fixModuleName: function(n) { return n; },
                    addModuleRename: function(modName) {}
                }
                // 2) Load bootstrap files
                importScripts.apply(this, options.bootstrapFiles || []);
            }

            self.onmessage = function(evt) {
                if (evt.data.command == "eval") {
                    var result;
                    try { result = eval(evt.data.source); } catch (e) { result = e.stack || e; }
                    if (!evt.data.silent) postMessage({type: "evalResponse", value: String(result)});
                    return;
                } else if (evt.data.command == "close") {
                    self.close();
                    postMessage({type: "closed", workerReady: false});
                    return;
                }
                if (evt.data.command !== "setup") return;
                var options = evt.data.options || {};
                initGlobals(options);
                self.httpRequest = function (options) {
                    if (!options.url) {
                        console.log("Error, httpRequest needs url");
                        return;
                    }
                    var req = new XMLHttpRequest(),
                        method = options.method || 'GET';
                    function handleStateChange() {
                        if (req.readyState === 4) {
                            // req.status
                            options.done && options.done(req);
                        }
                    }
                    req.onreadystatechange = handleStateChange;
                    req.open(method, options.url);
                    req.send();
                }

                self.terminateIfNotBusyIn = function(ms) {
                    setTimeout(function() {
                        if (self.isBusy) { self.terminateIfNotBusyIn(ms); return; }
                        self.postMessage({type: "closed", workerReady: false});
                        self.close();
                    }, ms);
                }

                postMessage({workerReady: true});
            }
        }

        function makeDataURI(codeToInclude) {
            // see http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
            var blob;
            try {
                blob = new Blob([codeToInclude]);
            } catch (e) { // Backwards-compatibility
                window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                blob = new BlobBuilder();
                blob.append(codeToInclude);
                blob = blob.getBlob();
            }
            var urlInterface = typeof webkitURL !== 'undefined' ? webkitURL : URL;
            return urlInterface.createObjectURL(blob);
        }
        var workerCode = Strings.format('(%s)();', String(workerSetupCode));
        if (customInitFunc) {
            var code = Strings.format('(%s)();', customInitFunc);
            workerCode += '\n' + code;
        }
        var worker = new Worker(makeDataURI(workerCode));
        init(worker);
        return worker;
    }
}
