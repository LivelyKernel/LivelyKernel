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
    assertEditorHasText: function(editor, text) {
        this.assert(false, 'implement me');
    }
},
'testing', {
    testCreation: function() {
        var e = this.editor = new lively.morphic.CodeEditor(lively.rect(0,0, 100, 100), 'some content');
        e.openInWorld();
        this.assertHasText(e, 'some content');
    }
});

}) // end of module