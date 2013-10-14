module('lively.versions.tests.MicroBenchmarks').requires('lively.TestFramework').toRun(function() {
    
// run micro benchmarks locally: 
// lk test -m 'lively.versions.tests.MicroBenchmarks' -f 'MicroBenchmarks|.*|.*'
    
TestCase.subclass('lively.versions.tests.MicroBenchmarks.ProxiedConstructorApplication', {
    test01CreateLotsOfObjectsFromProxiedConstructor: function() {
        var NewType = lively.ObjectVersioning.proxyFor(function C() {
        });
        
        for (var i = 0; i < 200000; i++) {
            // two arguments, because argument application is suspected to be slow
            new NewType(1, 2);
        }
    }
})

});
