
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FIXME adding an external JS file as a module dependency should be integrated
// into the module system
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
Object.extend(apps.paperjs, {

    hasPendingRequirements: apps.paperjs.hasPendingRequirements.wrap(function(proceed) {
        return proceed() || !this.libLoaded();
    }),

    libLoaded: function() { return !!Global.paper; }
});

(function loadPaperjs() {
    var url = URL.codeBase.withFilename('lib/paper.js').toString();
    JSLoader.loadJs(url);
    apps.paperjs.loadTestPolling = Global.setInterval(function() { apps.paperjs.load(); }, 50);
})();

module('apps.paperjs').requires('lively.morphic.AdditionalMorphs').toRun(function() {

(function setupPaperjs() {
    Global.clearInterval(apps.paperjs.loadTestPolling);
    // paper.install(apps.paperjs);
})();

lively.morphic.CanvasMorph.subclass('apps.paperjs.Morph',
'initializing', {

    initialize: function($super) {
        $super();
    },

    ensureShapeId: function() {
        var id = this.getStyleId();
        if (id) return id;
        if (!this.id) this.setNewId();
        return this.setStyleId(this.id);
    }

},
'HTML rendering', {

    onRenderFinishedHTML: function($super, ctx) {
        $super(ctx);
        this.ensureShapeId();
        var canvas = ctx.shapeNode;

        paper.setup(canvas);
        ctx.path = new paper.Path();
    },

    adaptCanvasSizeHTML: function(ctx, extent) {
        var view = paper.getView();
        view.setViewSize(extent);
        // var $node = $(ctx.shapeNode),
        //     x = $node.width(),
        //     y = $node.height();
        // $node.attr('width', x);
        // $node.attr('height', y);
    },

    drawSomething: function() {
        var view = paper.getView();
        view.setViewSize(this.getExtent());

        var path = this.renderContext().path;
        // Give the stroke a color
        path.strokeColor = 'black';
        start = new paper.Point(100, 100);
        // Move to start and draw a line from there
        path.moveTo(start);
        // Note that the plus operator on Point objects does not work
        // in JavaScript. Instead, we need to call the add() function:
        path.lineTo(start.add([ 200, -50 ]));
        // Draw the view now:
        paper.view.draw();
    }

});


lively.morphic.Shapes.External.subclass('apps.paperjs.PathShape',
'initializing', {
    initialize: function($super, paperSpec) {
        this.shapeNode = paperSpec.view;
        this.setNodeId(this.shapeNode.getAttribute('id'));
    }
},
'accessing', {
    getPath: function() {
        return this.renderContext().path;
    },

    setVertices: function(vertices) {
        var path = this.getPath();
        path.strokeColor = 'black';
        path.strokeWidth = 4;

        if (vertices.length === 0) {
            path.removeSegments();
            path.moveTo(pt(0,0));
            return vertices;
        }

        var newLength = vertices.length,
            oldLength = path.segments.length, i;
        // set points of old segments to vertices
        for (i = 0 ; i < newLength && i < oldLength; i++) {
            path.segments[i].point = new paper.Point(vertices[i].x, vertices[i].y);
        }
        // if newLength > oldLength, add new segments
        for (i = oldLength; i < newLength; i++) {
            path.lineTo(new paper.Point(vertices[i].x, vertices[i].y));
        }
        // remove segments that are no longer needed
        for (i = newLength; i < oldLength; i++) { path.removeSegment(i); }

        this.setExtent(this.getExtent());

        return vertices;
    },

    getVertices: function() {
        return this.getPath().segments.collect(function(seg) {
            return lively.Point.ensure(seg.point); });
    }

},
'geometry', {
    normalizeVertices: function() {
        var minX = Infinity, minY = Infinity,
            path = this.getPath();
        path.segments.forEach(function(ea) {
            minX = Math.min(minX, ea.point.x);
            minY = Math.min(minY, ea.point.y);
        });
        path.translate(new paper.Point(-minX, -minY));
        return pt(minX, minY);
    }
},
'HTML rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.path) {
            ctx.path = new paper.Path();
            ctx.path.moveTo(pt(0,0)); // to initialize bounds and stuff
        }
        $super(ctx);
    },

    getExtentHTML: function(ctx) {
        return pt(ctx.path.bounds.width, ctx.path.bounds.height);
    },

    setExtentHTML: function($super, ctx, extent) {
        $super(ctx, extent);
        if (ctx.shapeNode) {
            var redraw = false,
                view = this.getPath().project.view,
                size = view.viewSize;
            debugger
            if (size.width !== extent.x) {
                redraw = true;
            }
            if (size.height !== extent.y) {
                redraw = true;
            }
            if (redraw) {
                view.viewSize = new paper.Point(extent);
                // view.draw();
            }
        }
    }
});

lively.morphic.Morph.subclass('apps.paperjs.Path',
'initializing', {
    initialize: function($super, vertices) {
        var paperInit = this.initializePaperjsCanvas(),
            shape = new apps.paperjs.PathShape(paperInit);
        $super(shape);
        shape.setVertices(vertices);
        this.disableGrabbing();
        this.enableDragging();
    },

    initializePaperjsCanvas: function() {
        var element = XHTMLNS.create('canvas'),
            id = 'paperjs-canvas-' + Date.now();
        element.setAttribute('id', id);

        var morph = this;
        paper.setup(element);
        // var tool = this.tool = new paper.Tool();
        // tool.onMouseDown = function(evt) {
        //     debugger
        //     Global.Hit=path.hitTest(evt.point);
        //     return morph.onMouseDown(evt);
        // }
        // tool.activate();

        return {view: element, project: paper.project};
    }

},
"accessing", {
    setVertices: function(verts) {

        // normalize
        var offset
        // var x = first.x * -1 + (hintX || 0),
        //     y = first.y * -1 + (hintY || 0),
        //     isFirst = true,
        //     elements = this.getPathElements();
        // for (var i = 0; i < elements.length; i++) {
        //     elements[i].translate(x, y, isFirst);
        //     isFirst = false;
        // }
        // this.setPathElements(this.getPathElements());



        this.getShape().setVertices(verts);
    },
    getVertices: function() { return this.getShape().getVertices(); },
    getPath: function() { return this.getShape().getPath(); },
    paperjsPoint: function(x, y) {
        // cal with one arg: point, or two: x, y coords
        return y === undefined ? new paper.Point(x.x, x.y) : new paper.Point(x, y);
    },
    paperjsLocalPoint: function(point) {
        var local = this.localize(point).addPt(this.getOrigin());
        return this.paperjsPoint(local);
    },

    toLivelyGlobalPt: function(point) {
        return this.worldPoint(Point.ensure(point)).subPt(this.getOrigin());
    }
},
'path management', {

    normalizePath: function() {
        var offset = this.getShape().normalizeVertices();
        this.moveBy(offset);
    },

    pathHit: function(tolerance, globalPos) {
        var path = this.getPath(),
            paperPos = this.paperjsLocalPoint(globalPos);
        return path.hitTest(paperPos, {tolerance: tolerance, segments: true, stroke: true});
    },

    findNearestSegment: function(globalPos, tolerance, hit) {
        tolerance = tolerance || 10;
        var path = this.getPath();
        hit = hit || this.pathHit(tolerance, globalPos);
        if (!hit) return null;
        var localPos = this.localize(globalPos),
            paperPos = new paper.Point(localPos.x, localPos.y),
            loc = path.getNearestLocation(paperPos);
        if (!loc) return null;
        var segBefore = path.segments[loc.index],
            segAfter = path.segments[loc.index+1],
            dist1 = segBefore ? paperPos.getDistance(segBefore.point, true) : Infinity,
            dist2 = segAfter ? paperPos.getDistance(segAfter.point, true) : Infinity;

        if (dist1 > tolerance*tolerance && dist2 > tolerance*tolerance) return null;
        return dist1 < dist2 ? segBefore : segAfter;
    },

    onMouseDown: function(evt) {
        var path = this.getPath(),
            seg = this.findNearestSegment(evt.getPosition(), 100, evt.pathHit);
        if (seg) show(this.toLivelyGlobalPt(seg.point));
    },

    onDragStart: function(evt) {
        this.selectedSegment = this.findNearestSegment(evt.getPosition(), 100, evt.pathHit);
        return true;
    },

    onDragEnd: function(evt) {
        this.selectedSegment = null;
        return true;
    },

    onDrag: function(evt) {
        if (!this.selectedSegment) return false;
        var pos = this.localize(evt.getPosition()),
            point = new paper.Point(pos.x, pos.y);
        point = point.subtract(this.getOrigin());
        this.selectedSegment.point = point;
        var offset = this.normalizePath();
        this.setExtent(this.getExtent());
        return true;
    },

    // onMouseMove: function(evt) {
    //     var path = this.getPath(),
    //         seg = this.findNearestSegment(evt.getPosition(), 10, evt.pathHit);
    //     if (!seg) return false;
    //     seg.point = new paper.Point(pos.x, pos.y);
    // },

    onMouseDownEntry: function($super, evt) {
        evt.pathHit = this.pathHit(10, evt.getPosition());
        if (!evt.pathHit) {
            var other =  this.morphBeneath(evt.getPosition());
            return other ? other.onMouseDownEntry(evt) : false;
        };
        return $super(evt);
    },

    onMouseUpEntry: function($super, evt) {
        evt.pathHit = this.pathHit(10, evt.getPosition());
        if (!evt.pathHit) {
            var other =  this.morphBeneath(evt.getPosition());
            return other ? other.onMouseUpEntry(evt) : false;
        };
        return $super(evt);
    }

},
'FIXME to make it compatible', {
    setStyleId: Functions.Null,
    getStyleId: function() { return this.getShape().getNodeId(); }
});

}); // end of module
