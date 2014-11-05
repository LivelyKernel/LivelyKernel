module('lively.ide.codeeditor.tests.TextOverlays').requires('lively.ide.tests.CodeEditor', 'lively.ide.codeeditor.TextOverlay').toRun(function() {

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.CodeEditorTextLayer',
'running', {
    setUp: function($super, run) {
        var self = this;
        $super(function() {
            this.editor.setShowGutter(false);
            this.editor.openInWorldCenter();
            this.editor.withAceDo(function(ed) {
                run.delay(0.1);
            });
        });
    }
},
"assertion", {
    assertRenderedOverlayPositions: function(positions, overlayMarker) {
        var layerConfig = this.editor.aceEditor.renderer.layerConfig,
            els = overlayMarker.getElements(this.editor.aceEditor);
        els.forEach(function(el, i) {
            var overlay = overlayMarker.overlays[i],
                style = Global.getComputedStyle(el),
                left = Number(style.left.replace(/[^0-9\.]+/g, '')),
                expectedLeft = layerConfig.padding + (layerConfig.characterWidth * positions[i].column),
                top = Number(style.top.replace(/[^0-9\.]+/g, '')),
                expectedTop = layerConfig.offset + (layerConfig.lineHeight * positions[i].row);
            this.assertEquals(expectedLeft.toFixed(1), left.toFixed(1), 'left');
            this.assertEquals(expectedTop.toFixed(1), top.toFixed(1), 'top');
        }, this);
    },
    assertRenderedOverlayText: function(texts, overlayMarker) {
        var els = overlayMarker.getElements(this.editor.aceEditor);
        els.forEach(function(el, i) {
            this.assertEquals(texts[i], el.textContent);
        }, this);
    }
},
'testing', {

    testRendersOverlay: function() {
        var codeEditor = this.editor,
            session = this.editor.getSession(),
            ed = this.editor.aceEditor,
            el, layerConfig, style;
        codeEditor.setTextString('\nhello ');
        codeEditor.addTextOverlay({
            text: 'world',
            classNames: ['test-overlay'],
            start: {row: 1, column: 6}
        });
        this.delay(function() {
            this.assertRenderedOverlayText(['world'], session.$textOverlay);
            this.assertRenderedOverlayPositions([{row: 1, column: 6}], session.$textOverlay);

            ed.moveCursorToPosition({row: 1, column: 0});
            ed.insert('x');
            this.delay(function assertOverlayDoesntMoveWithText() {
                this.assertRenderedOverlayPositions([{row: 1, column: 6}], session.$textOverlay);
                this.done();
            }, 100);
        }, 100);
    }

});

}) // end of module
