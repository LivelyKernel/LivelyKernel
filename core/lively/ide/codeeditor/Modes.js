module('lively.ide.codeeditor.Modes').requires('lively.ide.codeeditor.ace').toRun(function() {

Object.extend(lively.ide.codeeditor.Modes, {

    extensions: (function findAvailableExtensions() {
        var exts, dir = URL.codeBase.withFilename("lively/ide/codeeditor/modes/");
        lively.Module.findAllInThenDo(dir, function(modules) {
            exts = lively.ide.codeeditor.Modes.extensions = modules.map(function(mod) {
                return {
                    modeName: mod.name().split('.').last().toLowerCase(),
                    module: mod
                }
            })
        }, true/*sync*/);
        return exts;
    })(),

    ensureModeExtensionIsLoaded: function(aceMode, thenDo) {
        var modeName = (aceMode.$id || 'ace/mode/text').split('/').last();
        var ext = this.extensions.detect(function(ext) { return ext.modeName === modeName });
        if (!ext || ext.module.isLoaded()) { thenDo(null, ext && ext.module); return; }
        ext.module.load(true);
        thenDo(null, ext.module);
    }
});

Object.subclass('lively.ide.codeeditor.Modes.ChangeHandler',
"testing", {
    isActiveFor: function(evt) { return evt.type === 'changeMode'; }
},
'rendering', {
    onModeChange: function(evt) {
        var s = evt.session,
            modeState = s.$livelyModeState || (s.$livelyModeState = {}),
            lastMode = modeState.lastMode,
            currentMode = evt.session.getMode();
        if (lastMode && lastMode.detach) {
            lastMode.detach(evt.codeEditor.aceEditor);
        }
        modeState.lastMode = currentMode;
        if (currentMode && currentMode.attach) {
            currentMode.attach(evt.codeEditor.aceEditor);
        }
    }
});

(function registerModeHandler() {
    lively.module('lively.ide.codeeditor.DocumentChange').runWhenLoaded(function() {
        lively.ide.CodeEditor.DocumentChangeHandler.registerModeHandler(lively.ide.codeeditor.Modes.ChangeHandler);
    });
})();

}) // end of module
