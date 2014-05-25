module('lively.morphic.Preview').requires().requiresLib({url: Config.codeBase + 'lib/html2canvas/html2canvas.min.js', loadTest: function() { return typeof html2canvas !== 'undefined'; }}).toRun(function() {

Object.extend(lively.morphic.Preview, {

    usage: function() {
        var morph = lively.morphic.newMorph()
        lively.morphic.Preview.renderMorphToNewImage(morph, {/*options*/}, function(err, image) {
            image.openInWorldCenter();
        });
    },

    withMorphNodeInDOMDo: function(morph, doFunc) {
            var node = morph.renderContext().shapeNode, cleanup;
            if (!morph.world()) {
                node = node.cloneNode(true);
                document.body.appendChild(node);
                cleanup = function() { document.body.removeChild(node); };
            } else {
                cleanup = function() {};
            }
            try {
                doFunc.call(this, node, cleanup);
            } catch (e) { cleanup(); throw e; }
    },

    renderNode: function(node, options, thenDo) {
        var w = typeof lively !== 'undefined'
             && lively.morphic
             && lively.morphic.World
             && lively.morphic.World.current();
        var scroll = w ? w.getScroll() : null;
        options = Object.extend(Object.extend({}, options || {}), {
            onrendered: function(canvas) {
                if (scroll && w) w.scrollTo(scroll[0], scroll[1]);
                thenDo(null, canvas);
            }
        });
        html2canvas(node, options);
    },

    renderNodeAsDataURI: function(node, options, thenDo) {
        options = options || {};
        this.renderNode(node, options, function(err, canvas) {
            thenDo(err, canvas && canvas.toDataURL());
        });
    },

    renderNodeToImage: function(node, image, options, thenDo) {
        options = options || {};
        var extent = image.getExtent();
        // options.width = extent.x;
        // options.height = extent.y;
        this.renderNodeAsDataURI(node, options, function(err, dataURI) {
            if (dataURI) {
                image.setImageURL(dataURI, false);
                if (!options.fullSize) image.whenLoaded(function() {
                    image.resampleImageToFitBounds();
                });
            }
            thenDo(err, image);
        });
    },

    renderNodeToNewImage: function(node, options, thenDo) {
        options = options || {};
        var w = options.width || 100, h = options.height || 100,
            image = new lively.morphic.Image(lively.rect(0,0, w, h));
        this.renderNodeToImage(node, image, options, thenDo);
    },

    renderMorphToNewImage: function(morph, options, thenDo) {
        this.withMorphNodeInDOMDo(morph, function(node, cleanup) {
            this.renderNodeToNewImage(node, options, function(err, image) {
                cleanup();
                thenDo(err, image);
            });
        });
    },

    renderMorphToImage: function(morph, image, options, thenDo) {
        this.withMorphNodeInDOMDo(morph, function(node, cleanup) {
            this.renderNodeToImage(node, image, options, function(err, image) {
                cleanup();
                thenDo(err, image);
            });
        });
    },

    renderMorphToDataURI: function(morph, options, thenDo) {
        this.withMorphNodeInDOMDo(morph, function(node, cleanup) {
            this.renderNodeAsDataURI(node, options, function(err, arg) {
                cleanup();
                thenDo(err, arg);
            });
        });
    }

});

}) // end of module
