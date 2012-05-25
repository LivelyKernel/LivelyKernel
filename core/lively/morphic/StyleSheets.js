module('lively.morphic.StyleSheets').requires().toRun(function() {

    lively.morphic.Morph.addMethods(
        'stylesheets', {
	   applyStyleSheet: function(style) {

		this.setNodeId();

		this.shape.setStyleSheet(style);
	   }
        }
    );

    lively.morphic.Shapes.Shape.addMethods(
        'stylesheets', {
            setStyleSheet: function(style) {
		return this.shapeSetter('StyleSheet', style);
            },
            getStyleSheet: function() {
                return this.shapeGetter('StyleSheet') || "";
            },
            
        }
    );



})
