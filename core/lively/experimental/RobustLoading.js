module('lively.experimental.RobustLoading').requires().toRun(function() {

// add some more nil checks ...

cop.create("RobustLoadingLayer").refineClass(lively.morphic.Morph, {
     appendStyleNodeHTML: function (ctx, styleNode) {
        // first ensure that similar styles are removed
        var head = document.getElementsByTagName("head")[0],
            id = styleNode.getAttribute('id');
        // strange, document.getElementById not working here
        Array.from(head.getElementsByTagName('style')).forEach(function(el) {
            if (el.getAttribute('id') === id) head.removeChild(el); });

        // Adds the morph's style node to the DOM
        // and reflects the morph hierarchy in the
        // node order.

        var parent = this,
            submorphs = this.submorphs || [];

        // Check if the own context has either a baseThemeNode or a styleNode
        // (the baseThemeNode should always be inserted before the styleNode)
        if (ctx.baseThemeNode && ctx.baseThemeNode !== styleNode && ctx.baseThemeNode.parentNode) {
            ctx.baseThemeNode.parentNode.insertBefore(styleNode, ctx.baseThemeNode.nextSibling);
            return;
        } else if (ctx.styleNode && ctx.styleNode !== styleNode && ctx.styleNode.parentNode) {
            ctx.styleNode.parentNode.insertBefore(styleNode, ctx.styleNode);
            return;
        }

        // Search upward in morph hierarchy ...
        while ((parent = parent.owner)) {
            var parentCtx = parent.renderContext();
            if (parentCtx.styleNode &&  parentCtx.styleNode.parentNode) {
                parentCtx.styleNode.parentNode.insertBefore(styleNode, parentCtx.styleNode.nextSibling);
                return;
            }
        }

        // If no upward morphs have any CSS applied,
        // search for sister morph style nodes ...
        if (this.owner && this.owner.submorphs) {
            for (var i = 0; i < this.owner.submorphs.length; i++) {
                var m = this.owner.submorphs[i],
                    mCtx = m.renderContext();
                if (mCtx.styleNode && m !== this &&  mCtx.styleNode.parentNode) {
                    mCtx.styleNode.parentNode.insertBefore(styleNode, mCtx.styleNode.nextSibling);

                    return;
                }
            }
        }
        // If still no styleNode was found
        // search downward in morph hierarchy ...
        while (submorphs.length > 0) {
            var nextLevelSubmorphs = [];
            for (var i = 0; i < submorphs.length; i++) {
                var m = submorphs[i],
                    mCtx = m.renderContext();
                if (mCtx.styleNode && mCtx.styleNode.parentNode && mCtx.styleNode !== styleNode) {
                    mCtx.styleNode.parentNode.insertBefore(styleNode, mCtx.styleNode);
                    return;
                }
                if (m.submorphs) {
                    m.submorphs.each(function (ms) {
                        nextLevelSubmorphs.push(ms);
                    });
                }
            }
            submorphs = nextLevelSubmorphs;
        }

        // If appearantly none of the other morphs in the hierarchy
        // have a css applied, just add the stylenode to the head
        head.appendChild(styleNode);
    },
}).beGlobal()


}) // end of module
