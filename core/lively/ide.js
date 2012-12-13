module('lively.ide').requires('lively.Helper','lively.ide.SystemCodeBrowser', 'lively.ide.VersionTools', 'lively.ide.ErrorViewer').toRun(function() {

if (Config.get("advancedSyntaxHighlighting")) {
    module("lively.ast.IDESupport").load();
}

}); // end of module