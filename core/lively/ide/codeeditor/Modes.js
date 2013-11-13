var modeModules = [
 "lively.ide.codeeditor.modes.Clojure",
 "lively.ide.codeeditor.modes.Haskell",
 "lively.ide.codeeditor.modes.R",
 "lively.ide.codeeditor.modes.SQL",
 "lively.ide.codeeditor.modes.Shell"];

module('lively.ide.codeeditor.Modes').requires(['lively.ide.codeeditor.ace'].concat(modeModules)).toRun(function() {
    console.log("CodeEditor modules loaded");
}) // end of module
