module('lively.ide.codeeditor.MorphicOverlay').requires('lively.morphic.Core', 'lively.morphic.TextCore', 'lively.ide.CodeEditor').toRun(function() {

lively.morphic.Morph.subclass("lively.ide.CodeEditor.MorphicOverlay",
"settings", {

  style: {
    fill: Global.Color.rgba(33,33,33,.2),
    borderWidth: 0
  },

  labelStyle: {
    handStyle: 'pointer',
    fixedWidth: true, fixedHeight: true,
    textColor: Global.Color.white,
    fill: Global.Color.rgb(120,120,120),
    clipMode: "hidden",
    padding: Global.Rectangle.inset(10,0, 5, 0),
    fontSize: lively.morphic.CodeEditor.prototype.style.fontSize - 2,
    selectable: false, allowInput: false
  },

  doNotSerialize: ["documentStartAnchor", "documentEndAnchor"]
},
"initializing", {

  initialize: function($super, spec) {
    $super(null, lively.rect(0,0,100,100));

    this.spec = lively.lang.obj.merge({
      alignLabel: "line-end",
      fitLabel: true
    }, spec);

    this.state = {
      value: null,
      node: null
    }

    this.disableEvents();
    this.label = this.makeLabel();
  },

  onLoad: function($super) {
    if (this.owner && this.owner.isCodeEditor) {
      this.ensureAnchors(this.owner, this.getRange(this.owner));
    }
  },

  makeLabel: function() {
    var label = lively.morphic.Text.makeLabel("");
    label.applyStyle(this.labelStyle);
    label.name = "label";
    label.addScript(function onClick(evt) {
      return this.owner.onLabelClick(evt);
    });
    label.enableEvents();
    return this.addMorph(label);
  },

  ensureAnchors: function(codeEditor, range) {
    var self = this;
    var Anchor = lively.ide.ace.require("ace/anchor").Anchor;
    if (this.documentStartAnchor) {
      this.documentStartAnchor.setPosition(range.start.row, range.start.column);
    } else {
      this.documentStartAnchor = new Anchor(codeEditor.getDocument(), range.start.row, range.start.column);
      this.documentStartAnchor.on("change", function(change) { self.onAnchorChange(codeEditor); });
      
    }
    
    if (this.documentEndAnchor) {
      this.documentEndAnchor.setPosition(range.end.row, range.end.column+1);
    } else {
      this.documentEndAnchor = new Anchor(codeEditor.getDocument(), range.end.row, range.end.column+1);
      this.documentEndAnchor.on("change", function(change) { self.onAnchorChange(codeEditor); });
    }
  },

  cleanupAnchors : function() {  
    if (this.documentStartAnchor) {
      this.documentStartAnchor.removeAllListeners("change");
      this.documentStartAnchor.detach();
      this.documentStartAnchor = null;
    }
    if (this.documentEndAnchor) {
      this.documentEndAnchor.removeAllListeners("change");
      this.documentEndAnchor.detach();
      this.documentEndAnchor = null;
    }
  }

},
"layouting", {

  getRange: function(codeEditor) {
    var bounds = this.globalBounds(),
        topLeft = bounds.topLeft(),
        bottomRight = bounds.bottomRight(),
        r = codeEditor.aceEditor.renderer,
        start = r.pixelToScreenCoordinates(topLeft.x, topLeft.y),
        end = r.pixelToScreenCoordinates(bottomRight.x, bottomRight.y-1);
    return lively.ide.ace.require("ace/range").Range.fromPoints(start, end);
  },

  getLine: function(codeEditor) {
    return this.getRange(codeEditor).start.row;
  },

  alignWithAnchor: function(codeEditor) {
    if (!this.documentStartAnchor) {
      this.ensureAnchors(codeEditor, this.getRange(codeEditor));
    }
    var bounds = lively.rect(
      codeEditor.posToMorphicPos(this.documentStartAnchor.getPosition(), "topLeft"),
      codeEditor.posToMorphicPos(this.documentEndAnchor.getPosition(), "bottomLeft"))
    this.setBounds(bounds);
    this.alignLabel(codeEditor);
  },

  realign: function(codeEditor) {
    this.alignWithAnchor(codeEditor);
  },

  fitLabel: function(thenDo) {
    this.label.applyStyle({extent: pt(10,10), fixedWidth: false, fixedHeight: false})
    this.label.fit();
    this.label.fitThenDo(function() {
      this.label.applyStyle({fixedWidth: true, fixedHeight: true});
      this.label.setExtent(this.label.getExtent().withY(this.getExtent().y));
      thenDo && thenDo();
    }.bind(this));
  },

  alignLabel: function(codeEditor) {
    switch (this.spec.alignLabel) {
      case 'line-end': this.alignLabelAtLineEnd(codeEditor); break;
      case 'marker-end': this.alignLabelAtMarkerEnd(); break;
    }
  },

  alignLabelAtMarkerEnd: function() {
    this.label.align(
      this.label.bounds().topLeft(),
      this.innerBounds().topRight());
    this.cachedBounds = null;
  },

  alignLabelAtLineEnd: function(codeEditor) {
    var markerRange = this.getRange(codeEditor),
        col = codeEditor.getSession().getLine(markerRange.start.row).length,
        pos = codeEditor.posToMorphicPos({row: markerRange.start.row, column: col}, "topRight"),
        localPos = this.getTransform().inverse().transformPoint(pos);
    this.label.align(this.label.bounds().topLeft(), localPos);
    this.cachedBounds = null;
  },

  setAtRange: function(codeEditor, range) {
    if (this.owner !== codeEditor) codeEditor.addMorph(this);
    this.setBounds(codeEditor.rangeToMorphicBounds(range));
    this.ensureAnchors(codeEditor, range);
  },

  setLabelAtRange: function(codeEditor, range) {
    if (this.owner !== codeEditor) codeEditor.addMorph(this);
    var bounds = this.getTransform().inverse()
      .transformRectToRect(codeEditor.rangeToMorphicBounds(range))
    this.label.setBounds(bounds);
  }

},
"updating", {

  setLabelString: function(codeEditor, string, thenDo) {
    var needsRender = false;

    if (this.label.textString !== string) {
      this.label.textString = string;
      needsRender = true;
    }

    var fontSize = codeEditor.getFontSize() - 4;
    if (this.label.getFontSize() !== fontSize) {
      this.label.setFontSize(fontSize);
      needsRender = true;
    }

    this.alignLabel(codeEditor);
    if (needsRender && this.spec.fitLabel) this.fitLabel(thenDo);
    else thenDo && thenDo();
  },

  setLabelStringAtNode: function(codeEditor, node, value, stringifiedValue) {
    // this.setVisible(false);
    var range = codeEditor.astNodeRange(node);

    this.state.node = node;
    this.setAtRange(codeEditor, range);
    // this.alignWithAstNode(codeEditor, node);

    var text = "=> " + stringifiedValue;
    this.setLabelString(codeEditor, text);
  },

  setHighlighted: function(bool) {
    this.label.applyStyle({
      textColor: bool ? Global.Color.orange : Global.Color.white
    });
  },

},
"events", {

  onAnchorChange: function(codeEditor, change) {
    this.alignWithAnchor(codeEditor);
  },

  onLabelClick: function(evt) {
    var val = this.state.value;
    lively.lang.fun.debounceNamed(this.id+"click-inspect", 20, function() {
      Global.inspect(val);
    })();
    return evt.stop(); true;
  }

},
"removal", {
  
  remove: function($super) {
    this.cleanupAnchors();
    return $super();
  }
});

lively.morphic.CodeEditor.addMethods({

  morphicOverlayCreate: function(spec) {
    var overlay = new lively.ide.CodeEditor.MorphicOverlay(spec);
    if (!this.morphicOverlays) this.morphicOverlays = [];
    this.morphicOverlays.push(overlay);
    return overlay;
  },

  morphicOverlaysRemoveAll: function() {
    this.morphicOverlays.invoke("remove");
    this.morphicOverlays.length = 0;
  },

  morphicOverlaysRemove: function(overlay) {
    overlay.remove();
    this.morphicOverlays = this.morphicOverlays.without(overlay);
  },

  morphicOverlaysOnAfterRender: function(evt) {
    // this.subscribeToEditorEvents()
    var self = this;
     self.morphicOverlays && lively.lang.fun.debounceNamed(this.id+"-afterrender", 20, function() {
      self.morphicOverlays.invoke("realign", self);
    })();
  },

  morphicOverlaysOnAfterScroll: function(evt) {
    var self = this;
    self.morphicOverlays && self.morphicOverlays.invoke("realign", self);
  },

  morphicOverlaysSubscribeToEditorEvents: function() {
    // this.subscribeToEditorEvents();
    var doNotSerialize = this.hasOwnProperty("doNotSerialize") ?
      this.doNotSerialize : (this.doNotSerialize = []);
    doNotSerialize.push("_morphicOverlaysOnAfterRender", "_morphicOverlaysOnAfterScroll");
    this.withAceDo(function(ed) {
      if (this._morphicOverlaysOnAfterRender)
        ed.renderer.off("afterRender", this._morphicOverlaysOnAfterRender);
      this._morphicOverlaysOnAfterRender = this.morphicOverlaysOnAfterRender.bind(this);
      ed.renderer.on("afterRender", this._morphicOverlaysOnAfterRender);
      if (this._morphicOverlaysOnAfterScroll)
        ed.session.off("changeScrollTop", this._morphicOverlaysOnAfterScroll);
      this._morphicOverlaysOnAfterScroll = this.morphicOverlaysOnAfterScroll.bind(this);
      ed.session.on("changeScrollTop", this._morphicOverlaysOnAfterScroll);
    })
  }

});

}) // end of module
