module("lively.ast.acorn").requires().requiresLib({url: Config.codeBase + 'lib/lively.ast.dev.js', loadTest: function() { return lively.ast && lively.ast.parse; }}).requiresLib({url: Config.codeBase + 'lib/babel-browser.js', loadTest: function() { return typeof babel !== "undefined"; }}).toRun(function() {

// This module is currently kept around while transitioning to the lively.ast lib integration.
// It formerly contained lively's acorn extensions

}); // end of module
