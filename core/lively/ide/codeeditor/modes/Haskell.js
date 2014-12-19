module('lively.ide.codeeditor.modes.Haskell').requires('lively.ide.codeeditor.ace', "lively.ide.codeeditor.TextOverlay").toRun(function() {

var HaskellMode = lively.ide.ace.require('ace/mode/haskell').Mode;

Object.extend(lively.ide.codeeditor.modes.Haskell, {
    Interface: {},
    AceHaskellMode: HaskellMode
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

    getCurrentSession: function() {
        return this._currentSession = this.ensureSession(this._currentSession);
    },

    setCurrentSession: function(sess) {
        return this._currentSession = this.ensureSession(sess);
    },

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
        return this.parseAnnotations(this.clean(ghcOutput.err)).reject(function(ea) {
            return ea.message.startsWith('The function `main\' is not defined');
        });
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
            // don't put let in front of ":type (>>=)" but let' "x = 33"
            var equalSigns = code.match(/\s*[^:]\=+/g) || [];
            var hasAssignment = equalSigns.invoke('trim').any(function(match) { return match.length === 1; });
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
                data = {
                    sessionId: session.id,
                    baseDirectory: session.baseDirectory,
                    expr: code,
                    prompt: prompt,
                    evalId: 'haskell-eval-' + Strings.newUUID()
                };
            webR.post(JSON.stringify(data), "application/json").withJSONWhenDone(function(json, status) {
                if (json.error) { thenDo && thenDo('Haskell error ' + json.error, ''); return; }
                var resultString = json.result.result;
                var modulePrefixIdx = resultString.indexOf('|')+1;
                var modulePrefix = resultString.slice(0, modulePrefixIdx);
                resultString = resultString
                    .split(modulePrefix).last().trim()
                    .replace(new RegExp('\\n?'+prompt+"$"), '');
                thenDo && thenDo(null, resultString);
            });
        }
    },

    ghciTokenInfo: function(session, token, thenDo) {
        var tokenString = tokenToString(token);
        if (!tokenString) { thenDo(new Error('No valid token'), null); return; }
        var cmd = infoCommand(tokenString);
        this.ghciEval(session, cmd, function(err, json) {
            if (err) { thenDo(err, null); return; }
            var out = json;
            thenDo(null, validResponse(out) ? out : null);
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function validResponse(response) { return !response.startsWith("<interactive>:"); }
        function infoCommand(code) { return ":t (" + code + ")"; }
        function tokenToString(token) {
            var code = token.value.trim();
            return code && code.length ? code : null;
        }
    },

    tokenInfo: function(token, thenDo) {
        // lively.ide.codeeditor.modes.Haskell.Interface.tokenInfoState = null
        if (!token) return;
        var tokenInfoState = this.tokenInfoState || (this.tokenInfoState = {
            cache: {},
            doQuery: Functions.debounce(300, this.ghciTokenInfo.bind(this))
        })
        if (getCachedVal()) { thenDo(null, getCachedVal()); return; }
        tokenInfoState.doQuery(this.getCurrentSession(), token, function(err, result) {
            if (err) { thenDo(err, null); return; }
            addCachedVal(result);
            thenDo(err, result);
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var cacheTTL = 400;/*ms*/
        function getCachedVal() { return tokenInfoState.cache[token.value]; }
        function addCachedVal(val) {
            tokenInfoState.cache[token.value] = val;
            setTimeout(function() { delete tokenInfoState.cache[token.value]; }, cacheTTL);
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
        this.serverConnection('info').get().whenDone(function(report, status) {
            thenDo(status.isSuccess() ? null : report || status, report);
        });
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // reporting
    withHaskellOutputWindowDo: function(func) {
        var name = 'HaskellCheckOutput';
        var win = ($morph(name) || $world.addCodeEditor({
            title: 'Haskell check',
            textMode: 'text',
            extent: pt(600,400),
            lineWrapping: true
        })).getWindow();
        win.name = name;
        func(null, win);
    },

    showOutput: function(msg) {
        this.withHaskellOutputWindowDo(function(err, win) {
            win.targetMorph.textString = msg;
            win.comeForward.bind(win).delay(0);
        });
    }
});

lively.ide.codeeditor.ModeChangeHandler.subclass('lively.ide.codeeditor.modes.Haskell.ChangeHandler',
"settings", {
    targetMode: "ace/mode/haskell",
    showTypeOnSelectionChange: false
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
    },

    onSelectionChange: function(evt) {
        if (!this.showTypeOnSelectionChange) return;
        var haskell = lively.ide.codeeditor.modes.Haskell.Interface
        var ed = evt.codeEditor;
        var token = ed.tokenAtPoint();
        haskell.tokenInfo(token, function(err, tokenInfo) {
            tokenInfo && ed.setStatusMessage(tokenInfo, Color.black);
        });
    }

});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// UI
Object.extend(lively.ide.codeeditor.modes.Haskell, {

    doHoogleSearchWithNarrower: function(codeEditor) {
        var currentHoogleCommand, currentHoogleCommandKillInitialized;
        var string = codeEditor.getSelectionOrLineString();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        var hoogler = Functions.debounce(500, function(input, callback) {
            runHoogle(input, ["search", /*"--info"*/], function(err, result) {
                if (err) show(err);
                var lines = Strings.lines(result || "");
                var candidates = lines.map(function(line) {
                    return line.trim() === '' ? null : {
                        isListItem: true,
                        string: line,
                        value: line
                    };
                }).compact();
                if (candidates.length === 0) candidates = ['nothing found'];
                callback(candidates);
            });
        });

        function candidateBuilder(input, callback) {
          callback(['searching...']);
          hoogler(input, callback);
        };

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        
        var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
            name: '__lively.ide.codeeditor.modes.HaskellHoogle.NarrowingList',
            // reactivateWithoutInit: true,
            spec: {
                prompt: 'search for: ',
                candidatesUpdaterMinLength: 3,
                candidates: [],
                maxItems: 25,
                candidatesUpdater: candidateBuilder,
                input: string,
                // keepInputOnReactivate: true,
                actions: [{
                    name: 'open',
                    exec: function(candidate) {
                        codeEditor.printObject(null, candidate, false);
                    }
                }, {
                    name: "show info",
                    exec: function(candidate) {
                        var input = candidate.split(" ")[1] || candidate;
                        runHoogle(input, ["search", "--info"], function(err, result) {
                            var content = err ? err + "\n" + result : result,
                                title = 'info for: ' + candidate;
                            $world.addCodeEditor({title: title, content: content, textMode: 'text', lineWrapping: true}).getWindow().comeForward();
                        });
                    }
                }, {
                    name: "open search results in workspace",
                    exec: function() {
                        var state = narrower.state,
                            content = narrower.getFilteredCandidates(state.originalState || state).pluck('match').join('\n'),
                            title = 'search for: ' + narrower.getInput();
                        $world.addCodeEditor({title: title, content: content, textMode: 'text'}).getWindow().comeForward();
                    }
                }]
            }
        });

        function runHoogle(input, flags, thenDo) {
            if (currentHoogleCommand) {
                if (!currentHoogleCommandKillInitialized) {
                    currentHoogleCommandKillInitialized = true;
                    currentHoogleCommand.kill();
                }
                runHoogle.curry(input, flags, thenDo).delay(0.1);
                return;
            }
            currentHoogleCommand = lively.shell.run('cd $HOME; hoogle ' + flags.join(' ') + ' "' + input + '"', {}, function(err, cmd) {
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
                };
            }
        }
    }

});

HaskellMode.addMethods({

    $outdent: new (lively.ide.ace.require("ace/mode/matching_brace_outdent").MatchingBraceOutdent)(),
    $behaviour: new (lively.ide.ace.require("ace/mode/behaviour/cstyle").CstyleBehaviour)(),
    foldingRules: new (lively.ide.ace.require("ace/mode/folding/cstyle").FoldMode)(),
    // FIXME currently ace has this wrong but I should submit a fix...
    blockComment: {start: "{-", end: "-}"},

    commands: {

        doHoogleSearch: {
            exec: function(ed) { lively.ide.codeeditor.modes.Haskell.doHoogleSearchWithNarrower(ed.$morph); }
        },

        checkHaskellCode: {
            exec: function(ed) {
                var haskell = lively.ide.codeeditor.modes.Haskell.Interface;
                haskell.checkHaskellCode({
                    id: haskell.getCurrentSession().id,
                    code: ed.$morph.textString || ''
                }, function(err, result) {
                    if (!result) { show(err); return; }
                    function printCheck(spec) { return Strings.format('at line %s column %s:\n%s', spec.pos.row, spec.pos.column, spec.message) }
                    var errors = haskell.getGHCErrors(result.ghc),
                        hlint = haskell.getHLintWarnings(result.hlint),
                        message = Strings.format("ghc:\n%s\n\n\nhlint:\n%s",
                            errors.map(printCheck).join('\n\n'),
                            hlint.map(printCheck).join('\n\n'));
                    haskell.showOutput(message);
                });
            }
        },

        loadHaskellModule: {
            exec: function(ed) {
                ed.$morph.doSave();
                (function() { lively.ide.commands.exec('haskell.ghciLoad', ed.$morph); }).delay(0);
            }
        },

        reloadHaskellModule: {
            exec: function(ed) {
                ed.$morph.doSave();
                (function() { lively.ide.commands.exec('haskell.reload', ed.$morph); }).delay(0);
            }
        },

        haskellInfoForThingAtPoint: {
            exec: function(ed, thenDo) {
                var haskell = lively.ide.codeeditor.modes.Haskell.Interface
                var editor = ed.$morph;
                var token = ed.selection.isEmpty() ?
                    editor.tokenAtPoint() : {
                      index: 0, start: 0, type: "unknown token",
                      value: ed.$morph.getTextRange()
                    };
                haskell.tokenInfo(token, function(err, tokenInfo) {
                    if (thenDo) thenDo(err, tokenInfo);
                    else tokenInfo && editor.setStatusMessage(tokenInfo, Color.black);
                });
            }
        },

        printHaskellInfoForThingAtPoint: {
            exec: function(ed) {
                var HaskellMode = lively.ide.ace.require('ace/mode/haskell').Mode;
                var printCmd = HaskellMode.prototype.commands.haskellInfoForThingAtPoint
                printCmd.exec(ed, function(err, info) {
                    ed.$morph.printObject(null, info, false)
                });
            }
        }
    },

    keybindings: {
        "Command-Shift-h": "doHoogleSearch",
        "Command-Shift-c": "checkHaskellCode",
        "Command-Shift-l": "loadHaskellModule",
        "Command-Shift-r": "reloadHaskellModule",
        "Command-Shift-i": "printHaskellInfoForThingAtPoint",
        "Command-Shift-y": "haskellInfoForThingAtPoint"
    },

    keyhandler: null,

    initKeyHandler: function() {
        Properties.forEachOwn(this.keybindings, function(key, commandName) {
            if (this.commands[commandName]) this.commands[commandName].bindKey = key;
        }, this);
        return this.keyhandler = lively.ide.ace.createKeyHandler({
            keyBindings: this.keybindings,
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
        // FIXME: Cleanup really needed!
        var sourceString = codeEditor.getSelectionOrLineString();
        var noDefRe = /^\s*(<class|data|i(mport|n(fix(|[lr])|stance))|module|primitive|type|newtype)>/;
        var haskell = lively.ide.codeeditor.modes.Haskell.Interface;
        var sess = haskell.getCurrentSession();
        haskell.ghciEval(sess, sourceString, printResult);
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
        }
    },

    morphMenuItems: function(items, editor) {
        var mode = this;
        items.push(['Haskell',[
            ['hoogle search (Alt-h)', function() { mode.commands.doHoogleSearch.exec(editor.aceEditor); }],
            ['check Haskell code (Alt-c)', function() { mode.commands.checkHaskellCode.exec(editor.aceEditor); }],
            ['load Haskell module (Alt-l)', function() { mode.commands.loadHaskellModule.exec(editor.aceEditor); }],
            ['reload Haskell module (Alt-r)', function() { mode.commands.reloadHaskellModule.exec(editor.aceEditor); }],
            ['haskell info for thing at point (Alt-i)', function() { mode.commands.haskellInfoForThingAtPoint.exec(editor.aceEditor); }]
        ]]);

        return items;
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
                exec: function(codeEditor) {
                    var focused = codeEditor || lively.morphic.Morph.focusedMorph();
                    var path = focused && focused.isCodeEditor && focused.getTargetFilePath();
                    if (!path) {
                        show('%s does not point to a file!', focused);
                        return true;
                    }
                    haskell.ghciEval(haskell.getCurrentSession(), ':load ' + path, function(err, result) {
                        if (result.trim().split('\n').length > 2) haskell.showOutput(result);
                        else $world.setStatusMessage(result);
                    })
                    return true;
                }
            },

            'haskell.reload': {
                description: 'Haskell session reload (ghci :reload)',
                exec: function(session) {
                    session = session || haskell.getCurrentSession();
                    haskell.ghciEval(session, ":reload\n", function(err, result) {
                        if (result.split('\n').length > 2) haskell.showOutput(result);
                        else $world.setStatusMessage(result);
                    })
                    return true;
                }
            },

            'haskell.selectSession': {
                description: 'select a Haskell eval session',
                exec: function(codeEditor) {
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
                    haskell.serverInfo(function(err, report) {
                        var name = 'HaskellServerInfo',
                            info = typeof report === 'string' ? report : JSON.stringify(err || report, 0, 2),
                            infoText = $morph(name);
                        if (infoText) {
                            infoText.textString = info;
                        } else {
                            infoText = $world.addCodeEditor({
                                title: "Haskell processes",
                                textMode: "text",
                                extent: pt(700,200),
                                content: info
                            });
                            infoText.name = name;
                            infoText.withAceDo(function(ed) {
                                ed.getKeyboardHandler().addCommands({
                                    name: 'reloadHaskellServerInfo',
                                    bindKeys: 'cmd-u',
                                    exec:function(ed) {
                                        show("???")
                                        lively.ide.commands.exec('haskell.serverInfo');
                                    }
                                });
                            })
                        }
                        infoText.getWindow().comeForward();
                    });
                }
            }

        });
    });
})();

(function registerModeHandler() {
    lively.module('lively.ide.codeeditor.DocumentChange').runWhenLoaded(function() {
        lively.ide.CodeEditor.DocumentChangeHandler.registerModeHandler(lively.ide.codeeditor.modes.Haskell.ChangeHandler);
    });
})();

}); // end of module
