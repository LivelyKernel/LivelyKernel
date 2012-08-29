module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.StyleSheets', 'lively.morphic.HTML').toRun(function() {

    Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
        setStyleSheet: 'setStyleSheetHTML',
        setStyleClassNames: 'setStyleClassNamesHTML',
        setStyleId: 'setStyleIdHTML',
    });
	
	Object.extend(lively.morphic.Shapes.Shape.prototype.htmlDispatchTable, {
        setAppearanceStylingMode: 'setAppearanceStylingModeHTML',
        setBorderStylingMode: 'setBorderStylingModeHTML',
        getComputedBorderWidth: 'getComputedBorderWidthHTML',
        getComputedExtent: 'getComputedExtentHTML',
    });

    lively.morphic.Shapes.Shape.addMethods(
	'Stylesheets', {
		getComputedBorderWidthHTML: function(ctx) {
			var width = ($(ctx.shapeNode).outerWidth() - $(ctx.shapeNode).width()) / 2;
			return width || 0;
		},
		
		getComputedExtentHTML: function(ctx) {
			if (ctx.shapeNode) {
				var width = $(ctx.shapeNode).outerWidth(),
					height = $(ctx.shapeNode).outerHeight();
				if (height >0 && width >0) {
					return pt(width, height);
				} else {
					return null;
				}
			} else {
				return null;
			}
		},

		setAppearanceStylingModeHTML: function(ctx, value) {
			this.setFillHTML(ctx, this.shapeGetter("Fill"));
			this.setOpacityHTML(ctx, this.shapeGetter("Opacity"));
		},

		setBorderStylingModeHTML: function(ctx, value) {
			this.setBorderHTML(ctx, this.getBorderWidth(), this.getBorderColor(), this.getStrokeOpacity());
			this.setBorderRadiusHTML(ctx, this.getBorderRadius());
		}	
	});
	
	

    Trait('StyleSheetsHTMLTrait',
    'initializing', {
        appendHTML: lively.morphic.Morph.prototype.appendHTML.wrap(function(proceed, ctx, optMorphAfter) {
            proceed(ctx, optMorphAfter);
            this.prepareDOMForStyleSheetsHTML(ctx);
			this.setStyleSheetHTML(ctx, this.getStyleSheet());
        })
    }).applyTo(lively.morphic.Morph, {override: 'appendHTML'});

    lively.morphic.Morph.addMethods(
    'Stylesheets', {

        compileStyleSheet: function(rules) {
            // Takes a list of CSS rules and assembles a style
            // sheet which can be injected into the DOM.
            // If this morph is not the world, the selectors
            // are extended so the rules may not be applied
            // to morphs outside the addressed hierarchy.
            // Helper function for setStyleSheetHTML.

            var output = '';

            rules.each(function(rule) {
                    var selectors = this.splitGroupedSelector(rule.selectorText()),
                        newSelector = '';
                    for (var i = 0; i < selectors.length; i++) {
                        newSelector += this.addSelectorPrefixes(selectors[i]);
                        if (i < selectors.length - 1) {
                            newSelector += ', ';
                        }
                    }
                    output += newSelector + ' {';
                    output += '\n';
                    rule.declarations.each(function(d) {
                            output += '\t'+d.parsedCssText;
                            output += '\n';
                        });
                    output += '}\n';
                }, this);

            return output;
        },
        addSelectorPrefixes: function(selector) {
            // Doubles a selector to include its child and
            // itself and adds an attribute selector prefix.
            // Helper function for compileStyleSheet.

            var extendedSelector = '',
                morphPrefix = '[morphid="'+this.id+'"]',
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
        },

        splitGroupedSelector: function(selector) {
            // Splits a grouped selector and returns
            // its single selectors as an array.
            // Helper function for compileStyleSheet.

            var selectorList = selector.
                    split(/[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/);
            return selectorList.collect(function(s) {
                    return s.trim();
                });
        },

        setStyleSheetHTML: function(ctx, styleSheet) {
            // Compiles the input style rules to an 
            // HTML specific style sheet and adds this
            // to the DOM.
            // Called when a new style sheet was applied to
            // the morph (i.e. through setStyleSheet) and
            // in the initHTML method of the morph.

            var styleTagId = "style-for-"+this.id,
			rules = this.processStyleSheet(styleSheet),
            compiledCss = this.compileStyleSheet(rules);

    	    if (ctx.styleNode) {
                $(ctx.styleNode).remove();
				delete ctx.styleNode;
            }
            if (rules.length && rules.length > 0 &&
                compiledCss && compiledCss.length &&
                compiledCss.length > 0) {
    	       ctx.styleNode = $('<style type="text/css" id="' +
    	           styleTagId + '"></style>').get(0);
    	       $(ctx.styleNode).text(compiledCss);
			   this.appendStyleNodeHTML(ctx, ctx.styleNode);
    	    }
        },
		appendStyleNodeHTML: function(ctx, styleNode) {
			// Adds the morph's style node to the DOM
			// and reflects the morph hierarchy in the
			// node order.
			
			var parent = child = this,
				submorphs = this.submorphs || [];
			
			// Search upward in morph hierarchy ...
			while ((parent = parent.owner)) {
				var parentCtx = parent.renderContext();
				if (parentCtx.styleNode) {
					$(parentCtx.styleNode).after(styleNode);
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
						$(mCtx.styleNode).after(styleNode);
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
						$(mCtx.styleNode).before(styleNode);
						return;
					}
					if (m.submorphs) {
						m.submorphs.each(function(ms) {
								nextLevelSubmorphs.push(ms);
							});
					}
						
				}
				submorphs = nextLevelSubmorphs;
			}
			
			// If appearantly none of the other morphs in the hierarchy
			// have a css applied, just add the stylenode to the head
			document.getElementsByTagName("head")[0].appendChild(styleNode);
		}

    },
    'Style Classes and Ids', {
	
		prepareDOMForStyleSheetsHTML: function(ctx) {
			
			this.setStyleClassNamesHTML(ctx);
            this.setStyleIdHTML(ctx, this.getStyleId());
			$(ctx.shapeNode).attr('morphid', this.id);
		
		},
	
        setStyleClassNamesHTML: function(ctx) {
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
        setStyleIdHTML: function(ctx, id) {
            if (id && id.length && id.length > 0) {
                //$(ctx.morphNode).attr('id', id);
                $(ctx.shapeNode).attr('id', id);
            } else {
                //$(ctx.morphNode).removeAttr('id');
                $(ctx.shapeNode).removeAttr('id');
            }
        },
    }
    );
}
) // end of module