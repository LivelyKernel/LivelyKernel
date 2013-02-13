module('lively.ide.tests.CodeEditor').requires('lively.ide.CodeEditor', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ide.tests.CodeEditor.Base',
'running', {
    setUp: function($super) {
        $super();
        this.world = lively.morphic.World.current();
        this.editor = new lively.morphic.CodeEditor(lively.rect(0,0, 100, 100), 'some content');
        this.world.addMorph(this.editor);
        this.morphsToDelete = [this.editor];
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
});

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditor.Interface',
'testing', {
    testCreation: function() {
        this.editor.textString = "some content";
        this.assertHasText(this.editor, 'some content');
    },
    testCopyKeepsString: function() {
        this.editor.textString = "some content";
        var e2 = this.editor.copy();
        this.morphsToDelete.push(e2);
        e2.openInWorld();
        this.assertHasText(e2, 'some content');
    },

    testIndexToPosition: function() {
        this.editor.textString = "some\ncontent";
        var pos = this.editor.indexToPosition(6);
        this.assertEqualState({column: 1, row: 1}, pos, "some\n c|ontent");
    },

    testSetSelectionRange: function() {
        this.editor.textString = "some\ncontent";
        var pos = this.editor.setSelectionRange(2, 7);
        this.assertEquals('me\nco', this.editor.getSelectionOrLineString());
    }

});

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditor.Commands',
'testing', {
    testBracketsMatching: function() {
        var e = this.editor;
        e.textString = "baz { foo }  bar";

        e.setCursorPosition(pt(4,0));
        e.moveForwardToMatching();
        this.assertEquals(pt(11,0), e.getCursorPosition(), '|{ } -> { }|');
        e.moveForwardToMatching();
        this.assertEquals(pt(11,0), e.getCursorPosition(), '{ }| -> { }|');
        e.moveBackwardToMatching();
        this.assertEquals(pt(4,0), e.getCursorPosition(), '{ }| <- |{ }');

        e.setCursorPosition(pt(5,0));
        e.moveForwardToMatching();
        this.assertEquals(pt(10,0), e.getCursorPosition(), '{| } -> { |}');
        e.moveForwardToMatching();
        this.assertEquals(pt(10,0), e.getCursorPosition(), '{ |} -> { |}');
        e.moveBackwardToMatching();
        this.assertEquals(pt(5,0), e.getCursorPosition(), '{ |} <- {| }');

        // test with selection
        this.assertEqualState([5,5], e.getSelectionRange());
        e.moveForwardToMatching(true);
        this.assertEqualState([5,10], e.getSelectionRange());
    },

    testMoveToMatchingOrSomewhereElse: function() {
        var e = this.editor;
        e.textString = "ab { c }";

        e.setCursorPosition(pt(0,0));
        e.moveForwardToMatching(false, true);
        this.assertEquals(pt(2,0), e.getCursorPosition(), "|ab { c } -> ab| { c }");
        e.moveForwardToMatching(false, true);
        this.assertEquals(pt(4,0), e.getCursorPosition(), "ab| { c } -> ab {| c }");
        e.moveForwardToMatching(false, true);
        this.assertEquals(pt(7,0), e.getCursorPosition(), "ab {| c } -> ab { c |}");
    }

});

}) // end of module