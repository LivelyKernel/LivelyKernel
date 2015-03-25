module('lively.morphic.tools.ActiveWindowMenuBarEntry').requires("lively.morphic.tools.MenuBar").toRun(function() {

lively.BuildSpec('lively.morphic.tools.ActiveWindowMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: 'ActiveWindowMenuBarEntry',
  menuBarAlign: "left",

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    extent: lively.pt(10,22),
    toolTip: "Active window"
  }),

  morphMenuItems: function morphMenuItems() {
    function cmd(name) { return function() { lively.ide.commands.exec(name); }; }
    return [];
  },

  onWindowActivated: function onWindowActivated(win) {
    this.updateText(win.getTitle());
  },

  update: function update() {},
  
  onLoad: function() {
    lively.bindings.connect(lively.morphic.Window, 'windowActivated', this, 'onWindowActivated');
  },
  

}));

Object.extend(lively.morphic.tools.ActiveWindowMenuBarEntry, {

  getMenuBarEntries: function() {
    return [
      lively.BuildSpec('lively.morphic.tools.ActiveWindowMenuBarEntry').createMorph()]
  }
});

}) // end of module
