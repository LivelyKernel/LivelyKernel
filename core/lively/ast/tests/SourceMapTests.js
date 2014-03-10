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
    }

});

}) // end of module
