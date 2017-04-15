module('lively.morphic.GrabShadows').requires('lively.morphic.Events', 'lively.morphic.StyleSheetsHTML').toRun(function () {

    Trait('GrabShadowsTrait', 'grabbing', {
        addMorphWithShadow: lively.morphic.HandMorph.prototype.addMorphWithShadow
            .wrap(function (proceed, morph) {
                this.addMorph(morph);
            }),
        compileStyleSheet: lively.morphic.HandMorph.prototype.compileStyleSheet
            .wrap(function(proceed) {
                var cssRules = this.getStyleSheetRules(),
                       grabShadowRule = new lively.morphic.StyleSheetRule(
                        '.HandMorph > .Morph',
                        [new lively.morphic.StyleSheetDeclaration(
                                'box-shadow', ['8px', '8px', '4px', 'rgba(0,0,0,0.5)'],
                                null, true
                            )]
                    );
                cssRules.push(grabShadowRule);
                return proceed(cssRules);
            })
    }).applyTo(lively.morphic.HandMorph, {
        override: ['addMorphWithShadow', 'compileStyleSheet']
    })

});