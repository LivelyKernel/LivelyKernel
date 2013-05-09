module('lively.lang.tests.WorkerTests').requires('lively.TestFramework').toRun(function() {

AsyncTestCase.subclass('lively.lang.tests.WorkerTests.WorkerCreation',
'testing', {

    testCreateAndRunWorker: function() {
        var messageFromWorker = null,
            worker = lively.Worker.create(),
            workerCode = "this.onmessage = function(evt) {\n"
                       + "    self.postMessage('Worker got \"' + evt.data + '\"');\n"
                       + "}"
        this.waitFor(function() { return worker.ready; }, 100, function() {
            worker.postMessage({command: "eval", source: workerCode});
            worker.onMessage = function(evt) { messageFromWorker = evt.data; }
            worker.postMessage('message to worker');
            this.waitFor(function() { return !!messageFromWorker }, 20, function() {
                this.assertEquals('Worker got "message to worker"', messageFromWorker);
                this.done();
            });
        });
    },

    testLoadBootstrapFiles: function() {
        this.setMaxWaitDelay(5000);
        var messageFromWorker = null,
            worker = lively.Worker.create();
        this.waitFor(function() { return worker.ready; }, 100, function() {
            worker.onMessage = function(evt) { messageFromWorker = evt.data; }
            // simply eval some code in the worker scope that requires the bootstrap
            // files to be loaded
            var src = "(function() { try {\n"
                    + "  return module('lively.foo').uri();\n"
                    + "} catch(e) {\n"
                    + "  return e + String(e.stack);\n"
                    + "}"
                    + "}).call()";
            worker.postMessage({command: "eval", source: src});
            
            this.waitFor(function() { return !!messageFromWorker; }, 120, function() {
                // this.assertEquals(false, worker.errors.length > 0 && worker.errors[0], 'worker got errors');
                this.assertEquals(URL.root.withFilename('lively/foo.js'), messageFromWorker.value);
                this.done();
            });
        });
    }
});

}); // end of module
