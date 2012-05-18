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


}) // end of module