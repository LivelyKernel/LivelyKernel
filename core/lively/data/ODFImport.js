module('lively.data.ODFImport').requires('lively.data.FileUpload').toRun(function() {

lively.FileUploader.subclass('lively.Clipboard.ODFUploader', {

    handles: function(file) {
        return file.type.match(/application\/.*opendocument.*/);
    },

    getUploadSpec: function(evt, file) {
        return {readMethod: "asBinary"}
    },

    onLoad: function(evt) {
        this.uploadAndOpenODFTo(
            URL.source.withFilename(this.file.name),
            this.file.type, evt.target.result, this.pos);
    },
    uploadAndOpenODFTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openODF(url, mime, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    },

    openODF: function(url, mime, pos) {
        require('lively.Presentation')
        .requiresLib({
            url: "http://webodf.org/demo/demobrowser/webodf.js",
            loadTest: function() { return typeof odf !== "undefined"; }})
        .toRun(function() {
            // 1) load ODF using WebODF into a wrapper morph
            var msgMorph, wrapper, domChangesStartTime, visibleBounds = $world.visibleBounds();
            [function(next) {
                msgMorph = $world.createStatusMessage("Loading ODF document\nplease wait...", {openAt: 'center'});
                next.delay(0);
            }, function(next) {
                var id = 'odf-' + Strings.newUUID();
                wrapper = lively.morphic.HtmlWrapperMorph.renderHTML('<div id="' + id + '" />');
                var win = wrapper.getWindow(); win && win.remove();
                $world.setScroll(0,0);
                wrapper.openInWorld(pt(0,0));
                wrapper.setClipMode('visible')
                var odfelement = document.getElementById(id)
                var odfcanvas = new odf.OdfCanvas(odfelement);
                odfcanvas.load(url);
                next.delay(0);
            }, function(next) {
                msgMorph.setMessage('ODF container created\nLoading content...');
                next.delay(0);
            }, function(next) {
                whenNoDOMChangesFor(800, wrapper.renderContext().shapeNode, next, function() {
                    var msg;
                    if (!domChangesStartTime) domChangesStartTime = Date.now();
                    if (Date.now() - domChangesStartTime < 12*1000) {
                        var pagesImported = wrapper.jQuery().find('presentation page').length,
                            elementsImported = wrapper.jQuery().find('*').length;
                        msg = Strings.format('Loading content...\n %s pages, %s elements', pagesImported, elementsImported);
                    } else {
                        msg = 'Rest assured all is still well...';
                    }
                    msgMorph.setMessage(msg);
                });
            },
            function(next) { msgMorph.setMessage('ODF import finished\nExtracting morphs...'); next.delay(); },
            function(next) {
                try {
                    Global.pageMorphs = odfToMorphic(wrapper)
                    // (function() { 
                    //     show('doing morph conversions...');
                    //     pageMorphs.doAndContinue(function(next, pageMorph, i) {
                    //         show(i);
                    //         convertODFTextsToMorphs(pageMorph);
                    //         next.delay(0.1);
                    //     }, function() { alertOK('done'); });
                    // }).delay(0.8);
                    wrapper.remove();
                    next();
                } catch(e) {
                    inspect(wrapper)
                    show(e.stack || e);
                    next();
                }
                
            },
            function(next) { msgMorph.setMessage("Resizing world!"); next.delay(0); },
            function(next) {
                var bottom = pageMorphs.last().bounds().bottom();
                $world.setExtent($world.getExtent().withY(bottom + 200));
                next();
            },
            function(next) { msgMorph.setMessage("Recentering pages!"); next.delay(0); },
            function(next) {
                $world.setScroll(visibleBounds.topLeft().x, visibleBounds.topLeft().y);
                var delta = visibleBounds.center().subPt(pageMorphs[0].bounds().center());
                pageMorphs.invoke('moveBy', delta);
                next();
            },
            function(next) { msgMorph.setMessage("Generating slide sequence."); next.delay(0); },
            function(next) {
                var presController = $world.withAllSubmorphsDetect(function(m) {
                    return m.name && m.name.match(/^PresentationController.*/); })
                if (presController) {
                    presController.targetMorph.removeAll();
                    presController.targetMorph.collectSlides();
                    presController.align(presController.bounds().leftCenter(), pageMorphs[0].bounds().rightCenter().addXY(20, 0))
                }
                next();
            },
            function(next) { msgMorph.setMessage("All done!", Color.green); next.delay(2); },
            function(next) { msgMorph.remove(); next(); }
            ].doAndContinue();
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // the WebODF library does not provide an interface to find out when
        // its finished loading. However, in order to start converting ODF
        // elements into morphs we need this information. To solve this problem we
        // attach a DOM mutation observer to the shapeNode of our odf wrapper
        // morph and listen for changes. When no more changes for a ceratin period
        // were observed we assume loading is done
        function whenNoDOMChangesFor(ms, domNode, thenDo, onProgress) {
            // see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
            var thenDoDebounced = Functions.debounce(ms, function() {
                    Global.clearInterval(progressCaller); observer.disconnect(); thenDo(); }),
                observer = new MutationObserver(function(mutations) { thenDoDebounced() }),
                config = {attributes: true, childList: true, characterData: true, subtree: true};
            observer.observe(domNode, config);
            thenDoDebounced();
            var progressCaller = onProgress && Global.setInterval(function() { onProgress(); }, 1000);
        }

    }

});

(function odfTextFunctions() {
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// text extraction
// mergeStyles([{fill: Color.red, fontFamily: 'Verdana', align: 'center'}, {fill: Color.rgb(0,0,0), fontFamily: 'Arial', align: ''}])
// mergeStyles([{align: 'center'}, {}])
mergeStyles = function(styles) {
    return styles.inject({}, function(merged, style) {
        var objA = merged, objB = style;
        Object.keys(objA).union(Object.keys(objB)).forEach(function(name) {
            var a = objA[name], b = objB[name];
            if (!a) { merged[name] = b; }
            else if (!b) { merged[name] = a; }
            else if (b.isColor) { merged[name] = Color.black.equals(b) ? a : b; }
            else if (typeof b === 'number') { merged[name] = b; }
            else if (typeof b === 'string') { merged[name] = b.length ? b : a; }
            else { merged[name] = b; }
        });
        return merged;
    });
}

var cssAttributes;
lively.whenLoaded(function() { // FIXME include problem with lively.morphic.Graphics
    var string = String;
    var color = Functions.compose(
        function(colorString) { return colorString && colorString.length ? colorString : 'rgba(0,0,0,0)'; },
        Color.parseRGB.bind(Color),
        Color.fromTuple);
    var length = Functions.compose(
        function(lengthString) { return lengthString && lengthString.length ? lengthString : '0px'; },
        Functions.flip(Numbers.parseLength).curry('pt'),
        Math.round)
    cssAttributes = [
        {cssName: "background-color", morphicName: "fill", reader: color, textEmphName: 'backgroundColor'},
        {cssName: "border-width", morphicName: "borderWidth", reader: length},
        {cssName: "border-color", morphicName: "borderColor", reader: color},
        {cssName: "border-radius", morphicName: "borderRadius", reader: length},
        {cssName: "border-style", morphicName: "borderStyle", reader: string},
        {cssName: "color", morphicName: "textColor", reader: color, textEmphName: 'color'},
        {cssName: "font-family", morphicName: "fontFamily", reader: string, textEmphName: "fontFamily"},
        {cssName: "font-size", morphicName: "fontSize", reader: length, textEmphName: 'fontSize'},
        {cssName: "font-style", morphicName: "fontStyle", reader: string, textEmphName: 'italics'},
        {cssName: "font-weight", morphicName: "fontWeight", reader: string, textEmphName: "fontWeight"},
        // {cssName: "line-height", morphicName: "lineHeight", reader: length},
        // {cssName: "padding", morphicName: "padding", reader: length},
        {cssName: "text-align", morphicName: "align", reader: string, textEmphName: 'textAlign'},
        {cssName: "text-decoration", morphicName: "textDecration", reader: string},
        {cssName: "text-shadow", morphicName: "textShadow", reader: string},
        {cssName: "vertical-align", morphicName: "verticalAlign", reader: string},
        {cssName: "white-space", morphicName: "whiteSpaceHandling", reader: string},
        {cssName: "word-break", morphicName: "wordBreak", reader: string}]
});

textSpecFromFrame = function(frameEl) {
    // returns list of textStrings with ranged text emphs
    // [{text: "Five 5 Minute Ideas", emph: [0,19, {fontWeight: "bold"}]}]
    var textParagraphs = $(frameEl).find("text-box>p").toArray();
    return textParagraphs.inject([], function(textAndEmphs, p) {
        var $p = $(p),
            text = $p.text() + '\n';
        if (!text.length) return textAndEmphs;
        var emph = mergeStyles($p.add($p.find("*")).toArray().map(gatherTextStyle)),
            last = textAndEmphs.last(),
            startIdx = last ? last.emph[1] : 0,
            range = [startIdx, startIdx+text.length];
        return textAndEmphs.concat([{text: text, emph: range.concat([emph])}]);
    });
}

morphStyleFromFrame = function(frameEl) {
    var $n = $(frameEl);
    var bounds = lively.Rectangle.fromElement($n[0]),
        style = mergeStyles($n.add($n.find("text-box")).toArray().map(gatherMorphStyle));
    style.position = bounds.topLeft();
    style.extent = bounds.extent();
    return style;
}

gatherTextStyle = function(el) {
    // applies cssAttributes to computed style of el and gets textEmphName/morphicName readings
    var style = getComputedStyle(el);
    return cssAttributes.inject({}, function(textStyle, val) {
        textStyle[val.textEmphName || val.morphicName] = val.reader(style[val.cssName]);
        return textStyle; });
}

gatherMorphStyle = function gatherMorphStyle(el) {
    // applies cssAttributes to computed style of el and gets morphicName readings
    // produces a spec Object for Morph>>applyStyle
    // with alias it can also be used as text emphasis
    var style = getComputedStyle(el);
    return cssAttributes.inject({}, function(morphStyle, val) {
        morphStyle[val.morphicName] = val.reader(style[val.cssName]);
        return morphStyle; });
}

textMorphWithStyles = function(morphStyle, textRanges) {
    var textString = textRanges.pluck('text').join(''),
        emphs = textRanges.pluck('emph'),
        t = new lively.morphic.Text(morphStyle.extent.extentAsRectangle(), textString);
    t.applyStyle(morphStyle);
    t.emphasizeRanges(emphs);
    // t.emphasizeRanges.bind(t, emphs).delay(1);
    // FIXME hacks...
    t.setWhiteSpaceHandling('pre-wrap')
    var isCentered = emphs.pluck(2).compact().pluck('textAlign').compact().reMatches(/^center$/).compact().length > 0;
    if (isCentered) t.setAlign('center');
    return t;
}

convertODFTextsToMorphs = function convertODFTextsToMorphs(pageMorph) {
    var textMask = pageMorph.submorphs.map(function(morph) {
            return morph.jQuery().text().length > 0; }),
        morphs = pageMorph.submorphs.mask(textMask),
        $frames = morphs.invoke("jQuery").invoke("find", 'frame');

    return pageMorph.texts = $frames.map(function($frame) {
        if (!$frame[0]) return null;
        var text = textMorphWithStyles(
            morphStyleFromFrame($frame),
            textSpecFromFrame($frame));
        // for debugging it is sometimes useful to leave the original elements around
        if (text) $frame.remove();
        return pageMorph.addMorph(text);
    }).compact();
}
})();

(function odfPageFunctions() {

// odf rendering --> Morphs data pipeline:
Global.renderStateForOdfPage = function renderStateForOdfPage(pageEl) {
    // for each odf page element we extract the position, extent, and
    // elements that are rendered on that page
    return {
        node: pageEl,//.cloneNode(false/*don'copy children*/),
        elements: Array.from(pageEl.childNodes).inject([], function(renderStates, node) {
            if (node.prefix !== 'draw') return renderStates;
            var $bounds = $(node).bounds(),
                bounds = lively.rect(pt($bounds.left, $bounds.top), pt($bounds.right, $bounds.bottom)),
                state = {
                    node: node.cloneNode(true),
                    position: bounds.topLeft(),
                    extent: bounds.extent()};
            return renderStates.concat([state]);
        })
    }
}

Global.morphWrapperForOdfPageElement = function morphWrapperForOdfPageElement(renderState) {
    // this creates a morph for an element that appears on a rendered
    // odf page, like a text or a drawing
    var wrapper = new lively.morphic.HtmlWrapperMorph(pt(0,0));
    wrapper.applyStyle({fill: Color.white, position: renderState.position});
    wrapper.shape.odfRenderState = renderState;
    (function getExtentHTML(ctx) { return this.odfRenderState.extent; }).asScriptOf(wrapper.shape);
    $(Strings.format('<div style="position: absolute; top: -%spx; left: -%spx" />',
         renderState.position.y, renderState.position.x))
        .appendTo(wrapper.renderContext().shapeNode)
        .append(renderState.node);
    return wrapper;     
}

Global.morphForOdfRendering = function morphForOdfRendering(odfRenderState) {
    // This creates a morph container for an odf page
    var pageMorph = new lively.Presentation.PageMorph(lively.Rectangle.fromElement(odfRenderState.node));
    odfRenderState.elements
        .map(morphWrapperForOdfPageElement)
        .forEach(function(morph) { pageMorph.addMorph(morph); })
    return pageMorph;
}

function movePageToOriginWhileGenerating(wrapper, page, doFunc) {
    var $page = $(page),
        origPos = wrapper.getPosition(),
        pagePos = pt($page.bounds().left, $page.bounds().top),
        result;
    wrapper.moveBy(pagePos.negated());
    try { result = doFunc.call(this, pagePos); } finally {
        wrapper.setPosition(origPos); }
    return result;
}

// odfToMorphic(that)
Global.odfToMorphic = function odfToMorphic(htmlMorph, from, to) {
    // starting from a HtmlWrapperMorph that has odf content loaded
    // using the WebODF library this function axtracts the rendered pages
    // and will create a morph container (as copy) for each page
    $world.beClip(false);
    var scroll = $world.getScroll();
    $world.setScroll(0, 0);
    var pages = htmlMorph.jQuery().find('presentation page').toArray();
    if (from || to) pages = pages.slice(from, to);
    var pageMorphs = pages.map(function(pageEl,i) {
        return movePageToOriginWhileGenerating(htmlMorph, pageEl, function(pagePos) {
            var morph = morphForOdfRendering(renderStateForOdfPage(pageEl));
            morph.name = String(i);
            morph.openInWorld();
            convertODFTextsToMorphs(morph);
            morph.setPosition(pagePos);
            return morph; });
    });
    $world.setScroll(scroll[0], scroll[1]);
    return pageMorphs;
}

// that.getWindow().openInWorld()
// presEl = that.jQuery().find('presentation').toArray()[0];
// pageEl = Array.from(presEl.childNodes)[0]
// m=morphForOdfRendering(renderStateForOdfPage(pageEl));
// m.openInWorld()
// m.showHalos()
// show(m.bounds())
// m.shape.getExtent()
// m.remove()
// that.owner.remove()
// pageMorphs = odfToMorphic(that)
// pageMorphs.forEach(function(ea) { $world.addMorph(ea); });
// Global.pageMorphs.invoke('remove')
// $world.beClip(false)
})();


}) // end of module