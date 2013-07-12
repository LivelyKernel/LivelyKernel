module('lively.morphic.Events').requires('lively.morphic.Core', 'lively.morphic.TextCore', 'lively.morphic.HTML', 'lively.morphic.SVG', 'lively.morphic.Canvas', 'lively.Traits', 'lively.ide.commands.default').toRun(function() {

lively.morphic.EventSimulator = {
    createKeyboardEvent: function(spec) {
        var evt = document.createEvent("KeyboardEvent");
        evt.initKeyboardEvent(spec.type || "keypress", true, true, window,
            spec.ctrl || false, spec.alt || false, spec.shift || false, spec.meta || false,
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
    createMouseEvent: function(type, pos, button, keys) {
        // event.initMouseEvent(type, canBubble, cancelable, view,
        // detail, screenX, screenY, clientX, clientY,
        // ctrlKey, altKey, shiftKey, metaKey,
        // button, relatedTarget);

        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            0, 0, //pos.x, pos.y+100,
            pos.x - Global.scrollX, pos.y - Global.scrollY,
            keys.ctrl || false, keys.alt || false, keys.shift || false, keys.meta || false,
            button || 0/*left*/, null);
        lively.morphic.EventHandler.prototype.patchEvent(simulatedEvent);
        return simulatedEvent;
    },
    doMouseEvent: function(spec) {
        // type one of click, mousedown, mouseup, mouseover, mousemove, mouseout.
        if (!spec.type) spec.type = 'mousedown';
        if (!spec.pos) spec.pos = pt(0,0);
        if (!spec.button) spec.button = 0;
        var targetMorphOrNode = spec.target;

        var evt = this.createMouseEvent(spec.type, spec.pos, spec.button, spec.keys || {});
        if (targetMorphOrNode.isMorph) {
            targetMorphOrNode = targetMorphOrNode.renderContext().morphNode;
        }
        targetMorphOrNode.dispatchEvent(evt)
    },

    exampleCmdClick: function() {
        // here is how to simulate a cmd click on a button
        btn = this.get('btn');
        pos = btn.worldPoint(btn.innerBounds().center());

        keys = {meta: true}
        lively.morphic.EventSimulator.doMouseEvent({
            type: 'mousedown',
            pos: pos,
            target: btn,
            keys: keys
        });

        lively.morphic.EventSimulator.doMouseEvent({
            type: 'mouseup',
            pos: pos,
            target: btn,
            keys: keys
        })
    }
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
            .select(function(ea) { return !!ea; })
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
        var existing = this.dispatchTable[eventSpec.type];
        if (existing) { this[existing.unregisterMethodName](existing); }
        this.dispatchTable[eventSpec.type] = eventSpec;
    },
    enable: function() {
        this.eventSpecsDo(function(eventSpec) {
            this.morph.renderContext().registerHandlerForEvent(this, eventSpec);
        }, this);
    },

    registerHTMLAndSVG: function(eventSpec) {
        var handler = this,
            node = this.morph.renderContext().morphNode;

        if (!node) {
            throw new Error('Cannot register Event handler because cannot find '
                           + 'HTML/SVG morphNode');
        }

        eventSpec.node = node;
        eventSpec.doNotSerialize = ['node'];
        // bind is too expensive here
        eventSpec.handlerFunc = function(evt) { handler.handleEvent(evt); };
        eventSpec.unregisterMethodName = 'unregisterHTMLAndSVGAndCANVAS';
        eventSpec.node.addEventListener(
            eventSpec.type, eventSpec.handlerFunc, eventSpec.handleOnCapture);
        this.register(eventSpec);
    },
    registerCANVAS: function(eventSpec) {
        var handler = this;
        dbgOn(eventSpec.node, 'EventHandler still registered in DOM?');
        eventSpec.node = this.morph.renderContext().getCanvas();
        if (!eventSpec.node) {
            throw dbgOn(new Error('Cannot register event handler because cannot'
                                  + 'find CANVAS node'));
        }
        eventSpec.handlerFunc = function(evt) { handler.handleEventCANVAS(evt); };
        eventSpec.unregisterMethodName = 'unregisterHTMLAndSVGAndCANVAS';
        eventSpec.handleOnCapture = false;
        eventSpec.node.addEventListener(
            eventSpec.type, eventSpec.handlerFunc, eventSpec.handleOnCapture);
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
        delete evtSpec.handlerFunc;
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
        // eventSpec maps morphs and morphic event handlers to events
        var eventSpec = this.dispatchTable[evt.type];
        if (!eventSpec) return false;
        var target = eventSpec.target; // the morph
        if (target.eventsAreDisabled) return false;
        if (Global.LastEventWasHandled && evt === Global.LastEvent) return false;
        // add convenience methods to the event
        this.patchEvent(evt);
        Global.LastEvent = evt;
        Global.LastEventWasHandled = false;
        // invoke event handler methods
        var wasHandled;
        try {
            wasHandled = target[eventSpec.targetMethodName](evt);
        } catch(e) {
            this.handleError(e, target, eventSpec);
        }
        // when an event handler returns true it means that the event was
        // handled and no other morphs should deal with it anymore
        // note: this is not the same as evt.stop() !!!
        Global.LastEventWasHandled = Global.LastEventWasHandled || wasHandled;
        return true;
    },
    patchEvent: function(evt) {
        // FIXME add event function

        if (evt.hasLivelyPatch) return evt;

        evt.getTargetMorph = function() {
            var node = evt.target;
            while (node) {
                if (node.getAttribute
                 && node.getAttribute('data-lively-node-type') === 'morph-node') break;
                node = node.parentNode;
            }
            return node && lively.$(node).data('morph');
        }

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
            return evt.metaKey || evt.keyIdentifier === 'Meta';
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

        evt.getKeyString = function(options) {
            return Event.pressedKeyString(evt, options);
        }

        evt.isMouseEvent = evt.type === 'mousedown' || evt.type === 'mouseup' || evt.type === 'mousemove' || evt.type === 'mouseover' || evt.type === 'click' || evt.type === 'dblclick' || evt.type === 'mouseover' || evt.type === 'selectstart' || evt.type === 'contextmenu' || evt.type === 'mousewheel';

        evt.isKeyboardEvent = !evt.isMouseEvent && (evt.type === 'keydown' || evt.type === 'keyup' || evt.type === 'keypress');

        evt.isArrowKey = function() {
            if (evt.isKeyboardEvent) {
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
            if (!evt.scaledPos) {
                evt.scaledPos = evt.mousePoint.scaleBy(1 / evt.world.getScale());
            }
            return evt.scaledPos;
        };
        evt.getPositionIn = function(aMorph) {
            // returns the event position localized to aMorph
            var pos = this.getPosition();
            return aMorph.localize(pos);
        };
        evt.mousePoint = evt.mousePoint
                      || pt(evt.pageX || evt.clientX || 0,
                            evt.pageY || evt.clientY || 0);
        return evt;
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
    })(),

    decodeKeyIdentifier: function(keyEvt) {
        // trying to find out what the String representation of the key pressed
        // in key event is.
        // Uses keyIdentifier which can be Unicode like "U+0021"
        var id = keyEvt.keyIdentifier,
            unicodeDecodeRe = /u\+?([\d\w]{4})/gi,
            unicodeReplacer = function (match, grp) { return String.fromCharCode(parseInt(grp, 16)); },
            key = id && id.replace(unicodeDecodeRe, unicodeReplacer);
        if (key === 'Meta') key = "Command";
        if (key === ' ') key = "Space";
        if (keyEvt.keyCode === Event.KEY_BACKSPACE) key = "Backspace";
        return key;
    },

    pressedKeyString: function(evt, options) {
        // returns a human readable presentation of the keys pressed in the
        // event like Shift-Alt-X
        // options: {
        //   ignoreModifiersIfNoCombo: Bool, // if true don't print single mod like "Alt"
        //   ignoreKeys: Array // list of strings -- key(combos) to ignore
        // }
        options = options || {};
        var keyParts = [];
        // modifiers
        if (evt.isCommandKey()) keyParts.push('Command');
        if (evt.isCtrlDown()) keyParts.push('Control');
        if (evt.isAltDown()) keyParts.push('Alt');
        if (evt.isShiftDown()) keyParts.push('Shift');
        // key
        var id;
        if (evt.keyCode === Event.KEY_TAB) id = 'Tab';
        else if (evt.keyCode === Event.KEY_ESC) id = 'Esc';
        else id = this.decodeKeyIdentifier(evt);
        if (options.ignoreModifiersIfNoCombo) {
            if (keyParts.length >= 1 && keyParts.include(id)) return '';
        };
        keyParts.push(id);
        var result = keyParts.compact().uniq().join('-');
        if (options.ignoreKeys && options.ignoreKeys.include(result)) return '';
        return result;
    }
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
        this.stopScrollWhenBordersAreReached(evt);
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
        if (!this.isScrollable() || this.isInInactiveWindow() || !this.isScrollTarget(evt)) return false;
        // FIXME HTML specfic! Move to HTML module
        var div = this.getScrollableNode(evt);
        if (evt.wheelDeltaX) {
            var maxHorizontalScroll = div.scrollWidth - div.clientWidth,
                currentHorizontalScroll = div.scrollLeft;
            if (evt.wheelDeltaX < 0 && currentHorizontalScroll >= maxHorizontalScroll) { evt.stop(); }
            if (evt.wheelDeltaX > 0 && currentHorizontalScroll <= 0) { evt.stop(); }
        }
        if (evt.wheelDeltaY) {
            var maxVerticalScroll = div.scrollHeight - div.clientHeight,
                currentVerticalScroll = div.scrollTop;
            if (evt.wheelDeltaY < 0 && currentVerticalScroll >= maxVerticalScroll) { evt.stop(); }
            if (evt.wheelDeltaY > 0 && currentVerticalScroll <= 0) { evt.stop(); }
        }
        return true;
    },

    isScrollTarget: function(evt) {
        return this.renderContextDispatch('isScrollTarget', evt);
    },

    getMaxScrollExtent: function() {
        var div = this.getScrollableNode(),
            maxHorizontalScroll = div.scrollWidth - div.clientWidth,
            maxVerticalScroll = div.scrollHeight - div.clientHeight;
        return pt(maxHorizontalScroll, maxVerticalScroll);
    },
    scrollToBottom: function() {
        this.setScroll(this.getScroll()[0], this.getMaxScrollExtent().y);
    }
})
.applyTo(lively.morphic.Morph)
.applyTo(lively.morphic.Text, {override: ['onMouseWheel']})
.applyTo(lively.morphic.List, {override: ['onMouseWheel']});


Trait('lively.morphic.DragMoveTrait',
'event handling', {
    onDrag: function(evt) {
        if (!this.owner) return false;
        var pos = evt.getPositionIn(this.owner).subPt(this.dragOffset);
        this.setPosition(pos);
        evt.stop(); return true;
    },
    onDragStart: function(evt) {
        this.startDragPos = this.getPosition();
        this.dragOffset = evt.getPositionIn(this);
        evt.stop(); return true;
    },
    onDragEnd: function(evt) {
        delete this.startDragPos;
        delete this.dragOffset;
        evt.stop(); return true;
    }
});

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
        var eventSpec = {
            type: type,
            target: target,
            targetMethodName: targetMethodName,
            handleOnCapture: !!handleOnCapture // some browsers need t/f
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

    onMouseDownEntry: function(evt, allHits) {
        if (!this.shape.reallyContainsPoint(this.localize(evt.getPosition()))) {
            // Click point was not really on this morph;  try next thing below
            if (!allHits) allHits = this.world().morphsContainingPoint(evt.getPosition());
            var below = false;
            // Call recursively on next morph below this one
            for (var i=0; i<allHits.length; i++) {
                if (below) {
                    if (!allHits[i].eventsAreIgnored) {
                        return allHits[i].onMouseDownEntry(evt, allHits); } }
                else if (allHits[i] === this) below = true;
                }
            return false;
        }
        // checkMouseUpEntry if mouse is on the scrollbar
        var suppressScrollbarClick = (this.showsVerticalScrollBar()
                                    || this.showsHorizontalScrollBar())
                                  && this.isGrabbable();
        if (suppressScrollbarClick) {
            var scrollbarExtent = this.getScrollBarExtent(),
                extent = this.getExtent();
            //console.log("You clicked on: "+this.name);
            //console.log(this.grabbingEnabled);
            //console.log("evt.offsetX: "+ (evt.offsetX) + "    extent.x- scrollbarExtent.x: " +(extent.x- scrollbarExtent.x));
            //console.log("evt.offsetY: "+ (evt.offsetY)+"    extent.y- scrollbarExtent.y: "+(extent.y- scrollbarExtent.y));
            // FIXME: not the perfect solution for text edit scroll morphs
            if ((evt.offsetX> extent.x- scrollbarExtent.x) && (evt.offsetX < extent.x)  ||
                (evt.offsetY> extent.y- scrollbarExtent.y) && (evt.offsetY < extent.y)) {
                return false;
            }

        }

        if (this.showsMorphMenu
          && !this.eventsAreIgnored
          && evt.isRightMouseButtonDown() // only world morph is present?
          && this.world().morphsContainingPoint(evt.getPosition()).length === 1) {
            this.world().worldMenuOpened = true;
            this.showMorphMenu(evt);
            return false;
        }

        if (this.isHalo) {
            evt.hand.haloLastClickedOn = this;
        }

        // This is like clickedOnMorph, but also takes into consideration
        // Halos, Morphs ignoring events etc. For internal use.
        evt.hand.internalClickedOnMorph = this;
        if (this.halosEnabled && (evt.isLeftMouseButtonDown() && evt.isCommandKey())) {
            evt.hand.haloTarget = this;
            return false;
        }

        // do we pass the event to the user defined handler?
        if (this.eventsAreIgnored) return false;
        evt.world.clickedOnMorph = this;
        evt.world.clickedOnMorphTime = Date.now();

        return this.onMouseDown(evt);

    },

    onMouseUp: function(evt) { return false; },

    onMouseUpEntry: function(evt, allHits) {
        if (!this.shape.reallyContainsPoint(this.localize(evt.getPosition()))) {
            // Click point was not really on this morph;  try next thing below
            if (!allHits) allHits = this.world().morphsContainingPoint(evt.getPosition());
            var below = false;
            // Call recursively on next morph below this one
            for (var i=0; i<allHits.length; i++) {
                if (below) {
                    if (!allHits[i].eventsAreIgnored) {
                        return allHits[i].onMouseUpEntry(evt, allHits); } }
                else if (allHits[i] === this) below = true;
                }
            return false;
        }
        var world = evt.world,
            completeClick = world.clickedOnMorph === this,
            internalCompleteClick = evt.hand.internalClickedOnMorph === this,
            invokeHalos = (evt.hand.haloTarget === this) && (
                            (evt.isLeftMouseButtonDown() && evt.isCommandKey())
                         || (this.showsHalosOnRightClick && evt.isRightMouseButtonDown()));

        // delayed so that the event onMouseUp event handlers that
        // are invoked after this point still have access
        (function removeClickedOnMorph() {
            world.clickedOnMorph = null;
            evt.world.eventStartPos = null;
        }).delay(0);

        if (invokeHalos) {
            this.toggleHalos(evt);
            evt.hand.haloTarget = null;
            return false;
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

        // From this point, events can be ignored (grab, onClick, ...)
        if (this.eventsAreIgnored && !this.isHalo) return false;

        if (completeClick && evt.isLeftMouseButtonDown() && this.grabMe(evt)) return true;

        return this.onMouseUp(evt);
    },

    onMouseWheel: function(evt) {
        this.stopScrollWhenBordersAreReached(evt);
        return false;
    },

    onMouseWheelEntry: function(evt) {
        if (this.isScrollable()) this.prevScroll = this.getScroll();
        return this.onMouseWheel(evt);
    },

    onMouseMove: function(evt) {},

    onMouseMoveEntry: function(evt) {
        return this.eventsAreIgnored ? false : this.onMouseMove(evt);
    },

    onMouseOut: function(evt) { return false; },

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

    isNativeContextMenuEvt: function(evt) {
        return evt.isCtrlDown() && evt.isAltDown();
    },

    onContextMenu: function(evt) {
        // we are invoking menus in onMouseDown
        var nativeMenu = this.isNativeContextMenuEvt(evt);
        if (!nativeMenu) evt.stop();
        return nativeMenu;
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
        if (!this.isFocused()) return false;
        if (evt.isCommandKey()) {
            var result = this.processCommandKeys(evt);
            if (result) evt.stop();
            return result;
        }
        return false;
    },
    processCommandKeys: function(evt) {
        if (!this.isFocused()) return false;
        var result = false, c = evt.getKeyChar();
        switch(c && c.toLowerCase()) {
            case 'c': result = this.doKeyCopy(evt); break;
            case 'v': result = this.doKeyPaste(evt); break;
        }
        result && evt.stop();
        return result;
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
        return this.interactiveMoveOrResize('right', evt);
    },
    onLeftPressed: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        return this.interactiveMoveOrResize('left', evt);
    },
    onUpPressed: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        return this.interactiveMoveOrResize('up', evt);
    },
    onDownPressed: function(evt) {
        if (this.eventsAreIgnored) { return false; }
        return this.interactiveMoveOrResize('down', evt);
    },

    interactiveMoveOrResize: function(keyPressed, evt) {
        if (!this.showsHalos) return false;
        evt.stop();
        var dist = evt.isAltDown() ? 100 : (evt.isCommandKey() ? 10 : 1),
            operation = evt.isShiftDown() ? 'resizeBy' : 'moveBy',
            x = 0, y = 0;
        if (keyPressed === 'left') x = -dist;
        if (keyPressed === 'right') x = dist;
        if (keyPressed === 'up') y = -dist;
        if (keyPressed === 'down') y = dist;
        this.world().withSelectedMorphsDo(function(ea) {
            ea[operation](pt(x, y));
            ea.halos && ea.halos.invoke('alignAtTarget');
        });
        return true;
    },

    createClipboardCapture: function(handler) {
        var input = $('<input id="clipboardAccess" type="text" style="width:1px;height:1px;outline:0;position:absolute;top:-1px;left:-1px"/>'),
            world = lively.morphic.World.current(),
            morph = this;
        $('body').append(input);
        input[0].addEventListener('copy', handler, false);
        input[0].addEventListener('paste', handler, false);
        var scroll = world.getScrollOffset();
        input.focus();
        world.setScroll(scroll.x, scroll.y);
        Global.setTimeout(function() {
            var focused = morph.isFocused();
            $('#clipboardAccess').remove();
            focused && morph.focus();
        }, 20);
    },

    doKeyCopy: function() {
        this.withClipboardEventDo(function(evt, data) {
            var copyString = this.copy(true),
                header = 'LIVELYKERNELCLIPBOARDDATA|' + copyString.length + '|';
            data.setData("Text", header + copyString);
            alertOK('Copied ' + this);
        });
    },

    doKeyPaste: function() {
        this.withClipboardEventDo(function(evt, data) {
            var text = data.getData('Text');
            if (!text) return false;
            var match = text.match(/LIVELYKERNELCLIPBOARDDATA\|([0-9]+)\|(.+)/i);
            if (!match || !match[2]) return false;
            var obj = lively.persistence.Serializer.deserialize(match[2]);
            if (!obj || !obj.isMorph) return false;
            var pos = this.world().firstHand().getPosition();
            obj.setPosition(this.localize(pos));
            this.addMorph(obj);
            alertOK('Pasted ' + this);
            if (obj.isMorphClipboardCarrier) {
                obj.submorphs.forEach(function(ea) { this.addMorph(ea); }, this);
                obj.remove();
            }
        });
    },

    withClipboardEventDo: function(func) {
        var morph = this;
        this.createClipboardCapture(function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            func.call(morph, evt, evt.clipboardData || window.clipboardData);
            evt.preventDefault();
        });
    }

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
    enableFocus: function(optTabIndex) { return this.morphicSetter('Focusable', optTabIndex || true) },
    disableFocus: function() { return this.morphicSetter('Focusable', false) },
    isFocusable: function() {
        var val = this.morphicGetter('Focusable');
        return val === undefined || val >= 0 ? true : val;
    },

},
'grabbing and dropping', {
    enableGrabbing: function() { this.grabbingEnabled = true; },
    disableGrabbing: function() { this.grabbingEnabled = false },
    enableDropping: function() { this.droppingEnabled = true; },
    disableDropping: function() { this.droppingEnabled = false },
    enableDragging: function() { this.draggingEnabled = true },
    disableDragging: function() { this.draggingEnabled = false },

    howDroppingWorks: function() {
        // How does dropping morphs work? When morphs are carried by a HandMorph (i.e.
        // being its submorphs), and a mouseup event occurs then
        // lviely.morphic.World>>dispatchDrop is called.
        //
        // The high-level call stack of what happens then looks like this:
        //
        // world.dispatchDrop(evt)
        //     targetMorph.wantsDroppedMorph(grabbedMorph)
        //     grabbedMorph.wantsToBeDroppedInto(targetMorph)
        //     handMorph.dropContentsOn(targetMorph,evt)
        //         grabbedMorph>>dropOn(targetMorph)
        //             grabbedMorph>>onDropOn(targetMorph)
        //
        // #wantsDroppedMorph and #wantsToBeDroppedInto are used for dynamically
        // controlling drop behavior (called while drop process and are able to cancel
        // the drop). Also, there is a property "droppingEnabled" that (statically)
        // controls whether a morph should be considered for a drop at all.
    },

    wantsToBeDroppedInto: function(dropTarget) {
        // returns true if this morph can be dropped into the target
        return true;
    },

    wantsDroppedMorph: function(morphToDrop) {
        // returns true if the provided morph can be dropped into this morph
        return true;
    },

    dropOn: function(aMorph) {
        var placeholderPosition;
        if (this.placeholder) {
            placeholderPosition = this.placeholder.getPosition();
        }
        aMorph.addMorph(this);
        this.onDropOn(aMorph);
        delete this.previousOwner;
        delete this.previousPosition;
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

    grabMe: function(evt) {
        return this.grabbingEnabled && evt.hand.grabMorph(this, evt);
    },

    getGrabShadow: function (local) {
        var shadow = new lively.morphic.Morph(
            lively.persistence.Serializer.newMorphicCopy(this.shape));
        this.submorphs.forEach(function(ea) {
            var submorphShadow = ea.getGrabShadow(true);
            submorphShadow && shadow.addMorph(submorphShadow) });

        shadow.isGrabShadow = true;
        shadow.applyStyle({
            clipMode: this.getClipMode(),
            fill: this.getFill() === null ? Color.gray : Color.gray.darker(),
            opacity: 0.5});
        shadow.connections = [
            lively.bindings.connect(this, 'rotation', shadow, 'setRotation'),
            lively.bindings.connect(this, 'scale', shadow, 'setScale')];
        shadow.addScript(function remove() {
            $super();
            this.connections.invoke('disconnect');
            this.submorphsForReconnect = this.submorphs.clone();
            this.submorphs.invoke('remove');
            lively.bindings.callWhenNotNull(this, 'owner', this, 'reconnect');
        });
        shadow.addScript(function reconnect(newOwner) {
            this.connections.invoke('connect');
            this.submorphsForReconnect.forEach(function(ea) { this.addMorph(ea) }, this);
            delete this.submorphsForReconnect;
        });
        shadow.setTransform(local ? this.getTransform() : this.getGlobalTransform());
        shadow.disableDropping();
        //shadow.originalMorph = this;
        //this.grabShadow = shadow;
        return shadow;
    }
},
'scrolling', {
    onScroll: function(evt) {},
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
        return this.isClip() && this.renderContextDispatch('showsHorizontalScrollBar');
    },
    showsVerticalScrollBar: function() {
        return this.isClip() && this.renderContextDispatch('showsVerticalScrollBar');
    },
    getScrollBarExtent: function() { return this.renderContextDispatch('getScrollBarExtent') },
},
'opening', {
    openInHand: function() {
        lively.morphic.World.current().firstHand().grabMorph(this);
    },
    correctForDragOffset: function(evt) {
        // do I respond to onSelectStart in a meaningful way?
        if (this.dragTriggerDistance === 0) return false;
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

    }

});

Object.extend(lively.morphic.Morph, {
    focusedMorph: function() { return lively.morphic.Morph.prototype.focusedMorph(); }
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
            self.onBlurAction && self.onBlurAction()
        };
        this.renderContext().textNode.onfocus = function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            self.onFocus(evt)
            self.onFocusAction && self.onFocusAction()
        };
    }
},
'event handling', {
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
        // restore selection range on focus
        var s = this.priorSelectionRange;
        if (s) {
            delete this.priorSelectionRange;
            var self = this;
            (function() { self.setSelectionRange(s[0], s[1]); }).delay(0);
        }
    },

    correctForDragOffset: function(evt) {
        return !this.allowInput;
    },

    doKeyCopy: Functions.Null,
    doKeyPaste: Functions.Null
});

lively.morphic.List.addMethods(
'change event handling', {
    inputEventTriggeredChange: function() {
        // this is to ensure that the selection is only set once
        this.selectionTriggeredInInputEvent = true;
        var self = this;
        (function() { delete self.selectionTriggeredInInputEvent }).delay(0);
    }
},
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
                this.inputEventTriggeredChange();
                this.updateSelectionAndLineNoProperties(idx);
            }

            if (idx >= 0 && this.isMultipleSelectionList && evt.isShiftDown()) {
                if (this.getSelectedIndexes().include(idx))
                    this.deselectAt(idx)
                else
                    this.selectAt(idx);
            }
        }
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

    onMouseWheel: function(evt) {
        this.stopScrollWhenBordersAreReached(evt);
        return false;
    },


    correctForDragOffset: function(evt) {
        return false;
    },
    onChange: function(evt) {
        if (this.selectionTriggeredInInputEvent) {
            delete this.selectionTriggeredInInputEvent;
            return false;
        }
        var idx = this.renderContextDispatch('getSelectedIndexes').first();
        this.updateSelectionAndLineNoProperties(idx);
        this.changeTriggered = true; // see onBlur
        return false;
    },

});

lively.morphic.DropDownList.addMethods(
'properties', {
    // triggers correct rendering
    isDropDownList: 'true'
},
'mouse events', {
    onMouseDown: function(evt) {
        this.changeTriggered = false; // see onBlur
        if (evt.isCommandKey()) {
            evt.preventDefault()
            return false;
        }
        return true;
     },

    onChange: function (evt) {
        // FIXME duplication with List
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

    isGrabbable: function(evt) {
        return false; //!this.changeTriggered;
    },

    registerForOtherEvents: function($super, handleOnCapture) {
        $super(handleOnCapture)
        if (this.onBlur) this.registerForEvent('blur', this, 'onBlur', handleOnCapture);
    }

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
        Global.document.onmousewheel = function(evt) {
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
        this.registerForVisibilityChange(false);
    },
    registerForVisibilityChange: function(capturing) {
        var world = this;
        function handler(evt) {
            evt = evt || window.event;
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            return world.onVisibilityChange(evt);
        }

        // see #onVisibilityChange for details
        var p = lively.Config.get('browserPrefix'),
            hidden = p + "Hidden";
        if (document.hasOwnProperty(hidden)) {
            document.addEventListener(p + "visibilitychange", handler);
        }
    }

},
'keyboard event handling', {

    onKeyPress: function(evt) {
        if (!this.isFocused()) return false;
        evt.stop();
        return true;
    },
    onKeyUp: function(evt) {
        return false;
    },

    processCommandKeys: function($super, evt) {
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
            case "o": { this.openObjectEditor(evt); return true; }
            case "p": { this.openPartsBin(evt); return true; }
            case "0": { this.resetScale(); return true; }
        }

        switch(evt.getKeyCode()) {
            case 221/*cmd+]*/: { this.alert('CMD+[ disabled'); return true }
            case 219/*cmd+[*/: { this.alert('CMD+] disabled'); return true }
        }

        return $super(evt);
    },

    onBackspacePressed: function(evt) {
        if (!this.isFocused()) return;
        alert('<BACKSPACE> disabled')
        evt.stop(); // so that we not accidently go back
        return true;
    },

    doKeyCopy: function() {
        lively.morphic.alert('Sorry, copying the world is currently not supported.');
    }
},
'mouse event handling', {
    onMouseDown: function($super, evt) {
        this.eventStartPos = evt.getPosition();
        // remove the selection when clicking into the world...
         if (this.selectionMorph
          && this.selectionMorph.owner
          && evt.getTargetMorph() === this) { this.resetSelection(); }
        return false;
    },
    onMouseUp: function (evt) {
        if (evt.isAltDown() && this.clickedOnMorph && !this.draggedMorph) {
            if (!Global.thats) Global.thats = [];
            // thats: select multiple morphs
            // reset when clicked in world

            if (this.clickedOnMorph === this) {
                Global.thats = [];
                alertOK('thats array emptied');
            } else {
                Global.thats.pushIfNotIncluded(this.clickedOnMorph);
            }
            // "that" construct from Antero Taivalsaari's Lively Qt
            Global.that = this.clickedOnMorph;
            Global.that.show && Global.that.show();
            return true;
        }

        evt.hand.removeOpenMenu(evt);
        if (!evt.isCommandKey() && (!this.clickedOnMorph || !this.clickedOnMorph.isHalo)
                                && !this.ignoreHalos) {
            this.removeHalosOfCurrentHaloTarget(); }

        var activeWindow = this.getActiveWindow();
        if (activeWindow
         && (!this.clickedOnMorph || this.clickedOnMorph.getWindow() !== activeWindow)) {
            activeWindow.highlight(false); };

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
        // how dragging works:
        // Basically, we detect onMouseDowns and remember which morph was clicked.
        // There is a dragTriggerDistance attribute on every morph. if the hand moves
        // more than that distance and still is down (move started in the morph) than
        // morph.onDragStart is called. moving further triggers morph.onDrag. Releasing
        // mouse button triggers morph.onDragEnd.

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
            if (evt.hand.submorphs.length > 0) return false;
            if (!targetMorph.isGrabbable(evt)) return false;  // Don't drag world, etc
            evt.hand.grabMorph(targetMorph);
            return false;
        }

        // handle copy on shift+move
        if (evt.isShiftDown() && !targetMorph.isEpiMorph && evt.isLeftMouseButtonDown()) {
            if (evt.hand.submorphs.length > 0) return false;
            if (!targetMorph.owner) return false;
            if (targetMorph instanceof lively.morphic.World) return false;

            targetMorph.removeHalos();
            var copy = targetMorph.copy();
            targetMorph.owner.addMorph(copy); // FIXME for setting the right position
            evt.hand.grabMorph(copy);
            targetMorph = copy;
            return false;
        }

        // handle dragStart
        if (targetMorph !== this && (targetMorph.draggingEnabled || targetMorph.isGrabbable())) {
            // morphs that do not have a selection can be dragged
            // (Lists, Texts, Boxes inside a window cannot be dragged by just clicking and moving)
            // before dragging, we want to move the mouse pointer back to the spot we
            // clicked on when we started dragging.
            // FIXME this should also work for Cmd-Drag and Shift-Drag
            if (targetMorph.isGrabbable()) { // world is never grabbable ...
                var lockOwner = targetMorph.lockOwner(),
                    grabTarget = lockOwner && targetMorph.isLocked() ? lockOwner : targetMorph;
                if (grabTarget.correctForDragOffset()) {
                    grabTarget.moveBy(evt.getPosition().subPt(this.eventStartPos));
                }
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
        if (evt.hand.submorphs.length === 0) return false;
        var morphStack = this.morphsContainingPoint(evt.getPosition()),
            carriedMorphs = evt.hand.submorphs.select(function(ea) { return !ea.isGrabShadow; }),
            dropTarget = morphStack.detect(function(ea) {
                return ea.droppingEnabled && !ea.eventsAreIgnored &&
                    carriedMorphs.all(function(toBeDropped) {
                        return ea.wantsDroppedMorph(toBeDropped)
                            && toBeDropped.wantsToBeDroppedInto(ea); }); });
        if (!dropTarget) {
            this.alert('found nothing to drop onto');
            dropTarget = this;
        }
        return evt.hand.dropContentsOn(dropTarget, evt);
    },
    onMouseWheel: function($super, evt) {
        if (!evt.isCommandKey()) return $super(evt);
        this.doZoomBy(evt.wheelDelta, evt.getPosition(), true);
        evt.preventDefault(); return true;
    },
    doZoomBy: function(wheelDelta, zoomPoint, showZoom) {
        // wheelDelta from mouse event, zoomPoint is the global position to
        // zoom in/out (center of transformation)
        var oldScale = this.getScale();

        var minScale = 0.1, maxScale = 10;
        if (oldScale < minScale && wheelDelta < 0) return false;
        if (oldScale > maxScale && wheelDelta > 0) return false;
        var scaleDelta = 1 + (wheelDelta / 2800) + (this._lastZoomAttemptDelta || 0);

        var newScale = oldScale * scaleDelta;
        newScale = Math.max(Math.min(newScale, maxScale), minScale);
        if (Numbers.between(newScale, 0.98, 1.02)) newScale = 1
        if (newScale !== oldScale) {
            this.setScale(newScale);
            this._lastZoomAttemptDelta = 0;
        } else {
            this._lastZoomAttemptDelta = (1 - scaleDelta) + (this._lastZoomAttemptDelta || 0);
        }
        // actually this should be a layoutChanged but implementing
        // layoutChanged in WorldMorph is expensive since it is always called when a
        // submorph's layout is changed (owner chain propagation)
        // this.resizeCanvasToFitWorld();

        // Zoom into/out of the current mouse position:
        // p is the current mouse position. If we wouldn't move the window the new mouse pos would be scaledP.
        // We calculate the vector from scaledP to p and scale that by the current scale factor
        // We end up with a vector that can be used to scroll the screen to zoom in/out
        if (newScale !== oldScale) {
            var scaledP = zoomPoint.scaleBy(1/scaleDelta),
                translatedP = zoomPoint.subPt(scaledP).scaleBy(this.getScale());
            this.scrollBy(translatedP.x, translatedP.y);
        }

        // show indicator for current zoom
        if (showZoom) {
            var messageMorph = this.get('zoomStatus');
            if (!messageMorph) {
                messageMorph = lively.newMorph({klass: lively.morphic.Text});
                messageMorph.name = 'zoomStatus';
                messageMorph.applyStyle({extent: pt(160, 80), clipMode: "hidden", fontSize: 42, fill: Color.rgba(255,255,255,0.6), borderWidth: 0, borderRadius: 20});
                messageMorph.removeLater = Functions.debounce(1*1000, function() { this.remove(); });
                messageMorph.openInWorld();
            }
            messageMorph.textString = Math.round(newScale*100) + '%';
            messageMorph.removeLater();
            messageMorph.setScale(1/newScale);
            messageMorph.align(messageMorph.bounds().center(), this.visibleBounds().center());
        }
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
        if (files && files.length > 0) {
            new lively.FileUploader().handleDroppedFiles(files, evt);
        } else if (false) { // currently disabled because self-drops are annoying
            // this needs to be extracted!
            var types = Array.from(evt.dataTransfer.types),
                supportedTypes = ['text/plain', "text/uri-list", 'text/html', 'text'],
                type = supportedTypes.detect(function(type) { return types.include(type); });
            if (type) {
                var data = evt.dataTransfer.getData(type);
                this.addTextWindow({
                    content: data,
                    title: 'Dropped',
                    position: this.visibleBounds().center()
                });
            }
        }
        return true;
    }
},
'window related', {
    onWindowResize: function(evt) {
        this.cachedWindowBounds = null;
    },

    onVisibilityChange: function(evt) {
        // see
        // https://developer.mozilla.org/en-US/docs/DOM/Using_the_Page_Visibility_API
        // This event is fired when the web browser is hidden or becomes
        // visible, e.g. when switching browser tabs. You can test for the
        // current state with document.visibilityState* which can be "visible",
        // "hidden", "prerender"
        // * currently this attribute is only accessible via browser vendor
        // * specific prefixes: document[lively.Config.get('browserPrefix') + 'VisibilityState'];
    },

    onWindowScroll: function(evt) {
        this.cachedWindowBounds = null;
    },

    onScroll: function(evt) {
        // This is a fix for the annoying bug that cost us a keynote...
        var ctx = this.renderContext();
        ctx.morphNode.scrollTop = 0;
        ctx.morphNode.scrollLeft = 0;
        ctx.shapeNode.scrollTop = 0;
        ctx.shapeNode.scrollLeft = 0;
    },
    correctForDragOffset: function(evt) {
        return false;
    }
},
'scrolling', {
    getScroll: function() {
        var offset = this.getScrollOffset();
        return [offset.x, offset.y];
    },
    setScroll: function(x, y) {
        // setScroll of Scrollable Trait does not work: window has no overflow
        return this.morphicSetter('Scroll', [x, y]);
    },
    scrollBy: function(x,y) {
        Global.scrollBy(x,y);
    },

    getScrollOffset: function () {
        return this.visibleBounds().topLeft();
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
    onError: function(evt, spec) { alert('Error occured while loading file ' + spec.file.name) },
    onLoadStart: function(evt, spec) { alertOK('Loading ' + spec.file.name) },
    onLoadEnd: function(evt, spec) { alertOK('Finished ' + spec.file.name) },
    onProgress: function(evt, spec) {
        if (!evt.lengthComputable) return;
        var percentage = Math.round((evt.loaded * 100) / evt.total);
        alertOK('Loading ' + spec.file.name + ': ' + percentage + "%");
    },
    onLoad: function(evt) {
        alert('Loaded file ' + spec.file.name + ' but don\'t know what to do now...!')
    }
},
'image loading', {
    onLoadImage: function(evt, spec) {
        var img = new lively.morphic.Image(spec.pos.extent(pt(200,200)), evt.target.result, true).openInWorld();
        img.name = spec.file.name;
    },
    onLoadImageBinary: function(evt, spec) {
        this.uploadAndOpenImageTo(
            URL.source.withFilename(spec.file.name),
            spec.file.type, evt.target.result, spec.pos);
    },

    uploadAndOpenImageTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openImage(url, mime, pos);
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    },

    openImage: function(url, mime, pos) {
        var name = new URL(url).filename(),
            img = new lively.morphic.Image(pos.extent(pt(200,200)), url, true).openInWorld();
        img.name = name;
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
        module('lively.morphic.video.Video').load();
        mime = mime || '';
        var videoNode;
        if (/*mime.include('webm')*/true) {
            videoNode = XHTMLNS.create('video');
            videoNode.width = 400;
            videoNode.height = 300;
            videoNode.controls = true;
            videoNode.preload = true;
            var sourceNode = XHTMLNS.create('source');
            sourceNode.src = url;
            videoNode.appendChild(sourceNode);

            // if (mime.include('quicktime')) mime = mime.replace('quicktime', 'mp4');

            // if (mime.include('mp4')) {
            //     sourceNode.type = mime + '; codecs="avc1.42E01E, mp4a.40.2"'
            // } else if (mime.include('webm')) {
            //     sourceNode.type = mime //+ '; codecs="vp8, vorbis"'
            // } else {
            //     sourceNode.type = mime;
            //     alert('video with type ' + mime + ' currently not supported');
            // }
        } else {
            var embedNode = XHTMLNS.create('object');
            embedNode.type = mime;
            embedNode.data = url;
            embedNode.play="false"
            // embedNode.scale="tofit"
            embedNode.width="400"
            embedNode.height="400"
            videoNode = embedNode
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
    },
},
'audio loading', {
    onLoadAudio: function(evt, spec) {
        if (spec.doUpload)
            this.uploadAndOpenAudioTo(
                URL.source.withFilename(spec.file.name),
                spec.file.type, evt.target.result, spec.pos);
        else
            this.openAudio(spec.file.name, spec.file.type, evt.target.result, spec.pos);
    },
    openAudio: function(url, mime, data, pos) {
        switch (mime) {
            case 'audio/midi':
                this.openMidi(url, data, pos);
                break;
            default:
                alert("unknown type " + mime);
        }
    },

    uploadAndOpenAudioTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openAudio(url, mime, binaryData, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    },

    openMidi: function(url, data, pos) {
        var player = $morph('PianoKeyboard');
        if (!player) {
            player = $world.openPartItem('PianoKeyboard', 'PartsBin/Fun');
            if (pos) player.setPosition(pos);
        }
        player.loadMidi(data);
    }

},
'text loading', {
    onLoadText: function(evt, spec) {
        lively.morphic.World.current().addTextWindow({title: spec.file.name, content: evt.target.result});
    },
},
'pdf loading', {
    onLoadPDF: function(evt, spec) {
        this.uploadAndOpenPDFTo(
            URL.source.withFilename(spec.file.name),
            spec.file.type, evt.target.result, spec.pos);
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
        var images = [], videos = [], audios = [], pdfs = [], texts = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i],
                imageType = /image.*/,
                videoType = /video.*/,
                audioType = /audio.*/,
                pdfType = /application\/pdf/,
                textType = /text.*/;

            if (file.type.match(imageType)) images.push(file);
            else if (file.type.match(videoType)) videos.push(file);
            else if (file.type.match(audioType)) audios.push(file);
            else if (file.type.match(pdfType)) pdfs.push(file);
            else texts.push(file);
        }
        var opt = evt.isAltDown();
        this.loadAndOpenDroppedFiles(evt, images, {onLoad:  'onLoadImage' + (opt ? 'Binary' : ''), asBinary: opt});
        this.loadAndOpenDroppedFiles(evt, videos, {onLoad: 'onLoadVideo', asBinary: true});
        this.loadAndOpenDroppedFiles(evt, audios, {onLoad: 'onLoadAudio', asBinary: true, doUpload: opt});
        this.loadAndOpenDroppedFiles(evt, pdfs, {onLoad: 'onLoadPDF', asBinary: true});
        this.loadAndOpenDroppedFiles(evt, texts, {onLoad: 'onLoadText', asText: true});
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
                doUpload: options.doUpload,
                pos: pos.addXY(15*i,15*i)
            }, reader = this.getFileReader(fileReaderOptions);
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
    isHand: true
},
'initializing', {
    initialize: function($super) {
        $super()
        this.ignoreEvents();
        this.setFill(Color.red);
        this.setBounds(new Rectangle(0, 0, 2, 2));
    }
},
'accessing -- morphic relationship', {

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
    }
},
'event handling', {
    grabMorph: function(morph, evt) {
        morph.previousOwner = morph.owner;
        morph.previousPosition = morph.getPosition();
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
        evt && evt.stop();
        return true;
    }
},
'menu', {
    removeOpenMenu: function(evt) {
        var world = this.world(),
            menu = world.currentMenu;
        if (menu && !menu.bounds().containsPoint(evt.getPosition())) {
            world.currentMenu.remove();
            // FIXME currentMenu does not have to be worldMenu...
            world.worldMenuOpened = false;
        }
    }
},
'moving', {
    move: function(evt) {
        var offsetX = 2, offsetY = 2;

        // rk 04/08/12 this is just a quick hack to have a correct mouse pos
        // when the world is offsetted. Since this depends on HTML rendering,
        // this should rather go into lively.morphic.Hand>>setPositionHTML or
        // #getPositionHTML
        var worldNode = this.world().renderContext().morphNode,
            worldOffsetLeft = worldNode.offsetLeft,
            worldOffsetTop = worldNode.offsetTop;

        var pos = pt((evt.pageX || evt.clientX) + offsetX - worldOffsetLeft,
                     (evt.pageY || evt.clientY) + offsetY - worldOffsetTop);

        pos = pos.scaleBy(1/this.world().getScale());
        this.setPosition(pos);
        if (!this.carriesGrabbedMorphs) return;
        var carriedMorph = this.submorphs.detect(function(ea) {return !ea.isGrabShadow;}),
            topmostMorph = this.world().getTopmostMorph(evt.getPosition());
        if (!carriedMorph
          || !topmostMorph
          || !topmostMorph.isLayoutable
          || !topmostMorph.wantsDroppedMorph(carriedMorph)
          || !carriedMorph.wantsToBeDroppedInto(topmostMorph)) { return; }
        var layouter = topmostMorph.getLayouter();
        if (layouter && layouter.displaysPlaceholders()) {
            layouter.showPlaceholderFor(carriedMorph, evt);
        } else if (carriedMorph.placeholder) {
            carriedMorph.destroyPlaceholder();
        }
    }
});

Object.extend(lively.morphic.Events, {

    MutationObserver: (function() {
        return window.MutationObserver
            || window.WebKitMutationObserver
            || window.MozMutationObserver; })(),

    GlobalEvents: {
        handlers: {},
        register: function(type, handler) {
            var handlers = this.handlers[type];
            if (!handlers) handlers = [];
            if (handlers.length === 0) window.addEventListener(type, this.dispatchGlobalEvent, true);
            handlers.push(handler);
            this.handlers[type] = handlers;
        },
        unregister: function(type, handler) {
            var handlers = this.handlers[type];
            if (handlers) {
                if (!handler) {
                    handlers.clear();
                } else {
                    if (typeof handler === 'string') {
                        handler = handlers.detect(function(func) { return func.name === handler });
                    }
                    handlers.remove(handler);
                }
            }
            if (!handlers || handlers.length === 0) window.removeEventListener(type, this.dispatchGlobalEvent, true);
            this.handlers[type] = handlers;
        },
        dispatchGlobalEvent: function(evt) {
            lively.morphic.EventHandler.prototype.patchEvent(evt);
            var handlers = lively.morphic.Events.GlobalEvents.handlers[evt.type];
            var stopped = false;
            for (var i = 0, len = handlers.length; i < len; i ++) {
                stopped = handlers[i](evt);
                if (stopped) return stopped;
            }
            return undefined;
        }
    }
});
Object.subclass('lively.morphic.KeyboardDispatcher',
"settings", {
    // C = Control, M = Alt|Option|Meta, S = Shift, cmd = Command
    // sort by: "c-s-m-cmd" to be compatible with ace
    modifierSortOrder: {'c': -4, 's': -3, 'm': -2, 'cmd': -1}
},
"initializing", {
    initialize: function(bindings) {
        this.bindings = {};
        bindings && this.addBindings(bindings);
    }
},
'key capturing', {
    normalizeModifier: function(modifierString) {
        switch (modifierString.toLowerCase()) {
            case 'c': case 'ctrl': case 'control': return "c";
            case 'm': case 'meta': case 'option': case 'alt': return "m";
            case 's': case 'shift': return "s";
            case 'cmd': case 'command': return "cmd";
            default: return null;
        }
    },

    normalizeComboPart: function(string) {
        // string is something like "Shift-Cmd-O", "Ctrl-x", ...
        // what goes out is like cmd-s-o, c-x, ...
        // there we will normalize the modifier names and reorder
        // them alphabetical to get unique combo specifiers
        var parts = string.split('-');
        parts = parts.slice(0,-1)
            .map(function(ea) { return this.normalizeModifier(ea); }, this)
            .sortBy(function(modKey) { return this.modifierSortOrder[modKey] || null; }, this)
            .concat([parts.last().toLowerCase()]);
        return parts.join('-');
    },
    normalizeCombo: function(comboParts) {
        return comboParts.map(function(ea) { return this.normalizeComboPart(ea); }, this).join(' ');
    },


    bindingsWithPrefix: function(prefix, dontNormalize) {
        // prefix is something like C-c
        // returns stuff like C-c, C-c x, C-c C-c y, ...
        if (!dontNormalize) {
            prefix = prefix.split(" ")
                .map(function(ea) { return this.normalizeComboPart(ea); }, this)
                .join(' ');
        }
        return Object.keys(this.bindings).map(function(combo) {
            return combo.startsWith(prefix) ? combo : null; }).compact();
    },

    addKeyCombo: function(combo, cmdName) {
        var bindings = this.bindings;

        // 1. normalize the whole combo
        combo = combo.toLowerCase();
        var comboParts = combo.split(" ").map(function(ea) { return this.normalizeComboPart(ea); }, this);
        combo = comboParts.join(' ');

        // 2. when we assign cmdName to combo and combo was used as a
        // prefix before we have to cleanup the old prefix entries in bindings
        var existingPrefixBindings = this.bindingsWithPrefix(combo);
        existingPrefixBindings.forEach(function(key) { delete bindings[key]; });

        // 3. associate command and combo
        bindings[combo] = cmdName;

        // 4. register all partial key combos as null commands
        // to be able to activate key combos with arbitrary length
        // Example: if keyPart is "C-c C-l t" then "C-c C-l t" will
        // get command assigned and "C-c" and "C-c C-l" will get
        // a null command assigned in this.commmandKeyBinding.
        comboParts.slice(0,-1).reduce(function(keyMapKeys, comboPart, i) {
            var prefix = keyMapKeys[i-1] ? keyMapKeys[i-1] + ' ' : '';
            return keyMapKeys.concat([prefix + comboPart]);
        }, []).forEach(function(comboPrefix) {
            bindings[comboPrefix] = "prefix";
        });
    },
    addBindings: function(bindings) {
        var platform = UserAgent.isMacOS ? 'mac' : 'win';
        Properties.forEachOwn(bindings, function(command, keys) {
            if (typeof keys === 'object') keys = keys[platform];
            this.addKeyCombo(keys, command);
        }, this);
    },

},
'key lookup', {
    lookup: function(comboPart) {
        // comboPart sth like C-c, not multiple key/combo presses!
        comboPart = this.normalizeComboPart(comboPart);
        return this.bindings[comboPart] || null;
    },
    lookupAll: function(comboParts) {
        return this.bindings[this.normalizeCombo(comboParts)] || null;
    }
},
"event handling", {
    updateInputStateFromEvent: function(evt, keyInputState) {
        var keys = evt.getKeyString();
        if (!keys || keys === '') { keyInputState.commandName = null; return keyInputState; }
        keyInputState.prevKeys.push(keys);
        keyInputState.commandName = this.lookupAll(keyInputState.prevKeys);
        if (keyInputState.commandName !== 'prefix') keyInputState.prevKeys = [];
        return keyInputState;
    },

    handleKeyEvent: function(evt, keyInputState) {
        var wasInPrefixState = keyInputState.commandName === 'prefix',
            prevKeys = keyInputState.prevKeys.clone();
        keyInputState = this.updateInputStateFromEvent(evt, keyInputState);
        if (keyInputState.commandName === 'prefix') {
            return true;
        } else if (keyInputState.commandName) {
            return lively.ide.commands.exec(keyInputState.commandName);
        } else if (wasInPrefixState) {
            // We found no command to execute and no prefix, maybe an active
            // codeeditor can deal with the combo/prefix
            this.transferPrefixToActiveCodeEditor(prevKeys);
        }
        return false;
    },

    transferPrefixToActiveCodeEditor: function(prevKeysPressed) {
        // this hack is used in combination with ace codeeditors.
        // it's purpose is to allow both the global key handler
        // as well as the codeditor to own key bindings (combos)
        // starting with the same combo parts. the global handler
        // will take precedence
        // Example: global handler has key binding for "s-cmd-l r e n"
        // codeeditor has binding for "s-cmd-l r e s", input is
        // "s-cmd-l r e s
        // Normally the global handler would follow the binding until
        // an "e" is typed. If then no "n" is typed the global handler
        // would just abandon the typed keys and the codeeditor would
        // just receive "s". Instead of just abandoning the keys we
        // update the codeeditor's state so it knows about the prev keys
        var focused = lively.morphic.Morph.focusedMorph();
        // are we typing in a codeeditor?
        if (!focused || !focused.isCodeEditor
         || !focused.aceEditor
         || !focused.aceEditor.keyBinding.$data
         // does the codeEditor know about key combos?
         || focused.aceEditor.keyBinding.$data.keyChain === undefined) return;
        var combo = this.normalizeCombo(prevKeysPressed),
            kbd = focused.aceEditor.getKeyboardHandler();
        // is the current combo a prefix for codeeditor?
        if (kbd.commmandKeyBinding[combo] === undefined) return;
        // the current key will be read in by the editor, just send the last ones
        focused.aceEditor.keyBinding.$data.keyChain = combo;
    }
});
Object.extend(lively.morphic.KeyboardDispatcher, {
    global: function() {
        var global = this._global || (this._global = new this(lively.ide.commands.defaultBindings));
        if (!global.keyInputState) global.keyInputState = {prevKeys: [], commandName: null};
        return global
    },
    reset: function() {
        show('resetting keyboard dispatcher');
        if (!this._global) return;
        this._global = null;
    },
    handleGlobalKeyEvent: function(evt) {
        var handler = this.global();
        return handler.handleKeyEvent(evt, handler.keyInputState);
    }
});

(function installDefaultGlobalKeys() {
    lively.morphic.Events.GlobalEvents.unregister('keydown', "defaulGlobalKeyHandler");
    var haloTriggerCount = 0; // count succinct command key presses, FIXME use real key handler that can deal with combos
    lively.morphic.Events.GlobalEvents.register('keydown', function defaulGlobalKeyHandler(evt) {
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // key dispatcher using lively.ide.commands
        var result = lively.morphic.KeyboardDispatcher.handleGlobalKeyEvent(evt);
        if (result) { evt.stop(); return true; }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var keys = evt.getKeyString({ignoreModifiersIfNoCombo: false}),
            focused = lively.morphic.Morph.focusedMorph(),
            world = focused && focused.world() || lively.morphic.World.current();
        if (!focused) { world.focus.bind(world).delay(); return undefined; }
        if (keys === 'Command-Alt') haloTriggerCount++;
        else if (keys !== 'Command' && keys !== 'Alt') haloTriggerCount = 0;
        if (haloTriggerCount == 2) {
            evt.mousePoint = evt.hand.getPosition();
            var target;
            if (!evt.world.currentHaloTarget || !evt.world.currentHaloTarget.fullContainsWorldPoint(evt.getPosition()) || evt.world.currentHaloTarget === world) {
                target = evt.hand.morphUnderMe();
            } else {
                target = evt.world.currentHaloTarget;
            }
            target.toggleHalos(evt);
            haloTriggerCount = 0;
            evt.stop(); return true;
        }
        if (world.showPressedKeys) {
            var keysNoModifier = evt.getKeyString({ignoreModifiersIfNoCombo: true});
            keysNoModifier && keysNoModifier.length > 0 && lively.log(keysNoModifier);
        }
        return undefined;
    });
})();

(function setupEventExeriments() {
    // FIXME remove!!!
    module('lively.morphic.EventExperiments').load();
})();

}) // end of module
