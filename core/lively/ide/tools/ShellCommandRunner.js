module('lively.ide.tools.ShellCommandRunner').requires('lively.persistence.BuildSpec', 'lively.ide.CommandLineInterface', 'lively.ide.tools.CommandLine').toRun(function() {

Object.extend(lively.ide.tools.ShellCommandRunner, {
    run: function(cmdString, options, thenDo) {
        var cmd = lively.shell.run(cmdString, options, thenDo);
        return lively.ide.tools.ShellCommandRunner.forCommand(cmd, options)
          .openInWorldCenter().comeForward();
    },
    forCommand: function(cmd, options) {
        options = options || {};
        var runner = lively.BuildSpec('lively.ide.tools.ShellCommandRunner').createMorph();
        runner.attachTo(cmd);
        if (options.extent) runner.setExtent(options.extent);
        return runner;
    },
    findOrCreateForCommand: function(cmd) {
      var existing = cmd.getPid() && $world.submorphs.grep(/ShellCommandRunner/).detect(function(ea) {
          return ea.targetMorph.currentCommand && ea.targetMorph.currentCommand.getPid() === cmd.getPid(); });
      return existing || this.forCommand(cmd);
    }
});

lively.BuildSpec('lively.ide.tools.ShellCommandRunner', {
    _Extent: lively.pt(594.0,336.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "ShellCommandRunner",
    submorphs: [{
        _BorderWidth: 0,
        _Extent: lively.pt(588.0,311.0),
        _Fill: Color.rgb(180,180,180),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        doNotSerialize: ['currentCommand'],
        lastFocused: {isMorphRef: true, name: "commandLine"},
        layout: {
            adjustForNewBounds: true,
            borderSize: 2,
            extentWithoutPlaceholder: lively.pt(686.0,362.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 3,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        name: 'ShellCommandRunner',
        submorphs: [{
            _AutocompletionEnabled: false,
            _BorderColor: Color.rgb(195,195,195),
            _Extent: lively.pt(579.0,266.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(4.7,4.7),
            _ShowActiveLine: false,
            _ShowGutter: false,
            _ShowIndents: false,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _TextMode: "text",
            _aceInitialized: true,
            accessibleInInactiveWindow: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            droppingEnabled: true,
            layout: { resizeHeight: true, resizeWidth: true },
            name: "output",
            storedString: "",
            theme: Config.get('aceWorkspaceTheme'),
            focus: function focus() {
              this.get("ShellCommandRunner").lastFocused = this;
              return $super();
            },

            detectMode: function detectMode() {
              var mode = this.getTextMode(), newMode;
              if (this.textString.startsWith('diff ')) newMode = "diff";
              else newMode = "text";
              if (mode !== newMode) this.setTextMode(newMode);
            }
        },
        lively.BuildSpec('lively.ide.tools.CommandLine').customize({
            _Extent: lively.pt(579.0,19.0),
            _Position: lively.pt(4.7,287.4),
            _TextMode: "text",
            theme: Config.get('aceWorkspaceTheme'),
            clearOnInput: true,
            layout: { resizeWidth: true },
            name: "commandLine",
            getPrefixForShellCompletion: function getPrefixForShellCompletion() {
                var raw = this.find({asString: true, needle: ' ', preventScroll: true, backwards: true, inbetween: true});
                return raw ? raw.trim() : '';
            },
            
            withShellCompletionsDo: function withShellCompletionsDo(input, thenDo) {
                if (input && input.length) input = " '" + input + "'";
                else input = "";
                var results = {};
                var i = 0;
                [{cmd: 'compgen  -f', type: 'file'},
                 {cmd: 'compgen  -d', type: 'dir'}
                ].doAndContinue(function(next, ea) {
                    lively.shell.exec(ea.cmd + input, function(cmd) {
                        var out = cmd.getStdout().trim();
                        var lines = Strings.lines(out);
                        lines.forEach(function(line) { results[line] = {type: ea.type, rank: null, inverseRank: i}; });
                        next();
                    });
                }, function() {
                    var num = Object.keys(results).length;
                    Properties.forEachOwn(function(_, val) {
                        val.rank = num - val.inverseRank; });
                    thenDo(null, results);
                });
            },
            
            doListProtocol: function doListProtocol() {
                var ed = this;
                var prefix = this.getPrefixForShellCompletion();
                this.withShellCompletionsDo(prefix, function(err, completions) {
                    if (err) { return; }
                    var items = Properties.forEachOwn(completions, function(string, val) {
                        string = string + (val.type === 'dir' ? '/' : '');
                        return {
                            isListItem: true,
                            string: Strings.format("[%s] %s", val.type, string),
                            value: string,
                            rank: val.rank
                        }
                    }).sortByKey('rank');
                    lively.ide.tools.SelectionNarrowing.chooseOne(items,
                        function(err, option) {
                            if (!option) return;
                            ed.find({backwards: true, needle: prefix});
                            ed.insertAtCursor(option, false, true);
                        }, {});
                });
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                //     completer = {
                //     getCompletions: function (editor, session, pos, _, callback) {
                //         var prefix = editor.$morph.getPrefixForShellCompletion();
                //         editor.$morph.withShellCompletionsDo(prefix, function(err, result) {
                //             if (err) { callback(err, []); return; }
                //             var completions = Properties.forEachOwn(result, function(string, val) {
                //                 var value = string + (val.type === 'dir' ? '/' : '');
                //                 return {
                //                     name: string,
                //                     value: value,
                //                     score: 9999999+ val.rank,
                //                     meta: val.type,
                //                 }
                //             });
                //             callback(null, completions);
                //         });
                //     }
                // }
                // // that.aceEditor.completers.push(completer)
                // // that.aceEditor.completers.pop()
            
            },
            
            connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "textString", this, "inputChanged", {converter: 
            function (string) { return this.sourceObj.getInput(); }});
                lively.bindings.connect(this, "input", this.owner, "sendInput", {});
            }
        })],

        browseCommandHistory: function browseCommandHistory() {

            var cmdLine = this.get('commandLine'),
                cmds = lively.ide.CommandLineInterface.history.getCommands(),
                group = this.getGroup(),
                myCommands = cmds.filter(function(cmd) { return cmd.group === group; }),
                restCommands = cmds.withoutAll(myCommands),
                items = restCommands.concat(myCommands)
                    .reverse()
                    .uniqBy(function(a,b) { return a.commandString === b.commandString; })
                    .map(function(ea) {
                        return {isListItem: true, string: ea.commandString, value: ea}
                    });

            lively.ide.tools.SelectionNarrowing.chooseOne(items, function(err, candidate) {
                if (!candidate) return;
                cmdLine.setInput(candidate.commandString);
            }, {});

        },

        getGroup: function getGroup() {
            return this.name + '-' + this.id
        },

        updateTitleBar: function updateTitleBar(cmd) {
        this.getWindow().setTitle(cmd.printState());
    },
        onClose: function onClose(cmd) {
        this.updateTitleBar(cmd);
        this.currentCommand = null;
    },
        onPid: function onPid(pid) {
        var cmd = this.currentCommand;
        this.updateTitleBar(cmd);
    },
        onStart: function onStart(cmd) {
        this.currentCommand = cmd;
        this.updateTitleBar(cmd);
    },
        onStderr: function onStderr(string) {
          if (string.trim()) this.print(string);
    },
        onStdout: function onStdout(string) {
          if (string.trim()) this.print(string);
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        if (!this.lastFocused) this.lastFocused = this.get('commandLine')
        this.lastFocused.focus();
    },

        print: function print(string) {
          var ed = this.get('output');
          var isAtFileEnd = ed.isAtDocumentEnd();
          ed.append(string);
          ed.withAceDo(function(e) {
            ed.detectMode();
            if (isAtFileEnd) {
              e.navigateFileEnd()
              e.renderer.scrollCursorIntoView()
            }
          });
        },

        onKeyDown: function onKeyDown(evt) {
        if (this.showsHalos) return $super(evt);
        var prevSig = this.prevSig; // for signaling the process
        var sig = evt.getKeyString({ignoreModifiersIfNoCombo: true});
        if (sig) this.prevSig = sig;
        switch(sig) {
            case 'Alt-Up': case 'F1': this.get('output').focus(); evt.stop(); return true;
            case 'Alt-Down': case 'F2': this.get('commandLine').focus(); evt.stop(); return true;
            case 'Alt-H': this.browseCommandHistory(); evt.stop(); return true;
        }
        if (this.isRunning()) {
            switch(sig) {
                case 'Control-C': this.killCommand('SIGINT'); evt.stop(); return true;
                case 'Control-D': this.killCommand(prevSig === sig ? 'SIGKILL' : 'SIGQUIT'); evt.stop(); delete this.prevKey; return true;
            }
        }
        return $super(evt);
    },
        
        isRunning: function isRunning() {
        return this.currentCommand && this.currentCommand.isRunning();
    },
        reset: function reset() {
        this.doNotSerialize = ['currentCommand'];
        lively.bindings.connect(this.get('commandLine'), 'input', this, 'sendInput');
        this.getWindow().setTitle('execute Shell command');
        this.get('commandLine').setInput("");
        this.get('output').textString = '';
    },
        sendInput: function sendInput(input) {
        var cmd = this.currentCommand;
        if (cmd && cmd.isRunning()) cmd.write(input+'\n');
        else this.runCommand(input);
    },
        runCommand: function runCommand(command) {
        this.get('output').textString = '';
        var cmd = lively.ide.CommandLineInterface.run(command, {
            addToHistory: true, group: this.getGroup()}, function() {});
        this.listenForEvents(cmd);
        this.onStart(cmd);
    },
        killCommand: function killCommand(signal) {
        this.print('[signal ' + signal + ']');
        var cmd = this.currentCommand;
        if (!cmd) { show('No command running!'); return; }
        if (cmd._killed) { // was killed already?
            cmd.checkIfCommandIsStillAttachedAndRunning();
        } else {
            cmd.kill(signal);
        }
    },
        attachTo: function attachTo(cmd) {
            if (this.currentCommand) {
                show('%s cannot reattach because a current command is still running.', this);
                return;
            }
            this.get('commandLine').addCommandToHistory(cmd.getCommand());
            this.currentCommand = cmd;
            this.listenForEvents(cmd);
            if (cmd.isRunning()) this.updateTitleBar(cmd);
            else this.updateTitleBar(cmd);
            var out = cmd.getStdout() || '';
            var err = cmd.getStderr() || '';
            this.print((out + (err ? "\n" + err : "")).trim());
        },
        listenForEvents: function listenForEvents(cmd) {
            var self = this, listener = {
                onPid: function(pid) { self.onPid(pid); },
                onOut: function(out) { self.onStdout(out); },
                onErr: function(err) { self.onStderr(err); },
                onClose: function(cmd) { self.onClose(cmd); }
            };
            lively.bindings.connect(cmd, 'pid', listener, 'onPid');
            lively.bindings.connect(cmd, 'stdout', listener, 'onOut');
            lively.bindings.connect(cmd, 'stderr', listener, 'onErr');
            lively.bindings.connect(cmd, 'end', listener, 'onClose', {
                updater: function($upd, cmd) {
                    lively.bindings.disconnectAll(this.sourceObj);
                    $upd(cmd);
                }
            });
        },
        morphMenuItems: function morphMenuItems() {
            var items = $super(), self = this;
            items.push(['Browse Running commands', function() { lively.ide.commands.exec('lively.ide.CommandLineInterface.browseRunningShellCommands'); }]);
            items.push(['Show Running commands', function() { lively.ide.commands.exec('lively.ide.CommandLineInterface.showRunningShellCommands'); }]);
            items.push(['Send signal...', 
                ["SIGHUP","SIGINT","SIGTERM", "SIGKILL","SIGUSR1","SIGUSR2"].map(function(sig) {
                    return [sig, self.killCommand.bind(self, sig)]
                })]);
            return items;
        }
    }],
    titleBar: "execute Shell command",
    runCommand: function runCommand(command) {
    return this.targetMorph.runCommand(command);
},
    attachTo: function attachTo(cmd) { this.targetMorph.attachTo(cmd); },
});


}) // end of module
