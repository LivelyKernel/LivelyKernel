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
    isAvailable: !!window.Worker,
    errors: [],
    create: function(customInitFunc) {
        // This code is triggered in the UI process directly after the
        // creation of the worker and sends the setup message to the worker
        // for initializing it.
        function init(worker) {
            var bootstrapFiles = LivelyLoader.bootstrapFiles.map(function(url) {
                return '/' + URL.create(url).relativePathFrom(URL.root); });
            worker.postMessage({
                command: 'setup',
                options: {
                    locationDirectory: JSLoader.currentDir(),
                    bootstrapFiles: bootstrapFiles
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
                var args = Array.from(arguments);
                var doFunc = args.shift();
                var code = Strings.format('(%s).apply(self, evt.data.args);', doFunc);
                worker.postMessage({command: 'eval', silent: true, source: code, args: args});
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
                Global.lively={};
                Global.console = {
                    log: function() {}, error: function() {}, warn: function() {}
                }
                Global.JSLoader = {
                    loadJs: function(url, callback) {
                        var match = url.match(/http:\/\/[^\/]+(\/?.*)/);
                        if (match && match[1]) url = match[1];
                        importScripts(url);
                    },
                    currentDir: function () {
                        return options.locationDirectory;
                    }
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
                    if (!evt.data.silent) postMessage({type: "response", value: String(result)});
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

                postMessage({workerReady: true});
            }
        }

        // temporarily create a file with the worker setup code
        // rk 05/08/13: tried out the blob object in Chrome as described in
        // http://www.html5rocks.com/en/tutorials/workers/basics/
        // but with no success
        var workerCode = Strings.format('(%s)();', String(workerSetupCode));
        if (customInitFunc) {
            var code = Strings.format('(%s)();', customInitFunc);
            workerCode += '\n' + code;
        }
        var codeFile = URL.source.getDirectory().withFilename('temp-worker-code.js').asWebResource();
        codeFile.put(workerCode);
        var worker = new Worker(codeFile.getURL().toString());
        lively.bindings.connect(worker, 'ready', codeFile, 'del');
        init(worker);
        return worker;
    }
}
