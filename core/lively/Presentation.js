/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module('lively.Presentation').requires('cop.Layers', 'lively.morphic').toRun(function() {

if (Global.NewMorphicCompatLayer) NewMorphicCompatLayer.beGlobal();

Object.extend(lively.Presentation, {
    currentSlideNo: function() {
        return this.currentSlide() ?
            lively.Presentation.PageMorph.allSceneNames().indexOf(this.currentSlide().name) : 0;
    },
    maxSlideNo: function() { return lively.Presentation.PageMorph.allSceneNames().length - 1 },
    currentSlide: function() { return lively.morphic.World.current().currentScene },
    gotoSlide: function(slideNo) {
        slideNo = Math.max(0, Math.min(this.maxSlideNo(), slideNo));
        this.activateSlideWithNo(slideNo);
        // for safaris strange beavior when switching slides with arrow keys
        (function() { Global.scrollTo(0,0) }).delay(0.1);
    },
    prevSlide: function() {
        if (this.currentSlide() && this.currentSlide().isInFullScreen())
            this.gotoSlide(this.currentSlideNo()-1)
    },
    nextSlide: function() {
        if (this.currentSlide() && this.currentSlide().isInFullScreen())
            this.gotoSlide(this.currentSlideNo()+1)
    },
    exitSlideView: function() {
        if (this.currentSlide()) this.currentSlide().leaveFullScreen();
    },
    gotoSlideDialog: function() {
        lively.morphic.World.current().prompt(
            'goto wich page? 0 -' + this.maxSlideNo(),
            function(input) { input && this.gotoSlide(Number(input)) }.bind(this));
    },
    addSlide: function() {
        var m =  new lively.Presentation.PageMorph(new Rectangle(0,0,1024,768)),
            label = new lively.morphic.Text(new Rectangle(0,-20,200,20), "label").beLabel()
        label.applyStyle({textColor: CrayonColors.tangerine})
        connect(m, 'name', label, 'setTextString')
        m.addMorph(label)

        var i = 1, name =  "scene01" 
        while($morph(name)) { 
            name = "scene" + (i < 10 ? "0" : "") + i;
            i++
        }

        lively.morphic.World.current().firstHand().addMorph(m);
    },
    activateSlideNamed: function(slideName) {
        var world = lively.morphic.World.current(),
            slide = world.get(slideName);
        slide && slide.activate();
        world.focus();
    },
    activateSlideWithNo: function(no) {
        var name = lively.Presentation.PageMorph.allSceneNames()[no];
        name && this.activateSlideNamed(name);
    },


});

Morph.subclass("lively.Presentation.PageMorph",
'properties', {
    isSlideMorph: true,
    showsMorphMenu: true, // FIXME
    style: {enableMorphMenu: true},
},
'initialzing', {
    initialize: function($super, bounds) {
        $super(new lively.scene.Rectangle(bounds));
        this.setFill(Color.white);
        this.setBorderColor(Color.gray);
        this.setBorderWidth(0.5);
    },
},
'control', {
    activate: function() {
        this.activateWithOverlay(this.get('backgroundScene') || this.get('SlideOverlay'));
    },
    activateWithOverlay: function(overlay) {
        var world = this.world(),
            backgroundMorph = overlay;
    
        if (world.currentScene && world.currentScene.leaveFullScreen) {
            world.currentScene.leaveFullScreen();
            if (world.currentScene.oldOwner) {
                world.currentScene.oldOwner.addMorph(world.currentScene);
            }
        }

        world.currentScene = this;
        
        this.oldOwner = this.owner;
        world.addMorph(this);

        this.enterFullScreen();

        if (backgroundMorph && backgroundMorph.visitSlide)
            backgroundMorph.visitSlide(this);

        var shapeBounds = this.getTransform().transformRectToRect(this.shape.bounds());
        if (world.ensureStatusMessageContainer) {
            world.ensureStatusMessageContainer().alignBounds = shapeBounds;
            world.ensureStatusMessageContainer().dismissAll();
        }

        // to get keyboard focus for the world morph
        world.focus();
    },
    deactivate: function() {
        this.world().currentScene = null;
        this.leaveFullScreen();
    },


},
'accessing', {
    getSlideNumber: function() {
        // extract from name
        var match = this.getName().match(/[0-9]+/)
        return !match || !match[0] ? 0 : Number(match[0]);
    },
    morphBeneath: function() {
        // used for halos -- don't allow click through
        return this.owner
    },

},
'grabbing and dropping', {
    okToBeGrabbedBy: Functions.Null,
    acceptsDropping:  function(morph) {
        // allow dropping of WindowMorphs
        return !this.suppressDropping && this.openForDragAndDrop;
    },
    addFramedMorph: function(morph, title, optLoc, optSuppressControls) {
        var w = this.world().addFramedMorph(morph, title, optLoc, optSuppressControls);
        this.addMorph(w);
        return w;
    },
},
'menu', {
    morphMenu: function($super, evt) { 
        var menu = $super(evt);
        menu.addItem([(this.isInFullScreen() ? "leave " : "") + "fullscreen", function() {
            this.toggleFullScreen();
        }.bind(this)]);
        return menu;
    },
    morphMenuItems: function($super, evt) { 
        // var menu = $super(evt);
        return this.world().morphMenuItems(evt).concat([
            [(this.isInFullScreen() ? "leave " : "") + "fullscreen", function() {
                this.toggleFullScreen();
            }.bind(this)]])
    },

},
'fullscreen', {
    toggleFullScreen: function() {
        this.isInFullScreen() ? this.leaveFullScreen() : this.enterFullScreen();
    },

},
'mouse events', {
    handlesMouseDown: Functions.True,
    onMouseDown: function ($super, evt) {
        var result = $super(evt);
        if (!Config.isNewMorphic) this.makeSelection(evt);         
        return result;
    },
    makeSelection: function(evt) {  //default behavior is to grab a submorph
        if (this.currentSelection != null) this.currentSelection.removeOnlyIt();
        var m = new SelectionMorph(this.localize(evt.point()).asRectangle());
        this.addMorph(m);
        this.currentSelection = m;
        var handle = new HandleMorph(pt(0,0), lively.scene.Rectangle, evt.hand, m, "bottomRight");
        handle.setExtent(pt(0, 0));
        handle.mode = 'reshape';
        m.addMorph(handle);
        evt.hand.setMouseFocus(handle);
        // evt.hand.setKeyboardFocus(handle);
    },
    isFocusable: function() { return false },
    
});

Object.extend(lively.Presentation.PageMorph, {
    allSceneNames: function() {
        return lively.morphic.World.current().submorphs
            .pluck('name')
            .select(function(ea) { return ea && ea.startsWith('scene')})
            .sort();
    },
});

cop.create("PresentationShortcutLayer")
.beGlobal()
.refineClass(lively.morphic.World, {
    onKeyDown: function(evt) {
if (!this.currentScene) return cop.proceed(evt);
        if (cop.proceed(evt)) return true;
        if (!Config.pageNavigationWithKeys) return false;
        var c = evt.getKeyCode();
        if (c == Event.KEY_LEFT) {
            lively.Presentation.prevSlide();
            evt.stop();
            return true;
        }
        if (c == Event.KEY_RIGHT) {
            lively.Presentation.nextSlide();
            evt.stop();
            return  true;
        }
        if (c == Event.KEY_ESC) {
            var btn = $morph('exitBtn');
            btn && btn.doAction()
            evt.stop();
            return  true;
        }
        return false;
    },    
});

// Show shortcuts
cop.create('ShowShortcutsLayer').refineClass(lively.morphic.Text, {
    doPrintit: function() {
        this.setStatusMessage('print it (CMD+P)', Color.green)
        return cop.proceed()
    },
    doDoit: function() {
        this.setStatusMessage('evaluate source (CMD+D)', Color.green)
        return cop.proceed()
    },
    doSave: function() {
        this.setStatusMessage('do save / evaluate (CMD+S)', Color.green)
        return cop.proceed()
    },
})

cop.create('NewMorphicPresentationCompatLayer')
.refineClass(lively.Presentation.PageMorph, {
    get style() { return {fill: Color.white, borderWidth: 1, borderColor: Color.gray, enableDragging: true} },
    initialize: function(bounds) {
        var shape = new lively.morphic.Shapes.Rectangle(bounds.extent().extentAsRectangle());
        lively.morphic.Morph.prototype.initialize.call(this, shape);
        this.setPosition(bounds.topLeft());
        // FIXME can be directly applied to the class
        Trait('SelectionMorphTrait').applyTo(this, {override: ['onDrag', 'onDragStart', 'onDragEnd']})
    },
    makeSelection: function(evt) {},
    morphMenuItems: function(evt) { 
        var items = cop.proceed(evt);
        items.push([
            (this.isInFullScreen() ? "leave " : "") + "fullscreen",
            this.toggleFullScreen.bind(this)]);
        return items;
    },
    onMouseDown: function (evt) { return cop.proceed(evt) },
})
.refineClass(lively.morphic.Morph, {
    get droppingEnabled() { return !this.isSlideOverlay && cop.proceed() },
});

cop.create("NewMorphicPresentationShortcutLayer")
.refineClass(lively.morphic.World, {
    onKeyDown: function(evt) {
        if (!this.currentScene) return cop.proceed(evt);
        if (!this.isFocused()) return cop.proceed(evt);
        if (evt.isCommandKey() || !Config.pageNavigationWithKeys) return cop.proceed(evt);
        var controller = this.currentPresentationController;
        if (!controller) return cop.proceed(evt);
        var c = evt.getKeyCode();
        if (c == Event.KEY_LEFT && !this.currentHaloTarget) {
            controller.prevSlide();
            evt.stop();
            return true;
        }
        if (c == Event.KEY_RIGHT && !this.currentHaloTarget) {
            controller.nextSlide();
            evt.stop();
            return  true;
        }
        if (c == Event.KEY_ESC) {
            controller.endPresentation();
            alert('presentation stopped')
            evt.stop();
            return  true;
        }
        return cop.proceed(evt);
    },    
});
Widget.addMethods(
'view', {
    open: function() {
        var world = lively.morphic.World.current();
        return this.openIn(world.currentScene || world);
    },
});
(function setupForNewLively() {
    if (!Config.isNewMorphic) return;
    NewMorphicPresentationCompatLayer.beGlobal();
    Trait('SelectionMorphTrait').applyTo(lively.Presentation.PageMorph, {override: ['onDrag', 'onDragStart', 'onDragEnd']});
})();
});

