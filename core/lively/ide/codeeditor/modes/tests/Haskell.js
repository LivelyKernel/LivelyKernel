module('lively.ide.codeeditor.modes.tests.Haskell').requires('lively.TestFramework', 'lively.ide.codeeditor.modes.Haskell').toRun(function() {

AsyncTestCase.subclass('lively.ide.codeeditor.modes.tests.Haskell.Interface',
"running", {
    haskellInterface: lively.ide.codeeditor.modes.Haskell.Interface
},
"testing", {
    testExtractLines: function() {
        var result;
        var string1 = "/tmp/lv-hs/syntax-check.qVBfF5KeN4w=.hs:4:1:\n"
                    + "    parse error on input `main'\n"
        result = this.haskellInterface.parseAnnotations(string1);
        this.assertEquals(1, result.length);
        this.assertEqualState(result[0], {pos: {row: 3, column: 0}, message: "parse error on input `main'"});
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var string1 = "/tmp/lv-hs/syntax-check.QOwNuQBecVA=.hs:11:1:\n"
                    + "    Duplicate type signatures for `foo'\n"
                    + "    at /tmp/lv-hs/syntax-check.QOwNuQBecVA=.hs:7:1-3\n"
                    + "       /tmp/lv-hs/syntax-check.QOwNuQBecVA=.hs:11:1-3\n"
        result = this.haskellInterface.parseAnnotations(string1);
        this.assertEquals(1, result.length);
        // this.assertEqualState(result[0], {pos: {row: 7, column: 4}, message: "Duplicate type signatures for `foo'\n    at /tmp/lv-hs/syntax-check.QOwNuQBecVA=.hs:7:1-3\n       /tmp/lv-hs/syntax-check.QOwNuQBecVA=.hs:11:1-3"});
        this.done();
    }
});

AsyncTestCase.subclass('lively.ide.codeeditor.modes.tests.Haskell.Eval',
"running", {
    haskellInterface: lively.ide.codeeditor.modes.Haskell.Interface
},
"testing", {
    testSimpleEval: function() {
        var expr = '1 + 2', result
        var session = {id: "testSimpleEval"};
        this.haskellInterface.ghciEval(session, expr, function(err, r) { result = r; });
        this.waitFor(function() { return !!result; }, 20, function() {
            this.assertEquals("3", result.output);
            this.done();
        });
    },
    testSameSessionKeepsState: function() {
        var expr1 = 'let x = 3', result1;
        var expr2 = 'x', result2;
        var session = {id: "testSameSessionKeepsState"};
        this.haskellInterface.ghciEval(session, expr1, function(err, r) { result1 = r; });
        this.haskellInterface.ghciEval(session, expr2, function(err, r) { result2 = r; });
        this.waitFor(function() { return !!result2; }, 20, function() {
            this.assertEquals("3", result2.output);
            this.done();
        });
    },
    testDifferentSessionsAreIsolated: function() {
        var expr1 = 'let x = 3', result1;
        var expr2 = 'x', result2;
        var session1 = {id: "testDifferentSessionsAreIsolated1"};
        var session2 = {id: "testDifferentSessionsAreIsolated2"};
        this.haskellInterface.ghciEval(session1, expr1, function(err, r) { result1 = r; });
        this.haskellInterface.ghciEval(session2, expr2, function(err, r) { result2 = r; });
        this.waitFor(function() { return !!result2; }, 20, function() {
            this.assert(result2.output.include('Not in scope'));
            this.done();
        });
    },
    testTokenType: function() {
        var expr = 'foo x = 3 + x';
        var session = {id: "testTokenType"};
        var defResult, result1, result2;
        var token1 = { type: "text", value: "foo" }
        var token2 = { type: "text", value: "bar" }
        var stage1Done = false, stage2Done = false;
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        this.haskellInterface.ghciEval(session, expr, function(err, r) { defResult = r; });
        this.haskellInterface.ghciTokenInfo(session, token1, function(err, r) { result1 = r; });
        this.haskellInterface.ghciTokenInfo(session, token2, function(err, r) { result2 = r || 'Nothing'; });
        this.waitFor(function() { return !!result1; }, 20, function() {
            this.assertEquals("foo :: Num a => a -> a", result1);
            stage1Done = true;
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        this.waitFor(function() { return !!result2; }, 20, function() {
            this.assertEquals('Nothing', result2);
            stage2Done = true;
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        this.waitFor(function() { return stage2Done; }, 20, function() { this.done(); });
    }
});

}) // end of module