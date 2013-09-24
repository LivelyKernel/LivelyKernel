module('lively.data.ODFImport').requires('lively.data.FileUpload', 'lively.data.ODFFormulaParser').toRun(function() {

Object.extend(lively.data.ODFFormulaParser, {
    parse: function(expr) {
        return OMetaSupport.matchAllWithGrammar(ODFFormulaParser, 'start', expr);
    },
    parsePath: function(expr) {
        return OMetaSupport.matchAllWithGrammar(ODFFormulaParser, 'path', expr);
    }
});

Object.subclass("lively.data.ODFImport.FormulaInterpreter",
// 'From Squeak4.2 of 2 February 2012 [latest update: #990] on 23 September 2013 at 3:25:41 pm'!
// Object subclass: #ODFFormulaInterpreter
// 	instanceVariableNames: 'modifiers functions viewBox stretchpoint style'
//
// It evaluates an expression built by ODFFormulaParser
//
// Structure:
//  modifiers	Array -- a list of numbers in draw:modifires
//  functions	IdentityDictionary -- a list of function expressions
//  viewBox		Rectangle -- from draw:viewBox
//  style		ODFStyle -- from draw:style
//
// Bug: logwidth and logheight are not defined correctly.!
'accessing', {
//     nsResolver: function(prefix) {
// // i = new lively.data.ODFImport.FormulaInterpreter()
// //         this.query('draw:enhanced-geometry')
// // i.query(xml, 'enhanced-geometry')
// // xml.querySelector('draw:enhanced-geometry', i.nsResolver)
// // xml.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:drawing:1.0', 'enhanced-geometry')
// // xml.tagName
// // Exporter.stringify(xml)
//         var ns = {
//             'xhtml' : 'http://www.w3.org/1999/xhtml',
//             'mathml': 'http://www.w3.org/1998/Math/MathML',
//             'draw'  : 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',
//             'svg'   : 'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0'
//         }
//         return ns[prefix] || null;
//     },
    // query: function(xml, sel) { return xml.querySelector(sel, this.nsResolver); },
    getViewBox: function(state) {
        var coords = state.enhancedGeometryXML.getAttribute('svg:viewBox').split(' ').map(Number);
        return lively.rect.apply(null, coords);
    },
    bottom: function(state) { return this.getViewBox(state).bottom(); },
    
    hasFill: function(state) {
    	var attr = style.getAttribute("draw:fill");
    	return attr && attr != 'none' ? 1 : 0;
    },
    
    hasstroke: function(state) {
    	var attr = style.getAttribute("draw:stroke");
    	return attr && attr != 'none' ? 1 : 0;
    },
    
    height: function(state) { return this.getViewBox(state).height; },
    
    left: function(state) { return this.getViewBox(state).left(); },
    
    logheight: function(state) { return this.getViewBox(state).height * 100; },
    
    logwidth: function(state) { return this.getViewBox(state).width * 100; },
    
    pi: function(state) { return Math.PI },
    
    right: function(state) { return this.getViewBox(state).right(); },
    
    top: function(state) { return this.getViewBox(state).top(); },
    
    width: function(state) { return this.getViewBox(state).width; },
    
    xstretch: function(state) { return stretchpoint.x; },
    
    ystretch: function(state) { return stretchpoint.y; }

},
'evaluation', {
    eval: function(interpreterState, expr) {
        if (Object.isNumber(expr)) return expr;
        if (Object.isString(expr) && Object.isFunction(this[expr])) return this[expr](interpreterState);
        var xml = interpreterState.enhancedGeometryXML;
        if (expr[0] === 'function') {
            var fName = expr[1],
                equation = xml.querySelector(Strings.format('*|equation[*|name="%s"]', fName)),
                formula = equation.getAttribute('draw:formula');
            return this.eval(interpreterState, lively.data.ODFFormulaParser.parse(formula));
        }
        if (expr[0] === 'modifier') {
            var modifiers = xml.getAttribute('draw:modifiers').split(' '),
                idx = Number(expr[1]);
            return Number(modifiers[idx]);
        }
        var args = expr.slice(1).map(this.eval.bind(this, interpreterState));
    	switch (expr[0]) {
            case 'negated': return -1 * args[0];
            case '+': return args[0] + args[1];
            case '-': return args[0] - args[1];
            case '*': return args[0] * args[1];
            case '/': return (args[0] / args[1]);
            case 'abs': return Math.abs(args[0])
            case 'sqrt': return Math.sqrt(args[0]);
            case 'sin': return Math.sin(args[0]);
            case 'cos': return Math.cos(args[0]);
            case 'tan': return Math.tan(args[0]);
            case 'atan': return Math.aTan(args[0]);
            case 'atan2': return Math.atan2(args[0], args[1]);
            case 'min': return Math.min(args[0],args[1]);
            case 'max': return Math.max(args[0],args[1]);
            case 'if': return args[0] > 0 ? args[1] : args[2];
    	    default: throw new Error(expr[0] + ' not supported by ' + this);
    	}
    },
    evalPath: function(interpreterState, pathString) {
        var elements = lively.data.ODFFormulaParser.parsePath(pathString);
        return elements.map(function(el) {
            return Object.isString(el) ? el : this.eval(interpreterState, el) + ' ';
        }, this).join('');
    }
});

Object.subclass("lively.data.ODFImport.ODFReader",
"builds", {
    assignStepsToSlides: function(buildSteps, slides, thenDo) {
        require('lively.presentation.Builds').toRun(function() {
            try {
                slides.zip(buildSteps).forEach(function(slideAndSteps) {
                    var slide = slideAndSteps[0], steps = slideAndSteps[1];
                    Trait('lively.presentation.Builds.BuildStepTrait').applyTo(slide);
                    slide.setBuildSteps(steps);
                    thenDo(null);
                });
            } catch (e) { thenDo(e) }
        });
    },
    stepsFromWrapper: function(wrapper) {
        var pages = wrapper.jQuery().find('presentation page').toArray();
        return pages.map(this.stepsFromPage.bind(this));
    },
    stepsFromPage: function(page) {
        // an instruction node (anim:par node) looks like this:
        // <anim:par begin="0s" fill="hold" node-type="on-click"
        // preset-class="entrance" preset-id="ooo-entrance-appear">
        //   <anim:set begin="0s" dur="0.001s" fill="hold"
        //   targetElement="id5" attributeName="visibility"
        //   to="visible"></anim:set>
        // </anim:par>
        // for the full spec see http://www.w3.org/TR/SMIL3/smil-timing.html
        var stepNodes = Array.from(page.querySelectorAll('par[*|node-type][*|begin]'));
        return stepNodes.map(function(node) {
            var setNode = node.querySelector('set');
            if (!setNode) return null;
            setNode.getAttribute('smil:targetElement')
            setNode.getAttribute('smil:attributeName')
            setNode.getAttribute('smil:to')
            return {
                when: node.getAttribute('presentation:node-type'),
                target: setNode.getAttribute('smil:targetElement'),
                attributeName: setNode.getAttribute('smil:attributeName'),
                attributeValue: setNode.getAttribute('smil:to')
            }
        }).compact();
    }
});

Object.extend(lively.data.ODFImport.ODFReader, {
    create: function() { return new this(); }
});

lively.data.FileUpload.Handler.subclass('lively.Clipboard.ODFUploader', {

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
        var odfReader = lively.data.ODFImport.ODFReader.create();
        require('lively.Presentation')
        .requiresLib({
            url: "http://webodf.org/demo/demobrowser/webodf.js",
            loadTest: function() { return typeof odf !== "undefined"; }})
        .toRun(function() {
            // 1) load ODF using WebODF into a wrapper morph
            [createStatusMessage,
             openHTMLWrapperAndStartLoadingODF,
             stautsMessageLoadingODF,
             startToWaitForODFLoadEnd,
            //  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
             statusMessageStartExtractingMorphs,
             extractMorphsFromODF,
             statusMessageResizeWorld,
             resizeWorld,
             statusMessageRecenterSlide,
             recenterSlides,
             statusMessageSetupBuilds,
             setupBuilds,
             statusMessageRemoveODFWrapper,
             removeODFWrapper,
             statusMessageSetupPresentationController,
             setupPresentationController,
             statusMessageDone,
             removeStatusMessage
            ].doAndContinue();
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            var msgMorph, wrapper, domChangesStartTime, visibleBounds = $world.visibleBounds();
            function createStatusMessage(next) {
                msgMorph = $world.createStatusMessage("Loading ODF document\nplease wait...", {openAt: 'center'});
                next.delay(0);
            }
            function openHTMLWrapperAndStartLoadingODF(next) {
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
            }
            function stautsMessageLoadingODF(next) {
                msgMorph.setMessage('ODF container created\nLoading content...');
                next.delay(0);
            }
            function startToWaitForODFLoadEnd(next) {
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
            }
            function statusMessageStartExtractingMorphs(next) {
                msgMorph.setMessage('ODF import finished\nExtracting morphs...');
                next.delay();
            }
            function extractMorphsFromODF(next) {
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
                    next();
                } catch(e) {
                    inspect(wrapper)
                    show(e.stack || e);
                    next();
                }

            }
            function statusMessageResizeWorld(next) { msgMorph.setMessage("Resizing world!"); next.delay(0); }
            function resizeWorld(next) {
                var bottom = pageMorphs.last().bounds().bottom();
                $world.setExtent($world.getExtent().withY(bottom + 200));
                next();
            }
            function statusMessageRecenterSlide(next) { msgMorph.setMessage("Recentering pages!"); next.delay(0); }
            function recenterSlides(next) {
                $world.setScroll(visibleBounds.topLeft().x, visibleBounds.topLeft().y);
                var delta = visibleBounds.center().subPt(pageMorphs[0].bounds().center());
                pageMorphs.invoke('moveBy', delta);
                next();
            }
            function statusMessageSetupBuilds(next) {
                msgMorph.setMessage("Build setup.");
                next.delay(0);
            }
            function setupBuilds(next) {
                var buildSteps = odfReader.stepsFromWrapper(wrapper);
                odfReader.assignStepsToSlides(buildSteps, pageMorphs, function(err) {
                    err && show('Error assigning buildSteps to slides: ' + err);
                    next();
                });
            }
            function statusMessageRemoveODFWrapper(next) {
                msgMorph.setMessage("Removing WebODF document wrapper.");
                next.delay(0);
            }
            function removeODFWrapper(next) {
                wrapper.align(wrapper.bounds().topLeft(), pageMorphs[0].bounds().topRight());
                // wrapper.remove();
                next(); }
            function statusMessageSetupPresentationController(next) {
                msgMorph.setMessage("Generating slide sequence.");
                next.delay(0);
            }
            function setupPresentationController(next) {
                var presController = $world.withAllSubmorphsDetect(function(m) {
                    return m.name && m.name.match(/^PresentationController.*/); })
                if (presController) {
                    presController.targetMorph.removeAll();
                    presController.targetMorph.collectSlides();
                    presController.align(presController.bounds().leftCenter(), pageMorphs[0].bounds().rightCenter().addXY(20, 0))
                }
                next();
            }
            function statusMessageDone(next) {
                msgMorph.setMessage("All done!", Color.green);
                next.delay(2);
            }
            function removeStatusMessage(next) { msgMorph.remove(); next(); }

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

    return pageMorph.texts = $frames.map(function($frame, i) {
        if (!$frame[0]) return null;
        var text = textMorphWithStyles(
            morphStyleFromFrame($frame),
            textSpecFromFrame($frame));
        // for debugging it is sometimes useful to leave the original elements around
        if (!text) return;
        morphs[i].remove();
        text.name = morphs[i].name;
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
                    extent: bounds.extent(),
                    id: node.attributes && node.attributes['xml:id'] && node.attributes['xml:id'].value};
            return renderStates.concat([state]);
        })
    }
}

Global.morphWrapperForOdfPageElement = function morphWrapperForOdfPageElement(renderState) {
    // this creates a morph for an element that appears on a rendered
    // odf page, like a text or a drawing
    var wrapper = new lively.morphic.HtmlWrapperMorph(pt(0,0));
    wrapper.name = wrapper.odfId = renderState.id;
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
            var odfPageData = renderStateForOdfPage(pageEl),
                morph = morphForOdfRendering(odfPageData);
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