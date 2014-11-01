jsext.installGlobals();

window.$A = Array.from;

// We need to redefine Function.evalJS here b/c the original definition is
// in a JS 'use strict' block. However, not all function sources we pass in
// #evalJS from Lively adhere to the strictness rules. To allow those
// functions for now we define the creator again outside of a strictness block.
Function.evalJS = jsext.fun.evalJS = function(src) { return eval(src); }

jsext.Path.type = lively.PropertyPath;
jsext.Path.prototype.serializeExpr = function () {
  // ignore-in-doc
  return 'lively.PropertyPath(' + Objects.inspect(this.parts()) + ')';
}

jsext.Closure.type = "lively.Closure";
