module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.HTML').toRun(function() {

    Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
        
    });
    lively.morphic.Morph.addMethods(
        'stylesheets', {
            setStyleSheet: function(value) {
                this.shape.setStyleSheet(value);
            },
            getDomId: function() {
                // TODO: dont forget to trim the result!
                
            },
            generateAncestorPrefixString: function() {
                var ancestorPrefix = '';
                if (!this.isWorld) {
                    var m = this;
                    while ((m = m.owner)) {
                        ancestorPrefix = '#'+m.getDomId()+
                            ((ancestorPrefix.length > 0) ?
                            (' '+ancestorPrefix) : '');
                    }
                }
                return ancestorPrefix;
            },
            compileStyleSheet: function(rules) {
                // Takes a list of css rules and assembles a style
                // sheet which can be injected into the DOM.
                // If this morph is not the world, the selectors
                // are extended so the rules may not be applied
                // to morphs outside the addressed hierarchy.
                var output = '',
                    ancestorPrefixId = this.generateAncestorPrefixString(),
                    morphPrefixId = '#'+this.getDomId();
                    
                rules.each(function(rule) {
                    
                        var selectors = rule.selectorText().split(
                            /[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/);
                    });
            },
    splitGroupedSelector: function(selector) {
        return selector.
            split(/[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/);
    },

            
        },
        'HTML DOM', {
            setStyleSheetHTML: function(ctx, styleSheet) {
                var morphId = ctx.shapeNode && ctx.shapeNode.id;
                if (!morphId) {
                    //console.log('Warning, morph has no shape node or shape node was not given any id.');
                    return;
                }

                var styleTagId = "style-for-"+morphId;

        	if (ctx.styleNode) {
        	   $(ctx.styleNode).remove();
                }
                if (styleSheet && styleSheet.length > 1) {

            	    //console.log("Setting CSS for shape "+morphId+" to "+value);
                    var specificCss = "#"+morphId+" { "+styleSheet+" }";

                    // syntax fixes for the sap gold reflection css
                    specificCss = specificCss.replace(/[\s]*=[\s]*/g,"=");
                    specificCss = specificCss.replace(/alpha[\s]*\([\s]*opacity[\s]*\:/g,"alpha(opacity=");
                    specificCss = specificCss.replace(".dev-datepicker/jQuery",".dev-datepicker.jQuery");


                    if (less) {
                        new less.Parser().parse(specificCss, function(e, tree) {
                            //console.log(e);
                            specificCss = tree.toCSS();
                        });
                        console.log(specificCss);
                    }


        	        ctx.styleNode = $('<style type="text/css" id="' + styleTagId + '"></style>');
        	        ctx.styleNode.text(specificCss);
        	        ctx.styleNode.appendTo(document.head);

                } else {
                    delete this._StyleSheet;
                }
                
            }
        }
    )
}) // end of module()