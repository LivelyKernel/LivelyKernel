module('lively.ide.commands.default').requires().toRun(function() {

lively.module("lively.ide.tools.SelectionNarrowing").load();

Object.extend(lively.ide.commands, {
    byName: {},
    defaultBindings: {},

    exec: function(commandName, arg1, arg2, arg3, arg4) {
        var cmd = lively.ide.commands.byName[commandName];
        try {
            if (cmd.isActive && !cmd.isActive()) return false;
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

    getKeyboardBindings: function() { return this.defaultBindings; },

    helper: {
        noCodeEditorActive: function() {
            return !lively.ide.commands.helper.codeEditorActive();
        },

        codeEditorActive: function() {
            var f = lively.morphic.Morph.focusedMorph();
            return f && f.isCodeEditor;
        },

        focusedMorph: function() {
            var focused = lively.morphic.Morph.focusedMorph();
            if (focused && focused.isCodeEditor) {
                if (focused.owner && focused.owner.isNarrowingList)
                    focused = focused.owner.state.focusedMorph;
            }
            return focused || $world;
        },

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
            var narrowers = world.submorphs.filter(function(m) { return m.isNarrowingList && m.isVisible(); })
            if (narrowers.length) { narrowers.invoke('deactivate'); return true; }
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

    'lively.morphic.World.setExtentToWindowBounds': {
        description: 'set world extent to fit into window bounds',
        exec: function() { $world.setExtent($world.windowBounds().extent()); }
    },

    'lively.morphic.World.resetScale': {
        description: 'reset world scale',
        exec: function() { $world.setScale(1); }
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
            var morph = $world.getActiveWindow();
            if (!morph) morph = lively.morphic.Morph.focusedMorph();
            var win = morph && morph.getWindow();
            if (win) morph = win;
            if (!morph) return true;
            var copy;
            try { copy = morph.copy(); } catch (e) {
                show('failed to copy ' + morph + '\n' + e); return true; }
            copy.openInWorld();
            alertOK('copied ' + morph);
            copy.showHalos();
            copy[copy.isWindow ? 'comeForward' : 'focus'].bind(copy).delay(0);
            return true;
        }
    },

    'lively.morphic.Morph.swapMorphs': {
        description: 'swap morphs',
        exec: function() {
            var morph1;
            lively.lang.fun.composeAsync(
              function(next) {
                $world.alertOK("select first morph");
                $world.selectMorphWithNextClick({useMenu: true}, next);
            },
              function(_morph1, next) {
                morph1 = _morph1;
                $world.alertOK("select second morph");
                $world.selectMorphWithNextClick({useMenu: true}, next);
              }
            )(function(err, morph2) {
              if (err) { $world.logError(err); return; }
              $world.alertOK("Swapping " + morph1 + "\nwith" + morph2);
              morph1.swapWith(morph2);
            });
            return true;
        }
    },

    'lively.morphic.Morph.openObjectEditor': {
        description: 'open ObjectEditor for focused Morph',
        isActive: lively.ide.commands.helper.noCodeEditorActive,
        exec: function(target) {
            var morph = target || $world.currentHaloTarget || lively.morphic.Morph.focusedMorph();
            $world.openObjectEditorFor(morph);
            return true;
        }
    },
    'lively.morphic.Morph.openStyleEditor': {
        description: 'open StyleEditor for focused Morph',
        isActive: lively.ide.commands.helper.noCodeEditorActive,
        exec: function(target) {
            var morph = target || $world.currentHaloTarget || lively.morphic.Morph.focusedMorph();
            $world.openStyleEditorFor(morph);
            return true;
        }
    },

    'lively.morphic.Morph.alignFlapsInWorld': {
        description: 'align flaps in world',
        exec: function() {
            $world.submorphs
                .filter(function(ea) { return ea.hasFixedPosition() && ea.alignInWorld; })
                .invoke('alignInWorld');
            return true;
        },
    },

    'lively.morphic.Morph.setGridSpacing': {
        description: 'set grid spacing',
        exec: function(spacing) {
            if (spacing) lively.Config.set("gridSpacing", spacing);
            else {
                $world.prompt('Set grid spacing to', function(input) {
                    var n = Number(input);
                    if (!n || isNaN(n)) $world.inform('Not a valid input: "' + input + '"');
                    lively.Config.set("gridSpacing", n);
                }, lively.Config.get("gridSpacing"));
            }
            return true;
        },
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

    'lively.ide.resizeWindow': {
        exec: function(how, window) {
            var win = window || $world.getActiveWindow();
            if (!win) return;

            var worldB = $world.visibleBounds().insetBy(20),
                winB = win.bounds(),
                bounds = worldB;

            if (!win.normalBounds) win.normalBounds = winB;

            var thirdW = Math.min(750, Math.max(1000, bounds.width/3)),
                thirdColBounds = bounds.withWidth(thirdW);

            if (!how) askForHow();
            else doResize(how);

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

            function askForHow() {
                var actions = ['full', 'fullscreen','center','right','left','bottom',
                               'top',"shrinkWidth", "growWidth","shrinkHeight",
                               "growHeight",'reset'];
                lively.ide.tools.SelectionNarrowing.chooseOne(
                    actions, function(err, candidate) { doResize(candidate); },
                    {prompt: "How to resize the window?"});
            }

            function doResize(how) {
                switch(how) {
                    case 'full': case 'fullscreen': break;
                    case 'center': bounds = thirdColBounds.withCenter(worldB.center()); break;
                    case 'right': bounds = thirdColBounds.withTopRight(worldB.topRight()); break;
                    case 'left': bounds = thirdColBounds.withTopLeft(bounds.topLeft()); break;
                    case 'bottom': bounds = bounds.withY(bounds.y + bounds.height/2);
                    case 'top': bounds = bounds.withHeight(bounds.height/2); break;
                    case 'reset': bounds = win.normalBounds || pt(500,400).extentAsRectangle().withCenter(bounds.center()); break;
                    default: return;
                }

                if (how === 'reset') delete win.normalBounds;

                win.setBounds(bounds);
            }

            return true;
        },
    },
    'lively.ide.resizeWindow.reset': {exec: function() { return lively.ide.commands.exec('lively.ide.resizeWindow', 'reset'); }},
    'lively.ide.resizeWindow.full': {exec: function() { return lively.ide.commands.exec('lively.ide.resizeWindow', 'fullscreen'); }},
    'lively.ide.resizeWindow.left': {exec: function() { return lively.ide.commands.exec('lively.ide.resizeWindow', 'left'); }},
    'lively.ide.resizeWindow.center': {exec: function() { return lively.ide.commands.exec('lively.ide.resizeWindow', 'center'); }},
    'lively.ide.resizeWindow.right': {exec: function() { return lively.ide.commands.exec('lively.ide.resizeWindow', 'right'); }},
    'lively.ide.resizeWindow.top': {exec: function() { return lively.ide.commands.exec('lively.ide.resizeWindow', 'top'); }},
    'lively.ide.resizeWindow.bottom': {exec: function() { return lively.ide.commands.exec('lively.ide.resizeWindow', 'bottom'); }},

    'lively.morphic.Window.resizeVisibleMorphsToFitIntoVisibleBounds': {
        description: 'Resize visible morphs to fit into visible world bounds.',
        exec: function() {
            $world.submorphs.forEach(function(ea) {
                var vB = $world.visibleBounds(), b = ea.bounds();
                if (!vB.containsPoint(b.topLeft()) || vB.containsPoint(b.bottomRight())) return;
                ea.setBounds(rect(b.topLeft(), b.bottomRight().minPt(vB.bottomRight())));
            });
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
        exec: function exec() {
          if (module("lively.ide.WindowNavigation").isLoaded())
            lively.ide.WindowNavigation.WindowManager.current().startWindowSelection();
          else lively.require("lively.ide.WindowNavigation").toRun(exec);
          return true;
        }
    },

    'lively.ide.WindowNavigation.reopenClosedWindows': {
        description: 'recover closed windows',
        exec: function() {
            var narrower = $world.submorphs.detect(function(morph) { return morph.name && morph.name.include('lively.ide.WindowNavigation.NarrowingList'); });
            if (narrower) {
              narrower.state.allCandidates.pluck("value").reverse().invoke("openInWorld");
            } else show("Could not recover windows");
            return true;
        }
    },

    // commands
    'lively.ide.commands.keys.reset': {
        description: 'reset key bindings',
        exec: function() {
            lively.ide.CodeEditor.KeyboardShortcuts.reinitKeyBindingsForAllOpenEditors();
            ace.require('ace/edit_session').EditSession.prototype.$modes = {};
            lively.ide.WindowNavigation.WindowManager.reset();
            lively.morphic.KeyboardDispatcher.reset();
            lively.ide.tools.SelectionNarrowing.resetCache();
            return true;
        },
    },

    'lively.ide.commands.keys.toggleShowPressedKeys': {
        description: 'toggle show pressed keys',
        exec: function() {
            var inspector = $morph("KeyPressInspector");
            if (inspector) inspector.remove();
            else {
                inspector = lively.PartsBin.getPart("KeyPressInspector", "PartsBin/Debugging/");
                inspector.openInWorld();
                inspector.align(inspector.bounds().bottomRight(), $world.visibleBounds().bottomRight());
                inspector.enableFixedPositioning();
            }
            return true;
        },
    },

    'lively.ide.codeditor.installCompletions': {
        description: 'install code editor completions',
        exec: function() {
            require('lively.ide.codeeditor.Completions').toRun(function() {
                lively.ide.codeeditor.Completions.setupCompletions();
            });
            return true;
        },
    },

    'lively.ide.codeditor.addCompletions': {
        description: 'add completions from string',
        exec: function(string) {
            if (!string) {
                var morph = lively.ide.commands.helper.focusedMorph();
                if (morph.isCodeEditor || morph.isText) string = morph.textString;
            }
            string = string || '';
            require('lively.ide.codeeditor.Completions').toRun(function() {
                var words = lively.ide.codeeditor.Completions.addWordsFromString(string);
                alertOK('added words');
            });
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
            }, {textMode: 'javascript', historyId: 'lively.ide.evalJavaScript'});
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

            var actions = [
                {name: 'open in system browser', exec: function(candidate) { lively.ide.browse(URL.root.withFilename(candidate.relativePath)); }},
                {name: 'open in text editor', exec: function(candidate) { lively.ide.openFile(candidate.fullPath); }},
                {name: 'open in web browser', exec: function(candidate) { window.open(candidate.relativePath); }},
                {name: 'open in versions viewer', exec: function(candidate) { lively.ide.commands.exec("lively.ide.openVersionsViewer", candidate.relativePath); }},
                {name: 'reset directory watcher', exec: function(candidate) { lively.ide.DirectoryWatcher.reset(); }}];
            if (!lively.shell.cwdIsLivelyDir()) {
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

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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
                var closeLoadingIndicator;
                Functions.composeAsync(
                    function(next) {
                        showLoadingIndicatorThenDo(function(close) {
                            closeLoadingIndicator = close; next(); });
                    },
                    function(next) {
                        require('lively.ide.DirectoryWatcher').toRun(function() { next() });
                    },
                    withDirDo,
                    function(dir, next) { next(null, false, dir); },
                    function fetchFiles(isRetry, dir, next) {
                        lively.ide.DirectoryWatcher.withFilesOfDir(dir, function(files) {
                            if (files) return next(null, files, dir);
                            if (!isRetry) {
                                lively.ide.DirectoryWatcher.reset();
                                return fetchFiles.curry(true, dir, next).delay(0.5);
                            }
                            next(new Error('Cannot fetch files for ' + dir));
                        });
                    },
                    function(files, dir, next) {
                        candidates.length = 0;
                        candidates.pushAll(makeCandidates(dir, files));
                        next();
                    }
                )(function(err) {
                    closeLoadingIndicator();
                    if (err) show("Error int browse files: %s", err);
                    else thenDo();
                });

                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

                function withDirDo(func) {
                    if (narrower.dir) func(null, narrower.dir);
                    else lively.shell.exec('pwd', {}, function(cmd) { func(null, cmd.resultString()); });
                }
                function showLoadingIndicatorThenDo(thenDo) {
                    require('lively.morphic.tools.LoadingIndicator').toRun(function() {
                        lively.morphic.tools.LoadingIndicator.open(thenDo);
                    });
                }
            }

        }
    },

    'lively.ide.SystemCodeBrowser.browseModule': {
        description: 'open module in SystemCodeBrowser',
        exec: function(moduleNameOrFileOrURL) {
            if (moduleNameOrFileOrURL) doBrowse(moduleNameOrFileOrURL);
            else doPrompt(doBrowse);

            function doPrompt(thenDo) {
                $world.prompt('Which module to browse?', function(name) {
                    thenDo(name);
                }, {historyId: 'lively.ide.SystemCodeBrowser.browseModule', input: 'lively.Base'});
            }

            function doBrowse(moduleNameOrFileOrURL) {
                if (URL.isURL(moduleNameOrFileOrURL)) {
                    lively.ide.browse(moduleNameOrFileOrURL);
                } else if (moduleNameOrFileOrURL.endsWith('.js') || moduleNameOrFileOrURL.include('/')) {
                    var wrapper = lively.ide.ModuleWrapper.forFile(moduleNameOrFileOrURL),
                        fn = wrapper.fileName();
                    lively.ide.browse(fn);
                } else {
                    lively.ide.browse(module(moduleNameOrFileOrURL).uri());
                }
            }

            return true;
        }
    },

    'lively.ide.SystemCodeBrowser.reloadAllSources': {
        description: 'reload all sources for SystemCodeBrowser',
        exec: function() {
            lively.ide.sourceDB().reloadAllModules(true);
            return true;
        }
    },

    'lively.ide.SystemCodeBrowser.browseModuleStructure': {
        description: 'browse module structure',
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
    'lively.ide.codeSearch': {
        description: 'code search',
        exec: function(optSource) {
            lively.require('lively.ide.tools.CodeSearch').toRun(function() {
                lively.ide.tools.CodeSearch.doSearch(optSource || ""); });
            return true;
        }
    },

    'lively.ide.resourceSearch': {
        description: 'resource search (worlds, parts, files)',
        exec: function(optSearchTerm) {
            if (optSearchTerm) doSearch(optSearchTerm);
            else $world.prompt("Search for world, part, or file matching:", function(input) {
                if (input) doSearch("*" + input + "*");
            }, {historyId: "lively.ide.resourceSearch.prompt"});
            return true;

            function doSearch(searchTerm) {
                searchTerm = searchTerm.replace(/\*/g, "%"); // for SQL LIKE matching
                Functions.composeAsync(
                    function(next) { lively.require('lively.net.Wiki').toRun(function() { next(); }); },
                    function(next) { lively.net.Wiki.findResourcePathsMatching(searchTerm, true, next); },
                    function(results, next) { lively.net.Wiki.openResourceList(results, {title: "search: " + searchTerm}, next); }
                )(function(err, resultListWindow) {
                    if (err) show("Error searching for " + searchTerm);
                    resultListWindow.openInWorld().comeForward();
                })
            }
        }
    },

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

            function candidateBuilder(input, callback) {
              callback(['searching...']);
              greper(input, callback);
            };

            function openInTextEditor(candidate) {
                if (Object.isString(candidate)) return;
                var parts = candidate.match.split(':'),
                    path = parts[0], line = parts[1];
                if (line) path += ':' + line;
                lively.ide.openFile(path);
            }

            function openInSCB(candidate) {
                if (Object.isString(candidate)) return;
                lively.ide.CommandLineSearch.doBrowseGrepString(candidate.match, candidate.baseDir);
            }

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
                        name: 'open',
                        exec: function(candidate) {
                            if (Object.isString(candidate)) return;
                            var isLively = candidate.match.match(/\.?\/?core\//) && candidate.baseDir.match(/\.?\/?/);
                            if (isLively) openInSCB(candidate);
                            else openInTextEditor(candidate);
                        }
                    }, {
                        name: 'open in system browser',
                        exec: openInSCB
                    }, {
                        name: 'open in text editor',
                        exec: openInTextEditor
                    }, {
                        name: "open grep results in workspace",
                        exec: function() {
                            var state = narrower.state,
                                content = narrower.getFilteredCandidates(state.originalState || state).pluck('match').join('\n'),
                                title = 'search for: ' + narrower.getInput();
                            $world.addCodeEditor({title: title, content: content, textMode: 'text'}).getWindow().comeForward();
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

          lively.lang.fun.composeAsync(

            // If there is a list of known dirs first offer to choose from those
            function chooseFromKnownWorkingDirectories(n) {
              if (!$world.knownWorkingDirectories && !$world.knownWorkingDirectories.length)
                return n();
                lively.ide.tools.SelectionNarrowing.getNarrower({
                  name: 'lively.ide.CommandLineInterface.changeShellBaseDirectory.chooseKnown',
                  spec: {
                    candidates: ['choose different directory...'].concat($world.knownWorkingDirectories),
                    preselect: 1,
                    actions: [function select(c) {
                      n(null,c === 'choose different directory...' ? null : c);
                    }]
                  }
                })
            },

            // Otherwise choose by navigating the fs
            function chooseNewDir(dir, n) {
              if (dir) return n(null, dir);
              lively.ide.CommandLineSearch.interactivelyChooseFileSystemItem(
                'choose directory: ',
                lively.shell.exec('pwd', {sync:true}).resultString(),
                function(files) { return files.filterByKey('isDirectory'); },
                "lively.ide.browseFiles.baseDir.NarrowingList",
                [function(c) { n(null, c); }]);
            },
            
            // ...and change the base dir for real
            function setBasePath(candidate, n) {
              if (!candidate) return n(new Error("No directory choosen"));
              var result = (candidate && (Object.isString(candidate) ? candidate : candidate.path)) || null;
              if (result) alertOK('base directory is now ' + result);
              else alertOK('resetting base directory to default');
              lively.shell.setWorkingDirectory(result);
              n(null, result);
            }
          )(function(err, dir) { });
          return true;
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

    'lively.ide.CommandLineInterface.printDirectory': {
        description: 'Print directory hierarchy',
        exec: function() {
            function printIt(dir) {
                lively.shell.run("find " + dir.path + "", {}, function(err, cmd) {
                    lively.require('lively.data.DirectoryUpload').toRun(function() {
                        var files = cmd.getStdout().split('\n')
                        new lively.data.DirectoryUpload.Handler().printFileNameListAsTree(files);
                    });
                    
                })
            }
            lively.ide.CommandLineSearch.interactivelyChooseFileSystemItem(
                'choose directory: ',
                lively.ide.CommandLineInterface.cwd(),
                function(files) { return files.filterByKey('isDirectory'); },
                "lively.ide.browseFiles.baseDir.NarrowingList",
                [printIt]);
        }
    },

    'lively.ide.execShellCommand': {
        description: 'execute shell command',
        exec: function(codeEditor, args) {
            Global.event.stop();

            var insertResult   = !args || typeof args.insert === 'undefined' || !!args.insert,
                insertProgress = args  && !!args.insertProgress,
                openInWindow   = !codeEditor || (args && args.count !== 4)/*universal argument*/,
                addToHistory   = args && args.addToHistory,
                group          = (args && args.group) || 'interactive-shell-command',
                editor;

            var cmdString = args && args.shellCommand;
            if (cmdString) runCommand(cmdString);
            else {
                $world.prompt('Enter shell command to run.', function(cmdString) {
                    if (!cmdString) show('No command entered, aborting...!');
                    else runCommand(cmdString);
                }, {historyId: 'lively.ide.execShellCommand'}).panel.focus();
            };

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

            function ensureCodeEditor(title) {
                if (editor) return editor;
                if (!openInWindow && codeEditor && codeEditor.isCodeEditor) return codeEditor;
                var ed = $world.addCodeEditor({
                    title: 'shell command: ' + title,
                    gutter: false, textMode: 'text',
                    extent: pt(400, 500), position: 'center'});
                ed.owner.comeForward();
                return editor = ed;
            }

            function runCommand(command) {
                var ed = ensureCodeEditor(command), mergeUndos;

                var title = ed.getWindow().getTitle();
                if (ed.getWindow()) ed.getWindow().setTitle("[running] " + title);

                ed.mergeUndosOf(function(triggerMerge) {
                    mergeUndos = triggerMerge;

                    var cmd = lively.shell.run(command, {addToHistory: addToHistory, group: group}, function(err, cmd) {
                        if (!insertProgress && insertResult)
                            ed.printObject(null, cmd.resultString(true));

                        if (ed.getWindow()) ed.getWindow().setTitle(title);

                        mergeUndos && mergeUndos();
                    });

                    if (insertProgress) {
                        ed.collapseSelection('end');
                        ed.addScript(function insertAndGrowSelection(string) {
                            var rangeBefore = this.getSelectionRangeAce();
                            this.printObject(null,string);
                            var rangeAfter = this.getSelectionRangeAce();
                            this.setSelectionRangeAce({start: rangeBefore.start, end: rangeAfter.end});
                        });
                        lively.bindings.connect(cmd, 'stdout', ed, 'insertAtCursor', {updater: function($upd, string) { $upd(string, false, false, true); }});
                        lively.bindings.connect(cmd, 'stderr', ed, 'insertAtCursor', {updater: function($upd, string) { $upd(string, false, false, true); }});
                    }
                });
            }

        }
    },
    'lively.ide.execShellCommandInWindow': {
        description: 'execute shell command in window',
        exec: function() {
            require('lively.ide.tools.ShellCommandRunner').toRun(function() {
                lively.BuildSpec('lively.ide.tools.ShellCommandRunner')
                    .createMorph().openInWorldCenter().comeForward();
            });
            return true;
        }
    },
    'lively.ide.CommandLineInterface.killShellCommandProcess': {
        description: 'kill shell command process',
        exec: function(codeEditor, args) {
            lively.ide.CommandLineInterface.reset();
        }
    },
    'lively.ide.CommandLineInterface.browseRunningShellCommands': {
        description: 'browse shell command processes',
        exec: function() {
            var q = lively.ide.CommandLineInterface.commandQueue;
            var groups = Object.keys(q);
            var cmds = groups
                .map(function(group) {
                    return q[group].map(function(cmd) {
                        return {
                            isListItem: true,
                            value: cmd,
                            string: Strings.format('%s [%s]', cmd, group)
                        }
                    })
                }).flatten();
            var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
                // name: '_lively.ide.CommandLineInterface.browseRunningShellCommands',
                spec: {
                    prompt: 'select: ',
                    candidates: cmds,
                    keepInputOnReactivate: true,
                    actions: [{
                        name: 'open in ShellCommandRunner',
                        exec: function(cmd) {
                            require("lively.ide.tools.ShellCommandRunner").toRun(function() {
                                lively.ide.tools.ShellCommandRunner.forCommand(
                                    cmd).openInWorldCenter().comeForward();
                            });
                        }
                    }, {
                        name: 'kill command',
                        exec: function(cmd) {
                            cmd.kill("SIGKILL", function() { show('kill signal send'); });
                        }
                    }]
                }
            });
            return true;
        }
    },
    'lively.ide.CommandLineInterface.showRunningShellCommands': {
        description: 'show shell command processes',
        exec: function() {
            var ed =$world.addCodeEditor({
                title: 'Running commands',
                textMode: 'text'
            });
            ed.addScript(function update() {
                // this.startStepping(100, 'update')
                var q = lively.ide.CommandLineInterface.commandQueue;
                var groups = Object.keys(q);
                var output = groups
                    .reject(function(g) { return !q[g]|| !q[g].length; })
                    .map(function(group) { return printGroup(group, q[group]); })
                    .join('\n\n');
                this.textString = output;
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                function printGroup(name, cmds) {
                    var cmdStrings = cmds.invoke('printState').join('\n  ');
                    return Strings.format('%s:\n  %s', name, cmdStrings);
                }
            })
            ed.startStepping(700, 'update');
            return ed;

            return true;
        }
    },

    'lively.ide.CommandLineInterface.showShellCommandHistory': {
        description: "show shell command history",
        exec: function() {
            lively.ide.CommandLineInterface.history.showHistory();
            return true;
        }
    },

    // tools
    'lively.ide.openWorkspace': {
        description: 'open Workspace',
        exec: function() {
            lively.require("lively.ide.tools.JavaScriptWorkspace").toRun(function() {
                lively.ide.tools.JavaScriptWorkspace.open(); });
            return true;
        }
    },
    'lively.ide.openTextWindow': {description: 'open Text window', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openTextWindow(); return true; }},
    'lively.ide.openSystemCodeBrowser': {description: 'open SystemCodeBrowser', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openSystemBrowser(); return true; }},
    'lively.ide.openObjectEditor': {description: 'open ObjectEditor', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openObjectEditor(); return true; }},
    'lively.ide.openBuildSpecEditor': {description: 'open BuildSpecEditor', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openBuildSpecEditor(); return true; }},
    'lively.ide.openWorldCSSEditor': {description: 'open CSS Editor', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openWorldCSSEditor(); return true; }},
    'lively.ide.openTestRunner': {description: 'open TestRunner', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openTestRunner(); return true; }},
    'lively.ide.openMethodFinder': {description: 'open MethodFinder', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openReferencingMethodFinder(); return true; }},
    'lively.ide.openTextEditor': {description: 'open TextEditor', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function(path) { lively.ide.openFile(path || URL.source.toString()); return true; }},
    'lively.ide.openSystemConsole': {
        description: 'open SystemConsole (to see console logging)',
        exec: function() {
            if ($world.get("LogMessages")) $world.get("LogMessages").comeForward();
            else lively.require("lively.ide.tools.SystemConsole")
              .toRun(function() { lively.ide.tools.SystemConsole.open(); });
            return true;
        }
    },

    'lively.ide.openServerProcessViewer': {
        description: 'open server process viewer',
        exec: function() {
            lively.require("lively.ide.tools.ServerProcessViewer").toRun(function() {
                lively.ide.tools.ServerProcessViewer.open();
            });
            return true;
        }
    },

    'lively.ide.openOMetaWorkspace': {description: 'open OMetaWorkspace', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openOMetaWorkspace(); return true; }},
    'lively.ide.openSubserverViewer': {
        description: 'open SubserverViewer',
        exec: function(options) {
            options = options || {};
            var serverName = options.serverName,
                line = options.line;
            $world.openSubserverViewer(function(err, subserver) {
                serverName && subserver.targetMorph.selectServer(serverName);
                line && subserver.get("ServerSourceCode").selectAndCenterLine(line);
            });
            return true;
        }
    },
    'lively.ide.openServerWorkspace': {description: 'open ServerWorkspace', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openServerWorkspace(); return true; }},
    'lively.ide.openShellWorkspace': {description: 'open ShellWorkspace', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { var codeEditor = $world.addCodeEditor({textMode: 'sh', theme: 'pastel_on_dark', title: 'Shell Workspace', content: "# You can evaluate shell commands in here\nls $PWD"}).getWindow().comeForward(); return true; }},
    'lively.ide.openVersionsViewer': {description: 'open VersionsViewer', exec: function(path) { $world.openVersionViewer(path); return true; }},
    'lively.ide.openGitControl': {description: 'open GitControl', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openGitControl(); return true; }},
    'lively.ide.openServerLog': {description: 'open ServerLog', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { require('lively.ide.tools.ServerLog').toRun(function() { lively.ide.tools.ServerLog.open(); }); return true; }},
    'lively.ide.openDiffer': {description: 'open text differ', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { require('lively.ide.tools.Differ').toRun(function() { lively.BuildSpec('lively.ide.tools.Differ').createMorph().openInWorldCenter().comeForward(); }); return true; }},

    "lively.tests.mocha.runAll": {
      description: "run all mocha tests",
      exec: function runMochaTests(thenDo, mochaSuites) {
        lively.require('lively.MochaTests').toRun(function() {
          if (mochaSuites) lively.MochaTests.run(mochaSuites)
          else lively.MochaTests.runAll()
        });
        return true;
      }
    },
    "lively.tests.mocha.reset": {
      description: "reset mocha test suites",
      exec: function runMochaTests(thenDo, mochaSuites) {
        lively.require('lively.MochaTests').toRun(function() {
          lively.MochaTests.registeredSuites = {};
          alertOK("mocha tests resetted!")
        });
        return true;
      }
    },

    'lively.ide.showWikiFlap': {
        description: 'show wiki flap',
        exec: function(path) {
            require('lively.net.tools.Wiki').toRun(function() {
                lively.BuildSpec('lively.wiki.ToolFlap').createMorph().openInWorld();
            });
            return true;
        }
    },

    'lively.ide.diffWorkspaces': {
        description: 'diff workspaces',
        exec: function(editor1, editor2) {

            var editors;

            Functions.composeAsync(
                loadRequiredModules,
                fetchEditorsIfRequired,
                selectEditor1,
                selectEditor2,
                doDiff,
                showDiff
            )();

            function loadRequiredModules(next) {
                lively.require('lively.ide.tools.Differ').toRun(function() { next(); });
            }

            function fetchEditorsIfRequired(next) {
                if (!editor1 || !editor2) editors = $world.withAllSubmorphsSelect(function(ea) {
                    return ea.isCodeEditor && !ea.isCommandLine; }).reverse();
                next(null);
            }

            function selectEditor1(next) {
                if (editor1) next(null, editor1);
                else selectMorph(editors, next);
            }

            function selectEditor2(editor1, next) {
                if (editor2) next(null, editor1, editor2);
                else selectMorph(editors.without(editor1), function(err, editor2) {
                    next(err, editor1, editor2); });
            }

            function doDiff(ed1, ed2, next) {
                var fn1 = ed1.getTargetFilePath() || 'no file',
                    fn2 = ed2.getTargetFilePath() || 'no file';
                var fn = fn1 === fn2 ? fn1 : fn1 + ' vs. ' + fn2;
                lively.ide.diffNonInteractive(fn, ed1.textString, ed2.textString, function(err, diff) {
                    next(err, fn, diff); });
            }

            function showDiff(fn, diff, next) {
                $world.addCodeEditor({
                    title: "diff " + fn,
                    content: diff,
                    textMode: 'diff',
                    extent: pt(700, 600)
                }).getWindow().comeForward();
            }

            function selectMorph(morphs, thenDo) {
                var candidates = morphs.map(function(ea) {
                    return {isListItem: true, value: ea, string: ea.name || String(ea)};
                });
                lively.ide.tools.SelectionNarrowing.getNarrower({
                    name: 'lively.ide.diffWorkspaces',
                    setup: function(narrower) { lively.bindings.connect(narrower, 'selection', Global, 'show'); },
                    input: '',
                    spec: {
                        prompt: 'choose editor: ',
                        candidates: candidates,
                        actions: [function choose(morph) { thenDo(null, morph); }]
                    }
                });
            }

            // require('lively.ide.tools.Differ').toRun(function() {
            //     lively.BuildSpec('lively.ide.tools.Differ').createMorph().openInWorldCenter().comeForward();
            // });

            return true;
        }
    },

    'lively.ide.openFileTree': {description: 'open file tree', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openFileTree(); return true; }},

    'lively.ide.openASTEditor': {
        description: 'open AST editor',
        exec: function(codeEditor) {
            if (!codeEditor) {
                var focused = lively.morphic.Morph.focusedMorph();
                if (focused && focused.isCodeEditor) codeEditor = focused;
            }
            lively.require('lively.ide.tools.ASTEditor').toRun(function() {
                lively.ide.tools.ASTEditor.openOn(codeEditor);
            });
            return true;
        }
    },

    'lively.ide.openDirViewer': {
        description: 'open directory viewer',
        isActive: Functions.True,
        exec: function(path) {
            require('lively.ide.tools.DirViewer').toRun(function() {
                lively.ide.tools.DirViewer.on(path);
            });
            return true;
        }
    },

    'lively.ide.findFile': {
        'description': 'find file',
        exec: function() {
            // This is the emacs "find-file" equivalent.
            // Lists all the files at the current dir defined by
            // lively.ide.CommandLineInterface.cwd().
            // On input filters files of current dir. Input can include path parts like
            // "../" or "apps/". This allows to navigate through directory structures.
            // The input after the last "/" is used to filter the file list. If enter is
            // pressed and the input after the "/" does not match a file or dir a text editor
            // is opened on that (non-existing) path, allowing to create a file on demand.

            var open = {
                name: 'open file item',
                exec: function(candidate) {
                    if (!candidate.isDirectory) {
                        lively.ide.commands.byName['lively.ide.openTextEditor'].exec(candidate.path);
                    } else if (candidate.isDirectory) {
                        lively.ide.commands.byName['lively.ide.openDirViewer'].exec(candidate.path);
                    }
                }
            }
            lively.ide.CommandLineSearch.interactivelyChooseFileSystemItem(
                        'open file: ',
                        null,
                        function(files, input) {
                            return files.length ? files : [{isDirectory: false, path: input}]; },
                        "lively.ide.findFiles.Narrower",
                        [open]);

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            // FIXME As a test to how well #interactivelyChooseFileSystemItem
            // works let's use the above solution for now
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            return true;

            var candidates, narrower, dir, searchDir, slash = '/';

            function splitInput(input) {
                // split input in basedir and filename
                var inputParts = input.split(slash),
                    filePattern = inputParts.pop();
                return {dir: inputParts.join(slash), filePattern: filePattern || ''}
            }

            var searcher = Functions.debounce(200, function(input, callback) {

                if (!dir) dir = lively.ide.CommandLineInterface.cwd();

                var dirParts = dir.split(slash),
                    splitted = splitInput(input);
                searchDir = dirParts.concat(splitted.dir).join(slash);

                lively.ide.CommandLineSearch.findFiles("*", {cwd: searchDir, depth: 1}, function(files) {

                    candidates = files.map(function(ea) {
                        return {isListItem: true, string: String(ea.fileName) + (ea.isDirectory ? '/' : ''), value: ea}
                    });

                    var filePattern = splitted.filePattern;
                    var filtered = narrower.doFilter(candidates, filePattern).filtered;

                    if (filtered.length !== 1 && filePattern.trim().length) {
                        filtered.unshift({
                            isListItem: true,
                            string: filePattern,
                            value: {isDirectInput: true, fileName: filePattern}
                        })
                    }

                    callback(filtered);
                });
            });

            function candidateBuilder(input, callback) {
                callback([input]);
                searcher(input, callback);
            };

            narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
                name: 'lively.ide.findFile.Narrower',
                reactivateWithoutInit: true,
                setup: function(n) {
                    n.deactivate = n.deactivate.wrap(function(proceed) { dir = null; proceed(); });
                },
                spec: {
                    prompt: 'search for something: ',
                    candidates: [],
                    maxItems: 25,
                    candidatesUpdater: candidateBuilder,
                    keepInputOnReactivate: true,
                    completeInputOnRightArrow: function(candidate) {
                        var splitted = splitInput(narrower.getInput())
                        return (splitted.dir ? splitted.dir + slash : '') + candidate.string;
                    },
                    actions: [{
                        name: 'open file item',
                        exec: function(candidate) {
                            var fullpath = searchDir + slash + candidate.fileName;
                            if (!candidate.isDirectory) {
                                lively.ide.commands.byName['lively.ide.openTextEditor'].exec(fullpath);
                            } else if (candidate.isDirectory) {
                                lively.ide.commands.byName['lively.ide.openDirViewer'].exec(fullpath);
                            }
                        }
                    }]
                }
            });

            return true;
        }
    },

    'lively.ide.openPresentationController': {description: 'open presentation controller', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openPresentationController(); return true; }},

    'lively.PartsBin.open': {description: 'open PartsBin', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { $world.openPartsBin(); return true; }},

    'lively.ide.openIframe': {
        description: 'open url in iframe',
        exec: function() {
            $world.prompt('Enter URL', function(url) {
                if (!url || !url.length) return;
                lively.morphic.World.loadInIFrameWithWindow(
                    url, $world.visibleBounds().insetByPt(pt(300, 200))).comeForward();
            }, {historyId: 'lively.ide.openIframeHistory'});
            return true;
        }
    },

    'lively.Config.openPreferences': {description: 'customize user preferences and config options', exec: function() { $world.openPreferences(); return true; }},

    // network helper
    'lively.net.loadJavaScriptFile': {
        description: 'load JavaScript file',
        exec: function() {
            $world.prompt('URL of file to load', function(input) {
                var url;
                try { url = String(new URL(input)); } catch(e) { show('%s is not a valid URL', input); return; }
                JSLoader.removeAllScriptsThatLinkTo(url);/*load even if loaded before*/
                JSLoader.loadJs(url);
            }, {input: 'http://lively-web.org/say-hello.js', historyId: 'lively.net.loadJavaScriptFile'});
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
    },

    // lively-2-lively
    'lively.net.lively2lively.openWorkspace': {description: 'open Lively2LivelyWorkspace', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { lively.require('lively.net.tools.Lively2Lively').toRun(function() { lively.BuildSpec("lively.net.tools.Lively2LivelyWorkspace").createMorph().openInWorldCenter().comeForward(); }); return true; }},
    'lively.net.tools.openLively2LivelyInspector': {description: 'open Lively2Lively inspector', isActive: lively.ide.commands.helper.noCodeEditorActive, exec: function() { lively.require('lively.net.tools.Lively2Lively').toRun(function() { lively.BuildSpec("lively.net.tools.Lively2LivelyInspector").createMorph().openInWorldCenter().comeForward(); }); return true; }},
    'lively.net.lively2lively.listSessions': {
        description: 'list lively-2-lively sessions',
        exec: function(withSelectedSessionDo, forceRefresh) {

            var foundCandidates = [];

            var searcher = Functions.debounce(200, function(input, callback) {
                lively.net.tools.Functions.withSessionsDo(
                    lively.net.tools.Functions.getLocalSession(),
                    function(err, sessions) {
                        if (err) { callback([String(err)]); return; }
                        var candidates = sessions.map(function(session) {
                            return {
                                isListItem: true,
                                string: lively.net.tools.Functions.getSessionTitle(session),
                                value: session
                            };
                        });
                        candidates = narrower.doFilter(candidates, input).filtered;
                        if (candidates.length === 0) candidates = ['nothing found'];
                        foundCandidates = candidates;
                        callback(candidates);
                    }, forceRefresh);
            });

            function candidateBuilder(input, callback) {
                if (!foundCandidates.length || input === "") {
                    callback(['searching...']);
                    searcher(input, callback);
                } else {
                    callback(narrower.doFilter(foundCandidates, input).filtered);
                }
            };

            var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
                name: 'lively.net.lively2lively.listSessions.NarrowingList',
                reactivateWithoutInit: true,
                spec: {
                    prompt: 'search for session: ',
                    candidates: [],
                    maxItems: 25,
                    candidatesUpdater: candidateBuilder,
                    keepInputOnReactivate: true,
                    actions: [{
                        name: 'open workspace or run callback',
                        exec: function(candidate) {
                            withSelectedSessionDo ?
                              withSelectedSessionDo(null, candidate) :
                              lively.net.tools.Functions.openWorkspaceForSession(candidate);
                        }
                    }, {
                        name: 'open world preview',
                        exec: function(candidate) {
                            lively.net.tools.Functions.openWorldPreview(candidate,
                                lively.net.tools.Functions.getSessionTitle(candidate));
                        }
                    }, {
                        name: 'visit world',
                        exec: function(candidate) {
                            lively.net.tools.Functions.visitWorldOfSession(candidate);
                        }
                    }, {
                        name: 'force refresh sessions',
                        exec: function(_) {
                            var s = lively.net.tools.Functions.getLocalSession();
                            s && s.isConnected() && s.getSessions(function() {
                                foundCandidates = [];
                                alertOK('refreshed...');
                            }, true);
                        }
                    }, {
                        name: 'print infos',
                        exec: function(candidate) {
                            var s = narrower.state.originalState || narrower.state;
                            var sessions = s.filteredCandidates.pluck('value');
                            $world.addCodeEditor({
                                title: "Info for l2l sessions",
                                content: sessions.map(lively.net.tools.Functions.printSession).join('\n\n'),
                                textMode: 'text',
                                extent: pt(600, 500)
                            }).getWindow().comeForward().openInWorldCenter();
                        }
                    }, {
                        name: 'show event logger',
                        exec: function(candidate) {
                            lively.net.tools.Functions.showEventLogger();
                        }
                    }]
                }
            });
            return true;
        }
    },

    "lively.net.wiki.tools.showLoginInfo": {
        description: "show login info",
        exec: function(withInfoMorphDo) {
            lively.require("lively.net.Wiki").toRun(function() {
                lively.net.Wiki.showLoginInfo(withInfoMorphDo);
            });
        }
    },

    // debugging
    'lively.ide.debugging.globalTrace': {
        description: "start / stop global tracing",
        exec: function() {
            lively.require("lively.Tracing").toRun(function() {
                var tracersInstalled = lively.Tracing && lively.Tracing.stackTracingEnabled,
                    globalTracingEnabled = tracersInstalled && lively.Tracing.globalTracingEnabled;
                if (!tracersInstalled) lively.Tracing.installStackTracers();
                if (!globalTracingEnabled) lively.Tracing.startGlobalTracing();
                else show("Tracing already in progress");
            });
        }
    },

    'lively.ide.debugging.globalTrace': {
        description: "start / stop global tracing",
        exec: function() {
            lively.require("lively.Tracing").toRun(function() {
                var tracersInstalled = lively.Tracing && lively.Tracing.stackTracingEnabled,
                    globalTracingEnabled = tracersInstalled && lively.Tracing.globalTracingEnabled;
                lively.Tracing.startGlobalTracing();
            });
        }
    },

    // javascript
    'prettyPrintJSON': {
        description: 'pretty print JSON',
        exec: function(json) {
            var ed;
            if (!json) {
                var morph = lively.ide.commands.helper.focusedMorph();
                if (morph.isCodeEditor || morph.isText) {
                    ed = morph;
                    json = ed.getTextRange();
                }
            }
            if (typeof json === "string") json = eval('(' + json + ')');
            var prettyJSON = JSON.stringify(json, null, 2);
            if (!ed) {
                ed = $world.addCodeEditor({title: "prettyPrinted", textMode: 'json', content: prettyJSON})
            } else {
                ed.replace(ed.getSelectionRangeAce(), prettyJSON);
            }
            return true;
        }
    },

    // meta
    'disabled': {
        isActive: lively.ide.commands.helper.noCodeEditorActive,
        exec: function() {
            var evt = Global.event, keys = evt.getKeyString();
            lively.morphic.World.current().alert(keys + ' globally disabled');
            return true;
        }
    }
});

Object.extend(lively.ide.commands.defaultBindings, { // bind commands to default keys
    'lively.morphic.World.save': {mac: ["Command-S", "cmd-s-l s a v e"], win: "Control-S"},
    'lively.ide.openSystemCodeBrowser': {mac: "Command-B", win: "Control-B"},
    'lively.ide.openWorkspace': {mac: "Command-K", win: "Control-K"},
    'lively.ide.openObjectEditor': {mac: "Command-O", win: "Control-O"},
    'lively.ide.openASTEditor': {mac: 'cmd-s-l a s t', win: 'ctrl-s-l a s t'},
    'lively.PartsBin.open': {mac: "Command-P", win: "Control-P"},
    'lively.morphic.World.resetScale': {mac: "Command-0", win: "Control-0"},
    'lively.morphic.World.escape': "esc",
    'lively.morphic.Window.close': {mac: "cmd-esc", win: "ctrl-esc"},
    'lively.morphic.Window.gather':{mac: 'cmd-s-l s t a c k w', win: 'ctrl-s-l s t a c k w'},
    'lively.morphic.Window.rename': {mac: 'cmd-s-l r e n', win: 'ctrl-s-l r e n'},
    'lively.morphic.Window.toggleCollapse': 'm-s-c',
    'lively.morphic.Morph.copy': {mac: 'cmd-s-l c o p y', win: 'ctrl-s-l c o p y'},
    'lively.morphic.Morph.showSceneGraph': 'm-m',
    'lively.ide.evalJavaScript': 'm-s-:',
    'lively.ide.WindowNavigation.start': {mac: ["Command-F3", "Command-`", "Command-1", "Alt-À","Alt-à", "Alt-`"], win: ["Alt-à","Alt-À", "Alt-`"]},
    'lively.ide.resizeWindow': 'Alt-F1',
    'lively.ide.browseFiles': 'Alt-t',
    'lively.ide.findFile': {mac: ['Control-X F', 'Control-X Control-F'], win: ['Control-X F', 'Control-X Control-F']},
    'lively.ide.openDirViewer': 'Control-X D',
    'lively.ide.CommandLineInterface.changeShellBaseDirectory': {mac: 'cmd-s-l d i r', win: 'ctrl-s-l d i r'},
    'lively.ide.SystemCodeBrowser.browseModuleStructure': {mac: "m-s-t", win: 'm-s-t'},
    'lively.ide.commands.keys.reset': 'F8',
    "lively.tests.mocha.runAll": "Control-C t",
    'lively.ide.tools.SelectionNarrowing.activateLastActive': "cmd-shift-y",
    'lively.morphic.Morph.openStyleEditor': "cmd-y",
    'lively.morphic.Halos.show': {mac: "cmd-h", win: 'ctrl-h'},
    'lively.morphic.List.selectItem': "m-space",
    'lively.ide.codeSearch': {mac: ["Command-Shift-C", "Command-Shift-F"], win: ["Control-Shift-C", 'Control-Shift-G', 'Control-Shift-F']},
    'lively.ide.execShellCommandInWindow': ["Alt-Shift-!", "Alt-Shift-1"],
    "lively.ide.CommandLineInterface.SpellChecker.spellCheckWord": "m-s-$",
    'lively.ide.commands.execute': "m-x",
    // normally browser fwd/bwd shortcut:
    'disabled': {mac: ["Command-[", "Command-]"], win: ["Control-[", "Control-]"]},
});

}) // end of module
