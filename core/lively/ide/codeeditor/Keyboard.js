module('lively.ide.codeeditor.Keyboard').requires('lively.ide.codeeditor.ace', 'lively.ide.codeeditor.JumpChar').toRun(function() {

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
            // if (kbd.hasLivelyKeys) return;

            if (!lively.Config.get("useEmacsyKeys") && module('lively.ide.codeeditor.EmacsConfig').isLoaded()) {
              lively.ide.codeeditor.EmacsConfig.disable(ed);
              kbd = ed.getKeyboardHandler();
            }

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
            self.setupToolSpecificBindings(kbd);
            self.setupUsefulHelperBindings(kbd);
            self.setupJumpChar(kbd);

            if (lively.Config.get("useEmacsyKeys")) {
              require('lively.ide.codeeditor.EmacsConfig').toRun(function() {
                lively.ide.codeeditor.EmacsConfig.enable(ed)
              });
            }

            if (lively.Config.get("aceDefaultUseIyGotoChar")) {
              require('lively.ide.codeeditor.IyGotoChar').toRun(function() {
                lively.ide.codeeditor.IyGotoChar.setupIyGoToChar(kbd);
              });
            }

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

        this.addCommands(kbd, [{
                name: 'evalAll',
                exec: function(ed, args) {
                    if (args && args.confirm) {
                        $world.alertOK('Evaluating complete text...');
                    }
                    ed.$morph.saveExcursion(function(whenDone) {
                        ed.$morph.selectAll();
                        maybeUseModeFunction(ed, "doEval", "doit", [false]);
                        whenDone();
                    });
                },
                handlesCount: true,
                readOnly: true
            }, {
                name: 'doit',
                bindKey: {win: 'Ctrl-D|Ctrl-Return',  mac: 'Command-D|Command-Return'},
                exec: function(ed) { maybeUseModeFunction(ed, "doEval", "doit", [false]); },
                multiSelectAction: "forEach",
                readOnly: true // false if this command should not apply in readOnly mode
            }, {
                name: 'debugit',
                // bindKey: {win: 'Ctrl-Shift-D',  mac: 'Command-Shift-D'},
                exec: function(ed) { ed.$morph.doDebugit(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'printit',
                bindKey: {win: 'Ctrl-P',  mac: 'Command-P'},
                exec: function(ed) { maybeUseModeFunction(ed, "doEval", "doit", [true]); },
                multiSelectAction: "forEach",
                readOnly: false
            }, {
                name: 'list protocol',
                bindKey: {win: 'Ctrl-Shift-P|Alt-Shift-P',  mac: 'Command-Shift-P'},
                exec: function(ed) { maybeUseModeFunction(ed, "doListProtocol", "doListProtocol"); },
                multiSelectAction: "single",
                readOnly: false
            }, {
                name: 'doSave',
                bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
                exec: function(ed, args) { maybeUseModeFunction(ed, "doSave", "doSave"); },
                multiSelectAction: "single",
                readOnly: false
            }, {
                name: 'printInspect',
                bindKey: {win: 'Ctrl-I',  mac: 'Command-I'},
                exec: function(ed, args) {
                    maybeUseModeFunction(ed, "printInspect", "printInspect", [{depth: args && args.count}]);
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
            },

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            {
                name: "openEvalResult",
                multiSelectAction: 'forEach',
                bindKey: {win: "Alt-o|Ctrl-o", mac: "Command-o|Alt-o"},
                exec: function(ed, args) {
                    args = args || {};
                    var insert = args.insert; // either insert into current editor or open in window
                    var content = args.content;
            
                    lively.lang.fun.composeAsync(triggerExpand)(function(err) { err && console.error(err); })
            
                    return true;
            
                    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            
                    function triggerExpand(next) {
                      var msgMorph = ed.$morph.ensureStatusMessageMorph();
                      msgMorph = msgMorph && msgMorph.world() ? msgMorph : null;
                      if (!msgMorph) return next(null, new Error("No statusmorph to expand!"));
                      if (content) msgMorph.insertion = content;
                      msgMorph.expand(insert ? ed.$morph : null, ed.$morph.getTextMode());
                      next(null);
                    }
            
                  }
            },
            {
              name: "insertEvalResult",
              bindKey: {win: "Alt-i", mac: "Alt-i"},
              multiSelectAction: "forEach",
              exec: function(ed) {
                 ed.execCommand('openEvalResult', {insert: true}); 
              },
            },

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            {
                name: 'togglePrintitAsComment',
                exec: function(ed, args) {
                  ed.$morph.setPrintItAsComment(!ed.$morph.getPrintItAsComment());
                },
                multiSelectAction: "single",
                handlesCount: true
            }, {
                name: 'doAutoEvalPrintItComments',
                exec: function(ed, args) {
                    ed.$morph.doAutoEvalPrintItComments();
                },
                multiSelectAction: "single",
                handlesCount: true
            }, {
                name: 'toggleDoAutoEvalPrintItComments',
                exec: function(ed, args) {
                    ed.$morph.setAutoEvalPrintItComments(!ed.$morph.getAutoEvalPrintItComments());
                    alertOK("auto eval " + (ed.$morph.getAutoEvalPrintItComments() ? "enabled" : "disabled"))
                },
                multiSelectAction: "single",
                handlesCount: true
            }, {
                name: 'toggleDoAutoEvalPrintItCommentsTicking',
                exec: function(ed, args) {
                    var m = ed.$morph;
                    var selName = "doAutoEvalPrintItComments";
                    var isTicking = m.scripts.pluck("selector").include(selName);
                    if (isTicking) {
                      m.stopSteppingScriptNamed(selName);
                      alertOK("ticking auto eval stopped");
                      return;
                    }

                    $world.prompt("Enter tick time for auto eval:", function(input) {
                        var ms = parseInt(input);
                        if (!ms) return;
                        m.startStepping(ms, 'doAutoEvalPrintItComments');
                        alertOK("ticking auto eval started");
                    });

                },
                multiSelectAction: "single",
                handlesCount: true
            }, { // shell eval
                name: 'runShellCommand',
                exec: function(ed, args) {
                    lively.ide.commands.exec('lively.ide.execShellCommand', ed.$morph, args);
                },
                handlesCount: true
            }, {
                name: 'runShellCommandOnRegion',
                exec: function(ed, args) {
                    var input = ed.session.getTextRange(),
                        options = !input || input.length === 0 ? {} : {stdin: input};
                    $world.prompt('Enter shell command to run on region.', function(cmdString) {
                        if (!cmdString) { show('No command entered, aborting...!'); return; }
                        lively.shell.run(cmdString, options, function(err, cmd) {
                            ed.session.replace(
                              ed.selection.getRange(),
                              cmd.resultString(true).trim());
                        });
                    }, {historyId: 'lively.ide.execShellCommand'});
                },
                multiSelectAction: 'forEach',
                handlesCount: true
            }]);
            // FIXME for some reason this does not work with bindKeys?!
            kbd.bindKey("»", 'runShellCommandOnRegion');

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function maybeUseModeFunction(ed, featureName, morphMethodName, args) {
            var mode = ed.session.getMode();
            var morph = ed.$morph;
            if (!mode[featureName]) morph[morphMethodName].apply(morph, args);
            else mode[featureName].apply(mode, [morph].concat(args));
        }
    },

    setupTextManipulationBindings: function(kbd) {

        function joinLine(ed) {
            if (!ed.selection.isEmpty()) ed.selection.clearSelection();
            var pos = ed.getCursorPosition(),
                rowString = ed.session.doc.getLine(pos.row),
                whitespaceMatch = rowString.match(/^\s*/),
                col = (whitespaceMatch && whitespaceMatch[0].length) || 0;
            ed.moveCursorToPosition({row: pos.row, column: col});
            ed.removeToLineStart();
            ed.remove('left');
        }

        this.addCommands(kbd, [{
                name: 'removeSelectionOrLine',
                bindKey: {win: 'Win-X', mac: 'Command-X'},
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
                bindKey: {mac: "Command-Return", win: "Win-Return"},
                exec: function(ed) { ed.navigateLineEnd(); ed.insert('\n'); },
                multiSelectAction: 'forEach',
                readOnly: false
            }, {
                name: 'joinLineAbove',
                exec: joinLine,
                multiSelectAction: 'forEach',
                readOnly: false
            }, {
                name: 'joinLineBelow',
                exec: function(ed) { ed.navigateDown(); joinLine(ed); },
                multiSelectAction: 'forEach',
                readOnly: false
            }, {
                name: 'duplicateLine',
                exec: function(ed) { ed.execCommand('copylinesdown'); },
                multiSelectAction: 'forEach',
                readOnly: false
            }, {
                name: "movelinesup",
                exec: function(editor) { editor.moveLinesUp(); }
            }, {
                name: "movelinesdown",
                exec: function(editor) { editor.moveLinesDown(); }
            }, {
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
                    var col                = args && args.count || ed.getOption('printMarginColumn') || 80,
                        rows               = ed.$getSelectedRows(),
                        session            = ed.session,
                        range              = ed.selection.getRange(),
                        splitRe            = /[ ]+/g,
                        // splitRe            = /[^a-zA-Z_0-9\$\-!\?,\.]+/g,
                        whitespacePrefixRe = /^[\s\t]+/;

                    function splitLineIntoChunks(line, whitespacePrefix, n) {
                        if (line.length <= col) return [whitespacePrefix + line.trim()];
                        var firstChunk    = line.slice(0, col),
                            splitMatch    = Strings.reMatches(firstChunk, splitRe).last(),
                            lastWordSplit = splitMatch && splitMatch.start > 0 ? splitMatch.start : col,
                            first         = firstChunk.slice(0, lastWordSplit),
                            rest          = whitespacePrefix + (firstChunk.slice(lastWordSplit) + line.slice(col)).trimLeft();
                        return [first].concat(splitLineIntoChunks(rest, whitespacePrefix, n+1));
                    }

                    function fitRow(row) {
                        if (row.trim() === '') return [''];
                        var whitespacePrefixMatch = row.match(whitespacePrefixRe),
                            whitespacePrefix = whitespacePrefixMatch ? whitespacePrefixMatch[0] : '';
                        return splitLineIntoChunks(whitespacePrefix + row.trim(), whitespacePrefix);
                    }

                    function fitParagraph(para) {
                        return /^\s*$/.test(para) ?
                            para : fitRow(para.split('\n').join(' ')).join('\n') + '\n';
                    }

                    var paragraphs = Strings.paragraphs(
                        Array.range(rows.first, rows.last)
                            .map(session.getLine.bind(session))
                            .join('\n'), {keepEmptyLines: true}),
                        newString = paragraphs.map(fitParagraph).flatten().join('\n');

                    ed.session.replace(range, newString);
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
            }, {
                name: "commentBox",
                exec: function(ed, args) {
                    var range = ed.selection.getRange();
                    if (range.isEmpty()) {
                        ed.selection.selectLine();
                        range = ed.selection.getRange();
                    }

                    var startLine = range.start.row,
                        endLine = range.end.column === 0 ? range.end.row - 1 : range.end.row,
                        lines = ed.$morph.getSelectionOrLineString().split('\n'),
                        indent = [range.start.column].concat(lines.map(function(line) { return line.match(/^\s*/); }).flatten().compact().pluck('length')).min(),
                        length = lines.pluck('length').max() - indent,
                        fence = Array(Math.ceil(length / 2) + 1).join('-=') + '-';

                    // comment range
                    ed.toggleCommentLines();
                    ed.clearSelection();

                    // insert upper fence
                    ed.moveCursorTo(startLine, 0);
                    if (args && args.count)
                      ed.insert(Strings.indent("-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-" + '\n', ' ', indent));
                    else
                      ed.insert(Strings.indent(fence + '\n', ' ', indent));
                    ed.selection.moveCursorUp();
                    ed.toggleCommentLines();
                    // insert fence below
                    ed.moveCursorTo(endLine+2, 0);

                    ed.insert(Strings.indent(fence + '\n', ' ', indent));
                    ed.selection.moveCursorUp();
                    ed.selection.moveCursorLineEnd();
                    ed.toggleCommentLines();

                    // select it all
                    ed.selection.setRange({start: {row: startLine, column: 0}, end: ed.getCursorPosition()});
                },
                multiSelectAction: "forEach",
                handlesCount: true
            }, {
                name: 'curlyBlockOneLine',
                exec: function(ed) {
                    // "if (foo) {\n 3+3;\n}" -> "if (foo) { 3+3; }"
                    function stringLeftOfPosIncludes(pos, string) {
                        var before = ed.session.getTextRange({start: {column: 0, row: pos.row}, end: pos}),
                            idx = before.indexOf(string);
                        return idx > -1 && idx;
                    }

                    var pos = ed.selection.getCursor();
                    // are we right from a "}" and on the same line?
                    var endBracket = ed.find(/\}/, {start: pos, backwards: true, preventScroll: true});
                    // if not search forward
                    if (!endBracket || endBracket.end.row !== pos.row) {
                        endBracket = ed.find(/\}/, {start: pos, backwards: false, preventScroll: true});
                    }
                    if (!endBracket) return;
                    ed.moveCursorToPosition(endBracket.end);
                    pos = endBracket.end;
                    var matchingBracketPos = ed.session.findMatchingBracket(pos);
                    if (!matchingBracketPos) return;
                    while (pos.row !== matchingBracketPos.row) {
                        joinLine(ed); ed.insert(' ');
                        pos = ed.selection.getCursor();
                    }
                    ed.selection.moveCursorToPosition(matchingBracketPos);
                },
                multiSelectAction: 'forEach',
                readOnly: false
            }]);
        kbd.bindKey("Command-Alt-/", 'toggleBlockComment');
    },

    setupSelectionAndNavigationBindings: function(kbd) {
        this.addCommands(kbd, [{
                name: 'clearSelection',
                bindKey: 'Escape',
                exec: this.morphBinding("clearSelection"),
                readOnly: true
            }, {
                name: 'selectLine',
                bindKey: {win: "Alt-L|Ctrl-L", mac: "Command-L"},
                exec: this.morphBinding("selectCurrentLine"),
                multiSelectAction: 'forEach',
                readOnly: true
            }, {
                name: 'moveForwardToMatching',
                bindKey: {win: 'Ctrl-M',  mac: 'Command-Right'},
                exec: this.morphBinding("moveForwardToMatching", [false, true]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'moveBackwardToMatching',
                bindKey: {win: 'Ctrl-Alt-M',  mac: 'Command-Left'},
                exec: this.morphBinding("moveBackwardToMatching", [false, true]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'selectToMatchingForward',
                bindKey: {win: 'Ctrl-Shift-M',  mac: 'Command-Shift-Right'},
                exec: this.morphBinding("moveForwardToMatching", [true, true]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: 'selectToMatchingBackward',
                bindKey: {win: 'Ctrl-Shift-Alt-M',  mac: 'Command-Shift-Left'},
                exec: this.morphBinding("moveBackwardToMatching", [true, true]),
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "selecttolinestart",
                bindKey: 'Shift-Home|Ctrl-Shift-A',
                exec: function(ed) { ed.getSelection().selectLineStart(); ed.renderer.scrollCursorIntoView(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "gotolinestart",
                bindKey: {win: "Home", mac: "Home|Ctrl-A"},
                exec: function(ed) { ed.navigateLineStart(); ed.renderer.scrollCursorIntoView(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "selecttolineend",
                bindKey: "Shift-End|Ctrl-Shift-E",
                exec: function(ed) { ed.getSelection().selectLineEnd(); ed.renderer.scrollCursorIntoView(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "gotolineend",
                bindKey: "End|Ctrl-E",
                exec: function(ed) { ed.navigateLineEnd(); ed.renderer.scrollCursorIntoView(); },
                multiSelectAction: "forEach",
                readOnly: true
            }, {
                name: "gotoline",
                bindKey: "Alt-G",
                exec: function (editor) {
                    $world.prompt("Enter line number: ", function(input) {
                        var line = parseInt(input);
                        if (!isNaN(line)) editor.gotoLine(line);
                        editor.renderer.scrollCursorIntoView();
                    }, String(editor.getCursorPositionScreen().row + 1));
                },
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
                    ed.selection[ed.emacsMark && ed.emacsMark() ? "selectToPosition": "moveToPosition"]({row: pos.row+found, column: 0});
                    ed.renderer.scrollCursorIntoView();
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
                    ed.selection[ed.emacsMark && ed.emacsMark() ? "selectToPosition": "moveToPosition"]({row: found, column: 0});
                    ed.renderer.scrollCursorIntoView();
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
            kbd.bindKey("Alt-Shift-.", 'gotoend');

            // move foldall from "Ctrl-Alt-0" to "Ctrl-Alt-Shift-0" on windows
            // b/c of the move commands
            if (kbd.platform === 'win') {
                kbd.bindKey("Ctrl-Alt-0", null);
                kbd.bindKey("Ctrl-Alt-Shift-0", "foldall");
            }
    },

    setupSearchBindings: function(kbd) {
        this.addCommands(kbd, [{
                name: "searchWithPrompt",
                bindKey: {win: "Ctrl-F", mac: "Command-F"},
                exec: function(ed) { ed.$morph.searchWithPrompt(); },
                readOnly: true
            }, {
                name: "codeSearch",
                bindKey: {win: "Ctrl-Shift-F", mac: "Command-Shift-F"},
                exec: function(ed) { lively.ide.commands.exec('lively.ide.codeSearch', ed.$morph.getSelectionOrLineString()); },
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
                exec: function(ed) {
                    lively.ide.CommandLineSearch.doBrowseAtPointOrRegion(ed.$morph);
                },
                multiSelectAction: 'forEach'
            }, {
                name: 'doCommandLineSearchInline',
                // bindKey: {win: "Alt-/", mac: "Alt-/"},
                exec: function(ed) {
                    lively.ide.CommandLineSearch.doGrepFromWorkspace(ed.$morph.getSelectionOrLineString());
                },
                multiSelectAction: 'forEach'
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
            name: "multiSelectJumpToPrevRange",
            bindKey: "Command-Shift-,",
            exec: function(ed) {
              ed.$morph.multiSelectJump("prev");
            },
            readOnly: true
        }, {
            name: "multiSelectJumpToNextRange",
            bindKey: "Command-Shift-.",
            exec: function(ed) {
              ed.$morph.multiSelectJump("next");
            },
            readOnly: true
        }, {
            name: "selectAllLikeThis",
            bindKey: "Ctrl-Shift-/",
            exec: function(ed) {
                ed.pushEmacsMark && ed.pushEmacsMark(ed.getCursorPosition());
                ed.findAll(ed.$morph.getTextRange()); },
            readOnly: true
        }, {
            name: "multiSelectCounter",
            handlesCount: true,
            exec: function(ed, args) {
              var start = (args && args.count) || 1;
              ed.selection.getAllRanges().forEach(function(ea, i) {
                ed.session.replace(ea, String(start+i));
              });
            },
            multiSelectAction: "single",
            readOnly: false
        }]);

        kbd.bindKey("Ctrl-Shift-L", 'selectSymbolReferenceOrDeclarationPrev');
        kbd.bindKey("Ctrl-Shift-:", 'selectSymbolReferenceOrDeclarationNext'); // Ctrl-Shift-:
        kbd.bindKey("Ctrl-Shift-'", 'selectSymbolReferenceOrDeclaration');
    },

    setupEditorConfigBindings: function(kbd) {
            this.addCommands(kbd, [{
                name: 'increasefontsize',
                bindKey: {win: "Ctrl-+", mac: "Command-="},
                exec: function(ed) { ed.$morph.setFontSize(ed.$morph.getFontSize() + 1); },
                readOnly: true
            }, {
                name: 'decreasefontsize',
                bindKey: {win: "Ctrl-+", mac: "Command--"},
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
                        var size = input && Number(input);
                        if (!size) { show("not a valid tab size: %s", size); return; }
                        ed.$morph.setTabSize(size);
                        $world.confirm('Set tab size to ' + size + ' for all editors?', function(input) {
                            if (!input) { ed.$morph.focus(); return; }
                            var size = 2;
                            $world.withAllSubmorphsSelect(function(ea) { return ea.isCodeEditor; })
                              .invoke("setTabSize", size);
                            lively.Config.set('defaultTabSize', size);
                            lively.morphic.CodeEditor.prototype.style.tabSize = size;
                            alertOK('Changed global tab size to ' + size);
                            ed.$morph.focus();
                        });
                        ed.$morph.focus();
                    }, ed.$morph.guessTabSize() || ed.$morph.getTabSize() || lively.Config.defaultTabSize);
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
            }, {
                name: "guess tab size",
                exec: function(ed) {
                    ed.$morph.guessAndSetTabSize();
                }
            }, {
                name: "describeKey",
                exec: function(ed) {
                  var lastKeys = [], found = false;
                  var reset = ace.ext.keys.captureEditorCommand(ed,
                    function(cmd) { withResultDo(null, cmd); },
                    function(hashId, keyString, keyCode, e) {
                      if (e) {
                          lively.morphic.EventHandler.prototype.patchEvent(e);
                          lastKeys.push(e.getKeyString({ignoreModifiersIfNoCombo: true}));
                      }
                    });
                  ed.$morph.setStatusMessage("Press key(s) to find out what command the key is bound to");

                  lively.lang.fun.waitFor(15*1000, function() { return !!found; },
                    function(timeout) {
                      if (!timeout) return;
                      reset();
                      ed.$morph.hideStatusMessage();
                    })

                  function withResultDo(err, cmd) {
                    found = true;
                    $world.addCodeEditor({
                        title: 'describe key "' + lastKeys.join(' ') + '"',
                        content: Strings.format('"%s" is bound to\n%s',
                            lastKeys.join(' '), Objects.inspect(cmd)),
                        textMode: 'text'
                    }).getWindow().comeForward();
                  }
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
            exec: function (ed) {
                var success = ed.$morph.getSnippets().getSnippetManager().expandWithTab(ed);

                // the five lines below are for not accidentally re-expanding snippets,
                // e.g. mutliple expands of forEach when first "tabStop" is directly at the
                // key that triggers expansion
                if (ed.tabstopManager) {
                    ed.tabstopManager.keyboardHandler.bindKeys({
                        "Tab": function(ed) { ed.tabstopManager.tabNext(1); }
                    })
                }

                if (!success) ed.execCommand("indent");
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
      var astCommands = lively.lang.Path('ext.lang.astCommands').get(ace);
      if (!astCommands) {
        console.error("Error when initializing ace: ace.ext.lang.astCommands not loaded!");
        return;
      }
      kbd.addCommands(astCommands);
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

    setupToolSpecificBindings: function(kbd) {
        kbd.addCommands([{
            name: "runtests",
            exec: function(ed) {
                // hack: get currently active system browser and do "run test command"
                var win = $world.getActiveWindow();
                var focus = $world.focusedMorph();
                var browser = win && win.targetMorph && win.targetMorph.ownerWidget;
                if (!browser || !browser.isSystemBrowser) {
                    alert('Currently not in a SCB!');
                    return;
                }
                var cmd = new lively.ide.RunTestMethodCommand(browser);
                if (!cmd.isActive()) {
                    alert('Not in a test method or class!');
                    return;
                }
                cmd.runTest();
                focus.focus();
            }
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
            name: "stringifySelection",
            exec: function(editor) {
                var sel = editor.selection;
                if (!sel || sel.isEmpty()) return;
                var range =  editor.getSelectionRange(),
                    selString = editor.session.getTextRange(range),
                    stringified = selString
                        .split('\n')
                        .invoke('replace' ,/"/g, '\\"')
                        .invoke('replace' ,/(.+)/g, '"$1\\n"')
                        .join('\n+ ');
                editor.session.doc.replace(range, stringified);
            }
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
                        {stdin: xmlString},
                        function(err, cmd) { thenDo && thenDo(cmd.getCode(), cmd.resultString()); }).resultString();
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

    setupJumpChar: function(kbd) {
        lively.ide.codeeditor.JumpChar.setup(kbd);
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
      lively.whenLoaded(function() {
        lively.ide.allCodeEditors().forEach(function(ea) {
          ea.withAceDo(function(ed) {
            ed.keyBinding.$handlers.forEach(function(h) { delete h.hasLivelyKeys; });
            lively.ide.CodeEditor.KeyboardShortcuts.defaultInstance().attach(ea);
          })
        });
      });
    }
});

(function loadUserKeyBindings() {
  // user key bindings
  try {
    var cust = JSON.parse(lively.LocalStorage.get("user-key-bindings"));
    ace.ext.keys.addKeyCustomizationLayer("user-key-bindings", cust || {});
    var h = ace.require("ace/keyboard/keybinding").KeyBinding.prototype["ace.ext.keys.customized"].detect(function(ea) {
      return ea.layerName === "user-key-bindings"; })

    var proto = ace.ext.keys.KeyHandlerForCustomizations.prototype
    proto.handleKeyboard = proto.handleKeyboard.getOriginal().wrap(function (proceed, data, hashId, keyString, keyCode) {
      var cmd = proceed(data, hashId, keyString, keyCode);
      if (!cmd || !cmd.command || !cmd.command.startsWith("global:")) return cmd;
      var name = cmd.command.replace('global:', "");
      var globalCommand = lively.ide.commands.byName[name];
      if (!globalCommand) return cmd;
      if (!data.editor.commands[name]) {
        data.editor.commands.addCommand({
          name: name, exec: function(ed, args) { lively.ide.commands.exec(name, args); },
        })
      }
      return lively.lang.obj.merge(cmd, {command: name});
    });

  } catch (e) {
    console.error("Error setting ace user keys:\n" + e);
  }
})();


(function initializeKeyboardRelatedAceSettings() {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // no Ctrl-Shift-Space
  ace.require("ace/autocomplete").Autocomplete.startCommand.bindKey = "Ctrl-Space|Alt-Shift-Space|Alt-Space";

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // tabs
  var tabSize = lively.Config.get('defaultTabSize');
  module("lively.ide.CodeEditor").runWhenLoaded(function() {
    lively.morphic.CodeEditor.prototype.style.tabSize = tabSize; });

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // make paren behavior the default in all modes:
  lively.module('lively.ide.codeeditor.ace').runWhenLoaded(function() {
      lively.ide.ace.require('ace/mode/text').Mode.addMethods({
          // FIXME just overwriting $behaviour property in mode prototype isn't
          // enough because the mode constructor unfortunately sets the behavior
          // directly. So we also delete the ownProperty behavior in attach
          $behaviour: new (lively.ide.ace.require("ace/mode/behaviour/cstyle").CstyleBehaviour)(),
          attach: function(ed) {
              // replace "Null-Behavior" only
              if (this.$behaviour && this.$behaviour.constructor === lively.ide.ace.require("ace/mode/behaviour").Behaviour)
                  delete this.$behaviour;
          }
      });
  });

})();

}) // end of module
