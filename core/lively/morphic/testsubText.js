module('lively.morphic.testsubText').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.testsubTextMain',
'method category', {
    initialize: function($super,nNumofRecs) {
        $super();
        this.numofRecs = nNumofRecs;
        this.drawRecs()
        this.setFill(Color.rgb(0,0,255));
    },
    drawRecs: function() {
        var start = new Date().getTime();    
        debugger;
        var oRec;
        
         for (var n= 0; n< this.numofRecs; n++) {
            //oRec = new lively.morphic.testText2();
            //oRec.addToMorph(this);
        }
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('Time =' + elapsed);

    },
});

}) // end of module