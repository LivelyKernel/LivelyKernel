// rk 2016-09-20
// Fix for using a newer version of Lively with the old module system
var ast = lively.ast, acorn = ast.acorn;
delete lively.ast;
Object.assign(lively.module("lively.ast"), ast, {acorn: Object.assign(lively.module("lively.ast.acorn"), acorn)});
lively.module("lively.ast").isLoaded = lively.lang.fun.True;
lively.module("lively.ast.acorn").isLoaded = lively.lang.fun.True;
