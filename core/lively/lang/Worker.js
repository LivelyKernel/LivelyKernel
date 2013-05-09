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
    create: function(taskFunc) {
        // This code is triggered in the UI process directly after the
        // creation of the worker and sends the setup message to the worker
        // for initializing it. We also create an end point for the
        // console.log function of the worker that is installed in
        // #workerSetupCode below
        function run(worker) {
            worker.postMessage({command: 'setup'});
            worker.onmessage = function(evt) {
                var args = evt.data;
                show(evt.data);
                console.log.apply(console, args);
            }
            worker.errors = [];
            worker.onerror = function(evt) {
                worker.errors.push(evt);
            }
        }

        // This code is run inside the worker and initializes it. It installs
        // a console.log method since since this is not available by default.
        function workerSetupCode() {
            self.realonmessage = function(evt) {
                if (evt.data.command == "eval") {
                    postMessage({response: "response", value: String(eval(evt.data.source))});
                    return;
                }
            }

            self.onmessage = function(evt) {
                if (evt.data.command !== "setup") return;
                self.onmessage = self.realonmessage; // delete setup handler
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

                __CODE_PLACEHOLDER__
            }
        }

        // this might be too brittle...
        // in order to not pass around strings we create functions and
        // stringify them
        function extractCodeOfFunction(func) {
            var code = func.toString();
            code = code.slice(code.indexOf('{') + 1);
            code = code.slice(0, code.lastIndexOf('}'));
            return code;
        }
        
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // yoshiki and robert, May 8 2013: Inserted code that sets up the lively context
        // and globals of Lively:
        function initGlobals(bootstrapFiles) {
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
                    return this.dirOfURL(location.href.toString());
                },
                dirOfURL: function (url) {
                    return url.substring(0, url.lastIndexOf('/') + 1);
                }
            }
            Global.LivelyMigrationSupport = {
                fixModuleName: function(n) { return n}
            }
            importScripts.apply(this, bootstrapFiles);
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // combine the task code extracted from taskFunc with the setup code
        var workerCode = extractCodeOfFunction(workerSetupCode),
            workerTaskCode = extractCodeOfFunction(taskFunc);
        workerCode = workerCode.replace("__CODE_PLACEHOLDER__", workerTaskCode);

        // FIXME... It would be great if we could use data URIs...
        // unfortunately data URIs are not recognized as same origin by a few
        // browsers, among them Chrome. Since workers have to observe the same
        // origin policy we have to create a temp file
        var codeFile = URL.source.getDirectory().withFilename('temp-worker-code.js').asWebResource();
        codeFile.put(workerCode);
        var worker = new Worker(codeFile.getURL().toString());
        run(worker);
        codeFile.del();
        Strings.quote('foo')
        var bootstrapFiles = LivelyLoader.bootstrapFiles.map(function(url) {
            return Strings.quote('/' + URL.create(url).relativePathFrom(URL.root)); });
        worker.postMessage({
            command: "eval",
            source: Strings.format('(%s).call(this, %s);',
                    initGlobals, bootstrapFiles)});
        return worker;
    }
}
