(function fixModules() {
  var ast = lively.ast, acorn = ast.acorn;
  delete lively.ast;
  Object.assign(module("lively.ast"), ast, {acorn: Object.assign(module("lively.ast.acorn"), acorn)});
  module("lively.ast").isLoaded = lively.lang.fun.True;
  module("lively.ast.acorn").isLoaded = lively.lang.fun.True;
})();

module("lively.ast.acorn").requires().requiresLib({loadTest: function() { return window.babel; }, url: Config.codeBase + 'lib/babel-browser.js'}).toRun(function() {

// This module is currently kept around while transitioning to the lively.ast lib integration.
// It formerly contained lively's acorn extensions

}); // end of module
