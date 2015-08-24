module('lively.morphic.tools.MenuBar').requires("lively.persistence.BuildSpec").toRun(function() {

lively.BuildSpec("lively.morphic.tools.MenuBar", {
    isEpiMorph: true,
    _Position: lively.pt(-1.0,-1.0),
    className: "lively.morphic.Box",
    draggingEnabled: false,
    droppingEnabled: false,
    grabbingEnabled: false,
    style: {
      fill: Color.rgba(255,255,255,0.5),
      borderWidth: 1, borderColor: Color.gray,
      adjustForNewBounds: true
    },
    layout: { adjustForNewBounds: true, resizeHeight: false, resizeWidth: true },
    name: "MenuBar",
    isGlobalMenuBar: true,

    onWorldResize: function onWorldResize() {
      var self = this;
      lively.lang.fun.debounceNamed(this.id+"-world-resize", 100, function() {
        var w = $world.visibleBounds().width;
        self.setExtent(self.getExtent().withWidth(w));
        self.relayout();
      })
    },

    leftsAndRights: function leftsAndRights() {
      var mid = this.innerBounds().center().x;
      return this.submorphs
        .sortBy(function(ea) { return ea.getPosition().x; })
        .partition(function(ea) { return ea.bounds().topRight().x < mid; });
    },

    relayout: function relayout() {
      var morphs = this.leftsAndRights();
      morphs[0].reduce(function(pos, ea) {
        ea.setPosition(ea.getPosition().withX(pos));
        return ea.bounds().right();
      }, 0);
      morphs[1].reduceRight(function(pos, ea) {
        ea.setPosition(pt(pos-ea.bounds().width, 0));
        return ea.bounds().left();
      }, this.innerBounds().right());
    },

    add: function add(morph) {
      var align = morph.menuBarAlign || "left";
      var posGroups = this.leftsAndRights();

      if (align === "right") {
        var rightMorph = posGroups[1].first();
        var pos = rightMorph ? rightMorph.bounds().topLeft() : this.innerBounds().topRight();
        morph.applyStyle({moveHorizontal: true});
      } else {
        var leftMorph = posGroups[0].last();
        var pos = leftMorph ? leftMorph.bounds().topRight() : this.innerBounds().topLeft();
      }

      this.addMorph(morph);
      morph.setExtent(morph.getExtent().withY(this.getExtent().y-1));
      morph.align(morph.bounds()[align === "right" ? "topRight" : "topLeft"](), pos);
    },

    alignInWorld: function alignInWorld() {
      var wBounds = $world.visibleBounds();
      this.align(this.bounds().topLeft(), wBounds.topLeft().addXY(-1,-1));
      this.setExtent(wBounds.extent().withY(23).addXY(2,0));
    },

    onMouseDownEntry: function onMouseDownEntry(evt) {
      var tMorph = evt.getTargetMorph();
      if (tMorph && tMorph.ownerChain().include(this)) {
        return $super(evt);
      }
      var morph = $world.submorphs.without(this).reverse().detect(function(ea) {
        return ea.fullContainsWorldPoint(evt.getPosition()); });
      if (morph) return morph.onMouseDownEntry(evt);
      return false;
    },

    onWorldResize: function onWorldResize() {
      lively.lang.fun.debounceNamed(this.id + '-onWorldResize', 300,
        this.alignInWorld.bind(this))();
    },

    removeEntry: function removeEntry(morph) {
      var m = this.getMorphNamed(morph.name);
      m && m.remove();
    },

    reset: function reset() {
      this.removeAllMorphs();
      this.disableGrabbing();
      this.disableDragging();
    },

    onLoad: function onLoad() {
      this.alignInWorld();
      this.enableFixedPositioning();
      return this;
    }

});

lively.BuildSpec("lively.morphic.tools.MenuBarEntry", {

  className: "lively.morphic.Text",
  name: "unnamed menu bar entry",
  textString: "",
  doNotSerialize: ["menu"],
  changeColorForMenu: true,

  style: {
    enableGrabbing: false,
    enableDragging: false,
    padding: lively.Rectangle.inset(6,3,6,0),
    align: "center",
    selectable: false,
    allowInput: false,
    clipMode: "hidden",
    extent: lively.pt(130,20),
    fixedHeight: true,
    fixedWidth: true,
    fontFamily: "Geneva,Helvetica,sans-serif",
    whiteSpaceHandling: "pre",
    handStyle: "pointer",
    fill: null,
    textColor: Color.gray.darker()
  },

  onMouseUp: function onMouseUp(evt) {
    this.update();
    if (this.menu) this.removeMenu();
    else this.showMenu();
    evt.stop(); return true;
  },

  morphMenuItems: function morphMenuItems() {
    return [["empty menu entry", function() { show("implement me!"); }]];
  },

  showMenu: function showMenu() {
    if (this.changeColorForMenu)
      this.applyStyle({fill: Color.rgb(43, 88, 255), textColor: Color.white});
    var items = this.morphMenuItems();
    this.menu = lively.morphic.Menu.openAt(this.globalBounds().bottomLeft(), null, items);
    lively.bindings.connect(this.menu, 'remove', this, 'removeMenu');
  },

  removeMenu: function removeMenu() {
    var self = this;
    lively.lang.fun.debounceNamed(this.id+"removemenu", 100, function() {
      if (self.changeColorForMenu)
        self.applyStyle({fill: null, textColor: Color.gray.darker()});
      self.menu && self.menu.remove();
      self.menu = null;
    })();
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  update: function update() {
    // implement me!
  },

  updateText: function updateText(text) {
    if (this.textString === text) return;
    var topRight = this.bounds().topRight();
    this.textString = text;
    this.applyStyle({fixedWidth: false, clipMode: "visible"});
    this.fitThenDo(function() {
      this.applyStyle({fixedWidth: true, clipMode: "hidden"});
      this.fixedWidth = true;
      this.owner.relayout && this.owner.relayout();
    }.bind(this));
  },

  onLoad: function onLoad() {
    (function() { this.update(); }).bind(this).delay(0);
    this.startStepping(30*1000, "update");
  },

  onFromBuildSpecCreated: function onFromBuildSpecCreated() {
    this.onLoad();
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Object.extend(lively.morphic.tools.MenuBar, {

  openOnWorldLoad: function() {
    // lively.morphic.tools.MenuBar.openOnWorldLoad();
    if (typeof $world === "undefined") {
      return lively.whenLoaded(function() {
        lively.morphic.tools.MenuBar.openOnWorldLoad();
      })
      return;
    }

    if ($world._MenuBarHidden) {
      lively.morphic.tools.MenuBar.remove();
      return;
    }

    lively.lang.arr.mapAsyncSeries(lively.Config.get("menuBarDefaultEntries"),
      function(ea, _, n) {
        lively.require(ea).toRun(function() {
          var entries = [];
          try { entries = module(ea).getMenuBarEntries(); } catch (e) {}
          n(null, entries);
        });
    }, function(err, entries) {
        var bar = lively.morphic.tools.MenuBar.open();
        bar.removeAllMorphs();
        entries.flatten().forEach(bar.add.bind(bar));
        (function() {bar.relayout();}).delay(0);
      });
  },

  open: function() {
    var menuBar = $world.get(/^MenuBar/);
    // menuBar.remove()
    if (menuBar && !menuBar.isGlobalMenuBar)
      menuBar = null;

    return menuBar || lively.BuildSpec("lively.morphic.tools.MenuBar")
        .createMorph().openInWorld().onLoad();
  },

  remove: function() {
    var menuBar = $world.get(/^MenuBar/);
    if (menuBar && menuBar.isGlobalMenuBar) menuBar.remove();
  },
  
  addEntry: function(menuBarEntry) { return this.open().add(menuBarEntry); }
});

}); // end of module
