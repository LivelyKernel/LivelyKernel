module('lively.users.tests.Tests').requires("lively.users.Core", "lively.TestFramework").toRun(function() {

AsyncTestCase.subclass('lively.users.tests.Authorization',
"testing", {
  
  testIsUserAllowToWriteWorld: function() {
    var user = new lively.users.User("test-user-1");
    
    lively.lang.fun.composeAsync(
      n => user.canWriteWorld("test/world.html", n),
      (answer, n) => { this.assertEqualState({value: false}, answer); n(); },
      n => {
        user.addRule(url => !!url.fullPath().match(/\/test\//));
        user.canWriteWorld("test/world.html", n)
      },
      (answer, n) => { this.assertEqualState({value: true}, answer); n(); },
      n => {
        user.addRule({type: "RegExp", rule: "users/${user.name}/.*"});
        user.canWriteWorld("users/test-user-1/world.html", n)
      },
      (answer, n) => { this.assertEqualState({value: true}, answer); n(); }
    )(err => {
      this.assert(!err, err && show(String(err.stack || err)));
      this.done();
    });
  },

  testUserRedirect: function() {
    var user = new lively.users.User("test-user-1");
    var expected = {redirect: true, value: URL.root.withFilename("users/test-user-1/world.html")};
    
    lively.lang.fun.composeAsync(
      n => {
        user.addRule({type: "Function", rule: String(function(url) { 
          return {redirect: true, value: URL.root.withFilename("users/" + this.name + "/" + url.filename())}; })});
        user.canWriteWorld("foo/world.html", n);
      },
      (answer, n) => { this.assertEqualState(expected, answer); n(); }
    )(err => {
      this.assert(!err, err && show(String(err.stack || err)));
      this.done();
    });
  }

})

}) // end of module
