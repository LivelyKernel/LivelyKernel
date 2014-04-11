module('lively.morphic.Preview').requires().requiresLib({url: Config.codeBase + 'lib/html2canvas/html2canvas.min.js', loadTest: function() { return typeof html2canvas !== 'undefined'; }}).toRun(function() {

Object.extend(lively.morphic.Preview, {

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

    renderNodeToImage: function(node, image, options, thenDo) {
        options = options || {};
        var extent = image.getExtent();
        // options.width = extent.x;
        // options.height = extent.y;
        this.renderNode(node, options, function(err, canvas) {
            if (canvas) {
                image.setImageURL(canvas.toDataURL(), false);
                if (!options.fullSize) image.resampleImageToFitBounds();
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
        if (!morph.world()) { thenDo(new Error('Morph must be in world')); return; }
        this.renderNodeToNewImage(morph.renderContext().shapeNode, options, thenDo);
    },

    renderMorphToImage: function(morph, image, options, thenDo) {
        if (!morph.world()) { thenDo(new Error('Morph must be in world')); return; }
        this.renderNodeToImage(morph.renderContext().shapeNode, image, options, thenDo);
    }

});

}) // end of module
