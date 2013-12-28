module('lively.lang.tests.WorkerTests').requires('lively.TestFramework').toRun(function() {

AsyncTestCase.subclass('lively.lang.tests.WorkerTests.WorkerCreation',
'testing', {

    testCreateAndRunWorker: function() {
        var messageFromWorker = null,
            worker = lively.Worker.create(function() { self.customInitRun = true; }),
            workerCode = "this.onmessage = function(evt) {\n"
                       + "    self.postMessage('Worker custom init: ' + self.customInitRun + '. Worker got \"' + evt.data + '\"') }";
        this.delay(function() {
            worker.postMessage({command: "eval", source: workerCode, silent: true});
            worker.onMessage = function(evt) { messageFromWorker = evt.data; }
            worker.postMessage('message to worker');
            this.waitFor(function() { return !!messageFromWorker }, 20, function() {
                this.assertEquals('Worker custom init: true. Worker got "message to worker"', messageFromWorker);
                this.done();
            });
        }, 200);
    },

    testLoadBootstrapFiles: function() {
        this.setMaxWaitDelay(5000);
        var messageFromWorker = null,
            worker = lively.Worker.create();
        this.waitFor(function() { return worker.ready; }, 10, function() {
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
                this.assertEquals(URL.root.withFilename('core/lively/foo.js'), messageFromWorker.value);
                this.done();
            });
        });
    },
    testWorkerRun: function() {
        var messageFromWorker = null,
            worker = lively.Worker.create();
        worker.onMessage = function(evt) { messageFromWorker = evt.data; }
        this.waitFor(function() { return worker.ready; }, 10, function() {
            worker.run(function(a, b) { postMessage(a+b); }, 1, 2);
            this.waitFor(function() { return !!messageFromWorker }, 20, function() {
                this.assertEquals(3, messageFromWorker);
                this.done();
            });
        });
    }
});

AsyncTestCase.subclass('lively.lang.tests.WorkerTests.FunctionInterface',
"running", {
    setUp: function(run) {
        this.previousIdleTimeOfPoolWorker = Config.get('lively.Worker.idleTimeOfPoolWorker');
        Config.set('lively.Worker.idleTimeOfPoolWorker', 50);
        this.originalWorkerPool = lively.Worker.pool;
        lively.Worker.pool = [];
        run();
    },
    tearDown: function() {
        lively.Worker.pool = this.originalWorkerPool;
        Config.set('lively.Worker.idleTimeOfPoolWorker', this.previousIdleTimeOfPoolWorker);
    }
},
'testing', {

    testForkFunction: function() {
        var test = this, whenDoneResult,
            worker = Functions.forkInWorker(
                function(whenDone, a, b) { whenDone(null, '' + (a + b) + ' ' + self.isBusy); },
                {args: [1, 2], whenDone: function(err, result) { whenDoneResult = result; }});
        this.waitFor(function() { return !!worker.ready}, 10, function() {
            this.delay(function() {
                test.assertEquals('3 true', whenDoneResult);
                this.assertEquals(1, lively.Worker.pool.length, 'worker pool size with worker running.');
                this.delay(function() {
                    this.assertEquals(0, lively.Worker.pool.length, 'worker pool size with worker stopped.');
                    this.done();
                }, 200);
            }, 15);
        });
    },
    testForkLongRunningFunctionKeepsWorkerAlive: function() {
        var test = this, whenDoneResult,
            worker = Functions.forkInWorker(
                function(whenDone) { setTimeout(function() { whenDone(null, 'OK'); }, 300); },
                {whenDone: function(err, result) { whenDoneResult = result; }});
        this.waitFor(function() { return !!worker.ready}, 10, function() {
            this.delay(function() {
                test.assert(!whenDoneResult, 'result came to early');
                this.assertEquals(1, lively.Worker.pool.length, 'worker pool size with worker running.');
                this.delay(function() {
                    test.assertEquals('OK', whenDoneResult);
                    this.assertEquals(0, lively.Worker.pool.length, 'worker pool size with worker stopped.');
                    this.done();
                }, 200);
            }, 200);
        });
    }

});

}); // end of module
