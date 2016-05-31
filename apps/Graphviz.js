module('apps.Graphviz').requires().toRun(function() {

(function fixChrome_getTransformToElement_removal() {
  // for more info see
  // https://lists.w3.org/Archives/Public/www-svg/2015Aug/att-0009/SVGWG-F2F-minutes-20150824.html#item02
  // https://github.com/huei90/snap.svg.zpd/issues/57
  // delete SVGElement.prototype.getTransformToElement
  SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(elem) {
      // return elem.getScreenCTM().inverse().multiply(this.getScreenCTM());
      return elem.getCTM().inverse().multiply(this.getCTM());
  };
})();

lively.BuildSpec('lively.morphic.SVGViewer', {
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
                  var clip = this.targetObj.get('clip');
                  var zoomPos = clip.worldPoint(clip.getScrollBounds().center());
                  $upd(1+(newV-oldV), zoomPos);
              }});
        }
    },

    {
      _BorderColor: Color.rgb(189,190,192),
      _BorderRadius: 5,
      _BorderWidth: 1,
      _Extent: lively.pt(100.0,20.0),
      _Position: lively.pt(175.0,8.0),
      _StyleClassNames: ["Morph", "Button"],
      className: "lively.morphic.Button",
      droppingEnabled: false,
      grabbingEnabled: false,
      isPressed: true,
      label: "as morph",
      name: "convertSVGToMorphicButton",
      sourceModule: "lively.morphic.Widgets",
      connectionRebuilder: function connectionRebuilder() {
          lively.bindings.connect(this, "fire", this, "doAction", {});
      },
      doAction: function doAction() {
        var viewer = this.get("SVGViewer").convertSVGToMorphic();
      }
  },

  {
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
        // zoomPoint is global
        var oldScale = this.getSVGScale();

        var minScale = 0.1, maxScale = 2;
        if (oldScale <= minScale && scaleDelta < 1) return false;
        if (oldScale >= maxScale && scaleDelta > 1) return false;

        var newScale = lively.lang.num.roundTo(oldScale * scaleDelta, 0.01);
        if (newScale !== oldScale) {
            var clip = this.get('clip');
            var canvas = clip.submorphs[0];
            var scrollPos = clip.getScrollBounds().topLeft();
            var oldPos = canvas.localize(zoomPoint);

            this.setSVGScale(newScale);

            var newPos = canvas.localize(zoomPoint)
            var newScrollPos = scrollPos.addPt(oldPos.subPt(newPos).scaleBy(this.getSVGScale()));
            clip.setScroll(newScrollPos.x, newScrollPos.y);
        }

    },

    getSVGScale: function getSVGScale() {
    // this.getSVGScale();
    var m = this.get("clip").submorphs[0];
    var svgNode = m.renderContext().shapeNode.querySelector("svg");
    if (svgNode) {
      return this.getTransform().preConcatenate(new lively.morphic.Similitude(svgNode.getCTM()).inverse()).getScale()
    }
    return m.getScale();
    // var m = this.get("svgMorph"),
    //     match = m.renderContext().shapeNode.style.webkitTransform.match(/scale\(([^\)]+)\)/);
    // return (match && Number(match[1])) || 1
},
    onMouseWheel: function onMouseWheel(evt) {
        if (!evt.isAltDown()) return $super(evt);
        var scaleDelta = 1 + (evt.wheelDelta / 2800);
        this.doZoomBy(scaleDelta, evt.getPosition(), true);
        evt.stop(); return true;
    },

    renderSVG: function renderSVG(svgString) {
        // this.renderSVG()
        // this.bringToFront()
        this.setSVGScale(1);
        // this.get('svgMorph')._renderContext = null
        // this.get('clip').addMorph(this.get('svgMorph'))
        // this._renderContext = null
        if (!this.get('svgMorph')) {
          // $world.inform("Found no svgMorph!\nMaybe it is already replaced with the graphvis morphic canvas? ")
          // return;
          this.get("GraphvizMorphicCanvas") && this.get("GraphvizMorphicCanvas").remove();
          this.get("clip").addMorph(lively.BuildSpec({
              name: "svgMorph",
              _ClipMode: "hidden",
              _Extent: this.get("clip").getExtent(),
              _Fill: null,
              className: "lively.morphic.HtmlWrapperMorph",
              doNotSerialize: ["rootElement"],
              droppingEnabled: true,
              layout: {resizeHeight: true,resizeWidth: true},
          }).createMorph());
        }
        var el = this.get('svgMorph').renderContext().shapeNode;
        while (el.childNodes.length) el.removeChild(el.childNodes[0]);
        el.appendChild(new DOMParser().parseFromString(svgString, "text/xml").documentElement);
        // Exporter.stringify(el.childNodes[0])
    
        var m = this.get('svgMorph');
        m.addScript(function scaleToFitSVG() {
            var el = this.renderContext().shapeNode.childNodes[0],
                bnds = el.getBoundingClientRect(),
                scale = this.get('SVGViewer').getSVGScale();
            this.applyStyle({clipMode: 'hidden', extent: pt(bnds.width/scale, bnds.height/scale)});
        });
        m.addScript(function onOwnerChanged(owner) {
            $super(owner);
            if (!owner || !owner.world()) return;
            this.scaleToFitSVG();
        });
        m.scaleToFitSVG();
    },

    reset: function reset() {
        var slider = this.get('Slider');
        lively.bindings.connect(slider, 'value', this, 'doZoomBy', {
            updater: function($upd, newV, oldV) {
                var clip = this.targetObj.get('clip');
                var zoomPos = clip.worldPoint(clip.getScrollBounds().center());
                $upd(1+(newV-oldV), zoomPos);
            },
        });
        slider.valueScale = 1;
        slider.min = 0.1
        slider.max = 2;
    },

    setSVGScale: function setSVGScale(val) {
        var clip = this.get('clip');
        var m = clip.submorphs[0];
        var slider = this.get('Slider');
        m.setScale(val);
        lively.bindings.noUpdate({
            sourceObj: slider, sourceAttribute: 'value',
            targetObj: this, targetAttribute: 'doZoomBy'},
            function() { slider.setValue(val); });
        // m.renderContext().shapeNode.style.webkitTransform = 'scale(' + val + ')';
        // m.renderContext().shapeNode.style.webkitTransformOrigin = '0 0';
    },

    convertSVGToMorphic: function convertSVGToMorphic() {
        var svgMorph = this.get("svgMorph"),
            svgNode = svgMorph.renderContext().shapeNode.getElementsByTagName("svg")[0],
            outerScale = this.getSVGScale(),
            innerScale = new lively.morphic.Similitude(svgNode.getCTM()).getScale(),
            morphicGraph = Global.apps.Graphviz.Renderer.convertGraphvizSVGToMorphs(svgNode),
            owner = svgMorph.owner;
        svgMorph.remove();
        owner.addMorph(morphicGraph);
        morphicGraph.setScale(innerScale*outerScale);
        var btn = this.getMorphNamed("convertSVGToMorphicButton");
        btn && btn.remove();
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.BuildSpec("apps.Graphviz.GraphvizMorphicCanvas", {
    _Extent: lively.pt(1924.1,832.6),
    _Fill: Color.rgb(255,255,255),
    className: "lively.morphic.Box",
    draggingEnabled: false,
    droppingEnabled: true,
    grabbingEnabled: false,
    name: "GraphvizMorphicCanvas",
    sourceModule: "lively.morphic.Core",

    edges: function edges() {
      return this.submorphs.filterByKey("isEdge");
    },

    highlightEdgesAndNodes: function highlightEdgesAndNodes(pos) {
      var m = this.morphsContainingPoint(pos).without(this).last();
      var edges = this.edges();
      var nodes = this.nodes();
      edges.concat(nodes).without(m).invoke("setHighlight", false);

      if (!m) return;

      var selectedEdges = [];

      if (m.isEdge) { selectedEdges = [m]; }
      else if (m.isNode) {
        selectedEdges = edges.filter(function(ea) { return ea.from === m; });
      }

      selectedEdges.forEach(function(edge) {
        edge.setHighlight(true);
        edge.from.setHighlight(true);
        edge.to.setHighlight(true);
      });

    },

    nodes: function nodes() {
      return this.submorphs.filterByKey("isNode");
    },

    setNodesAndEdgeMorphs: function setNodesAndEdgeMorphs(morphs) {
      this.removeAllMorphs();
      morphs.forEach(function(ea) { this.addMorph(ea); }, this);
      var fullBounds = morphs.invoke("bounds").reduce(function(fullBnds, bnds) { return fullBnds.union(bnds); }, rect(0,0,0,0))
      this.setExtent(fullBounds.extent().addXY(20,20));
    },

    onMouseMove: function onMouseMove(evt) {
      var self = this, pos = evt.getPosition();
      lively.lang.fun.debounceNamed(this.id + "-highlighEdgesAndNodes", 300,
        function() { self.highlightEdgesAndNodes(pos); }, true)();
    },

    onMouseUp: function onMouseUp(evt) {
      var m = this.morphsContainingPoint(evt.getPosition()).without(this).last();
      if (m) m.showHalos();
    }
});

lively.BuildSpec("apps.Graphviz.MorphNodeOrEdge", {
    _BorderColor: null,
    _Extent: lively.pt(10,10),
    _StyleClassNames: ["Morph", "HtmlWrapperMorph", "selectable"],
    className: "lively.morphic.HtmlWrapperMorph",
    draggingEnabled: false,
    grabbingEnabled: false,
    droppingEnabled: false,

    initFromSVGElement: function initFromSVGElement(element) {
      var el = typeof element === "string" ? document.getElementById(element) : element;
      if (!el) { show("no element found for id " + element); return; }
      var svgNode = el.ownerSVGElement;
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // transform
      var bb = el.getBBox();
      var bounds = lively.rect(bb.x, bb.y, bb.width, bb.height);
      var offsetTfm = new lively.morphic.Similitude(bounds.topLeft()).inverse()

      this.setHTML(lively.lang.string.format("<svg width=\"%s\" height=\"%s\"><g transform=\"%s\">%s</g></svg>",
        bounds.width, bounds.height, offsetTfm.toSVGAttributeValue(), el.outerHTML));

      this.setExtent(bounds.extent());

      var offsetInGraphTfm = new lively.morphic.Similitude(svgNode.getTransformToElement(el))
        .preConcatenate(offsetTfm).inverse();

      this.setTransform(offsetInGraphTfm);

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // graph data

      // var id = el.getAttribute("id");
      // if (id) wrapper.setName(id);

      var name = el.getElementsByTagName("title")[0].textContent;
      this.setName(name);
    },

    setHighlight: function setHighlight(bool) {
      var node = this.renderContext().getShapeNode(),
          ellipse = node.querySelector("ellipse") || node.querySelector("polygon"),
          path = node.querySelector("path"),
          node = ellipse || path,
          attribute = !!ellipse ? "fill" : "stroke",
          fillColor = bool ? Global.Color.orange : Global.Color.white,
          strokeColor = bool ? Global.Color.orange : Global.Color.black,
          color = !!ellipse ? fillColor : strokeColor;
      this.highlighted = true;
      node.setAttribute(attribute, color);
    }
});

lively.BuildSpec("apps.Graphviz.Node", lively.BuildSpec("apps.Graphviz.MorphNodeOrEdge").customize({
    isNode: true,
    name: "NO-NODE-NAME-YET",

    initFromSVGNodeElement: function initFromSVGNodeElement(el) {
      this.initFromSVGElement(el);
    },

    remove: function remove() {
      if (this.owner && typeof this.owner.edges === "function") {
        this.owner.edges()
          .filter(function(edge) { return edge.from === this || edge.to === this; }, this)
          .invoke("remove");
      }
      $super();
    }

}));

lively.BuildSpec("apps.Graphviz.Edge", lively.BuildSpec("apps.Graphviz.MorphNodeOrEdge").customize({
    from: null,
    to: null,
    isEdge: true,
    name: "NO-EDGE-NAME-YET",

    initFromSVGEdgeElement: function initFromSVGEdgeElement(el, nodeMorphsByName) {
      this.initFromSVGElement(el);
      if (nodeMorphsByName) {
        var fromTo = this.name.split("->");
        this.from = nodeMorphsByName[fromTo[0]];
        this.to = nodeMorphsByName[fromTo[1]];
      }
    },

    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
      (function reallyContainsPoint(p) {
        var morph = lively.$(this.renderContext().getMorphNode()).data().morph;
        var globalP = morph.worldPoint(p);
        var r = morph.sampledRectsAlongPath(20).detect(function(r) { return r.containsPoint(globalP); })
        return !!r;
      }).asScriptOf(this.shape);
    },

    innerBoundsContainsPoint: function innerBoundsContainsPoint(p) {
      return this.shape.reallyContainsPoint(p);
    },

    sampledPath: function sampledPath() {
      var edge = this.renderContext().shapeNode.getElementsByClassName("edge")[0],
          path = edge.getElementsByTagName("path")[0],
          length = path.getTotalLength(),
          nSamples = 100,
          step = length / nSamples,
          svgTfm = path.ownerSVGElement.getTransformToElement(path),
          tfm = new lively.morphic.Similitude(svgTfm).inverse(),
          globalTfm = tfm.preConcatenate(this.getGlobalTransform()),
          sampled = lively.lang.arr.range(0, length, step).map(function(l) {
            return lively.Point.ensure(path.getPointAtLength(l))
              .matrixTransform(globalTfm);
      }, this);
      return sampled;
    },

    sampledRectsAlongPath: function sampledRectsAlongPath(width) {
      return this.sampledPath().map(function(p) {
        return lively.rect(p.x-(width/2), p.y-(width/2), width, width);
      });
    }

}));

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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
    render: function(options) {
        // options: {asMorph: BOOL, createNodesAndEdges, graphSettings, createRanking, augmentSVG}
        options = options || {};
        options.createNodesAndEdges = options.createNodesAndEdges || this.vizNodesAndEdges.bind(this);
        options.graphSettings = options.graphSettings || this.defaultGraphSettings;
        options.createRanking = options.createRanking || this.ranking.bind(this);
        options.augmentSVG = options.augmentSVG;
        return this.updateAll(options);
    },

    renderToMorph: function(options) {
        // options: {asMorph: BOOL, createNodesAndEdges, graphSettings, createRanking, augmentSVG}
        options = options || {};
        var renderOpts = lively.lang.obj.merge(options, {asMorph: true, asWindow: true});
        var svgViewer = apps.Graphviz.Renderer.render(renderOpts).openInWorld();
        var morphified = apps.Graphviz.MorphGraph.openMorphForSVGViewer(svgViewer, options);
        svgViewer.remove();
        return morphified;
    },

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

    convertGraphvizSVGToMorphs: function(svgNode, options) {

      options = lively.lang.obj.merge({asWindow: false, extent: pt(700, 400)}, options);

      var container = lively.BuildSpec("apps.Graphviz.GraphvizMorphicCanvas").createMorph(),
          morphs = graphsToMorphs(svgNode);
      container.setNodesAndEdgeMorphs(morphs);

      return container;

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      function graphsToMorphs(svgNode) {
        return lively.lang.arr.flatmap(
          lively.lang.arr.from(svgNode.getElementsByClassName("graph")),
          function(graph) {
            var nodes = lively.lang.arr.from(graph.getElementsByClassName("node")),
                edges = lively.lang.arr.from(graph.getElementsByClassName("edge")),
                nodeMorphs = nodes.map(extractNode),
                nodeMorphsByName = nodeMorphs.groupByKey("name").mapGroups(function(_, g) { return g.first(); }),
                edgeMorphs = edges.map(extractEdge.curry(nodeMorphsByName));
            return nodeMorphs.concat(edgeMorphs);
          });
      }

      function extractNode(el) {
        var m = lively.BuildSpec("apps.Graphviz.Node").createMorph();
        m.initFromSVGNodeElement(el);
        return m;
      }

      function extractEdge(nodeMorphsByName, el) {
        var m = lively.BuildSpec("apps.Graphviz.Edge").createMorph();
        m.initFromSVGEdgeElement(el, nodeMorphsByName);
        return m;
      }
    },

// graph creation

    ranking: function() {
        // return an array of something like {rank=same; id1 id2 id3;}
        return [];
    },

    vizNodesAndEdges: function() {
        throw new Error('Function for producing nodes and edges required!');
    },

    defaultGraphSettings: [
        // "graph [ranksep=30];",
        // "layout=sfdp;",
        // "size=67;",
        // "K=3;",
        // "ranksep=30;",
        // "overlap=prism;",
        // "concentrate=true;",
        // "ranksep=1.75;",
        // "overlap=scale;",
        // "edge [style=solid,color=gray];"
        // "splines=true;"
        // "splines=polyline"
        // "splines=ortho;"
    ],

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
            graph = options.dotSource || this.makeGraph(options),
            dotURL = URL.root.withFilename(dotName),
            svgURL = this.changeExt(dotURL, '.svg');
        this.writeGraph(dotURL, graph);
        this.renderGraph(dotName);
        this.transformSVG(options.augmentSVG, svgURL);
        if (options.asSVG || options.asMorph || options.asWindow) {
            var svg;
            this.transformSVG(function(svgString) { svg = svgString; }, svgURL);
            if (options.asSVG) return svg;
            var morph = this.asMorph(svg);
            if (options.asWindow) morph = morph.openInWindow();
            if (options.convertNodesAndEdgesToMorphs)
              morph.get("svgMorph").get("SVGViewer").convertSVGToMorphic();
            return morph;
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
            options.graphSettings.join('\n'),
            options.createRanking().join('\n'),
            sanitizedNodesAndEdges.join('\n'));
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
            name, this.changeExt(name, '.svg')), {cwd: lively.shell.WORKSPACE_LK}),
            outString = cmd.resultString(true).trim();
        outString.length && show(outString);
    },

    // make morphs
    asMorph: function(svgString) {
      var viewer = lively.BuildSpec('lively.morphic.SVGViewer').createMorph();
      viewer.renderSVG(svgString);
      return viewer;
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// cleanup

apps.Graphviz.Simple = {
  
  renderDotToSVG: function(dotSource, options) {
    // apps.Graphviz.Simple.renderDotToSVG("digraph { a -> b; b -> a; }").then(svg => show(svg))
    if (!dotSource || !dotSource.trim())
      return Promise.reject(new Error("Invalid dot source: " + dotSource))
    return apps.Graphviz.Simple.renderDotToSVGViaVizjs(dotSource, options);
  },

  renderDotToSVGViaVizjs: function(dotSource, options) {
    return Promise.resolve()
      .then(function() {
        if (window.Viz) return window.Viz;
        // FIXME host ourselves? add to libs?
        JSLoader.loadJs("http://mdaines.github.io/viz.js/bower_components/viz.js/viz.js");
        return lively.lang.promise.waitFor(10000, function() { return window.Viz; });
      })
      .then(function(viz) { return viz(dotSource); })
  },

  renderDotToSVGViaServerImageMagick: function(dotSource, options) {
    // uses the commandline dot program that is part of imagemagick
    return new Promise((resolve, reject) => {
      if (!dotSource || !dotSource.trim()) return reject("Invalid dot source: " + dotSource)
      var cmd = "dot -Tsvg";
      lively.shell.run(cmd, {stdin: dotSource}, (err, cmd) => {
        if (err) reject(cmd.resultString(true).trim() || err);
        else resolve(cmd.getStdout());
      });
    });
  },

  renderDotToDisplay: function(dotSource, options) {
    options = lively.lang.obj.merge({display: null}, options);
    return apps.Graphviz.Simple.renderDotToSVG(dotSource)
      .then((svg) => {
        var display = options.display || lively.BuildSpec('apps.Graphviz.Display').createMorph();
        return display.updateSVG(svg, options);
      });
  }
}

lively.BuildSpec('apps.Graphviz.Display', {
  _BorderColor: Color.rgb(95,94,95),
  _BorderWidth: 1,
  _ClipMode: "hidden",
  _Extent: lively.pt(300,300),
  _Fill: Color.rgb(255,255,255),
  className: "lively.morphic.Box",
  layout: {adjustForNewBounds: true, resizeHeight: true, resizeWidth: true},
  name: "graphviz-display",

  _StyleSheet: `
.graphviz-element {
  cursor: pointer;
}
.graphviz-element.selected svg polygon, .graphviz-element.selected svg rectangle, .graphviz-element.selected svg ellipse {
  fill: orange;
  stroke: none;
}
`,

  submorphs: [{
    _BorderWidth: 0,
    _ClipMode: "scroll",
    _Extent: lively.pt(300,300),
    _Position: lively.pt(0,0),
    className: "lively.morphic.Box",
    layout: {resizeHeight: true, resizeWidth: true},
    name: "clip"
  }],

  doZoomBy: function doZoomBy(scaleDelta, zoomPoint) {
    // zoomPoint is global
    var oldScale = this.getSVGScale();

    var minScale = 0.1, maxScale = 2;
    if (oldScale <= minScale && scaleDelta < 1) return false;
    if (oldScale >= maxScale && scaleDelta > 1) return false;

    var newScale = lively.lang.num.roundTo(oldScale * scaleDelta, 0.0001);
    
    if (newScale !== oldScale) {
        var clip = this.get('clip');
        var canvas = clip.submorphs[0];
        var scrollPos = clip.getScrollBounds().topLeft();
        var oldPos = canvas.localize(zoomPoint);

        this.setSVGScale(newScale);

        var newPos = canvas.localize(zoomPoint)
        var newScrollPos = scrollPos.addPt(oldPos.subPt(newPos).scaleBy(this.getSVGScale()));
        clip.setScroll(newScrollPos.x, newScrollPos.y);
    }
  },

    getSVGScale: function getSVGScale() {
      var canvas = this.get('graphviz-canvas');
      return canvas ? canvas.getScale() : 1;
    },

    setSVGScale: function setSVGScale(val) {
      var canvas = this.get('graphviz-canvas');
      canvas && canvas.setScale(val);
    },

    onMouseWheel: function onMouseWheel(evt) {
        if (!evt.isAltDown()) return $super(evt);
        var scaleDelta = 1 + (evt.wheelDelta / 2800);
        this.doZoomBy(scaleDelta, evt.getPosition(), true);
        evt.stop(); return true;
    },

    renderSVG: function renderSVG(svgString) {
      var scale = this.getSVGScale();
      this.setSVGScale(1);
      var clip = this.get("clip"),
          canvas = clip.getMorphNamed('graphviz-canvas')
                || clip.addMorph(lively.BuildSpec('apps.Graphviz.Canvas').createMorph());
      canvas.renderSVGString(svgString);
      this.setSVGScale(scale);
    },

    getNodes: function getNodes() {
      var canvas = this.get('graphviz-canvas');
      return canvas ? canvas.submorphs.filter(ea => ea.graphvizType === "node") : [];
    },

    getEdges: function getEdges() {
      var canvas = this.get('graphviz-canvas');
      return canvas ? canvas.submorphs.filter(ea => ea.graphvizType === "edge") : [];
    },

    getClusters: function getClusters() {
      var canvas = this.get('graphviz-canvas');
      return canvas ? canvas.submorphs.filter(ea => ea.graphvizType === "cluster") : [];
    },

    setSelection: function setSelection(val) {
      var canvas = this.get('graphviz-canvas');
      return canvas && canvas.setSelection(val);
    },

    getSelection: function getSelection() {
      var canvas = this.get('graphviz-canvas');
      return canvas && canvas.getSelection();
    },

    updateSVG: function updateSVG(svgString, options) {
      options = lively.lang.obj.merge({
        display: null,
        convertToMorphs: true,
        makeSelectable: ["node"],
        scrollSelectionIntoView: true
      }, options);
      
      return new Promise((resolve, reject) => {
        var scroll = this.get("clip").getScroll();
        var selection = this.getSelection();
  
        this.renderSVG(svgString);
  
        if (options.convertToMorphs) {
          if (!this.world()) this.openInWorldCenter();
          var canvas = this.get("graphviz-canvas");
          canvas.convertToMorphs();
          if (options.makeSelectable) {
            canvas.makeSelectable(Array.isArray(options.makeSelectable) ? options.makeSelectable : undefined);
            canvas.shouldScrollSelectionIntoView = options.scrollSelectionIntoView;
            lively.bindings.connect(canvas, 'selection', this, 'selection');
          }
        }
  
        if (selection) this.setSelection(selection.name);
        this.get("clip").setScroll(scroll[0], scroll[1]);
        // (() => {
        //   this.get("clip").setScroll(scroll[0], scroll[1]);
        //   resolve(this);
        // }).delay(0);
        resolve(this);
      });
    },

    renderDot: function renderDot(dotSource, options) {
      return apps.Graphviz.Simple.renderDotToDisplay(dotSource, lively.lang.obj.merge(options, {display: this}));
    },

    onFromBuildSpecCreated: function onFromBuildSpecCreated(dotSource, options) {
      this.getPartsBinMetaInfo().addRequiredModule("apps.Graphviz");
    }
});

lively.BuildSpec('apps.Graphviz.Canvas', {
  name: 'graphviz-canvas',
  _ClipMode: "hidden",
  _Extent: pt(20,20),
  _Position: pt(0,0),
  _Fill: null,
  className: "lively.morphic.HtmlWrapperMorph",
  _StyleClassNames: ["Morph", "HtmlWrapperMorph", "graphviz-canvas"],
  doNotSerialize: ["rootElement"],
  layout: {resizeHeight: true,resizeWidth: true},

  renderSVGString: function renderSVGString(svgString) {
    this.removeAllMorphs();
    this.renderContext().shapeNode.innerHTML = svgString;
    this.scaleToFitSVG();
  },

  scaleToFitSVG: function scaleToFitSVG() {
    var el = this.renderContext().shapeNode.querySelector("svg");
    if (!el) return
    var bnds = el.getBoundingClientRect(),
        scale = this.getScale();
    this.applyStyle({clipMode: 'hidden', extent: pt(bnds.width/scale, bnds.height/scale)});
  },

  onOwnerChanged: function onOwnerChanged(owner) {
    $super(owner);
    if (!owner || !owner.world()) return;
    this.scaleToFitSVG();
  },

  convertToMorphs: function convertToMorphs() {
    var graphs = this.renderContext().shapeNode.querySelectorAll("svg > .graph"),
        elements = lively.lang.arr.from(graphs[0].querySelectorAll("g"));
    elements.forEach(el => {
      var element = lively.BuildSpec("apps.Graphviz.Element").createMorph();
      this.addMorph(element);
      element.initFromSVGElement(el);
      el.parentNode.removeChild(el);
    });
  },

  getSelection: function getSelection() {
    return this.submorphs.detect(ea => ea.hasStyleClassName("selected"));
  },

  setSelection: function setSelection(selection) {
    var id = typeof selection === "string" ? selection : (selection ? selection.name : null),
        found = this.submorphs.detect(ea => ea.name === id || ea.name === "cluster_" + id);
    lively.bindings.signal(this, 'selection', found);
    return found;
  },

  makeSelectable: function makeSelectable(types) {
    var targets = this.submorphs
    if (types) targets = targets.filter(ea => types.include(ea.graphvizType));
    targets.invoke("makeSelectable");
    this.submorphs.withoutAll(targets).invoke("disableEvents");
    lively.bindings.connect(this, 'selection', this, 'onSelectionChanged');
  },

  onSelectionChanged: function onSelectionChanged(selectedMorph) {
    if (selectedMorph) {
      selectedMorph.addStyleClassName("selected");
    }
    this.submorphs.without(selectedMorph)
      .filter(ea => ea.isSelectable)
      .forEach(ea => ea.removeStyleClassName("selected"));
      
    if (this.shouldScrollSelectionIntoView && selectedMorph)
      this.scrollIntoView(selectedMorph);
  },
  
  scrollIntoView: function scrollIntoView(morph) {
    var clip = this.owner;
    var nodeBounds = morph.transformToMorph(clip).transformRectToRect(morph.innerBounds())
    var sBounds = clip.getScrollBounds();
    if (!sBounds.containsRect(nodeBounds)) {
      var delta = pt(0,0);
      if (nodeBounds.bottom() > sBounds.bottom()) delta.y = nodeBounds.bottom() - sBounds.bottom();
      else if (nodeBounds.top() < sBounds.top()) delta.y = nodeBounds.top() - sBounds.top();
      if (nodeBounds.right() > sBounds.right()) delta.x = nodeBounds.right() - sBounds.right();
      else if (nodeBounds.left() < sBounds.left()) delta.x = nodeBounds.left() - sBounds.left();
      var s = clip.getScroll();
      clip.setScroll(s[0]+delta.x, s[1]+delta.y);
    }
  },

  onDrag: function onDrag(evt) {
    this.setHandStyle("grabbing");
    var delta = this._dragStartPos.subPt(evt.getPosition()),
        scroll = this.owner.getScroll();
    this.owner.setScroll(scroll[0] + delta.x, scroll[1] + delta.y);
    this._dragStartPos = evt.getPosition();
  },

  onDragEnd: function onDragEnd(evt) {
    this.setHandStyle("grab");
    delete this._dragStartPos;
  },

  onDragStart: function onDragStart(evt) {
    this._dragStartPos = evt.getPosition();
  },

  onMouseDown: function onMouseDown(evt) {
    if (evt.getTargetMorph() === this) {
      evt.stop(); return true; // to not auto scroll when hand outside of scroll area
    }
  }

});

lively.BuildSpec("apps.Graphviz.Element", {
    className: "lively.morphic.HtmlWrapperMorph",
    _BorderColor: null, _Extent: lively.pt(10,10),
    draggingEnabled: false, grabbingEnabled: false, droppingEnabled: false,
    _StyleClassNames: ["Morph", "HtmlWrapperMorph", "graphviz-element"],

    initFromSVGElement: function initFromSVGElement(element) {
      var el = typeof element === "string" ? document.getElementById(element) : element;
      if (!el) { show("no element found for id " + element); return; }
      var svgNode = el.ownerSVGElement;
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // transform
      var bb = el.getBBox();
      var bounds = lively.rect(bb.x, bb.y, bb.width, bb.height);
      var offsetTfm = new lively.morphic.Similitude(bounds.topLeft()).inverse()

      this.setHTML(lively.lang.string.format("<svg width=\"%s\" height=\"%s\"><g transform=\"%s\">%s</g></svg>",
        bounds.width, bounds.height, offsetTfm.toSVGAttributeValue(), el.outerHTML));

      this.setExtent(bounds.extent());

      // var displayScale = this.get("graphviz-display").getSVGScale();
      // var displayTfm = new lively.morphic.Similitude(pt(0,0), 0, pt(displayScale, displayScale));
      var elTfm = new lively.morphic.Similitude(svgNode.getTransformToElement(el));

      var offsetInGraphTfm = new lively.morphic.Similitude()
        // .preConcatenate(displayTfm)
        .preConcatenate(elTfm)
        .preConcatenate(offsetTfm)
        .inverse();

      this.setTransform(offsetInGraphTfm);

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // graph data

      // var id = el.getAttribute("id");
      // if (id) wrapper.setName(id);

      this.graphvizTitle = window.decodeURIComponent(el.getElementsByTagName("title")[0].textContent).trim();
      this.graphvizType = el.getAttribute("class");
      
      this.setName(this.graphvizTitle || el.id);
    },

    makeSelectable: function makeSelectable() {
      this.isSelectable = true;
    },
    
    onMouseDown: function onMouseDown(evt) {
      if (!this.isSelectable || evt.getTargetMorph() !== this) return $super(evt);
      lively.bindings.signal(this.owner, 'selection', this);
      evt.stop(); return true;
    },
});


}); // end of module
