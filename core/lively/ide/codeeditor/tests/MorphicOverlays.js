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
        this.assertMatches({column: 7, row: 3}, bottomRightPos);

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
        var computedRange = overlay.getRange(codeEditor);
        this.assertEquals("hell", codeEditor.getTextRange(computedRange));
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

        var range1, fullRange1;
        overlay.setLabelString(codeEditor, "hello world", function() {
          range1 = overlay.getRange(codeEditor);
          fullRange1 = codeEditor.rangeFromGlobalMorphicBounds(overlay.globalBounds());
        });

        var range2, fullRange2;
        this.waitFor(function() { return !!range1; }, 10, function() {
          overlay.spec.alignLabel = 'line-end';
          overlay.setLabelString(codeEditor, "hello world", function() {
            range2 = overlay.getRange(codeEditor);
            fullRange2 = codeEditor.rangeFromGlobalMorphicBounds(overlay.globalBounds());
          });
        });

        this.delay(function() {
          this.assertEquals("Range: [1/0] -> [1/2]", String(range1));
          if (!Config.serverInvokedTest) // note: the server env has different font sizes that we don't measure out
            this.assertEquals("Range: [1/0] -> [1/11]", String(fullRange1));
          this.assertEquals("Range: [1/0] -> [1/2]", String(range2));
          if (!Config.serverInvokedTest)
            this.assertEquals("Range: [1/0] -> [1/15]", String(fullRange2));
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

        this.assertEquals("Range: [2/0] -> [2/4]", String(range1), "range 1");
        this.assertEquals("Range: [2/0] -> [2/7]", String(range2), "range 2");
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
