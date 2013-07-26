module('lively.ide.CodeEditor').requires('lively.morphic', 'lively.ast.acorn').requiresLib({url: Config.codeBase + (false && lively.useMinifiedLibs ? 'lib/ace/lively-ace.min.js' : 'lib/ace/lively-ace.js'), loadTest: function() { return typeof ace !== 'undefined';}}).toRun(function() {

(function configureAce() {
    ace.config.set("workerPath", URL.codeBase.withFilename('lib/ace/').fullPath());
    // disable currently broken worker
    ace.require('ace/edit_session').EditSession.prototype.setUseWorker(false);
})();

lively.ide.ace = Object.extend(ace, {

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
});

lively.morphic.Shapes.External.subclass("lively.morphic.CodeEditorShape",
'settings', {
    // for now we do have a couple of optimizations in place that need the
    // shape to reference the aceEditor
    doNotSerialize: ["aceEditor"]
},
'intializing', {
    initialize: function($super) {
        var node = document.createElement('div');
        $super(node);
    }
},
'serialization', {

    onstore: function() {
        this.extent = this.getExtent();
    },

    onrestore: function() {
        this.shapeNode = document.createElement('div');
        lively.bindings.connect(this, 'aceEditor', this, 'setExtent', {
            removeAfterUpdate: true,
            converter: function(ed) { return this.targetObj.extent; }
        });
        lively.bindings.connect(this, 'aceEditor', this, 'setBorderWidth', {
            removeAfterUpdate: true,
            converter: function(ed) { return this.targetObj.getBorderWidth(); }
        });
    }
},
'HTML rendering', {

    getExtent: function($super) {
        return this.renderContextDispatch('getExtent') || this.extent || pt(0,0);
    },

    getExtentHTML: function ($super, ctx) {
        if (!this.aceEditor || !this._renderContext) return this.extent || $super(ctx);
        var borderW = this.getBorderWidth(),
            aceSize = this.aceEditor.renderer.$size;
        return lively.pt(aceSize.width + borderW, aceSize.height + borderW);
    },

    setExtentHTML: function (ctx, value) {
        if (!ctx.shapeNode) return undefined;
        var borderWidth = Math.floor(this.getBorderWidth()),
            realExtent = value.subXY(borderWidth, borderWidth).maxPt(lively.pt(0,0));
        ctx.domInterface.setExtent(ctx.shapeNode, realExtent);
        if (this.aceEditor) this.aceEditor.resize(true);
        return realExtent;
    }
});


lively.morphic.Morph.subclass('lively.morphic.CodeEditor',
'settings', {
    style: {
        enableGrabbing: false,
        fontSize: Config.get('defaultCodeFontSize'),
        gutter: Config.get('aceDefaultShowGutter'),
        textMode: Config.get('aceDefaultTextMode'),
        theme: Config.get('aceDefaultTheme'),
        lineWrapping: Config.get('aceDefaultLineWrapping'),
        invisibles: Config.get('aceDefaultShowInvisibles'),
        printMargin: Config.get('aceDefaultShowPrintMargin'),
        showActiveLine: Config.get('aceDefaultShowActiveLine'),
        showIndents: Config.get('aceDefaultShowIndents'),
        softTabs: Config.get('useSoftTabs'),
        autocompletion: Config.get('aceDefaultEnableAutocompletion')
    },
    doNotSerialize: ['aceEditor', 'aceEditorAfterSetupCallbacks', 'savedTextString'],
    evalEnabled: true,
    isAceEditor: true,
    isCodeEditor: true,
    connections: {textChange: {}, textString: {}, savedTextString: {}}
},
'initializing', {
    initialize: function($super, bounds, stringOrOptions) {
        var options = Object.isString(stringOrOptions) ?
                        {content: stringOrOptions} :
                        (stringOrOptions || {});
        $super(this.defaultShape());
        bounds = bounds || lively.rect(0,0,400,300);
        this.setBounds(bounds);
        this.textString = options.content || '';
        if (options.theme) this.setTheme(options.theme);
        if (options.textMode) this.setTextMode(options.textMode);
    },

    defaultShape: function() {
        return new lively.morphic.CodeEditorShape();
    },

    onOwnerChanged: function(newOwner) {
        if (newOwner) Functions.debounceNamed(
            this.id + ':onOwnerChanged:initializeAce',
            400, this.initializeAce.bind(this, true), true);
    }
},
'styling', {
    applyStyle: function ($super, spec) {
        if (!spec) return this;
        $super(spec);
        if (spec.allowInput !== undefined) this.setInputAllowed(spec.allowInput);
        if (spec.fontFamily !== undefined) this.setFontFamily(spec.fontFamily);
        if (spec.fontSize !== undefined) this.setFontSize(spec.fontSize);
        if (spec.textColor !== undefined) this.setTextColor(spec.textColor);
        // -----------
        if (spec.gutter !== undefined) this.setShowGutter(spec.gutter);
        if (spec.textMode !== undefined) this.setTextMode(spec.textMode);
        if (spec.theme !== undefined) this.setTheme(spec.theme);
        if (spec.lineWrapping !== undefined) this.setLineWrapping(spec.lineWrapping);
        if (spec.invisibles !== undefined) this.setShowInvisibles(spec.invisibles);
        if (spec.printMargin !== undefined) this.setShowPrintMargin(spec.printMargin);
        if (spec.showIndents !== undefined) this.setShowIndents(spec.showIndents);
        if (spec.showActiveLine !== undefined) this.setShowActiveLine(spec.showActiveLine);
        if (spec.softTabs !== undefined) this.setSoftTabs(spec.softTabs);
        if (spec.autocompletion !== undefined) this.setAutocompletionEnabled(spec.autocompletion);
        return this;
    }
},
'serialization', {
    onLoad: function() {
        this.initializeAce();
    },

    onstore: function($super, persistentCopy) {
        $super(persistentCopy);
        persistentCopy.storedTextString = this.textString;
    },

    onrestore: function($super) {
        $super();
        if (!this.storedTextString) return;
        // wait for ace to be initialized before throwing away the stored string
        // this way we can still return it in textString getter in the meantime
        this.withAceDo(function(ed) {
            this.textString = this.storedTextString;
            delete this.storedTextString;
        });
    }
},
'accessing', {
    getGrabShadow: function() { return null; }
},
'ace', {

    initializeAce: function(force) {
        var initializedEarlier = !!this.aceEditor;
        // 1) create ace editor object
        if (initializedEarlier && !force) return;
        var node = this.getShape().shapeNode,
            e = this.aceEditor || (this.aceEditor = ace.edit(node)),
            morph = this;
        e.$morph = this;
        if (!initializedEarlier) {
            e.on('focus', function() { morph._isFocused = true; });
            e.on('blur', function() { morph._isFocused = false; });
            e.showCommandLine = function(msg) {
                if (msg && msg.length) this.$morph.setStatusMessage(msg);
                else this.$morph.hideStatusMessage();
            };
            this.listenForDocumentChanges();
        }
        node.setAttribute('id', 'ace-editor');
        this.disableTextResizeOnZoom(e);

        // 2) let the shape know about the editor, this let's us do some optimizations
        this.getShape().aceEditor = e;
        // force resize when rendered, necessary in chrome
        this.whenOpenedInWorld(function() { e.resize.bind(e,true).delay(0.1); });

        // 3) set modes / themes
        lively.ide.CodeEditor.KeyboardShortcuts.defaultInstance().attach(this);
        this.setTextMode(this.getTextMode() || "");
        this.setTheme(this.getTheme() || '');
        this.setFontSize(this.getFontSize());
        this.setShowGutter(this.getShowGutter());
        this.setLineWrapping(this.getLineWrapping());
        this.setShowPrintMargin(this.getShowPrintMargin());
        this.setShowInvisibles(this.getShowInvisibles());
        this.setShowIndents(this.getShowIndents());
        this.setSoftTabs(this.getSoftTabs());
        this.setShowActiveLine(this.getShowActiveLine());
        this.setAutocompletionEnabled(this.getAutocompletionEnabled());
        this.setInputAllowed(this.inputAllowed());

        // 4) run after setup callbacks
        var cbs = this.aceEditorAfterSetupCallbacks;
        if (!cbs) return;
        dbgOn(
            this.aceEditorAfterSetupCallbacks === this.constructor.prototype.aceEditorAfterSetupCallbacks,
            'contagious aceEditorAfterSetupCallbacks bug occured');
        delete this.aceEditorAfterSetupCallbacks;
        cbs.invoke('call', this, e);
    },

    disableTextResizeOnZoom: function(aceEditor) {
        // FIXME!!!
        if (this.world() && this.world().getScale() === 1)
            aceEditor.renderer.updateFontSize();
        Global.clearInterval(aceEditor.renderer.$textLayer.$pollSizeChangesTimer);
    },

    listenForDocumentChanges: function(evt) {
        if (this._listenForDocumentChanges && evt.oldSession) {
            evt.oldSession.removeEventListener('change', this._onDocumentChange);
            delete this._onDocumentChange;
        }
        this._listenForDocumentChanges = this._listenForDocumentChanges || this.listenForDocumentChanges.bind(this);
        this._onDocumentChange = this._onDocumentChange || this.onDocumentChange.bind(this);
        this.withAceDo(function(ed) {
            ed.on('changeSession', this._listenForDocumentChanges);
            ed.on('changeMode', this._onDocumentChange);
            ed.session.on('change', this._onDocumentChange);
        });
    },

    onDocumentChange: function(evt) {
        var sess = this.aceEditor.session,
            changeHandler = sess.$changeHandler || (sess.$changeHandler = new lively.ide.CodeEditor.DocumentChangeHandler());
        changeHandler.onDocumentChangeResetDebounced(evt, this);
        changeHandler.onDocumentChangeDebounced(evt, this);
    },

    addCommands: function(commands) {
        var e = this.aceEditor,
            handler = e.commands,
            platform = handler.platform; // mac or win

        function lookupCommand(keySpec) {
            return keySpec.split('|').detect(function(keys) {
                var binding = e.commands.parseKeys(keys),
                    command = e.commands.findKeyCommand(binding.hashId, binding.key);
                return command && command.name;
            });
        }

        // first remove a keybinding if one already exists
        commands.forEach(function(cmd) {
            var keys = cmd.bindKey && (cmd.bindKey[platform] || cmd.bindKey),
                existing = keys && lookupCommand(keys);
            if (existing) handler.removeCommand(existing);
        });
        handler.addCommands(commands);
    },

    modifyCommand: function(cmdName, properties) {
        // modifies the implementation of a command but only for this
        // sepcific editor, not globally
        function augmentCommand(commands) {
            if (!commands || !commands.byName || !commands.byName[cmdName]) return;
            var cmd = Object.extend(Object.extend({}, commands.byName[cmdName]), properties);
            commands.byName[cmdName] = cmd;
            var ckb = commands.commmandKeyBinding;
            if (!cmd.bindKey || !commands.parseKeys || !ckb) return;
            if (typeof cmd.bindKey === 'object' && !commands.platform) return;
            var keySpec = typeof cmd.bindKey === 'object' ? cmd.bindKey[commands.platform] : cmd.bindKey;
            keySpec.split('|').forEach(function(keys) {
                debugger;
                var parsed = commands.parseKeys(keys),
                    cmdForKey = ckb[parsed.hashId] && ckb[parsed.hashId][parsed.key];
                if (cmdForKey) ckb[parsed.hashId][parsed.key] = cmd;
            });
        }
        this.withAceDo(function(ed) {
            augmentCommand(ed.commands);
            augmentCommand(ed.getKeyboardHandler().commands);
        });
    },

    getUniversalArgument: function() {
        // get numeric arg that is used for interactive commands
        return this.withAceDo(function(ed) {
            return ed.keyBinding.$data && ed.keyBinding.$data.count; }) || 0;
    },

    withAceDo: function(doFunc) {
        if (this.aceEditor) return doFunc.call(this, this.aceEditor);
        if (!this.hasOwnProperty('aceEditorAfterSetupCallbacks')) this.aceEditorAfterSetupCallbacks = [];
        this.aceEditorAfterSetupCallbacks.push(doFunc);
        return undefined;
    },

    withASTDo: function(func) {
        func = func || Functions.K;
        return this.withAceDo(function(ed) { return func(ed.session.$ast); });
    },

    loadAceModule: function(moduleName, callback) {
        return lively.ide.ace.require('./config').loadModule(moduleName, callback);
    },

    indexToPosition: function(absPos) { return this.getDocument().indexToPosition(absPos); },
    positionToIndex: function(pos) { return this.getDocument().positionToIndex(pos); },

    getSession: function(absPos) { return this.withAceDo(function(ed) { return ed.session; }); },

    getDocument: function(absPos) { return this.getSession().getDocument(); }

},
'ace interface', {
    setCursorPosition: function(pos) {
        return this.withAceDo(function(ed) {
            ed.selection.moveCursorToPosition({column: pos.x, row: pos.y}); });
    },

    getCursorPosition: function() {
        var pos = this.getCursorPositionAce();
        return lively.pt(pos.column, pos.row);
    },

    getCursorPositionAce: function() {
        return this.withAceDo(function(ed) {
            return ed.getCursorPosition(); });
    },

    getCursorPositionScreenAce: function() {
        return this.withAceDo(function(ed) {
            return ed.getCursorPositionScreen(); });
    },

    isAtDocumentEnd: function() {
        return this.withAceDo(function(ed) {
            var row = ed.session.doc.getLength() - 1,
                column = ed.session.doc.getLine(row).length,
                pos = ed.getCursorPosition();
            return row === pos.row && column === pos.column;
        });
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
        return this._Theme = themeName;
    },

    getTheme: function() {
        if (this._Theme) return this._Theme;
        return this.withAceDo(function(ed) {
            var theme = ed.getTheme() || '';
            return theme.replace('ace/theme/', '');
        }) || '';
    },

    setTextMode: function(modeString) {
        modeString = modeString || 'text';
        var parts = modeString.split(':'),
            modeName = parts[0], astType = parts[1] || null;
        this.withAceDo(function(ed) {
            ed.session.setMode(lively.ide.ace.moduleNameForTextMode(modeName));
            ed.session.getMode().astType = astType;
        });
        return this._TextMode = modeString;
    },

    getTextMode: function() {
        if (this._TextMode) return this._TextMode;
        return this.withAceDo(function(ed) {
            var mode = ed.session.getMode(),
                name = mode && mode.$id ? mode.$id : 'text';
            return name.replace('ace/mode/', '');
        }) || 'text';
    }

},
'snippets', {
    getSnippets: function() {
        return this.constructor.snippets || new lively.morphic.CodeEditorSnippets();
    }
},
'search and find', {

    searchWithPrompt: function() {
        var world = this.world();
        if (!world) return;
        this.withAceDo(function(ed) {
            // Note we should be able simply to pass in this.findFirst
            world.prompt('Enter text or regexp to search for.', function(input) {
                if (!input) { ed.focus(); return }
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

    emphasizeRegex: function(regEx, optStyle) {
        // Note the regex coming from the MethodFinder only provides for a single selection
        // if we want multiple selection, I believe we need to extract the original
        // search string from regEx, and then use:  search.match(/^\/(.*)\/$/),
        // as in searchWithPrompt
        this.withAceDo(function(ed) {
                ed.focus();
                ed.find({
                    needle: regEx,
                    preventScroll: false,
                    skipCurrent: true,
                    start: {column: 0, row: 0},
                    wrap: false,
                    animate: true
                });
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
    onMouseDownEntry: function($super, evt) {
        // ace installs a mouseup event handler on the document level and
        // stops the event so it never reaches our Morphic event handlers. To
        // still dispatch the event properly we install an additional mouseup
        // handler that is removed immediately thereafter
        var self = this;
        function upHandler(evt) {
            document.removeEventListener("mouseup", upHandler, true);
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            if (menuOpened) { evt.world.clickedOnMorph = null; evt.stop(); return true; }
            [self].concat(self.ownerChain()).reverse().forEach(function(ea) {
                ea.onMouseUpEntry(evt); });
        }
        document.addEventListener("mouseup", upHandler, true);
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var menuOpened = false;
        if (evt.isCtrlDown() || evt.isRightMouseButtonDown()) {
            lively.morphic.Menu.openAtHand('', this.codeEditorMenuItems());
            evt.world.clickedOnMorph = this; // to suppress drag since owner would be target
            evt.stop();
            return true;
        }
        return $super(evt);
    },

    isScrollable: function() { return true; },

    stopScrollWhenBordersAreReached: function(evt) {
        // because of how ace scrolls internally these works a bit different to
        // the morphic #stopScrollWhenBordersAreReached
        if (!this.isScrollable() || this.isInInactiveWindow()) return false;
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

    setScroll: function(x,y) {
        this.withAceDo(function(ed) {
            ed.session.setScrollLeft(x);
            ed.session.setScrollTop(y);
        });
    },

    getScroll: function(x,y) {
        return this.withAceDo(function(ed) {
            return [ed.session.getScrollLeft(), ed.session.getScrollTop()];
        });
    },
    scrollToRow: function(row) {
        return this.withAceDo(function(ed) { return ed.scrollToRow(row); })
    },

    doKeyCopy: Functions.Null,
    doKeyPaste: Functions.Null
},
'text morph eval interface', {

    tryBoundEval: function(string) {
        try {
            return this.boundEval(string);
        } catch(e) {
            return e;
        }
    },

    boundEval: function (__evalStatement) {
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var ctx = this.getDoitContext() || this,
            interactiveEval = function() {
                try { return eval("("+__evalStatement+")")} catch (e) { return eval(__evalStatement) }
                };
        return interactiveEval.call(ctx);
    },

    evalSelection: function(printIt) {
        var str = this.getSelectionOrLineString(),
            result = this.tryBoundEval(str);
        if (printIt) this.insertAtCursor(String(result), true);
        return result;
    },

    evalAll: function() {
        return this.saveExcursion(function(whenDone) {
            this.selectAll();
            var result = this.doit();
            whenDone();
            return result;
        });
    },

    printObject: function(editor, obj) {
        // inserts a stringified representation of object into editor
        // the current selection is cleared and the stringified representation
        // is inserted at the end (in terms of document position) of the current
        // selection (or at the cursor pos if no sel is active)
        function insert(ed) {
            var sel = ed.selection, range = sel.getRange();
            sel.moveCursorToPosition(range.end); sel.clearSelection();
            var string = obj instanceof Error ? obj.stack || obj : String(obj);
            ed.onPaste(string);
            sel.setRange(range.constructor.fromPoints(range.end, sel.getCursor()));
        }
        if (editor) insert(editor); else this.withAceDo(insert);
    },

    doit: function(printResult, editor) {
        var text = this.getSelectionMaybeInComment(),
            result = this.tryBoundEval(text);
        if (printResult) { this.printObject(editor, result); return; }
        if (result && result instanceof Error && lively.Config.get('showDoitErrorMessages') && this.world()) {
            this.world().alert(String(result));
        }
        var sel = this.getSelection();
        if (sel && sel.isEmpty()) sel.selectLine();
        return result;
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
        pl.evalSelectionAndOpenNarrower();
        this.clearSelection();
    },

    doInspect: function() {
        var obj = this.evalSelection();
        if (obj) lively.morphic.inspect(obj);
    },

    printInspectMaxDepth: 1,

    printInspect: function(options) {
        options = options || {};
        this.withAceDo(function(ed) {
            var obj = this.evalSelection();
            this.printObject(ed, Objects.inspect(obj, {maxDepth: options.depth || this.printInspectMaxDepth}));
        });
    },

    getDoitContext: function() { return this.doitContext || this; }

},
'text morph save content interface', {
    hasUnsavedChanges: function() {
        return this.savedTextString !== this.textString;
    }
},
'text morph event interface', {
    focus: function() { this.withAceDo(function(ed) { return ed.focus(); }); },
    isFocused: function() { return this._isFocused; },
    requestKeyboardFocus: function(hand) { this.focus(); },
    onWindowGetsFocus: function(window) { this.focus(); }
},
'text morph selection interface', {

    saveExcursion: function(doFunc) {
        var currentRange = this.getSelectionRangeAce(), self = this;
        function reset() { self.setSelectionRangeAce(currentRange); }
        return doFunc.call(this, reset);
    },

    getSelection: function() {
        return this.withAceDo(function(ed) { return ed.selection });
    },

    setSelectionRange: function(startIdx, endIdx) {
        var doc = this.getDocument(),
            start = doc.indexToPosition(startIdx),
            end = doc.indexToPosition(endIdx);
        this.getSelection().setRange({start: start, end: end});
    },

    getSelectionRange: function() {
        var range = this.getSelectionRangeAce(),
            doc = this.getDocument();
        return [doc.positionToIndex(range.start), doc.positionToIndex(range.end)];
    },

    getSelectionRangeAce: function() {
        return this.withAceDo(function(ed) { return ed.selection.getRange(); });
    },

    setSelectionRangeAce: function(range, reverse) {
        var Range = lively.ide.ace.require("ace/range").Range;
        if (!(range instanceof Range)) range = Range.fromPoints(range.start, range.end);
        return this.withAceDo(function(ed) { return ed.selection.setRange(range, reverse); });
    },

    getTextRange: function(range) {
        return this.getSession().getTextRange(range || this.getSelectionRangeAce());
    },

    selectAll: function() {
        this.withAceDo(function(ed) { ed.selectAll(); });
    },

    getSelectionOrLineString: function(optRange) {
        var range, editor = this.aceEditor;
        if (optRange) {
            range = optRange;
        } else {
            var sel = editor.selection;
            if (!sel) return "";
            if (sel.isEmpty()) this.selectCurrentLine();
            range =  editor.getSelectionRange();
        }
        return editor.session.getTextRange(range);
    },

    getSelectionMaybeInComment: function() {
    /*   If you click to the right of '//' in the following...
    'wrong' // 'try this'.slice(4)  //should print 'this'
    'http://zork'.slice(7)          //should print 'zork'
    */
        // If click is in comment, just select that part
        var range = this.getSelectionRangeAce(),
            isNullSelection = range.isEmpty(),
            pos = range.start,
            text = this.getSelectionOrLineString();
        if (!isNullSelection) return text;

        // text now equals the text of the current line, now look for JS comment
        var idx = text.indexOf('//');
        if (idx === -1                          // Didn't find '//' comment
            || pos.column < idx                 // the click was before the comment
            || (idx>0 && (':"'+"'").indexOf(text[idx-1]) >=0)    // weird cases
            ) return text;

        // Select and return the text between the comment slashes and end of method
        range.start.column = idx+2; range.end.column = text.length;
        this.setSelectionRangeAce(range)
        return text.slice(idx+2);
    },

    selectCurrentLine: function(reverse) {
        var pos = this.getCursorPositionAce(),
            sel = this.getSelection(),
            range = sel.getLineRange(pos.row, true/*exclude last char*/);
        if (range.isEqual(sel.getRange())) {
            // toggle between line selection including starting spaces and
            // line selection without starting spaces
            sel.moveCursorLineStart()
            range.setStart(sel.getCursor());
        }
        sel.setSelectionRange(range, reverse);
    },
    selectAndCenterLine: function(line) {
        this.withAceDo(function(ed) {
            ed.clearSelection();
            ed.selection.moveCursorTo(line, 0);
            ed.centerSelection();
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
    },
    addFloatingAnnotation: function(range) {
        var Range = lively.ide.ace.require('ace/range').Range,
            ann = {
                doNotSerialize: ['start', 'end'],
                isAttached: false,
                persistentRange: {start: range.start, end: range.end},
                editor: this,
                attach: function() {
                    if (this.isAttached) this.detach();
                    this.setRange(this.persistentRange);
                    this.isAttached = true;
                    return this;
                },
                detach: function() {
                    this.isAttached = false;
                    this.start && this.start.detach();
                    this.end && this.end.detach();
                    return this;
                },
                getRange: function() {
                    return Range.fromPoints(this.start, this.end);
                },
                setRange: function(range) {
                    var self = this;
                    this.editor.withAceDo(function(ed) {
                        self.start && self.start.detach();
                        self.start = ed.session.doc.createAnchor(range.start);
                        self.end && self.end.detach();
                        self.end = ed.session.doc.createAnchor(range.end);
                    });
                },
                getTextString: function() {
                    return this.editor.getSelectionOrLineString(this.getRange());
                },
                replace: function(string) {
                    if (!this.isAttached) return this;
                    var self = this, range = this.getRange();
                    this.editor.withAceDo(function(ed) {
                        var newEnd = ed.session.replace(range, string);
                        self.setRange({start: range.start, end: newEnd});
                    });
                }
            };
        return ann.attach();
    },

    addOrRemoveEvalMarker: function(evt) {
        var range = this.getSelectionRangeAce();
        return range.isEmpty() ? this.removeEvalMarker() : this.addEvalMarker();
    },

    addEvalMarker: function() {
        var range = this.getSelectionRangeAce();
        if (range.isEmpty()) return;
        var marker = lively.morphic.CodeEditorEvalMarker.setCurrentMarker(this, range);
        marker.evalAndInsert();
    },

    removeEvalMarker: function() {
        if (lively.morphic.CodeEditorEvalMarker.currentMarker)
            lively.morphic.CodeEditorEvalMarker.currentMarker.detach();
        return;
    }
},
'text morph syntax highlighter interface', {
    enableSyntaxHighlighting: function() { this.setTextMode('javascript'); },
    disableSyntaxHighlighting: function() { this.setTextMode('text'); }
},
'text morph interface', {

    set textString(string) {
        string = String(string);
        if (!this.aceEditor) this.storedString = string;
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
        var result = this.withAceDo(function(ed) { return ed.getValue(); });
        return typeof result === 'undefined' ? this.storedString || '' : result;
    },

    setTextString: function(string) { return this.textString = string; },

    getTextString: function(string) { return this.textString; },

    insertTextStringAt: function(indexOrPos, string) {
        this.withAceDo(function(ed) {
            var pos = indexOrPos;
            if (Object.isNumber(pos)) pos = this.indexToPosition(pos);
            if (!pos) pos = ed.getCursorPosition();
            ed.session.insert(pos, string);
        });
    },
    insertAtCursor: function(string, selectIt, overwriteSelection) {
        this.withAceDo(function(ed) { ed.onPaste(string) });
    },

    doSave: function() {
        this.savedTextString = this.textString;
        if (this.evalEnabled) {
            this.tryBoundEval(this.savedTextString);
        }
    },
    clear: function() {
        this.textString = '';
    },


    setFontSize: function(size) {
        this.withAceDo(function(ed) { ed.setOption("fontSize", size); });
        return this._FontSize = size;
    },

    getFontSize: function() {
        if (this._FontSize) return this._FontSize;
        return this.withAceDo(function(ed) { return ed.getOption("fontSize"); })
            || Config.get("defaultCodeFontSize");
    },

    setFontFamily: function(fontName) {
        this.getShape().shapeNode.style.fontFamily = fontName;
        return this._FontFamily = fontName;
    },

    getFontFamily: function() { return this._FontFamily; },

    inputAllowed: function() { return this.allowInput === undefined || !!this.allowInput; },
    setInputAllowed: function(bool) {
        this.withAceDo(function(ed) { return ed.setOption('readOnly', !bool); });
        return this.allowInput = bool;
    },

    enableGutter: function() { this.setShowGutter(true); },
    disableGutter: function() { this.setShowGutter(false); },
    setShowGutter: function(bool) {
        // FIXME rksm 07/07/13 ace init issue: when setting gutter before
        // editor is rendered it will not show up correctly
        this.whenOpenedInWorld(function() {
            this.withAceDo(function(ed) { ed.renderer.setShowGutter(bool); }); });
        return this._ShowGutter = bool;
    },
    getShowGutter: function(bool) {
        if (this.hasOwnProperty('_ShowGutter')) return this._ShowGutter;
        return this.withAceDo(function(ed) { return ed.renderer.getShowGutter(); });
    },

    getLineWrapping: function() {
        return this.hasOwnProperty("_LineWrapping") ? this._LineWrapping : this.withAceDo(function(ed) {
            return ed.getOption('wrap'); });
    },
    setLineWrapping: function(value) {
        // value can either be a bool or "printMargin" or a number specifying the wrap limit
        this.whenOpenedInWorld(function() {
            this.withAceDo(function(ed) { ed.setOption('wrap', value); }); });
        return this._LineWrapping = value;
    },

    setShowInvisibles: function(bool) {
        this.withAceDo(function(ed) { ed.setShowInvisibles(bool); });
        return this._ShowInvisibles = bool;
    },
    getShowInvisibles: function() {
        return this.hasOwnProperty("_ShowInvisibles") ? this._ShowInvisibles : this.withAceDo(function(ed) {
            return ed.getShowInvisibles(); });
    },

    setShowPrintMargin: function(bool) {
        this.withAceDo(function(ed) { ed.setShowPrintMargin(bool); });
        return this._ShowPrintMargin = bool;
    },
    getShowPrintMargin: function() {
        return this.hasOwnProperty("_ShowPrintMargin") ? this._ShowPrintMargin : this.withAceDo(function(ed) {
            return ed.getShowPrintMargin(); });
    },

    setShowIndents: function(bool) {
        this.withAceDo(function(ed) { ed.setDisplayIndentGuides(bool); });
        return this._ShowIndents = bool;
    },
    getShowIndents: function() {
        return this.hasOwnProperty("_ShowIndents") ? this._ShowIndents : this.withAceDo(function(ed) {
            return ed.getDisplayIndentGuides(); });
    },

    setShowActiveLine: function(bool) {
        this.withAceDo(function(ed) { ed.setHighlightActiveLine(bool); });
        return this._ShowActiveLine = bool;
    },
    getShowActiveLine: function() {
        return this.hasOwnProperty("_ShowActiveLine") ? this._ShowActiveLine : this.withAceDo(function(ed) {
            return ed.getHighlightActiveLine(); });
    },

    setSoftTabs: function(bool) {
        this.withAceDo(function(ed) { ed.session.setUseSoftTabs(bool); });
        return this._SoftTabs = bool;
    },
    getSoftTabs: function() {
        return this.hasOwnProperty("_SoftTabs") ? this._SoftTabs : this.withAceDo(function(ed) {
            return ed.session.getUseSoftTabs(); });
    },

    setAutocompletionEnabled: function(bool) {
        this.withAceDo(function(ed) { ed.setOption("enableBasicAutocompletion", bool); });
        return this._AutocompletionEnabled = bool;
    },
    getAutocompletionEnabled: function() {
        return this.hasOwnProperty("_AutocompletionEnabled") ? this._AutocompletionEnabled : this.withAceDo(function(ed) {
            return ed.getOption("enableBasicAutocompletion"); });
    }

},
'text morph replacement', {
    replaceTextMorph: function(oldEditor) {
        var newEditor = this;
        Functions.own(oldEditor).forEach(function(name) { newEditor.addScript(oldEditor[name]); })
        newEditor.name = oldEditor.name;
        oldEditor.owner.addMorph(newEditor);
        oldEditor.remove();
    }
},
'rendering', {
    setClipMode: Functions.Null
},
'morph menu', {
    codeEditorMenuItems: function() {
        var editor = this, items = [], self = this, world = this.world(),
            range = this.getSelectionRangeAce();

        // eval marker
        var evalMarkerItems = ['Eval marker', []];
        items.push(evalMarkerItems);
        if (!range.isEmpty()) {
            evalMarkerItems[1].push(['Mark expression', function() {
                self.addEvalMarker(); }]);
        }
        evalMarkerItems[1].push(['Remove eval marker', function() {
            self.removeEvalMarker(); }]);

        var marker = lively.morphic.CodeEditorEvalMarker.currentMarker;
        if (marker) {
            if (marker.doesContinousEval()) {
                evalMarkerItems[1].push(['Disable eval interval', function() {
                    marker.stopContinousEval();
                }]);
            } else {
                evalMarkerItems[1].push(['Set eval interval', function() {
                    world.prompt('Please enter the interval time in milliseconds', function(input) {
                        input = Number(input);
                        marker.startContinousEval(input);
                        self.evalMarkerDelay = input || null;
                    }, '200');
                }]);
            }
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // themes
        var currentTheme = this.getTheme(),
            themeItems = lively.ide.ace.availableThemes().map(function(theme) {
            var themeString = Strings.format('[%s] %s',
                                             theme === currentTheme ? 'X' : ' ',
                                             theme);
            return [themeString, function(evt) { editor.setTheme(theme); }]; });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // text modes
        var currentTextMode = this.getTextMode(),
            modeItems = lively.ide.ace.availableTextModes().map(function(mode) {
                var modeString = Strings.format('[%s] %s',
                                                 mode === currentTextMode ? 'X' : ' ',
                                                 mode);
                return [modeString, function(evt) { editor.setTextMode(mode); }]; });

        items.push(["themes", themeItems]);
        items.push(["modes", modeItems]);

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        [{name: "ShowGutter", menuString: "show line numbers"},
         {name: "ShowInvisibles", menuString: "show whitespace"},
         {name: "ShowPrintMargin", menuString: "show print margin"},
         {name: "ShowActiveLine", menuString: "show active line"},
         {name: "ShowIndents", menuString: "show indents"},
         {name: "SoftTabs", menuString: "use soft tabs"},
         {name: "LineWrapping", menuString: "line wrapping"}].forEach(function(itemSpec) {
            var enabled = editor["get"+itemSpec.name]();
            items.push([Strings.format("[%s] " + itemSpec.menuString, enabled ? 'X' : ' '), function() {
                editor['set'+itemSpec.name](!enabled); }]);
        });

        return items;
    },
    morphMenuItems: function($super) {
        return $super().concat([['CodeEditor...', this.codeEditorMenuItems()]]);
    }
},
'messaging', {
    setStatusMessage: function (msg, color, delay) {
        console.log("%s status: %s", this, msg)
        var world = this.world();
        if (!world) return;
        var sm = this._statusMorph;
        if (!sm) {
            this._statusMorph = sm = new lively.morphic.Text(this.getExtent().withY(80).extentAsRectangle());
            sm.applyStyle({
                borderWidth: 0, borderRadius: 6,
                fill: Color.gray.lighter(),
                fontSize: this.getFontSize() + 1,
                fixedWidth: true, fixedHeight: false
            });
            sm.isEpiMorph = true;
            this._sm = sm;
        }
        sm.textString = msg;
        sm.ignoreEvents();
        world.addMorph(sm);
        sm.applyStyle({
            textColor: color || Color.black,
            position: this.worldPoint(this.innerBounds().bottomLeft()),
        });
        sm.fit();
        (function() {
            var world = sm.world(), visibleBounds = world.visibleBounds(),
                overlapY = sm.bounds().bottom() - visibleBounds.bottom();
            if (overlapY > 0) sm.moveBy(pt(0, -overlapY));
        }).delay(0);
        if (!sm.removeDebounced) sm.removeDebounced = Functions.debounce(1000*(delay||4), sm.remove.bind(sm));
        sm.removeDebounced();
    },
    hideStatusMessage: function () {
        if (this._statusMorph && this._statusMorph.owner) this._statusMorph.remove();
    },
    showError: function (e, offset) {
        this.setStatusMessage(String(e), Color.red);
    }
});

Object.subclass('lively.morphic.CodeEditorSnippets',
'initializing', {
    initialize: function() {}
},
'snippet management', {
    readSnippetsFromURL: function(url) {
        var source = new URL(url).asWebResource().beSync().get().content;
        return this.addSnippetsFromSource(source);
    },
    addSnippetsFromSource: function(source) {
        // FIXME only tabs accepted?
        source = source.replace(/    /g, "\t");
        var snippets = this.getSnippetManager().parseSnippetFile(source);
        return this.getSnippetManager().register(snippets, "javascript");
    },
    getSnippetManager: function() {
        return lively.ide.ace.require("ace/snippets").snippetManager;
    }
});

(function setupSnippets() {
    var snippets = lively.morphic.CodeEditor.snippets;
    if (snippets) return;
    snippets = lively.morphic.CodeEditor.snippets = new lively.morphic.CodeEditorSnippets();
    snippets.readSnippetsFromURL(URL.codeBase.withFilename('lively/ide/snippets/javascript.snippets'));
})();

(function setupCompletions() {
    if (UserAgent.isNodejs) return;

    function wordsFromFiles(next) {
        Functions.forkInWorker(
            function(whenDone, options) {
                module('lively.lang.Closure').load();
                module('lively.ide.CommandLineInterface').load();
                function wordsFromFiles(next) {
                    var files = lively.ide.CommandLineSearch.findFiles('*js', {sync:true}),
                        livelyJSFiles = files.grep('core/'),
                        urls = livelyJSFiles.map(function(fn) { return URL.root.withFilename(fn).withRelativePartsResolved(); }),
                        splitRegex = /[^a-zA-Z_0-9\$\-]+/,
                        parseTimes = {},
                        words = Global.words = {};
                    urls.forEach(function(url) {
                        var t1 = new Date(),
                            content = url.asWebResource().get().content,
                            wordsInFile = content.split(splitRegex);
                        wordsInFile.forEach(function(word) {
                            if (word.length === 0) return;
                            var first = word[0].toLowerCase();
                            if (!words[first]) words[first] = {};
                            if (!words[first][word]) words[first][word] = 0;
                            words[first][word]++;
                        });
                        parseTimes[url] = (new Date() - t1);
                    });
                    next(words);
                }
        
                try {
                    wordsFromFiles(function(words) { whenDone(null, words); });
                } catch(e) { whenDone(e.stack, null); }
            }, {args: [], whenDone: function(err, result) { if (err) show(err); else Global.words = result; next(); }
        });
    }

    function installCompleter(next) {
        lively.ide.WordCompleter = {};
        lively.ide.ace.require('ace/ext/language_tools').addCompleter(lively.ide.WordCompleter);
        Object.extend(lively.ide.WordCompleter, {
            getCompletions: function(editor, session, pos, prefix, callback) {
                if (prefix.length === 0) { callback(null, []); return }
                var startLetter = prefix[0].toLowerCase(),
                    wordList = words[startLetter], result = [];
                for (var word in wordList) {
                    if (word.lastIndexOf(prefix, 0) !== 0) continue;
                    result.push({
                        name: word,
                        value: word,
                        score: wordList[word],
                        meta: "lively"
                    });
                }
                callback(null, result);
            }
        });
        next();
    }

    function done(next) { alertOK('Word completion installed!'); next(); }

    [wordsFromFiles, installCompleter, done].doAndContinue()
})();

Object.subclass('lively.morphic.CodeEditorEvalMarker',
'initialization', {
    initialize: function(codeEditor, range) {
        this.annotation = codeEditor.addFloatingAnnotation(range);
        this.originalExpression = this.annotation.getTextString();
    },
    detach: function() {
        this.stopContinousEval();
        this.restoreText();
        this.annotation.detach();
        return this;
    },
    attach: function() { this.annotation.attach(); return this; },
    restoreText: function() {
        if (this.getTextString() !== this.getOriginalExpression())
            this.annotation.replace(this.getOriginalExpression());
    }
},
'accessing', {
    get textString() { return this.getTextString(); },
    set textString(string) { return this.annotation.replace(string); },

    getTextString: function() {
        return this.annotation.getTextString();
    },
    getOriginalExpression: function() {
        return this.originalExpression;
    }
},
'evaluation', {
    evaluateOriginalExpression: function() {
        console.log('EvalMarker evaluating %s' + this.getOriginalExpression());
        var ed = this.annotation.editor;
        try {
            Global.marker = this;
            return ed.boundEval(this.getOriginalExpression() || '');
        } catch(e) { return e;
        } finally { delete Global.marker; }
    },

    evalAndInsert: function() {
        var self = this, delay = this.annotation.editor.evalMarkerDelay;
        function doEval() {
            var result = self.evaluateOriginalExpression();
            self.annotation.replace(String(result));
            return result;
        }
        return delay ? doEval.delay(delay/1000) : doEval();
    },

    stopContinousEval: function() {
        Global.clearInterval(this.stepInterval);
        delete this.stepInterval;
    },

    startContinousEval: function(time) {
        this.stopContinousEval();
        var ed = this.annotation.editor;
        this.stepInterval = Global.setInterval(this.evalAndInsert.bind(this), time || 500);
    },

    doesContinousEval: function() { return !!this.stepInterval; }
});

Object.extend(lively.morphic.CodeEditorEvalMarker, {
    updateLastMarker: function() {
        this.currentMarker && this.currentMarker.evalAndInsert();
    },
    setCurrentMarker: function(editor, range) {
        if (this.currentMarker) this.currentMarker.detach();
        return this.currentMarker = new this(editor, range);
    }
});

(function installEvalMarkerKeyHandler() {
    lively.morphic.Events.GlobalEvents.unregister('keydown', "evalMarkerKeyHandler");
    lively.morphic.Events.GlobalEvents.register('keydown', function evalMarkerKeyHandler(evt) {
        var keys = evt.getKeyString();
        if (keys === 'Command-Shift-M' || keys === "Control-Shift-M") {
            var focused = lively.morphic.Morph.prototype.focusedMorph();
            if (!focused || !focused.isAceEditor) return false;
            focused.addOrRemoveEvalMarker(evt);
            evt.stop(); return true;
        }
        if (keys === 'Command-M' || keys === 'Control-M') {
            lively.morphic.CodeEditorEvalMarker.updateLastMarker();
            evt.stop(); return true;
        }
        return false;
    });
})();

// -=-=-=-=-=-=-=-=-=
// keyboard shortcuts
// -=-=-=-=-=-=-=-=-=

Object.subclass('lively.ide.CodeEditor.KeyboardShortcuts',
'initialization', {
    attach: function(codeEditor) {
        var self = this;
        codeEditor.withAceDo(function(ed) {
            var kbd = ed.getKeyboardHandler();
            if (kbd.hasLivelyKeys) return;
            self.setupEvalBindings(kbd);
            self.setupTextManipulationBindings(kbd);
            self.setupSelectionAndNavigationBindings(kbd);
            self.setupSearchBindings(kbd);
            self.setupMultiSelectBindings(kbd);
            self.setupEditorConfigBindings(kbd);
            self.setupInputLineBindings(kbd);
            self.setupSnippetBindings(kbd);
            self.setupASTNavigation(kbd);
            self.setupUsefulHelperBindings(kbd);
            self.setupUserKeyBindings(kbd, codeEditor);
            kbd.hasLivelyKeys = true;
        });
    },

    addCommands: function(kbd, commands) {
        var platform = kbd.platform; // mac or win

        function lookupCommand(keySpec) {
            return keySpec.split('|').detect(function(keys) {
                var binding = kbd.parseKeys(keys),
                    command = kbd.findKeyCommand(binding.hashId, binding.key);
                return command && command.name;
            });
        }

        // first remove a keybinding if one already exists
        commands.forEach(function(cmd) {
            var keys = cmd.bindKey && (cmd.bindKey[platform] || cmd.bindKey),
                existing = keys && lookupCommand(keys);
            if (existing) kbd.removeCommand(existing);
        });
        kbd.addCommands(commands);
    },

    morphBinding: function(cmdName, args) {
        return function(ed) { return ed.$morph[cmdName].apply(ed.$morph, args); }
    }

},
"accessing", {
    allCommandsOf: function(codeEditor) {
        return codeEditor.withAceDo(function(ed) {
            return Object.merge(ed.keyBinding.$handlers.pluck('commands')); });
    },
    lookupCommand: function(codeEditor, keySpec) {
        return codeEditor.withAceDo(function(ed) {
            var handler = ed.commands,
                binding = handler.parseKeys(keySpec),
                command = handler.findKeyCommand(binding.hashId, binding.key);
            if (!command) return null;
            if (!command.hasOwnProperty('toString')) {
                command.toString = function() { return '[cmd:' + command.name + ']' }
            }
            return command;
        });
    }
},
'shortcuts', {
    setupEvalBindings: function(kbd) {
        function doEval(ed, insertResult) {
            // FIXME this should go into the modes or use at least
            // double dispatch...
            switch (ed.$morph.getTextMode()) {
                case 'sh':
                    lively.ide.commands.exec('lively.ide.execShellCommand', ed.$morph, {
                        insert: insertResult,
                        count: 4,
                        shellCommand: ed.$morph.getSelectionOrLineString()
                    });
                    break;
                default:
                    ed.$morph.doit(insertResult);
            }
        }
        this.addCommands(kbd, [{
                name: 'evalAll',
                exec: function(ed) { ed.$morph.evalAll(); },
                readOnly: true
            }, {
                name: 'doit',
                bindKey: {win: 'Ctrl-D',  mac: 'Command-D'},
                exec: function(ed) { doEval(ed, false); },
                multiSelectAction: "forEach",
                readOnly: true // false if this command should not apply in readOnly mode
            }, {
                name: 'printit',
                bindKey: {win: 'Ctrl-P',  mac: 'Command-P'},
                exec: function(ed) { doEval(ed, true); },
                multiSelectAction: "forEach",
                readOnly: false
            }, {
                name: 'list protocol',
                bindKey: {win: 'Ctrl-Shift-P',  mac: 'Command-Shift-P'},
                exec: this.morphBinding("doListProtocol"),
                multiSelectAction: "single",
                readOnly: false
            }, {
                name: 'doSave',
                bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
                exec: this.morphBinding("doSave"),
                multiSelectAction: "single",
                readOnly: false
            }, {
                name: 'printInspect',
                bindKey: {win: 'Ctrl-I',  mac: 'Command-I'},
                exec: function(ed, args) {
                    ed.$morph.printInspect({depth: args && args.count});
                },
                multiSelectAction: "forEach",
                handlesCount: true,
                readOnly: true
            }, {
                name: 'doInspect',
                bindKey: {win: 'Ctrl-Shift-I',  mac: 'Command-Shift-I'},
                exec: this.morphBinding("doInspect"),
                multiSelectAction: "forEach",
                readOnly: true
            }, { // shell eval
                name: 'runShellCommand',
                exec: function(ed, args) {
                    lively.ide.commands.exec('lively.ide.execShellCommand', ed.$morph, args);
                },
                handlesCount: true
            }, {
                name: 'runShellCommandOnRegion',
                exec: function(ed, args) {
                    var input = ed.$morph.getSelectionOrLineString();
                    if (!input || input.length === 0) {
                        show('Nothing to input into command, aborting...'); return; }
                    $world.prompt('Enter shell command to run on region.', function(cmdString) {
                        if (!cmdString) { show('No command entered, aborting...!'); return; }
                        lively.shell.run(cmdString, {stdin: input}, function(cmd) {
                            ed.session.replace(ed.selection.getRange(), cmd.resultString(true));
                        });
                    })
                },
                multiSelectAction: 'forEach',
                handlesCount: true
            }])
    },

    setupTextManipulationBindings: function(kbd) {
        this.addCommands(kbd, [{
                name: 'removeSelectionOrLine',
                bindKey: {win: 'Ctrl-X', mac: 'Command-X'},
                exec: function(ed) {
                    var sel = ed.selection;
                    if (sel.isEmpty()) { sel.selectLine(); }
                    // let a normal "cut" to the clipboard happen
                    return false;
                },
                multiSelectAction: function(ed) {
                    var sel = ed.selection;
                    // for all cursors: if range is empty select line
                    sel.getAllRanges().forEach(function(range) {
                        if (!range.isEmpty())  return;
                        var row = range.start.row,
                            lineRange = sel.getLineRange(row, true);
                        sel.addRange(lineRange);
                    });
                    // let a normal "cut" to the clipboard happen
                    ed.execCommand('cut');
                    return false;
                },
                readOnly: false
            }, {
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
            },{
                name: "blockoutdent",
                bindKey: {win: "Ctrl-[", mac: "Command-["},
                exec: function(ed) { ed.blockOutdent(); },
                multiSelectAction: "forEach"
            }, {
                name: "blockindent",
                bindKey: {win: "Ctrl-]", mac: "Command-]"},
                exec: function(ed) { ed.blockIndent(); },
                multiSelectAction: "forEach"
            }, {
                name: "fitTextToColumn",
                bindKey: "Alt-Q",
                handlesCount: true,
                exec: function(ed, args) {
                    // Takes a selection or the current line and will insert line breaks so
                    // that all selected lines are not longer than printMarginColumn or the
                    // specified count parameter. Breaks at word bounds.
                    if (args && args.count === 4/*Ctrl-U*/) { ed.execCommand('joinLines'); return; }
                    if (ed.selection.isEmpty()) ed.$morph.selectCurrentLine();
                    var col = args && args.count || ed.getOption('printMarginColumn') || 80,
                        rows = ed.$getSelectedRows(),
                        session = ed.session,
                        range = ed.selection.getRange(),
                        lines = [],
                        splitRegex = /[^a-zA-Z_0-9\$\-]+/g,
                        rest = '';
                    for (var i = rows.first; i <= rows.last; i++) {
                        var line = session.getLine(i), isEmptyLine = line.trim() === '';
                        line = (rest + ' ' + line).trim(); rest = '';
                        if (line.length <= col) { lines.push(line); if (isEmptyLine && line !== '') lines.push(''); continue; }
                        while (line.length > col) {
                            var firstChunk = line.slice(0, col) ,lastWordSplit = col;
                            firstChunk.replace(splitRegex, function(match, idx) { lastWordSplit = idx; });
                            var firstChunkWithWordBoundary = firstChunk.slice(0, lastWordSplit);
                            lines.push(firstChunkWithWordBoundary);
                            line = (firstChunk.slice(lastWordSplit) + line.slice(col)).trimLeft();
                        }
                        if (isEmptyLine) lines.push('');
                        rest = line.trim();
                    }
                    if (rest !== '') lines.push(rest);
                    var formattedText = lines.join('\n');
                    ed.session.replace(range, formattedText);
                },
                multiSelectAction: "forEach"
            }, {
                name: "joinLines",
                exec: function(ed, args) {
                    if (ed.selection.isEmpty()) return;
                    var rows = ed.$getSelectedRows(),
                        range = ed.selection.getRange(),
                        wholeText = ed.session.getTextRange(range);
                    ed.session.replace(range, wholeText.split('\n').join(' '));
                },
                multiSelectAction: "forEach"
            }, {
                name: "cleanupWhitespace",
                exec: function(ed, args) {
                    var prevPos, sel = ed.selection;
                    if (sel.isEmpty()) { prevPos = ed.getCursorPosition(); ed.$morph.selectAll();}
                    var range = sel.getRange(),
                        wholeText = ed.session.getTextRange(range);
                    ed.session.replace(range, wholeText.split('\n').invoke('replace', /\s+$/, '').join('\n'));
                    if (prevPos) { sel.clearSelection(); sel.moveCursorToPosition(prevPos); }
                },
                multiSelectAction: "forEach"
            }]);
    },

    setupSelectionAndNavigationBindings: function(kbd) {
        this.addCommands(kbd, [{
                name: 'clearSelection',
                bindKey: 'Escape',
                exec: this.morphBinding("clearSelection"),
                readOnly: true
            }, {
                name: 'selectLine',
                bindKey: {win: "Ctrl-L", mac: "Command-L"},
                exec: this.morphBinding("selectCurrentLine"),
                multiSelectAction: 'forEach',
                readOnly: true
            }, {
                name: 'moveForwardToMatching',
                bindKey: {win: 'Ctrl-Right',  mac: 'Command-Right'},
                exec: this.morphBinding("moveForwardToMatching", [false]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'moveBackwardToMatching',
                bindKey: {win: 'Ctrl-Left',  mac: 'Command-Left'},
                exec: this.morphBinding("moveBackwardToMatching", [false]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'selectToMatchingForward',
                bindKey: {win: 'Ctrl-Shift-Right',  mac: 'Command-Shift-Right'},
                exec: this.morphBinding("moveForwardToMatching", [true]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'selectToMatchingBackward',
                bindKey: {win: 'Ctrl-Shift-Left',  mac: 'Command-Shift-Left'},
                exec: this.morphBinding("moveBackwardToMatching", [true]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "selecttolinestart",
                bindKey: 'Shift-Home|Ctrl-Shift-A',
                exec: function(ed) { ed.getSelection().selectLineStart(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "gotolinestart",
                bindKey: {win: "Home", mac: "Home|Ctrl-A"},
                exec: function(ed) { ed.navigateLineStart(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "selecttolineend",
                bindKey: "Shift-End|Ctrl-Shift-E",
                exec: function(ed) { ed.getSelection().selectLineEnd(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "gotolineend",
                bindKey: "End|Ctrl-E",
                exec: function(ed) { ed.navigateLineEnd(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "selectAllLikeThis",
                bindKey: "Ctrl-Shift-/",
                exec: function(ed) {
                    ed.pushEmacsMark && ed.pushEmacsMark(ed.getCursorPosition());
                    ed.findAll(ed.$morph.getTextRange()); },
                readOnly: true
            }]);
    },

    setupSearchBindings: function(kbd) {
        this.addCommands(kbd, [{
                name: "searchWithPrompt",
                bindKey: {win: "Ctrl-F", mac: "Command-F"},
                exec: function(ed) { ed.$morph.searchWithPrompt(); },
                readOnly: true
            }, {
                name: "findnext",
                bindKey: {win: "Ctrl-K", mac: "Command-G"},
                exec: function(ed) { ed.$morph.findNext(); },
                readOnly: true
            }, {
                name: "findprevious",
                bindKey: {win: "Ctrl-Shift-K", mac: "Command-Shift-G"},
                exec: function(ed) { ed.$morph.findPrev(); },
                readOnly: true
            }, {
                name: 'doBrowseAtPointOrRegion',
                bindKey: {win: "Alt-.", mac: "Alt-."},
                exec: function(ed) {
                    lively.ide.CommandLineSearch.doBrowseAtPointOrRegion(ed.$morph);
                },
                multiSelectAction: 'forEach'
            }, {
                name: 'doCommandLineSearch',
                bindKey: {win: "Alt-/", mac: "Alt-/"},
                exec: function(ed) {
                    lively.ide.CommandLineSearch.doGrepFromWorkspace(ed.$morph.getSelectionOrLineString());
                },
                multiSelectAction: 'forEach'
            }, {
                name: 'doBrowseImplementors',
                bindKey: {win: 'Ctrl-Shift-F', mac: 'Command-Shift-F'},
                exec: function(ed) { ed.$morph.doBrowseImplementors(); },
                readOnly: true
            }]);
    },

    setupMultiSelectBindings: function(kbd) {
        this.addCommands(kbd, [{
                name: "multiSelectNext",
                bindKey: "Ctrl-Shift-.",
                exec: function(ed) { ed.$morph.multiSelectNext(); },
                readOnly: true
            }, {
                name: "multiSelectPrev",
                bindKey: "Ctrl-Shift-,",
                exec: function(ed) { ed.$morph.multiSelectPrev(); },
                readOnly: true
            }]);
    },

    setupEditorConfigBindings: function(kbd) {
            this.addCommands(kbd, [{
                name: 'increasefontsize',
                bindKey: {win: "Ctrl-»", mac: "Command-»"},
                exec: function(ed) { ed.$morph.setFontSize(ed.$morph.getFontSize() + 1); },
                readOnly: true
            }, {
                name: 'decreasefontsize',
                bindKey: {win: "Ctrl-½", mac: "Command-½"},
                exec: function(ed) { ed.$morph.setFontSize(ed.$morph.getFontSize() - 1); },
                readOnly: true
            }, {
                name: 'changeTextMode',
                exec: function(ed) {
                    var codeEditor = ed.$morph, currentTextMode = codeEditor.getTextMode();
                    lively.ide.tools.SelectionNarrowing.getNarrower({
                        name: 'lively.ide.CodeEditor.TextMode.NarrowingList',
                        input: '',
                        spec: {
                            prompt: 'choose mode: ',
                            candidates: lively.ide.ace.availableTextModes().map(function(mode) {
                                return {
                                    string: Strings.format('[%s] %s', mode === currentTextMode ? 'X' : ' ', mode),
                                    value: mode, isListItem: true };
                            }),
                            actions: [function(mode) { codeEditor.setTextMode(mode); }]
                        }
                    })
                    return true;
                },
                handlesCount: true
            }]);
    },

    setupInputLineBindings: function(kbd) {
        this.addCommands(kbd, [{
                name: 'linebreak',
                exec: function(ed) { cmdLine.insert("\n"); }
            }, {
                name: 'entercommand',
                exec: function(ed) {
                    if (ed.$morph.commandLineInput) {
                        ed.$morph.commandLineInput(ed.getValue());
                    } else {
                        lively.morphic.show('CommandLine should implement #commandLineInput');
                    }
                }
            }]);
    },

    setupSnippetBindings: function(kbd) {
        this.addCommands(kbd, [{
            bindKey: 'Tab',
            name: 'expandSnippetOrDoTab',
            exec: function(ed) {
                var success = ed.$morph.getSnippets().getSnippetManager().expandWithTab(ed);
                if (!success)
                    ed.execCommand("indent");
            },
            multiSelectAction: "forEach"
        }]);
    },

    setupASTNavigation: function(kbd) {
        function move(selector, codeEditor) {
            var pos = codeEditor.getSelection().lead,
                idx = codeEditor.positionToIndex(pos),
                nav = new lively.ide.CodeEditor.JS.Navigator(),
                newIdx = nav[selector](codeEditor.textString, idx),
                newPos = codeEditor.indexToPosition(newIdx);
            codeEditor.getSelection().moveCursorToPosition(newPos);
        }
        function select(selector, codeEditor) {
            var nav = new lively.ide.CodeEditor.JS.Navigator(),
                newRangeIndices = nav[selector](codeEditor.textString, codeEditor.getSelectionRange());
            if (newRangeIndices) codeEditor.setSelectionRange(newRangeIndices[0], newRangeIndices[1]);
        }

        kbd.addCommands([{
            name: 'forwardSexp',
            bindKey: 'Ctrl-Alt-f|Ctrl-Alt-Right',
            exec: function(ed) {
                move('forwardSexp', ed.$morph);
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }, {
            name: 'backwardSexp',
            bindKey: 'Ctrl-Alt-b|Ctrl-Alt-Left',
            exec: function(ed) {
                move('backwardSexp', ed.$morph);
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }, {
            name: 'backwardUpSexp',
            bindKey: 'Ctrl-Alt-u|Ctrl-Alt-Up',
            exec: function(ed) {
                ed.pushEmacsMark(ed.getCursorPosition());
                move('backwardUpSexp', ed.$morph);
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }, {
            name: 'forwardDownSexp',
            bindKey: 'Ctrl-Alt-d|Ctrl-Alt-Down',
            exec: function(ed) {
                ed.pushEmacsMark(ed.getCursorPosition());
                move('forwardDownSexp', ed.$morph);
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }, {
            name: 'markDefun',
            bindKey: 'Ctrl-Alt-h',
            exec: function(ed) {
                ed.pushEmacsMark(ed.getCursorPosition());
                select('rangeForFunctionOrDefinition', ed.$morph);
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }, {
            name: 'expandRegion',
            bindKey: {win: 'Shift-Ctrl-E', mac: 'Shift-Command-Space'},
            exec: function(ed) {
                ed.$morph.withASTDo(function(ast) {
                    var state = ed.$expandRegionState || (ed.$expandRegionState = {range: ed.$morph.getSelectionRange()});
                    var nav = new lively.ide.CodeEditor.JS.RangeExpander();
                    var newState = nav.expandRegion(ed.$morph.textString, ast, state);
                    if (newState && newState.range) {
                        ed.$morph.setSelectionRange(newState.range[0], newState.range[1]);
                        ed.$expandRegionState = newState;
                    }
                    ed.selection.once('changeCursor', function(evt) { ed.$expandRegionState = null; });
                });
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }, {
            name: 'contractRegion',
            bindKey: {win: 'Shift-Ctrl-S', mac: 'Shift-Ctrl-Space'},
            exec: function(ed) {
                ed.$morph.withASTDo(function(ast) {
                    var state = ed.$expandRegionState;
                    if (!state) return;
                    var nav = new lively.ide.CodeEditor.JS.RangeExpander();
                    var newState = nav.contractRegion(ed.$morph.textString, ast, state);
                    if (newState && newState.range) {
                        ed.$morph.setSelectionRange(newState.range[0], newState.range[1]);
                        ed.$expandRegionState = newState;
                    }
                    ed.selection.once('changeCursor', function(evt) { ed.$expandRegionState = null; });
                });
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }, {
            name: 'gotoNextError',
            bindKey: 'Ctrl-`',
            exec: function(ed) {
                ed.$morph.withASTDo(function(ast) {
                    var pos = ed.$morph.indexToPosition(ast.parseError.pos);
                    ed.$morph.setCursorPosition(pos);
                });
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }]);

        // kbd.bindKeys({"C-M-f": {command: 'forwardSexp'}});
        // kbd.bindKeys({"C-M-b": {command: 'backwardSexp'}});
        // kbd.bindKeys({"C-M-u": {command: 'backwardUpSexp'}});
        // kbd.bindKeys({"C-M-d": {command: 'forwardDownSexp'}});
        // kbd.bindKeys({"C-M-h": {command: 'markDefun'}});
        // kbd.bindKeys({"S-CMD-space": {command: 'expandRegion'}});
        // kbd.bindKeys({"C-CMD-space": {command: 'contractRegion'}});
    },

    setupUsefulHelperBindings: function(kbd) {
        kbd.addCommands([{
            name: 'insertDate',
            exec: function(ed, args) {
                var dateString = args && args.count ?
                    new Date().format('isoDate')/*short*/ :
                    new Date().format('mediumDate')/*long*/;
                ed.onPaste(dateString);
            },
            multiSelectAction: 'forEach',
            handlesCount: true
        }]);
    },

    setupUserKeyBindings: function(kbd, codeEditor) {
        var c = lively.Config;
        if (!Object.isFunction(c.codeEditorUserKeySetup)) return;
        c.codeEditorUserKeySetup(codeEditor, kbd);
        var invalidaterInstalled = c.attributeConnections && c.attributeConnections.any(function(con) {
            return con.targetMethodName === 'reinitKeyBindingsForAllOpenEditors' });
        if (invalidaterInstalled) return;
        // force update existing editors when #codeEditorUserKeySetup changes:
        var shortcuts = lively.ide.CodeEditor.KeyboardShortcuts;
        lively.bindings.connect(c, 'codeEditorUserKeySetup', shortcuts, 'reinitKeyBindingsForAllOpenEditors', {
            forceAttributeConnection: true});
    }

});

Object.extend(lively.ide.CodeEditor.KeyboardShortcuts, {
    defaultInstance: function() {
        return this._instance || (this._instance = new this());
    },
    reinitKeyBindingsForAllOpenEditors: function() {
        lively.morphic.World.current().withAllSubmorphsDo(function(ea) { /*reinit codeeditor key bindings*/
            ea.isCodeEditor && ea.withAceDo(function(ed) {
                ed.getKeyboardHandler().hasLivelyKeys = false;
                lively.ide.CodeEditor.KeyboardShortcuts.defaultInstance().attach(ea);
            });
        });
    }
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
    emphasize: Functions.Null,
    emphasizeAll: Functions.Null,
    unEmphasizeAll: Functions.Null,
    emphasizeRegex: Functions.Null,
    emphasizeRange: Functions.Null,
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

(function toolingPatches() {
    require('lively.morphic.Widgets').toRun(function() {
        lively.morphic.World.addMethods(
        'tools', {
            addCodeEditor: function(options) {
                options = Object.isString(options) ? {content: options} : (options || {}); // convenience
                var bounds = (options.extent || lively.pt(500, 200)).extentAsRectangle(),
                    title = options.title || 'Code editor',
                    editor = new lively.morphic.CodeEditor(bounds, options.content || ''),
                    pane = this.internalAddWindow(editor, options.title, options.position);
                if (Object.isString(options.position)) delete options.position;
                editor.applyStyle({resizeWidth: true, resizeHeight: true});
                editor.accessibleInInactiveWindow = true;
                editor.applyStyle(options);
                editor.focus();
                return pane;
            },

            openWorkspace: lively.morphic.World.prototype.openWorkspace.wrap(function($proceed, evt) {
                if (!Config.get('useAceEditor')) { return $proceed(evt); }
                var window = this.addCodeEditor({
                    title: "Workspace",
                    content: "3 + 4",
                    syntaxHighlighting: true,
                    theme: Config.aceWorkspaceTheme
                });
                window.owner.comeForward();
                window.selectAll();
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

                objectEditor.targetMorph.addScript(function onWindowGetsFocus() {
                    this.get('ObjectEditorScriptPane').focus();
                });

                objectEditor.addScript(function onKeyDown(evt) {
                    var sig = evt.getKeyString(),
                        scriptList = this.get('ObjectEditorScriptList'),
                        sourcePane = this.get('ObjectEditorScriptPane');
                    switch(sig) {
                        case 'F1': scriptList.focus(); evt.stop(); return true;
                        case 'F2': sourcePane.focus(); evt.stop(); return true;
                        default: $super(evt);
                    }
                });

                owner.addMorphBack(codeMorph);
                lively.bindings.disconnectAll(textMorph);
                textMorph.remove();
                owner.reset();
                objectEditor.comeForward();
                return objectEditor;
            }),

            openStyleEditorFor: lively.morphic.World.prototype.openStyleEditorFor.getOriginal().wrap(function(proceed, morph, evt) {
                var editor = proceed(morph,evt);
                if (Config.get('useAceEditor')) {
                    var oldEditor = editor.get("CSSCodePane"),
                        newEditor = new lively.morphic.CodeEditor(oldEditor.bounds(), oldEditor.textString);
                    newEditor.applyStyle({
                        fontSize: Config.get('defaultCodeFontSize')-1,
                        gutter: false,
                        textMode: 'css',
                        lineWrapping: false,
                        printMargin: false,
                        resizeWidth: true, resizeHeight: true
                    });
                    lively.bindings.connect(newEditor, "savedTextString", oldEditor.get("CSSApplyButton"), "onFire");
                    newEditor.replaceTextMorph(oldEditor);
                }
                editor.comeForward();
                return editor;
            }),

            openWorldCSSEditor: function () {
                var editor = this.openPartItem('WorldCSS', 'PartsBin/Tools');
                if (Config.get('useAceEditor')) {
                    var oldEditor = editor.get("CSSCodePane"),
                        newEditor = new lively.morphic.CodeEditor(oldEditor.bounds(), oldEditor.textString);
                    newEditor.applyStyle({
                        fontSize: Config.get('defaultCodeFontSize')-1,
                        gutter: false,
                        textMode: 'css',
                        lineWrapping: false,
                        printMargin: false,
                        resizeWidth: true, resizeHeight: true
                    });
                    lively.bindings.connect(newEditor, "savedTextString", oldEditor.get("WorldCSS"), "applyWorldCSS", {});
                    newEditor.replaceTextMorph(oldEditor);
                }
                editor.comeForward();
                return editor;
            },

            openPartItem: lively.morphic.World.prototype.openPartItem.getOriginal().wrap(function($proceed, name, partsbinCat) {
                var part = $proceed(name, partsbinCat);
                if (!Config.get('useAceEditor')) { return part; }
                if (name === 'MethodFinderPane' && partsbinCat === 'PartsBin/Dialogs') {
                    var oldEditor = part.get("sourceText"),
                        newEditor = new lively.morphic.CodeEditor(oldEditor.bounds(), oldEditor.textString);
                    newEditor.applyStyle({
                        resizeWidth: true, resizeHeight: true
                    });
                    newEditor.replaceTextMorph(oldEditor);
                }
                return part;
            }),

        });
    });
})();

}); // end of module
