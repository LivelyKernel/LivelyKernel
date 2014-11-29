module('lively.lang.tests.Runtime').requires('lively.MochaTests','lively.lang.Runtime').toRun(function() {
/*global it,describe,expect,beforeEach,afterEach,mocha*/

var expect = chai.expect;
var comp = lively.lang.fun.composeAsync;

describe('lively.lang.Runtime', function() {

  describe("registry", function() {

    var sut, registry;
    beforeEach(function() {
      registry = {projects: {}};
      sut = lively.lang.Runtime.Registry;
    });

    it("registers projects", function() {
      sut.addProject(registry, {
        name: "test project",
        resources: {
          "foo.js": {name: "foo.js", code: "var x = 23;"},
          "all tests": {name: "all tests", matches: /tests\/.*\.js/}}
      })
      expect(sut.hasProject(registry, "test project")).equals(true);
      expect(sut.hasProject(registry, "nononono")).equals(false);
      expect(sut.getProjectWithResource(registry, "foo.js")).to.be.an("object");
      expect(sut.getProjectWithResource(registry, "bar.js")).to.be.undefined();
      expect(sut.getProjectWithResource(registry, "tests/baz.js")).to.be.an("object")
        .with.deep.property("resources.all tests");
    })
  });

  describe("project change handling", function() {

    var sut, project, log;
    function handler(name, change, project, resource, whenHandled) {
      log += [name, change.resourceId, change.newSource].join(" ") + "|";
      whenHandled();
    }
    beforeEach(function() {
      sut = lively.lang.Runtime.Project;
      log = "";
      project = {
        name: "test project", resources: {
          "resource 1": {matches: "foo.js", changeHandler: handler.curry("resource 1")},
          "resource 2": {matches: /^b.*\.js/, changeHandler: handler.curry("resource 2")},
          "resource 3": {matches: ["baz.js"], changeHandler: handler.curry("resource 3")}
        }
      }
    });

    it("calls change handler", function(done) {
      comp(
        function(n) { lively.lang.Runtime.Project.processChange(project, "foo.js", "x", n); },
        function(n) { expect(log).equals("resource 1 foo.js x|"); n(); }
      )(done);
    });

    it("gracefully deals with change handler without callbacks", function(done) {
      project.resources["resource 1"].changeHandler = function(change, project, resource) { log += "called"; };
      comp(
        function(n) { lively.lang.Runtime.Project.processChange(project, "foo.js", "x", n); },
        function(n) { expect(log).equals("called"); n(); }
      )(done);
    });

    it("matches change handlers to resources", function(done) {
      comp(
        function(n) { lively.lang.Runtime.Project.processChange(project, "foo.js", "a", n); },
        function(n) { lively.lang.Runtime.Project.processChange(project, "bar.js", "b", n); },
        function(n) { lively.lang.Runtime.Project.processChange(project, "zork.js", "c", n); },
        function(n) {
          expect(log).equals("resource 1 foo.js a|resource 2 bar.js b|");
          n();
        }
      )(done);

    });

  });

  describe("resource change apply", function() {

    var sut;
    beforeEach(function() {
      sut = lively.lang.Runtime.Resource;
    });

    it("deletes lines", function() {
      var resource = {name: "test resource", code: "var x = 23;\nvar y = 24;\nvar z = 25;\nvar foo = 22;\n"};
      sut.applyDeltas(resource, [{"action":"removeLines","range":{"start":{"row":1,"column":0},"end":{"row":3,"column":0}},"nl":"\n","lines":["var y = 24;","var z = 25;"]}]),
      expect(resource.code).equals("var x = 23;\nvar foo = 22;\n")
    });

    it("inserts lines", function() {
      var resource = {name: "test resource", code: "var x = 23;\nvar foo = 22;\n"};
      sut.applyDeltas(resource, [{"action":"insertLines","range":{"start":{"row":1,"column":0},"end":{"row":3,"column":0}},"lines":["var y = 24;","var z = 25;"]}]),
      expect(resource.code).equals("var x = 23;\nvar y = 24;\nvar z = 25;\nvar foo = 22;\n")
    });

    it("inserts text", function() {
      var resource = {name: "test resource", code: "var x = 23;\nvar foo = 22;\n"};
      sut.applyDeltas(resource, [{"action":"insertText","range":{"start":{"row":1,"column":11},"end":{"row":1,"column":14}},"text":"010"}]),
      expect(resource.code).equals("var x = 23;\nvar foo = 20102;\n")
    });

    it("removes text", function() {
      var resource = {name: "test resource", code: "var x = 23;\nvar foo = 22;\n"};
      sut.applyDeltas(resource, [
        {"action":"removeText","range":{"start":{"row":0,"column":10},"end":{"row":1,"column":4}},"text":";\nvar "},
        {"action":"insertText","range":{"start":{"row":0,"column":10},"end":{"row":0,"column":11}},"text":","}
      ]),
      expect(resource.code).equals("var x = 23,foo = 22;\n")
    });

  });
});

// mocha.suite.suites=[]
// lively.MochaTests.run(mocha.suite)

}) // end of module
