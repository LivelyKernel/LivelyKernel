(function fixModules() {
  var ast = lively.ast, acorn = ast.acorn;
  delete lively.ast;
  Object.assign(module("lively.ast"), ast, {acorn: Object.assign(module("lively.ast.acorn"), acorn)});
  module("lively.ast").isLoaded = lively.lang.fun.True;
  module("lively.ast.acorn").isLoaded = lively.lang.fun.True;
})();

module('lively.lang.VM').requires("lively.ast.acorn").toRun(function() {

Object.assign(lively.lang.VM, lively.vm);

}); // end of module
