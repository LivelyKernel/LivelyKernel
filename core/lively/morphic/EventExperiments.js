module('lively.morphic.EventExperiments').requires('cop.Layers', 'lively.LayerableMorphs', 'lively.morphic.Halos').toRun(function() {

Object.extend(lively.morphic.Morph, {
    eventDepth: {
        onMouseDown: 0,
        onMouseUp: 0,
        onMouseMove: 0,
    }
});

cop.create('EventExperimentLayer')
.refineClass(lively.morphic.Morph, {

    onMouseDown: function(evt) {
        if (this.eventsAreIgnored) return false;

        evt.world.clickedOnMorph = this;
        if (evt.isAltDown()) {
            // "that" construct from Antero Taivalsaari's Lively Qt
            Global.that = evt.world.clickedOnMorph;
            alertOK('that = ' + Global.that);
        }

        if (!evt.world.eventStartPos)
            evt.world.eventStartPos = evt.getPosition();

        return false;
    },
    onMouseUp: function(evt) {
        if (this.eventsAreIgnored) return false;

        evt.hand.removeOpenMenu(evt);
        if (!evt.isCommandKey())
            evt.world.removeHalosOfCurrentHaloTarget();

        var world = evt.world,
            completeClick = world.clickedOnMorph === this;

        if (completeClick) {
            world.clickedOnMorph = null;
            evt.world.eventStartPos = null;
        }

        // FIXME should be hand.draggedMorph!
        var draggedMorph = world.draggedMorph;
        if (draggedMorph) {
            world.draggedMorph = null;
            return draggedMorph.onDragEnd(evt);
        }

        if (completeClick && this.showsMorphMenu && evt.isRightMouseButtonDown() && this.showMorphMenu(evt))
            return true;

        if (completeClick && this.halosEnabled && ((evt.isLeftMouseButtonDown() && evt.isCommandKey()) || evt.isRightMouseButtonDown())) {
            this.toggleHalos(evt);
            return true;
        }

        if (completeClick && evt.isLeftMouseButtonDown() && this.grabMe(evt)) return true;

        if (completeClick && world.dropOnMe(evt)) return true;


        return false;
    },
})
.refineClass(lively.morphic.Halo, {
    onMouseDown: function(evt) {
        evt.world.clickedOnMorph = this;
        return true;
    },
}).beNotGlobal();


lively.morphic.Morph.addMethods(
'grabbing and dragging', {
    isLocked: function() { return true },
    lock: function() {
        this.withAllSubmorphsDo(function(ea) { ea.resetLocking() });
        this.isLockOwner = true;
        this.addWithoutLayer(lively.morphic.GrabbingLayer);
    },
    unlock: function() {
        this.withAllSubmorphsDo(function(ea) { ea.resetLocking() });
        this.addWithLayer(lively.morphic.GrabbingLayer)
    },
    resetLocking: function() {
        this.isLockOwner = false;
        this.removeWithLayer(lively.morphic.GrabbingLayer);
        this.removeWithoutLayer(lively.morphic.GrabbingLayer);
    },
    lockOwner: function() {
        return this.ownerChain().detect(function(ea) { return ea.isLockOwner });
    }
});

cop.create('lively.morphic.GrabbingDefaultLayer')
.refineClass(lively.morphic.Morph, {
    onDragStart: function(evt) {
        if (!this.isLocked()) return cop.proceed(evt);
        if (cop.proceed(evt)) return true;
        if (this.isLockOwner) { evt.hand.grabMorph(this); return true };
        var lockOwner = this.lockOwner();
        if (lockOwner && !lockOwner.isWorld) {
            evt.hand.grabMorph(lockOwner); return true }
        return false
    },
}).beGlobal();

// grabbing behavior
cop.create('lively.morphic.GrabbingLayer')
.refineClass(lively.morphic.Morph, {
    isLocked: function() { return false },
    onDragStart: function(evt) {
        if (cop.proceed(evt)) return;
        ((this.grabbingEnabled == undefined) || (this.grabbingEnabled == true)) && evt.hand.grabMorph(this);
    },
})
.refineClass(lively.morphic.Text, {
    onDragStart: function(evt) {
        if (cop.proceed(evt)) return;
        // only grab when in outer area of bounds
        var bounds = this.innerBounds(),
            smallerBounds = bounds.insetBy(6),
            pos = this.localize(evt.getPosition());
        if (bounds.containsPoint(pos) && !smallerBounds.containsPoint(pos))
            ((this.grabbingEnabled == undefined) || (this.grabbingEnabled == true)) && evt.hand.grabMorph(this);
    },
});

(function setup() {
    if (Config.globalGrabbing)
        lively.morphic.GrabbingLayer.beGlobal()
    lively.morphic.Window.prototype.addWithoutLayer(lively.morphic.GrabbingLayer);
    lively.morphic.Halo.prototype.addWithoutLayer(lively.morphic.GrabbingLayer);
})();

}) // end of module
