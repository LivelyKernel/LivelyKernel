module('lively.ide.CodeEditor').requires('lively.morphic', 'lively.ide.codeeditor.ace', 'lively.ide.codeeditor.DocumentChange', 'lively.ide.codeeditor.JS', 'lively.ide.codeeditor.Keyboard', 'lively.ide.codeeditor.EvalMarker', 'lively.ide.codeeditor.Snippets', 'lively.ide.codeeditor.Modes').toRun(function() {

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
        enableGrabbing: false, enableDropping: false,
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
        tabSize: Config.get('defaultTabSize'),
        autocompletion: Config.get('aceDefaultEnableAutocompletion'),
        showWarnings: Config.get('aceDefaultShowWarnings'),
        showErrors: Config.get('aceDefaultShowErrors')
    },
    doNotSerialize: ['_aceInitialized', 'aceEditor', 'aceEditorAfterSetupCallbacks', 'savedTextString'],
    _aceInitialized: false,
    evalEnabled: true,
    isAceEditor: true,
    isCodeEditor: true,
    showsMorphMenu: true,
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

},
'styling', {
    applyStyle: function ($super, spec) {
        if (!spec) return this;
        $super(spec);
        if (spec.allowInput !== undefined)     this.setInputAllowed(spec.allowInput);
        if (spec.fontFamily !== undefined)     this.setFontFamily(spec.fontFamily);
        if (spec.fontSize !== undefined)       this.setFontSize(spec.fontSize);
        if (spec.textColor !== undefined)      this.setTextColor(spec.textColor);
        // -----------
        if (spec.gutter !== undefined)         this.setShowGutter(spec.gutter);
        if (spec.textMode !== undefined)       this.setTextMode(spec.textMode);
        if (spec.theme !== undefined)          this.setTheme(spec.theme);
        if (spec.lineWrapping !== undefined)   this.setLineWrapping(spec.lineWrapping);
        if (spec.invisibles !== undefined)     this.setShowInvisibles(spec.invisibles);
        if (spec.printMargin !== undefined)    this.setShowPrintMargin(spec.printMargin);
        if (spec.showIndents !== undefined)    this.setShowIndents(spec.showIndents);
        if (spec.showActiveLine !== undefined) this.setShowActiveLine(spec.showActiveLine);
        if (spec.softTabs !== undefined)       this.setSoftTabs(spec.softTabs);
        if (spec.autocompletion !== undefined) this.setAutocompletionEnabled(spec.autocompletion);
        if (spec.showWarnings !== undefined)   this.setShowWarnings(spec.showWarnings);
        if (spec.showErrors !== undefined)     this.setShowErrors(spec.showErrors);
        if (spec.tabSize !== undefined)        this.setTabSize(spec.tabSize);
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
        var initializedEarlier = this._aceInitialized;
        if (initializedEarlier) return;
        // 1) create ace editor object
        this._aceInitialized = true;
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
        this.setTabSize(this.getTabSize());
        this.setShowActiveLine(this.getShowActiveLine());
        this.setAutocompletionEnabled(this.getAutocompletionEnabled());
        this.initializeAutoTriggerAutocompletion();
        this.setShowWarnings(this.getShowWarnings());
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


    stopListenForDocumentChanges: function(evt) {
        if (this._listenForDocumentChanges && evt.oldSession) {
            evt.oldSession.removeEventListener('change', this._onDocumentChange);
            delete this._onDocumentChange;
        }
    },

    listenForDocumentChanges: function(evt) {
        this.stopListenForDocumentChanges(evt);
        this._listenForDocumentChanges = this._listenForDocumentChanges || this.listenForDocumentChanges.bind(this);
        this._onDocumentChange = this._onDocumentChange || this.onDocumentChange.bind(this);
        this._onModeChange = this._onModeChange || this.onModeChange.bind(this);
        this._onSelectionChange = this._onSelectionChange || this.onSelectionChange.bind(this);
        this.withAceDo(function(ed) {
            ed.on('changeSession', this._listenForDocumentChanges);
            ed.on('changeMode', this._onModeChange);
            ed.on('changeSelection', this._onSelectionChange);
            ed.session.on('change', this._onDocumentChange);
        });
    },

    ensureChangeHandler: function() {
        var sess = this.aceEditor.session;
        return sess.$changeHandler || (sess.$changeHandler =
            lively.ide.CodeEditor.DocumentChangeHandler.create());
    },

    onDocumentChange: function(evt) {
        var changeH = this.ensureChangeHandler();
        changeH.onDocumentChangeResetDebounced(evt, this);
        changeH.onDocumentChangeDebounced(evt, this);
    },
    onSelectionChange: function(evt) {
        var changeH = this.ensureChangeHandler();
        changeH.onSelectionChangeDebounced(evt, this);
    },


    onModeChange: function(evt) {
        var changeH = this.ensureChangeHandler();
        changeH.onModeChangeDebounced(evt, this);
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
            var ckb = commands.commandKeyBinding;
            if (!cmd.bindKey || !commands.parseKeys || !ckb) return;
            if (typeof cmd.bindKey === 'object' && !commands.platform) return;
            var keySpec = typeof cmd.bindKey === 'object' ? cmd.bindKey[commands.platform] : cmd.bindKey;
            keySpec.split('|').forEach(function(keys) {
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

    createRange: function(start, end) {
        return lively.ide.ace.require("ace/range").Range.fromPoints(start, end);
    },

    getTextStartPosition: function() {
        return this.getSession().screenToDocumentPosition(0,0);
    },

    getTextEndPosition: function() {
        return this.getSession().screenToDocumentPosition(Number.MAX_VALUE, Number.MAX_VALUE);
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

    clearSelection: function() {
        this.withAceDo(function(ed) {
            if (ed.inMultiSelectMode) ed.exitMultiSelectMode();
            else ed.clearSelection();
        });
    },

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
            ed.session.$astType = astType;
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
    },
    getTextModeNoExtension: function() {
        // FIXME this returns the name of the current text mode without Lively
        // additions that are appended via :xyz
        return this.getTextMode().split(':')[0];
    },

    showsCompleter: function() {
        return this.withAceDo(function(ed) {
            return ed.completer && ed.completer.activated; })
    },

    initializeAutoTriggerAutocompletion: function() {
        this.setAutoTriggerAutocompletionEnabled(Config.get('aceDefaultAutoTriggerAutocompletion'));
        var editor = this.aceEditor;
        var _this = this;
        editor.commands.on("afterExec", function(e){
            if (_this.getAutoTriggerAutocompletionEnabled()) {
                if (e.command.name == "insertstring" && /^[\w.]$/.test(e.args)) {
                    editor.execCommand("startAutocomplete")
                }
            }
        })
    }

},
'thing at point', {
    wordAtPoint: function() {
        var range = this.wordRangeAtPoint();
        return range ? this.getTextRange(range) : '';
    },
    wordRangeAtPoint: function() {
        return this.withAceDo(function(ed) {
            var p = ed.getCursorPosition();
            return ed.session.getWordRange(p.row, p.column);
        });
    },
    tokenAt: function(pos/*ace pos or null*/) {
        // that.tokenAt()
        return this.withAceDo(function(ed) {
            pos = pos || ed.getCursorPosition();
            return ed.session.getTokenAt(pos.row, pos.column); });
    },
    tokenAtPoint: function() { return this.tokenAt(null); },
    tokensInRange: function(range/*range or null for sel range*/) {
        // if no range given current selection range is used.
        // takes the range and returns all tokens in that range
        // (tokens from aceEditor.sesssion.getTokens()
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        return this.withAceDo(function(ed) {
            range = range || ed.selection.getRange();
            return tokensInRangeTrimmed(ed, range);
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function tokensInRange(ed, range) {
            // aceEditor -> {start: {column, row}, end: {column, row}} -> [[TOKEN]]
            if (range.isEmpty()) return [[ed.session.getTokenAt(range.start.row, range.start.column)]];
            var row1 = Math.min(range.start.row, range.end.row);
            var row2 = Math.max(range.start.row, range.end.row);
            return Array.range(row1, row2).map(function(row) { return ed.session.getTokens(row); });
        }
        function takeTokensBetween(startColumn, endColumn, tokens) {
            // including
            // Maybe Integer -> Maybe Integer -> [TOKENS]
            if (!tokens) return [];
            return tokens.reduce(function(akk, token) {
                var startCol = akk.currentCol,
                    endCol = startCol + token.value.length;
                akk.currentCol = endCol;
                if ((startColumn === undefined || endCol >= startColumn)
                 && (endColumn === undefined || startCol <= endColumn)) akk.tokens.push(token);
                return akk;
            }, {tokens: [], currentCol: 0}).tokens;
        }
        function tokensInRangeTrimmed(ed, range) {
            // aceEditor -> {start: {row, column}, end: {row, column}} -> [TOKEN]
            var tokensPerRow = tokensInRange(ed, range);
            if (!tokensPerRow || !tokensPerRow.length) return [];
            var startCol = range.start.column, endCol = range.end.column;
            if (tokensPerRow.length == 1) return takeTokensBetween(startCol, endCol, tokensPerRow[0]);
            return [takeTokensBetween(startCol, undefined, tokensPerRow[0])]
                .concat(tokensPerRow.slice(1,-1))
                .concat(takeTokensBetween(undefined, endCol, tokensPerRow.last())).flatten();
        }
    }
},
'snippets', {
    getSnippets: function() {
        return this.constructor.snippets || new lively.morphic.CodeEditorSnippets();
    },
    withSnippetsForCurrentModeDo: function(doFunc) {
        this.getSnippets().withSnippetsForEditorDo(this, doFunc.bind(this));
    },
    insertSnippetNamedAt: function(snippetName, pos) {
        this.getSnippets().insertNamed(this, snippetName, pos);
    },
},
'search and find', {

    find: function(options) {
        if (!options || !options.needle) return;
        options.backwards = options.hasOwnProperty("backwards") ? options.backwards : false;
        options.preventScroll = options.hasOwnProperty("preventScroll") ? options.preventScroll : false;
        return this.withAceDo(function(ed) {
            var start = options.inbetween && ed.getCursorPosition();
            var range = ed.find(options);
            if (!range) return null;
            if (!options.inbetween) return options.asString ?
                ed.session.getTextRange(range) : range;
            var end = options.backwards ? range.start : range.end,
                betweenRange = range.constructor.fromPoints(
                    options.backwards ? end : start, options.backwards ? start: end);
            return options.asString ?
                ed.session.getTextRange(betweenRange) : betweenRange;
        });
    },

    searchWithPrompt: function() {
        var self = this;
        require('lively.ide.tools.SearchPrompt').toRun(function() {
            lively.BuildSpec("lively.ide.tools.SearchPrompt").createMorph().openForCodeEditor(self);
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
        this.world().openMethodFinderFor(this.getSelectionOrLineString(), '__implementor');
    },
    doBrowseSenders: function() {
        this.world().openMethodFinderFor(this.getSelectionOrLineString(), '__sender')
    },


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
            evt.world.clickedOnMorph = evt.getTargetMorph();
            [self].concat(self.ownerChain()).reverse().forEach(function(ea) {
                ea.onMouseUpEntry(evt); });
        }
        document.addEventListener("mouseup", upHandler, true);
        evt.world.clickedOnMorph = this;
        return $super(evt);
    },

    isScrollable: function() { return true; },

    stopScrollWhenBordersAreReached: function(evt) {
        // because of how ace scrolls internally these works a bit different to
        // the morphic #stopScrollWhenBordersAreReached
        if (!this.isScrollable() || this.isInInactiveWindow()) return false;
        var ed = this.aceEditor, renderer = ed.renderer;
        if (evt.wheelDeltaX) {/*...*/}
        if (evt.wheelDeltaY) {
            if (evt.wheelDeltaY > 0 && renderer.getFirstFullyVisibleRow() === 0) {
                evt.stop(); return true;
            }
            var lineCount = ed.session.getScreenLength();
            if (evt.wheelDeltaY < 0 && renderer.getLastFullyVisibleRow() >= (lineCount-1)) {
                evt.stop(); return true;
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

    onFocus: function($super, evt) {
        $super(evt);
        var scroll = evt.world.getScroll();
        (function() { evt.world.scrollTo(scroll[0], scroll[1]); }).delay(0);
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
            str,
            interactiveEval = function() {
                try { return eval(str = "("+__evalStatement+")")} catch (e) { return eval(str = __evalStatement) }
                };
        try {
            var result = interactiveEval.call(ctx);
            if (Config.changesetsExperiment && $world.getUserName() && 
        localStorage.getItem("LivelyChangesets:" +  $world.getUserName() + ":" + location.pathname) !== "off")
                lively.ChangeSet.logDoit(str, ctx.lvContextPath());
            return result;
        } catch(e) {throw e}
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

    printObject: function(editor, obj, suppressSelection) {
        // inserts a stringified representation of object into editor
        // the current selection is cleared and the stringified representation
        // is inserted at the end (in terms of document position) of the current
        // selection (or at the cursor pos if no sel is active)
        function printError(err) {
            var string = String(err.stack || err);
            return string.include(err) ? string : err + '\n' + string;
        }
        function insert(ed) {
            self.collapseSelection('end');
            var string;
            try {
                string = obj instanceof Error ? printError(obj) : String(obj);
            } catch (e) { string = printError(e); }
            ed.onPaste(string);
            if (!suppressSelection) self.extendSelectionRange(-string.length);
        }
        var self = this;
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
        pl.evalSelectionAndOpenNarrower();
    },

    doInspect: function() {
        lively.morphic.inspect(this.evalSelection());
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
    focus: function() {
        if (this.aceEditor) this.aceEditor.focus();
        else this.withAceDo(function(ed) { return ed.focus.bind(ed).delay(0); });
    },
    isFocused: function() { return this._isFocused; },
    requestKeyboardFocus: function(hand) { this.focus(); },
    onWindowGetsFocus: function(window) { this.focus(); }
},
'text morph selection interface', {

    saveExcursion: function(doFunc) {
        // will remember the current selection. doFunc can change the
        // selection, cursor position etc and then invoke the passed in callback
        // `reset` to undo those changes
        var currentRange = this.getSelectionRangeAce(), self = this;
        function reset() { self.setSelectionRangeAce(currentRange); }
        return doFunc.call(this, reset);
    },

    getSelection: function() {
        return this.withAceDo(function(ed) { return ed.selection });
    },

    setSelectionRange: function(startIdx, endIdx) {
        this.withAceDo(function(aceEditor) {
            var doc = aceEditor.session.doc,
                start = doc.indexToPosition(startIdx),
                end = doc.indexToPosition(endIdx);
            aceEditor.selection.setRange({start: start, end: end});
        });
    },

    extendSelectionRange: function(delta) {
        if (!delta) return;
        var dir = delta > 0 ? 'end' : 'start',
            range = this.getSelectionRangeAce(),
            idx = this.positionToIndex(range[dir]),
            extendPos = this.indexToPosition(idx + delta),
            extendedRange = this.getSelectionRangeAce().extend(extendPos.row, extendPos.column);
        this.setSelectionRangeAce(extendedRange);
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

    getSelectionOrWordString: function() {
        var sel = this.getSelection();
        if (!sel) return "";
        if (sel.isEmpty()) return this.wordAtPoint();
        return this.getTextRange();
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

    collapseSelection: function(dir) {
        // dir = 'start' || 'end'
        var sel = this.getSelection(), range = sel.getRange();
        dir && sel.moveCursorToPosition(range[dir]);
        sel.clearSelection();
    }

},
'annotations and markers', {
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

    append: function(string) {
        this.withAceDo(function(ed) {
            var doc = ed.session.doc;
            var lastRow = doc.getLength() - 1;
            var col = doc.getLine(lastRow).length;
            ed.session.insert({row: lastRow, column: col}, String(string));
        });
    },

    replace: function(range, text) {
        return this.withAceDo(function(ed) {
            return ed.session.replace(range, text);
        });
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

    getTabSize: function() {
        return this.withAceDo(function(ed) { return ed.session.getTabSize(); });
    },
    setTabSize: function(tabSize) {
        return this.withAceDo(function(ed) { return ed.session.setTabSize(tabSize); });
    },

    setAutocompletionEnabled: function(bool) {
        this.withAceDo(function(ed) { ed.setOption("enableBasicAutocompletion", bool); });
        return this._AutocompletionEnabled = bool;
    },
    getAutocompletionEnabled: function() {
        return this.hasOwnProperty("_AutocompletionEnabled") ? this._AutocompletionEnabled : this.withAceDo(function(ed) {
            return ed.getOption("enableBasicAutocompletion"); });
    },
    setAutoTriggerAutocompletionEnabled: function(bool) {
        this._AutoTriggerAutocompletionEnabled = bool;
    },
    getAutoTriggerAutocompletionEnabled: function() {
        return this._AutoTriggerAutocompletionEnabled;
    },
    setShowWarnings: function(bool) { return this._ShowWarnings = bool; },
    getShowWarnings: function() {
        return this.hasOwnProperty("_ShowWarnings") ? this._ShowWarnings : true
    },

    setShowErrors: function(bool) { return this._ShowErrors = bool; },
    getShowErrors: function() {
        return this.hasOwnProperty("_ShowErrors") ? this._ShowErrors : true
    },

    getNewLineMode: function() {
        return this.withAceDo(function(ed) { return ed.session.getNewLineMode(); });
    },
    setNewLineMode: function(mode) {
        // unix, windows, auto
        return this.withAceDo(function(ed) { return ed.session.setNewLineMode(mode); });
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
        var evalMarkerItems = ['eval marker', []];
        items.push(evalMarkerItems);
        if (!range.isEmpty()) {
            var selectedText = this.getSelectionOrLineString();
            var indexOfDot = selectedText.lastIndexOf('.')
            if(indexOfDot + 1 !== selectedText.length) {
                var firstChar = selectedText.charAt(indexOfDot + 1);
                if(firstChar.toLowerCase() === firstChar && indexOfDot === -1) {
                    var selectorItems = ['Selector...', []];
                    items.push(selectorItems);
                    selectorItems[1].push(['Implementors', function() {
                        self.doBrowseImplementors(); }]);
                    selectorItems[1].push(['Senders', function() {
                        self.doBrowseSenders(); }]);
                } else {
                    if(firstChar.toUpperCase() === firstChar) {
                        try {
                            var potentialClass = this.boundEval(selectedText);
                            if(potentialClass && potentialClass.isClass() && potentialClass.name() === selectedText.subString(indexOfDot + 1)) {
                                var classItems = ['Class...', []];
                                items.push(classItems);
                                classItems[1].push(['Browse', function() {
                                    self.browseClass(potentialClass); }]);
                                classItems[1].push(['Browse Hierarchy', function() {
                                    self.browseHierarchy(potentialClass); }]);
                                classItems[1].push(['References', function() {
                                    self.browseReferencesTo(potentialClass); }]);
                            }
                        } catch(e) {
                        }
//                        Global.classes(true);
                    }
                }
            }
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
        function boolItem(itemSpec, items) {
            var enabled = editor["get"+itemSpec.name]();
            var item = [Strings.format("[%s] " + itemSpec.menuString, enabled ? 'X' : ' '), function() {
                editor['set'+itemSpec.name](!enabled); }].concat()
            items.push(item);
        }
        var settingsItems = [];
        boolItem({name: "ShowGutter", menuString: "show line numbers"}, settingsItems);
        boolItem({name: "ShowInvisibles", menuString: "show whitespace"}, settingsItems);
        boolItem({name: "ShowPrintMargin", menuString: "show print margin"}, settingsItems);
        boolItem({name: "ShowActiveLine", menuString: "show active line"}, settingsItems);
        boolItem({name: "ShowIndents", menuString: "show indents"}, settingsItems);
        boolItem({name: "SoftTabs", menuString: "use soft tabs"}, settingsItems);
        settingsItems.push(['Change tab width', function() {
            $world.prompt('new tab size', function(input) { var size = Number(input); if (size) editor.setTabSize(size); }, editor.getTabSize())
        }]);
        boolItem({name: "LineWrapping", menuString: "line wrapping"}, settingsItems);
        settingsItems.push(['Change line ending mode', function() {
            $world.listPrompt('Choose line ending mode', function(input) { editor.setNewLineMode(input); }, ['auto', 'windows', 'unix'], editor.getNewLineMode(), pt(200,120));
        }]);
        boolItem({name: "ShowWarnings", menuString: "show warnings"}, settingsItems);
        boolItem({name: "ShowErrors", menuString: "show Errors"}, settingsItems);
        boolItem({name: "AutocompletionEnabled", menuString: "use Autocompletion"}, settingsItems);
        boolItem({name: "AutoTriggerAutocompletionEnabled", menuString: "automatically trigger Autocompletion"}, settingsItems);
        items.push(['settings', settingsItems]);

        var mac = UserAgent.isMacOS;
        function cmdBinding(options) {
            // options = {name, [cmdName,] [shortcut=STRING||{mac:STRING,win:STRING},] [focusAfter]}
            var shortcut = '';
            if (options.shortcut) {
                shortcut += ' (' + (Object.isObject(options.shortcut) ?
                    options.shortcut[mac ? 'mac' : 'win'] : options.shortcut) + ')';
            }
            var menuName = options.name + shortcut;
            items.push([menuName, function() {
                editor.aceEditor.execCommand(options.cmdName || options.name);
                if (options.focusAfter) editor.focus();
            }]);
        }
        cmdBinding({name: 'save', cmdName: 'doSave', shortcut: {win: 'CTRL-s', mac: 'CMD-s'}});
        cmdBinding({name: 'property completion', cmdName: 'list protocol', shortcut: {win: 'CTRL-P', mac: 'CMD-P'}});
        cmdBinding({name: 'inspect', cmdName: 'doInspect', shortcut: {win: 'CTRL-I', mac: 'CMD-I'}});
        cmdBinding({name: 'printit', shortcut: {win: 'CTRL-p', mac: 'CMD-p'}});
        cmdBinding({name: 'doit', shortcut: {win: 'CTRL-d', mac: 'CMD-d'}});

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // modes
        this.withAceDo(function(ed) {
            var mode = ed.session.getMode();
            if (Object.isFunction(mode.morphMenuItems)) {
                items = mode.morphMenuItems(items, this);
            }
        });

        return items;
    },
    morphMenuItems: function($super) {
        return $super().concat([['CodeEditor...', this.codeEditorMenuItems()]]);
    },
    showMorphMenu: function ($super, evt) {
        if (!evt || !evt.isRightMouseButtonDown()) return $super(evt);
        lively.morphic.Menu.openAtHand('', this.codeEditorMenuItems());
        evt && evt.stop();
        return true;
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
                fontFamily: 'Monaco,monospace',
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
        if (sm._removeTimer) clearTimeout(sm._removeTimer);
        sm._removeTimer = setTimeout(sm.remove.bind(sm), 1000*(delay||4))
    },
    hideStatusMessage: function () {
        if (this._statusMorph && this._statusMorph.owner) this._statusMorph.remove();
    },
    showError: function (e, offset) {
        this.setStatusMessage(String(e), Color.red);
    }
},
'text operations', {
    alignInSelectionRange: function(needle) {
        return this.alignInRange(needle, this.getSelectionRangeAce());
    },
    alignInRange: function(needle, range) {
        if (!range || range.isEmpty()) return null;
        if (range.start.column > 0) range.start.column = 0;
        var lines = Strings.lines(this.getTextRange(range));
        var linesAndIndentIndicies = lines.map(function(line) {
            var idx = Strings.peekRight(line, 0, needle);
            return {line: line, idx: idx || -1};
        });
        var maxColumn = linesAndIndentIndicies.max(function(ea) { return ea.idx; }).idx;
        if (maxColumn < 0) return null;
        var indentedLines = linesAndIndentIndicies.map(function(lineAndIdx) {
            var l = lineAndIdx.line, i = lineAndIdx.idx;
            return i <= 0 ? l : l.slice(0,i) + ' '.times(maxColumn-i) + l.slice(i);
        });
        return this.replace(range, indentedLines.join('\n'));
    },
},
'file access', {
    getTargetFilePath: function() {
        // a codeeditor can target a file. This method figures out if the
        // current one does
        var win = this.getWindow();
        if (!win || !win.getLocation) return null;
        return win.getLocation(true);
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

// startup hooks
(function setupCodeEditorCompletions() {
    if (lively.Config.get('computeCodeEditorCompletionsOnStartup')) {
        module("lively.ide.codeeditor.Completions").load();
    }
})();

}); // end of module
