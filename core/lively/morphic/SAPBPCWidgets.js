module('lively.morphic.SAPBPCWidgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPCheckBox',
'properties', {
    connections: {
        setChecked: {}
    }
},
'initializing', {
    initialize: function($super, isChecked) {
        $super(this.createShape());
        this.setChecked(isChecked);
    },
    createShape: function() {
        var node = XHTMLNS.create('input');
        node.type = 'checkbox';
        return new lively.morphic.Shapes.External(node);
    },
},
'accessing', {
    setChecked: function(bool) {
        this.checked = bool;
        this.renderContext().shapeNode.checked = bool;
        return bool;
    },
},
'testing', {
    isChecked: function() {
        return this.checked;
    },
},
'event handling', {


    onClick: function(evt) {
        // for halos/menus
         if (evt.isCommandKey() || !evt.isLeftMouseButtonDown()) {
            evt.stop()
            return true;
        }
        // we do it ourselves
        this.setChecked(!this.isChecked())
        // evt.stop();
         return true;
     },


},
'serialization', {
    prepareForNewRenderContext: function ($super, renderCtx) {
        $super(renderCtx);
        // FIXME what about connections to this.isChecked?
        // they would be updated here...
        this.setChecked(this.isChecked());
    },
});


}) // end of module