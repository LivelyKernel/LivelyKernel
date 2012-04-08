module('lively.morphic.testsubText').requires('lively.morphic.Core', 'lively.morphic.TextCore','lively.morphic.Halos', 'lively.morphic.Widgets', 'lively.morphic.Styles','lively.morphic').toRun(function() {

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
            //oRec = new lively.morphic.testText();
            //oRec  = new lively.morphic.Text(new Rectangle(20,400, 100, 30), 'abc');
            //oRec.addToMorph(this);
        }
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('Time =' + elapsed);

    },
});

lively.morphic.Morph.subclass('lively.morphic.testText',
'method category', {
    initialize: function($super) {
        //$super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,100,100)));
        $super(new lively.morphic.Text(new Rectangle(20,400, 100, 30), ''));
        //this.textMorph1 = new lively.morphic.Text(new Rectangle(20,400, 100, 30), 'abc');
        this.setFill(Color.red)
    },
     addToMorph: function(oParent) {
        this.oParent = oParent;
        this.oParent.addMorph(this);
    },
});


}) // end of module