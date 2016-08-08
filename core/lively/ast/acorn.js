(function fixModules() {
  var ast = lively.ast, acorn = ast.acorn;
  delete lively.ast;
  Object.assign(module("lively.ast"), ast, {acorn: Object.assign(module("lively.ast.acorn"), acorn)});
  module("lively.ast").isLoaded = lively.lang.fun.True;
  module("lively.ast.acorn").isLoaded = lively.lang.fun.True;
})();

module("lively.ast.acorn").requires().requiresLib({loadTest: function() { return window.babel; }, url: Config.codeBase + 'lib/babel-browser.js'}).toRun(function() {

// rk 2016-03-03
// FIXME
// Moving on to a fully contained es6 module implementation that makes acorn
// not global anymore. Since we still have some code depending on window.acorn I
// added this hack for now
// window.acorn = lively.ast.acorn;

// This module is currently kept around while transitioning to the lively.ast lib integration.
// It formerly contained lively's acorn extensions

}); // end of module
