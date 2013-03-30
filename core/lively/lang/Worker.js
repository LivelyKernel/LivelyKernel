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

    create: function(taskFunc) {
        // This code is triggered in the UI process directly after the
        // creation of the worker and sends the setup message to the worker
        // for initializing it. We also create an end point for the
        // console.log function of the worker that is installed in
        // #workerSetupCode below
        function run(worker) {
            var msgChannel = new MessageChannel();
            worker.postMessage("setup", [msgChannel.port2]);
            msgChannel.port1.onmessage = function(evt) {
                var args = evt.data;
                console.log.apply(console, args);
            }
        }

        // This code is run inside the worker and initializes it. It installs
        // a console.log method since since this is not available by default.
        function workerSetupCode() {
            self.onmessage = function(evt) {
                if (evt.data !== "setup") return;
                self.onmessage = null; // delete setup handler
                self.console = {
                    _port: evt.ports[0],
                    log: function log() {
                        var args = Array.prototype.slice.call(arguments);
                        self.console._port.postMessage(args);
                    }
                }
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
        return worker;
    }
}
