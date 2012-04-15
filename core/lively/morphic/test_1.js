module('lively.morphic.test_1').requires().toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.testPerform',
'method category', {
    initialize: function($super,nNumofRecs) {
        $super();
        this.arrData=[];
        this.numofRecs = nNumofRecs;
        this.drawRecs()
    },
    drawRecs: function() {
        var oRec;
        oRec = new lively.morphic.rectMorph();
        oRec.addToMorph(this);
    },
    setData: function(aJsArray) {
        var nRow;
        var nCol;
        var arrColumns=[];

        for (nRow = 0; nRow < aJsArray.length; nRow++) {
	   for (nCol = 0; nCol < aJsArray[nRow].length ; nCol++) {
		this.arrData[nRow][nCol].value=aJsArray[nRow][nCol];
	   }
	}
       
      
    },
});

lively.morphic.Morph.subclass('lively.morphic.rectMorph',
'method category', {
    initialize: function($super) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,100,100)))
        this.setFill(Color.red)
    },
     addToMorph: function(oParent) {
        this.oParent = oParent;
        this.oParent.addMorph(this);
    },
});

}) // end of module