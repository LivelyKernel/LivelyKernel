module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.HTML').toRun(function () {

// This module modifies the Morphic HTML rendering implementation to make it
// compatible with CSS styling. Several style attribute setter methods are
// adapted so that inline styling / declarative styling work together.

Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
    setStyleSheet: 'setStyleSheetHTML',
    setBaseThemeStyleSheet: 'setBaseThemeStyleSheetHTML',
    setStyleClassNames: 'setStyleClassNamesHTML',
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
    setFillHTML: lively.morphic.Shapes.Shape.prototype.setFillHTML.wrap(function (proceed, ctx, value) {
        proceed(ctx, this.shapeGetter('AppearanceStylingMode') ? null : value);
    }),

    setOpacityHTML: lively.morphic.Shapes.Shape.prototype.setOpacityHTML.wrap(function (proceed, ctx, value) {
        proceed(ctx, this.shapeGetter('AppearanceStylingMode') ? null : value);
    }),

    setBorderStyleHTML: lively.morphic.Shapes.Shape.prototype.setBorderStyleHTML.wrap(function (proceed, ctx, value) {
        proceed(ctx, ctx.shapeNode && this.shapeGetter('BorderStylingMode') ? null : value);
    }),

    setBorderHTML: lively.morphic.Shapes.Shape.prototype.setBorderHTML.wrap(function (proceed, ctx, width, fill, opacity) {
        if (ctx.shapeNode && this.shapeGetter('BorderStylingMode')) {
            ctx.shapeNode.style['border'] = null;
            this.compensateShapeNode(ctx);
        } else {
            proceed(ctx, width, fill, opacity);
        }
    }),
    setBorderWidthHTML: function(ctx, width) {
        if (this.getBorderStylingMode()) {
            ctx.shapeNode.style.border = '';
            ctx.shapeNode.style.borderWidth = width+'px';
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
    setOpacityHTML: lively.morphic.Shapes.External.prototype.setOpacityHTML.wrap(function(proceed, ctx, value) {
        return proceed(ctx, this.shapeGetter('AppearanceStylingMode') ? null : value);
    })
}).applyTo(lively.morphic.Shapes.External, {
    override: ['setOpacityHTML']
});

Trait('StyleSheetsHTMLRectangleTrait',
'updating', {
    setBorderRadiusHTML: lively.morphic.Shapes.Rectangle.prototype.setBorderRadiusHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, ctx.shapeNode && this.shapeGetter('BorderStylingMode') ? null : value);
    })
}).applyTo(lively.morphic.Shapes.Rectangle, {
    override: ['setBorderRadiusHTML']
});

Trait('StyleSheetsHTMLTextTrait',
'accessing', {
    setAlignHTML: lively.morphic.Text.prototype.setAlignHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    }),

    setFontFamilyHTML: lively.morphic.Text.prototype.setFontFamilyHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    }),

    setFontSizeHTML: lively.morphic.Text.prototype.setFontSizeHTML.wrap(function (proceed, ctx, value) {
        if (ctx.textNode && this.morphicGetter('TextStylingMode')) {
            return ctx.textNode.style.fontSize = null;
        } else {
            return proceed(ctx, value || null);
        }
    }),
    setFontStyleHTML: lively.morphic.Text.prototype.setFontStyleHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    }),
    setFontWeightHTML: lively.morphic.Text.prototype.setFontWeightHTML.wrap(function (proceed, ctx, value) {
        return  proceed(ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    }),
    setTextColorHTML: lively.morphic.Text.prototype.setTextColorHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? null : value || null);
    }),
    setTextDecorationHTML: lively.morphic.Text.prototype.setTextDecorationHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    }),
    setVerticalAlignHTML: lively.morphic.Text.prototype.setVerticalAlignHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    }),
    setLineHeightHTML: lively.morphic.Text.prototype.setLineHeightHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    }),
    setDisplayHTML: lively.morphic.Text.prototype.setDisplayHTML.wrap(function (proceed, ctx, value) {
        return proceed(ctx, this.morphicGetter('TextStylingMode') ? 'inherit' : value || null);
    }),
    setWordBreakHTML: lively.morphic.Text.prototype.setWordBreakHTML.wrap(function (proceed, ctx, value) {
        if (ctx.textNode && this.morphicGetter('TextStylingMode')) {
            ctx.textNode.style.wordBreak = 'inherit';
        } else {
            return proceed(ctx, value || null);
        }
    })
}).applyTo(lively.morphic.Text, {
    override: ['setAlignHTML',  'setFontFamilyHTML',
        'setFontSizeHTML', 'setFontStyleHTML', 'setFontWeightHTML', 'setTextColorHTML',
        'setTextDecorationHTML', 'setVerticalAlignHTML', 'setDisplayHTML', 'setWordBreakHTML',
        'setLineHeightHTML']
});

Trait('StyleSheetsHTMLTrait',
'initializing', {
    appendHTML: lively.morphic.Morph.prototype.appendHTML.wrap(function (proceed, ctx, optMorphAfter) {
        proceed(ctx, optMorphAfter);
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

    }),
    setNewId: lively.morphic.Morph.prototype.setNewId.wrap(function (proceed, optId) {
        proceed(optId);
        if (this.isRendered()) {
            this.renderContextDispatch('setNodeMorphId');
        }
    })
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
        return this.getIdsForSelector(actualSelector)
               .reduce(function(prev, val) {
                   return prev
                        + (prev.length > 0 ? ', ' : '')
                        + '[data-lively-morphid="'+ val + '"]';
               }, '');
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
        // Compiles the input style rules to an
        // HTML specific style sheet and adds this
        // to the DOM.
        // Called when a new style sheet was applied to
        // the morph (i.e. through setStyleSheet) and
        // in the initHTML method of the morph.

        var styleTagId = "style-for-" + this.id,
            rules = this.getStyleSheetRules(),
            compiledCss = this.compileStyleSheet(rules),
            parseSuccess = compiledCss && compiledCss.length > 0;
        if (!parseSuccess) {
            ctx.domInterface.remove(ctx.styleNode);
            delete ctx.styleNode;
            return;
        }
        if (!ctx.styleNode) {
            ctx.styleNode = document.createElement('style');
            ctx.styleNode.setAttribute("type", "text/css")
            ctx.styleNode.setAttribute("id", styleTagId)
        }
        if (!ctx.styleNode.parentNode) {
            this.appendStyleNodeHTML(ctx, ctx.styleNode);
        }
        ctx.styleNode.textContent = compiledCss;
    },

    setBaseThemeStyleSheetHTML: function (ctx, styleSheet) {
        // Compiles the input style rules to an
        // HTML specific style sheet and adds this
        // to the DOM.
        // Called when a new style sheet was applied to
        // the morph (i.e. through setStyleSheet) and
        // in the initHTML method of the morph.

        var styleTagId = "base-theme-for-" + this.id,
            rules = styleSheet && styleSheet.getRules ? styleSheet.getRules() : [],
            compiledCss = this.compileStyleSheet(rules),
            parseSuccess = compiledCss && compiledCss.length > 0;
        if (!parseSuccess) {
            ctx.domInterface.remove(ctx.baseThemeNode);
            delete ctx.baseThemeNode;
            return;
        }
        if (!ctx.baseThemeNode) {
            ctx.baseThemeNode = document.createElement('style');
            ctx.baseThemeNode.setAttribute("type", "text/css");
            ctx.baseThemeNode.setAttribute("id", styleTagId);
        }
        if (!ctx.baseThemeNode.parentNode) {
            this.appendStyleNodeHTML(ctx, ctx.baseThemeNode);
        }
        ctx.baseThemeNode.textContent = compiledCss;
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
            ctx.baseThemeNode.parentNode.insertBefore(styleNode, ctx.baseThemeNode.nextSibling);
            return;
        } else if (ctx.styleNode && ctx.styleNode !== styleNode) {
            ctx.styleNode.parentNode.insertBefore(styleNode, ctx.styleNode);
            return;
        }

        // Search upward in morph hierarchy ...
        while ((parent = parent.owner)) {
            var parentCtx = parent.renderContext();
            if (parentCtx.styleNode) {
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
                if (mCtx.styleNode && mCtx.styleNode !== styleNode) {
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
        this.setStyleClassNamesHTML(ctx);
        this.setStyleIdHTML(ctx, this.getStyleId());
        this.setNodeMorphIdHTML(ctx);
    },

    setStyleClassNamesHTML: function (ctx) {
        var classNames = this.getStyleClassNames();
        if (classNames && classNames.length && classNames.length > 0) {
            classNames = classNames.join(' ');
            //$(ctx.morphNode).attr('class', classNames);
            $(ctx.shapeNode).attr('class', classNames);
        } else {
            //$(ctx.morphNode).removeAttr('class');
            $(ctx.shapeNode).removeAttr('class');
        }
    },

    setNodeMorphIdHTML: function(ctx) {
        $(ctx.shapeNode).attr('data-lively-morphid', this.id);
    },

    setStyleIdHTML: function (ctx, id) {
        var $node = $(ctx.shapeNode);
        if (id) {
            $node.attr('id', id);
        } else {
            $node.removeAttr('id');
        }
    },

    getIdsForSelector: function(selector) {
        return new lively.morphic.Sizzle()
                   .select(selector, this)
                   .collect(function(m) { return m.id });
    }

});

}) // end of module
