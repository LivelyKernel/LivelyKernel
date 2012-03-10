module('lively.morphic.Core').requires('lively.morphic.Shapes', 'lively.Traits').toRun(function() {

if (!Config.isNewMorphic) {
    var list = module('lively.morphic.Core').traceDependendModules()
    console.warn("WARNING LOADED NEW MORPHIC IN OLD ONE\n" + Strings.printNested(list));
};

Object.subclass('lively.morphic.Morph',
'properties', {
    style: {enableDropping: true, enableHalos: true},
    isMorph: true,
},
'initializing', {
    isMorph: true,
    idCounter: 0,
    initialize: function(shape) {
        this.submorphs = [];
        this.scripts = [];
        this.shape = shape || this.defaultShape();
        this.setNewId();
        this.prepareForNewRenderContext(this.defaultRenderContext());
        this.applyStyle(this.getStyle());
    },
    setNewId: function(optId) {
        if (this.derivationIds == undefined) this.derivationIds = [];
        this.derivationIds.push(this.id);
        this.id = optId || (new UUID).id;
    },

    defaultShape: function(optBounds) {
        return new lively.morphic.Shapes.Rectangle(optBounds || new Rectangle(0,0,0,0));
    },
    defaultRenderContext: function() { return new lively.morphic.HTML.RenderContext() },

},
'accessing -- shapes', {
    makeStyleSpec: function() {
        // FIXME implement
        return {}
    },
},
'accessing -- morph properties', {
    setPosition: function(value) { return this.morphicSetter('Position', value) },
    getPosition: function() { return this.morphicGetter('Position') || pt(0,0) },
    setRotation: function(value) { return this.morphicSetter('Rotation', value) },
    getRotation: function() { return this.morphicGetter('Rotation') || 0 },
    setScale: function(value) { return this.morphicSetter('Scale', value) },
    getScale: function() { return this.morphicGetter('Scale') || 1 },
    setBounds: function(bounds) {
        this.setPosition(bounds.topLeft());
        this.setExtent(bounds.extent());
        return bounds;
    },
    getBounds: function() {
        var tfm = this.getTransform(),
            bounds = this.innerBounds();

        bounds = tfm.transformRectToRect(bounds);

        if (!this.isClip()) {
            var subBounds = this.submorphBounds(tfm);
            if (subBounds) bounds = bounds.union(subBounds);
        }

        return bounds;
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
    setOrigin: function(value) {
        // deprecated
        this.adjustOrigin(value);
    },
    adjustOrigin: function(value) {
        // changes the origin / pivot of the morph by offsetting the shape
        // without changing the morph's or submorphs' position on the screen
        var oldOrigin = this.getOrigin(),
            delta = value.subPt(oldOrigin),
            transform = this.getTransform(),
            oldTransformedOrigin = transform.transformPoint(oldOrigin),
            newTransformedOrigin = transform.transformPoint(value),
            transformedDelta = newTransformedOrigin.subPt(oldTransformedOrigin);

        this.moveBy(transformedDelta);
        this.shape.setPosition(value.negated());
        this.submorphs.forEach(function (ea) {ea.moveBy(transformedDelta.negated())});
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
    getToolTip: function() { return this.morphicGetter('ToolTip') },
},
'accessing -- shape properties', {
      setExtent: function(value) {

        var min = this.getMinExtent();

        value.maxPt(min,value);
        this.priorExtent = this.getExtent();
        this.shape.setExtent(value);
        if (this.layout && (this.layout.adjustForNewBounds || this.layout.layouter))
            this.adjustForNewBounds();
        if (this.owner && (typeof this.owner['submorphResized'] == 'function')) {
            this.owner.submorphResized(this);
        }
        return value;
      },
    getExtent: function() { return this.shape.getExtent() },
    setFill: function(value) { return this.shape.setFill(value) },
    getFill: function() { return this.shape.getFill() },
    setBorderColor: function(value) { return this.shape.setBorderColor(value) },
    getBorderColor: function() { return this.shape.getBorderColor() },
    setBorderWidth: function(value) { return this.shape.setBorderWidth(value) },
    getMinExtent:function () {
        if (this.minExtent) {
            return this.minExtent;
        } else {
            return pt(0,0);
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


    setVertices: function(v) { this.shape.setVertices(v) },

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

        if (morph.isAncestorOf(this)) {
            alert('addMorph: Circular relationships between morphs not allowed');
            return;
        }

        if (morph.owner) {
            var tfm = morph.transformForNewOwner(this);
            morph.remove();
        }

        if (morph.owner !== this) morph.owner = this;

        var indexToInsert = optMorphBefore && this.submorphs.indexOf(optMorphBefore);
        if (indexToInsert === undefined || indexToInsert < 0)
            indexToInsert = this.submorphs.length;
        this.submorphs.pushAt(morph, indexToInsert);

        // actually this should be done below so that geometry connects works correctly
        // but for the current Chrome stable (12.0.7) this leads to a render bug (morph is offseted)
        if (tfm) {
            morph.setTransform(tfm);
        }

        var parentRenderCtxt = this.renderContext(),
            subRenderCtxt = morph.renderContext(),
            ctx = parentRenderCtxt.constructor !== subRenderCtxt.constructor ?
                parentRenderCtxt.newForChild() : subRenderCtxt;
        morph.renderAfterUsing(ctx, optMorphBefore);

        morph.resumeSteppingAll();

        if (this.getLayouter()) {
            this.getLayouter().onSubmorphAdded(this, morph, this.submorphs);
        }
        return morph
    },
    withAllSubmorphsDo: function(func, context, depth) {
        if (!depth) depth = 0;
        func.call(context || Global, this, depth);
        for (var i = 0; i < this.submorphs.length; i++)
            this.submorphs[i].withAllSubmorphsDo(func, context, depth + 1);
    },
    withAllSubmorphsSelect: function(func, context, depth) {
        if (!depth) depth = 0;
        var res = [];
        if (func.call(context || Global, this, depth)) {
            res.push(this);
        }
        for (var i = 0; i < this.submorphs.length; i++) {
            res.pushAll(this.submorphs[i].withAllSubmorphsSelect(func, context, depth + 1));
        }
        return res;
    },
    selectSubmorphs: function(spec) {
        // return all submorphs (recursively) that fulfill spec
        var matchSpec = function(aMorph) {
                var matches = true;
                Properties.own(spec).forEach(function(prop) {
                    if (aMorph[prop] != spec[prop]) {
                        matches = false;
                    }
                });
                return matches;
            };
        return this.withAllSubmorphsSelect(matchSpec);
    },


    submorphBounds: function(tfm) {
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
        for (var i = this.submorphs.length -1 ; i >=0; i--)
            this.submorphs[i].morphsContainingPoint(point, list)
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
        return this.submorphs.reject(function(ea) { return ea.isEpiMorph }).last();
    },


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
        this.renderContextDispatch('remove');
    },
    removeMorph: function(morph) {
        this.submorphs = this.submorphs.without(morph);
        morph.owner = null;
        if (this.getLayouter()) {
            this.getLayouter().onSubmorphRemoved(this, morph, this.submorphs);
        }
    },


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
    innerBoundsContainsPoint: function(p) { return this.innerBounds().containsPoint(p);  },
},
'prototypical scripting', {
    addScript: function(funcOrString, optName) {
        var func = Function.fromString(funcOrString);
        return func.asScriptOf(this, optName);
    },

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
    },
},
'styling', {
    getStyle: function() {
        // if style has serveral definitions in my hierarchy than return a merged object
        return Object.mergePropertyInHierarchy(this, 'style');
    },
    applyStyle: function(spec) {
        if (!spec) return;

        if (spec.pos || spec.position) this.setPosition(spec.position);
        if (spec.extent !== undefined) this.setExtent(spec.extent);
        if (spec.scale !== undefined) this.setScale(spec.scale);
        if (spec.rotation !== undefined) this.setRotation(spec.rotation);

        if (spec.borderWidth !== undefined) this.setBorderWidth(spec.borderWidth);
        if (spec.borderColor !== undefined) this.setBorderColor(spec.borderColor);
        if (spec.fill !== undefined) this.setFill(spec.fill);
        if (spec.opacity !== undefined) this.setOpacity(spec.opacity);

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

        /*DEPRECATED*/if (spec.overflow !== undefined) this.setClipMode(spec.overflow);
        if (spec.clipMode !== undefined) this.setClipMode(spec.clipMode);
        if (spec.beClip !== undefined) this.beClip(spec.beClip);

        if (spec.handStyle !== undefined) this.setHandStyle(spec.handStyle);

        if (spec.accessibleInInactiveWindow !== undefined)
            this.accessibleInInactiveWindow = spec.accessibleInInactiveWindow;

        if (spec.toolTip !== undefined) this.setToolTip(spec.toolTip);

        if (spec.lock !== undefined) this[spec.lock ? 'lock' : 'unlock']();

        if (spec.resizeWidth !== undefined || spec.resizeHeight !== undefined || spec.moveVertical !== undefined || spec.moveHorizontal !== undefined || spec.adjustForNewBounds !== undefined || spec.scaleHorizontal !== undefined || spec.scaleVertical !== undefined || spec.centeredVertical !== undefined || spec.centeredHorizontal !== undefined) {
            this.layout = this.layout || {};
            if (spec.resizeWidth !== undefined) this.layout.resizeWidth = spec.resizeWidth;
            if (spec.resizeHeight !== undefined) this.layout.resizeHeight = spec.resizeHeight;
            if (spec.scaleHorizontal !== undefined) this.layout.scaleHorizontal = spec.scaleHorizontal;
            if (spec.scaleVertical !== undefined) this.layout.scaleVertical = spec.scaleVertical;

            if (spec.centeredHorizontal !== undefined) this.layout.centeredHorizontal = spec.centeredHorizontal;
            if (spec.centeredVertical !== undefined) this.layout.centeredVertical = spec.centeredVertical;

            if (spec.moveVertical !== undefined) this.layout.moveVertical = spec.moveVertical;
            if (spec.moveHorizontal !== undefined) this.layout.moveHorizontal = spec.moveHorizontal;
            if (spec.adjustForNewBounds !== undefined) this.layout.adjustForNewBounds = spec.adjustForNewBounds;
        }

        return this;
    },

},
'debugging', {
    toString: function() {
        var name = this.getName();
        return '<' + this.constructor.type + '#' + (this.id+"").truncate(8) + (name ? ' - ' + name : '') + '>'
    },
    isAncestorOf: function(aMorph) {
        // check if aMorph is somewhere in my submorph graph
        var found = false;
        this.withAllSubmorphsDo(function(grandchild) {
            if (grandchild === aMorph) {
                found = true;}});
        return found;
    },
},
'jquery', {
    jQueryNode: function() {
        return this.renderContext().shapeNode;
    },
    jQuery: function() {
        return jQuery(this.jQueryNode());
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
    isWorld: true,
},
'accessing -- morphic relationship', {
    addMorph: function($super, morph, optMorphBefore) {
        // my first hand is almost the topmost morph
        var r = $super(morph, optMorphBefore);
        $super(this.firstHand());
        this.updateScrollFocus();
        return r;
    },
    topMorph: function() { return this.submorphs.withoutAll(this.hands).last() },

},
'accessing', {
    world: function() { return this },
    firstHand: function() { return this.hands && this.hands[0] },
    windowBounds:  function () {
    var canvas = this.renderContext().getMorphNode(),
        topmost = document.documentElement,
        body = document.body,
        scale = 1 / this.getScale(),
        topLeft = pt(body.scrollLeft - (canvas.offsetLeft || 0), body.scrollTop - (canvas.offsetTop || 0)),
        width, height;
    if(UserAgent.isTouch){
        width = window.innerWidth * scale;
        height = window.innerHeight * scale;
    } else {
        width = topmost.clientWidth * scale;
        height = topmost.clientHeight * scale;
    } 
    return topLeft.scaleBy(scale).extent(pt(width, height));
    },

    visibleBounds:  function () {
        // the bounds call seems to slow down halos...
        // return this.windowBounds().intersection(this.bounds());
        return this.windowBounds().intersection(this.innerBounds());
    },
},
'rendering', {
    displayOnCanvas: function(domElement) {
        this.renderContext().setParentNode(domElement);
        this.renderContextDispatch('append');
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
    },
},
'hand morph', {
    addHandMorph: function() {
        var hand = new lively.morphic.HandMorph();
        if (!this.hands) this.hands = [];
        this.hands.push(hand);
        hand.addToWorld(this);
        this.addMorph(hand);
    },
},
'changes', {
    setChangeSet: function(changeSet) { this.changeSet = changeSet },
    getChangeSet: function() { return this.changeSet },
});

Object.extend(lively.morphic.World, {
    current: function() { return this.currentWorld },
    createOn: function(domElement, bounds) {
        var world = new this();
        bounds = bounds || new Rectangle(0,0,400,400);
        world.setBounds(bounds)
        world.displayOnCanvas(domElement)
        world.applyStyle({fill: Color.gray.lighter()})
        world.addHandMorph();
        this.currentWorld = world;
        return world;
    },
});

lively.morphic.Morph.subclass('lively.morphic.Box',
'initializing', {
    initialize: function($super, initialBounds) {
        $super(new lively.morphic.Shapes.Rectangle(initialBounds.extent().extentAsRectangle()));
        this.setPosition(initialBounds.topLeft());
    },
});

lively.morphic.Box.subclass('lively.morphic.List',
'properties', {
    isList: true,
});
lively.morphic.List.subclass('lively.morphic.DropDownList'); // FIXME does not belong here
lively.morphic.Box.subclass('lively.morphic.Clip',
'initializing', {
    initialize: function($super, initialBounds) {
        $super(initialBounds);
        this.applyStyle({clipMode: 'scroll'})
    },
});

Object.subclass('lively.morphic.Script',
'properties', {
    isScript: true,
},
'ticking', {
    execute: function() { throw new Error('subclass responsibility') },
    tick: function() {
        try {
            this.execute()
        } catch(e) {
            alert('Error executing script ' + this + ': ' + e + '\n' + e.stack);
            return;
        }
        if (!this.stopped) this.startTicking(this.tickTime);
    },
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
    },
},
'testing', {
    equals: function(other) { return other.isScript && this.target == other.target && this.selector == other.selector },
},
'debugging', {
    toString: function() {
        return Strings.format('Script(%s>>%s(%s))',
            this.target, this.selector, this.args.join(','))
    },
});

Object.extend(lively.morphic.Script, {
    forFunction: function(func) {
        return new lively.morphic.FunctionScript(func);
    },
    forTarget: function(target, selector, optArgs) {
        return new lively.morphic.TargetScript(target, selector, optArgs);
    },
});

}) // end of module