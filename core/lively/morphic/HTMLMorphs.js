module('lively.morphic.HTMLMorphs').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.Table',
'initializing', {
    initialize: function($super, bounds) {
        $super(this.defaultShape());

    },
}
);

}) // end of module