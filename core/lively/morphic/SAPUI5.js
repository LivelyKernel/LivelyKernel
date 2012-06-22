module('lively.morphic.SAPUI5').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPUI5.Button',
'initializing', {
    initialize: function($super, isChecked) {
        $super(this.createShape());
    },
    createShape: function() {
        var node = XHTMLNS.create('button');
        node.type = 'checkbox';
        return new lively.morphic.Shapes.External(node);
    },
},
'accessing', {
},
'event handling', {

    onClick: function(evt) {
         if (evt.isCommandKey() || !evt.isLeftMouseButtonDown()) {
            evt.stop()
            return true;
        }
        lively.bindings.signal(this, 'fire', true);
         return true;
     },

},
'serialization', {
    prepareForNewRenderContext: function ($super, renderCtx) {
        $super(renderCtx);

    },
});


}) // end of module