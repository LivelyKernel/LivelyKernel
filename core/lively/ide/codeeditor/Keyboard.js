module('lively.ide.codeeditor.Keyboard').requires().toRun(function() {

module("lively.ide.CodeEditor");

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
            // so that mutli key shortcuts can be transfered from the global
            // key handler:
            ed.keyBinding.$data.keyChain = "";
            self.setupEvalBindings(kbd);
            self.setupTextManipulationBindings(kbd);
            self.setupSelectionAndNavigationBindings(kbd);
            self.setupSearchBindings(kbd);
            self.setupMultiSelectBindings(kbd);
            self.setupEditorConfigBindings(kbd);
            self.setupInputLineBindings(kbd);
            self.setupSnippetBindings(kbd);
            self.setupASTNavigation(kbd);
            self.setupKeyboardMacroBindings(kbd);
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
                existing = keys && typeof keys === "string" && lookupCommand(keys);
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
            var mode = ed.session.getMode();
            if (!mode.doEval) ed.$morph.doit(insertResult);
            else mode.doEval(ed.$morph, insertResult)
        }
        this.addCommands(kbd, [{
                name: 'evalAll',
                exec: function(ed, args) {
                    if (args && args.confirm) {
                        $world.alertOK('Evaluating complete text...');
                    }
                    ed.$morph.saveExcursion(function(whenDone) {
                        ed.$morph.selectAll();
                        doEval(ed, false);
                        whenDone();
                    });
                },
                handlesCount: true,
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
            }]);
            // FIXME for some reason this does not work with bindKeys?!
            kbd.bindKey("»", 'runShellCommandOnRegion');
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
                        rows = ed.$getSelectedRows(), lines = [],
                        session = ed.session,
                        range = ed.selection.getRange(),
                        splitRegex = /[^a-zA-Z_0-9\$\-!\?,\.]+/g,
                        whitespacePrefixRegex = /^[\s\t]+/;
                    for (var i = rows.first; i <= rows.last; i++) {
                        var line = session.getLine(i), isEmptyLine = line.trim() === '',
                            whitespacePrefixMatch = line.match(whitespacePrefixRegex),
                            whitespacePrefix = whitespacePrefixMatch ? whitespacePrefixMatch[0] : '';
                        line = whitespacePrefix + line.trim();
                        if (line.length <= col) { lines.push(line); if (isEmptyLine && line !== '') lines.push(''); continue; }
                        while (line.length > col) {
                            var firstChunk = line.slice(0, col),
                                splitMatch = Strings.reMatches(firstChunk, splitRegex).last(),
                                lastWordSplit = splitMatch && splitMatch.start > 0 ? splitMatch.start : col,
                                firstChunkWithWordBoundary = firstChunk.slice(0, lastWordSplit);
                            lines.push(firstChunkWithWordBoundary);
                            line = whitespacePrefix + (firstChunk.slice(lastWordSplit) + line.slice(col)).trimLeft();
                        }
                        lines.push(isEmptyLine ? '' : whitespacePrefix + line.trim());
                    }
                    ed.session.replace(range, lines.join('\n'));
                },
                multiSelectAction: "forEach"
            }, {
                name: "remove duplicate lines / uniq",
                exec: function(ed, args) {
                    if (ed.selection.isEmpty()) ed.selection.selectAll();
                    var range = ed.selection.getRange(),
                        wholeText = ed.session.getTextRange(range),
                        lines = wholeText.split('\n');
                    ed.session.replace(range, lines.uniq().join('\n'));
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
                name: "alignSelection",
                exec: function(ed, args) {
                    if (ed.selection.isEmpty()) return;
                    lively.morphic.World.current().prompt('Enter String or RegEx for alignment', function(input) {
                        if (!input || !input.length) return;
                        var needle = /^\/.*\/$/.test(input) ?  new RegExp(input) : needle = input;
                        ed.$morph.alignInSelectionRange(needle);
                    });
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
                name: 'moveCursorToScreenTop',
                bindKey: 'Alt-Ctrl-,'/*Alt-Ctrl-<*/,
                exec: function(ed) {
                    var currentPos = ed.getCursorPosition(),
                        firstRow = ed.renderer.getFirstFullyVisibleRow(),
                        lastRow = ed.renderer.getLastFullyVisibleRow(),
                        middleRow = firstRow+Math.floor((lastRow - firstRow)/2),
                        newPos = currentPos;
                    if (currentPos.row <= firstRow) return;
                    if (currentPos.row <= middleRow) newPos.row = firstRow;
                    else if (currentPos.row <= lastRow) newPos.row = middleRow;
                    else newPos.row = lastRow;
                    ed.selection.moveCursorToPosition(newPos)
                },
                readOnly: true
            }, {
                name: 'moveCursorToScreenBottom',
                bindKey: 'Alt-Ctrl-.'/*Alt-Ctrl->*/,
                exec: function(ed) {
                    var currentPos = ed.getCursorPosition(),
                        firstRow = ed.renderer.getFirstFullyVisibleRow(),
                        lastRow = ed.renderer.getLastFullyVisibleRow(),
                        middleRow = firstRow+Math.floor((lastRow - firstRow)/2),
                        newPos = currentPos;
                    if (currentPos.row < firstRow) newPos.row = firstRow;
                    else if (currentPos.row < middleRow) newPos.row = middleRow;
                    else if (currentPos.row < lastRow) newPos.row = lastRow;
                    else return;
                    ed.selection.moveCursorToPosition(newPos);
                },
                readOnly: true
            }, {
                name: 'gotoNextParagraph',
                bindKey: 'Ctrl-Down',
                exec: function(ed) {
                    var pos = ed.getCursorPosition(), found = -1;
                    function isEmptyLine(line) { return /^\s*$/.test(line); }
                    var lines = ed.session.getLines(pos.row, ed.session.getLength()), found = -1;
                    for (var i = 1; i < lines.length; i++) {
                        found = i;
                        if (!isEmptyLine(lines[i-1]) && isEmptyLine(lines[i])) break;
                    }
                    ed.selection.moveCursorToPosition({row: pos.row+found, column: 0});
                },
                readOnly: true
            }, {
                name: 'gotoPrevParagraph',
                bindKey: 'Ctrl-Up',
                exec: function(ed) {
                    function isEmptyLine(line) { return /^\s*$/.test(line); }
                    var pos = ed.getCursorPosition(), found = -1,
                        lines = ed.session.getLines(0, pos.row);
                    for (var i = lines.length-2; i >= 0; i--) {
                        found = i;
                        if (!isEmptyLine(lines[i+1]) && isEmptyLine(lines[i])) break;
                    }
                    ed.selection.moveCursorToPosition({row: found, column: 0});
                },
                readOnly: true
            }, {
                bindKey: {mac: "©"},
                name: "gotolineInsertPreventMac",
                readOnly: true,
                exec: function (ed) {
                    // Alt-G = gotoline will insert © in Mac OS, this prevents it
                }
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
            }, {
                name: "selectAllLikeThis",
                bindKey: "Ctrl-Shift-/",
                exec: function(ed) {
                    ed.pushEmacsMark && ed.pushEmacsMark(ed.getCursorPosition());
                    ed.findAll(ed.$morph.getTextRange()); },
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
                    var codeEditor = ed.$morph,
                        currentTextMode = codeEditor.getTextMode(),
                        modes = lively.ide.ace.availableTextModes().map(function(mode) {
                            return {string: Strings.format('[%s] %s', mode === currentTextMode ? 'X' : ' ', mode), value: mode, isListItem: true }; });
                    lively.ide.tools.SelectionNarrowing.chooseOne(modes,
                        function(err, mode) { codeEditor.setTextMode(mode); },
                        {name: 'lively.ide.CodeEditor.TextMode.NarrowingList', prompt: 'choose mode: '})
                    return true;
                },
                handlesCount: true
            }, {
                name: "toggleShowGutter",
                exec: function(ed) { ed.$morph.setShowGutter(!ed.$morph.getShowGutter()); }
            }, {
                name: "toggleShowInvisibles",
                exec: function(ed) { ed.$morph.setShowInvisibles(!ed.$morph.getShowInvisibles()); }
            }, {
                name: "toggleShowPrintMargin",
                exec: function(ed) { ed.$morph.setShowPrintMargin(!ed.$morph.getShowPrintMargin()); }
            }, {
                name: "toggleShowIndents",
                exec: function(ed) { ed.$morph.setShowIndents(!ed.$morph.getShowIndents()); }
            }, {
                name: "toggleShowActiveLine",
                exec: function(ed) { ed.$morph.setShowActiveLine(!ed.$morph.getShowActiveLine()); }
            }, {
                name: "toggleSoftTabs",
                exec: function(ed) { ed.$morph.setSoftTabs(!ed.$morph.getSoftTabs()); }
            }, {
                name: "toggleLineWrapping",
                exec: function(ed) { ed.$morph.setLineWrapping(!ed.$morph.getLineWrapping()); }
            }, {
                name: "set tab size",
                exec: function(ed) {
                    $world.prompt('enter new tab size', function(input) {
                        var newTabSize = input;
                        if (newTabSize && Number(newTabSize)) ed.$morph.setTabSize(Number(newTabSize));
                        $world.confirm('Set tab size to ' + newTabSize + ' for all editors?', function(input) {
                            if (!input) return;
                            lively.Config.set("defaultTabSize", newTabSize);
                            alertOK('Changed global tab size to ' + newTabSize);
                        });
                        ed.$morph.focus();
                    }, ed.$morph.getTabSize() || lively.Config.defaultTabSize);
                 }
            }, {
                name: "set line ending mode",
                exec: function(ed) {
                    lively.ide.tools.SelectionNarrowing.chooseOne(['auto', 'unix', 'windows'], function(err, choice) {
                        ed.$morph.setNewLineMode(choice || 'auto');
                        ed.$morph.focus();
                    });
                }
            }, {
                name: "toggle text overlays",
                exec: function(ed) {
                    var enabled = ed.$morph.getTextOverlaysEnabled();
                    ed.$morph.setTextOverlaysEnabled(!enabled);
                    var method = ed.$morph.jQuery().find('.text-overlay').hasClass('hidden') ?
                        "unhideTextOverlays" : "hideTextOverlays"
                    ed.$morph[method]();
                }
            }, {
                name: "toggle showing errors",
                exec: function(ed) {
                    var showsErrors = ed.$morph.getShowErrors();
                    ed.$morph.setShowErrors(!showsErrors);
                    alertOK('showing errors ' + (!showsErrors ? 'enabled': 'disabled'));
                }
            }, {
                name: "toggle showing warnings",
                exec: function(ed) {
                    var showsWarnings = ed.$morph.getShowWarnings();
                    ed.$morph.setShowWarnings(!showsWarnings);
                    alertOK('showing warnings ' + (!showsWarnings ? 'enabled': 'disabled'));
                }
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
        }, {
            name: 'browseSnippets',
            exec: function(ed) {
                ed.$morph.withSnippetsForCurrentModeDo(function(err, snippets) {
                    var list = snippets ?
                        Properties.forEachOwn(snippets, function(name, snippet) {
                            return {isListItem: true, string: name, value: snippet} }) :
                        ['no snippets: ' + err];
                    lively.ide.tools.SelectionNarrowing.chooseOne(list, function(err, candidate) {
                        candidate && ed.$morph.insertSnippetNamedAt(candidate.name); });
                });
            },
            multiSelectAction: "forEach"
        }]);
    },

    setupASTNavigation: function(kbd) {
        function move(selector, codeEditor) {
            var pos = codeEditor.getSelection().lead,
                idx = codeEditor.positionToIndex(pos),
                nav = new lively.ide.codeeditor.JS.Navigator(),
                newIdx = nav[selector](codeEditor.textString, idx),
                newPos = codeEditor.indexToPosition(newIdx);
            codeEditor.getSelection().moveCursorToPosition(newPos);
        }
        function select(selector, codeEditor) {
            var nav = new lively.ide.codeeditor.JS.Navigator(),
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
                    var nav = new lively.ide.codeeditor.JS.RangeExpander();
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
            bindKey: {win: 'Shift-Ctrl-S', mac: 'Ctrl-Command-space'},
            exec: function(ed) {
                ed.$morph.withASTDo(function(ast) {
                    var state = ed.$expandRegionState;
                    if (!state) return;
                    var nav = new lively.ide.codeeditor.JS.RangeExpander();
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
        }, {
            name: 'visualizeAST',
            // bindKey: 'Ctrl-`',
            exec: function(ed) {
                var sel = ed.getSelection()
                var code = !sel.isEmpty() ? ed.session.getTextRange(sel.getRange()) : ed.getValue();
                require('lively.ast.Visualization').toRun(function() {
                    lively.ast.visualize(code).openInWorldCenter();
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

    setupKeyboardMacroBindings: function(kbd) {
        function macroString(macro) {
            var table = macro.map(function(recordStep) {
                // 2-elem-list: 0: command invoked, 1: key press
                return [
                    recordStep[1] ? Strings.print(recordStep[1]) : '""',
                    recordStep[0] ? recordStep[0].name : 'unknown'];
            });
            return Strings.printTable(table);
        }
        kbd.addCommands([{
            name: "viewrecording",
            exec: function(ed) {
                if (!ed.commands.macro) { show('no recording'); return; }
                show(macroString(ed.commands.macro));
            },
            readOnly: true
        }, {
            name: "togglerecording",
            bindKey: {win: "Ctrl-Alt-E", mac: "Command-Option-E"},
            exec: function(ed) {
                var cmds = ed.commands;
                cmds.toggleRecording(ed);
                var recording = !!cmds.recording;
                ed.$morph.setStatusMessage((recording ? 'Start' : 'Stop') + ' recording keys');
                if (recording) {
                    if (!cmds.$showAddCommandToMacro) {
                        cmds.$showAddCommandToMacro = function(e) {
                            var name = e.command ? e.command.name : '', out = name;
                            if (name === 'insertstring') out = e.args || '';
                            ed.$morph.setStatusMessage(out);
                        }
                    }
                    cmds.on("exec", cmds.$showAddCommandToMacro);
                } else {
                    cmds.removeEventListener("exec", cmds.$showAddCommandToMacro);
                }
            },
            readOnly: true
        }, {
            name: "replaymacro",
            bindKey: {win: "Ctrl-Shift-E", mac: "Command-Shift-E"},
            exec: function(ed) {
                ed.$morph.setStatusMessage('Replay recording');
                ed.commands.replay(ed);
            },
            readOnly: true
        }]);
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
        }, {
            name: 'browseURLOrPathInWebBrowser',
            exec: function(ed, args) {
                var col = ed.getCursorPosition().column,
                    source = ed.$morph.getSelectionOrLineString(),
                    urlRe = /(?:file|https?):\/\/[^\s]+/g,
                    matches = Strings.reMatches(source, urlRe),
                    browseThing = '';
                if (matches.length > 0) {
                    browseThing = (matches.detect(function(ea) {
                        return ea.start <= col && col <= ea.end;
                    }) || matches.first()).match;
                } else {
                    var start = Strings.peekLeft(source, col, ' ') || 0,
                        end = Strings.peekRight(source, col, ' ') || source.length;
                    browseThing = source.slice(start, end);
                }
                window.open(browseThing);
            },
            multiSelectAction: 'forEach',
            handlesCount: true
        }, {
            name: 'prettyPrintHTMLAndXML',
            exec: function(ed, args) {
                function tidy(xmlString, thenDo) {
                    return lively.shell.run(
                        'tidy -i -xml -q -',
                        {stdin: xmlString, sync: true},
                        function(cmd) { thenDo && thenDo(cmd.getCode(), cmd.resultString()); }).resultString();
                }
                var source = ed.$morph.getSelectionOrLineString(),
                    range = ed.$morph.getSelectionRangeAce();
                tidy(source, function(err, resultString) {
                    ed.$morph.replace(range, resultString); })
            },
            multiSelectAction: 'forEach',
            handlesCount: true
        }]);
    },

    setupUserKeyBindings: function(kbd, codeEditor) {
        var c = lively.Config;
        if (!Object.isFunction(c.codeEditorUserKeySetup)) return;
        c.codeEditorUserKeySetup(codeEditor);
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

}) // end of module
