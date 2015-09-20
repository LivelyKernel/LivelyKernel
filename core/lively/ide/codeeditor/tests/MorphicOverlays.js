module('lively.ide.codeeditor.tests.MorphicOverlays').requires('lively.ide.tests.CodeEditor', 'lively.ide.codeeditor.MorphicOverlay').toRun(function() {

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.MorphicOverlay',
'running', {
    setUp: function($super, run) {
        var self = this;
        $super(function() {
            this.editor.setShowGutter(false);
            this.editor.openInWorldCenter();
            this.editor.withAceDo(function(ed) { run.delay(0); });
        });
    }
},
'testing', {

    testRendersOverlay: function() {
        this.editor.setTextString('\nhello\n   world\n');

        var codeEditor = this.editor,
            overlay = codeEditor.morphicOverlayCreate(),
            Range = lively.ide.ace.require("ace/range").Range,
            range = Range.fromPoints({column: 0, row: 1}, {column: 4, row: 1}),
            labelRange = Range.fromPoints({column: 3, row: 2}, {column: 7, row: 2});

        overlay.setAtRange(codeEditor, range);
        overlay.setLabelAtRange(codeEditor, labelRange);

        var bounds = overlay.globalBounds(),
            x = bounds.topLeft().x,
            y = bounds.topLeft().y,
            topLeftPos = codeEditor.aceEditor.renderer.pixelToScreenCoordinates(x, y),
            x = bounds.bottomRight().x,
            y = bounds.bottomRight().y,
            bottomRightPos = codeEditor.aceEditor.renderer.pixelToScreenCoordinates(x, y);
        this.assertIdentity(overlay.owner, codeEditor, "not added to editor");
        this.assertMatches({column: 0, row: 1}, topLeftPos);
        this.assertMatches({column: 8, row: 3}, bottomRightPos);

        this.done();
    },

    testOverlayRange: function() {

        this.editor.setTextString('\nhello\n   world\n');

        var codeEditor = this.editor,
            overlay = codeEditor.morphicOverlayCreate(),
            Range = lively.ide.ace.require("ace/range").Range,
            range = Range.fromPoints({column: 0, row: 1}, {column: 4, row: 1}),
            labelRange = Range.fromPoints({column: 3, row: 2}, {column: 7, row: 2});

        overlay.setAtRange(codeEditor, range);
        overlay.setLabelAtRange(codeEditor, labelRange);
        var range = overlay.getRange(codeEditor);
        this.assertEquals("hello\n   world", codeEditor.getTextRange(range));
        this.done();
    },

    testSetLabelString: function() {
        this.editor.setTextString('\nhello\n   world\n');

        var codeEditor = this.editor,
            overlay = codeEditor.morphicOverlayCreate({fitLabel: true, alignLabel: "marker-end"}),
            Range = lively.ide.ace.require("ace/range").Range,
            range = Range.fromPoints({column: 0, row: 1}, {column: 2, row: 1});

        overlay.setAtRange(codeEditor, range);
        overlay.alignLabelAtMarkerEnd();

        var range1;
        overlay.setLabelString(codeEditor, "hello world", function() {
          range1 = overlay.getRange(codeEditor);
        });

        var range2;
        this.waitFor(function() { return !!range1; }, 10, function() {
          overlay.spec.alignLabel = 'line-end';
          overlay.setLabelString(codeEditor, "hello world", function() {
            range2 = overlay.getRange(codeEditor);
          });
        });

        this.delay(function() {
          this.assertEquals("Range: [1/0] -> [1/12]", String(range1));
          this.assertEquals("Range: [1/0] -> [1/15]", String(range2));
          this.done();
        }, 100);

    },

    testOverlayMoves: function() {
        this.editor.setTextString('\nhello\n   world\n');

        var codeEditor = this.editor,
            overlay = codeEditor.morphicOverlayCreate(),
            Range = lively.ide.ace.require("ace/range").Range,
            range = Range.fromPoints({column: 0, row: 1}, {column: 4, row: 1});

        overlay.setAtRange(codeEditor, range);
        codeEditor.aceEditor.insert("\n");
        var range1 = overlay.getRange(codeEditor);

        codeEditor.aceEditor.moveCursorTo(2, 3);
        codeEditor.aceEditor.insert("foo");
        var range2 = overlay.getRange(codeEditor);

        this.assertEquals("Range: [2/0] -> [2/5]", String(range1), "range 1");
        this.assertEquals("Range: [2/0] -> [2/8]", String(range2), "range 2");
        this.done();

// false &&
// (function() {
//   // codeEditor.remove();
//   codeEditor.openInWorld();
//   Global.codeEditor = codeEditor
//   Global.overlay = overlay;
// }).delay(.4);
    },

});

}) // end of module
