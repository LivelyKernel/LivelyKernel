module('lively.morphic.StyleSheets').requires().toRun(function() {

    lively.morphic.Morph.addMethods(
        'stylesheets', {
	   applyStyleSheet: function(style) {

		this.setNodeId();

		this.shape.setStyleSheet(style);
            },
               setAppearanceStylingMode: function(value) {
    // TRUE when appearance is styled through style sheets,
    // FALSE when appearance is styled through style dialog
        return this.shape.setAppearanceStylingMode(value);
    },
    getAppearanceStylingMode: function() {
        return this.shape.getAppearanceStylingMode();
    },

    setBorderStylingMode: function(value) {
    // TRUE when border is styled through style sheets,
    // FALSE when border is styled through style dialog
        return this.shape.setBorderStylingMode(value);
    },
    getBorderStylingMode: function() {
        return this.shape.getBorderStylingMode();
    },

    
    updateComputedStyles: function() {
        return this.shape.updateComputedStyles();

    },
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
