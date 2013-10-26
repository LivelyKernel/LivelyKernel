module('lively.ide.codeeditor.Snippets').requires('lively.ide.codeeditor.ace').toRun(function() {


Object.subclass('lively.morphic.CodeEditorSnippets',
'initializing', {
    initialize: function() {}
},
'snippet management', {
    readSnippetsFromURL: function(url) {
        var source = new URL(url).asWebResource().beSync().get().content;
        return this.addSnippetsFromSource(source);
    },
    addSnippetsFromSource: function(source) {
        // FIXME only tabs accepted?
        source = source.replace(/    /g, "\t");
        var snippets = this.getSnippetManager().parseSnippetFile(source);
        return this.getSnippetManager().register(snippets, "javascript");
    },
    getSnippetManager: function() {
        return lively.ide.ace.require("ace/snippets").snippetManager;
    }
});

(function setupSnippets() {
    if (!lively.morphic.CodeEditor) lively.morphic.Morph.subclass('lively.morphic.CodeEditor'); // ensure class
    var snippets = lively.morphic.CodeEditor.snippets;
    if (snippets) return;
    snippets = lively.morphic.CodeEditor.snippets = new lively.morphic.CodeEditorSnippets();
    snippets.readSnippetsFromURL(URL.codeBase.withFilename('lively/ide/snippets/javascript.snippets'));
})();


}) // end of module