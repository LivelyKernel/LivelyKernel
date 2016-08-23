module('lively.ide').requires('lively.Helper','lively.ide.SystemCodeBrowser', 'lively.ide.ErrorViewer', 'lively.ide.CommandLineInterface', 'lively.ide.tools.Differ').toRun(function() {

if (lively.Config.get("useWindowSwitcher")) {
    module('lively.ide.WindowNavigation').load();
}

if (Config.get("useAceEditor")) {
    module("lively.ide.CodeEditor").load();
}

if (Config.get('useHistoryTracking', true)) {
    module("lively.ide.SystemCodeBrowserAddons").load();
}

Object.extend(lively.ide, {
    openFile: function (url, whenDone) {
        lively.require('lively.ide.tools.TextEditor').toRun(function() {
            var editor = lively.BuildSpec('lively.ide.tools.TextEditor').createMorph();
            if (url) {
                if (String(url).match(/^(\/|.:\\)/)) {
                    // absolute local path
                } else if (!String(url).startsWith('http')) {
                    url = URL.root.withFilename(url).withRelativePartsResolved();
                }
                editor.openURL(url);
            }
            editor.openInWorld($world.positionForNewMorph(editor)).comeForward();
            typeof whenDone === 'function' && whenDone(editor);
        });
    },

    openFileAsEDITOR: function (file, whenEditDone) {
        lively.ide.openFile(file, function(editor) {
            editor.closeVetoed = false;
            editor.wasStored = false;

            lively.bindings.connect(editor, 'contentStored', whenEditDone, 'call', {
                updater: function($upd) {
                    var editor = this.sourceObj;
                    editor.wasStored = true;
                    editor.initiateShutdown();
                    $upd(null,null, "saved");
                }
            });

            editor.onOwnerChanged = function(owner) {
                if (this.wasStored) return;
                this.closeVetoed = !!owner;
                if (!this.wasStored && !this.closeVetoed) whenEditDone(null, 'aborted');
            };
        });
    },

    withLoadingIndicatorDo: function(label, doFunc) {
      return lively.module('lively.morphic.tools.LoadingIndicator').load()
        .then(function(mod) { return mod.open(label); })
        .then(function(indicator) {
          doFunc && doFunc(null, indicator, indicator.remove.bind(indicator));
          return indicator;
        });
    }

});

// Lazy loading of debugging related things... should go somewhere else, I guess
function lazyLoadDebugging(method) {
  return function() {
    var args = Array.from(arguments);
    lively.require("lively.ide.codeeditor.JavaScriptDebugging").toRun(function() {
      lively[method].apply(lively, args);
    })
  }
}

Object.extend(lively, {
  debugCall: lively.debugCall || lazyLoadDebugging("debugCall"),
  debugNextMethodCall: lively.debugNextMethodCall || lazyLoadDebugging("debugNextMethodCall")
});

}); // end of module
