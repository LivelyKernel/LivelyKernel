module('lively.ide.commands.default').requires().toRun(function() {

Object.extend(lively.ide.commands, {
    byName: {},
    defaultBindings: {},
    exec: function(commandName) {
        var cmd = lively.ide.commands.byName[commandName];
        try {
            return !cmd || !cmd.exec ? null : cmd.exec();
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

Object.extend(lively.ide.commands.byName, { // add default commands
    escape: {
        exec: function() {
            // Global Escape will drop grabbed morphs, remove menus, close halos
            var world = lively.morphic.World.current(), h = world.firstHand();
            if (h.submorphs.length > 0) { h.dropContentsOn(world); return true; }
            if (world.worldMenuOpened) { h.removeOpenMenu(event); return true; }
            if (world.currentHaloTarget) { world.removeHalosOfCurrentHaloTarget(); return true; }
            return false;
        }
    },
    closeActiveWindow: {
        exec: function() {
            $world.closeActiveWindow();
            return true;
        }
    },
    windowNavigation: {
        exec: function() {
            lively.ide.WindowNavigation.WindowManager.current().startWindowSelection();
            return true;
        }
    },
    resetKeyBindings: {
        exec: function() {
            lively.ide.WindowNavigation.WindowManager.reset();
            lively.morphic.KeyboardDispatcher.reset();
            delete $world._grepSearcher;
            return true;
        },
    },
    activatePrevSelectionNarrower: {
        exec: function() {
            var n = lively.ide.tools.SelectionNarrowing && lively.ide.tools.SelectionNarrowing.lastActive;
            n && n.activate();
        }
    },
    doGrepSearch: {
        exec: function() {
            // that's just a late night hack!
            // $world._grepSearcher = null
            var w = lively.morphic.World.current();
            if (w._grepSearcher) {
                w._grepSearcher.activate();
                return true;
            }
            if (w.hasOwnProperty('doNotSerialize')) w.doNotSerialize.push('_grepSearcher');
            else w.doNotSerialize = ['_grepSearcher'];
            var narrower = w._grepSearcher = lively.BuildSpec('lively.ide.tools.NarrowingList').createMorph();
            lively.bindings.connect(narrower, 'confirmedSelection', narrower, 'deactivate');
            lively.bindings.connect(narrower, 'escapePressed', narrower, 'deactivate');
            lively.bindings.connect(narrower, 'escapePressed', show.bind('foooo'), 'call');
            var greper = Functions.debounce(500, function(input, callback) {
                lively.ide.CommandLineSearch.doGrep(input, null, function(lines) {
                    callback(lines.asListItemArray());
                })
            });
            var spec = {
                candidatesUpdaterMinLength: 3,
                candidates: Array.range(0,20).invoke('toString'),
                candidatesUpdater: greper,
                actions: [function(candidate) { lively.ide.CommandLineSearch.doBrowseGrepString(candidate); }]
            }
            narrower.open(spec);
            return true;
        }
    },
    renameCurrentWindow: {
        exec: function() {
            show('!')
            var focused = lively.morphic.Morph.focusedMorph(),
                win = focused && focused.getWindow();
            if (!win) { show('Cannot find active window!'); return; }
            $world.prompt('Enter new window title', function(input) {
                if (input !== null) win.titleBar.setTitle(input || '');
            }, win.titleBar.getTitle());
        }
    }
});

Object.extend(lively.ide.commands.defaultBindings, { // bind commands to default keys
    escape: "esc",
    closeActiveWindow: "cmd-esc",
    windowNavigation: {mac: "cmd-`", win: "ctrl-`"},
    resetKeyBindings: 'F8',
    activatePrevSelectionNarrower: "cmd-y",
    doGrepSearch: "cmd-s-g",
    renameCurrentWindow: 'cmd-s-l r e n'
});

}) // end of module