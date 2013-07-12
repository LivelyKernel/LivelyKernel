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

Object.extend(lively.ide.commands.byName, {
    // world
    'lively.morphic.World.escape': {
        description: 'escape',
        exec: function() {
            // Global Escape will drop grabbed morphs, remove menus, close halos
            var world = lively.morphic.World.current(), h = world.firstHand();
            if (h.submorphs.length > 0) { h.dropContentsOn(world); return true; }
            if (world.worldMenuOpened) { h.removeOpenMenu(event); return true; }
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
            lively.ide.WindowNavigation.WindowManager.reset();
            lively.morphic.KeyboardDispatcher.reset();
            delete $world['_lively.ide.CommandLineInterface.doGrepSearch.NarrowingList'];
            delete $world['_lively.ide.commands.execute.NarrowingList'];
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
    // search
    'lively.ide.CommandLineInterface.doGrepSearch': {
        description: 'code search (grep)',
        exec: function() {
            var w = lively.morphic.World.current();
            var cachedName = '_lively.ide.CommandLineInterface.doGrepSearch.NarrowingList';
            if (w[cachedName]) { w[cachedName].activate(); return true; }
            if (w.hasOwnProperty('doNotSerialize')) w.doNotSerialize.push(cachedName); else w.doNotSerialize = [cachedName];
            var narrower = w[cachedName] = lively.BuildSpec('lively.ide.tools.NarrowingList').createMorph();
            lively.bindings.connect(narrower, 'confirmedSelection', narrower, 'deactivate');
            lively.bindings.connect(narrower, 'escapePressed', narrower, 'deactivate');
            lively.bindings.connect(narrower, 'activate', narrower, 'selectInput');
            var greper = Functions.debounce(500, function(input, callback) {
                lively.ide.CommandLineSearch.doGrep(input, null, function(lines) {
                    callback(lines.asListItemArray());
                })
            });
            var spec = {
                prompt: 'search for: ',
                candidatesUpdaterMinLength: 3,
                candidates: Array.range(0,20).invoke('toString'),
                candidatesUpdater: greper,
                actions: [function(candidate) { lively.ide.CommandLineSearch.doBrowseGrepString(candidate); }]
            }
            narrower.open(spec);
            return true;
        }
    },
});

Object.extend(lively.ide.commands.defaultBindings, { // bind commands to default keys
    'lively.morphic.World.escape': "esc",
    'lively.morphic.World.save': 'cmd-s-l s a v e',
    'lively.morphic.Window.close': "cmd-esc",
    'lively.morphic.Window.gather':'cmd-s-l s t a c k w',
    'lively.morphic.Window.rename': 'cmd-s-l r e n',
    'lively.ide.WindowNavigation.start': {mac: "cmd-`", win: "ctrl-`"},
    'lively.ide.commands.keys.reset': 'F8',
    'lively.ide.tools.SelectionNarrowing.activateLastActive': "cmd-y",
    'lively.morphic.Halos.show': "cmd-h",
    'lively.ide.CommandLineInterface.doGrepSearch': "cmd-s-g",
    'lively.ide.commands.execute': "m-x"
});

}) // end of module