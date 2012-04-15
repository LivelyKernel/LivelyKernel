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
        this.clear();
        this.dataModel = [];

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



}) // end of module