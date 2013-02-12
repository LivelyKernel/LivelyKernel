module('lively.ide.CodeEditor').requires('lively.morphic.TextCore', 'lively.morphic.Widgets').requiresLib({url: Config.codeBase + 'lib/ace/src-noconflict/ace.js', loadTest: function() { return typeof ace !== 'undefined';}}).toRun(function() {

lively.ide.ace = {
    textModeModules: {
        "abap": "ace/mode/abap",
        "asciidoc": "ace/mode/asciidoc",
        "c9search": "ace/mode/c9search",
        "c_cpp": "ace/mode/c_cpp",
        "clojure": "ace/mode/clojure",
        "coffee": "ace/mode/coffee",
        "coldfusion": "ace/mode/coldfusion",
        "csharp": "ace/mode/csharp",
        "css": "ace/mode/css",
        "curly": "ace/mode/curly",
        "dart": "ace/mode/dart",
        "diff": "ace/mode/diff",
        "dot": "ace/mode/dot",
        "glsl": "ace/mode/glsl",
        "golang": "ace/mode/golang",
        "groovy": "ace/mode/groovy",
        "haml": "ace/mode/haml",
        "haxe": "ace/mode/haxe",
        "html": "ace/mode/html",
        "jade": "ace/mode/jade",
        "java": "ace/mode/java",
        "javascript": "ace/mode/javascript",
        "json": "ace/mode/json",
        "jsp": "ace/mode/jsp",
        "jsx": "ace/mode/jsx",
        "latex": "ace/mode/latex",
        "less": "ace/mode/less",
        "liquid": "ace/mode/liquid",
        "lisp": "ace/mode/lisp",
        "lua": "ace/mode/lua",
        "luapage": "ace/mode/luapage",
        "lucene": "ace/mode/lucene",
        "makefile": "ace/mode/makefile",
        "markdown": "ace/mode/markdown",
        "objectivec": "ace/mode/objectivec",
        "ocaml": "ace/mode/ocaml",
        "perl": "ace/mode/perl",
        "pgsql": "ace/mode/pgsql",
        "php": "ace/mode/php",
        "powershell": "ace/mode/powershell",
        "python": "ace/mode/python",
        "r": "ace/mode/r",
        "rdoc": "ace/mode/rdoc",
        "rhtml": "ace/mode/rhtml",
        "ruby": "ace/mode/ruby",
        "scad": "ace/mode/scad",
        "scala": "ace/mode/scala",
        "scss": "ace/mode/scss",
        "sh": "ace/mode/sh",
        "sql": "ace/mode/sql",
        "stylus": "ace/mode/stylus",
        "svg": "ace/mode/svg",
        "tcl": "ace/mode/tcl",
        "tex": "ace/mode/tex",
        "text": "ace/mode/text",
        "textile": "ace/mode/textile",
        "typescript": "ace/mode/typescript",
        "vbscript": "ace/mode/vbscript",
        "xml": "ace/mode/xml",
        "xquery": "ace/mode/xquery",
        "yaml": "ace/mode/yaml"
    }
}

lively.morphic.Morph.subclass('lively.morphic.CodeEditor',
'settings', {
    style: {
        enableGrabbing: false
    },
    doNotSerialize: ['aceEditor', 'aceEditorAfterSetupCallbacks']
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
        this.setBounds(bounds);
        this.textString = string || '';
    },

    onOwnerChanged: function(newOwner) {
        if (newOwner) this.initializeAce();
    }
},
'ace', {
    initializeAce: function() {
        // 1) create ace editor object
        var node = this.getShape().shapeNode,
            e = this.aceEditor = this.aceEditor || ace.edit(node),
            morph = this;
        this.aceEditor.on('focus', function() { morph._isFocused = true; })
        this.aceEditor.on('blur', function() { morph._isFocused = false; })
        node.setAttribute('id', 'ace-editor');
        // 2) set modes / themes
        e.getSession().setMode("ace/mode/javascript");
        this.setStyleSheet('#ace-editor {'
                          + ' position:absolute;'
                          + ' top:0;'
                          + ' bottom:0;left:0;right:0;'
                          + ' font-family: monospace;'
                          + '}');
        this.setupKeyBindings();
        e.setTheme("ace/theme/chrome");

        // 2) run after setup callbacks
        var cbs = this.aceEditorAfterSetupCallbacks;
        if (!cbs) return;
        delete this.aceEditorAfterSetupCallbacks;
        var cb;
        while ((cb = cbs.shift())) { cb(e); }
    },

    setupKeyBindings: function() {
        // that.setupKeyBindings()
        var e = this.aceEditor, lkKeys = this;
        this.loadAceModule(["keybinding", 'ace/keyboard/emacs'], function(emacsKeys) {
            e.setKeyboardHandler(emacsKeys.handler);
            var kbd = e.getKeyboardHandler();
            kbd.addCommand({name: 'doit', exec: lkKeys.doit.bind(lkKeys, false) });
            kbd.addCommand({name: 'printit', exec: lkKeys.doit.bind(lkKeys, true)});
            kbd.addCommand({name: 'doListProtocol', exec: lkKeys.doListProtocol.bind(lkKeys)});
            kbd.bindKeys({"s-d": 'doit', "s-p": 'printit', "S-s-p": 'doListProtocol'});
        });
    },

    withAceDo: function(doFunc) {
        if (this.aceEditor) return doFunc(this.aceEditor);
        if (!this.aceEditorAfterSetupCallbacks) this.aceEditorAfterSetupCallbacks = [];
        this.aceEditorAfterSetupCallbacks.push(doFunc);
        return undefined;
    },

    loadAceModule: function(moduleName, callback) {
        return ace.require('./config').loadModule(moduleName, callback);
    }

},
'serialization', {
    onLoad: function() {
        this.initializeAce();
    },

    onstore: function($super) {
        $super();
        var self = this;
        this.withAceDo(function(ed) {
            self.storedTextString = ed.getSession().getDocument().getValue();
        });
    },

    onrestore: function($super) {
        $super();
        if (this.storedTextString) {
            this.textString = this.storedTextString;
            delete this.storedTextString;
        }
    }
},
'accessing', {
    getGrabShadow: function() { return null; },
    setExtent: function($super, extent) {
        $super(extent);
        this.withAceDo(function(ed) { ed.resize(); });
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
'text morph eval interface', {

    tryBoundEval: function(string) {
        try {
            return this.boundEval(string);
        } catch(e) {
            return e;
        }
    },

    boundEval: function (str) {
        // Evaluate the string argument in a context in which "this" may be supplied by the modelPlug
        var ctx = this.getDoitContext() || this,
            interactiveEval = function(text) { return eval(text) };
        return interactiveEval.call(ctx, str);
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

    getDoitContext: function() { return this; }

},
'text morph event interface', {
    focus: function() {
        this.aceEditor.focus();
    },
    isFocused: function() { return this._isFocused }
},
'text morph selection interface', {
    setSelectionRange: function(start, end) { throw new Error('implement me'); },
    getSelectionRange: function() { throw new Error('implement me'); },
    selectAll: function() { throw new Error('implement me'); },

    getSelectionOrLineString: function() {
        var editor = this.aceEditor, sel = editor.selection;
        if (!sel) return "";
        var range = sel.isEmpty() ? sel.getLineRange() : editor.getSelectionRange();
        return editor.session.getTextRange(range);
    }

},
'text morph syntax highlighter interface', {
    enableSyntaxHighlighting: function() { this.setTextMode('javascript'); },
    disableSyntaxHighlighting: function() { this.setTextMode('text'); },
    setTextMode: function(modeName) {
        var moduleName = lively.ide.ace.textModeModules[modeName],
            editor = this.aceEditor;
        this.loadAceModule(["mode", moduleName], function(mode) {
            var doc = editor.getSession().getDocument(),
                newMode = new mode.Mode(),
                newSession = new ace.EditSession(doc, newMode)
            editor.setSession(newSession);
        });
    }
},
'text morph interface', {

    set textString(string) {
        this.withAceDo(function(ed) {
            var doc = ed.getSession().getDocument();
            doc.setValue(string);
        });
        return string;
    },

    get textString() {
        return this.withAceDo(function(ed) {
            var doc = ed.getSession().getDocument();
            return doc.getValue();
        }) || "";
    },

    insertTextStringAt: function(index, string) { throw new Error('implement me'); },
    insertAtCursor: function(string, selectIt, overwriteSelection) {
        this.aceEditor.onPaste(string);
    },

    setFontSize: function(size) {
        this.getShape().shapeNode.style.fontSize = size + 'pt';
        return this._FontSize = size;
    },
    getFontSize: function() { return this._FontSize; },
    setFontFamily: function(fontName) {
        this.getShape().shapeNode.style.fontFamily = fontName;
        return this._FontFamily = fontName;
    },
    getFontFamily: function() { return this._FontFamily; },

    inputAllowed: function() { return this.allowInput },
    setInputAllowed: function(bool) { throw new Error('implement me'); }

});

});

}); // end of module
