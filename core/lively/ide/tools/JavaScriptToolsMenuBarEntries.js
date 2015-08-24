module("lively.ide.tools.JavaScriptToolsMenuBarEntries").requires("lively.morphic.tools.MenuBar").toRun(function() {

lively.BuildSpec('lively.ide.tools.JavaScriptToolsMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "jsToolsMenuBarEntry",
  menuBarAlign: "left",
  textString: "open",

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    align: "center",
    extent: lively.pt(60,20),
    textColor: Color.gray.darker(),
    toolTip: "Access to JavaScript tools",
  }),

  morphMenuItems: function morphMenuItems() {
    function cmd(name) { return function() { lively.ide.commands.exec(name); }; }
    return [
      ['PartsBin', cmd("lively.PartsBin.open")],
      ['JavaScript Workspace', cmd('lively.ide.openWorkspace')],
      ['JavaScript Browser', cmd('lively.ide.openSystemCodeBrowser')],
      ['Subserver Viewer', cmd('lively.ide.openSubserverViewer')]
    ]
  },

  update: function update() {},
  
}));

lively.BuildSpec('lively.ide.tools.LivelySearchMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "livelySearchMenuBarEntry",
  menuBarAlign: "left",
  textString: "search",

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    align: "center",
    extent: lively.pt(60,20),
    textColor: Color.gray.darker(),
    toolTip: "Search the Lively runtime and wiki",
  }),

  morphMenuItems: function morphMenuItems() {
    function cmd(name) { return function() { lively.ide.commands.exec(name); }; }
    return [
      ['Code search', cmd('lively.ide.codeSearch')],
      ['Search for worlds, modules, parts', cmd('lively.ide.resourceSearch')],
      ['Search for files', cmd('lively.ide.browseFiles')],
      ['Search in files', cmd('lively.ide.CommandLineInterface.doGrepSearch')]
    ]
  },

  update: function update() {},
  
}));

Object.extend(lively.ide.tools.JavaScriptToolsMenuBarEntries, {

  getMenuBarEntries: function() {
    return [
      lively.BuildSpec('lively.ide.tools.JavaScriptToolsMenuBarEntry').createMorph(),
      lively.BuildSpec('lively.ide.tools.LivelySearchMenuBarEntry').createMorph()]
  }
});

}) // end of module
