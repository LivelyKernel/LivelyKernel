module('lively.ide').requires('lively.Helper','lively.ide.SystemCodeBrowser', 'lively.ide.ErrorViewer', 'lively.ide.CommandLineInterface', 'lively.ide.tools.Differ').toRun(function() {

if (lively.Config.get("useWindowSwitcher")) {
    module('lively.ide.WindowNavigation').load();
}

if (Config.get("useAceEditor")) {
    module("lively.ide.CodeEditor").load();
}

if (Config.get('improvedJavaScriptEval')) {
    module("lively.ide.JSEvaluation").load();
}

if (Config.get('useHistoryTracking', true)) {
    module("lively.ide.SystemCodeBrowserAddons").load();
}

}); // end of module
