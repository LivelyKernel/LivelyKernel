module('lively.Touch').requires('lively.TestFramework').toRun(function() {

  cop.create('TouchEvents').refineClass(lively.morphic.Morph, {
    registerForTouchEvents:function (handleOnCapture) {
      if (!UserAgent.isTouch) {
        return;
      }
      handleOnCapture = false;

      if (this.onTouchStartAction) {
        this.registerForEvent('touchstart', this, 'onTouchStartAction', handleOnCapture);
      } else if (this.onTouchStart) {
        this.registerForEvent('touchstart', this, 'onTouchStart', handleOnCapture);
      }
      if (this.onTouchMoveAction) {
        this.registerForEvent('touchmove', this, 'onTouchMoveAction', handleOnCapture);
      } else if (this.onTouchMove) {
        this.registerForEvent('touchmove', this, 'onTouchMove', handleOnCapture);
      }
      if (this.onTouchEndAction) {
        this.registerForEvent('touchend', this, 'onTouchEndAction', handleOnCapture);
      } else if (this.onTouchEnd) {
        this.registerForEvent('touchend', this, 'onTouchEnd', handleOnCapture);
      }
      if (this.onTouchCancel) {
        this.registerForEvent('touchcancel', this, 'onTouchCancel', handleOnCapture);
      }
    },



    registerForGestureEvents: function(handleOnCapture) {
      handleOnCapture = false;
      if (this.onGestureStart) {
        this.registerForEvent('gesturestart', this, 'onGestureStart', handleOnCapture);
      }
      if (this.onGestureChange) {
        this.registerForEvent('gesturechange', this, 'onGestureChange', handleOnCapture);
      }
      if (this.onGestureEnd) {
        this.registerForEvent('gestureend', this, 'onGestureEnd', handleOnCapture);
      }
    },
    unregisterFromGestureEvents: function() {
        // Since Morphs are able to register for Gesture Events, they must be able to unregister
        var eventHandler = this.eventHandler;
        // unregisterFromDispatchTable
        eventHandler.eventSpecsDo(function (eventSpec) {
            if (eventSpec.type && eventSpec.type.startsWith("gesture")) {
                if (!eventSpec.unregisterMethodName) throw new Error('Cannot unregister event handler ' + this);
                eventHandler[eventSpec.unregisterMethodName](eventSpec)
            }
        });
    },

    registerForEvents: function(handleOnCapture) {
      this.registerForGestureEvents(handleOnCapture);
      cop.proceed(handleOnCapture);
    },

}).refineClass(lively.morphic.EventHandler, {
    patchEvent: function(evt) {
        evt = cop.proceed(evt);
        if (['touchend', 'touchstart', 'touchmove'].include(evt.type)) {
            this.patchTouchEvent(evt);
            if(evt.type === 'touchstart'){
                this.patchTouchStartEvent(evt);
            }
        }
        return evt;
    },
    patchTouchEvent: function(evt) {
        if(evt.changedTouches) {
            for(var i = 0; i < evt.changedTouches.length; i++){
                evt.changedTouches[i].lastUpdate = new Date();
            }
            evt.getPosition = function() {
                if (!evt.scaledPos) {
                    if (evt.changedTouches.length > 0) {
                        evt.scaledPos = evt.changedTouches[0].getPagePosition();
                    }
                    else if (evt.touches.length > 0) {
                        evt.scaledPos = evt.touches[0].getPagePosition();
                    }
                }
                return evt.scaledPos;
            };
        }
    },
    patchTouchStartEvent: function(evt) {
        for(var i = 0; i < evt.changedTouches.length; i++){
            var touch = evt.changedTouches[i];
                    
            touch.startDate = new Date();
                    
            touch.getClientPosition = function(){
                return pt(this.clientX, this.clientY);
            };
            touch.getPagePosition = function(){
                return pt(this.pageX, this.pageY);
            };
            touch.getScreenPosition = function(){
                return pt(this.screenX, this.screenY);
            };

            touch.clientStart = touch.getClientPosition();
            touch.pageStart = touch.getPagePosition();
            touch.screenStart = touch.getScreenPosition();

            touch.timeSinceStart = function(){
                return new Date().valueOf() - this.startDate.valueOf();
            };
            touch.timeSinceLastUpdate = function(){
                return new Date().valueOf() - this.lastUpdate.valueOf();                        
            };
            touch.timeFromStartToLastUpdate = function () {
                return this.lastUpdate.valueOf() - this.startDate.valueOf();
            }

            touch.getClientDeltaToStart = function(){
                return this.getClientPosition().subPt(this.clientStart);
            };
            touch.getPageDeltaToStart = function(){
                return this.getPagePosition().subPt(this.pageStart);
            };
            touch.getScreenDeltaToStart = function(){
                return this.getScreenPosition().subPt(this.screenStart);
            };

            touch.startTouch = Object.clone(touch);
        } 
    },


}); //end of cop

TouchEvents.beGlobal();

TestCase.subclass('TouchEventsTest', 'default category', {
    testRegisterForGestureEvents: function() {
        var m = Morph.makeRectangle(0,0,100,100);
        var eventHandlerKeys = Properties.own(m.eventHandler.dispatchTable);
        this.assert(eventHandlerKeys.include("gesturestart"), "No gesturestart")
    },
    testUnregisterFromGestureEvents: function() {
        var m = Morph.makeRectangle(0,0,100,100);
        var eventHandlerKeys = Properties.own(m.eventHandler.dispatchTable);
        m.unregisterFromGestureEvents();
        var gestureNodeFound = 0;
        m.eventHandler.eventSpecsDo(function (eventSpec) {
            if (gestureNodeFound < 4) {
                inspect(eventSpec.node)
                gestureNodeFound += 1;
            }
        });
    },
});
Object.extend(TouchList.prototype,{
    include: function(touch){
        for(var i = 0; i < this.length; i++){
            if(this[i] === touch){
                return true;
            }
        }
        return false;
    }
});


if(typeof Config.useTwoFingerHaloGesture !== 'boolean'){
    Config.useTwoFingerHaloGesture = true;
}

cop.create('TapEvents').refineClass(lively.morphic.World, {
    onrestore: function(){
        connect(lively.morphic.World, "currentWorld", this, "loadHoldIndicator");
        cop.proceed();
    },
    showHalos: function() {
        // lazy function is lazy
    },

}).refineClass(lively.morphic.Morph, {
    onMouseDown: function(evt) {
        if(!$world.ignoreMouseEvents){
            return cop.proceed(evt);
        } else {
            evt.stop();
            return true;
        }
    },
    onMouseUp: function(evt) {
        if(!$world.ignoreMouseEvents){
            return cop.proceed(evt);
        } else {
            evt.stop();
            return true;
        }
    },
    onMouseMove: function(evt) {
        if(!$world.ignoreMouseEvents){
            return cop.proceed(evt);
        } else {
            evt.stop();
            return true;
        }
    },
    morphMenuItems: function() {
        // enter comment here
        var items = cop.proceed();
        var self = this;
        items = items.collect(function(ea) {
            if(ea && ea[0] === "get halo on...") {
                var morphs = self.withAllSubmorphsSelect(function(){return true;});
                //TODO: use a function which returns all owners of the morph
                for (var m = self.owner; (m !== self.world()) && (typeof m !== "undefined"); m = m.owner) {
                    morphs.push(m);
                }
                morphs = morphs.reject(function(ea){ return ea.selectionDisabled || ea === self; });
            
                ea[0] = "get selection on...";
                ea[1] = morphs.collect(function(ea) {
                    return [ea.getName() || ea.toString(), function(evt) { ea.select();}]
                });
            
            }
            return ea;
        });
        return items;
    },

}).beGlobal();
lively.morphic.Box.subclass('lively.morphic.NameDisplay',
'default category', {
    askForNewName: function() {
        var morph = this.targetMorph;
        morph.world().prompt('Enter Name for Morph', function(name) {
            if (!name) return;
            var oldName = morph.getName() || morph.toString();
            morph.setName(name);
            alertOK(oldName + ' renamed to ' + name);
        }, morph.getName() || '')
    },
    style: {borderWidth: 1, borderRadius: 12, borderColor: Color.darkGray, enableHalos: false, enableDropping: false, enableDragging: false, opacity: 0.7, fill: Color.white, clipMode: 'hidden', toolTip: 'rename the object'},







    onClick: function(evt) {
        //this.askForNewName.bind(this).delay(0);
    },
    onTap: function(evt) {
        //this.askForNewName.bind(this).delay(0);
    },

    initialize: function($super, targetMorph) {
        $super(lively.rect(lively.pt(0,0),lively.pt(0,0)));
        this.targetMorph = targetMorph;
        this.wantsToBeDebugged = true;
        this.createLabel();
    },
    createLabel: function() {
        var text = this.targetMorph.getName() || this.targetMorph.toString();
        if (!text || text == '') return null;
        if (!this.labelMorph){
            this.labelMorph = new lively.morphic.Text(new Rectangle(0,0, 0, 0), text);
            this.labelMorph.onBlur = function(evt){alertOK("Changed Name To: " + this.textString)};
            connect(this.labelMorph, "textString", this.targetMorph, "setName");
            connect(this.labelMorph, "textString", this, "fit");
        } else {
            this.labelMorph.setExtent(pt(0,0));
        }
        this.labelMorph.applyStyle({align: 'center', fixedWidth: false, fixedHeight: false, textColor: Color.darkGray, borderStyle: "hidden", fill: Color.rgba(0,0,0,0)});

        this.labelMorph.wantsToBeDebugged = true;

        this.addMorph(this.labelMorph);
        (function() {
            this.labelMorph.fit();
            this.labelMorph.align(this.labelMorph.bounds().center(), this.innerBounds().center())
        }).bind(this).delay(0);
        return this.labelMorph;
    },
    onTouchMove: function(evt) {
        evt.isStopped = true;
        evt.stopPropagation();
        return true;
    },
    onTouchEnd: function(evt) {
        evt.isStopped = true;
        evt.stopPropagation();
        return true;
    },
    onTouchStart: function(evt) {
        evt.isStopped = true;
        evt.stopPropagation();
        return true;
    },
    fit: function() {
        this.labelMorph.fit();
        this.setExtent(this.labelMorph.getExtent().addPt(pt(10,5)));
        this.labelMorph.align(this.labelMorph.bounds().center(), this.innerBounds().center());
        this.align( this.getBounds().topCenter(), 
                    this.owner.innerBounds().bottomCenter());
    },







});
lively.morphic.Morph.addMethods(
"Tap ThroughHalos", {
    onTap: function(evt) {
        this.select();
    },

    onMouseUp: function (evt) {
        if (this.eventsAreIgnored) return false;

        evt.hand.removeOpenMenu(evt);
        if (!evt.isCommandKey() && !$world.isInEditMode() && !$world.ignoreHalos) {
            evt.world.removeHalosOfCurrentHaloTarget();
        }

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
            //this.toggleHalos(evt);
            return true;
        }

        if (completeClick && evt.isLeftMouseButtonDown() && this.grabMe(evt)) return true;

        if (completeClick && world.dropOnMe(evt)) return true;


        return false;
    },

},
"TouchToMouse", {
    fireMouseEvent: function(evtType, touchObj, target) {
        
        var buttonFlag = touchObj.buttonFlag || 0;

        if(buttonFlag === 0 ||
           buttonFlag === 1 ||
           buttonFlag === 2) {

            var mouseEvent = document.createEvent('MouseEvents');
            mouseEvent.initMouseEvent(evtType,
                true,
                true,
                window,
                1,
                touchObj.screenX,
                touchObj.screenY,
                touchObj.clientX,
                touchObj.clientY,
                false,
                false,
                false,
                false,
                buttonFlag,
                null
            );
            mouseEvent.fromTouch = true;
            target.dispatchEvent(mouseEvent);
        }
    },
},
"TapEvents", {
    onTouchStartAction: function (evt) {
        if (this.areEventsIgnoredOrDisabled()) {
            return false;
        }

        if (evt.targetTouches.length === 1){
            this.tapTouch = evt.targetTouches[0];
            if(evt.dontScroll || typeof this.onTouchMove === "function") {
                evt.dontScroll = true;
            } else {
                this.moveTouch = evt.targetTouches[0];
            }
        }



        if (evt.touches.length === 1 && !evt.holdIsScheduled) {
            this.handleFirstTouch(evt);
        } else if (evt.touches && evt.touches.length === 2) {
            this.handleSecondTouch(evt);
        }
        if (typeof this.onTouchStart === "function") { 
            return this.onTouchStart(evt);
        }
    },




    onTouchMoveAction: function (evt) {
        if (this.areEventsIgnoredOrDisabled()) {
            return false;
        }

        if (this.moveTouch && this.moveTouch.canceled) {
            //TODO: this might break the zooming, still experimenting
            //console.log("cancelled because moveTouch was cancelled");
            //evt.stop();
            //return true;
        }

        // cancel the hold indicator for text (text does not have a movetouch)
        if (evt.touches.length === 1 && 
                this.tapTouch && 
                evt.touches[0] === this.tapTouch) {

            var delta = this.tapTouch.getScreenDeltaToStart();

            if (delta.r() > 25) {   // not hold
                this.cancelHold(); 
            }
        }
        

        if (evt.touches.length === 1 && 
                this.moveTouch && 
                evt.touches[0] === this.moveTouch) {
            
            this.moveToTouchPosition(evt);
            evt.stop();
            //return true;
        }
        if (typeof this.onTouchMove === "function") { 
            return this.onTouchMove(evt);
        }
    },
    moveToTouchPosition: function(evt) {
        if (!this.moveTouch) {
            return;
        }

        var delta = this.moveTouch.getScreenDeltaToStart();

        if (this.scrolled || this.moved || delta.r() > 25) {   // not hold
            this.cancelHold(); 

            if (this !== this.world() && this.isTouchDraggable()) {
                // move the morph
                if (!this.moved) {
                    this.fireMouseEvent('mousedown', this.moveTouch.startTouch, evt.target);
                }
                this.moved = true;

                this.fireMouseEvent('mousemove',this.moveTouch, evt.target);
                if (!this.isDraggableWithoutHalo()) {
                    this.halosTemporaryInvisible = true;
                }
            } else {
                // scroll the world
                if(!this.scrolled) {
                    $world.initializeBrowserScrollForTouchEvents(this.moveTouch.startTouch);
                }
                this.scrolled = true;

                $world.emulateBrowserScrollForTouchEvents(this.moveTouch);
            }
        } 
    },
    dropToTouchPosition: function(evt) {
        if (this.moved) {
            this.fireMouseEvent('mouseup', this.moveTouch, evt.target)
            /*
            if (!this.isDraggableWithoutHalo()) {
                this.showHalos();
                this.halosTemporaryInvisible = false;
            }
            */
            evt.stop();
        }
    },


    onTouchEndAction: function (evt) {

        if (this.areEventsIgnoredOrDisabled()){
            return false;
        }
  
        if(this.moveTouch && this.moveTouch.canceled){
            // In this case, the mobile browser is going to emit some mouseevents,
            // which may cause problems (e.g. removing halos). The only way to
            // prevent this, is stopping the touch-Start-events. However, we don't
            // want to, because some parts of lively depend on the emulated mouse
            // events. We tell the world to ignore the unwanted events for a limited time instead.
            $world.ignoreMouseEvents = true;
            window.setTimeout(function(){$world.ignoreMouseEvents = false}, 500);
            evt.stop();
            return true;
        }

        if (evt.changedTouches.length == 1 &&
                this.moveTouch === evt.changedTouches[0]) {
            this.moveToTouchPosition(evt);
            this.dropToTouchPosition(evt);
            evt.stop();
        }

        var out = false;

        if (typeof this.onTouchEnd === "function") { 
            out = this.onTouchEnd(evt);
        }

        if (this.tapTouch && evt.changedTouches.include(this.tapTouch)) {
            this.checkForTap(evt);
        }
        if (this.moveTouch && evt.changedTouches.include(this.moveTouch)) {
            this.moveTouch = false;
            this.moved = false;
            this.scrolled = false;
        
            $world.endBrowserScrollForTouchEvents();
            evt.stop();
        }

        if(this.tapTouch && evt.changedTouches.include(this.tapTouch)) {
            this.cancelHold();
        }

        if (evt.changedTouches.length == 1 && this.selectable && $world.editMode) {
            //this.showHalos();
        }

        if (evt.touches.length === 0) {
            // this branch is executed, when the last finger left the screen
            delete $world._emulatedScrollingTemporarilyDisabled;
        }

        this.selectable = false;
        return out;
    },
    checkForTap: function(evt) {
        if(this.tapTouch){
            var delta = this.tapTouch.timeFromStartToLastUpdate();
            // TODO some scripts (ie pieStart) take long and delay processing of furher events
            // especially TouchEnd, which checks for taps using the time that passed
            // that forces us to increase the tap-threshold
            if(delta <= 200 && this.tapTouch.getScreenDeltaToStart().r() <= 25){
                //console.log("event - type: tap on: "+this.eventHandler.dispatchTable[evt.type].target + (evt.fromTouch ? " (was generated from touch)" : "") + "(at "+ new Date().valueOf() +")" + " -- phase " + evt.eventPhase);
                this.tapped(evt);
            }
        }
    },

    cancelHold: function() {
        $world.cancelHold();
    },



    tapped: function(evt) {
        var doubleTapTimeout = 250;
            
        if (this.lastTap && new Date() - this.lastTap <= doubleTapTimeout) {
            if (typeof this.onDoubleTap === "function") {
                this.lastTap = false;
                this.onDoubleTap(evt);
            }

        } else {
            if (typeof this.onTap === "function") {
                this.onTap(evt);
            }
            this.lastTap = new Date();
        }
    },
    handleFirstTouch: function(evt) {
        $world.scheduleHoldIndicatorFor(this);
        evt.holdIsScheduled = true;
        $world.setEditMode(true);
        this.selectable = false;
    },
    handleSecondTouch: function(evt) {
        $world.cancelHold();
        if (evt.targetTouches.length == 1 && Config.useTwoFingerHaloGesture) {

            // selectable indicates, that this morph will show halos on touch end
            this.selectable = true;

            for(var i = 0; i<2; i++){
                if(evt.touches[i] != evt.targetTouches[0]){
                    evt.touches[i].canceled = true;
                }
            }
            //NOTE: if we have this stop, the browser does not emulate a mouse click on the morph.
            // Then halos does not disappear unexpectedly. BUT: If we stop the event, we can not
            // zoom. So we decided that zooming is more important than halos and not stopping the
            // event
            //evt.stop();
        } else {
            this.selectable = false;
        }
    },


    triggerHold: function() {
        this.cancelHold();
        if(typeof this.onHold === "function"){
            this.onHold(this.tapTouch);
        }
    },
    setDraggableWithoutHalo: function(bool) {
        this.draggableWithoutHalo = bool;
    },
    isDraggableWithoutHalo: function() {
        return this.draggableWithoutHalo;
    },
    isTouchDraggable: function() {
        return  this.showsHalos ||
                this.halosTemporaryInvisible ||
                this.isDraggableWithoutHalo();
    },

}, 
"Selection", {

    select: function() {
        // enter comment here
        if(!this.isSelectable()) return;
        $world.updateSelection(this);
        this.selectionMorph = this.createSelectionMorph();
        $world.addMorph(this.selectionMorph);

        $world.firstHand().setPosition(this.selectionMorph.bounds().center());
        this.ignoreEvents();
    },
    createSelectionMorph: function () {
        var border = new lively.morphic.Box(this.shape.getBounds());
        border.setName("SelectionMorph");
        border.setBorderWidth(Math.ceil(  2 / $world.getZoomLevel()
                                            / this.getGlobalTransform().getScale()
        ));
        border.setBorderColor(Color.green.lighter());
        border.align(border.bounds().topLeft(), this.shape.bounds().topLeft());
        border.disableDropping();        
        border.applyStyle({adjustForNewBounds: true});

        border.setOrigin(this.getOrigin());
        border.setTransform(this.getGlobalTransform());
        border.targetMorph = this;

        border.onTap = function (evt) { 
            this.targetMorph.morphBeneath(evt.getPosition()).select();
            evt.stop();
        };
        border.disableSelection();

        if(PieMenu) {
            border.onTouchStart = function (evt) {
            // TODO this takes about 100ms and delays processing of furher events
            // especially TouchEnd, which checks for taps using the time that passed
            // that forces us to increase the tap-threshold
                this.targetMorph.pieStart(evt);
            };
            border.onTouchMove = function (evt) {
                this.targetMorph.pieMove(evt);
            };
            border.onTouchEnd = function (evt) {
                this.targetMorph.pieEnd(evt);
            };
        }

        connect(this, "extent", border, "setExtent");
        connect(this, "_Scale", border, "setScale", {converter: function(value) {
            var globalTransform = this.sourceObj.getGlobalTransform();
            return globalTransform.getScale();
        }});
        connect(this, "_Rotation", border, "setRotation", {converter: function(value) {
            var globalTransform = this.sourceObj.getGlobalTransform();
            return globalTransform.getRotation().toRadians();
        }});
        connect(this, "_Position", border, "setPosition", {converter: function(value) {
            var globalTransform = this.sourceObj.getGlobalTransform();
            return globalTransform.getTranslation();
        }});
        //connect(this, "remove", border, "remove", {removeAfterUpdate: true});

        

        var cornerPlaces = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
        for(var i = 0; i < cornerPlaces.length; i += 1) {
            var corner = new lively.morphic.ResizeCorner(new Rectangle(0,0,44,44));
            corner.setScale(1 / $world.getZoomLevel() / this.getGlobalTransform().getScale());
            corner.name = "corner"+cornerPlaces[i];
            corner.setOrigin(pt(22,22));
            
            corner.setFill(null)
            var colorMorph = lively.morphic.Morph.makeEllipse(new Rectangle(0,0,22,22))
            colorMorph.setFill(new lively.morphic.LinearGradient(
            [
            {offset: 0, color: Color.rgb(80,65,50)},
            {offset: 0.45, color: Color.rgb(105,90,75)},
            {offset: 0.70, color: Color.rgb(115,110,96)},
            {offset: 1, color: Color.rgb(185,175,159)}
            ],
            'northWest'
            ))
            colorMorph.moveBy(colorMorph.getExtent().scaleBy(-0.5))
            colorMorph.ignoreEvents()
            //colorMorph.setFill(Color.rgba(0,23,90,0.75))
            corner.addMorph(colorMorph)

            border.addMorph(corner);

            //corner.setFill(Color.red);
            corner.align(corner.bounds().center(), border.shape.bounds()[cornerPlaces[i]]());
            corner.setDraggableWithoutHalo(true);
            corner.isResizeCorner = true;
            corner.cornerName = cornerPlaces[i];
            corner.enableEvents();
            corner.disableHalos();
            corner.disableDropping();
        }

        border.wantsToBeDebugged = true;

        var renameHalo = new lively.morphic.NameDisplay(this);
        renameHalo.disableSelection();

        renameHalo.applyStyle({centeredHorizontal: true, moveVertical: true});

        renameHalo.labelMorph.applyStyle({align: "center"});
        renameHalo.labelMorph.disableSelection();

        renameHalo.setScale(2 / $world.getZoomLevel() / this.getGlobalTransform().getScale());
        border.addMorph(renameHalo);

        renameHalo.fit.bind(renameHalo).delay(0);

        return border;
    },

    deselect: function() {
        // enter comment here
        if(this.selectionMorph){
            this.unignoreEvents();
        
            disconnect(this, "extent", this.selectionMorph, "setExtent");
            disconnect(this, "_Position", this.selectionMorph, "setPosition");
            disconnect(this, "_Rotation", this.selectionMorph, "setRotation");
            disconnect(this, "_Scale", this.selectionMorph, "setScale");

            this.selectionMorph.remove();
            this.selectionMorph = null;
            this.removeHalos();
        }
    },
    disableSelection: function() {
        // enter comment here
        this.selectionDisabled = true;
    },
    enableSelection: function() {
        // enter comment here
        this.selectionDisabled = false;
    },
    isSelectable: function() {
        // comment
        if(typeof this.selectionDisabled === "undefined"){
            if(this.owner){
                return this.owner.isSelectable();
            } else {
                return true;
            }
        } else {
            return !this.selectionDisabled;
        }
    },




});
lively.morphic.Morph.subclass('lively.morphic.ResizeCorner',
'default category', {
    initialize: function($super, initialBounds) {
        $super(new lively.morphic.Shapes.Ellipse(initialBounds.extent().extentAsRectangle()));
        this.setPosition(initialBounds.topLeft());
        this.disableSelection();
    },

    onDragStart: function(evt) {
        this.dragStartPoint = evt.mousePoint;
        var morph = this.owner.targetMorph;
        this.originalTargetBounds= this.owner.shape.bounds().translatedBy(morph.getPosition());

    },
    onDrag: function (evt) {
            var moveDelta = evt.mousePoint.subPt(this.dragStartPoint);

            var transformedMoveDelta = pt(0,0),
                transform = this.owner.targetMorph.getGlobalTransform(),
                angle = transform.getRotation().toRadians(),
                scale = transform.getScale();

            transformedMoveDelta.x = Math.cos(angle) * moveDelta.x + Math.sin(angle) * moveDelta.y;
            transformedMoveDelta.y =-Math.sin(angle) * moveDelta.x + Math.cos(angle) * moveDelta.y;
            transformedMoveDelta = transformedMoveDelta.scaleBy(1/scale);

            var accessor = "with" + this.cornerName.charAt(0).toUpperCase() +  this.cornerName.substring(1);

            var newCorner = this.originalTargetBounds[this.cornerName]().addPt(transformedMoveDelta);

            var newBounds = this.originalTargetBounds[accessor](newCorner);

            this.newBounds = newBounds;
            this.setTargetBounds(newBounds);
            this.owner.submorphs.select(function(ea) {
                return ea.isResizeCorner
            }).invoke('alignToOwner');

            this.setInfo(0, "pos: " + this.owner.targetMorph.getPosition());
            this.setInfo(1, "extent: " + this.owner.targetMorph.getExtent());
            this.alignInfo();
    },
    onDragEnd: function (evt) {
            this.dragStartPoint = null;
            this.originalTargetBounds = null;

            if(this.infoMorphs){
                this.infoMorphs.invoke("remove");
            }
    },
    alignToOwner: function (evt) {
            this.align(this.bounds().center(), this.owner.shape.bounds()[this.cornerName]() );
    },
    onTouchStart: function($super, evt) {
        // enter comment here
        $super(evt);
        this.owner.targetMorph.ignoreEvents();
        this.unignoreEvents();
        evt.stop();
        return true;
    },
    onTap: function(evt) {
        // do nothing
        return;
    },

    onTouchEnd: function($super, evt) {
        $super(evt);
        this.owner.targetMorph.unignoreEvents();
    },
    setTargetBounds: function(newBounds) {
        var target = this.owner.targetMorph,
            oTL = this.originalTargetBounds.topLeft(),
            delta = newBounds.topLeft().subPt(oTL),
            alpha = target.getRotation(),
            x = Math.cos(alpha) * delta.x - Math.sin(alpha) * delta.y,
            y = Math.sin(alpha) * delta.x + Math.cos(alpha) * delta.y;

        delta = pt(x,y).scaleBy(target.getScale());

        target.setPosition(oTL.addPt(delta).addPt(target.getOrigin()));
        target.setExtent(newBounds.extent());
    },
    createInfoMorph: function(number) {
        if(!this.infoMorphs){
            this.infoMorphs = []; 
        }

        this.infoMorphs[number] = new lively.morphic.Text(new Rectangle(0,0,500,30),"");
        this.infoMorphs[number].beLabel({fontSize: 14, fill: Color.rgba(255,255,255,0.7)});
        this.infoMorphs[number].setScale(1/$world.getZoomLevel());

        $world.addMorph(this.infoMorphs[number]);
    },
    alignInfo: function() {
        if(!this.infoMorphs) {
            this.infoMorphs = [];
        }

        for(var i = 0; i < this.infoMorphs.length; i++){
            if(this.infoMorphs[i]){
                this.infoMorphs[i].align(
                    this.infoMorphs[i].bounds().bottomLeft().addPt(
                        pt(0,(this.infoMorphs[i].getExtent().y) * i * this.infoMorphs[i].getScale())
                    ),
                    this.owner.targetMorph.owner.worldPoint(this.owner.targetMorph.bounds().topLeft())
                );
            }
        }
    },
    setInfo: function(number, textStr) {
        if(!this.infoMorphs) {
            this.infoMorphs = [];
        }
        if(!this.infoMorphs[number]){
            this.createInfoMorph(number);
        }
        if(!this.infoMorphs[number].owner){
            $world.addMorph(this.infoMorphs[number]);
        }
        this.infoMorphs[number].setTextString(textStr);
        this.infoMorphs[number].fit();
        this.infoMorphs[number].setScale(1/$world.getZoomLevel());
    },






});
"selection", { },


lively.morphic.World.addMethods(
"TapEvents", {
    loadHoldIndicator: function() {
        if(UserAgent.isTouch){
            this.holdIndicator = this.loadPartItem("HoldIndicator", "PartsBin/iPadWidgets");
        }
    },
    initializeBrowserScrollForTouchEvents: function(touch) {
        this.emulatedScrolling = true;
        this.scrollStart = pt(document.body.scrollLeft, document.body.scrollTop);
        this.scrollTouchStart = pt(touch.clientX, touch.clientY);
    },
    endBrowserScrollForTouchEvents: function() {
        // enter comment here
        this.emulatedScrolling = false;
    },

    emulateBrowserScrollForTouchEvents: function(touch) {
        if(!this._emulatedScrollingTemporarilyDisabled){
            var touchDelta = pt(touch.clientX, touch.clientY).subPt(this.scrollTouchStart);
            var scrollTarget = this.scrollStart.subPt(touchDelta);
            window.scrollTo(scrollTarget.x, scrollTarget.y);
        }
    },


},
"TapThroughHalos", {
    onTap: function($super, evt) {
        $super(evt);
        if (this.currentHaloTarget && !this.isInEditMode()) {
            this.currentHaloTarget.removeHalos() 
        }
        this.setEditMode(false)
        // worldMenu.js integration!!!
        this.worldMenuMorph && this.worldMenuMorph.remove();
    },
    select: function() {
        this.updateSelection(null);
    },

    onMouseUp: function(evt) {
        evt.hand.removeOpenMenu(evt);
        if (!evt.isCommandKey() && (!this.clickedOnMorph || !this.clickedOnMorph.isHalo) && this.isInEditMode && !this.isInEditMode() && !this.ignoreHalos) {
            this.removeHalosOfCurrentHaloTarget();
        }
        // FIXME should be hand.draggedMorph!
        var draggedMorph = this.draggedMorph;
        if (draggedMorph) {
            this.clickedOnMorph = null
            this.draggedMorph = null;
            draggedMorph.onDragEnd(evt);
        }

        if (this.dispatchDrop(evt)) {
            this.clickedOnMorph = null
            this.draggedMorph = null;
            return true;
        }
        this.setEditMode && this.setEditMode(false)
        return false;
    },











},
"EditMode", { 
    isInEditMode: function() {
        return this.editMode
    },
    setEditMode: function(bool, optMorph) {
        if (optMorph) alertOK("setting edit mode to false from "+optMorph)
        this.editMode = bool;
        return bool;
    },
    showHoldIndicatorFor: function(morph) {

        if(morph.tapTouch && this.holdIndicator){
            this.addMorph(this.holdIndicator);
            this.holdIndicator.align(
                this.holdIndicator.bounds().center(),
                morph.tapTouch.pageStart
            );
            this.holdIndicator.start(morph);
        }
    },
    updateSelection: function(newSelectedMorph) {
        if(this.currentlySelectedMorph) {
            this.currentlySelectedMorph.deselect();
        }
        this.currentlySelectedMorph = newSelectedMorph;
    },

    scheduleHoldIndicatorFor: function(morph) {
        var that = this;
        this.holdIndicatorTimeout = window.setTimeout(function(){
            that.showHoldIndicatorFor(morph);
        }, 400);
    },
    cancelHold: function() {
        if(this.holdIndicatorTimeout) {
            window.clearTimeout(this.holdIndicatorTimeout);
        }
        if(this.holdIndicator) {
            this.holdIndicator.remove(); 
        }
    },




});


lively.morphic.Halo.addMethods("TouchToMouse", {
    onTouchStart: function (evt) {
        if(evt.touches.length==1){
            evt.preventDefault();
            var touch = evt.touches[0];
            touch.buttonFlag = "unknown";
        }
        evt.stop();
        return true;
    },
    onTouchMove: function(evt) {
        if(evt.touches.length === 1){
            evt.preventDefault();
            var touch = evt.touches[0];
            if(touch.buttonFlag === "unknown") {
                touch.buttonFlag = 0;
                this.fireMouseEvent('mousedown', touch, evt.target);
            }
            this.fireMouseEvent('mousemove', touch, evt.target);
        }
        evt.stop();
        return true;
    },
    onTouchEnd: function(evt) {
        if(evt.touches.length==0){
            var touch = evt.changedTouches[0];

            if(touch.buttonFlag === "unknown") {
                touch.buttonFlag = 0;
                this.fireMouseEvent('mousedown', touch, evt.target);
                this.fireMouseEvent('mouseup', touch, evt.target);
                this.fireMouseEvent('click', touch, evt.target);
            } else {
                this.fireMouseEvent('mouseup', touch, evt.target);
            }
        }
        evt.stop();
        return true;
    },
    foo: function() {
        alertOK("Halo")
    },
});
lively.morphic.Text.addMethods("TapEvents", {
    onTouchStart: function(evt) {
        evt.stopPropagation();
    },
    onTap: function(evt){
        evt.stopPropagation();
    },

    onTouchEnd: function(evt) {
        evt.stopPropagation();
    },
    onTouchMove: function(evt) {
        evt.stopPropagation();
    },


});
lively.morphic.Button.addMethods("TapEvents", {

    onTap: function(evt){
        this.setValue(true);
        this.setValue(false);
    },

});


cop.create("GestureEvents").refineClass(lively.morphic.Morph, {
    onGestureChange: function (evt) {
        if(this.areEventsIgnoredOrDisabled()){
            return false;
        }
        if (this.halosTemporaryInvisible) {
            this.setScale(evt.scale*this.originalScale);
            this.setRotation(this.originalRotation+evt.rotation/180*Math.PI);
            evt.stop()
        };
        if ($world.isInEditMode()) $world.setEditMode(false) 
    },
    onGestureStart: function(evt) {
        if(this.areEventsIgnoredOrDisabled()){
            return false;
        }
        if (this.showsHalos) {
            this.removeHalos();
            this.halosTemporaryInvisible = true
            this.setOrigin(this.getExtent().scaleBy(0.5));
            this.originalScale = this.getScale();
            this.originalRotation = this.getRotation();
            this.lastRotation = 0;
            evt.stop()
        };
    },
    onGestureEnd: function(evt) {
        if (this.areEventsIgnoredOrDisabled()){
            return false;
        }
        if (this != this.world() && this.halosTemporaryInvisible) {
            if (this.halosTemporaryInvisible) {
                this.showHalos();
                this.halosTemporaryInvisible = false
            }
            this.setOrigin(this.getExtent().scaleBy(0.5));
            this.originalScale = this.getScale();
            this.originalRotation = this.getRotation();
            evt.stop();
        }
    },
    setFixed: function(fixed, fixedPosition) {

        if(fixed && this.owner !== $world) {
            return;
        }

        this.isFixed = fixed;
        if(fixed) {
            this.fixedScale = this.getScale() * $world.getZoomLevel();
            this.fixedPosition = this.getPosition().subPt(pt(document.body.scrollLeft, document.body.scrollTop)).scaleBy($world.getZoomLevel());

            connect($world, "zoomLevel", this, "updateZoomScale");
            connect($world, "emulatedScrolling", this, "toggleScrolling");
            connect($world, "zoomingInProgress", this, "toggleScrolling");
            if(!fixedPosition) {
                connect($world, "scrollOffset", this, "updateScrollPosition");
            }
        } else {
            disconnect($world, "zoomLevel", this, "updateZoomScale");
            disconnect($world, "scrollOffset", this, "updateScrollPosition");
            disconnect($world, "emulatedScrolling", this, "toggleScrolling");
            disconnect($world, "zoomingInProgress", this, "toggleScrolling");
        }
        

    },
    setFixedPosition: function(position) {
        this.fixedPosition = position/*.subPt(pt(document.body.scrollLeft, document.body.scrollTop)).scaleBy($world.getZoomLevel())*/;
        this.updateScrollPosition($world.scrollOffset);
    },
    getFixedPosition: function() {
        return this.fixedPosition;//.scaleBy(1/$world.getZoomLevel());
    },


    toggleScrolling: function(isScrolling) {
        if(!this.isFixed) return
        if(isScrolling) {
            this.remove();
        } else {
            $world.addMorph(this);
        }
    },

    updateScrollPosition: function(newPosition) {
        this.setPosition(this.fixedPosition.scaleBy(1/$world.zoomLevel).addPt(newPosition));
    },

    updateZoomScale: function(newZoom) {
        if(this.fixedScale) {
            
            this.setScale(this.fixedScale/newZoom);
        }
    },
    removeFixed: function() {
        this.setFixed(false)
        this.remove()
    },
}).refineClass(lively.morphic.AbstractDialog, {
     buildPanel: function (bounds) {
        var out = cop.proceed(bounds);
        this.panel.setScale(1.5/$world.getZoomLevel());
    },
}).refineClass(lively.morphic.World, {
    onGestureStart:function (evt) {
        if(!this.pieMode){
            cop.proceed(evt);
            this.zoomingInProgress = true;
            this._emulatedScrollingTemporarilyDisabled = true;
        }
    },
    onGestureChange: function(evt) {
        if(!this.pieMode){

        }
    },
    onGestureEnd: function(evt) {
        if(!this.pieMode){
            window.setTimeout( function() { 
                $world.zoomLevel = $world.calculateCurrentZoom(); 
                $world.onWindowScroll();
                $world.zoomingInProgress = false;
            }, 1);
        }
    },
    calculateCurrentZoom: function() {
        if(UserAgent.isTouch) {
            return document.documentElement.clientWidth / window.innerWidth;
        }  else {
            return window.outerWidth / window.innerWidth;
        }

    },
    onWindowScroll: function(evt) {
        $world.scrollOffset = pt(window.pageXOffset,window.pageYOffset);
    },
    getZoomLevel: function() {
        if(!this.zoomLevel){
            this.zoomLevel = this.calculateCurrentZoom();
        }
        return this.zoomLevel;
    },
    getCurrentZoom: function() {
        return this.getZoomLevel();
    },

    onLoad: function() {
        this.zoomLevel = this.calculateCurrentZoom();
        this.onWindowScroll();
        cop.proceed();
    },
    openDialog: function(dialog) {
        return cop.proceed(dialog);
    },
    addStatusMessageMorph: function(morph, delay) {
        morph.setScale(1/this.getZoomLevel());
        if (!this.statusMessages) this.statusMessages = [];
        morph.isEpiMorph = true;
        this.addMorph(morph);
        morph.addScript(function onMouseUp(evt) {
            this.stayOpen = true;
            return $super(evt);
        })
        morph.addScript(function remove() {
            var world = this.world();
            if (world.statusMessages)
                world.statusMessages = world.statusMessages.without(this);
            return $super();
        })
        morph.align(morph.bounds().topRight(), this.visibleBounds().topRight());
        this.statusMessages.invoke('moveBy', pt(0, morph.getExtent().y / this.getZoomLevel()));
        this.statusMessages.push(morph);

        if (delay) {
            (function removeMsgMorph() {
                if (!morph.stayOpen) morph.remove()
            }).delay(delay);
        }

        return morph;
    },
    registerForGlobalEvents: function() {
        // enter comment here
        var self = this;
        document.body.onorientationchange = function (evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onOrientationChange(evt);
        }
        return cop.proceed();
    },
    onOrientationChange: function(evt) {
        this.zoomLevel = this.calculateCurrentZoom();
        this.onWindowScroll();
    },

}).refineClass(lively.morphic.BoundsHalo, {
    initialize: function (targetMorph) {
        cop.proceed(targetMorph);
        this.unregisterFromGestureEvents();
        this.disableEvents();
    },
}).beGlobal()

cop.create("IPadThemeLayer").refineClass(lively.morphic.World, {

morphMenuDefaultPartsItems: function () {
        var items = [],
            partNames = ["Rectangle", "Ellipse", "Image", "Text", 'Line'].sort();

        items.pushAll(partNames.collect(function(ea) { return [ea, function() {
            var partSpaceName = 'PartsBin/Basic',
                part = lively.PartsBin.getPart(ea, partSpaceName);
			      if (!part) return;
            lively.morphic.World.current().firstHand().grabMorph(part);
        }]}))
    
        items.pushAll(["TextField", "Button"].collect(function(ea) { return [ea, function() {
            var partSpaceName = 'PartsBin/iPadWidgets',
                part = lively.PartsBin.getPart(ea, partSpaceName);
			      if (!part) return;
            lively.morphic.World.current().firstHand().grabMorph(part);
        }]}))

        partNames = ["List", "Slider", "ScriptableButton"].sort()
        items.pushAll(partNames.collect(function(ea) { return [ea, function() {
            var partSpaceName = 'PartsBin/Inputs',
                part = lively.PartsBin.getPart(ea, partSpaceName);
			      if (!part) return;
            lively.morphic.World.current().firstHand().grabMorph(part);
        }]}))

        return items;
    },
    openObjectEditor: function() {
        return this.openPartItem('ObjectEditor', 'PartsBin/iPadWidgets');
    },
    openPartsBin: function (evt) {
        return this.openPartItem('PartsBinBrowser', 'PartsBin/iPadWidgets');
    },













    }).refineClass(lively.morphic.Slider, {
        onrestore: function () {
            cop.proceed();
            this.beIPadSlider.bind(this).delay(0);
        },
    beIPadSlider: function() {
        if (this.owner) {
        if (this.vertical()) {
                this.setExtent(pt(7, this.getExtent().y));
            }
            else {
                this.setExtent(pt(this.getExtent().x, 7));
            };
            this.adjustSliderParts();
            this.setBorderWidth(1);
            this.setBorderColor(Color.rgb(95,94,95));
            this.adjustSliderParts();
            this.setKnobFill();

            this.enlargeMorph()
    }
    },
      enlargeMorph: function() {
        if (this.sliderKnob.isEnlarged()) {
            return    
        }
        var largeSliderKnob = this.sliderKnob.copy()

        this.sliderKnob.addMorph(largeSliderKnob)
        largeSliderKnob.setScale(largeSliderKnob.getScale()*2) // define min/max size 
        largeSliderKnob.ignoreEvents()
        largeSliderKnob.disableSelection()
        largeSliderKnob.setFill(null)

        //largeSliderKnob.setFill(Color.rgba(200,200,200,0.3))
        largeSliderKnob.setBorderWidth(0)
        largeSliderKnob.setPosition(largeSliderKnob.getExtent().scaleBy(-0.5))
        this.sliderKnob.setOrigin(this.sliderKnob.bounds().topLeft().subPt(this.sliderKnob.getPosition()))
        this.disableSelection();
},




        updateFill: function(value) {
            if(this.inverted && this.inverted())
                var value = 1 - value;
            var align = this.vertical() ? 'northSouth' : 'eastWest';
            var bgStyle = new lively.morphic.LinearGradient(
                [
                    {offset: 0, color: Color.rgb(53,83,255)},
                    {offset: value, color: Color.rgb(53,83,255)},
                    {offset: Math.min(1,value+0.01), color: Color.white}                
                ],
                align
            );
            this.setFill(bgStyle);
        },
        setKnobFill: function() {
            var knobStyle= new lively.morphic.LinearGradient(
                [
                    {offset: 0, color: Color.darkGray.mixedWith(Color.white, 0.5)},
                    {offset: 0.3, color: Color.lightGray},
                    {offset: 1, color: Color.white}
                ]
            )
            this.sliderKnob.setFill(knobStyle);
        },
    adjustSliderParts: function() {
            if (!this.sliderKnob) return;
            // This method adjusts the slider for changes in value as well as geometry
            var val = this.getScaledValue();
            var bnds = this.shape.bounds();
            var knobMult = this.knobRatio || 3
            var ext = this.getSliderExtent(); 
            if (this.vertical()) { // more vertical...
                var offset = 0 - (this.sliderKnob.bounds().width / 2) + (this.getExtent().x / 2);
                this.sliderKnob.setPosition(pt(offset,this.sliderKnob.getPosition().y));
                var size = this.getExtent().x * knobMult;
                this.sliderKnob.setExtent(pt(size, size));
                var elevPix = Math.max(ext*bnds.height, this.mss); // thickness of elevator in pixels
                var topLeft = pt(this.sliderKnob.getPosition().x - this.sliderKnob.getOrigin().x, (bnds.height - elevPix)*val);
            } else { // more horizontal...
                var offset = 0 - (this.sliderKnob.bounds().height / 2) + (this.getExtent().y / 2);
                this.sliderKnob.setPosition(pt(this.sliderKnob.getPosition().x, offset));
                var size = this.getExtent().y * knobMult; 
                this.sliderKnob.setExtent(pt(size,size));
                var elevPix = Math.max(ext*bnds.width, this.mss); // thickness of elevator in pixels
                var topLeft = pt((bnds.width - elevPix)*val, this.sliderKnob.getPosition().y - this.sliderKnob.getOrigin().y);
            };
                
            this.sliderKnob.setPosition(topLeft.addPt(this.sliderKnob.getOrigin()));
            this.sliderKnob.setBorderRadius(13);
            this.sliderKnob.draggableWithoutHalo = true;
            this.updateFill(val);
        },
    setKnobRatio: function(num) {
        this.knobRatio = num;
    },
    getSliderExtent: function() {
    if (this.vertical()) 
        return (this.sliderKnob.getExtent().y)/(this.getExtent().y)
    else 
        return (this.sliderKnob.getExtent().x)/(this.getExtent().x)
    },


    }).refineClass(lively.morphic.Text, {
    beTextField: function() {
        this.shape.setPadding(pt(10,10).extent(pt(0,0)));
        this.setBorderRadius(13);
        this.setFill(Color.white)
        this.setBorderWidth(1);
        this.setBorderColor(Color.gray.mixedWith(Color.darkGray, 0.1))
    },
    beLabel: function(customStyle) {
        this.isLabel = true;
        var labelStyle = {
            fill: null,
            borderWidth: 0,
            fixedWidth: true,
            fixedHeight: true,
            allowInput: false,
            clipMode: 'hidden',
            handStyle: 'default',
        };
        this.shape.setPadding(pt(0,0).extent(pt(0,0)));
        this.setBorderRadius(0);
        if (customStyle) labelStyle = Object.merge([labelStyle, customStyle]);
        this.applyStyle(labelStyle);
        this.disableEvents();
        return this;
    },



    }).refineClass(lively.morphic.Button, {
        onrestore: function () {
            cop.proceed();
            this.beIPadButton();
        },
    initialize: function(bounds, labelString) {
        cop.proceed(bounds, labelString);
        this.beIPadButton(labelString);
    },

        setExtent: function(value) {
            var min = this.getMinExtent();
            value.maxPt(min,value);
            this.priorExtent = this.getExtent();
            this.shape.setExtent(value);
            if (this.layout){
                if (this.layout.adjustForNewBounds || this.layout.layouter) {
                    this.adjustForNewBounds();
                };
            };
            if (this.owner) {
                if (typeof this.owner['submorphResized'] == 'function') {
                    this.owner.submorphResized(this);
                };
            };
            if (this.label) {
                this.label.setExtent(value);
            };
            this.label && this.label.growOrShrinkToFit();
            this.adjustForNewBounds();
            return value;
        },
    beToolbarButton: function(labelString, optFontSize) {
        // enter comment here
        this.setExtent(pt(44,44))
        var fontSize = 16
        this.normalFill = null;
        this.lighterFill = Color.rgba(255,255,255,0.3);
        this.setFill(null);
        this.label.setFontSize(fontSize);
        this.setLabel(labelString);
        this.label.growOrShrinkToFit();
        this.adjustForNewBounds();
        this.label.setTextColor(Color.gray.mixedWith(Color.black, 0.7))
        this.setBorderRadius(3)
        this.setBorderWidth(0)
        this.label.emphasizeAll({fontWeight: "bold"})
        this.centerLabel();
        return this;
    },


    beIPadButton: function() {
        this.setBorderRadius(13);
        this.setBorderWidth(1);
        this.setBorderColor(Color.darkGray);
        this.setFill(Color.white);
        this.normalFill = Color.white;
        this.lighterFill = this.normalFill.mixedWith(Color.darkGray, 0.5);
        this.label.setBorderWidth(0);
        this.label.setTextColor(Color.rgb(53,83,255).mixedWith(Color.black, 0.5));
        this.label.setPadding(pt(0,0).extent(pt(0,0)));
        this.centerLabel();
    },
    onTouchStart: function (evt) {
        // to react on touches with color changes
        var color = this.lighterFill || this.getFill();
        this.setFill(color);
        return cop.proceed(evt);
    },
    onTouchEnd: function (evt) {
        // see on touch start
        var color = this.normalFill || this.getFill();
        this.setFill(color);
        return cop.proceed(evt);
    },
    centerLabel: function() {
        this.label.layout = this.label.layout || {};
        this.layout = this.layout || {};
        this.layout.adjustForNewBounds = true;
        this.label.layout.centeredVertical = true;
        this.label.layout.centeredHorizontal = true;
        this.adjustForNewBounds();

    },











    }).refineClass(lively.morphic.TitleBar, {
        onrestore: function () {
            cop.proceed();
            this.beTaskBar.bind(this).delay(0);
        },
    beTaskBar: function() {
        this.applyTaskBarStyle();
        this.adjustForNewBounds();
        this.draggableWithoutHalo = true;
        this.windowMorph.targetMorph.align(this.windowMorph.targetMorph.getBounds().topLeft(), this.getBounds().bottomLeft())
        this.windowMorph.targetMorph.setExtent(pt(this.windowMorph.getExtent().x, this.windowMorph.getExtent().y-this.getExtent().y))
    },
    applyTaskBarStyle: function() {
        var barHeight = 44;
        var that = this;
        this.setExtent(pt(this.getExtent().x, barHeight));
        this.setBorderWidth(0);
        this.windowMorph.setBorderWidth(0);
        this.submorphs.each(function (ea) {
            if (ea.constructor === lively.morphic.Button){
                if (ea.beToolbarButton && ea.label && ea.label.getTextString) {
                    ea.beToolbarButton(ea.label.getTextString());
                    if (!(ea === that.closeButton 
                            || ea === that.menuButton
                            || ea === that.collapseButton)) {
                        ea.setPosition(pt(barHeight*ea.orderInTaskBar, ea.getPosition().y));
                    }
                }
            }
        })
        this.closeButton.beToolbarButton("X");
        this.closeButton.setPosition(pt(this.getExtent().x-this.closeButton.getExtent().x,0));
        this.collapseButton.beToolbarButton("-");
        this.collapseButton.setPosition(pt(
            this.closeButton.getPosition().x-this.collapseButton.getExtent().x,0)
        );
        this.menuButton.beToolbarButton("M");
        this.menuButton.setPosition(pt(0,0))
        this.applyStyle({borderRadius: "3px 3px 0px 0px",});
        this.label.emphasizeAll({fontWeight: "bold",});
      },

    centerLabel: function() {
        this.label.fixedWidth = false;
        if (this.label.layout) {
            this.label.layout.resizeWidth = false;
            this.label.layout.centeredVertical = true;
        }
        this.label.growOrShrinkToFit();
    },

    adjustForNewBounds: function() {
        cop.proceed();
        this.menuButton.setPosition(pt(0,0));
        this.closeButton.setPosition(pt(this.getExtent().x-this.closeButton.getExtent().x,0))
        this.collapseButton.setPosition(pt(this.closeButton.getPosition().x-this.collapseButton.getExtent().x,0))
    },

    initialize: function(headline, windowWidth, windowMorph, optSuppressControls) {
        cop.proceed(headline, windowWidth, windowMorph, optSuppressControls);
        this.beTaskBar.bind(this).delay(0);
    },



    }).refineClass(lively.morphic.Menu, {
        openAt: function(pos, title, items) {
            $world.loadWorldMenu();
        },
    }).refineClass(lively.morphic.SliderKnob, {
        onDrag: function(evt) {
        // the hitpoint is the offset that make the slider move smooth
        if (!this.hitPoint) return; // we were not clicked on...

        // Compute the value from a new mouse point, and emit it
        var delta = evt.getPosition().subPt(this.hitPoint),
            p = this.bounds().topLeft().addPt(delta).subPt(this.getOrigin()),
            bnds = this.slider.innerBounds(),
            ext = this.slider.getSliderExtent();

        this.hitPoint = evt.getPosition()
        if (this.slider.vertical()) {
            // thickness of elevator in pixels
            var elevPix = Math.max(ext*bnds.height,this.slider.mss),
                newValue = p.y / (bnds.height-elevPix);
        } else {
            // thickness of elevator in pixels
            var elevPix = Math.max(ext*bnds.width,this.slider.mss),
                newValue =  p.x / (bnds.width-elevPix);
        }

        if (isNaN(newValue)) newValue = 0;
        this.slider.setScaledValue(this.slider.clipValue(newValue));
    },
    isEnlarged: function() {
        return this.submorphs.length != 0
    },

    })
.beGlobal();

}) // end of module