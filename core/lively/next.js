module('lively.next').requires("lively.morphic.tools.MenuBar").toRun(function() {

// from here we just trigger a hook to load lively.system / lively.next
// including the new module system on world load

var bootstrapped = lively.lang.promise.deferred();

lively.whenLoaded(function() {
  lively.modules.registerPackage("node_modules/lively-system-interface")
    .then(() => System.import("lively-system-interface/lively-kernel-extensions.js"))
    .then(ext => ext.bootstrapLivelySystem())
    .then(() => bootstrapped.resolve())
    .catch(err => { bootstrapped.reject(err); $world.logError(err)})
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
      ["Open change sorter", function() {
        lively.modules.registerPackage("node_modules/lively.changesets").then(() => {
          const win = lively.PartsBin.getPart("ChangeSorter", "PartsBin/lively.modules");
          win.openInWorldCenter().comeForward();
        });
      }],
      {isMenuItem: true, isDivider: true},
      ["create a new morphic world", function() { lively.next.createNewMorphicWorld(); }],
      ["Reload all lively.next packages", reloadLivelyNext],

      {isMenuItem: true, isDivider: true},
      ["Update lively.next...", updateLivelyNext],
      ["Show package updates and status...", showPackageUpdatesAndStatus],
      ["Show PartsBin updates and status...", showPartsBinUpdatesAndStatus],
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

    function showPartsBinUpdatesAndStatus() {
      askForBaseDir().then(baseDir => askForToServURL()
        .then(toURL => lively.modules.registerPackage("node_modules/lively.installer")
          .then(() => System.import("lively.installer/partsbin-status.js")
            .then(status =>
          new status.ReporterWidget(baseDir, "PartsBin/lively.modules", "https://dev.lively-web.org/", toURL)
            .morphicSummaryAsMorph()))))
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

  bootstrapped: bootstrapped.promise,

  createNewMorphicWorld: function() {
    lively.next.bootstrapped
      .then(() => window.lively.modules.importPackage("node_modules/lively.morphic"))
      .then(() => window.System.import("lively.morphic/old-lively-helpers.js"))
      .then(helpers => helpers.createWorld())
      .catch(err => window.$world.logError(err))
  },

  getMenuBarEntries: function() {
    return [lively.BuildSpec('lively.next.MenuBarEntry').createMorph()]
  }

});

}) // end of module
