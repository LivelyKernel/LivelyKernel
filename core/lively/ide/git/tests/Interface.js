module('lively.ide.git.tests.Interface').requires('lively.ide.git.Interface', 'lively.TestFramework').toRun(function() {

var git = lively.ide.git.Interface;

AsyncTestCase.subclass('lively.ide.git.tests.Interface.Test',
'running', {
    setUp: function(run) {
      
      this.origRunCommandsThenDo = git.runCommandsThenDo;

    var self = this;
    self.commandOutputs = [];

    git.runCommandsThenDo = function (commands, options, thenDo) {
        if (typeof options === "function") {
          thenDo = options; options = null;
        }
        options = options || {};
    
        var defaultOptions = ['--no-pager'];
    
        commands = commands.map(function(cmd, i) {
          if (cmd.gitCommand) {
            if (Object.isArray(cmd.gitCommand)) cmd.gitCommand = cmd.gitCommand.join(' ');
            cmd.command = ['git'].concat(defaultOptions).concat([cmd.gitCommand]).join(' ');
          }
          cmd.options = cmd.options || {};
          cmd.name = cmd.name || "command-" + i;
          cmd.n = i;
          cmd.result = self.commandOutputs[i];
          return cmd;
        });
        
        var result = commands.reduce(function(results, cmd) {
          results['cmd' + cmd.name.capitalize()] = cmd;
          results[cmd.name] = cmd.result;
          return results;
        }, {});
    
        thenDo && thenDo(null, result);
      }

      this.onTearDown(function() {
        git.runCommandsThenDo = this.origRunCommandsThenDo;
      });
      
      run();
    },

    tearDown: function() {},

    assertCommandsMatch: function(specs, commands) {
      if (specs.length !== commands.length) this.assert(false, lively.lang.string.format("Unequal number of epxected and real commands: %s vs %s"), specs.length, commands.length);
      specs.forEach(function(spec, i) {
        var cmd = commands[i];
        if (!cmd.command) this.assert(false, lively.lang.string.format("Command has no cmd property: %o"), cmd);
        if (Object.isFunction(spec)) spec.call(this, cmd);
        else {
          var match = cmd.command.match(spec);
          if (!match) this.assert(false, lively.lang.string.format("Command %s does not match %s", cmd.command, spec));
        }
      }, this);
    },
},
'testing', {

    testFileStatus: function() {
      var err, result;
      var expected = [
        {change: "deleted", fileName: "file-a", status: "staged"},
        {change: "modfied", fileName: "file-b", status: "unstaged"},
        {change: "modfied", fileName: "file-b", status: "staged"},
        {change: "modfied", fileName: "file-c", status: "unstaged"},
        {change: "added",   fileName: "file-d", status: "staged"},
        {change: "",        fileName: "file-e", status: "untracked"}];

      this.commandOutputs = [      
          "D  file-a\n"
        + "MM file-b\n"
        + " M file-c\n"
        + "A  file-d\n"
        + "?? file-e\n"
      ];

      git.fileStatus(function(_err, fileObjects) { err = _err; result = fileObjects; });

      this.waitFor(function() { return !!err || !!result; }, 10, function() {
        err && this.assert(false, String(err.stack));
        this.assertMatches(expected, result);
        this.done();
      })
    }

});


}) // end of module
