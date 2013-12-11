module('lively.morphic.MorphAddons').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.morphic.Widgets', 'lively.morphic.Styles').toRun(function() {

/*
 * Extends the default morphic interface with convenience methods, methods that
 * we are currently experimenting with, or methods that exist for compatibility
 * to older morphs
 */

Object.extend(lively.morphic, {

    show: function(obj) {
        function newShowPt(/*pos or x,y, duration, extent*/) {
            var args = $A(arguments);
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
            // creates a marker that looks like:
            //
            // xxxx     xxxx
            // x           x
            // x           x

            // x           x
            // x           x
            // xxxx     xxxx
            function createMarkerMorph(bounds) {
                var b = new lively.morphic.Morph();
                b.isEpiMorph = true;
                b.setBounds(bounds);
                b.applyStyle({fill: null, borderWidth: 2, borderColor: Color.red})
                b.ignoreEvents();
                return b;
            }
            function createMarkerForCorners() {
                r = r.insetBy(-2);
                var length = Math.min(r.width, r.height),
                    markerLength = Math.max(4, Math.floor((length/10) < 10 ? (length / 2) - 5 : length / 10)),
                    boundsForMarkers = [
                        r.topLeft().     addXY(0,0).               extent(pt(markerLength, 0)),
                        r.topLeft().     addXY(0,2).               extent(pt(0, markerLength)),
                        r.topRight().    addXY(-markerLength, 0).  extent(pt(markerLength, 0)),
                        r.topRight().    addXY(-4,2).              extent(pt(0, markerLength)),
                        r.bottomRight(). addXY(-4, -markerLength). extent(pt(0, markerLength)),
                        r.bottomRight(). addXY(-markerLength, -2). extent(pt(markerLength, 0)),
                        r.bottomLeft().  addXY(0,-2).              extent(pt(markerLength, 0)),
                        r.bottomLeft().  addXY(0, -markerLength).  extent(pt(0, markerLength))],
                    markers = boundsForMarkers.collect(function(bounds) {
                        return createMarkerMorph(bounds);
                    });
                return markers;
            }
            return newShowThenHide(createMarkerForCorners(), duration);
        }

        function newShowMorph (morph) {
            newShowRect(morph.getGlobalTransform().transformRectToRect(morph.innerBounds()))
        }

        function newShowElement(el) {
            lively.$(el).bounds({withMargin: true, withPadding: true}).show(2000);
        }

        function newShowThenHide (morphOrMorphs, duration) {
            var w = Global.world || lively.morphic.World.current();
            if (!w) { alert("no world"); return }
            var morphs = Object.isArray(morphOrMorphs) ? morphOrMorphs : [morphOrMorphs];
            duration = duration || 3;
            morphs.invoke('openInWorld');
            if (duration) { // FIXME use scheduler
                (function() { morphs.invoke('remove') }).delay(duration);
            }
        }

        if (!obj && !Object.isString(obj)) { lively.morphic.show(String(obj)); }
        else if (Object.isString(obj)) { var msg = Strings.format.apply(Strings, arguments); lively.morphic.alert(msg); }
        else if (Object.isArray(obj)) obj.forEach(function(ea) { lively.morphic.show(ea) });
        else if (obj instanceof lively.Point) newShowPt(obj);
        else if (obj instanceof lively.Line) newShowLine(obj);
        else if (obj instanceof lively.Rectangle) newShowRect(obj);
        else if (obj.isMorph) newShowMorph(obj);
        else if (obj instanceof Global.HTMLElement) newShowElement(obj);
        else if (obj instanceof Global.Element && obj.getBoundingClientRect) { var b = obj.getBoundingClientRect(); newShowRect(lively.rect(b.left,b.top,b.width,b.height)); }
        else { var msg = Strings.format("%o", obj); lively.morphic.alert(msg); }
        return obj;
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

    log: function(/*msg, args*/) {
        var args = Array.from(arguments),
            msg = Strings.format.apply(Strings, args);
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

    edit: function(obj) {
        if (Global.lively && lively.morphic && lively.morphic.World.current())
            return lively.morphic.World.current().openObjectEditorFor(obj);
    },

    showCallStack: function() {
        var stack = 'no stack';
        try { throw new Error() } catch(e) { if (e.stack) stack = e.stack }
        lively.morphic.alert(stack);
    },

    newMorph: function(options) {
        // for interactive usage
        options = options || {};
        var klass = options.klass || lively.morphic.Box,
            pos = options.position || pt(0,0),
            extent = options.extent || pt(100,100),
            bounds = options.bounds || pos.extent(extent),
            style = options.style || {fill: Color.gray},
            args = options.args || [bounds],
            morph = new klass(args[0], args[1], args[2], args[3], args[4], args[5]);
        return morph.applyStyle(style);
    }

});

Object.extend(lively, {
    show:     lively.morphic.show,
    log:      lively.morphic.log,
    newMorph: lively.morphic.newMorph
});

Object.extend(Global, {
    show:     lively.morphic.show,
    alertDbg: lively.morphic.alertDbg,
    alert:    lively.morphic.alert,
    alertOK:  lively.morphic.alertOK,
    inspect:  lively.morphic.inspect,
    edit:     lively.morphic.edit,
    log:      lively.morphic.log
});

lively.morphic.Morph.addMethods(
'geometry', {
    moveBy: function(point) { this.setPosition(this.getPosition().addPt(point)); },
    translateBy: function(p) { this.setPosition(this.getPosition().addPt(p)); return this; },
    align: function (p1, p2) { return this.translateBy(p2.subPt(p1)); },
    centerAt: function (p) { return this.align(this.bounds().center(), p); },
    rotateBy: function(delta) { this.setRotation(this.getRotation() + delta); return this; },
    scaleBy: function(factor) { this.setScale(this.getScale()*factor); },
    centerAt: function(p) { return this.align(this.bounds().center(), p); },
    resizeBy: function(point) { this.setExtent(this.getExtent().addPt(point)); }
},
'morphic relationship', {
    addMorphBack: function(other) {
        var next = other === this.submorphs[0] ? this.submorphs[1] : this.submorphs[0];
        return this.addMorph(other, next);
    },
    addMorphFront: function(other) { return this.addMorph(other); },
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
        Properties.own(properties).each(function (v) { item[v] = properties[v]; });
        scripts.each(function (script) { Object.addScript(item, script); });
        return item;
    },

    isSubmorphOf: function(otherMorph) {
        return otherMorph.withAllSubmorphsDetect(function(morph) {
            return morph === this }, this);
    },

    topSubmorph: function() {
        // the morph on top is the last one in the list
        return this.submorphs.last();
    },
    ownerChain: function() {
        var owners = [], morph = this;
        while (morph.owner) {
            owners.push(morph.owner)
            morph = morph.owner;
        }
        return owners;
    },
},
'convenience accessing', {
    bounds: function() { return this.getBounds(); },
    innerBounds: function() { return this.getShape().getBounds(); },
    getCenter:  function () { return this.bounds().center(); }
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
    openInWorld: function(pos, name) {
        var world = lively.morphic.World.current();
        if (!world) {
            lively.whenLoaded(this.openInWorld.bind(this,pos,name));
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
    },
    openInWorldCenter: function() {
        // redundant functionality as in openPartItem
        this.openInWorld();
        this.align(this.bounds().center(), lively.morphic.World.current().visibleBounds().center());
        return this;
    }
},
'removing', {
    removeAllMorphs: function() {
        this.submorphs.clone().invoke('remove')
    },

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
'copying', {
    duplicate: function() { return this.copy() }
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
            this.owner.layout.grid : pt(10,10);
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
    hasFixedPosition: function(bool) {
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
})

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
'debugging', {
    logError: function (er, optName) {
        Global.LastError = er;
        debugger;
        if (!Config.get('verboseLogging')) return;
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
        var msgMorph = this.createStatusMessage(msg, {fill: color});

        // callbacks are currently not supported...
        if (false && callback) {
            var btn = new lively.morphic.Button(lively.rect(0,0,50,20), 'more')
            btn.callbackFunc = callback;
            msgMorph.addMorph(btn);
            btn.align(btn.bounds().topRight(), closeBtn.bounds().topLeft().addPt(pt(-5,0)));
            connect(btn, 'fire', btn, 'callbackFunc')
        }
        if (color == Color.red) {
            console.error(msg);
        } else {
            console.log(msg);
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
        var msgMorph = lively.newMorph({extent: options.extent || pt(200, 68)});
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
        textMsg.beLabel({
            fixedWidth: true, fixedHeight: true,
            resizeWidth: true, resizeHeight: true,
            allowInput: false,
            clipMode: 'visible', whiteSpaceHandling: 'pre'
        });

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
            text.applyStyle({allowInput: true, fixedWidth: false });
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
'auth', {
    getUserName: function(noninteractive) {
        var userName = lively.Config.get('UserName')
        if (userName && userName !== 'undefined') return userName;
        if (!noninteractive) userName = this.requestUserName();
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

    requestUserName: function() {
        if (!Config.userNameURL) return null;
        var webR = new WebResource(Config.userNameURL).get();
        return webR.status.isSuccess() ? webR.content.replace(/\n|\"/g, '') : null;
    },
    askToRegisterAnAccount: function() {
        var msg = 'Cannot retrieve your user name. Register an account now?';
        $world.confirm(msg, function(response) {
            if (response) {
                window.open('http://lively-kernel.org/trac/register');
            }
        });
    },

    ensureUserDir: function(optUserName) {
        var username = optUserName || this.getUserName();
        if (!username) {
            this.askToRegisterAnAccount();
            return null;
        }
        var userDir = this.getUserDir(optUserName);
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
        var url = this.ensureUserConfig()
        require('lively.ide').toRun(function() {
            lively.ide.browse(url);
        });
    },
    isGrabbable: function(evt) {
        return false;
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

lively.morphic.HandMorph.addMethods(
'focus', {
    setKeyboardFocus: function() {},
});

// really necessary to have this class?
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
        if(localStorage.getItem("LivelyChangesets:" + location.pathname))
            codePane.doBrowseImplementors = function () {
                openFunctionList('implementors', this.getSelectionOrLineString())};
        if(localStorage.getItem("LivelyChangesets:" + location.pathname))
            codePane.doBrowseReferences = function () {
                openFunctionList('references', this.getSelectionOrLineString(), true)};
        return codePane
    },
    newReadOnlyCodePane: function newReadOnlyCodePane(extent) {
        var codePane = this.newTextPane(extent);
        codePane.enableSyntaxHighlighting();
        codePane.evalEnabled = true;
        codePane.applyStyle({scaleProportional: true, allowInput: false});
        if(localStorage.getItem("LivelyChangesets:" + location.pathname))
            codePane.doBrowseImplementors = function () {
                openFunctionList('implementors', this.getSelectionOrLineString())};
        if(localStorage.getItem("LivelyChangesets:" + location.pathname))
            codePane.doBrowseReferences = function () {
                openFunctionList('references', this.getSelectionOrLineString(), true)};
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
    newTextPane: lively.morphic.Panel.prototype.newTextPane,
    newDragnDropListPane: lively.morphic.Panel.prototype.newDragnDropListPane
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
            morphNode.style[durationProp] = "";
            shapeNode.style[transitionProp] = "";
            shapeNode.style[durationProp] = "";
        }
        var remover = (function(evt) {
            morphs.forEach(function(ea) { behaveNormal(ea); });
            self.renderContext().morphNode.removeEventListener(endEvent, remover, false);
            whenDone && whenDone.call(self);
        });
        self.renderContext().morphNode.addEventListener(endEvent, remover, false);
        (function run() {
            morphs.forEach(function(ea) { behaveAnimated(ea); });
            morphModifyFunc.call(self);
        }).delay(0);
    },


    moveByAnimated: function(delta, time, callback) {
        this.withCSSTransitionDo(this.moveBy.curry(delta), time, callback);
    },

    setPositionAnimated: function(position, time, callback) {
        this.withCSSTransitionDo(this.setPosition.curry(position), time, callback);
    },

    setOpacityAnimated: function(opacity, time, callback) {
        this.withCSSTransitionDo(this.setOpacity.curry(opacity), time, callback);
    },

    setScaleAnimated: function(scale, time, callback) {
        this.withCSSTransitionDo(this.setScale.curry(scale), time, callback);
    },

    setExtentAnimated: function(extent, time, callback) {
        this.withCSSTransitionDo(this.setExtent.curry(extent), time, callback);
    }
});

lively.morphic.Morph.addMethods({
    openInFlap: function(alignment) {
        var owner = this.owner || lively.morphic.World.current();
        return owner.addFlapWithMorph(this, alignment);
    },
    addFlapWithMorph: function(morph, alignment) {
        if (!morph.owner)
            this.addMorph(morph)
        var offset = 5,
            flapBounds = this.determineFlapBounds(alignment, morph, offset),
            scaleFactor = this.isWorld? this.getZoomLevel() : 1,
            flap = new lively.morphic.Flap(alignment, this, flapBounds);
        flap.addMorph(morph);
        flap.setFixed(false);
        flap.setScale(1/scaleFactor);
        flap.setFixed(true);
        this.adjustHandlePosition(flap);
        morph.setScale(scaleFactor);
        morph.setPosition(morph.determinePositionInFlap(alignment, flapBounds.extent(), scaleFactor, offset));
        return flap;
    },
    determineFlapBounds: function(alignment, morph, offset) {
        var flapExtent = this.determineFlapExtent(alignment, morph, offset),
            flapPosition = this.determineFlapPosition(alignment, morph, flapExtent, offset);
        return flapPosition.extent(flapExtent);
    },
    determineFlapExtent: function(alignment, morph, offset) {
        var myBounds = morph.getBounds(),
            ownerBounds = this.isWorld? this.visibleBounds() : this.getBounds(),
            extent;
        switch (alignment) {
            case 'top': {
                extent = pt(myBounds.width, myBounds.bottomRight().y - ownerBounds.topLeft().y);
                break;
            }
            case 'left': {
                extent = pt(myBounds.bottomRight().x - ownerBounds.topLeft().x, myBounds.height);
                break
            }
            case 'bottom': {
                extent = pt(myBounds.width, ownerBounds.bottomRight().y - myBounds.topLeft().y);
                break;
            }
            case 'right': {
                extent = pt(ownerBounds.bottomRight().x - myBounds.topLeft().x, myBounds.height);
                break;
            }
        }
        return extent.addPt(pt(2*offset, 2*offset));
    },
    determineFlapPosition: function(alignment, morph, flapExtent, offset) {
        var myBounds = morph.getBounds(),
            myPosition = morph.getPosition(),
            ownerBounds = this.isWorld? this.visibleBounds() : this.getBounds(),
            ownerPosition = ownerBounds.topLeft(),
            ownerExtent = ownerBounds.extent();
        switch (alignment) {
            case 'top': return pt(myPosition.x - ownerPosition.x - offset, 0);
            case 'left': return pt(0,myPosition.y - ownerPosition.y - offset);
            case 'bottom': return pt(myPosition.x - offset, ownerBounds.bottomRight().y - flapExtent.y).subPt(ownerPosition);
            case 'right': return pt(ownerBounds.bottomRight().x - flapExtent.x + offset, myPosition.y).subPt(ownerPosition);
            default: return pt(0,0);
        }
    },

    determinePositionInFlap: function(alignment, flapExtent, scaleFactor, offset) {
        var myExtent = this.getExtent();
        switch (alignment) {
            case 'top': return pt(offset, (flapExtent.y - myExtent.y) * scaleFactor - offset);
            case 'left': return pt((flapExtent.x - myExtent.x) * scaleFactor - offset, offset);
            case 'bottom': case 'right': return pt(offset,offset);
            default: return pt(0,0);
        }
    },

    adjustHandlePosition: function(flap) {
        switch(flap.alignment) {
            case 'top': {
                flap.flapHandle.setPosition(pt(5,flap.getExtent().y));
                break
            }
            case 'right': {
                flap.flapHandle.setPosition(pt(flap.flapHandle.getPosition().x, 5));
                break
            }
            case 'left': {
                flap.flapHandle.setPosition(pt(flap.flapHandle.getPosition().x, 5));
                break
            }
            case 'bottom': {
                flap.flapHandle.setPosition(pt(5,flap.flapHandle.getPosition().y));
                break
            }
        }
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

}) // end of module
