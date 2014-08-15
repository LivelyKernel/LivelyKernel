module('lively.morphic.AdditionalMorphs').requires('lively.morphic.Halos', 'lively.morphic.Grid', 'lively.morphic.TabMorphs').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.CanvasMorph',
'settings', {

    preserveContents: true,     // store pixel data when saving morph and resizing canvas

    pixelRatio: pt(1, 1),       // ratio of canvas pixels to css pixels
    
    defaultExtent: pt(300, 300)

},
'canvas', {

    initialize: function($super, optExtent) {
        $super(this.createShape());
        this.setExtent(optExtent || this.defaultExtent);
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

    setCanvasExtent: function(canvasExtent) {
        // set canvas extent without changing morph extent by adjusting pixelRatio
        var morphExtent = this.getExtent();
        this.pixelRatio = pt(canvasExtent.x / morphExtent.x, canvasExtent.y / morphExtent.y);
        this.renderContextDispatch('adaptCanvasSize', morphExtent);
    },

    getCanvasExtent: function() {
        // canvas extent for drawing is different if pixelRatio was changed
        var canvas = this.getContext().canvas;
        return pt(canvas.width, canvas.height); 
    },
    
    getCanvasBounds: function() {
        return this.getCanvasExtent().extentAsRectangle();
    },

    setPixelRatio: function(ratio) {
        this.pixelRatio = ratio;
        this.renderContextDispatch('adaptCanvasSize', this.getExtent());
    },

    getPixelRatio: function(ratio) {
        return this.pixelRatio;
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

    onCanvasWillChange: function(newExtent, oldExtent) {
        // canvas is about to lose its contents (size changed)
        // the value returned from here will be passed into onCanvasChanged() 
        // the default is to save pixels and restore them in onCanvasChanged()
        if (this.preserveContents)
            return this.getImageData();
    },

    onCanvasChanged: function(newExtent, oldExtent, savedData) {
        // canvas created or loaded or size changed, need to redraw contents
        // the default is to draw the pixels saved by onCanvasWillChange()
        if (savedData && savedData.constructor === ImageData)
            this.putImageData(savedData);
    }

},
'serialization', {
    onstore: function($super) {
        $super();
        if (this.preserveContents)
            this._canvasSerializationDataURI = this.toDataURI();
    },

    onrestore: function($super) {
        $super();
        if (this._canvasSerializationDataURI) {
            var self = this;
            function deserialize() { self.fromDataURI(self._canvasSerializationDataURI); }
            if (this.world()) lively.whenLoaded(deserialize);
            else this.whenOpenedInWorld(deserialize);
        }
    },

    getGrabShadow: function() {
        return null
    },

    toDataURI: function() { return this.getContext().canvas.toDataURL(); },

    fromDataURI: function(uri) {
        var ctx = this.getContext();
        var img = new Image();
        img.onload = function() { ctx.drawImage(img,0,0); };
        img.src = uri;
    },

    fromImageMorph: function(imgMorph) {
        var imgNode = imgMorph.renderContext().imgNode;
        var ext = pt(imgNode.naturalWidth, imgNode.naturalHeight);
        this.setExtent(ext);
        this.getContext().drawImage(imgNode, 0,0);
        return this;
    },

    toImage: function() {
        return lively.morphic.Image.fromURL(this.toDataURI(), this.getCanvasBounds());
    },

    toImageDataArray: function(optBounds) {
        return Array.from(this.getImageData(optBounds).data);
    },

    sampleImageData2: function(sparseness) { // downscales data...
        var d = this.getImageData(),
            rows = this.getRows(d.width, d.height, d.data),
            newRows = rows.reduce(function(newRows, row, j) {
            return j % sparseness === 0 ? newRows.concat(row.reduce(function(newCols, col, i) {
                return i % sparseness === 0 ? newCols.concat(col) : newCols;
            }, [])) : newRows;
        }, []);
        return {
            width: Math.ceil(d.width/sparseness),
            height: Math.ceil(d.height/sparseness),
            data: newRows
        };
    },

    sampleImageData: function(sparseness) {
        // show non-transparent points of an image:
        // show(
        // that.sampleImageData(15)
        //     .filter(function(ea) { return !ea[1].equals(Color.rgba(0,0,0,0)); })
        //     .pluck(0)
        //     .map(function(ea) { return that.getGlobalTransform().transformPoint(ea); }))
        sparseness = sparseness || 1;
        var d = this.getImageData();
        return Array.from(d.data).toTuples(4).toTuples(d.width).reduce(function(rows, row, j) {
            return j % sparseness === 0 ? rows.concat(row.reduce(function(posAndColors, color, i) {
                return i % sparseness === 0 ?
                    posAndColors.concat([[pt(i,j), Color.fromTuple8Bit(color)]]) :
                    posAndColors;
                }, [])) : rows;
        }, []);
    }

},
'image data', {
    getImageData: function(optBounds) {
        optBounds = optBounds || this.getCanvasBounds();
        return this.getContext().getImageData(
            optBounds.left(),optBounds.top(),
            optBounds.width, optBounds.height);
    },

    putImageData: function(data, width, height) {
        // accepts real image data object or simple array with rgba-quad-tuples
        var ctx = this.getContext();
        if (data.constructor === ImageData) {
            var ext = this.getExtent();
            if (width === undefined || height === undefined) {
                width = ext.x; height = ext.y;
            }
            ctx.canvas.width = width;
            ctx.canvas.height = height;
            ctx.putImageData(data, 0,0);
            if (ext.x !== width || ext.y !== height) this.setExtent(pt(width,height));
        } else {
            var imgData = ctx.createImageData(width, height);
            for (var i = 0; i < data.length; i++) imgData.data[i] = data[i];
            this.putImageData(imgData, width, height);
        }
    },

    colorAt: function(i, pixelArr) {
        pixelArr = pixelArr || this.getImageData().data;
        return [pixelArr[i], pixelArr[i+1], pixelArr[i+2], pixelArr[i+3]];
    },

    positionToColor: function(pos, pixelArr) {
        var width = this.getContext().canvas.width;
        return this.colorAt(4*pos.y*width + 4*pos.x, pixelArr);
    },

    getColors: function() {
        var d = this.getImageData().data;
        return Array.range(0, d.length-1, 4)
            .map(function(i) { return this.colorAt(i, d); }, this)
            .reduce(function(colors, col) {
                if (!colors.any(function(col2) {
                    return col[0] === col2[0]
                        && col[1] === col2[1]
                        && col[2] === col2[2]
                        && col[3] === col2[3]; })) colors.push(col);
                return colors;
            }, []);
    },

    getRow: function(n, width, height, pixelArr) {
        var ctx = this.getContext();
        width = width || ctx.canvas.width;
        height = height || ctx.canvas.height;
        pixelArr = pixelArr || this.getImageData().data;
        var startIndex = width * n * 4;
        return Array.range(startIndex, startIndex + (width-1) * 4, 4).map(function(i) {
            return this.colorAt(i, pixelArr); }, this);
    },

    getRows: function(width, height, pixelArr) {
        width = width || this.getContext().canvas.width;
        height = height || this.getContext().canvas.height;
        pixelArr = pixelArr || this.getImageData().data;
        return Array.range(0, height-1).map(function(n) {
            return this.getRow(n, width, height, pixelArr); }, this);
    },

    getCol: function(n, width, height, pixelArr) {
        width = width || this.getContext().canvas.width;
        height = height || this.getContext().canvas.height;
        pixelArr = pixelArr || this.getImageData().data;
        var realN = n * 4;
        return Array.range(0, height-1).map(function(rowI) {
            return this.colorAt(realN + (rowI*4*width), pixelArr); }, this);
    },

    getCols: function(width, height, pixelArr) {
        width = width || this.getContext().canvas.width;
        height = height || this.getContext().canvas.height;
        pixelArr = pixelArr || this.getImageData().data;
        return Array.range(0, width-1).map(function(n) {
            return this.getCol(n, width, height, pixelArr); }, this);
    },

    isSameColor: function(colorA, colorB) {
        if (colorA.isColor) colorA = colorA.toTuple8Bit();
        if (colorB.isColor) colorB = colorB.toTuple8Bit();
        // FIXME helper
        return colorA[0] === colorB[0]
            && colorA[1] === colorB[1]
            && colorA[2] === colorB[2]
            && colorA[3] === colorB[3];
    },

    findFirstIndex: function(testFunc, rowsOrCols, reverse) {
        // apply testFunc to each row or col. If testFunc returns truthy return the
        // row/col index that was matched. if reverse is truthy, start from the back
        if (reverse) rowsOrCols = rowsOrCols.clone().reverse();
        var index, found = rowsOrCols.detect(function(rowOrCol, i) {
            index = i; return testFunc(rowOrCol); });
        if (!found) return -1;
        return reverse ? rowsOrCols.length - index : index;
    }

},
'image editing', {
    crop: function(cropRect) {
        var ctx = this.getContext(),
            l = Math.max(cropRect.left(), 0),
            t = Math.max(cropRect.top(), 0),
            w = Math.min(cropRect.width, ctx.canvas.width),
            h = Math.min(cropRect.height, ctx.canvas.height),
            imgData = ctx.getImageData(l,t,w,h);
        this.clear();
        ctx.putImageData(imgData, 0, 0);
        this.setExtent(pt(w,h));
    },

    cropColor: function(color, padding) {
        // crop image rectangular so that all rows/columns that only have
        // `color` are removed.
        if (color.isColor) color = color.toTuple8Bit();
        padding = padding || lively.rect(0,0,0,0);
        var self = this;
        function hasOtherColor(rowOrCol) {
            return !rowOrCol.all(function(color2) {
                return self.isSameColor(color, color2); });
        }
        var rows     = this.getRows(),
            cols     = this.getCols(),
            top      = this.findFirstIndex(hasOtherColor, rows),
            bottom   = this.findFirstIndex(hasOtherColor, rows, true),
            left     = this.findFirstIndex(hasOtherColor, cols),
            right    = this.findFirstIndex(hasOtherColor, cols, true),
            cropRect = lively.rect(
                pt(left, top).subPt(padding.topLeft()),
                pt(right, bottom).addPt(padding.bottomRight()));
        this.crop(cropRect);
    },

    replaceColor: function(fromColor, toColor, replacementBounds) {
        replacementBounds = replacementBounds || this.getCanvasBounds();
        if (fromColor.isColor) fromColor = fromColor.toTuple8Bit();
        if (toColor.isColor) toColor = toColor.toTuple8Bit();
        var ctx = this.getContext(),
            w = ctx.canvas.width, h = ctx.canvas.height,
            imgData = this.getImageData(), newImgData = new Array(imgData.length);
        replacementBounds.allPoints()
            .map(function(p) { return 4 * (p.y * w + p.x); })
            .forEach(function(i) {
                if (imgData.data[i] === fromColor[0]
                 && imgData.data[i+1] === fromColor[1]
                 && imgData.data[i+2] === fromColor[2]
                 && imgData.data[i+3] === fromColor[3]) {
                    imgData.data[i] = toColor[0];
                    imgData.data[i+1] = toColor[1];
                    imgData.data[i+2] = toColor[2];
                    imgData.data[i+3] = toColor[3];
                }
            });
        this.putImageData(imgData);
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
    adaptCanvasSizeHTML: function(ctx, morphExtent) {
        if (!morphExtent || this._adaptCanvasSizeHTMLInProgress) return;
        this._adaptCanvasSizeHTMLInProgress = true;
        try {
            var canvas = ctx.shapeNode,
                oldWidth = canvas.width,
                oldHeight = canvas.height,
                newWidth = morphExtent.x * this.pixelRatio.x | 0, 
                newHeight = morphExtent.y * this.pixelRatio.y | 0;
            if (oldWidth !== newWidth || oldHeight !== newHeight) {
                var oldExt = pt(oldWidth, oldHeight),
                    newExt = pt(newWidth, newHeight);
                var data = this.onCanvasWillChange(newExt, oldExt);
                canvas.width = newWidth;
                canvas.height = newHeight;
                this.onCanvasChanged(newExt, oldExt, data);
            }
        } finally {
            this._adaptCanvasSizeHTMLInProgress = false;
        }
    }
},
'menu', {
    morphMenuItems: function($super) {
        var items = $super(), self = this;
        items.push(['open as image morph', function() { self.toImage().openInHand(); }]);
        items.push(['replace color', function() {
            var colorToReplace = [0,0,0,0], replacementColor = [0,0,0,0];
            [function(next) {
                self.world().prompt('Color to replace', function(input) {
                    try { colorToReplace = eval(input); next(); } catch (e) { show(e); }
                }, Strings.print(colorToReplace));
            },
            function(next) {
                self.world().prompt('Replace with', function(input) {
                    try { replacementColor = eval(input); next(); } catch (e) { show(e); }
                }, Strings.print(replacementColor));
            },
            function(next) { self.replaceColor(colorToReplace, replacementColor); }].doAndContinue();
        }]);
        items.push(['crop by color', function() {
            var colorToCrop = [255,255,255,255];
            [function(next) {
                self.world().prompt('Crop color', function(input) {
                    try { colorToCrop = eval(input); next(); } catch (e) { show(e); }
                }, Strings.print(colorToCrop));
            },
            function(next) { self.cropColor(colorToCrop); }].doAndContinue();
        }]);
        items.push(['pick color', function() { self._pickColorOnNextClick = true; }]);
        return items;
    }
},
'events', {
    onMouseDown: function($super, evt) {
        if (this._pickColorOnNextClick) {
            delete this._pickColorOnNextClick;
            var pos = evt.getPositionIn(this),
                col = this.positionToColor(pos);
            show("color: [%s]", col);
            evt.stop(); return true;
        }
        return $super(evt);
    }
});

Object.extend(lively.morphic.CanvasMorph, {
    fromImageMorph: function(imgMorph) {
        return (new this()).fromImageMorph(imgMorph);
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
            this.targetMorph.halos.invoke('alignAtTarget');

        if (lively.Config.get('enableMagneticConnections') && this.magnetSet) {
            var nearestMagnets = this.magnetSet.nearestMagnetsToControlPoint(this.controlPoint)
            if (nearestMagnets.length == 0) {
                this.controlPoint.setConnectedMagnet(null);
            } else {
                this.controlPoint.setConnectedMagnet(nearestMagnets[0]);
                this.align(this.bounds().center(),this.controlPoint.getGlobalPos())
            }
        }

    },

    dragStartAction: function(evt) {
        this.targetMorph.removeHalosWithout(this.world(), [this]);

        if (lively.Config.get('enableMagneticConnections')) {
            this.magnetSet = new lively.morphic.MagnetSet(this.world());
            this.magnetSet.helperMorphs  = [];
        }

    },

    dragEndAction: function(evt) {
        this.targetMorph.removeHalos();
        this.targetMorph.showHalos();

        if (!this.overOther) return;
        if (this.controlPoint.next() !== this.overOther.controlPoint &&
            this.controlPoint.prev() !== this.overOther.controlPoint) return;
        if (this.controlPoint.isLast() || this.controlPoint.isFirst()) return;

        this.controlPoint.remove();

        if (lively.Config.get('enableMagneticConnections') && this.magnetSet) {
            this.magnetSet.helperMorphs.invoke('remove');
            delete this.magnetSet;
        }

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

lively.morphic.Morph.subclass('lively.morphic.HtmlWrapperMorph',
"setting", {
    style: {
        borderWidth: 0
    }
},
'initializing', {
    initialize: function($super, initialExtent) {
        this.rootElement = document.createElement('div');
        this.shape = new lively.morphic.Shapes.External(this.rootElement)
        $super(this.shape);
        this.shape.setBounds({
            extent: function() {return initialExtent;},
            topLeft: function() {return pt(0,0);}});
        this.setStyleClassNames(['selectable']);
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

    exportToDocument: function(url) {
        if (!url) {
            if (this.name) url = URL.source.withFilename(this.name + '.html');
            else url = URL.source.withFilename('exported-html-wrapper.html');
        }
        new WebResource(url).put(this.getHTML(), 'text/html');
    }

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
        return this.jQuery().html();
    },

    setHTML: function(html) {
        return this.jQuery().html(html);
    }

},
"menu", {
    morphMenuItems: function($super) {
        var items = $super();
        var target = this;
        items.push(['edit HTML', function() {
            var ed = target.world().addCodeEditor({
                title: 'edit HTML of ' + String(target),
                content: target.getHTML(),
                gutter: false,
                textMode: 'html',
                evalEnabled: false
            });
            ed.owner.align(ed.owner.bounds().center(), target.globalBounds().center());
            lively.bindings.connect(ed, 'savedTextString', target, 'setHTML');
            lively.bindings.connect(ed, 'savedTextString', Global, 'alertOK', {
                converter: function(htmlString) { return 'set HTML'; },
            });
        }]);
        items.push(['as text', function() {
            var ed = target.world().addCodeEditor({content: target.jQuery().text(), gutter: false, textMode: 'text'});
            ed.owner.align(ed.owner.bounds().center(), target.globalBounds().center());
        }]);
        items.push(['open in web page', function() {
            window.open('data:text/html;charset=utf-8,' + encodeURIComponent(target.getHTML()));
        }]);
        items.push(['save as html document...', function() {
            $world.prompt("Please enter the URL for the document", function(urlString) {
                if (!urlString) return show('aborted');
                target.exportToDocument(urlString);
            }, URL.source.withFilename('index.html').toString());
        }]);
        return items;
    },
});

Object.extend(lively.morphic.HtmlWrapperMorph, {
    renderHTML: function(html, bounds) {
        bounds = bounds || lively.rect(0,0, 500, 500);
        var morph = new lively.morphic.HtmlWrapperMorph(bounds.extent());
        morph.jQuery().html(html);
        morph.applyStyle({fill: Color.white, clipMode: 'auto'});
        morph.name = 'HTMLMorph';
        morph.openInWindow();
        morph.owner.openInWorldCenter();
        return morph;
    }
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
        this.applyStyle({adjustForNewBounds: true});
        this.initilaizeProgressIndicator();
        this.initializePreviewText();
        this.setExtent(this.getExtent());
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
        if (this.owner === hand) {
            hand.removeAllMorphs();
        } else {
            this.owner.addMorph(part);
            part.align(part.bounds().center(), this.bounds().center());
            this.remove();
        }
        lively.bindings.disconnect(this.partItem, 'part', this, "loadFinished");
        this.callback && this.callback(part);
    },
    loadPart: function (partItem, isAsync) {
        this.partItem = partItem;
        this.openInWorld();
        if (partItem.part) this.setExtent(partItem.part.getExtent());
        this.align(this.bounds().center(), this.world().visibleBounds().center());
        if (typeof isAsync === "function") this.callback = isAsync;
        lively.bindings.connect(partItem, 'part', this, "loadFinished");
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

lively.morphic.HtmlWrapperMorph.subclass('lively.morphic.ReactMorph',
'initializing', {
    initialize: function($super, initialBounds) {
        if(!initialBounds)
            initialBounds = pt(0).extent(pt(100,100));
        $super(initialBounds.extent());
        this.setPosition(initialBounds.topLeft());
        this.setFill(Color.blue);
        //this.disableGrabbing();
        //this.disableDragging();
        //this.defineReactComponents();
        // this is the initial render call, from which on all the
        // hierarchical morph rendering is handled through React
        //React.renderComponent(this.reactComponent, this.renderContext().morphNode);
    }
});

}); // end of module
