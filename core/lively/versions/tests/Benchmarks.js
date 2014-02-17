module('lively.versions.tests.Benchmarks').requires('lively.TestFramework', 'lively.versions.ObjectVersioning').toRun(function() {
    
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
        return 'core/lively/versions/tests/benchmarks/';
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

// Benchmarks from google's v8 "octance-benchmark" suite
// https://code.google.com/p/octane-benchmark/

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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8Deltablue', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'deltablue.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8Crypto', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'crypto.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8EarleyBoyer', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'earley-boyer.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8NavierStokes', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'navier-stokes.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8Raytrace', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'raytrace.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8Regexp', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'regexp.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.v8Splay', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'splay.js'
        
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


// Benchmarks from "The Computer Language Benchmarks Game"-benchmark suite
// http://benchmarksgame.alioth.debian.org/

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.shootoutObjInst', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'objinst.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.shootoutNBody', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'nbody.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.shootoutLists', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'lists.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.shootoutBinaryTrees', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'binarytrees.js'
        
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

lively.versions.tests.Benchmarks.TestCase.subclass(
'lively.versions.tests.Benchmarks.shootoutFannkuch', {
    initialize: function($super, testResult, optTestSelector) {
        this.benchmarkFileName = 'fannkuch.js'
        
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

});
