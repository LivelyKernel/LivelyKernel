var libsLoaded = false,
    libs = [], dependencies = [],
    vmDir = (Config.rootPath + "node_modules/lively.vm").replace(/^[^:]+:\/\/[^\/]+\//, "");

(function initLoad() {
  libs = [
      Config.rootPath + "node_modules/systemjs/dist/system.src.js",
      Config.rootPath + "node_modules/lively.vm/index-browser.js"
  ];
  dependencies = [
      {url: libs[0], loadTest: function() { return typeof System !== "undefined"; }},
      {url: libs[1], loadTest: function() { return !!lively.vm; }},
  ];
  module('lively.lang.VM').requires("lively.ast.acorn").requiresLib({urls: libs, loadTest: function() { return !!libsLoaded; }})
  dependencies.doAndContinue(function(next, lib) {
      JSLoader.loadJs(lib.url);
      var interval = Global.setInterval(function() {
          if (!lib.loadTest()) return;
          Global.clearInterval(interval);
          next();
      }, 50);
  }, function() {
    lively.lang.fun.waitFor(3000,
      function() { return !!lively.vm.load; },
      function(err) {
        if (err) console.error("Error loading lively.vm:", err);
        lively.vm.load(vmDir).then(function() { libsLoaded = true; })
    });
  });
})();


module('lively.lang.VM').requires().toRun(function() {

Object.extend(lively.lang.VM, lively.vm);

}); // end of module
