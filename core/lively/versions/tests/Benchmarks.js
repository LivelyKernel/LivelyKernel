module('lively.versions.tests.Benchmarks').
requires('lively.TestFramework', 'lively.versions.ObjectVersioning').
toRun(function() {
    
// some benchmarks from http://github.com/v8/v8/

// don't work, yet... and debugging crashes Chrome's JS engine

TestCase.subclass('lively.versions.tests.Benchmarks.V8Benchmarks',
'helper', {
    transformAndRunJavaScriptFrom: function(url) {
        var absoluteURL = URL.ensureAbsoluteURL(url),
            source = JSLoader.getSync(absoluteURL),
            transformedSource = lively.versions.ObjectVersioning.transformSource(source);

        eval(transformedSource);
    },
    dir: function() {
        return 'core/lively/versions/tests/benchmarkLibs/';
    },
},
'testing', {
    test01RichardsBenchmark: function() {
        this.transformAndRunJavaScriptFrom(this.dir() + 'richards.js');
    },
    test02DeltaBlueBenchmark: function() {
        this.transformAndRunJavaScriptFrom(this.dir() + 'deltablue.js');
    }
});

});
