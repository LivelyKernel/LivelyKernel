module('lively.morphic.SAPAdditionalWidgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPFontPicker',
'default category', {
    initialize: function($super) {
        $super();
        this.setFill(Color.rgb(223, 227, 232));
        this.setBorderColor(Color.rgb(177,181,186));
        this.setExtent(lively.pt(200,500));
    },
    initializeUI: function($super) {
        
    },
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },
    

});

}) // end of module