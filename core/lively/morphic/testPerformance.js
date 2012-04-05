module('lively.morphic.testPerformance').requires().toRun(function() {

 initialize: function($super) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,100,100)))
        this.setFill(Color.red)
    },
    addMorph: function($super, morph) {
        $super(morph);
    },
    newMethod: function() {},

}) // end of module