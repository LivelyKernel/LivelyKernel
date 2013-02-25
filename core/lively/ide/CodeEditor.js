module('lively.ide.CodeEditor').requires('lively.morphic.TextCore', 'lively.morphic.Widgets', 'lively.ide.BrowserFramework').requiresLib({url: Config.codeBase + (false && lively.useMinifiedLibs ? 'lib/ace/lively-ace.min.js' : 'lib/ace/lively-ace.js'), loadTest: function() { return typeof ace !== 'undefined';}}).toRun(function() {

(function configureAce() {
    ace.config.set("workerPath", URL.codeBase.withFilename('lib/ace/').fullPath());
})();

lively.ide.ace = {

    modules: function(optPrefix, shorten) {
        // return ace modules, optionally filtered by optPrefix. If shorten is
        // true remove optPrefix from name
        var moduleNames = Object.keys(ace.define.modules);
        if (!optPrefix) return moduleNames;
        moduleNames = moduleNames.select(function(ea) {
            return ea.startsWith(optPrefix); });
        if (!shorten) return moduleNames;
        return moduleNames.map(function(ea) {
            return ea.substring(optPrefix.length); })
    },

    // currently supported:
    // "abap", "clojure", "coffee", "css", "dart", "diff", "haml", "html",
    // "jade", "java", "javascript", "json", "latex", "less", "lisp",
    // "makefile", "markdown", "objectivec", "python", "r", "rdoc", "sh",
    // "sql", "svg", "text", "xml"
    // available but not loaded by default are:
    // "asciidoc", "c9search", "c_cpp", "coldfusion", "csharp", "curly",
    // "dot", "glsl", "golang", "groovy", "haxe", "jsp", "jsx", "liquid",
    // "lua", "luapage", "lucene", "ocaml", "perl", "pgsql", "php",
    // "powershell", "rhtml", "ruby", "scad", "scala", "scss", "stylus",
    // "tcl", "tex", "textile", "typescript", "vbscript", "xquery", "yaml"

    availableTextModes: function() {
        return lively.ide.ace.modules('ace/mode/', false)
            .select(function(moduleName) { return !!ace.require(moduleName).Mode })
            .map(function(name) { return name.substring('ace/mode/'.length); });
    },

    moduleNameForTextMode: function(textModeName) {
        return this.availableTextModes().include(textModeName) ?
            'ace/mode/' + textModeName : null;
    },

    // supported:
    // "ambiance", "monokai", "chrome", "pastel_on_dark", "textmate",
    // "solarized_dark", "twilight", "tomorrow", "tomorrow_night",
    // "tomorrow_night_blue", "tomorrow_night_bright", "eclipse"
    // not loaded by default are:
    // "xcode", "vibrant_ink", "tomorrow_night_eighties",
    // "tomorrow_night_bright", "tomorrow_night_blue", "solarized_light",
    // "mono_industrial", "merbivore_soft", "merbivore", "kr", "idle_fingers",
    // "github", "dreamweaver", "dawn", "crimson_editor", "cobalt",
    // "clouds_midnight", "clouds", "chaos"
    availableThemes: function() { return this.modules('ace/theme/', true) },

    moduleNameForTheme: function(themeName) {
        return this.availableThemes().include(themeName) ?
            "ace/theme/" + themeName : null
    }
}

lively.morphic.Morph.subclass('lively.morphic.CodeEditor',
'settings', {
    style: {
        enableGrabbing: false
    },
    doNotSerialize: ['aceEditor', 'aceEditorAfterSetupCallbacks', 'savedTextString'],
    evalEnabled: true,
    isAceEditor: true
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

        this.setTheme(Config.get('aceDefaultTheme'));
        this.setTextMode(Config.get('aceDefaultTextMode'));
    },

    onOwnerChanged: function(newOwner) {
        if (newOwner) this.initializeAce();
    }
},
'serialization', {
    onLoad: function() {
        if (this.aceThemeName) {
            this.setTheme(this.aceThemeName);
            delete this.aceThemeName;
        }
        if (this.aceTextModeName) {
            this.setTextMode(this.aceTextModeName);
            delete this.aceTextModeName;
        }
        this.initializeAce();
    },

    onstore: function($super, persistentCopy) {
        $super(persistentCopy);
        this.withAceDo(function(ed) {
            persistentCopy.aceThemeName = this.getTheme();
            persistentCopy.aceTextModeName = this.getTextMode();
            persistentCopy.storedTextString = this.textString;
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
'ace', {
    initializeAce: function() {
        // 1) create ace editor object
        var node = this.getShape().shapeNode,
            e = this.aceEditor = this.aceEditor || ace.edit(node),
            morph = this;
        e.on('focus', function() { morph._isFocused = true; });
        e.on('blur', function() { morph._isFocused = false; });
        node.setAttribute('id', 'ace-editor');
        e.session.setUseSoftTabs(true);
        // 2) set modes / themes
        this.setStyleSheet('#ace-editor {'
                          + ' position:absolute;'
                          + ' top:0;'
                          + ' bottom:0;left:0;right:0;'
                          + ' font-family: Monaco,monospace;'
                          + ' font-size: ' + Config.get('defaultCodeFontSize') + 'pt;'
                          + '}');
        this.setupKeyBindings();
        this.setTextMode(this.getTextMode() || "");
        this.setTheme(this.getTheme() || '');

        // 4) run after setup callbacks
        var cbs = this.aceEditorAfterSetupCallbacks;
        if (!cbs) return;
        delete this.aceEditorAfterSetupCallbacks;
        for (var cb; cb = cbs.shift(); !!cb) { cb.call(this, e); }
    },

    addCommands: function(commands) {
        var e = this.aceEditor,
            handler = e.commands,
            platform = handler.platform; // mac or win

        function lookupCommand(keySpec) {
            keySpec.split('|').detect(function(keys) {
                var binding = e.commands.parseKeys(keys),
                    command = e.commands.findKeyCommand(binding.hashId, binding.key);
                return command && command.name;
            });
        }

        function addCommands(commandList) {
            // first remove a keybinding if one already exists
            commandList.forEach(function(cmd) {
                var keys = cmd.bindKey && (cmd.bindKey[platform] || cmd.bindKey),
                    existing = keys && lookupCommand(keys);
                if (existing) handler.removeCommand(existing);
            });
            handler.addCommands(commandList);
        }

        addCommands(commands);
    },

    setupKeyBindings: function() {
        var codeEditor = this;
        this.addCommands([
            { // evaluation
                name: 'doit',
                bindKey: {win: 'Ctrl-D',  mac: 'Command-D'},
                exec: this.doit.bind(this, false),
                multiSelectAction: "forEach",
                readOnly: false // false if this command should not apply in readOnly mode
            }, {
                name: 'printit',
                bindKey: {win: 'Ctrl-P',  mac: 'Command-P'},
                exec: this.doit.bind(this, true),
                multiSelectAction: "forEach",
                readOnly: false
            }, {
                name: 'list protocol',
                bindKey: {win: 'Ctrl-Shift-P',  mac: 'Command-Shift-P'},
                exec: this.doListProtocol.bind(this),
                multiSelectAction: "single",
                readOnly: false
            }, {
                name: 'doSave',
                bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
                exec: this.doSave.bind(this),
                multiSelectAction: "single",
                readOnly: false
            }, {
                name: 'printInspect',
                bindKey: {win: 'Ctrl-I',  mac: 'Command-I'},
                exec: this.printInspect.bind(this),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'doInspect',
                bindKey: {win: 'Ctrl-Shift-I',  mac: 'Command-Shift-I'},
                exec: this.doInspect.bind(this),
                multiSelectAction: "forEach",
                readOnly: true
            },
            // code manipulation
            {
                name: "blockoutdent",
                bindKey: {win: "Ctrl-[", mac: "Command-["},
                exec: function(editor) { editor.blockOutdent(); },
                multiSelectAction: "forEach"
            }, {
                name: "blockindent",
                bindKey: {win: "Ctrl-]", mac: "Command-]"},
                exec: function(editor) { editor.blockIndent(); },
                multiSelectAction: "forEach"
            },{ // selection / movement
                name: 'clearSelection',
                bindKey: 'Escape',
                exec: this.clearSelection.bind(this),
                readOnly: true
            }, {
                name: 'selectLine',
                bindKey: {win: "Ctrl-L", mac: "Command-L"},
                exec: function(ed) { codeEditor.selectCurrentLine(); },
                multiSelectAction: 'forEach',
                readOnly: true
            }, {
                name: 'moveForwardToMatching',
                bindKey: {win: 'Ctrl-Right',  mac: 'Command-Right'},
                exec: this.moveForwardToMatching.bind(this, false),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'moveBackwardToMatching',
                bindKey: {win: 'Ctrl-Left',  mac: 'Command-Left'},
                exec: this.moveBackwardToMatching.bind(this, false),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'selectToMatchingForward',
                bindKey: {win: 'Ctrl-Shift-Right',  mac: 'Command-Shift-Right'},
                exec: this.moveForwardToMatching.bind(this, true),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'selectToMatchingBackward',
                bindKey: {win: 'Ctrl-Shift-Left',  mac: 'Command-Shift-Left'},
                exec: this.moveBackwardToMatching.bind(this, true),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "selecttolinestart",
                bindKey: 'Shift-Home|Ctrl-Shift-A',
                exec: function(editor) { editor.getSelection().selectLineStart(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "gotolinestart",
                bindKey: "Home|Ctrl-A",
                exec: function(editor) { editor.navigateLineStart(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "selecttolineend",
                bindKey: "Shift-End|Ctrl-Shift-E",
                exec: function(editor) { editor.getSelection().selectLineEnd(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "gotolineend",
                bindKey: "End|Ctrl-E",
                exec: function(editor) { editor.navigateLineEnd(); },
                multiSelectAction: "forEach",
                readOnly: true
            },
            // search & find
            {
                name: "searchWithPrompt",
                bindKey: {win: "Ctrl-F", mac: "Command-F"},
                exec: this.searchWithPrompt.bind(this),
                readOnly: true
            }, {
                name: "findnext",
                bindKey: {win: "Ctrl-K", mac: "Command-G"},
                exec: this.findNext.bind(this),
                readOnly: true
            }, {
                name: "findprevious",
                bindKey: {win: "Ctrl-Shift-K", mac: "Command-Shift-G"},
                exec: this.findPrev.bind(this),
                readOnly: true
            }, {
                name: "multiSelectNext",
                bindKey: "Ctrl-Shift-.",
                exec: this.multiSelectNext.bind(this),
                readOnly: true
            }, {
                name: "multiSelectPrev",
                bindKey: "Ctrl-Shift-,",
                exec: this.multiSelectPrev.bind(this),
                readOnly: true
            }, {
                name: 'doBrowseImplementors',
                bindKey: {win: 'Ctrl-Shift-F', mac: 'Command-Shift-F'},
                exec: this.doBrowseImplementors.bind(this),
                readOnly: true
            },
            // insertion
            {
                name: 'insertLineAbove',
                bindKey: "Shift-Return",
                exec: function(ed) { ed.navigateUp(); ed.navigateLineEnd(); ed.insert('\n'); },
                multiSelectAction: 'forEach',
                readOnly: false
            }, {
                name: 'insertLineBelow',
                bindKey: "Command-Return",
                exec: function(ed) { ed.navigateLineEnd(); ed.insert('\n'); },
                multiSelectAction: 'forEach',
                readOnly: false
            }]);

        if (Object.isFunction(Config.codeEditorUserKeySetup)) {
            Config.codeEditorUserKeySetup(this);
        }
    },

    setupRobertsKeyBindings: function() {
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

    lookupCommand: function(keySpec) {
        return this.withAceDo(function(ed) {
            var handler = ed.getKeyboardHandler(),
                binding = handler.parseKeys(keySpec),
                command = handler.findKeyCommand(binding.hashId, binding.key);
            if (!command) return null;
            if (!command.hasOwnProperty('toString')) {
                command.toString = function() { return '[cmd:' + command.name + ']' }
            }
            return command;
        });
    },

    withAceDo: function(doFunc) {
        if (this.aceEditor) return doFunc.call(this, this.aceEditor);
        if (!this.aceEditorAfterSetupCallbacks) this.aceEditorAfterSetupCallbacks = [];
        this.aceEditorAfterSetupCallbacks.push(doFunc);
        return undefined;
    },

    loadAceModule: function(moduleName, callback) {
        return ace.require('./config').loadModule(moduleName, callback);
    },

    indexToPosition: function(absPos) {
        return this.withAceDo(function(ed) { return ed.session.doc.indexToPosition(absPos); });
    }

},
'ace interface', {
    setCursorPosition: function(pos) {
        return this.withAceDo(function(ed) {
            ed.selection.moveCursorToPosition({column: pos.x, row: pos.y}); });
    },

    getCursorPosition: function() {
        return this.withAceDo(function(ed) {
            var pos = ed.getCursorPosition();
            return lively.pt(pos.column, pos.row); });
    },

    moveToMatching: function(forward, shouldSelect, moveAnyway) {
        // This method tries to find a matching char to the one the cursor
        // currently points at. If a match is found it is set as the new
        // position. In case there is no match but moveAnyway is truthy try to
        // move forward over words. A selection range is created when
        // shouldSelect is truthy.
        return this.withAceDo(function(ed) {
            var pos = ed.getCursorPosition(),
                range = ed.session.getBracketRange(pos),
                sel = ed.selection;
            if (!range
              || (forward && !range.isStart(pos.row, pos.column))
              || (!forward && !range.isEnd(pos.row, pos.column))) {
                if (!moveAnyway) return;
                var method = (shouldSelect ? "selectWord" : "moveCursorWord")
                           + (forward ? "Right" : "Left");
                sel[method]();
            } else {
                var to = forward ? range.end : range.start;
                if (!shouldSelect) {
                    sel.moveCursorToPosition(to);
                } else {
                    sel.selectToPosition(to);
                }
            }
        });
    },

    getCurrentSearchTerm: function() {
        return this.withAceDo(function(ed) {
            return ed.$search
                && ed.$search.$options
                && ed.$search.$options.needle;
        }) || '';
    },

    moveForwardToMatching: function(shouldSelect, moveAnyway) {
        this.moveToMatching(true, shouldSelect, moveAnyway);
    },

    moveBackwardToMatching: function(shouldSelect, moveAnyway) {
        this.moveToMatching(false, shouldSelect, moveAnyway);
    },

    clearSelection: function() { this.withAceDo(function(ed) { ed.clearSelection(); }) },

    setTheme: function(themeName) {
        this.withAceDo(function(ed) {
            ed.setTheme(lively.ide.ace.moduleNameForTheme(themeName));
        });
    },

    getTheme: function() {
        return this.withAceDo(function(ed) {
            var theme = ed.getTheme() || '';
            return theme.replace('ace/theme/', '');
        }) || '';
    },

    setTextMode: function(modeName) {
        this.withAceDo(function(ed) {
            ed.session.setMode(lively.ide.ace.moduleNameForTextMode(modeName));
        });
    },

    getTextMode: function() {
        return this.withAceDo(function(ed) {
            var mode = ed.session.getMode(),
                name = mode && mode.$id ? mode.$id : 'text';
            return name.replace('ace/mode/', '');
        }) || 'text';
    }
},
'search and find', {

    searchWithPrompt: function() {
        var world = this.world();
        if (!world) return;
        this.withAceDo(function(ed) {
            world.prompt('Enter text or regexp to search for.', function(input) {
                if (!input) { ed.focus(); return };
                var regexpMatch = input.match(/^\/(.*)\/$/),
                    needle = regexpMatch && regexpMatch[1] ? new RegExp(regexpMatch[1], "") : input;
                ed.focus();
                ed.find({
                    needle: needle,
                    preventScroll: false,
                    skipCurrent: true,
                    start: ed.getCursorPosition(),
                    wrap: false,
                    animate: true
                });
            }, this.getCurrentSearchTerm());
        });
    },

    findNext: function() {
        this.withAceDo(function(ed) {
            ed.find({skipCurrent: true, backwards: false, needle: ed.$search.$options.needle});
        });
    },

    findPrev: function() {
        this.withAceDo(function(ed) {
            ed.find({skipCurrent: true, backwards: true, needle: ed.$search.$options.needle});
        });
    },

    doBrowseImplementors: function(ed) {
        this.world().openMethodFinderFor(this.getSelectionOrLineString());
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
    },

    isScrollable: function() { return true; },

    stopScrollWhenBordersAreReached: function(evt) {
        // because of how ace scrolls internally these works a bit different to
        // the morphic #stopScrollWhenBordersAreReached
        var ed = this.aceEditor,
            renderer = ed.renderer;
        if (evt.wheelDeltaX) {/*...*/}
        if (evt.wheelDeltaY) {
            if (evt.wheelDeltaY > 0 && renderer.getFirstFullyVisibleRow() === 0) {
                evt.stop();
                return true;
            }
            var lineCount = ed.session.getScreenLength();
            if (evt.wheelDeltaY < 0 && renderer.getLastFullyVisibleRow() >= (lineCount-1)) {
                evt.stop();
                return true;
            }
        }
        return true;
    },

    scrollWithMouseWheelEvent: function (evt) {
        // the actual scrolling happens internally in ace
        // we just make sure that we don't "overscroll":
        this.stopScrollWhenBordersAreReached(evt);
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

    evalSelection: function(printIt) {
        var str = this.getSelectionOrLineString(),
            result = this.tryBoundEval(str);
        if (printIt) this.insertAtCursor(String(result), true);
        return result;
    },

    evalAll: function() {
        var str = this.textString, result = this.tryBoundEval(str);
        return result;
    },

    printObject: function(editor, obj) {
        var sel = editor.selection;
        sel && sel.clearSelection();
        var start = sel && sel.getCursor();
        editor.onPaste(String(obj));
        var end = start && sel.getCursor();
        if (start && end) {
            sel.moveCursorToPosition(start);
            sel.selectToPosition(end);
        }
    },

    doit: function(printResult, editor) {
        var text = this.getSelectionOrLineString(),
            result = this.tryBoundEval(text);
        if (printResult) {
            this.printObject(editor, result);
            return;
        }
        var sel = editor.selection;
        if (sel && sel.isEmpty()) {
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
            return [signature, function() {
                textMorph.focus();
                textMorph.clearSelection();
                textMorph.insertAtCursor(replacer, true);
            }];
        }
        pl.evalSelectionAndOpenListForProtocol();
    },

    doInspect: function() {
        var obj = this.evalSelection();
        if (obj) lively.morphic.inspect(obj);
    },
    printInspectMaxDepth: 2,


    printInspect: function() {
        this.withAceDo(function(ed) {
            var obj = this.evalSelection();
            this.printObject(ed, Objects.inspect(obj, this.printInspectMaxDepth));
        });
    },

    getDoitContext: function() { return this.doitContext || this; }

},
'text morph save content interface', {
    hasUnsavedChanges: function() {
        // return this.savedTextString !== this.textString;
        return false;
    }
},
'text morph event interface', {
    focus: function() { this.aceEditor.focus(); },
    isFocused: function() { return this._isFocused },
    requestKeyboardFocus: function(hand) { this.focus(); }
},
'text morph selection interface', {
    setSelectionRange: function(startIdx, endIdx) {
        this.withAceDo(function(ed) {
            var doc = ed.session.doc,
                start = doc.indexToPosition(startIdx),
                end = doc.indexToPosition(endIdx)
            ed.selection.setRange({start: start, end: end});
        });
    },

    getSelectionRange: function() {
        return this.withAceDo(function(ed) {
            var range = ed.selection.getRange(),
                doc = ed.session.doc;
            return [doc.positionToIndex(range.start), doc.positionToIndex(range.end)];
        });
    },

    selectAll: function() {
        this.withAceDo(function(ed) { ed.selectAll(); });
    },

    getSelectionOrLineString: function() {
        var editor = this.aceEditor, sel = editor.selection;
        if (!sel) return "";
        if (sel.isEmpty()) this.selectCurrentLine();
        var range =  editor.getSelectionRange();
        return editor.session.getTextRange(range);
    },
    selectCurrentLine: function() {
        this.withAceDo(function(ed) {
            var selStart = ed.selection.getSelectionAnchor();
            ed.navigateLineStart();
            var lineStartPos = ed.getCursorPosition();
            if (selStart.column === lineStartPos.column && selStart.row == lineStartPos.row) {
                // for switching between real line start and pos after spaces
                ed.navigateLineStart();
            }
            ed.selection.selectLineEnd();
        });
    },


    multiSelectNext: function() {
        this.multiSelect({backwards: false});
    },

    multiSelectPrev: function() {
        this.multiSelect({backwards: true});
    },

    multiSelect: function(options) {
        options = options || {};
        this.withAceDo(function(ed) {
            // if the text in the current selection matches the last search
            // use the last search string or regexp to add new selections.
            // Otherwise use the currently selected text as the new search
            // term
            var needle, lastSearch = this.getCurrentSearchTerm();
            if (!ed.selection.inMultiSelectMode && !ed.selection.isEmpty()) {
                var range = ed.selection.getRange();
                needle = ed.session.getTextRange(range);
            }
            if (!needle
              || needle === lastSearch
              || (Object.isRegExp(lastSearch) && lastSearch.test(needle))) {
                needle = lastSearch;
            }
            if (!needle) needle = '';
            var foundRange = ed.find({
                skipCurrent: true,
                backwards: options.backwards,
                needle: needle,
                preventScroll: true
            });
            ed.selection.addRange(foundRange);
        });
    }

},
'text morph syntax highlighter interface', {
    enableSyntaxHighlighting: function() { this.setTextMode('javascript'); },
    disableSyntaxHighlighting: function() { this.setTextMode('text'); }
},
'text morph interface', {

    set textString(string) {
        this.withAceDo(function(ed) {
            ed.selection.clearSelection();
            var pos = ed.getCursorPosition(),
                scroll = ed.session.getScrollTop();
            ed.session.doc.setValue(string);
            ed.selection.moveCursorToPosition(pos);
            ed.session.setScrollTop(scroll);
        });
        return string;
    },

    get textString() {
        return this.withAceDo(function(ed) {
            var doc = ed.getSession().getDocument();
            return doc.getValue();
        }) || "";
    },

    setTextString: function(string) { return this.textString = string; },

    getTextString: function(string) { return this.textString; },

    insertTextStringAt: function(index, string) { throw new Error('implement me'); },
    insertAtCursor: function(string, selectIt, overwriteSelection) {
        this.aceEditor.onPaste(string);
    },

    doSave: function() {
        this.savedTextString = this.textString;
        if (this.evalEnabled) {
            this.tryBoundEval(this.savedTextString);
        }
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

},
'rendering', {
    setClipMode: Functions.Null
},
'morph menu', {
    morphMenuItems: function($super) {
        var items = $super(), editor = this;

        var themeItems = lively.ide.ace.availableThemes().map(function(theme) {
            return [theme, function(evt) { editor.setTheme(theme); }] });

        var modeItems = lively.ide.ace.availableTextModes().map(function(mode) {
            return [mode, function(evt) { editor.setTextMode(mode); }] });

        items.push(["themes", themeItems]);
        items.push(["modes", modeItems]);

        var usesWrap = editor.aceEditor.session.getUseWrapMode();
        items.push(["line wrapping " + (usesWrap ? 'off' : 'on'), function() {
            editor.aceEditor.session.setUseWrapMode(!usesWrap);
        }]);

        return items;
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// use ace editor as workspace
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.morphic.World.addMethods(
'tools', {
    addCodeEditor: function(options) {
        options = Object.isString(options) ? {content: options} : {}; // convenience
        var bounds = (options.extent || lively.pt(500, 200)).extentAsRectangle(),
            title = options.title || 'Code editor',
            editor = new lively.morphic.CodeEditor(bounds, options.content || ''),
            pane = this.internalAddWindow(editor, options.title, options.position);;
        editor.applyStyle({resizeWidth: true, resizeHeight: true});
        editor.accessibleInInactiveWindow = true;
        editor.focus();
        return pane;
    },

    openWorkspace: lively.morphic.World.prototype.openWorkspace.wrap(function($proceed, evt) {
        if (!Config.get('useAceEditor')) { return $proceed(evt); }
        var window = this.addCodeEditor({
            title: "Workspace",
            content: "nothing",
            syntaxHighlighting: !0
        });
        return window;
    }),

    openObjectEditor: lively.morphic.World.prototype.openObjectEditor.wrap(function($proceed) {
        var objectEditor = $proceed(),
            textMorph = objectEditor.get('ObjectEditorScriptPane');
        if (!Config.get('useAceEditor') || textMorph.isAceEditor) return objectEditor;
        // FIXME!!!
        objectEditor.withAllSubmorphsDo(function(ea) { ea.setScale(1) });
        // replace the normal text morph of the object editor with a
        // CodeEditor
        var owner = textMorph.owner,
            textString = textMorph.textString,
            bounds = textMorph.bounds(),
            name = textMorph.getName(),
            objectEditorPane = textMorph.objectEditorPane,
            scripts = textMorph.scripts,
            codeMorph = new lively.morphic.CodeEditor(bounds, textString || '');

        lively.bindings.connect(codeMorph, 'textString',
                                owner.get('ChangeIndicator'), 'indicateUnsavedChanges');
        codeMorph.setName(name);
        codeMorph.objectEditorPane = objectEditorPane;
        codeMorph.applyStyle({resizeWidth: true, resizeHeight: true});
        codeMorph.accessibleInInactiveWindow = true;

        Functions.own(textMorph).forEach(function(scriptName) {
            textMorph[scriptName].asScriptOf(codeMorph);
        });

        codeMorph.addScript(function displayStatus(msg, color, delay) {
            if (!this.statusMorph) {
                this.statusMorph = new lively.morphic.Text(pt(100,25).extentAsRectangle());
                this.statusMorph.applyStyle({borderWidth: 1, strokeOpacity: 0, borderColor: Color.gray});
                this.statusMorph.setFill(this.owner.getFill());
                this.statusMorph.setFontSize(11);
                this.statusMorph.setAlign('center');
                this.statusMorph.setVerticalAlign('center');
            }
            this.statusMorph.setTextString(msg);
            this.statusMorph.centerAt(this.innerBounds().center());
            this.statusMorph.setTextColor(color || Color.black);
            this.addMorph(this.statusMorph);
            (function() { this.statusMorph.remove() }).bind(this).delay(delay || 2);
        });

        owner.addMorphBack(codeMorph);
        lively.bindings.disconnectAll(textMorph);
        textMorph.remove();
        owner.reset();
        return objectEditor;
    })
});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// ace support for lively.ide
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.morphic.CodeEditor.addMethods(
'deprecated interface', {
    innerMorph: function() { return this },
    showChangeClue: function() {},
    getVerticalScrollPosition: function() { },
    setVerticalScrollPosition: function(value) {}
},
'text compatibility', {
    highlightJavaScriptSyntax: Functions.Null
});

Object.extend(lively.ide, {
    newCodeEditor: function (initialBounds, defaultText) {
        var bounds = initialBounds.extent().extentAsRectangle(),
            text = new lively.morphic.CodeEditor(bounds, defaultText || '');
        text.accessibleInInactiveWindow = true;
        return text;
    }
});

var origBrowserPanelSpec = lively.ide.BasicBrowser.prototype.panelSpec;

lively.morphic.WindowedApp.subclass('lively.ide.BasicBrowser',
'settings', {
    get panelSpec() {
        if (!Config.get('useAceEditor')) return origBrowserPanelSpec;
        return [
            ['locationPane', newTextPane,                                                        [0,    0,    0.8,  0.03]],
            ['codeBaseDirBtn', function(bnds) { return new lively.morphic.Button(bnds) },        [0.8,  0,    0.12, 0.03]],
            ['localDirBtn', function(bnds) { return new lively.morphic.Button(bnds) },           [0.92, 0,    0.08, 0.03]],
            ['Pane1', newDragnDropListPane,                                                      [0,    0.03, 0.25, 0.37]],
            ['Pane2', newDragnDropListPane,                                                      [0.25, 0.03, 0.25, 0.37]],
            ['Pane3', newDragnDropListPane,                                                      [0.5,  0.03, 0.25, 0.37]],
            ['Pane4', newDragnDropListPane,                                                      [0.75, 0.03, 0.25, 0.37]],
            ['midResizer', function(bnds) { return new lively.morphic.HorizontalDivider(bnds) }, [0,    0.44, 1,    0.01]],
            ['sourcePane', lively.ide.newCodeEditor,                                             [0,    0.45, 1,    0.54]]
        ]
    }
});



}); // end of module
