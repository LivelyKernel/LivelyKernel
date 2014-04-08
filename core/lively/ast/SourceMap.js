var sourceMapLib = {
    load: function() {
        var m = module('lively.ast.SourceMap');
        require("lively.Network").toRun(function() {
            URL.codeBase.withFilename('lib/source-map/source-map.js').asWebResource().beAsync().get().whenDone(function(content, status) {
                if (!status.isSuccess()) console.error(status);
                var code = Strings.format(";(function() {\n%s\n}).call(Global);", content);
                try { eval(code); } catch (e) { console.error(e); }
                m.initLibLoadTester();
            });
        });
    },

    loadTest: function() { return typeof sourceMap !== 'undefined'; }
}

module('lively.ast.SourceMap').requires().requiresLib(sourceMapLib).toRun(function() {

Object.subclass('lively.ast.SourceMap.Generator',
'initializing', {

    initialize: function() {
        this.generator = new sourceMap.SourceMapGenerator();
        this.sourceFile = null;
    }

},
'accessing', {

    setFileName: function(filename) {
        this.generator._file = filename;
    },

    getFileName: function() {
        return this.generator._file;
    },

    setCurrentSourceFile: function(filename) {
        this.sourceFile = filename;
    },

    getCurrentSourceFile: function() {
        return this.sourceFile;
    }

},
'mapping', {

    addMapping: function(origLine, origCol, genLine, genCol, filename) {
        this.generator.addMapping({
            original: { line: origLine, column: origCol },
            generated: { line: genLine, column: genCol },
            source: filename || this.sourceFile
            // name: "christopher"
        });
    }

},
'generating', {

    getContent: function() {
        return this.generator.toString();
    }

});

Object.extend(lively.ast.SourceMap.Generator, {

    mapForASTs: function(origAst, rewrittenAst, origFile, optFilename) {
        var generator = new lively.ast.SourceMap.Generator();
        if (optFilename) generator.setFileName(optFilename);
        generator.setCurrentSourceFile(origFile);

        if (isNaN(origAst.astIndex)) throw new Error('Source Mapping is done by AST indices but astIndex is missing!');

        var idx, maxIdx = origAst.astIndex;
        for (idx = 0; idx <= maxIdx; idx++) {
            var origNode = acorn.walk.findNodeByAstIndex(origAst, idx, false);
            var rewrittenNode = acorn.walk.findNodeByAstIndex(rewrittenAst, idx, false);
            if (origNode == null || rewrittenNode == null)
                throw new Error('Could not find AST index ' + idx + ' in given ASTs!');
            generator.addMapping(origNode.loc.start.line, origNode.loc.start.column,
                rewrittenNode.loc.start.line, rewrittenNode.loc.start.column);
        }

        return generator.getContent();
    }
});

}) // end of module
