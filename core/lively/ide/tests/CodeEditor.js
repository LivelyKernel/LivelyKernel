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

    testExtendSelectionRange: function() {
        this.editor.textString = "some\ncontent";
        this.editor.setCursorPosition(pt(2,0))
        this.editor.extendSelectionRange(5);
        this.assertEquals('me\nco', this.editor.getSelectionOrLineString());
        this.editor.extendSelectionRange(-1);
        this.assertEquals('ome\nco', this.editor.getSelectionOrLineString());
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
    },

    testFind: function() {
        var e = this.editor;
        e.textString = "some\ncontent";
        e.setSelectionRange(13,13);
        var result = e.find({backwards: true, asString: true, needle: /.m/});
        this.assertEquals('om', result);
        this.done();
    },

    testFindInbetween: function() {
        var e = this.editor;
        e.textString = "some\ncontent";
        e.setSelectionRange(13,13);
        var result = e.find({inbetween: true, backwards: true, asString: true, needle: /.m/});
        this.assertEquals('ome\ncontent', result);
        this.done();
    },

    testMergeUndos: function() {
        var e = this.editor, insertDone = false;
        e.textString = "some\ncontent";
        e.setCursorPosition({y: 2, x: 6});

        e.mergeUndosOf(function(triggerMerge) {
            insertStuff(3, function() { insertDone = true; triggerMerge(); });
        })

        this.waitFor(function() { return !!insertDone; }, 10, function() {
            this.assertEquals('some\ncontent\nfoo\nfoo\nfoo\nfoo', e.textString);
            e.undo();
            this.assertEquals('some\ncontent', e.textString);
            this.done();
        });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function insertStuff(n, thenDo) {
            if (n < 0) { thenDo && thenDo(); return;}
            e.insertAtCursor("\nfoo");
            insertStuff.curry(n-1, thenDo).delay(0.1);
        }
    }

});

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditor.Tokens',
'running', {
    prepareEditor: function() {
        var e = this.editor, sess = e.aceEditor.session;
        e.textString = 'function foo() {\n  return 42;\n}\n'
        e.setTextMode('javascript');
        return e;
    },
},
'testing', {
    testTokensAtPoint: function() {
        var e = this.prepareEditor();
        e.setCursorPosition(pt(11, 0));
        var result = e.tokenAtPoint(),
            expected = {index: 2, start: 9, type: "entity.name.function", value: "foo"};
        this.assertEqualState(expected, result, 'token at point');
        this.done();
    },

    testTokensInEmptyRange: function() {
        var e = this.prepareEditor();
        e.setSelectionRange(3,3)
        var result = e.tokensInRange(),
            expected = [{index: 0, start: 0, type: "storage.type", value: "function"}];
        this.assertEqualState(expected, result, 'tokens at range');
        this.done();
    },
    testTokensInRange: function() {
        // don't just return all row tokens, truncate according to range
        var e = this.prepareEditor();
        e.setSelectionRange(11,30)
        var result = e.tokensInRange(),
            expected = [{
              type: "entity.name.function",
              value: "foo"
            },{
              type: "paren.lparen",
              value: "("
            },{
              type: "paren.rparen",
              value: ")"
            },{
              type: "text",
              value: " "
            },{
              type: "paren.lparen",
              value: "{"
            },{
              type: "text",
              value: "  "
            },{
              type: "keyword",
              value: "return"
            },{
              type: "text",
              value: " "
            },{
              type: "constant.numeric",
              value: "42"
            },{
              type: "punctuation.operator",
              value: ";"
            }, {
              type: "paren.rparen",
              value: "}"
            }];
        this.assertEqualState(expected, result, 'tokens at range');
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

    testPrintItAsComment: function() {
        var e = this.editor,
            Range = ace.require("ace/range").Range;
        e.setPrintItAsComment(true);
        e.focus();
        // 1. single line
        e.textString = "23";
        e.aceEditor.execCommand('printit');
        this.assertHasText(e, "23 // => 23");
        this.assertEquals(e.getTextRange(), " // => 23");

        // 2. multiline
        e.textString = "var testPrintItAsComment_var = {x: 23, y: 24}; testPrintItAsComment_var";
        e.aceEditor.execCommand('printit');
        this.assertHasText(e, "var testPrintItAsComment_var = {x: 23, y: 24}; testPrintItAsComment_var // => {\n//   x: 23,\n//   y: 24\n// }");
        this.assertEquals(e.getTextRange(), " // => {\n//   x: 23,\n//   y: 24\n// }");
        this.done();
    },

    testFitTextToColumn: function() {
        var test = this, e = this.editor,
            testData = [{
                input: "foo ".times(50) + '\n\nbar bar bar\n\n',
                expected: "foo ".times(20).trimRight() + '\n'
                         + "foo ".times(20).trimRight() + '\n'
                         + "foo ".times(10).trimRight() + '\n\n'
                         + "bar bar bar\n"
            },{ // spaces in front
                input: "    1 2 3 4 5 6 7 8 9 ",
                expected: "    1 2 3 4\n    5 6 7 8\n    9\n",
                fillColumn: 12
            }, {
                input: "Hello there, world",
                expected: "Hello\nthere,\nworld\n",
                fillColumn: 11
            // }],
            }, { // recognize paragraphs and join lines
                input: "abc def\n"
                     + "ghi jkl\n"
                     + "mnn\n"
                     + "pqr stuv\n"
                     + "\n"
                     + "abc def ghi jkl mnn\n",
                expected: "abc def ghi\n"
                        + "jkl mnn pqr\n"
                        + "stuv\n"
                        + "\n"
                        + "abc def ghi\n"
                        + "jkl mnn\n",
                fillColumn: 12
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
    },

    testModifyCommand: function() {
        var e = this.editor, called = 0;
        e.textString = "foo\nbar\nbaz\n";
        e.aceEditor.execCommand('golinedown');
        this.assertEqualState({row: 1, column: 0}, e.getCursorPositionAce());
        e.modifyCommand('golinedown', {exec: function (ed,args) { called++ }})
        e.aceEditor.execCommand('golinedown');
        lively.ide.ace.require("ace/lib/keys").simulateKey(e.aceEditor, "Down")
        this.assertEquals(2, called, "callcount")
        this.assertEqualState({row: 1, column: 0}, e.getCursorPositionAce());
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
    },

    testCycleThroughMultiSelctionRanges: function() {
        var e = this.editor;
        e.textString = 'foo\nfoo\nfoo';
        e.setSelectionRange(0,3);
        e.multiSelectNext();
        e.multiSelectNext();
        this.assertEquals(
          "Range: [0/0] -> [0/3],Range: [1/0] -> [1/3],Range: [2/0] -> [2/3]",
          e.getSelection().getAllRanges().toString());
        this.assertEquals("Range: [2/0] -> [2/3]", e.getSelection().getRange().toString());

        e.multiSelectJump("prev");
        e.multiSelectJump("prev");
        this.assertEquals("Range: [0/0] -> [0/3]", e.getSelection().getRange().toString());
        
        e.multiSelectJump("next");
        this.assertEquals("Range: [1/0] -> [1/3]", e.getSelection().getRange().toString());

        this.assertEquals(
          "Range: [0/0] -> [0/3],Range: [1/0] -> [1/3],Range: [2/0] -> [2/3]",
          e.getSelection().getAllRanges().toString());
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
    },

    testAutoEvalPrintItComments: function() {
        var e = this.editor, text;
        e.setAutoEvalPrintItComments(true);
        e.textString = "1 + 2";
        this.delay(function() {
          this.assertEquals("1 + 2", e.textString);
          e.textString = "1 + 2 // => 45";
          this.delay(function() {
              this.assertEquals("1 + 2 // => 3", e.textString);
              this.done();
          }, 300);
        }, 300);
    },

    testAddNextRefOrDeclToSelection: function() {
        var src = Functions.extractBody(function() {
          var x = 3, yyy = 4;
          var z = function() { yyy + yyy + (function(yyy) { yyy+1 })(); }
        });

        var e = this.editor, text;
        e.textString = src;
        e.setSelectionRange(11, 14);
        e.aceEditor.execCommand('selectSymbolReferenceOrDeclaration', {args: "all"});
        this.assertEquals(
          "Range: [0/11] -> [0/14],Range: [1/21] -> [1/24],Range: [1/27] -> [1/30]",
          String(e.getSelection().getAllRanges()))

        e.clearSelection();
        e.setSelectionRange(11, 14);
        e.aceEditor.execCommand('selectSymbolReferenceOrDeclaration', {args: "next"});
        this.assertEquals(
          "Range: [0/11] -> [0/14],Range: [1/21] -> [1/24]",
          String(e.getSelection().getAllRanges()))

        e.clearSelection();
        e.setSelectionRange(47, 50);
        e.aceEditor.execCommand('selectSymbolReferenceOrDeclaration', {args: "prev"});
        this.assertEquals(
          "Range: [1/21] -> [1/24],Range: [1/27] -> [1/30]",
          String(e.getSelection().getAllRanges()))

        this.done();
    },

    testSelectDefinition: function() {
        var src = Functions.extractBody(function() {
          var x = 3, yyy = 4;
          var z = function() { yyy + yyy + (function(yyy) { yyy+1 })(); }
        });

        var e = this.editor, text;
        e.textString = src;
        e.setSelectionRange(47, 47); // descond "yyy of + op
        e.aceEditor.execCommand('selectDefinition');

        var expectedRanges = [{start:{column:11,row:0},end:{column:14,row:0}}]; // var yyy
        this.assertEqualState(expectedRanges, e.getSelection().getAllRanges())
        this.done();
    }

});

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditor.TextOperations',
'testing', {
    testIndentInRange: function() {
        var ed = this.editor;
        ed.textString = "some content\nfoo bar\nw x u v";;
        var range = ed.createRange(
            ed.getTextStartPosition(),
            ed.getTextEndPosition());
        ed.alignInRange(/ /, range);
        this.assertHasText(ed, "some content\nfoo  bar\nw    x u v");
        this.done();
    }
});

}) // end of module
