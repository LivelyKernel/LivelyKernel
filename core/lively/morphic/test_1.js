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


        for (var nRow = 0; nRow < aJsArray.length; nRow++) {
		arrColumns=[];
		for (var nCol = 0; nCol < aJsArray[nRow].length ; nCol++) {
                        //arrColumns[nCol]= "";
                        oCell ={}; 
                        oCell.value = aJsArray[nRow][nCol];
                        oCell.annotation = "";
                        oCell.formula = "";
			arrColumns[nCol] = oCell ;
		}
		this.arrData.push(arrColumns);
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