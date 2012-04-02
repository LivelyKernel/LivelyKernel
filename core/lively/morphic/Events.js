module('lively.morphic.Events').requires('lively.morphic.Core', 'lively.morphic.TextCore', 'lively.morphic.HTML', 'lively.morphic.SVG', 'lively.morphic.Canvas', 'lively.Traits').toRun(function() {

lively.morphic.EventSimulator = {
    createKeyboardEvent: function(spec) {
        var evt = document.createEvent("KeyboardEvent");
        evt.initKeyboardEvent(spec.type || "keypress", true, true, window,
            spec.ctrl || 0, spec.alt || 0, spec.shift || 0, spec.meta || 0,
            0, spec.charCode || (spec.charPressed && spec.charPressed.charCodeAt(0)) || 0);
        return evt;
    },
    doKeyboardEvent: function(spec) {
        var ctx = spec.targetMorph && spec.targetMorph.renderContext(),
            targetNode = ctx && (ctx.textNode || ctx.morphNode);
        spec.targetNode = targetNode ? targetNode : spec.targetNode;
        var evt = this.createKeyboardEvent(spec),
            result = spec.targetNode.dispatchEvent(evt);
        return result;
    },
    createMouseEvent: function(type, pos, button) {
        // event.initMouseEvent(type, canBubble, cancelable, view,
        // detail, screenX, screenY, clientX, clientY,
        // ctrlKey, altKey, shiftKey, metaKey,
        // button, relatedTarget);

        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            0, 0, //pos.x, pos.y+100,
            pos.x - Global.scrollX, pos.y - Global.scrollY,
            false, false, false, false,
            button || 0/*left*/, null);
        return simulatedEvent;
    },
    doMouseEvent: function(spec) {
        // type one of click, mousedown, mouseup, mouseover, mousemove, mouseout.
        if (!spec.type) spec.type = 'mousedown';
        if (!spec.pos) spec.pos = pt(0,0);
        if (!spec.button) spec.button = 0;
        var targetMorphOrNode = spec.target;

        var evt = this.createMouseEvent(spec.type, spec.pos, spec.button);
        if (!Config.isNewMorphic && targetMorphOrNode.isMorph) {
            if (spec.shouldFocus) {
                var hand = targetMorphOrNode.world().firstHand()
                hand.setMouseFocus(targetMorphOrNode);
            }
            targetMorphOrNode.world().rawNode.dispatchEvent(evt);
            return
        }
        if (Config.isNewMorphic && targetMorphOrNode.isMorph) {
                    targetMorphOrNode = targetMorphOrNode.renderContext().morphNode;
                }
        targetMorphOrNode.dispatchEvent(evt)
    },


}

Object.subclass('lively.morphic.EventHandler',
'initializing', {
    initialize: function(morph) {
        this.morph = morph;
        this.dispatchTable = {};
    }
},
'accessing', {
    eventSpecsDo: function(iterator, context) {
        Properties.ownValues(this.dispatchTable)
            .select(function(ea) { return ea != null })
            .forEach(iterator, context);
    },
    hand: function() {
        // FIXME
        var world = lively.morphic.World.current();
        return world && world.hands[0];
    }

},
'registering', {
    register: function(eventSpec) {
        this.dispatchTable[eventSpec.type] = eventSpec;
    },
    enable: function() {
        this.eventSpecsDo(function(eventSpec) {
            this.morph.renderContext().registerHandlerForEvent(this, eventSpec);
        }, this);
    },
    registerHTMLAndSVG: function(eventSpec) {
        eventSpec.node = eventSpec.node || this.morph.renderContext().morphNode;
        eventSpec.doNotSerialize = ['node'];
        if (!eventSpec.node)
            throw new Error('Cannot register Event handler because cannot find HTML/SVG morphNode');
        eventSpec.handlerFunc = this.handleEvent.bind(this);
        eventSpec.unregisterMethodName = 'unregisterHTMLAndSVGAndCANVAS';
        eventSpec.node.addEventListener(eventSpec.type, eventSpec.handlerFunc, eventSpec.handleOnCapture);
        this.register(eventSpec);
    },
    registerCANVAS: function(eventSpec) {
        if (eventSpec.node) { alert('EventHandler still registered in DOM?'); debugger };
// alert('registering event: ' + eventSpec.type + ' -> ' + eventSpec.target + '>>' + eventSpec.targetMethodName)
        eventSpec.node = this.morph.renderContext().getCanvas();
        if (!eventSpec.node)
            throw dbgOn(new Error('Cannot register event handler because cannot find CANVAS node'));
        eventSpec.handlerFunc = this.handleEventCANVAS.bind(this);
        eventSpec.unregisterMethodName = 'unregisterHTMLAndSVGAndCANVAS';
        eventSpec.handleOnCapture = false;
        eventSpec.node.addEventListener(eventSpec.type, eventSpec.handlerFunc, eventSpec.handleOnCapture);
        this.register(eventSpec);
    }
},
'unregistering', {
    disable: function() { this.unregisterFromDispatchTable() },
    unregisterFromDispatchTable: function() {
        this.eventSpecsDo(function(eventSpec) {
            if (!eventSpec.unregisterMethodName) throw new Error('Cannot unregister event handler ' + this);
            this[eventSpec.unregisterMethodName](eventSpec);
        }, this);
    },
    unregisterHTMLAndSVGAndCANVAS: function(evtSpec) {
        if (!evtSpec.node) return;
        evtSpec.node.removeEventListener(evtSpec.type, evtSpec.handlerFunc, evtSpec.handleOnCapture);
        delete evtSpec.node;
    }
},
'updating', {
    update: function() {
        this.disable();
        this.enable();
    }
},
'handle events', {
    handleEvent: function(evt) {
        var eventSpec = this.dispatchTable[evt.type];

        if (!eventSpec) return false;

        var target = eventSpec.target;

        if (target.eventsAreDisabled) return false;

        if (Global.LastEventWasHandled && evt === Global.LastEvent) return false;

        this.patchEvent(evt);

        // if (evt.isKeyboardEvent && !target.isFocusable()) { return false };

        if (false && evt.isMouseEvent) {
            var morph = target;
            var globalBounds = morph.getGlobalTransform().transformRectToRect(morph.getShape().getBounds())
            if (!globalBounds.containsPoint(evt.getPosition())) return false;
        }

        Global.LastEvent = evt;
        Global.LastEventWasHandled = false;

        try {
            var wasHandled = target[eventSpec.targetMethodName](evt);
        } catch(e) {
            this.handleError(e, target, eventSpec);
        }

        Global.LastEventWasHandled = Global.LastEventWasHandled || wasHandled;

        return true;
    },
    patchEvent: function(evt) {
        // FIXME add event function

        if (evt.hasLivelyPatch) return evt;

        evt.hasLivelyPatch = true;
        evt.isLeftMouseButtonDown = function() { return Event.MOUSE_LEFT_DETECTOR(evt) };
        evt.isMiddleMouseButtonDown = function() { return Event.MOUSE_MIDDLE_DETECTOR(evt) };
        evt.isRightMouseButtonDown = function() { return Event.MOUSE_RIGHT_DETECTOR(evt) };

        evt.isCommandKey = function() {
            // this is LK convention, not the content of the event
            if (Config.useAltAsCommand)
                return evt.altKey;
            if (UserAgent.isWindows || UserAgent.isLinux )
                return evt.ctrlKey;
            if (UserAgent.isOpera) // Opera recognizes cmd as ctrl!!?
                return evt.ctrlKey;
            return evt.metaKey;
        };

        evt.isShiftDown = function() { return !!evt.shiftKey };
        evt.isCtrlDown = function() { return !!evt.ctrlKey };
        evt.isAltDown = function() { return !!evt.altKey };
        evt.stop = evt.stop || function() {
            evt.isStopped = true;
            evt.stopPropagation();
            evt.preventDefault();
        };

        evt.getKeyChar = function() {
            if (evt.type == "keypress") { // rk what's the reason for this test?
                var id = evt.charCode || evt.which;
                if (id > 63000) return ""; // Old Safari sends weird key char codes
                return id ? String.fromCharCode(id) : "";
            } else  {
                var code = evt.which;
                return code && String.fromCharCode(code);
            }
        }

        evt.getKeyCode = function() { return evt.keyCode }

        evt.isMouseEvent = evt.type === 'mousedown' || evt.type === 'mouseup' || evt.type === 'mousemove' || evt.type === 'mouseover' || evt.type === 'click' || evt.type === 'dblclick' || evt.type === 'mouseover' || evt.type === 'selectstart' || evt.type === 'contextmenu' || evt.type === 'mousewheel';

        evt.isKeyboardEvent = !evt.isMouseEvent && (evt.type === 'keydown' || evt.type === 'keyup' || evt.type === 'keypress');

        evt.isArrowKey = function() {
            if(evt.isKeyboardEvent){
                var c = evt.getKeyCode();
                return (c === Event.KEY_LEFT)
                    || (c === Event.KEY_RIGHT)
                    || (c === Event.KEY_UP)
                    || (c === Event.KEY_DOWN);
            }
            return false
        }

        evt.isInBoundsOf = function(morph) {
            return morph.innerBounds().containsPoint(morph.localize(evt.mousePoint))
        }

        var world = lively.morphic.World.current();
        evt.world = world;
        evt.hand = world.hands[0];

        evt.getPosition = function() {
            if (!evt.scaledPos)
                evt.scaledPos = evt.mousePoint.scaleBy(1/evt.world.getScale());
            return evt.scaledPos;
        };
        evt.mousePoint = evt.mousePoint || pt(evt.pageX || evt.clientX || 0, evt.pageY || evt.clientY || 0);

        return evt
    },

    handleEventCANVAS: function(evt) {
        if (evt.isStopped) return false;
        var eventSpec = this.dispatchTable[evt.type];
        if (!eventSpec) return false;

        this.patchEvent(evt);

        var inner = this.morph.getExtent().extentAsRectangle();
        if (!inner.containsPoint(this.morph.localize(evt.getPosition()))) return false;

        try {
            eventSpec.target[eventSpec.targetMethodName](evt);
        } catch(e) {
            alert('Error in handleEvent ' + e + '\n' + e.stack)
        }
        return true;
    },

    handleError: function(error, target, eventSpec) {
        var world = lively.morphic.World.current();
        var title = Strings.format(
            'Error in handleEvent when calling %s>>%s',
            target, eventSpec.targetMethodName);
        if (world) {
            world.logError(error, title);
        } else {
            alert(title + error.toString() + error.stack.toString());
        }
    }
},
'debugging', {
    toString: function() {
        return '<EventHandler(' + Properties.all(this.dispatchTable) + ')>'
    }
});
Object.extend(lively.morphic.EventHandler, {
    prepareEventSystem: (function() {})()
});
lively.morphic.EventHandler.subclass('lively.morphic.RelayEventHandler',
'initializing', {
    initialize: function($super, morph, relayFunc) {
        $super(morph)
        this.relayFunc = relayFunc || Functions.Null;
    },
},
'handle events', {
    handleEvent: function($super, evt) {
        this.patchEvent(evt);

        if (!evt.isCommandKey()) {
            this.morph.renderContext().morphNode.style['pointer-events'] = 'none';
            (function() {
                this.morph.renderContext().morphNode.style['pointer-events'] = 'auto'
            }.bind(this)).delay(0.3);
        } else {
            this.morph.renderContext().morphNode.style['pointer-events'] = 'auto'
        }

        // For some reason it works a bit better when we generate the events again...
        if (evt.type === 'mousemove' || evt.type === 'mousedown' || evt.type === 'mouseup' || evt.type === 'click' || evt.type === 'dblclick' || evt.type === 'mouseover' || evt.type === 'mouseout' || evt.type === 'mousewheel' || evt.type === 'mouseenter' || evt.type === 'mouseleave') {
            var e = document.createEvent("MouseEvents"),
                be = evt,
                et = be.type;
                e.initMouseEvent(et, true, true, window, be.detail, be.screenX, be.screenY, be.clientX, be.clientY, be.ctrlKey, be.altKey, be.shiftKey, be.metaKey, be.button, null);
            this.patchEvent(e);
            evt = e;
        }

        var result = this.relayFunc(evt, this.morph);
        return result ? true : $super(evt);
    },
});

Object.extend(Event, {
    // copied from prototype.js:
    KEY_BACKSPACE: 8,
    KEY_TAB:       9,
    KEY_RETURN:   13,
    KEY_ESC:      27,
    KEY_LEFT:     37,
    KEY_UP:       38,
    KEY_RIGHT:    39,
    KEY_DOWN:     40,
    KEY_DELETE:   46,
    KEY_HOME:     36,
    KEY_END:      35,
    KEY_PAGEUP:   33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT:   45,

    // not in prototype.js:
    KEY_SPACEBAR: 32,
    KEY_SHIFT:    16,
    KEY_CTRL:     17,
    KEY_ALT:      18,
    KEY_CMD:      91,

    MOUSE_LEFT_DETECTOR: (function() {
        return UserAgent.fireFoxVersion ?
            function(evt) { return evt.world.clickedOnMorph && evt.which === 1 } :
            function(evt) { return evt.which === 1 }
    })(),
    MOUSE_MIDDLE_DETECTOR: (function() {
        return UserAgent.fireFoxVersion ?
            function(evt) { return evt.world.clickedOnMorph && evt.which === 2 } :
            function(evt) { return evt.which === 2 }
    })(),
    MOUSE_RIGHT_DETECTOR: (function() {
        return UserAgent.fireFoxVersion ?
            function(evt) { return evt.world.clickedOnMorph && evt.which === 3 } :
            function(evt) { return evt.which === 3 }
    })()
});

Trait('ScrollableTrait',
'accessing', {
    basicGetScrollableNode: function() {
        throw new Error('Base class should implement basicGetScrollableNode()');
    },
    world: function() {
        throw new Error('Base class should implement world()');
    },
},
'scrolling', {
    getScroll: function() {
        var node = this.getScrollableNode(),
            borderWidth = this.getBorderWidth() || 0;
        if (!node) return [0,0];
        return [node.scrollLeft, node.scrollTop];
    },
    getAccumulatedScroll: function() {
        var scroll = [0,0], morph = this;
        while (morph) {
            var morphScroll = morph.getScroll();
            scroll[0] += morphScroll[0];
            scroll[1] += morphScroll[1];
            morph = morph.owner;
        }
        return scroll;
    },
    getScrollExtent: function() {
        var node = this.getScrollableNode();
        return pt(node.clientWidth, node.clientHeight);
    },
    getScrollBounds: function() {
        var s = this.getScroll(), extent = this.getScrollExtent();
        return new Rectangle(s[0], s[1], extent.x, extent.y);
    },
    getGlobalScrollBounds: function() {
        var s = this.getAccumulatedScroll(), extent = this.getScrollExtent();
        return new Rectangle(s[0], s[1], extent.x, extent.y);
    },
    setScroll: function(horiz, vert) {
        // FIXME HTML specific
        var node = this.getScrollableNode();
        if (!node) return;
        node.scrollLeft = horiz;
        node.scrollTop = vert
    },
    setAccumulatedScroll: function(horiz, vert) {
        // also the world's scroll (and all owner's???) has to be considered
        // when setting the new scroll position
        var world = this.world(),
            worldTopLeft = world ? world.visibleBounds().topLeft() : pt(0,0);
        this.setScroll(horiz + worldTopLeft.x, vert + worldTopLeft.y);
    },

    scrollRectIntoView: function(r, scrollOnlyWhenNotInView) {
        var scrollBounds = this.getScrollBounds();
        if (scrollOnlyWhenNotInView && scrollBounds.containsRect(r)) return;

        var scrollDeltaX = 0, scrollDeltaY = 0;
        if (r.left() < scrollBounds.left())
            scrollDeltaX = r.left() - scrollBounds.left();
        else if (r.right() > scrollBounds.right())
            scrollDeltaX = r.right() - scrollBounds.right();

        if (r.top() < scrollBounds.top())
            scrollDeltaY = r.top() - scrollBounds.top();
        else if (r.bottom() > scrollBounds.bottom())
            scrollDeltaY = r.bottom() - scrollBounds.bottom();

        var scroll = this.getScroll();
        this.setScroll(scroll[0] + scrollDeltaX, scroll[1] + scrollDeltaY);
    }
},
'scroll event handling', {
    onMouseWheel: function(evt) {
        //if (evt.hand.scrollFocusMorph === this) {
        this.stopScrollWhenBordersAreReached(evt);
        //} else {
         //   this.undoScroll(evt); // browser scrolled me automatically, need to restore
        //}
        return true;
    },

    undoScroll: function(evt) {
        // The following is to restore the scroll in a scrollable widget that does not have
        // the focus. The browser scrolled that one automatically.
        // we should rather scroll this.owner than the world, but for some reason that
        // does not work for scrollable widgets inside windows ... why?
        //var ownerScroll = this.owner.getScroll();
        var worldScroll = this.world().getScroll(),
            myScroll    = this.getScroll();
        this.setScroll(myScroll[0], myScroll[1] + evt.wheelDeltaY);
        //this.owner.setScroll(ownerScroll[0], ownerScroll[1] - evt.wheelDeltaY);
        this.world().setScroll(worldScroll[0], worldScroll[1] - evt.wheelDeltaY);
        return true;
    },
    stopScrollWhenBordersAreReached: function(evt) {
        // FIXME HTML specfic! Move to HTML module
        var div = this.getScrollableNode(evt);
        //var div = evt.hand.clickedOnMorph.getScrollableNode(evt);
        if (evt.wheelDeltaX) {
            var maxHorizontalScroll = div.scrollWidth - div.clientWidth,
                currentHorizontalScroll = div.scrollLeft;
            //alertOK('hscroll: ' + currentHorizontalScroll);
            if (evt.wheelDeltaX < 0 && currentHorizontalScroll >= maxHorizontalScroll)
                evt.stop();
            if (evt.wheelDeltaX > 0 && currentHorizontalScroll <= 0)
                evt.stop();
        }
        if (evt.wheelDeltaY) {
            var maxVerticalScroll = div.scrollHeight - div.clientHeight,
                currentVerticalScroll = div.scrollTop;
            //alertOK('vscroll: ' + currentVerticalScroll);
            if (evt. wheelDeltaY < 0 && currentVerticalScroll >= maxVerticalScroll)
                evt.stop();
            if (evt. wheelDeltaY > 0 && currentVerticalScroll <= 0)
                evt.stop();
        }

        return true;
    },
    getMaxScrollExtent: function() {
        var div = this.getScrollableNode(),
            maxHorizontalScroll = div.scrollWidth - div.clientWidth,
            maxVerticalScroll = div.scrollHeight - div.clientHeight;
        return pt(maxHorizontalScroll, maxVerticalScroll);
    },
    scrollToBottom: function() {
        this.setScroll(this.getScroll()[0], this.getMaxScrollExtent().y);
    },
    scrollWithMouseWheelEvent: function(evt) {
        var scroll = this.getScroll();
        this.setScroll(scroll[0] - evt.wheelDeltaX, scroll[1] - evt.wheelDeltaY);
        this.stopScrollWhenBordersAreReached(evt);
        evt.stop();
    },
})
.applyTo(lively.morphic.Morph)
.applyTo(lively.morphic.Text, {override: ['onMouseWheel']})
.applyTo(lively.morphic.List, {override: ['onMouseWheel']});

lively.morphic.Morph.addMethods(
'event managment', {
    addEventHandler: function() {
        if (this.eventHandler) throw new Error('Morph ' + this + ' already has an event handler!');
        var handler = new lively.morphic.EventHandler(this);
        this.eventHandler = handler;
        return handler;
    },
    removeEventHandlers: function() { // DEPRECATED
        this.removeEventHandler();
    },
    removeEventHandler: function() {
        if (!this.eventHandler) return;
        this.eventHandler.disable();
        this.eventHandler = null;
    },

    registerForEvent: function(type, target, targetMethodName, handleOnCapture) {
        if (!this.eventHandler) this.addEventHandler();
        var existing = this.eventHandler.dispatchTable[type];
        if (existing) {
            console.warn(Strings.format('Warning! Event %s already handled: %s.%s. Overwriting with %s.%s!',
                type, existing.target, existing.targetMethodName, target, targetMethodName));
        }
        var eventSpec = {
            type: type,
            target: target,
            targetMethodName: targetMethodName,
            handleOnCapture: handleOnCapture ? true : false // some browsers need t/f
        };
        this.renderContext().registerHandlerForEvent(this.eventHandler, eventSpec);
    },
    enableEventHandler: function() {
        if (this.eventHandler && !this.eventsAreDisabled) this.eventHandler.enable();
    },
    enableEventHandlerRecursively: function() {
        this.withAllSubmorphsDo(function(morph) { morph.enableEventHandler() })
    },
    disableEventHandler: function() {
        if (this.eventHandler) this.eventHandler.disable();
    },
    disableEventHandlerRecursively: function() {
        this.withAllSubmorphsDo(function(morph) { morph.disableEventHandler() })
    },
    disableEvents: function() {
        this.eventsAreDisabled = true;
        this.disableEventHandler();
        this.setHandStyle('default');
        this.setPointerEvents('none')
    },
    enableEvents: function() {
        this.eventsAreDisabled = false;
        this.enableEventHandler();
        this.setPointerEvents('auto')
    },
    ignoreEvents: function() {
        this.eventsAreIgnored = true;
    },
    unignoreEvents: function() {
        this.eventsAreIgnored = false;
    },
    setPointerEvents: function(value) { return this.morphicSetter('PointerEvents', value) },
    getPointerEvents: function() { return this.morphicGetter('PointerEvents') },

    areEventsIgnoredOrDisabled: function() {
        return this.eventsAreIgnored || this.eventsAreDisabled;
    },
    relayMouseEventsToMorphBeneath: function() {
        this.removeEventHandler();
        this.eventHandler = new lively.morphic.RelayEventHandler(
            this, function relayToMorphBeneath(evt, target) {
                if (evt.isCommandKey()) return false;
                var morphBeneath = target.morphBeneath(evt.getPosition());
                morphBeneath && morphBeneath.triggerEvent(evt);
                return true;
            }.asScript());
        this.registerForEvents();
    },
    registerForEvents: function(handleOnCapture) {
        this.registerForMouseEvents(handleOnCapture);
        this.registerForKeyboardEvents(handleOnCapture);
        this.registerForOtherEvents(handleOnCapture);
        this.registerForTouchEvents(handleOnCapture);
        this.registerForFocusAndBlurEvents();
    }
},
'event handling', {
    registerForKeyboardEvents: function(handleOnCapture) {
        this.registerForEvent('keydown', this, 'onKeyDown', handleOnCapture);
        this.registerForEvent('keyup', this, 'onKeyUp', handleOnCapture);
        this.registerForEvent('keypress', this, 'onKeyPress', handleOnCapture);
    },


    registerForMouseEvents: function(handleOnCapture) {
        if (this.onMouseUpEntry) this.registerForEvent('mouseup', this, 'onMouseUpEntry', handleOnCapture);
        if (this.onMouseDownEntry) this.registerForEvent('mousedown', this, 'onMouseDownEntry', handleOnCapture);
        if (this.onClick) this.registerForEvent('click', this, 'onClick', handleOnCapture);
        if (this.onMouseMoveEntry) this.registerForEvent('mousemove', this, 'onMouseMoveEntry', handleOnCapture);
        if (this.onDoubleClick) this.registerForEvent('dblclick', this, 'onDoubleClick', handleOnCapture);

        if (this.onSelectStart) this.registerForEvent('selectstart', this, 'onSelectStart', handleOnCapture);
        // if (this.onSelectionChange) this.registerForEvent('selectionchange', this, 'onSelectionChange', handleOnCapture);

        if (this.onContextMenu) this.registerForEvent('contextmenu', this, 'onContextMenu', handleOnCapture);

        if (this.onMouseWheelEntry) this.registerForEvent('mousewheel', this, 'onMouseWheelEntry',
handleOnCapture);
        if (this.onMouseOver) this.registerForEvent('mouseover', this, 'onMouseOver', handleOnCapture);
        if (this.onMouseOut) this.registerForEvent('mouseout', this, 'onMouseOut', handleOnCapture);
        if (this.onHTML5DragEnter) this.registerForEvent('drageEnter', this, 'onHTML5DragEnter', handleOnCapture);
        if (this.onHTML5DragOver) this.registerForEvent('dragover', this, 'onHTML5DragOver', handleOnCapture);
        if (this.onHTML5Drag) this.registerForEvent('drag', this, 'onHTML5Drag', handleOnCapture);
        if (this.onHTML5Drop) this.registerForEvent('drop', this, 'onHTML5Drop', handleOnCapture);

    },
    registerForOtherEvents: function(handleOnCapture) {
        if (this.onChange) this.registerForEvent('change', this, 'onChange', handleOnCapture);
        if (this.onScroll) this.registerForEvent('scroll', this, 'onScroll', handleOnCapture);
    },
    registerForTouchEvents: function(handleOnCapture) {
        if (!UserAgent.isTouch || true) return;
        if (this.onTouchStart)
            this.registerForEvent('touchstart', this, 'onTouchStart', handleOnCapture);
        if (this.onTouchEnd)
            this.registerForEvent('touchend', this, 'onTouchEnd', handleOnCapture);
    },
    registerForFocusAndBlurEvents: function() {
        this.registerForEvent('blur', this, 'onBlur', true);
        this.registerForEvent('focus', this, 'onFocus', true);
    },


    triggerEvent: function(evt) {
        return this.renderContextDispatch('triggerEvent', evt);
    },

    onMouseDown: function(evt) {
        return false;
    },

    onMouseDownEntry: function(evt) {
        if (this.showsMorphMenu
          && evt.isRightMouseButtonDown() // only world morph is present?
          && this.world().morphsContainingPoint(evt.getPosition()).length === 1) {
            this.world().worldMenuOpened = true;
            this.showMorphMenu(evt);
            return false;
        }

        if (evt.isAltDown()) {
            // "that" construct from Antero Taivalsaari's Lively Qt
            Global.that = evt.world.clickedOnMorph;
            alertOK('that = ' + Global.that);
        }

        if (this.isHalo) {
            evt.hand.haloLastClickedOn = this;
        }

        // This is like clickedOnMorph, but also takes into consideration
        // Halos, Morphs ignoring events etc. For internal use.
        evt.hand.internalClickedOnMorph = this;

        // do we pass the event to the user defined handler?
        if (this.eventsAreIgnored) return false;
        evt.world.clickedOnMorph = this;
        evt.world.clickedOnMorphTime = Date.now();
        evt.hand.scrollFocusMorph = this;

        return this.onMouseDown(evt);

    },

    onMouseUp: function(evt) { return false; },
    onMouseUpEntry: function(evt) {
        var world = evt.world,
            completeClick = world.clickedOnMorph === this,
            internalCompleteClick = evt.hand.internalClickedOnMorph === this;

        if (true || completeClick) {
            (function() {
                world.clickedOnMorph = null;
                evt.world.eventStartPos = null;
            }).delay(0)
        }

        if (completeClick && this.showsMorphMenu && evt.isRightMouseButtonDown()) {
            // special behavior for world menu:
            // you can navigate the world menu with a pressed right mouse button
            if (this.isWorld) {
                if (this.worldMenuOpened) {
                    this.worldMenuOpened = false;
                    return this.onMouseUp(evt); // open a menu item
                } else {
                    this.worldMenuOpened = true;
                    this.showMorphMenu(evt);
                    return true;
                }
            } else {
                this.showMorphMenu(evt);
                return true;
            }
        }

        if (internalCompleteClick) {
            var invokeHalos = (evt.isLeftMouseButtonDown() && evt.isCommandKey())
                           || (this.showsHalosOnRightClick && evt.isRightMouseButtonDown());
            if (invokeHalos) {
                this.toggleHalos(evt);
                return false;
            }
        }

        // From this point, events can be ignored (grab, onClick, ...)
        if (this.eventsAreIgnored && !this.isHalo) return false;

        if (completeClick && evt.isLeftMouseButtonDown() && this.grabMe(evt)) return true;

        return this.onMouseUp(evt);
    },

    onMouseWheel: function(evt) {
        return false;
    },

    onMouseWheelEntry: function(evt) {
        evt.hand.lastScrollTime = new Date().getTime();
        this.prevScroll = this.getScroll();
        var world = evt.world;
        if (!world || !evt.hand.scrollFocusMorph) { return false }
        var scrollable = world.morphsContainingPoint(evt.getPosition())
                         .detect(function(ea) { return ea.isScrollable(); });
        if (!scrollable) { return false }
        if (scrollable.isInSameWindowAs(this.getTopmostMorph(evt.getPosition()))
          && scrollable.isInSameWindowAs(evt.hand.scrollFocusMorph)
          && evt.hand.scrollFocusMorph.isInFrontOf(scrollable, evt.getPosition())) {
            if (!scrollable.getWindow()) {
                // scrollable is not in a window hierarchy but in the world.
                // This will probably break nested scrollable structures in the world
                // but we don't seem to have them.
                if (scrollable !== evt.hand.scrollFocusMorph) {
                    scrollable.undoScroll(evt);
                    return false;
                }
            }
            // Lists seem to behave a little different than other scrollable morphs in Chrome,
            // hence the if/else orgy. Let the browser handle List scrolling
            if (!scrollable.isList) {
                scrollable.scrollWithMouseWheelEvent(evt);
                scrollable.onMouseWheel(evt);
                return true;
            } else {
                scrollable.stopScrollWhenBordersAreReached(evt);
                return false;
            }
        } else {
            // Thank you browser for scrolling me. I don't want that, because I'm not
            // focused enough! Let me go back!

            // work in progress TRAC ISSUE 230
            // the scrolling does not reset any more!

            //scrollable.undoScroll(evt);
            return true;
        }
        return true;
    },

    onMouseMove: function(evt) {},

    onMouseMoveEntry: function(evt) {
        if ((new Date().getTime() > evt.hand.lastScrollTime + 250) &&
                (!this.isText || this.isScrollable())) {
            evt.hand.scrollFocusMorph = this;
        }
        if (this.eventsAreIgnored) { return false; }
        return this.onMouseMove(evt);
    },
    onMouseOut: function(evt) { return false; },


    onContextMenu: function(evt) {
        // we are invoking menus in onMouseDown
        if (!this.eventsAreIgnored && !evt.isCtrlDown()) evt.stop()
    },

    dragTriggerDistance: 5, // the distance the mouse has to move before dragStart is triggered

    onDragStart: function(evt) {
        if (!this.eventsAreIgnored) this.isBeingDragged = true;
    },
    onDragEnd: function(evt) {
        if (this.eventsAreIgnored) { return }
        this.isBeingDragged = false;
        if (this.owner) {
            this.owner.submorphDragged(this, evt);
        }
    },
    onDrag: function(evt) {
        if (this.eventsAreIgnored) { return }
        var dragInterval = 50; // milliseconds
        var now = new Date().getTime();
    },
    onContextMenu: function(evt) {
        var ctrl = evt.isCtrlDown();
        if (!ctrl) evt.stop();
        return ctrl;
    },

},
'keyboard events', {
    onKeyDown: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        var c = evt.getKeyCode();
        if (c === Event.KEY_DELETE) return this.onDelPressed(evt);
        if (c === Event.KEY_BACKSPACE) return this.onBackspacePressed(evt);
        if (c === Event.KEY_TAB) return this.onTabPressed(evt);
        if (c === Event.KEY_RETURN) return this.onEnterPressed(evt);
        if (c === Event.KEY_ESC) return this.onEscPressed(evt);
        if (c === Event.KEY_HOME) return this.onHomePressed(evt);
        if (c === Event.KEY_END) return this.onEndPressed(evt);
        if (c === Event.KEY_PAGEUP) return this.onPageUpPressed(evt);
        if (c === Event.KEY_PAGEDOWN) return this.onPageDownPressed(evt);
        if (c === Event.KEY_LEFT) return this.onLeftPressed(evt);
        if (c === Event.KEY_RIGHT) return this.onRightPressed(evt);
        if (c === Event.KEY_UP) return this.onUpPressed(evt);
        if (c === Event.KEY_DOWN) return this.onDownPressed(evt);
        return false;
    },
    onKeyUp: Functions.False,
    onKeyPress: Functions.False,
    onEnterPressed: function(evt) { return false },
    onEscPressed: function(evt) { return false },

    onBackspacePressed: function(evt) {
        // don't trigger browser back
        if (this.eventsAreIgnored) { return false; }
        if (this.isFocused()) evt.preventDefault();
        return false;
    },
    onDelPressed: function(evt) { return false },
    onTabPressed: function(evt) { return false },
    onHomePressed: function(evt) { return false },
    onEndPressed: function(evt) { return false },
    onPageUpPressed: function(evt) { return false },
    onPageDownPressed: function(evt) { return false },
    onRightPressed: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        if (!this.showsHalos) return false;
        evt.stop();
        var dist = evt.isCommandKey() ? 10 : 1;
        this.world().withSelectedMorphsDo(function(ea) {
            ea.moveBy(pt(dist, 0));
            ea.halos && ea.halos.invoke('alignAtTarget');
        })
        return true;
    },
    onLeftPressed: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        if (!this.showsHalos) return false;
        evt.stop();
        var dist = evt.isCommandKey() ? 10 : 1;
        this.world().withSelectedMorphsDo(function(ea) {
            ea.moveBy(pt(-dist, 0));
            ea.halos && ea.halos.invoke('alignAtTarget');
        })
        return true;
    },
    onUpPressed: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        if (!this.showsHalos) return false;
        evt.stop();
        var dist = evt.isCommandKey() ? 10 : 1;
        this.world().withSelectedMorphsDo(function(ea) {
            ea.moveBy(pt(0, -dist));
            ea.halos && ea.halos.invoke('alignAtTarget');
        })
        return true;
    },
    onDownPressed: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        if (!this.showsHalos) return false;
        evt.stop();
        var dist = evt.isCommandKey() ? 10 : 1;
        this.world().withSelectedMorphsDo(function(ea) {
            ea.moveBy(pt(0, dist));
            ea.halos && ea.halos.invoke('alignAtTarget');
        })
        return true;
    },

},
'touch events', {
    onTouchStart: function(evt) {
        evt.world.touchedMorph = this;
        this.lastTimeClickedOnIpad = new Date();
    },
    onTouchEnd: function(evt) {
    if (this === evt.world.touchedMorph)
        if ((new Date() - this.lastTimeClickedOnIpad) > 1000)
            this.toggleHalos(evt);
    },
},
'focus and blur', {
    onBlur: function(evt) {
        delete lively.morphic.Morph.prototype._focusedMorph;
    },
    onFocus: function(evt) {
        if (!this.isFocusable()) { this.blur(); return };
        lively.morphic.Morph.prototype._focusedMorph = this;
    },
    focusedMorph: function() { return lively.morphic.Morph.prototype._focusedMorph },
    hasKeyboardFocus: function() { return this.isFocused() },
    isFocused: function() { return lively.morphic.Morph.prototype._focusedMorph === this },
    focus: function() { return this.renderContextDispatch('focus') },
    blur: function() { return this.renderContextDispatch('blur') },
    enableFocus: function() { return this.morphicSetter('Focusable', true) },
    disableFocus: function() { return this.morphicSetter('Focusable', false) },
    isFocusable: function() {
        var val = this.morphicGetter('Focusable');
        return val === undefined ? true : val;
    },



},
'grabbing and dropping', {
    enableGrabbing: function() {
        this.grabbingEnabled = true;
    },
    disableGrabbing: function() { this.grabbingEnabled = false },

    enableDropping: function() {
        this.droppingEnabled = true;
    },
    disableDropping: function() { this.droppingEnabled = false },
    enableDragging: function() { this.draggingEnabled = true },
    disableDragging: function() { this.draggingEnabled = false },



    dropOnMe: function(evt) {
        if (!this.droppingEnabled || this.eventsAreIgnored) return;
        if (evt.hand.submorphs.length == 0) return false;
        for (var i = 0; i < this.submorphs.length; i++)
            if (this.submorphs[i].manualDropOnMe(evt)) return true;
        if (this.owner != evt.hand)
            return evt.hand.dropContentsOn(this, evt);
        return false;
    },
    dropOn: function(aMorph) {
        var placeholderPosition;
        if (this.placeholder) {
            placeholderPosition = this.placeholder.getPosition();
        }
        aMorph.addMorph(this);
        this.onDropOn(aMorph);
        if (placeholderPosition) {
            delete(this.placeholder);
            this.setPosition(placeholderPosition.subPt(this.getOrigin())); //.subPt(pt(1,1)));
            aMorph.applyLayout();
        }
        var layouter = aMorph.getLayouter();
        if (layouter) {
            layouter.removeAllPlaceholders();
        }
    },
    onDropOn: function(aMorph) {
        // called in onDrop after self has been added to aMorph
        return false;
    },


    manualDropOnMe: function(evt) {
        // this is a workaround. HTML events are not delivered to the required morph
        // under the hand when the hand already carries submorphs that overlap
        // var localPt = this.localize(evt.getPosition());
// alert('' + this.getBounds() + ' vs ' + this.localize(evt.getPosition()))
        return this.fullContainsWorldPoint(evt.getPosition()) ? this.dropOnMe(evt) : false;
    },
    grabMe: function(evt) {
        return this.grabbingEnabled && evt.hand.grabMorph(this, evt);
    },
    getGrabShadow: function (local) {
        var shadow = new lively.morphic.Morph(lively.persistence.Serializer.newMorphicCopy(this.shape));
        this.submorphs.forEach(function(ea) { shadow.addMorph(ea.getGrabShadow(true)) })

        shadow.isGrabShadow = true;
        shadow.applyStyle({
            fill: this.getFill() === null ? Color.gray : Color.gray.darker(), opacity: 0.5})
        shadow.connections = [
            lively.bindings.connect(this, 'rotation', shadow, 'setRotation'),
            lively.bindings.connect(this, 'scale', shadow, 'setScale')];
        shadow.addScript(function remove() {
            $super();
            this.connections.invoke('disconnect');
            this.submorphs.invoke('remove')
        })
        shadow.setTransform(local ? this.getTransform() : this.getGlobalTransform());
        shadow.disableDropping();
        //shadow.originalMorph = this;
        //this.grabShadow = shadow;
        return shadow;
    },

},
'scrolling', {
    getScrollableNode: function(evt) {
        // FIXME HTML specific
        // FIXME pass evt on all calls
        return this.basicGetScrollableNode();
    },
    basicGetScrollableNode: function() {
        // FIXME HTML specific
        return this.renderContext().shapeNode; //morphNode;
    },

    showsHorizontalScrollBar: function() {
        return this.renderContextDispatch('showsHorizontalScrollBar');
    },
    showsVerticalScrollBar: function() {
        return this.renderContextDispatch('showsVerticalScrollBar');
    },
    getScrollBarExtent: function() { return this.renderContextDispatch('getScrollBarExtent') },
},
'opening', {
    openInHand: function() {
        lively.morphic.World.current().firstHand().grabMorph(this);
    },
    correctForDragOffset: function(evt) {
        // do I respond to onSelectStart in a meaningful way?
        if (this.getWindow()) return false;
        if (this.lockOwner() && this.isLocked()) return false;
        return true;
    },
    isTopmostMorph: function(aPoint) {
        var world = this.world();
        if (!world) { return true; }
        var morphStack = world.morphsContainingPoint(aPoint);
        if (morphStack.length < 2) { return true; };
        //return (morphStack[0] === this);
        return this.getTopmostMorph(aPoint) === this;
    },
    getTopmostMorph: function(aPoint) {
        if (aPoint == undefined) throw new Error("getTopmostMorph must be called with a parameter");
        var world = this.world();
        if (!world) { return this; }
        // cannot just return morphsContainingPoint(aPoint)[0] because of layout placeholders
        return world.morphsContainingPoint(aPoint).detect(
            function(ea) {
                return  !ea.isPlaceholder &&
                        !ea.isHalo &&
                        (!ea.owner || !ea.owner.isHalo); });
    },



    isScrollableHTML: function() {
        // HTML specific
        if (this.isList) {
            return true;
        }
        var overflow = this.renderContext().shapeNode.style.getPropertyValue('overflow');
        if (!overflow || overflow === 'visible' || overflow === 'hidden' || overflow === 'inherit') {
            // inherit returns false because parent node is non-scrollable div.
            return false;
        }
        return true;
    },
    isScrollable: function() {
        return this.isScrollableHTML();
    },
    isInSameWindowAs: function(anotherMorph) {
        return this.getWindow() === anotherMorph.getWindow();
    },
    isInFrontOf: function(anotherMorph, aPoint) {
        var world = this.world();
        if (!world) { return true; }
        var morphStack = this.morphsContainingPoint(aPoint);
        for (var i = 0; i < morphStack.length; i++) {
            if (morphStack[i] === this) {
                return true;
            } else if (morphStack[i] === anotherMorph) {
                return false;
            }
        }
        return false;

    },






});

lively.morphic.Text.addMethods(
'event settings', {
    accessibleInInactiveWindow: false,
},
'event managment', {
    ignoreEvents: function($super) {
        $super();
        this.renderContextDispatch('ignoreTextEvents');
    },
    unignoreEvents: function($super) {
        $super();
        this.renderContextDispatch('unignoreTextEvents');
    },

    enableEvents: function($super) {
        $super();
        this.renderContextDispatch('enableTextEvents');
    },

    registerForKeyboardEvents: function($super, handleOnCapture) {
        $super(handleOnCapture);
        this.registerForEvent('paste', this, 'onPaste', handleOnCapture);
        this.registerForEvent('cut', this, 'onCut', handleOnCapture);
    },
    registerForFocusAndBlurEvents: function() {
        // FIXME this should be done in EventHandler!!!!
        var self = this;
        // late bind event methods
        this.renderContext().textNode.onblur = function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onBlur(evt)
        };
        this.renderContext().textNode.onfocus = function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onFocus(evt)
        };
    }
},
'event handling', {
    onSelectStart: function(evt) {
        if (this.eventsAreIgnored)
            evt.stop();
// alert(this.getSelectionRange())
        // if (!this.bounds().containsPoint(evt.getPosition()))
            // evt.preventDefault();
        // just do the normal thing
        return true;
    },
    onSelectionChange: function() {},

    onBlur: function($super, evt) {
        $super(evt);
        delete this.constructor.prototype.activeInstance;
        // force that some morph has a focus
        var world = this.world();
        if (!world) return;
        (function() {
            if (!world.focusedMorph()) world.focus();
        }).delay(0);
    },
    onFocus: function($super, evt) {
        $super(evt);
        this.constructor.prototype.activeInstance = this;
    },
    correctForDragOffset: function(evt) {
        return !this.allowInput;
    }
});
lively.morphic.List.addMethods(
'mouse events', {
    onMouseDown: function(evt) {

        if (evt.isCommandKey()) {
            evt.preventDefault()
            return false;
        }

        if (evt.isRightMouseButtonDown()) {
            // delayed because when owner is a window and comes forward the window
            // would be also in front of the new menu
            var sel = this.selection ? this.selection.string : this.selection;
            lively.morphic.Menu.openAt.curry(evt.getPosition(), sel, this.getMenu()).delay(0.1);
            evt.stop();
            return true;
        }
        return false;
    },
    onMouseUp: function (evt) {

        if (evt.isLeftMouseButtonDown()) {
            var idx = this.renderContextDispatch('getItemIndexFromEvent', evt);
            // don't update when selection can't be found
            // this happens e.g. when clicked on a scrollbar
            if (idx >= 0) {
                this.updateSelectionAndLineNoProperties(idx);
            }

            if (idx >= 0 && this.isMultipleSelectionList && evt.isShiftDown()) {
                if (this.getSelectedIndexes().include(idx))
                    this.deselectAt(idx)
                else
                    this.selectAt(idx);
            }
        }

        evt.stop();
        return true;
    },
    onMouseUpEntry: function ($super, evt) {
        var completeClick = evt.world && evt.world.clickedOnMorph === this;

        if (completeClick && evt.isRightMouseButtonDown()) {
            return false;
        }
        return $super(evt)
    },
    onMouseOver: function(evt) {
        /*if (this.selectOnMove) {
            var idx = this.selectItemFromEvt(evt);
            evt.stopPropagation();
            return idx > -1;
        }*/
        return false;
    },
    onMouseMove: function(evt) {
        evt.stop();
        return true;
    },


    selectItemFromEvt: function(evt) {
        var idx = this.renderContextDispatch('getItemIndexFromEvent', evt);
        this.selectAt(idx);
        return idx;
    },
},
'keyboard events', {
    onUpPressed: function($super, evt) {
        if (evt.isCommandKey()) return $super(evt);
        evt.stop();
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, this.selectedLineNo-1)));
        return true;
    },
    onDownPressed: function($super, evt) {
        if (evt.isCommandKey()) return $super(evt);
        evt.stop();
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, this.selectedLineNo+1)));
        return true;
    },

},
'scrolling', {
    basicGetScrollableNode: function(evt) {
        return this.renderContext().listNode;
    },
    correctForDragOffset: function(evt) {
        return false;
    },
    onChange: function(evt) {
        var idx = this.renderContextDispatch('getSelectedIndexes').first();
        this.updateSelectionAndLineNoProperties(idx);
        this.changeTriggered = true; // see onBlur
        return false;
    },



});

lively.morphic.DropDownList.addMethods(
'properties', {
    isDropDownList: 'true', // triggers correct rendering
},
'mouse events', {
    onMouseDown: function(evt) {
        if (evt.isCommandKey()) {
            evt.preventDefault()
            return false;
        }

        this.changeTriggered = false; // see onBlur
        return true;
     },


    onChange: function (evt) {
        var idx = this.renderContextDispatch('getSelectedIndexes').first();
        this.updateSelectionAndLineNoProperties(idx);
        this.changeTriggered = true; // see onBlur
        return false;
    },
    onBlur: function(evt) {
        // drop down lists are stupid
        // onChange is not triggered when the same selection is choosen again
        // however, we want to now about any selection
        // kludge for now: set selection anew when element is blurred...
        if (this.changeTriggered) return;
        var idx = this.renderContextDispatch('getSelectedIndexes').first();
        this.updateSelectionAndLineNoProperties(idx);
    },



    registerForOtherEvents: function($super, handleOnCapture) {
        $super(handleOnCapture)
        if (this.onBlur) this.registerForEvent('blur', this, 'onBlur', handleOnCapture);
    },


});

lively.morphic.Clip.addMethods(
'scrolling', {
    basicGetScrollableNode: function() {
        // FIXME HTML specific
        return this.renderContext().shapeNode; //morphNode;
    }
});

lively.morphic.World.addMethods(
'event management', {
    registerForEvents: function($super, handleOnCapture) {
        $super(handleOnCapture);
        this.registerForGlobalEvents();
    },

    registerForGlobalEvents: function() {
        // FIXME this should be done in EventHandler!!!!
        var self = this;
        // late bind event methods
        document.onmousewheel = function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onMouseWheel(evt);
        };
        Global.window.onresize = function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onWindowResize(evt);
        };
        Global.window.onscroll = function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onWindowScroll(evt);
        };

    },
},
'keyboard event handling', {
    onKeyDown: function($super, evt) {
        if ($super(evt)) return true;
        if (!this.isFocused()) return false;

        if (evt.isCommandKey()) {
            var result = this.processCommandKeys(evt);
            if (result) evt.stop();
            return result
        }

        return true;
    },
    onKeyPress: function(evt) {
        if (!this.isFocused()) return false;
        evt.stop();
        return true;
    },
    onKeyUp: function(evt) {
        return false;
    },

    processCommandKeys: function(evt) {
        var key = evt.getKeyChar();
        if (key) key = key.toLowerCase();

        if (evt.isShiftDown()) {  // shifted commands here...
            switch (key) {
                case "f": {
                    LastWorld = this;

                this.world();
                    var world = this;
                    world.prompt("find source: ", function(s) {
                        if (!s) {
                            alertOK('nothing to search...');
                            return
                        }
                        world.openMethodFinderFor(s);
                    })
                    return true;
                }
            }
        }

        switch (key) {
            case "r": {
                // let the browser handle reload ...
                return false
            }
            case "w": {
                // many browsers won't allow this
                alert('close window?'); return true; }
            case "s": { this.saveWorld(); return true; }
            case "b": {this.openSystemBrowser(evt); return true; }
            case "k": { this.openWorkspace(evt); return true; }
            case "p": { this.openPartsBin(evt); return true; }
        }

        switch(evt.getKeyCode()) {
            case 221/*cmd+]*/: { this.alert('CMD+[ disabled'); return true }
            case 219/*cmd+[*/: { this.alert('CMD+] disabled'); return true }
        }

        return false;
    },

    onBackspacePressed: function(evt) {
        if (!this.isFocused()) return;
        alert('<BACKSPACE> disabled')
        evt.stop(); // so that we not accidently go back
        return true;
    },
},
'mouse event handling', {
    onMouseDown: function($super, evt) {
        this.eventStartPos = evt.getPosition();
        var activeWindow = this.getActiveWindow();
        if (activeWindow) {
            activeWindow.highlight(false)
        };

        // remove the selection when clicking into the world...
         if(this.selectionMorph && $world.selectionMorph.owner
            && (this.morphsContainingPoint(this.eventStartPos).length == 1)) {
            this.resetSelection()
        }

        return false;
    },
    onMouseUp: function(evt) {
        evt.hand.removeOpenMenu(evt);
        if (!evt.isCommandKey() && (!this.clickedOnMorph || !this.clickedOnMorph.isHalo)
                                && !this.ignoreHalos) {
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

        return false;
    },
    onMouseMove: function(evt) {
        evt.hand.move(evt);

        // dargging was initiated before, just call onDrag
        if (this.draggedMorph) {
            this.draggedMorph.onDrag && this.draggedMorph.onDrag(evt);
            return false;
        }

        // try to initiate dragging and call onDragStart
        var targetMorph = this.clickedOnMorph;
        if (!targetMorph) return false;


        var minDragDistReached = this.eventStartPos &&
            (this.eventStartPos.dist(evt.getPosition()) > targetMorph.dragTriggerDistance);

        if (!minDragDistReached) return false;

        if (evt.isCommandKey() && !targetMorph.isEpiMorph && evt.isLeftMouseButtonDown()) {
            if (evt.hand.submorphs.length > 0) return;
            if (!targetMorph.isGrabbable(evt)) return;  // Don't drag world, etc
            evt.hand.grabMorph(targetMorph);
            return;
        }

        if (evt.isShiftDown() && !targetMorph.isEpiMorph && evt.isLeftMouseButtonDown()) {
            if (evt.hand.submorphs.length > 0) return;
            if (!targetMorph.owner) return;
              if (targetMorph instanceof lively.morphic.World) return

            targetMorph.removeHalos();
            // alertOK("copy " + targetMorph);

            var copy = targetMorph.copy();

            targetMorph.owner.addMorph(copy); // FIXME for setting the right position
            evt.hand.grabMorph(copy);
            targetMorph = copy;
            return;
        }

        if (targetMorph.isGrabbable()) { // world is never grabbable ...
            // morphs that do not have a selection can be dragged
            // (Lists, Texts, Boxes inside a window cannot be dragged by just clicking and moving)
            // before dragging, we want to move the mouse pointer back to the spot we
            // clicked on when we started dragging.
            // FIXME this should also work for Cmd-Drag and Shift-Drag
            var lockOwner = targetMorph.lockOwner(),
                grabTarget = lockOwner && targetMorph.isLocked() ? lockOwner : targetMorph;
            if (grabTarget.correctForDragOffset()) {
                grabTarget.moveBy(evt.getPosition().subPt(this.eventStartPos));
            }
            this.draggedMorph = targetMorph;
            this.draggedMorph.onDragStart && this.draggedMorph.onDragStart(evt);
        } else if (targetMorph === this) { // world handles selections
            this.draggedMorph = this;
            this.onDragStart(evt);
        }
        return false;
    },
    dispatchDrop: function(evt) {
        if (evt.hand.submorphs.length == 0) return false;
        var morphStack = this.morphsContainingPoint(evt.getPosition()),
            dropTarget = morphStack.detect(function(ea) { return ea.droppingEnabled && !ea.eventsAreIgnored });
        if (!dropTarget) {
            alert('found nothing to drop onto');
            return false;
        }
        return evt.hand.dropContentsOn(dropTarget, evt);
    },
    onMouseWheel: function($super, evt) {
        if (!evt.isCommandKey()) return $super(evt);
        evt.preventDefault();

        var wheelDelta = evt.wheelDelta,
            oldScale = this.getScale();

        var minScale = 0.1, maxScale = 10;
        if (oldScale < minScale && wheelDelta < 0) return false;
        if (oldScale > maxScale && wheelDelta > 0) return false;
        var scaleDelta = 1 + wheelDelta / 3000;

        // this.scaleBy(scaleDelta);
        var newScale = oldScale * scaleDelta;
        newScale = Math.max(Math.min(newScale, maxScale), minScale);
        this.setScale(newScale)

        // actually this should be a layoutChanged but implementing
        // layoutChanged in WorldMorph is expensive since it is always called when a
        // submorph's layout is changed (owner chain propagation)
        // this.resizeCanvasToFitWorld();

        // Zoom into/out of the current mouse position:
        // p is the current mouse position. If we wouldn't move the window the new mouse pos would be scaledP.
        // We calculate the vector from scaledP to p and scale that by the current scale factor
        // We end up with a vector that can be used to scroll the screen to zoom in/out
        var p = evt.getPosition(),
            scaledP = p.scaleBy(1/scaleDelta),
            translatedP = p.subPt(scaledP).scaleBy(this.getScale());
        Global.scrollBy(translatedP.x, translatedP.y)

        return true
    },

    onSelectStart: function(evt) {
        if (this.clickedOnMorph && !this.clickedOnMorph.isText && !this.clickedOnMorph.isList)
            evt.stop();
        if (this.clickedOnMorph && this.clickedOnMorph.isText && !this.clickedOnMorph.allowInput)
            evt.stop()
        return false;
    },
    onHTML5DragEnter: function(evt) {
        evt.stop();
        return true;
    },
    onHTML5DragOver: function(evt) {
        evt.stop();
        return true;
    },
    onHTML5Drop: function(evt) {
        // see https://developer.mozilla.org/en/Using_files_from_web_applications
        evt.stop();
        var files = evt.dataTransfer.files;
        if (files) new lively.FileUploader().handleDroppedFiles(files, evt);
        return true;
    }


},
'window related', {
    onWindowResize: function(evt) {
    },
    onWindowScroll: function(evt) {
        // alert('window scrolled')
    },
    onScroll: function(evt) {
        // This is a fix for the annoying bug that cost us a keynote...
        var node = this.renderContext().morphNode;
        // var scrollTop = node.scrollTop,
            // scrollLeft = node.scrollLeft;
        // Global.scroll(scrollTop, scrollLeft)
        node.scrollTop = 0
        node.scrollLeft = 0
    },
    correctForDragOffset: function(evt) {
        return false;
    },
    updateScrollFocus: function() {
        var that = this;
        this.hands.forEach(function(hand) {
            hand.scrollFocusMorph = that.getTopmostMorph(hand.getPosition());
        });
    },
},
'scrolling', {
    getScroll: function() {
        return this.morphicGetter('Scroll') || [0,0];
    },
    setScroll: function(x, y) {
        // setScroll of Scrollable Trait does not work: window has no overflow
        return this.morphicSetter('Scroll', [x, y]);
    }
});
Object.subclass('lively.FileUploader',
'file reader', {
    getFileReader: function(spec) {
        var self = this;
        return Object.extend(new FileReader(), {
            options: spec,
            onload: function(evt) { spec.onLoad && self[spec.onLoad](evt, spec) },
            onerror: function(evt) { spec.onError && self[spec.onError](evt, spec) },
            onloadstart: function(evt) { spec.onLoadStart && self[spec.onLoadStart](evt, spec) },
            onloadend: function(evt) { spec.onLoadEnd && self[spec.onLoadEnd](evt, spec) },
            onprogress: function(evt) { spec.onProgress && self[spec.onProgress](evt, spec) }
        });
    },

    uploadBinary: function(url, mime, binaryData, onloadCallback) {
        alert('Uploading to ' + url);
        var webR = new WebResource(url)

        webR.enableShowingProgress();
        connect(webR, 'progress', {onProgress: function(evt) {
            if (!evt.lengthComputable) return;
            var percentage = Math.round((evt.loaded * 100) / evt.total);
            alertOK('Uploading ' + percentage + "%");
        }}, 'onProgress');

        if (onloadCallback)
            connect(webR, 'status', {onLoad: onloadCallback}, 'onLoad');

        webR.beBinary().beAsync().put(binaryData)
        return webR;
    }
},
'file reader events', {
    onError: function(evt, spec) { alert('Error occured while uploading file ' + spec.file.name) },
    onLoadStart: function(evt, spec) { alertOK('Started uploading ' + spec.file.name) },
    onLoadEnd: function(evt, spec) { alertOK('Finished uploading ' + spec.file.name) },
    onProgress: function(evt, spec) {
        if (!evt.lengthComputable) return;
        var percentage = Math.round((evt.loaded * 100) / evt.total);
        alertOK('Uploading ' + spec.file.name + ': ' + percentage + "%");
    },
    onLoad: function(evt) {
        alert('Uploaded file ' + spec.file.name + ' but don\'t know what to do now...!')
    }
},
'image loading', {
    onLoadImage: function(evt, spec) {
        var img = new lively.morphic.Image(spec.pos.extent(pt(200,200)), evt.target.result, true).openInWorld();
        img.name = spec.file.name;
    }
},
'video loading', {
    onLoadVideo: function(evt, spec) {
        this.uploadAndOpenVideoTo(
            URL.source.withFilename(spec.file.name),
            spec.file.type, evt.target.result, spec.pos);
    },

    openVideo: function(url, mime, pos) {
        // new lively.FileUploader().openVideo('http://lively-kernel.org/repository/webwerkstatt/documentation/videoTutorials/110419_ManipulateMorphs.mov', 'video/mp4')
        if (/*mime.include('webm')*/true) {
            var videoNode = XHTMLNS.create('video');
            videoNode.width = 400;
            videoNode.height = 300;
            videoNode.controls = true;
            var sourceNode = XHTMLNS.create('source');
            sourceNode.src = url;
            videoNode.appendChild(sourceNode);

            if (mime.include('quicktime')) mime = mime.replace('quicktime', 'mp4');

            if (mime.include('mp4')) {
                sourceNode.type = mime + '; codecs="avc1.42E01E, mp4a.40.2"'
            } else if (mime.include('webm')) {
                sourceNode.type = mime //+ '; codecs="vp8, vorbis"'
            } else {
                sourceNode.type = mime;
                alert('video with type ' + mime + ' currently not supported');
            }
        } else {
            var embedNode = XHTMLNS.create('object');
            embedNode.type = mime;
            embedNode.data = url;
            embedNode.play="false"
            // embedNode.scale="tofit"
            embedNode.width="400"
            embedNode.height="400"
            var videoNode = embedNode
            // XHTMLNS.create('object');
            // videoNode.appendChild(embedNode)
        }

        // FIXME implement video morph?
        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(videoNode));
        morph.applyStyle({borderWidth: 1, borderColor: Color.black})
        morph.openInWorld(pos);
    },

    uploadAndOpenVideoTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openVideo(url, mime, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    }
},
'pdf loading', {
    onLoadPDF: function(evt, spec) {
        this.uploadAndOpenPDFTo(
            URL.source.withFilename(spec.file.name),
            spec.file.type, evt.target.result, spec.pos);
    },
    onLoadText: function(evt, spec) {
        lively.morphic.World.current().addTextWindow({title: spec.file.name, content: evt.target.result});
    },

    uploadAndOpenPDFTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openPDF(url, mime, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);

    },
    openPDF: function(url, mime, pos) {
        if (false) {
            var embedNode = XHTMLNS.create('embed');
            embedNode.type = mime;
            embedNode.src = url;
            embedNode.width="400"
            embedNode.height="400"
            var pdfNode = embedNode
        } else {
            var objectNode = XHTMLNS.create('object');
            objectNode.type = mime;
            objectNode.data = url;
            objectNode.width="400"
            objectNode.height="400"
            var linkNode = XHTMLNS.create('a');
            linkNode.setAttribute('href', url);
            linkNode.textContent = url
            objectNode.appendChild(linkNode);
            var pdfNode = objectNode;
        }
        // FIXME implement video morph?
        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(pdfNode));
        morph.addScript(function getURL() { return this.renderContext().shapeNode.childNodes[0].href })
        morph.addScript(function setURL(url) {
            this.renderContext().shapeNode.data = String(url);
            this.renderContext().shapeNode.childNodes[0].href = String(url)
            var owner = this.owner;
            if (!owner) return;
            this.remove();
            owner.addMorph(this)
        })

        morph.applyStyle({borderWidth: 1, borderColor: Color.black})
        morph.openInWorld(pos);
    }

},
'drop handling', {
    handleDroppedFiles: function(files, evt) {
        // Seperate file types
        var images = [], videos = [], pdfs = [], texts = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i],
                imageType = /image.*/,
                videoType = /video.*/,
                pdfType = /application\/pdf/,
                textType = /text.*/;

            if (file.type.match(imageType)) images.push(file);
            else if (file.type.match(videoType)) videos.push(file);
            else if (file.type.match(pdfType)) pdfs.push(file);
            else texts.push(file);
        }
        this.loadAndOpenDroppedFiles(evt, images, {onLoad: 'onLoadImage'});
        this.loadAndOpenDroppedFiles(evt, videos, {onLoad: 'onLoadVideo', asBinary: true});
        this.loadAndOpenDroppedFiles(evt, pdfs, {onLoad: 'onLoadPDF', asBinary: true});
        this.loadAndOpenDroppedFiles(evt, texts, {onLoad: 'onLoadText', asText: true});

        // if (texts.length > 0) inspect(texts)
    },

    loadAndOpenDroppedFiles: function(evt, files, options) {
        var pos = evt.getPosition();
        files.forEach(function(file, i) {
            var fileReaderOptions = {
                    onLoad: options.onLoad || 'onLoad',
                    onError: options.onError || 'onError',
                    onLoadStart: options.onLoadStart || 'onLoadStart',
                    onLoadEnd: options.onLoadEnd || 'onLoadEnd',
                    onProgress: options.onProgress || 'onProgress',
                    file: file,
                    pos: pos.addXY(15*i,15*i)
                },
                reader = this.getFileReader(fileReaderOptions);
            if (options.asBinary) reader.readAsBinaryString(file);
            else if (options.asText) reader.readAsText(file);
            else reader.readAsDataURL(file);
        }, this);
    }
});

lively.morphic.HTML.RenderContext.addMethods(
'event handler management', {
    registerHandlerForEvent: function(handler, eventSpec) { handler.registerHTMLAndSVG(eventSpec) }
});
lively.morphic.SVG.RenderContext.addMethods(
'event handler management', {
    registerHandlerForEvent: function(handler, eventSpec) { handler.registerHTMLAndSVG(eventSpec) }
});
lively.morphic.Canvas.RenderContext.addMethods(
'event handler management', {
    registerHandlerForEvent: function(handler, eventSpec) { handler.registerCANVAS(eventSpec) }
});

lively.morphic.Morph.subclass('lively.morphic.HandMorph',
'settings', {
    style: {enableDropping: false, enableHalos: false}
},
'testing', {
    isHand: true,
},
'initializing', {
    addToWorld: function(world) {
        this._world = world;
        this.ignoreEvents();
        this.setFill(Color.red);
        this.setBounds(new Rectangle(0,0, 2, 2));
    }
},
'accessing -- morphic relationship', {
    world: function() { return this._world },
    hand: function() { return this },
    morphsContainingPoint: function(point, list) {
        return list || [];
    },
    morphUnderMe: function() {
        return this.world().morphsContainingPoint(this.getPosition()).first();
    },
},
'testing', {
    isPressed: function() {
        // FIXME, this depends on world behavior!!!
        return !!this.world().clickedOnMorph;
    },
},
'event handling', {
    grabMorph: function(morph, evt) {
        return this.grabMorphs([morph], evt)
    },
    grabMorphs: function(morphs, evt) {
        if (this.submorphs.length > 0) return false;
        this.carriesGrabbedMorphs = true;
        morphs.forEach(function(morph) {
            if (morph.grabByHand) morph.grabByHand(this)
            else this.addMorphWithShadow(morph)
        }, this)
        evt && evt.stop();
        return true;
    },

    addMorphWithShadow: function (morph) {
        var shadow = morph.getGrabShadow();
        if (shadow) this.addMorph(shadow);
        this.addMorph(morph);
        if (shadow)
            shadow.align(shadow.getPosition(), morph.getPosition().addXY(10,10))
    },

    dropContentsOn: function(morph, evt) {
        if (this.submorphs.length == 0) return false;
        this.carriesGrabbedMorphs = false;
        var submorphs = this.submorphs.clone();
        for (var i = 0; i < submorphs.length; i++) {
            var submorph = submorphs[i],
                submorphPos = submorph.getPosition();
            if (submorph.isGrabShadow) {
                submorph.remove();
            } else {
                submorph.dropOn(morph);
            }
        };
        evt.stop();
        return true;
    }
},
'menu', {
    removeOpenMenu: function(evt) {
        var menu = this.world().currentMenu;
        if (menu && !menu.bounds().containsPoint(evt.getPosition()))
            this.world().currentMenu.remove();
    }
},
'moving', {
    move: function(evt) {
        var offsetX = 2, offsetY = 2,
            pos = pt((evt.pageX || evt.clientX) + offsetX, (evt.pageY || evt.clientY) + offsetY);
        pos = pos.scaleBy(1/this.world().getScale())
        this.setPosition(pos);
        if (this.carriesGrabbedMorphs) {
            var carriedMorph = this.submorphs.detect(function(ea) {return !ea.isGrabShadow;}),
                topmostMorph = this.world().getTopmostMorph(evt.getPosition());
            if (!topmostMorph) {return;}
            var layouter = topmostMorph.getLayouter();
            if (!carriedMorph) { return; }
            if (layouter && layouter.displaysPlaceholders()) {
                layouter.showPlaceholderFor(carriedMorph, evt);
            } else if (carriedMorph.placeholder) {
                carriedMorph.destroyPlaceholder();
            }
        }
    },
});

// FIXME remove!!!
module('lively.morphic.EventExperiments').load();

}) // end of module
