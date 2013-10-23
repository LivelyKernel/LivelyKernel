module('apps.Graphviz').requires().toRun(function() {

lively.BuildSpec('lively.morphic.SVGViewer', {
    _BorderColor: Color.rgb(204,0,0),
    _BorderWidth: 0,
    _Extent: lively.pt(716.0,455.0),
    cameForward: false,
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    layout: { adjustForNewBounds: true },
    name: "SVGViewer",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _ClipMode: "hidden",
        _Extent: lively.pt(710.0,430.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {adjustForNewBounds: true,resizeHeight: true,resizeWidth: true},
        name: "SVGViewer",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(192,192,192),
            _BorderRadius: 6,
            _BorderWidth: 1,
            _Extent: lively.pt(155.0,26.0),
            _Fill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(204,204,204),
            offset: 0
          },{
            color: Color.rgb(240,240,240),
            offset: 0.4
          },{
            color: Color.rgb(245,245,245),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            _Position: lively.pt(12.0,8.0),
            className: "lively.morphic.Slider",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            max: 2,
            min: 0.1,
            name: "Slider",
            sliderExtent: 0.1,
            sliderKnob: {isMorphRef: true,path: "submorphs.0"},
            sourceModule: "lively.morphic.Widgets",
            styleClass: ["slider_background_horizontal"],
            submorphs: [{
                _BorderColor: Color.rgb(102,102,102),
                _BorderRadius: 6,
                _BorderWidth: 1,
                _Extent: lively.pt(15.5,26.0),
                _Fill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(196,211,221),
                offset: 0
              },{
                color: Color.rgb(137,167,187),
                offset: 0.5
              },{
                color: Color.rgb(96,130,153),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                _Position: lively.pt(15.4,0.0),
                className: "lively.morphic.SliderKnob",
                doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                draggingEnabled: true,
                droppingEnabled: true,
                hitPoint: lively.pt(43.0,5.0),
                slider: {isMorphRef: true,name: "Slider"},
                sourceModule: "lively.morphic.Widgets",
                styleClass: ["slider_horizontal"]
            }],
            value: 1,
            valueScale: 1,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
            lively.bindings.connect(this, "value", this.get("SVGViewer"), "doZoomBy", {
                updater: function ($upd, newV, oldV) {
                    $upd(1+(newV-oldV), this.targetObj.get('clip').innerBounds().center());;
                }});
        }
        },{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _ClipMode: "scroll",
            _Extent: lively.pt(710.0,390.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(0.0,40.0),
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {resizeHeight: true,resizeWidth: true},
            name: "clip",
            submorphs: [{
                _BorderColor: Color.rgb(204,0,0),
                _ClipMode: "hidden",
                _Extent: lively.pt(44523.0,4259.0),
                _Fill: Color.rgb(200,200,200),
                className: "lively.morphic.HtmlWrapperMorph",
                doNotSerialize: ["rootElement"],
                droppingEnabled: true,
                layout: {resizeHeight: true,resizeWidth: true},
                name: "svgMorph",
                sourceModule: "lively.morphic.AdditionalMorphs"
            }]
        }],
        doZoomBy: function doZoomBy(scaleDelta, zoomPoint) {
        var oldScale = this.getSVGScale();

        var minScale = 0.1, maxScale = 2;
        if (oldScale <= minScale && scaleDelta < 1) return false;
        if (oldScale >= maxScale && scaleDelta > 1) return false;

        var newScale = oldScale * scaleDelta;
        newScale = Math.max(Math.min(newScale, maxScale), minScale);
        if (newScale !== oldScale) {
            this.setSVGScale(newScale);
            var scroll = this.get('clip').getScroll(),
                scrollP = pt(scroll[0], scroll[1]).scaleBy(scaleDelta),
                scaledP = zoomPoint.scaleBy(1/scaleDelta),
                translatedP = zoomPoint.subPt(scaledP).scaleBy(this.getSVGScale());
            this.get('clip').setScroll(translatedP.x + scrollP.x,translatedP.y + scrollP.y);
        }
    },
        getSVGScale: function getSVGScale() {
        // this.getSVGScale();
        var m = this.get("svgMorph"),
            match = m.renderContext().shapeNode.style.webkitTransform.match(/scale\(([^\)]+)\)/);
        return (match && Number(match[1])) || 1
    },
        onMouseWheel: function onMouseWheel(evt) {
        if (!evt.isAltDown()) return $super(evt);
        var zoomPos = this.localize(evt.getPosition()).scaleBy(1/this.getSVGScale());
        var scaleDelta = 1 + (evt.wheelDelta / 2800);
        this.doZoomBy(scaleDelta, zoomPos, true);
        evt.stop(); return true;
    },
        renderSVG: function renderSVG(svgString) {
        // this.renderSVG()
        // this.bringToFront()
        this.setSVGScale(1);
        // this.get('svgMorph')._renderContext = null
        // this.get('clip').addMorph(this.get('svgMorph'))
        // this._renderContext = null
        var el = this.get('svgMorph').renderContext().shapeNode;
        while (el.childNodes.length) el.removeChild(el.childNodes[0]);
        el.appendChild(new DOMParser().parseFromString(svgString, "text/xml").documentElement);
        // Exporter.stringify(el.childNodes[0])
        var m = this.get('svgMorph');
        m.addScript(function onOwnerChanged(owner) {
            // scale to fit the svg drawing
            $super(owner);
            if (!owner || !owner.world()) return;
            var el = this.renderContext().shapeNode.childNodes[0],
                bnds = el.getBoundingClientRect(),
                scale = this.get('SVGViewer').getSVGScale();
            this.applyStyle({clipMode: 'hidden', extent: pt(bnds.width/scale, bnds.height/scale)});
        });
    },
        reset: function reset() {
        var slider = this.get('Slider');
        lively.bindings.connect(slider, 'value', this, 'doZoomBy', {
            updater: function($upd, newV, oldV) {
                $upd(1+(newV-oldV), this.targetObj.get('clip').bounds().center());;
            },
        });
        slider.valueScale = 1;
        slider.min = 0.1
        slider.max = 2;
    },
        setSVGScale: function setSVGScale(val) {
        var m = this.get("svgMorph")
        var clip = this.get('clip');
        var slider = this.get('Slider');
        lively.bindings.noUpdate({
            sourceObj: slider,sourceAttribute: 'value',
            targetObj: this,targetAttribute: 'doZoomBy'},
            function() { slider.setValue(val); });
        m.renderContext().shapeNode.style.webkitTransform = 'scale(' + val + ')';
        m.renderContext().shapeNode.style.webkitTransformOrigin = '0 0';
    }
    }],
    titleBar: "SVGViewer"
});

apps.Graphviz.Renderer = {
// documentation
    example: function() {
        apps.Graphviz.Renderer.render({
            asWindow: true,
            createNodesAndEdges: function() {
                return ['a;', 'b;', 'c;', 'a -> b;', 'a -> c;', 'b -> c'];
            }
        }).openInWorldCenter();
    },

// rendering
    vizAttributes: function(attributes) {
        return attributes ? '[' + Properties.forEachOwn(attributes, function(key, val) {
            return [key, '=', Strings.print(val)].join('');
        }).join(', ') + ']' : '';
    },

    vizNode: function(name, attr) {
        return Strings.format('"%s" %s;', name, this.vizAttributes(attr));
    },

    vizSubgraph: function(subgraphName, scope, attr) {
        // scope == "node" || "edge" || "graph"
        return {subgraph: subgraphName, attr: scope + ' ' + this.vizAttributes(attr) + ';'};
    },

    vizSubgraphNode: function(subgraphName, name, attr) {
        return {subgraph: subgraphName, node: this.vizNode(name, attr)}
    },

    vizEdge: function(from, to, attr) {
        return Strings.format('"%s" -> "%s" %s;', from, to, this.vizAttributes(attr));
    },

// graph creation

    ranking: function() {
        // return an array of something like {rank=same; id1 id2 id3;}
        return [];
    },

    vizNodesAndEdges: function() {
        throw new Error('Function for producing nodes and edges required!');
    },

    graphSettings: function() {
        return [
            // "graph [ranksep=30];",
            // "layout=sfdp;",
            // "size=67;",
            // "K=10;",
            // "ranksep=30;",
            "overlap=prism;",
            // "concentrate=true;",
            // "ranksep=1.75;",
            // "overlap=scale;",
            // "edge [style=solid,color=gray];"
            // "splines=true;"
            // "splines=polyline"
            // "splines=ortho;"
        ]
    },

    transformSVG: function(augmentor, url) {
        if (!augmentor) return;
        var svg = new WebResource(url).get().content;
        augmentor(svg);
        new WebResource(url).put(svg);
    },

    updateAll: function(options) {
        // create a file like "users.robert.detecting-module-cycles.html.svg"
        var basename = URL.source.pathname.replace(/^\//, '').replace(/\//g, '.'),
            dotName = basename + '.dot',
            graph = this.makeGraph(options),
            dotURL = URL.root.withFilename(dotName),
            svgURL = this.changeExt(dotURL, '.svg');
        this.writeGraph(dotURL, graph);
        this.renderGraph(dotName);
        this.transformSVG(options.augmentSVG, svgURL);
        if (options.asMorph || options.asWindow) {
            var svg;
            this.transformSVG(function(svgString) { svg = svgString; }, svgURL);
            if (options.asWindow) return this.asWindow(svg);
            else return this.asMorph(svg);
        } else {
            return String(svgURL);
        }
    },

    makeGraph: function(options) {
        var sanitizedNodesAndEdges = options.createNodesAndEdges().groupBy(function(nodeOrEdge) {
            if (typeof nodeOrEdge === 'string') return 'sanitized';
            if (nodeOrEdge.subgraph) return 'subgraph:' + nodeOrEdge.subgraph;
            return 'ignore';
        }).reduceGroups(function(lines, key, group) {
            if (key === 'sanitized') return lines.concat(group);
            var splitted = key.split(':'), tag = splitted[0], grName = splitted[1];
            if (tag === 'subgraph') {
                var nodes = group.map(function(ea) { return ea.node || ea.attr; });
                var result = Strings.format("subgraph %s {\n%s\n}", grName, nodes.join('\n'));
                return lines.concat([result]);
            }
            return lines;
        }, []);
        return Strings.format("digraph G {\n%s\n%s\n%s\n}",
            options.createGraphSettings().join('\n'),
            options.createRanking().join('\n'),
            sanitizedNodesAndEdges.join('\n'));
    },

    render: function(options) {
        // options: {asMorph: BOOL, createNodesAndEdges, createGraphSettings, createRanking, augmentSVG}
        options = options || {};
        options.createNodesAndEdges = options.createNodesAndEdges || this.vizNodesAndEdges.bind(this);
        options.createGraphSettings = options.createGraphSettings || this.graphSettings.bind(this);
        options.createRanking = options.createRanking || this.ranking.bind(this);
        options.augmentSVG = options.augmentSVG;
        return this.updateAll(options);
    },

// helper
    changeExt: function(string, newExt) {
        return String(string).replace(/(\.dot|\.gv|\.gviz)$/, newExt);
    },

// graphviz service
    writeGraph: function(url, content) {
        new WebResource(url).put(content);
    },

    renderGraph: function(name) {
        var cmd = lively.shell.execSync(Strings.format('dot %s -Tsvg -o %s',
            name, this.changeExt(name, '.svg'))),
            outString = cmd.resultString(true).trim();
        outString.length && show(outString);
    },

// make morphs
    asMorph: function(svgString) {
        var svgDoc = new DOMParser().parseFromString(svgString, "text/xml").documentElement;
        var m = new lively.morphic.HtmlWrapperMorph(pt(100,100));
        m.appendChild(document.importNode(svgDoc));
        function fit() {
            var bnds = m.renderContext().shapeNode.childNodes[0].getBoundingClientRect();
            m.applyStyle({clipMode: 'hidden', extent: pt(bnds.width, bnds.height)});
        }
        lively.bindings.connect(m, 'owner', fit, 'call', {
            updater: function($upd, owner) { owner && owner.world() && $upd.delay(0); },
            removeAfterUpdate: true});
        return m;
    },
    asWindow: function(svgString) {
var window = lively.BuildSpec('lively.morphic.SVGViewer').createMorph();
window.targetMorph.renderSVG(svgString);
return window;
    },
}

}); // end of module