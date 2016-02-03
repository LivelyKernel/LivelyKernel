module('lively.MochaTests').requires().requiresLib({url: lively.Config.codeBase + "lib/mocha-bundle.js", loadTest: function() { return typeof mocha !== "undefined"; }}).toRun(function() {
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
    if (!final) { console.log("tentative mocha report, passes: %s, failures: %s", passes.length, failures.length); return; }
    var name = "testLogger",
        logger = $morph(name);
    if (!logger) {
      logger = $world.addCodeEditor({
        name: name,
        title: "mocha test result",
        textMode: "text",
        extent: pt(600,700)
      });
      logger.getWindow().comeForward();
    }

    var report = Strings.format("failures:\n%s\n\npasses:\n%s\n",
        failures.join('\n'), passes.join('\n'));
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
    if (mocha.options.grep) { m.grep(mocha.options.grep); mocha.options.grep = null; }
    lively.lang.obj.values(suites).forEach(m.suite.addSuite.bind(m.suite));
    m.run(function() { thenDo && thenDo(null, reporter); });
  },

  run: function(suite, thenDo) {
    var reporter = new lively.MochaTests.Reporter();
    var m = new (mocha.constructor)({reporter: reporter.reporterFunc(), ui: "bdd"});
    m.suite.addSuite(suite);
    if (mocha.options.grep) { m.grep(mocha.options.grep); mocha.options.grep = null; }
    m.run(function() { thenDo && thenDo(null, reporter); });
  }

});

}) // end of module
