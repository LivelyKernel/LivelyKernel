module('lively.morphic.GrabShadows').requires('lively.morphic.Events', 'lively.morphic.StyleSheets').toRun(function () {

    Trait('GrabShadowsTrait', 'grabbing', {
        addMorphWithShadow: lively.morphic.HandMorph.prototype.addMorphWithShadow
            .wrap(function (proceed, morph) {
                this.addMorph(morph);
                morph.addStyleClassName('has-grab-shadow-from-handmorph');
            }),
        dropContentsOn: lively.morphic.HandMorph.prototype.dropContentsOn
            .wrap(function (proceed, morph, evt) {
                this.submorphs.each(function(m){
                        m.removeStyleClassName('has-grab-shadow-from-handmorph');
                    });
                return proceed(morph, evt);
            }),
        getStyleSheet: lively.morphic.HandMorph.prototype.getStyleSheet
            .wrap(function(proceed) {
                return (proceed() || '') + ' '
                    + '.has-grab-shadow-from-handmorph '
                    +'{box-shadow: 8px 8px 4px rgba(0,0,0,0.5)}';
            })
    }).applyTo(lively.morphic.HandMorph, {
        override: ['addMorphWithShadow', 'dropContentsOn', 'getStyleSheet']
    })

});