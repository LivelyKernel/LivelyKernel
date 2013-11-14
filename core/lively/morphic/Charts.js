module('lively.morphic.Charts').requires().toRun(function() {

lively.morphic.Morph.subclass("lively.morphic.Charts.BarChart", {
    initialize: function($super) {
        $super();
        this.setExtent(pt(100, 100));
        this.setFill(Color.black);
        
    },
    
    
} )

}) // end of module