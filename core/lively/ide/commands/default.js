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
            return true;
        },
    }
});
Object.extend(lively.ide.commands.defaultBindings, { // bind commands to default keys
    escape: "esc",
    closeActiveWindow: "cmd-esc",
    windowNavigation: {mac: "cmd-`", win: "ctrl-`"},
    resetKeyBindings: 'C-c r k'
});

}) // end of module