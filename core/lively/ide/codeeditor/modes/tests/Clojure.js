module('lively.ide.codeeditor.modes.tests.Clojure').requires('lively.TestFramework', 'lively.ide.codeeditor.modes.Clojure').toRun(function() {

AsyncTestCase.subclass('lively.ide.codeeditor.modes.tests.Clojure.NReplClient',
'running', {
    sut: lively.ide.codeeditor.modes.Clojure
},
"testing", {
    testEval: function()  {
        var result;
        this.sut.doEval({code: '(+ 1 2)'}, function(err, r) { result = err || r; });
        this.waitFor(function() { return !!result; }, 10, function() {
           this.assertEquals('3', result, 'result') ;
           this.done(0);
        });
    },
    testEvalMultipleOrdered: function()  {
        var result;
        this.sut.doEval({code: "(def counter (atom 4))"}, function(err, r) {});
        this.sut.doEval({code: "(swap! counter * 2)"}, function(err, r) {});
        this.sut.doEval({code: "(swap! counter + 3)"}, function(err, r) { result = r});
        this.waitFor(function() { return !!result; }, 10, function() {
           this.assertEquals('11', result, 'result') ;
           this.done(0);
        });
    }
});

}) // end of module