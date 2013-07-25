module('lively.ide.commands.default').requires().toRun(function() {

Object.extend(lively.ide.commands, {
    byName: {},
    defaultBindings: {},
    exec: function(commandName, arg1, arg2, arg3, arg4) {
        var cmd = lively.ide.commands.byName[commandName];
        try {
            return !cmd || !cmd.exec ? null : cmd.exec(arg1, arg2, arg3, arg4);
        } catch(err) {
            show('Error when executing command %s:\n %s', commandName, err);
            return false;
        }
    },
    addCommand: function(name, command) {
        if (!command) delete lively.ide.commands.byName[name];
        else lively.ide.commands.byName[name] = command;
    }
});

Object.extend(lively.ide.commands.byName, {
    // world
    'lively.morphic.World.escape': {
        description: 'escape',
        exec: function() {
            // Global Escape will drop grabbed morphs, remove menus, close halos
            var world = lively.morphic.World.current(), h = world.firstHand();
            if (h.submorphs.length > 0) { h.dropContentsOn(world); return true; }
            if (world.worldMenuOpened) { h.removeOpenMenu(event); return true; }
            if (world.hasSelection()) { world.resetSelection(); return true; }
            if (world.currentHaloTarget) { world.removeHalosOfCurrentHaloTarget(); return true; }
            return false;
        }
    },
    'lively.morphic.World.save': {
        description: 'save world',
        exec: function() {
            $world.saveWorld(); return true;
        }
    },
    'lively.morphic.World.saveAs': {
        description: 'save world as',
        exec: function() {
            $world.interactiveSaveWorldAs(); return true;
        }
    },

    'lively.morphic.World.changeUserName': {
        description: 'change user name',
        exec: function() {
            $world.askForUserName(); return true;
        }
    },
    'lively.morphic.World.setExtent': {
        description: 'set world extent',
        exec: function() { $world.askForNewWorldExtent(); }
    },
    // morphic
    'lively.morphic.Halos.show': {
        description: 'show halo',
        exec: function() {
            var focused = lively.morphic.Morph.focusedMorph(),
                morph = $world.getActiveWindow() || focused;
            if (!morph) return true;
            if (morph.showsHalos) morph.removeHalos();
            else morph.showHalos();
            focused && focused.focus.bind(focused).delay(0);
            return true;
        }
    },
    // lists
    'lively.morphic.List.selectItem': {
        exec: function() {
            var focused = lively.morphic.Morph.focusedMorph();
            if (!focused || !focused.isList) return false;
            lively.ide.tools.SelectionNarrowing.getNarrower({
                name: "lively.morphic.List.selectItem.NarrowingList",
                spec: {
                    prompt: 'item: ',
                    // wrap list items in listItems...
                    candidates: (focused.itemList||[]).map(function(ea, i) {
                        var string = ea.isListItem ? ea.string : String(ea);
                        return {isListItem: true, string: string, value: i};
                    }),
                    maxItems: 25,
                    actions: [function(index) { focused.selectAt(index); }]
                }
            });
            return true;
        }
    },
    // windows
    'lively.morphic.Window.rename': {
        description: 'rename active window',
        exec: function() {
            var focused = lively.morphic.Morph.focusedMorph(),
                win = focused && focused.getWindow();
            if (!win) { show('Cannot find active window!'); return; }
            $world.prompt('Enter new window title', function(input) {
                if (input !== null) win.titleBar.setTitle(input || '');
            }, win.titleBar.getTitle());
            return true;
        }
    },
    'lively.morphic.Window.gather': {
        description: 'gather all windows at mouse cursor',
        exec: function() {
            function restack(parent, filter) {
                var morphs = parent.submorphs.select(filter),
                    pos = parent.hands[0].getPosition();
                morphs.inject(pos, function(pos, win) {
                    win.setPosition(pos);
                    return pos.addXY(30,30);
                });
            }
            restack($world, function(ea) { return ea.isWindow; });
            return true;
        }
    },
    'lively.morphic.Window.close': {
        description: 'close active window',
        exec: function() {
            $world.closeActiveWindow();
            return true;
        }
    },
    'lively.ide.WindowNavigation.start': {
        description: 'open window navigator',
        exec: function() {
            lively.ide.WindowNavigation.WindowManager.current().startWindowSelection();
            return true;
        }
    },
    // commands
    'lively.ide.commands.keys.reset': {
        description: 'reset key bindings',
        exec: function() {
            lively.ide.CodeEditor.KeyboardShortcuts.reinitKeyBindingsForAllOpenEditors();
            lively.ide.WindowNavigation.WindowManager.reset();
            lively.morphic.KeyboardDispatcher.reset();
            lively.ide.tools.SelectionNarrowing.resetCache();
            return true;
        },
    },
    'lively.ide.tools.SelectionNarrowing.activateLastActive': {
        description: 'open last active selection narrower',
        exec: function() {
            var n = lively.ide.tools.SelectionNarrowing && lively.ide.tools.SelectionNarrowing.lastActive;
            n && n.activate();
        }
    },
    'lively.ide.commands.execute': {
        description: 'execute command',
        exec: function() {
            function getDefaultCommands() {
                return Properties.forEachOwn(lively.ide.commands.byName, function(name, cmd) {
                    var label = cmd.description || name;
                    return {isListItem: true, string: label, value: cmd}
                });
            }
            function getCodeEditorCommands(codeEditor) {
                var shortcutMgr = lively.ide.CodeEditor.KeyboardShortcuts.defaultInstance(),
                    cmds = shortcutMgr.allCommandsOf(codeEditor),
                    candidates = Properties.forEachOwn(cmds, function(name, cmd) {
                        return {
                            isListItem: true,
                            string: '[text] ' + name,
                            value: {exec: function(attribute) { cmd.exec(codeEditor.aceEditor); }}
                        };
                    });
                return candidates;
            }
            function getCommands() {
                var commands = getDefaultCommands(),
                    focused = lively.morphic.Morph.focusedMorph();
                focused.isCodeEditor && commands.pushAll(getCodeEditorCommands(focused));
                return commands;
            }
            lively.ide.tools.SelectionNarrowing.getNarrower({
                name: 'lively.ide.commands.execute.NarrowingList',
                spec: {
                    prompt: 'exec command: ',
                    candidates: getCommands(),
                    maxItems: 25,
                    keepInputOnReactivate: true,
                    actions: [function(candidate) { candidate.exec(); }]
                }
            });
            return true;
        }
    },
    // browsing
    'lively.ide.SystemCodeBrowser.openUserConfig': {
        description: 'browse user config.js',
        exec: function() { $world.showUserConfig(); }
    },
    'lively.ide.browseFiles': {
        description: 'browse files',
        exec: function() {
            function makeCandidates(dir, files) {
                return Object.keys(files).map(function(fullPath) {
                    var relativePath = fullPath.slice(dir.length+1);
                    if (relativePath.length === 0) return null;
                    return {
                        string: relativePath,
                        value: {dir: dir, fullPath: fullPath, relativePath: relativePath},
                        isListItem: true
                    }
                }).compact();
            }
            function update(candidates, narrower, thenDo) {
                dir = narrower.dir || lively.shell.exec('pwd', {sync:true}).resultString();
                require('lively.ide.DirectoryWatcher').toRun(function() {
                    lively.ide.DirectoryWatcher.withFilesOfDir(dir, function(files) {
                        candidates.length = 0;
                        candidates.pushAll(makeCandidates(dir, files));
                        thenDo();
                    });
                });
            }
            var dir, candidates = [], spec = {
                name: 'lively.ide.browseFiles.NarrowingList',
                spec: {
                    candidates: candidates,
                    prompt: 'filename: ',
                    init: update.curry(candidates),
                    keepInputOnReactivate: true,
                    actions: [
                        {name: 'open in system browser', exec: function(candidate) { lively.ide.browse(URL.root.withFilename(candidate.relativePath)); }},
                        {name: 'open in text editor', exec: function(candidate) { lively.ide.openFile(candidate.fullPath); }},
                        {name: 'open in web browser', exec: function(candidate) { window.open(candidate.relativePath); }}]
                }
            }, narrower = lively.ide.tools.SelectionNarrowing.getNarrower(spec);
            return true;
        }
    },
    // search
    'lively.ide.CommandLineInterface.doGrepSearch': {
        description: 'code search (grep)',
        exec: function() {
            var greper = Functions.debounce(500, function(input, callback) {
                lively.ide.CommandLineSearch.doGrep(input, null, function(lines, baseDir) {
                    callback(lines.map(function(line) {
                        return {
                            isListItem: true,
                            string: line.slice(baseDir.length),
                            value: {baseDir: baseDir, match: line}
                        };
                    }));
                });
            });
            var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
                name: '_lively.ide.CommandLineInterface.doGrepSearch.NarrowingList',
                reactivateWithoutInit: true,
                spec: {
                    prompt: 'search for: ',
                    candidatesUpdaterMinLength: 3,
                    candidates: [],
                    maxItems: 25,
                    candidatesUpdater: greper,
                    keepInputOnReactivate: true,
                    actions: [{
                        name: 'open in system browser',
                        exec: function(candidate) {
                            lively.ide.CommandLineSearch.doBrowseGrepString(candidate.match, candidate.baseDir);
                        }
                    }, {
                        name: 'open in text editor',
                        exec: function(candidate) {
                            var parts = candidate.match.split(':'),
                                path = parts[0], line = parts[1];
                            if (line) path += ':' + line;
                            lively.ide.openFile(path);
                        }
                    }, {
                        name: "open grep results in workspace",
                        exec: function() {
                            var state = narrower.state,
                                content = narrower.getFilteredCandidates(state.originalState || state).pluck('match').join('\n'),
                                title = 'search for: ' + narrower.getInput();
                            $world.addCodeEditor({title: title, content: content, textMode: 'text'});
                        }
                    }]
                }
            });
            return true;
        }
    },
    'lively.ide.CommandLineInterface.changeShellBaseDirectory': {
        description: 'change the base directory for shell commands',
        exec: function() {
            function setBasePath(candidate) {
                var result = (candidate && (Object.isString(candidate) ? candidate : candidate.path)) || null;
                if (result) alertOK('base directory is now ' + result);
                else alertOK('resetting base directory to default');
                lively.ide.CommandLineInterface.rootDirectory = result;
            }
            lively.ide.CommandLineSearch.interactivelyChooseFileSystemItem(
                'choose directory: ',
                lively.shell.exec('pwd', {sync:true}).resultString(),
                function(files) { return files.filterByKey('isDirectory'); },
                "lively.ide.browseFiles.baseDir.NarrowingList",
                [setBasePath]);
        }
    },
    'lively.ide.execShellCommand': {
        description: 'execute shell command',
        exec: function(codeEditor, args) {
            var insertResult = !args || typeof args.insert === 'undefined' || !!args.insert,
                openInWindow = !codeEditor || (args && args.count !== 4)/*universal argument*/;
            function ensureCodeEditor(title) {
                if (!openInWindow && codeEditor) return codeEditor;
                var ed = $world.addCodeEditor({
                    title: 'shell command: ' + title,
                    gutter: false, textMode: 'text',
                    extent: pt(400, 500), position: 'center'});
                ed.owner.comeForward();
                return ed;
            }
            function runCommand(command) {
                lively.shell.exec(command, function(cmd) {
                    insertResult && ensureCodeEditor(command).printObject(null, cmd.resultString(true));
                });
            }
            var cmdString = args && args.shellCommand;
            if (cmdString) runCommand(cmdString);
            else {
                $world.prompt('Enter shell command to run.', function(cmdString) {
                    if (!cmdString) { show('No command entered, aborting...!'); return; }
                    runCommand(cmdString);
                }).panel.focus();
            };
        }
    },
    'lively.ide.CommandLineInterface.killShellCommandProcess': {
        description: 'kill shell command process',
        exec: function(codeEditor, args) { lively.ide.CommandLineInterface.kill(null, show); }
    },
    // tools
    'lively.ide.openWorkspace': {description: 'open Workspace', exec: function() { $world.openWorkspace(); }},
    'lively.ide.openSystemCodeBrowser': {description: 'open SystemCodeBrowser', exec: function() { $world.openSystemBrowser(); }},
    'lively.ide.openObjectEditor': {description: 'open ObjectEditor', exec: function() { $world.openObjectEditor().comeForward(); }},
    'lively.ide.openBuildSpecEditor': {description: 'open BuildSpecEditor', exec: function() { $world.openBuildSpecEditor(); }},
    'lively.ide.openTestRunner': {description: 'open TestRunner', exec: function() { $world.openTestRunner(); }},
    'lively.ide.openMethodFinder': {description: 'open MethodFinder', exec: function() { $world.openMethodFinder(); }},
    'lively.ide.openTextEditor': {description: 'open TextEditor', exec: function() { lively.ide.openFile(URL.source.toString()); }},
    'lively.ide.openSystemConsole': {description: 'open SystemConsole', exec: function() { $world.openSystemConsole(); }},
    'lively.ide.openOMetaWorkspace': {description: 'open OMetaWorkspace', exec: function() { $world.openOMetaWorkspace(); }},
    'lively.ide.openSubserverViewer': {description: 'open SubserverViewer', exec: function() { $world.openSubserverViewer(); }},
    'lively.ide.openServerWorkspace': {description: 'open ServerWorkspace', exec: function() { $world.openServerWorkspace(); }},
    'lively.ide.openShellWorkspace': {description: 'open ShellWorkspace', exec: function() { var codeEditor = $world.openWorkspace().applyStyle({textMode: 'sh', theme: 'pastel_on_dark'}); codeEditor.owner.setTitle('Shell Workspace'); }},
    'lively.ide.openTerminal': {description: 'open Terminal', exec: function() { $world.openTerminal(); }},
    'lively.ide.openGitControl': {description: 'open GitControl', exec: function() { $world.openGitControl(); }},
    'lively.ide.openServerLog': {description: 'open ServerLog', exec: function() { require('lively.ide.tools.ServerLog').toRun(function() { lively.ide.tools.ServerLog.open(); }); }},
    'lively.ide.openDiffer': {description: 'open text differ', exec: function() { require('lively.ide.tools.Differ').toRun(function() { lively.BuildSpec('lively.ide.tools.Differ').createMorph().openInWorldCenter().comeForward(); }); }},
    'lively.PartsBin.open': {description: 'open PartsBin', exec: function() { $world.openPartsBin(); }},
    // network helper
    'lively.net.loadJavaScriptFile': {
        description: 'load JavaScript file',
        exec: function() {
            $world.prompt('URL of file to load', function(input) {
                var url;
                try { url = String(new URL(input)); } catch(e) { show('%s is not a valid URL', input); return; }
                JSLoader.removeAllScriptsThatLinkTo(url);/*load even if loaded before*/
                JSLoader.loadJs(url);
            }, 'http://lively-web.org/say-hello.js');
        }
    }
});

Object.extend(lively.ide.commands.defaultBindings, { // bind commands to default keys
    'lively.morphic.World.escape': "esc",
    'lively.morphic.World.save': 'cmd-s-l s a v e',
    'lively.morphic.Window.close': "cmd-esc",
    'lively.morphic.Window.gather':'cmd-s-l s t a c k w',
    'lively.morphic.Window.rename': 'cmd-s-l r e n',
    'lively.ide.WindowNavigation.start': {mac: "cmd-`", win: "ctrl-`"},
    'lively.ide.browseFiles': 'Alt-t',
    'lively.ide.commands.keys.reset': 'F8',
    'lively.ide.tools.SelectionNarrowing.activateLastActive': "cmd-y",
    'lively.morphic.Halos.show': "cmd-h",
    'lively.morphic.List.selectItem': "m-space",
    'lively.ide.CommandLineInterface.doGrepSearch': "cmd-s-g",
    'lively.ide.commands.execute': "m-x"
});

}) // end of module