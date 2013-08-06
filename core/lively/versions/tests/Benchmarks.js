module('lively.versions.tests.Benchmarks').
requires('lively.TestFramework', 'lively.versions.ObjectVersioning').
toRun(function() {
    
TestCase.subclass('lively.versions.tests.Benchmarks.TestCase',
'initializing',{
    initialize: function($super, testResult, optTestSelector) {
        $super(testResult, optTestSelector);
        
        // this test case is meant to be abstract
        if (this.benchmarkFileName) {
            // loading the benchmark file is excluded from measurements
            var url = URL.ensureAbsoluteURL(this.benchmarkLibsDir() + this.benchmarkFileName);
            this.sources = JSLoader.getSync(url);
            this.transformedSources = lively.versions.ObjectVersioning.transformSource(this.sources);
            
            $super(testResult, optTestSelector);
        }
    }, 
}, 
'test helper', {
    benchmarkLibsDir: function() {
        return 'core/lively/versions/tests/benchmarkLibs/';
    },
    fullTestName: function() {
        return this.name() + ' : ' + this.currentSelector;
    },
},
'benchmarking', {
    setUp: function() {
        this.startTime = (new Date()).getTime();
    },
    tearDown: function() {
        this.result.setTimeToRun(this.fullTestName(), (new Date()).getTime() - this.startTime);
    },
});

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8Richards', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'richards.js'
        
        $super(testResult, optTestSelector);
    },
    test01SourceToSourceTransformation: function() {
        lively.versions.ObjectVersioning.transformSource(this.sources);
    },
    test02aNoProxyReferenceExecution: function() {
        eval(this.sources);
    },
    test02bBenchmarkExecution: function() {
        eval(this.transformedSources);
    }
});

// // currently not working, infinite recursion...
// lively.versions.tests.Benchmarks.TestCase.subclass(
// 'lively.versions.tests.Benchmarks.v8DeltaBlue', {
//     initialize: function($super, testResult, optTestSelector) {
//         this.benchmarkFileName = 'deltablue.js'
        
//         $super(testResult, optTestSelector);
//     },
//     test01SourceToSourceTransformation: function() {
//         lively.versions.ObjectVersioning.transformSource(this.sources);
//     },
//     test02aNoProxyReferenceExecution: function() {
//         eval(this.sources);
//     },
//     test02bBenchmarkExecution: function() {
//         eval(this.transformedSources);
//     }
// });

});
