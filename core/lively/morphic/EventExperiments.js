module('lively.morphic.EventExperiments').requires('cop.Layers', 'lively.LayerableMorphs', 'lively.morphic.Halos').toRun(function() {

Object.extend(lively.morphic.Morph, {
    eventDepth: {
        onMouseDown: 0,
        onMouseUp: 0,
        onMouseMove: 0
    }
});

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
    }
}).beGlobal();

// grabbing behavior
cop.create('lively.morphic.GrabbingLayer')
.refineClass(lively.morphic.Morph, {
    isLocked: function() { return false },
    onDragStart: function(evt) {
        if (cop.proceed(evt)) return;
        evt.hand.grabMorph(this);
    }
})
.refineClass(lively.morphic.Text, {
    onDragStart: function(evt) {
        if (cop.proceed(evt)) return;
        if (!this.isGrabbable()) return;
        var grabMe = !this.allowInput;
        if (!grabMe) {
            // only grab when in outer area of bounds
            var bounds = this.innerBounds(),
                smallerBounds = bounds.insetBy(6),
                pos = this.localize(evt.getPosition());
            grabMe = bounds.containsPoint(pos) && !smallerBounds.containsPoint(pos);
        }
        grabMe && evt.hand.grabMorph(this);
    }
});

(function setup() {
    if (Config.globalGrabbing)
        lively.morphic.GrabbingLayer.beGlobal()
    lively.morphic.Window.prototype.addWithoutLayer(lively.morphic.GrabbingLayer);
    lively.morphic.Halo.prototype.addWithoutLayer(lively.morphic.GrabbingLayer);
})();

}) // end of module
