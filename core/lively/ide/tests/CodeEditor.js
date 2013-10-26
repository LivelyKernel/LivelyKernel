module('lively.ide.tests.CodeEditor').requires('lively.ide.CodeEditor', 'lively.TestFramework').toRun(function() {

AsyncTestCase.subclass('lively.ide.tests.CodeEditor.Base',
'running', {
    setUp: function($super, run) {
        $super();
        this.world = lively.morphic.World.current();
        this.editor = new lively.morphic.CodeEditor(lively.rect(0,0, 100, 100), 'some content');
        this.world.addMorph(this.editor);
        this.morphsToDelete = [this.editor];
        var inited = false;
        this.editor.withAceDo(function() { inited = true; });
        this.waitFor(function() { return !!inited }, 10, run);
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
        this.done();
    },
    testCopyKeepsString: function() {
        this.editor.textString = "some content";
        var e2 = this.editor.copy();
        this.morphsToDelete.push(e2);
        e2.openInWorld();
        var inited = false;
        e2.withAceDo(function() { inited = true; });
        this.waitFor(function() { return !!inited }, 10, function() {
            this.assertHasText(e2, 'some content');
            this.done();
        });
    },
    testCopyHasStringEvenImmediatellyAfterCopy: function() {
        this.editor.textString = "some content";
        var e2 = this.editor.copy();
        this.morphsToDelete.push(e2);
        this.assertEquals('some content', e2.textString);
        this.done();
    },

    testIndexToPosition: function() {
        this.editor.textString = "some\ncontent";
        var pos = this.editor.indexToPosition(6);
        this.assertEqualState({column: 1, row: 1}, pos, "some\n c|ontent");
        this.done();
    },

    testSetSelectionRange: function() {
        this.editor.textString = "some\ncontent";
        var pos = this.editor.setSelectionRange(2, 7);
        this.assertEquals('me\nco', this.editor.getSelectionOrLineString());
        this.done();
    },

    testHasUnsavedChanges: function() {
        var e = this.editor;
        e.textString = "some\ncontent";
        this.assert(e.hasUnsavedChanges(), '0');
        e.doSave();
        this.assert(!e.hasUnsavedChanges(), '1');
        e.insertAtCursor('foo');
        this.assert(e.hasUnsavedChanges(), '2');
        this.done();
    },
    testSetMode: function() {
        var e = this.editor, sess = e.aceEditor.session;
        e.setTextMode('javascript:LabeledStatement');
        this.assertEquals(sess.getMode().$id, 'ace/mode/javascript');
        this.assertEquals(sess.$astType, 'LabeledStatement');
        e.setTextMode('javascript');
        this.assertEquals(sess.getMode().$id, 'ace/mode/javascript');
        this.assertEquals(sess.$astType, null);
        this.done();
    },
    testConnectToTextChange: function() {
        var e = this.editor, changeTriggered, obj = {onChange: function(evt) { changeTriggered = true; }};
        e.textString = "some\ncontent";
        lively.bindings.connect(e, 'textChange', obj, 'onChange');
        e.insertAtCursor('foo');
        this.delay(function() {
            this.assert(changeTriggered, 'textChange connection not working');
            this.done();
        }, 300);
    },
    testSaveExcursion: function() {
        var e = this.editor, textInExcursion, textAfterExcursion;
        e.textString = "some\ncontent";
        e.setSelectionRange(5, 13);
        e.saveExcursion(function(whenDone) {
            e.setSelectionRange(0,4);
            textInExcursion = e.getTextRange();
            whenDone();
        });
        textAfterExcursion = e.getTextRange();
        this.assertEquals('some', textInExcursion, 'in');
        this.assertEquals('content', textAfterExcursion, 'after');
        this.done();
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
        this.done();
    },

    testMoveToMatchingOrSomewhereElse: function() {
        var e = this.editor;
        e.textString = "ab { c }";
        e.setCursorPosition(pt(0,0));
        e.moveForwardToMatching(false, true);
        this.assertEquals(pt(2,0), e.getCursorPosition(), "|ab { c } -> ab| { c }");
        e.moveForwardToMatching(false, true);
        this.assertEquals(pt(3,0), e.getCursorPosition(), "ab| { c } -> ab |{ c }");
        e.moveForwardToMatching(false, true);
        this.assertEquals(pt(8,0), e.getCursorPosition(), "ab {| c } -> ab { c |}");
        this.done();
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
        this.done();
    },

    testFitTextToColumn: function() {
        var test = this, e = this.editor,
            testData = [{
                input: "foo ".times(50) + '\nbar bar bar\n\n',
                expected: "foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo\n"
                         + "foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo foo\n"
                         + "foo foo foo foo foo foo foo foo foo foo\n"
                         + "bar bar bar\n"
            },{ // spaces in front
                input: "    1 2 3 4 5 6 7 8 9 ",
                expected: "    1 2 3 4\n    5 6 7 8\n    9",
                fillColumn: 12
            }, {
                input: "Hello there, world",
                expected: "Hello\nthere,\nworld",
                fillColumn: 11
            }],
            commandsMgr = lively.ide.CodeEditor.KeyboardShortcuts.defaultInstance(),
            cmd = commandsMgr.allCommandsOf(e).fitTextToColumn;
        testData.doAndContinue(function(next, spec) {
            e.withAceDo(function(aceEditor) {
                e.textString = spec.input;
                e.selectAll();
                cmd.exec(aceEditor, {count: spec.fillColumn || 80});
                test.assertHasText(e, spec.expected);
                next();
            });
        }, function() { test.done(); });
    },

    testEvalGlobalVarAssignment: function() {
        var e = this.editor, varName = '__' + this.currentSelector;
        this.onTearDown((function cleanup() { delete Global[varName]; return cleanup; })());
        e.textString = Strings.format("%s = 42;", varName);
        e.aceEditor.execCommand('doit');
        this.assertEquals(42, Global[varName], 'eval not successful');
        this.done();
    }

});
lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditor.Selection',
'testing', {

    testSelectionInComment: function() {
        var e = this.editor, text;
        e.textString = ['1', '2 // 22', '3 // 33 // 333', ''].join('\n');
        var testTable = [
            // first line
            {range: [0,0,0,0], expected: '1'},
            {range: [0,0,0,1], expected: '1'},
            // second line
            {range: [1,0,1,1], expected: '2'},
            {range: [1,1,1,1], expected: '2 // 22'},
            {range: [1,5,1,5], expected: ' 22'}, // strip out everthing before the comment
            {range: [1,4,1,6], expected: ' 2'},
            {range: [1,4,1,6], expected: ' 2'},
            // third line
            {range: [2,5,2,5], expected: ' 33 // 333'}];
        testTable.forEach(function(ea, i) {
            var r = ea.range;
            e.setSelectionRangeAce({
                start: {row: r[0], column: r[1]},
                end:   {row: r[2], column: r[3]}});
            text = e.getSelectionMaybeInComment();
            this.assertEquals(ea.expected, text, '' + i + ': ' + r);
        }, this);
        this.done();
    },
    testDoitWillEvaluateLogicalLine: function() {
        var e = this.editor;
         // make editor really small
        e.setExtent(pt(100, 100));
        // create a long line
        e.textString = Array.range(1,100).map(function() { return 1; }).join('+');
        // null select at line start
        e.setSelectionRange([0,0]);
        e.doit(true);
        var selectedResult = e.getSelectionOrLineString();
        this.assertEquals('100', selectedResult);
        this.done();
    },


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
        this.done();
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
        this.done();
    }

});

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditor.JSAST',
'testing', {

    testASTIsAvailable: function() {
        var e = this.editor, text;
        e.textString = "1 + 2";
        this.delay(function() {
            this.assertEquals('Program', e.aceEditor.session.$ast.type);
            this.done();
        }, 400);
    }

});

}) // end of module
