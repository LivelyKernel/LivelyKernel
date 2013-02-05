module('lively.ide.tests.CodeEditor').requires('lively.ide.CodeEditor', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ide.tests.CodeEditor.Interface',
'running', {
    setUp: function($super) {
        $super();
        this.world = lively.morphic.World.current();
        this.morphsToDelete = [];
    },
    tearDown: function($super) {
        $super();
        this.morphsToDelete.invoke('remove');
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
        var e = new lively.morphic.CodeEditor(lively.rect(0,0, 100, 100), 'some content');
        this.morphsToDelete.push(e);
        e.openInWorld();
        this.assertHasText(e, 'some content');
    },
    testCopyKeepsString: function() {
        var e = new lively.morphic.CodeEditor(lively.rect(0,0, 100, 100), 'some content');
        this.morphsToDelete.push(e);
        e.openInWorld();
        var e2 = e.copy();
        this.morphsToDelete.push(e2);
        e2.openInWorld();
        this.assertHasText(e2, 'some content');
    }
});

}) // end of module