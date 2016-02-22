var libsLoaded = false,
    libs = [], dependencies = [];

(function initLoad() {
  var write = document.write;
  document.write = function(s) {
    var scripts = document.getElementsByTagName('script');
    var lastScript = scripts[scripts.length-1];
    lastScript.insertAdjacentHTML("beforebegin", s);
  }
  libs = [
      Config.rootPath + "node_modules/systemjs/dist/system.src.js",
      Config.rootPath + "node_modules/lively.ast/dist/lively.ast.js",
      Config.rootPath + "node_modules/lively.vm/dist/lively.vm.js"
  ];
  dependencies = [
      {url: libs[0], loadTest: function() { return typeof System !== "undefined"; }},
      {url: libs[1], loadTest: function() { return !!lively.ast; }},
      {url: libs[2], loadTest: function() { return !!lively.vm; }},
  ];
  module('lively.lang.VM').requires().requiresLib({urls: libs, loadTest: function() { return !!libsLoaded; }})
  dependencies.doAndContinue(function(next, lib) {
      JSLoader.loadJs(lib.url);
      var interval = Global.setInterval(function() {
          if (!lib.loadTest()) return;
          Global.clearInterval(interval);
          next();
      }, 50);
  }, function() { document.write = write; libsLoaded = true; });
})();


module('lively.lang.VM').requires().toRun(function() {

Object.extend(lively.lang.VM, lively.vm);

}); // end of module
