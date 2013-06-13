//////////////////////////////////////////////////////////
// Simplyfying the usage of the browser's Worker object //
//////////////////////////////////////////////////////////

/*** Usage ***

var worker = lively.Worker.create(function() {
  // code inside this function is run when the worker is created
  setInterval(console.log.bind(console, "worker is still running"), 1000);
  self.onmessage = function(evt) {
    // code inside #onmessage is run when we send a message from the UI
    // process. #postMessage here sends stuff back to the UI proc
    console.log('Worker got message ' + evt.data);
    self.postMessage("Hello from worker!");
  }
});

// this is triggered when the worker invokes #postMessage
worker.onmessage = function(evt) {
    console.log('UI got message: ' + evt.data);
};

worker.postMessage("Hello from UI");

setTimeout(function() { worker.terminate(); }, 5000);
*/

lively.Worker = {
    isAvailable: !!window.Worker,
    errors: [],
    create: function() {
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
                if (evt.data.workerReady) { worker.ready = true; return; }
                if (worker.onMessage) worker.onMessage(evt);
            }
            worker.errors = [];
            worker.onerror = function(evt) {
                console.error(evt);
                worker.errors.push(evt);
                if (worker.onError) worker.onError(evt);
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
                    fixModuleName: function(n) { return n; }
                }
                // 2) Load bootstrap files
                importScripts.apply(this, options.bootstrapFiles || []);
            }

            self.onmessage = function(evt) {
                if (evt.data.command == "eval") {
                    postMessage({response: "response", value: String(eval(evt.data.source))});
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
        var codeFile = URL.source.getDirectory().withFilename('temp-worker-code.js').asWebResource();
        codeFile.put(workerCode);
        var worker = new Worker(codeFile.getURL().toString());
        lively.bindings.connect(worker, 'ready', codeFile, 'del');
        init(worker);
        return worker;
    }
}
