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
    },

    xtestHasUnsavedChanges: function() {
        var e = this.editor;
        e.textString = "some\ncontent";
        this.assert(e.hasUnsavedChanges(), '0');
        e.doSave();
        this.assert(!e.hasUnsavedChanges(), '1');
        e.insertAtCursor('foo');
        this.assert(e.hasUnsavedChanges(), '2');
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
    },

    testMultiSelectionEval: function() {
        var e = this.editor,
            Range = ace.require("ace/range").Range;
        e.textString = "1+1\n1+2\n";
        e.focus();
        var range1 = Range.fromPoints({row: 0, column: 0}, {row: 0, column: 3});
        e.aceEditor.selection.addRange(range1);
        var range2 = Range.fromPoints({row: 1, column: 0}, {row: 1, column: 3});
        e.aceEditor.selection.addRange(range2);
        e.aceEditor.execCommand('printit');
        this.assertHasText(e, '1+12\n1+23\n');
    }

});
lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditor.Selection',
'testing', {
    testCreateFloatingAnnotation: function() {
        var e = this.editor;
        e.textString = "baz { 1+2 }  bar";
        var ann = e.addFloatingAnnotation({start: {row: 0, column: 6}, end: {row: 0, column: 9}});
        this.assertEquals('1+2', ann.getTextString());
        e.insertTextStringAt(0, 'hello');
        this.assertEquals('1+2', ann.getTextString(), 'not floating');
        e.insertTextStringAt({row: 0, column: 9+5}, '3');
        this.assertEquals('1+23', ann.getTextString(), 'not floating');
        e.textString = e.textString; // currently resetting the textString will collapse start and end 
        this.assertEquals('', ann.getTextString(), 'not floating');
        // this.assert(!ann.isAttached, 'annotations still marked as attached');
    },

    testAddEvalMarker: function() {
        var e = this.editor;
        e.textString = 'hello: 1+2';
        var marker = new lively.morphic.CodeEditorEvalMarker(e, {start: {row: 0, column: 7}, end: {row: 0, column: 10}});
        this.assertEquals('1+2', marker.getTextString(), 'marker textstring');
        this.assertEquals('1+2', marker.getOriginalExpression());
        var result = marker.evalAndInsert();
        this.assertEquals(3, result, 'eval result');
        this.assertEquals('hello: 3', e.textString, 'editor textstring');
        this.assertEquals('1+2', marker.getOriginalExpression(), 'marker expr after eval');
        this.assertEquals('3', marker.getTextString(), 'marker textstring after eval');
        marker.restoreText();
        this.assertEquals('1+2', marker.getTextString(), 'marker restore');
    }

});

}) // end of module
