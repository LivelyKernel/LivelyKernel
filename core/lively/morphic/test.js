module('lively.morphic.test').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.testRec',
'method category', {
    initialize: function($super,nNumofRecs) {
        $super();
        this.numofRecs = nNumofRecs;
        this.drawRecs()
    },
    addMorph: function($super, morph) {
        $super(morph);
    },
    drawRecs: function() {
        alert(this.numofRecs);
        var oRec = new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,100,100));

         this.addMorph(oRec);
    },
});

}) // end of module