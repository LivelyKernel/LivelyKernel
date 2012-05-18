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

cop.create('DoubleTapSelection').refineClass(lively.morphic.Button,{
    onDoubleTap: function(){
        this.select();
    },
}).refineClass(lively.morphic.Text,{
    onDoubleTap: function(evt){
        this.select();
        evt.stop();
    },
    appendTextHTML: function(ctx) {
        if (!ctx.morphNode) throw dbgOn(new Error('appendText: no morphNode!'))
        if (!ctx.shapeNode) throw dbgOn(new Error('appendText: no shapeNode!'))
        if (!ctx.textNode) throw dbgOn(new Error('appendText: no textNode!'))

        ctx.shapeNode.insertBefore(ctx.textNode, ctx.shapeNode.firstChild); // instead of appendChild
    }
}).refineClass(lively.morphic.Morph,{
    tapped: function(evt) {
        var doubleTapTimeout = 250,
            that = this;
            
        if (this.lastTap && new Date() - this.lastTap <= doubleTapTimeout) {
            if (typeof this.onDoubleTap === "function") {
                this.lastTap.event.doNotTap = true;
                this.lastTap = false;
                this.onDoubleTap(evt);
            }

        } else {
            if (typeof this.onTap === "function") {
                window.setTimeout(function () {
                    if (that.lastTap && !that.lastTap.event.doNotTap) {
                        that.onTap(evt);
                    }
                }, doubleTapTimeout);
            }
            this.lastTap = new Date();
            this.lastTap.event = evt;
        }
    },


});

cop.create('TouchAndHoldSelection').refineClass(lively.morphic.Button,{
    onHold: function(){
        this.select();
    },
}).refineClass(lively.morphic.Text,{
    onHold: function(){
        this.select();
    },
    appendTextHTML: function(ctx) {
        if (!ctx.morphNode) throw dbgOn(new Error('appendText: no morphNode!'))
        if (!ctx.shapeNode) throw dbgOn(new Error('appendText: no shapeNode!'))
        if (!ctx.textNode) throw dbgOn(new Error('appendText: no textNode!'))

        ctx.shapeNode.insertBefore(ctx.textNode, ctx.shapeNode.firstChild); // instead of appendChild
    }
});
cop.create('SelectionMode').refineClass(lively.morphic.World, {
    ensureSelectionMorph: function() {
        if(!this.selectionModeButton){
            this.selectionModeButton = new lively.morphic.Button(rect(0,0,44,44));
            this.selectionModeButton.setExtent(pt(100,84));
            this.selectionModeButton.setLabel("activate selection mode");

            this.selectionModeButton.label.beLabel({
                textColor: Color.white,
                emphasize: {textShadow: null}
            });
            this.selectionModeButton.lighterFill = new lively.morphic.LinearGradient(
                [
                    {offset: 0, color: Color.rgb(49,79,255)},
                    {offset: 0.59, color: Color.rgb(53,83,255)},
                    {offset: 0.63, color: Color.rgb(79,105,255)},
                    {offset: 1, color: Color.rgb(112,134,255)}
                ],
                'southNorth'
            );
            this.selectionModeButton.normalFill = new lively.morphic.LinearGradient(
                [
                    {offset: 0, color: Color.rgb(0,0,0)},
                    {offset: 0.59, color: Color.rgb(59,59,59)},
                    {offset: 0.63, color: Color.rgb(86,86,86)},
                    {offset: 1, color: Color.rgb(139,139,139)}
                ],
                'southNorth'
            );
            this.selectionModeButton.setFill(this.selectionModeButton.normalFill);
            this.selectionModeButton.onTouchStart = function(){};
            this.selectionModeButton.onTouchEnd = function(){};
            this.selectionModeButton.onTap = function(){
                this.toggle();
            };
            this.selectionModeButton.toggle = function(){
                this.isActivated = !this.isActivated;
                if(this.isActivated){
                    this.setFill(this.lighterFill);
                    $world.activateSelection();
                } else {
                    this.setFill(this.normalFill);
                    $world.deactivateSelection();
                }
            }
        }
        this.addMorph(this.selectionModeButton);

        this.selectionModeButton.setFixed(true);
        this.selectionModeButton.fixedScale = 1;
        this.selectionModeButton.fixedPosition = pt(0,0);
    },
    deactivateSelection: function() {
        $world.select();
        this.selectionActivated = false;
    },
    activateSelection: function() {
        this.selectionActivated = true;
    },


}).refineClass(lively.morphic.Morph, {
    onTap: function(evt){
        if(this.world().selectionActivated){
            this.select();
            evt.stop();
        } else {
            return cop.proceed(evt);
        }
    }
}).refineClass(lively.morphic.Button, {
    onTap: function(evt){
        if(this.world().selectionActivated){
            this.select();
            evt.stop();
        } else {
            return cop.proceed(evt);
        }
    }
}).refineClass(lively.morphic.Text, {
    onTap: function(evt){
        if(this.world().selectionActivated){
            this.select();
            evt.stop();
        } else {
            return cop.proceed(evt);
        }
    }
});
SelectionMode.beGlobal = function(){
  cop.enableLayer(this);
  $world.ensureSelectionMorph();
  return this;
};
lively.morphic.Box.subclass('lively.morphic.TouchList',
'initializing', {
    initialize: function($super, bounds, optItems) {
        $super(bounds);
        this.itemList = [];
        this.selection = null;
        this.selectedLineNo = -1;

        this.createList();
        this.disableSelection();

        this.reset();
        //if (optItems) this.updateList(optItems);
    },
    createList: function() {
        // enter comment here
        this.setExtent(pt(348,281));
        this.addMorph(this.createSubmenuContainer());
    },
    createSubmenuContainer: function() {
        var container = new lively.morphic.Box(rect(0,0,10,10));
        container.setExtent(pt(348,281));
        container.name = "SubmenuContainer";
        container.addMorph(this.createListItemContainer());
        return container;
    },
    createListItemContainer: function() {
        var container = new lively.morphic.ListItemContainer(rect(0,0,10,10));
        container.setExtent(pt(348.0,41.9));
        return container;
        
    },
    reset: function() {
        this.disableDropping();
        this.submorphs.invoke('disableDropping');
        this.setup([]);
    },
    setup: function(itemList) {
    this.selection = null;
    this.selectedLineNo = -1;
    this.selectedMorph = null;
    this.setClipMode("hidden");
    this.titleStack = [];
    this.containerStack = [];
    var container = this.getCurrentContainer();
    this.get("SubmenuContainer").removeAllMorphs();
    this.get("SubmenuContainer").addMorph(container);
    this.currentContainer = container;
    this.get("SubmenuContainer").setPosition(pt(0,0));
    this.submenusDisabled = false;
    //world menu entries
    this.createMenuItems(itemList);
    },





},
'list interface', {
    addItem: function(item) {
        var newMorph = this.createListItem(item);
        this.getCurrentContainer().addItem(newMorph);
    },
    updateSelection: function(newSelectedMorph) {
    var hasText = true;
    if(this.selectedMorph) {
        hasText = this.selectedMorph.submorphs[0];
        this.selectedMorph.setFill(
            new lively.morphic.LinearGradient(
            [
                {offset: 0, color: Color.rgb(253,253,253)},
                {offset: 1, color: Color.rgb(238,238,238)}
            ],
            'northSouth'
            )
        );
        if(hasText) {        this.selectedMorph.submorphs[0].setTextColor(Color.rgb(47,47,47));
        }
    }
    hasText = newSelectedMorph.submorphs[0];

    
    if(hasText) {
        this.selection = newSelectedMorph.item.value;
        if (this.selection[1] instanceof Array && !this.submenusDisabled) {
            this.openSubMenu(this.selection);
            return;
        }
        
    } else {
        this.selection = null;
    }
    this.selectedLineNo = newSelectedMorph.index;
    this.selectedMorph = newSelectedMorph;
    
    this.selectedMorph.setFill(
new lively.morphic.LinearGradient(
        [
            {offset: 0, color: Color.rgb(47,47,47)},
            {offset:0.5,color: Color.rgb(21,21,21)},
            {offset: 1, color: Color.rgb(0,0,0)}
        ],
        'northSouth'
    ));
    
    if(hasText) {
        this.selectedMorph.submorphs[0].setTextColor(Color.rgb(222,222,222));
    }
    },
    openSubMenu: function(selection) {
        (function () {
            this.titleStack.push(this.title);
            this.containerStack.push(this.getCurrentContainer());
            this.title = selection[0];

            var offset = this.getExtent().x * this.getLevel();

            var container;
            if(this.nextContainer){
                container = this.nextContainer;
                delete this.nextContainer;
            } else {
                container = this.createContainer();
            }
            container.setPosition(pt(offset, 0));
            this.get("SubmenuContainer").addMorph(container);
    
            this.currentContainer = container;
            this.addMenuItems(selection[1]);

            var that = this;
            this.get("SubmenuContainer").setPositionAnimated(pt(-offset, 0), 500, function(){
                that.nextContainer = that.createContainer();
            });

        }).bind(this).delay(0);
    },
    openSuperMenu: function() {
    if(this.getLevel() <= 0) {
        return;
    }
    this.title = this.titleStack.pop();
    
    var offset = this.getExtent().x * this.getLevel();

    var that = this;
    var callbackFct = function() {
        that.getCurrentContainer().remove();
        that.currentContainer = that.containerStack.pop();
    };
    this.get("SubmenuContainer").setPositionAnimated(pt(-offset, 0), 500, callbackFct);
    },
    updateList: function(items) {
    this.selection = null;
    this.selectedLineNo = -1;
    this.selectedMorph = null;
    this.setClipMode("hidden");
    this.titleStack = [];
    this.containerStack = [];
    var container = this.getCurrentContainer();
    this.get("SubmenuContainer").removeAllMorphs();
    this.get("SubmenuContainer").addMorph(container);
    this.currentContainer = container;
    this.get("SubmenuContainer").setPosition(pt(0,0));
    //world menu entries
    this.removeAllMenuItems();
    this.submenusDisabled = true;
    var that = this;
    items.forEach(function (item) {
        that.addItem({string: item, value: item, isListItem: true});
    });
    },




},
'events', {
    onTouchStart: function(evt) {
        this.getCurrentContainer().onTouchStart(evt);
    },
    onTouchMove: function(evt) {
        this.getCurrentContainer().onTouchMove(evt);
    },
    onTouchEnd: function(evt) {
        this.getCurrentContainer().onTouchEnd(evt);
    },


},
'private functions', {
    getCurrentContainer: function() {
    if(!this.currentContainer){
        this.currentContainer = this.get("SubmenuContainer").submorphs[0];
    }
    return this.currentContainer;
    },
    createMenuItems: function(items) {
    this.removeAllMenuItems();
    this.addMenuItems(items);
    },
    addMenuItems: function(items) {
    var that = this;
    items.forEach(function (item) {
        if(typeof item === "string") {
            that.addItem({string: item, value: item, isListItem: true});
        } else {
            that.addItem({string: item[0], value: item, isListItem: true});
        }
        
    });
    },

    removeAllMenuItems: function() {
    this.getCurrentContainer().removeAllMenuItems();
    while(this.containerStack.length > 0){
        this.getCurrentContainer().remove();
        this.currentContainer = containerStack.pop();
        this.currentContainer.removeAllMenuItems();
    }
    this.containerPrototype = this.createContainerPrototype();
    this.nextContainer = this.createContainer();
    this.titleStack = [];
    this.containerStack = [];
    },
    createContainerPrototype: function() {
    var container = this.getCurrentContainer().copy();
    container.removeAllMenuItems();
    return container;
    },
    createContainer: function() {
    var container = this.containerPrototype.copy();
    container.removeAllMenuItems();
    return container;
    },
    createListItem: function(item) {
    //TODO: It should take texts as well as objects to provide list interface compatability
    var textString = item.string;
    var part = new lively.morphic.ListItem(window.rect(0,0,10,10));
    part.disableSelection();
    part.name = "MenuItem_" + textString;
    part.item = item;

    part.applyStyle({
        extent: pt(this.getExtent().x,44),
        fill: new lively.morphic.LinearGradient(
            [
                {offset: 0, color: Color.rgb(253,253,253)},
                {offset: 1, color: Color.rgb(238,238,238)}
            ],
            'northSouth'
        ),
        resizeWidth: true,
        borderColor: Color.rgb(138,138,138),
        borderWidth: 1
    });

    var text = new TextMorph(new Rectangle(0,0,this.getExtent().x,44));
    text.applyStyle({fill: null, borderWidth: 0, borderColor: null});
    text.setFontSize(14);
    text.setTextColor(Color.rgb(47,47,47));
    text.setFontFamily("Helvetica, Arial, sans-serif");
    
    text.setPosition(pt(10,10));
    text.textString = textString;

    text.emphasizeAll({fontWeight: 'bold'});
    text.disableHalos();
    text.disableSelection();
    text.ignoreEvents();
    part.addMorph(text);

    if (item.value[1] instanceof Array && !this.submenusDisabled) {
        var rect = new Rectangle(0,0, 15, 15),
        icon = new lively.morphic.Image(rect, "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/ipadMenu/submenu.png", false);
    var xPos = part.getExtent().subPt(icon.getExtent().scaleBy(1.5)).x,
        yPos = part.getExtent().subPt(icon.getExtent()).scaleBy(0.5).y;
    
        icon.setPosition(pt(xPos,yPos))
        icon.disableHalos();
        icon.disableSelection();
        icon.ignoreEvents();
        part.addMorph(icon)
    }

    return part;
    },
    getLevel: function() {
        return this.titleStack.length;
    },






});
lively.morphic.Box.subclass('lively.morphic.ListItemContainer',
'default category', {
    isInBounds: function() {
        var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
        var delta = this.getPosition().y-yPos;

        return Math.abs(delta)<=0.02;
    },
    onTouchEnd: function(evt) {
    var lastUpdate = new Date().valueOf();
    this.isTouched = false;
    var that = this;
    if(!this.isInBounds()) {
        this.velocity = 0;
        var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
        this.setPositionAnimated(pt(this.getPosition().x,yPos),500)
    }
    },
    onTouchMove: function(evt) {
    evt.stop();

    var touch = evt.touches[0];
    
    if(touch && touch.originalDragOffset) {
        var x = this.getPosition().x;

        var delta = (touch.clientY - touch.originalDragOffset) / this.owner.owner.owner.getScale();
        //this.setPosition(pt(x,touch.originalMenuOffset+delta));
        this.setPositionAnimated(pt(x,touch.originalMenuOffset+delta),0);
        if(!this.isInBounds()) {
            var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
            delta = this.getPosition().y-yPos;
            //this.moveBy(pt(0,-delta/2));
            this.moveByAnimated(pt(0,-delta/2),0)
        }

        var positionDelta = touch.lastTouch - touch.clientY;
        var now = new Date().valueOf();
        var timeDelta = now - touch.lastUpdate;

        timeDelta = Math.max(1, timeDelta);

        touch.lastTouch = touch.clientY;
        touch.lastUpdate = now;
        
        this.velocity = positionDelta*(-10 / timeDelta);
    }
    return true;

    },
    onTouchStart: function(evt) {
    evt.stop();

    var touch = evt.touches[0];

    if(touch) {
        touch.originalDragOffset = touch.clientY;
        touch.originalMenuOffset = this.getPosition().y;

        var heightMenu = this.itemList.length * 43;
        var heightContainer = this.owner.getExtent().y;
        this.maxScroll = heightMenu - heightContainer;

        this.isTouched = true;
        this.velocity = 0;
        touch.lastTouch = touch.clientY;
        touch.lastUpdate = new Date().valueOf();
    }
    return true;
    },
    stayInBounds: function() {
        var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
    var delta = this.getPosition().y-yPos;

    if(this.velocity*delta > 0) {
        // out of bounds and velocity is in wrong direction
        this.velocity -= delta/15;
    } else if(delta !== 0) {
        this.velocity = -delta/15;
    }
    },
    initialize: function($super, bounds) {
        $super(bounds);
        this.itemList = [];
    },
    removeAllMenuItems: function() {
    this.itemList = [];
    this.setPosition(pt(0,0));
    //TODO: invoke remove on submorphs.copy instead?
    this.submorphs.invoke("remove");
    },
    addItem: function(morph) {
    morph.disableDropping();
    this.itemList = this.itemList || [];
    morph.setPosition(pt(0,this.itemList.length*43));
    this.itemList.push(morph);
    this.addMorph(morph);
    },







});
lively.morphic.Box.subclass('lively.morphic.ListItem',
'default category', {
    initialize: function($super, bounds) {
        $super(bounds);
    },
    onTouchStart: function(evt) {
    var touch = evt.touches[0];

    this.clickPosition = pt(touch.clientX,touch.clientY);
    this.lastClickPos = this.clickPosition;

    return false;
    },
    onTouchMove: function(evt) {
    var touch = evt.touches[0];
    
    this.lastClickPos = pt(touch.clientX,touch.clientY);

    return false;
    },
    onTouchEnd: function(evt) {
    var deltaPt = this.lastClickPos.subPt(this.clickPosition);
    var delta = deltaPt.x*deltaPt.x + deltaPt.y*deltaPt.y;
    if(delta<25) {
        //TODO: find a better way to find the related listMorph
        var listMorph = this.owner.owner.owner;

        if(listMorph && listMorph.updateSelection) {
            listMorph.updateSelection(this);
        }
    }
    return false;
    },



});

cop.create('worldMenu').refineClass(lively.morphic.World, {
    onrestore: function(){
        cop.proceed();
        connect(lively.morphic.World, "currentWorld", this, "loadTouchMenu");
    },
    loadTouchMenu: function() {
        this.touchMenuPrototype = this.loadPartItem("TouchMenu", "PartsBin/iPadWidgets");
    },
    showTouchMenuAt: function (pos, fixed) {
        var touchMenu = this.touchMenuPrototype;

        var pagePosition = pos;
        var screenPos = pagePosition.subPt(pt(document.body.scrollLeft, document.body.scrollTop)).scaleBy($world.getZoomLevel());

        touchMenu.setPosition(pos);
        if(screenPos.y > document.documentElement.clientHeight / 2) {
            touchMenu.moveBy(pt(0, -(touchMenu.getExtent().y + 1 * touchMenu.get("Triangle").getExtent().y)).scaleBy(1 / $world.getZoomLevel()));
            touchMenu.movePointerToBottom();
        } else {
            touchMenu.movePointerToTop();
        }

        if(screenPos.x < touchMenu.getExtent().x / 2) {
            touchMenu.moveBy(pt(touchMenu.getExtent().x / 2 - screenPos.x, 0).scaleBy(1 / $world.getZoomLevel()));
            touchMenu.get("Triangle").moveBy(pt(- touchMenu.getExtent().x / 2 + screenPos.x,0));
        }
        if(screenPos.x > document.documentElement.clientWidth - touchMenu.getExtent().x / 2) {
            var delta = document.documentElement.clientWidth - screenPos.x;
            touchMenu.moveBy(pt( -touchMenu.getExtent().x / 2 + delta, 0).scaleBy(1 / $world.getZoomLevel()));
            touchMenu.get("Triangle").moveBy(pt(+touchMenu.getExtent().x/2-delta,0));
        }


        this.addBlockerWith(touchMenu);
        if(fixed) {
            touchMenu.setFixed(true, true);    
        }
        return touchMenu;
    },
    addBlockerWith: function(menu) {
        var blocker = Morph.makeRectangle(rect(0,0,10,10));
        blocker.setExtent(this.getExtent());
        blocker.setPosition(pt(0,0));
        blocker.disableDropping();
        blocker.disableSelection();
        blocker.applyStyle({
            fill: null,
            opacity: 1,
        });
        menu.pinned = false;
        menu.get('PinButton').inactiveBackground();
        blocker.addMorph(menu);
        blocker.touchMenu = menu;
        blocker.addScript(function remove(optRemoveMenu) {
            if (optRemoveMenu) {
                this.touchMenu.removeFixed();
            } else {
                this.touchMenu = undefined;
            }
            $super();
        });
        connect(blocker, "onTap", blocker, "remove");
        connect(blocker, "onClick", blocker, "remove");
        connect(menu, "remove", blocker, "remove", {removeAfterUpdate: true});
        
        this.addMorph(blocker);
    },

    onHold: function(touch) {
        var items = this.morphMenuItems();
        var that = this;
        items[0][1] = function () {
            var loadingMorph = that.loadingMorph.copy();
            loadingMorph.loadPartByName("PartsBinBrowser", "PartsBin/iPadWidgets", true);
        }
        var menu = this.showTouchMenuAt(touch.pageStart, true);
        menu.targetMorph = this;
        menu.setup(items);
    },
    addTextWindow: function (spec) {
        // FIXME: typecheck the spec
        if (Object.isString(spec.valueOf())) spec = {content: spec}; // convenience
        var extent = spec.extent || pt(500, 200),
            wrapper = lively.PartsBin.getPart("Rectangle", "PartsBin/Basic"),
            textMorph = new lively.morphic.Text(extent.extentAsRectangle(), spec.content || ""),
            doitButton = lively.PartsBin.getPart("DoitButton", "PartsBin/iPadWidgets"),
            doAllButton = lively.PartsBin.getPart("DoAllButton", "PartsBin/iPadWidgets"),
            saveButton = lively.PartsBin.getPart("SaveButton", "PartsBin/iPadWidgets"),
            printButton = lively.PartsBin.getPart("PrintButton", "PartsBin/iPadWidgets");
        wrapper.setExtent(extent.addXY(0, 24));
        wrapper.addMorph(doitButton);
        wrapper.addMorph(doAllButton);
        wrapper.addMorph(saveButton);
        wrapper.addMorph(printButton);
        wrapper.addMorph(textMorph);
        doitButton.moveBy(pt(2, 2));
        doAllButton.moveBy(pt(doAllButton.getExtent().x+2*2, 2));
        saveButton.moveBy(pt(2*saveButton.getExtent().x+3*2, 2));
        printButton.moveBy(pt(3*saveButton.getExtent().x+4*2, 2));
        doitButton.textMorph = textMorph;
        doAllButton.textMorph = textMorph;
        saveButton.textMorph = textMorph;
        printButton.textMorph = textMorph;
        textMorph.moveBy(pt(0, 35));
        pane = this.internalAddWindow(wrapper, spec.title, spec.position);
        wrapper.applyStyle({
            fill: Color.rgb(255,255,255),
            adjustForNewBounds: true,
            resizeWidth: true, resizeHeight: true
        });
        textMorph.applyStyle({
            clipMode: 'auto',
            fixedWidth: true, fixedHeight: true,
            resizeWidth: true, resizeHeight: true,
            syntaxHighlighting: spec.syntaxHighlighting});
        return textMorph;
    },
    morphMenuDefaultPartsItems: function() {
        var items = [],
            partNames = ["Rectangle", "Ellipse", "Image", "Text", 'Line'].sort();

        items.pushAll(partNames.collect(function(ea) { return [ea, function(evt, menuMorph) {
            var partSpaceName = 'PartsBin/Basic',
                part = lively.PartsBin.getPart(ea, partSpaceName);
            if (!part) {
                return;
            }
            if(UserAgent.isTouch) {
                part.openInWorld();
                //part.align(part.bounds().topLeft(), menuMorph.bounds().topRight());
                part.align(part.bounds().center(), $world.visibleBounds().center());
                $world.setEditMode(true);
                part.select();
            } else {
                lively.morphic.World.current().firstHand().grabMorph(part);
            }
            
        }]}));


        partNames = ["List", "Slider", "ScriptableButton", "Button"].sort()
        items.pushAll(partNames.collect(function(ea) { return [ea, function(evt, menuMorph) {
            var partSpaceName = 'PartsBin/Inputs',
                part = lively.PartsBin.getPart(ea, partSpaceName);
            if (!part) {
                return;
            }
            if(UserAgent.isTouch) {
                part.openInWorld();
                part.align(part.bounds().topLeft(), menuMorph.bounds().topRight());
                $world.setEditMode(true);
                part.showHalos();
            } else {
                lively.morphic.World.current().firstHand().grabMorph(part);
            }
        }]}));

        return items;
    },


}).refineClass(lively.morphic.Morph, {
    openMorphMenuAt: function(pos, itemFilter) {
        if (!(itemFilter instanceof Function)) {
            itemFilter = function (items) { return items }
        }
        var menu = $world.showTouchMenuAt(pos, true);
        menu.targetMorph = this;
        menu.setup(itemFilter(this.morphMenuItems()));
        return menu
    },
}).beGlobal();

lively.morphic.World.addMethods(
"scrolling", {
    startFollowingHand: function() {
        connect(this.firstHand(), "position", this, "followHand");
    },
    stopFollowingHand: function() {
        disconnect(this.firstHand(), "position", this, "followHand");
    },


    followHand: function(val) {
        var handPosition = val.subPt(pt(
                document.body.scrollLeft, 
                document.body.scrollTop)
            ).scaleBy(
                $world.getZoomLevel()
            ),
            x = handPosition.x,
            y = handPosition.y,
            scrollThreshold = 50;

        console.log(handPosition.toString());

        if(x < scrollThreshold ){
            window.scrollBy(x-scrollThreshold , 0);
        }
        if(x > document.documentElement.clientWidth - scrollThreshold ){
            window.scrollBy(x + scrollThreshold - document.documentElement.clientWidth, 0);
        }
        if(y < scrollThreshold ){
            window.scrollBy(0, y-scrollThreshold );
        }
        if(y > document.documentElement.clientHeight - scrollThreshold ){
            window.scrollBy(0, y + scrollThreshold - document.documentElement.clientHeight);
        }


    },
});
cop.create("morphMenuTools").refineClass(lively.morphic.Morph, {
    morphMenuItems: function() {
        var a = cop.proceed();
        var self = this;
        if( this != $world) {
            if(this.isFixed) {
                a.push(["set unfixed", function() {
                    self.setFixed(false);
                }]);
            } else {
                a.push(["set fixed", function() {
                    self.setFixed(true);
                }]);
            }

            a.push(["tools", [  ['inspect', function() {
                                    $world.openInspectorFor(self)
                                }],
                                ['edit', function() {
                                    $world.openObjectEditorFor(self)
                                }],
                                ['style', 
                                [ ['Fill', function() {
                                    $world.openColorStylerFor(self);
                                }],
                                ['Border', function() {
                                $world.openBorderStylerFor(self);}],
                                ['Layout', function() {
                                $world.openLayoutStylerFor(self);}]
                                ]
                                ]
                            ]    
                    ])
        }
        return a;
    },
}).refineClass(lively.morphic.World, {
    openColorStylerFor: function(target){
        if(!this.colorStyler) {
            this.colorStyler = this.openPartItem('ColorChooser', 'PartsBin/BP2012');
        } else {
            this.addMorph(this.colorStyler)
        }
        target.showHalos()

    },
    openBorderStylerFor: function(target){
        if(!this.borderStyler) {
            this.borderStyler = this.openPartItem('BorderStyler', 'PartsBin/BP2012');
        } else {
            this.addMorph(this.borderStyler)
        }
        target.showHalos()
},
    openLayoutStylerFor: function(target){
        if(!this.layoutStyler) {
            this.layoutStyler = this.openPartItem('LayoutStyler', 'PartsBin/BP2012');
        } else {
            this.addMorph(this.layoutStyler)
        }
        target.showHalos()
},}).beGlobal()


    lively.morphic.Morph.addMethods(
        "PieMenu", {
            showPieMenu: function(position){
                if(this.showsPie || !this.world() || this.pieDisabled){
                    return;
                }
                
                if(this.showTimeout){
                    window.clearTimeout(this.showTimeout);
                    delete this.showTimeout;
                }
                
                this.showsPie = true;
                //this.halos = this.getHalos();
                var pieMenu = this.world().showPieFor(this, this.pieItems);
                console.log("pie menu bounds: "+pieMenu.bounds());
                console.log("position: "+position);
                pieMenu.align(pieMenu.bounds().center(), position);
            },
        
            getPieItemClasses: function() {
                return [
                    lively.morphic.DragPieItem,
                    lively.morphic.ScalePieItem,
                    lively.morphic.RotatePieItem,
                    lively.morphic.ConnectPieItem,
                    lively.morphic.GrabPieItem,
                    lively.morphic.CopyPieItem,
                    lively.morphic.MenuPieItem,
                    lively.morphic.ClosePieItem
                ];
            },
            getPieItems: function() {
                return this.getPieItemClasses().map(function(ea) { return new ea(this) }, this)
            },
    removePieMenu: function() {
        this.showsPie = false;
        $world.pieMenu && $world.pieMenu.remove()
    },
    doPieBehavior: function(evt) {
        var newPos = pt( this.pieTouch.screenX, this.pieTouch.screenY);
        var delta = newPos.subPt(this.pieTouch.screenStart);

        var item = this.getPieItemAtDirection(delta);

        if (delta.r() > 80) {
            this.activatePieItem(item, evt);
        } else if (delta.r() > 40 && this.enteredItem !== item) {
            if (this.enteredItem) {
                this.enteredItem.leave();
            }
            item.enter();
            this.enteredItem = item;
        } else if(delta.r() <= 40 && this.enteredItem) {
            this.enteredItem.leave();
            this.enteredItem = null;
        }
    },

    pieStart: function(evt) {
        if(evt.changedTouches.length === 1){
            this.pieItems = this.getPieItems();
            this.pieTouch = evt.changedTouches[0];
            this.pieTouch.screenStart = pt(this.pieTouch.screenX, this.pieTouch.screenY);
            this.pieTouch.pageStart = pt(this.pieTouch.pageX, this.pieTouch.pageY);

            this.activatedPieItem = null;

            var clientPos = pt(this.pieTouch.pageX, this.pieTouch.pageY);
            this.showTimeout = window.setTimeout(this.showPieMenu.bind(this, clientPos), 750);

            evt.preventDefault();
            return true;
        }
    },
    pieMove: function(evt) {
        if(this.pieTouch){
            var pagePos = pt(this.pieTouch.pageX, this.pieTouch.pageY);
            evt.getPosition = function(){return pagePos};

            if(this.activatedPieItem){
                this.activatedPieItem.move(evt);
            } else {
                this.doPieBehavior(evt);
            }
            evt.preventDefault();
            return true;
        }
    },
    pieEnd: function(evt) {

        if (evt.touches.length === 0) {
            // this branch is executed, when the last finger left the screen
            $world.setPieMode($world.pieButtonActive);
        }

        //TODO: pieTouch in touches?
        if(this.pieTouch){
            

            if(this.showTimeout){
                window.clearTimeout(this.showTimeout);
                delete this.showTimeout;
            }else{
                this.removePieMenu();
            }
            if(this.activatedPieItem){
                this.activatedPieItem.end(evt);
                this.activatedPieItem = null;
            }

            delete this.pieTouch;

            evt.stop();
            return true;
        }
    },
    getPieItemAtDirection: function(direction) {
        var angle = Math.atan2(direction.y, direction.x);
        angle += Math.PI/8;
        while(angle < 0){
            angle += 2 * Math.PI;
        }
        angle *= 4 / Math.PI;
        angle %= 8;
        angle = Math.floor(angle);
        return this.pieItems[angle];
    },

    activatePieItem: function(item, evt) {
        if(this.showTimeout){
            window.clearTimeout(this.showTimeout);
            delete this.showTimeout;
        } else {
            this.removePieMenu();
        }

        this.activatedPieItem = item;
        item.activate(evt);
    },
        }
    );

    lively.morphic.World.addMethods(
        "PieMenu", {
            showPieFor: function(morph, pieItems){
                this.currentPieTarget && this.currentPieTarget.removePieMenu();
                this.currentPieTarget = morph;
                this.pieMenu = new lively.morphic.PieMenu(pieItems);
                this.addMorph(this.pieMenu);
                
                this.pieMenu.submorphs.each(function(ea) {
                    ea = ea.submorphs[0];
                    if(ea.labelMorph) {
                        ea.labelMorph.bringToFront();
                        ea.labelMorph.align(ea.labelMorph.bounds().center(), ea.innerBounds().center());
                    }
                });
                
                return this.pieMenu;
            },
        
            removePie: function() {
                if (this.currentPieTarget) {
                    this.currentPieTarget.removePieMenu();
                    delete this.currentPieTarget;
                }
            },
    onTap: function($super, evt) {
        $super(evt);
        if (this.currentHaloTarget) {
            this.currentHaloTarget.removeHalos() 
        }

        this.removePie();
        this.worldMenuMorph && this.worldMenuMorph.remove();
    },
    setPieMode: function(mode) {
        this.pieMode = mode;
    },
    setPieButtonActive: function(bool) {
        this.pieButtonActive = bool;
    },

            getPieItemClasses: function() {
                return [
                    lively.morphic.PieItem,
                    lively.morphic.PieItem,
                    lively.morphic.PieItem,
                    lively.morphic.ConnectPieItem,
                    lively.morphic.PieItem,
                    lively.morphic.PieItem,
                    lively.morphic.MenuPieItem,
                    lively.morphic.PieItem
                ];
            },



        }
);
lively.morphic.Morph.subclass('lively.morphic.PieMenu',
'inizialization', {
    initialize: function($super, halos) {
        // Creates a PieMenu with x sectors.
        $super();
        var n = halos.length,
            i = 0,
            alpha = Math.PI / n,
            innerRadius= 75,
            outerRadius= 150; 

        this.setupStyle(outerRadius);  

        for(i=0; i<n; i++) {
            var a = (2*i - 1) * alpha,
                x1 = outerRadius + outerRadius * Math.cos(a),
                y1 = outerRadius + outerRadius * Math.sin(a),
                x2 = outerRadius + innerRadius * Math.cos(a),
                y2 = outerRadius + innerRadius * Math.sin(a),
                x4 = outerRadius + outerRadius * Math.cos(a+2*alpha),
                y4 = outerRadius + outerRadius * Math.sin(a+2*alpha),
                x3 = outerRadius + innerRadius * Math.cos(a+2*alpha),
                y3 = outerRadius + innerRadius * Math.sin(a+2*alpha);

            var v = [
                pt(x1,y1),
                pt(x2,y2),
                new lively.morphic.Shapes.ArcTo(true, x3, y3, innerRadius, innerRadius, 0, 0, 1),
                pt(x4,y4),
                pt(x1,y1)
            ]
            var color = halos[i].getFill() === null ? null : halos[i].getFill();
            var p = Morph.makePolygon(v, 1, Color.rgb(66,66,66), color);
            p.setOrigin(pt(0,0));
            p.addMorph(halos[i]);
            halos[i].setBorderWidth(0);
            halos[i].setOpacity(1);
            halos[i].moveBy(p.getExtent().scaleBy(0.5));
            this.addMorph(p);
            connect(halos[i].shape, "_Fill", p, "setFill"); 

        }

        this.configureSubmorphs();
        return this;
    },
    setupStyle: function(radius) {
        this.setExtent(pt(2*radius,2*radius))
        this.setFill(null);
        this.setBorderWidth(0);
        this.setScale(1/$world.getZoomLevel());
    },
    configureSubmorphs: function() {
        //this.lock();
        this.submorphs.each(function (ea) {
            ea.disableHalos();
        }) 
    },


});
lively.morphic.Morph.subclass('lively.morphic.PieItem',
    'initializing', {
        initialize: function($super, targetMorph) {
            $super();
            this.targetMorph = targetMorph;
            this.createLabel();
            this.createIcon();
            this.alignIcon();
        },
    createIcon: function() {
        var iconUrl = this.getIcon();
        if (!iconUrl || iconUrl == '') return null;
        if (this.labelMorph) this.labelMorph.remove();
        var rect = new Rectangle(0,0, this.iconExtent && this.iconExtent.x || 45, this.iconExtent && this.iconExtent.y || 45);
        this.labelMorph = new lively.morphic.Image(rect, iconUrl, false)
        this.addMorph(this.labelMorph);
        return this.labelMorph;
},
    alignIcon: function() {
        if(this.iconOffset)
            this.moveBy(this.iconOffset)
    },


        createLabel: function() {
            var text = this.getLabelText();
            if (!text || text == '') return null;
            if (this.labelMorph) this.labelMorph.remove();
            this.labelMorph = new lively.morphic.Text(new Rectangle(0,0, 0, 0), text).beLabel({
                align: 'center',
                fixedWidth: false,
                fixedHeight: false,
                textColor: Color.black,
                fontSize: 18
            });
            this.addMorph(this.labelMorph);
            return this.labelMorph;
        },
    },
    'accessing', {
        getLabelText: function(){
            return this.labelText;
        },
    getIcon: function() {
        return this.iconUrl;
    },

    },
    'settings', {
        labelText: "",
    setInfo: function(textStr) {
        if(!this.infoMorph) {
            this.createInfoMorph();
        }
        this.infoMorph.setTextString(textStr);
        this.infoMorph.fit();
    },
    alignInfo: function() {
        if(!this.infoMorph) {
            this.createInfoMorph();
        }

        this.infoMorph.align(
            this.infoMorph.bounds().bottomLeft(),
            this.targetMorph.owner.worldPoint(this.targetMorph.bounds().topLeft())
        );
    },

    createInfoMorph: function() {
        this.infoMorph = new lively.morphic.Text(new Rectangle(0,0,500,30),"");
        this.infoMorph.beLabel({fontSize: 14, fill: Color.rgba(255,255,255,0.7)});
        this.infoMorph.setScale(1/$world.getZoomLevel());

        $world.addMorph(this.infoMorph);
    },


        isPieItem: true,
        style: {
            fill: Color.rgb(131,111,255),
        },
    newMethod: function() {
        // enter comment here
    },

    leave: function() {
        var color = this.originalColor;
        this.setFill(color);
    },

},
    'pieItemActions', {
        activate: function(evt){

        },
    enter: function() {
        this.originalColor = this.getFill();
        var color = this.getFill().lighter();
        this.setFill(color);
    },

    move: function(evt) {
        
    },
    end: function(event) {
        
        if(this.infoMorph) {
            this.infoMorph.remove();
            this.infoMorph = null;
        }

    },


    }
);
lively.morphic.PieItem.subclass('lively.morphic.ClosePieItem',
    'settings', {

        labelText: 'X'

    },
    'pieItemActions', {
        activate: function(evt) {
            if(this.targetMorph.setFixed) {
                this.targetMorph.setFixed(false);
            }
            this.targetMorph.deselect();
            this.targetMorph.remove();
        },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/remove.png",
    iconOffset: pt(-3,10),




    }
);
lively.morphic.PieItem.subclass('lively.morphic.MenuPieItem',
    'settings', {

        labelText: 'M'

    },
    'pieItemActions', {
        activate: function(evt) {
            this.targetMorph.showMorphMenu(evt);
        },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/menu.png",

    }
);
lively.morphic.PieItem.subclass('lively.morphic.CopyPieItem',
    'settings', {

    iconExtent: pt(42,42),

    iconOffset: pt(11,11),

        labelText: 'C'

    },
    'pieItemActions', {
        activate: function(evt) {
            
            try {
                this.copiedTarget = this.targetMorph.copy();
            } catch(e) {
                alert("could not copy morph: " + this.targetMorph)
                return;
            }; 

            this.copiedTarget.setTransform(this.targetMorph.getGlobalTransform());
            var delta = this.targetMorph.pieTouch.pageStart.subPt(evt.getPosition());

            evt.hand.setPosition(evt.getPosition().addPt(delta));
            this.targetMorph.world().addMorph(this.copiedTarget)
            this.copiedTarget.align(
                this.copiedTarget.worldPoint(pt(0,0)),
                this.targetMorph.worldPoint(pt(0,0)))

            evt.hand.grabMorph(this.copiedTarget, evt);

            this.targetMorph.selectionMorph.setVisible(false);
            $world.startFollowingHand();
            
        },
        move: function(evt) {
            evt.hand.setPosition(evt.getPosition());
        },
    end: function(evt) {
        if(this.copiedTarget){
            evt.world.dispatchDrop(evt);
            this.copiedTarget.deselect();
            this.copiedTarget.select();
        }
        $world.stopFollowingHand();
    },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/copy.png",



    }
);
lively.morphic.PieItem.subclass('lively.morphic.GrabPieItem',
    'settings', {

    iconOffset: pt(3,0),
    iconExtent: pt(55,55),


        labelText: 'G'

    },
    'pieItemActions', {
        activate: function(evt) {
            var delta = this.targetMorph.pieTouch.pageStart.subPt(evt.getPosition());
            evt.hand.setPosition(evt.getPosition().addPt(delta));
            evt.hand.grabMorph(this.targetMorph, evt);
            $world.startFollowingHand();
            this.targetMorph.selectionMorph.setVisible(false);
        },
        move: function(evt) {
            evt.hand.setPosition(evt.getPosition());
        },
    end: function(evt) {
        this.targetMorph.deselect();
        evt.world.dispatchDrop(evt);
        this.targetMorph.select();
        $world.stopFollowingHand();
    },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/grab.png",



    }
);
lively.morphic.PieItem.subclass('lively.morphic.DragPieItem',
    'settings', {

        labelText: 'D'

    },
    'pieItemActions', {
        activate: function(evt) {
            
            //TODO: rather use startpoint of the gesture?
            this.eventStart = evt.getPosition();
            this.targetStart = this.targetMorph.getPosition();
            $world.startFollowingHand();
        },
        move: function(evt) {
            evt.hand.setPosition(evt.getPosition());
            if(this.eventStart){
                var delta = evt.getPosition().subPt(this.eventStart),
                    transform = this.targetMorph.owner.getGlobalTransform().inverse();

                delta = transform.transformDirection(delta);
                this.targetMorph.setPosition(this.targetStart.addPt(delta));

                this.setInfo("pos: " + this.targetMorph.getPosition());
                this.alignInfo();
            }
        },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/drag.png",
    iconOffset: pt(4,0),
    end: function($super) {
        $super();
        $world.stopFollowingHand();
    },




    }
);
lively.morphic.PieItem.subclass('lively.morphic.ConnectPieItem',
    'settings', {

    iconOffset: pt(9,-6),

        labelText: 'N'

    },
    'pieItemActions', {
        activate: function(evt) {
            this.source = this.targetMorph;
            this.arrow = new lively.morphic.Path([
                this.source.pieTouch.pageStart,
                evt.getPosition()
            ]);

            this.arrow.makeArrowHead();
            this.arrow.setFill(Color.black);
            this.arrow.setBorderWidth(5)

            $world.addMorph(this.arrow);
            this.ensureMarkerMorph();
            this.handleHighlightAtPosition(evt.getPosition());
            $world.startFollowingHand();
        },
    ensureMarkerMorph: function() {
        if(!$world.markerMorph) {
            var m = new lively.morphic.Box(rect(0,0,10,10));
            m.setExtent(pt(100,100));
            m.setPosition(pt(0,0));
            m.applyStyle({
                fill: null,
                borderColor: Color.rgb(255,143,0),
                borderStyle: "dashed",
                borderWidth: 3.664    
            });
            m.openInWorld();
            $world.markerMorph = m;
            $world.markerMorph.setVisible(false);

            // I don't need this, but "Highlighting.js" does. So if I am responsible for loading
            // the marker morph, I have to make sure they can use it too.
            $world.markerMorph.isMarkerMorph = true;
        }
    },

        move: function(evt) {
            this.arrow.getControlPoints().last().setPos(evt.getPosition());
            this.handleHighlightAtPosition(evt.getPosition());
        },
    handleHighlightAtPosition: function(position) {
        var target = this.findTarget(position);

        if(target !== this.currentTarget) {
            this.removeHighlight(this.currentTarget);
            this.setHighlight(target);
            this.currentTarget = target;
        }
    },
    setHighlight: function(morph) {
        if($world.markerMorph) {
            $world.markerMorph.setBounds(morph.globalBounds());
            $world.markerMorph.setVisible(true);
            $world.markerMorph.bringToFront();
        }
    },

    removeHighlight: function(morph) {
        //TODO: remove the marker morph from the actual morph. Right now the world only has one
        // marker morph, so I just make it invisible
        if($world.markerMorph) {
            $world.markerMorph.setVisible(false);
        }
    },

    findTarget: function(positionInWorld) {
        // finds the morph, which should be highlighted by the marker morph
        var allMorphsAtPosition = $world.morphsContainingPoint(positionInWorld);

        var blackList = [$world.firstHand(), $world.markerMorph, this.arrow];
        
        for(var i = 0; i < allMorphsAtPosition.length; i++) {
            if (!blackList.include(allMorphsAtPosition[i])) {
                return allMorphsAtPosition[i];
            }
        }
        
    },
    end: function() {
        $world.markerMorph.setVisible(false);
        this.arrow.remove();

        this.showRectOnTopOfPage();
        $world.stopFollowingHand();
    },
    showRectOnTopOfPage: function() {
        var morph = Morph.makeRectangle(0,0,980,50);
        morph.disableSelection();
        var that = this;
        morph.name = "ConnectionDialog";
        morph.applyStyle({
            extent: pt(980,42),
            fill: new lively.morphic.LinearGradient(
            [
                {offset: 0, color: Color.rgb(253,253,253)},
                {offset: 1, color: Color.rgb(223,223,223)}
            ], 'northSouth'),
            borderColor: Color.black
        });
        
        var text = new TextMorph(new Rectangle(0,0,100,10));
        text.applyStyle({
            fill: null,
            borderWidth: 0,
            fontSize: 14,
            textColor: Color.rgb(47,47,47),
            fontFamily: "Helvetica, Arial, sans-serif"
        });
        text.setPosition(pt(10,10));
        text.textString = "connecting ";
        morph.addMorph(text);

        var sourceDropDown = this.createPossibleSourcesList(this.source.pieTouch.pageStart);
        morph.addMorph(sourceDropDown);
        sourceDropDown.setPosition(pt(145,10));

        var sourceList = this.createDropDownSenderList(this.source);
        morph.addMorph(sourceList);
        sourceList.setPosition(pt(255,10));
        
        connect(sourceDropDown, "selectedLineNo", sourceList, "updateProperties", {converter: function(value){
            return this.sourceObj.realObjects[value];
        }});

        var targetText = text.copy();
        targetText.textString = "to";
        targetText.setPosition(pt(375,10));
        morph.addMorph(targetText);

        var targetDropDown = this.createPossibleSourcesList(pt(this.source.pieTouch.pageX, this.source.pieTouch.pageY));
        morph.addMorph(targetDropDown);
        targetDropDown.setPosition(pt(515,10));

        var targetList = this.createDropDownReceiverList(this.currentTarget);
        morph.addMorph(targetList);
        targetList.setPosition(pt(625,10));
        
        //connect(targetDropDown, "selection", targetList, "updateProperties");
        connect(targetDropDown, "selectedLineNo", targetList, "updateProperties", {converter: function(value){
            return this.sourceObj.realObjects[value];
        }});

        var okBtn = new lively.morphic.Button(new Rectangle(0, 0, 75, 25));
        okBtn.onclick = function(evt) {
            morph.setFixed(false);
            connect(sourceDropDown.realObjects[sourceDropDown.selectedLineNo],
                    sourceList.selection,
                    targetDropDown.realObjects[targetDropDown.selectedLineNo],
                    targetList.selection);
            morph.remove();
        };
        connect(okBtn, "fire", okBtn, "onclick", {removeAfterUpdate: true});
        morph.addMorph(okBtn);
        okBtn.setPosition(pt(750,10));
        okBtn.setLabel("OK");
        okBtn.onrestore();
        

        var cancelBtn = okBtn.copy();
        cancelBtn.onclick = function(evt) {
            morph.setFixed(false);
            morph.remove();
        };
        connect(cancelBtn, "fire", cancelBtn, "onclick", {removeAfterUpdate: true});
        cancelBtn.setLabel("Cancel");
        cancelBtn.setPosition(pt(850,10));
        cancelBtn.label.beLabel(this.labelStyle);
        morph.addMorph(cancelBtn);

        morph.setPosition(pt(window.pageXOffset, window.pageYOffset));
        morph.setScale(1/$world.getZoomLevel());
        morph.openInWorld();
        morph.setFixed(true);
    },
    createDropDownReceiverList: function(target) {
        //var receiverList = $world.openPartItem("DropDownList", "PartsBin/Inputs");
        var receiverList = new lively.morphic.DropDownList(rect(0,0,10,10));
        receiverList.setExtent(lively.pt(107.0,25.0));

        receiverList.updateSelection = function(selectionString) {
            if(selectionString === "enter name...") {
                $world.prompt('Enter name of connection point', function(input) {
                    if (!input) return;
                    receiverList.addItem(input);
                    receiverList.selectAt(receiverList.itemList.length-1);
                });
            }
        };

        receiverList.updateProperties = function(target) {
            var that = this,
                properties = Properties.own(target.getTargetConnectionPoints()),
                menu = [];

            // Properties
            var propMenu = ["Properties"];
            properties.forEach(function(propName) {
                propMenu.push(propName);
            });
            menu.push(propMenu);
    
            //Scripts
            var scriptMenuItems = ["Scripts"];
            Functions.own(target).forEach(function(scriptName) {
                scriptMenuItems.push(scriptName);
            });
            menu.push(scriptMenuItems);

            menu.push(["custom", "enter name..."]);
    
            this.updateList(menu, true);
            receiverList.selection = receiverList.selection || propMenu[1];
        };

        receiverList.updateProperties(target);

        receiverList.disableSelection();
        
        connect(receiverList, "selection", receiverList, "updateSelection");

        return receiverList;
    },
    createPossibleSourcesList: function(position) {
        var list = new lively.morphic.DropDownList(rect(0,0,10,10));
        list.setExtent(lively.pt(107.0,25.0));
        list.selectedLineNo = 0;
        console.log($world.markerMorph);
        var that = this;
        var realObjects = [];
        list.updateList(
            $world.morphsContainingPoint(position).reject(function(a){
                return a === $world.markerMorph || a === that.targetMorph.selectionMorph;
            }).collect(function(a){
                realObjects.push(a);
                return a.getName() || a.toString();
            }));
        list.disableSelection();
        list.realObjects = realObjects;

        return list;
    },




    createDropDownSenderList: function(source) {
        var senderList = new lively.morphic.DropDownList(rect(0,0,10,10));
        senderList.setExtent(lively.pt(107.0,25.0));
        var connectionNames = Properties.own(source.getConnectionPoints());

        senderList.disableSelection();
        senderList.selection = connectionNames[0];
        senderList.updateList(connectionNames, true);
        senderList.updateProperties = function(target) {
            this.updateList(Properties.own(target.getConnectionPoints()));
        }
        return senderList;    
},


    connectFrom: function(source, sourceProperty) {
        console.log("connect from " + source + "::" + sourceProperty);
        this.connectSource = source;
        this.connectSourceProperty = sourceProperty;
        this.doConnect();
    },
    connectTo: function(target, targetProperty) {
        console.log("connect to " + target+ "::" + targetProperty);
        this.connectTarget = target;
        this.connectTargetProperty = targetProperty;
        this.doConnect();
    },
    doConnect: function() {
        console.log(this.connectSource);
        console.log(this.connectSourceProperty);
        console.log(this.connectTarget);
        console.log(this.connectTargetProperty);
        
        if(     this.connectSource &&
                this.connectSourceProperty &&
                this.connectTarget &&
                this.connectTargetProperty){
            connect(    this.connectSource,
                        this.connectSourceProperty,
                        this.connectTarget,
                        this.connectTargetProperty);
            this.senderList.remove();
            this.receiverList.remove();
        }
    },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/connect.png",










    }
);
lively.morphic.PieItem.subclass('lively.morphic.RotatePieItem',
    'settings', {

        labelText: 'T'

    },
    'pieItemActions', {
        activate: function(evt) {
            this.arrow = new lively.morphic.Path([
                this.targetMorph.getGlobalTransform().transformPoint(pt(0,0)),
                evt.getPosition()
            ]);

            this.arrow.setBorderColor(Color.red);
            this.arrow.setBorderWidth(1)

            $world.addMorph(this.arrow);


            //origin of targetMorph in world coordinates
            this.globalPosition = this.targetMorph.getGlobalTransform().transformPoint(pt(0,0));

            var startPosition = evt.getPosition();
            this.startRotation = this.targetMorph.getRotation();

            var startOffset = startPosition.subPt(this.globalPosition);
            this.startTheta = startOffset.theta();
        },
        move: function(evt) {
            
            this.arrow.getControlPoints().last().setPos(evt.getPosition());

            var offset = evt.getPosition().subPt(this.globalPosition);
            var angle = offset.theta() - this.startTheta;
            var rot = this.startRotation + angle;
            rot = rot.toDegrees().detent(10, 45);
            this.targetMorph.setRotation(rot.toRadians());

            this.setInfo(rot.toPrecision(5) + ' degrees');
            this.alignInfo();
        },
    end: function($super) {
        $super();
        this.arrow.remove();
    },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/rotate.png",

    }
);

lively.morphic.PieItem.subclass('lively.morphic.ScalePieItem',
    'settings', {

        labelText: 'F'
    },

    'pieItemActions', {
        activate: function(evt) {
            this.arrow = new lively.morphic.Path([
                this.targetMorph.getGlobalTransform().transformPoint(pt(0,0)),
                evt.getPosition()
            ]);

            this.arrow.setBorderColor(Color.red);
            this.arrow.setBorderWidth(1)

            $world.addMorph(this.arrow);


            //origin of targetMorph in world coordinates
            this.globalPosition = this.targetMorph.getGlobalTransform().transformPoint(pt(0,0));

            var startPosition = evt.getPosition();
            this.startScale = this.targetMorph.getScale();

            var startOffset = startPosition.subPt(this.globalPosition);
            this.startDist = startOffset.r();
        },
        move: function(evt) {
            
            this.arrow.getControlPoints().last().setPos(evt.getPosition());

            var offset = evt.getPosition().subPt(this.globalPosition).r();
            var newScale = (this.startScale * offset / Math.max(this.startDist, 40));
            newScale = newScale.detent(0.1, 0.5);
/*
            var angle = offset.theta() - this.startTheta;
            var rot = this.startRotation + angle;
            rot = rot.toDegrees().detent(10, 45);
            this.targetMorph.setRotation(rot.toRadians());
*/
            this.targetMorph.setScale(newScale);
            this.setInfo("scale: " + newScale.toPrecision(5));
            this.alignInfo();
        },
        end: function($super) {
            $super();
            this.arrow.remove();
        },
        iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/scale.png",
    iconOffset: pt(-8,-8),

    }
);
lively.morphic.PieItem.subclass('lively.morphic.ResizePieItem',
    'settings', {

        labelText: 'R'

    },
    'pieItemActions', {
        activate: function(evt) {
            this.startPosition = evt.getPosition();
            this.startExtent = this.targetMorph.getExtent();     
        },
        move: function(evt) {
            var delta = evt.getPosition().subPt(this.startPosition);
            var newExtent = this.startExtent.addPt(delta);
            this.targetMorph.setExtent(newExtent);
            this.setInfo("extent: " + newExtent);
            this.alignInfo();
        },
    iconUrl: "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/pieMenuIcons/rotate.png",


    }
);

lively.morphic.Path.addMethods(
    "SVGArrows", {
        makeArrowHead: function(){
            
            var defs = this.getDefs();

            var marker;

            for(var node = defs.firstChild; node; node = node.nextSibling){
                if(node.getAttribute("id") === "ArrowHead"){
                    marker = node;
                    break;
                }
            }

            if(!marker){
                marker = NodeFactory.createNS(Namespace.SVG, "marker");
                marker.setAttribute("id", "ArrowHead");
                marker.setAttribute("viewBox", "0 0 10 10");
                marker.setAttribute("refX", "10");
                marker.setAttribute("refY", "5");
                marker.setAttribute("markerUnits", "userSpaceOnUse");
                marker.setAttribute("markerWidth", "20");
                marker.setAttribute("markerHeight", "15");
                marker.setAttribute("orient", "auto");

                var triangle = NodeFactory.createNS(Namespace.SVG, "path");
                triangle.setAttribute("d", "M 0 0 L 10 5 L 0 10 z")

                marker.appendChild(triangle);

                defs.appendChild(marker);
            }

            for(var node = this.renderContext().svgNode.firstChild; node; node = node.nextSibling){
                if(node.tagName === "path"){
                   node.setAttribute("marker-end","url(#ArrowHead)"); 
                }
            }
        },
    
        getDefs: function() {
        var defs = this.renderContext().svgNode.getElementsByTagName("def");
        if(defs.length >= 1){
            return defs.item(0);
        } else {
            defs = NodeFactory.createNS(Namespace.SVG, "defs");
            this.renderContext().svgNode.insertBefore(defs, this.renderContext().svgNode.firstChild);
            return defs;
        }
    },
})

cop.create('PieMenu').refineClass(lively.morphic.Morph, {
    onTouchStartAction: function (evt) {
        if($world.pieMode){
            return this.pieStart(evt);
        } else {
            cop.proceed(evt);
        }
    },
    onTouchMoveAction: function (evt) {
        if($world.pieMode){
            //console.log("doing piemove");
            return this.pieMove(evt);
        } else {
            cop.proceed(evt);
        }
    },
    onTouchEndAction: function (evt) {
        if($world.pieMode){
            return this.pieEnd(evt);
        } else {
            cop.proceed(evt);
        }
    },

    onTap: function(evt) {
        var out = cop.proceed(evt);
        $world.removePie();
        return out;
    },

}).refineClass(lively.morphic.List, {
    updateList: function(items, useOwnImplementation) {
        if(!useOwnImplementation) {
            cop.proceed(items);
        } else {

        items = items || [];
        //this.itemList = items;
        var that = this;
        this.itemList = [];
        var mapToItemList = function(array) {
            for(var i=0; i < array.length; i++) {
                if(array[i].constructor === Array) {
                    mapToItemList(array[i].slice(1));
                } else {
                    that.itemList.push(array[i]);
                }
            }
        }
        mapToItemList(items);

        this.renderContextDispatch('updateListContent', items);
        }
    },
    
    updateListContentHTML: function(ctx, itemStrings) {
        //cop.proceed(ctx,itemStrings);
        //return;
        if (!itemStrings) itemStrings = [];
        var scroll = this.getScroll();
        if(!ctx || !ctx.subNodes) return;
        if (ctx.subNodes.length > 0) this.removeListContentHTML(ctx);
        var extent = this.getExtent();

        //console.log(itemStrings);
        this.makeList(ctx, ctx.listNode, itemStrings);
        globCtx = ctx;
        this.resizeListHTML(ctx);
        this.selectAllAtHTML(ctx, [this.selectedLineNo]);
    },
    makeList: function(ctx, activeNode, items) {
        for (var i = 0; i < items.length; i++) {
            if(items[i].constructor === Array) {
                var optGroup = XHTMLNS.create('optgroup');
                optGroup.label = items[i][0];
                activeNode.appendChild(optGroup);
                this.makeList(ctx, optGroup, items[i].slice(1));
            } else {
                var option = XHTMLNS.create('option');
                option.textContent = items[i].string || String(items[i]);
                activeNode.appendChild(option);
                ctx.subNodes.push(option);
            }
        }
    },

}).beGlobal();

lively.morphic.Morph.addMethods(
    "CSSTransitions", {
        moveByAnimated: function(delta, time, callback){
                var prefix = this.renderContext().domInterface.html5CssPrefix,
                    eventName = "transitionend";

                switch(prefix) {
                    case '-webkit-': eventName = "webkitTransitionEnd"; break;
                    case '-o-'     : eventName = "oTransitionEnd"; break;
                }
                
                if(prefix === "-moz-") {
                    this.renderContext().morphNode.style["MozTransitionProperty"] = "top, left";
                    this.renderContext().morphNode.style["MozTransitionDuration"] = time + "ms";
                } else {
                    this.renderContext().morphNode.style[prefix + "transition-property"] = "top, left";
                    this.renderContext().morphNode.style[prefix + "transition-duration"] = time + "ms";
                }

                this.moveBy(delta);
                
                var that = this;    

                var remover = function(evt){
                    if(prefix === "-moz-") {
                        that.renderContext().morphNode.style["MozTransitionProperty"] = "";
                        that.renderContext().morphNode.style["MozTransitionDuration"] = "";
                    } else {
                        that.renderContext().morphNode.style[prefix + "transition-property"] = "";
                        that.renderContext().morphNode.style[prefix + "transition-duration"] = "";
                    }
                    that.renderContext().morphNode.removeEventListener(eventName, remover, false);
                    callback && callback(that);
                };
                this.renderContext().morphNode.addEventListener(eventName, remover, false);
        },
        setPositionAnimated: function(position, time, callback){
                var prefix = this.renderContext().domInterface.html5CssPrefix,
                    eventName = "transitionend";

                switch(prefix) {
                    case '-webkit-': eventName = "webkitTransitionEnd"; break;
                    case '-o-'     : eventName = "oTransitionEnd"; break;
                }

                if(prefix === "-moz-") {
                    this.renderContext().morphNode.style["MozTransitionProperty"] = "top, left";
                    this.renderContext().morphNode.style["MozTransitionDuration"] = time + "ms";
                } else {
                    this.renderContext().morphNode.style[prefix + "transition-property"] = "top, left";
                    this.renderContext().morphNode.style[prefix + "transition-duration"] = time + "ms";
                }
                this.setPosition(position);
                
                var that = this;    

                var remover = function(evt){
                    if(prefix === "-moz-") {
                        that.renderContext().morphNode.style["MozTransitionProperty"] = "";
                        that.renderContext().morphNode.style["MozTransitionDuration"] = "";
                    } else {
                        that.renderContext().morphNode.style[prefix + "transition-property"] = "";
                        that.renderContext().morphNode.style[prefix + "transition-duration"] = "";
                    }
                    that.renderContext().morphNode.removeEventListener(eventName, remover, false);
                    callback && callback();
                };
                this.renderContext().morphNode.addEventListener(eventName, remover, false);
        },
    }
);

}) // end of module