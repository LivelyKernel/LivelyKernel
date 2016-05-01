(function initLoad() {
  var libsLoaded = false;

  var libs = [
      Config.rootPath + "node_modules/systemjs/dist/system.src.js",
      Config.rootPath + "node_modules/lively.modules/load-from-source.js",
      Config.rootPath + "node_modules/lively.modules/bootstrap/browser.js"
  ];
  var dependencies = [
      {url: libs[0], loadTest: function() { return typeof System !== "undefined"; }},
      {url: libs[1], loadTest: function() { return true; }},
      {url: libs[2], loadTest: function() { return !!lively.modules; }},
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
    lively.modules.System.import("lively.vm")
      .then(vm => {
        lively.vm = vm;
        libsLoaded = true;
        // FIXME
        delete lively.lang._prevLivelyGlobal; // se we don't run into problems traversing namespaces
      });
  });
})();


module('lively.lang.VM').requires().toRun(function() {

Object.extend(lively.lang.VM, lively.vm);

}); // end of module
