module('lively.morphic.MorphAddons').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.morphic.Widgets', 'lively.morphic.Styles', 'lively.morphic.TextCore').toRun(function() {

/*
 * Extends the default morphic interface with convenience methods, methods that
 * we are currently experimenting with, or methods that exist for compatibility
 * to older morphs
 */

Object.extend(lively.morphic, {

    showMarkerFor: function(morph) {
      if (!morph) return;
      var m = lively._showMarker || (lively._showMarker = $world.loadPartItem("Marker", "PartsBin/Basic"));
      m.setOpacity(1);
      m.openInWorld();
      m.setBounds(morph.globalBounds().expandBy(6));
      m.applyStyle({borderWidth: 4, borderRadius: 10});
      (function() {
        m.setOpacityAnimated(0, 1000, function() { m.remove(); })
      }).delay(1);
    },

    show: function(obj) {

        function showText(text) {
            if (typeof $world != 'undefined')
                $world.setStatusMessage(text, Color.gray);
            else
                console.log('show: ' + text);
            return text;
        }

        function newShowPt(/*pos or x,y, duration, extent*/) {
            var args = Array.from(arguments);
            // pos either specified using point object or two numbers
            var pos = args[0].constructor == lively.Point ? args.shift() : pt(args.shift(), args.shift()),
                duration = args.shift(),
                extent = args.shift() || pt(12,12);

            var b = new lively.morphic.Morph();

            b.ignoreEvents();
            b.disableEvents();
            b.setOpacity(0.5)
            b.setBounds(extent.extentAsRectangle());
            b.align(b.getCenter(), pos);
            b.setFill(Color.red);

            newShowThenHide(b, duration);
            return b;
        }

        function newShowLine(line, duration) {
            return line.sample(5).map(function(p) {
                return newShowPt(p, duration, pt(3,3)); });
        }

        function newShowRect(r, duration) {
          var marker = lively.morphic.BoundsMarker.highlightBounds(r);
          return newShowThenHide(marker, duration);
        }

        function newShowMorph (morph) {
            return newShowRect(morph.getGlobalTransform().transformRectToRect(morph.innerBounds()))
        }

        function newShowElement(el) {
            return lively.$(el).bounds({withMargin: true, withPadding: true}).show(2000);
        }

        function newShowThenHide (morphOrMorphs, duration) {
            var w = Global.world || lively.morphic.World.current();
            if (!w) { alert("no world"); return }
            var morphs = Object.isArray(morphOrMorphs) ? morphOrMorphs : [morphOrMorphs];
            duration = duration || 3;
            morphs.invoke('openInWorld');
            if (duration) { // FIXME use scheduler
                (function() { morphs.invoke('remove'); }).delay(duration);
            }
            return morphOrMorphs;
        }

        if (!obj && !Object.isString(obj)) { return lively.morphic.show(String(obj)); }
        else if (Object.isString(obj)) { var msg = Strings.format.apply(Strings, arguments); return showText(msg); }
        else if (Object.isArray(obj)) return obj.map(function(ea) { return lively.morphic.show(ea) });
        else if (obj instanceof lively.Point) return newShowPt(obj);
        else if (obj instanceof lively.Line) return newShowLine(obj);
        else if (obj instanceof lively.Rectangle) return newShowRect(obj);
        else if (obj.isMorph) return newShowMorph(obj);
        else if (obj instanceof Global.HTMLElement) return newShowElement(obj);
        else if (obj instanceof Global.Element && obj.getBoundingClientRect) { var b = obj.getBoundingClientRect(); return newShowRect(lively.rect(b.left,b.top,b.width,b.height)); }
        else { var msg = Strings.format("%o", obj); return showText(msg); }
    },

    alertDbg: function(msg) {
        if (Global.lively.morphic.World) alert(msg)
    },

    alert: function(msg, delay) {
        var world = Global.lively && lively.morphic && lively.morphic.World.current();
        if (world) world.alert(String(msg), delay);
        else console.log('ALERT: ' + msg);
    },

    alertOK: function (msg, delay) {
        var world = Global.lively && lively.morphic && lively.morphic.World.current();
        if (world) world.setStatusMessage(String(msg), Color.green, delay || 5);
        else console.log(msg);
    },

    log: function(msg /*, args*/) {
        if (arguments.length > 1) // do not interpret % if no args
            msg = Strings.format.apply(Strings, Array.from(arguments));
        if (Config.verboseLogging) {
            $world.setStatusMessage(msg, Config.get('textColor'), 3);
        } else {
            console.log(msg);
        }
    },

    inspect: function(obj) {
        if (Global.lively && lively.morphic && lively.morphic.World.current())
            return lively.morphic.World.current().openInspectorFor(obj);
    },

    edit: function(/*obj, method, ...*/) {
      var world = Global.lively && lively.morphic && lively.morphic.World.current();
      if (world) world.openObjectEditorFor.apply(world, arguments);
    },

    printCallStack: function() {
        var stack = 'no stack';
        try { throw new Error() } catch(e) { if (e.stack) stack = e.stack }
        return stack;
    },

    showCallStack: function() {
        lively.morphic.alert(lively.morphic.printCallStack());
    },

    printInspect: (function() {
      var maxColLength = 300;
      function inspectPrinter(val, ignore) {
        if (!val) return ignore;
        if (val.isMorph) return String(val);
        var length = val.length || val.byteLength;
        if (Global.ImageData && val instanceof Global.ImageData) return String(val);
        if (length !== undefined && length > maxColLength && val.slice) {
          var printed = val.byteLength ? String(val.slice(0, maxColLength)) : val.slice(0,maxColLength).map(lively.lang.string.print);
          return "[" + printed + ",...]";
        }
        return ignore;
      }

      return function(obj, maxDepth) {
        if (!obj) return String(obj);
        if (typeof obj === "string") return obj.length > maxColLength ? (obj.slice(0,maxColLength) + "...") : String(obj);
        if (!Object.isObject(obj)) return String(obj);
        return lively.lang.obj.inspect(obj, {
          customPrinter: inspectPrinter,
          maxDepth: maxDepth,
          printFunctionSource: true
        });
      }
    })(),

    newMorph: function(options) {
        // for interactive usage
        options = options || {};
        var klass = options.klass || lively.morphic.Box,
            pos = options.position || pt(0,0),
            origin = options.origin,
            extent = options.extent || pt(100,100),
            bounds = options.bounds || pos.extent(extent),
            style = options.style || {fill: Color.gray},
            args = options.args || [bounds],
            morph = new klass(args[0], args[1], args[2], args[3], args[4], args[5]);
        if (origin) morph.setOrigin(origin);
        if (options.name) morph.setName(options.name);
        return morph.applyStyle(style);
    }

});

Object.extend(lively, {
    showMarkerFor:     lively.morphic.showMarkerFor,
    show:     lively.morphic.show,
    log:      lively.morphic.log,
    newMorph: lively.morphic.newMorph,
    printInspect: lively.morphic.printInspect
});

Object.extend(Global, {
    show:     lively.morphic.show,
    showMarkerFor:     lively.morphic.showMarkerFor,
    alertDbg: lively.morphic.alertDbg,
    alert:    lively.morphic.alert,
    alertOK:  lively.morphic.alertOK,
    inspect:  lively.morphic.inspect,
    edit:     lively.morphic.edit,
    log:      lively.morphic.log
});

lively.morphic.Morph.addMethods(
'morphic relationship', {

    bringToFront: function() {
        // Hack: remove and re-add morph
        var owner = this.owner;
        if (!owner) return;
        this.remove();
        owner.addMorphFront(this);
    },

    sendToBack: function() {
        // Hack: remove and re-add morph
        var owner = this.owner;
        if (!owner) return;
        this.remove();
        owner.addMorphBack(this);
    },

    indentedListItemsOfMorphNames: function (indent) {
        indent = indent || '';
        var items = [];
        if (this.name) {
            items.push({isListItem: true, string: indent + this.name, value: this, selectionString: this.name})
            indent += indent;
        }
        items = items.concat(this.submorphs.invoke('indentedListItemsOfMorphNames', indent).flatten());
        return items;
    },

    treeItemsOfMorphNames: function (options) {
        var scripts = options["scripts"] || [],
            properties = options["properties"] || {},
            showUnnamed = options["showUnnamed"];
        if (!this.name && !showUnnamed) return null;
        var item = {name: this.name || "a " + lively.Class.getConstructor(this).displayName, value: this},
            children = this.submorphs.invoke('treeItemsOfMorphNames', options).compact();
        if (children.length > 0) item.children = children;
        lively.lang.properties.own(properties).forEach(function (v) { item[v] = properties[v]; });
        scripts.forEach(function (script) { Object.addScript(item, script); });
        return item;
    }

},
'convenience scripting', {
    stepAndBounce: function () {  // convenience for scripting
        this.stepByVelocities();
        this.bounceInOwnerBounds();
    },
    stepByVelocities: function () {
        if (this.velocity) this.moveBy(this.velocity);
        if (this.angularVelocity) this.rotateBy(this.angularVelocity);
    },
    bounceInOwnerBounds: function () {
        this.bounceInBounds(this.owner.innerBounds());
    },
    bounceInBounds: function (ob) {
        // typcially ob = this.owner.innerBounds()
        // Bounce by reversing the component of velocity that put us out of bounds
        if (!this.velocity) return;  // Can't bounce without a velocity vector

        // We take care to only reverse the direction if it's wrong,
        //    but we move in any case, since we might be deeply out of bounds
        var b = this.bounds();
        if (b.x < ob.x) {
            if (this.velocity.x < 0) this.velocity = this.velocity.scaleByPt(pt(-1, 1));
            this.moveBy(this.velocity);
        }
        if (b.maxX() > ob.maxX()) {
            if (this.velocity.x > 0) this.velocity = this.velocity.scaleByPt(pt(-1, 1));
            this.moveBy(this.velocity);
        }
        if (b.y < ob.y) {
            if (this.velocity.y < 0) this.velocity = this.velocity.scaleByPt(pt(1, -1));
            this.moveBy(this.velocity);
        }
        if (b.maxY() > ob.maxY()) {
            if (this.velocity.y > 0) this.velocity = this.velocity.scaleByPt(pt(1, -1));
            this.moveBy(this.velocity);
        }
    },
},
'opening', {

    openInWorld: function(pos) {
        var world = lively.morphic.World.current();
        if (!world) {
            lively.whenLoaded(this.openInWorld.bind(this, pos));
            return;
        }
        if (world.currentScene) world = world.currentScene;
        world.addMorph(this);
        pos && this.setPosition(pos);
        return this;
    },

    openInWindow: function(optPosOrOptions) {
        var options = optPosOrOptions || {};
        if (options.x !== undefined && options.y !== undefined) options = {pos: options};
        lively.morphic.World.current().internalAddWindow(this,
            options.title || this.name, options.pos || this.getPosition());
        this.applyStyle({resizeWidth: true, resizeHeight: true});
        if (this.partsBinMetaInfo) {
            this.owner.setPartsBinMetaInfo(this.getPartsBinMetaInfo());
            this.owner.setName(this.name);
            this.owner.setTitle(options.title || this.name);
        }
        return this.getWindow();
    },

    openInWorldCenter: function() {
        // redundant functionality as in openPartItem
        this.openInWorld();
        this.align(this.bounds().center(), lively.morphic.World.current().visibleBounds().center());
        return this;
    }
},
'removing', {
    removeAndDropSubmorphs: function() {
        // Removes the morph and lets all its child morphs drop to its owner
        var supermorph = this.owner || this.world(),
            morphPos = this.getPosition();
        if (supermorph && supermorph.isMorph) {
            this.submorphs.each(function(submorph) {
                var oldPos = submorph.getPosition();
                supermorph.addMorph(submorph);
                submorph.setPosition(morphPos.addPt(oldPos));
            }, this);
            this.remove();
        } else {
            throw('Cannot remove '+this+' with a submorph drop. It has no owner.');
        }
    }
},
'events', {
    takesKeyboardFocus: function() {/*deprecated, remove!*/},
    isGrabbable: function(evt) {
        // return false to inhibit grabbing by the hand
        return this.grabbingEnabled || this.grabbingEnabled === undefined;
    }
},
'undo', {

    undoRedoTransformationChange: function(spec, undo) {
        if (!undo || undo == 'undo') {
            if (spec.startOrigin !== spec.endOrigin) {

            }
            // Change of owner due to grab/drop or remove
            if (spec.startOwner !== spec.endOwner) {
                if (spec.startOwner == null)
                    this.remove();
                else
                    spec.startOwner.addMorph(this);
            }
            // Drag, rotate, scale
            this.setTransform(spec.startTransform);
            if (!spec.startExtent.eqPt(spec.endExtent)) {
                this.setExtent(spec.startExtent.scaleBy(1/this.getScale()));
            }
        }
        if (undo == 'redo') {
            if (spec.startOrigin !== spec.endOrigin) {

            }
            // Change of owner due to grab/drop or remove
            if (spec.startOwner !== spec.endOwner) {
                spec.endOwner.addMorph(this);
            }
            // Drag, rotate, scale
            this.setTransform(spec.endTransform);
            if (!spec.startExtent.eqPt(spec.endExtent)) {
                    this.setExtent(spec.endExtent.scaleBy(1/this.getScale()));
            }
        }
    },

    undoRedoStyleChange: function(spec, undo) {
        var propName = spec.actionName;
        if (!undo || undo == 'undo') {
            this['set'+propName](spec['start'+propName]);
        }
        if (undo == 'redo') {
            this['set'+propName](spec['end'+propName]);
        }
    },

    logStyleForUndo: function(propName, phase) {
        // See World.undoReadme
        // Note: propName will be capitalized, as 'BorderWidth'
        // Style changes for now are all continuous - we can't tell the first from others
        // Therefore we look at the last undo item, and if it matches (morph and propName)
        //    then we amend with new value for end<Prop>, else we log a new undo item
        if ($world.undoQueue.length == 0
            || $world.undoQueue.last().morph !== this
            || $world.undoQueue.last().actionName != propName) {
            // Log the starting state for style changes
            var spec = {morph: this, actionName: propName, phase: 'before',
                        undoFunctionName: 'undoRedoStyleChange'};
            spec['start'+propName] = this['get'+propName]();
            $world.logMorphicAction(spec);
            return;
        }

        // Log the ending state for changing style parameters
        var spec = {morph: this, actionName: propName, phase: 'after'};
        spec['end'+propName] = this['get'+propName]();
        $world.amendMorphicAction(spec);
    },

    logTransformationForUndo: function(actionName, phase, evt) {
        // See World.undoReadme
        // Note grab/drop involves change in both ownership and transformation
        // Change of origin is handled separately
        var transform = this.getTransform();
        //in the case where morph gets moved by a mouse directly (without using the halo)
        //we need to calculate the mouse offset to get the morph's true start origin
        //and then adjust the difference in both the startOrigin, and startTransform.
        if(evt && evt.hand && evt.hand.eventStartPos && 
            ! (evt.getTargetMorph() instanceof lively.morphic.GrabHalo )) {
            var mouseOffsetX = evt.getPosition().x - evt.hand.eventStartPos.x;
            var mouseOffsetY = evt.getPosition().y - evt.hand.eventStartPos.y;
            transform.e -= mouseOffsetX;
            transform.f -= mouseOffsetY;
        }
        var org = transform.transformPoint(this.getOrigin());
        if (phase == null || phase == 'start') {
            // Log the starting state for, eg, grab, drag, etc.
            $world.logMorphicAction({
                morph: this, actionName: actionName, phase: phase,
                undoFunctionName: 'undoRedoTransformationChange',
                startTransform: transform, startExtent: this.getBounds().extent(),
                startOwner: this.owner,
                startIndexInSubmorphs: this.owner ? this.owner.submorphs.indexOf(this) : null,
                startOrigin: org
            });
            return;
        }
        // Log the ending state for, eg, grab, drag, etc.
        var amendments = {
            morph: this, actionName: actionName, phase: phase,
            endTransform: this.getTransform(), endExtent: this.getBounds().extent(),
            endOwner: this.owner, endOrigin: org
        };

        if (this.owner) amendments.endIndexInSubmorphs = this.owner.submorphs.indexOf(this)
            $world.amendMorphicAction(amendments);
    }
},
'styling', {

    // FIXME does not belong here
    setPadding: function(padding) { this.padding = padding },

    getStyleClass: function() { return this.styleClass || [] },

    setStyleClass: function(value) {
        // from good ol' SVG days
        var attr;
        if (value instanceof Array) {
            this.styleClass = value;
            // attr = value.join(' ');
        } else {
            this.styleClass = [value];
            // attr = String(value);
        }
        // this.rawNode.setAttribute("class", attr);
        return value;
    },

    makeStyleSpec: function() {
        // create a JS object for applyStyle
        // FIXME is this needed/used anymore?
        // Adjust all visual attributes specified in the style spec
        var spec = { };
        spec.borderWidth = this.getBorderWidth();
        spec.borderColor = this.getBorderColor();
        spec.fill = this.getFill();
        if (this.shape.getBorderRadius) spec.borderRadius = this.shape.getBorderRadius() || 0.0;
        spec.fillOpacity = typeof this.shape.getFillOpacity() !== undefined ?
            this.shape.getFillOpacity() : 1.0;
        spec.strokeOpacity = typeof this.shape.getStrokeOpacity() !== undefined ?
            this.shape.getStrokeOpacity() : 1.0;
        return spec;
    },

    applyStyleNamed: function(name) {
        var style = this.styleNamed(name);
        if (style) this.applyStyle(style);
        else console.warn("applyStyleNamed: no style named " + name)
    },

    styleNamed: function(name) {
        // Look the name up in the Morph tree, else in current world
        if (this.displayTheme) return this.displayTheme[name];
        if (this.owner) return this.owner.styleNamed(name);
        var world = lively.morphic.World.current();
        if (world && (this !== world)) return world.styleNamed(name);
        return DisplayThemes[Config.defaultDisplayTheme || "lively"][name];
        // FIXME for onDeserialize, when no world exists yet
    },

    linkToStyles: function(styleClassList, optSupressApplication) {
        // Record the links for later updates, and apply them now
        this.setStyleClass(styleClassList);
        if (!optSupressApplication) this.applyLinkedStyles();
        return this;
    },

    applyLinkedStyles: function() {
        // Apply all the styles to which I am linked, in order
        var styleClasses = this.getStyleClass();
        if (!styleClasses) return;
        for (var i = 0; i < styleClasses.length; i++) {
            this.applyStyleNamed(styleClasses[i]);
        }
    },

    getGridPoint: function() {
        return this.owner && this.owner.layout && this.owner.layout.grid ?
            this.owner.layout.grid : pt(Config.get('gridSpacing'), Config.get('gridSpacing'));
    }

},
"layouting helpers", {
  
  fitToSubmorphs: function() {
    if (!this.submorphs.length) return;
    var subBounds = this.submorphBounds(new lively.morphic.Similitude()),
        l = this.getLayouter(),
        offset = l ? l.getBorderSize() : 0;
    this.setExtent(subBounds.bottomRight().addXY(offset, offset));
  }

},

'update & change', {
    layoutChanged: function() {},
    changed: function() {}
},
'lively bindings', {
    plugTo: function(obj, connectSpec) {
        // experimental protocol
        // This message preserves the model-view "plug" API of MVC's pluggable views,
        // while using the "direct connect" form of change notification
        // {dir: String, name: String, options: Object}
        var view = this;
        function parseStringSpec(stringSpec) {
            var parsed = stringSpec.match(/(<?->?)(.*)/);
            return {dir: parsed[1], name: parsed[2]};
        };
        Properties.forEachOwn(connectSpec, function (viewProp, spec) {
            if (Object.isString(spec)) spec = parseStringSpec(spec);
            var dir = spec.dir || '->', options = spec.options || {};
            if (dir == "->" || dir == "<->")
                lively.bindings.connect(view, viewProp, obj, spec.name, options)
            if (dir == "<-" || dir == "<->")
                lively.bindings.connect(obj, spec.name, view, viewProp, options)
        });
        return this;
    }
},
'animations', {
    dissolve: function(ms) {
        ms = ms || 400;
        var steps = 10,
            stepTime = ms / steps,
            opacityDelta = Math.max(this.getFillOpacity(), this.getOpacity()) / steps,
            morph = this;
        function doStep(step) {
            if (step == 0) { morph.remove(); return}
            morph.setOpacity(morph.getOpacity() - opacityDelta);
            doStep.curry(step-1).delay(stepTime/1000);
        }
        doStep(steps);
    },
    appear: function(ms, owner) {
        ms = ms || 400;
        owner = owner || lively.morphic.World.current();
        var steps = 10,
            stepTime = ms / steps,
            opacityDelta = 1 / steps,
            morph = this;
        morph.setOpacity(0);
        owner.addMorph(morph);
        function doStep(step) {
            if (step == 0) { morph.setOpacity(1); return }
            morph.setOpacity(morph.getOpacity() + opacityDelta);
            doStep.curry(step-1).delay(stepTime/1000);
        }
        doStep(steps);
    }
},
'fixed positioning', {
    enableFixedPositioning: function() {
        if (!this.owner || !this.owner.isWorld) {
            console.warn('Setting fixed positioning for morph %s but owner is not world!', this);
        }
        var world = this.world() || lively.morphic.World.current(),
            trait = Trait('lively.morphic.FixedPositioning.MorphTrait');
        trait.applyTo(this, {override: Functions.own(trait.def)});
        world.addMorphWithFixedPosition(this);
        this.addEventHandlerForFixedPositioning();
        return this;
    },
    disableFixedPositioning: function() {
        /*not enabled, see Trait('lively.morphic.FixedPositioning.MorphTrait') */
        return this;
    },
    setFixedPosition: function(bool) {
        this.cachedBounds = null;
        return this.morphicSetter('FixedPosition', bool);
    },
    hasFixedPosition: function() {
        return this.morphicGetter('FixedPosition') || false;
    },
    setFixed: function(optFixed) {
        return optFixed ? this.enableFixedPositioning() : this.disableFixedPositioning();
    }
},
'fullscreen', {
    enterFullScreen: function(beTopLeft) {
        var world = this.world();
        if (this._isInFullScreen || !world) return;
        this._isInFullScreen = true;
        world.addBackgroundMorphForFullScreen();
        this.oldPosition = this.getPosition();
        this.oldWorldScale = world.getScale();
        this.oldWorldExtent = world.getExtent();
        world.cachedWindowBounds = null;
        var windowExtent = world.windowBounds().extent(),
            ratioY =  (windowExtent.y / this.getExtent().y) * world.getScale(),
            ratioX =  (windowExtent.x / this.getExtent().x) * world.getScale(),
            ratio = Math.min(ratioX, ratioY);
        if (ratio > 0 && ratio < 100) {
            var newWindowExtent = pt(windowExtent.x / ratio, windowExtent.y / ratio);
            world.setScale(ratio);
            if (beTopLeft) {
                this.setPosition(pt(0,0))
                world.setExtent(this.getExtent());
            } else {
                this.align(this.worldPoint(
                    this.shape.bounds().topCenter()), pt(newWindowExtent.x/2, 0));
                world.setExtent(newWindowExtent);
            }
            Global.scrollTo(0, 0)
            this.owner.addMorphFront(this);
            this.clipWorld();
        };
    },

    leaveFullScreen: function() {
        if (!this._isInFullScreen) return;
        this._isInFullScreen = false;
        this.world().removeBackgroundMorphForFullScreen();
        this.setPosition(this.oldPosition)
        this.unclipWorld();
        this.world().resetScale()
        this.world().setExtent(this.oldWorldExtent);
        Global.scrollTo(this.oldPosition.x, this.oldPosition.y)
        delete this.oldWorldExtent;
        delete this.oldWorldScale;
        delete this.oldPosition;
    },
    isInFullScreen: function() { return !!this._isInFullScreen; },

    clipWorld: function() {
        this.world().applyStyle({clipMode: 'hidden'});
    },

    unclipWorld: function() {
        this.world().applyStyle({clipMode: 'visible'});
    },
    selectAllSubmorphs: function(aBooleanFunction) {
        // returns a list of all submorphs (recursively) that satisfy aBooleanFunction
        var res = [];
        this.submorphs.forEach(function(ea) {
            if (aBooleanFunction(ea)) res.push(ea);
            res.pushAll(ea.selectAllSubmorphs(aBooleanFunction));
        });
        return res;
    },
},
'interaction', {
    show: function() { lively.morphic.show(this) },
    edit: function() { lively.morphic.edit(this) }
},
"ui messaging", {
  addStatusMessageTrait: function() {
    Trait('lively.morphic.SetStatusMessageTrait').applyToObject(this);
  }
});

lively.morphic.Morph.addMethods(
'overlay', {
    addOverlay: function() {
        this.removeOverlay();
        var overlay = lively.morphic.Morph.makeRectangle(this.visibleBounds());
        this.addMorphFront(overlay);
        overlay.applyStyle({fill: Color.black, opacity: 0.6});
        overlay.ignoreEvents();
        this.overlay = overlay;
        return overlay;
    },
    removeOverlay: function() {
        if (this.overlay) this.overlay.remove();
    },
});

Object.extend(lively.morphic.Morph, {
    makeRectangle: function (/**/) {
        var bounds;
        switch (arguments.length) {
            case 1: // rectangle
                if (!(arguments[0] instanceof Rectangle)) throw new TypeError(arguments[0] + ' not a rectangle');
                bounds = arguments[0];
                break;
            case 2: // location and extent
                bounds = arguments[0].extent(arguments[1]);
                break;
            case 4: // x,y,width, height
                bounds = new Rectangle(arguments[0], arguments[1], arguments[2], arguments[3]);
                break;
            default:
                throw new Error("bad arguments " + arguments);
        }
        var morph = new lively.morphic.Box(bounds);
        morph.applyStyle({borderWidth: 1, borderColor: Color.black, fill: Color.blue});
        return morph;
    },
    makeCircle: function(location, radius, lineWidth, lineColor, fill) {
        // make a circle of the given radius with its origin at the center
        var bounds = pt(-radius, -radius).extent(pt(radius*2, radius*2));
        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.Ellipse(bounds));
        morph.moveBy(location);
        morph.setBorderWidth(lineWidth || 0);
        morph.setBorderColor(lineColor || Color.black);
        morph.setFill(fill || Color.blue);
        return morph;
    },
    makeLine: function (verts, lineWidth, lineColor) {
        if (verts.length < 2) return null;
        var morph = new lively.morphic.Path(verts);
        morph.applyStyle({
            fill: null,
            borderWidth: lineWidth || 1,
            borderColor: lineColor || Color.black
        });
        return morph;
    },
    makePolygon: function (verts, lineWidth, lineColor, fill) {
        var path = new lively.morphic.Path(verts);
        path.setBorderWidth(lineWidth);
        path.setBorderColor(lineColor);
        path.setFill(fill);
        return path;
    },
    makeEllipse: function(aRectangle) {
        var ellipse = new lively.morphic.Morph();
        ellipse.setShape(new lively.morphic.Shapes.Ellipse(aRectangle));
        ellipse.setFill(Color.green);
        ellipse.setOrigin(aRectangle.extent().scaleBy(0.5));
        return ellipse;
    },
    makeCubicBezier: function(controlPoints, lineWidth, lineColor) {
        var ptToString = function(point) { return point.x + ',' + point.y };
        var svgDescriptors = "M" + ptToString(controlPoints[0]) + "C" + controlPoints.slice(1).map(ptToString).join(' ');
        var bezierCurve = new lively.morphic.Path([lively.pt(0,0),lively.pt(0,0)])

        bezierCurve.shape.setPathElements(lively.morphic.Shapes.PathElement.parse(svgDescriptors));
        bezierCurve.setPosition(lively.pt(0, 0));
        bezierCurve.setBorderWidth(lineWidth);
        bezierCurve.setBorderColor(lineColor)

        // this fixes the wrong bounding box which can clip parts of the path
        bezierCurve.shape.getBounds = function() {
            var b = this.renderContext().pathNode.getBBox()
            return new Rectangle(b.x - lineWidth, b.y - lineWidth, b.width + 2 * lineWidth, b.height + 2 * lineWidth)
        }
        return bezierCurve;
    }
});

lively.Line.addMethods(
'conversion', {
    asMorph: function() {
        return this.start && this.end ?
            lively.morphic.Morph.makeLine([this.start, this.end], 1) :
            null;
    }
});

Object.extend(lively.Line, {
    arrowBetween: function(obj1, obj2, spec) {
        spec = spec || {};
        if (!obj1 || !obj2
                  || !Object.isFunction(obj1.bounds)
                  || !Object.isFunction(obj2.bounds)) return null;
        var bounds1 = obj1.globalBounds ? obj1.globalBounds() : obj1.bounds(),
            bounds2 = obj2.globalBounds ? obj2.globalBounds() : obj2.bounds(),
            line = bounds1.lineTo(bounds2),
            morph = line && line.asMorph();
        if (!morph) return null;
        morph.openInWorld();
        if (spec.lineStyle) morph.applyStyle(spec.lineStyle);
        if (spec.endArrow) morph.createArrowHeadEnd();
        if (spec.startArrow) morph.createArrowHeadStart();
        return morph;
    }
});

lively.morphic.Text.addMethods(
'shape appearance', {
    fitWidth: function() {}
},
'focus', {
    requestKeyboardFocus: function(hand) { this.focus() }
});

Object.extend(lively.morphic.Text, {
    makeLabel: function (labelString, styleIfAny) {
        var label = new this();
        label.setTextString(labelString);
        label.beLabel(styleIfAny);
        return label;
    },
});

lively.morphic.World.addMethods(
'events', {

    isGrabbable: function(evt) { return false; }

},
'debugging', {
    logError: function (er, optName) {
        Global.LastError = er;
        var msg = (optName || 'LOGERROR: ') + String(er) + "\nstack:" + er.stack;
        this.setStatusMessage(msg, Color.red, 10, function() {
            var errorStackViewer = this.openPartItem("ErrorStackViewer", "PartsBin/Tools");
            errorStackViewer.align(
                errorStackViewer.bounds().topCenter(), this.visibleBounds().topCenter());
            errorStackViewer.setError(er);
        }.bind(this));
    }
},
'logging', {
    setStatusMessage: function (msg, color, delay, callback, optStyle) {
        console[color == Color.red ? "error" : "log"](msg);

        if (!lively.Config.get('verboseLogging')) return null;

        var msgMorph = this.createStatusMessage(msg, Object.merge([{fill: color}, optStyle]));
        // callbacks are currently not supported...
        if (false && callback) {
            var btn = new lively.morphic.Button(lively.rect(0,0,50,20), 'more')
            btn.callbackFunc = callback;
            msgMorph.addMorph(btn);
            btn.align(btn.bounds().topRight(), closeBtn.bounds().topLeft().addPt(pt(-5,0)));
            connect(btn, 'fire', btn, 'callbackFunc')
        }
        
        return this.addStatusMessageMorph(msgMorph, delay || 5);
    },

    alert: function(msg, delay) {
        msg = String(msg);
        this.lastAlert = msg;
        this.setStatusMessage(msg, Color.red, delay, function() {
            var w = $world.addTextWindow({title: 'ALERT',
                content: msg, syntaxHighlighting: false});
            w.owner.align(w.owner.bounds().topRight(), $world.visibleBounds().topRight())
        })
    },
    alertOK: function(msg, delay) {
        msg = String(msg);
        this.lastAlert = msg;
        this.setStatusMessage(String(msg), Color.green, delay);
    },
    addStatusMessageMorph: function(morph, delay) {
        if (!this.statusMessages) this.statusMessages = [];
        while (this.statusMessages.length >= Config.get('maxStatusMessages')) {
            this.statusMessages.shift().remove()
        }

        morph.isEpiMorph = true;
        this.addMorph(morph);
        morph.addScript(function onMouseDown(evt) {
            this.stayOpen = true;
            return $super(evt);
        })
        morph.addScript(function remove() {
            var world = this.world();
            if (world && world.statusMessages) {
                world.statusMessages.remove(this);
            }
            if(RealTrait && this._traitConfig_ && this._traitConfig_.length > 0) {
                var self = this;
                for(var i=0; i < this._traitConfig_.length; i++)
                    var trait = RealTrait.prototype.traitRegistry[this._traitConfig_[i].traitName];
                    var holder = trait.extendedObjectsAndOptions.objects.detect(function(e){return e.object === self});
                    if(holder)
                        trait.extendedObjectsAndOptions.objects.remove(holder);
            }
            return $super();
        })
        morph.align(morph.bounds().bottomRight(), this.visibleBounds().bottomRight().addXY(-20, -20));
        // morph.align(morph.bounds().topRight(), this.visibleBounds().topRight());
        this.statusMessages.invoke('moveBy', pt(0, -morph.getExtent().y));
        this.statusMessages.push(morph);

        if (delay) {
            (function removeMsgMorph() {
                if (!morph.stayOpen) morph.remove()
            }).delay(delay);
        }

        return morph;
    },
    createStatusMessage: function(msg, options) {
        // Example:
        // $world.createStatusMessage("Hello :)", {openAt: 'leftCenter'});
        options = options || {};
        var msgMorph = lively.newMorph({extent: options.extent || pt(240, 68)});
        msgMorph.isEpiMorph = true;
        msgMorph.openInWorld()
        msgMorph.applyStyle({
            adjustForNewBounds: true, clipMode: 'hidden',
            enableGrabbing: false, enableDragging: true, enableDropping: false,
            zIndex: 999});
        Trait('lively.morphic.DragMoveTrait').applyTo(msgMorph, {override: ['onDrag','onDragStart', 'onDragEnd']});
        msgMorph.name = 'messageMorph'
        msgMorph.addStyleClassName(msgMorph.name);

        var textMsg = msgMorph.addMorph(new lively.morphic.Text(msgMorph.innerBounds().insetBy(10), ''));
        textMsg.name = 'messageText'
        textMsg.addStyleClassName(textMsg.name);
        textMsg.beLabel(Object.merge([{
            fixedWidth: true, fixedHeight: true,
            resizeWidth: true, resizeHeight: true,
            allowInput: false, selectable: false,
            clipMode: 'visible', whiteSpaceHandling: 'pre'
        }, (options.textStyle || {})]));

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        var closeBtn = msgMorph.addMorph(new lively.morphic.Text(msgMorph.innerBounds().withWidth(30), '✗'));
        closeBtn.align(closeBtn.bounds().topLeft(), msgMorph.innerBounds().topLeft())
        closeBtn.name = 'closeButton'
        closeBtn.addStyleClassName(closeBtn.name);
        closeBtn.applyStyle({
            moveHorizontal: false, centeredVertical: true,
            clipMode: 'hidden'
        });

        msgMorph.withAllSubmorphsDo(function(ea) {
            ea.setAppearanceStylingMode(true);
            ea.setBorderStylingMode(true);
            ea.isText && ea.setTextStylingMode(true)
        });

        closeBtn.addScript(function onMouseUp(evt) {
            this.owner.remove();
            evt.stop(); return true;
        });

        msgMorph.addScript(function setMessage(msg, color) {
            var textMsg = this.get('messageText');
            textMsg.textString = msg;
            var cssClass = (Color.red.equals(color) && 'failure')
                        || (Color.green.equals(color) && 'success');
            cssClass &&  this.addStyleClassName(cssClass);
            (function() {
                var extent = textMsg.getTextExtent().minPt(this.getExtent().subXY(10,10));
                textMsg.setExtent(extent);
                textMsg.align(textMsg.bounds().center(), this.innerBounds().center());
            }).bind(this).delay(0);
        });

        msgMorph.addScript(function onDoubleClick(evt) {
            var world = this.world();
            if (!world || this.isMaximized) return;
            this.isMaximized = true;
            this.addStyleClassName('maximized');
            this.stayOpen = true;
            world.statusMessages.remove(this);
            var self = this, text = this.get('messageText');
            text.applyStyle({allowInput: true, fixedWidth: false, selectable: true});
            text.fit();
            (function() {
                var ext = text.getTextExtent().addXY(20,20),
                    visibleBounds = world.visibleBounds();
                if (ext.y > visibleBounds.extent().y) ext.y = visibleBounds.extent().y - 20;
                if (ext.x > visibleBounds.extent().x) ext.x = visibleBounds.extent().x - 20;
                ext = self.getExtent().maxPt(ext);
                self.setExtent(ext);
                self.align(self.bounds().center(), visibleBounds.center());
                text.setTextExtent(ext.addXY(-20,-20));
                text.disableHalos();
             }).delay(0);
        });

        msg && msgMorph.setMessage(msg, options.fill);

        if (options.openAt) {
            // $world.visibleBounds().topLeft()
            var myPos = msgMorph.bounds()[options.openAt](),
                worldPos = this.visibleBounds().insetBy(50)[options.openAt]();
            msgMorph.align(myPos, worldPos);
        }

        if (options.removeAfter) {
            msgMorph.remove.bind(msgMorph).delay(options.removeAfter / 1000);
        }

        return msgMorph;
    },

    addStatusProgress: function(label) {
        return this.addStatusMessageMorph(this.addProgressBar(null, label));
    }

},
'undo', {
    undoQueue: [],
    undoRedoPointer: -1,
    enableMorphicUndo: function() {
        // See undoReadme
        // non-null queue means logging is enabled
        this.undoQueue = [];
        this.undoRedoPointer = -1;
    },
    logMorphicAction: function(actionSpec) {
        // See undoReadme
        // enter a new action spec in the queue
        if (!this.undoQueue) return;  // undo not enabled

        var numUndone = (this.undoQueue.length - 1) - this.undoRedoPointer;
        if (numUndone > 0) {
            for (var i=0; i<numUndone; i++) {
                this.undoQueue.pop();  // shorten queue to last undo/redo point
            }
        }

        var maxQueueLength = 20;
        if (this.undoQueue.length > maxQueueLength) {
            this.undoQueue.splice(0, 2);
        }
        this.undoQueue.push(actionSpec)
        this.undoRedoPointer = this.undoQueue.length - 1;  // reset pointer to latest action
        return;
    },
    undoLastAction: function(actionSpec) {
        // undo the most recent action
        //  or before the last undo or after the last redo
        if (!this.undoQueue) return;  // undo not enabled

        if (this.undoRedoPointer < 0) return;  // queue is  empty
        var action = this.undoQueue[this.undoRedoPointer]
        if (action.phase && action.phase == 'start') {
            console.log("Undo action still has phase = 'start'")
        }
        action.morph[action.undoFunctionName](action, 'undo');
        this.undoRedoPointer--
    },
    redoNextAction: function() {
        // redo the most recent undone action or that after the last redo
        if (!this.undoQueue) return;  // undo not enabled

        if (this.undoRedoPointer+1 > this.undoQueue.length-1) return;  // queue is  empty
        var action = this.undoQueue[this.undoRedoPointer+1]
        if (action.phase && action.phase == 'start') {
            console.log("Last undo action still has phase = 'start'")
        }
        action.morph[action.undoFunctionName](action, 'redo');
        this.undoRedoPointer++
    },
    getUndoQueue: function() {
        return this.undoQueue;
    },
    amendMorphicAction: function(amendment) {
        // See undoReadme
        // amend the last spec in undoQueue with updated values
        // note the amendment's morph and actionName must match that of the original spec
        if (!this.undoQueue || this.undoQueue.length == 0) return;
        var lastAction = this.undoQueue.last();
        if (lastAction.morph !== amendment.morph || lastAction.actionName !== amendment.actionName) {
            console.log('Unmatching log of state for ' + amendment.actionName + ' ' + amendment.phase);
            // Maybe we should do more - like check if lastAction phase was start
            // meaning it needs more, so we should take it off the queue since incomplete
            return
        }
        for (p in amendment) { lastAction[p] = amendment[p] };
    },
    undoReadme: function() {
        // NOTE:  Simple undo records should be logged with null phase = 'start/end'
        // start/end actions (like button down/up) should be logged with, eg, 'start', 'end'
        // continuous actions (like slider) should be logged with, eg, 'more', 'more', 'more', ...
        // What really matters is that 'start/end', 'start', or the first 'more' with a given
        //      caption will *log* a new undo record, andything else will *amend*
    },
    disableMorphicUndo: function() {
        // Null queue means no logging
        this.undoQueue = null;
    }
},
'preferences', {

    openPreferences: function() {
        require('lively.morphic.tools.Preferences').toRun(function() {
            lively.BuildSpec('lively.morphic.tools.Preferences').createMorph().openInWorldCenter().comeForward();
        });
    },

    askForNewWorldExtent: function() {
        var world = this;
        this.prompt("Please enter new world extent", function(str) {
            if (!str) return;
            var newExtent;
            try {
                newExtent = eval(str);
            } catch(e) {
                alert("Could not eval: " + str)
            };
            if (! (newExtent instanceof lively.Point)) {
                alert("" + newExtent + " " + "is not a proper extent")
                return
            }
            world.setExtent(newExtent);
            alertOK("Set world extent to " +  newExtent);
        }, this.getExtent().toString());
    },

    askForNewBackgroundColor: function() {
        var world = this,
            oldColor = this.getFill();
        if(! (oldColor instanceof Color)){
            oldColor = Color.rgb(255,255,255);
        }
        world.prompt("Please enter new world background color", function(str) {
            if (!str) return;
            var newColor;
            try {
                newColor = eval(str);
            } catch(e) {
                alert("Could not eval: " + str)
            };
            if (! (newColor instanceof Color)) {
                alert("" + newColor + " " + "is not a proper Color")
                return
            }
            world.setFill(newColor);
            alertOK("Set world background to " +  newColor);
        }, "Color." + oldColor)
    },
},
'auth', {

    askForUserName: function(prompt, thenDo) {
        if (!Object.isString(prompt)) prompt = null;
        var world = this, oldUserName = world.getUserName(true);
        world.prompt(prompt || "Please enter your user name.", function(name) {
            if (name && name.length > 0) {
                world.setCurrentUser(name);
                world.setStatusMessage("User name is now: " + world.getUserName(true), Color.green);
            } else {
                var msg = oldUserName ? "Removing user name." : "No user name set.";
                world.setStatusMessage(msg, Color.green);
                world.setCurrentUser(undefined);
            }
            thenDo && thenDo(world.getUserName(true));
        }, oldUserName);
    },

    setCurrentUser: function(username) {
        this.currentUser = username;
        lively.Config.set('UserName', username);
        lively.require('lively.net.SessionTracker').toRun(function() {
            lively.net.SessionTracker.serverLogin();
            lively.net.SessionTracker.whenOnline(function(err, sess) {
              if (!err) sess.setUserName(username); });
        });
    },

    getUserName: function(noninteractive) {
        var userName = lively.Config.get('UserName')
        if (userName && userName !== 'undefined') return userName;
        if (!noninteractive) userName = this.askForUserName();
        if (userName && userName !== 'undefined') {
            lively.Config.set('UserName', userName);
            return userName;
        }
        return null;
    },

    getUserDir: function(optUserName) {
        var username = optUserName || this.getUserName();
        return username ? URL.root.withFilename('users/' + username + '/') : null;
    },

    ensureUserDir: function(optUserName) {
        var username = optUserName || this.getUserName(),
            userDir = this.getUserDir(optUserName);
        userDir.asWebResource().ensureExistance();
        return userDir;
    },

    ensureUserConfig: function(optUserName) {
        var userDirURL = this.ensureUserDir(optUserName);
        if (!userDirURL) return;
        var userConfigURL = userDirURL.withFilename('config.js');
        if (userConfigURL.asWebResource().exists()) {
            return userConfigURL;
        }
        module('lively.ide.BrowserCommands').load(true);
        var createModuleCommand = new lively.ide.AddNewFileCommand();
        createModuleCommand.createModuleFile(userConfigURL);
        return userConfigURL;
    },

    showUserConfig: function() {
      var self = this;
      var user  = self.getUserName(true);
      if (user === "null") user = null;
      
      lively.lang.fun.composeAsync(
        user ? function(n) { n(null, user); } : function(n) {
          $world.askForUserName("No username set yet, please enter your username:", function(input) {
            n(null, input);
          });
        },
        function(username, n) {
          if (!username) return n(new Error("Not a valid username: " + username));
          $world.setCurrentUser(username);
          n();
        },
        showIt
      )(function(err) {
        if (err) $world.inform("Could not browser user config because:\n" + err);
      });
      
      function showIt(n) {
        var url = self.ensureUserConfig();
        url && require('lively.ide').toRun(function() {
            lively.ide.browse(url);
        });
      }
    }

},
'fullscreen', {
    addBackgroundMorphForFullScreen: function() {
        this.removeBackgroundMorphForFullScreen();
        var m = lively.morphic.Morph.makeRectangle(this.bounds());
        m.setFill(Color.white);
        m.ignoreEvents();
        this.addMorph(m);
        this.fullScreenBackgroundMorph = m;
    },
    removeBackgroundMorphForFullScreen: function() {
        if (!this.fullScreenBackgroundMorph) return;
        this.fullScreenBackgroundMorph.remove();
        this.fullScreenBackgroundMorph = null;
    },
},
"zooming", {
    getZoomLevel: function() {
        this.zoomLevel = this.calculateCurrentZoom();
        return this.zoomLevel;
    },
    calculateCurrentZoom: function() {
        // TODO: clean distinction of browsers
        if(UserAgent.isTouch) {
            return document.documentElement.clientWidth / window.innerWidth;
        }  else {
            return window.outerWidth / window.innerWidth;
        }
    },
    updateZoomLevel: function () {
        this.zoomLevel = this.calculateCurrentZoom();
        return this.zoomLevel
    }
});

// really necessary to have this class?
// 2015-11-26 rk: no, it is deprecated and only still exists to allow for
// backwards compatibility with old widgets/apps. Will be removed in the future
lively.morphic.Box.subclass('lively.morphic.Panel',
'settings', {
    style: {
        resizeWidth: true, resizeHeight: true, // so it scales itself
        adjustForNewBounds: true // so it layouts its submorphs
    }
},
'initializing', {
    initialize: function($super, extent) {
        $super(extent.extentAsRectangle());
    },

    newTextPane: function(initialBounds, defaultText, style) {
        var bounds = initialBounds.extent().extentAsRectangle(),
            text = new lively.morphic.Text(bounds, defaultText);
        text.applyStyle({clipMode: 'scroll', fixedWidth: true, fixedHeight: true});
        if(style)
            text.applyStyle(style);
        return text;
    },
    newStaticTextPane: function newStaticTextPane(extent, initialText, style) {
        var text = this.newTextPane(extent, initialText);
        text.applyStyle({scaleProportional: true, allowInput: false, clipMode: 'visible', align: 'center'});
        if(style)
            text.applyStyle(style);
        return text;
    },

    newListPane: function newListPane(extent, optItems) {
        var list = new lively.morphic.List(extent, optItems);
        list.applyStyle({scaleProportional: true});
        return list;
    },
    newButton: function newButton(extent, label) {
        var button = new lively.morphic.Button(extent, label);
        button.applyStyle({scaleProportional: true});
        button.setBorderStylingMode(false);
        return button;
    },

    openIn: function openIn(world, title, pos) {
        this.buildView();
        var window = world.addFramedMorph(this, title);
        if (pos) window.setPosition(pos);
        if (world.currentScene) world.currentScene.addMorph(window); // FIXME
        return window;
    },
    
    setActive: function(button, bool) {
        button.applyStyle({borderColor: bool ? Color.red : Color.black, borderWidth: bool ? 2 : 1});
        button.setActive(bool);
    },

    newCodePane: function newCodePane(extent) {
        var codePane = this.newTextPane(extent);
        codePane.enableSyntaxHighlighting();
        codePane.evalEnabled = true;
        codePane.applyStyle({scaleProportional: true});
        codePane.savedTextString = codePane.textString;
        if (lively.LocalStorage.get('Changesets:' + location.pathname))
            codePane.doBrowseImplementors = function () {
                openFunctionList('implementors', this.getSelectionOrLineString()); };
        if (lively.LocalStorage.get('Changesets:' + location.pathname))
            codePane.doBrowseReferences = function () {
                openFunctionList('references', this.getSelectionOrLineString(), true); };
        return codePane
    },
    newReadOnlyCodePane: function newReadOnlyCodePane(extent) {
        var codePane = this.newTextPane(extent);
        codePane.enableSyntaxHighlighting();
        codePane.evalEnabled = true;
        codePane.applyStyle({scaleProportional: true, allowInput: false});
        if (lively.LocalStorage.get("Changesets:" + location.pathname))
            codePane.doBrowseImplementors = function () {
                openFunctionList('implementors', this.getSelectionOrLineString()); };
        if (lively.LocalStorage.get("Changesets:" + location.pathname))
            codePane.doBrowseReferences = function () {
                openFunctionList('references', this.getSelectionOrLineString(), true); };
        return codePane;
    },

    newDropDownListPane: function newDropDownListPane(extent, optItems) {
        var list = new lively.morphic.DropDownList(extent, optItems);
        list.applyStyle({scaleProportional: true});
        return list;
    },

    newDragnDropListPane: function(initialBounds, suppressSelectionOnUpdate) {
        return new lively.morphic.List(initialBounds, ['-----']);
    },

    arrangeElementsAccordingToSpec: function(extent, paneSpecs, optPanel) {
        // Generalized constructor for paned window panels
        // paneSpec is an array of arrays of the form...
        //     ['leftPane', newTextListPane, new Rectangle(0, 0, 0.5, 0.6)],
        // See example calls in, eg, SimpleBrowser.buildView() for how to use this
        var panel = optPanel || new this(extent);
        //panel.linkToStyles(['panel']);

        panel.paneNames = [];
        paneSpecs.forEach(function(spec) {
            var paneName = spec[0],
                paneConstructor = spec[1],
                relativeRect = spec[2] instanceof lively.Rectangle ?
                    spec[2] :
                    new lively.Rectangle(spec[2][0], spec[2][1], spec[2][2], spec[2][3]),
                paneRect = extent.extentAsRectangle().scaleByRect(relativeRect),
                // fix for mixed class vs. function initialization bug
                pane = lively.Class.isClass(paneConstructor) ?
                    new paneConstructor() :
                    pane = paneConstructor(paneRect);
            pane.setBounds(paneRect);
            panel[paneName] = panel.addMorph(pane);
            panel.paneNames.push(paneName);
        });

        return panel;
    },
    createAndArrangePanesFrom: function(paneSpecs) {
        var self = this;
        this.paneNames = [];
        paneSpecs.each(function(spec) {
            var paneName = spec[0],
                paneConstructor = spec[1],
                relativeRect = spec[2] instanceof lively.Rectangle ?
                    spec[2] :
                    new lively.Rectangle(spec[2][0], spec[2][1], spec[2][2], spec[2][3]),
                optionalExtraArg = spec[3];
            
            var paneRect = self.innerBounds().scaleByRect(relativeRect);
            // fix for mixed class vs. function initialization bug
            var pane = lively.Class.isClass(paneConstructor) ?
                    new paneConstructor() :
                    pane = paneConstructor.call(self, paneRect, optionalExtraArg);
            pane.setBounds(paneRect);
            self[paneName] = self.addMorph(pane);
            pane.setName(paneName);
            self.paneNames.push(paneName);
        });
    }


},
'removing', {
    removeAllMorphs: function($super) {
        $super();
        var self = this;
        if(this.paneNames) 
            this.paneNames.each(function(e){delete self[e]})
    }
});

Object.extend(lively.morphic.Panel, {
    makePanedPanel: function(extent, paneSpecs, optPanel) {
        // Generalized constructor for paned window panels
        // paneSpec is an array of arrays of the form...
        //     ['leftPane', newTextListPane, new Rectangle(0, 0, 0.5, 0.6)],
        // See example calls in, eg, SimpleBrowser.buildView() for how to use this
        var panel = optPanel || new this(extent);
        //panel.linkToStyles(['panel']);
        panel.createAndArrangePanesFrom(paneSpecs);
        return panel;
    }

});

Object.extend(Global, {
    // deprecated interface!
    newTextPane:          lively.morphic.Panel.prototype.newTextPane,
    newDragnDropListPane: lively.morphic.Panel.prototype.newDragnDropListPane,
    show:                 lively.morphic.show,
    showMarkerFor:        lively.morphic.showMarkerFor,
    alertDbg:             lively.morphic.alertDbg,
    alert:                lively.morphic.alert,
    alertOK:              lively.morphic.alertOK,
    inspect:              lively.morphic.inspect,
    edit:                 lively.morphic.edit,
    log:                  lively.morphic.log
});

lively.morphic.Text.addMethods(
'deprecated interface', {
    innerMorph: function() { return this },
    showChangeClue: function() {},
    getVerticalScrollPosition: function() { return null },
    setVerticalScrollPosition: function() {}
})

lively.morphic.Button.addMethods(
'old interface', {
    setIsActive: function(bool) {},
    getIsActive: function() { return true }
});

lively.morphic.Morph.addMethods(
"CSSTransitions", {

    withCSSTransitionDo: function(morphModifyFunc, duration, whenDone) {
        return this.withCSSTransitionForAllMorphsDo(
            [this], morphModifyFunc, duration, whenDone);
    },
    withCSSTransitionForAllSubmorphsDo: function(morphModifyFunc, duration, whenDone) {
        var morphs = this.withAllSubmorphsDo(Functions.K);
        return this.withCSSTransitionForAllMorphsDo(
            morphs, morphModifyFunc, duration, whenDone);
    },

    withCSSTransitionForAllMorphsDo: function(morphs, morphModifyFunc, duration, whenDone) {
        // FIXME move HTML specific stuff to HTML.js!
        var self = this,
            prefix = lively.Config.get('html5CssPrefix'),
            durationProp = prefix === "-moz-" ?
                "MozTransitionDuration" : prefix + "transition-duration",
            transitionProp = prefix === "-moz-" ?
                "MozTransitionProperty" : prefix + "transition-property",
            endEvent = (function determineEventEndName() {
                switch (prefix) {
                    case '-webkit-': return "webkitTransitionEnd";
                    case '-o-'     : return "oTransitionEnd";
                    default        : return "transitionend";
                }
            })();
        var remover = (function(evt) {
            morphs.forEach(function(ea) { behaveNormal(ea); });
            self.renderContext().morphNode.removeEventListener(endEvent, remover, false);
            whenDone && whenDone.call(self);
        });

        self.renderContext().morphNode.addEventListener(endEvent, remover, false);

        (function run() {
            morphs.forEach(behaveAnimated);
            morphModifyFunc.call(self);
        }).delay(0);

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function behaveAnimated(morph) { 
            var morphNode = morph.renderContext().morphNode,
                shapeNode = morph.renderContext().shapeNode;
            morphNode.style[transitionProp] = "all";
            shapeNode.style[transitionProp] = "all";
            morphNode.style[durationProp] = duration + "ms";
            shapeNode.style[durationProp] = duration + "ms";
        }

        function behaveNormal(morph) { 
            var morphNode = morph.renderContext().morphNode,
                shapeNode = morph.renderContext().shapeNode;
            morphNode.style[transitionProp] = "";
            shapeNode.style[transitionProp] = "";
            morphNode.style[durationProp] = "";
            shapeNode.style[durationProp] = "";
        }

    },

    moveByAnimated: function(delta, time, callback) {
        if (delta.eqPt(pt(0,0))) callback && callback.call(this);
        else this.withCSSTransitionDo(this.moveBy.curry(delta), time, callback);
    },

    alignAnimated: function(posA, posB, time, callback) {
        if (posA.eqPt(posB)) callback && callback.call(this);
        else this.withCSSTransitionDo(this.align.bind(this, posA, posB), time, callback);
    },

    setPositionAnimated: function(position, time, callback) {
        if (this.getPosition().eqPt(position)) callback && callback.call(this);
        else this.withCSSTransitionDo(this.setPosition.curry(position), time, callback);
    },

    setOpacityAnimated: function(opacity, time, callback) {
        this.withCSSTransitionDo(this.setOpacity.curry(opacity), time, callback);
    },

    setScaleAnimated: function(scale, time, callback) {
        if (this.getScale() == scale) callback && callback.call(this);
        else this.withCSSTransitionDo(this.setScale.curry(scale), time, callback);
    },

    setExtentAnimated: function(extent, time, callback) {
        if (this.getExtent().eqPt(extent)) callback && callback.call(this);
        else this.withCSSTransitionDo(this.setExtent.curry(extent), time, callback);
    }
});

Trait('lively.morphic.FixedPositioning.WorldTrait', {
    restoreFixedMorphs: function() {
        this.submorphs
            .filter(function(m) { return m.hasFixedPosition(); })
            .forEach(function(m) { m.disableFixedPositioning(); m.enableFixedPositioning(); });
    },
    addMorphWithFixedPosition: function(morph) {
        // fixed positioning equivalent to addMorph.
        // currently we do not reference the fixed morphs...
        // should they got into submorphs? fixedSubmorphs?
        if (!this.isRendered()) {
            lively.bindings.connect(
                this, '_isRendered', this, 'addMorphWithFixedPosition', {
                    updater: function($upd) { $upd(morph); },
                    removeAfterUpdate: true, varMapping: {morph: morph}});
            return this;
        }

        var newOwner = this;
        if (morph.owner) morph.constructor.prototype.remove.call(morph); // FIXME
        morph.owner = newOwner;
        newOwner.submorphs.push(morph);
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
newOwner.cachedBounds = null;
var parentRenderCtxt = newOwner.renderContext(),
    subRenderCtxt = morph.renderContext(),
    ctx = parentRenderCtxt.constructor !== subRenderCtxt.constructor ?
        parentRenderCtxt.newForChild() : subRenderCtxt;
morph.renderAfterUsing(ctx);
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // place morphNode (node of fixed positining morph) outside of the
        // world's children nodes (as a child node of the worlds parentNode,
        // usually the document.body node)
        var parentNode = newOwner.renderContext().morphNode.parentNode,
            morphNode = morph.renderContext().morphNode;
        parentNode.appendChild(morphNode);
        morph.setFixedPosition(true);
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
morph.resumeSteppingAll();
var isInWorld = !!newOwner.world();
morph.withAllSubmorphsDo(function(ea) {
    if (isInWorld) ea.registerForEvents(Config.handleOnCapture);
    ea.onOwnerChanged(newOwner);
});

return morph;

    },
    getTransform: function () {
        // we need to overwrite getTransform bc the clip behavior (offsetting
        // the position by the amount the morph is scrolled does no work for
        // worlds)
        var scale = this.getScale(),
            pos = this.getPosition();
        if (Object.isNumber(scale)) {
            scale = pt(scale,scale);
        }
        // if (this.isClip()) {
        //     var scroll = this.getScroll();
        //     pos = pos.subXY(scroll[0], scroll[1]);
        // }
        return new lively.morphic.Similitude(pos, this.getRotation(), scale);
    }
})
.applyTo(lively.morphic.World, {override: ['getTransform']});

Trait('lively.morphic.FixedPositioning.MorphTrait', {
    addEventHandlerForFixedPositioning: function() {
        // FIXME! this method patches the eventhandler logic so that for each
        // event the fixed morph is interested in the event handler for the world
        // is run as well. So a mousedown event will invoke:
        // World>>onMouseDownEntry
        //   World>>onMouseDown
        // Morph>>onMouseDownEntry
        //   Morph>>onMouseDown
        // This is necessary bc when the morph is rendered in HTML it is placed
        // outside the child tree of the world's DOM node and will thus not be
        // part of the normal event dispatch
        this.removeEventHandler();
        this.addEventHandler();
        this.eventHandler.handleEvent = function (evt) {
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
                wasHandled = evt.world[eventSpec.targetMethodName] && evt.world[eventSpec.targetMethodName](evt);
                wasHandled = wasHandled || target[eventSpec.targetMethodName](evt);
            } catch(e) {
                this.handleError(e, target, eventSpec);
            }
            // when an event handler returns true it means that the event was
            // handled and no other morphs should deal with it anymore
            // note: this is not the same as evt.stop() !!!
            Global.LastEventWasHandled = Global.LastEventWasHandled || wasHandled;
            return true;
        }
        this.registerForEvents(true);
    },
    enableFixedPositioning: function() {
        /*already enabled*/
        return this;
    },
    disableFixedPositioning: function() {
        var owner = this.owner;
        this.constructor.prototype.remove.call(this);
        this.setFixedPosition(false);
        Trait('lively.morphic.FixedPositioning.MorphTrait').removeFrom(this);
        this.removeEventHandler(); // the fixed pos event handler must go
        owner && this.openInWorld();
        return this;
    },
    setFixedPosition: function(bool) {
        this.cachedBounds = null;
        // if (bool && this.owner && !this.owner.isWorld) {
        //     console.warn('Setting fixed positioning for morph %s but owner is not world!', this);
        // }
        return this.morphicSetter('FixedPosition', bool);
    },
    setFixedPositionHTML: function(ctx, bool) {
        if (ctx.morphNode)
            ctx.morphNode.style['position'] = bool ? 'fixed': 'absolute';
    },
    // we need to specially deal with transforming positions from the fixed
    // morph to the world and it's "normal" coordiante system / transforms bc
    // a) the fixed morph does not move relative to the screen. but this means
    //    that when scrolling the position of the morph changes relative to the
    //    world!
    // b) the fixed morph does not inherit the world transforms
    getFixedPositionTransform: function(withScroll) {
        var w = this.world();
        if (!w) return new lively.morphic.Similitude();
        var s = w.getScale(), 
            p = withScroll ? w.getScrollOffset():pt(0,0),
            r = w.getRotation();
        return new lively.morphic.Similitude(p, r, pt(1/s,1/s));
    },
    getPosition: function () {
        var pos = this._Position || pt(0,0);
        return this.getFixedPositionTransform(true).transformPoint(pos);
    },
    setPosition: function (pos) {
        pos = this.getFixedPositionTransform(true).inverse().transformPoint(pos);
        return this.constructor.prototype.setPosition.call(this, pos);
    },
    getExtent: function() {
        var ext = this.constructor.prototype.getExtent.call(this);
        return this.getFixedPositionTransform().transformPoint(ext);
    },
    innerBounds: function() {
        var bnds = this.constructor.prototype.innerBounds.call(this);
        return this.getFixedPositionTransform().transformRectToRect(bnds);
    },
    remove: function() {
        if (this.hasFixedPosition()) this.disableFixedPositioning();
        return this.constructor.prototype.remove.call(this);
    }
});

lively.morphic.Text.subclass("lively.morphic.StatusMessage",
"properties", {

  style: {
    fontFamily: 'Monaco,monospace',
    padding: lively.Rectangle.inset(4, 2, 8, 2),
    borderWidth: 0, borderRadius: 6,
    fontSize: 10,
    allowInput: false, selectable: true,
    clipMode: "auto", whiteSpaceHandling: 'pre'
  },

  isEpiMorph: true

},
"initializing", {

  initialize: function($super, bounds) {
    $super(bounds, "");
    this.createCloseButton();
    // should "internal" changes in the morph we are showing the message for
    // (like cursor changes in a text morph) make this message morph disappear?
    this.enableRemoveOnTargetMorphChange();
  },

  enableRemoveOnTargetMorphChange: function() {
    this.removeOnTargetMorphChange = true;
  },
  
  disableRemoveOnTargetMorphChange: function() {
    this.removeOnTargetMorphChange = false;
  },

  createCloseButton: function() {
      var closeBtn = new lively.morphic.Button(lively.rect(0,0,18,18), "X");
      closeBtn.name = "closeButton";
      lively.bindings.connect(closeBtn, 'fire', this, 'remove');
      this.addMorph(closeBtn);
      closeBtn.addScript(function onMouseMove(evt) { this.focus(); });
      closeBtn.addScript(function alignInOwner() {
        var offset = this.owner.showsVerticalScrollBar() ? this.owner.getScrollBarExtent().x + 3 : 2;
        this.align(this.bounds().topRight(), this.owner.innerBounds().topRight().addXY(-offset,2));
      });
      closeBtn.alignInOwner();
  }

},
"message interface", {

    setMessage: function(forMorph, msg, color) {
      // setting 'da message
      this.lastUpdated = Date.now();
      this.setVisible(false); // to avoid flickering
      $world.addMorph(this);

      var color = color || Global.Color.white,
          fill = (color === Global.Color.green
               || color === Global.Color.red
               || color === Global.Color.black) ?
            Global.Color.white :
            Global.Color.black.lighter();

      this.applyStyle({
        textColor: color,
        fill: fill,
        fixedHeight: false, fixedWidth: false,
        clipMode: 'visible'
      });

      if (!Array.isArray(msg)) {
        msg = [
          ['expand', {color: color, doit: {code: "evt.getTargetMorph().expand();"}}],
          ['\n'],
          [String(msg)]
        ]
      }

      this.setRichTextMarkup(msg);
    },

    ensureOpenFor: function(morph) {
      if (this.owner) return;
      this.openInWorld();
      this.alignAtBottomOf(morph);
    },

    expand: function(insertionMorph, textMode) {
      var ctx = lively.PropertyPath("textChunks.0.style.doit.context").get(this);
      var content = (ctx && ctx.content) || this.insertion || this.textString.replace(/^expand\n?/, "");
      delete this.insertion;

      if (insertionMorph && insertionMorph.isCodeEditor) {
        insertionMorph.withAceDo(function(ed) {
          if (!ed.selection.isEmpty()) ed.selection.clearSelection();
          ed.insert(content);
        });
      } else {
        $world.addCodeEditor({
          title: content.slice(0,60).replace(/\n/g, " "),
          extent: pt(600, 300),
          content: content,
          textMode: textMode ? textMode : "text",
          lineWrapping: true
        }).getWindow().comeForward();
      }
    }

},
"events", {

  onMouseMove: function(evt) {
    var closeBtn = this.get("closeButton");
    if (closeBtn.innerBoundsContainsWorldPoint(evt.getPosition())) {
      closeBtn.bringToFront();
      closeBtn.focus();
    }
  }

},
"layouting", {

  alignAtBottomOf: function(forMorph) {
    if (!this.owner) return;
    var world = this.world();
    if (!world) return;

    var ext = forMorph.getExtent(),
        maxX = ext.x,
        maxY = Math.max(40, Math.min(ext.y-100, 250));

    this.applyStyle({fixedHeight: false});
    // this.fit();
    this.setTextExtent(pt(maxX, 10));
    this.fitThenDo(function() {
      this.setVisible(true);
      this.bringToFront();
      this.setPosition(forMorph.owner.worldPoint(forMorph.bounds().bottomLeft()));
      var visibleBounds = world.visibleBounds(),
          bounds = this.bounds(),
          height = Math.min(bounds.height+3, maxY),
          overlapY = bounds.top() + height - visibleBounds.bottom();
      if (overlapY > 0) this.moveBy(pt(0, -overlapY));
      this.applyStyle({
        fixedHeight: true, fixedWidth: true,
        clipMode: {x: 'hidden', y: 'auto'}
      });
      this.setExtent(pt(maxX, height));
      var cb = this.get("closeButton");
      if (cb) cb.alignInOwner();
    });

  }
},
"removal", {

  onOwnerChanged: function($super, owner) {
    $super(owner);
  },

  maybeRemoveAfter: function(delay) {
    var self = this;
    if (self._removeTimer) clearTimeout(self._removeTimer);
    if (typeof delay === "number") {
      self._removeTimer = setTimeout(function() {
        self.owner && self.owner.removeStatusMessage();
      }, 1000*delay);
    }
  }

});

Trait('lively.morphic.SetStatusMessageTrait', {

  ensureStatusMessageMorph: function() {
    return this._statusMorph ?
      this._statusMorph :
      this._statusMorph = new lively.morphic.StatusMessage(
        this.getExtent().withY(80).extentAsRectangle());
  },

  removeStatusMessage: function() {
    if (this._statusMorph
     && this._statusMorph.isVisible()
     && this._statusMorph.owner)
       this._statusMorph.remove();
  },

  hideStatusMessage: function () {
    this.removeStatusMessage();
  },

  setStatusMessage: function(msg, color, delay) {
    var world = this.world();
    if (!world) return;
    var self = this,
        sm = this._statusMorph || this.ensureStatusMessageMorph();

    sm.setMessage(this, msg, color);
    sm.alignAtBottomOf(this);

    (function() {
      sm.maybeRemoveAfter(delay);

      // FIXME how to modularize this?
      if (self && self.isCodeEditor) {
        // either remove via timeout or when curs/selection changes occur. Note
        // that via onOwnerChanged the statusMorph also is removed when the
        // editors owner is null
        self.withAceDo(function(ed) {
          if (ed._livelyStatusMessageRemoverInstalled) return;
          ed._livelyStatusMessageRemoverInstalled = true;
          ed.on("changeSelection", function() {
            if (Date.now() - sm.lastUpdated < 50) return;
            if (!sm.removeOnTargetMorphChange) return;
            self.removeStatusMessage();
          });
        });
      }

    }).delay(0);
  },

  showError: function (e, offset) {
      this.setStatusMessage(String(e), Color.red);
      if (e.stack) this._statusMorph.insertion = e.stack;
  }

});

lively.morphic.Box.subclass("lively.morphic.BoundsMarker",
"initializing", {

  isEpiMorph: true,
  style: {zIndex: 1, borderWidth: 0, fill: null},

  initialize: function($super, optStyle) {
    // creates a marker that looks like:
    //
    // xxxx     xxxx
    // x           x
    // x           x
    // 
    // x           x
    // x           x
    // xxxx     xxxx
    $super(rect(0,0,10,10));
    this.ignoreEvents();
    this.markerStyle = lively.lang.obj.merge(
      {fill: null, borderWidth: 2, borderColor: Color.red},
      optStyle);
  },

  markerLength: function(forBounds) {
    forBounds = forBounds.insetBy(-2);
    var length = Math.min(forBounds.width, forBounds.height);
    return Math.max(4, Math.floor((length/10) < 10 ? (length / 2) - 5 : length / 10));
  },

  createMarkerEdge: function() {
      var b = new lively.morphic.Morph();
      b.isEpiMorph = true;
      b.ignoreEvents();
      b.applyStyle(this.markerStyle);
      return b;
  },

  ensureMarkerCorners: function() {
    var topLeftH     = this.topLeftH     || (this.topLeftH     = this.addMorph(this.createMarkerEdge())),
        topLeftV     = this.topLeftV     || (this.topLeftV     = this.addMorph(this.createMarkerEdge())),
        topRightH    = this.topRightH    || (this.topRightH    = this.addMorph(this.createMarkerEdge())),
        topRightV    = this.topRightV    || (this.topRightV    = this.addMorph(this.createMarkerEdge())),
        bottomRightH = this.bottomRightH || (this.bottomRightH = this.addMorph(this.createMarkerEdge())),
        bottomRightV = this.bottomRightV || (this.bottomRightV = this.addMorph(this.createMarkerEdge())),
        bottomLeftH  = this.bottomLeftH  || (this.bottomLeftH  = this.addMorph(this.createMarkerEdge())),
        bottomLeftV  = this.bottomLeftV  || (this.bottomLeftV  = this.addMorph(this.createMarkerEdge()));
    return [
      topLeftH, topLeftV,
      topRightH, topRightV,
      bottomRightH, bottomRightV,
      bottomLeftH, bottomLeftV];
  },
  
  alignWithMorph: function(otherMorph) {
    return this.alignWithRect(otherMorph.globalBounds());
  },

  alignWithRect: function(r) {
    var corners = this.ensureMarkerCorners(),
        markerLength = this.markerLength(r),
        boundsForMarkers = [
            r.topLeft().     addXY(0,0).               extent(pt(markerLength, 0)),
            r.topLeft().     addXY(0,2).               extent(pt(0, markerLength)),
            r.topRight().    addXY(-markerLength, 0).  extent(pt(markerLength, 0)),
            r.topRight().    addXY(-4,2).              extent(pt(0, markerLength)),
            r.bottomRight(). addXY(-4, -markerLength). extent(pt(0, markerLength)),
            r.bottomRight(). addXY(-markerLength, -2). extent(pt(markerLength, 0)),
            r.bottomLeft().  addXY(0,-2).              extent(pt(markerLength, 0)),
            r.bottomLeft().  addXY(0, -markerLength).  extent(pt(0, markerLength))];
    corners.forEach(function(corner, i) {
      corner.setBounds(boundsForMarkers[i]);
    });    
    return this;
  }

});

Object.extend(lively.morphic.BoundsMarker, {
  
  highlightMorph: function(morph) {
    return new lively.morphic.BoundsMarker()
      .openInWorld().alignWithMorph(morph);
  },

  highlightBounds: function(bounds) {
    return new lively.morphic.BoundsMarker()
      .openInWorld().alignWithRect(bounds);
  }

});

}) // end of module
