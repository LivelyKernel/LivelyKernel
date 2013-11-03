module('lively.ide.codeeditor.Modes').requires('lively.ide.codeeditor.ace').toRun(function() {

// Used as a plugin for the lively.ide.CodeEditor.DocumentChangeHandler, will
// trigger attach/detach actions for modes that require those
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

(function setupModes() {
    require('lively.Network').toRun(function() {
        var webR = URL.codeBase.withFilename('lively/ide/codeeditor/modes/').asWebResource();
        webR.beAsync().getSubElements().whenDone(function(_, status) {
            setTimeout(function() {
                if (!webR.subDocuments) {
                    console.warn("Cannot load codeeditor text mode modules %s", status.toString());
                    return;
                }
                webR.subDocuments.map(function(webR) {
                    return lively.module(webR.getURL().relativePathFrom(URL.codeBase));
                }).compact().forEach(function(mod) { mod.load(); });
            }, 10);
        });
    });
})();

}) // end of module