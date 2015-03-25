module('lively.morphic.tools.LogMenuBarEntry').requires("lively.morphic.tools.MenuBar", 'lively.ide.tools.SystemConsole').toRun(function() {

lively.BuildSpec('lively.morphic.tools.LogMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "LogMenuBarEntry",
  menuBarAlign: "right",
  maxLogMessages: 299,
  logMessages: [],
  textString: "0",
  normalColor: Color.parseHex("#333"),
  warnColor: Color.orange,
  errColor: Color.red,

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    padding: lively.rect(3,4,0,-4),
    extent: lively.pt(30,22),
    toolTip: "Click to open log messages. When errors occur they will be logged here.",
    align: "center",
    fontSize: 8
  }),

  morphMenuItems: function morphMenuItems() {
    var self = this;
    return [
      ["open log", function() {
        lively.ide.commands.exec('lively.ide.openSystemConsole');
        (function() {
          var temp = $world.get("LogMessages").get("logText").textString;
          self.logMessages.forEach(function(ea) {
            $world.get("LogMessages").targetMorph.onLogMessage(ea[0], ea[1])
          });
          $world.get("LogMessages").get("logText").textString += temp;
          self.clear();
        }).delay(0);
      }],
      [lively.lang.string.format("[%s] verbose logging", lively.Config.get('verboseLogging') ? "x" : " "), function() { lively.Config.toggle('verboseLogging'); }]
    ];
  },

  update: function update() {},

  clear: function clear() {
    this.textString = "0";
    this.logMessages = [];
    this.applyStyle({textColor: this.normalColor})
  },

  onOwnerChanged: function onOwnerChanged(newOwner) {
    var self = this;
    lively.lang.fun.debounceNamed(this.id+"onOwnerChanged", 300, function() {
      self[self.world() ? 'install' : 'uninstall']();
    })();
  },

  onLoad: function onLoad() {
    this.clear();
    this.install();
  },

  onFromBuildSpecCreated: function onFromBuildSpecCreated() {
    this.onLoad()
  },

  install: function install(_console, _window) {
    lively.ide.tools.SystemConsole.ConsoleWrapperFunctions.install(this);
  },

  uninstall: function uninstall() {
    lively.ide.tools.SystemConsole.ConsoleWrapperFunctions.uninstall(this)
  },
  
  onLogMessage: function onLogMessage(type, msg) {
    if ($world.get("LogMessages")) return;
    if (this.logMessages.length > this.maxLogMessages) this.logMessages.shift();
    this.logMessages.push([type, msg]);
    if (type.match(/^warn/) && this.normalColor.equals(this.textColor)) {
      this.setTextColor(this.warnColor);
    }
    if (type.match(/^err/) && !this.errColor.equals(this.textColor)) {
      this.setTextColor(this.errColor);
    }
    this.textString = this.logMessages.length;
  }

}));

Object.extend(lively.morphic.tools.LogMenuBarEntry, {

  getMenuBarEntries: function() {
    return [
      lively.BuildSpec('lively.morphic.tools.LogMenuBarEntry').createMorph()]
  }
});

}) // end of module
