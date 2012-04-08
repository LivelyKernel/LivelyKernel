module('lively.morphic.test2').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {
lively.morphic.Morph.subclass('lively.morphic.test2',
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
            //oRec = new lively.morphic.testText();
            //oRec.addToMorph(this);
        }
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('Time =' + elapsed);

    },
});


}) // end of module