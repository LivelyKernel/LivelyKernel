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
      try {
        if (this.preserveContents)
            return this.getImageData();
      } catch (e) { return null; }
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
            this._canvasSerializationDataURI = !this.world() && this._canvasSerializationDataURI ?
              this._canvasSerializationDataURI : this.toDataURI();
    }
,

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
        var img = new Image(), self = this;
        img.onload = function() {
          var ctx = self.getContext();
          ctx.drawImage(img,0,0); };
        img.src = uri;
    },

    fromImageMorph: function(imgMorph, opts) {
      return this.fromImageElement(imgMorph.renderContext().imgNode, opts);
    },

    fromImageElement: function(el, opts) {
      opts = opts || {};
      var imgExt = pt(el.naturalWidth, el.naturalHeight);
      var ext = opts.extent || imgExt;
      if (opts.keepAspectRatio && (imgExt.x > ext.x || imgExt.y > ext.y)) {
        var ratioX = ext.x / imgExt.x,
            ratioY = ext.y / imgExt.y,
            ratio = Math.min(ratioX, ratioY);
        ext = imgExt.scaleBy(ratio);
      }
      if (opts.resize) this.setExtent(ext);
      this.getContext().drawImage(el, 0,0, ext.x, ext.y);
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
    },
    
    mapImageData: function(mapFunc, optBounds) {
      optBounds = optBounds || this.getCanvasBounds();
      var ctx = this.getContext(),
          w = ctx.canvas.width, h = ctx.canvas.height,
          imgData = this.getImageData();
      optBounds.allPoints().map(function(p) {
        var i = 4 * (p.y * w + p.x),
            col = Color.fromTuple8Bit([imgData.data[i], imgData.data[i+1], imgData.data[i+2], imgData.data[i+3]]),
            mapped = mapFunc.call(this, p, col, i);
        if (!mapped || !mapped.isColor) throw new Error("mapImageData map function returned invalid data value: " + mapped);
        var mappedTuple = mapped.toTuple8Bit();
        imgData.data[i] = mappedTuple[0]; imgData.data[i+1] = mappedTuple[1]; imgData.data[i+2] = mappedTuple[2]; imgData.data[i+3] = mappedTuple[3];
      }, this)
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
                if (data) this.onCanvasChanged(newExt, oldExt, data);
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
    },

    logoHTMLString: function () {
      return this.toImage().logoHTMLString()
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
},
"drawing", {

  drawWithOptions: function(options, drawFunc) {
    var ctx = (options && options.ctx) || this.getContext();
    if (options) {
      ctx.save();
      if (options.transform) ctx.setTransform(options.transform);
      if (options.strokeStyle)              ctx.strokeStyle              = options.strokeStyle
      if (options.fillStyle)                ctx.fillStyle                = options.fillStyle
      if (options.globalAlpha)              ctx.globalAlpha              = options.globalAlpha
      if (options.lineWidth)                ctx.lineWidth                = options.lineWidth
      if (options.lineCap)                  ctx.lineCap                  = options.lineCap
      if (options.lineJoin)                 ctx.lineJoin                 = options.lineJoin
      if (options.miterLimit)               ctx.miterLimit               = options.miterLimit
      if (options.lineDashOffset)           ctx.lineDashOffset           = options.lineDashOffset
      if (options.shadowOffsetX)            ctx.shadowOffsetX            = options.shadowOffsetX
      if (options.shadowOffsetY)            ctx.shadowOffsetY            = options.shadowOffsetY
      if (options.shadowBlur)               ctx.shadowBlur               = options.shadowBlur
      if (options.shadowColor)              ctx.shadowColor              = options.shadowColor
      if (options.globalCompositeOperation) ctx.globalCompositeOperation = options.globalCompositeOperation
      if (options.font)                     ctx.font                     = options.font
      if (options.textAlign)                ctx.textAlign                = options.textAlign
      if (options.textBaseline)             ctx.textBaseline             = options.textBaseline
      if (options.direction)                ctx.direction                = options.direction
      if (options.imageSmoothingEnabled)    ctx.imageSmoothingEnabled    = options.imageSmoothingEnabled
    }
    try {
      return drawFunc.call(this, ctx);
    } finally {
      if (options) ctx.restore();
    }
  },

  drawLine: function(line, options) {
    return this.drawWithOptions(options, function(ctx) {
      ctx.beginPath()
      ctx.moveTo(line.start.x, line.start.y)
      ctx.lineTo(line.end.x, line.end.y)
      ctx.closePath()
      ctx.stroke();
    });
  },

  drawVec: function(pointVec, options) {
    return this.drawLine(pt(0,0).lineTo(pointVec), options);
  },

});

Object.extend(lively.morphic.CanvasMorph, {
    fromImageMorph: function(imgMorph) {
        return (new this()).fromImageMorph(imgMorph, {resize: true});
    }
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

lively.morphic.HtmlWrapperMorph.subclass("lively.morphic.HTML5Video",
"initialization", {
  initialize: function($super, extent, videoURL) {
    $super(extent);
    this.videoURL = videoURL || null;
    if (videoURL) this.loadVideoThenDo(videoURL, true, function() {});
  },

  setVideoMarkup: function(videoURL) {
    var videoName = videoURL.replace(/(\.mov|\.mp4|\.webm|\.oggtheora.ogv)$/, ""),
        extent = this.getExtent(),
        html = lively.lang.string.format(
         "<video style=\"display: inline-block;\" width=\"%spx\" height=\"%spx\" autobuffer=\"autobuffer\">"
      +   "<source src=\"%s.mov\" type=\"video/mp4;\"/>"
      +   "<source src=\"%s.mp4\" type=\"video/mp4; codecs=&quot;avc1.42E01E, mp4a.40.2&quot;\"/>"
      +   "<source src=\"%s.webm\" type=\"video/webm; codecs=&quot;webm, vp8&quot;\"/>"
      +   "<source src=\"%s.oggtheora.ogv\" type=\"video/ogg; codecs=&quot;theora, vorbis&quot;\"/>"
      + "</video>", extent.x, extent.y, videoName, videoName, videoName);
    this.setHTML(html);
  },

  loadVideoThenDo: function(videoURL, useNativeExtent, thenDo) {
    this.videoURL = videoURL;
    this.setVideoMarkup(videoURL);
    var m = this;

    lively.lang.fun.waitFor(1000,
      function() { return m.videoElement() && m.videoElement().videoWidth != 0; },
      onload)
  
    function onload(err) {
      var n = m.videoElement();
      if (!err && useNativeExtent && n.videoWidth > 0) {
        m.setExtent(pt(n.videoWidth, n.videoHeight));
        n.width = n.videoWidth; n.height = n.videoHeight;
      }
      thenDo && thenDo(err, m);
    }
  }

},
"video related", {

  videoElement: function() { return this.renderContext().shapeNode.childNodes[0]; },

  setControlsVisible: function(bool) { return this.videoElement().controls = bool; },

  play: function() { return this.videoElement().play(); },

  pause: function() { return this.videoElement().pause(); }

});

Object.extend(lively.morphic.HTML5Video, {
  withVideoMorph: function(videoURL, extent, thenDo) {
    var useNativeExtent = false;
    if (typeof extent === "function") {
      thenDo = extent; extent = null;
      useNativeExtent = true;
    }
    var m = new lively.morphic.HTML5Video(extent || pt(300,200));
    m.loadVideoThenDo(videoURL, useNativeExtent, thenDo);
    return m;
  }
});

}); // end of module
