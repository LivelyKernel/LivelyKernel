var acornLibsLoaded = false,
    acornLibs = [], dependencies = [],
    isNodeJs = typeof process !== "undefined" && process.version;

(function initLoad() {
    if (isNodeJs) {
        nodejs.require("util")._extend(Global.lively.ast, nodejs.require(process.cwd() + "/node_modules/lively.ast"));
        Global.babel = nodejs.require(process.cwd() + "/node_modules/babel-core");
        Global.escodegen = nodejs.require(process.cwd() + "/node_modules/escodegen");
        acornLibsLoaded = true;
    } else {
        module("lively.ast"); // ensure module object
        acornLibs = [
            Config.codeBase + 'lib/escodegen.browser.js',
            Config.rootPath + 'node_modules/lively.ast/dist/lively.ast.js', // pulls in acorn, defines lively.ast
            Config.codeBase + 'lib/babel-browser.js'
        ];
        dependencies = [
            {url: acornLibs[0], loadTest: function() { return typeof escodegen !== 'undefined'; }},
            {url: acornLibs[1], loadTest: function() { return lively.ast && lively.ast.acorn; }},
            {url: acornLibs[2], loadTest: function() { return typeof babel !== 'undefined'; }}
        ];
        module("lively.ast.acorn").requires().requiresLib({urls: acornLibs, loadTest: function() { return !!acornLibsLoaded; }});
        dependencies.doAndContinue(function(next, lib) {
            JSLoader.loadJs(lib.url);
            var interval = Global.setInterval(function() {
                if (!lib.loadTest()) return;
                Global.clearInterval(interval);
                next();
            }, 50);
        }, function() { acornLibsLoaded = true; });
    }
})();

module("lively.ast.acorn").requires().toRun(function() {

// This module is currently kept around while transitioning to the lively.ast lib integration.
// It formerly contained lively's acorn extensions

}); // end of module
