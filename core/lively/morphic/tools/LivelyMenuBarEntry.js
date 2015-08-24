module('lively.morphic.tools.LivelyMenuBarEntry').requires("lively.morphic.tools.MenuBar").toRun(function() {

lively.BuildSpec('lively.morphic.tools.LivelyMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "LivelyMenuBarEntry",
  menuBarAlign: "left",

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    extent: lively.pt(40,22),
    toolTip: "Lively related commands"
  }),

  morphMenuItems: function morphMenuItems() {
    function cmd(name) { return function() { lively.ide.commands.exec(name); }; }
    return [
      ['Settings', [
        ['My user config', lively.ide.commands.exec.bind(null, 'lively.ide.SystemCodeBrowser.openUserConfig')],
        $world.get(/^MenuBar/) && $world.get(/^MenuBar/).isGlobalMenuBar ?
          ['Hide menu bar', lively.ide.commands.exec.bind(null, 'lively.morphic.MenuBar.hide')] :
          ['Show menu bar', lively.ide.commands.exec.bind(null, 'lively.morphic.MenuBar.show')]
        ]],
      ['Run command... (alt-x)', cmd('lively.ide.commands.execute')],
      ['Save world ...', $world.interactiveSaveWorldAs.bind($world)],
          ['AutoSave World', [
              ['Start AutoSave', function(){
                  function autosave(){
                      var sourceURL = window.location.href
                      $world.saveWorldAs(sourceURL + '?autosave=true')
                  }
                  $world.addScript(autosave)
                  $world.startStepping(10000,'autosave')
              }]
              ]
          ]
      ];
  },

  update: function update() {},
  
  onFromBuildSpecCreated: function onFromBuildSpecCreated() {
    $super();
    var ex = pt(20,20);
    var img = this.get("image");
    var self = this;
    img.setImageURL(URL.root.withFilename("core/media/lively-web-logo-small.png"),
      {maxWidth: ex.x, maxHeight: ex.y},
      function() { img.align(img.bounds().center(), self.innerBounds().center()); });
    
  },

  submorphs: [{
    name: "image",
    _Extent: pt(22,22),
    className: "lively.morphic.Image",
    // url: URL.root.withFilename("core/media/lively-web-logo-small.svg").toString(),
  }],
}));

lively.BuildSpec('lively.morphic.tools.LivelyWindowsMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "LivelyWindowsMenuBarEntry",
  menuBarAlign: "left",
  textString: "windows",

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    extent: lively.pt(80,22),
    toolTip: "Activate window."
  }),

  morphMenuItems: function morphMenuItems() {
    function cmd(name) { return function() { lively.ide.commands.exec(name); }; }

    var wins = lively.ide.WindowNavigation.WindowManager.current().getWindows().reverse();
    return wins.map(function(ea) { return [ea.getTitle().truncate(100), function() {
      if (ea.isCollapsed()) { ea.expand(); (ea.comeForward.bind(ea)).delay(.25); }
      else ea.comeForward();
     }]}).concat(
          [{isMenuItem: true, isDivider: true},
          ['Search... (alt-`)', cmd('lively.ide.WindowNavigation.start')]])
  },

  update: function update() {}
}));

Object.extend(lively.morphic.tools.LivelyMenuBarEntry, {

  getMenuBarEntries: function() {
    return [
      lively.BuildSpec('lively.morphic.tools.LivelyMenuBarEntry').createMorph(),
      lively.BuildSpec('lively.morphic.tools.LivelyWindowsMenuBarEntry').createMorph()]
  }
});

}) // end of module
