// This is a temporary fix for supporting es6 scripts
// We will add support for es6->es5 transforms in Lively and this can go away

var babel = require("babel-core");
var child_process = require("child_process");
var fs = require("fs");

var found = child_process.execSync('find core \\( -iname ".svn" -o -iname ".git" -o -iname "node_modules" -o -iname "combined.js" -o -iname "BootstrapDebugger.js" \\) -prune -o -type f -iname "*.js" -print'),
    files = lively.lang.string.lines(found.toString()).compact();

var visitor = {ArrowFunctionExpression: function (node, st) { st.es6 = true; }},
    es6Files = files.filter(f => {
      try {
        var ast = acorn.parse(fs.readFileSync(f).toString(), {ecmaVersion: 6});
        var state = {es6: false};
        acorn.walk.simple(ast, visitor, null, state);
        return state.es6
      } catch (e) {
        console.log(f);
        console.error(e);
        return false;
      }
    });

es6Files.forEach(f => {
  var tfmed = babel.transformFileSync(f, {compact: false, comments: true}).code;
  tfmed = tfmed.replace(/^'use strict';\n*/m, "");
  fs.writeFileSync(f, tfmed);
});
