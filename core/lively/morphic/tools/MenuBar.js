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
      show("??")
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
      this.disableDragging()
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
    fill: Color.white,
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
    this.menu = lively.morphic.Menu.openAt(this.globalBounds().bottomLeft(), null, items)
    lively.bindings.connect(this.menu, 'remove', this, 'removeMenu');
  },

  removeMenu: function removeMenu() {
    var self = this;
    lively.lang.fun.debounceNamed(this.id+"removemenu", 100, function() {
      if (self.changeColorForMenu)
        self.applyStyle({fill: Color.white, textColor: Color.gray.darker()});
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
})

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.BuildSpec("lively.net.tools.ConnectionIndicatorMenuBarEntry", lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "lively2livelyStatusLabel",
  menuBarAlign: "right",
  changeColorForMenu: false,

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    extent: lively.pt(130,20),
    textColor: Color.rgb(127,230,127),
    toolTip: "Shows the connection status to the cloxp (Lively) server environment. If the indicator is red this means that the server currently cannot be reached."
  }),

  morphMenuItems: function morphMenuItems() {
    var self = this,
        items = [],
        isConnected = lively.net.SessionTracker.isConnected(),
        allowRemoteEval = !!lively.Config.get('lively2livelyAllowRemoteEval');
    if (!isConnected) {
        items.push(['show login info', function() {
            lively.net.Wiki.showLoginInfo();
        }]);
        items.push(['connect', function() {
            lively.net.SessionTracker.resetSession();
            self.update.bind(self).delay(0.2);
        }]);
    } else {
        items = [
        ['show login info', function() {
            lively.net.Wiki.showLoginInfo();
        }],
        ['[' + (allowRemoteEval ? 'x' : ' ') + '] allow remote eval', function() {
            lively.Config.set('lively2livelyAllowRemoteEval', !allowRemoteEval);
        }],
        ['reset connection', function() {
            lively.net.SessionTracker.resetSession();
        }],
        ['disconnect', function() {
            lively.net.SessionTracker.closeSessions();
            self.update.bind(self).delay(0.2);
        }]];
    }
    
    return items;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  messageReceived: function messageReceived(msgAndSession) {
    var msg = msgAndSession.message, s = msgAndSession.session;
    if (msg.action === 'remoteEvalRequest') {
        var msg = Strings.format(
            'got %s\n%s\n from %s',
            msg.action,
            msg.data.expr.replace(/\n/g, '').truncate(100),
            msg.sender);
        $world.setStatusMessage(msg, Color.gray);
    }
  },

  onConnect: function onConnect(session) {
    if (!this.informsAboutMessages && lively.Config.get('lively2livelyInformAboutReceivedMessages')) {
        var self = this;
        function onClose() {
            self.informsAboutMessages = false;
            lively.bindings.disconnect(session, 'message', self, 'messageReceived');
            lively.bindings.disconnect(session, 'sessionClosed', onClose, 'call');
        }
        this.informsAboutMessages = true;
        lively.bindings.connect(session, 'message', this, 'messageReceived');
        lively.bindings.connect(session, 'sessionClosed', onClose, 'messageReceived');
    }
    this.applyStyle({
      fill: Global.Color.green,
      textColor: Global.Color.white
    });
    this.textString = '[l2l] connected';
  },

  onConnecting: function onConnecting(session) {
    this.informsAboutMessages = false;
    this.textString = '[l2l] connecting';
    this.applyStyle({
      fill: Global.Color.gray,
      textColor: Global.Color.white
    });
  },

  onDisconnect: function onDisconnect(session) {
    // this.onDisconnect()
    this.informsAboutMessages = false;
    this.textString = '[l2l] disconnected'
    this.applyStyle({
      fill: Global.Color.red,
      textColor: Global.Color.white
    });
  },

  update: function update() {
    var s = lively.net.SessionTracker.getSession();
    switch (s && s.status()) {
        case null: case undefined:
        case 'disconnected': this.onDisconnect(s); break;
        case 'connected': this.onConnect(s); break;
        case 'connecting': this.onConnecting(s); break;
    }
  },

  onLoad: function onLoad() {
    (function() { this.update(); }).bind(this).delay(0);
    this.startStepping(5*1000, 'update');
    this.onConnecting(null);
  }

}));

Object.extend(lively.morphic.tools.MenuBar, {

  openOnWorldLoad: function() {
    // lively.morphic.tools.MenuBar.openOnWorldLoad();
    lively.lang.arr.mapAsyncSeries(lively.Config.get("menuBarDefaultEntries"),
      function(ea, _, n) {
        lively.require(ea).toRun(function() {
          var entries = [];
          try { entries = module(ea).getMenuBarEntries() } catch (e) {}
          n(null, entries);
        });
    }, function(err, entries) {
        var bar = lively.morphic.tools.MenuBar.open();
        bar.removeAllMorphs();
        entries.flatten().forEach(bar.add.bind(bar));
        (function() {bar.relayout();}).delay(0);
      })
    
  },

  open: function() {
    return $world.get(/^MenuBar/)
      || lively.BuildSpec("lively.morphic.tools.MenuBar")
        .createMorph().openInWorld().onLoad();
  },

  addEntry: function(menuBarEntry) { return this.open().add(menuBarEntry); },
});

}) // end of module
