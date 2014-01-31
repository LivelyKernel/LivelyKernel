module('lively.ide.codeeditor.Snippets').requires('lively.ide.codeeditor.ace', 'lively.Network').toRun(function() {

Object.subclass('lively.morphic.CodeEditorSnippets',
'accessing', {
    withSnippetsForEditorDo: function(codeEditor, doFunc) {
        var mgr = this.getSnippetManager(),
            modeName = codeEditor.getTextModeNoExtension(),
            snippets = mgr.snippetNameMap[modeName];
        doFunc(snippets ? null : new Error('No snippet for ' + modeName), snippets, mgr);
    },
    withSnippetNamedDo: function(codeEditor, snippetName, doFunc) {
        this.withSnippetsForEditorDo(codeEditor, function(err, snippets, mgr) {
            var snip = snippets && snippets[snippetName];
            doFunc(err || (snip ? null : new Error('No such snippet ' + snippetName)), snip, mgr);
        });
    },
    insertNamed: function(editor, snippetName, pos) {
        this.withSnippetNamedDo(editor, snippetName, function(err, snippet, mgr) {
            if (err) { console.error(err); return; }
            editor.withAceDo(function(ed) {
                if (pos) ed.moveCursorToPosition(pos);
                mgr.insertSnippet(ed, snippet.content);
            });
        })
    }
},
'snippet management', {
    readSnippetsFromURL: function(url) {
        // url like .../snippets/javascript.snippets
        var lang = url.filename().replace(new RegExp('\\.' +url.extension() + '$'), '');
        var source = new URL(url).asWebResource().beSync().get().content;
        return this.addSnippetsFromSource(source, lang);
    },
    addSnippetsFromSource: function(source, lang) {
        // FIXME only tabs accepted?
        source = source.replace(/    /g, "\t");
        var snippets = this.getSnippetManager().parseSnippetFile(source);
        return this.getSnippetManager().register(snippets, lang || "javascript");
    },
    getSnippetManager: function() {
        return lively.ide.ace.require("ace/snippets").snippetManager;
    }
});

(function setupSnippets() {
    lively.module('lively.ide.CodeEditor').runWhenLoaded(function() {
        var snippets = lively.morphic.CodeEditor.snippets = new lively.morphic.CodeEditorSnippets(),
            dir = URL.codeBase.withFilename("lively/ide/snippets/");
        lively.Module.withURLsInDo(dir, function(urls) {
            urls.filter(function(url) { return url.extension() === 'snippets'; })
                .forEach(snippets.readSnippetsFromURL.bind(snippets))
        });
    });
})();

}) // end of module