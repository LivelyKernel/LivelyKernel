module('lively.morphic.AdditionalMorphs').requires('lively.morphic.Halos').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.Path',
'properties', {
    isPath: true,
    style: {
        borderWidth: 1, borderColor: Color.black
    },
},
'initializing', {
    initialize: function($super, vertices) {
        var shape = new lively.morphic.Shapes.Path(vertices);
        $super(shape);
    },
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
        res = dis.length == 0 ? [0, 4] : d[Math.min.apply(Math, dis)];

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
    },
},
'arrow behavior', {
    addArrowHeadStart: function(morph) {
        var ctrlPt = this.getControlPoints().first();
        this.addMorph(morph);
        ctrlPt.addMarker(morph, 'next')
    },
    addArrowHeadEnd: function(morph) {
        var ctrlPt = this.getControlPoints().last();
        this.addMorph(morph);
        ctrlPt.addMarker(morph, 'prev')
    },
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
    },
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
    },
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
    },
    convertToLine: function() {
        this.getControlPoints().forEach(function(ea) { return ea.toLine(ea.getPos()) });
    },

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
    },

});
Object.subclass('lively.morphic.ControlPoint',
'initializing', {
    initialize: function(morph, index) {
        this.morph = morph;
        this.index = index || 0;
    },
    create: function() {
        return new lively.morphic.ControlPoint(this.morph)
    },

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
    },

},
'testing', {
    isFirst: function() { return this.index === 0 },
    isLast: function() { return this.morph.controlPoints.length === this.index+1 },
    isCurve: function() {
        var e = this.getElement();
        return e.charCode == 'Q' || e.charCode == 'C' || e.charCode == 'S';
    },

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
    },


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
    },


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
    },


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
    },
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
    createLabel: function() {/*do nothing*/},


},
'transformation', {

});
lively.morphic.PathControlPointHalo.subclass('lively.morphic.PathVertexControlPointHalo',
'properies', {
    isVertexControlHalo: true,
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
        return this.targetMorph.worldPoint(this.getLocalPos()) 
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
'default category', {
    initialize: function($super, initialExtent) {
        this.rootElement = document.createElement('div');
        this.shape = new lively.morphic.Shapes.External(this.rootElement)
        $super(this.shape);
        this.shape.setBounds({
            extent: function() {return initialExtent;},
            topLeft: function() {return pt(0,0);}});

        this.setFill(Color.rgb(200,200,200));
    },
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
    appendElement: function(elementMap) {
        var element = document.createElement(elementMap['name']);
        for (property in elementMap) {
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
    asJQuery: function() {
        return jQuery(this.renderContext().shapeNode);
    },








});
lively.morphic.Morph.subclass('lively.morphic.DataGrid',
'initialization', {
    initialize: function($super, numCols, numRows) {
        $super();
        this.defaultCellHeight = 30;
        this.defaultCellWidth = 80;
        this.borderSize = 50;
        this.colNames = new Array(numCols);
        this.numCols = numCols;
        this.numRows = numRows;
        this.activeCellContent = '';
        this.initializeData();
        this.initializeMorph();
    },
    initializeData: function() {
        this.rows = [];
        this.dataModel = [];
        this.addScript(function renderFunction(value) { return value; });
    },
    initializeMorph: function() {
        this.setExtent(pt(
            this.numCols * this.defaultCellWidth  + 2 * this.borderSize,
            this.numRows * this.defaultCellHeight + 2 * this.borderSize));
        this.setFill(Color.rgb(230,230,230));
        if (!this.hideColHeads) {
            this.createColHeads();
        }
        this.createCells();
        this.createLayout();
    },
    createCells: function() {
        var headOffset = this.hideColHeads ? 0 : 1;
        for (var y = 0; y < this.numRows; y++) {
            var row = [];
            for (var x = 0; x < this.numCols; x++) {
                var cell = this.createCell(x, y, headOffset);
                row.push(cell);
            }
            this.rows.push(row);
        }
    },
    createCell: function(x, y, headOffset) {
        var cell = new lively.morphic.DataGridCell();
        cell.doitContext = this;
        cell.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
        cell.addToGrid(this);
        cell.gridCoords = pt(x, y + headOffset);
        cell.name = '[' + x + ';' + y + ']';
        return cell;
    },

    createColHeads: function() {
        this.colHeads = [];
        for (var i = 0; i < this.numCols; i++) {
            var head = this.createColHead(i);
            this.colHeads.push(head);
        }
    },
    createColHead: function(index, title) {
        var head = new lively.morphic.DataGridColHead();
        head.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
        head.addToGrid(this);
        head.gridCoords = pt(index, 0);
        head.name = title ? title : '[' + index + ']';
        head.textString = head.name;
        return head;
    },


    createLayout: function() {
        var head = this.hideColHeads ? 0 : 1;
        this.setLayouter(new lively.morphic.Layout.GridLayout(this, this.numCols, this.numRows + head));
        this.applyLayout();
    },

    at: function(x, y) {
        return this.rows[y][x];
    },
    atPut: function(x, y, value) {
        this.rows[y][x].textString = value;
    },
    clear: function() {
        for (var y = 0; y < this.numRows; y++) {
            for (var x = 0; x < this.numCols; x++) {
                this.rows[y][x].textString = '';
                this.rows[y][x].evalExpression = undefined;
            }
        }
    },

    onUpPressed: function(evt) {
        this.moveActiveCellBy(pt(0,-1));
        evt.stop();
    },
    onDownPressed: function(evt) {
        this.moveActiveCellBy(pt(0,1));
        evt.stop();
    },
    onLeftPressed: function(evt) {
        this.moveActiveCellBy(pt(-1,0));
        evt.stop();
    },
    onRightPressed: function(evt) {
        this.moveActiveCellBy(pt(1,0));
        evt.stop();
    },


    moveActiveCellBy: function(aPoint) {
        if (!this.activeCell) {
            this.at(0,0).activate();
            return;
        }
        var curX = this.getActiveColIndex(),
            curY = this.getActiveRowIndex(),
            newX = curX + aPoint.x,
            newY = curY + aPoint.y;
        if (this.numRows > newY  && this.numCols > newX &&
                newY >= 0 && newX >= 0) {
            this.at(curX + aPoint.x, curY + aPoint.y).activate();
        }
    },
    setData: function(aJsArray) {
        this.clear();
        this.dataModel = [];
        var that = this;
        aJsArray.forEach(function(ea) {
            if (ea.constructor.name === 'Array') {
                that.dataModel.push(ea);
                return;
            }
            var row = that.createDataRowFromObject(ea);
            that.dataModel.push(row);
        });
        this.updateDisplay();
    },
    getDataObjects: function() {
        var that = this;
        return this.rows.map(function(ea){
            var obj = {};
            for (var i = 0; i < that.numCols; i++) {
                if (that.colNames[i] != undefined) {
                    obj[that.colNames[i]] = ea[i].getContent();
                }
            }
            return obj;
        });
    },

    createDataRowFromObject: function(anObject) {
        var row = [],
            names = this.getColNames();
        if (names.select(function(ea) {return ea != undefined}).length == 0) { 
            //col names have not been set
            for (var prop in anObject) {
               row.push(anObject[prop]);
            }
        } else {
            var i;
            row = new Array(this.numCols);
            for (i = 0; i < row.length; i++) {row[i] = ''};
            for (i = 0; i < names.length && i < this.numCols; i++) {
                if (names[i] in anObject) {
                    row[i] = anObject[names[i]];
                }
            }            
        }
        return row;
    },


    updateDisplay: function() {
        for (var y = 0; y < this.dataModel.length &&
                y < this.numRows; y++) {
            for (var x = 0; x < this.dataModel[y].length &&
                    x < this.numCols; x++) {
                this.at(x,y).textString = this.renderFunction(this.dataModel[y][x]);
            }
        }
        if (this.activeCell) {
            this.activeCellContent = this.activeCell.getContent();
        }
    },
    onKeyPress: function(evt) {
        if (!this.activeCell) {
            this.at(0,0).activate();
        }
        this.activeCell.onKeyPress(evt);
        evt.stop();
    },
    onBackspacePressed: function(evt) {
        if (!this.activeCell) {
            this.at(0,0).activate();
        }
        this.activeCell.onBackspacePressed(evt);
        return true;
    },
    onEnterPressed: function($super, evt) {
        this.onDownPressed(evt);
        return true;
    },
    onTabPressed: function($super, evt) {
        this.onRightPressed(evt);
        return true;
    },



    setActiveCellContent: function(aString) {
        if (!this.activeCell) {
            this.at(0,0).activate(); 
        }
        this.activeCell.textString = aString;
    },
    evaluateExpression: function(anExpression) {
        try {
            return (eval("(function() { \
                var that = this; \
                var cell = function(x,y) {return that.at(x,y).getContent();}; \
                return " + anExpression + ";})").bind(this)) ();
        } catch (e) {
            return 'ERROR';
        }
    },
    setColWidth: function(colIndex, newWidth) {
        for (var i = 0; i < this.rows.length; i++) {
            var curCell = this.rows[i][colIndex];
            curCell.setExtent(pt(newWidth, curCell.getExtent().y));
        }
    },
    setColNames: function(anArray) {
        this.colNames = anArray;
        for (var i = 0; i < this.colHeads.length; i++) {
            if (i < anArray.length) {
                this.colHeads[i].textString = anArray[i];
            } else {
                this.colHeads[i].textString = '';
            }
        }
    },
    getColNames: function() {
        return this.colNames;
    },

    setColName: function(colIndex, aString) {
        this.colNames[colIndex] = aString;
    },
    getColHead: function(anInteger) {
        return this.colHeads[anInteger];
    },



    recalculateRowsFirst: function() {
        this.rows.forEach(function (row) {
            row.forEach(function (col) {
                col.updateDisplay();
            });
        });
    },
    getActiveRowObject: function() {
        var activeRow = this.getActiveRow(),
            result = {};
        for (var i = 0; i < this.numCols && i < this.colNames.length; i++) {
            if (this.colNames[i]) {
                var value = activeRow[i].getContent();
                //if (activeRow[i].__secretHiddenValue) {
                //       // FIXME this will be gone once we have refactored the data model
                //    value = activeRow[i].__secretHiddenValue;
                //}
                result[this.colNames[i]] = value;
            }
        }
        return result;
    },
    getActiveRowIndex: function() {
        return this.activeCell.gridCoords.y - (this.hideColHeads ? 0 : 1);
    },
    getActiveColIndex: function() {
        return this.activeCell.gridCoords.x;
    },

    getActiveRow: function() {
        return this.rows[this.getActiveRowIndex()];
    },
    getActiveColName: function() {
        return this.colNames[this.getActiveColIndex()];
    },

    addCol: function(colName) {
        this.colNames.push(undefined);
        var realColName = (colName && typeof(colName) == 'string') ? colName : undefined;
        this.colNames[this.numCols] = realColName;
        
        if (!this.hideColHeads) {
            var head = this.createColHead(this.numCols, realColName);
            this.colHeads.push(head);
        }
        for (var i = 0; i < this.numRows; i++) {
            var cell = this.createCell(this.numCols, i, this.hideColHeads ? 0 : 1);
            this.rows[i].push(cell);
        }
        this.numCols++;
        this.createLayout();
    },
    addRow: function() {
        var row = [];
        for (var i = 0; i < this.numCols; i++) {
            var cell = this.createCell(i, this.numRows, this.hideColHeads ? 0 : 1);
            row.push(cell);
        }
        this.rows.push(row);
        this.numRows++;
        this.createLayout();
    },
    removeCol: function() {
        var lastColIndex = this.numCols - 1;
        this.rows.map(function(ea) {
            return ea[lastColIndex];}).
                forEach(function(ea) {
                    delete ea.gridCoords;
                    ea.remove();});
        this.rows.forEach(function(ea) {
            ea.pop();});

        delete this.colHeads[lastColIndex].gridCoords;
        this.colHeads[lastColIndex].remove();
        this.colHeads.pop();
        while (this.colNames.length > lastColIndex) {
            this.colNames.pop();
        }

        this.numCols--;
        this.createLayout();
    },
    removeRow: function() {
        var lastRowIndex = this.numRows - 1;
        this.rows[lastRowIndex].forEach(function(ea) {
            delete ea.gridCoords;
            ea.remove();});
        this.rows.pop();
        this.numRows--;
        this.createLayout();
    },


    morphMenuItems: function ($super) {
        var items = $super();
        items.push(['+ column', this.addCol.bind(this)]);
        items.push(['- column', this.removeCol.bind(this)]);
        items.push(['+ row', this.addRow.bind(this)]);
        items.push(['- row', this.removeRow.bind(this)]);
        return items;
    },




























});
lively.morphic.Text.subclass('lively.morphic.DataGridCell',
'default category', {
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },
    activate: function() {
        if (this.grid.activeCell) {
            this.grid.activeCell.deactivate();
        }    
        this.grid.activeCell = this;
        this.grid.activeCellContent = this.textString;
        this.setBorderColor(Color.red);
        this.setBorderWidth(2);
        this.displayExpression();
    },
    deactivate: function() {
        if (this.grid.activeCell !== this) {
            return;
        }
        this.grid.activeCell = null;
        this.setBorderColor(Color.black);
        this.setBorderWidth(1);
        this.updateEvalExpression();
        this.updateDisplay();
        this.grid.recalculateRowsFirst();
    },
    onMouseDown: function (evt) {
        if (evt.isLeftMouseButtonDown()) {
            this.activate();
        }
    },




    put: function(aValue) {
        // TODO: check if aValue starts with =, then evaluate it or not
        this.textString = aValue;
    },
    onKeyPress: function($super, evt) {
        // enter comment here
        $super(evt);
        this.textString += String.fromCharCode(evt.getKeyCode());
    },
    onBackspacePressed: function($super, evt) {
        $super(evt);
        if (!this.textString) {
            evt.stop(); 
            return true; 
        }
        this.textString = this.textString.substring(0, this.textString.length-1);
        evt.stop();
    },




    initialize: function($super, arg) {
        $super(arg);
        this.evalExpression = undefined;
    },
    updateDisplay: function() {
        if (this.evalExpression !== undefined) {
            this.textString = this.grid.evaluateExpression(this.evalExpression);
        }
    },
    updateEvalExpression: function() {
        if (this.textString.substring(0,1) === '=') {
            this.evalExpression = this.textString.substring(1);
            //this.textString = this.grid.evaluateExpression(this.textString.substring(1));
        } else {
            this.evalExpression = undefined;
        }
    },

    displayExpression: function() {
        if (this.evalExpression !== undefined) {
            this.textString = '=' + this.evalExpression;
        }
    },
    getContent: function() {
        var content = this.textString,
            floatValue = parseFloat(content);
        if (isNaN(floatValue)) {
            return content;
        }
        return floatValue;
    },













});
lively.morphic.Text.subclass('lively.morphic.DataGridColHead',
'default category', {
    initialize: function($super, arg1, arg2) {
        $super(arg1, arg2);
        this.setFill(Color.rgb(220, 220, 200));
    },
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },

});
lively.morphic.Morph.subclass('lively.morphic.TabContainer',
'default category', {

    initialize: function($super, tabBarStrategy) {
        $super();    
        if (!tabBarStrategy) {
            tabBarStrategy = new lively.morphic.TabStrategyTop();
        }
        this.setTabBarStrategy(tabBarStrategy);
        this.tabPaneExtent = pt(600,400);
        this.initializeTabBar();
        var newExtent = this.getTabBarStrategy().
            calculateInitialExtent(this.tabBar, this.tabPaneExtent);
        this.setExtent(newExtent);
        this.setBorderWidth(1);
        this.setBorderColor(Color.gray);
        tabBarStrategy.applyTo(this);
    },

    initializeTabBar: function() {
        this.tabBar = new lively.morphic.TabBar(this);
        this.addMorph(this.tabBar);
        //this.getTabBarStrategy().adjustTabBar(this.tabBar);
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
        var otherContainers = this.world().withAllSubmorphsSelect(function(ea) {return ea.isTabContainer();});

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
    isTabContainer: function() {
        return true;
    },

    adoptTabFromContainer: function(aTab, aContainer) {
        if (aTab.constructor.name == 'String') {
            aTab = aContainer.getTabByName('Bar');
        }    
        aContainer.getTabBar().removeTab(aTab);
        this.getTabBar().addTab(aTab);
    },   

    activeTab: function() {
        return this.getTabBar().getTabs().detect(function(ea) { return ea.isActive });
    },

    activePane: function() {
        return this.activeTab().getPane();
    },
});

lively.morphic.Morph.subclass('lively.morphic.TabBar',
'default category', {

    initialize: function($super, tabContainer) {
        $super();
        this.tabContainer = tabContainer;
        this.setFill(Color.gray);
        this.setBorderWidth(1);
        this.setBorderColor(Color.gray);
        var width = tabContainer.getTabBarStrategy().getTabBarWidth(tabContainer);
        this.setExtent(pt(width, this.getDefaultHeight()));
        this.draggingEnabled = this.grabbingEnabled = false;
        this.tabs = [];
    },
    getDefaultHeight: function() {
        return 30;
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
        aTab.getPane().remove();
        aTab.remove();
        this.unregisterTab(aTab);
    },
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
        this.getTabs().forEach(function(ea) {
            ea.deactivate();});
        if (aTab.constructor.name == 'String') {
            aTab = this.getTabByName(aTab);
        }
        aTab.activate();
    },
    deactivateTab: function(aTab) {
        aTab.deactivate();
    },
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'add tab', function(evt) {
            self.addTabLabeled('New Tab');
        }])
        return items;
    },
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
    getTabContainer: function() {
        return this.tabContainer;
    },
    adjustTabSizes: function(aPoint) {
        this.getTabs().forEach(function(ea) {
            ea.getPane().adjustToNewContainerSize(aPoint);});
        this.setExtent(this.getTabContainer().getTabBarStrategy().
            tabBarExtent(this.getTabContainer()));
    
    },




    
});
lively.morphic.Morph.subclass('lively.morphic.Tab',
'default category', {

    initialize: function($super, tabBar) {
        $super();
        this.tabBar = tabBar;
        this.tabBarOffset = 0;
        this.setFill(Color.gray);
        this.setBorderWidth(1);
        this.setBorderColor(Color.gray);
        this.initializePane(this.getTabContainer().getTabPaneExtent());
        this.initializeLabel('Tab');
        this.draggingEnabled = this.grabbingEnabled = false;
        var labelExtent = this.label.getExtent();
        this.setExtent(pt(labelExtent.x + 10, labelExtent.y + 10));
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

    getTabContainer: function() {
        return this.getTabBar().getTabContainer();
    },
    setLabel: function(aString) {
        this.label.textString = aString;
        this.setName(aString);
        this.getPane().setName(aString + ' - Pane');
        this.getTabBar().rearrangeTabs();
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



    onMouseDown: function(evt) {
        this.getTabBar().activateTab(this);
    },
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

    resizePane: function(newExtent) {
        this.pane.isInResizeCycle = true;
        this.pane.setExtent(newExtent);
        delete this.pane.isInResizeCycle;
    },
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
        this.setFill(Color.white);
        delete this.isInActivationCycle;
        this.isActive = true;
        this.getPane().onActivate();
    },
    deactivate: function() {
        this.setFill(Color.gray);
        this.isActive = false;
    },
    addCloseButton: function() {
        var closer = new lively.morphic.Button;
        closer.setLabel("X")
        closer.label.fit();
        closer.setExtent(pt(20,20))
        this.addMorph(closer)
        closer.setPosition(pt(this.getExtent().x - 23,6))
        connect(closer, "fire", this, "closeTab", {});
        this.closeButton = closer;
        return this;
    },
    closeTab: function() {
        var toolPane = this.owner.owner;
        this.owner.removeTab(this);
        if(toolPane.tabBar.getTabs().length == 0) {
            if (toolPane.owner instanceof lively.morphic.Window)
                toolPane.owner.remove();
        }
    },








});
lively.morphic.Morph.subclass('lively.morphic.TabPane',
'default category', {
    initialize: function($super, tab, extent) {
        $super();
        this.tab = tab;
        this.tabBar = tab.getTabBar();
        this.setFill(Color.white);
        this.setBorderWidth(1);
        this.setBorderColor(Color.gray);
        this.setExtent(extent);
        
        this.draggingEnabled = this.grabbingEnabled = false;    

    },
    getTab: function() {
        return this.tab;
    },
    getTabContainer: function() {
        return this.getTab().getTabContainer();
    },
    activateTab: function(aTab) {
        // convenience: allow my submorphs to call
        // this.owner.activateTab(...) to navigate
        this.getTabContainer().activateTab(aTab);
    },



    
    setExtent: function($super, aPoint) {
        $super(aPoint);
        var container = this.getTabContainer();
        this.adjustClipping(aPoint);
        if (!this.isInResizeCycle) {
            container.onResizePane(aPoint);
        }
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
        $super(aMorph);
        this.adjustClipping(this.getExtent());
    },
    removeMorph: function($super, aMorph) {
        $super(aMorph);
        this.adjustClipping(this.getExtent());
    },








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
        aTabBar.setExtent(pt(aTabBar.getTabContainer().getTabPaneExtent().x, aTabBar.getDefaultHeight()));
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
lively.morphic.Morph.addMethods({
    isTabContainer: function() { return false; },


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
    },


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

}) // end of module












