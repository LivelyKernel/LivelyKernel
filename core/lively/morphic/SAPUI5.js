module('lively.morphic.SAPUI5').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPUI5.Button',

'settings',{
    classes: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnStd',    
    activeClasses: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnAct'
},

'initializing', {
    initialize: function($super, label) {
        this.label = label;
        $super(this.createShape(label));
        this.setNodeClass(this.classes);
    },
    createShape: function(label) {
        var node = XHTMLNS.create('button');
        node.type = 'checkbox';
        if (label) node.innerHTML = label;
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