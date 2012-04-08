module('lively.morphic.test2').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {
lively.morphic.Morph.subclass('lively.morphic.test2',
'method category', {
    initialize: function($super,nNumofRecs) {
        $super();
        this.numofRecs = nNumofRecs;
        this.addTextField()
    },
    addTextField: function() {
        var start = new Date().getTime();    

        var oRec;
        
         for (var n= 0; n< this.numofRecs; n++) {
            oRec = new lively.morphic.testText();
            oRec.addToMorph(this);
        }
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('Time =' + elapsed);
        alert("done Time to add " +  this.numofRecs + " rectangles took "+ elapsed + " sec.");
    },
});

lively.morphic.Text.subclass('lively.morphic.testText',
'method category', {
    initialize: function($super,arg1, arg2) {
        $super(arg1, arg2);
        this.setFill(Color.rgb(255, 255, 225));
        this.setBorderColor(Color.rgb(0,0,0));
    },
     addToMorph: function(oParent) {
        this.oParent = oParent;
        this.oParent.addMorph(this);
    },
});


}) // end of module