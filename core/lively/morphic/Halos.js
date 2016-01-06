module('lively.morphic.Halos').requires('lively.morphic.Events', 'lively.morphic.Widgets').toRun(function() {

lively.morphic.Morph.addMethods(
'halos', {
    showsHalosOnRightClick: true,
    enableHalos: function() { this.halosEnabled = true },
    disableHalos: function() { this.halosEnabled = false },
    showHalos: function(shiftedActivation) {
        // shiftedActivation = when the shift key is pressed different halo
        // items are shown...
        if (!this.world() || (this.halosEnabled !== undefined && !this.halosEnabled)) return;
        if (this.showsHalos && this.halos) { this.halos.invoke('alignAtTarget'); return; }
        this.showsHalos = true;
        this.halos = this.getHalos(shiftedActivation);
        this.world().showHalosFor(this, this.halos);
        this.halos.invoke('alignAtTarget');
        this.focus.bind(this).delay(0);
    },

    showSelectedHalos: function(haloItems) {
        if (!this.world()) return;
        this.showsHalos = true;
        this.halos = (this.halos || []).pushAll(haloItems).uniq();
        this.world().showHalosFor(this, this.halos);
        this.halos.invoke('alignAtTarget');
    },

    getHaloClasses: function() {
        // BoundsHalo has to be in the background (top of the list)
        // so that when other Halos get moved to be seen on the screen they are still in front
        return [lively.morphic.BoundsHalo,
            lively.morphic.RenameHalo,
            lively.morphic.ResizeHalo,
            lively.morphic.DragHalo,
            lively.morphic.InspectHalo,
            lively.morphic.RotateHalo,
            lively.morphic.CloseHalo,
            lively.morphic.GrabHalo,
            lively.morphic.CopyHalo,
            lively.morphic.MenuHalo,
            lively.morphic.StyleHalo,
            lively.morphic.ScriptEditorHalo,
            lively.morphic.OriginHalo];
    },
    getHalos: function(shiftedActivation) {
        var morph = this;
        return this.getHaloClasses()
            .map(function(ea) {
                return ea.getInstanceFor ? ea.getInstanceFor(morph, shiftedActivation) : new ea(morph, shiftedActivation);
            });
    },

    removeHalos: function(optWorld) {
        this.removeHalosWithout(optWorld, []);
    },
    removeHalosWithout: function(optWorld, withoutHalos) {
        if (!withoutHalos || withoutHalos.length === 0)
            this.showsHalos = false;
        var world = optWorld || this.world() || lively.morphic.World.current();
        if (!world) {
            alert('Cannot remove halos of ' + this + ' -- no world!')
            return;
        }
        world.removeHalosFor(this, withoutHalos);
    },

    toggleHalos: function(evt) {
        var currentTarget = evt.world.currentHaloTarget, morphWithHalos;
        if (evt.isShiftDown()) {
            if (this.isSelection || this.isSelectionIndicator) { this.morphBeneath(evt.getPosition()).toggleHalos(evt); return; }
            var world = this.world();
            var selectedMorphs = world.hasSelection() ? world.getSelectedMorphs() : [currentTarget].compact();
            if (selectedMorphs.include(this)) selectedMorphs.remove(this);
            else selectedMorphs.push(this);
            this.world().setSelectedMorphs(selectedMorphs);
            return;
        }
        // toggles halo through the mophs that are stacked beneath evt.getPosition()
        if (currentTarget && currentTarget.fullContainsWorldPoint(evt.getPosition()))
            morphWithHalos = currentTarget.showHalosForMorphBeneath(evt);
        if (!morphWithHalos) this.showHalos();
    },

    showHalosForMorphBeneath: function(evt) {
        var morphBeneath = this.morphBeneath(evt.getPosition());
        if (morphBeneath) morphBeneath.showHalos();
        return morphBeneath
    }

})

lively.morphic.World.addMethods(
'halos', {
    showHalosFor: function(morph, halos) {
        if (this.currentHaloTarget) {
            this.currentHaloTarget.removeHalos(this);
        }
        this.currentHaloTarget = morph;
        halos.forEach(function(halo) { this.addMorph(halo); }, this);
    },
    removeHalosFor: function(morph, withoutHalos) {
        withoutHalos = withoutHalos || [];
        if (withoutHalos.length === 0) {
            this.currentHaloTarget = undefined;
            morph.showsHalos = false;
        }
        if (!morph.halos) return;
        var halosToRemove = morph.halos.withoutAll(withoutHalos);
        halosToRemove.invoke('remove');
        morph.halos = withoutHalos;
    },
    removeHalosOfCurrentHaloTarget: function() {
        this.currentHaloTarget && this.removeHalosFor(this.currentHaloTarget);
    },
    getHaloClasses: function() {
        return [
            lively.morphic.MenuHalo,
            lively.morphic.InspectHalo,
            lively.morphic.ScriptEditorHalo,
            lively.morphic.StyleHalo
        ];
    }
});

lively.morphic.Path.addMethods(
'halos', {

    controlPointHalosEnabled: true,

    areControlPointHalosEnabled: function() {
        return this.controlPointHalosEnabled;
    },
    
    setControlPointHalosEnabled: function(bool) {
        return this.controlPointHalosEnabled = bool;
    },

    getHalos: function($super) {
        var haloItems = $super();
        return this.areControlPointHalosEnabled() ?
          haloItems
            .concat(this.getControlPointHalos())
            .concat(this.getInsertPointHalos()) :
        haloItems;
    },

    getHaloClasses: function($super) {
        return $super()
            .without(lively.morphic.NewResizeHalo);
            // .concat([lively.morphic.RescaleHalo]);
    },

    getControlPointHalos: function() { return this.getControlPoints().invoke('asHalo') },
    getInsertPointHalo: function(idx) {
        return new lively.morphic.PathInsertPointHalo(this.getControlPoint(idx));
    },
    getInsertPointHalos: function() {
        var result = [];
        for (var i = 0; i < this.vertices().length-1; i++) result.push(this.getInsertPointHalo(i));
        return result
    }
});

lively.morphic.Box.subclass('lively.morphic.Halo',
'settings', {
    style: {
        borderWidth: 1, borderRadius: UserAgent.isMobile? 24 : 12, borderColor: Color.darkGray,
        enableHalos: false, enableDropping: false, enableDragging: true,
        opacity: 0.7, zIndex: 1010
    },
    dragTriggerDistance: 5,
    defaultExtent: UserAgent.isMobile ? pt(40,40) : pt(24,24),
    labelText: '',
    maxHorizontalLabels: 3,
    maxVerticalLabels: 3,
    horizontalPos: 0,
    verticalPos: 0,
    isEpiMorph: true,
    isHalo: true,
    iconBaseURL: Global.URL.codeBase + 'media/halos/',
    standalone: false
},
'initializing', {
    initialize: function($super, targetMorph, shiftedActivation) {
        $super(this.defaultExtent.extentAsRectangle());
        this.setTarget(targetMorph);
        if (typeof this.iconName === 'function') {
            this.createIcon(shiftedActivation);
        } else {
            this.createLabel(shiftedActivation); // Neccessary for NameHalo
        }
    },
    setTarget: function(morph) {
        this.targetMorph = morph;
    },
    createLabel: function() {
        var text = this.getLabelText();
        if (!text || text == '') return null;
        if (this.labelMorph) this.labelMorph.remove();
        this.labelMorph = new lively.morphic.Text(new Rectangle(0,0, 0, 0), text).beLabel({align: 'center', fixedWidth: false, fixedHeight: false, textColor: Color.darkGray});
        this.labelMorph.ignoreEvents();

        this.addMorph(this.labelMorph);
        (function() {
            this.labelMorph.fit();
            this.labelMorph.align(this.labelMorph.bounds().center(), this.innerBounds().center())
        }).bind(this).delay(0);
        return this.labelMorph;
    },
    createIcon: function(shiftedActivation) {
        this.iconMorph = new lively.morphic.Image(
          pt(3,3).extent(this.defaultExtent.subPt(pt(6,6))),
          this.iconBaseURL + this.iconName(shiftedActivation) + '.svg');
        this.addMorph(this.iconMorph);
        this.iconMorph.disableEvents();
        this.iconMorph.disableDropping();
        if (!Config.coloredHaloItems) {
            this.setFill(Global.Color.rgb(240,240,240)); // basic gray
        }
        this.setBorderWidth(0);
    },
    ensureInfoLabel: function() {
        // rkrk - better use own class, here we build the halo behavior on the fly
        if (!this.infoLabel) {
            this.infoLabel = new lively.morphic.Text(new Rectangle(0,0,100,30), "")
                .beLabel({fontSize: 8});
            this.infoLabel.isEpiMorph = true;
            this.infoLabel.addScript(function alignAtTarget() {
                if (!this.owner) return;
                var t = this.targetMorph;
                this.align(
                    this.bounds().bottomLeft(),
                    // here come the magic numbers!
                    t.owner.worldPoint(t.bounds().topLeft().addXY(-3,15)));
            });
            this.targetMorph.halos && this.targetMorph.halos.push(this.infoLabel);
            if (!this.world()) return this.infoLabel;
        }
        this.infoLabel.targetMorph = this.targetMorph;
        if (!this.infoLabel.owner) this.world().addMorph(this.infoLabel);
        // Why needed?? - Dan --- rkrk - because of alignment at targetMorph
        this.infoLabel && this.infoLabel.alignAtTarget();
        return this.infoLabel;
    }
},
'accessing', {
    getLabelText: function() { return this.labelText },
    setInfo: function(str) {
        this.ensureInfoLabel().setTextString(str);
    },
    getBoundsHalo: function() {
        return this.targetMorph && this.targetMorph.halos.detect(function(ea) { return ea && ea.isBoundsHalo });
    }
},
'layout', {
    alignAtTarget: function() {
        var pos = this.computePositionAtTarget(this.targetMorph);
        pos && this.setPosition(pos);
    },
    computePositionAtTarget: function(targetMorph) {
        targetMorph = targetMorph && targetMorph.owner ? targetMorph : this.targetMorph;
        var world = targetMorph.world(),
            owner = targetMorph.owner;
        if (!world && !owner) return pt(0,0);
        if (!owner && targetMorph === world) owner = world;
        if (!owner) return null;

        var bounds = targetMorph.bounds(),
            boundsInWorld = owner.getGlobalTransform().transformRectToRect(bounds),
            visibleBounds = this.computeHaloBounds(boundsInWorld, world),
            haloItemExtent = this.defaultExtent,
            haloOffsetX = (visibleBounds.realWidth()-haloItemExtent.x) / this.maxHorizontalLabels,
            haloOffsetY = (visibleBounds.realHeight()-haloItemExtent.y) / this.maxVerticalLabels,
            pos = visibleBounds.topLeft().addPt(
                pt(haloOffsetX*this.horizontalPos, haloOffsetY*this.verticalPos));

        return pos;
    },

    computeHaloBounds: function(morphBounds, owner) {
        // make sure in the bounds are fitting this.maxHorizontalLabels * this.maxVerticalLabels
        var haloItemExtent = this.defaultExtent,
            minHaloExtent = haloItemExtent.scaleByPt(
                pt(this.maxHorizontalLabels+1, this.maxVerticalLabels+1)),
            bounds = rect(morphBounds.topLeft().subPt(haloItemExtent),
                        morphBounds.bottomRight().addXY(haloItemExtent.x, 0)),
            visibleBounds = owner.visibleBounds(),
            topLeft = visibleBounds.topLeft().maxPt(bounds.topLeft()),
            bottomRight = visibleBounds.bottomRight().minPt(bounds.bottomRight()),
            haloBounds = rect(topLeft, bottomRight);
        if (haloBounds.width < minHaloExtent.x)
            haloBounds = haloBounds.withWidth(minHaloExtent.x);
        if (haloBounds.height < minHaloExtent.y)
            haloBounds = haloBounds.withHeight(minHaloExtent.y);
        return haloBounds;
    },

    tranformMoveDeltaDependingOnHaloPosition: function(evt, moveDelta, cornerName) {
        // Griding and rounding might move the morph differently
        // so we have to recalculate the delta...
        if(!evt.isAltDown())
            return moveDelta

        var pos = this.targetMorph.bounds()[cornerName]()
        var newOffset = evt.getPosition().subPt(this.targetMorph.owner.worldPoint(pos))
        this.startOffset = this.startOffset || newOffset;

        var deltaOffset = newOffset.subPt(this.startOffset)

        moveDelta = moveDelta.addPt(deltaOffset);
        return moveDelta
     }
},
'halo actions', {
    clickAction: function(evt) {
        return false;
    },
    dragAction: function(evt, moveDelta) {},
    dragEndAction: function(evt) {},
    dragStartAction: function(evt) {},
},
'mouse events', {

    onMouseUp: function(evt) {
        if (evt.hand.haloLastClickedOn === this) {
            return this.clickAction(evt);
        }
        return false;
    },
    onDragStart: function(evt) {
        this.prevDragPos = evt.getPosition();
        this.dragStartAction(evt);
        return true;
    },
    onDragEnd: function(evt) {
        if (this.targetMorph.halos) {
            this.targetMorph.halos.invoke('alignAtTarget');
        }
        if (this.infoLabel) this.infoLabel.remove();
        this.dragEndAction(evt);
        return true;
    },

    onDrag: function(evt) {
        if (!this.prevDragPos) this.prevDragPos = evt.getPosition();
        var movedBy = evt.getPosition().subPt(this.prevDragPos);
        this.prevDragPos = evt.getPosition();
        this.dragAction(evt, movedBy);
        return true;
    },
    compensateDragTriggerDistance: function(evt) {
        var target = this.targetMorph;
        var world = this.targetMorph.world();
        var startPos = evt.hand.eventStartPos || world.eventStartPos
        if (!target || !world || !startPos) { return; }
        target.moveBy(evt.getPosition().subPt(startPos));
        target.halos && target.halos.invoke('alignAtTarget');
    },
},
'key events', {
    onShiftPressed: function() {
        this.shiftPressedOnTarget();
    },
    onShiftReleased: function() {
        this.shiftReleasedOnTarget();
    },
    shiftPressedOnTarget: function() {
        if (typeof this.toggleIcon === 'function') {
            this.toggleIcon(true);
        }
    },
    shiftReleasedOnTarget: function() {
        if (typeof this.toggleIcon === 'function') {
            this.toggleIcon(false);
        }
    },
},
'utilities', {
    targetScripts: function() {
        // answer sorted list of targetMorph's script names
        var obj = this.targetMorph;
        var fs = Functions.own(obj);
        if (!fs)
            return [];
        return fs
            .select(function(name) { return obj[name].getOriginal().hasLivelyClosure })
            .sortBy(function(name) { return name.toLowerCase() }); 
    },
},
'connectors', {
    getMagnets: function() {
        // Don't connect to halo items by accident
        return [];
    }
});

lively.morphic.Halo.subclass('lively.morphic.ResizeHalo',
'settings', {
    style: {fill: Color.green, toolTip: 'resizes the object'},
    labelText: 'R',
    horizontalPos: 3,
    verticalPos: 3
},
'initialization', {
    setTarget: function($super, morph) {
        $super(morph);
        this.iconMorph && this.toggleIcon(Global.event && Global.event.isShiftDown && Global.event.isShiftDown());
    },
    iconName: function (bool) {
        return bool ? 'resize_shift' : 'resize'
    },
    toggleIcon: function(bool) {
        this.iconMorph.setImageURL(this.iconBaseURL + this.iconName(bool) + '.svg')
    }
},
'halo actions', {
    dragAction: function(evt, moveDelta) {

        moveDelta =  this.tranformMoveDeltaDependingOnHaloPosition(evt, moveDelta, 'bottomRight');
        var extent = this.targetMorph.getExtent().scaleBy(this.targetMorph.getScale());
        if (evt.isShiftDown()) {
            var ratio = extent.x / extent.y,
                ratioPt = pt(1, 1 / ratio),
                maxDelta = Math.max(moveDelta.x, moveDelta.y);
            moveDelta = pt(maxDelta, maxDelta).scaleByPt(ratioPt);
        }
        var newExtent = extent.addPt(moveDelta);
        if (evt.isAltDown()) {
            newExtent = newExtent.griddedBy(this.targetMorph.getGridPoint());
        }
		this.setInfo('extent: ' + newExtent.toShortString());
        this.targetMorph.setExtent(newExtent.scaleBy(1/this.targetMorph.getScale()));
        this.targetMorph.halos.invoke('alignAtTarget');
    },
    dragEndAction: function(evt) {
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos();
        this.targetMorph.logTransformationForUndo('bounds', 'end');
    },
    dragStartAction: function(evt) {
        this.targetMorph.logTransformationForUndo('bounds', 'start');
        this.targetMorph.removeHalosWithout(this.world(), [this, this.getBoundsHalo()]);
    }
});

lively.morphic.Halo.subclass('lively.morphic.RescaleHalo',
'settings', {
    style: {fill: Color.green, toolTip: 'scales the object'},
    labelText: 'R',
    horizontalPos: 3,
    verticalPos: 3
},
'initialization', {
    iconName: function () {
        return 'rescale';
    }
},
'halo actions', {
    dragAction: function(evt, moveDelta) {
        var target = this.targetMorph,
            globalPosition = target.getGlobalTransform().transformPoint(pt(0,0));
        var nowHandDist = evt.getPosition().subPt(globalPosition).r();
        var newScale = (this.startScale * nowHandDist / Math.max(this.startHandDist, 40));
        newScale = newScale.detent(0.1, 0.5);
        this.setInfo('scale: ' + newScale.toPrecision(4));
        this.targetMorph.setScale(newScale);
        this.targetMorph.halos.invoke('alignAtTarget');  // Seems not to be needed?? - Dan
    },
    dragStartAction: function(evt) {
        this.targetMorph.logTransformationForUndo('scale', 'start');
        var target = this.targetMorph,
            globalPosition = target.getGlobalTransform().transformPoint(pt(0,0));
        this.startScale = this.targetMorph.getScale();
        this.startHandDist = evt.getPosition().subPt(globalPosition).r();
        this.targetMorph.removeHalosWithout(this.world(), [this]);
        this.haloIsBeingDragged = true;
    },
    dragEndAction: function(evt) {
        this.haloIsBeingDragged = false;
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos();
        this.targetMorph.logTransformationForUndo('scale', 'end');
    },
});
lively.morphic.Halo.subclass('lively.morphic.DragHalo',
'settings', {
    style: {fill: Color.yellow, toolTip: 'drag the object'},
    labelText: 'D',
    horizontalPos: 2,
    verticalPos: 0,
},
'initialization', {
    iconName: function () {
        return 'move'
    }
},
'halo actions', {
    dragAction: function(evt, moveDelta) {

        moveDelta =  this.tranformMoveDeltaDependingOnHaloPosition(evt, moveDelta, 'topRight')

        var transform = this.targetMorph.owner.getGlobalTransform();
        var oldPos = transform.transformPoint(pt(0,0)),
            newPos = oldPos.addPt(moveDelta);
        var newPos = transform.inverse().transformPoint(newPos);

        var newTargetPos = this.targetMorph.getPosition().addPt(newPos)
        if (evt.isAltDown()) {
            newTargetPos = newTargetPos.griddedBy(this.targetMorph.getGridPoint())
        }
        this.setInfo('pos: ' + newTargetPos.toShortString())
        this.lastHaloPosition = this.getPosition();
        this.targetMorph.setPosition(newTargetPos);

        if (!this.standalone) this.targetMorph.halos.invoke('alignAtTarget');

        // we might think about only moving the halos when targetMorph.onDrag returns true
        // morphs could return false to indicate that they don't want to be moved on every
        // drag event (e.g. if they are in some sort of grid layout)
        // this.targetMorph.onDrag(evt);
    },
    dragEndAction: function(evt) {
        // this.targetMorph.onDragEnd(evt);
        if (this.standalone) return;
        this.targetMorph.logTransformationForUndo('drag', 'end');
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos();
    },
    dragStartAction: function(evt) {
        // this.startPos = evt.getPosition();
        if (this.standalone) {
          if ($world.eventStartPos) {
            this.moveBy(this.hand.eventStartPos.subPt(this.getPosition()));
          }
          return;
        }
        this.compensateDragTriggerDistance(evt);
        this.targetMorph.logTransformationForUndo('drag', 'start');
        this.targetMorph.distanceToDragEvent = evt.getPosition().subPt(this.targetMorph.getPositionInWorld());
        this.targetMorph.removeHalosWithout(this.world(), [this, this.getBoundsHalo()].compact());
    },
});

lively.morphic.Halo.subclass('lively.morphic.GrabHalo',
'settings', {
    style: {fill: Color.rgb(210, 210, 0).lighter(), toolTip: 'grab the object (CMD-click)'},
    labelText: 'G',
    horizontalPos: 1,
    verticalPos: 0,
},
'initialization', {
    iconName: function () {
        return 'grabbinghand'
    }
},
'halo actions', {
    clickAction: function(evt) {
        this.dragStartAction(evt);  // same effect, but with mouse up
    },
    dragAction: function(evt, moveDelta) {
        // morph is in hand
        this.targetMorph.halos.invoke('alignAtTarget');
    },
    dragEndAction: function(evt) {
        evt.world.dispatchDrop(evt);
        this.targetMorph.logTransformationForUndo('grab', 'end');
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos();
    },
    dragStartAction: function(evt) {
        this.compensateDragTriggerDistance(evt);
        this.targetMorph.logTransformationForUndo('grab', 'start');
        evt.hand.grabMorph(this.targetMorph, evt);
        this.targetMorph.showSelectedHalos([this]);
    },
});

lively.morphic.Halo.subclass('lively.morphic.CopyHalo',
'settings', {
    style: {fill: Color.green.lighter(), toolTip: 'copies the object (shift-click)'},
    labelText: 'C',
    horizontalPos: 0,
    verticalPos: 1
},
'initialization', {
    iconName: function () {
        return 'copy'
    }
},
'layout', {
    alignAtTarget: function() {
        var pos = this.computePositionAtTarget(this.copiedTarget || this.targetMorph);
        pos && this.setPosition(pos);
    }
},
'halo actions', {
    clickAction: function(evt) {
        //this.dragStartAction(evt)     ael: making copy happen only on drag (not click) seems ok...?
    },
    dragAction: function(evt, moveDelta) {
        // Nothing to do here - morph is in the hand
        if (this.copiedTarget && this.copiedTarget.halos)
            this.copiedTarget.halos.invoke('alignAtTarget');
    },
    dragStartAction: function(evt) {
        this.targetMorph.removeHalos();

        try {
            this.copiedTarget = this.targetMorph.copy();
        } catch(e) {
            alert("could not copy morph: " + this.targetMorph)
            return;
        };

        // FIXME this is only necessary because transformation in addMorph
        // is only appliedt when owner is present
        this.targetMorph.world().addMorph(this.copiedTarget)
        this.copiedTarget.align(
            this.copiedTarget.worldPoint(pt(0,0)),
            this.targetMorph.worldPoint(pt(0,0)))

        evt.hand.grabMorph(this.copiedTarget, evt);
        var undoSpec = $world.getUndoQueue().last();  // this is a hack :-(
        undoSpec.startOwner = null;  // signals that undo/redo should remove/addWorld

        this.copiedTarget.showSelectedHalos([this]);
    },
    dragEndAction: function(evt) {
        evt.world.dispatchDrop(evt);
        if (this.copiedTarget) {
            this.copiedTarget.removeHalos();
            this.copiedTarget.showHalos();
        }
        this.copiedTarget = null;
    }

});
lively.morphic.Halo.subclass('lively.morphic.RotateHalo',
'settings', {
    style: {fill: Color.blue.lighter(), toolTip: 'rotates the object (sticky around 45° steps\n' +
                                        'hold shift down to scale (sticky around 0.5)'  },
    labelText: 'T',
    horizontalPos: 0,
    verticalPos: 3,
},
'initialization', {
    iconName: function (bool) {
        return bool ? 'scale' : 'rotate';
    },
    setTarget: function($super, morph) {
        $super(morph);
        this.iconMorph && this.toggleIcon(Global.event && Global.event.isShiftDown && Global.event.isShiftDown());
    },
    toggleIcon: function(bool) {
        this.iconMorph.setImageURL(this.iconBaseURL + this.iconName(bool) + '.svg')
    }
},
'halo actions', {
    dragAction: function(evt, moveDelta) {
        var target = this.targetMorph,
            globalPosition = target.getGlobalTransform().transformPoint(pt(0,0));
        if (!evt.isShiftDown()) {
            // Normally rotate the morph, with detents at multiples of 45 degrees
            var nowHandAngle = evt.getPosition().subPt(globalPosition).theta();
            var newRotation = this.startRotation + (nowHandAngle - this.startHandAngle);
            newRotation = newRotation.toDegrees().detent(10, 45).toRadians();
            this.setInfo("rot: " + newRotation.toDegrees().toPrecision(5) + ' degrees');
            this.targetMorph.setRotation(newRotation);
        } else {
            // If shift key, scale it with detents at multiples of 0.5
            var nowHandDist = evt.getPosition().subPt(globalPosition).r();
            var newScale = (this.startScale * nowHandDist / Math.max(this.startHandDist, 40));
            newScale = newScale.detent(0.1, 0.5);
            this.setInfo('scale: ' + newScale.toPrecision(4));
            this.targetMorph.setScale(newScale);
        }
        this.targetMorph.halos.invoke('alignAtTarget');  // Seems not to be needed?? - Dan
        this.updateAngleIndicator(evt.hand);
    },

    dragEndAction: function(evt) {
        this.haloIsBeingDragged = false;
        this.removeAngleIndicator();
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos();
        this.targetMorph.logTransformationForUndo('rotate', 'end');
    },

    dragStartAction: function(evt) {
        var target = this.targetMorph,
            globalPosition = target.getGlobalTransform().transformPoint(pt(0,0));
        this.targetMorph.logTransformationForUndo('rotate', 'start');
        this.startRotation = this.targetMorph.getRotation();
        this.startScale = this.targetMorph.getScale();
        this.startHandAngle = evt.getPosition().subPt(globalPosition).theta();
        this.startHandDist = evt.getPosition().subPt(globalPosition).r();
        this.targetMorph.removeHalosWithout(this.world(), [this, this.getBoundsHalo()]);
        this.updateAngleIndicator(evt.hand);
        this.haloIsBeingDragged = true;
    },

    onMouseDown: function($super, evt) {
        this.prevHandPosForSnappingRotation = evt.getPosition();
        return false;
    },

    ensureAngleIndicator: function() {
        // show a red line between the hand and the origin of the target morph
        if (this.lineIndicator) return this.lineIndicator;
        var line = lively.morphic.Morph.makeLine([pt(0,0), pt(0,0)]).applyStyle({borderColor: Color.red});
        return this.lineIndicator = this.addMorph(line);
    },

    removeAngleIndicator: function() {
        this.lineIndicator && this.lineIndicator.remove();
        delete this.lineIndicator;
    },

    updateAngleIndicator: function(hand) {
        var indicator = this.ensureAngleIndicator(),
            globalStart = hand.getPosition(),
            localStart = this.localize(globalStart),
            globalEnd = this.targetMorph.worldPoint(pt(0,0)),
            localEnd = this.localize(globalEnd);
        indicator.setVertices([localStart, localEnd]);
    }
},
'layout', {
    alignAtTarget: function($super) {
        var world = this.world();
        if (!this.haloIsBeingDragged || !world) { $super(); return; }
        this.setPosition(world.firstHand().getPosition().subPt(this.getExtent().scaleBy(0.5)));
    }
});
lively.morphic.Halo.subclass('lively.morphic.CloseHalo',
'settings', {
    style: {fill: Color.red, enableDragging: false, enableGrabbing: false, toolTip: 'closes the object'},
    labelText: 'X',
    horizontalPos: 3,
    verticalPos: 0,
},
'initialization', {
    iconName: function () {
        return 'close'
    }
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.removeHalos();
        if (this.targetMorph.isWindow)
            this.targetMorph.initiateShutdown();  // has its own undo
        else {
            this.targetMorph.logTransformationForUndo('remove', 'start');
            this.targetMorph.remove();
            this.targetMorph.logTransformationForUndo('remove', 'end');
        }
    },
});
lively.morphic.Halo.subclass('lively.morphic.MenuHalo',
'settings', {
    style: {fill: Color.white, toolTip: 'open the objects\'s menu'},
    labelText: 'M',
    horizontalPos: 0,
    verticalPos: 0,
},
'initialization', {
    iconName: function () {
        return 'morphmenu'
    }
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.removeHalos();
        this.targetMorph.showMorphMenu(evt);
    },
    dragAction: function(evt) {
        // show menu if drag.  Attempt to allow menu invocation without an extra click
        // should probably be in mouseDown instead of drag
        return; // under construction...  - Dan

        this.targetMorph.removeHalos();

        //For some reason, the folowing statement results in the menu being grabbed
        //this.targetMorph.showMorphMenu(evt);

        //The statements that follow are an attempted work-around, but clearly the
        //fix should be somewhere else.
        var morph = this.targetMorph;
        var menu = lively.morphic.Menu.openAt(evt.getPosition(), morph.name || morph.toString(), morph.morphMenuItems());
        evt.stop();
        menu.focus();
    },

},
'event handling', {
    onMouseDown: function($super, evt) {
        this.clickAction(evt);
        return true;
    }
});

lively.morphic.Halo.subclass('lively.morphic.RenameHalo',
'settings', {
    style: {fill: Color.white, clipMode: 'hidden', enableDragging: false, enableGrabbing: false, toolTip: 'rename the object'},
    labelText: 'N',
    horizontalPos: 1,
    verticalPos: 3
},
'initialization', {
    initialize: function ($super, morph) {
        $super(morph);
        this.submorphs[0] && this.submorphs[0].setHandStyle('text');
    }
},
'accessing', {
    setTarget: function($super, morph) {
        $super(morph);
        this.createLabel();
    },
    getLabelText: function() { return this.targetMorph.getName() || this.targetMorph.toString() }
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.removeHalos();
        var morph = this.targetMorph;
        morph.world().prompt('Enter Name for Morph', function(name) {
            if (!name) return;
            var oldName = morph.getName() || morph.toString();
            morph.setName(name);
            alertOK(oldName + ' renamed to ' + name);
        }, morph.getName() || '')
    },
    globalizeTargetPos: function(pos) {
        var world = this.targetMorph.world();
        if (!world) return pos;
        var globalPos = this.targetMorph.worldPoint(pos);
        return globalPos;
    },
    computePositionAtTarget: function($super) {
        var globalBottom = $super().y, // because of its logical pos in the halo grid
            bl = this.globalizeTargetPos(this.targetMorph.innerBounds().bottomLeft());
        return bl.withY(globalBottom);
    },
    targetBottomRight: function() {
        return this.globalizeTargetPos(this.targetMorph.innerBounds().bottomRight());
    },
    alignAtTarget: function() {
        this.labelMorph.fit();
        this.setExtent(this.labelMorph.getExtent());
        var targetMorph = this.targetMorph,
            world = targetMorph.world(),
            owner = targetMorph.owner;
        if (!world || !owner) return;
        var bounds = targetMorph.bounds(),
            boundsInWorld = owner.getGlobalTransform().transformRectToRect(bounds),
            visibleBounds = this.computeHaloBounds(boundsInWorld, world),
            haloItemBounds = this.bounds(),
            worldBounds = world.visibleBounds(),
            alignPoint = visibleBounds.bottom() + haloItemBounds.extent().y > worldBounds.bottom() ?
                            haloItemBounds.bottomCenter() : haloItemBounds.topCenter();
        this.align(alignPoint, visibleBounds.bottomCenter());
    }

});

lively.morphic.Halo.subclass('lively.morphic.SetImageURLHalo',
'settings', {
    style: {fill: Color.white.darker(), toolTip: 'set image url'},
    labelText: 'U',
    horizontalPos: 4,
    verticalPos: 1
},
'initialization', {
    iconName: function () {
        return 'link'
    }
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.removeHalos();
        var morph = this.targetMorph;
        morph.world().prompt('Enter URL for Image', function(url) {
            if (!url) return;
            morph.setImageURL(url);
            alertOK('loading image ' + url);
        }, morph.getImageURL() || '')
    },
});
lively.morphic.Halo.subclass('lively.morphic.StyleHalo',
'settings', {
    style: {fill: Color.green.lighter(2), enableDragging: false, enableGrabbing: false, toolTip: 'open style editor'},
    labelText: 'S',
    horizontalPos: 0,
    verticalPos: 2,
},
'initialization', {
    iconName: function () {
        return 'styleedit'
    }
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.removeHalos();
        lively.morphic.World.current().openStyleEditorFor(this.targetMorph);
    },
});

lively.morphic.Halo.subclass('lively.morphic.ScriptEditorHalo',
'settings', {
    style: {fill: Color.gray.lighter(2), enableDragging: false, enableGrabbing: false, toolTip: 'open script editor'},
    labelText: 'E',
    horizontalPos: 3,
    verticalPos: 1,
},
'initializing', {
    setTarget: function($super, morph) {
        $super(morph);
        this.updateStyle();
    },
    iconName: function () {
        // if targetMorph has scripts, use a colored handle
        // and show script names in tooltip
        var scripts = this.targetScripts(),
            connections = this.targetConnections();
        return scripts.size() > 0 ?
            (connections.size() > 0 ? // 2 because of onKeyUp onKeyDown
                'scriptedit_scriptconnection' : 'scriptedit_script') :
            (connections.size() > 0 ?
                'scriptedit_connection' : 'scriptedit');
    },
    updateStyle: function () {
        var icon = this.submorphs[0] || this.icon
        icon && icon.setImageURL(this.iconBaseURL + this.iconName() + '.svg')
        var scripts = this.targetScripts();
        if (scripts.size() > 0) {
            if (Config.coloredHaloItems) {
                this.setFill(Color.orange);
            }
            this.setToolTip(this.style.toolTip + '\n' + scripts.join('()\n') + '()');
        } else {
            if (Config.coloredHaloItems) {
                this.setFill(Color.rgb(240, 240, 240));
            }
            this.setToolTip(this.style.toolTip);
        };
    },
    targetConnections: function () {
        return (this.targetMorph && this.targetMorph.attributeConnections) ? this.targetMorph.attributeConnections : []; 
    }
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.removeHalos();
        $world.openObjectEditorFor(this.targetMorph);
    },

});

lively.morphic.Halo.subclass('lively.morphic.InspectHalo',
'settings', {
    style: {fill: Color.gray.lighter(2), enableDragging: false, enableGrabbing: false, toolTip: 'open inspector'},
    labelText: 'I',
    horizontalPos: 3,
    verticalPos: 2,
},
'initialization', {
    iconName: function () {
        return 'info'
    }
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.removeHalos();
        // FIXME: Should be moved to lively.bindings.FRP and only added when module is loaded!
        if (evt.isShiftDown()) {
            module("lively.bindings.FRP").load(true);
            this.targetMorph.openFRPInspector();
            return;
        }
        $world.openInspectorFor(this.targetMorph)
    },
});


lively.morphic.Halo.subclass('lively.morphic.OriginHalo',
'settings', {
    style: {fill: Color.red, toolTip: 'origin'},
    labelText: '',
    defaultExtent: pt(12,12),
},
'halo actions', {
    clickAction: function(evt) {},
    dragStartAction: function(evt, moveDelta) {
        this.targetMorph.logTransformationForUndo('origin', 'start');
    },
    dragAction: function(evt, moveDelta) {
        var transform = this.targetMorph.getGlobalTransform();
        var oldOrigin = transform.transformPoint(this.targetMorph.getOrigin()),
            newOrigin = oldOrigin.addPt(moveDelta);
        this.targetMorph.adjustOrigin(transform.inverse().transformPoint(newOrigin));
        this.targetMorph.halos.invoke('alignAtTarget')
    },
    dragEndAction: function(evt, moveDelta) {
        this.targetMorph.logTransformationForUndo('origin', 'end');
    }
},
'positioning', {
    computePositionAtTarget: function() {
        var world = this.targetMorph.world();
        if (!world) return pt(0,0);


        var pos = pt(0,0).matrixTransform(this.targetMorph.getGlobalTransform()),
            pos = pos.subPt(this.getExtent().scaleBy(0.5));
        return pos;
    },

});
lively.morphic.Halo.subclass('lively.morphic.PublishHalo',
'settings', {
    style: {fill: Color.rgb(191,242,255), toolTip: 'publish to PartsBin'},
    labelText: 'P',
    horizontalPos: 0,
    verticalPos: 1,
},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph.copyToPartsBinWithUserRequest();
    }
});

lively.morphic.Halo.subclass('lively.morphic.LockHalo',
'settings', {
    style: {fill: Color.white},
    labelText: '',
    horizontalPos: 4,
    verticalPos: 0
},
'initializing', {
    initialize: function($super, targetMorph) {
        $super(targetMorph);
        this.updateImage();
        this.setToolTip(this.targetMorph.isLocked() ? 'Unlock' : 'Lock')
    },

    updateImage: function() {
        if (this.image) this.image.remove();
        this.image = this.targetMorph.isLocked() ? this.lockImage() : this.unlockImage();
        this.addMorph(this.image);
    }

},
'accessing', {
    lockImageData: 'data:image/png;base64,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',
    unlockImageData: 'data:image/png;base64,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',
    lockImage: function() {
        if (!this._lockImage) {
            var offset = pt(3,3)
            this.constructor.prototype._lockImage = lively.morphic.Image.fromURL(this.lockImageData, this.defaultExtent.subPt(offset.scaleBy(2)).extentAsRectangle());
            this._lockImage.moveBy(offset);
            this._lockImage.ignoreEvents()
        }
        return this._lockImage.copy()
    },
    unlockImage: function() {
        if (!this._unlockImage) {
            var offset = pt(3,3)
            this.constructor.prototype._unlockImage = lively.morphic.Image.fromURL(this.unlockImageData, this.defaultExtent.subPt(offset.scaleBy(2)).extentAsRectangle());
            this._unlockImage.moveBy(offset)
            this._unlockImage.ignoreEvents()
            this._unlockImage.applyStyle({borderWidth: 0})
        }
        return this._unlockImage.copy()
    },

},
'halo actions', {
    clickAction: function(evt) {
        this.targetMorph[this.targetMorph.isLocked() ? 'unlock' : 'lock']();
        this.updateImage()
    },
});

lively.morphic.Halo.subclass('lively.morphic.BoundsHalo',
'settings', {
    style: {fill: null, borderColor: Color.red, borderWidth: 1, borderRadius: 0},
    labelText: '',
    isBoundsHalo: true
},
'initializing', {
    initialize: function($super, targetMorph) {
        $super(targetMorph);
        this.disableEvents();
    }
},
'layout', {

    computePositionAtTarget: function(targetMorph) {
        targetMorph = targetMorph || this.targetMorph;
        var world = targetMorph.world(),
            owner = targetMorph.owner;
        if (!world || !owner) return pt(0,0);
        var bounds = targetMorph.bounds(),
            pos = owner.getGlobalTransform().transformPoint(bounds.topLeft())
        return pos;
    },

    alignAtTarget: function() {
        var targetMorph = this.targetMorph,
            world = targetMorph.world();
        if (!world || !targetMorph.owner) return;
        var bounds = targetMorph.bounds(),
            boundsInWorld = targetMorph.owner.getGlobalTransform().transformRectToRect(bounds);
        this.setBounds(boundsInWorld);
    },

    onMouseDown: function(evt) {
        return false;
    }

});

lively.morphic.Halo.subclass('lively.morphic.PathControlPointHalo',
'settings', {
    style: {fill: null, borderWidth: 2, borderColor: Color.blue},
    defaultExtent: pt(12,12),
    isPathControlPointHalo: true,
},
'initializing', {
    initialize: function($super, controlPoint) {
        $super(controlPoint.getMorph());
        this.controlPoint = controlPoint;
        //controlPoint.getMorph().addMorph(this);
        //this.setPosition(controlPoint.getPos());
    },
    createLabel: function() {/*do nothing*/}
});

lively.morphic.PathControlPointHalo.subclass('lively.morphic.PathVertexControlPointHalo',
'properies', {
    isVertexControlHalo: true
},
'halo behavior', {

    computePositionAtTarget: function() {
        return this.controlPoint.getGlobalPos().subPt(this.getExtent().scaleBy(0.5));
    },

    dragAction: function (evt, moveDelta) {
        this.overOther = this.highlightIfOverOther();

        var transform = this.targetMorph.getGlobalTransform(),
            oldPos = transform.transformPoint(pt(0,0)),
            newDelta = oldPos.addPt(moveDelta),
            newDelta = transform.inverse().transformPoint(newDelta);

        this.controlPoint.moveBy(newDelta);
        if (this.targetMorph.halos)
            this.targetMorph.halos.invoke('alignAtTarget');

        if (lively.Config.get('enableMagneticConnections') && this.magnetSet && evt.isCommandKey()) {
            var nearestMagnets = this.magnetSet.nearestMagnetsToControlPoint(this.controlPoint)
            if (nearestMagnets.length == 0) {
                this.controlPoint.setConnectedMagnet(null);
            } else {
                this.controlPoint.setConnectedMagnet(nearestMagnets[0]);
                this.align(this.bounds().center(),this.controlPoint.getGlobalPos())
            }
        }

    },

    dragStartAction: function(evt) {
        this.targetMorph.removeHalosWithout(this.world(), [this]);

        if (lively.Config.get('enableMagneticConnections')) {
            this.magnetSet = new lively.morphic.MagnetSet(this.world());
            this.magnetSet.helperMorphs  = [];
        }

    },

    dragEndAction: function(evt) {
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos();

        if (!this.overOther) return;
        // if (this.controlPoint.next() !== this.overOther.controlPoint &&
        //     this.controlPoint.prev() !== this.overOther.controlPoint) return;
        if (this.controlPoint.isLast() || this.controlPoint.isFirst()) return;
        this.controlPoint.remove();

        if (lively.Config.get('enableMagneticConnections') && this.magnetSet) {
            this.magnetSet.helperMorphs.invoke('remove');
            delete this.magnetSet;
        }

    },

    findIntersectingControlPoint: function() {
        // var halos = this.targetMorph.halos;
        if(this.controlPoint.isFirst()||this.controlPoint.isLast()) return;
        var halos = this.targetMorph.getControlPointHalos();
        if (!halos.length) return;
        for (var i = 0; i < halos.length; i++){
            if (halos[i].isVertexControlHalo && 
                halos[i].controlPoint !== this.controlPoint &&
                this.bounds().containsPoint(halos[i].controlPoint.getGlobalPos())){
                    return halos[i];
            }
        }
    },

    highlightIfOverOther: function() {
        var overOther = this.findIntersectingControlPoint();
        this.setBorderColor(overOther ? Color.red : Color.blue);
        return overOther;
    },

});

lively.morphic.PathControlPointHalo.subclass('lively.morphic.PathInsertPointHalo',
'settings', {
    style: {borderRadius: 0},
},
'properies', {
    isPathControlPointHalo: true,
},
'acessing', {
    getStartPos: function() { return this.controlPoint.getPos() },
    getEndPos: function() { return this.controlPoint.next().getPos() },
    getLocalPos: function() {
        var start = this.getStartPos(), end = this.getEndPos();
        return start.addPt(end.subPt(start).scaleBy(0.5))
    },
    getGlobalPos: function() {
        return this.targetMorph.worldPoint(this.getLocalPos());
    },
},
'halo behavior', {
    computePositionAtTarget: function() {
        return this.getGlobalPos().subPt(this.getExtent().scaleBy(0.5));
    },
    dragStartAction: function(evt) {
        this.newControlPoint = this.controlPoint.insertAfter(this.getLocalPos());
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos()
    },
    dragAction: function(evt, moveDelta) {

        var transform = this.targetMorph.getGlobalTransform(),
            oldPos = transform.transformPoint(this.newControlPoint.getPos()),
            newPos = oldPos.addPt(moveDelta),
            newPos = transform.inverse().transformPoint(newPos);
        this.newControlPoint.setPos(newPos);

        if (this.targetMorph.halos)
            this.targetMorph.halos.invoke('alignAtTarget');
    },
});

(function setupGetInstanceFor() {
    // add a getInstanceFor method to all halo classes
    lively.morphic.classes()
      .filter(function(ea) { return ea.isSubclassOf(lively.morphic.Halo); })
      .forEach(function(klass) {
        Object.extend(klass, {
            getInstanceFor: function(morph, shiftedActivation) {
                if (!klass.instance) klass.instance = new klass(morph, shiftedActivation);
                else klass.instance.setTarget(morph, shiftedActivation);
                return klass.instance;
            }
        });
      });

})();

}) // end of module
