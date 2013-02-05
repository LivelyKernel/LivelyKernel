module('lively.ide.CodeEditor').requires('lively.morphic.TextCore').requiresLib({url: Config.codeBase + 'lib/ace/src-noconflict/ace.js', loadTest: function() { return typeof ace !== 'undefined';}}).toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.CodeEditor',
'settings', {
    style: {
        enableGrabbing: false
    },
    doNotSerialize: ['aceEditor']
},
'initializing', {
    initialize: function($super, bounds, string) {
        bounds = bounds || lively.rect(0,0,400,300);
        var shape = new lively.morphic.Shapes.External(document.createElement('div'));

        // FIXME those functions should go somewhere else...
        (function onstore() {
            var node = this.shapeNode;
            if (!node) return;
            this.extent = this.getExtent();
        }).asScriptOf(shape);

        (function onrestore() {
            this.shapeNode = document.createElement('div');
            this.shapeNode.style.width = this.extent.x + 'px';
            this.shapeNode.style.height = this.extent.y + 'px';
            this.setExtent(this.extent);
        }).asScriptOf(shape);

        $super(shape);
        debugger
        this.setBounds(bounds);
        this.textString = string || '';
    },

    initializeAce: function() {
        var node = this.getShape().shapeNode,
            e = this.aceEditor = this.aceEditor || ace.edit(node);
        node.setAttribute('id', 'ace-editor');
        e.getSession().setMode("ace/mode/javascript");
        this.setStyleSheet('#ace-editor {'
                          + ' position:absolute;'
                          + ' top:0;'
                          + ' bottom:0;left:0;right:0;'
                          + ' font-family: monospace;'
                          + '}');
        e.setTheme("ace/theme/chrome");
        this.setupKeyBindings();
    },

    onOwnerChanged: function(newOwner) {
        if (newOwner) this.initializeAce();
    },

    setupKeyBindings: function() {
        // that.setupKeyBindings()
        var e = this.aceEditor,
            config = ace.require('./config'),
            lkKeys = this;
        config.loadModule(["keybinding", 'ace/keyboard/emacs'], function(emacsKeys) {
            e.setKeyboardHandler(emacsKeys.handler);
            var kbd = e.getKeyboardHandler();
            kbd.addCommand({name: 'doit', exec: lkKeys.doit.bind(lkKeys, false) });
            kbd.addCommand({name: 'printit', exec: lkKeys.doit.bind(lkKeys, true)});
            kbd.addCommand({name: 'doListProtocol', exec: lkKeys.doListProtocol.bind(lkKeys)});
            kbd.bindKeys({"s-d": 'doit', "s-p": 'printit', "S-s-p": 'doListProtocol'});
        });
    }
},
'serialization', {
    onLoad: function() {
        this.initializeAce();
    },

    onstore: function($super) {
        $super();
        if (this.aceEditor) this.aceEditor.resize();
    }

},
'accessing', {
    getGrabShadow: function() { return null; },
    setExtent: function($super, extent) {
        $super(extent);
        if (this.aceEditor) this.aceEditor.resize();
        return extent;
    }
},
'event handling', {
    onMouseDown: function($super, evt) {
        // ace installs a mouseup event handler on the document level and
        // stops the event so it never reaches our Morphic event handlers. To
        // still dispatch the event properly we install an additional mouseup
        // handler that is removed immediately thereafter
        var self = this;
        function upHandler(evt) {
            document.removeEventListener("mouseup", upHandler, true);
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onMouseUpEntry(evt);
        }
        document.addEventListener("mouseup", upHandler, true);
        return $super(evt);
    }
},
'text interface', {

    tryBoundEval: function(string) {
        try {
            return this.boundEval(string);
        } catch(e) {
            return e;
        }
    },

    boundEval: function(string) {
        return lively.morphic.Text.prototype.boundEval.call(this, string || "");
    },

    doit: function(printResult, editor) {
        var text = this.getSelectionOrLineString(),
            sel = editor.selection,
            result = this.tryBoundEval(text);
        if (printResult) {
            sel && sel.clearSelection();
            var start = sel && sel.getCursor();
            editor.onPaste(String(result));
            var end = start && sel.getCursor();
            if (start && end) {
                sel.moveCursorToPosition(start);
                sel.selectToPosition(end);
            }
            // editor.navigateLeft(result.length);
        } else if (sel && sel.isEmpty()) {
            sel.selectLine();
        }
    },

    doListProtocol: function() {
        var pl = new lively.morphic.Text.ProtocolLister(this);
        // FIXME
        pl.createSubMenuItemFromSignature = function(signature, optStartLetters) {
            var textMorph = this.textMorph, replacer = signature;
            if (typeof(optStartLetters) !== 'undefined') {
                replacer = signature.substring(optStartLetters.size());
            }
            // if (textMorph.getTextString().indexOf('.') < 0) {
            //     replacer = '.' + replacer;
            // }
            return [signature, function() {
                // FIXME not sure if this has to be delayed
                (function() {
                    textMorph.focus();
                    textMorph.insertAtCursor(replacer, true);
                    textMorph.focus();
                }).delay(0)
            }]
        }
        pl.evalSelectionAndOpenListForProtocol();
    },

    getDoitContext: function() { return this; },

    focus: function() {
        this.aceEditor.focus();
    },

    getSelectionOrLineString: function() {
        var editor = this.aceEditor, sel = editor.selection;
        if (!sel) return "";
        var range = sel.isEmpty() ? sel.getLineRange() : editor.getSelectionRange();
        return editor.session.getTextRange(range);
    },

    insertAtCursor: function(string, selectIt, overwriteSelection) {
        this.aceEditor.onPaste(string);
    }

});

}); // end of module
