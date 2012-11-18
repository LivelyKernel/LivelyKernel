module('lively.morphic.MorphAddons').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.morphic.Widgets', 'lively.morphic.Styles').toRun(function() {

Object.extend(lively.morphic, {

    show: function(obj) {
        if (!obj) return null;
        if (Object.isArray(obj)) return obj.forEach(function(ea) { lively.morphic.show(ea) });
        else if (obj instanceof lively.Point) return lively.morphic.newShowPt(obj);
        else if (obj instanceof lively.Line) return lively.morphic.newShowLine(obj);
        else if (obj instanceof Rectangle) return lively.morphic.newShowRect(obj);
        else if (obj.isMorph) return lively.morphic.newShowMorph(obj);
        else if (obj instanceof HTMLElement) return lively.morphic.newShowElement(obj);
        return null;
    },

    newShowPt: function (/*pos or x,y, duration, extent*/) {
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

        lively.morphic.newShowThenHide(b, duration);
        return b;
    },

    newShowLine: function(line, duration) {
        return line.sample(5).map(function(p) {
            return this.newShowPt(p, duration, pt(3,3));
        }, this);
    },

    newShowRect: function (r, duration) {
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

        return lively.morphic.newShowThenHide(createMarkerForCorners(), duration);
    },

    newShowMorph: function (morph) {
        lively.morphic.newShowRect(
            morph.getGlobalTransform().transformRectToRect(morph.getShape().getBounds()))
    },

    newShowElement: function(el) {
        $(el).bounds({withMargin: true, withPadding: true}).show(2000);
    },

    newShowThenHide: function (morphOrMorphs, duration) {
        var w = Global.world || lively.morphic.World.current();
        if (!w) { alert("no world"); return }
        var morphs = Object.isArray(morphOrMorphs) ? morphOrMorphs : [morphOrMorphs];
        duration = duration || 3;
        morphs.invoke('openInWorld');
        if (duration) { // FIXME use scheduler
            (function() { morphs.invoke('remove') }).delay(duration);
        }
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
    }

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
    moveBy: function(point) { this.setPosition(this.getPosition().addPt(point)) },
    translateBy: function(p) {
        this.setPosition(this.getPosition().addPt(p));
        return this;
    },
    align: function (p1, p2) { return this.translateBy(p2.subPt(p1)) },
     centerAt: function (p) { return this.align(this.bounds().center(), p) },
    rotateBy: function(delta) { this.setRotation(this.getRotation() + delta);
        return this },
    scaleBy: function(factor) { this.setScale(this.getScale()*factor) },
    centerAt: function(p) {
        return this.align(this.bounds().center(), p);
    },
    resizeBy: function(point) {
        this.setExtent(this.getExtent().addPt(point));
    },
},
'morphic relationship', {
    addMorphBack: function(other) {
        var next = other === this.submorphs[0] ? this.submorphs[1] : this.submorphs[0];
        return this.addMorph(other, next);
    },
    addMorphFront: function(other) { return this.addMorph(other) },
    bringToFront: function() {
        // Hack: remove and re-add morph
        var owner = this.owner;
        if (!owner) {
            return;
        }
        this.remove();
        owner.addMorphFront(this);
    },

    sendToBack: function() {
        // Hack: remove and re-add morph
        var owner = this.owner;
        if (!owner) {
            return;
        }
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
            showUnnamed = options["showUnnamed"]

        if (this.name || showUnnamed) {
            var item = {name: this.name || "a " + Class.getConstructor(this).displayName, value: this},
                children = this.submorphs.invoke('treeItemsOfMorphNames', options).compact()
            if (children.length > 0) {
                item.children = children
            }
            Properties.own(properties).each(function (v) {
                item[v] = properties[v]
            })
            scripts.each(function (script) {
                Object.addScript(item, script)
            })
            return item
        } else {
            return null
        }
    },

    isSubmorphOf: function(otherMorph) {
        var self = this, found = false;
        otherMorph.withAllSubmorphsDo(function(morph) { found = found || morph === self });
        return found;
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
    bounds: function() { return this.getBounds() },
    innerBounds: function() { return this.getShape().getBounds() },
    getCenter:  function () { return this.bounds().center() }
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
        if (world.currentScene) world = world.currentScene;
        world.addMorph(this);
        pos && this.setPosition(pos);
        return this;
    },
    openInWindow: function(optPos) {
        lively.morphic.World.current().internalAddWindow(this,
            this.name, optPos || this.getPosition());
        this.applyStyle({resizeWidth: true, resizeHeight: true});
        if (this.partsBinMetaInfo) {
            this.owner.setPartsBinMetaInfo(this.getPartsBinMetaInfo());
            this.owner.setName(this.name);
            this.owner.setTitle(this.name);
        }
    },
    openInWorldCenter: function() {
        //parallel functionality as in openPartItem
        this.openInWorld();
        this.align(this.bounds().center(), $world.visibleBounds().center());
    },
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
    takesKeyboardFocus: function() {},
    isGrabbable: function(evt) {
        // return false to inhibit grabbing by the hand
        return this.grabbingEnabled || this.grabbingEnabled === undefined;
    }
},
'copying', {
    duplicate: function() { return this.copy() },
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
        if (this.owner && this.owner.layout && this.owner.layout.grid) {
            return this.owner.layout.grid;
        }
        return pt(10,10)
    }

},
'update & change', {
    layoutChanged: function() {},
    changed: function() {},
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
    },
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
    },
},
'fixing', {
    setFixed: function(optFixed) {
        // Fixes the morph at the current position and zoom when called with true or no parameter, and unfixes it when called with false.
        var fixed = optFixed || (optFixed === false? false : true);
        if(fixed && this.owner !== $world) {
            return;
        }
        this.isFixed = fixed;
        if(fixed) {
            this.fixedScale = this.getScale() * $world.getZoomLevel();
            this.fixedPosition = this.getPosition().subPt(pt(document.body.scrollLeft, document.body.scrollTop)).scaleBy($world.getZoomLevel());

            this.startStepping(100, "updateZoomScale");
            this.startStepping(100, "updateScrollPosition");
        } else {
            this.stopStepping("updateZoomLevel");
            this.stopStepping("getScrollOffset");
        }
    },
    updateZoomScale: function(newZoom) {
        if(this.fixedScale) {
			var newZoom = newZoom || $world.updateZoomLevel();
            this.setScale(this.fixedScale/newZoom);
        }
    },
    updateScrollPosition: function(newPosition) {
		var newPosition = newPosition || $world.getScrollOffset();
        this.setPosition(this.fixedPosition.scaleBy(1/$world.zoomLevel).addPt(newPosition));
    },
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
        var windowExtent = world.windowBounds().extent(),
            ratioY =  (windowExtent.y / this.getExtent().y) * world.getScale(),
            ratioX =  (windowExtent.x / this.getExtent().x) * world.getScale(),
            ratio = Math.min(ratioX, ratioY);
        if (ratio > 0 && ratio < 100) {
            world.setScale(ratio);
            if (beTopLeft) {
                this.setPosition(pt(0,0))
                world.setExtent(this.getExtent());
            } else {
                this.align(this.worldPoint(
                    this.shape.bounds().topCenter()), pt(windowExtent.x/2, 0));
                world.setExtent(windowExtent);
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
    isInFullScreen: function() { return this._isInFullScreen },

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
            if (aBooleanFunction(ea)) {
                res.push(ea);
            }
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
        morph.setBorderWidth(lineWidth);
        morph.setBorderColor(lineColor);
        morph.setFill(fill || Color.blue);
        return morph;
    },
    makeLine: function (verts, lineWidth, lineColor) {
        if (verts.length < 2) return;
        var morph = new lively.morphic.Path(verts);
        morph.applyStyle({fill: null, borderWidth: lineWidth || 1, borderColor: lineColor || Color.black});
        return morph;

// =========================================================================

        if (verts.length < 2) return null;
        if (verts.length > 2) {
            // Polylines become a mere blob for now...
            var morph = this.makeRectangle(Rectangle.unionPts(verts));
            morph.setBorderWidth(lineWidth);
            morph.setBorderColor(lineColor);
            morph.setFill(null);
            return morph;
        }
        // Okay, it's a simple line...
        var p1 = verts[0]; var p2 = verts[1];
        var v = p2.subPt(p1);

        // First make a horizontal line of the same length with origin at (0, 0)
        var morph = this.makeRectangle(Rectangle.unionPts([pt(0, -lineWidth/2), lively.Point.polar(v.r(), 0).addXY(0, lineWidth/2)]));

        // *** Not right, but we want to make position and center of rot = (0, 0):
        // morph._Position = pt(0, 0);

        morph.setBorderWidth(0);
        morph.setFill(lineColor);

        // Then move and rotate, with first vertex being the rotation center
        morph.moveBy(p1);
        morph.adjustOrigin(pt(0, lineWidth/2));
        morph.isLine = true;
        return morph.rotateBy(v.theta());
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



})
lively.Line.addMethods(
'conversion', {
    asMorph: function() {
        return lively.morphic.Morph.makeLine([this.start, this.end], 1);
    }
});

lively.morphic.Text.addMethods(
'shape appearance', {
    fitWidth: function() {},
},
'focus', {
    requestKeyboardFocus: function(hand) { this.focus() },
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
        var msgMorph = new lively.morphic.Text(new Rectangle(0,0, 600, 20), msg);
        msgMorph.applyStyle({
            borderWidth: 1,     fixedWidth: true,   fixedHeight: false,
            borderColor: color, borderRadius: 10,   fill: Color.lightGray,
            textColor: color,   allowInput: false,  padding: Rectangle.inset(10,5,80,10)});

        var closeBtn = new lively.morphic.Button(new Rectangle(0,0,20,20), 'X')
        msgMorph.addMorph(closeBtn);
        closeBtn.align(closeBtn.bounds().topRight(),
            msgMorph.innerBounds().topRight().addPt(pt(-5,5)));
        connect(closeBtn, 'fire', msgMorph, 'remove')

        if (callback) {
            var btn = new lively.morphic.Button(new Rectangle(0,0,50,20), 'more')
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
        msgMorph.ignoreEvents();
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
        morph.isEpiMorph = true;
        this.addMorph(morph);
        morph.addScript(function onMouseUp(evt) {
            this.stayOpen = true;
            return $super(evt);
        })
        morph.addScript(function remove() {
            var world = this.world();
            if (world && world.statusMessages) {
                world.statusMessages.remove(this);
            }
            return $super();
        })
        morph.align(morph.bounds().topRight(), this.visibleBounds().topRight());
        this.statusMessages.invoke('moveBy', pt(0, morph.getExtent().y));
        this.statusMessages.push(morph);

        if (delay) {
            (function removeMsgMorph() {
                if (!morph.stayOpen) morph.remove()
            }).delay(delay);
        }

        return morph;
    },
    addStatusProgress: function(label) {
        return this.addStatusMessageMorph(this.addProgressBar(null, label));
    },
},
'auth', {
    getUserName: function() {
        var userName = lively.LocalStorage.get('UserName')
        if (userName && userName !== 'undefined') return userName;
        var userName = this.requestUserName();
        if (userName && userName !== 'undefined') {
            lively.LocalStorage.set('UserName', userName);
            return userName;
        }
        return null;
    },
    getUserDir: function() {
        var username = this.getUserName();
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
        var userDir = this.getUserDir();
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
        if(!this.zoomLevel){
            this.zoomLevel = this.calculateCurrentZoom();
        }
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
    },
    getScrollOffset: function () {
        this.scrollOffset = pt(window.pageXOffset, window.pageYOffset)
        return this.scrollOffset;
    },
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
});

Object.extend(lively.morphic.Panel, {
    makePanedPanel: function(extent, paneSpecs, optPanel) {
        // Generalized constructor for paned window panels
        // paneSpec is an array of arrays of the form...
        //     ['leftPane', newTextListPane, new Rectangle(0, 0, 0.5, 0.6)],
        // See example calls in, eg, SimpleBrowser.buildView() for how to use this
        var panel = optPanel || new this(extent);
        //panel.linkToStyles(['panel']);

        paneSpecs.forEach(function(spec) {
            var paneName = spec[0],
                paneConstructor = spec[1],
                relativeRect = spec[2] instanceof lively.Rectangle ?
                    spec[2] :
                    new lively.Rectangle(spec[2][0], spec[2][1], spec[2][2], spec[2][3]),
                paneRect = extent.extentAsRectangle().scaleByRect(relativeRect),
                // fix for mixed class vs. function initialization bug
                pane = Class.isClass(paneConstructor) ?
                    new paneConstructor() :
                    pane = paneConstructor(paneRect);
            pane.setBounds(paneRect);
            panel[paneName] = panel.addMorph(pane)
        });

        return panel;
    }
});

lively.morphic.Text.addMethods(
'deprecated interface', {
    innerMorph: function() { return this },
    showChangeClue: function() {},
    getVerticalScrollPosition: function() { return null },
    setVerticalScrollPosition: function() {},
})

lively.morphic.Button.addMethods(
'old interface', {
    setIsActive: function(bool) {},
    getIsActive: function() { return true },
});

lively.morphic.List.addMethods(
'deprecated interface', {
    innerMorph: function() { return this },
    addMenuButton: function() { return this },
},
'filter interface', {
    clearFilter: function() {},
});


}) // end of module
