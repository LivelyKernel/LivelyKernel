module('lively.ast.tests.SourceMapTests').requires('lively.ast.SourceMap', 'lively.ast.Rewriting', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.SourceMapTests.GenerationTest',
'testing', {

    test01SimpleMapping: function() {
        var generator = new lively.ast.SourceMap.Generator();
        generator.setFileName('output.file');
        generator.setCurrentSourceFile('input.file');
        generator.addMapping(33, 2, 10, 35);

        var result = JSON.parse(generator.getContent()),
            expected = {
                file: 'output.file',
                sources: ['input.file'],
                names: [],
                mappings: ';;;;;;;;;mCAgCE'
            };
        this.assertMatches(expected, result);
    }
    
});

TestCase.subclass('lively.ast.tests.SourceMapTests.RewriteMapTest',
'testing', {

    test01EmptyRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test02IdentifierRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('fooBar', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test03MemberExpressionRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('foo.bar', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test04CallExpressionRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('foo()', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test05FunctionExpressionRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('(function(foo) { return foo; })', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test06VarDeclarationRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('var obj = {}, none; for (var key in obj) {}', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test07LogicalExpressionRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('true && false', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test08ConditinalExpressionRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('true ? [] : [1]', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test09ForStatementRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('for (var i = 0; i < 10; i++) {}', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test10TryCatchFinallyRewrite: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('try { 1; } catch (e) { 2; } finally { 3; }', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
    },

    test11Redefinition: function() {
        var registry = [],
            rewriter = new lively.ast.Rewriting.Rewriter(registry),
            ast = lively.ast.acorn.parse('function foo() {} function foo() {}', { locations: true }),
            rewrittenAst = rewriter.rewrite(ast),
            rewrittenSrc = escodegen.generate(rewrittenAst);

        lively.ast.acorn.rematchAstWithSource(rewrittenAst, rewrittenSrc, true);
        // FIXME: right now the last definition wins and is put in _x.foo
        // var result = lively.ast.SourceMap.Generator.mapForASTs(ast, rewrittenAst, 'test.file');
        this.assertRaises(lively.ast.SourceMap.Generator.mapForASTs.curry(ast, rewrittenAst, 'test.file'));
    }

});

}) // end of module
