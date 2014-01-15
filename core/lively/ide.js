module('lively.ide').requires('lively.Helper','lively.ide.SystemCodeBrowser', 'lively.ide.VersionTools', 'lively.ide.ErrorViewer', 'lively.ide.CommandLineInterface').toRun(function() {

if (lively.Config.get("useWindowSwitcher")) {
    module('lively.ide.WindowNavigation').load();
}

if (Config.get("useAceEditor")) {
    module("lively.ide.CodeEditor").load();
}

if (Config.get('improvedJavaScriptEval')) {
    module("lively.ide.JSEvaluation").load();
}

}); // end of module
