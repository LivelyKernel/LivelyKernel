module('lively.tests.TracingTests').requires('lively.TestFramework', 'lively.Tracing').toRun(function() {

TestCase.subclass('lively.tests.TracingTests.AbstractTracingTests',
'helper', {
    dummyObject: function() {
        return {
            foo: function(a) { return a + 3; },
            bar: function() { return 'foo'; }
        };
    },
    createClass: function(name, def, optSuperClass) {
        var fullName = "TracingsTests" + name,
            existing = Class.forName(fullName),
            superClass = optSuperClass || Object;
        if (existing) existing.remove();
        return superClass.subclass(fullName, def);
    }
},
'running', {
    setUp: function() {
        this.obj = {
            foo: function(a) { return a + 3; },
            bar: function() { return 'foo'; }
        }
        this.dummyClass = this.createClass("Dummy", {
            foo: function() { return 3; },
            bar: function() { return 3; }
        });
        Object.extend(this.dummyClass, {
            classMethod: function() { return 99; }
        });
        this.dummySubClass = this.createClass("Dummy2", {
            foo: function($super) { return $super() + 2; }
        }, this.dummyClass);
    },
    tearDown: function() {
        this.dummySubClass.remove();
        this.dummyClass.remove();
    }
});

lively.tests.TracingTests.AbstractTracingTests.subclass('lively.tests.TracingTests.TracingInstallTests',
'testing', {

    testInstallInSimpleObject: function() {
        var isTraced = lively.Tracing.instrumentMethod(this.obj, 'foo');
        this.assert(isTraced, "instrument says it wasn't successful");
        this.assert(this.obj.foo.isLivelyTracingWrapper, "method not instrumented");
    },

    testDontInstrumentContextJsMethod: function() {
        var l = cop.create("lively.Tracing.TestLayer");
        l.refineObject(this.obj, {foo: function() { alert('layer'); return cop.proceed(2); } });
        var isTraced = lively.Tracing.instrumentMethod(this.obj, 'foo');
        this.assert(!isTraced, "instrument says it was successful");
        this.assert(!this.obj.foo.isLivelyTracingWrapper, "method instrumented");
    },

    testDontInstrumentTwice: function() {
        lively.Tracing.instrumentMethod(this.obj, 'foo');
        var isTraced = lively.Tracing.instrumentMethod(this.obj, 'foo');
        this.assert(isTraced, "instrument says it wasn't successful");
        this.assert(this.obj.foo.isLivelyTracingWrapper, "method not instrumented");
        this.assert(!this.obj.foo.originalFunction.isLivelyTracingWrapper, "method instrumented twice");
    },

    testInstrumentClass: function() {
        var c = this.dummyClass;
        lively.Tracing.instrumentClass(c);
        this.assert(c.prototype.foo.isLivelyTracingWrapper, "instance method");
        this.assert(c.prototype.bar.isLivelyTracingWrapper, "instance method 2");
    },

    testInstrumentScriptMethods: function() {
        var obj = {};
        (function foo() { return 3 }).asScriptOf(obj);
        lively.Tracing.instrumentObject(obj);
        this.assert(obj.foo.isLivelyTracingWrapper, "not instrumented");
    },

    testObjectMethodsAreInstrumentedWhenAdded: function() {
        var tracingEnabled = lively.Tracing.stackTracingEnabled;
        lively.Tracing.stackTracingEnabled = true;
        var obj = {};
        try {
            (function foo() { return 3 }).asScriptOf(obj);
            this.assert(obj.foo.isLivelyTracingWrapper, "not instrumented");
        } finally {
            lively.Tracing.stackTracingEnabled = tracingEnabled;
        }
    },

    testInstrumentMorph: function() {
        var morph = new lively.morphic.Morph();
        morph.addScript(function foo() { return 3 });
        lively.Tracing.instrumentObject(morph);
        this.assert(morph.foo.isLivelyTracingWrapper, "not instrumented");
        this.assert(!morph.addMorph.isLivelyTracingWrapper, "instrumented inherited method");
    }
});

lively.tests.TracingTests.AbstractTracingTests.subclass('lively.tests.TracingTests.TracingUninstallTests',
'testing', {

    testUninstallMethod: function() {
        lively.Tracing.instrumentMethod(this.obj, 'foo');
        lively.Tracing.uninstrumentMethod(this.obj, 'foo');
        this.assert(!this.obj.foo.isLivelyTracingWrapper, "method still instrumented");
        this.assertEquals(1, Functions.methodChain(this.obj.foo).length, "composition");
    },

    testUninstallMethodWrappedBeforeTraceInstrumentation: function() {
        this.obj.foo = this.obj.foo.wrap(function() { return "bar" });
        var wrapper = this.obj.foo;
        lively.Tracing.instrumentMethod(this.obj, 'foo');
        lively.Tracing.uninstrumentMethod(this.obj, 'foo');
        this.assertEquals(wrapper, this.obj.foo, "wrapper not pointingto orig");
        this.assertEquals(2, Functions.methodChain(this.obj.foo).length, "composition");
    },

    testUninstallMethodWrapperAfterTraceInstrumentationFails: function() {
        lively.Tracing.instrumentMethod(this.obj, 'foo');
        this.obj.foo = this.obj.foo.wrap(function() { return "bar" });
        console.log('(the error below is expected, no worries, friend)');
        lively.Tracing.uninstrumentMethod(this.obj, 'foo');
        this.assertEquals(3, Functions.methodChain(this.obj.foo).length, "composition");
    },

    testUninstrumentClass: function() {
        var c = this.dummyClass;
        lively.Tracing.instrumentClass(c);
        lively.Tracing.instrumentClass(c, true /*remove*/);
        this.assert(!c.prototype.foo.isLivelyTracingWrapper, "instance method");
        this.assert(!c.prototype.bar.isLivelyTracingWrapper, "instance method 2");
        this.assert(!c.classMethod.isLivelyTracingWrapper, "class method");
    },

    testUninstrumentObject: function() {
        var obj = {};
        (function foo() { return 3; }).asScriptOf(obj);
        lively.Tracing.instrumentObject(obj);
        lively.Tracing.instrumentObject(obj, true);
        this.assert(!obj.foo.isLivelyTracingWrapper, "still instrumented");
    }

});

lively.tests.TracingTests.AbstractTracingTests.subclass('lively.tests.TracingTests.TracingTests',
'testing', {

    testTraceSimpleMethod: function() {
        lively.Tracing.instrumentMethod(this.obj, 'foo');
        var result = lively.Tracing.trace(this.obj.foo, {returnTrace: true});
        this.assert(result.isTracerNode, "method not traced");
    },

    testTraceInstanceMethod: function() {
        var obj = new this.dummyClass();
        lively.Tracing.instrumentClass(this.dummyClass);
        var result = lively.Tracing.trace(obj.foo, {returnTrace: true});
        this.assert(result.isTracerNode, "method not traced");
    },

    testTraceMethodWithSuperCall: function() {
        var obj = this.dummySubClass();
        lively.Tracing.instrumentClass(this.dummySubClass);
        var result = lively.Tracing.trace(obj.foo);
        this.assertEquals(result, 5, "wrong call result");
    }

});

});