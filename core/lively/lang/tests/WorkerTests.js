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
        }, 300);
    }

});

}); // end of module