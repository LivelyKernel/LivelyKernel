module('lively.versions.tests.Benchmarks').
requires('lively.TestFramework', 'lively.versions.ObjectVersioning').
toRun(function() {
    
// some benchmarks from http://github.com/v8/v8/

TestCase.subclass('lively.versions.tests.Benchmarks.TestCase',
'initializing',{
    initialize: function($super, testResult, optTestSelector) {
        $super(testResult, optTestSelector);
        if (this.benchmarkURL) {
            this.benchmarkSources = JSLoader.getSync(this.benchmarkURL);
            this.transformedSources = this.transformSource(this.benchmarkSources);
        }
    }, 
}, 
'helper', {
    transformSource: function(source) {
        return lively.versions.ObjectVersioning.transformSource(source);
    },
    dir: function() {
        return 'core/lively/versions/tests/benchmarkLibs/';
    },
},
'benchmarking', {
    setUp: function() {
        this.startTime = (new Date()).getTime();
    },
    tearDown: function() {
        this.result.setTimeToRun(this.fullTestName(), (new Date()).getTime() - this.startTime);
    },
    fullTestName: function() {
        return this.name() + ' : ' + this.currentSelector;
    },
});

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8Richards', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkURL = URL.ensureAbsoluteURL(this.dir() + 'richards.js');
        
        $super(testResult, optTestSelector);
    },
    test01SourceToSourceTransformation: function() {
        this.transformSource(this.benchmarkSources);
    },
    test02aBenchmarkExecution:function() {
        eval(this.transformedSources);
    },
    test02bNoProxyReferenceExecution: function() {
        eval(this.benchmarkSources);
    }
});

});
