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

			setStyleSheet: function(value) {
				this.setNodeId();
				return this.shape.setStyleSheet(value);
			},
			getStyleSheet: function() {
				var r = this.shape.getStyleSheet();
				this.updateComputedStyles();
                                return r;
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


			setStyleSheet: function(value) {
				return this.shapeSetter('StyleSheet', value);
			},
			getStyleSheet: function() {
				return this.shapeGetter('StyleSheet') || "";
			},

			setAppearanceStylingMode: function(value) {
				return this.shapeSetter('AppearanceStylingMode', value);
			},
			getAppearanceStylingMode: function() {
				return this.shapeGetter('AppearanceStylingMode');
			},

			setBorderStylingMode: function(value) {
				return this.shapeSetter('BorderStylingMode', value);
			},
			getBorderStylingMode: function() {
				return this.shapeGetter('BorderStylingMode');
			},

			updateComputedStyles: function() {
				return this.shapeSetter('ComputedStyles');

			}

            
        }
    );



})
