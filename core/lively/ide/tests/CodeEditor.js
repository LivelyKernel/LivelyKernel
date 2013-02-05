module('lively.ide.tests.CodeEditor').requires('lively.ide.CodeEditor', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ide.tests.CodeEditor.Interface',
'running', {
    setUp: function($super) {
        $super();
        this.world = lively.morphic.World.current();
    },
    tearDown: function($super) {
        $super();
        if (this.editor) this.editor.remove();
    }

},
'assertion', {
    assertHasText: function(editor, text) {
        var doc = editor.aceEditor.getSession().getDocument();
        this.assertEquals(text, doc.getValue());
    }
},
'testing', {
    testCreation: function() {
        var e = this.editor = new lively.morphic.CodeEditor(lively.rect(0,0, 100, 100), 'some content');
        e.openInWorld();
        debugger
        this.assertHasText(e, 'some content');
    }
});

}) // end of module