module('lively.morphic.AdditionalMorphs').requires('lively.morphic.Halos', 'lively.morphic.Grid').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.CanvasMorph',
'canvas', {
    defaultBounds: pt(300, 300),
    initialize: function($super, optBounds) {
        $super(this.createShape());
        this.setExtent(optBounds || this.defaultBounds);
        this.disableDropping();    // because children are not shown
    },
    createShape: function() {
        var node = this.renderContextDispatch('createCanvasNode');
        return new lively.morphic.Shapes.External(node);
    },
    getContext: function(optContext) {
        return this.renderContextDispatch('getContext', optContext);
    },
    setExtent: function($super, extent) {
        $super(extent);
        this.renderContextDispatch('adaptCanvasSize', extent);
    },
    clear: function() {
        var ctx = this.getContext(),
            extent = this.getExtent(),
            height = extent.y,
            width = extent.x;
        if (ctx) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.restore();
        }
    },
    onCanvasChanged: function() {
        // canvas created or loaded or size changed, need to redraw contents
    }

},
'HTML rendering', {
    htmlDispatchTable: {
       createCanvasNode: 'createCanvasNodeHTML',
       getContext: 'getContextHTML',
       adaptCanvasSize: 'adaptCanvasSizeHTML'
    },
    getContextHTML: function(ctx, optContext) {
        return ctx.shapeNode ? ctx.shapeNode.getContext(optContext|| '2d') : null;
    },
    appendHTML: function($super, ctx, optMorphAfter) {
       $super(ctx, optMorphAfter);
       this.adaptCanvasSizeHTML(ctx);
    },
    createCanvasNodeHTML: function(ctx) {
        return XHTMLNS.create('canvas');
    },
    adaptCanvasSizeHTML: function(ctx) {
        var $node = $(ctx.shapeNode),
            x = $node.width(),
            y = $node.height();
        $node.attr('width', x);
        $node.attr('height', y);
        this.onCanvasChanged();
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
        var shape = new lively.morphic.Shapes.Path(vertices);
        $super(shape);
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
'halos', {
    getHalos: function($super) {
        return $super()
            .concat(this.getControlPointHalos())
            .concat(this.getInsertPointHalos())
            // .reject(function(halo) { return halo instanceof lively.morphic.OriginHalo });
    },
    getHaloClasses: function($super) {
        return $super()
            .without(lively.morphic.ResizeHalo)
            .concat([lively.morphic.RescaleHalo])
    },

    getControlPointHalos: function() { return this.getControlPoints().invoke('asHalo') },
    getInsertPointHalo: function(idx) {
        return new lively.morphic.PathInsertPointHalo(this.getControlPoint(idx));
    },
    getInsertPointHalos: function() {
        var result = [];
        for (var i = 0; i < this.vertices().length-1; i++) result.push(this.getInsertPointHalo(i));
        return result
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
        return items;
    },
    adjustOrigin: function($super, newOrigin) {
        var oldOrigin = this.getOrigin();
        $super(newOrigin);
        var newVertices = this.vertices().map(function(ea) {
            return ea.subPt(newOrigin.subPt(oldOrigin)); });
        this.shape.setVertices(newVertices);
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

lively.morphic.Halo.subclass('lively.morphic.PathControlPointHalo',
'settings', {
    style: {fill: null, borderWidth: 2, borderColor: Color.blue},
    defaultExtent: pt(12,12),
    isPathControlPointHalo: true,
},
'initializing', {
    initialize: function($super, controlPoint) {
        $super(controlPoint.getMorph());
        this.controlPoint = controlPoint;
        //controlPoint.getMorph().addMorph(this);
        //this.setPosition(controlPoint.getPos());
    },
    createLabel: function() {/*do nothing*/}
});

lively.morphic.PathControlPointHalo.subclass('lively.morphic.PathVertexControlPointHalo',
'properies', {
    isVertexControlHalo: true
},
'halo behavior', {
    computePositionAtTarget: function() {
        return this.controlPoint.getGlobalPos().subPt(this.getExtent().scaleBy(0.5));
    },
    dragAction: function (evt, moveDelta) {
        this.overOther = this.highlightIfOverOther();

        var transform = this.targetMorph.getGlobalTransform(),
            oldPos = transform.transformPoint(pt(0,0)),
            newDelta = oldPos.addPt(moveDelta),
            newDelta = transform.inverse().transformPoint(newDelta);

        this.controlPoint.moveBy(newDelta);
        if (this.targetMorph.halos)
            this.targetMorph.halos.invoke('alignAtTarget')
    },

    dragEndAction: function(evt) {
        if (!this.overOther) return;
        if (this.controlPoint.next() !== this.overOther.controlPoint &&
            this.controlPoint.prev() !== this.overOther.controlPoint) return;
        if (this.controlPoint.isLast() || this.controlPoint.isFirst()) return;
        this.controlPoint.remove();
        this.targetMorph.removeHalos()
        this.targetMorph.showHalos()
    },

    findIntersectingControlPoint: function() {
        var halos = this.targetMorph.halos;
        if (!halos) return;
        for (var i = 0; i < halos.length; i++)
            if (halos[i].isVertexControlHalo &&
                halos[i] !== this &&
                this.bounds().intersects(halos[i].bounds()))
                    return halos[i];
    },

    highlightIfOverOther: function() {
        var overOther = this.findIntersectingControlPoint();
        this.setBorderColor(overOther ? Color.red : Color.blue);
        return overOther;
    },

});

lively.morphic.PathControlPointHalo.subclass('lively.morphic.PathInsertPointHalo',
'settings', {
    style: {borderRadius: 6},
},
'properies', {
    isPathControlPointHalo: true,
},
'acessing', {
    getStartPos: function() { return this.controlPoint.getPos() },
    getEndPos: function() { return this.controlPoint.next().getPos() },
    getLocalPos: function() {
        var start = this.getStartPos(), end = this.getEndPos();
        return start.addPt(end.subPt(start).scaleBy(0.5))
    },
    getGlobalPos: function() {
        return this.targetMorph.worldPoint(this.getLocalPos());
    },
},
'halo behavior', {
    computePositionAtTarget: function() {
        return this.getGlobalPos().subPt(this.getExtent().scaleBy(0.5));
    },
    dragStartAction: function(evt) {
        this.newControlPoint = this.controlPoint.insertAfter(this.getLocalPos());
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos()
    },
    dragAction: function(evt, moveDelta) {

        var transform = this.targetMorph.getGlobalTransform(),
            oldPos = transform.transformPoint(this.newControlPoint.getPos()),
            newPos = oldPos.addPt(moveDelta),
            newPos = transform.inverse().transformPoint(newPos);
        this.newControlPoint.setPos(newPos);

        if (this.targetMorph.halos)
            this.targetMorph.halos.invoke('alignAtTarget');
    },
});
cop.create('lively.morphic.PathOriginHackLayer')
.refineClass(lively.morphic.Path, {
    getHalos: function() {
        return cop.proceed();
        return this.getControlPointHalos()
            .concat(this.getInsertPointHalos())
            .concat(lively.morphic.Morph.prototype.getHalos.call(this))
    },
    adjustOrigin: function(value) { return this.morphicSetter('Origin', value) },
    getOrigin: function(value) { return this.morphicGetter('Origin') || pt(0,0)},
    getPosition: function(value) { return cop.proceed().addPt(this.getOrigin()) },
    setPosition: function(value) { return cop.proceed(value.subPt(this.getOrigin())) },
    setRotationHTML: function(ctx, rad) {
        if (ctx.morphNode)
            ctx.domInterface.setHTMLTransform(ctx.morphNode, rad, this.getScale(), this.getOrigin());
    },
    setScaleHTML: function(ctx, scale) {
        if (ctx.morphNode)
            ctx.domInterface.setHTMLTransform(ctx.morphNode, this.getRotation(), scale, this.getOrigin());
    },
    onrestore: function() {
        cop.proceed();
        // FIXME actually this shouldnt be necessary
        (function() {
            // var owner = this.owner;
            // this.remove();
            // this.prepareForNewRenderContext(this.renderContext())
            // owner && owner.addMorph(this)
            this.getControlPoints().invoke('alignMarker')
        }).bind(this).delay(0)
    },
})
.refineClass(lively.morphic.ControlPoint, {
    getPos: function() { return cop.proceed().subPt(this.morph.getOrigin()) },
}).beNotGlobal();

lively.morphic.Morph.subclass('lively.morphic.HtmlWrapperMorph',
'initializing', {
    initialize: function($super, initialExtent) {
        this.rootElement = document.createElement('div');
        this.shape = new lively.morphic.Shapes.External(this.rootElement)
        $super(this.shape);
        this.shape.setBounds({
            extent: function() {return initialExtent;},
            topLeft: function() {return pt(0,0);}});

        this.setFill(Color.rgb(200,200,200));
    }
},
"serialization", {

    doNotSerialize: ['rootElement'],

    serializedChildren: function(aDomNode) {
        var result = [];
        if (!aDomNode) {
            aDomNode = this.renderContext().shapeNode;
        }
        for (var i = 0; i < aDomNode.children.length; i++) {
            var child = {};
            for (var j = 0; j < aDomNode.attributes.length; j++) {
                child[aDomNode.attributes[j].name] = aDomNode.attributes[j].value;
            }
            child.innerHTML = aDomNode.innerHTML;
            child.children = this.serializedChildren(aDomNode.children[i]);
            result.push(child);
        }
        return JSON.stringify(result);
    },
},
"HTML access", {
    appendElement: function(elementMap) {
        var element = document.createElement(elementMap['name']);
        for (var property in elementMap) {
            if (property === 'name') { continue; }
            if (property === 'innerHTML') {
                element.innerHTML = elementMap['innerHTML'];
            } else {
                element.setAttribute(property, elementMap[property]);
            }
        }
        return this.appendChild(element);
    },
    appendChild: function(aDomNode) {
        this.renderContext().shapeNode.appendChild(aDomNode);
        return aDomNode;
    },

    children: function() {
        return this.renderContext().shapeNode.children;
    },

    getHTML: function() {
        return this.asJQuery().html();
    },

    setHTML: function(html) {
        return this.asJQuery().html(html);
    },

    asJQuery: function() {
        return lively.$(this.renderContext().shapeNode);
    }
},
"menu", {
    morphMenuItems: function($super) {
        var items = $super();
        var target = this;
        items.push(['edit HTML', function() {
            var ed = target.world().addCodeEditor({content: target.getHTML(), gutter: false, textMode: 'html'});
            ed.owner.align(ed.owner.bounds().center(), target.globalBounds().center());
            lively.bindings.connect(ed, 'savedTextString', target, 'setHTML');
            lively.bindings.connect(ed, 'savedTextString', Global, 'alertOK', {
                converter: function(htmlString) { return 'set HTML'; },
            });
        }]);
        items.push(['as text', function() {
            var ed = target.world().addCodeEditor({content: target.asJQuery().text(), gutter: false, textMode: 'text'});
            ed.owner.align(ed.owner.bounds().center(), target.globalBounds().center());
        }]);
        items.push(['open in web page', function() {
            window.open('data:text/html;charset=utf-8,' + encodeURIComponent(target.getHTML()));
        }]);
        return items;
    },
});

Object.extend(lively.morphic.HtmlWrapperMorph, {
    renderHTML: function(html, bounds) {
        bounds = bounds || lively.rect(0,0, 500, 500);
        var morph = new lively.morphic.HtmlWrapperMorph(bounds.extent());
        morph.asJQuery().html(html);
        morph.setFill(Color.white);
        morph.name = 'HTMLMorph';
        morph.setClipMode('auto');
        morph.openInWindow();
        morph.owner.openInWorld(bounds.topLeft());
        return morph;
    }
});

lively.morphic.Morph.subclass('lively.morphic.TabContainer',
'documentation', {
    example: function() {
        var c = new lively.morphic.TabContainer();
        c.tabBar.addTabLabeled('1');
        c.activePane().addMorph(lively.newMorph({style: {fill: Color.red}}))
        c.tabBar.addTabLabeled('2');
        c.activePane().addMorph(lively.newMorph({style: {fill: Color.green}}))
        c.setExtent(pt(300,200))
        c.openInWorld();
    }
},
'settings', {
    style: {
        borderWidth: 1,
        borderColor: Color.gray,
        adjustForNewBounds: true
    },
    isTabContainer: true
},
'initializing', {

    initialize: function($super, optTabBarStrategy) {
        $super();
        var tabBarStrategy = optTabBarStrategy || new lively.morphic.TabStrategyTop();
        this.setTabBarStrategy(tabBarStrategy);
        this.tabPaneExtent = pt(600,400);
        this.initializeTabBar();
        var newExtent = this.getTabBarStrategy().
            calculateInitialExtent(this.tabBar, this.tabPaneExtent);
        this.setExtent(newExtent);
        tabBarStrategy.applyTo(this);
    },

    initializeTabBar: function() {
        this.tabBar = new lively.morphic.TabBar(this);
        this.addMorph(this.tabBar);
    },
    getTabBarStrategy: function() {
        if (!this.tabBarStrategy) {
            alert('TabContainer does not have a tab bar strategy');
            debugger
        }
        return this.tabBarStrategy;
    },
    setTabBarStrategy: function(aStrategy) {
        this.tabBarStrategy = aStrategy;
        aStrategy.applyTo(this);
    },

    getTabPaneExtent: function() {
        return this.tabPaneExtent;
    },
    setTabPaneExtent: function(aPoint) {
        this.tabPaneExtent = aPoint;
    },

    addTabLabeled: function(aString) {
        return this.tabBar.addTabLabeled(aString);
    },
    getTabBar: function() {
        return this.tabBar;
    },
    getTabByName: function(aString) {
        return this.getTabBar().getTabByName(aString);
    },
    getTabNames: function() {
        return this.getTabBar().getTabs().map(function(ea) { return ea.getName(); });
    },

    addTabPane: function(aTabPane) {
        aTabPane.layout = aTabPane.layout || {};
        aTabPane.layout.adjustForNewBounds = true;
        this.addMorph(aTabPane);
        this.getTabBarStrategy().
            adjustPanePositionInContainer(aTabPane, this);
    },
    onResizePane: function(aPoint) {
        this.setTabPaneExtent(aPoint);
        this.getTabBar().adjustTabSizes(aPoint);
        this.setExtent(this.getTabBarStrategy().
            containerExtent(aPoint, this.getTabBar().getExtent()));
        this.getTabBarStrategy().adjustTabBar(this.getTabBar(), aPoint);
    },
    activateTab: function(aTab) {
        this.getTabBar().activateTab(aTab);
    },
    morphMenuItems: function($super) {
        var self = this, items = $super();
        var otherContainers = this.world().withAllSubmorphsSelect(function(ea) { return ea.isTabContainer; });

        items.push(['adopt tab', otherContainers.map(function (container) {
                return [container.toString(), container.getTabNames().map(function (tabName) {
                        return [tabName, function(evt) {
                                self.adoptTabFromContainer(container.getTabByName(tabName), container);
                            }];
                    })];
            }
        )]);

        items.push([
            'Tab Bar Strategy', [
                ['Top', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyTop());}],
                ['Left', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyLeft());}],
                ['Bottom', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyBottom());}],
                ['Right', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyRight());}],
                ['Hide', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyHide());}]
            ]
        ]);
        return items;
    },

    adoptTabFromContainer: function(aTab, aContainer) {
        if (aTab.constructor.name == 'String') {
            aTab = aContainer.getTabByName('Bar');
        }
        aContainer.getTabBar().removeTab(aTab);
        this.getTabBar().addTab(aTab);
    },

    panes: function() {
        return this.getTabBar().getTabs().invoke('getPane');
    },

    activeTab: function() {
        return this.getTabBar().getTabs().detect(function(ea) { return ea.isActive });
    },

    activePane: function() {
        return this.activeTab().getPane();
    },
    adjustForNewBounds: function($super) {
        // resizedPanes holds a list that can be checked against endless recursion while setting the extent of the TabPanes
        $super();
        delete(this.resizedPanes);
    },

});

lively.morphic.Morph.subclass('lively.morphic.TabBar',
'settings', {
    style: {
        fill: Color.gray,
        borderWidth: 1,
        borderColor: Color.gray,
        enableDragging: false,
        enableGrabbing: false
    },
    isTabBar: true
},
'initializing', {

    initialize: function($super, tabContainer) {
        $super();
        this.tabContainer = tabContainer;
        var width = tabContainer.getTabBarStrategy().getTabBarWidth(tabContainer);
        this.setExtent(pt(width, this.getDefaultHeight()));
        this.tabs = [];
    }

},
'accessing', {
    getDefaultHeight: function() {
        return this.defaultHeight || 30;
    },
    setDefaultHeight: function(height) {
        this.defaultHeight = height;
    },


    getTabs: function() {
        return this.tabs;
    },

    addTab: function(aTab) {
        this.tabs.push(aTab);
        aTab.addTo(this);
        this.rearrangeTabs();
        this.adjustTabSizes(this.getTabContainer().getTabPaneExtent());
        this.activateTab(aTab);
        return aTab;
    },

    addTabLabeled: function(aLabelString) {
        var tab = new lively.morphic.Tab(this);
        tab.setLabel(aLabelString);
        return this.addTab(tab);
    },

    removeTab: function(aTab) {
        if (aTab.isActive) {
            var idx = this.getTabs().indexOf(aTab);
            var newActive = (idx == this.getTabs().length - 1)
                ? this.getTabs()[idx - 1]
                : this.getTabs()[idx + 1];
            if (newActive) this.activateTab(newActive);
        }
        aTab.getPane().remove();
        aTab.remove();
        this.unregisterTab(aTab);
    },

    getTabContainer: function() {
        return this.tabContainer;
    }
},
'tab handling', {

    unregisterTab: function(aTab) {
        this.tabs = this.tabs.without(aTab);
        this.rearrangeTabs();
    },

    rearrangeTabs: function() {
        var offset = 0;
        this.getTabs().forEach(function(ea) {
            ea.setTabBarOffset(offset);
            offset = ea.getNextTabBarOffset();
        });
    },

    getTabByName: function(aString) {
        // alternative implementation: in TabStrategyHide>>adjustTabBar
        //   do not set TabBar extent to pt(0,0) but call remove. In this case,
        //   we would need a different lookup here:
        //aTab = this.getTabs().detect(function (ea) { return aTab === ea.getName(); });
        return this.get(aString);
    },

    activateTab: function(aTab) {
        this.getTabs().invoke('deactivate');
        if (Object.isString(aTab)) aTab = this.getTabByName(aTab);
        aTab.activate();
    },

    deactivateTab: function(aTab) {
        aTab.deactivate();
    }
},
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'add tab', function(evt) {
            self.addTabLabeled('New Tab');
        }])
        return items;
    },
},
'layouting', {

    onResizePane: function(initiator, newExtent, deltaX) {
        // Tabs call this method when their pane's extent has changed.
        // All other tabs in the group will be resized accordingly.

        alert("TODO implement TabBar>>onResizePane using container's strategy");

        /*this.moveBy(pt(deltaX, 0));
        this.getTabs().forEach(function(ea) {
            ea.isInLayoutCycle = true;
            //ea.moveBy(pt(deltaX, 0));
            ea.resizePane(newExtent);
            delete ea.isInLayoutCycle;});
        this.getTabs().without(initiator).forEach(function(ea) {
            var pos = ea.pane.getPosition();
            ea.pane.setPosition(pt(pos.x - deltaX, pos.y));});
        var bounds = initiator.getBounds();
        this.setExtent(pt(this.getExtent().x, bounds.bottomRight().subPt(bounds.topLeft()).y ));*/
    },

    adjustTabSizes: function(aPoint) {
        if (!this.adjustedTabSizes) {
            var self = this;
            this.getTabs().forEach(function(ea) {
                self.adjustedTabSizes = true;
                ea.getPane().adjustToNewContainerSize(aPoint);
            });
        }
        this.setExtent(this.getTabContainer().getTabBarStrategy().
            tabBarExtent(this.getTabContainer()));

    }

});
lively.morphic.Morph.subclass('lively.morphic.Tab',
'settings', {
    isTab: true
},
'initializing', {

    initialize: function($super, tabBar) {
        $super();
        this.tabBar = tabBar;
        this.tabBarOffset = 0;
        this.setFill(this.getInactiveFill());
        this.setBorderWidth(1);
        this.setBorderColor(Color.gray);
        this.layout = {adjustForNewBounds: true};
        this.initializePane(this.getTabContainer().getTabPaneExtent());
        this.initializeLabel('Tab');
        this.draggingEnabled = this.grabbingEnabled = false;
        var labelExtent = this.label.getExtent();
        this.setExtent(pt(labelExtent.x + 10, labelExtent.y + 10));
        this.setClipMode('hidden');
        this.addCloseButton();
    },

    initializePane: function(extent) {
        this.pane = new lively.morphic.TabPane(this, extent);
    },

    initializeLabel: function(aString) {
        var labelHeight = 20;
        this.label = new lively.morphic.Text(new Rectangle(0, 0, 80, labelHeight));
        this.label.applyStyle({fixedWidth: false, fixedHeight: false});
        this.setLabel(aString);
        this.label.fit();
        this.label.setPosition(pt(5, 5));
        this.label.beLabel();
        this.label.disableEvents();
        this.addMorph(this.label);
    },

    addCloseButton: function() {
        var closer = new lively.morphic.Button,
            padding = 5,
            extent = this.getExtent().y - (padding *2)
        closer.setLabel("X")
        closer.label.fit();
        closer.setExtent(pt(extent,extent))
        this.addMorph(closer)
        closer.setPosition(pt(this.getExtent().x - extent - padding,padding))
        closer.layout = {moveHorizontal: true};
        connect(closer, "fire", this, "closeTab", {});
        this.closeButton = closer;
        return this;
    }

},
'accessing', {

    getTabContainer: function() {
        return this.getTabBar().getTabContainer();
    },
    setLabel: function(aString) {
        this.label.textString = aString;
        this.label.fit();
        this.setName(aString);
        this.getPane().setName(aString + ' - Pane');
        var extraSpace = this.closeButton ? 30 : 10;
        this.setExtent(pt(this.label.getExtent().x + extraSpace, this.label.getExtent().y + 10));
        this.getTabBar().rearrangeTabs();
        this.setToolTip(aString);
    },
    getLabel: function() {
        return this.label.textString;
    },
    getTabBar: function() {
        return this.tabBar;
    },
    setTabBar: function(aTabBar) {
        this.tabBar = aTabBar;
    },
    getPane: function() {
        return this.pane;
    },
},
'events', {
    onMouseDown: function(evt) {
        this.getTabBar().activateTab(this);
    },
    resizePane: function(newExtent) {
        this.pane.isInResizeCycle = true;
        this.pane.setExtent(newExtent);
        delete this.pane.isInResizeCycle;
    }
},
'morph menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'set label', function(evt) {
                $world.prompt('Set label', function(input) {
                    if (input !== null)
                        self.setLabel(input || '');
                }, self.getLabel());
            }]);
        items.push([
            'remove tab', function(evt) {
                self.getTabBar().removeTab(self);
            }]);
        return items;
    },
},
'tabbing', {
    remove: function($super) {
        if (!this.isInActivationCycle && this.getTabBar()) {
            // In order to activate a tab, we call remove and then addMorph.
            // In that case, we don't want to remove it permanently.
            this.getTabBar().unregisterTab(this);
        }
        $super();
    },
    addTo: function(aTabBar) {
        var container = aTabBar.getTabContainer(),
            pane = this.getPane();
        this.setTabBar(aTabBar);
        aTabBar.addMorph(this);
        container.addTabPane(pane);
    },
    getNextTabBarOffset: function() {
        return this.tabBarOffset + this.getExtent().x;
    },
    setTabBarOffset: function(anInteger) {
        this.tabBarOffset = anInteger;
        var position = this.getPosition();
        this.setPosition(pt(anInteger, position.y));
    },
    activate: function() {
        var that = this;
        this.isInActivationCycle = true;
        this.getPane().remove();
        this.getTabContainer().addTabPane(this.getPane());
        this.setFill(this.getActiveFill());
        this.label.applyStyle({fontWeight:'bold'});
        this.label.fit();
        delete this.isInActivationCycle;
        this.isActive = true;
        this.getPane().onActivate();
    },
    deactivate: function() {
        this.setFill(this.getInactiveFill());
        this.label.applyStyle({fontWeight:null});
        this.label.fit();
        this.isActive = false;
    },
    getActiveFill: function() { return Color.white; },
    getInactiveFill: function() { return Color.gray; },

    closeTab: function() {
        var toolPane = this.owner.owner;
        this.owner.removeTab(this);
        if(toolPane.tabBar.getTabs().length == 0) {
            if (toolPane.owner instanceof lively.morphic.Window)
                toolPane.owner.remove();
        }
    }
});
lively.morphic.Morph.subclass('lively.morphic.TabPane',
'settings', {
    style: {
        fill: Color.white,
        borderWidth: 1,
        borderColor: Color.gray,
        enableDragging: false,
        enableGrabbing: false,
        adjustForNewBounds: true,
        resizeWidth: true,
        resizeHeight: true
    },
    isTabPane: true
},
'initializing', {

    initialize: function($super, tab, extent) {
        $super();
        this.tab = tab;
        this.tabBar = tab.getTabBar();
        this.setExtent(extent);
    },
    getTab: function() {
        return this.tab;
    },
    getTabContainer: function() {
        var t = this.getTab();
        return t && t.getTabContainer();
    },
    activateTab: function(aTab) {
        // convenience: allow my submorphs to call
        // this.owner.activateTab(...) to navigate
        this.getTabContainer().activateTab(aTab);
    },

    setExtent: function($super, aPoint) {
        $super(aPoint);
        var container = this.getTabContainer();
        if (!container) return aPoint;
        this.adjustClipping(aPoint);
        container.resizedPanes = container.resizedPanes || new Array();
        // TODO refactor: either resizedPanes list or isInResizeCycle, not both!
        if (container.resizedPanes.indexOf(this.id) < 0) {
            container.resizedPanes.push(this.id);
            if (!this.isInResizeCycle) {
                container.onResizePane(aPoint);
            }
        }
        return aPoint;
    },

    remove: function($super) {
        $super();
        var tab = this.getTab();
        if (!tab.isInActivationCycle) {
            this.tab.remove();
        }
    },
    adjustToNewContainerSize: function(aPoint) {
        this.isInResizeCycle = true;
        this.setExtent(aPoint);
        delete this.isInResizeCycle;
    },
    onActivate: function() {
        // hook for applications
    },
    adjustClipping: function(aPoint) {
        var submorphsExtent = this.getBounds().bottomRight().subPt(this.getBounds().topLeft());
        if (submorphsExtent.x > aPoint.x || submorphsExtent.y > aPoint.y) {
            this.setClipMode('scroll');
        } else {
            this.setClipMode('visible');
        }
    },
    addMorph: function($super, aMorph) {
        var returnValue = $super(aMorph);
        this.adjustClipping(this.getExtent());
        return returnValue
    },
    removeMorph: function($super, aMorph) {
        $super(aMorph);
        this.adjustClipping(this.getExtent());
    }

});


Object.subclass('lively.morphic.TabStrategyAbstract',
'default category', {

    applyTo: function(aContainer) {
        var that = this,
            tabBar = aContainer.getTabBar();
        if (!tabBar) { // tabBar might not exist, e.g. when calling from TabContainer>>initialize
            return;
        }
        var tabs = tabBar.getTabs(),
            tabPanes = tabs.map(function(ea) { return ea.getPane(); }),
            paneExtent = aContainer.getTabPaneExtent();
        this.adjustTabBar(tabBar, paneExtent);
        tabBar.setExtent(this.tabBarExtent(aContainer));
        tabPanes.forEach(function(ea) {
            that.adjustPanePositionInContainer(ea, aContainer); });
        aContainer.setExtent(this.containerExtent(paneExtent, tabBar.getExtent()));
    },

    adjustTabBar: function(aTabBar, paneExtent) {
        throw "TabStrategyAbstract>>adjustTabBar: subclassResponsibility";
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
         throw "TabStrategyAbstract>>calculateInitialExtent: subclassResponsibility";
    },

    getTabBarWidth: function(aContainer) {
         throw "TabStrategyAbstract>>getTabBarWidth: subclassResponsibility";
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
         throw "TabStrategyAbstract>>adjustPanePositionInContainer: subclassResponsibility";
    },


    tabBarExtent: function(aContainer) {
         throw "TabStrategyAbstract>>tabBarExtent: subclassResponsibility";
    },
    containerExtent: function(paneExtent, tabBarExtent) {
         throw "TabStrategyAbstract>>containerExtent: subclassResponsibility";
    },



});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyTop',
'default category', {

    adjustTabBar: function(aTabBar) {
        aTabBar.setPosition(pt(0,0));
        aTabBar.setRotation(0);
        aTabBar.layout = {adjustForNewBounds: true, resizeWidth: true};
        aTabBar.setExtent(pt(aTabBar.getTabContainer().getTabPaneExtent().x, aTabBar.getDefaultHeight()));
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(Math.max(tabBarExtent.x, tabPaneExtent.x),
                  tabBarExtent.y + tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().x;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(
            0,
            aTabContainer.getTabBar().getExtent().y));
    },


    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().x, aContainer.getTabBar().getDefaultHeight());
    },
    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x, tabBarExtent.y + paneExtent.y);
    },



});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyRight',
'default category', {

    adjustTabBar: function(aTabBar) {
        var barExtent = pt(aTabBar.getExtent(), aTabBar.getDefaultHeight());
        aTabBar.setExtent(barExtent);
        aTabBar.setPosition(pt(
            aTabBar.getTabContainer().getTabPaneExtent().x + barExtent.y,
            0));
        aTabBar.setRotation(Math.PI/2);
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(  tabBarExtent.y + tabPaneExtent.x,
                    tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().y;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(0, 0));
    },


    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().y, aContainer.getTabBar().getDefaultHeight());
    },
    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x + tabBarExtent.y, paneExtent.y);
    },



});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyBottom',
'default category', {

    adjustTabBar: function(aTabBar) {
        aTabBar.setPosition(pt(0, aTabBar.getTabContainer().getTabPaneExtent().y));
        aTabBar.setRotation(0);
        aTabBar.layout = {adjustForNewBounds: true, resizeWidth: true};
        aTabBar.setExtent(pt(aTabBar.getExtent().x, aTabBar.getDefaultHeight()));
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(  Math.max(tabBarExtent.x, tabPaneExtent.x),
                    tabBarExtent.y + tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().x;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(0, 0));
    },


    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().x, aContainer.getTabBar().getDefaultHeight());
    },
    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x, tabBarExtent.y + paneExtent.y);
    },



});
lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyLeft',
'default category', {

    adjustTabBar: function(aTabBar) {
        var barExtent = pt(aTabBar.getExtent().x, aTabBar.getDefaultHeight());
        aTabBar.setExtent(barExtent);
        aTabBar.setPosition(pt(
            0,
            aTabBar.getTabContainer().getTabPaneExtent().y));
        aTabBar.setRotation(3*Math.PI/2);
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(  tabBarExtent.y + tabPaneExtent.x,
                    tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().y;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(
            aTabPane.getTab().getTabBar().getExtent().y,
            0));
    },


    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().y, aContainer.getTabBar().getDefaultHeight());
    },
    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x + tabBarExtent.y, paneExtent.y);
    },



});
lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyHide',
'default category', {
   adjustTabBar: function(aTabBar) {
        aTabBar.setExtent(pt(0,0));
        aTabBar.setPosition(pt(0,0));
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        return tabPaneExtent;
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().x; // dummy
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(0, 0));
    },


    tabBarExtent: function(aContainer) {
        return pt(0, 0); // dummy
    },
    containerExtent: function(paneExtent, tabBarExtent) {
        return paneExtent;
    },


});
lively.morphic.Box.subclass('lively.morphic.LoadingMorph',
'properties', {
    style: {
        borderRadius: 8.5,
        fill: Color.rgb(214,214,214),
        borderWidth: 1,
        borderColor: Color.black,
        layout: {
            adjustForNewBounds: true,
        }
    },
},
'initialization', {
    initialize: function($super, bounds) {
        var returnValue = $super(bounds);
        this.applyStyle({
            adjustForNewBounds: true
        })
        this.initilaizeProgressIndicator();
        this.initializePreviewText();
        this.setExtent(this.getExtent())
    },
    initilaizeProgressIndicator: function() {
        this.progressIndicator = new lively.morphic.Image(
            rect(0,0,40,40),
            LivelyLoader.codeBase + 'media/morphLoading.gif');
        this.progressIndicator.applyStyle({
            centeredHorizontal: true,
            centeredVertical: true,
        })
        this.addMorph(this.progressIndicator)
    },
    initializePreviewText: function() {
        // the morph name is added to the preogress indicator
        this.previewText = new lively.morphic.Text(rect(
                0,
                this.progressIndicator.getExtent().y,
                125,
                30
            ), '\n\nloading part')
        this.previewText.applyStyle({
            fill: null,
            borderWidth: 0,
            resizeWidth: false,
            centeredVertical: true,
            centeredHorizontal: true,
            align: 'center',
            fontSize: 14
        })
        this.addMorph(this.previewText)
    }

},
'loading', {
    loadFinished: function (part) {
        var world = lively.morphic.World.current(),
            hand = world.firstHand();
        if(this.owner === hand) {
            hand.removeAllMorphs();
        } else {
            this.owner.addMorph(part);
            part.align(part.bounds().center(), this.bounds().center());
            this.remove();
        }
        disconnect(this.partItem, 'part', this, "loadFinished");
        if(this.callback) {
            this.callback(part);
        }
    },
    loadPart: function (partItem, isAsync) {
        this.partItem = partItem;
        this.openInWorld();
        if (partItem.part) {
            this.setExtent(partItem.part.getExtent());
        }
        this.align(this.bounds().center(), $world.visibleBounds().center());
        if (typeof isAsync === "function") {
            this.callback = isAsync;
        }
        connect(partItem, 'part', this, "loadFinished");
        partItem.loadPart(isAsync);
        return partItem.part;
    },
    loadPartByName: function (partName, optPartsSpaceName, isAsync) {
        var partItem = lively.PartsBin.getPartItem(partName, optPartsSpaceName);
        return this.loadPart(partItem, isAsync);
    }
});


lively.morphic.Morph.subclass('lively.morphic.FancyList',
'default category', {
    initialize: function($super) {
        $super();
        this.setExtent(pt(200,200));
        this.setFill(Color.white);
        this.setBorderWidth(1);
        this.setBorderColor(Color.rgb(220,220,220));
        this.setClipMode('scroll');
        this.initializeList();
    },
    initializeList: function() {
        this.list = new lively.morphic.Morph();
        this.list.noAddMorphDelegation = true;
        this.addMorph(this.list);
        this.list.setLayouter(new lively.morphic.Layout.JournalLayout(this.list));
        this.list.disableGrabbing();
        this.list.disableDragging();
    },
    getList: function() {
        return this.list;
    },

    addMorph: function($super, aMorph) {
        if (aMorph.noAddMorphDelegation) {
            $super(aMorph);
        } else {
            this.getList().addMorph(aMorph);
        }
    }

});

lively.morphic.Morph.subclass('lively.morphic.TilePane',
'default category', {
    initialize: function($super) {
        $super();
        this.setExtent(pt(200,200));
        this.setFill(Color.white);
        this.setBorderWidth(1);
        this.setBorderColor(Color.rgb(220,220,220));
        this.setClipMode('scroll');
        this.initializePane();
    },
    initializePane: function() {
        this.pane = new lively.morphic.Morph();
        this.pane.noAddMorphDelegation = true;
        this.addMorph(this.pane);
        this.pane.setLayouter(new lively.morphic.Layout.TileLayout(this.pane));
        this.pane.disableGrabbing();
        this.pane.disableDragging();
    },
    getPane: function() {
        return this.pane;
    },

    addMorph: function($super, aMorph) {
        if (aMorph.noAddMorphDelegation) {
            $super(aMorph);
        } else {
            this.getPane().addMorph(aMorph);
        }
    },
    setExtent: function($super, aPoint) {
        $super(aPoint);
        if (this.getPane()) {
            this.getPane().setExtent(pt(aPoint.x - 30, aPoint.y));
        }
    },
});
lively.morphic.Morph.subclass('lively.morphic.Flap',
'initialization', {
    initialize: function($super) {
        $super(this.defaultShape());
        var args = $A(arguments)
        args.shift()
        this.init.apply(this, args);
    },
    init: function(alignment, optOwner, optBounds) {
        this.isFlap = true;
        var owner = optOwner || lively.morphic.World.current();
        owner.addMorph(this)
        this.setAlignment(alignment);
        optBounds && this.setCustomBounds(optBounds);
        this.fitToOwner(owner);
        this.initializeStyle();
        this.initializeHandle(owner);
        if (owner.isWorld) {
            this.setFixed(true);
            this.fixedScale = 1//$world.getZoomLevel();
        }
        this.expanded = true;
    },
    initializeHandle: function (optOwner) {
        var flapHandle = new lively.morphic.FlapHandle(this);
        this.flapHandle = flapHandle;
        flapHandle.flap = this;
        flapHandle.staticPosition = this.determineHandlePosition(optOwner);
        flapHandle.setPosition(flapHandle.staticPosition);
        return this.addMorph(flapHandle);
    },
    initializeStyle: function() {
        this.applyStyle(this.style)
        this.setAppearanceStylingMode(true);
        this.setStyleId('Flap')
        var backgroundURL = URL.codeBase.withFilename('media/NSTexturedBackgroundColor.jpg')
        this.setStyleSheet("#Flap {background-image: url('" + backgroundURL +"');}")
    },

    determineBorderRadius: function() {
        switch (this.alignment) {
            case 'left': return "0px 8px 8px 0px";
            case 'top': return "0px 0px 8px 8px";
            case 'right': return "8px 0px 0px 8px";
            case 'bottom': return "8px 8px 0px 0px";
            case 'custom': return "0px 0px 0px 0px";
            default: return "";
        }
    },

    determineHandlePosition: function (optOwner) {
        var owner = optOwner || this.owner,
            bottomRight = this.getExtent(),
            handleExtent = this.flapHandle.getExtent(),
            spaceUsedByOtherFlaps = this.calculateSpaceForOtherHandles(owner);
        switch (this.alignment) {
            case 'left':
                return pt(this.getExtent().x + handleExtent.y, spaceUsedByOtherFlaps)
            case 'top':
                return pt(bottomRight.x - handleExtent.x - spaceUsedByOtherFlaps, this.getExtent().y)
            case 'right':
                return pt(0, bottomRight.y - (handleExtent.x + spaceUsedByOtherFlaps))
            case 'bottom':
                return pt(spaceUsedByOtherFlaps, - handleExtent.y);
            default: return pt(0,0);
        }
    },

    calculateSpaceForOtherHandles: function(optOwner) {
        var self = this,
            owner = optOwner || this.owner;
        return owner.submorphs.select(function (ea) {
                return ea.isFlap && ea !== self && ea.getAlignment() == self.getAlignment()
            }).reduce(function(a, b){
                return a + b.flapHandle.getExtent().x;
            }, 10);
    },
    fitToOwner: function (owner) {
        this.setExtent(this.determineExtent(owner));
        this.setPosition(this.getExpandedPosition(owner));
        this.setBorderRadius(this.determineBorderRadius());
        this.expanded = true;
    }
},
'getter and setter', {
    setTarget: function(morph) {
        this.target = morph;
    },
    getTarget: function() {
        return this.target || lively.morphic.World.current();
    },
    getCollapsedPosition: function() {
        var pos,
            world = lively.morphic.World.current(),
            owner = this.owner,
            bottomRight = owner === world ? world.visibleBounds().extent() : owner.getExtent(),
            zoomLevel = owner === world? world.getZoomLevel() : 1,
            topLeft = this.owner === world? world.visibleBounds().topLeft() : pt(0,0),
            staticAlign = this.getCustomBounds() ? this.getCustomBounds().topLeft() : pt(0,0);
        switch (this.alignment) {
            case 'left': {
                pos = pt( -this.determineExtent().x, staticAlign.y);
                break;
            }
            case 'top': {
                pos = pt(staticAlign.x, -this.determineExtent().y);
                break
            }
            case 'right': {
                pos = pt((bottomRight.x * zoomLevel), staticAlign.y);
                break
            }
            case 'bottom' : {
                pos = pt(staticAlign.x, (bottomRight.y * zoomLevel));
                break;
            }
        }
        return pos.scaleBy(1 / zoomLevel).addPt(topLeft);
    },
    getExpandedPosition: function(optOwner) {
        var pos,
            world = lively.morphic.World.current(),
            owner = optOwner || this.owner,
            bottomRight = owner === world ? world.visibleBounds().extent() : owner.getExtent(),
            zoomLevel = owner === world? world.getZoomLevel() : 1,
            topLeft = this.owner === world? world.visibleBounds().topLeft() : pt(0,0);
        if (this.getCustomBounds()) {
            pos = this.getCustomBounds().topLeft();
        } else {
            switch (this.alignment) {
                case 'left': case 'top': {
                    pos = pt(0, 0);
                    break;
                }
                case 'right': {
                    pos = pt((bottomRight.x * zoomLevel) - this.getExtent().x, 0);
                    break
                }
                case 'bottom' : {
                    pos = pt(0, (bottomRight.y * zoomLevel) - this.getExtent().y);
                    break;
                }
            }
        }
        return pos.scaleBy(1 / zoomLevel).addPt(topLeft)
    },
    determineExtent: function (optOwner) {
        var extent,
            world = lively.morphic.World.current(),
            owner = optOwner || this.owner,
            ownerExtent = owner === world? world.visibleBounds().extent() : owner.getExtent(),
            zoomLevel = owner === world? world.getZoomLevel() : 1;
        if (this.getCustomBounds()) {
            extent = this.getCustomBounds().extent().scaleBy(1/zoomLevel);
        } else {
            switch (this.alignment)  {
                case 'left': case 'right': {
                    extent = pt(ownerExtent.x / 3, ownerExtent.y);
                    break;
                };
                case 'top': case 'bottom': {
                    extent = pt(ownerExtent.x, ownerExtent.y / 3);
                    break;
                };
            }
        }
        return extent.scaleBy(zoomLevel);
    },
    setAlignment: function(alignment) {
        var alignemnts = ['left', 'top', 'right', 'bottom'];
        if (typeof alignment === 'string' && alignemnts.include(alignment)) {
            this.alignment = alignment
        } else {
            alert('Alignment must be one of the following String values: \n'+alignemnts.join(' '))
        }
    },
    getAlignment: function() {
        return this.alignment;
    },
    getCustomBounds: function() {
        return this.customBounds;
    },
    setCustomBounds: function(bounds) {
        var world = lively.morphic.World.current(),
            pos = bounds.topLeft().scaleBy(world.getZoomLevel()),
            extent = bounds.extent().scaleBy(world.getZoomLevel());
        this.customBounds = pos.extent(extent)
    },
    setLastPosition: function(position) {
        var world = lively.morphic.World.current(),
            zoomLevel = this.owner === world? world.getZoomLevel() : this.owner.getScale(),
            ownerBounds = this.owner === world? world.visibleBounds() : this.owner.getBounds();
        this.lastPosition = position.subPt(ownerBounds.topLeft()).scaleBy(zoomLevel);
        this.expanded = undefined;
    },
    getLastPosition: function() {
        var world = lively.morphic.World.current(),
            zoomLevel = this.owner === world ? world.getZoomLevel() : this.owner.getScale(),
            ownerBounds = this.owner === world ? world.visibleBounds() : this.owner.getBounds();
        return this.lastPosition ?
            (this.lastPosition.scaleBy(1 / zoomLevel)).addPt(ownerBounds.topLeft()) : null;
    }

},
'interaction', {
    expand: function() {
        var lastPosition = this.getLastPosition() || this.getExpandedPosition();
        this.setPositionWhileFixed(lastPosition, 500)
        this.expanded = true;
    },
    collapse: function() {
        this.setPositionWhileFixed(this.getCollapsedPosition(), 500);
        this.expanded = false
    },
    toggle: function() {
        if (this.expanded === true || this.expanded === undefined) {
            this.collapse();
        } else {
            this.expand();
        }
    },
    close: function() {
        this.remove()
    },
    setNextPos: function (evtPos) {
        var world = lively.morphic.World.current(),
            pos = this.getPosition(),
            topLeft = world.visibleBounds().topLeft();
        switch (this.getAlignment()) {
            case 'left': {
                var offset = this.getExtent().x + this.flapHandle.getExtent().y,
                    scaledOffset = offset / world.getZoomLevel();
                pos.x = Math.max(evtPos.x - scaledOffset, this.getCollapsedPosition().x);
                pos.x = Math.min(pos.x, this.getExpandedPosition().x);
                break;
            };
            case 'top': {
                var offset = this.getExtent().y + this.flapHandle.getExtent().y,
                    scaledOffset = offset / world.getZoomLevel();
                pos.y = Math.max(evtPos.y - scaledOffset, this.getCollapsedPosition().y);
                pos.y = Math.min(pos.y, this.getExpandedPosition().y)
                break
            };
            case 'right': {
                pos.x = Math.max(evtPos.x, this.getExpandedPosition().x);
                pos.x = Math.min(pos.x, this.getCollapsedPosition().x);
                break
            };
            case 'bottom': {
                pos.y = Math.max(evtPos.y, this.getExpandedPosition().y);
                pos.y = Math.min(pos.y, this.getCollapsedPosition().y);
                break
            }
        }
        var fixed = this.isFixed;
        fixed && this.setFixed(false)
        this.setPosition(pos)
        fixed && this.setFixed(true);
    },
    setPositionWhileFixed: function(position, optTime) {
        if (optTime) {
            var that = this;
            this.setFixed(false);
            var callback = (function () {
                if (that.owner.isWorld) that.setFixed(true);
            }).bind(this)
            this.setPositionAnimated(position, optTime, callback);
        } else {
            this.setFixed(false);
            this.setPosition(position);
            this.setFixed(true);
        }
    }
});

lively.morphic.Box.subclass('lively.morphic.FlapHandle',
'properties', {
    style: {
        extent: pt(100,30),
        borderWidth: 1
    }
},
'getter and setter', {
    getAlignment: function() {
        return this.flap.getAlignment();
    }
},
'initialization', {
    initialize: function ($super, flap) {
        $super(pt(0,0).extent(this.style.extent));
        this.flap = flap;
        this.determineRotation();
        this.applyStyle(Object.merge([this.style, this.determineGradient()]));
        this.initializeCloseButton()
        this.disableGrabbing();
        this.enableDragging();
    },
    initializeCloseButton: function() {
        var bounds = lively.rect(this.getBorderWidth(), this.getBorderWidth(), 20, 20),
            closeButton = new lively.morphic.Button(bounds, 'X'),
            that = this;
        closeButton.addStyleClassName("WindowControl");
        closeButton.addStyleClassName("close");
        closeButton.flap = this.flap;
        closeButton.addScript(function onFire () {
            this.flap.close()
        });
        lively.bindings.connect(closeButton, 'fire', closeButton, 'onFire')
        this.addMorph(closeButton);
    },
    determineRotation: function() {
        switch (this.getAlignment()) {
            case 'left': {
                this.style.rotation = (90).toRadians();
                break;
            };
            case 'top': {
                this.style.rotation = 0;
                break;
            };
            case 'right': {
                this.style.rotation = (90).toRadians();
                break;
            };
            case 'bottom': {
                this.style.rotation = 0;
                break;
            }
        }
        return this.style.rotation;
    },
    determineGradient: function() {
        var dark = Color.rgb(9,16,29),
            bright = Color.rgb(200,200,200),
            gradient = new lively.morphic.LinearGradient([
                {offset: 0, color: dark},
                {offset: 0.06, color: dark},
                {offset: 0.09, color: bright},
                {offset: 0.27, color: bright},
                {offset: 0.33, color: dark},
                {offset: 0.36, color: dark},
                {offset: 0.39, color: bright},
                {offset: 0.57, color: bright},
                {offset: 0.63, color: dark},
                {offset: 0.66, color: dark},
                {offset: 0.69, color: bright},
                {offset: 0.9, color: bright},
                {offset: 0.93, color: dark},
                {offset: 1, color: dark}
            ], 'northsouth'),
            al = this.getAlignment(),
            borderRadius = (al === 'left' || al === 'bottom') ? "8px 8px 0px 0px" : "0px 0px 8px 8px";;
        return {
            fill: gradient,
            borderRadius: borderRadius,
            borderWidth: 5,
            borderColor: dark
        }
    },
    onMouseUp: function() {
        this.flap.toggle()
    },

    onDragStart: function(evt) {
        this.startPosition = this.getPosition();
        this.startFlapPosition = this.flap.getPosition();
        this.dragStart = evt.getPosition();
    },

    onDrag: function(evt) {
        this.flap.setNextPos(evt.getPosition());
        var dragOffset = evt.getPosition().subPt(this.dragStart);
        this.setPosition(this.startPosition);
    },
    onDragEnd: function(evt) {
        delete this.dragStart
        if (this.flap.getPosition() !== this.flap.getCollapsedPosition()) {
            this.flap.setLastPosition(this.flap.getPosition());
            this.expanded = true;
        }
        delete this.startFlapPosition;
        evt.stop();
    }
});

lively.morphic.Text.subclass('lively.morphic.AccordionSection',
'settings', {
    defaultHeight: 20,
    animation: {
        delay: 25,
        steps: 10
    }
},
'initialization', {
    initialize: function($super, title, pane) {
        var bounds = lively.rect(0, 0, 10, this.defaultHeight);
        $super(bounds, "► " + title);
        this.setBorderStylingMode(true);
        this.setAppearanceStylingMode(true);
        this.addStyleClassName('AccordionHeader');
        this.disableGrabbing();
        this.setFixedWidth(true);
        this.setFixedHeight(true);
        this.setInputAllowed(false);
        this.layout = {resizeWidth: true};
        this.pane = pane;
        this.pane.layout = {resizeWidth: true, resizeHeight: false};
        this.pane.setExtent(this.getExtent().withY(0));
        this.pane.disableGrabbing();
        this.closeScript = new lively.morphic.FunctionScript(this.animateClose);
        this.closeScript.pane = pane;
    }
},
'events', {
    onMouseUp: function(evt) {
        if (evt.isLeftMouseButtonDown()) {
            this.owner.activateSection(this);
        }
    },
    open: function() {
        this.textString = "▼ " + this.textString.substring(2);
        this.closeScript.stop();
        this.pane.layout.resizeHeight = true;
        this.pane.setExtent(this.getExtent().withY(1));
        this.addStyleClassName('active');
    },
    close: function() {
        this.textString = "► " + this.textString.substring(2);
        this.pane.layout.resizeHeight = false;
        this.closeScript.rate = Math.floor(this.pane.getExtent().y / this.animation.steps);
        this.closeScript.startTicking(this.animation.delay);
        this.removeStyleClassName('active');
    },
    animateClose: function() {
        var currentHeight = this.pane.getExtent().y;
        if (currentHeight <= 0) return this.stop();
        this.pane.setExtent(this.pane.getExtent().withY(currentHeight - this.rate));
    }
});

lively.morphic.Box.subclass('lively.morphic.Accordion',
'documentation', {
    exampleUsage: function() {
        var a = new lively.morphic.Accordion();
        a.addSection('Foo').setFill(Color.red);
        a.addSection('Bar').setFill(Color.green);
        a.addSection('Baz').setFill(Color.blue);
        a.openInWorld();
    }
},
'initialization', {
    initialize: function($super, bounds) {
        $super(bounds || lively.rect(0,0,200,100));
        this.setBorderWidth(0);
        this.setBorderColor(Color.black);
        this.setLayouter(new lively.morphic.Layout.AccordionLayout(this));
        this.activeSection = null;
    }
},
'sections', {
    addSection: function(title, optMorph) {
        if (!optMorph) {
            optMorph = new lively.morphic.Box(lively.rect(0,0,10,10));
        }
        var section = new lively.morphic.AccordionSection(title, optMorph);
        this.addMorph(section);
        this.addMorph(optMorph);
        if (!this.activeSection) this.activateSection(section);
        this.applyLayout();
        return optMorph;
    },
    activateSection: function(section) {
        if (section == this.activeSection) return;
        if (this.activeSection) this.activeSection.close();
        this.activeSection = section;
        if (this.activeSection) this.activeSection.open();
    },
    removeSection: function(section) {
        section.pane.remove();
        section.remove();
        if (section == this.activeSection) {
            this.activeSection = null;
        }
    }
});

}); // end of module
