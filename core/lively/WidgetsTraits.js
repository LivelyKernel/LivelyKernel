module('lively.WidgetsTraits').requires('lively.Traits', 'lively.morphic.Graphics').toRun(function() {

/*
 * These traits are deprecated. They were introduced to share behavior between
 * morphic 1 and 2 implementations but are no longer needed and should be
 * merged into their respective classes
 */

// -------------
// Windows
// -------------
Trait('TitleBarMorph',
'initializing', {
	  connectButtons: function(w) {
		    if (this.suppressControls) return;
		    this.closeButton.plugTo(w, {getHelpText: '->getCloseHelp', fire: '->initiateShutdown'});
		    this.menuButton.plugTo(w, {getHelpText: '->getMenuHelp', fire: '->showTargetMorphMenu'});
		    this.collapseButton.plugTo(w, {getHelpText: '->getCollapseHelp', fire: '->toggleCollapse'});
	  },
},
'window', {
	  setTitle: function(string) {
		    string = String(string).truncate(90);
		    this.label.setTextString(string);
		    // jl: "was nicht passt wird passen jemacht"
		    this.label.align(this.label.bounds().center(), this.bounds().center().addXY(0, 2))
		    // FIXME too slow!!!
		    // this.adjustForNewBounds();  // This will align the buttons and label properly
	  },

	  getTitle: function(string) { return this.label.textString },
});

Trait('WindowMorph',
'window behavior', {
    setTitle: function(string) { this.titleBar.setTitle(string) },
	  getTitle: function() { return this.titleBar.getTitle() },

    isShutdown: function() { return this.state === 'shutdown' },
    initiateShutdown: function() {
        if (this.isShutdown()) return;
        this.targetMorph.shutdown(); // shutdown may be prevented ...
        this.remove();
        this.state = 'shutdown'; // no one will ever know...
        return true;
    },
},
'collapsing', {
    toggleCollapse: function() {
        return this.isCollapsed() ? this.expand() : this.collapse();
    },

    collapse: function() {
        if (this.isCollapsed()) return;
        this.expandedTransform = this.getTransform();
	      this.expandedExtent = this.getExtent();
	      this.expandedPosition = this.getPosition();
	      this.ignoreEventsOnExpand = this.targetMorph.areEventsIgnored();
	      this.targetMorph.ignoreEvents(); // unconditionally
	      this.targetMorph.setVisible(false);
	      var finCollapse = function () {
        	  this.state = 'collapsed';  // Set it now so setExtent works right
		        if (this.collapsedTransform) this.setTransform(this.collapsedTransform);
        	  if (this.collapsedExtent) this.setExtent(this.collapsedExtent);
		        this.shape.setBounds(this.titleBar.bounds());
		        this.layoutChanged();
        	  // this.titleBar.highlight(false);
		    }.bind(this);
	      if (this.collapsedPosition && this.collapsedPosition.dist(this.getPosition()) > 100)
		    this.animatedInterpolateTo(this.collapsedPosition, 5, 50, finCollapse);
	      else finCollapse();
    },

    expand: function() {
        if (!this.isCollapsed()) return;
        this.collapsedTransform = this.getTransform();
        this.collapsedExtent = this.innerBounds().extent();
		    this.collapsedPosition = this.getPosition();
        var finExpand = function () {
			      this.state = 'expanded';  // Set it now so setExtent works right
			      // MR: added a fix for collapsed, save windows, made it optional
			      if (this.expandedTransform)
				    this.setTransform(this.expandedTransform);
			      if (this.expandedExtent) {
                // setExtent to the window should not change the extent of the content (targetMorph)
                if (this.LK2 && true) { // set to false to see the problem
                    var savem = this.submorphs;
                    this.submorphs = [];
				            this.setExtent(this.expandedExtent);
                    this.submorphs = savem;
                }
                else {
                    this.setExtent(this.expandedExtent);  // this is the problem
                }
				        this.shape.setBounds(this.expandedExtent.extentAsRectangle());
			      }
			      this.targetMorph.setVisible(true);
			      // enable events if they weren't disabled in expanded form
			      if (!this.ignoreEventsOnExpand)
				    this.targetMorph.enableEvents();
			      this.world().addMorphFront(this);  // Bring this window forward if it wasn't already
			      this.layoutChanged();
		    }.bind(this);
		    if (this.expandedPosition && this.expandedPosition.dist(this.getPosition()) > 100)
			  this.animatedInterpolateTo(this.expandedPosition, 5, 50, finExpand);
		    else finExpand();
    },

    isCollapsed: function() { return this.state === 'collapsed' },
});

Trait('HorizontalDividerTrait',
'internal slider logic', {
	  movedVerticallyBy: function(deltaY) {
		    if (!this.resizeIsSave(deltaY)) return;

		    var morphsForPosChange = this.fixed.concat(this.scalingBelow);
		    morphsForPosChange.forEach(function(m) {
			      var pos = m.getPosition();
			      m.setPosition(pt(pos.x, pos.y + deltaY));
		    })
		    this.scalingAbove.forEach(function(m) {
			      var ext = m.getExtent();
			      m.setExtent(pt(ext.x, ext.y + deltaY));
		    })
		    this.scalingBelow.forEach(function(m) {
			      var ext = m.getExtent();
			      m.setExtent(pt(ext.x, ext.y - deltaY));
		    })
		    this.setPosition(this.getPosition().addPt(pt(0, deltaY)));
	  },

	  resizeIsSave: function(deltaY) {
		    return this.scalingAbove.all(function(m) { return (m.getExtent().y + deltaY) > this.minHeight }, this)
            && this.scalingBelow.all(function(m) { return (m.getExtent().y - deltaY) > this.minHeight}, this)
	  },

	  addFixed: function(m) { if (!this.fixed.include(m)) this.fixed.push(m) },

	  addScalingAbove: function(m) { this.scalingAbove.push(m) },

	  addScalingBelow: function(m) {  this.scalingBelow.push(m) }
});

}); // end of module