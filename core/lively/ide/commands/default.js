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
    },
    getKeyboardBindings: function() { return this.defaultBindings; }
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
    'lively.morphic.Morph.showSceneGraph': {
        description: 'show scene graph',
        exec: function() {
            // withAllSubmorphsDo isn't good enough for ignoring certain morphs and their
            // submorphs
            function withSubmorphsDoWhenTruthy(morph, iterator, depth) {
                depth = depth || 0;
                var callResult = iterator(morph, depth);
                if (!callResult) return []; // don't descent into submorphs
                return [callResult].concat(morph.submorphs.clone().reverse().map(function(ea) {
                    return withSubmorphsDoWhenTruthy(ea, iterator, depth+1);
                })).flatten();
            }
            var results = [], preselect = $world.currentHaloTarget, i = 0, preselectIndex = 0;
            var candidates = withSubmorphsDoWhenTruthy($world, function(ea, depth) {
                if (ea.isNarrowingList) return null;
                if (ea === preselect) preselectIndex = i; i++;
                var string = ea.name || ea.toString();
                string = Strings.indent(string, '    ', depth);
                return {isListItem: true, string: string, value: ea};
            });
            lively.ide.tools.SelectionNarrowing.getNarrower({
                name: 'lively.morphic.Morph.showSceneGraph',
                setup: function(narrower) {
                    lively.bindings.connect(narrower, 'selection', Global, 'show', {updater: function($upd, val) {
                        val && val.isMorph && $upd(val); }});
                },
                input: '',
                spec: {
                    prompt: 'choose morph: ',
                    candidates: candidates,
                    keepInputOnReactivate: true,
                    preselect: preselectIndex,
                    actions: [
                        {name: 'show halos', exec: function(morph) { morph.focus.bind(morph).delay(0.1); morph.showHalos(); }},
                        {name: 'inspect', exec: function(morph) { lively.morphic.inspect(morph); }},
                        {name: 'open ObjectEditor', exec: function(morph) { lively.morphic.edit(morph); }},
                        {name: 'open StyleEditor', exec: function(morph) { $world.openStyleEditorFor(morph); }},
                        {name: 'copy', exec: function(morph) { var copy = morph.copy(); morph.owner.addMorph(copy, morph); morph.showHalos(); morph.focus(); }},
                        {name: 'remove', exec: function(morph) { morph.remove(); }}]
                }
            });
            return true;
        }
    },
    'lively.morphic.Morph.copy': {
        description: 'copy morph',
        exec: function() {
            var focused = lively.morphic.Morph.focusedMorph(),
                morph = $world.getActiveWindow() || focused, copy;
            if (!morph) return true;
            try { copy = morph.copy(); } catch (e) {
                show('failed to copy ' + morph + '\n' + e); return true; }
            copy.openInWorld();
            alertOK('copied ' + morph);
            (function() { 
                copy[copy.isWindow ? 'comeForward' : 'focus']();
                copy.showHalos();
            }).delay(0);
            return true;
        }
    },
    'lively.morphic.Morph.openObjectEditor': {
        description: 'open ObjectEditor for focused Morph',
        exec: function() {
            var morph = $world.currentHaloTarget || lively.morphic.Morph.focusedMorph();
            $world.openObjectEditorFor(morph);
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
    'lively.morphic.Window.toggleCollapse': {
        description: 'collapse/uncollapse window',
        exec: function() {
            var win = $world.getActiveWindow();
            if (!win) { show('Cannot find active window!'); return; }
            win.toggleCollapse();
            if (!win.isCollapsed()) win.comeForward();
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
    'lively.morphic.Window.rearrangeSelectedIntoVisibleBounds': {
        description: 'Rearrange selected morphs to fit into visible world bounds.',
        exec: function() {
            function fitMorphsIntoBounds(morphs, bounds) {
                // Unions the bounds of morphs together and moves them so that the top left
                // most morph is aligned with topLeft of bounds. Changes the position of all
                // morphs so that they are evenly placed into bounds
                var morphBounds = morphs.invoke('globalBounds'),
                    morphBoundsCombined = morphBounds.inject(morphBounds[0], function(combinedBounds, eaBounds) { return combinedBounds.union(eaBounds); }),
                    offsetTopLeft = bounds.topLeft().subPt(morphBoundsCombined.topLeft()),
                    scalePoint = bounds.extent().scaleByPt(morphBoundsCombined.extent().inverted());
                morphs.forEach(function(ea) { ea.setPosition(ea.getPosition().scaleByPt(scalePoint).addPt(offsetTopLeft)); });
            }
            var morphs = $world.getSelectedMorphs();
            if (!morphs || !morphs.length) { alert('No morph selected!'); return; }
            fitMorphsIntoBounds(morphs, $world.visibleBounds().insetBy(8));
            return true;
        }
    },
    'lively.morphic.Window.selectAll': {
        description: 'Select all windows',
        exec: function() {
            var windows = $world.submorphs.select(function(ea) { return ea.isWindow; });
            $world.setSelectedMorphs(windows);
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
    // javascript
    'lively.ide.evalJavaScript': {
        description: 'eval JavaScript',
        exec: function() {
            var dlg = $world.editPrompt('Enter JavaScript code to evaluate', function(input) {
                if (!input || !input.length) return;
                var result = dlg.inputText.tryBoundEval(input);
                alertOK('eval: ' + input.replace(/\n/g, '').truncate(40) + ':\n' + Strings.print(result));
            }, {textMode: 'javascript'});
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
                    var relativePath = fullPath.slice(dir.length+1).replace(/\\/g, '/');
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
            var actions = [
                {name: 'open in system browser', exec: function(candidate) { lively.ide.browse(URL.root.withFilename(candidate.relativePath)); }},
                {name: 'open in text editor', exec: function(candidate) { lively.ide.openFile(candidate.fullPath); }},
                {name: 'open in web browser', exec: function(candidate) { window.open(candidate.relativePath); }},
                {name: 'reset directory watcher', exec: function(candidate) { lively.ide.DirectoryWatcher.reset(); }}];
            if (lively.ide.CommandLineInterface.rootDirectory) {
                // SCB is currently only supported for Lively files
                actions.shift();
            }
            var dir, candidates = [], spec = {
                name: 'lively.ide.browseFiles.NarrowingList',
                spec: {
                    candidates: candidates,
                    prompt: 'filename: ',
                    init: update.curry(candidates),
                    keepInputOnReactivate: true,
                    actions: actions
                }
            }, narrower = lively.ide.tools.SelectionNarrowing.getNarrower(spec);
            return true;
        }
    },
    'lively.ide.SystemCodeBrowser.browseModuleStructure': {
        description: 'browse module',
        exec: function() {
            var win = $world.getActiveWindow(),
                widget = win && win.targetMorph && win.targetMorph.ownerWidget,
                browser = widget && widget.isSystemBrowser ? widget : null,
                ff = browser && browser.getPane1Selection() && browser.getPane1Selection().target;
            if (!ff) { show('No browser active or no module selected!'); return false; }
            function withSubelementsOfFFDo(ff, func, context, depth) {
                depth = depth || 0;
                var results = [func.call(context, ff, depth)];
                ff.subElements().forEach(function(ff) {
                    results.pushAll(withSubelementsOfFFDo(ff, func, context, depth+1));
                });
                return results;
            }

            var candidates = withSubelementsOfFFDo(ff, function(ff, depth) {
                var string = ff.name;
                if (ff.type === 'propertyDef') {
                    var owner = ff.findOwnerFragment();
                    if (owner) string = owner.name + ' -- ' + string;
                }
                string = Strings.indent(string, '  ', depth);
                return ff.name ? {isListItem: true, string: string, value: ff} : null;
            }).compact();

            lively.ide.tools.SelectionNarrowing.getNarrower({
                name: 'lively.ide.SystemBrowser.browseModuleStructure',
                input: '',
                spec: {
                    prompt: 'what to browse? ',
                    candidates: candidates,
                    actions: [
                        function(ff) {
                            browser.disableSourceNotAccidentlyDeletedCheck = true;
                            try { ff.browseIt({browser: browser}); } finally { browser.disableSourceNotAccidentlyDeletedCheck = false }
                        }
                    ]
                }
            });
            return true;
        }
    },
    // search
    'lively.ide.CommandLineInterface.doGrepSearch': {
        description: 'code search (grep)',
        exec: function() {
            var greper = Functions.debounce(500, function(input, callback) {
                lively.ide.CommandLineSearch.doGrep(input, null, function(lines, baseDir) {
                    var candidates = lines.map(function(line) {
                        return line.trim() === '' ? null : {
                            isListItem: true,
                            string: line.slice(baseDir.length),
                            value: {baseDir: baseDir, match: line}
                        };
                    }).compact();
                    if (candidates.length === 0) candidates = ['nothing found'];
                    callback(candidates);
                });
            });
            function candidateBuilder(input, callback) { callback(['searching...']); greper(input, callback); };
            var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
                name: '_lively.ide.CommandLineInterface.doGrepSearch.NarrowingList',
                reactivateWithoutInit: true,
                spec: {
                    prompt: 'search for: ',
                    candidatesUpdaterMinLength: 3,
                    candidates: [],
                    maxItems: 25,
                    candidatesUpdater: candidateBuilder,
                    keepInputOnReactivate: true,
                    actions: [{
                        name: 'open in system browser',
                        exec: function(candidate) {
                            if (Object.isString(candidate)) return;
                            lively.ide.CommandLineSearch.doBrowseGrepString(candidate.match, candidate.baseDir);
                        }
                    }, {
                        name: 'open in text editor',
                        exec: function(candidate) {
                            if (Object.isString(candidate)) return;
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
    'lively.ide.CommandLineInterface.openBaseDirectoryChooser': {
        description: 'Open BaseDirectoryChooser',
        exec: function() {
            require('lively.ide.tools.BaseDirectoryChooser').toRun(function() {
                lively.BuildSpec('lively.ide.tools.BaseDirectoryChooser').createMorph().openInWorldCenter().comeForward();
            });
        }
    },
    'lively.ide.execShellCommand': {
        description: 'execute shell command',
        exec: function(codeEditor, args) {
            Global.event.stop();
            var insertResult = !args || typeof args.insert === 'undefined' || !!args.insert,
                openInWindow = !codeEditor || (args && args.count !== 4)/*universal argument*/;
            function ensureCodeEditor(title) {
                if (!openInWindow && codeEditor && codeEditor.isCodeEditor) return codeEditor;
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
    'lively.ide.openFileTree': {description: 'open file tree', exec: function() { $world.openFileTree(); }},
    'lively.ide.openPresentationController': {description: 'open presentation controller', exec: function() { $world.openPresentationController(); }},
    'lively.PartsBin.open': {description: 'open PartsBin', exec: function() { $world.openPartsBin(); }},
    'lively.Config.openPreferences': {description: 'customize user preferences and config options', exec: function() { $world.openPreferences(); }},
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
    },
    "lively.ide.CommandLineInterface.SpellChecker.spellCheckWord": {
        description: 'spell check word',
        exec: function(word, callback) {
            var withResultDo;
            if (word && callback) {
                withResultDo = callback
            } else {
                var focused = lively.morphic.Morph.focusedMorph();
                if (focused && focused.isCodeEditor) {
                    if (focused.owner && focused.owner.isNarrowingList)
                        focused = focused.owner.state.focusedMorph;
                }
                if (focused && focused.isCodeEditor) {
                    var wordRange = focused.wordRangeAtPoint();
                    word = focused.getTextRange(wordRange);
                    withResultDo = function(candidate) {
                        if (!candidate || !Object.isString(candidate)) return;
                        focused.replace(wordRange, candidate);
                    }
                } else {
                    // TODO: ask for word
                    show('no word for spellcheck!'); return;
                }
            }
            function openNarrowerForSuggestions(suggestions) {
                lively.ide.tools.SelectionNarrowing.getNarrower({
                    name: "lively.ide.CommandLineInterface.SpellChecker.spellCheckWord",
                    input: '',
                    spec: {
                        prompt: 'pick corrected word: ',
                        candidates: suggestions,
                        actions: [
                            {name: 'with corrected word action', exec: withResultDo
                        }]
                    }
                });
            }
            lively.ide.CommandLineInterface.SpellChecker.spellCheckWord(word, function(err, suggestions) {
                if (err) { show(err); return; }
                if (!suggestions.length) { alertOK(word + ' is OK!'); return; }
                openNarrowerForSuggestions(suggestions);
            });
            return true;
        }
    }
});

Object.extend(lively.ide.commands.defaultBindings, { // bind commands to default keys
    'lively.morphic.World.escape': "esc",
    'lively.morphic.World.save': {mac: 'cmd-s-l s a v e', win: 'ctrl-s-l s a v e'},
    'lively.morphic.Window.close': {mac: "cmd-esc", win: "ctrl-esc"},
    'lively.morphic.Window.gather':{mac: 'cmd-s-l s t a c k w', win: 'ctrl-s-l s t a c k w'},
    'lively.morphic.Window.rename': {mac: 'cmd-s-l r e n', win: 'ctrl-s-l r e n'},
    'lively.morphic.Window.toggleCollapse': {mac: 'cmd-s-l c o l', win: 'ctrl-s-l c o l'},
    'lively.morphic.Morph.copy': {mac: 'cmd-s-l c o p y', win: 'ctrl-s-l c o p y'},
    'lively.morphic.Morph.showSceneGraph': 'm-m',
    'lively.morphic.Morph.openObjectEditor': {mac: 'cmd-s-l o e', win: 'ctrl-s-l o e'},
    'lively.ide.evalJavaScript': 'm-s-:',
    'lively.ide.WindowNavigation.start': {mac: "cmd-`", win: "ctrl-à"},
    'lively.ide.browseFiles': 'Alt-t',
    'lively.ide.SystemCodeBrowser.browseModuleStructure': {mac: "m-s-t", win: 'm-s-t'},
    'lively.ide.commands.keys.reset': 'F8',
    'lively.ide.tools.SelectionNarrowing.activateLastActive': "cmd-y",
    'lively.morphic.Halos.show': {mac: "cmd-h", win: 'ctrl-h'},
    'lively.morphic.List.selectItem': "m-space",
    'lively.ide.CommandLineInterface.doGrepSearch': {mac: "cmd-s-g", win: 'ctrl-s-g'},
    'lively.ide.execShellCommand': "m-s-!",
    "lively.ide.CommandLineInterface.SpellChecker.spellCheckWord": "m-s-$",
    'lively.ide.commands.execute': "m-x"
});

}) // end of module