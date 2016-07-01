module('lively.next').requires("lively.morphic.tools.MenuBar").toRun(function() {

// from here we just trigger a hook to load lively.system / lively.next
// including the new module system on world load

lively.whenLoaded(function() {
  lively.modules.registerPackage("node_modules/lively-system-interface")
    .then(() => System.import("lively-system-interface/lively-kernel-extensions.js"))
    .then(ext => ext.bootstrapLivelySystem())
    .catch(show.curry("%s"));
});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


lively.BuildSpec('lively.next.MenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "lively.next.MenuBarEntry",
  menuBarAlign: "left",
  textString: "lively.next",

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    extent: lively.pt(80,22),
    toolTip: "lively.next tooling"
  }),

  morphMenuItems: function morphMenuItems() {
    return [
      ["Open modules browser", function() {
        var win = lively.PartsBin.getPart("lively.vm-editor", "PartsBin/lively.modules");
        win.openInWorldCenter().comeForward();
        win.targetMorph.update().then(() => win.targetMorph.packageCollapseAll());
      }],
      ["Open module editor", function() {
        var win = lively.PartsBin.getPart("ModuleEditor", "PartsBin/lively.modules");
        win.openInWorldCenter().comeForward();
      }],
      {isMenuItem: true, isDivider: true},
      ["Show package updates and status", showPackageUpdatesAndStatus],
      ["Show PartsBin summary", printPartsBinSummary],
      ["Update lively.next packages and objects", updateLivelyNext],
      ["Reload all lively.next packages", reloadLivelyNext],
    ]

    function askForBaseDir() {
      return $world.prompt("Where is the base directory of the lively.next packages?", {
        input: lively.shell.WORKSPACE_LK.split("/").slice(0,-1).join("/"),
        historyId: "lively.next-update-base-dir-chooser"
      }).then(baseDir => baseDir ? baseDir : Promise.reject("Canceled"));
    }

    function askForToServURL() {
      return $world.prompt("Where is the destination server for lively.modules parts?", {
        input: Config.rootPath,
        historyId: "lively.next-update-to-serv-chooser"
      }).then(toURL => toURL ? toURL : Promise.reject("Canceled"));
    }

    function reloadLivelyNext() {
      lively.modules.registerPackage("node_modules/lively-system-interface")
        .then(() => System.import("lively-system-interface/lively-kernel-extensions.js"))
        .then(ext => ext.reloadLivelySystem())
        .catch(err => $world.inform("Error reloading lively.next:\n" + err.stack || err));
    }

    function updateLivelyNext() {
      askForBaseDir().then(baseDir => askForToServURL()
        .then(toURL => lively.modules.registerPackage("node_modules/lively.installer")
        .then(() => System.import("lively.installer/install.js"))
        .then(installer => installer.install(baseDir, toURL))))
        .catch(err => err !== "Canceled" && $world.inform("Error updating:\n" + err.stack || err));
    }

    function showPackageUpdatesAndStatus() {
      askForBaseDir().then(baseDir => lively.modules.registerPackage("node_modules/lively.installer")
        .then(() => System.import("lively.installer/package-status.js"))
        .then(status => new status.ReporterWidget(baseDir).morphicSummaryAsMorph()))
        .catch(err => err !== "Canceled" && $world.logError(err));
    }

    function printPartsBinSummary() {
      askForToServURL().then(toURL => lively.modules.registerPackage("node_modules/lively.installer")
        .then(() => System.import("lively.installer/status.js"))
        .then(status => status.openPartsBinSummary("PartsBin/lively.modules", "https://dev.lively-web.org/", toURL)))
        .catch(err => err !== "Canceled" && $world.logError(err));
    }

  },

  update: function update() {}

}));

// lively.morphic.tools.MenuBar.openOnWorldLoad()

Object.extend(lively.next, {

  getMenuBarEntries: function() {
    return [lively.BuildSpec('lively.next.MenuBarEntry').createMorph()]
  }

});

}) // end of module
