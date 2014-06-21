module('lively.ide.codeeditor.tests.JumpChar').requires('lively.ide.tests.CodeEditor', 'lively.ide.codeeditor.JumpChar').toRun(function() {

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.JumpChar',
'running', {
    setUp: function($super, run) {
        var self = this;

        $super(function() {
            this.editor.setShowGutter(false);
            this.editor.setExtent(lively.pt(460.0,120.0)); // important for visible area
            this.editor.openInWorldCenter();
            this.editor.textString = "function test() {\n"
                                   + "    return \"hello world\";\n"
                                   + "}\n";
            this.editor.setLineWrapping(false);
            this.editor.withAceDo(function(ed) {
                var kbd = ed.getKeyboardHandler();
                lively.ide.codeeditor.JumpChar.setup(kbd);
                self.cmd = kbd.platform === "mac" ? "Command" : "Control";
                run.delay(0.1);
            });
        });
    }
},
'testing', {

    testInstallJumpChar: function() {
        var keys = lively.ide.ace.require('ace/lib/keys'),
            codeEditor = this.editor,
            ed = codeEditor.aceEditor,
            kbd = ed.getKeyboardHandler();
        this.assert(!kbd.isJumpChar, 'already not installed?');
        keys.simulateKey(ed, this.cmd + '-J');
        var kbd = ed.getKeyboardHandler();
        this.assert(!!kbd.isJumpChar, 'not installed?');
        this.done();
    },

    testDirectlyJumpToSingleOccurrence: function() {
        var keys = lively.ide.ace.require('ace/lib/keys'),
            codeEditor = this.editor,
            ed = codeEditor.aceEditor;
        codeEditor.setCursorPosition(pt(0,0));
        keys.simulateKey(ed, this.cmd + '-J');
        keys.simulateKey(ed, '{');
        var pos = codeEditor.getCursorPositionAce();
        this.assertMatches({column: 17, row: 0}, pos, 'pos');
        this.done();
    },

    testAddOverlayForMultipleOccurrences: function() {
        var keys = lively.ide.ace.require('ace/lib/keys'),
            codeEditor = this.editor,
            ed = codeEditor.aceEditor;
        codeEditor.setCursorPosition(pt(0,0));
        keys.simulateKey(ed, this.cmd + '-J');
        keys.simulateKey(ed, 'l');
        
        var overlays, expected = [
            {start: {row:1,column:14},text: "a"},
            {start: {row:1,column:15},text: "b"},
            {start: {row:1,column:21},text: "c"}];

        codeEditor.withOverlaySupport(function($overlay, ed) {
            overlays = $overlay.overlays; });
        this.assertMatches(expected, overlays, 'overlays');

        keys.simulateKey(ed, 'Esc');
        codeEditor.withOverlaySupport(function($overlay, ed) {
            overlays = $overlay.overlays; });
        var kbd = ed.getKeyboardHandler();
        this.assert(!kbd.isJumpChar, 'jump handler not removed?');
        this.assertEquals(0, overlays.length, 'overlays no removed on cancel');

        this.done();
    },

    testJumpToCharWithMultipleOccurrences: function() {
        var keys = lively.ide.ace.require('ace/lib/keys'),
            codeEditor = this.editor,
            ed = codeEditor.aceEditor;
        codeEditor.setCursorPosition(pt(0,0));
        keys.simulateKey(ed, this.cmd + '-J');
        keys.simulateKey(ed, 'l');
        keys.simulateKey(ed, 'b');

        var pos = codeEditor.getCursorPositionAce();
        this.assertEqualState({row: 1, column: 16}, pos, 'jump-to-pos');

        this.done();
    },

    testDealWithLotsOfOccurrences: function() {
        var keys = lively.ide.ace.require('ace/lib/keys'),
            codeEditor = this.editor,
            ed = codeEditor.aceEditor;
        codeEditor.setExtent(pt(400,300));
        codeEditor.textString = Array.withN(10, Array.withN(50, 'a').join('')).join('\n')
        codeEditor.setCursorPosition(pt(0,0));
        keys.simulateKey(ed, "Command" + '-J');
        keys.simulateKey(ed, 'a');
        keys.simulateKey(ed, 'f');

        var overlays, expected = Array.range(0,19).map(function(i) {
            return {start: {row:2,column:0+i},text:String.fromCharCode('a'.charCodeAt(0)+i)};
        });
        
        codeEditor.withOverlaySupport(function($overlay, ed) {
            overlays = $overlay.overlays; });
        this.assertEquals(20, overlays.length, 'overlays.length');
        this.assertMatches(expected, overlays, 'overlays');

        keys.simulateKey(ed, 'b');

        var pos = codeEditor.getCursorPositionAce();
        this.assertEqualState({row: 2, column: 2}, pos, 'jump-to-pos');
        this.done();
    },

    testDealWithRangesThatDontAlignWithLines: function() {
        var keys = lively.ide.ace.require('ace/lib/keys'),
            codeEditor = this.editor,
            ed = codeEditor.aceEditor;
        codeEditor.textString = Array.withN(26, 'a').join('') + 'a\n' + Array.withN(25, 'a').join('');

        keys.simulateKey(ed, this.cmd + '-J');
        keys.simulateKey(ed, 'a');
        keys.simulateKey(ed, 'n');
        keys.simulateKey(ed, 'b');
        var pos = codeEditor.getCursorPositionAce();
        this.assertEqualState({row: 1, column: 1}, pos, 'jump-to-pos');

        keys.simulateKey(ed, this.cmd + '-J');
        keys.simulateKey(ed, 'a');
        keys.simulateKey(ed, 'm');
        keys.simulateKey(ed, 'b');
        var pos = codeEditor.getCursorPositionAce();
        this.assertEqualState({row: 0, column: 26}, pos, 'jump-to-pos');

        this.done();
    }

});

}) // end of module
