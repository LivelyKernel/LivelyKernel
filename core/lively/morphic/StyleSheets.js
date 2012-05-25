module('lively.morphic.StyleSheets').requires().toRun(function() {

    lively.morphic.Morph.addMethods(
        'stylesheets', {
	   applyStyleSheet: function(style) {

		this.setNodeId();
		var morphId = this.getNodeId();
		
		var specificCss = "#"+morphId+" { "+style+" }";
		var styleTagId = "style-"+morphId;

		var css = $('#' + styleTagId);
		css.remove();
		css = $('<style type="text/css" id="' + styleTagId + '"></style>');
		css.text(specificCss);
		css.appendTo(document.head);
		this.styleSheet = style;
	   }
        }
    )

    lively.morphic.Shapes.shape.addMethods(
        'stylesheets', {
            setStyleSheet: function(style) {
		return this.shapeSetter('StyleSheet', value);
            },
            getStyleSheet: function() {
                return this.shapeGetter('StyleSheet') || "";
            },
            
        }
    )



})
