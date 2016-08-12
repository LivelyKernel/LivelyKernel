module('lively.users.tests.Tests').requires("lively.users.Core", "lively.TestFramework").toRun(function() {

TestCase.subclass('lively.users.tests.Attributes',
"testing", {
  testAddAttributesToUser: function() {
    var user1 = lively.users.User.named("test-user-1");
    
    user1.addAttributes({foo: 34, bar: 24});
    user1.setAttributes({bar: 25});
    this.assertEqualState({bar: 25}, user1.getAttributes(), "add + set");
    
    var user2 = lively.users.User.named("test-user-1");
    this.assertEqualState({bar: 25}, user2.getAttributes(), "attributes are saved");

    user2.clearAttributes();
    this.assertEqualState({}, user2.getAttributes(), "attributes are deleted");

    var user3 = lively.users.User.named("test-user-1");
    this.assertEqualState({}, user3.getAttributes(), "attributes are deleted consistently");
  }
});

AsyncTestCase.subclass('lively.users.tests.Authorization',
'running', {

  setUp: function($super) {
    this.oldRules = (lively.Config._globalPermissions || []).clone();
    lively.Config._globalPermissions = [];
    // lively.Config._globalPermissions = this.oldRules;
    $super();
  },

  tearDown: function($super) {
    lively.Config._globalPermissions = this.oldRules;
    $super();
  }

},
"testing", {
  
  testIsUserAllowToWriteWorld: function() {
    var test = this,
        user = new lively.users.User("test-user-1");

    lively.lang.fun.composeAsync(

      function(n) { return user.canWriteWorld("test/world.html", n); },
      function(answer, n) { test.assertEqualState({value: "deny"}, answer, "1"); n(); },

      function(n) {
        user.addRule(function(url) { return !!url.fullPath().match(/\/test\//); });
        user.canWriteWorld("test/world.html", n)
      },
      function(answer, n) { test.assertEqualState({value: "allow"}, answer, "2"); n(); },

      function(n) {
        user.addRule({type: "RegExp", rule: "users/${user.name}/.*"});
        user.canWriteWorld("users/test-user-1/world.html", n)
      },
      function(answer, n) { test.assertEqualState({value: "allow"}, answer, "3"); n(); }

    )(function(err) {
      test.assert(!err, err && show(String(err.stack || err)));
      test.done();
    });
  },

  testGlobalRule1: function() {
    var test = this,
        user = new lively.users.User("test-user-1");
    lively.users.GlobalRules.addRule(function (url) { return {value: !!url.fullPath().match(/\/test\//)}; });
    lively.lang.fun.composeAsync(
      function(n) { user.canWriteWorld("test/world.html", n); },
      function(answer, n) { test.assertEqualState({value: "allow"}, answer); n(); }
    )(function(err) {
      test.assert(!err, err && show(String(err.stack || err)));
      test.done();
    });
  },

  testGlobalRule2: function() {
    var user = new lively.users.User("test-user-1");
    lively.users.GlobalRules.addRule(url => ({value: !!url.fullPath().match(/\/test\//)}));
    lively.lang.fun.composeAsync(
      n => user.canWriteWorld("test/world.html", n),
      (answer, n) => { this.assertEqualState({value: "allow"}, answer); n(); }
    )(err => {
      this.assert(!err, err && show(String(err.stack || err)));
      this.done();
    });
  },

  testUserRedirect: function() {
    var test = this;
    var user = new lively.users.User("test-user-1");
    var expected = {value: "redirect", url: URL.root.withFilename("users/test-user-1/world.html")};
    
    lively.lang.fun.composeAsync(
      function(n) {
        user.addRule({type: "Function", rule: String(function(url) { 
          return {value: "redirect", url: URL.root.withFilename("users/" + this.name + "/" + url.filename())}; })});
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
