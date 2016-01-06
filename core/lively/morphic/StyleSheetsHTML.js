module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.HTML').toRun(function () {

// This module modifies the Morphic HTML rendering implementation to make it
// compatible with CSS styling. Several style attribute setter methods are
// adapted so that inline styling / declarative styling work together.

Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
    setStyleSheet: 'setStyleSheetHTML',
    setBaseThemeStyleSheet: 'setBaseThemeStyleSheetHTML',
    setStyleClassNames: 'setStyleClassNamesHTML',
    getStyleClassNames: 'getStyleClassNamesHTML',
    setStyleId: 'setStyleIdHTML',
    setNodeMorphId: 'setNodeMorphIdHTML'
});

Object.extend(lively.morphic.Shapes.Shape.prototype.htmlDispatchTable, {
    setAppearanceStylingMode: 'setAppearanceStylingModeHTML',
    setBorderStylingMode: 'setBorderStylingModeHTML'
});

lively.morphic.Shapes.Shape.addMethods('Stylesheets', {
    setAppearanceStylingModeHTML: function (ctx, value) {
        this.setFillHTML(ctx, this.shapeGetter("Fill"));
        this.setOpacityHTML(ctx, this.shapeGetter("Opacity"));
    },

    setBorderStylingModeHTML: function (ctx, value) {
        this.setBorderHTML(
            ctx, this.getBorderWidth(), this.getBorderColor(), this.getStrokeOpacity());
        this.setBorderRadiusHTML(ctx, this.getBorderRadius());
        this.setExtentHTML(ctx, this.getExtent());
    }
});

Object.extend(lively.morphic.Text.prototype.htmlDispatchTable, {
    setTextStylingMode: 'setTextStylingModeHTML'
});

lively.morphic.Text.addMethods('Stylesheets', {
    setTextStylingModeHTML: function (ctx, value) {
        this.setFontSizeHTML(ctx, this.getFontSize());
        this.setFontFamilyHTML(ctx, this.getFontFamily());
        this.setFontWeightHTML(ctx, this.getFontWeight());
        this.setFontStyleHTML(ctx, this.getFontStyle());
        this.setAlignHTML(ctx, this.getAlign());
        this.setTextColorHTML(ctx, this.getTextColor());

        this.setVerticalAlignHTML(ctx, this.getVerticalAlign());
        this.setLineHeightHTML(ctx, this.getLineHeight());
        this.setTextDecorationHTML(ctx, this.getTextDecoration());
        this.setWordBreakHTML(ctx, this.getWordBreak());
        this.setDisplayHTML(ctx, this.getDisplay());
    }
});

Trait('StyleSheetsHTMLShapeTrait',
'updating', {
    setFillHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLShapeTrait').getOriginalMethodFor(lively.morphic.Shapes.Shape, "setFillHTML").call(this, ctx, this.shapeGetter('AppearanceStylingMode') ? null : value);
    },

    setOpacityHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLShapeTrait').getOriginalMethodFor(lively.morphic.Shapes.Shape, "setOpacityHTML").call(this, ctx, this.shapeGetter('AppearanceStylingMode') ? null : value);
    },

    setBorderStyleHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLShapeTrait').getOriginalMethodFor(lively.morphic.Shapes.Shape, "setBorderStyleHTML").call(this, ctx, ctx.shapeNode && this.shapeGetter('BorderStylingMode') ? null : value);
    },

    setBorderHTML: function (ctx, width, fill, opacity) {
        if (ctx.shapeNode && this.shapeGetter('BorderStylingMode')) {
            ctx.shapeNode.style['border'] = null;
            this.compensateShapeNode(ctx);
        } else {
            return Trait('StyleSheetsHTMLShapeTrait').getOriginalMethodFor(lively.morphic.Shapes.Shape, "setBorderHTML").call(this, ctx, width, fill, opacity);
        }
    },

    setBorderWidthHTML: function(ctx, width) {
        if (!ctx.shapeNode) return width;
        if (this.getBorderStylingMode()) {
            ctx.shapeNode.style.border = '';
            ctx.shapeNode.style.borderWidth = parseInt(width) + 'px ';
        } else {
            ctx.shapeNode.style.borderWidth = '';
            this.setBorderHTML(ctx, width, this.getBorderColor(), this.getStrokeOpacity());
        }
        this.compensateShapeNode(ctx);
        this.setExtentHTML(ctx, this.getExtent());
        return width;
    }

}).applyTo(lively.morphic.Shapes.Shape, {
    override: ['setFillHTML', 'setOpacityHTML', 'setBorderStyleHTML',
               'setBorderWidthHTML', 'setBorderHTML']
});

Trait('StyleSheetsHTMLExternalShapeTrait',
'updating', {
    setOpacityHTML: function(ctx, value) {
        return Trait('StyleSheetsHTMLExternalShapeTrait').getOriginalMethodFor(lively.morphic.Shapes.External, "setOpacityHTML").call(this, ctx, this.shapeGetter('AppearanceStylingMode') ? null : value);
    }
}).applyTo(lively.morphic.Shapes.External, {
    override: ['setOpacityHTML']
});

Trait('StyleSheetsHTMLRectangleTrait',
'updating', {
    setBorderRadiusHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLRectangleTrait').getOriginalMethodFor(lively.morphic.Shapes.Rectangle, "setBorderRadiusHTML").call(this, ctx, ctx.shapeNode && this.shapeGetter('BorderStylingMode') ? null : value);
    }
}).applyTo(lively.morphic.Shapes.Rectangle, {
    override: ['setBorderRadiusHTML']
});

Trait('StyleSheetsHTMLTextTrait',
'accessing', {
    setAlignHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setAlignHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    },

    setFontFamilyHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setFontFamilyHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    },

    setFontSizeHTML: function (ctx, value) {
        if (ctx.textNode && this.morphicGetter('TextStylingMode')) {
            return ctx.textNode.style.fontSize = null;
        } else {
            return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setFontSizeHTML").call(this, ctx, value || null);
        }
    },
    setFontStyleHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setFontStyleHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    },
    setFontWeightHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setFontWeightHTML").call(this,  ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    },
    setTextColorHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setTextColorHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    },
    setTextDecorationHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setTextDecorationHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    },
    setVerticalAlignHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setVerticalAlignHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    },
    setLineHeightHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setLineHeightHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    },
    setDisplayHTML: function (ctx, value) {
        return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setDisplayHTML").call(this, ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    },
    setWordBreakHTML: function (ctx, value) {
        if (ctx.textNode && this.morphicGetter('TextStylingMode')) {
            ctx.textNode.style.wordBreak = 'inherit';
        } else {
            return Trait('StyleSheetsHTMLTextTrait').getOriginalMethodFor(lively.morphic.Text, "setWordBreakHTML").call(this, ctx, value || null);
        }
    }
}).applyTo(lively.morphic.Text, {
    override: ['setAlignHTML',  'setFontFamilyHTML',
        'setFontSizeHTML', 'setFontStyleHTML', 'setFontWeightHTML', 'setTextColorHTML',
        'setTextDecorationHTML', 'setVerticalAlignHTML', 'setDisplayHTML', 'setWordBreakHTML',
        'setLineHeightHTML']
});

Trait('StyleSheetsHTMLTrait',
'initializing', {

    appendHTML: function (ctx, optMorphAfter) {
        Trait('StyleSheetsHTMLTrait').getOriginalMethodFor(lively.morphic.Morph, "appendHTML").call(this, ctx, optMorphAfter);
        this.prepareDOMForStyleSheetsHTML(ctx);
        this.setStyleSheetHTML(ctx, this.getParsedStyleSheet());

        // Mark morphNode if it's not the same as the shapeNode
        if (ctx.morphNode && ctx.morphNode !== ctx.shapeNode) {
            ctx.morphNode.setAttribute('data-lively-node-type', 'morph-node');
        }

        // Mark originNode of owner
        var ownerCtx = this.owner && this.owner.renderContext();
        if (ownerCtx && ownerCtx.originNode) {
            ownerCtx.originNode.setAttribute('data-lively-node-type', 'origin-node');
        }

        // Check if the css border changed
        this.adaptBorders();
    },

    setNewId: function (optId) {
        var result = Trait('StyleSheetsHTMLTrait').getOriginalMethodFor(lively.morphic.Morph, "setNewId").call(this, optId);
        if (this.isRendered()) this.renderContextDispatch('setNodeMorphId');
        return result;
    }

}).applyTo(lively.morphic.Morph, {
    override: ['appendHTML', 'setNewId']
});

lively.morphic.Morph.addMethods(
'Stylesheets', {

    compileStyleSheet: function (optCssRules) {
        // Takes a list of CSS rules and assembles a style
        // sheet which can be injected into the DOM.
        // If this morph is not the world, the selectors
        // are extended so the rules may not be applied
        // to morphs outside the addressed hierarchy.
        // Helper function for setStyleSheetHTML.

        var output = '',
            rules = optCssRules || this.getStyleSheetRules();

        rules.each(function (rule) {
            if (rule.isStyleSheetFontFaceRule) {
                output += rule.getText() + '\n';
            } else if (rule.isStyleSheetComment){
                // do not include comments
            } else if (rule.isStyleSheetRule) {
                var selector = rule.getSelector(),
                    selectors = this.splitGroupedSelector(selector),
                    newSelector = '';
                for (var i = 0; i < selectors.length; i++) {
                    var adaptedSelector = selectors[i];
                    // Wildcards have to be replaced before the prefixes are added
                    adaptedSelector = this.replaceWildcardSelector(adaptedSelector);
                    adaptedSelector = this.replaceRootPseudo(adaptedSelector);
                    // Child ops are better replaced before prefixes add complexity to the selector
                    adaptedSelector = this.replaceChildOp(adaptedSelector);
                    adaptedSelector = this.addSelectorPrefixes(adaptedSelector);
                    newSelector += adaptedSelector;
                    if (i < selectors.length - 1) {
                        newSelector += ', ';
                    }
                }
                output += rule.getTextWithSelector(newSelector);
                output += '\n';
            }
        }, this);
        return output;
    },
    addSelectorPrefixes: function (selector) {
        // Doubles a selector to include its child and
        // itself and adds an attribute selector prefix.
        // Helper function for compileStyleSheet.

        var extendedSelector = '',
            morphPrefix = '[data-lively-morphid="' + this.id + '"]',
            tokensRx = /(?:\\.|\[[\x20\t\r\n\f]*((?:\\.|[-\w]|[^\x00-\xa0])+)[\x20\t\r\n\f]*(?:([*^$|!~]?=)[\x20\t\r\n\f]*(?:(['"])((?:\\.|[^\\])*?)\3|((?:\\.|[-\w#]|[^\x00-\xa0])+)|)|)[\x20\t\r\n\f]*\]|:((?:\\.|[-\w]|[^\x00-\xa0])+)(?:\((?:(['"])((?:\\.|[^\\])*?)\7|((?:[^,]|\\,|(?:,(?=[^\[]*\]))|(?:,(?=[^\(]*\))))*))\)|)|[^\\\x20\t\r\n\f>+~])+|[\x20\t\r\n\f]*([\x20\t\r\n\f>+~])[\x20\t\r\n\f]*/g,
            tagRx = /^((?:\\.|[-\*\w]|[^\x00-\xa0])+)/,
            tokens = selector.match(tokensRx);

        // Include the childs of the morph ...
        extendedSelector += '*' + morphPrefix;
        extendedSelector += ' ';
        extendedSelector += selector;
        extendedSelector += ', ';

        // Include the morph itself ...
        // If first token is a tagname then put prefix after tagname
        if (tokens) {
            if (tagRx.exec(tokens.first())) {
                extendedSelector += tokens.first();
                extendedSelector += morphPrefix;
                for (var i = 1; i < tokens.length; i++) {
                    extendedSelector += tokens[i];
                }
            } else {
                extendedSelector += '*' + morphPrefix;
                extendedSelector += selector;
            }
            return extendedSelector;
        } else {
            return '';
        }
    },

    generateCombinedIdSelector: function(actualSelector) {
        return this.getIdsForSelector(actualSelector).reduce(function(prev, val) {
           return prev
                + (prev.length > 0 ? ', ' : '')
                + '[data-lively-morphid="'+ val + '"]'; }, '');
    },

    splitGroupedSelector: function (selector) {
        // Splits a grouped selector and returns
        // its single selectors as an array.
        // Helper function for compileStyleSheet.

        var selectorList = selector.
        split(/[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/);
        return selectorList.collect(function (s) {
            return s.trim();
        });
    },

    setStyleSheetHTML: function (ctx, styleSheet) {
        ctx.styleNode = this.setStyleSheetForNodeHTML(
            ctx, ctx.styleNode,
            this.getStyleSheetRules(),
            "style-for-" + this.id);
    },

    setBaseThemeStyleSheetHTML: function (ctx, styleSheet) {
        ctx.baseThemeNode = this.setStyleSheetForNodeHTML(
            ctx, ctx.baseThemeNode,
            styleSheet && styleSheet.getRules ? styleSheet.getRules() : [],
            "base-theme-for-" + this.id);
    },
    setStyleSheetForNodeHTML: function(ctx, node, rules, styleTagId) {
        // Compiles the input style rules to an
        // HTML specific style sheet and adds this
        // to the DOM.
        // Called when a new style sheet was applied to
        // the morph (i.e. through setStyleSheet) and
        // in the initHTML method of the morph.
        var compiledCss = this.compileStyleSheet(rules),
            parseSuccess = compiledCss && compiledCss.length > 0;
        if (!parseSuccess) {
            ctx.domInterface.remove(node);
            return null;
        }
        if (!node) {
            node = document.createElement('style');
            node.setAttribute("type", "text/css");
            node.setAttribute("id", styleTagId);
        }
        if (!node.parentNode) this.appendStyleNodeHTML(ctx, node);
        if (node.textContent !== compiledCss) node.textContent = compiledCss;
        return node;
    },

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
        if (ctx.baseThemeNode && ctx.baseThemeNode !== styleNode) {
            var parent = ctx.baseThemeNode.parentNode || (styleNode && styleNode.parentNode) || document.head;
            parent.insertBefore(styleNode, ctx.baseThemeNode.nextSibling);
            return;
        } else if (ctx.styleNode && ctx.styleNode.parentNode && ctx.styleNode !== styleNode) {
            ctx.styleNode.parentNode.insertBefore(styleNode, ctx.styleNode);
            return;
        }

        // Search upward in morph hierarchy ...
        while ((parent = parent.owner)) {
            var parentCtx = parent.renderContext();
            if (parentCtx.styleNode && parentCtx.styleNode.parentNode) {
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
                if (mCtx.styleNode && m !== this) {
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
                    m.submorphs.forEach(function(ms) { nextLevelSubmorphs.push(ms); });
                }
            }
            submorphs = nextLevelSubmorphs;
        }

        // If appearantly none of the other morphs in the hierarchy
        // have a css applied, just add the stylenode to the head
        head.appendChild(styleNode);
    },
    replaceChildOp: function(selector) {
        var replacements = ['>', '> [data-lively-node-type="origin-node"] >',
                            '> [data-lively-node-type="origin-node"] > [data-lively-node-type="morph-node"] >'],
            tokens = selector.split('>'),
            childOpCount = tokens.length - 1,
            results = [],
            maxOpCount = 3;

        function replaceRecursively(spareTokens) {
            var firstToken = spareTokens.shift();
            if (spareTokens.length === 1) {
                var spareToken = spareTokens.first();
                return replacements.collect(function(r) {
                    return firstToken + r + spareToken;
                });
            }
            var combinedTokens = replaceRecursively(spareTokens);
            return combinedTokens.reduce(function(prev, c) {
                return prev.concat(replacements.collect(function(r) {
                    return firstToken + r + c; }));
            }, []);
        };
        if (childOpCount > maxOpCount) {
            console.warn('Cannot adapt selector ' + selector + '. Too many child operators.');
            return selector;
        }
        if (childOpCount === 0) {
            return selector;
        }
        // Loop over all tokens
        var sels = replaceRecursively(tokens);
        return sels.reduce(function(prev, sel, i) {
            return prev + sel + ((i < sels.length - 1) ? ', ' : '');
        },'');
    },

    replaceWildcardSelector: function(selector) {
        // Only select shape nodes (shape nodes should have the morphid param set)
        return selector.replace(/\*/g, '*[data-lively-morphid]');
    },

    replaceRootPseudo: function(selector) {
        // ":root" should select this morph
        return selector.replace(/\:root/g, '[data-lively-morphid="'+this.id+'"]');
    }

},
'Style Classes and Ids', {
    prepareDOMForStyleSheetsHTML: function (ctx) {
        this.setStyleClassNamesHTML(ctx, this.getStyleClassNames());
        this.setStyleIdHTML(ctx, this.getStyleId());
        this.setNodeMorphIdHTML(ctx);
    },

    setStyleClassNamesHTML: function (ctx, classNames) {
        if (ctx.shapeNode)
          ctx.shapeNode.className = classNames ? classNames.join(' ') : '';
    },

    getStyleClassNamesHTML: function (ctx) {
        if (!ctx.shapeNode || !this.isRendered()) return this._StyleClassNames || [];
        var domClassString = ctx.shapeNode.className || '';
        return domClassString.trim() === '' ? [] : domClassString.trim().split(/\s+/);
    },

    setNodeMorphIdHTML: function(ctx) {
        lively.$(ctx.shapeNode).attr('data-lively-morphid', this.id);
    },

    setStyleIdHTML: function (ctx, id) {
        if (ctx.shapeNode)
          ctx.shapeNode.setAttribute('id', id || null);
    },

    getIdsForSelector: function(selector) {
        return this.cssSelectMorphs(selector).collect(function(m) { return m.id; });
    },

    cssSelectMorphs: function(cssSelector) {
        return new lively.morphic.Sizzle().select(cssSelector, this);
    }

});

}) // end of module
