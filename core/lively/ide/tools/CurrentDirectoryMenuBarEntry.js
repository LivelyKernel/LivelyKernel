module('lively.ide.tools.CurrentDirectoryMenuBarEntry').requires("lively.morphic.tools.MenuBar", "lively.ide.CommandLineInterface").toRun(function() {

lively.BuildSpec('lively.ide.tools.CurrentDirectoryMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "cwdLabel",
  menuBarAlign: "right",
  dirs: [lively.shell.cwd()],

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    align: "center",
    extent: lively.pt(300,20),
    textColor: Color.gray.darker(),
    toolTip: "Shows the directory all operating system commands work with. Click to change and browse."
  }),

  knownDirectories: function knownDirectories() {
    return ($world.knownWorkingDirectories || []).uniqBy(function(a,b) {
      var aPath = a ? (typeof a === "string" ? a : a.path) : "";
      var bPath = b ? (typeof b === "string" ? b : b.path) : "";
      return aPath.replace(/(\/|\\)$/, "") === bPath.replace(/(\/|\\)$/, "");
    });
  },

  actions: function actions() {
    var self = this;

    return {
      clear: function() {
        var dir = lively.shell.WORKSPACE_LK;
        if (dir) {
          $world.knownWorkingDirectories = self.dirs = [dir];
        } else {
          var cmd = lively.shell.exec('echo $WORKSPACE_LK', {sync: true})
          $world.knownWorkingDirectories = self.dirs = cmd.getCode() ? [] : [cmd.resultString().trim()];
        }
        self.update();
      },

      changeDir: function() {
        var cwd = lively.shell.exec('pwd', {sync:true}).resultString();
        lively.ide.CommandLineSearch.interactivelyChooseFileSystemItem(
            'choose directory: ',
            cwd,
            function(files) { return files.filterByKey('isDirectory'); },
            "clojure.baseDirList.NarrowingList",
            [self.addDir.bind(self)])
      },

      openDirViewer: function doAction() {
          lively.require("lively.ide.tools.DirViewer").toRun(function() {
            lively.ide.tools.DirViewer.on(lively.shell.cwd());
          })
      },

      runShellCommand: function doAction() {
        Global.require('lively.ide.commands.default').toRun(function() {
                  lively.ide.commands.exec('lively.ide.execShellCommandInWindow') })
      },

      showOsProcesses: function doAction() {
        Global.require('lively.ide.tools.ServerProcessViewer').toRun(function() {
          lively.ide.tools.ServerProcessViewer.open();
        });
      },

      searchInFiles: function doAction() {
        lively.require('lively.ide.commands.default').toRun(function() {
                  lively.ide.commands.exec("lively.ide.CommandLineInterface.doGrepSearch") })
      },

      searchForFiles: function doAction() {
        lively.require('lively.ide.commands.default').toRun(function() {
                  lively.ide.commands.exec('lively.ide.browseFiles') })
      },

      openGit: function doAction() {
        lively.require('lively.ide.commands.default').toRun(function() {
                  lively.ide.commands.exec('lively.ide.openGitControl') })
      },
    }
  },

  morphMenuItems: function morphMenuItems() {
    var mac = Global.UserAgent.isMacOS;
    var cmd = mac ? "cmd" : "ctrl";
    var self = this,
        actions = this.actions(),
        items = [
          ["change...",
            this.dirs.map(function(ea) {
              return [ea, self.addDir.bind(self, ea)]; })
                .concat([{isMenuItem: true, isDivider: true},
                         ["clear...", actions.clear],
                         ["choose...", actions.changeDir]])
          ],
          ["browse directory... (ctrl-x d)", actions.openDirViewer],
          ["find files... (ctrl-x f)", actions.searchForFiles],
          ["find in files (grep)... (" + cmd + "-shift-f)", actions.searchInFiles],
          ["run shell command... (alt-!)", actions.runShellCommand],
          ["open git control...", actions.openGit],
          ["show os processes...", actions.showOsProcesses],
        ];
    return items;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  addDir: function addDir(d, forceLoad) {
    var dirBefore = lively.shell.cwd();
    d = d && d.path ? d.path : (d || "");
    lively.shell.run('cd "'+d+'"; pwd', function(err, cmd) {
      var newD = !err && cmd.getStdout().trim().length ?
        cmd.getStdout().trim() : d.trim();
      if (newD.length === 0 || newD == "searching...") newD = dirBefore;
      newD = newD.replace(/\/$/, "");
      this.dirs.pushIfNotIncluded(newD);
      if (!$world.knownWorkingDirectories) $world.knownWorkingDirectories = [];
      $world.knownWorkingDirectories.pushIfNotIncluded(newD);
      if (forceLoad || dirBefore !== d) this.changeBaseDir(newD);
    }.bind(this));
  },

  changeBaseDir: function changeBaseDir(dir) {
      var path = dir && dir.path ? dir.path : (dir ? String(dir) : null);
      // $world.alertOK(dir ? 'base directory is now ' + path : 'resetting base dir');
      lively.shell.setWorkingDirectory(path);
      lively.Config.get("lively.lang.Runtime.active") && lively.require("lively.lang.Runtime").toRun(function() {
          lively.lang.Runtime.loadLivelyRuntimeInProjectDir(path) });
      this.update();
  },

  update: function update() {
    lively.shell.cwd(function(err, path) {
      if (!path) path = lively.shell.WORKSPACE_LK;
      this.updateText(path);
      if (!this.dirs.include(path))
        this.addDir(path);
    }.bind(this));
  },

  onLoad: function onLoad() {
    lively.bindings.connect(lively.shell, 'currentDirectory', this, 'update');
    (function() { this.update(); }).bind(this).delay(0);
    this.startStepping(30*1000, "update");
    var dChooser = $world.get(/^BaseDirectoryChooser/)
    if (dChooser)
      this.dirs = this.dirs.concat(dChooser.get("DirList").getList().pluck("value").compact()).uniq();
    $world.knownWorkingDirectories = ($world.knownWorkingDirectories||[]).concat(this.dirs);
    $world.knownWorkingDirectories = this.knownDirectories();
    this.dirs = this.knownDirectories();
    if ($world.currentWorkingDirectory) this.addDir($world.currentWorkingDirectory, true/*force load*/);
  },

  onOwnerChanged: function onOwnerChanged(owner) {
    lively.bindings[this.world() ? "connect" : "disconnect"]
      (lively.shell, 'currentDirectory', this, 'update');
  }
}));

Object.extend(lively.ide.tools.CurrentDirectoryMenuBarEntry, {

    getMenuBarEntries: function() {
        return [lively.BuildSpec("lively.ide.tools.CurrentDirectoryMenuBarEntry").createMorph()];
    }

});

}) // end of module
