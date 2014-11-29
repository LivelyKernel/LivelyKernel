module('lively.MochaTests').requires()
  .requiresLib({url: "//cdnjs.cloudflare.com/ajax/libs/mocha/2.0.1/mocha.js", loadTest: function() { return typeof mocha !== "undefined"; }})
  .requiresLib({url: "//cdnjs.cloudflare.com/ajax/libs/chai/1.10.0/chai.js", loadTest: function() { return typeof chai !== "undefined"; }}).toRun(function() {
/*global mocha*/

Global.expect = Global.chai.expect;

mocha.ui("bdd");

Global.describe = Global.describe.getOriginal().wrap(function(proceed, title, fn) {
  var suite = Global.describe.getOriginal()(title, fn);
  if (suite.parent.root) lively.MochaTests.registeredSuites[title] = suite;
  return suite;
});


Object.subclass('lively.MochaTests.Reporter', {
  initialize: function() {
    this.passes = [];
    this.failures = [];
  },

  reporterFunc: function() {
    var reporter = this;
    return function(runner) {
      runner.on('pass', function(test) {
        reporter.passes.push([test.fullTitle()]);
        reporter.report(false, reporter.passes, reporter.failures);
      });
    
      runner.on('fail', function(test, err) {
        reporter.failures.push(Strings.format("%s\n  %s",
          test.fullTitle(),  Strings.indent(err.stack || err.message), "  ", 1));
        reporter.report(false, reporter.passes, reporter.failures);
      });
    
      runner.on('end', function() { reporter.report(true, reporter.passes, reporter.failures); });
    }
  },

  report: function(final, passes, failures) {
    var logger = $morph("testLogger") 
              || $world.addCodeEditor({
                title: "mocha test result",
                textMode: "text",
                extent: pt(600,700)});
    logger.name = "testLogger";
    var report = Strings.format("passes:\n%s\n\nfailures:\n%s\n",
        passes.join('\n'), failures.join('\n'));
    if (final) failures.length && typeof show !== "undefined" ?
      show("%s failures", failures.length) : alertOK("All passed");
    if (logger) logger.textString = report;
    else console.log(report);
  }

});

Object.extend(lively.MochaTests, {

  registeredSuites: {},

  addSuite: function(suite) {
    return lively.MochaTests.registeredSuites[suite.title] = suite;
  },

  runAll: function(thenDo) {
    // lively.MochaTests.runAll()
    var suites = lively.MochaTests.registeredSuites;
    var reporter = new lively.MochaTests.Reporter();
    var m = new (mocha.constructor)({reporter: reporter.reporterFunc(), ui: "bdd"})
    lively.lang.obj.values(suites).forEach(m.suite.addSuite.bind(m.suite));
    m.run(function() { thenDo && thenDo(null, reporter); });
  },

  run: function(suite, thenDo) {
    var reporter = new lively.MochaTests.Reporter();
    var m = new (mocha.constructor)({reporter: reporter.reporterFunc(), ui: "bdd"})
    m.suite.addSuite(suite)
    m.run(function() { thenDo && thenDo(null, reporter); });
  }

});

}) // end of module
