module('lively.lang.tests.WorkerTests').requires('lively.TestFramework').toRun(function() {

AsyncTestCase.subclass('lively.lang.tests.WorkerTests.WorkerCreation',
'testing', {

    testCreateAndRunWorker: function() {
        var messageFromWorker = '',
            worker = lively.Worker.create(function() {
                self.onmessage = function(evt) {
                    self.postMessage('Worker got "' + evt.data + '"');
                }
            });
        worker.onmessage = function(evt) {
            messageFromWorker = evt.data;
        }
        worker.postMessage('message to worker');
        this.delay(function() {
            this.assertEquals('Worker got "message to worker"', messageFromWorker);
            this.done();
        }, 600);
    },

    testLoadBootstrapFiles: function() {
        var messageFromWorker = '',
            worker = lively.Worker.create(function() {});
         worker.onmessage = function(evt) {
             messageFromWorker = evt.data;
         }

        // simply eval some code in the worker scope that requires the bootstrap
        // files to be loaded
        var src = "try {\n"
                + " module('lively.foo').uri()\n"
                + " } catch(e) {\n"
                + " String(e.stack);\n"
                + " }"
        worker.postMessage({command: "eval", source: src});

        this.delay(function() {
            if (worker.errors.length > 0) console.log(show(worker.errors[0].message));
            this.assertEquals(0, worker.errors.length, 'worker got errors');
            this.assertEquals(URL.root.withFilename('lively/foo.js'), messageFromWorker.value);
            this.done();
        }, 900);
    }

});

}); // end of module
