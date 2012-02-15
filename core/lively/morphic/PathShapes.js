module('lively.morphic.PathShapes').requires('lively.morphic.Shapes').toRun(function() {

// --------------------
// --------- Paths ----
// --------------------
// see http://www.w3.org/TR/SVG/paths.html

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.Path',
'documentation', {
    documentation: "Generic Path with arbitrary Bezier curves",
},
'initalizing', {
    initialize: function(vertices) {
        this.dontChangeShape = false;
        this.setVertices(vertices);
        return this;
    },
},
'accessing', {
    setPathElements: function(elts) {
        this.cachedVertices = null;
        this.shapeSetter('PathElements', elts)
    },
    getPathElements: function() { return this.shapeGetter('PathElements') || [] },
    setVertices: function(vertlist) {
        if (this.dontChangeShape) return;
        var elements = this.getPathElements();
        for (var i = 0; i < vertlist.length; i++) {
            var elem = elements[i], p = vertlist[i];
            if (elem) { elem.x = p.x; elem.y = p.y; continue }
            if (p.isPathElement) { elements.push(p); continue } // FIXME use setElements instead?!
            if (p instanceof lively.Point) {
                var klass = i == 0 ? lively.morphic.Shapes.MoveTo : lively.morphic.Shapes.LineTo;
                elements.push(new klass(true, p.x, p.y));
                continue;
            }
            throw new Error('Cannot do setVertives with vertex ' + p)
        }

        // if there were more elements before than remove the remaining
        elements = elements.slice(0, i);

        this.setPathElements(elements);
    },
    vertices: function() {
        // [DI] Note this is a test only -- not all path elements will work with this
        //if (this.cachedVertices != null) return this.cachedVertices;
        //this.cachedVertices = [];
        var cachedVertices = [];
        this.getPathElements().forEach(function(el) {
            var vertex = el.controlPoints().last(); // FIXME controlPoints method should be fixed!
            //if (vertex) this.cachedVertices.push(vertex);
            if (vertex) { cachedVertices.push(vertex); }
        }, this);
        return cachedVertices;
        //return this.cachedVertices;
    },
    getBounds: function() {
        //return this.renderContextDispatch('getPathBounds');
        var vertices = this.vertices(),
            minX = vertices.min(function(ea) { return ea.x; }),
            minY = vertices.min(function(ea) { return ea.y; }),
            maxX = vertices.max(function(ea) { return ea.x; }),
            maxY = vertices.max(function(ea) { return ea.y; });
        return rect(pt(minX-1, minY-1), pt(maxX, maxY));
    },
    getExtent: function() {
        return this.getBounds().extent()
    },
    getTotalLength: function() { return this.renderContextDispatch('getTotalLength') },
    getPointAtTotalLength: function(length) {
        return this.renderContextDispatch('getPointAtTotalLength', length) },

    getPointAtLength: function(relativeLength) {
        return this.getPointAtTotalLength(this.getTotalLength() * relativeLength);
    },
    getBorderWidth: function($super) { 
        var result = $super();
        return result === undefined ? 1 : result;
    },
},
'rendering', {
    createSVGDataFromElements: function(elements) {
        var attr = "";
        for (var i = 0; i < elements.length; i++)
            attr += elements[i].attributeFormat() + " ";
        return attr
    },
});
lively.morphic.Shapes.Path.addMethods(
'settings', {
    hasElbowProtrusions: true,
    showInsertionPoints: false,
    controlPointProximity: 10,
},
'accessing', {
    setVerticesAndControls: function(verts, ctrls, closed) {
        // Complete hack only so that we can play with editing.  
        // May leaves garbage in DOM

        // copied from Morph.makeCurve...
        var g = lively.morphic.Shapes, cmds = [];
        cmds.push(new g.MoveTo(true, verts[0].x,  verts[0].y));
        for (var i = 1; i < verts.length; i++) {
            var el = ctrls[i] ?
                new g.QuadCurveTo(true, verts[i].x, verts[i].y, ctrls[i].x, ctrls[i].y) :
                new g.LineTo(true, verts[i].x, verts[i].y);
            cmds.push(el);
        }
        this.setElements(cmds);
    },    
    controlPoints: function() {
        // [DI] Note this is a test only -- no caching, not all path elements will work with this
        var ctls = [];
        this.getPathElements().forEach(function(el) { 
            var cs = el.controlPoints();  // cs = [vert] or [p1, vert] or [p1, p2, vert]
            ctls.push(cs.slice(0,cs.length-1));   // this is cs.butLast, ie [] or [p1] or [p1, p2]
        });
        return ctls;
    },
    // poorman's traits :)
    partNameNear: function(p) {
        var codes = this.allPartNames();
        for (var i=0; i<codes.length; i++)
            if (this.partPosition(codes[i]).dist(p) < this.controlPointProximity) return codes[i];
        return null;
    },
    allPartNames: function() {
        // Note: for reshaping of polygons and lines, the "partNames" are
        //  integer codes with the following meaning...
        //    0...(N-1)  -- the N vertices themselves
        //    -1...-N  -- negative of the line segment index for inserting a new vertex
        //  This scheme may also be extended to curves as follows...
        //    N...(2N-1)  -- first control point for the given (i-N)-th line segment
        //  2N...(3N-1)  -- second control point for the (i-2N)-th line segment
        // This encoding scheme is shared also by partPosition() and reshape()

        // Vertices...
        var locs = [], verts = this.vertices();
        for (var i = 0; i < verts.length; i++) locs.push(i);  // vertices

        // Midpoints (for insertion)
        // Some polygons have last point = first; some don't
        if (this.showInsertionPoints) {  // Note: this wont work right for paths yet
            var nLines = (verts.first().eqPt(verts.last())) ? verts.length-1 : verts.length;
            for (var i = 0; i < nLines; i++) locs.push(-(i + 1)); // midpoints
        }

        // Control points
        var N = verts.length,
            ctls = this.controlPoints();
        for (var i = 0; i < ctls.length; i++) { 
            var cs = ctls[i];
            if (cs.length > 0) locs.push(N + i);  // first control pt for curve elements
            if (cs.length > 1) locs.push(2*N + i);  // second control pt for curve elements
        };
        return locs; 
    },

    partPosition: function(partName) {
        // See the comment in allPartNames
        // Here we decode the "partName" index to select a vertex, midpoint or control point
        var verts = this.vertices(), N = verts.length;

        // Midpoint of segment
        if (partName < 0) {  
            // Check for midpoint of last segment when first vertex is not duplicated
            return -partName > (verts.length-1) ?
                verts[-partName - 1].midPt(verts[0]) :
                verts[-partName].midPt(verts[-partName - 1]);
        }
        // Normal vertex
        if (partName < N) return verts[partName];

        var ctls = this.controlPoints();
        // First control point
        if (partName < N*2) return ctls[partName - N][0];

        // Second control point
        if (partName < N*3) return ctls[partName - N*2][1];
console.warn("can't find partName = " + partName);
console.warn("verts = " + Object.inspect(verts));
console.warn("ctls = " + Object.inspect(ctls));
    },

},
'testing', {
    containsPoint: function(p) { return this.bounds().containsPoint(p) },
},
'normalizing', {
    normalize: function(hintX, hintY) {
        // when elements are translated and are not beginning
        // in origin translate them so they do
        var first = this.getPathElements()[0];
        if (first.constructor != lively.morphic.Shapes.MoveTo) {
            console.warn('cannot normalize path not beginning with MoveTo');
            return;
        }
        var x = first.x * -1 + (hintX || 0),
            y = first.y * -1 + (hintY || 0),
            isFirst = true,
            elements = this.getPathElements();
        for (var i = 0; i < elements.length; i++) {
            elements[i].translate(x, y, isFirst);
            isFirst = false;
        }
        this.setPathElements(this.getPathElements());
    },
},
'updating', {
    reshape: function(ix, newPoint, lastCall) {
        // See the comment in allPartNames
        // Here we decode the "partName" index to select a vertex, midpoint or control point
        // and then replace that point with newPoint, and update the shape

        // ix is an index into vertices
        var verts = this.vertices(),  // less verbose
            ctrls = this.controlPoints().map(function(elt) {return elt[0]; });
        if (!ctrls[0]) ctrls[0] = ctrls[1];
        if (ix < 0) { // negative means insert a vertex
            ix = -ix;
            verts.splice(ix, 0, newPoint);
            ctrls.splice(ix, 0, null); // inserting null as ctrlPt currently means that we get a LineTo
            this.setVerticesAndControls(verts, ctrls);
            return; // undefined result for insertion 
        }
        var N = verts.length,
            closed = verts[0].eqPt(verts[verts.length - 1]);
        if (ix >= N) {
            // Edit a control point
            ctrls[ix-N] = newPoint;
//console.log("verts = " + Object.inspect(verts));
//console.log("ctrls = " + Object.inspect(ctrls));
            this.setVerticesAndControls(verts, ctrls, closed);
            return false; // normal -- no merging
        }
        if (closed && ix == 0) {  // and we're changing the shared point (will always be the first)
            verts[0] = newPoint;  // then change them both
            verts[verts.length - 1] = newPoint; 
        } else {
            verts[ix] = newPoint;
        }

        var shouldMerge = false,
            howClose = 6;
        if (verts.length > 2) {
            // if vertex being moved is close to an adjacent vertex, make handle show it (red)
            // and if its the last call (mouse up), then merge this with the other vertex
            if (ix > 0 && verts[ix - 1].dist(newPoint) < howClose) {
                if (lastCall) { 
                    verts.splice(ix, 1); 
                    if (closed) verts[0] = verts[verts.length - 1]; 
                } else {
                    shouldMerge = true;
                } 
            }

            if (ix < verts.length - 1 && verts[ix + 1].dist(newPoint) < howClose) {
                if (lastCall) { 
                    verts.splice(ix, 1); 
                    if (closed) verts[verts.length - 1] = verts[0];
                } else {
                    shouldMerge = true;
                } 
            }
        }
        this.setVerticesAndControls(verts, ctrls, closed); 
        return shouldMerge;
    },
});

Object.subclass('lively.morphic.Shapes.PathElement',
'default', {
    isPathElement: true,
    initialize: function(isAbsolute) {
        this.isAbsolute = isAbsolute;
    },
    realCharCode: function() {
        return this.isAbsolute ? this.charCode.toUpperCase() : this.charCode.toLowerCase();
    },
    attributeFormat: function() {
        throw new Error('subclass responsiblity');
    },
    translate:function(x, y, force) {
        throw new Error('subclass responsiblity (' + this.constructor.type + ')');
    },
    translatePt:function(p) { return this.translate(p.x, p.y, true) },
    toString: function() { return 'PathElement("' + this.attributeFormat() + '")' },
},
'helper', {
    printSafeNumber: function(n) {
        // svg cannot use eXX numbers in the path array, so we fix tge number printing
        return Math.min(n, 1e20).toFixed(4);
    },
});

Object.extend(lively.morphic.Shapes.PathElement, {
    parse: function(data) {
        var
            splitNumberRegex = /[\s*,\s*]+/,
            splitTypeAndNumberRegex = /(NaN|[^a-df-zA-Z]+)?([A-Za-df-z])?(NaN|[^a-df-zA-Z]+)?/,
            typeTestRegex = /[a-df-zA-Z]/,
            typeAbsTestRegex = /[A-Z]/;

        // split number pairs
        var chunks = data.split(splitNumberRegex);
        // split up types
        chunks = chunks.inject([], function(all, chunk) {
            var splitted = splitTypeAndNumberRegex.exec(chunk);
            if (!splitted) return all;
            if (splitted[1] !== undefined)
                all.push(splitted[1]);
            if (splitted[2] !== undefined)
                all.push(splitted[2]);
            if (splitted[3] !== undefined)
                all.push(splitted[3]);
            return all;
        });

        // create PathElement objects from splitted data
        var
            pathElementClasses = lively.morphic.Shapes.PathElement.allSubclasses(),
            pathElements = [],
            klass = null,
            currentChunks = [],
            isAbsolute;
        while (chunks.length > 0) {
            var chunk = chunks.shift()
            if (typeTestRegex.test(chunk)) {
                isAbsolute = typeAbsTestRegex.test(chunk);
                var klass = pathElementClasses.detect(function(klass) {
                    return klass.prototype.charCode == chunk.toUpperCase();
                });
                if (!klass)
                    throw dbgOn(new Error('Trying to parse SVG path elements. No support for ' + chunk));
            } else {
                currentChunks.push(Number(chunk) || 0);
            };
            if (currentChunks.length == klass.dataLength) {
                pathElements.push(klass.create(isAbsolute, currentChunks));
                currentChunks = [];
            }
        }
        return pathElements;
    },    
});

lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.MoveTo', {
    charCode: 'M',

    initialize: function($super, isAbsolute, x, y) {
        $super(isAbsolute);
        this.x = x;
        this.y = y;
    },


    controlPoints: function() {
        return [pt(this.x, this.y)];
    },
    
    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.x) + "," + this.y;
    },
    
    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.x += x;
        this.y += y;
    },
});

Object.extend(lively.morphic.Shapes.MoveTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.MoveTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0);
    },
    parse: function(data) {
        var codeExtractor = /([A-Za-z])\s?(-?[0-9]+(?:.[0-9]+)?|NaN),(-?[0-9]+(?:.[0-9]+)?|NaN)/;
    },
    dataLength: 2,
    create: function(isAbsolute, arr) { return new this(isAbsolute, arr[0], arr[1]) },
});


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.LineTo', {
    charCode: 'L',
    initialize: function($super, isAbsolute, x, y) {
        $super(isAbsolute);
        this.x = x;
        this.y = y;
    },

    controlPoints: function() {
        return [pt(this.x, this.y)];
    },
    
    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.x) + "," + this.y;
    },
    
    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        //this.charCode = 'L';
        this.x += x;
        this.y += y;
        // fix vertical and horizontal lines that would not be displayed otherwise
        /*if (this.x === 0) { 
            this.x = 1; 
            this.charCode = 'V';
        }
        if (this.y === 0) { 
            this.y = 1; 
            this.charCode = 'H';
        }*/ // see ControlPoint>>moveBy
    },
});

Object.extend(lively.morphic.Shapes.LineTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.LineTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0);
    },
    dataLength: 2,
    create: function(isAbsolute, arr) { return new this(isAbsolute, arr[0], arr[1]) },
});


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.HorizontalTo', {
    charCode: 'H',
    initialize: function($super, isAbsolute, x) {
        $super(isAbsolute);
        this.x = x;
    },

    controlPoints: function() {
        return [];
    },
    
    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.x);
    },
    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.x += x;
    },
});

Object.extend(lively.morphic.Shapes.HorizontalTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.HorizontalTo(literal.isAbsolute, literal.x || 0.0);
    },
    dataLength: 1,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute, arr[0])
    },
});


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.VerticalTo', {
    charCode: 'V',
    initialize: function($super, isAbsolute, y) {
        $super(isAbsolute);
        this.y = y;
    },

    controlPoints: function() {
        return [];
    },
    
    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.y);
    },
    
    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.y += y;
    },
});

Object.extend(lively.morphic.Shapes.VerticalTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.VerticalTo(literal.isAbsolute, literal.y || 0.0);
    },
    dataLength: 1,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute, arr[0])
    },
});


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.CurveTo', {

    charCode: 'T', // shouldn't it be the S type anyway?

    initialize: function($super, isAbsolute, x, y) {
        $super(isAbsolute);
        this.x = x;
        this.y = y;
    },

    controlPoints: function() {
        return [pt(this.x, this.y)];
    },
    
    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.x) + "," + this.printSafeNumber(this.y);
    },
    
    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.x += x;
        this.y += y;
    },
});

Object.extend(lively.morphic.Shapes.CurveTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.CurveTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0);
    },
    dataLength: 2,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute, arr[0], arr[1])
    },
});

lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.QuadCurveTo', {

    charCode: 'Q',

    initialize: function($super, isAbsolute, x, y, controlX, controlY) {
        $super(isAbsolute);
        this.x = x;
        this.y = y;
        this.controlX = controlX;
        this.controlY = controlY;
    },

    controlPoints: function() {
        return [pt(this.controlX, this.controlY), pt(this.x, this.y)];
    },

    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.controlX) + "," + this.printSafeNumber(this.controlY) + " " + this.printSafeNumber(this.x) + "," + this.printSafeNumber(this.y);
    },

    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.x += x;
        this.y += y;
        this.controlX += x;
        this.controlY += y;
    },
});

Object.extend(lively.morphic.Shapes.QuadCurveTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.QuadCurveTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
            literal.controlX || 0.0, literal.controlY || 0.0);
    },
    dataLength: 4,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute, arr[2], arr[3], arr[0], arr[1])
    },
}); 


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.BezierCurve2CtlTo', {

    charCode: 'C',

    initialize: function($super, isAbsolute, x, y, controlX1, controlY1, controlX2, controlY2) {
        $super(isAbsolute);
        this.x = x;
        this.y = y;
        this.controlX1 = controlX1
        this.controlY1 = controlY1
        this.controlX2 = controlX2
        this.controlY2 = controlY2
    },

    controlPoints: function() {
        return [
            pt(this.controlX1, this.controlY1),
            pt(this.controlX2, this.controlY2),
            pt(this.x, this.y)];
    },

    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.controlX1) + "," + this.printSafeNumber(this.controlY1) + " " + this.printSafeNumber(this.controlX2) + "," + this.printSafeNumber(this.controlY2) + " " + this.printSafeNumber(this.x) + "," + this.printSafeNumber(this.y);
    },
    
    translate: function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.x += x;
        this.y += y;
        this.controlX1 += x;
        this.controlY1 += y;
        this.controlX2 += x;
        this.controlY2 += y;
    },

});

Object.extend(lively.morphic.Shapes.BezierCurve2CtlTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.BezierCurve2CtlTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
            literal.controlX1 || 0.0, literal.controlY1 || 0.0,
            literal.controlX2 || 0.0, literal.controlY2 || 0.0);
    },
    dataLength: 6,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute, arr[4], arr[5], arr[0], arr[1], arr[2], arr[3])
    },
});


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.BezierCurve1CtlTo', {

    charCode: 'S',

    initialize: function($super, isAbsolute, x, y, controlX2, controlY2/*no typo*/) {
        $super(isAbsolute);
        this.x = x;
        this.y = y;
        this.controlX2 = controlX2
        this.controlY2 = controlY2
    },

    controlPoints: function() {
        return [pt(this.controlX2, this.controlY2), pt(this.x, this.y)];
    },

    attributeFormat: function() {
        return this.realCharCode() + this.printSafeNumber(this.controlX2) + "," + this.printSafeNumber(this.controlY2) + " " + this.printSafeNumber(this.x) + "," + this.printSafeNumber(this.y);
    },
    
    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.x += x;
        this.y += y;
        this.controlX2 += x;
        this.controlY2 += y;
    },

});

Object.extend(lively.morphic.Shapes.BezierCurve1CtlTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.BezierCurve1CtlTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
            literal.controlX2 || 0.0, literal.controlY2 || 0.0);
    },
    dataLength: 4,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute, arr[2], arr[3], arr[0], arr[1])
    },
});


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.ArcTo', {

    charCode: 'A',

    initialize: function($super, isAbsolute, x, y, rx, ry, xRotation, largeFlag, sweepFlag) {
        $super(isAbsolute);
        this.x = x;
        this.y = y;
        this.rx = rx;
        this.ry = ry;
        this.xRotation = xRotation;
        this.largeFlag = largeFlag;
        this.sweepFlag = sweepFlag;
    },

    controlPoints: function() {
        return [pt(this.rx, this.ry), pt(this.x, this.y)];
    },

    attributeFormat: function() {
        return this.realCharCode() + this.rx + "," + this.ry + " " + this.xRotation + " " + this.largeFlag + " " + this.sweepFlag + " " + this.x + "," + this.y;
    },
    
    translate:function(x, y, force) {
        if (!this.isAbsolute && !force) return;
        this.x += x;
        this.y += y;
    },

});

Object.extend(lively.morphic.Shapes.ArcTo, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.ArcTo(literal.isAbsolute, literal.x || 0.0, literal.y || 0.0, 
            literal.rx || 0, literal.ry || 0, literal.xRotation || 0, literal.largeFlag || 0, literal.sweepFlag || 0);
    },
    dataLength: 7,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute, arr[5], arr[6], arr[0], arr[1], arr[2], arr[3], arr[4])
    },
});


lively.morphic.Shapes.PathElement.subclass('lively.morphic.Shapes.ClosePath', {

    charCode: 'Z',

    controlPoints: function() {
        return [];
    },
    
    attributeFormat: function() {
        return this.realCharCode();
    },
    
    translate:function(x, y, force) {},
});

Object.extend(lively.morphic.Shapes.ClosePath, {
    fromLiteral: function(literal) {
        return new lively.morphic.Shapes.ClosePath(literal.isAbsolute); // necessary?
    },
    dataLength: 0,
    create: function(isAbsolute, arr) {
        return new this(isAbsolute)
    },
});

}) // end of module
