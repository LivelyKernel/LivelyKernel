module('lively.morphic.Core').requires('lively.morphic.Shapes', 'lively.Traits').toRun(function() {

Object.subclass('lively.morphic.Morph',
'properties', {
    style: {
        enableDropping: true,
        enableHalos: true,
        borderWidth: 0,
        borderColor: null,
        fill: null
    },
    isMorph: true
},
'initializing', {
    idCounter: 0,

    initialize: function(shape) {
        this.submorphs = [];
        this.scripts = [];
        this.shape = shape || this.defaultShape();
        this.prepareForNewRenderContext(this.defaultRenderContext());
        this.setNewId();
        this.applyStyle(this.getStyle());
    },

    setNewId: function(optId) {
        if (this.derivationIds === undefined) this.derivationIds = [];
        if (this.id) this.derivationIds.push(this.id);
        return this.id = optId || Strings.newUUID();
    },

    defaultShape: function(optBounds) {
        return new lively.morphic.Shapes.Rectangle(optBounds || new lively.Rectangle(0,0,0,0));
    },

    defaultRenderContext: function() { return new lively.morphic.HTML.RenderContext() }

},
'accessing -- shapes', {
    makeStyleSpec: function() {
        // FIXME implement
        return {}
    },
    shapeContainsPoint: function(pt) {
        // Need to check for non-rectangular shapes
        return this.shape.reallyContainsPoint(pt)
    }

},
'accessing -- morph properties', {
    setPosition: function(pt) {
        this.cachedBounds = null;
        return this.morphicSetter('Position', pt);
    },
    getPosition: function () {
        var pos = this.morphicGetter('Position') || pt(0,0);
        if (!this.hasFixedPosition()) return pos;
        var world = this.world();
        return world ? world.getScrollOffset().addPt(pos) : pos;
    },
    setRotation: function(value) {
        this.cachedBounds = null;
        return this.morphicSetter('Rotation', value);
    },
    getRotation: function() { return this.morphicGetter('Rotation') || 0 },
    setScale: function(value) {
        this.cachedBounds = null;
        return this.morphicSetter('Scale', value);
    },
    getScale: function() { return this.morphicGetter('Scale') || 1 },
    setBounds: function(bounds) {
        this.setPosition(bounds.topLeft().addPt(this.getOrigin()));
        this.setExtent(bounds.extent());
        return bounds;
    },
    getBounds: function() {
        if (this.cachedBounds && !this.hasFixedPosition()) return this.cachedBounds;

        var tfm = this.getTransform(),
            bounds = this.innerBounds();

        bounds = tfm.transformRectToRect(bounds);

        if (!this.isClip()) {
            var subBounds = this.submorphBounds(tfm);
            if (subBounds) bounds = bounds.union(subBounds);
        } else {
          var scroll = this.getScroll();
          bounds = bounds.translatedBy(pt(scroll[0], scroll[1]));
        }

        return this.cachedBounds = bounds;
    },
    globalBounds: function() {
        return this.owner ?
            this.owner.getGlobalTransform().transformRectToRect(this.bounds()) : this.bounds();
    },

    innerBounds: function() { return this.shape.getBounds() },
    setVisible: function(bool) { return this.morphicSetter('Visible', bool)  },
    isVisible: function() {
        var v = this.morphicGetter('Visible')
        return v === undefined ? true : v;
    },
    setZIndex: function(index) {
        return this.morphicSetter('ZIndex', index);
    },
    getZIndex: function() {
        return this.morphicGetter('ZIndex') || null;
    },
    setOrigin: function(value) {
        // deprecated
        this.adjustOrigin(value);
    },
    adjustOrigin: function(newOrigin, moveSubmorphs) {
        // changes the origin / pivot of the morph by offsetting the shape
        // without changing the morph's or submorphs' position on the screen
        if (this.getOrigin().eqPt(newOrigin)) return;
        var oldOrigin            = this.getOrigin(),
            delta                = newOrigin.subPt(oldOrigin),
            transform            = this.getTransform(),
            oldTransformedOrigin = transform.transformPoint(oldOrigin),
            newTransformedOrigin = transform.transformPoint(newOrigin),
            transformedDelta     = newTransformedOrigin.subPt(oldTransformedOrigin);

        // only offset position of this morph to avoid a "jumping around"
        // behavior when setting the origin
        if (this.owner) this.moveBy(transformedDelta);

        this.shape.setPosition(newOrigin.negated());
        if (moveSubmorphs) return;
        this.submorphs.forEach(function (ea) {
          var oldO = ea.getTransform().transformPoint(oldOrigin),
              newO = ea.getTransform().transformPoint(newOrigin),
              delta = newO.subPt(oldO);
          ea.moveBy(delta.negated());
        });
    },
    getOrigin: function() { return this.shape.getPosition().negated() },
    setPivotPoint: function(value) {
        // experimental
        return this.morphicSetter('PivotPoint', value);
    },
    getPivotPoint: function() {
        return this.morphicGetter('PivotPoint') || pt(0,0);
    },
    setClipMode: function(modeString) {
        return this.morphicSetter('ClipMode', modeString);
    },
    getClipMode: function() { return this.morphicGetter('ClipMode') || 'visible' },
    beClip: function(bool) {
        // this.isClip = bool;
        this.setClipMode(bool ? 'scroll' : 'visible');
    },
    isClip: function() {
        var clipMode = this.getClipMode();
        return clipMode !== 'visible';
    },

    setHandStyle: function(styleName) {
        // CSS cursor style. Value can be:
        // auto, default, crosshair, pointer, move, ne-resize, e-resize, se-resize,
        // s-resize, sw-resize, w-resize, nw-resize, text, wait, help, progress
         return this.morphicSetter('HandStyle', styleName)
    },
	getHandStyle: function(styleName) { return this.morphicGetter('HandStyle') },
    setToolTip: function(string) { return this.morphicSetter('ToolTip', string) },
    getToolTip: function() { return this.morphicGetter('ToolTip') }
},
'accessing -- shape properties', {
    setExtent: function(newExtent) {
        this.cachedBounds = null;

        var min = this.getMinExtent();
        newExtent.maxPt(min,newExtent);
        this.priorExtent = this.getExtent();
        this.shape.setExtent(newExtent);
        var origin = this.getOrigin();
        if (!origin.eqPt(pt(0, 0))) {  // Adjust origin, especially for ellipses
            var scalePt = pt(newExtent.x/this.priorExtent.x, newExtent.y/this.priorExtent.y);
            this.adjustOrigin(origin.scaleByPt(scalePt), true);  // moveSubmorphs too
        }
        if (this.layout && (this.layout.adjustForNewBounds || this.layout.layouter))
            this.adjustForNewBounds();
        if (this.owner && (typeof this.owner.submorphResized == 'function')) {
            this.owner.submorphResized(this);
        }
        return newExtent;
    },
    getExtent: function() { return this.shape.getExtent() },
    setFill: function(value) { return this.shape.setFill(value) },
    getFill: function() { return this.shape.getFill() },
    setBorderColor: function(value) { return this.shape.setBorderColor(value) },
    getBorderColor: function() { return this.shape.getBorderColor() },
    setBorderWidth: function(value) { return this.shape.setBorderWidth(parseInt(value)) },
    getMinExtent:function () {
        return this.minExtent || pt(0,0);
    },
    setMinExtent: function(minExtent) {
        if (minExtent) {
            this.minExtent = minExtent;
        } else {
            delete this.minExtent;
        }
    },
    getBorderWidth: function() { return this.shape.getBorderWidth() },
    setStrokeWidth: function(newWidth) {
        // This protocol is used for rectangles masquerading as lines
        var oldWidth = this.getStrokeWidth();
        var newShapeBounds = this.shape.getBounds().insetByPt(pt(0, (oldWidth-newWidth)/2));
        this.shape.setBounds(newShapeBounds);
    },
    getStrokeWidth: function() {
        // This protocol is used for rectangles masquerading as lines
        return this.innerBounds().height;
    },
    setStrokeOpacity: function(value) { return this.shape.setStrokeOpacity(value) },
    getStrokeOpacity: function() { return this.shape.getStrokeOpacity() },
    setBorderRadius: function(value) { return this.shape.setBorderRadius(value) },
    getBorderRadius: function() { return this.shape.getBorderRadius() },
    setBorderStyle: function(style) { return this.shape.setBorderStyle(style) },
    getBorderStyle: function() { return this.shape.getBorderStyle() },


    setFillOpacity: function(value) { return this.shape.setFillOpacity(value) },

    getFillOpacity: function() { return this.shape.getFillOpacity() },

    getOpacity: function() { return this.shape.getOpacity() },
    setOpacity: function(o) { return this.shape.setOpacity(o) },

    setVertices: function(v) { this.shape.setVertices(v) }

},
'accessing -- morphic relationship', {

    world: function() {
        return this.owner ? this.owner.world() : null;
    },

    hand: function() {
        var world = this.world();
        return world && world.firstHand();
    },

    addMorph: function (morph, optMorphBefore) {
        var newOwner = this;
        if (morph.isAncestorOf(newOwner)) {
            alert('addMorph: Circular relationships between morphs not allowed\n'
                + 'tried to drop ' + morph + ' on ' + newOwner);
            return null;
        }

        var tfm = morph.owner
               && morph.owner !== newOwner
               && morph.transformForNewOwner(newOwner);

        if (morph.owner) { morph.remove(); }

        morph.owner = newOwner;

        var indexToInsert = optMorphBefore && newOwner.submorphs.indexOf(optMorphBefore);
        if (indexToInsert === undefined || indexToInsert < 0) {
            indexToInsert = newOwner.submorphs.length;
        }
        newOwner.submorphs.pushAt(morph, indexToInsert);

        // actually this should be done below so that geometry connects works
        // correctly but for the current Chrome stable (12.0.7) this leads to
        // a render bug (morph is offseted)
        if (tfm) { morph.setTransform(tfm); }

        newOwner.cachedBounds = null; // submorph might affect bounds

        var parentRenderCtxt = newOwner.renderContext(),
            subRenderCtxt = morph.renderContext(),
            ctx = parentRenderCtxt.constructor !== subRenderCtxt.constructor ?
                parentRenderCtxt.newForChild() : subRenderCtxt;
        morph.renderAfterUsing(ctx, optMorphBefore);

        morph.resumeSteppingAll();

        if (newOwner.getLayouter()) {
            newOwner.getLayouter().onSubmorphAdded(newOwner, morph, newOwner.submorphs);
        }

        // FIXME remove, this was added for Ted's HyperCard implementation,
        // it should not be part of the core system
        if (morph.owner.owner) { // Is owner owner a stack?
            if (morph.owner.owner.pageArray) {
                morph.pageSpecific = true; // dropped morph is only on this page
                    // call Stack.beInBackground to place in background
            }
        }

        var isInWorld = !!this.world();
        morph.withAllSubmorphsDo(function(ea) {
            if (isInWorld) ea.registerForEvents(Config.handleOnCapture);
            ea.onOwnerChanged(newOwner);
        });

        return morph;
    },

    withAllSubmorphsDo: function(func, context, depth) {
        if (!depth) depth = 0;
        var result = [func.call(context || Global, this, depth)];
        for (var i = 0; i < this.submorphs.length; i++) {
            result.pushAll(this.submorphs[i].withAllSubmorphsDo(func, context, depth + 1));
        }
        return result;
    },

    withAllSubmorphsSelect: function(func, context, depth) {
        if (!depth) depth = 0;
        var res = [];
        if (func.call(context || Global, this, depth)) { res.push(this); }
        for (var i = 0; i < this.submorphs.length; i++) {
            res.pushAll(this.submorphs[i].withAllSubmorphsSelect(func, context, depth + 1));
        }
        return res;
    },

    selectSubmorphs: function(spec) {
        // return all submorphs (recursively) that fulfill spec
        var props = Properties.own(spec);
        function matches(aMorph) {
            return props.all(function(prop) {
                return aMorph[prop] == spec[prop];
            });
        };
        return this.withAllSubmorphsSelect(matches);
    },

    withAllSubmorphsDetect: function(func, context, depth) {
        if (!depth) depth = 0;
        var res = [];
        if (func.call(context || Global, this, depth)) { return this; }
        for (var i = 0; i < this.submorphs.length; i++) {
            var found = this.submorphs[i].withAllSubmorphsDetect(func, context, depth + 1);
            if (found) return found;
        }
        return null;
    },

    getMorphById: function(id) {
        return $world.withAllSubmorphsDetect(function(morph) { return morph.id === id; });
    },

    submorphBounds: function(tfm) {
        tfm = tfm || this.getTransform();
        var subBounds;
        for (var i = 0; i < this.submorphs.length; i++) {
            var morphBounds = this.submorphs[i].getBounds();
            subBounds = subBounds ? subBounds.union(morphBounds) : morphBounds;
        }
        return subBounds ? tfm.transformRectToRect(subBounds) : null;
    },

    morphsContainingPoint: function(point, list) {
        // if morph1 visually before morph2 than list.indexOf(morph1) < list.indexOf(morph2)
        if (!list) list = [];
        if (!this.fullContainsWorldPoint(point)) return list;
        for (var i = this.submorphs.length -1 ; i >=0; i--) {
            this.submorphs[i].morphsContainingPoint(point, list);
        }
        if (this.innerBoundsContainsWorldPoint(point)) list.push(this);
        return list;
    },

    morphBeneath: function(pos) {
        var someOwner = this.world() || this.owner;
        if (!someOwner) return null;
        var morphs = someOwner.morphsContainingPoint(pos),
            myIdx = morphs.indexOf(this),
            morphBeneath = morphs[myIdx + 1];
        return morphBeneath
    },

    topMorph: function() {
        for (var i = this.submorphs.length-1; i >= 0; i--) {
            var morph = this.submorphs[i];
            if (!morph.isEpiMorph && !morph.isHand) return morph;
        }
        return null;
    },

    onOwnerChanged: function(newOwner) {
        // This method well get called when my direct or any of my indirect(!)
        // owners changes, i.e. I or any of my parents is added or removed to/
        // from another morph. On remove newOwner will be null.
    }

},
'accessing -- shapes', {
    getShape: function() { return this.shape },
    setShape: function(shape) {
        var ctx = this.renderContext();
        ctx.shapeRemoved();
        this.shape = shape;
        shape.renderUsing(ctx);
    },
},
'morph removal', {

    remove: function() {
        this.suspendSteppingAll();
        if (this.showsHalos) this.removeHalos();
        if (this.owner) {
            this.owner.removeMorph(this);
        }
        this.renderContextDispatch('remove');
        this.disableEventHandlerRecursively();
        this.withAllSubmorphsDo(function(ea) { ea.onOwnerChanged && ea.onOwnerChanged(null); });
    },

    removeMorph: function(morph) {
        // PRIVATE! do *not* call directly
        this.submorphs = this.submorphs.without(morph);
        morph.owner = null;
        this.cachedBounds = null;
        if (this.getLayouter()) {
            this.getLayouter().onSubmorphRemoved(this, morph, this.submorphs);
        }
        this.renderContextDispatch('removeMorph');
    }

},
'morph replacement', {

    replaceWith: function(otherMorph) {
        if (!this.owner) return;
        var pos = this.getPosition(),
            o = this.owner,
            idx = o.submorphs.indexOf(this),
            nextMorph = o.submorphs[idx+1];
        this.remove();
        otherMorph.setPosition(pos);
        o.addMorph(otherMorph, nextMorph);
        return otherMorph;
    },

    swapWith: function(morph2) {
      var morph1 = this;

      var owner1 = morph1.owner, idx1 = owner1.submorphs.indexOf(morph1),
          next1 = owner1.submorphs[idx1+1], pos1 = morph1.bounds().center();
      var owner2 = morph2.owner, idx2 = owner2.submorphs.indexOf(morph2),
          next2 = owner2.submorphs[idx2+1], pos2 = morph2.bounds().center();
      morph1.align(pos1, pos2);
      morph2.align(pos2, pos1);
      if (owner1 !== owner2) {
        morph1.remove(); morph2.remove()
        owner1 && owner1.addMorph(morph2, next1);
        owner2 && owner2.addMorph(morph1, next2); }
    }

},
'transformation', {
    localize: function(point) {
        // map world point to local coordinates
        var world = this.world();
        if (!world) return point;
        return point.matrixTransform(world.transformToMorph(this));
    },
    transformToMorph: function(other) {
        var tfm = this.getGlobalTransform(),
            inv = other.getGlobalTransform().inverse();
        tfm.preConcatenate(inv);
        return tfm;
    },
    transformForNewOwner: function(newOwner) {
        return new lively.morphic.Similitude(this.transformToMorph(newOwner));
    },
    localizePointFrom: function(pt, otherMorph) {
        // map local point to owner coordinates
        try {
            return pt.matrixTransform(otherMorph.transformToMorph(this));
        } catch (er) {
            console.warn("problem " + er + " in localizePointFrom");
            return pt;
        }
    },
    getGlobalTransform: function() {
        var globalTransform = new lively.morphic.Similitude(),
            world = this.world();
        for (var morph = this; (morph != world) && (morph != undefined); morph = morph.owner)
            globalTransform.preConcatenate(morph.getTransform());
        return globalTransform;
    },
    worldPoint: function(pt) {
        return pt.matrixTransform(this.transformToMorph(this.world()));
    },
    getTransform: function () {
        var scale = this.getScale(),
            pos = this.getPosition();
        if (Object.isNumber(scale)) {
            scale = pt(scale,scale);
        }
        if (this.isClip()) {
            var scroll = this.getScroll();
            pos = pos.subXY(scroll[0], scroll[1]);
        }
        return new lively.morphic.Similitude(pos, this.getRotation(), scale);
    },
    setTransform: function(tfm) {
        this.setPosition(tfm.getTranslation());
        this.setRotation(tfm.getRotation().toRadians());
        this.setScale(tfm.getScalePoint().x);
    },

    fullContainsWorldPoint: function(p) { // p is in world coordinates
        return this.fullContainsPoint(this.owner == null ? p : this.owner.localize(p));
    },
    fullContainsPoint: function(p) { // p is in owner coordinates
        return this.getBounds().containsPoint(p);
    },
    innerBoundsContainsWorldPoint: function(p) { // p is in world coordinates
        return this.innerBoundsContainsPoint(this.owner == null ? p : this.localize(p));
    },
    innerBoundsContainsPoint: function(p) { return this.innerBounds().containsPoint(p);  }
},
'prototypical scripting', {
    addScript: function(funcOrString, optName, optMapping) {
        if (!funcOrString) return null;
        var func        = Function.fromString(funcOrString),
            oldFunction = this[func.name],
            changed     = oldFunction && oldFunction.toString() !== func.toString(),
            timestamp   = oldFunction && !changed ? oldFunction.timestamp : undefined,
            user        = oldFunction && !changed ? oldFunction.user : undefined,
            result      = func.asScriptOf(this, optName, optMapping);
        result.setTimestampAndUser(timestamp, user);
        return result;
    }

},
'scripting', {
    startStepping: function(stepTime, scriptName, argIfAny) {
        var script = lively.morphic.Script.forTarget(this, scriptName, argIfAny ? [argIfAny] : null);
        this.removeEqualScripts(script);
        this.scripts.push(script);
        script.startTicking(stepTime);
        return script;
    },
    stopStepping: function() {
        this.scripts.invoke('stop')
        this.scripts = [];
    },
    stopSteppingScriptNamed: function(selector) {
        var scriptsToStop = this.scripts.select(function(ea) { return ea.selector === selector });
        this.stopScripts(scriptsToStop);
    },
    stopScripts: function(scripts) {
        scripts.invoke('stop')
        this.scripts = this.scripts.withoutAll(scripts);
    },
    suspendStepping: function() {
        if (!this.scripts) return;
        this.scripts.invoke('suspend') },

    suspendSteppingAll: function() {
        this.withAllSubmorphsDo(function(ea) { ea.suspendStepping() });
    },

    resumeStepping: function() {
        this.scripts.invoke('resume');
    },

    resumeSteppingAll: function() {
        this.withAllSubmorphsDo(function(ea) { ea.scripts.invoke('resume') });
    },

    removeEqualScripts: function(script) {
        var equal = this.scripts.select(function(ea) { return ea.equals(script) });
        this.stopScripts(equal);
    },

    animatedInterpolateTo: function(destination, nSteps, msPer, callBackFn, finalScale) {
        if (nSteps <= 0) return;
        var loc = this.getPosition(),
            delta = destination.subPt(loc).scaleBy(1 / nSteps),
            scaleDelta = finalScale ? (this.getScale() - finalScale) / nSteps : 0;
        var path = [];
        for (var i = 1; i<=nSteps; i++) { loc = loc.addPt(delta); path.unshift(loc); }
        this.animatedFollowPath(path, msPer, callBackFn, scaleDelta);
    },

    animatedFollowPath: function(path, msPer, callBackFn, scaleDelta) {
        var spec = {path: path.clone(), callBack: callBackFn, scaleDelta: scaleDelta};
        spec.action = this.startStepping(msPer, 'animatedPathStep', spec);
    },

    animatedPathStep: function(spec, scaleDelta) {
        if (spec.path.length >= 1){
            this.setScale(this.getScale() - spec.scaleDelta);
            this.setPosition(spec.path.pop());
        }
        if (spec.path.length >= 1) return
        this.stopSteppingScriptNamed('animatedPathStep');
        spec.callBack.call(this);
    }
},
'styling', {
    getStyle: function() {
        // if style has serveral definitions in my hierarchy than return a merged object
        return Object.mergePropertyInHierarchy(this, 'style');
    },

    getOwnStyle: function() {
        // if style has serveral definitions in my hierarchy than return a merged object
        var style = this.getStyle();
        Object.keys(style).forEach(function(key) {
            if (this.hasOwnProperty(key)) { style[key] = this[key]; return; }
            var privateKey = '_' + key.capitalize();
            if (this.hasOwnProperty(privateKey)) { style[key] = this[privateKey]; return; }
            var accessor = 'get' + key.capitalize();
            if (typeof this[accessor] === 'function' && this[accessor].length === 0) { style[key] = this[accessor](); return; }
        }, this);
        return style;
    },

    applyStyle: function(spec) {
        if (!spec) return this;

        if (spec.position) this.setPosition(spec.position);
        if (spec.extent !== undefined) this.setExtent(spec.extent);
        if (spec.scale !== undefined) this.setScale(spec.scale);
        if (spec.rotation !== undefined) this.setRotation(spec.rotation);

        if (spec.borderWidth !== undefined) this.setBorderWidth(spec.borderWidth);
        if (spec.borderColor !== undefined) this.setBorderColor(spec.borderColor);
        if (spec.fill !== undefined) this.setFill(spec.fill);
        if (spec.opacity !== undefined) this.setOpacity(spec.opacity);
        if (spec.visible !== undefined) this.setVisible(spec.visible);

        if (spec.fillOpacity !== undefined) this.setFillOpacity(spec.fillOpacity);
        if (spec.strokeOpacity !== undefined) this.setStrokeOpacity(spec.strokeOpacity);

        if (spec.borderRadius !== undefined)
            this.setBorderRadius(spec.borderRadius);
        if (spec.borderStyle !== undefined)
            this.setBorderStyle(spec.borderStyle);

        if (spec.enableGrabbing !== undefined)
            spec.enableGrabbing ? this.enableGrabbing() : this.disableGrabbing();
        if (spec.enableDropping !== undefined)
            spec.enableDropping ? this.enableDropping() : this.disableDropping();
        if (spec.enableMorphMenu !== undefined)
            spec.enableMorphMenu ? this.enableMorphMenu() : this.disableMorphMenu();
        if (spec.enableHalos !== undefined)
            spec.enableHalos ? this.enableHalos() : this.disableHalos();
        if (spec.enableDragging !== undefined)
            spec.enableDragging ? this.enableDragging() : this.disableDragging();

        if (spec.focusHaloBorderWidth !== undefined) this.focusHaloBorderWidth = spec.focusHaloBorderWidth;
        if (spec.focusHaloInset !== undefined) this.focusHaloInset = spec.focusHaloInset;
        if (spec.padding !== undefined) this.setPadding(spec.padding);
        if (spec.margin !== undefined) this.margin = spec.margin;
        if (spec.zIndex !== undefined) this.setZIndex(spec.zIndex);

        /*DEPRECATED*/if (spec.overflow !== undefined) this.setClipMode(spec.overflow);
        if (spec.clipMode !== undefined) this.setClipMode(spec.clipMode);
        if (spec.beClip !== undefined) this.beClip(spec.beClip);

        if (spec.handStyle !== undefined) this.setHandStyle(spec.handStyle);

        if (spec.accessibleInInactiveWindow !== undefined)
            this.accessibleInInactiveWindow = spec.accessibleInInactiveWindow;

        if (spec.toolTip !== undefined) this.setToolTip(spec.toolTip);

        if (spec.lock !== undefined) this[spec.lock ? 'lock' : 'unlock']();

        if (spec.name !== undefined) this.setName(spec.name);

        if (spec.cssStylingMode !== undefined) { // enable disable styling through css
            this.setBorderStylingMode(spec.cssStyling);
            this.setAppearanceStylingMode(spec.cssStyling);
        }

        if (spec.styleSheet !== undefined) { // enable disable styling through css
            this.setStyleSheet(spec.styleSheet);
        }

        if (spec.resizeWidth !== undefined || spec.resizeHeight !== undefined || spec.moveVertical !== undefined || spec.moveHorizontal !== undefined || spec.adjustForNewBounds !== undefined || spec.scaleHorizontal !== undefined || spec.scaleVertical !== undefined || spec.centeredVertical !== undefined || spec.centeredHorizontal !== undefined || spec.scaleProportional !== undefined) {
            this.layout = this.layout || {};
            if (spec.resizeWidth !== undefined) this.layout.resizeWidth = spec.resizeWidth;
            if (spec.resizeHeight !== undefined) this.layout.resizeHeight = spec.resizeHeight;
            if (spec.scaleHorizontal !== undefined) this.layout.scaleHorizontal = spec.scaleHorizontal;
            if (spec.scaleVertical !== undefined) this.layout.scaleVertical = spec.scaleVertical;
            if (spec.scaleProportional !== undefined) {
                this.layout.scaleVertical = spec.scaleProportional;
                this.layout.scaleHorizontal = spec.scaleProportional;
            }

            if (spec.centeredHorizontal !== undefined) this.layout.centeredHorizontal = spec.centeredHorizontal;
            if (spec.centeredVertical !== undefined) this.layout.centeredVertical = spec.centeredVertical;

            if (spec.moveVertical !== undefined) this.layout.moveVertical = spec.moveVertical;
            if (spec.moveHorizontal !== undefined) this.layout.moveHorizontal = spec.moveHorizontal;
            if (spec.adjustForNewBounds !== undefined) this.layout.adjustForNewBounds = spec.adjustForNewBounds;
        }

        return this;
    }

},
'debugging', {

    toString: function() {
        var name = this.getName();
        return Strings.format('<%s#%s%s>',
            this.constructor.type,
            String(this.id).truncate(8),
            name ? ' - ' + name : '');
    },

    isAncestorOf: function(aMorph) {
        // check if aMorph is somewhere in my submorph graph
        return !!this.withAllSubmorphsDetect(function(ea) {
            return ea === aMorph; });
    }

},
'jquery', {
    jQueryNode: function() {
        return this.renderContext().shapeNode;
    },
    jQuery: function() {
        return lively.$(this.jQueryNode());
    }
});

lively.morphic.Morph.subclass('lively.morphic.World',
'properties', {
    style: {
        fill: Color.white,
        enableGrabbing: false,
        enableHalos: true,
        enableMorphMenu: true,
        enableDragging: true
    },
    metaTags: [
        {name: "apple-mobile-web-app-capable", content: "yes"}],
    linkTags: [
        {rel: 'shortcut icon', href: 'core/media/lively.ico'},
        {rel: 'apple-touch-icon-precomposed', href: 'core/media/apple-touch-icon.png'}],
    isWorld: true
},
'accessing -- morphic relationship', {
    draggedMorphs: function() {
        return this.hands.map(function (hand) { return hand.draggedMorph }).filter(function (ea) { return ea });
    },

    addMorph: function($super, morph, optMorphBefore) {
        // my first hand is almost the topmost morph
        var r = $super(morph, optMorphBefore);
        this.hands.forEach(function(hand) {
            $super(hand);
        })
        return r;
    }
},
'accessing', {
    world: function() { return this },
    firstHand: function() {
        return this.hands && (this.hands.find(function(hand) {
          return typeof hand.pointerId !== 'undefined' }) || this.hands[0])
    },

    windowBounds: function(optWorldDOMNode) {
        if (this.cachedWindowBounds) return this.cachedWindowBounds;
        var canvas = optWorldDOMNode || this.renderContext().getMorphNode(),
            topmost = document.documentElement,
            body = document.body,
            scale = 1 / this.getScale(),
            topLeft = pt(body.scrollLeft - (canvas.offsetLeft || 0), body.scrollTop - (canvas.offsetTop || 0)),
            width, height;
        if (UserAgent.isTouch || UserAgent.isMobile){
            width = window.innerWidth * scale;
            height = window.innerHeight * scale;
        } else {
            width = topmost.clientWidth * scale;
            height = topmost.clientHeight * scale;
        }
        return this.cachedWindowBounds = topLeft.scaleBy(scale).extent(pt(width, height));
    },

    visibleBounds:  function () {
        // the bounds call seems to slow down halos...
        return this.windowBounds().intersection(this.innerBounds());
    },

    isFullscreen: function() {
        return !!document.fullscreenElement
            || !!document.webkitFullscreenElement
            || !!document.mozFullScreenElement;
    },

    requestFullscreen: function() {
        var n = this.renderContext().morphNode;
        if (n.requestFullscreen) { n.requestFullscreen(); }
        else if (n.webkitRequestFullscreen) { n.webkitRequestFullscreen(); }
        else if (n.mozRequestFullScreen) { n.mozRequestFullScreen(); }
    }

},
'rendering', {
    displayOnDocument: function(doc) {
        var bodyEl = doc.getElementsByTagName('body')[0];
        this.displayOnElement(bodyEl);
    },

    displayOnElement: function(el) {
        if (lively.Config.get("removeDOMContentBeforeWorldLoad")) {
            this.renderContext().domInterface.removeAllChildrenOf(el);
        }
        this.renderContext().setParentNode(el);
        this.renderContextDispatch('append');
        this.withAllSubmorphsDo(function(ea) {
            ea.registerForEvents(Config.handleOnCapture); });
    },

    getMetaTags: function() {
        // append our own metaTags to the class's metaTags
        var allTags = Object.mergePropertyInHierarchy(this, 'metaTags');

        // ensure only one tag of a type is present
        return allTags.uniqBy(function(a,b) {
          if (("name" in a) && ("name" in b) && a == b) return true;
          if (("property" in a) && ("property" in b) && a == b) return true;
          return false;
        });
    },

    getLinkTags: function() {
        // append our own linkTags to the class's linkTags
        return Object.mergePropertyInHierarchy(this, 'linkTags');
    },

    hideHostMouseCursor: function () {
        if (!Config.hideSystemCursor) return;
        // FIXME
        require('lively.Network').toRun(function() {
            // chrome on windows cannot display cur files
            var cursorFile = 'media/nocursor.' + (UserAgent.isChrome && UserAgent.isWindows ? 'gif' : 'cur'),
                path = URL.codeBase.withFilename(cursorFile).pathname;
            document.body.style.cursor = 'url("' + path + '"), none';
        });
    }
},
'hand morph', {
    addHandMorph: function() {
        var hand = new lively.morphic.HandMorph();
        if (!this.hands) this.hands = [];
        this.hands.push(hand);
        this.addMorph(hand);
    }
},
"world requirements", {
    hasWorldRequirement: function(requirement) {
        return this.getWorldRequirements().include(requirement);
    },

    addWorldRequirement: function(requirement) {
        this.setWorldRequirements(this.getWorldRequirements().concat(requirement));
    },

    removeWorldRequirement: function(requirement) {
        this.setWorldRequirements(this.getWorldRequirements().without(requirement));
    },

    setWorldRequirements: function(requirements) {
        // FIXME metaInfos should be independent from PartsBin
        var metaInfo = this.getPartsBinMetaInfo();
        metaInfo.requiredModules = requirements;
    },

    getWorldRequirements: function() {
        return this.getPartsBinMetaInfo().getRequiredModules();
    }
});

Object.extend(lively.morphic.World, {

    current: function() { return this.currentWorld },

    registerWorld: function(world) {
        // make it THE world
        return this.currentWorld = world;
    },

    createOn: function(domElement, bounds) {
        var world = new this();
        bounds = bounds || new Rectangle(0,0,400,400);
        world.setBounds(bounds)
        world.displayOnElement(domElement)
        world.applyStyle({fill: Color.gray.lighter()})
        world.addHandMorph();
        this.registerWorld(world);
        return world;
    }
});

lively.morphic.Morph.subclass('lively.morphic.Box',
'initializing', {
    initialize: function($super, initialBounds) {
        $super(new lively.morphic.Shapes.Rectangle(initialBounds.extent().extentAsRectangle()));
        this.setPosition(initialBounds.topLeft());
    }
});

lively.morphic.Box.subclass('lively.morphic.Clip',
'initializing', {
    initialize: function($super, initialBounds) {
        $super(initialBounds);
        this.applyStyle({clipMode: 'scroll'});
    }
});

lively.morphic.Morph.subclass('lively.morphic.Path',
'properties', {
    isPath: true,
    style: {
        borderWidth: 1, borderColor: Color.black
    }
},
'initializing', {
    initialize: function($super, vertices) {
        var shape = this.defaultShape(null, vertices);
        $super(shape);
    },
    defaultShape: function(bounds, vertices) {
        return new lively.morphic.Shapes.Path(vertices || [pt(0,0)]);
    }
},
'accessing', {
    vertices: function() { return this.shape.vertices() }
},
'vertex and control point computations', {
    pathBetweenRects: function(rect1, rect2) {
        // copied and adpated from graffle Raphael 1.2.1 - JavaScript Vector Library
        var p = [{x: rect1.x + rect1.width / 2, y: rect1.y - 1},
            {x: rect1.x + rect1.width / 2, y: rect1.y + rect1.height + 1},
            {x: rect1.x - 1, y: rect1.y + rect1.height / 2},
            {x: rect1.x + rect1.width + 1, y: rect1.y + rect1.height / 2},
            {x: rect2.x + rect2.width / 2, y: rect2.y - 1},
            {x: rect2.x + rect2.width / 2, y: rect2.y + rect2.height + 1},
            {x: rect2.x - 1, y: rect2.y + rect2.height / 2},
            {x: rect2.x + rect2.width + 1, y: rect2.y + rect2.height / 2}];
        var d = {}, dis = [];
        for (var i = 0; i < 4; i++) {
            for (var j = 4; j < 8; j++) {
                var dx = Math.abs(p[i].x - p[j].x),
                    dy = Math.abs(p[i].y - p[j].y);
                if ((i == j - 4) || (((i != 3 && j != 6) ||
                    p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) ||
                    p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                        dis.push(dx + dy);
                        d[dis[dis.length - 1]] = [i, j];
                }
            }
        }
        var res = dis.length == 0 ? [0, 4] : d[Math.min.apply(Math, dis)];

        var x1 = p[res[0]].x,
            y1 = p[res[0]].y,
            x4 = p[res[1]].x,
            y4 = p[res[1]].y,
            dx = Math.max(Math.abs(x1 - x4) / 2, 10),
            dy = Math.max(Math.abs(y1 - y4) / 2, 10),
            x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
            y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
            x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
            y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);

        var p1 = this.localize(pt(x1, y1)),
            c1 = this.localize(pt(x2, y2)),
            c2 = this.localize(pt(x3, y3)),
            p2 = this.localize(pt(x4, y4));

        return [p1, c1, c2, p2];
    }
},
'arrow behavior', {
    addArrowHeadStart: function(morph) {
        var ctrlPt = this.getControlPoints().first();
        this.addMorph(morph);
        ctrlPt.addMarker(morph, 'next');
        return morph;
    },
    addArrowHeadEnd: function(morph) {
        var ctrlPt = this.getControlPoints().last();
        this.addMorph(morph);
        ctrlPt.addMarker(morph, 'prev')
        return morph;
    },
    createArrow: function() {
        var arrowHead = new lively.morphic.Path([pt(0,0), pt(0,12), pt(16,6), pt(0,0)]);
        arrowHead.applyStyle({borderWidth: 0, borderColor: Color.black, fill: Color.black})
        arrowHead.adjustOrigin(pt(12,6))
        return arrowHead;
    },
    createArrowHeadStart: function() {
        return this.addArrowHeadStart(this.createArrow());
    },
    createArrowHeadEnd: function() {
        return this.addArrowHeadEnd(this.createArrow());
    }
},
'control points', {
    getControlPoint: function(idx) { return this.getControlPoints()[idx] },
    getControlPoints: function() {
        var vertices = this.vertices();
        if (!this.controlPoints) this.controlPoints = [];
        if (vertices.length !== this.controlPoints.length)
            this.controlPoints = this.vertices().collect(function(p, i) {
                return this.controlPoints[i] || new lively.morphic.ControlPoint(this, i);
            }, this);
        return this.controlPoints;
    },
    insertControlPointBetween: function(index1, index2, vertex) {
        var ctrlP1 = this.getControlPoint(index1);
        ctrlP1.insertAfter(vertex);
        this.cachedBounds = null;
    }
},
'conversion', {
    convertToCurve: function() {
        var ctrlPoints = this.getControlPoints();
        for (var i = 1; i < ctrlPoints.length; i++) {
            var ctrlPt = ctrlPoints[i], prev = ctrlPoints[i-1];
            if (ctrlPt.isCurve()) continue;
            var prevPos = prev.getPos(),
                currentPos = ctrlPt.getPos(),
                ptArr = this.pathBetweenRects(
                    new Rectangle(prevPos.x,prevPos.y,0,0),
                    new Rectangle(currentPos.x,currentPos.y,0,0)),
                c1 = ptArr[1],
                c2 = ptArr[2],
                p = ptArr[3];
            ctrlPt.toCurve(p, c1, c2);
        }
        this.cachedBounds = null;
    },
    convertToLine: function() {
        this.getControlPoints().forEach(function(ea) { return ea.toLine(ea.getPos()) });
        this.cachedBounds = null;
    }
},
'menu', {
    morphMenuItems: function($super) {
        var items = $super();
        items.push(['to curve', this.convertToCurve.bind(this)]);
        items.push(['to line', this.convertToLine.bind(this)]);

        var propItems = items.detect(function(subItem) {
            return subItem[0].match(/morphic.*properties/i)
        });

        var haloItemsEnabled = this.areControlPointHalosEnabled()
        propItems[1].push([
            (haloItemsEnabled ? "Disable" : "Enable")
                + " halo items for control points", function() {
                    this.setControlPointHalosEnabled(!haloItemsEnabled);
                }.bind(this)]);

        return items;
    },
    adjustOrigin: function($super, newOrigin) {
        var oldOrigin = this.getOrigin();
        $super(newOrigin);
        var newVertices = this.vertices().map(function(ea) {
            return ea.subPt(newOrigin.subPt(oldOrigin)); });
        this.shape.setVertices(newVertices);
    }

},
'events', {
    onMouseUp: function($super, evt) {
        if (evt.isCommandKey() || evt.isRightMouseButtonDown())
            return $super(evt);

        this.showControlPointsHalos();
        return true;
    }
});

Object.subclass('lively.morphic.ControlPoint',
'initializing', {
    initialize: function(morph, index) {
        this.morph = morph;
        this.index = index || 0;
    },
    create: function() {
        return new lively.morphic.ControlPoint(this.morph)
    }
},
'updating', {
    signalChange: function() {
        this.reactToChange();
        var next = this.next();
        next && next.reactToChange();
        var prev = this.prev();
        prev && prev.reactToChange();
    },
    reactToChange: function() {
        this.alignMarker();
    },
    elementChanged: function() {
        this.morph.shape.setPathElements(this.morph.shape.getPathElements());
        this.morph.cachedBounds = null;
    }

},
'testing', {
    isFirst: function() { return this.index === 0 },
    isLast: function() { return this.morph.controlPoints.length === this.index+1 },
    isCurve: function() {
        var e = this.getElement();
        return e.charCode == 'Q' || e.charCode == 'C' || e.charCode == 'S';
    }
},
'accessing', {
    getMorph: function() { return this.morph },
    getPos: function() {
        var width = this.morph.getBorderWidth() * 2;
        return this.morph.vertices()[this.index] || pt(0,0)//.addXY(width,width)
    },
    getGlobalPos: function() {
        return this.morph.world() ? this.morph.worldPoint(this.getPos()) : this.getPos()
     },
    next: function() { return this.getMorph().getControlPoint(this.index+1) },
    prev: function() { return this.getMorph().getControlPoint(this.index-1) },
    getElement: function() { return this.morph.shape.getPathElements()[this.index] },
    setElement: function(element) {
        var elements = this.morph.shape.getPathElements();
        elements.replaceAt(element, this.index);
        this.morph.shape.setPathElements(elements);
    }
},
'enumerating', {
    withNextControlPointsDo: function(func) {
        var ctrlPts = this.morph.controlPoints;
        var nexts = ctrlPts.slice(this.index+1, ctrlPts.length);
        nexts.forEach(func);
    },
    controlPointsFromTo: function(start, end) {
        var ctrlPts = this.morph.controlPoints;
        return ctrlPts.slice(start || 0, end || ctrlPts.length);
    },

},
'manipulation', {
    moveBy: function(p) {
        var element = this.getElement();
        if (!element) return;
        element.translatePt(p);
        this.elementChanged();
        this.signalChange();
    },
    setPos: function(p) {
        this.moveBy(p.subPt(this.getPos()))
    },
    setGlobalPos: function(p) {
        this.setPos(this.morph.localize(p));
    },

    insertAfter: function(pos) {
        var next = this.create();
        return next.insertAt(this.index+1, pos);
    },

    insertAt: function(index, pos) {
        this.index = index;

        var isCurve = this.isFirst() ? this.next().isCurve() : this.isCurve();

        // update ctrl points
        this.controlPointsFromTo(this.index).forEach(function(ea) { ea.index++ });
        var newCtrlPt = this.morph.controlPoints.pushAt(this, this.index);

        // update vertices
        var vertices = this.morph.vertices()
        vertices.pushAt(pos, this.index);
        this.morph.setVertices(vertices);


        if (isCurve) this.controlPointsFromTo(this.index).forEach(function(ea) { ea.toCurve() });

        this.signalChange();

        return this
    },

    mergeWithNext: function() {
        var next = this.next();
        next && next.remove();
    }

},
'removing', {
    remove: function() {
        this.controlPointsFromTo(this.index+1).forEach(function(ea) { ea.index-- });

        var vertices = this.morph.vertices();
        vertices.removeAt(this.index);
        this.morph.setVertices(vertices);

        var ctrlPts = this.morph.controlPoints;
        ctrlPts.removeAt(this.index);

        ctrlPts[this.index].signalChange();
    },

},
'conversion', {
    asHalo: function() { return new lively.morphic.PathVertexControlPointHalo(this) },
    toCurve: function(p, c1, c2) {
        if (this.isFirst()) return;
        this.setElement(new lively.morphic.Shapes.CurveTo(true, this.getPos().x, this.getPos().y));
        // this.setElement(new lively.morphic.Shapes.BezierCurve2CtlTo(true, p.x, p.y, c1.x, c1.y, c2.x, c2.y));
    },
    toLine: function(p) {
        if (this.isFirst()) return;
        this.setElement(new lively.morphic.Shapes.LineTo(true, p.x, p.y));
    }

},
'markers', {
    addMarker: function(morph, direction) {
        // direction is prev or next
        this.marker = morph;
        this.markerDirection = direction || 'prev';
        this.alignMarker();
    },
    detachMarker: function() {
        this.marker = null;
        this.markerDirection = null;
    },

    alignMarker: function() {
        // we align the marker morph at the position of this ctrl point
        if (!this.marker) return;
        if (!this.marker.owner == this.morph) { this.detachMarker(); return; }
        var pos = this.getPos(),
            other = this[this.markerDirection](),
            vector = pos.subPt(other.getPos()),
            rot = vector.theta();
        this.marker.setRotation(rot);
        this.marker.setPosition(pos);
    }
});

Object.subclass('lively.morphic.Script',
'properties', {
    isScript: true
},
'ticking', {
    execute: function() { throw new Error('subclass responsibility') },
    tick: function() {
        try {
            this.execute()
        } catch(e) {
            // mr 2014-05-11: e.unwindException has to be used because e is unwrapped when rewritten
            if (lively.Config.get('loadRewrittenCode') && e.unwindException && e.unwindException.isUnwindException) {
                require('lively.ast.StackReification', 'lively.ast.Debugging').toRun(function() {
                    var cont = lively.ast.Continuation.fromUnwindException(e.unwindException);
                    lively.ast.openDebugger(cont.currentFrame, e.toString());
                });
            }

            alert('Error executing script ' + this + ': ' + e + '\n' + e.stack);
            return;
        }
        if (!this.stopped) this.startTicking(this.tickTime);
    }
},
'starting and stopping', {
    startTicking: function(ms) {
        this.stopped = false;
        this.tickTime = ms;
        this.currentTimeout = Global.setTimeout(this.tick.bind(this), ms);
    },
    stop: function() {
        this.stopped = true;
        Global.clearTimeout(this.currentTimeout);
    },
    resume: function() {
        if (!this.suspended) return;
        this.suspended = false;
        this.startTicking(this.tickTime === undefined ? 100 : this.tickTime);
    },
    suspend: function() {
        this.stop();
        this.suspended = true;
    },

});
lively.morphic.Script.subclass('lively.morphic.FunctionScript',
'initializing', {
    initialize: function(callback) {
        this.callback = callback;
    },
},
'ticking', {
    execute: function() {
        this.callback()
    }
},
'testing', {
    equals: function(other) { return other.isScript && this.callback == other.callback },
},
'debugging', {
    toString: function() {
        return Strings.format('Script(%s)', this.callback.toString().truncate(40));
    },
});
Object.extend(lively.morphic.FunctionScript, {
    once: function(cb, time) {
        var script = new this(cb);
        script.startTicking(time || 0);
        script.stopped = true;
        return script;
    },
});

Function.addMethods(
"morphic delay", {
    morphicDelay: function(time) {
        lively.morphic.FunctionScript.once(this, time);
    },
});

lively.morphic.Script.subclass('lively.morphic.TargetScript',
'initializing', {
    initialize: function(target, selector, args) {
        this.target = target;
        this.selector = selector;
        this.args = args || [];
    }
},
'ticking', {
    execute: function() {
        this.target[this.selector].apply(this.target, this.args);
    }
},
'testing', {
    equals: function(other) { return other.isScript && this.target == other.target && this.selector == other.selector }
},
'debugging', {
    toString: function() {
        return Strings.format('Script(%s>>%s(%s))',
            this.target, this.selector, this.args.join(','))
    }
});

Object.extend(lively.morphic.Script, {
    forFunction: function(func) {
        return new lively.morphic.FunctionScript(func);
    },
    forTarget: function(target, selector, optArgs) {
        return new lively.morphic.TargetScript(target, selector, optArgs);
    }
});

}) // end of module
