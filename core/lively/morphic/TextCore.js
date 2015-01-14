module('lively.morphic.TextCore').requires('cop.Layers', 'lively.morphic.Core').toRun(function() {

Trait('TextChunkOwner',
'rendering', {
    forceRender: function() {
        this.setTextChunks(this.getTextChunks());
    }
},
'accessing', {
    createChunk: function() {
        var c = new lively.morphic.TextChunk();
        c.addTo(this);
        return c;
    },
    getTextChunks: function() {
        if (!this.textChunks || this.textChunks.length === 0) {
            this.textChunks = [this.createChunk()];
        }
        return this.textChunks;
    },
    setTextChunks: function(chunks) {
        this.removeTextChunks();
        chunks.invoke('addTo', this);
        this.textChunks = chunks;
        this.cachedTextString = null;
    },

    setTextChunksFromTo: function() {},

    firstTextChunk: function() { return this.getTextChunks()[0]; },

    getChunkRanges: function(chunks) {
        chunks = chunks || this.getTextChunks();
        var from = 0, len = chunks.length, result = new Array(chunks.length);
        for (var i = 0; i < len; i++) {
            var to = from + chunks[i].textString.length;
            result[i] = [from, to];
            from = to;
        }
        return result;
    },

    getChunkStyles: function() {
        return this.getTextChunks().collect(function(ea) { return ea.getStyle() });
    },

    getChunkStyleAndRanges: function() {
        return this.getChunkRanges()
                .zip(this.getChunkStyles())
                .map(function(rangeAndStyle) {
                    return [rangeAndStyle[0][0],
                            rangeAndStyle[0][1],
                            rangeAndStyle[1]]})
    }

},
'testing', {
    isFocused: Functions.False
},
'removing', {
    removeTextChunks: function() {
        this.fixChunks();
        if (!this.textChunks) return;
        while (this.textChunks.length > 0) {
            var chunk = this.textChunks.shift();
            chunk.remove();
        }
    }
},
'chunk computations', {

    getChunkAndLocalIndex: function(idx, useChunkStart, optRanges) {
        // when useChunkStart = false and a chunk ends at idx then we return that
        // when useChunkStart = true then we return the next chunk if there is one
        // if chunk ranges are [[0, 1], [1, 3], [3, 6]]
        // useChunkStart == false, idx == 1 returns [chunk[0],1]
        // useChunkStart == false, idx == 2 returns [chunk[1],1]
        // useChunkStart == true, idx == 1 returns [chunk[1],0]
        var chunks = this.getTextChunks(), ranges = optRanges || this.getChunkRanges(chunks);
        for (var i = 0, len = ranges.length; i < len; i++) {
            var from = ranges[i][0],
                to = ranges[i][1];
            if (useChunkStart) {
                if (idx < to || (from === to && from === idx)) return [chunks[i], idx-from];
            } else {
                if (idx <= to) return [chunks[i], idx-from];
            }
        }
        return null;
    },

    sliceTextChunks: function(from, to, optChunkRanges) {
        // When text should be styled we need text chunks that represent the
        // text ranges that should be styled. This method returns an array of
        // chunks that represent the text in the range from to. Note that this
        // cannot be only one chunk since the from-to range can cross existing
        // style ranges.
        //
        // To cleanup unnecessary text chunks (text chunk who have the same
        // style than their neighbours) call #coalesceChunks
        //
        // Example: Given the text "Lively rockz".
        // Given the styling: "Lively " - none,  ""rockz" - bold
        // I.e. two text chunks exist already:
        // [TextChunk(0-7, TextEmphasis({})),
        //  TextChunk(7-12, TextEmphasis({"fontWeight": "bold"}))]
        // When we want to underline "ly ro" we first need to create new
        // chunks that represent that text range (by calling
        // text.sliceTextChunks(4, 9)). This will create two new text chunks:
        // [TextChunk(4-7, TextEmphasis({})),
        //  TextChunk(7-9, TextEmphasis({"fontWeight": "bold"}))]
        // those will be added to the textChunks list of this text at the right
        // positions

        // 1. sanitize indexes
        var maxLength = this.textString.length,
            fromSafe = Math.min(from, to),
            toSafe = Math.max(from, to),
            startChunk, endChunk;
        fromSafe = Math.max(0, Math.min(maxLength, fromSafe));
        toSafe = Math.max(0, Math.min(maxLength, toSafe));

        var sliceLength = toSafe - fromSafe,
            ranges = optChunkRanges || this.getChunkRanges(),
            chunkAndIndexAtStart = this.getChunkAndLocalIndex(fromSafe, true, ranges);

        // 2. does a text chunk already match from - to?
        if (chunkAndIndexAtStart
          && chunkAndIndexAtStart[1] === 0
          && chunkAndIndexAtStart[0].textString.length === sliceLength) {
            return [chunkAndIndexAtStart[0]];
        }

        // 3. special handling of chunks with length 0
        if (sliceLength === 0) {
            var chunkBeforeSpec = this.getChunkAndLocalIndex(fromSafe, false, ranges);
            if (!chunkBeforeSpec) return [];
            var chunkBefore = chunkBeforeSpec[0].splitBefore(chunkBeforeSpec[1], ranges),
                chunkAfter = chunkBefore.next(),
                chunks = this.getTextChunks(),
                idxInChunks = chunks.indexOf(chunkBefore),
                newChunk = chunkBefore.createForSplit('');
            chunks.splice(idxInChunks + 1, 0, newChunk);
            newChunk.addTo(this, chunkAfter);
            return [newChunk];
        }

        // split the chunks and retrieve chunks inbetween from-to
        var start = this.getChunkAndLocalIndex(fromSafe, false, ranges);
        if (!start) return [];
        startChunk = start[0].splitAfter(start[1], ranges);
        var chunks = this.getTextChunks(),
            startIdx = chunks.indexOf(startChunk);

        var end = this.getChunkAndLocalIndex(toSafe, false, ranges);
        if (!end) return [];
        endChunk = end[0].splitBefore(end[1], ranges);
        var endIdx = chunks.indexOf(endChunk);

        return chunks.slice(Math.min(startIdx, endIdx), endIdx+1);
    },

    coalesceChunks: function () {
        // see comment in #sliceTextChunks
        var chunk = this.firstTextChunk(), domChanged = false, last;
        while (chunk) {
            last = chunk;
            if (chunk.tryJoinWithNext()) {
                domChanged = true;
            } else {
                chunk = chunk.next();
            }
        }
        last.ensureEndsWithBr();
        return domChanged;
    }
},
'garbage collection', {
    fixChunks: function() {
        var selRange = this.hasSelection() && this.getSelectionRange(),
            chunks = this.garbageCollectChunks(),
            domChanged = false;
        if (chunks.length === 0) {
            return;
        }
        domChanged = this.fixTextBeforeAndAfterChunks(chunks);
        domChanged = domChanged || this.removeNonChunkNodes(chunks);
        chunks.last().ensureEndsWithBr();
        if (!selRange) return;
        var newSelectionRange = this.getSelectionRange(),
            selMustChange = domChanged || (newSelectionRange && newSelectionRange[0] !== selRange[0]);
        if (!selMustChange) return;
        this.setSelectionRange(selRange[0], selRange[1]);
    },
    fixChunksDelayed: function() {
        this.fixChunks.bind(this).delay(0);
    },
     garbageCollectChunks: function() {
        // garbage collect unused chunks, e.g. when the user has selected and removed
        // a part of the text that did cross chunk bounds
        // sometimes chunk nodes might be removed (paste operation on MacOS Chrome) but their
        // content is actually still there -- reclaim those chunks
        // see also lively.morphic.tests.TextMorphRichTextTests>>test22HandleRemovedSpanNodesOnPaste
        var textNode = this.getTextNode(),
            chunksInUse = [],
            chunks = this.getTextChunks();
        for (var i = 0; i < chunks.length; i++) {
            // parent is rendered, so chunk should be rendered as well, otherwise it should be
            // reclaimed by GC . if parent is not rendered, but a reference prevents GCing,
            // then all children won't be in rendering scene graph, so do not GC them...
            if (!(this.renderContext && this.renderContext().textNode) || chunks[i].isRendered()) {
                chunksInUse.push(chunks[i]);
                continue;
            }

            // What if first chunk is broken --> currently just cancel but give warning
            if (!chunks[i-1]) { // need chunk before
                console.warn('trying to reclaimRemovedChunks of a text chunk with no prev chunk');
                continue;
            }

            // find the next valid chunk, this becomes the chunks new nextChunk
            // no nextRenderedChunk is OK, than we are at end
            var nextRenderedChunk;
            for (var j = i+1; j < chunks.length; j++) {
                if (chunks[j].isRendered()) {
                    nextRenderedChunk = chunks[j];
                    break;
                }
            }

            // if we find chunks between prev and nextRenderedChunk then they are added to
            // chunks[i]. If we find nothing this chunk can really be removed
            var nodesBetween = chunks[i-1].nodesBetweenMeAndOther(nextRenderedChunk);
            if (nodesBetween.length === 0) continue; // nothing found
            chunks[i].claim(nodesBetween);
            chunks[i].addTo(this, nextRenderedChunk);
            chunksInUse.push(chunks[i]);
        }
        return this.textChunks = chunksInUse;
    },

    removeNonChunkNodes: function(chunks) {
        var domChanged = false;
        for (var i = 0, len = chunks.length; i < len; i++) {
            domChanged = domChanged || chunks[i].removeNonChunkNodes();
        }
        return domChanged;
    },

    fixTextBeforeAndAfterChunks: function(chunks) {
        // this removes the focus and selection
        // if the DOM is really changed
        chunks = this.getTextChunks();
        var domChanged = chunks[0].ingestAllPrecedingElements();
        for (var i = 0, len = chunks.length; i < len; i++) {
            domChanged = domChanged || chunks[i].ingestAllFollowingElements(chunks[i+1]);
        }
        return domChanged;
    }
},

'debugging', {
    isInChunkDebugMode: function() {
        return !!this.chunkDebugMode;
    },
    setChunkDebugMode: function(bool) { this.chunkDebugMode = bool; this.forceRender();
    }
}
);

lively.morphic.Morph.subclass('lively.morphic.Text', Trait('TextChunkOwner'),
'properties', {
    isText: true,
    allowInput: true,
    style: {
        borderWidth: 1,
        borderColor: Color.black,
        fill: Color.veryLightGray,
        fixedWidth: true,
        fixedHeight: true,
        enableGrabbing: false,
        enableDropping: false,
        enableDragging: true,
        allowInput: true,
        clipMode: 'visible',
        fontFamily: 'Helvetica',
        textColor: Config.get('textColor'),
        fontSize: 10,
        padding: Rectangle.inset(4, 2),
        selectable: true
    },

    autoAdjustPadding: true,
    suppressDropping: true
},
'initializing', {
    initialize: function($super, bounds, string) {
        $super(this.defaultShape(bounds));
        this.textString = string || '';
        this.charsTyped = '';
        this.evalEnabled = false;
        this.fit();
        if (this.prepareForTextMutationRecording) this.prepareForTextMutationRecording();
    }
},
'styling', {
    applyStyle: function($super, spec) {
        if (!spec) return this;
        if (spec.allowInput !== undefined) this.setInputAllowed(spec.allowInput); // also sets handstyle that might be overriden
        if (spec.selectable !== undefined) this.setIsSelectable(spec.selectable); // also sets handstyle that might be overriden
        $super(spec);
        if (spec.fixedWidth !== undefined) this.setFixedWidth(spec.fixedWidth);
        if (spec.fixedHeight !== undefined) this.setFixedHeight(spec.fixedHeight);
        if (spec.fontFamily !== undefined) this.setFontFamily(spec.fontFamily);
        if (spec.fontSize !== undefined) this.setFontSize(spec.fontSize);
        if (spec.textColor !== undefined) this.setTextColor(spec.textColor);
        if (spec.fontWeight !== undefined) this.setFontWeight(spec.fontWeight);
        if (spec.fontStyle !== undefined) this.setFontStyle(spec.fontStyle);
        if (spec.textDecoration !== undefined) this.setTextDecoration(spec.textDecoration);
        if (spec.padding !== undefined) this.setPadding(spec.padding);
        if (spec.align !== undefined) this.setAlign(spec.align);
        if (spec.verticalAlign !== undefined) this.setVerticalAlign(spec.verticalAlign);
        if (spec.lineHeight !== undefined) this.setLineHeight(spec.lineHeight);
        if (spec.display !== undefined) this.setDisplay(spec.display);
        if (spec.whiteSpaceHandling !== undefined) this.setWhiteSpaceHandling(spec.whiteSpaceHandling);
        if (spec.wordBreak !== undefined) this.setWordBreak(spec.wordBreak);
        if (spec.syntaxHighlighting !== undefined) spec.syntaxHighlighting ? this.enableSyntaxHighlighting() : this.disableSyntaxHighlighting();
        if (spec.cssStylingMode !== undefined) this.setTextStylingMode(spec.cssStylingMode);
        return this;
    }
},
'accessing', {
    setExtent: function($super, value) {
        var result = $super(value);
        if (this.owner && this.owner.isInLayoutCycle) return result;
        this.setTextNodeToFitMorphExtent();
        return result;
    },

    getTextExtent: function() { return this.renderContextDispatch('getTextExtent') },
    getTextBounds: function() { return pt(0,0).extent(this.getTextExtent()) },
    visibleTextBounds: function() {
        return this.innerBounds().insetByRect(this.getPadding());
    },
    get textString() {
        // when the prototype property is accessed
        if (this === this.constructor.prototype) return undefined;
        if (!this.cachedTextString) {
            this.cachedTextString = this.renderContextDispatch('getTextString');
        }
        return this.cachedTextString;
    },

    set textString(string) {
        string = String(string);
        // setting the textString removes all the content in the text morph
        this.removeTextChunks();
        this.renderContextDispatch('updateText', string);
        this.cachedTextString = string;
        delete this.priorSelectionRange;
        return string;
    },

    setTextString: function(string) { return this.textString = string },

    getTextString: function() { return this.textString },

    appendTextString: function(string) { return this.textString += string },

    replaceTextString: function(string) {
        var style = this.firstTextChunk().style;
        this.textString = string;
        this.emphasizeAll(style);
        return string;
    },

    insertTextStringAt: function(index, string) {
        // keeping style
        var chunks = this.sliceTextChunks(index - 1, index),
            firstChunk = chunks[0];
        if (!firstChunk) {
            console.warn('insertTextStringAt failed, found no text chunk!');
            return;
        }
        this.cachedTextString = null;
        firstChunk.textString += string;
        this.coalesceChunks();
    },

    setTextColor: function(color) { 
        this.getTextChunks().forEach(
            function (ea) { 
                var style = ea.getStyle();
                style.setColor(color);
                ea.styleText(style);
            })
        return this.morphicSetter('TextColor', color); 
    },
    getTextColor: function() { return this.morphicGetter('TextColor') || Color.black },
    setFontSize: function(size) { return this.morphicSetter('FontSize', size) },
    getFontSize: function() { return this.morphicGetter('FontSize') },
    setFontFamily: function(fontName) { return this.morphicSetter('FontFamily', fontName) },
    getFontFamily: function() { return this.morphicGetter('FontFamily') },
    setFontWeight: function(fontName) { return this.morphicSetter('FontWeight', fontName) },
    getFontWeight: function() { return this.morphicGetter('FontWeight') },
    setFontStyle: function(fontName) { return this.morphicSetter('FontStyle', fontName) },
    getFontStyle: function() { return this.morphicGetter('FontStyle') },
    setTextDecoration: function(fontName) { return this.morphicSetter('TextDecoration', fontName) },
    getTextDecoration: function() { return this.morphicGetter('TextDecoration') },

    setPadding: function(rect) {
        this.shape.setPadding(rect);
        this.fit();
    },
    getPadding: function() { return this.shape.getPadding() },
    setAlign: function(align) { return this.morphicSetter('Align', align) },
    getAlign: function() { return this.morphicGetter('Align') },
    setVerticalAlign: function(valign) { return this.morphicSetter('VerticalAlign', valign) },
    getVerticalAlign: function() { return this.morphicGetter('VerticalAlign') },
    setLineHeight: function(lheight) { return this.morphicSetter('LineHeight', lheight) },
    getLineHeight: function() { return this.morphicGetter('LineHeight') },
    setDisplay: function(mode) { return this.morphicSetter('Display', mode) },
    getDisplay: function() { return this.morphicGetter('Display') },

    setFixedWidth: function(bool) {
        this.fixedWidth = bool;
        this.fit();
    },
    setFixedHeight: function(bool) {
        this.fixedHeight = bool
        this.fit();
    },
    setClipMode: function($super, modeString) {
        var r = $super(modeString);
        if (this.isClip()) this.applyStyle({fixedHeight: true, fixedWidth: true});
        this.fit();
        return r;
    },
    setMaxTextWidth: function(value) { this.morphicSetter('MaxTextWidth', value); },
    setMaxTextHeight: function(value) { this.morphicSetter('MaxTextHeight', value) },
    getMinTextWidth: function() { return this.morphicGetter('MinTextWidth'); },
    setMinTextWidth: function(value) { this.morphicSetter('MinTextWidth', value) },
    getMinTextHeight: function() { return this.morphicGetter('MinTextHeight'); },
    setMinTextHeight: function(value) { this.morphicSetter('MinTextHeight', value) },
    setTextExtent: function(value) { this.morphicSetter('TextExtent', value) },
    getTextNode: function() { return this.renderContext().textNode },

    inputAllowed: function() { return this.allowInput },
    setInputAllowed: function(bool) {
        this.morphicSetter('InputAllowed', bool);
        this.setHandStyle(bool ? null : 'default');
        return this.allowInput = bool;
    },

    isSelectable: function() {
      var val = this.morphicGetter('IsSelectable');
      return typeof val === "undefined" ? true : val;
    },
    setIsSelectable: function(value) { this.morphicSetter('IsSelectable', value); }

},
'rendering', {

    growOrShrinkToFit: function() {
        if (!this.getExtent().eqPt(this.getTextExtent())) {
            this.setExtent(this.getTextExtent());
        }
    },

    fit: function() {
        // expensive operation, only do when we are in world since we cannot
        // figure out the real bounds before we are in DOM anyway

        this.setTextNodeToFitMorphExtent();
        if (!this.world()) return;

        var isClip = this.isClip(),
            fixedWidth = isClip || this.fixedWidth,
            fixedHeight = isClip || this.fixedWidth;

        if (this.fixedWidth && this.fixedHeight) return;

        var owners = this.ownerChain();
        for (var i = 0; i < owners.length; i++) {
            if (owners[i].isInLayoutCycle || !owners[i].isRendered()) return;
        }

        var extent = this.getExtent(),
            textExtent = this.getTextExtent(),
            borderWidth = this.getBorderWidth(),
            padding = this.getPadding(),
            paddingWidth = padding.left() + padding.right(),
            paddingHeight = padding.top() + padding.bottom(),
            width = extent.x, height = extent.y;
        if (!this.fixedWidth) {
            width = textExtent.x + borderWidth*2 + paddingWidth;
        }
        if (!this.fixedHeight) {
            height = textExtent.y + borderWidth*2 + paddingHeight;
        }
        if (width !== extent.x || height !== extent.y) {
            this.setExtent(pt(width, height));
        }
    },

    fitThenDo: function(thenDo) {
        // call fit once! register callbacks along the lines...
        var text = this, id = text.id+'_fitThenDo',
            queue = Functions.createQueue(id, function(afterFitFunc, next) {
                afterFitFunc.call(text); next(); });
        queue.pushNoActivate(thenDo);
        Functions.debounceNamed(id, 20, function() {
            text.fit(); queue.activateWorker(); })();
        return this;
    },

    setTextNodeToFitMorphExtent: function() {
        // In case we do not want the text extent to grow unlimited (when
        // fixedWidth / fixedHeight / beClip is set) we restrict the text
        // bounds to the bounds of the morph itself.
        // FIXME: this should go into lively.morphic.HTML
        var textNode = this.renderContext().textNode;
        if (!textNode) return;
        var isClip = this.isClip(),
            fixedWidth = isClip || this.fixedWidth,
            fixedHeight = isClip || this.fixedHeight,
            style = textNode.style,
            prefix, padding, isMoz = !!UserAgent.fireFoxVersion;

        if (fixedWidth || fixedHeight) {
            // only compute it when needed
            padding = this.getPadding();
            prefix = this.renderContext().domInterface.html5CssPrefix;
        }

        if (fixedWidth) {
            var paddingWidth = padding ? padding.left() + padding.right() : 0,
                newWidth = prefix + 'calc(100% - ' + paddingWidth + 'px)';
            style.minWidth = newWidth;
        } else {
            var minWidth = this.getMinTextWidth()
            style.minWidth = minWidth ? minWidth + 'px' : null;
        }
        if (isMoz) style.width = style.minWidth;

        if (fixedHeight) {
            var paddingHeight = padding ? padding.top() + padding.bottom() : 0,
                newHeight = prefix + 'calc(100% - ' + paddingHeight + 'px)';
            style.minHeight = newHeight;
        } else {
            var minHeight = this.getMinTextHeight();
            style.minHeight = minHeight ? minHeight + 'px' : null;
        }
        if (isMoz) style.height = style.minHeight;
    },

    computeRealTextBounds: function() {
        var node = this.renderContext().textNode,
            clone = node.cloneNode(true),
            attrs = ["width", "height", "min-width", "min-height", "max-width", "max-height"];
        attrs.forEach(function(attr) { clone.style[attr] = '' });
        node.parentNode.appendChild(clone);
        var domBounds = lively.$(clone).bounds();
        node.parentNode.removeChild(clone);
        return rect(pt(domBounds.left,domBounds.top), pt(domBounds.right,domBounds.bottom));
    },

    computeCharBounds: function() {
        var domBoundsToLively = function(domBounds) { return rect(pt(domBounds.left,domBounds.top), pt(domBounds.right,domBounds.bottom)); };
        var string = this.textString,
            node = this.renderContext().textNode,
            clone = node.cloneNode(false)

        var attrs = ["width", "height", "min-width", "min-height", "max-width", "max-height"];
        attrs.forEach(function(attr) { clone.style[attr] = '' });

        try {
            node.parentNode.appendChild(clone);
            // use the span nodes of the text chunks for creating
            // textString.length spans (to be able to measure every character)
            return this.getTextChunks().reduce(function(spans, chunk) {
                var chars = chunk.textString.split(''),
                    protoSpan = chunk.chunkNode.cloneNode(false);
                return spans.concat(chars.map(function(char) {
                    var span = protoSpan.cloneNode(false);
                    span.textContent = char;
                    return span;
                }));
            }, []).map(function(span, i) {
                span.id = String(i);
                clone.appendChild(span);
                return domBoundsToLively(lively.$(span).bounds());
            });

        } finally {
            node.parentNode.removeChild(clone);
        }
    }


},
'text modes', {
    beLabel: function(customStyle) {
        this.isLabel = true;
        var labelStyle = {
            fill: null,
            borderWidth: 0,
            fixedWidth: false, fixedHeight: false,
            allowInput: false,
            clipMode: 'hidden',
            whiteSpaceHandling: "pre"
        };
        if (customStyle) labelStyle = Object.merge([labelStyle, customStyle]);
        this.ignoreEvents();
        this.applyStyle(labelStyle);
        return this;
    },
    beInputLine: function(customStyle) {
        this.isInputLine = true;
        var inputLineStyle = {
            fixedWidth: false,
            fixedHeight: true,
            clipMode: 'hidden',
            allowInput: true,
        };
        if (customStyle) inputLineStyle = Object.merge([inputLineStyle, customStyle]);
        this.applyStyle(inputLineStyle);
        return this;
    },
},
'keyboard events', {

    onKeyDown: function(evt) {
        this.cachedTextString = null;

        var shortCutResults = this.shortcutHandlers.invoke('invoke', evt, this);
        if (shortCutResults.include(true)) {
            evt.stop();
            return true;
        }

        if ((evt.isCommandKey() || evt.isCtrlDown()) && !(evt.isCtrlDown() && evt.isAltDown())) {
            var result = this.processCommandKeys(evt);
            if (result) evt.stop();
            // return result;
        }

        var c = evt.getKeyCode();
        if (c === Event.KEY_DELETE) return this.onDelPressed(evt);
        if (c === Event.KEY_BACKSPACE) return this.onBackspacePressed(evt);
        if (c === Event.KEY_TAB) return this.onTabPressed(evt);
        if (c === Event.KEY_RETURN) return this.onEnterPressed(evt);
        if (c === Event.KEY_ESC) return this.onEscPressed(evt);
        if (c === Event.KEY_HOME) return this.onHomePressed(evt);
        if (c === Event.KEY_END) return this.onEndPressed(evt);
        if (c === Event.KEY_PAGEUP) return this.onPageUpPressed(evt);
        if (c === Event.KEY_PAGEDOWN) return this.onPageDownPressed(evt);
        if (c === Event.KEY_LEFT) return this.onLeftPressed(evt);
        if (c === Event.KEY_RIGHT) return this.onRightPressed(evt);
        if (c === Event.KEY_UP) return this.onUpPressed(evt);
        if (c === Event.KEY_DOWN) return this.onDownPressed(evt);

        return true;
    },
    onKeyUp: function(evt) {
        // actually it should only be necessary to null the text cache here, it should
        // be possible to remove cachedTextString = null from onKeyPress and onKeyDown
        this.cachedTextString = null

        // textString getter is expensive so only trigger when observers exist
        // Note that textString may not be changed, e.g. when pressing a control key only
        if (this.attributeConnections) {
            lively.bindings.signal(this, 'textString', this.textString);
        }

        this.fit();

        if (evt.isShiftDown()) {
            this.priorSelectionRange = this.getSelectionRange();
        }
        
        if (UserAgent.isChrome && UserAgent.isMobile) {
            this.onKeyPress(evt);
        }

        evt.stop();
        return true;
    },

    onKeyPress: function(evt) {
        this.cachedTextString = null;

        // save info for 'More' command
        this.rememberSelectionForDoMore('onKeyPress');

        var key = evt.getKeyChar();
        if (key && key.toLowerCase() == "v" && evt.isCommandKey()) {
            this.charsTyped += lively.morphic.Text.clipboardString;
        } else {
            this.charsTyped += key;
        }

        // if (this.textString.length == 0) this.textString += key;

        this.fixChunksDelayed();
        evt.stopPropagation()
        return true;
    },

    onPaste: function (evt) {
        var htmlData = evt.clipboardData && evt.clipboardData.getData("text/html"),
            textData = evt.clipboardData && evt.clipboardData.getData("text/plain");

        if ((!htmlData && !textData) || htmlData === textData /*when html text is pasted*/) {
            this.fixChunksDelayed();
            return false; // let HTML magic handle paste
        }

        // try to process own rich text
        var success = false;
        try {
            var data = htmlData || lively.morphic.HTMLParser.stringToHTML(textData);
            success = lively.morphic.HTMLParser.insertPasteDataIntoText(data, this);
        } catch (e) {}

        // if rich-text paste does not work then at least insert text string
        if (!success) {
            this.insertAtCursor(textData, true, true);
        }

        evt.stop()
        return true;
    },

    onCut: function(evt) {
        this.fixChunksDelayed();
    },

    processCommandKeys: function(evt) {
        var key = evt.getKeyChar();
        if (key) key = key.toLowerCase();

        if (evt.isShiftDown()) {  // shifted commands here...
            switch (key) {
                case "i": { this.doInspect(); return true; }
                case "e": { this.doEdit(); return true; }
                case "d": { this.doDebugit(); return true; }
                case "p": { this.doListProtocol(); return true; }
                case "r": { this.doBrowseReferences(); return true; }
                case "f": { this.doCodeSearch(); return true; }
                case "b": { this.doBrowseClass(); return true; }
                case "s": { this.convertTabsToSpaces(); return true; }
                case "u": { this.unEmphasizeSelection(); return true; }
                case "x": { this.doAutoIndent(); return true;}
                case "5": { this.emphasizeSelection({color: Config.userColor1 || Color.black}); return true; }
                case "6": { this.emphasizeSelection({color: Config.userColor2 || Color.red}); return true; }
                case "7": { this.emphasizeSelection({color: Config.userColor3 ||  Color.green}); return true; }
                case "8": { this.emphasizeSelection({color: Config.userColor4 || Color.blue}); return true; }
            }
        }

        switch (key) {
            case "d": { this.doDoit(); return true; } // Doit
            case "p": { this.doPrintit(); return true; } // Printit
            case "s": { this.doSave(); return true; }
            case "b": { this.toggleEmphasisForSelection('Boldness'); return true; }
            case "i": { this.toggleEmphasisForSelection('Italics'); return true; }
            case "k": { this.toggleEmphasisForSelection('Link'); return true; }
            case "o": { this.toggleEmphasisForSelection('Doit'); return true; }
            case "t": { alert("browser intercepts this t"); return true;}
            case "u": { this.toggleEmphasisForSelection('Underline'); return true; }
            case "l": { this.openRichTextSpecEditor(); return true; }

            case "1": { this.applyStyle({align: 'left'}); return true; }
            case "2": { this.applyStyle({align: 'right'});; return true; }
            case "3": { this.applyStyle({align: 'center'}); return true; }
            case "4": { this.applyStyle({align: 'justify'}); return true; }
            case "5": { this.setFontSize(8); return true; }
            case "6": { this.setFontSize(12); return true; }
            case "7": { this.setFontSize(18); return true; }
            case "8": { this.setFontSize(30); return true; }

            case "e": { this.doExchange(); return true; }
            case "f": { this.doFind(); return true; }
            case "g": { this.doFindNext(); return true; }
            case "m": { this.doMore(evt.isShiftDown()); return true; }

            case "a": {
                if (this.charsTyped && this.charsTyped.length > 0) {
                    // select recent typing, if any
                    var i = this.getSelectionRange()[1];
                    this.setSelectionRange(i - this.charsTyped.length, i);
                    this.charsTyped = '';
                    return true;
                }
                // Otherwise, do a normal select-all
                this.selectAll();
                return true;
            }
            case "x": { lively.morphic.Text.clipboardString = this.selectionString(); return false; }
            case "c": { lively.morphic.Text.clipboardString = this.selectionString(); return false; }
            case "v": { /*Just do the native paste*/ return false; }
            case "z": {
                if (!this.undo) return false;
                this.undo(); return true;
            }
        }

        switch(evt.getKeyCode()) {
            // Font Size
            case 187/*cmd+'+'*/: {
                if (this.hasNullSelection())
                    this.setFontSize(this.getFontSize() + 1);
                else
                    this.increaseFontSizeOfSelection();
                return true;
            }
            case 189/*cmd+'-'*/: {
                if (this.hasNullSelection())
                    this.setFontSize(this.getFontSize() - 1);
                else
                    this.decreaseFontSizeOfSelection();
                return true;
            }

            // indent/outdent selection
            case 221/*cmd+]*/: { this.indentSelection(); return true }
            case 219/*cmd+[*/: { this.outdentSelection(); return true }

            // comment/uncoment selection
            case 191 /*cmd+/*/: { this.addOrRemoveComment(); return true }
        }

        return false;
    },
    doDoit: function() { this.evalSelection(false) },
    doPrintit: function() { this.evalSelection(true) },
    doDebugit: function() {
        var that = this;
        // FIXME: use new debugging api
        require('lively.ast.Morphic').toRun(function() {
            that.debugSelection();
        });
    },
    doSave: function() {
        // resetting cachedTextString is necessary when doSave is not triggered by
        // cmd+s but from outside (e.g. from a button). The cachedTextString would not have
        // the current textString but an old one
        this.cachedTextString = null;
        this.savedTextString = this.textString;
        if (this.evalEnabled) {
            alertOK('eval')
            this.tryBoundEval(this.savedTextString)
        }
    },

    doListProtocol: function() {
        lively.require("lively.ide.codeeditor.Completions").toRun(function() {
            new lively.ide.codeeditor.Completions.ProtocolLister(this).evalSelectionAndOpenListForProtocol();
        }.bind(this));
    },

    doFind: function() {
        var text = this;
        this.world() && this.world().prompt(
            "Enter the text you wish to find...",
            function(response) {
                if (!response) return;
                text.focus();
                var start = text.getSelectionRange()[1];
                (function() { text.searchForFind(response, start) }).delay(0);
            }, this.lastSearchString);
    },

    doFindNext: function() {
        if (this.lastSearchString)
        this.searchForFind(this.lastSearchString,
            // this.getSelectionRange()[0]
            this.lastFindLoc + this.lastSearchString.length
        );
    },

    doMore: function(doMuchMore) {
        if (doMuchMore) {  // call with true (shift-M) for replace-all
            // Simplest way:  just do N replacements
            while (this.doMore(false)) { }  // Keep repeating the change while possible
            return;
        }
        // Return of true or false used by doMuchMore
        if (!this.charsReplaced || this.charsReplaced.length == 0) return false;
        this.searchForFind(this.charsReplaced, this.lastFindLoc, 'noWrap');
        if (this.selectionString() != this.charsReplaced) return false;
        var holdChars = this.charsReplaced;     // Save charsReplaced
        var holdLastFindLoc = this.lastFindLoc;
        this.insertAtCursor(this.charsTyped, true, true);
        this.charsReplaced = holdChars ;  // Restore charsReplaced after above
        this.lastFindLoc = holdLastFindLoc + this.charsTyped.length;
        return true;
    },
    doInspect: function() {
        this.world().openInspectorFor(this.evalSelection());
    },
    doEdit: function() {
        var obj = this.evalSelection();
        if (obj) this.world().openObjectEditorFor(obj);
    },
    doCodeSearch: function() {
        lively.ide.commands.exec('lively.ide.codeSearch', this.getSelectionOrLineString());
    },
    doBrowseSenders: function() {
        this.world().openMethodFinderFor(this.getSelectionOrLineString(), '__sender')
    },
    doBrowseReferences: this.doBrowseSenders,

    doBrowseClass: function() {
        this.world().openClassBrowserFor(this.getSelectionOrLineString())
    },
    doBrowseImplementors: function() {
        this.world().openMethodFinderFor(this.getSelectionOrLineString(), '__implementor')
    },
    rememberSelectionForDoMore: function(fromWhere) {
        // This gets called from any typing.  It can tell what is being
        // replaced by testing for a non-zero selection.
        // At that point, it also records the location consistent with DoMore
        // and initializes charsTyped which will collect the replacement characters
        var sel = this.selectionString();

        if (!sel || sel == '') return;  // null selection means no replacement
        console.log('Text>>rememberSelectionForDoMore setting charsReplaced='+sel);
        this.charsReplaced = sel;
        this.lastFindLoc = this.getSelectionRange()[0] + sel.length;
        this.charsTyped = '';
    },
	  indentSelection: function() {
        var tab = this.tab;
        this.modifySelectedLines(function(line) { return line.length == 0 ? line : tab + line });
    },
    outdentSelection: function() {
        var tab = this.tab, space = ' ';
        this.modifySelectedLines(function(line) {
                        if (line.startsWith(tab)) return line.substring(tab.length,line.length);
                        if (line.startsWith(space)) return line.substring(space.length,line.length);
            return line;
        });
    },
    doExchange: function() {
        // Probably won't preserve rich text attributes yet - DI
        var sel1 = this.getSelectionRange();
        var sel2 = this.previousSelection;

        var d = 1;    // direction current selection will move
        if (sel1[0] > sel2[0]) {var t = sel1; sel1 = sel2; sel2 = t; d = -1} // swap so sel1 is first
        if (sel1[1] > sel2[0]) return; // ranges must not overlap

        var fullText = /* (this.textStyle) ? this.getRichText() :*/ this.textString;
        var txt1 = fullText.substring(sel1[0], sel1[1]);
        var txt2 = fullText.substring(sel2[0], sel2[1]);
        var between = fullText.substring(sel1[1], sel2[0]);

        var d1 = (txt2.size() + between.size());  // amount to move sel1
        var d2 = (txt1.size() + between.size());  // amount to move sel2
        var newSel = [sel1[0]+d1, sel1[1]+d1];
        var newPrev = [sel2[0]-d2, sel2[1]-d2];
        if (d < 0) { var t = newSel;  newSel = newPrev;     newPrev = t; }
        var replacement = txt2.concat(between.concat(txt1));
        this.setSelectionRange(sel1[0], sel2[1]);     // select range including both selections
        this.insertAtCursor(replacement, true, true);    // replace by swapped text
        this.setSelectionRange(newSel[0], newSel[1]);
        this.previousSelection = newPrev;
        this.undoSelectionRange = d>0 ? sel1 : sel2;
    },
    addOrRemoveBrackets: function(bracketIndex) {
        // Not yet working - DI
        var left = this.locale.charSet.leftBrackets[bracketIndex];
        var right = this.locale.charSet.rightBrackets[bracketIndex];

        if (bracketIndex == 0) { left = "/*"; right = "*/"; }

        var i1 = this.selectionRange[0];
        var i2 = this.selectionRange[1];

        if (i1 - left.length >= 0 && this.textString.substring(i1-left.length,i1) == left &&
            i2 + right.length < this.textString.length && this.textString.substring(i2+1,i2+right.length+1) == right) {
            // selection was already in brackets -- remove them
            var before = this.textString.substring(0,i1-left.length);
            var replacement = this.textString.substring(i1,i2+1);
            var after = this.textString.substring(i2+right.length+1,this.textString.length);
            this.setTextString(before.concat(replacement,after));
            this.setSelectionRange(before.length,before.length+replacement.length);
        } else { // enclose selection in brackets
            var before = this.textString.substring(0,i1);
            var replacement = this.textString.substring(i1,i2+1);
            var after = this.textString.substring(i2+1,this.textString.length);
            this.setTextString(before.concat(left,replacement,right,after));
            this.setSelectionRange(before.length+left.length,before.length+left.length+replacement.length);
        }
    },
    addOrRemoveComment: function() {
        var commentRegex = /^(\s*)(\/\/\s*)(.*)/,
            spacesRegex = /^(\s*)(.*)/,
            noSelection = this.selectionString() == '';

        if (noSelection) this.selectCurrentLine();

        this.modifySelectedLines(function(line) {
            var commented = commentRegex.test(line);
            return (commented) ?
                line.replace(commentRegex, '$1$3') :
                line.replace(spacesRegex, '$1// $2');
        });
    },

    modifySelectedLines: function(modifyFunc) {
        // this function calls modifyFunc on each line that is selected
        // modifyFunc can somehow change the line
        // the selection grows/shrinks with the modifications
        var lines = this.selectionString().split('\n')
        for (var i = 0; i < lines.length; i++) {
            lines[i] = modifyFunc(lines[i], i, lines);
        }
        var replacement = lines.join('\n');
        this.insertAtCursor(replacement, true, true);
    },

    splitText: function() {
        var selRange = this.getSelectionRange(),
            from = Math.max(selRange[0], selRange[1]),
            to = this.textString.length,
            copy = this.copy();

        copy.splittedFrom = this;
        this.owner.addMorph(copy);

        // remove text that is splitted
        this.setSelectionRange(from, to);
        this.insertAtCursor('', false, true);

        // remove text in copy before splitted text
        copy.setSelectionRange(0, from);
        copy.insertAtCursor('', false, true);

        var offset = pt(0,3);
        copy.align(copy.bounds().topLeft(), this.bounds().bottomLeft().addPt(offset));
        copy.focus.bind(copy).delay(0)

        copy.fit(); // for layouting

        return copy;
    },

    mergeText: function() {
        var fromMorph = this.splittedFrom;
        while (fromMorph && !fromMorph.owner)
            fromMorph = fromMorph.splittedFrom;
        if (!fromMorph) return false;
        var styles = this.getChunkStyles(),
            ranges = this.getChunkRanges(),
            insertPos = fromMorph.textString.length,
            rangesAndStyles = ranges.collect(function(range, i) {
                return [range[0] + insertPos, range[1] + insertPos, styles[i]];
            });
        fromMorph.appendTextString(this.textString);
        fromMorph.emphasizeRanges(rangesAndStyles);
        fromMorph.setNullSelectionAt(insertPos);
        this.remove();
        return true;
    },

    indentLine: function() {
        // assumes that the current cursor position is at the start of the line
        var endOfLastLine = this.getSelectionRange()[0] - 2;
        var beginOfLastLine = this.textString.lastIndexOf('\n', endOfLastLine);
        var lastLine = this.textString.substring(beginOfLastLine + 1, endOfLastLine + 1);
        var indent = lastLine.match(/^[\ \t]*/).join();
        if (['{','[','('].include(this.textString[endOfLastLine])) indent += this.tab;
        this.insertAtCursor(indent, false, false);
    },

    doAutoIndent: function() {
        var text = this.textString,
            i = 0, j = 0,
        tokens = {};

        //strip out regexes
        while (text.match(/([=\(:;][\n ]*)(\/([^\n\/]|\\\/)+[^\\]\/)/)) {
            tokens[i] =  text.match(/([=\(:;][\n ]*)(\/([^\n\/]|\\\/)+[^\\]\/)/)[2];
            text = text.replace(/([=\(:;][\n ]*)(\/([^\n\/]|\\\/)+[^\\]\/)/, "$1\u0007"+i);
            i++;
        }

        //strip out strings
        while (text.match(/"[^"\n]*"/)) {
            tokens[i] =  text.match(/"[^"]*"/)[0];
            text = text.replace(/"[^"]*"/, "\u0007"+i);
            i++;
        }
        while (text.match(/'[^'\n]*'/)) {
            tokens[i] =  text.match(/'[^']*'/)[0];
            text =  text.replace(/'[^']*'/, "\u0007"+i);
            i++;
        }

        //strip out comments(one lined)
        while (text.match(/(\/\/[^\n]*)\n/)) {
            tokens[i] = text.match(/(\/\/[^\n]*)\n/)[1];
            text =  text.replace(/(\/\/[^\n]*)\n/, "\u0007"+i+"\n");
            i++;
        }

        //strip out comments(block)
        while (text.match(/\/\*(.|\n)*?\*\//)) {
            tokens[i] = text.match(/\/\*(.|\n)*?\*\//)[0];
            text = text.replace(/\/\*(.|\n)*?\*\//, "\u0007"+i);
            i++;
        }

        //strip out leading and trailing whitespace
        text = text.replace(/ *\n/g, "\n");
            text = text.replace(/ *(.*[^ ]) *\n/g, "$1\n");

        var formatted = '',
        lines = text.split('\n'),
        indent = 0,
        lastCount = 0;

        for (i = 0; i < lines.length; i++) {
            var ln = lines[i];

            var brackets = [
                ["(",")"],
                ["[","]"],
                ["{","}"]
            ];

            var counts= [
                [0,0],
                [0,0],
                [0,0]
            ];

            for (j = 0; j < ln.length; j++) {
                for (var b = 0; b < brackets.length; b++) {
                    if (ln[j] === brackets[b][0]) {
                        counts[b][0]++;
                    } else if (ln[j] === brackets[b][1]) {
                        if (counts[b][0] > 0) {
                            counts[b][0]--;
                        } else {
                            counts[b][1]++;
                        }
                    }
                }
            }

            counts = counts.reduce(function(ea1, ea2) {
                return [ea1[0] + ea2[0], ea1[1] + ea2[1]];
            });

            indent += lastCount - counts[1];
            lastCount = Math.max(0, counts[0]);

            var padding = '';
            for (j = 0; j < indent; j++) {
                padding += this.tab;
            }

            formatted += padding + ln + '\n';
        }

        text = formatted;

        //put strings, regexes and comments back in
        while (i > 0) {
            i--;
            text= text.replace(new RegExp("\u0007"+i),tokens[i]);
        }

        this.textString = text;
    },
    doVarDeclClean: function() {
        this.modifySelectedLines(this.varDeclCleaner());
    }
},
'keyboard event reaction', {
    onEnterPressed: function(evt) {
        if (this.isInputLine) {
            this.doSave();
        } else if (evt.isCommandKey()) {
            this.splitText();
        } else {
            var range = this.getSelectionRange(),
                endIdx = 0,
                length = this.textString.length;
            if (range) {
                endIdx = Math.max(range[0], range[1]);
            }
            this.insertAtCursor('\n', false, true);
            if (range && Config.get("autoIndent")) this.indentLine();
        }
        evt.stop();
        return true;
    },
    onEscPressed: function(evt) {
        // for removing the input cursor
        this.blur();
        evt.stop();
        return true;
    },

    onBackspacePressed: function(evt) {
        /* this should not be neccessary anymore
       if (this.textString === '') {
           evt.stop();
            return true;
        }*/
        if (this.getCursorPos() === 0 && this.mergeText()) {
            evt.stop(); return true;
        }
        if (this.isTabBeforeCursor(true)) {
            this.insertAtCursor('', false, true);
            evt.stop();
            return true;
        }
        if (this.charsTyped.length > 0) {
            this.charsTyped = this.charsTyped.substring(0, this.charsTyped.length-1);
        }
        this.fixChunksDelayed();
        return true;
    },
    onDelPressed: function(evt) {
        if (this.isTabAfterCursor(true)) {
            this.insertAtCursor('', false, true)
            evt.stop();
            return true;
        }
        if (this.charsTyped.length > 0)
            this.charsTyped = this.charsTyped.substring(0, this.charsTyped.length-1);
        this.fixChunksDelayed();
        return true;
    },
    onTabPressed: function(evt) {
        var tab = Config.useSoftTabs ? this.tabspacesForCursorPos() : '\t';
        this.insertAtCursor(tab, false, true)
        evt.stop();
        return true;
    },
    onHomePressed: function(evt) {
        this.moveCursorToLineStart(evt.isShiftDown());
        evt.stop();
        return true;
    },
    onEndPressed: function(evt) {
        this.moveCursorToLineEnd(evt.isShiftDown());
        evt.stop();
        return true
    },
    onPageUpPressed: function(evt) {
        this.moveCursorToTextStart(evt.isShiftDown());
        evt.stop();
        return true;
    },
    onPageDownPressed: function(evt) {
        this.moveCursorToTextEnd(evt.isShiftDown());
        evt.stop();
        return true;
    },
    onLeftPressed: function($super, evt) {
        if ($super(evt)) return true;
        if (evt.isCommandKey()) {
            var isSelecting = evt.isShiftDown(),
                range = this.getSelectionRange(),
                newRange = this.selectWord(this.textString, range[0]);
            if (range[0] !== newRange[0]) {
                this.setSelectionRange(newRange[0], isSelecting ? range[1] : newRange[0]);
            } else {
                this.setSelectionRange(range[0]-1, isSelecting ? range[1] : range[0]-1);
            }
            evt.stop();
            return true
        }
        if (!evt.isAltDown()) {
            if (this.isTabBeforeCursor(true)) {
                // will create a selection of the tab/softtab
                // since we don't cancel the event the selection will also be collapsed
            }
        }
        return true;
    },
    onRightPressed: function($super, evt) {
        if ($super(evt)) return true;
        if (evt.isCommandKey()) {
            var isSelecting = evt.isShiftDown(),
                range = this.getSelectionRange(),
                newRange = this.selectWord(this.textString, range[1]);
            if (range[1] !== newRange[1]+1) {
                this.setSelectionRange(isSelecting ? range[0] : newRange[1]+1, newRange[1]+1);
            } else {
                this.setSelectionRange(isSelecting ? range[0] : range[1]+1, range[1]+1);
            }
            evt.stop();
            return true
        }
        if (!evt.isAltDown()) {
            if (this.isTabAfterCursor(true)) {
                // will create a selection of the tab/softtab
                // since we don't cancel the event the selection will also be collapsed
            }
        }
        return true;
    },
    onUpPressed: function($super, evt) { return $super(evt) || true },
    onDownPressed: function($super, evt) { return $super(evt) || true }
},
'shortcut support', {
    shortcutHandlers: []
},
'mouse events', {
    onMouseDown: function(evt) {
        // if clicked in the text we want the default thing to happen, at least in HTML
        // but do not want other morphs to handle the event as well, so return true for was handled

        if (evt.target.onmousedown) { // handled by text chunk
            this.blur();
            return evt.target.onmousedown(evt);
        }
        // FIXME: handled in Morph>>onMouseDown. remove.
        if (!evt.isLeftMouseButtonDown()) return false;
        if (evt.isCommandKey()) { // for halos
            evt.stop();
            return true;
        }

        if (this.isFocused()) {
            this.priorSelectionRange = this.getSelectionRange();  // save for onMouseUp
        }

        return false;
    },

    onMouseUp: function(evt) {
        var a = this.getSelectionRange();
        // this happens when text has lost selection
        if (!a) return false;

        var incomingSelection = this.priorSelectionRange;

        this.charsTyped = '';

        // test if we have a null selection and same as before
        if (this.priorSelectionRange != null
            && a[0] == a[1]  // null selection
            && this.priorSelectionRange[0] == a[0]
            && this.priorSelectionRange[1] == a[1]) {
            // It is a null selection, repeated in the same place --
            // select word or range [and don't change previousSel]
            if (a[0] == 0 || a[0] == this.textString.length) {
                this.setSelectionRange(0, this.textString.length);
            } else {
                var range = this.selectWord(this.textString, a[0]);
                this.setSelectionRange(range[0], range[1]+1);
            }
        } else {
            this.previousSelection = incomingSelection;  // for 'exchange' command
        }

        this.priorSelectionRange = this.getSelectionRange();

        return false;
    },

    onMouseWheel: function(evt) {
        this.stopScrollWhenBordersAreReached(evt);
        return true;
    }
},

'selection', {
    domSelection: function() {
        var sel = Global.getSelection(),
            textNode = this.renderContext().textNode;
        if (!sel || !sel.focusNode || !textNode) {
            return null;
        }
        if (!textNode.parentNode) {
            // console.log('warning: Text>>domSelection: textNode is not in DOM');
            return null;
        }
        if (sel.focusNode.compareDocumentPosition(textNode.parentNode) &
                Node.DOCUMENT_POSITION_CONTAINS) {
            // textNode's parent contains focused selection's focusNode
            return sel;
        }
        return null;
    },

    hasSelection: function() {
        return this.domSelection() !== null;
    },

    selectionString: function() {
        // HTML only, works in FF & Chrome
        var sel = this.domSelection();
        if (!sel) { return ''; }
        var range = sel.getRangeAt(0);
        if (!range) { return ''; }
        var fragment = range.cloneContents();
        if (!fragment) { return ''; }
        return fragment.textContent;

        // 2012-01-06 proposed generalized solution
        // aSelection.toString() replaces '\n' with ' '
        // this could be a general solution, but breaks other tests in Chrome?!
        // Problem: when typing, cursor is always BEFORE the last character in a text
        //var range = this.getSelectionRange(); // try = null and it works
        //if (!range) { return ''; }
        //var begin = (range[0] >  range[1]) ? range[1] : range[0];
        //    end   = (range[0] >= range[1]) ? range[0] : range[1];
        //var result = this.textString.substring(begin, end);
        //return result;
    },

    insertAtCursor: function(string, selectIt, overwriteSelection) {
        this.insertElementAtCursor(NodeFactory.createText(String(string)), selectIt, overwriteSelection);
    },

    insertElementAtCursor: function(element, selectIt, overwriteSelection, replacementTextChunks) {
        //console.log('Text>>insertElementAtCursor');
        // FIXME refactor!!!
        var node = element,
            selRange = this.getSelectionRange(),
            sel = this.domSelection(),
            range;

        function cleanup(text) {
            // string has changed, removed cached version
            text.cachedTextString = null;
            // inconsistent nodes could have been added, so clean up
            text.fixChunks();
        }

        if (!sel) {
            // FIXME: This fixes the empty workspace bug. What else is needed?
            this.renderContext().textNode.appendChild(element);
            cleanup(this);
            return;
        }

        range = sel.getRangeAt(0);

        if (overwriteSelection) {
            // save info for 'More' command
            this.charsReplaced = range.toString();
            this.lastFindLoc = this.getSelectionRange()[0] + element.textContent.length;
            range.deleteContents();
            var selPosAfterOverwrite = Math.min(selRange[0],selRange[1]);
            this.setSelectionRange(selPosAfterOverwrite, selPosAfterOverwrite)
        } else {
            // insert new node after current selection
            // after current selection depends on selection direction
            // either focusNode or anchorNode
            if (selRange[0] < selRange[1]) {
                range.setStart(sel.focusNode, sel.focusOffset);
            } else {
                range.setStart(sel.anchorNode, sel.anchorOffset);
            }
        }
        range.insertNode(node);
        sel.removeAllRanges();

        range = document.createRange();

        if (selectIt) {
            range.selectNode(node);
        } else { // no real selection but set cursor, FIXME use setCursor or something
            range.setStartAfter(node);
            range.setEndAfter(node);
        }

        sel.addRange(range);

        cleanup(this);
    },

    insertTextChunksAtCursor: function(newChunks, selectIt, overwriteSelection) {
        //console.log('Text>>insertTextChunksAtCursor');
        var selRange = this.getSelectionRange();
        if (!selRange) { throw new Error("" + this + ": No selection to replace")}
        var start = Math.min(selRange[0],selRange[1]),
            end = Math.max(selRange[0],selRange[1]),
            chunks = this.getTextChunks(),
            oldChunks = this.sliceTextChunks(start, end),
            lastOldChunk = oldChunks.last(),
            chunkAfter = lastOldChunk && lastOldChunk.next(),
            startChunkIdx = chunks.indexOf(oldChunks[0]);

        if (overwriteSelection) {
            // save info for 'More' command
            this.charsReplaced = this.selectionString();
            this.lastFindLoc = selRange[0]; // + element.textContent.length ;
            oldChunks.invoke('remove');
        } else {
            // insert new node after current selection
            startChunkIdx += oldChunks.length - 1;
        }

        chunks.pushAllAt(newChunks, startChunkIdx);
        newChunks.invoke('addTo', this, chunkAfter);

        // string has changed, removed cached version
        this.cachedTextString = null;

        var insertionLength = newChunks.pluck('textString').pluck('length').sum();
        if (selectIt) {
            this.setSelectionRange(start, start + insertionLength)
        } else { // no real selection but set cursor, FIXME use setCursor or something
            this.setSelectionRange(start + insertionLength, start + insertionLength)
        }

        // inconsistent nodes could have been added...
        this.fixChunks()
    },

    removeTextSelection: function() {},

    getSelectionOrLineString: function() {
        var sel = this.domSelection(),
            range;
        if (!sel) {
            return '';
        }
        range = sel.getRangeAt(0);
        if (range.collapsed)
            this.selectCurrentLine();
        return this.selectionString();
    },
    selectCurrentLine: function() {
        var sel = this.domSelection();
        if (sel.anchorNode) {
            sel.modify('move', 'left', 'lineboundary');
            sel.modify('extend', 'right', 'lineboundary')
        }
    },
    moveCursorToLineStart: function(select) {
        this.modifySelection(select ? 'extend' : 'move', 'left', 'lineboundary');
    },
    moveCursorToLineEnd: function(select) {
        this.modifySelection(select ? 'extend' : 'move', 'right', 'lineboundary');
    },
    moveCursorToTextStart: function(select) {
        this.modifySelection(select ? 'extend' : 'move', 'left', 'documentboundary');
    },

    moveCursorToTextEnd: function(select) {
        this.modifySelection(select ? 'extend' : 'move', 'right', 'documentboundary');
    },

    modifySelection: function(extendOrMove, direction, toWhere) {
        var sel = this.domSelection();
        if (sel.anchorNode) {
            sel.modify(extendOrMove, direction, toWhere);
        }
    },

    setSelectionRange: function(start, end) {
        if (!this.isFocused()) this.focus();
        if (start < 0) { start = 0; }
        if (start > this.textString.length) { start = this.textString.length; }
        if (end < 0) { end = 0; }
        if (end >= this.textString.length) { end = this.textString.length; }
        var sel = this.domSelection();
        if (!sel) sel = Global.getSelection();
        if (sel) sel.removeAllRanges();

        var startBoundaryPoint = this.getTextElementAndLocalIndexForGlobalIndex(start),
            endBoundaryPoint = this.getTextElementAndLocalIndexForGlobalIndex(end);

        // found nothing to select...
        if (startBoundaryPoint === undefined && endBoundaryPoint === undefined) return;
        if (startBoundaryPoint === undefined) startBoundaryPoint = endBoundaryPoint;
        if (endBoundaryPoint === undefined) endBoundaryPoint = startBoundaryPoint;

        if (sel.setBaseAndExtent) {
            // setBaseAndExtent supports right-to-left selections (at least in Chrome...)
            sel.setBaseAndExtent(
                startBoundaryPoint[0], startBoundaryPoint[1],
                endBoundaryPoint[0], endBoundaryPoint[1]);
        } else { // e.g. FireFox does not support setBaseAndExtent
            // actually it should not be necessary to switch the values
            // but range does not work with right-to-left selections
            if (start > end) {
                var temp = endBoundaryPoint;
                endBoundaryPoint = startBoundaryPoint;
                startBoundaryPoint = temp;
            }
            var range = document.createRange();
            range.setStart(startBoundaryPoint[0], startBoundaryPoint[1])
            range.setEnd(endBoundaryPoint[0], endBoundaryPoint[1])
            sel.addRange(range);
        }
    },

    getSelectionRange: function() {
        // FIXME this only works for textNodes that have the form
        // <div><span></text*></span*></div> or <div></text*></div>
        var parent = this.renderContext().textNode;
        if (!parent || !this.isFocused()) return this.priorSelectionRange;
        var textNodeType = parent.TEXT_NODE;
        var textNodes = [];

        // collect the text nodes
        for (var i = 0; i < parent.childNodes.length; i++) {
            var child = parent.childNodes[i];
            if (child.nodeType === textNodeType) {
                textNodes.push(child)
            } else {
                for (var j = 0; j < child.childNodes.length; j++) {
                    var childchild = child.childNodes[j];
                    if (childchild.nodeType === textNodeType)
                        textNodes.push(childchild)
                }
            }
        }
        // --------

        // this function calculates how many characters are between the start of
        // the parent element and the node.
        // The node is expected to be a childNode of parent
        function nodeOffsetFrom(node) {
            if (!node) return 0;
            var offset = 0;
            for (var i = 0; i < textNodes.length; i++) {
                var nodeBefore = textNodes[i];
                if ((node.compareDocumentPosition(nodeBefore) & node.DOCUMENT_POSITION_PRECEDING) != 0) {
                    offset += nodeBefore.textContent.length;
                }
            }
            return offset;
        }
        var sel = this.domSelection();
        if (!sel) return null;

        // anchor is the start node, focusNode is the end node of the selection
        // see https://developer.mozilla.org/en/DOM/Selection

        // there is a problem with the above algorithm when calling getSelectionRange
        // when the caret is at the end of the text. In this case anchorNode and focusNode
        // are not textNodes and nodeOffsetFrom() would not return anything meaningful
        // Since anchorNode.childNodes[anchorOffset] and focusNode.childNodes[focusOffset]
        // identify the node from/to selection was exist, use this node for calculation
        // In this case return the text length as indexes of the range
        var anchorIsText = sel.anchorNode.nodeType == textNodeType;
        var anchorNode = anchorIsText ? sel.anchorNode : sel.anchorNode.childNodes[sel.anchorOffset];
        var anchorOffset = anchorIsText ? sel.anchorOffset : 0;

        var focusIsText = sel.focusNode.nodeType == textNodeType;
        var fixedFocusOffset = sel.focusOffset;//!focusIsText && (sel.focusOffset >= sel.focusNode.childNodes.length) ? (sel.focusNode.childNodes.length - 1) : sel.focusOffset;
        var focusNode = focusIsText ? sel.focusNode : sel.focusNode.childNodes[fixedFocusOffset];
        var focusOffset = focusIsText ? sel.focusOffset : 0;

        var result = [nodeOffsetFrom(anchorNode) + anchorOffset,
                      nodeOffsetFrom(focusNode) + focusOffset];

        //if (focusNode == textNodes[textNodes.length - 1] && focusOffset == focusNode.textContent.length) {
          //  console.log('Text>>getSelectionRange: cursor at end, returning [' + result[0] + ',' + result[1] + ']');
            //result.push(true);
            //result.push(textNodes[textNodes.length - 1]);
        //}

        return result;
    },


    selectAll: function() {
        if (this.textString.length > 0) {
            this.setSelectionRange(0, this.textString.length);
        } else {
            this.focus();
        }
    },

    hasNullSelection: function() {
        var range = this.getSelectionRange();
        return range && range[0] === range[1]
    },
    getCursorPos: function() {
        if (!this.hasNullSelection()) return null;
        var range = this.getSelectionRange();
        return range && range[0];
    },

    setNullSelectionAt: function(idx) { this.setSelectionRange(idx, idx) },

    selectWord: function(str, i1) { // Selection caret before char i1
        if (!str) return i1;
        // Most of the logic here is devoted to selecting matching backets
        var rightBrackets = "*)}]>'\"";
        var leftBrackets = "*({[<'\"";
        function isWhiteSpace(c) { return c === '\t' || c === ' '; }
        function isAlpha(s) {
            var regEx = /^[a-zA-Z0-9\-]+$/;
            return (s || '').match(regEx);
        };
        function periodWithDigit(c, prev) {
            // return true iff c is a period and prev is a digit
            if (c != ".") return false;
            return "0123456789".indexOf(prev) >= 0;
        };

        var i2 = i1 - 1;
        if (i1 > 0) { // look left for open backets
            if(str[i1-1] == "\n" || str[i1-1] == "\r") return this.findLine(str, i1, 1, str[i1-1]);
            var i = leftBrackets.indexOf(str[i1-1]);
            if (str[i1 - 1] == "*" && (i1-2 < 0 || str[i1-2] != "/"))
            i = -1; // spl check for /*
            if (i >= 0) {
                var i2 = this.matchBrackets(str, leftBrackets[i], rightBrackets[i], i1 - 1, 1);
                return [i1, i2 - 1];
            }
        }
        if (i1 < str.length) { // look right for close brackets
            if(str[i1] == "\n" || str[i1] == "\r") return this.findLine(str, i1, -1, str[i1]);
            var i = rightBrackets.indexOf(str[i1]);
            if (str[i1]== "*" && (i1+1 >= str.length || str[i1+1] != "/"))
            i = -1; // spl check for */
            if (i >= 0) {
                i1 = this.matchBrackets(str, rightBrackets[i], leftBrackets[i],i1,-1);
                return [i1+1, i2];
            }
        }

        // is a '//' left of me?
        if (str[i1-1] === '/' && str[i1-2] === '/') {
            while (i2+1<str.length && str[i2+1] !== '\n' && str[i2+1] !== '\r') { i2++ }
            return [i1, i2];
        }

        // inside of whitespaces?
        var myI1 = i1;
        var myI2 = i2;
        while (myI1-1 >= 0 && isWhiteSpace(str[myI1-1])) myI1 --;
        while (myI2 < str.length && isWhiteSpace(str[myI2+1])) myI2 ++;
        if (myI2-myI1 >= 1) return [myI1, myI2];

        var prev = (i1<str.length) ? str[i1] : "";
        while (i1-1 >= 0 && (isAlpha(str[i1-1]) || periodWithDigit(str[i1-1], prev))) {
            prev = str[i1-1];
            i1--;
        }
        while (i2+1 < str.length && (isAlpha(str[i2+1]) || periodWithDigit(str[i2+1], prev))) {
            prev = str[i2+1];
            i2++;
        }
        return [i1, i2];
    },
    matchBrackets: function(str, chin, chout, start, dir) {
        var i = start;
        var depth = 1;
        while ((dir < 0) ? i - 1 >= 0 : i + 1 < str.length ) {
            i += dir;
            if (str[i] == chin && chin != chout) depth++;
            if (str[i] == chout) depth--;
            if (depth == 0) return i;
        }
        return i;
    },
    findLine: function(str, start, dir, endChar) { // start points to a CR or LF (== endChar)
        var i = start;
        while ((dir < 0) ? i - 1 >= 0 : i + 1 < str.length ) {
            i += dir;
            if (str[i] == endChar) return dir>0 ? [start, i] : [i+1, start];
        }
        return dir>0 ? [start+1, str.length-1] : [0, start];
    },

},
'scrolling', {
    basicGetScrollableNode: function(evt) {
        // for ScrollableTrait
        return this.renderContext().shapeNode
    },

    scrollSelectionIntoView: function() {
        this.scrollRectIntoView(this.getSelectionBounds(), true)
    }
},
'evaluation', {
    evalSelection: function(printIt) {
        var str = this.getSelectionOrLineString(),
            result = this.tryBoundEval(str);
        if (printIt) this.insertAtCursor(String(result), true);
        return result;
    },

    evalAll: function() {
        var str = this.textString,
            result = this.tryBoundEval(str);
        return result;
    },

    boundEval: function (__evalStatement) {
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var ctx = this.getDoitContext() || this,
            str,
            interactiveEval = function() {
                try { return eval(str = "("+__evalStatement+")")} catch (e) { return eval(str = __evalStatement) }
                };
        try {
            var result = interactiveEval.call(ctx),
                itemName = "Changesets:" +  $world.getUserName() + ":" + location.pathname;
            if (Config.changesetsExperiment && $world.getUserName() && lively.LocalStorage.get(itemName) !== "off")
                lively.ChangeSet.logDoit(str, ctx.lvContextPath());
            return result;
        } catch(e) {throw e}
    },
    tryBoundEval: function(str) {
        // FIXME: different behaviour in CodeEditor, TextMorph, ObjectEditor
        try {
            return this.boundEval(str);
        } catch(e) {
            this.showError(e);
            return null;
        }
    },

    getDoitContext: function() { return this.doitContext }
},
'testing', {
    hasUnsavedChanges: function() {
        return false;
        // return this.savedTextString !== this.textString;
    },

    isFocused: function() { return lively.morphic.Text.activeInstance() === this }

},
'searching', {
    searchForFind: function(str, start, noWrap) {
        var i1 = this.textString.indexOf(str, start);
        if (i1 < 0 && !noWrap) i1 = this.textString.indexOf(str, 0); // wrap
        if (i1 >= 0) this.setSelectionRange(i1, i1+str.length);
        else this.setNullSelectionAt(0);
        this.scrollSelectionIntoView();
        this.lastSearchString = str;
        this.lastFindLoc = i1;
    }
},
'debugging', {
    showError: function (e, offset) {
        offset = offset || 0;
        var msg = "" + e + "\n" +
            "Line: " + e.line + "\n" +
            (e.sourceURL ? ("URL: " + (new URL(e.sourceURL).filename()) + "\n") : "");
        if (e.stack) {
            // make the stack fit into status window
            msg += e.stack.replace(new RegExp(URL.codeBase.toString(), "g"),"");
        }

        var world = lively.morphic.World.current();
        if (!world) {
            console.log("Error in " +this.id() + " bound eval: \n" + msg)
            return
        };

        if (e.expressionEndOffset) {
            this.setSelectionRange(e.expressionBeginOffset + offset, e.expressionEndOffset + offset);
        }
        else if (e.line) {
            alert("Error " + e + "on line " + e.line + " offset " + offset)
        }
        if (world)
            world.logError(e);
    },

    textNodeString: function() {
        var textNode = this.renderContext().textNode;
        if (!textNode) return 'textNode not yet accessible';
        var isolatedTextNode = textNode.cloneNode(false/*no children*/),
            string = Exporter.stringify(isolatedTextNode),
            midIdx = string.indexOf('</div>'),
            childrenString = Array.from(textNode.childNodes).collect(function(ea) {
                return '    ' + Exporter.stringify(ea);
            }).join('\n');
        string = string.slice(0, midIdx) + '\n' + childrenString + '\n' + string.slice(midIdx);
        return string;
    }

},
'experimentation', {
    setWhiteSpaceHandling: function(modeString) {
        // values: "normal", "nowrap", "pre", "pre-line", "pre-wrap", "inherit"
        return this.morphicSetter('WhiteSpaceHandling', modeString);
    },
    getWhiteSpaceHandling: function(modeString) {
        return this.morphicGetter('WhiteSpaceHandling') || 'pre-wrap';
    },
    setWordBreak: function(modeString) {
        // values supported: "normal", "break-all", "hyphenate"
        return this.morphicSetter('WordBreak', modeString);
    },
    getWordBreak: function() {
        return this.morphicGetter('WordBreak') || 'normal';
    },
    getTextElements: function() {
        // returns js objects for subnodes of this.renderContext().textNode
        // they have the following properties:
        // node: the text node,
        // startIndex: the (global)startIndex of the node in the whole text,
        // endIndex: global end index
        // method toString for debugging

        var textNodeType = this.renderContext().textNode.TEXT_NODE;
        function isTextNode(node) { return node && node.nodeType == textNodeType }
        function flattenTextNodes(node) {
            if (!node) return [];
            if (isTextNode(node)) return [node];
            var result = [];
            for (var i = 0; i < node.childNodes.length; i++)
                result = result.concat(flattenTextNodes(node.childNodes[i]))
            return result;
        }


//var endlessProtection = 0;
//endlessProtection++
//if (endlessProtection > 10000) throw new Error('Endless loop in getTextElements!')

        var nodes = flattenTextNodes(this.renderContext().textNode),
            result = [],
            index = 0;

        for (var i = 0; i < nodes.length; i++) {
            var part = nodes[i];
            if (!part.textContent) continue;
            var start = index,
                length = part.textContent.length,
                end = start + length;
            index = end;
            result.push({
                node: part,
                startIndex: start,
                endIndex: end,
                toString: function() {
                    return '<' + this.node.textContent.replace(/\n/, '\\n') + '>: ' + this.startIndex + '-' + this.endIndex;
                }})
        }
        return result;
    },

    getTextElementAndLocalIndexForGlobalIndex: function(idx) {
        // returns a subnode and the index in the subnode that responds to the
        // global index of the whole text the index used for lookup is sanitized
        // example: subnodes: <text>foo</text><text>bar</text>, idx: 5
        // would return [<text>bar</text>, 2] (local idx between a and r)
        idx = Math.max(0, Math.min(idx, this.textString.length));
        var textParts = this.getTextElements();
        for (var i = 0; i < textParts.length; i++) {
            if (idx >= textParts[i]. startIndex && idx <= textParts[i].endIndex) {
                var node = textParts[i].node,
                    localIdx = idx - textParts[i].startIndex;
                return [node, localIdx]
            }
        }
        return [this.renderContext().textNode, 0];
    },

    setRichText: function(richText) {
        richText.applyToTextMorph(this);
        return richText;
    },

    getRichText: function() {
        var rt = new lively.morphic.RichText(this.textString);
        rt.setTextChunks(this.getTextChunks());
        return rt;
    },

    getRichTextFromTo: function(from, to) {
        var string = this.textString.slice(from, to),
            rt = new lively.morphic.RichText(string);
        rt.setTextChunks(this.sliceTextChunks(from, to));
        return rt;
    },

    getTextStyle: function() {
        alert('getTextStyle not yet implemented'); return;
        // if (!this.textStyle)
            // this.textStyle = new lively.RunArray([this.textString.length], [new lively.TextEmphasis({})]);
        // return this.textStyle;
    },

    getRange: function(from, to) {
        var range = document.createRange(),
            startNodeAndIdx = this.getTextElementAndLocalIndexForGlobalIndex(from),
            endNodeAndIdx = this.getTextElementAndLocalIndexForGlobalIndex(to);
        range.setStart(startNodeAndIdx[0], startNodeAndIdx[1]);
        range.setEnd(endNodeAndIdx[0], endNodeAndIdx[1]);
        return range
    },

    getSelectionBounds: function() {
        var sel = this.domSelection(), $win = lively.$(window), scroll = this.getScroll();
        if (!sel) return lively.rect(0,0,0,0);
        // 1. get the bounding box of the current selection
        // https://developer.mozilla.org/en-US/docs/Web/API/Selection
        var domRect = sel.getRangeAt(0).getBoundingClientRect();
        // 2. make a livelyRectangle from the DOMSelection rect
        return rect(domRect.left, domRect.top, domRect.width, domRect.height)
            // 3. the DOM selection is in absolute (world) coordinates offsetted by the
            // current scroll of web browser window. Remove that offset:
            // make them absolute
            .translatedBy(pt($win.scrollLeft(), $win.scrollTop()))
            // the rectangle does not take the scroll value of the morph into account, add it
            .translatedBy(pt(scroll[0], scroll[1]))
            // we now make that rectnagle local so that it can be compared to
            // this.innerBounds() or this.getScrollBounds()
            .translatedBy(this.getPositionInWorld().addXY(scroll[0], scroll[1]).negated());
    }

},
'rich text', {
    emphasize: function(styleSpec, from, to) {
        return this.emphasizeRanges([[from, to, styleSpec]]);
    },

    emphasizeRanges: function(rangesAndStyles) {
        // Note! rangesAndStyles should be sorted according to Interval.sort
        //
        // Add style to my text according to ranges. rangesAndStyles is an
        // array of intervals. An interval is an array with at least two
        // elements. If the interval has a third element this is expected to
        // be the style spec.
        //
        // Example usage:
        // text.emphasizeRanges([[5,10, {fontWeight: 'bold'}],
        //                       [12,25, {textDecoration: 'underline'}]]);
        //
        // My textChunks are reused if they have the correct ranges already,
        // otherwise they are newly created. Return true if the DOM tree has
        // changed by applying styling (new chunks were created), false
        // otherwise.

        // 1. find text chunks that can be reused
        var text = this,
            existingRanges = this.getChunkRanges(),
            chunks = this.getTextChunks(),
            indexesForExistingChunks = Interval.mapToMatchingIndexes(
                existingRanges, rangesAndStyles),
            leftOverRules = [];
        indexesForExistingChunks.forEach(function(chunkIndexes, indexOfRule) {
            var rangeAndStyle = rangesAndStyles[indexOfRule];
            if (chunkIndexes.length === 0) { leftOverRules.push(rangeAndStyle); return; }
            chunkIndexes.forEach(function(chunkIndex) {
                var chunk = chunks[chunkIndex], style = rangeAndStyle[2];
                if (!chunk.includesStyle(style)) chunk.styleText(style); });
        });

        // 2. if any highlighting rules could not be applied before because
        // textChunks available haven't the correct ranges, then slice new
        // textChunks here
        var leftOversExist = leftOverRules.length > 0;
        if (leftOversExist) {
            leftOverRules.forEach(function(rule) {
                var chunksToStyle = text.sliceTextChunks(rule[0], rule[1], existingRanges);
                chunksToStyle.forEach(function(ea) { ea.styleText(rule[2]) });
            });
        }
        var domChanged = text.coalesceChunks() || leftOversExist;
        return domChanged;
    },

    unEmphasize: function(from, to) {
        var chunks = this.sliceTextChunks(from, to);
        for (var i = 0; i < chunks.length; i++) {
            chunks[i].styleText({isNullStyle: true});
            chunks[i].style = new lively.morphic.TextEmphasis();
        }
        this.coalesceChunks();
    },

    unEmphasizeSelection: function() {
        var range = this.getSelectionRange();
        this.unEmphasize(range[0], range[1]);
        this.setSelectionRange(range[0], range[1]);
    },

    unEmphasizeAll: function() {
        this.unEmphasize(0, this.textString.length)
    },

    emphasizeAll: function(style) {
        this.emphasize(style, 0, this.textString.length);
    },

    emphasizeRegex: function(re, style) {
        var m, counter = 0, string = this.textString;
        while ((m = re.exec(string))) {
            counter++; if (counter > 5000) throw new Error('emphasizeRegex endless loop?');
            var from = m.index, to = m.index + m[0].length,
                chunks = this.sliceTextChunks(from, to);
            for (var i = 0; i < chunks.length; i++) {
                chunks[i].styleText(style);
            }
        }
        this.coalesceChunks();
    },

    changeEmphasis: function(from, to, callback) {
        // callback is called with the first emphasis that is found in the range from-to
        // callback should return a new emphasis
        var emph = this.getEmphasisAt(from);
        if (!emph) return;
        callback(emph, function doEmph(newEmph) {
            this.emphasize(newEmph, from, to);
            this.setSelectionRange(from, to);
        }.bind(this));
    },

    toggleItalics: function(from, to) {
        this.changeEmphasis(from, to, function(emph, doEmph) {
            doEmph({italics: emph.getItalics() === 'italic' ? 'normal' : 'italic'})
        })
    },

    toggleBoldness: function(from, to) {
        this.changeEmphasis(from, to, function(emph, doEmph) {
            doEmph({fontWeight: emph.getFontWeight() === 'bold' ? 'normal' : 'bold'})
        })
    },
    toggleUnderline: function(from, to) {
        this.changeEmphasis(from, to, function(emph, doEmph) {
            doEmph({textDecoration: emph.getTextDecoration() === 'underline' ? 'normal' : 'underline'})
        })
    },

    toggleLink: function(from, to) {
        var world = this.world()
        this.changeEmphasis(from, to, function(emph, doEmph) {
            world.prompt('Enter link URL', function(input) {
                 if (input === null) {
                    alertOK("canceled edit link")
                    return;
                }
                if (input == '') input = null;
                doEmph({uri: input})
            }, emph.uri);
        })
    },

    toggleDoit: function(from, to) {
        var world = this.world(), text = this;
        this.changeEmphasis(from, to, function(emph, doEmph) {
            world.editPrompt('Enter doit code', function(input) {
                if (input === null) {
                    alertOK("canceled edit doit")
                    return;
                }
                if (input == '') input = null;
                doEmph({doit: input ? {code: input, context: null} : null})
            }, emph.doit && emph.doit.code);
        })
    },

    toggleEmphasisForSelection: function(emphAttributeType) {
        // emphAttributeType can be Boldness, ...
        try {
            var selRange = this.getSelectionRange(),
                emphRange = this.convertSelectionRangeForEmphasis(selRange);
            this['toggle' + emphAttributeType](emphRange[0], emphRange[1]);
            // this.setSelectionRange(selRange[0], selRange[1]);
        } catch(e) {
            alert('Error when doing  toggle' + emphAttributeType + ': ' + e);
        }
    },

    emphasizeSelection: function(emphSpec) {
        // emphAttributeType can be Boldness, ...
        try {
            var selRange = this.getSelectionRange(),
                emphRange = this.convertSelectionRangeForEmphasis(selRange);
            this.emphasize(emphSpec, emphRange[0], emphRange[1]);
            this.setSelectionRange(selRange[0], selRange[1]);
        } catch(e) {
            console.error('Error emphasizing' + JSON.stringify(emphSpec) + ': ' + e);
        }
    },

    convertSelectionRangeForEmphasis: function(selRange) {
        var from = selRange[0], to = selRange[1];
        return from > to ? [to, from] : [from, to];
    },
    increaseFontSizeOfSelection: function() {
        this.setFontSizeOfSelectionDo(function(oldSize) { return oldSize + 1});
    },
    decreaseFontSizeOfSelection: function() {
        this.setFontSizeOfSelectionDo(function(oldSize) { return oldSize - 1});
    },

    setFontSizeOfSelectionDo: function(callback) {
        var range = this.getSelectionRange(),
            from = range[0], to = range[1],
            fontSize = this.getFontSize();
        this.changeEmphasis(from, to, function(emph, doEmph) {
            doEmph({fontSize: callback((emph.getFontSize() || fontSize))})
        })
    },

    getEmphasisAt: function(idx) {
        var chunkAndIdx = this.getChunkAndLocalIndex(idx, true);
        return chunkAndIdx && chunkAndIdx[0].style;
    },

    appendRichText: function(string, style) {
        this.textChunks.last().ensureDoesNotEndWithBr();
        var newChunk = this.createChunk();
        this.textChunks.push(newChunk);
        newChunk.textString = string;
        newChunk.styleText(style);
        this.coalesceChunks();
        this.cachedTextString = null;
    },

    insertRichTextAt: function(string, style, index) {
        var newChunk = this.sliceTextChunks(index, index)[0];
        if (!newChunk) {
            console.warn('insertRichtTextAt failed, found no text chunk!');
            return;
        }
        newChunk.textString = string;
        newChunk.styleText(style);
        this.coalesceChunks();
        this.cachedTextString = null;
    },

    getStyleRanges: function() {
        var chunks = this.getTextChunks();
        var from = 0, len = chunks.length, result = new Array(chunks.length);
        for (var i = 0; i < len; i++) {
            var to = from + chunks[i].textString.length;
            result[i] = [from, to, chunks[i].getStyle()];
            from = to;
        }
        return result;
    }

},
'rich text spec', {

    openRichTextSpecEditor: function() {
        var ed = this.world().addCodeEditor({
            title: 'text markup for ' + String(this),
            content: '',
            textMode: 'text',
            lineWrapping: true
        });
        ed.evalEnabled = false;
        ed.target = this;

        ed.addScript(function updateWithRichTextMarkupString() {
            this.textString = this.target.getRichTextMarkupString({separator: '\n\n'});
        });

        ed.addScript(function saveRichTextMarkup() {
            this.target.readRichTextMarkupString(this.textString);
        });

        lively.bindings.connect(ed, 'savedTextString', ed, 'saveRichTextMarkup');

        ed.updateWithRichTextMarkupString();
        ed.getWindow().comeForward();
    },

    setRichTextMarkup: function(markupList) {
        var richTextSpec = markupList.reduce(function(result, spec) {
            var nextPos = result.pos + spec[0].length;
            if (nextPos <= result.pos) return result;
            result.ranges.push([result.pos, nextPos, spec[1]]);
            result.string += spec[0];
            result.pos = nextPos;
            return result;
        }, {pos: 0, string: '', ranges: []});
        this.textString = richTextSpec.string;
        this.emphasizeRanges(richTextSpec.ranges);
        return richTextSpec;
    },

    getRichTextMarkup: function() {
        var string = this.textString;
        return this.getChunkStyleAndRanges().reduce(function(result, ea) {
            return result.concat([[string.slice(ea[0], ea[1]), ea[2]]]);
        }, []);
    },

    getRichTextMarkupString: function(options) {
        options = options || {};
        if (!options.separator) options.separator = '\n';
        var markupString = this.getRichTextMarkup().reduce(function(result, markupSpec) {
            return result.concat([Strings.format(
                "'%s' %s",
                markupSpec[0].replace(/'/g, '\\\''),
                Objects.inspect(markupSpec[1].asSpec())
                    .replace(/\\\\n\\\n/g, '') // for strings like "\n\"
                    .replace(/\\n\\\n/g, '\\\\n')
                    .replace(/\n/g, '')
                    .replace(/^\{\s*/, '{')
                    .replace(/\s\s+/g, ' '))]);
        }, []).join(options.separator) + '\n';

        var morphStyle = this.getOwnStyle();
        var interestingStyleKeys = ["allowInput","fixedWidth","fixedHeight","fontFamily",
            "fontSize","textColor","fontWeight","fontStyle","textDecoration",
            "align","verticalAlign","lineHeight","display","whiteSpaceHandling",
            "wordBreak","syntaxHighlighting","cssStylingMode"];
        Properties.forEachOwn(morphStyle, function(key, val) {
            if (!interestingStyleKeys.include(key)) delete morphStyle[key];
        });

        return Objects.inspect(morphStyle) + '\n\n' + markupString;
    },

    readRichTextMarkupString: function(text) {
        // text is expected to be in the form of "'...' {style: attributes}", e.g.
        // 'Hel
        // lo' {fontWeight: "bold"}
        // ' ' {}
        // 'World' {color: Color.red}

        var richTextMarkup = [],
            textStyleAndRest = text.trim()[0] !== '\'' && text.trim()[0] !== '"' ?
            readGenericObject(text) : [{}, text],
            remaining = textStyleAndRest[1];

        while (remaining.length) {
            var stringAndRest = read(remaining.trim(), null, 'excluding'),
                styleAndRest = readStyleSpec(stringAndRest[1]);
            richTextMarkup.push([stringAndRest[0].replace(/\\/g, ''), styleAndRest[0]]);
            remaining = styleAndRest[1];
        }

        this.applyStyle(textStyleAndRest[0]);
        this.setRichTextMarkup(richTextMarkup);

        return richTextMarkup;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function read(text, terminator, includingOrExluding) {
            if (!terminator) {
                terminator = text[0];
                var result = read(text.slice(1), terminator, includingOrExluding);
                if (includingOrExluding === 'including') result[0] = text[0] + result[0];
                return result;
            }
            var idx = text.indexOf(terminator);
            if (idx === -1) return [text, ''];
            if (text[idx-1] === '\\') {
                var splitted = read(text.slice(idx+1), terminator, includingOrExluding);
                return [text.slice(0, idx+1) + splitted[0], splitted[1]];
            }
            return [
                text.slice(0, idx + (includingOrExluding === 'including' ? 1 : 0)),
                text.slice(idx+1)];
        }

        function readStyleSpec(text) {
            var end = text.indexOf('\n');
            if (end === -1) end = text.length;
            var style;
            try { style = eval('(' + text.slice(0, end) + ')'); } catch (e) { style = {}; }
            return [style, text.slice(end+1)];
        }

        function readGenericObject(text) {
            var result = read(text.trim(), '}', 'including');
            var obj;
            try { obj = eval('(' + result[0] + ')'); } catch (e) { obj = {}; }
            return [obj, result[1]];
        }
    }

},
'status messages', {
    setStatusMessage: function(msg, color, delay) {
        console.log("status: " + msg)
        var statusMorph = this._statusMorph;
        if (!statusMorph) {
            statusMorph = new lively.morphic.Text(pt(400,80).extentAsRectangle());
            statusMorph.applyStyle({
                borderWidth: 0,
                strokeOpacity: 0,
                fill: Color.gray,
                fontSize: 16,
                fillOpacity: 1,
                fixedWidth: false,
                fixedHeight: false
            });
            statusMorph.isEpiMorph = true;
            this._statusMorph = statusMorph;
        }
        statusMorph.textString = msg;
        this.world().addMorph(statusMorph);
        statusMorph.setTextColor(color || Color.black);
        statusMorph.ignoreEvents();
        // FIXME getSelectionBounds does not work yet when there is a null selection
        if (this.isFocused()) {
            statusMorph.align(
              statusMorph.bounds().topLeft(),
              this.worldPoint(this.innerBounds().bottomLeft()))
        } else {
            statusMorph.centerAt(this.worldPoint(this.innerBounds().center()));
        };
        (function() { statusMorph.remove(); }).delay(delay || 4);
    }
},
'tab handling', {
    tab: Config.useSoftTabs ? '    ' : '\t',
    isTabBeforeCursor: function(selectIt) { return this.isTabBeforeOrAfterCursor(selectIt, false) },
    isTabAfterCursor: function(selectIt) { return this.isTabBeforeOrAfterCursor(selectIt, true) },
    isTabBeforeOrAfterCursor: function(selectIt, after) {
        if (!this.hasNullSelection()) return false;
        var selRange = this.getSelectionRange(),
            rangeToTest = selRange.clone();
        if (after) rangeToTest[1] = rangeToTest[1] + this.tab.length;
        else rangeToTest[0] = rangeToTest[0] - this.tab.length;
        // @cschuster: consider using the HTML API here
        var strToTest = this.getTextNode().textContent.substring(rangeToTest[0], rangeToTest[1]),
            isTab = strToTest === this.tab;
        if (isTab && selectIt) {
            this.setSelectionRange(rangeToTest[0], rangeToTest[1]);
        }
        return isTab;
    },

    convertTabsToSpaces: function() {
        var tabRegex = /\t/g,
            tab = this.tab,
            noSelection = this.selectionString() == '';

        if (noSelection) this.selectCurrentLine();

        this.modifySelectedLines(function(line) { return line.replace(tabRegex, tab) });
    },

    tabspacesForCursorPos: function() {
        var cursorPos = this.getSelectionRange()[0]
        if (this.textString[cursorPos] == '\n') return this.tab
        var beginOfLine = this.textString.lastIndexOf('\n', cursorPos);
        var column = this.textString.substring(beginOfLine + 1, cursorPos);
        // alertOK("tab " + column.length)
        return  Strings.indent('', ' ', this.tab.length - column.length % this.tab.length )
    }
},
'syntax highlighting', {

    highlightSyntax: function() {
        if (Config.get('disableSyntaxHighlighting')) return null;
        var syntaxHighlighter = this.syntaxHighlighter;
        if (!syntaxHighlighter) return null;

        if (syntaxHighlighter.charLimit && this.textString.length >= syntaxHighlighter.charLimit) {
            return null;
        }

        var text = this,
            startTime = Date.now(),
            selRange = this.getSelectionRange(),
            scroll = this.getScroll(),
            domChanged = syntaxHighlighter.styleTextMorph(text);
        if (domChanged) {
            selRange && this.setSelectionRange(selRange[0], selRange[1]);
            scroll && this.setScroll(scroll[0], scroll[1]);
        }
        this._lastSyntaxHighlightTime = Date.now() - startTime;
        return true;
    },

    highlightJavaScriptSyntax: function() {
        // DEPRECATED!
        this.highlightSyntaxDebounced();
    },

    highlightSyntaxDebounced: function() {
        var waitTime = this.syntaxHighlighter ? this.syntaxHighlighter.minDelay : 100;
        // replaces this function in the instance object
        this.highlightSyntaxDebounced = Functions.debounce(waitTime, this.highlightSyntax);
        this.highlightSyntaxDebounced();
    },

    enableSyntaxHighlighting: function() {
        this.syntaxHighlightingWhileTyping = true;
        this.highlightSyntaxDebounced();
        connect(this, 'textString', this, 'highlightSyntaxDebounced');
    },

    disableSyntaxHighlighting: function() {
        var styles = this.getStyleRanges();
        this.syntaxHighlightingWhileTyping = false;
        delete this.highlightSyntaxDebounced;
        disconnect(this, 'textString', this, 'highlightSyntaxDebounced');
        this.emphasizeRanges(styles);
    },

    enableSyntaxHighlightingOnSave: function() {
        this.syntaxHighlightingOnSave = true;
        connect(this, 'savedTextString', this, 'highlightSyntaxDebounced');
    },

    disableSyntaxHighlightingOnSave: function() {
        this.syntaxHighlightingOnSave = false;
        disconnect(this, 'savedTextString', this, 'highlightSyntaxDebounced');
    }
},
'JavaScript support', {
    varDeclCleaner: function() {
        // for usage with #modifyLines
        // turns "var foo;\nvar bar;" into "var foo,\n    bar;"
        var cancel = false, indent = '', tab = this.tab,
            varRegexp = /(\s*)var\s+([^;]+)(;?)(\s*)/;
        return function cleanLine(line, idx, lines) {
            var varMatch = line.match(varRegexp),
                last = idx === lines.length - 1;
            if (idx === 0 && !varMatch) cancel = true;
            if (!varMatch || cancel) return line;
            if (idx === 0) {
                indent = varMatch[1] + tab;
                return line.replace(varRegexp, '$1var $2,');
            }
            if (!last) return line.replace(varRegexp, indent + '$2,');
            return line.replace(varRegexp, indent + '$2;');
        }
    }
});


Object.extend(lively.morphic.Text, {
    activeInstance: function() {
        // returns the text that currently has a focus
        // set in onFocus and onBlur
        return this.prototype.activeInstance;
    }
});

(function idSetup() {
    var id = 0;
    Object.extend(lively, {
        newId: function() { return ++id; }
    });
})();

Object.subclass('lively.morphic.TextChunk',
'settings', {
    debugMode: false,
    doNotSerialize: ['chunkNode']
},
'initializing', {
    initialize: function(str, style) {
        if (str) this.textString = str;
        this.style = style || new lively.morphic.TextEmphasis();
    }
},
'accessing', {
    id: function() {
        if (!this._id) this._id = "_" + lively.newId();
        return this._id;
    },
    get textString() {
        return this.getChunkNode().textContent;
    },
    set textString(string) {
        return this.getChunkNode().textContent = string;
    },
    getChunkNode: function() {
        if (!this.chunkNode) {
            this.chunkNode = XHTMLNS.create('span');
            this.chunkNode.setAttribute("id", this.id());
        }
        return this.chunkNode;
    },
    next: function() {
        var chunks = this.chunkOwner.getTextChunks(), chunkIdx = chunks.indexOf(this);
        return chunks[chunkIdx+1];
    },
    prev: function() {
        var chunks = this.chunkOwner.getTextChunks(), chunkIdx = chunks.indexOf(this);
        return chunks[chunkIdx-1];
    },
    getStyle: function() { return this.style },
    bounds: function() {
        var b = lively.$(this.getChunkNode()).bounds();
        return new Rectangle(b.left, b.top, b.width(), b.height());
    }
},
'testing', {
    isRendered: function() { return this.chunkNode && this.chunkNode.parentNode != undefined }
},
'adding', {
    addTo: function(chunkOwner, optChunkAfter) {
        this.chunkOwner = chunkOwner;

        this.debugMode = chunkOwner.chunkDebugMode;

        if (chunkOwner.isRichText) return; // FIXME

        var textNode = chunkOwner.renderContext().textNode,
            chunkNode = this.getChunkNode(),
            otherChunkNode = optChunkAfter && optChunkAfter.getChunkNode();
        if (!textNode) { return; }
        if (chunkNode.parentNode) { this.remove(); }
        if (otherChunkNode && otherChunkNode.parentNode === textNode) {
            textNode.insertBefore(chunkNode, otherChunkNode);
        } else {
            textNode.appendChild(chunkNode);
        }
        this.styleText();
    }

},
'removing', {
    remove: function() {
        // Note: Currently chunkOwner is expected to remove this
        // manually from its textChunks list!
        this.chunkOwner = null;
        var n = this.getChunkNode();
        n.parentNode && n.parentNode.removeChild(n);
    }
},
'splitting', {
    splitAfter: function(localIdx, optChunkRanges) { return this.split(localIdx, true, optChunkRanges) },
    splitBefore: function(localIdx, optChunkRanges) { return this.split(localIdx, false, optChunkRanges) },
    split: function(localIdx, returnRight, optChunkRanges) {
        // make two chunks out of me
        // 1. remove text from localIdx to textString.length
        // 2. let morph add my new neighbour
        // 3. if returnRight == true return the chunk after localIdx,
        //    otherwise before (that's me)
        var str = this.textString,
            myString = str.substring(0, localIdx),
            newString = str.substring(localIdx);

        // corner cases: if we are already at the end of the chunk and want to have
        // the right of the split then return the next chunk if it exists
        // otherwise split the existing into an empty chunk
        // When returning left localIdx chunk do the same
        if (returnRight && newString.length === 0) {
            var next = this.next();
            if (next) return next;
        }
        if (!returnRight && myString.length === 0) {
            var prev = this.prev();
            if (prev) return prev;
        };

        // We don't care we want to have the chunk to the right, so
        // use me as right and don't split
        if (returnRight && myString.length === 0) return this;
        // same thing
        if (!returnRight && newString.length === 0) return this;

        this.textString = myString;
        var newChunk = this.createForSplit(newString),
            chunks = this.chunkOwner.getTextChunks(),
            chunkIdx = chunks.indexOf(this),
            next = chunks[chunkIdx+1];

        // add new chunk in chunk collection of morph
        chunks.splice(chunkIdx+1, 0, newChunk);
        newChunk.addTo(this.chunkOwner, next);

        // if we pass in an array of intervals that represents the chunk ranges
        // we update that here, too, in order to keep them up-to-date and
        // reusable elsewhere
        if (optChunkRanges) {
            var rangeToFix = optChunkRanges[chunkIdx],
                splitIndex = rangeToFix[0] + myString.length;
            optChunkRanges.splice(chunkIdx, 1,
                      [rangeToFix[0], splitIndex], [splitIndex, rangeToFix[1]]);
        }

        return returnRight ? newChunk : this;
    },

    createForSplit: function(str) { return new this.constructor(str, this.getStyle().clone()) }

},
'joining', {
    joinWithNext: function() {
        var chunks = this.chunkOwner.getTextChunks(),
            chunkIdx = chunks.indexOf(this),
            next = chunks[chunkIdx+1];
        if (!next) return false;
        next.remove();
        chunks.splice(chunkIdx+1, 1);
        this.textString += next.textString;
        return true;
    },

    tryJoinWithNext: function() {
        var next = this.next();
        return next && (next.textString.length === 0 || this.getStyle().equals(next.getStyle())) ?
            this.joinWithNext() : null;
    }

},
'styling', {
    includesStyle: function(style) {
        return this.getStyle().include(style);
    },

    styleText: function(styleSpec) {
        this.normalize();
        var style = this.getStyle();
        if (styleSpec) style.add(styleSpec);
        style.applyToHTML(this.getChunkNode(), this.debugMode);
    }
},
'subnodes', {
    normalize: function() {
        this.getChunkNode().normalize();
    },
    claim: function(nodes) {
        // extract the content of nodes and at it to me
        var content = '';
        for (var i = 0; i < nodes.length; i++) {
            content += nodes[i].textContent;
            if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
        }
        if (content) this.textString = content;
    },

    ingestAllFollowingElements: function(nextChunk) {
        var ownChunkNode = this.getChunkNode(),
            nextChunkNode = nextChunk && nextChunk.getChunkNode(),
            content = '';
        while (true) {
            var nextNode = ownChunkNode.nextSibling;
            if (!nextNode || nextNode === nextChunkNode) break;
            content += nextNode.textContent;
            if (nextNode.parentNode) nextNode.parentNode.removeChild(nextNode);
        }
        if (content !== '') {
            this.textString += content;
            return true; // DOM was changed
        }
        return false;
    },
    ingestAllPrecedingElements: function(prevChunk) {
        var ownChunkNode = this.getChunkNode(),
            prevChunkNode = prevChunk && prevChunk.getChunkNode(),
            content = '';
        while (true) {
            var prevNode = ownChunkNode.previousSibling;
            if (!prevNode || prevNode === prevChunkNode) break;
            content = prevNode.textContent + content;
            if (prevNode.parentNode) prevNode.parentNode.removeChild(prevNode);
        }
        if (content !== '') {
            this.textString = content + this.textString;
            return true; // DOM was changed
        }
        return false;
    },
    nodesBetweenMeAndOther: function(otherChunk) {
        // if !otherChunk then get all the chunks until the end
        var nextNode = this.getChunkNode(),
            otherChunkNode = otherChunk && otherChunk.getChunkNode(),
            nodes = [];
        while ((nextNode = nextNode.nextSibling)) {
            if (nextNode === otherChunkNode) break;
            nodes.push(nextNode);
        }
        return nodes;
    },
    ensureEndsWithBr: function() {
        var chunkNode = this.getChunkNode(),
            lastBrFound = false;
        for (var i = 0; i < chunkNode.childNodes.length; i++) {
            var node = chunkNode.childNodes[i];
            if (node.tagName && node.tagName.toLowerCase() === 'br') {
                lastBrFound = true;
                continue;
            }
            if (node.textContent.length > 0) lastBrFound = false;
        }
        if (!lastBrFound) chunkNode.appendChild(XHTMLNS.create('br'));
    },
    ensureDoesNotEndWithBr: function() {
        var chunkNode = this.getChunkNode();
        if (chunkNode.childNodes.length == 0) return;
        var node = chunkNode.childNodes[chunkNode.childNodes.length - 1];
        if (node.tagName && node.tagName.toLowerCase() === 'br') {
            chunkNode.removeChild(node);
        };
    },
    removeNonChunkNodes: function() {
        var node = this.getChunkNode(),
            childNode = node.firstChild,
            domChanged = false;
        while (childNode) {
            var next = childNode.nextSibling;
            // exception for br because at text end has to be a br to correctly line break the text
            // in chrome. see also ensureEndsWithBr
            if (childNode.tagName && childNode.tagName.toLowerCase() != 'br') {
                domChanged = true;
                node.insertBefore(NodeFactory.createText(childNode.textContent), next);
                node.removeChild(childNode);
            }
            childNode = next;
        }
        return domChanged;
    }

},
'debugging', {
    toString: function() {
        return Strings.format(
            'TextChunk(%s<%s>,%s,%s)',
            this.id(),
            this.chunkNode ? "node " + this.chunkNode.getAttribute("id"): "no node",
            this.textString.truncate(10),
            this.getStyle());
    },

    toPlainObject: function() {
        return {
            id: this.id(),
            textString: this.textString,
            style: this.style,
            chunkOwner: String(this.chunkOwner),
            node: this.chunkNode ? "node " + this.chunkNode.getAttribute("id"): "no node"
        }
    }
},
'serialization', {
    cacheContent: function() {
        this.storedString = this.textString;
    },
    restoreFromCacheContent: function() {
        // if this.storedString is undefined we dont want to print it "undefined"
        this.textString = this.storedString || "";
        // FIXME not deleting storedString in order to not lose the content when
        // restoring an element that is not in the scenegraph
        //delete this.storedString;
    }
});

Object.subclass('lively.morphic.TextEmphasis',
'documentation', {
    README: function() {
        // supported attributes:
        // data: OBJECT,
        // hover: {inAction: FUNCTION, outAction: FUNCTION},
        // doit: FUNCTION,
        // uri: STRING, // URL, a link
        // fontWeight: "normal"|"bold",
        // italics: "normal"|"italic",
        // fontFamily: STRING, // name of font family, e.g. Arial or sans-serif
        // color: COLOR,
        // backgroundColor: COLOR,
        // textDecoration: "normal"|"underline",
        // textAlign: "left"|"center"|"right",
        // fontSize: NUMBER,
        // textShadow: null|POINT|STRING // e.g. pt(4,2) or when a String it should be a css text shadow spec

        // When extending TextEmphasis with new attribute:
        // 1. add new entry with set/get/equals/apply in styleAttributes make
        //    sure you implement #equals in the newly added styleAttribute!
        // 2. add getter / setter for attribute that matches the naming
        //    convention (getAttributeName / setAttributeName)
        // 3. extend TextEmphasis>>equals as well!
    }
},
'properties', {
    isTextEmphasis: true
},
'style attributes', {
    styleAttributes: {
        data: {
            // attaches an arbitary JavaScript object to a text chunk
            // this can be used to tag certain parts of a text with
            // non-visible data that will be retained when editing
            // and copying text
            set: function(value) {
                if (!value) delete this.data;
                return this.data = value;
            },
            get: function() { return this.data; },
            equals: function(other) { return this.getData() === other.getData(); },
            apply: Functions.Null
        },

        hover: {
            // expected to be of the form:
            // {inAction: FUNCTION, outAction: FUNCTION}
            set: function(value) {
                value.inAction = value.inAction || Functions.Null;
                value.outAction = value.outAction || Functions.Null;
                if (!value.inAction.hasLivelyClosure) value.inAction = value.inAction.asScript();
                if (!value.outAction.hasLivelyClosure) value.outAction = value.outAction.asScript();
                return this.hover = value;
            },
            get: function() { return this.hover },
            equals: function(other) {
                if (!this.hover) return !other.hover;
                if (!other.hover) return false;
                return this.hover.inAction == other.hover.inAction
                    && this.hover.outAction == other.hover.outAction;
            },
            apply: function(node) {
                var hover = this.hover;
                if (!hover) return;

                // setup
                var actionQueue = lively.morphic.TextEmphasis.hoverActions;
                this.addCallbackWhenApplyDone('mouseenter', function(evt) {
                    actionQueue.enter(function() {
                        var morph = lively.$(evt.target).parents('[data-lively-node-type="morph-node"]').eq(0).data('morph');
                        lively.morphic.EventHandler.prototype.patchEvent(evt);
                        hover.inAction.call(morph, evt);
                    });
                    return true;
                });
                this.addCallbackWhenApplyDone('mouseleave', function(evt) {
                    actionQueue.leave(function() {
                        var morph = lively.$(evt.target).parents('[data-lively-node-type="morph-node"]').eq(0).data('morph');
                        lively.morphic.EventHandler.prototype.patchEvent(evt);
                        hover.outAction.call(morph, evt);
                    });
                    return true;
                });

                // FIXME use proper serialization with data attributes
                LivelyNS.setAttribute(node, 'hoverInAction', hover.inAction.toString());
                LivelyNS.setAttribute(node, 'hoveroutAction', hover.outAction.toString());
            }
        },

        doit: {
            // expected to be of the form
            // {code: STRING [, context: OBJECT]}
            set: function(value) { return this.doit = value },
            get: function() { return this.doit },
            equals: function(other) {
                if (this.doit) {
                    return other.doit ? this.doit.code == other.doit.code : false;
                }
                return !other.doit;
            },
            apply: function(node) {
                if (!this.hasOwnProperty("doit")) return;
                if (!this.doit) {
                    node.style.cursor = 'auto';
                    node.style.textDecoration = 'none';
                    node.style.color = 'inherit';
                    LivelyNS.removeAttribute(node, 'doit');
                    lively.$(node).removeClass("doit");
                    delete this.doit;
                    return;
                }
                var doit = this.doit;
                this.addCallbackWhenApplyDone('click', function(evt) {
                    lively.morphic.EventHandler.prototype.patchEvent(evt);
                    var src = '(function(evt) {\n' + doit.code + '\n})';
                    try {
                        var func = eval(src);
                        func.call(doit.context || Global, evt);
                    } catch(e) {
                        alert('Error in text doit\n' + e.stack);
                    }
                    return true;
                });
                node.style.cursor = 'pointer';
                node.style.textDecoration = 'underline';
                node.style.color = 'darkgreen';
                lively.$(node).addClass("doit");
                LivelyNS.setAttribute(node, 'doit', doit.code);
            }
        },

        uri: {
            set: function(value) { return this.uri = value},
            get: function() { return this.uri },
            equals: function(other) { return this.uri == other.uri },
            apply: function(node) {
                var value = this.uri;
                if (!value) return;
                this.addCallbackWhenApplyDone('click', function(evt) { window.open(value) });
                node.style.cursor = 'pointer';
                node.style.textDecoration = 'underline';
                node.style.color = 'blue';
                LivelyNS.setAttribute(node, 'uri', value);
            }
        },

        fontWeight: {
            set: function(value) { return this.fontWeight = value },
            get: function() { return (this.fontWeight && this.fontWeight !== '') ? this.fontWeight : 'normal' },
            equals: function(other) { return this.get('fontWeight') == other.get("fontWeight") },
            apply: function(node) { if (this.hasOwnProperty("fontWeight")) node.style.fontWeight = this.fontWeight  }
        },

        italics: {
            set: function(value) { return this.italics = value},
            get: function() { return (this.italics && this.italics !== '') ? this.italics : 'normal' },
            equals: function(other) { return this.get('italics') == other.get("italics") },
            apply: function(node) { if (this.hasOwnProperty("italics")) node.style.fontStyle = this.italics }
        },

        fontFamily: {
            set: function(value) { return this.fontFamily = value },
            get: function() { return this.fontFamily },
            equals: function(other) { return this.fontFamily == other.fontFamily },
            apply: function(node) { if (this.hasOwnProperty("fontFamily")) node.style.fontFamily = this.fontFamily }
        },

        color: {
            set: function(value) { return this.color = value },
            get: function() { return this.color },
            equals: function(other) {
                return this.color == other.color ||
                    (this.color && this.color.isColor && this.color.equals(other.color));
            },
            apply: function(node) { if (this.hasOwnProperty("color")) node.style.color = this.color; }
        },

        backgroundColor: {
            set: function(value) { return this.backgroundColor = value },
            get: function() { return this.backgroundColor },
            equals: function(other) {
                return this.backgroundColor == other.backgroundColor ||
                    (this.backgroundColor &&
                     this.backgroundColor.isColor &&
                     this.backgroundColor.equals(other.backgroundColor));
            },
            apply: function(node) {
                if (this.hasOwnProperty('backgroundColor')) {
                    node.style.backgroundColor = this.backgroundColor || '';
                }
            }
        },

        textDecoration: {
            set: function(value) { return this.textDecoration = value },
            get: function() { return this.textDecoration },
            equals: function(other) { return this.textDecoration == other.textDecoration },
            apply: function(node) { if (this.hasOwnProperty("textDecoration")) node.style.textDecoration = this.textDecoration }
        },

        textAlign: {
            set: function(value) { return this.textAlign = value },
            get: function() { return this.textAlign },
            equals: function(other) { return this.textAlign == other.textAlign },
            apply: function(node) { if (this.hasOwnProperty("textAlign")) node.style.textAlign = this.textAlign }
        },

        fontSize: {
            set: function(value) { return this.fontSize = value },
            get: function() { return this.fontSize },
            equals: function(other) { return this.fontSize == other.fontSize },
            apply: function(node) { if (this.hasOwnProperty("fontSize")) node.style.fontSize = this.fontSize + 'pt' }
        },

        textShadow: {
            set: function(value) {
                if (!value) {
                    value = '';
                } else if (Object.isString(value)) {
                    // use it as it is
                } else {
                    // is spec object woth attributes
                    value = value.offset.x + 'px '
                          + value.offset.y + 'px '
                          + (value.blur ? value.blur + 'px ' : "0 ")
                          + (value.color || Color.black).toCSSString();
                }
                this.textShadow = value;
            },
            get: function() { return this.textShadow },
            equals: function(other) { return this.textShadow == other.textShadow },
            apply: function(node) { if (this.hasOwnProperty("textShadow")) node.style.textShadow = this.textShadow }
        },

        isNullStyle: {
            set: function(value) { return this.isNullStyle = value },
            get: function() { return this.isNullStyle },
            equals: function(other) { return this.isNullStyle == other.isNullStyle },
            apply: function(node) { this.isNullStyle && node.setAttribute('style', "") }
        }

    },

    getSupportedStyleNames: function() {
        if (!this.supportedStyleNames) {
            this.constructor.prototype.supportedStyleNames = Object.keys(this.constructor.prototype.styleAttributes);
        }
        return this.supportedStyleNames;
    }
},
'initializing', {
    initialize: function(spec) {
        spec && this.add(spec);
    }
},
'accessing', {
    get: function(attrName) { return this.styleAttributes[attrName].get.call(this) },
    set: function(attrName, value) { return this.styleAttributes[attrName].set.call(this, value) },
    getData:             function()      { return this.get('data'); },
    setData:             function(value) { return this.set('data', value); },
    getDoit:             function()      { return this.get('doit'); },
    setDoit:             function(value) { return this.set('doit', value); },
    getHover:            function()      { return this.get('hover'); },
    setHover:            function(value) { return this.set('hover', value); },
    getURI:              function()      { return this.get('uri'); },
    setURI:              function(value) { return this.set('uri', value); },
    getFontWeight:       function()      { return this.get('fontWeight'); },
    setFontWeight:       function(value) { return this.set('fontWeight', value);; },
    getItalics:          function()      { return this.get('italics'); },
    setItalics:          function(value) { return this.set('italics', value); },
    getFontFamily:       function()      { return this.get('fontFamily'); },
    setFontFamily:       function(value) { return this.set('fontFamily', value);; },
    getColor:            function()      { return this.get('color'); },
    setColor:            function(value) { return this.set('color', value); },
    getBackgroundColor:  function()      { return this.get('backgroundColor'); },
    setBackgroundColor:  function(value) { return this.set('backgroundColor', value); },
    getTextDecoration:   function()      { return this.get('textDecoration');  },
    setTextDecoration:   function(value) { return this.set('textDecoration', value); },
    getTextAlignment:    function()      { return this.get('textAlign'); },
    setTextAlignment:    function(value) { return this.set('textAlign', value); },
    getFontSize:         function()      { return this.get('fontSize'); },
    setFontSize:         function(value) { return this.set('fontSize', value); },
    getTextShadow:       function()      { return this.get('textShadow'); },
    setTextShadow:       function(value) { return this.set('textShadow', value); }
},
'cloning', {
    clone: function() { return new this.constructor(this) }
},
'changing', {
    add: function(spec) {
        for (var name in spec) {
            if (!this.styleAttributes[name] || !spec.hasOwnProperty(name)) continue;
            this.styleAttributes[name].set.call(this, spec[name]);
        }
    }
},
'testing', {
    equals: function(other) {
        if (!other || !other.isTextEmphasis) return false;

        var attrs = this.styleAttributes;

        if (attrs.isNullStyle.get.call(this) || attrs.isNullStyle.get.call(other)) {
            return attrs.isNullStyle.equals.call(this, other);
        }

        // FIXME refactor
        return attrs.data            .equals.call(this, other)
            && attrs.doit            .equals.call(this, other)
            && attrs.hover           .equals.call(this, other)
            && attrs.uri             .equals.call(this, other)
            && attrs.fontWeight      .equals.call(this, other)
            && attrs.italics         .equals.call(this, other)
            && attrs.fontFamily      .equals.call(this, other)
            && attrs.color           .equals.call(this, other)
            && attrs.backgroundColor .equals.call(this, other)
            && attrs.textDecoration  .equals.call(this, other)
            && attrs.textAlign       .equals.call(this, other)
            && attrs.fontSize        .equals.call(this, other)
            && attrs.textShadow      .equals.call(this, other);
    },

    include: function(specOrEmph) {
        // tests whether I have the attributes of specOrEmph set already
        for (var key in specOrEmph) {
            if (!specOrEmph.hasOwnProperty(key)) continue;
            var myVal = this[key], otherVal = specOrEmph[key];
            if (key === "color" || key === "backgroundColor") {
                if (myVal === otherVal) continue;
                if (!myVal || (myVal.isColor && !myVal.equals(otherVal))) return false;
            } else {
                if (myVal !== otherVal) return false;
            }
        }
        return true;
    }

},
'rendering', {
    applyDebugStyling: function(node, debugEnabled) {
        var $ = lively.$,
            toolTip = $('#textChunkDebug');

        // debug mode disabled, reset debug state
        if (!debugEnabled) {
            toolTip.remove();
            node.style.outline = 'none';
            return;
        }

        // debug mode enabled, show debug infos
        node.style.outline = 'red solid thin';
        if (toolTip.length === 0) {
            $('<span id="textChunkDebug"/>').appendTo('body').hide();
        }
        var $node = $(node);
        if ($node.data('events')) return;
        var emph = this;
        $node.mousemove(function(e){
            $('#textChunkDebug').show()
                                .text('id:' + $(this).attr('id') + ', ' + emph.toString())
                                .css({
                                    position: 'absolute',
                                    top: (e.pageY + 50) + "px",
                                    left: (e.pageX + 15) + "px",
                                    'background-color': 'white',
                                    'font-size': 'tiny'
                                });
        });
        $node.mouseout(function(e) { $('#textChunkDebug').hide(); });
    },

    applyToHTML: function(node, debugMode) {
        // apply my style attributes to the DOM node

        // ignore if debugMode was never requested
        if (debugMode !== undefined) this.applyDebugStyling(node, debugMode);

        if (this.isNullStyle) {
            node.setAttribute('style', "");
            this.uninstallCallbackHandlers(node);
            return;
        }

        // FIXME refactor
        var attrs = this.styleAttributes;
        attrs.data            .apply.call(this, node);
        attrs.doit            .apply.call(this, node);
        attrs.hover           .apply.call(this, node);
        attrs.uri             .apply.call(this, node);
        attrs.fontWeight      .apply.call(this, node);
        attrs.italics         .apply.call(this, node);
        attrs.fontFamily      .apply.call(this, node);
        attrs.color           .apply.call(this, node);
        attrs.backgroundColor .apply.call(this, node);
        attrs.textDecoration  .apply.call(this, node);
        attrs.textAlign       .apply.call(this, node);
        attrs.fontSize        .apply.call(this, node);
        attrs.textShadow      .apply.call(this, node);
        // attrs.isNullStyle.apply.call(this, node);

        this.installCallbackHandler(node);
        delete this.callbacks;
    },

    addCallbackWhenApplyDone: function(type, cb) {
        if (!this.callbacks) this.callbacks = {};
        if (!this.callbacks[type]) this.callbacks[type] = [];
        this.callbacks[type].push(cb);
    },

    installCallbackHandler: function(node) {
        var $node = lively.$(node);
        [{type: 'click', handler: 'mouseup'},
         {type: 'mouseenter', handler: 'mouseenter'},
         {type: 'mouseleave', handler: 'mouseleave'}].forEach(function(spec) {
             $node.off(spec.handler);
             if (!this.callbacks
               || !this.callbacks[spec.type]
               || this.callbacks[spec.type].length === 0) {
                 return;
             }
             var cbs = this.callbacks[spec.type];
             $node.on(spec.handler, function(evt) {
                 for (var i = 0; i < cbs.length; i++) {
                     cbs[i].call(this, evt);
                 }
                 evt.stopPropagation();
                 evt.preventDefault();
                 return true;
             });
         }, this);
    },

    uninstallCallbackHandlers: function(node) {
        var $node = lively.$(node);
        $node.off();
    }

},
'debugging', {
    toString: function() {
        var propStrings = [];
        Properties.forEachOwn(this, function(key, value) {
            if (key === '__SourceModuleName__') return;
            propStrings.push(key + ': ' +  String(value));
        });
        return 'TextEmphasis(' + propStrings.join(',') + ')';
    },
    asSpec: function() {
        var spec = {};
        Properties.forEachOwn(this.styleAttributes, function(name, attr) {
            var val = this.hasOwnProperty(name) ? attr.get.call(this) : undefined;
            if (val !== undefined) spec[name] = val;
        }, this);
        return spec;
    }

});

Object.extend(lively.morphic.TextEmphasis, {
    hoverActions: (function createActionQueue() {
        // this actionQueue takes care of the fact that new mouse in/out
        // events are emitted when moving the hand between neighboring text
        // chunks that all have hover actions with the same context
        //
        // consider 3 text chunks that all have hover actions, the arrows
        // represent the movement of the hand across those chunks:
        //
        //       chunk1         chunk2            chunk3
        //    +------------+----------------+----------------+
        //    |   hover    |    hover       |     hover      |
        // ---+--->    ----+--->         ---+-->           --+---->
        //    | context 1  |   context 1    |    context 2   |
        //    +------------+----------------+----------------+
        //
        // = when entering chunk1 the enter-action should run
        // - when moving from chunk1 to chunk2 nothing should happen since the
        //   hover context is the same
        // - when moving from chunk2 to chunk3 the leave-action for context 1
        //   and enter-action for context 2 should fire
        // - when moving out of chunk3 the leave action for context 2 should
        //   fire
        //
        // The implementation below implements these requirements

        var actionQueue = [];

        function schedule(type, context, action) {
            action.type = type;
            action.context = context;
            action.ignore = false;
            actionQueue.unshift(action);
            (function() {
                var idx = actionQueue.indexOf(action);
                if (!action.ignore) action(idx, action.ignore);
                actionQueue.removeAt(idx);
            }).delay(0);
        }

        actionQueue.enter = function enter(callback, context) {
            schedule('in', context, function(idxInQueue) {
                var nextAction = actionQueue[idxInQueue-1];
                if (nextAction && nextAction.type !== "out") {
                    throw new Error('Expecting next action of type "out"!');
                }
                callback.call(context);
            });
        }

        actionQueue.leave = function leave(callback, context) {
            schedule('out', context, function(idxInQueue) {
                var nextAction = actionQueue[idxInQueue-1];
                if (nextAction && nextAction.type !== "in") {
                    throw new Error('Expecting next action of type "in"!');
                }
                if (nextAction && nextAction.context === context) {
                    // out immediately followed by in: do nothing
                    nextAction.ignore = true;
                } else {
                    callback.call(context);
                }
            });
        }

        return actionQueue;
    })()
});

Object.subclass('lively.morphic.RichText', Trait('TextChunkOwner'),
'settings', {
    isRichText: true
},
'initializing', {
    initialize: function(string) {
        this.getTextChunks(); // lazy initialize
        if (string) this.firstTextChunk().textString = string;
    }
},
'rich text interface', {
    emphasize: function(styleSpec, from, to) {
        // FIXME duplication with TextMorph
        var chunks = this.sliceTextChunks(from, to);
        for (var i = 0; i < chunks.length; i++) {
            chunks[i].styleText(styleSpec);
        }
        this.coalesceChunks();
    },
    emphasizeRegex: function(re, style) {
        // FIXME duplication with TextMorph
        var m, counter = 0, string = this.textString;
        while (m = re.exec(string)) {
            counter++; if (counter > 5000) throw new Error('emphasizeRegex endless loop?');
            var from = m.index, to = m.index + m[0].length;
            var chunks = this.sliceTextChunks(from, to);
            for (var i = 0; i < chunks.length; i++) {
                chunks[i].style.add(style);
            }
        }
        this.coalesceChunks();
    },
},
'accessing', {
    get textString() {
        if (!this.storedString)
            this.storedString = this.textChunks.pluck('textString').join('');
        return this.storedString;
    },
    set textString(string) {
        this.storedString = null;
        this.textChunks = [new lively.morphic.TextChunk(string)];
        return string;
    },
    getTextNode: function() {
        return this.firstTextChunk().getChunkNode().parentNode
    },

    getSelectionRange: Functions.Null

},
'text morph application', {
    applyToTextMorph: function(morph) {
        morph.setTextChunks(this.getTextChunks());
    },
    replaceSelectionInMorph: function(morph) {
        // var chunkNodes = this.textChunks.invoke('getChunkNode'),
            // fragment = XHTMLNS.newFragment(chunkNodes);
        if (!morph.getSelectionRange()) {
            morph.setSelectionRange(morph.textString.length, morph.textString.length);
        }
        morph.insertTextChunksAtCursor(this.getTextChunks(), false, true);
    },
    hasSelection: function() {
        // FIXME look for selection in chunk nodes?
        return false;
    }
});

Object.subclass('lively.morphic.RichText2',
'intialization / creation', {
    initialize: function(str, emphs) {
        this.textString = str || '';
        this.textEmphasis = emphs || [];
    },

    getStateFromTextMorph: function(textMorph) {
        this.textString = textMorph.textString;
        this.textEmphasis = Array.range(0, this.textString.length).collect(function(i) {
            return textMorph.getEmphasisAt(i);
        }).compact();
        return this;
    },

    applyToTextMorph: function(m) {
        m.textString = this.textString;
        this.textEmphasis.forEach(function(emph, i) {
            m.emphasize(emph, i, i + 1);
        });
    }
},
'accessing', {
    getTextEmphasis: function() { return this.textEmphasis.select(function(ea) { return !!ea }); },
    getTextString: function() { return this.textString; }
});

lively.morphic.Text.addMethods(
'rich text 2', {
    getRichText2: function() {
        return new lively.morphic.RichText2().getStateFromTextMorph(this);
    },

    setRichText2: function(rt) { rt.applyToTextMorph(this); }
})

cop.create('TextDevLayer')
.refineClass(lively.morphic.Text, {
})
.refineClass(lively.morphic.TextChunk, {
});

Object.subclass('lively.morphic.HTMLParser');

Object.extend(lively.morphic.HTMLParser, {

    parseInIFrame: function(html) {
        // parsing HTML in an iFrame is necessary when we are in an XHTML
        // document but need to embed HTML that is not valid XML.

        // strip out the meta tag if existing:
        html = html.replace(/<meta[^>]+>/, '');

        // now parse html using iFrame and return the childNodes
        var iframe = XHTMLNS.create('iframe');
        iframe.setAttribute('src', "about:blank");
        var body = document.getElementsByTagName('body')[0];
        body.appendChild(iframe);

        try {
            var iframeBody = iframe.contentWindow.document.body;
            iframeBody.innerHTML = html;

            // now gather the nodes that we have parsed and return them in an array
            var nodes = [];
            for (var i = 0; i < iframeBody.childNodes.length; i++) {
                nodes.push(iframeBody.childNodes[i].cloneNode(true));
            }
            return nodes;
        } finally {
            body.removeChild(iframe);
        }
    },

    sourceToNode: function(data) {
        // creates DOM node from a snipped of HTML
        if (data.startsWith('<meta charset')) {
            // it's a special apple format?
            var string = Strings.format('<?xml version="1.0"?><div xmlns:lively="%s">%s</div>',
                                        Namespace.LIVELY, data);
            string = string.replace(/<meta charset=['"]utf-8['"]>/, "");
            string = string.replace(/<br(.*?)>/g, "<br $1/>");
            var doc = new DOMParser().parseFromString(string, "text/xml"),
                errorOccurred = doc.getElementsByTagName('parsererror').length > 0;
            return !errorOccurred && doc.documentElement;
        }
        // it's a complete html document
        // we are currently cutting of everything excepts the body -- this means that
        // style can be lost
        var start = data.indexOf('<body>'), string;
        if (start > -1) {
            start += 6; // "<body>"
            var end = data.indexOf('</body>');
            string = Strings.removeSurroundingWhitespaces(data.slice(start, end));
        } else {
            string = data; // if no body tag just use the plain string
        }
        var node = XHTMLNS.create('div');
        try {
            node.innerHTML = this.sanitizeHtml(string);
        } catch (e) {
            // JENS: logError breaks browser under windows?
            alert("PASTE ERROR: " + e + '\n could not paste: ' + string +'\n'
                 + 'please report problem on: http://lively-kernel.org/trac')
        }
        return node;
    },
    sanitizeHtml: function(string) {
        // replaces html br with newline
        var s = string
            .replace(/\<br.*?\>/g       , "<br />")
            .replace(/\<meta.*?\>/g     , "")
            .replace(/\&(?![a-zA-Z]+;)/g, '&amp;');
        // now it becomes really ugly... we need some kind of general html parser here
        if (s.match(/<span.*>/g) && !s.match(/<\/span>/g)) {
            s = s.replace(/<\/?span.*>/g,"");
        }
        return s;
    },
    sanitizeNode: function (node) {
        // strips node of newlines text nodes, that have no meaning
        Array.from(node.childNodes).forEach(function (ea) {
            if (ea.textContent == "\n" && ea.nodeName == '#text') {
                node.removeChild(ea);
            }
        })
    },

    pastedHTMLToRichText: function(data) {
        // creates a rich text object from HTML snippet
        var node = this.sourceToNode(data);
        if (!node) return null;
        this.sanitizeNode(node);
        var richText = new lively.morphic.RichText(node.textContent);
        this.extractStylesAndApplyToRichText(node, richText, {styles: [], styleStart: 0})
        return richText;
    },

    insertPasteDataIntoText: function(data, text) {
        // creates a rich text object from HTML snippet
        var node = this.sourceToNode(data);
        if (!node) return false;
        this.sanitizeNode(node);
        var selRange = text.getSelectionRange(),
            selStart = selRange ? Math.min.apply(null, selRange) : 0,
            newSelRange = [selStart + node.textContent.length, selStart + node.textContent.length],
            styledRanges = this.createIntervalsWithStyle(
                node, {styles: [], styleStart: selStart || 0, intervals: []});
        text.insertAtCursor(node.textContent, false, true);
        text.emphasizeRanges(styledRanges);
        text.setSelectionRange(newSelRange[0], newSelRange[1]);
        return true;
    },

    extractStylesAndApplyToRichText: function(element, richText, mem) {
        // private
        for (var i = 0; i < element.childNodes.length; i++) {
            var ea = element.childNodes[i];

            if (ea.nodeName === '#text') {
                var string = element.textContent,
                    styleEnd = mem.styleStart + string.length;
                richText.emphasize(Object.merge(mem.styles), mem.styleStart, styleEnd);
                mem.styles = [];
                mem.styleStart = styleEnd;
                continue;
            }

            if (ea.getAttribute && (ea.getAttribute('class') === 'Apple-style-span')) {
                this.extractStylesAndApplyToRichText(ea, richText, mem)
                continue;
            }
            if (!ea.getAttribute) {
                // comments etc
                continue;
            }
            var css = ea.getAttribute('style');
            if (css) {
                var style = {};
                css.split(";").forEach(function(ea) {
                    if (ea.match(":")) {
                        var pair = ea.replace(/ /g,"").split(":")
                        style[this.convertStyleName(pair[0])] = pair[1]
                    }
                }, this)
                mem.styles.push(style);
            }

            var link = LivelyNS.getAttribute(ea, 'uri');
            link && mem.styles.push({uri: link});

            var doit = LivelyNS.getAttribute(ea, 'doit');
            doit && mem.styles.push({doit: lively.persistence.Serializer.deserialize(doit)});

            this.extractStylesAndApplyToRichText(ea, richText, mem);
        }
    },

    createIntervalsWithStyle: function(element, mem) {
        // private
        mem = mem || {styles: [], styleStart: 0, intervals: []};
        for (var i = 0; i < element.childNodes.length; i++) {
            var ea = element.childNodes[i];

            if (ea.nodeName === '#text') {
                var string = element.textContent,
                    styleEnd = mem.styleStart + string.length;
                mem.intervals.push([mem.styleStart, styleEnd, Object.merge(mem.styles)]);
                mem.styles = [];
                mem.styleStart = styleEnd;
                continue;
            }

            if (ea.getAttribute && (ea.getAttribute('class') === 'Apple-style-span')) {
                this.createIntervalsWithStyle(ea, mem)
                continue;
            }
            if (!ea.getAttribute) {
                // comments etc
                continue;
            }
            var css = ea.getAttribute('style');
            if (css) {
                var style = {};
                css.split(";").forEach(function(ea) {
                    if (ea.match(":")) {
                        var pair = ea.replace(/ /g,"").split(":")
                        style[this.convertStyleName(pair[0])] = pair[1]
                    }
                }, this)
                mem.styles.push(style);
            }

            var link = LivelyNS.getAttribute(ea, 'uri');
            link && mem.styles.push({uri: link});

            var doit = LivelyNS.getAttribute(ea, 'doit');
            doit && mem.styles.push({doit: lively.persistence.Serializer.deserialize(doit)});

            this.createIntervalsWithStyle(ea, mem);
        }
        return mem.intervals;
    },

    convertStyleName: function(name) {
        var s = name.split("-").invoke('capitalize').join("")
        return s.charAt(0).toLowerCase() + s.substring(1);
    },
    stringToHTML: function(textData) {
        return  '<span>' + textData.replace(/</g,"&lt;") + '</span>'
    },
});

lively.morphic.Text.Fonts = {

    availableFonts: function(fontNames) {
    	var testText = 'CmmwwmmwwmmwwmmL',
    		parent = document.body,
    		span = document.createElement('span');
    	span.textContent = testText;
    	span.style.fontSize = '72px';
    	parent.appendChild(span);
    	var defaultWidth = span.offsetWidth, defaultHeight = span.offsetHeight;
    	var availableFonts = fontNames.select(function(fontName) {
    		try {
    			if (Global.getComputedStyle(span).fontFamily == fontName) return true;
    			span.style.fontFamily = fontName;
    			var available = defaultWidth !== span.offsetWidth || defaultHeight !== span.offsetHeight;
    			return available;
    		} catch(e) { return false; }
    	});
    	parent.removeChild(span);
    	return availableFonts;
    },

    getKnownFonts: function(fontNames) {
    	return ['academy engraved let',
    		'algerian',
    		'amaze',
    		'arial',
    		'arial black',
    		'balthazar',
    		'bart',
    		'bimini',
    		'comic sans ms',
    		'book antiqua',
    		'bookman old style',
    		'braggadocio',
    		'britannic bold',
    		'brush script mt',
    		'century gothic',
    		'century schoolbook',
    		'chasm',
    		'chicago',
    		'colonna mt',
    		'comic sans ms',
    		'commercialscript bt',
    		'coolsville ',
    		'courier',
    		'courier new',
    		'cursive',
    		'dayton',
    		'desdemona',
    		'fantasy',
    		'flat brush ',
    		'footlight mt light ',
    		'futurablack bt',
    		'futuralight bt',
    		'garamond',
    		'gaze',
    		'geneva',
    		'georgia',
    		'geotype tt',
    		'helterskelter',
    		'helvetica',
    		'herman',
    		'highlight let',
    		'impact',
    		'jester',
    		'joan',
    		'john handy let',
    		'jokerman let',
    		'kelt',
    		'kids',
    		'kino mt',
    		'la bamba let',
    		'lithograph',
    		'lucida console',
    		'map symbols',
    		'marlett',
    		'matteroffact',
    		'matisse itc ',
    		'matura mt script capitals',
    		'mekanik let',
    		'monaco ',
    		'monospace',
    		'monotype sorts',
    		'ms linedraw',
    		'new york',
    		'olddreadfulno7 bt',
    		'orange let',
    		'palatino ',
    		'playbill',
    		'pump demi bold let',
    		'puppylike',
    		'roland',
    		'sans-serif',
    		'scripts',
    		'scruff let',
    		'serif',
    		'short hand',
    		'signs normal',
    		'simplex',
    		'simpson',
    		'stylus bt',
    		'superfrench',
    		'surfer',
    		'swis721 bt',
    		'swis721 blkoul bt',
    		'symap',
    		'symbol',
    		'tahoma',
    		'technic',
    		'tempus sans itc',
    		'terk ',
    		'times',
    		'times new roman',
    		'trebuchet ms',
    		'trendy',
    		'txt',
    		'verdana',
    		'victorian let',
    		'vineta bt',
    		'vivian',
    		'webdings',
    		'wingdings',
    		'western ',
    		'westminster',
    		'westwood let',
    		'wide latin',
    		'zapfellipt bt',
    		// these are for linux
    		'URW Chancery L',
    		'URW Gothic L',
    		'Century Schoolbook L',
    		'URW Bookman L',
    		'URW Palladio L',
    		'Nimbus Mono L',
    		'Nimbus Sans L',
    		'Nimbus Roman No',
    		'DejaVu Sans',
    		'DejaVu Sans Mono',
    		'DejaVu Serif',
    		'DejaVu Sans Light',
    		'Bitstream Charter',
    		'DejaVu Sans Condensed',
    		'DejaVu Serif Condensed',
    		'Courier ',
    		'Liberation Mono',
    		'Liberation Serif',
    		'FreeSerif',
    		'Liberation Sans',
    		'FreeMono',
    		'FreeSans',
    		'Arial',
    		'Courier New',
    		'Times New Roman',
    		'Verdana',
    		'Lohit Bengali',
    		'Lohit Gujarati',
    		'Lohit Punjabi',
    		'Lohit Tamil',
    		'UnDotum',
    		'Georgia',
    		'Trebuchet MS',
    		'Arial Black',
    		'Impact',
    		'Andale Mono',
    		'Bitstream Vera Sans Mono',
    		'Comic Sans MS',
    		'Bitstream Vera Sans',
    		'Waree'].uniq().sort();
    },

    openFontBook: function() {
    	/*this. listAvailableFonts()*/
    	var list = new lively.morphic.MorphList(lively.rect(0,0, 200, 500));
        var fonts = this.availableFonts(this.getKnownFonts());
        var items = fonts.map(function(font) {
            var text = new lively.morphic.Text(lively.rect(0,0, list.getExtent().x,20), font);
    		text.applyStyle({fill: null, borderWidth:0, fontFamily: font, fixedHeight: false, fixedWidth: true, allowInput: false})
    		text.ignoreEvents();
    		return text;
        });
        items.forEach(list.addMorph.bind(list));
        list.layout.layouter.setBorderSize(0);
        list.layout.layouter.setSpacing(5);
        $world.addFramedMorph(list, 'Font Book');
        return list;
    }

};

Object.subclass('lively.morphic.Text.ShortcutHandler',
'bindings', {
    addBinding: function(shortcutString, handler) {
        this.bindings().push({
            shortcutString: shortcutString,
            handler: handler,
            evtSpec: this.parseShortcut(shortcutString)
        });
    },
    addBindings: function(/*args*/) {
        for (var i = 0; i < arguments.length; i+=2) {
            this.addBinding(arguments[i], arguments[i+1]);
        }
    },

    bindings: function() {
        if (!this._bindings) this._bindings = [];
        return this._bindings;
    },
    parseShortcut: function(string) {
        var spec = {ctrl: false, cmd: false},
            keys = string.split('+');
        keys.forEach(function(keyString) {
            var specialKeyMatch = keyString.match(/<(.*)>/);
            if (specialKeyMatch) {
                spec[specialKeyMatch[1]] = true;
                return;
            }
            if (keyString.length === 1) {
                var shiftKey = keyString === keyString.toUpperCase();
                spec.shift = shiftKey;
                spec.charCode = keyString.toUpperCase().charCodeAt(0);
                spec.charPressed = keyString;
                return;
            }
            throw new Error('Cannot recognize ' + keyString);
        });
        return spec;
    },

},
'event processing', {
    invoke: function(evt, target) {
        // rk 12-01-12: OK, this is a very simple version, just for what I need right now
        var bindings = this.bindings();
        for (var i = 0; i < bindings.length; i++) {
            var b = bindings[i],
                specialKeysMatch = (evt.isCtrlDown()   == b.evtSpec.ctrl) &&
                                   (evt.isShiftDown()  == b.evtSpec.shift) &&
                                   (evt.isCommandKey() == b.evtSpec.cmd),
                charKeyMatches   = (evt.charCode || evt.keyCode) === b.evtSpec.charCode;
            if (!specialKeysMatch || !charKeyMatches) continue;
            return b.handler.call(this, target, b);
        };
    }
});

}) // end of module
