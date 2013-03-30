module('cop.tests.TracingTests').requires('cop.Layers', 'lively.TestFramework', 'cop.Tracing', 'cop.CopBenchmark').toRun(function(thisModule) {


TestCase.subclass('cop.tests.TracingTests.TracerTest',
'running', {
    setUp: function($super) {
        $super();
    },

    tearDown: function($super) {
        $super();
        this.removeDummyClass();
    },
},
'helper', {
    createTracer: function() {
        this.tracer = new cop.Tracing.ObjectTracer();
        cop.Tracing.ObjectTracer.reset(this.tracer);
        return this.tracer
    },
    createDummyClass: function() {
        return this.dummyClass = Object.subclass('TracerDummyClass', {
            m1: function() {
                console.log('TracerDummyClass>>m1 activated');
            },
            m2: function() {
                console.log('TracerDummyClass>>m2 activated');
                this.m1();
                this.m1();
            },
        });
    },
    removeDummyClass: function() {
        if (!this.dummyClass) return
        this.dummyClass.remove()
        this.dummyClass = null;
    },
    createInstrumentedDummyClass: function() {
        this.createDummyClass();
        this.createTracer();
        this.tracer.constructor.instrument([this.dummyClass]);
        return this.dummyClass
    },
},
'testing', {
    test01SimpleMethodActivation: function() {
        var klass = this.createInstrumentedDummyClass();
        cop.withLayers([cop.Tracing.ObjectTraceLayer], function(){
            new klass().m1()
        });
        this.assert(this.tracer.rootActivations[0], 'no activation recorded');
        var activation = this.tracer.rootActivations[0];
        this.assertEquals('m1', activation.methodName);
        this.assertEquals(klass.type, activation.className);
    },
    test02CallerAndCallee: function() {
        var klass = this.createInstrumentedDummyClass();
        cop.withLayers([cop.Tracing.ObjectTraceLayer], function(){
            new klass().m2() // m2 calls m1 twice
        });
        var root = this.tracer.rootActivations[0],
            callees = root.callees;
        this.assertEquals(2, callees.length, 'no activation recorded');
        this.assertEquals('m1', callees[0].methodName);
        this.assertEquals('m1', callees[1].methodName);
        this.assertIdentity(root, callees[0].caller);
    },

});

}); // end of module
