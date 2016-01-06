module('lively.users.tests.Tests').requires("lively.users.Core", "lively.TestFramework").toRun(function() {

AsyncTestCase.subclass('lively.users.tests.Authorization',
'running', {
  
  setUp: function($super) {
    lively.Config._globalPermissions = lively.Config._globalPermissions || [];
    this.oldRules = lively.Config._globalPermissions.clone();
    $super();
  },

  tearDown: function($super) {
    lively.Config._globalPermissions = this.oldRules;
    $super();
  }

},
"testing", {
  
  testIsUserAllowToWriteWorld: function() {
    var test = this;
    var user = new lively.users.User("test-user-1");
    
    lively.lang.fun.composeAsync(
      function(n) { return user.canWriteWorld("test/world.html", n); },
      function(answer, n) { test.assertEqualState({value: false}, answer); n(); },
      function(n) {
        user.addRule(function(url) { return !!url.fullPath().match(/\/test\//); });
        user.canWriteWorld("test/world.html", n)
      },
      function(answer, n) { test.assertEqualState({value: true}, answer); n(); },
      function(n) {
        user.addRule({type: "RegExp", rule: "users/${user.name}/.*"});
        user.canWriteWorld("users/test-user-1/world.html", n)
      },
      function(answer, n) { test.assertEqualState({value: true}, answer); n(); }
    )(function(err) {
      test.assert(!err, err && show(String(err.stack || err)));
      test.done();
    });
  },

  testGlobalRule: function() {
    var user = new lively.users.User("test-user-1");
    lively.users.GlobalRules.addRule(url => ({value: !!url.fullPath().match(/\/test\//)}));
    lively.lang.fun.composeAsync(
      n => user.canWriteWorld("test/world.html", n),
      (answer, n) => { this.assertEqualState({value: true}, answer); n(); }
    )(err => {
      this.assert(!err, err && show(String(err.stack || err)));
      this.done();
    });
  },

  testUserRedirect: function() {
    var test = this;
    var user = new lively.users.User("test-user-1");
    var expected = {redirect: true, value: URL.root.withFilename("users/test-user-1/world.html")};
    
    lively.lang.fun.composeAsync(
      function(n) {
        user.addRule({type: "Function", rule: String(function(url) { 
          return {redirect: true, value: URL.root.withFilename("users/" + this.name + "/" + url.filename())}; })});
        user.canWriteWorld("foo/world.html", n);
      },
      function(answer, n) { test.assertEqualState(expected, answer); n(); }
    )(function(err) {
      test.assert(!err, err && show(String(err.stack || err)));
      test.done();
    });
  }

})

}) // end of module
