module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.HTML').toRun(function() {

    Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
        
    });
    lively.morphic.Morph.addMethods(
        'stylesheets', {
            setStyleSheet: function(value) {
                this.shape.setStyleSheet(value);
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
}) // end of module