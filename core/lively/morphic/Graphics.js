module('lively.morphic.Graphics').requires('apps.ColorParser').toRun(function() {

Object.subclass("lively.Point",
'documentation', {
    documentation: "2D Point"
},
'initializing', {
    initialize: function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
        return this;
    }
},
'serializing', {
    deserialize: function(importer, string) {
        // reverse of toString
        var array = string.slice(3, -1).split(',');
        this.x = lively.data.Coordinate.parse(array[0]);
        this.y = lively.data.Coordinate.parse(array[1]);
    },
},
'accessing', {
  getX: function() { return this.x; },
  getY: function() { return this.y; }
},
'arithmetic', {
    toFixed: function(val) {
        return new lively.Point(this.x.toFixed(val), this.y.toFixed(val))
    },

    addPt: function(p) {
        if (arguments.length != 1) throw ('addPt() only takes 1 parameter.');

        return new lively.Point(this.x + p.x, this.y + p.y);
    },

    addXY: function(dx, dy) {
        return new lively.Point(this.x + dx, this.y + dy);
    },

    midPt: function(p) {
        return new lively.Point((this.x + p.x) / 2, (this.y + p.y) / 2);
    },

    subPt: function(p) {
        return new lively.Point(this.x - p.x, this.y - p.y);
    },

    subXY: function(dx, dy) {
        return new lively.Point(this.x - dx, this.y - dy);
    }
},
'transforming', {
    scaleBy: function(scaleX, scaleYOrUndefined) {
        return new lively.Point(this.x * scaleX, this.y * (scaleYOrUndefined||scaleX));
    },

    scaleByPt: function(scalePt) {
        return new lively.Point(this.x * scalePt.x, this.y * scalePt.y);
    },

    negated: function() {
        return new lively.Point(-this.x, -this.y);
    },

    inverted: function() {
        return new lively.Point(1.0 / this.x, 1.0 / this.y);
    },

    invertedSafely: function() {
        return new lively.Point(this.x && 1.0 / this.x, this.y && 1.0 / this.y);
    },
},
'comparing', {
    lessPt: function(p) {
        return this.x < p.x && this.y < p.y;
    },

    leqPt: function(p) {
        return this.x <= p.x && this.y <= p.y;
    },

    eqPt: function(p) {
        return this.x == p.x && this.y == p.y;
    },

    equals: function(p) {
        return this.eqPt(p);
    }
},
'instance creation', {

    withX: function(x) {
        return lively.pt(x, this.y);
    },

    withY: function(y) {
        return lively.pt(this.x, y);
    },

    copy: function() {
        return new lively.Point(this.x, this.y);
    },

    minPt: function(p, acc) {
        if (!acc) acc = new lively.Point(0, 0);
        acc.x = Math.min(this.x, p.x);
        acc.y = Math.min(this.y, p.y);
        return acc;
    },

    maxPt: function(p, acc) {
        if (!acc) acc = new lively.Point(0, 0);
        acc.x = Math.max(this.x, p.x);
        acc.y = Math.max(this.y, p.y);
        return acc;
    },
    random: function() {
        return lively.Point.random(this);
    }

},
'point functions', {
    normalized: function() {
        var r = this.r();
        return lively.pt(this.x / r, this.y / r);
    },

    fastNormalized: function() {
        var r = this.fastR();
        return lively.pt(this.x / r, this.y / r);
    },

    dotProduct: function(p) {
        return this.x * p.x + this.y * p.y
    },

    matrixTransform: function(mx, acc) {
        // if no accumulator passed, allocate a fresh one
        if (!acc) acc = lively.pt(0, 0);
        acc.x = mx.a * this.x + mx.c * this.y + mx.e;
        acc.y = mx.b * this.x + mx.d * this.y + mx.f;
        return acc;
    },

    matrixTransformDirection: function(mx, acc) {
        // if no accumulator passed, allocate a fresh one
        if (!acc) acc = lively.pt(0, 0);
        acc.x = mx.a * this.x + mx.c * this.y;
        acc.y = mx.b * this.x + mx.d * this.y;
        return acc;
    },

    griddedBy: function(grid) {
        return lively.pt(this.x - (this.x % grid.x), this.y - (this.y % grid.y))
    }
},
'geometry computation', {
    roundTo: function(quantum) {
        return new lively.Point(this.x.roundTo(quantum), this.y.roundTo(quantum));
    },

    dist: function(p) {
        var dx = this.x - p.x,
            dy = this.y - p.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    distSquared: function(p) {
        var dx = this.x - p.x,
            dy = this.y - p.y;
        return dx * dx + dy * dy;
    },

    nearestPointOnLineBetween: function(p1, p2) {
        if (p1.x == p2.x) return lively.pt(p1.x, this.y);
        if (p1.y == p2.y) return lively.pt(this.x, p1.y);
        var x1 = p1.x;
        var y1 = p1.y;
        var x21 = p2.x - x1;
        var y21 = p2.y - y1;
        var t = (((this.y - y1) / x21) + ((this.x - x1) / y21)) / ((x21 / y21) + (y21 / x21));
        return lively.pt(x1 + (t * x21), y1 + (t * y21));
    }

},
'converting', {
    asRectangle: function() {
        return new lively.Rectangle(this.x, this.y, 0, 0);
    },

    extent: function(ext) {
        return new lively.Rectangle(this.x, this.y, ext.x, ext.y);
    },

    extentAsRectangle: function() {
        return new lively.Rectangle(0, 0, this.x, this.y)
    },

    lineTo: function(end) {
        return new lively.Line(this, end);
    },

    toTuple: function() {
        return [this.x, this.y];
    },

    toLiteral: function() {
        return {
            x: this.x,
            y: this.y
        };
    }
},
'printing', {
    toString: function() {
        return Strings.format("lively.pt(%1.f,%1.f)", this.x, this.y);
    },
    toShortString: function() {
        return Strings.format("pt(%1.f,%1.f)", this.x, this.y);
    }
},
'debugging', {
    inspect: function() {
        return JSON.serialize(this);
    }
},
'polar coordinates', {
    r: function() {
        // Polar coordinates (theta=0 is East on screen, and increases in CCW
        // direction
        return Math.sqrt(this.x*this.x + this.y*this.y);
    },

    fastR: function() {
        // actually, r() might be faster...
        var a = this.x * this.x + this.y * this.y;
        var x = 17;
        for (var i = 0; i < 6; i++)
        x = (x + a / x) / 2;
        return x;
    },

    theta: function() {
        return Math.atan2(this.y, this.x);
    }
});

Object.extend(lively.Point, {
    ensure: function(duck) {
        if (duck instanceof lively.Point) {
            return duck;
        } else {
            return new lively.Point(duck.x, duck.y);
        }
    },

    polar: function(r, theta) {
        // theta=0 is East on the screen,
        // increases in counter-clockwise direction
        return new lively.Point(r * Math.cos(theta), r * Math.sin(theta));
    },

    random: function(scalePt) {
        return new lively.Point(scalePt.x.randomSmallerInteger(), scalePt.y.randomSmallerInteger());
    },

    fromLiteral: function(literal) {
        return lively.pt(literal.x, literal.y);
    },

    fromTuple: function(tuple) {
        return lively.pt(tuple[0], tuple[1]);
    }
});


Object.subclass('lively.Rectangle',
'documentation', {
    documentation: "primitive rectangle, structually equivalent to SVGRect"
},
'settings', {
    corners: ["topLeft","topRight","bottomRight","bottomLeft"],
    sides: ["leftCenter","rightCenter","topCenter","bottomCenter"]
},
'initializing', {
    initialize: function(x, y, w, h) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = w || 0;
        this.height = h || 0;
    }
},
'accessing', {
  getX: function() { return this.x; },
  getY: function() { return this.y; },
  getWidth: function() { return this.width; },
  getHeight: function() { return this.height; }
},
'instance creation', {
    copy: function() {
        return new lively.Rectangle(this.x, this.y, this.width, this.height);
    },

    toFixed: function(val) {
        return new lively.Rectangle(this.x.toFixed(val), this.y.toFixed(val), this.width.toFixed(val), this.height.toFixed(val));
    },

    withWidth: function(w) {
        return new lively.Rectangle(this.x, this.y, w, this.height)
    },

    withHeight: function(h) {
        return new lively.Rectangle(this.x, this.y, this.width, h)
    },

    withX: function(x) {
        return new lively.Rectangle(x, this.y, this.width, this.height)
    },

    withY: function(y) {
        return new lively.Rectangle(this.x, y, this.width, this.height)
    },

    withExtent: function(ext) {
        return new lively.Rectangle(this.x, this.y, ext.x, ext.y);
    },

    withTopLeft: function(p) {
        return lively.Rectangle.fromAny(p, this.bottomRight())
    },

    withTopRight: function(p) {
        return lively.rect(p.addXY(-this.width,0), p.addXY(0, this.height));
    },

    withBottomRight: function(p) {
        return lively.Rectangle.fromAny(p, this.topLeft())
    },

    withBottomLeft: function(p) {
        return lively.Rectangle.fromAny(p, this.topRight())
    },

    withLeftCenter: function(p) {
        return new lively.Rectangle(p.x, this.y, this.width + (this.x - p.x), this.height)
    },

    withRightCenter: function(p) {
        return new lively.Rectangle(this.x, this.y, p.x - this.x, this.height)
    },

    withTopCenter: function(p) {
        return new lively.Rectangle(this.x, p.y, this.width, this.height + (this.y - p.y))
    },

    withBottomCenter: function(p) {
        return new lively.Rectangle(this.x, this.y, this.width, p.y - this.y)
    },

    withCenter: function(p) {
        return new lively.Rectangle(p.x-this.width/2,p.y-this.height/2,this.width,this.height);
    },

    insetBy: function(d) {
        return new lively.Rectangle(this.x + d, this.y + d, this.width - (d * 2), this.height - (d * 2));
    },

    insetByPt: function(p) {
        return new lively.Rectangle(this.x + p.x, this.y + p.y, this.width - (p.x * 2), this.height - (p.y * 2));
    },

    grid: function(rows, cols) {
        var w = this.width / cols, h = this.height / rows;
        return Grid.mapCreate(rows, cols, function(i, j) {
            return new lively.Rectangle(w*j, h*i, w, h); });
    },

    divide: function(relativeRects) {
        // takes an array of rectangles specifying the relative parts to divide
        // this by. Example:
        // lively.rect(0,0,100,50).divide([lively.rect(0.2,0,0.3,0.5)])
        //   === [lively.rect(20,0,30,25)]
        var orig = this;
        return relativeRects.map(function(relRect) {
            return lively.rect(orig.x + orig.width*relRect.x,
                               orig.y + orig.height*relRect.y,
                               orig.width*relRect.width,
                               orig.height*relRect.height); });
    }
},
'converting', {
    toTuple: function() {
        return [this.x, this.y, this.width, this.height];
    },

    lineTo: function(otherRect) {
        var center1 = this.center(),
            center2 = otherRect.center(),
            lineBetween = center1.lineTo(center2),
            start = this.lineIntersection(lineBetween).first(),
            end = otherRect.lineIntersection(lineBetween).first();
        return start && end && start.lineTo(end);
    }
},
'printing', {
    toString: function() {
        return Strings.format("lively.rect(%s,%s,%s,%s)", this.x, this.y, this.width, this.height);
    }
},
'comparing', {
    equals: function(other) {
        if (!other) {
            return false;
        }
        return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height;
    }
},
'debugging', {
    inspect: function() {
        return JSON.serialize(this);
    }
},
'accessing', {
    topLeft: function() {
        return new lively.Point(this.x, this.y)
    },

    topRight: function() {
        return new lively.Point(this.maxX(), this.y)
    },

    bottomRight: function() {
        return new lively.Point(this.maxX(), this.maxY())
    },

    bottomLeft: function() {
        return new lively.Point(this.x, this.maxY())
    },

    leftCenter: function() {
        return new lively.Point(this.x, this.center().y)
    },

    rightCenter: function() {
        return new lively.Point(this.maxX(), this.center().y)
    },

    topCenter: function() {
        return new lively.Point(this.center().x, this.y)
    },

    bottomCenter: function() {
        return new lively.Point(this.center().x, this.maxY())
    },

    extent: function() {
        return new lively.Point(this.width, this.height);
    },

    center: function() {
        return new lively.Point(this.x + (this.width / 2), this.y + (this.height / 2))
    },

    topEdge: function() { return new lively.Line(this.topLeft(), this.topRight()); },

    bottomEdge: function() { return new lively.Line(this.bottomLeft(), this.bottomRight());  },

    leftEdge: function() { return new lively.Line(this.topLeft(), this.bottomLeft());  },

    rightEdge: function() { return new lively.Line(this.topRight(), this.bottomRight());  },

    edges: function() {
        return [this.topEdge(),
                this.rightEdge(),
                this.bottomEdge(),
                this.leftEdge()];
    },

    allPoints: function() {
        // take rectangle as discrete grid and return all points in the grid
        // rect(3,4,2,3).allPoints() == [pt(3,4),pt(4,4),pt(3,5),pt(4,5),pt(3,6),pt(4,6)]
        // if you want to convert points to indices use
        // var w = 5, h = 7; lively.rect(3,4,2,3).allPoints().map(function(p) { return p.y * w + p.x; }) == [23,24,28,29,33,34]
        var x = this.x, y = this.y, w = this.width, h = this.height, points = [];
        for (var j = y; j < y+h; j++)
            for (var i = x; i < x+w; i++)
                points.push(pt(i,j));
        return points;
    }
},
'testing', {
    isNonEmpty: function(rect) {
        return this.width > 0 && this.height > 0;
    },

    containsRect: function(r) {
        return this.x <= r.x && this.y <= r.y && r.maxX() <= this.maxX() && r.maxY() <= this.maxY();
    },

    intersects: function(r) {
        return this.intersection(r).isNonEmpty();
    },

    containsPoint: function(p) {
        return this.x <= p.x && p.x <= this.x + this.width && this.y <= p.y && p.y <= this.y + this.height;
    }
},
'transforming', {
    translatedBy: function(d) {
        return new lively.Rectangle(this.x + d.x, this.y + d.y, this.width, this.height);
    },

    scaleByRect: function(r) {
        // r is a relative rect, as a pane spec in a window
        return new lively.Rectangle(
        this.x + (r.x * this.width), this.y + (r.y * this.height), r.width * this.width, r.height * this.height);
    },

    scaleRectIn: function(fullRect) {
        // return a relative rect for this as a part of fullRect
        return new lively.Rectangle((this.x - fullRect.x) / fullRect.width, (this.y - fullRect.y) / fullRect.height, this.width / fullRect.width, this.height / fullRect.height);
    },

    expandBy: function(delta) {
        return this.insetBy(0 - delta);
    },

    translateForInclusion: function(other) {
        var x = other.x,
            y = other.y,
            r = x + other.width,
            b = y + other.height;
        if (r > this.right()) x -= r - this.right();
        if (b > this.bottom()) y -= b - this.bottom();
        if (x < this.x) x = this.x;
        if (y < this.y) y = this.y;
        return lively.rect(x,y, other.width, other.height);
    },

    transformRectForInclusion: function(other) {
        var topLeft = this.topLeft().maxPt(other.topLeft()),
            newBottomRight = topLeft.addPt(other.extent()),
            innerBottomRight = this.bottomRight().minPt(newBottomRight);
        return lively.rect(topLeft, innerBottomRight);
    },

    insetByRect: function(r) {
        return new lively.Rectangle(this.x + r.left(), this.y + r.top(), this.width -
                 (r.left() + r.right()), this.height - (r.top() + r.bottom()));
    },

    outsetByRect: function(r) {
        return new lively.Rectangle(this.x - r.left(), this.y - r.top(), this.width +
                 (r.left() + r.right()), this.height + (r.top() + r.bottom()));
    }
},
'relations', {

    intersection: function(rect) {
        var nx = Math.max(this.x, rect.x);
        var ny = Math.max(this.y, rect.y);
        var nw = Math.min(this.x + this.width, rect.x + rect.width) - nx;
        var nh = Math.min(this.y + this.height, rect.y + rect.height) - ny;
        return new lively.Rectangle(nx, ny, nw, nh);
    },

    union: function(r) {
        return lively.rect(this.topLeft().minPt(r.topLeft()), this.bottomRight().maxPt(r.bottomRight()));
    },

    lineIntersection: function(line) {
        return this.edges().collect(function(edge) { return edge.intersection(line); }).compact();
    },

    dist: function(rect) {
        var p1 = this.closestPointToPt(rect.center());
        var p2 = rect.closestPointToPt(p1);
        return p1.dist(p2);
    },

    relativeToAbsPoint: function(relPt) {
        return new lively.Point(
        this.x + this.width * relPt.x, this.y + this.height * relPt.y)
    },

    closestPointToPt: function(p) {
        // Assume p lies outside me; return a point on my perimeter
        return lively.pt(Math.min(Math.max(this.x, p.x), this.maxX()), Math.min(Math.max(this.y, p.y), this.maxY()));
    }
},
'properties', {
    maxX: function() {
        return this.x + this.width;
    },

    maxY: function() {
        return this.y + this.height;
    },

    realWidth: function() {
        return this.x < 0 ? -this.x + this.width : this.width
    },

    realHeight: function() {
        return this.y < 0 ? -this.y + this.height : this.height
    },

    area: function() { return this.width * this.height; },

    randomPoint: function() {
        return lively.Point.random(lively.pt(this.width, this.height)).addPt(this.topLeft());
    },

    constrainPt: function(pt) {
        return pt.maxPt(this.topLeft()).minPt(this.bottomRight());
    }
},
'SVG interface', {
    // modeled after the CSS box model: http://www.w3.org/TR/REC-CSS2/box.html
    left: function() {
        return this.x;
    },

    right: function() {
        return this.maxX();
    },

    top: function() {
        return this.y;
    },

    bottom: function() {
        return this.maxY();
    },

    toInsetTuple: function() {
        return [this.left(), this.top(), this.right(), this.bottom()];
    },

    toAttributeValue: function(d) {
        var d = 0.01,
            result = [this.left()];
        if (this.top() === this.bottom() && this.left() === this.right()) {
            if (this.top() === this.left()) result.push(this.top());
            } else result = result.concat([this.top(), this.right(), this.bottom()]);
            return result.invoke('roundTo', d || 0.01);
    },

    toLiteral: function() {
        return {x: this.x, y: this.y, width: this.width, height: this.height};
    }
},
'part support', {
    partNamed: function(partName) {
        return this[partName].call(this);
    },

    withPartNamed: function(partName,newValue) {
        return this[this.setterName(partName)].call(this, newValue);
    },

    setterName: function(partName) {
        return "with" + partName[0].toUpperCase() + partName.slice(1);
    },

    partNameNear: function(partNames,p,dist) {
        var partName = this.partNameNearest(partNames,p);
        return (p.dist(this.partNamed(partName)) < dist) ? partName : null;
    },

    partNameNearest: function(partNames, p) {
        var dist = 1.0e99,
            partName = partNames[0];

        for (var i=0; i<partNames.length; i++) {
            var partName = partNames[i],
                pDist = p.dist(this.partNamed(partName));
            if (pDist < dist) {var nearest = partName; dist = pDist}
        }

        return nearest;
    }
});

Object.extend(lively.Rectangle, {
    fromAny: function(ptA, ptB) {
        return lively.rect(ptA.minPt(ptB), ptA.maxPt(ptB));
    },

    fromLiteral: function(literal) {
        return new lively.Rectangle(literal.x, literal.y, literal.width, literal.height);
    },

    fromTuple: function(tuple) {
        return new lively.Rectangle(tuple[0], tuple[1], tuple[2], tuple[3]);
    },

    unionPts: function(points) {
        var min = points[0],
            max = points[0];

        // starts from 1 intentionally
        for (var i = 1; i < points.length; i++) {
            min = min.minPt(points[i]);
            max = max.maxPt(points[i]);
        }

        return lively.rect(min, max);
    },

    ensure: function(duck) {
        if (duck instanceof lively.Rectangle) {
            return duck;
        } else {
            return new lively.Rectangle(duck.x, duck.y, duck.width, duck.height);
        }
    },

    fromElement: function(element) {
        // FIXME
        if (Object.isFunction(element.getBoundingClientRect)) {
            var b = element.getBoundingClientRect();
            return lively.rect(b.left, b.top, b.width, b.height);
        } else if (element.namespaceURI == Namespace.XHTML) {
            var x = lively.data.Length.parse(element.style.left || 0),
                y = lively.data.Length.parse(element.style.top || 0),
                width = lively.data.Length.parse(element.style.width || 0),
                height = lively.data.Length.parse(element.style.hieght || 0);
            return new lively.Rectangle(x, y, width, height);
        }
        if (element.namespaceURI == Namespace.SVG) {
            return new lively.Rectangle(element.x.baseVal.value, element.y.baseVal.value,
                element.width.baseVal.value, element.height.baseVal.value);
        }
        throw new Error('Cannot create Rectangle from ' + element);
    },

    inset: function(left, top, right, bottom) {
        if (top === undefined) top = left;
        if (right === undefined) right = left;
        if (bottom === undefined) bottom = top;
        return new lively.Rectangle(left, top, right - left, bottom - top);
    }

});

Object.subclass('lively.morphic.Similitude',
'documentation', {
    documentation: "a Similitude is a combination of translation rotation and scale",
},
'settings', {
    eps: 0.0001, // precision
},
'initializing', {
    initialize: function(duck) {
        // matrix is a duck with a,b,c,d,e,f, could be an SVG matrix or a
        // Lively Transform
        // alternatively, its a combination of translation rotation and scale
        if (duck) {
            if (duck instanceof lively.Point) {
                var delta = duck,
                    angleInRadians = arguments[1] || 0.0,
                    scale = arguments[2];
                if (scale === undefined) { scale = pt(1.0, 1.0); }
                this.a = this.ensureNumber(scale.x * Math.cos(angleInRadians));
                this.b = this.ensureNumber(scale.y * Math.sin(angleInRadians));
                this.c = this.ensureNumber(scale.x * - Math.sin(angleInRadians));
                this.d = this.ensureNumber(scale.y * Math.cos(angleInRadians));
                this.e = this.ensureNumber(delta.x);
                this.f = this.ensureNumber(delta.y);

                // avoid inaccurate translations in Chrome
                if (this.a > 1) this.a = Math.round(this.a*Math.pow(10,2))/Math.pow(10,2);
                if (this.d > 1) this.d = Math.round(this.d*Math.pow(10,2))/Math.pow(10,2);
            } else {
                this.fromMatrix(duck);
            }
        } else {
            this.a = this.d = 1.0;
            this.b = this.c = this.e = this.f = 0.0;
        }
    },

    copy: function() {
        return new lively.morphic.Similitude(this);
    },

    fromMatrix: function(mx) {
        this.a = this.ensureNumber(mx.a);
        this.b = this.ensureNumber(mx.b);
        this.c = this.ensureNumber(mx.c);
        this.d = this.ensureNumber(mx.d);
        this.e = this.ensureNumber(mx.e);
        this.f = this.ensureNumber(mx.f);
    },
},
'accessing', {
    getRotation: function() { // in degrees
        // Note the ambiguity with negative scales is resolved by assuming
        // scale x is positive
        var r = Math.atan2(-this.c, this.a).toDegrees();

        // don't bother with values very close to 0
        return Math.abs(r) < this.eps ? 0 : r;
    },

    getScale: function() {
        // Note the ambiguity with negative scales and rotation is resolved by assuming scale x is positive
        var a = this.a, c = this.c, s = Math.sqrt(a * a + c * c);

        // don't bother with values very close to 1
        return Math.abs(s - 1) < this.eps ? 1 : s;
    },

    getScalePoint: function() {
        // Note the ambiguity with negative scales and rotation is resolved by
        // assuming scale x is positive
        var a = this.a,
            b = this.b,
            c = this.c,
            d = this.d,
            sx = Math.sqrt(a * a + c * c),
            r =     Math.atan2(-c, a), // radians
            // avoid div by 0
            sy = (Math.abs(b) > Math.abs(d)) ? b / Math.sin(r) : d / Math.cos(r);
        return pt(sx, sy);
    },

    getTranslation: function() {
        return pt(this.e, this.f);
    },

},
'testing', {
    isTranslation: function() {
        // as specified in:
        // http://www.w3.org/TR/SVG11/coords.html#InterfaceSVGTransform
        return (this.a==1 && this.b==0 && this.c==0 && this.d==1)
    },
},
'converting', {
    toSVGAttributeValue: function() {
        var delta = this.getTranslation(),
            attr = "translate(" + delta.x + "," + delta.y +")",
            theta = this.getRotation(),
            sp = this.getScalePoint();

        if (theta != 0.0) attr += " rotate(" + this.getRotation()  +")"; // in degrees
        if (sp.x != 1.0 || sp.y != 1.0)     attr += " scale(" + sp.x + "," + sp.y + ")";

        return attr;
    },

    toCSSValue: function(bounds) {
        var attr = '';

        var round = function(n) { return Math.round(n*100)/100 }

        var delta = this.getTranslation();
        attr += "translate(" + round(delta.x) + "px," + round(delta.y) +"px)";

        if (bounds) {
            // FIXME this is to fix the rotation...!
            var offsetX = bounds.width / 2;
            var offsetY = bounds.height / 2;
            attr += " translate(" + round(offsetX) + "px," + round(offsetY) +"px)";
        }

        var theta = this.getRotation();
        if (theta != 0.0) attr += " rotate("
                + round(this.getRotation()) +"deg)";

        if (bounds) {
            // FIXME this is to fix the rotation...!
            var offsetX = bounds.width / 2;
            var offsetY = bounds.height / 2;
            attr += " translate(" + round(offsetX * -1) + "px," + round(offsetY * -1) +"px)";
        }

        var sp = this.getScalePoint();
        if (sp.x != 1.0 || sp.y != 1.0) {
            attr += " scale(" + round(sp.x) + "," + round(sp.y) + ")";
        }

        return attr;
    },

    toCSSTransformString: function() {
        var rot = this.getRotation(),
            scale = this.getScale();
        return 'translate(' + this.e + 'px,' + this.f + 'px) rotate(' + rot +
                 'deg) scale(' + scale + ',' + scale + ')';
    },

    toString: function() {
        return this.toCSSValue();
    },

    toMatrix: function() {
        return this.copy();
    },

},
'application', {
    applyTo: function(rawNode) {
        rawNode.setAttributeNS(null, "transform", this.toSVGAttributeValue());
    },
},
'transforming', {
    transformPoint: function(p, acc) {
        return p.matrixTransform(this, acc);
    },

    transformDirection: function(p, acc) {
        return p.matrixTransformDirection(this, acc);
    },

    matrixTransformForMinMax: function(pt, minPt, maxPt) {
        var x = this.a * pt.x + this.c * pt.y + this.e,
            y = this.b * pt.x + this.d * pt.y + this.f;
        if (x > maxPt.x) maxPt.x = x;
        if (y > maxPt.y) maxPt.y = y;
        if (x < minPt.x) minPt.x = x;
        if (y < minPt.y) minPt.y = y;
    },

    transformRectToRect: function(r) {
        var minPt = pt(Infinity, Infinity),
            maxPt = pt(-Infinity, -Infinity);
        this.matrixTransformForMinMax(r.topLeft(), minPt, maxPt);
        this.matrixTransformForMinMax(r.bottomRight(), minPt, maxPt);
        if (this.isTranslation()) return rect(minPt, maxPt);

        this.matrixTransformForMinMax(r.topRight(), minPt, maxPt);
        this.matrixTransformForMinMax(r.bottomLeft(), minPt, maxPt);
        return rect(minPt, maxPt);
    },

},
'matrix operations', {
    preConcatenate: function(t) {
        var m = this.matrix_ || this.toMatrix();
        this.a =  t.a * m.a + t.c * m.b;
        this.b =  t.b * m.a + t.d * m.b;
        this.c =  t.a * m.c + t.c * m.d;
        this.d =  t.b * m.c + t.d * m.d;
        this.e =  t.a * m.e + t.c * m.f + t.e;
        this.f =  t.b * m.e + t.d * m.f + t.f;
        this.matrix_ = this.toMatrix();
        return this;
    },

    invert: function() {
        var m = this.copy();

        var det = m.a * m.d - m.c * m.b,
            invdet = 1/det;

        this.a =  m.d * invdet;
        this.b = -m.b * invdet;
        this.c = -m.c * invdet;
        this.d =  m.a * invdet;
        this.e =  (m.c * m.f - m.e * m.d) * invdet;
        this.f = -(m.a * m.f - m.b * m.e) * invdet;

        return this;
    },

    inverse: function() {
        var matrix = this.matrix_ || this.toMatrix();
        var result = new this.constructor(matrix);
        result.invert();
        return result;
    }
},
'helper', {
    ensureNumber: function(value) {
        // note that if a,b,.. f are not numbers, it's usually a
        // problem, which may crash browsers (like Safari) that don't
        // do good typechecking of SVGMatrix properties
        if (isNaN(value)) { throw dbgOn(new Error('not a number'));}
        return value;
    },
});

Object.subclass("lively.Line",
'initializing', {
    initialize: function(start, end) {
        this.start = start;
        this.end = end;
    }
},
'accessing', {
    sampleN: function(n) {
        // return n points that are collinear with this and are between
        // this.start and this.end
        n = n || 10;
        var vector = this.end.subPt(this.start),
            stepPt = vector.scaleBy(1/n),
            result = [];
        for (var i = 0; i <= n; i++) {
            result.push(this.start.addPt(stepPt.scaleBy(i)))
        }
        return result;
    },

    sample: function(length) {
        return this.sampleN(this.length() / length);
    },

    length: function() {
        return this.start.dist(this.end);
    }
},
'testing', {
    equals: function(otherLine) {
        if (!otherLine) return false;
        return this.start.eqPt(otherLine.start) && this.end.eqPt(otherLine.end);
    },

    includesPoint: function(p, unconstrained) {
        // test whether p is collinear with this.start, this.end
        // constrained: p also needs to be on segment between start, end
        var x1 = this.start.x,
            y1 = this.start.y,
            x2 = this.end.x,
            y2 = this.end.y,
            x3 = p.x,
            y3 = p.y,
            collinear = ((x2 - x1) * (y3 - y1)) - ((x3 - x1) * (y2 - y1)) === 0;
        if (unconstrained || !collinear) return collinear;
        var xMin = Math.min(x1, x2),
            yMin = Math.min(y1, y2),
            xMax = Math.max(x1, x2),
            yMax = Math.max(y1, y2);
        return xMin <= x3 && x3 <= xMax && yMin < y3 && y3 <= yMax;
    }
},
'intersection', {
    intersection: function(otherLine, unconstrained) {
        // constrained: intersection has to be between start/ends of this and
        // otherLine
        // http://en.wikipedia.org/wiki/Line-line_intersection
        //       .. (x1, y1)
        //         ..              ..... (x4,y4)
        //           ..    ........
        // (x3,y3) .....X..
        //    .....      ..
        //                 ..  (x2, y2)
        var eps = 0.0001,
            start1 = this.start,
            end1 = this.end,
            start2 = otherLine.start,
            end2 = otherLine.end,
            x1 = start1.x,
            y1 = start1.y,
            x2 = end1.x,
            y2 = end1.y,
            x3 = start2.x,
            y3 = start2.y,
            x4 = end2.x,
            y4 = end2.y;

        var x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
                ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4)),
            y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
                ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

        // are lines parallel?
        if (x === Infinity || y === Infinity) return null;

        if (!unconstrained) {
            if (!lively.lang.num.between(x, x1, x2, eps)
             || !lively.lang.num.between(y, y1, y2, eps)
             || !lively.lang.num.between(x, x3, x4, eps)
             || !lively.lang.num.between(y, y3, y4, eps)) return null;
        }

        return lively.pt(x,y);
    }
},
'debugging', {
    toString: function() {
        return Strings.format('line((%s,%s), (%s,%s))',
                              this.start.x, this.start.y,
                              this.end.x, this.end.y)
    }
});

Object.subclass("lively.Color",
'documentation', {
    documentation: "Fully portable support for RGBA colors."
},
'settings', {
    isColor: true
},
'initializing', {
    initialize: function(r, g, b, a) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || (a === 0 ? 0 : 1);
    }
},
'accessing', {
    grayValue: function() {
        return (this.r + this.g + this.b) / 3;
    }
},
'comparing', {
    equals: function(other) {
        if (!other) return false;
        return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
    }
},
'transforming', {
    darker: function(recursion) {
        var result = this.mixedWith(lively.Color.black, 0.5);
        return recursion > 1  ? result.darker(recursion - 1) : result;
    },

    lighter: function(recursion) {
        if (recursion == 0)
            return this;
        var result = this.mixedWith(lively.Color.white, 0.5);
        return recursion > 1 ? result.lighter(recursion - 1) : result;
    }
},
'printing', {
    toString: function() {
        function floor(x) { return Math.floor(x*255.99) };
        return this.a === 1 ?
            "rgb(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + ")" :
            this.toRGBAString();
    },

    toRGBAString: function() {
        function floor(x) { return Math.floor(x*255.99) };
        return "rgba(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + "," + this.a + ")";
    },
    toHexString: function() {
        function floor(x) { return Math.floor(x*255.99) };
        function addLeadingZero(string){
            var s = string;
            while (s.length < 2) {
                s = '0' + s;
            }
            return s;
        }
        return addLeadingZero(floor(this.r).toString(16)) +
                addLeadingZero(floor(this.g).toString(16)) +
                addLeadingZero(floor(this.b).toString(16));
    }
},
'converting', {
    toTuple: function() {
        return [this.r, this.g, this.b, this.a];
    },
    toTuple8Bit: function() {
        return [this.r*255, this.g*255, this.b*255, this.a*255];
    },
    toHSB: function() {
        var max = Math.max(this.r, this.g, this.b),
            min = Math.min(this.r, this.g, this.b),
            h, s, b = max;
        if (max == min) {
            h = 0;
        } else if (max == this.r) {
            h = 60 * (0 + ((this.g - this.b) / (max - min)));
        } else if (max == this.g) {
            h = 60 * (2 + ((this.b - this.r) / (max - min)));
        } else if (max == this.b) {
            h = 60 * (4 + ((this.r - this.g) / (max - min)));
            h = (h + 360) % 360;
        }
        s = max == 0 ? 0 : (max - min) / max;
        return [h, s, b];
    }
},
'instance creation', {
    withA: function(a) {
        return new lively.Color(this.r, this.g, this.b, a);
    },

    mixedWith: function(other, proportion) {
        // Mix with another color -- 1.0 is all this, 0.0 is all other
        var p = proportion,
            q = 1.0 - p;
        return new lively.Color(this.r*p + other.r*q, this.g*p + other.g*q, this.b*p + other.b*q, this.a*p + other.a*q);
    },

    // FIXME: invert sounds like mutation, versus createInverse or similar
    invert: function() {
        return lively.Color.rgb(255 * (1 - this.r), 255 * (1 - this.g), 255 * (1 - this.b));
    }
});

Object.extend(lively.Color, {
    random: function(min, max) {
        if (min === undefined) min = 0;
        if (max === undefined) max = 255;
        return lively.Color.rgb(
          lively.lang.num.random(min, max),
          lively.lang.num.random(min, max),
          lively.lang.num.random(min, max));
    },

    hsb: function(hue,sat,brt) {
        var s = sat,
            b = brt;
        // zero saturation yields gray with the given brightness
        if (sat == 0) return new lively.Color(b,b,b);
        var h = hue % 360,
            h60 = h / 60,
            i = Math.floor(h60), // integer part of hue
            f = h60 - i, // fractional part of hue
            p = (1.0 - s) * b,
            q = (1.0 - (s * f)) * b,
            t = (1.0 - (s * (1.0 - f))) * b;

        switch (i) {
            case 0:  return new lively.Color(b,t,p);
            case 1:  return new lively.Color(q,b,p);
            case 2:  return new lively.Color(p,b,t);
            case 3:  return new lively.Color(p,q,b);
            case 4:  return new lively.Color(t,p,b);
            case 5:  return new lively.Color(b,p,q);
            default: return new lively.Color(0,0,0);
        }
    },

    wheel: function(n) {
        return lively.Color.wheelHsb(n,0.0,0.9,0.7);
    },

    wheelHsb: function(n,hue,sat,brt) {
        // Return an array of n colors of varying hue
        var a = new Array(n),
            step = 360.0 / (Math.max(n,1));
        for (var i = 0; i < n; i++) {
            a[i] = lively.Color.hsb(hue + i*step, sat, brt);
        }
        return a;
    },

    rgb: function(r, g, b) {
        return new lively.Color(r/255, g/255, b/255);
    },

    rgbHex: function(colorHexString) {
        var colorData = this.parseHex(colorHexString);
        if (colorData && colorData[0] >= 0 && colorData[1] >= 0 && colorData[2] >= 0) {
            return new lively.Color(colorData[0], colorData[1], colorData[2]);
        } else {
            return null;
        }

    },

    rgba: function(r, g, b, a) {
        return new lively.Color(r/255, g/255, b/255, a);
    },

    fromLiteral: function(spec) {
        return new lively.Color(spec.r, spec.g, spec.b, spec.a);
    },

    fromTuple: function(tuple) {
        return new lively.Color(tuple[0], tuple[1], tuple[2], tuple[3]);
    },

    fromTuple8Bit: function(tuple) {
        return new lively.Color(tuple[0]/255, tuple[1]/255, tuple[2]/255, tuple[3]/255);
    },

    fromString: function(str) {
        if (!str || str === 'none') {
            return null;
        } else {
            return apps.ColorParser.getColorFromString(str);
        }
    },

    rgbaRegex: new RegExp('\\s*rgba?\\s*\\(\\s*(\\d+)(%?)\\s*,\\s*(\\d+)(%?)\\s*,\\s*(\\d+)(%?)\\s*(?:,\\s*([0-9\\.]+)\\s*)?\\)\\s*'),

    parse: function(str) {
        var color;
        if (!str || str === 'none') {
            return null;
        } else {
            color = apps.ColorParser.getColorFromString(str);
            return [color.red(),color.green(),color.blue(),color.alpha()];
        }
    },

    parseRGB: function(str) {
        // match string of the form rgb([r],[g],[b]) or rgb([r%],[g%],[b%]),
        // allowing whitespace between all components
        var match = str.match(this.rgbaRegex);
        if (match) {
            var r = parseInt(match[1]) / (match[2] ? 100 : 255);
            var g = parseInt(match[3]) / (match[4] ? 100 : 255);
            var b = parseInt(match[5]) / (match[6] ? 100 : 255);
            var a = match[7] ? parseFloat(match[7]) : 1.0;
            return [r, g, b, a];
        }
        return null;
    },

    parseHex: function(colStr) {
        var rHex, gHex, bHex, str = '';
        for (var i = 0; i < colStr.length; i++) {
            var c = colStr[i].toLowerCase();
            if (c=='a' ||c=='b' ||c=='c' ||c=='d' ||c=='e' ||c=='f' ||c=='0' ||c=='1' ||
                c=='2' ||c=='3' ||c=='4' ||c=='5' ||c=='6' ||c=='7' ||c=='8' ||c=='9') {
                str += c;
            }
        }
         if (str.length == 6) {
            rHex = str.substring(0,2);
            gHex = str.substring(2,4);
            bHex = str.substring(4,6);
        } else if (str.length == 3) {
            // short form like #C00
            rHex = str.substring(0,1);
            rHex += rHex;
            gHex = str.substring(1,2);
            gHex += gHex;
            bHex = str.substring(2,3);
            bHex += bHex;
        }  else {
            return null
        }
        var r = parseInt(rHex, 16)/255,
            g = parseInt(gHex, 16)/255,
            b = parseInt(bHex, 16)/255;
        return [r, g, b];
    }
});

Object.extend(lively.Color, {
    // extended again to make use of Color.rgb
    black:         new lively.Color(0,0,0),
    almostBlack:   lively.Color.rgb(64, 64, 64),
    white:         new lively.Color(1,1,1),
    gray:          new lively.Color(0.8,0.8,0.8),
    red:           new lively.Color(0.8,0,0),
    green:         new lively.Color(0,0.8,0),
    yellow:        new lively.Color(0.8,0.8,0),
    blue:          new lively.Color(0,0,0.8),
    purple:        new lively.Color(1,0,1),
    magenta:       new lively.Color(1,0,1),
    pink:          lively.Color.rgb(255,30,153),
    turquoise:     lively.Color.rgb(0,240,255),
    tangerine:     lively.Color.rgb(242,133,0),
    orange:        lively.Color.rgb(255,153,0),
    cyan:          lively.Color.rgb(0,255,255),
    brown:         lively.Color.rgb(182,67,0),
    limeGreen:     lively.Color.rgb(51,255,0),
    darkGray:      lively.Color.rgb(102,102,102),
    lightGray:     lively.Color.rgb(230,230,230),
    veryLightGray: lively.Color.rgb(243,243,243),

    // FIXME: are the following palettes used!?
    primary: {
        // Sun palette
        blue:   lively.Color.rgb(0x53, 0x82, 0xA1),
        orange: lively.Color.rgb(0xef, 0x6f, 0x00),
        green:  lively.Color.rgb(0xb2, 0xbc, 00),
        yellow: lively.Color.rgb(0xff, 0xc7, 0x26)
    },
    secondary: {
        blue:   lively.Color.rgb(0x35, 0x55, 0x6b),
        orange: lively.Color.rgb(0xc0, 0x66, 0x00),
        green:  lively.Color.rgb(0x7f, 0x79, 0x00),
        yellow: lively.Color.rgb(0xc6, 0x92, 0x00)
    },
    neutral: {
        lightGray: lively.Color.rgb(0xbd, 0xbe, 0xc0),
        gray:      lively.Color.rgb(0x80, 0x72, 0x77)
    },
    lively: {
        orange: lively.Color.rgb(245, 124, 0),
        lightGray: lively.Color.rgb(128, 128, 128),
        darkGray: lively.Color.rgb(77, 77, 77)
    }
});

(function addColorsToConfig() {
  lively.Config.addOptions(
  "default colors", [
      ["textColor", lively.Color.rgb(64,64,64), "Default text color. Better than black..."]
  ]);
})();

Object.extend(lively, {
  pt: function(x, y) { return new lively.Point(x, y); },
  rect: function(arg1, arg2, arg3, arg4) {
      // arg1 and arg2 can be location and corner or
      // arg1/arg2 = location x/y and arg3/arg4 = extent x/y
      var x, y, w, h;
      if (typeof arg1 === 'number') {
          x = arg1, y = arg2, w = arg3, h = arg4
      } else {
          x = arg1.x; y = arg1.y;
          w = arg2.x - x; h = arg2.y - y;
      }
      return new lively.Rectangle(x, y, w, h);
  }
});

Object.extend(Global, { // FIXME, no global pollution...?
  Point: lively.Point,
  Rectangle: lively.Rectangle,
  Color: lively.Color,
  pt: lively.pt,
  rect: lively.rect
});

});
