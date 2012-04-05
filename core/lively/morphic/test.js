module('lively.morphic.test').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.testRec',
'method category', {
    initialize: function($super,nNumofRecs) {
        $super();
        this.numofRecs = nNumofRecs;
        this.drawRecs()
    },
    drawRecs: function() {
        var start = new Date().getTime();    

        var oRec;
        
         for (var n= 0; n< this.numofRecs; n++) {
            oRec = new lively.morphic.rectMorph();
            this.addMorph(oRec);
        }
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('Time =' + elapsed);
        alert("done adding " + this.numofRecs);
    },
});

lively.morphic.Morph.subclass('lively.morphic.rectMorph',
'method category', {
    initialize: function($super) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,100,100)))
        this.setFill(Color.red)
    }
});



}) // end of module