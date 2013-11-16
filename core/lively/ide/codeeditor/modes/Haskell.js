module('lively.ide.codeeditor.modes.Haskell').requires('lively.ide.codeeditor.ace', "lively.ide.codeeditor.TextOverlay").toRun(function() {

Object.extend(lively.ide.codeeditor.modes.Haskell, {
    Interface: {},
    AceHaskellMode: lively.ide.ace.require('ace/mode/haskell').Mode
});

Object.extend(lively.ide.codeeditor.modes.Haskell.Interface, {
    lineNoErrRe: /:([0-9]+):([0-9]+):/,
    lineNoStackRe:  /:([0-9]+):(?:([0-9]+)\-)?([0-9]+)$/,
    // session support
    _sessions: [],
    _currentSession: null,
    _sessionOrId: function(sessOrId) {
        var id =  Object.isString(sessOrId) ? sessOrId : sessOrId.id;
        return this._sessions.detect(function(ea) { return ea.id === id; });
    },
    ensureSession: function(sessOptions) {
        if (!sessOptions || !sessOptions.id) sessOptions = 'default';
        var sess = this._sessionOrId(sessOptions);
        return sess ? sess : this.addSession(sessOptions);
    },
    getCurrentSession: function() { return this._currentSession = this.ensureSession(this._currentSession); },
    setCurrentSession: function(sess) { return this._currentSession = this.ensureSession(sess); },
    getSessions: function() {
        // lively.ide.codeeditor.modes.Haskell.Interface._sessions = []
        // lively.ide.codeeditor.modes.Haskell.Interface.getSessions()
        // lively.ide.codeeditor.modes.Haskell.Interface.reset()
        var s = this._sessions;
        if (!s.length) this.addSession({id: 'default', baseDirectory: lively.shell.cwd()});
        return s;
    },
    addSession: function(options) {
        var existing = this._sessionOrId(options);
        if (existing) return existing;
        var session = {
            id: options.id || Strings.newUUID(),
            baseDirectory: options.baseDirectory || null
        };
        this._sessions.push(session);
        return session;
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // request syntax checks
    checkHaskellCode: function(data, thenDo) {
        var webR = URL.nodejsBase.withFilename('HaskellServer/check').asWebResource().beAsync();
        webR.post(JSON.stringify(data), "application/json").withJSONWhenDone(function(json, status) {
            thenDo(json.error, json.result);
        });
    },

    checkHaskellCodeDebounced: Functions.debounce(800, function(codeEditor, thenDo) {
        var haskell = lively.ide.codeeditor.modes.Haskell.Interface;
        haskell.checkHaskellCode({
            id: haskell.getCurrentSession().id,
            code: codeEditor.textString || ''
        }, thenDo);
    }),

    // processing syntax check result
    clean: function(string) { return (string || '').trim(); },

    parseAnnotations: function(string) {
        var lineNoErrRe = this.lineNoErrRe;
        var lineNoStackRe = this.lineNoStackRe;
        var messageStrings = string.split('\n\n');
        return messageStrings.map(function(message) {
            message = message.trim();
            var lines = Strings.lines(message);
            var positions = lines.map(function(line) {
                var match;
                if ((match = line.match(lineNoErrRe))) return {row: Number(match[1])-1, column: Number(match[2])-1};
                if ((match = line.match(lineNoStackRe))) return {row: Number(match[1])-1, column: Number(match[3])-1};
                return null;
            }).compact();
            // first line is location, we have this already, then remove indent
            lines = lines.slice(1).invoke('replace', /^    /, '');
            if (!positions.length) return null;
            var ann = {pos: null, message: lines.join('\n')}
            var whichPos = positions.length === 1 ? 0 : 1;
            ann.pos = positions[whichPos]; return ann;
        }).compact();
    },

    getGHCErrors: function(ghcOutput) {
        return this.parseAnnotations(this.clean(ghcOutput.err));
    },

    getHLintWarnings: function(hlintOutput) {
        return this.parseAnnotations(this.clean(hlintOutput.out));
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // code evaluation

    wrapHaskellCode: function(code) {
        // puts code into a form that ghci can run it. (function) defs need to
        // a different syntax than invocations evaluated
        code = code.replace(/\n+$/, "");
        function wrap(code) { return Strings.format(':{\n%s\n:}\n', code) }
        var noDefRe = /^\s*(class|data|i(mport|n(fix(|[lr])|stance))|module|primitive|type|newtype)/;
        if (noDefRe.test(code)) return wrap(code);

        if (!code.include('|') && !code.include('::') || (code.include('::') && code.split('\n').length <= 1)) {
            var equalSigns = code.match(/\=+/g) || [];
            var hasAssignment = equalSigns.any(function(match) { return match.length === 1; });
            if (!hasAssignment) return wrap(code);
        }
        var lines = code.split('\n').invoke('trim').reject(function(line) { line.trim().length; });
        lines = lines.map(function(line, i) {
            var nextLine = lines[i+1];
            if (!nextLine || nextLine.match(/^\||where/)) return line + ' ';
            return line + '; ';
        });
        code = lines.join('')
        var needsLet = !lines[0].include('let');
        if (needsLet) code = Strings.format("let { %s }", code);
        console.log('Haskell eval: %s', code);
        return wrap(code);
    },
    ghciEval: function(session, sourceString, thenDo) {
        var realSession = this.ensureSession(session);
        evalHaskellCode(realSession, this.wrapHaskellCode(sourceString), thenDo);
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function evalHaskellCode(session, code, thenDo) {
            var prompt = "<lively λ>";
            var webR = URL.nodejsBase.withFilename('HaskellServer/eval').asWebResource().beAsync(),
                data = {sessionId: session.id, baseDirectory: session.baseDirectory, expr: code, prompt: prompt};
            webR.post(JSON.stringify(data), "application/json").withJSONWhenDone(function(json, status) {
                if (json.error) { thenDo('Haskell error ' + json.error, ''); return; }
                json.result.output = json.result.result
                    .replace(/^(\*?(?:\w+\s*)+\|\s+)+/, '')
                    .replace(new RegExp('\\n?'+prompt+"$"), '');
                thenDo(null, json.result);
            });
        }

    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // reset
    reset: function(thenDo) {
        // lively.ide.codeeditor.modes.Haskell.Interface.reset()
        this.clientReset();
        this.serverReset(thenDo);
    },
    clientReset: function() {
        this._sessions = [];
        this.addSession({id: 'default', baseDirectory: lively.shell.cwd()});
        this._currentSession = null;
    },
    serverReset: function(thenDo) {
        this.serverConnection('reset').post().whenDone(function(content, status) {
            thenDo && thenDo(status.isSuccess() ? null : {status: status, content: content});
        });
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // networking
    serverConnection: function(serviceName) {
        return URL.nodejsBase.withFilename('HaskellServer/' + serviceName).asWebResource().beAsync();
    },
    serverInfo: function(thenDo) {
        this.serverConnection('processes').get().withJSONWhenDone(function(json, status) {
            thenDo(status.isSuccess() ? null : json || status, json);
        });
    },
});

lively.ide.codeeditor.ModeChangeHandler.subclass('lively.ide.codeeditor.modes.Haskell.ChangeHandler',
"settings", {
    targetMode: "ace/mode/haskell"
},
"initializing", {
    initialize: function() {}
},
'rendering', {
    onDocumentChange: function(evt) {
        evt.codeEditor.removeTextOverlay();
        var haskellInterface = lively.ide.codeeditor.modes.Haskell.Interface,
            self = this,
            marker = this.ensureLivelyCodeMarker(evt.session),
            ed = evt.codeEditor;
        marker.modeId = this.targetMode;
        marker.markerRanges.length = 0;
        haskellInterface.checkHaskellCodeDebounced(ed, function(err, result) {
            if (!result || !result.ghc) { /*show(err);*/ return; }
            var overlayBounds = [];
            if (ed.getShowErrors()) {
                var errors = haskellInterface.getGHCErrors(result.ghc).map(function(spec) {
                    return Object.extend({cssClassName: "ace-syntax-error"}, spec); });
                self.renderErrorsAndWarnings(ed, errors, overlayBounds);
            }
            if (ed.getShowWarnings()) {
                var warnings = haskellInterface.getHLintWarnings(result.hlint).map(function(spec) {
                    return Object.extend({cssClassName: "ace-marker-warning"}, spec); });
                self.renderErrorsAndWarnings(ed, warnings, overlayBounds);
            }
        })
    },

    renderErrorsAndWarnings: function(ed, errorOrWaningSpecs, overlayBounds) {
        if (!errorOrWaningSpecs || !errorOrWaningSpecs.length) return false;
        if (!ed.getShowErrors()) return;
        var marker = this.ensureLivelyCodeMarker(ed.aceEditor.session);
        errorOrWaningSpecs.forEach(function(spec) {
            this.drawMarkerHighlight(spec, ed, marker);
            this.addOverlay(spec, ed, marker, overlayBounds);
        }, this);
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// UI
Object.extend(lively.ide.codeeditor.modes.Haskell, {
    doHoogleSearchWithNarrower: function(codeEditor) {
        var currentHoogleCommand, currentHoogleCommandKillInitialized;
        function runHoogle(input, flags, thenDo) {
            if (currentHoogleCommand) {
                if (!currentHoogleCommandKillInitialized) {
                    currentHoogleCommandKillInitialized = true;
                    currentHoogleCommand.kill();
                }
                runHoogle.curry(input, flags, thenDo).delay(0.1);
                return;
            }
            currentHoogleCommand = lively.shell.exec('cd $HOME; hoogle ' + flags.join(' ') + ' "' + input + '"', function(cmd) {
                currentHoogleCommand = null;
                if (currentHoogleCommandKillInitialized) {
                    currentHoogleCommandKillInitialized = false;
                    return;
                }
                var stderr = cmd.getStderr().trim();
                thenDo(cmd.getCode() && stderr, cmd.getStdout());
            });
        }

        // x=parseHoogleSearchResultItem(line)
        function parseHoogleSearchResultItem(line) {
            return parseFunction() || parsePackage();
            function parsePackage() {
                // line = "package enummapset-th"
                var match = line.match(/^package (.*)$/);
                if (!match || match.length < 1) return null;
                return {
                    isListItem: true, string: line,
                    value: {
                        kind: 'package',
                        string: line,
                        name: match[1],
                        insertString: match[1],
                    }
                }
            }
            function parseFunction() {
                // line = "Data.ByteString.Char8 mapAccumL :: (acc -> Char -> (acc, Char)) -> acc -> ByteString -> (acc, ByteString)"
                var match = line.match(/^([^\s]+) ([^\s]+) :: (.*)$/);
                if (!match || match.length < 3) return null;
                return {
                    isListItem: true, string: line,
                    value: {
                        kind: 'function',
                        insertString: match[2] + ' :: ' + match[3],
                        module: match[1],
                        name: match[2],
                        type: match[3]
                    }
                }
            }
        }

        function runHoogleSearch(searchTerm, thenDo) {
            runHoogle(searchTerm, [], function(err, output) {
                var results = output.split('\n').invoke('trim').map(parseHoogleSearchResultItem).compact();
                thenDo(err, results);
            });
        }

        // runHoogleInfo(x, show.curry('%s %s'))
        function runHoogleInfo(spec, thenDo) {
            // spec: {kind: 'package'|'function', name: STRING}
            var searchTerm;
            switch (spec.kind) {
                case 'package': searchTerm = 'package.' + spec.name;
                case 'function': searchTerm = spec.module + '.' + spec.name;
                default: searchTerm = spec.name || '';
            }
            runHoogle(searchTerm, ['--info'], function(err, output) { thenDo(err, output); });
        }

        var doHoogleSearch = Functions.debounce(300, function(input, callback) {
            runHoogleSearch(input, function(err, matches) {
                err && show(err);
                callback(matches);
            })
        })

        // doHoogleSearch('map');
        // doHoogleSearch('Control.Monad.mapAndUnzipM');

        var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
            name: 'lively.ide.codeeditor.Haskell.hoogle',
            reactivateWithoutInit: true,
            spec: {
                prompt: 'hoogle: ',
                candidates: [],
                candidatesUpdater: function candidateBuilder(input, callback) { callback(['searching...']); doHoogleSearch(input, callback); },
                candidatesUpdaterMinLength: 1,
                maxItems: 25,
                keepInputOnReactivate: true,
                actions: [{
                    name: 'insert found item',
                    exec: function(candidate) {
                        if (codeEditor && codeEditor.isCodeEditor) {
                            var ed = codeEditor, start = ed.getCursorPositionAce();
                            ed.printObject(null, candidate.insertString);
                            var range = ed.getSelectionRangeAce();
                            // select the type decl to easily remove it
                            var typeDeclRange = ed.aceEditor.find({needle: ' ::', preventScroll: true, start: start, backwards: false});
                            if (typeDeclRange) {
                                ed.setSelectionRangeAce({start: typeDeclRange.start, end: range.end});
                            }
                        } else {
                            $world.addCodeEditor({content: Objects.inspect(candidate), textMode: 'text'});
                        }
                    }
                }, {
                    name: 'hoogle info',
                    exec: function(candidate) {
                        runHoogleInfo(candidate, function(err, result) {
                            $world.addCodeEditor({
                                title: candidate.printString,
                                content: result,
                                textMode: 'text',
                                lineWrapping: true
                            }).getWindow().comeForward();
                        });
                    }
                }]
            }
        })
    }
});

lively.ide.codeeditor.modes.Haskell.AceHaskellMode.addMethods({
    $outdent: new (lively.ide.ace.require("ace/mode/matching_brace_outdent").MatchingBraceOutdent)(),
    $behaviour: new (lively.ide.ace.require("ace/mode/behaviour/cstyle").CstyleBehaviour)(),
    foldingRules: new (lively.ide.ace.require("ace/mode/folding/cstyle").FoldMode)(),
    // FIXME currently ace has this wrong but I should submit a fix...
    blockComment: {start: "{-", end: "-}"},
    commands: {
        doHoogleSearch: {
            exec: function(ed) { lively.ide.codeeditor.modes.Haskell.doHoogleSearchWithNarrower(ed.$morph); }
        }
    },
    keybindings: {"Alt-h": "doHoogleSearch"},
    keyhandler: null,
    initKeyHandler: function() {
        var h = this.keyhandler = lively.ide.ace.createKeyHandler({
            bindings: this.keybindings,
            commands: this.commands
        });
    },

    attach: function(ed) {
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
    },

    detach: function(ed) {
        this.keyhandler = null;
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
    },

    doEval: function doEval(codeEditor, insertResult) {
        var haskell = lively.ide.codeeditor.modes.Haskell.Interface;
        haskell.ghciEval(
            haskell.getCurrentSession(),
            codeEditor.getSelectionOrLineString(),
            function(err, result) { printResult(err, result.output); })
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (!insertResult) { codeEditor.aceEditor.session.selection.clearSelection(); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
        }
    }
});

(function setupHaskellClientState() {
    var haskell = lively.ide.codeeditor.modes.Haskell.Interface;
    require('lively.ide.CommandLineInterface').toRun(function() {
        haskell.clientReset();
        // haskell.reset();
    });
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    require('lively.ide.commands.default').toRun(function() {
        Object.extend(lively.ide.commands.byName, {
            'haskell.reset': {
                description: 'reset Haskell client and server',
                exec: function() {
                    haskell.serverReset(function(err) {
                        if (err) show(err); else alertOK('Haskell client and server resetted');
                    });
                    return true;
                }
            },
            'haskell.ghciLoad': {
                description: 'haskell ghci :load file into current session',
                exec: function() {
                    var focused = lively.morphic.Morph.focusedMorph();
                    var win = focused && focused.getWindow();
                    if (!focused || !focused.isCodeEditor || !win || !win.getLocation) {
                        show('Not in a Text Editor!');
                        return true;
                    }
                    var filepath = win.getLocation(true);
                    haskell.ghciEval(haskell.getCurrentSession(), ':load ' + filepath, function(err, result) {
                        focused.setStatusMessage(result.output);
                    })
                    return true;
                }
            },
            'haskell.reload': {
                description: 'Haskell session reload (ghci :reload)',
                exec: function(session) {
                    session = session || haskell.getCurrentSession();
                    haskell.ghciEval(session, ":reload\n", function(err, result) { show(result.output); })
                    return true;
                }
            },
            'haskell.selectSession': {
                description: 'select a Haskell eval session',
                exec: function() {
                    var haskell = lively.ide.codeeditor.modes.Haskell.Interface;
                    var sessions = haskell.getSessions()
                    var list = sessions.map(function(sess) {
                        return {
                            isListItem: true,
                            string: printSession(sess),
                            value: selectSession.curry(sess)
                        }
                    }).concat([{
                        isListItem: true,
                        string: '<create new Haskell process>',
                        value: createNewSession
                    }]);

                    function createNewSession() {
                        var id = Strings.newUUID(), dir;
                        [function(next) {
                            $world.prompt('Session name:', function(input) {
                                input = input || id; id = input; next();
                            }, id);
                        }, function(next) {
                            $world.prompt('Base directory:', function(input) {
                                dir = input; next();
                            }, lively.shell.cwd());
                        }].doAndContinue(null, function() {
                            selectSession(haskell.addSession({id: id, baseDirectory: dir}));
                        });
                    }

                    function printSession(sess) { return Strings.format("%s (%s)", sess.id, sess.baseDirectory); }
                    function selectSession(session) { haskell.setCurrentSession(session); alertOK("Selected " + printSession(session)); }

                    lively.ide.tools.SelectionNarrowing.getNarrower({
                        name: 'haskell.sessionSelector',
                        input: '',
                        spec: {
                            prompt: 'select session: ',
                            candidates: list,
                            keepInputOnReactivate: true,
                            actions: [
                                {name: 'select', exec: function(candidate) { candidate && candidate(); }},
                                {name: 'reset sessions', exec: function(_) { lively.ide.commands.exec('haskell.reset'); }}]
                        }
                    });
                    return true;
                }
            },
            'haskell.serverInfo': {
                description: 'show Haskell session info (server)',
                exec: function() {
                    var haskell = lively.ide.codeeditor.modes.Haskell.Interface;
                    haskell.serverInfo(function(err, state) {
                        var name = 'HaskellServerInfo';
                        var info = JSON.stringify(err || state, 0, 2);
                        var infoText = $morph(name);
                        if (infoText) {
                            infoText.textString = info;
                        } else {
                            infoText = $world.addCodeEditor({
                                title: "Haskell processes",
                                content: info
                            });
                            infoText.name = name;
                        }
                        infoText.getWindow().comeForward();
                    });
                }
            }
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        Object.extend(lively.ide.commands.defaultBindings, { // bind commands to default keys
            'haskell.selectSession': "cmd-s-l h a s s",
            'haskell.serverInfo': "cmd-s-l h a s i",
            'haskell.reload': "cmd-s-l h a s r",
            'haskell.ghciLoad': "cmd-s-l h a s l"
        });
    });
})();

}) // end of module
