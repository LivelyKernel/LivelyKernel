module('lively.versions.tests.MicroBenchmarks').requires('lively.TestFramework', 'lively.versions.ObjectVersioning').toRun(function() {
    
// run micro benchmarks locally: 
// lk test -m 'lively.versions.tests.MicroBenchmarks' -f 'MicroBenchmarks|.*|.*'
    
TestCase.subclass('lively.versions.tests.MicroBenchmarks.ProxiedConstructorApplication', {
    test01CreateLotsOfObjectsFromProxiedConstructor: function() {
        var NewType = lively.versions.ObjectVersioning.proxyFor(function C() {
        });
        
        for (var i = 0; i < 200000; i++) {
            // two arguments, because argument application is suspected to be slow
            new NewType(1, 2);
        }
    }
});

TestCase.subclass('lively.versions.tests.MicroBenchmarks.LookupTest',
'default category', {
    setUp: function() {
        this.client = {};
        this.client.server = {
            foo: function() { return 'foo' }
        };
        // JIT warm-up
        this.performCalls(this.client);
        
        this.proxyClient = {};
        this.proxyClient.server = lively.proxyFor(this.client.server);
        // JIT warm-up
        this.performCalls(this.proxyClient);
    },

    performCalls: function(target) {
        for (var i=0; i < 1000000; i++) {
            target.server.foo();
        }
    },

    testLookupReference: function() {
        this.performCalls(this.client);
    },

    testLookupProxy: function() {
        this.performCalls(this.proxyClient);
    }

});

});
