module('lively.morphic.SAPWorkSheet').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles','users.robertkrahn.MassMorphCreation').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPGrid',
'initialization', {
    initialize: function($super, numCols, numRows) {
        $super();
        this.defaultCellHeight = 30;
        this.defaultCellWidth = 120;
        this.borderSize = 50;
        this.colNames = new Array(numCols);
        this.numCols = numCols;
        this.numRows = numRows;
        this.oAnnotation = null;
        
         //for smart scroll feature
        this.prviousScrollValue=0;  //saving vertical scroll value
        this.prviousScrollColValue=0; //saving horizontal scroll value
        this.maxEmptyRowtoCreate = 200;
        this.maxEmptyColumntoCreate = 50;
        this.defaultMaxRowScrollValue = 100;
        this.defaultMaxColScrollValue = 100;
        this.arrData=[];
        this.startRow = 0;      //org start row
        this.endRow = numRows;        //org end row

        this.startColumn = 0;    //org start column
        this.endColumn = numCols;      //org end column
    
        this.vScroll = null;
        this.hScroll = null;

        this.activeCellContent = '';
        this.initializeData();
        this.initializeMorph();
        this.initializeScrolls();
        this.initializeAnnotation();

    },
    initializeScrolls: function() {

        var start = new Date().getTime();
        var nXPos = this.defaultCellWidth * this.numCols;
        var nYPos = this.defaultCellHeight;
        var nHeight = this.defaultCellHeight * this.numRows;
      




        this.vScroll = new lively.morphic.Slider(new Rectangle(nXPos ,nYPos, 15,nHeight ), this.defaultMaxRowScrollValue);
        this.addMorph(this.vScroll);

        this.hScroll  = new lively.morphic.Slider(new Rectangle(0,nHeight + this.defaultCellHeight , nXPos,15), this.defaultMaxColScrollValue);
        this.addMorph(this.hScroll );

        connect(this.vScroll, "value", this, "updateRowDisplay", {});
        connect(this.hScroll , "value", this, "updateColumnDisplay", {});
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('End initializeScrolls=' + elapsed);
    },
    getLayoutableSubmorphs: function() {
        return this.submorphs;
    },
    updateDataModel: function() {
        this.clear();
        this.dataModel = [];
        var nRow;
        var nCol;
        var arrColumns=[];
        for (nRow = this.startRow; nRow < this.endRow; nRow++) {
            arrColumns=[];
            for (nCol = this.startColumn; nCol < this.endColumn; nCol++) {
                arrColumns[nCol-this.startColumn] = this.arrData[nRow][nCol];
	   }
           this.dataModel.push(arrColumns);
        }
        console.log("updateDataModel");
        //debugger;
        this.updateDisplay();
    },
    //fires when horizontal scroll moves
    updateColumnDisplay: function(evt) {
        if (isNaN(evt)){
            console.log("updateColumnDisplay: NaN= " + evt);
            return;
        }
        this.hideAnnotation();
        //ignore decimal point
        var nScrollValue= parseInt(evt); 

        if (this.prviousScrollColValue!=nScrollValue){
            this.prviousScrollColValue= nScrollValue;
            
            this.startColumn = nScrollValue;
            this.endColumn = this.startColumn + this.numCols;
            
            if (this.endColumn > this.arrData[0].length){
                this.expandColumns(this.endColumn);
            }
            //debugger;
            for (var nCol = this.startColumn; nCol < this.endColumn; nCol++) {
                this.colHeads[nCol-this.startColumn].textString = this.colNames[nCol];
            }
            
            this.updateDataModel();
              //I need to rework this
    
            if (nScrollValue==this.hScroll.valueScale){
                this.hScroll.valueScale = nScrollValue + 50;
                this.hScroll.setValue(nScrollValue + 45);
                this.updateColumnDisplay(nScrollValue + 45);
                
            }
            
        }
        
    },
    //fires when vertical scroll moves
    updateRowDisplay: function(evt) {
       //debugger;
        
        this.hideAnnotation();
        if (isNaN(evt)){
            console.log("updateRowDisplay: NaN= " + evt);
            return;
        }
        //ignore decimal point
        var nScrollValue= parseInt(evt);//.toFixed(2);
        if (this.prviousScrollValue !=nScrollValue){
            this.prviousScrollValue = nScrollValue;
           
            this.startRow = nScrollValue;
            this.endRow = this.startRow + this.numRows;

            if (this.endRow> this.arrData.length){
                this.expandRows();
            }
            this.updateDataModel();

            //if scroll reached end we need to increase??
            // I need to rework this
            if (nScrollValue==this.vScroll.valueScale){
               this.vScroll.valueScale = nScrollValue + 50;
               this.vScroll.setValue(nScrollValue + 45);
               this.updateRowDisplay(nScrollValue + 45);
            }
            
        }

    },
    initializeAnnotation: function() {
        var start = new Date().getTime();
        this.oAnnotation= new lively.morphic.SAPGridAnnotation();
        this.oAnnotation.doitContext = this;
        this.oAnnotation.setExtent(lively.pt(200,100));
        this.oAnnotation.addToGrid(this);
        this.oAnnotation.setVisible(false);
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('End initializeAnnotation=' + elapsed);
    },
    initializeData: function() {
        var start = new Date().getTime();
        this.rows = [];
        this.dataModel = [];
        this.addScript(function renderFunction(value) { return value; });
        
        this.createEmptyCells();


        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('End initializeData '  + elapsed);
    },
    initializeMorph: function() {
        var start = new Date().getTime();    
        this.setExtent(pt(
            this.numCols * this.defaultCellWidth  + 2 * this.borderSize,
            this.numRows * this.defaultCellHeight + 2 * this.borderSize));
        this.setFill(Color.rgb(255,255,255));
        if (!this.hideColHeads) {
            this.createColHeads();
        }
        this.createCells();
        this.createLayout();
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('End initializeMorph=' + elapsed);
    },
    //expand column data when moving scroll
    expandColumns: function(nDataLength) {
        var start = new Date().getTime();    
        //debugger;
        var nStartColumn = this.arrData[0].length;
        var nEndColumn =nStartColumn + this.maxEmptyColumntoCreate;
        if (nEndColumn < nDataLength ){
            nEndColumn = nDataLength ;
        }
        
        //Expend column names
        for (var nCol = nStartColumn ; nCol < nEndColumn ; nCol++) {
            this.colNames.push('Col' + nCol);
        }

        //Expend column cell
        for (var nRow = 0; nRow < this.arrData.length; nRow++) {
		for (var nCol = nStartColumn ; nCol < nEndColumn ; nCol++) {
                        oCell ={}; 
                        oCell.value = "";
                        oCell.annotation = "";
                        oCell.formula = "";
                        this.arrData[nRow][nCol] = oCell ;
		}
	}

        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('expandColumns=' + elapsed);
    },
    expandRows: function(nDataLength) {
        //create this.maxEmptyRowtoCreate
        if(typeof nDataLength == 'undefined') {
            nDataLength = 0;
        }
        //debugger;
        var oCell={};
        var arrColumns;
        var nStartRow = this.arrData.length;
        var nEndRow = nStartRow + this.maxEmptyRowtoCreate;
        
        var nStartColumn=0;
        var nEndColumn = this.arrData[0].length;//nStartColumn + this.maxEmptyColumntoCreate;


        if (nEndRow < nDataLength ){
            nEndRow  = nDataLength ;
        }
        
        for (var nRow = nStartRow ; nRow < nEndRow ; nRow++) {
		arrColumns=[];
		for (var nCol = nStartColumn; nCol < nEndColumn; nCol++) {
                        oCell ={}; 
                        oCell.value = "";
                        oCell.annotation = "";
                        oCell.formula = "";
			arrColumns[nCol] = oCell ;
		}
		this.arrData.push(arrColumns);
	}
    },
    createEmptyCells: function() {

        var oCell={};
        var arrColumns;
       
        for (var nRow = 0; nRow < this.maxEmptyRowtoCreate; nRow++) {
		arrColumns=[];
		for (var nCol = 0; nCol < this.maxEmptyColumntoCreate; nCol++) {
                        oCell ={}; 
                        oCell.value = "";
                        oCell.annotation = "";
                        oCell.formula = "";
			arrColumns[nCol] = oCell ;
		}
		this.arrData.push(arrColumns);
	}
    },
    createCells: function() {
        var headOffset = this.hideColHeads ? 0 : 1;

        var start = new Date().getTime();

        var self = this,
            cells = lively.morphic.Morph.createN(this.numRows * this.numCols, function() {
                return self.createCellOptimized();
            });
//debugger;
        for (var y = 0; y < this.numRows; y++) {
            var row = [];
            for (var x = 0; x < this.numCols; x++) {
                var cell = cells.pop();
                cell.addToGrid(this);
                cell.gridCoords = pt(x, y + headOffset);
                cell.name = '[' + x + ';' + y + ']';
                row.push(cell);
            }
            this.rows.push(row);
        }

        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('End createCells =' + elapsed);
    },
    createCellOptimized: function() {
        var cell = new lively.morphic.SAPGridCell();
        cell.doitContext = this;
        cell.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
        return cell;
    },
    createCell: function(x, y, headOffset) {

        var cell = new lively.morphic.SAPGridCell();
        cell.doitContext = this;
        cell.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
        cell.addToGrid(this);
        cell.gridCoords = pt(x, y + headOffset);
        cell.name = '[' + x + ';' + y + ']';
        return cell;
    },

    createColHeads: function() {
        this.colHeads = [];
        for (var i = 0; i < this.numCols; i++) {
            this.colNames[i]='Col' + i;
            var head = this.createColHead(i,this.colNames[i]);
            this.colHeads.push(head);
        }
    },
    createColHead: function(index, title) {
        var head = new lively.morphic.SAPGridColHead();
        head.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
        head.addToGrid(this);
        head.gridCoords = pt(index, 0);
        //head.name = title ? title : '[' + index + ']';
        head.name = title ? title : 'Col' + index;
        head.textString = head.name;
        return head;
    },


    createLayout: function() {
               var start = new Date().getTime();
        var head = this.hideColHeads ? 0 : 1;

        //debugger;

        console.log(this.numCols + "," + this.numRows + "," + head )
        //this is optimize code but if we use this it adds header to rows so it messup
        //var layouter = new lively.morphic.Layout.GridLayout(this, this.numCols, this.numRows + head);
        //this.setLayouter(layouter);
        //layouter.rows = this.rows;

	this.setLayouter(new lively.morphic.Layout.GridLayout(this, this.numCols, this.numRows + head));



        this.applyLayout();
        
        
var elapsed = new Date().getTime() - start;
elapsed = elapsed/1000;
console.log('End createLayout =' + elapsed);
    },
    setAnnotation: function(nColumn,nRow,sText) {
        //this.at(nColumn,nRow).annotation = sText;

        var nOrgRow = nRow;
        var nOrgCol = nColumn;

        this.arrData[nOrgRow][nOrgCol].annotation = sText;

        
    },

 showAnnotation: function(nColumn,nRow) {
        
        var nOrgRow = nRow  + this.startRow;
        var nOrgCol = nColumn + this.startColumn;
        //var sAnnotation = this.at(nColumn,nRow).annotation;
        sAnnotation  = this.arrData[nOrgRow][nOrgCol].annotation


        this.oAnnotation.setVisible(true);
        if (sAnnotation){
            this.oAnnotation.textString = sAnnotation ;
        }else{
            this.oAnnotation.textString = '';
        }
        
        this.oAnnotation.nColumn=nColumn;
        this.oAnnotation.nRow=nRow;
        this.oAnnotation.setPosition(this.at(nColumn,nRow).getPosition());

    },
    hideAnnotation: function() {
        this.oAnnotation.setVisible(false);
    },

    at: function(x, y) {
        return this.rows[y][x];
    },
    atPut: function(x, y, value) {
        //debugger;
        console.log("SAPGrid.atPut: x=" + x + ", y=" + y + ", value=" + value );
        this.rows[y][x].textString = value;
    },
    clear: function() {
        for (var y = 0; y < this.numRows; y++) {
            for (var x = 0; x < this.numCols; x++) {
                this.rows[y][x].textString = '';
                this.rows[y][x].evalExpression = undefined;
            }
        }
    },

    onUpPressed: function(evt) {
        this.moveActiveCellBy(pt(0,-1));
        evt.stop();
    },
    onDownPressed: function(evt) {
        this.moveActiveCellBy(pt(0,1));
        evt.stop();
    },
    onLeftPressed: function(evt) {
        //testing cell text is focused or not 
    console.log("SAPGrid.onLeftPressed");
        if (!this.activeCell) {
         }else{
              //alert(this.activeCell.isFocused())
         }
        this.moveActiveCellBy(pt(-1,0));
        evt.stop();
    },
    onRightPressed: function(evt) {
        this.moveActiveCellBy(pt(1,0));
        evt.stop();
    },


    moveActiveCellBy: function(aPoint) {
        if (!this.activeCell) {
            this.at(0,0).activate();
            return;
        }
        var curX = this.getActiveColIndex(),
            curY = this.getActiveRowIndex(),
            newX = curX + aPoint.x,
            newY = curY + aPoint.y;
        if (this.numRows > newY  && this.numCols > newX &&
                newY >= 0 && newX >= 0) {
            this.at(curX + aPoint.x, curY + aPoint.y).activate();
        }
    },

    setAnnotationData: function(arrNotes) {
        for (var i = 0; i < arrNotes.length; i++) {
            //this.at(arrNotes[i].nColumn ,arrNotes[i].nRow ).annotation= arrNotes[i].sNote;
            //this.at(arrNotes[i].nColumn ,arrNotes[i].nRow ).annotationCell();
            //this.at(arrNotes[i].column,arrNotes[i].row ).annotation= arrNotes[i].note;
            //this.at(arrNotes[i].column,arrNotes[i].row ).annotationCell();
            //this.arrData[arrNotes[i].row][arrNotes[i].column].annotation = arrNotes[i].note;
            this.setAnnotation(arrNotes[i].column,arrNotes[i].row,arrNotes[i].note);
        }
        this.updateDisplay();
    },

    setData: function(aJsArray) {
        this.clear();
        this.dataModel = [];

        var nRow;
        var nCol;
        var arrColumns=[];
        //debugger;
        //saving to global empty data
        var start = new Date().getTime();
//debugger;
        /*this.createEmptyCells(aJsArray.length);

        for (nRow = 0; nRow < aJsArray.length; nRow++) {
	   for (nCol = 0; nCol < aJsArray[nRow].length ; nCol++) {
		this.arrData[nRow][nCol].value=aJsArray[nRow][nCol];
	   }
	}
        */
        this.arrData = aJsArray;
        //i need to rework this
        
        if (this.arrData.length > this.defaultMaxRowScrollValue){
            this.vScroll.valueScale = this.arrData.length;
        }
        if (this.arrData[0].length > this.defaultMaxColScrollValue){
            this.hScroll.valueScale = this.arrData[0].length;
        }


        //create header
           //Expend column names
            //this.colNames
        //debugger;
        var nEndColumn = this.numCols;
        if (this.arrData[0].length > this.numCols){
            nEndColumn  = this.arrData[0].length;
            for (var nCol = this.numCols; nCol < nEndColumn ; nCol++) {
                this.colNames.push('Col' + nCol);
            }
        }
    
        var nDataRowLength = this.arrData.length;
        var nDataColLength = this.arrData[0].length;
        //bug when data range is less than default row and column length.
        //need to add code here
        

        //saving only visible row/column to dataModel
        for (nRow = 0; nRow < this.numRows; nRow++) {
            arrColumns=[];
            for (nCol = 0; nCol < this.numCols; nCol++) {
                arrColumns[nCol] = this.arrData[nRow][nCol];
	    }
            this.dataModel.push(arrColumns);
	}
        
        /*var that = this;
        aJsArray.forEach(function(ea) {
            if (ea.constructor.name === 'Array') {
                that.dataModel.push(ea);
                return;
            }
            var row = that.createDataRowFromObject(ea);
            that.dataModel.push(row);
        });*/
        this.updateDisplay();
        var elapsed = new Date().getTime() - start;
	elapsed = elapsed/1000;
	console.log('End setData=' + elapsed);
    },
    getDataObjects: function() {
        var that = this;
        return this.rows.map(function(ea){
            var obj = {};
            for (var i = 0; i < that.numCols; i++) {
                if (that.colNames[i] != undefined) {
                    obj[that.colNames[i]] = ea[i].getContent();
                }
            }
            return obj;
        });
    },
    getDataArrObjects: function() {
        var that = this;
        return this.rows.map(function(ea){
            var arrColumns = [];
 //debugger;
            for (var i = 0; i < that.numCols; i++) {
                //if (that.colNames[i] != undefined) {
                 
		  arrColumns[i]= ea[i].getContent();
                    //obj[that.colNames[i]] = ea[i].getContent();
                //}
            }
            return arrColumns;
        });
    },
    createDataRowFromObject: function(anObject) {
        var row = [],
            names = this.getColNames();
        
        if (names.select(function(ea) {return ea != undefined}).length == 0) { 
            //col names have not been set
            for (var prop in anObject) {
               row.push(anObject[prop]);
            }
        } else {
            var i;
            row = new Array(this.numCols);
            for (i = 0; i < row.length; i++) {row[i] = ''};
            for (i = 0; i < names.length && i < this.numCols; i++) {
                if (names[i] in anObject) {
                    row[i] = anObject[names[i]];
                }
            }            
        }
        return row;
    },


    updateDisplay: function() {

        var nOrgRow;
        var nOrgCol;
        var sValue;
//debugger;
//var start = new Date().getTime();
        for (var y = 0; y < this.dataModel.length &&
                y < this.numRows; y++) {
            for (var x = 0; x < this.dataModel[y].length &&
                    x < this.numCols; x++) {
                nOrgRow = y  + this.startRow;
                nOrgCol = x + this.startColumn;
//console.log("nOrgRow ,nOrgCol =" + nOrgRow + "," +nOrgCol );
                
                sValue = this.dataModel[y][x].value.toString();

                if (this.arrData[nOrgRow][nOrgCol].annotation){
                    this.at(x,y).annotationCell();
                }else{
                    this.at(x,y).deactivateCell();
                }
                
                if (this.arrData[nOrgRow][nOrgCol].formula){
                    sValue = this.parseFormula(this.arrData[nOrgRow][nOrgCol].formula);
                    this.at(x,y).formulaCell();
                    this.at(x,y).setToolTip('Formula: \n' + this.arrData[nOrgRow][nOrgCol].formula);
                    this.at(x,y).setBorderStyle("dotted");
                }else{
                    this.at(x,y).setToolTip("");
                    this.at(x,y).setBorderStyle("solid");
                }


               
                /*
                if (sValue.charAt(0)=="="){
                    console.log('updateDisplay: x,y'  + x + ", " + y);
                    //this.at(x,y).cellformula = sValue;
                    this.at(x,y).setToolTip('Formula: \n' + sValue);
                    this.at(x,y).setBorderStyle("dotted");
                    sValue = this.parseFormula(sValue);
                }else{
                    this.at(x,y).setToolTip("");
                }*/
                this.at(x,y).textString = sValue;
            }
        }
        //debugger;
        if (this.activeCell) {
            this.activeCellContent = this.activeCell.getContent();
        }
//var elapsed = new Date().getTime() - start;
//console.log('updateDisplay:'  + elapsed/1000);
    },
/*
    onKeyDown: function($super, evt) {

    console.log("SAPGrid.onKeyDown");
        //debugger;
        if (!this.activeCell) {
           
        }else{
            //alert(this.activeCell.isFocused())
        }
        $super(evt);
    },*/
/*
    onKeyPress: function($super,evt) {
        console.log("SAPGrid.onKeyPress");
//debugger;
        if (this.oAnnotation.isVisible()){
            this.oAnnotation.onKeyPress(evt);
             evt.stop(); 
        }else{
            if (!this.activeCell) {
                this.at(0,0).activate();
            }
            this.activeCell.onKeyPress(evt);
              evt.stop(); 
        }

        
    },*/
    /*onBackspacePressed: function(evt) {
        if (!this.activeCell) {
            this.at(0,0).activate();
        }
        this.activeCell.onBackspacePressed(evt);
        return true;
    },*/
    onEnterPressed: function($super, evt) {
        //Hak March27 2012:  calculate formula
        if (this.activeCell !=null){
            var sValue = this.activeCell.textString;
            console.log("SAPGrid.onEnterPressed sValue=" + sValue );
            if (sValue .charAt(0)=="="){
                var nColumn = this.getActiveColIndex();
                var nRow= this.getActiveRowIndex();

                var nOrgRow = nRow  + this.startRow;
                var nOrgCol = nColumn+ this.startColumn;
                


                this.arrData[nOrgRow][nOrgCol].formula = sValue; 
 console.log("SAPGrid.onEnterPressed nOrgCol,nOrgRow ,sValue =" + nOrgCol+ ", " + nOrgRow + ", " + sValue);
//debugger;
                this.activeCell.textString=this.parseFormula(sValue);
                //'Formula \n test'
                this.activeCell.setToolTip('Formula: \n' + sValue);
                //this.activeCell.cellformula = sValue;
                
                this.activeCell.setBorderStyle("dotted");
                
            }

        }
        this.onDownPressed(evt);
        return true;
    },
    onTabPressed: function($super, evt) {
        this.onRightPressed(evt);
        return true;
    },



    setActiveCellContent: function(aString) {
        if (!this.activeCell) {
            this.at(0,0).activate(); 
        }
        this.activeCell.textString = aString;
    },
    evaluateExpression: function(anExpression) {
        try {
            return (eval("(function() { \
                var that = this; \
                var cell = function(x,y) {return that.at(x,y).getContent();}; \
                return " + anExpression + ";})").bind(this)) ();
        } catch (e) {
            return 'ERROR';
        }
    },
    setColWidth: function(colIndex, newWidth) {
        for (var i = 0; i < this.rows.length; i++) {
            var curCell = this.rows[i][colIndex];
            curCell.setExtent(pt(newWidth, curCell.getExtent().y));
        }
    },
    setColNames: function(anArray) {
        this.colNames = anArray;
    //debugger;
        for (var i = 0; i < this.colHeads.length; i++) {
            if (i < anArray.length) {
                this.colHeads[i].textString = anArray[i];
            } else {
                this.colHeads[i].textString = '';
            }
        }
    },
    getColNames: function() {
        return this.colNames;
    },

    setColName: function(colIndex, aString) {
        this.colNames[colIndex] = aString;
    },
    getColHead: function(anInteger) {
        return this.colHeads[anInteger];
    },



    recalculateRowsFirst: function() {
        this.rows.forEach(function (row) {
            row.forEach(function (col) {
                col.updateDisplay();
            });
        });
    },
    getActiveRowObject: function() {
        var activeRow = this.getActiveRow(),
            result = {};
        for (var i = 0; i < this.numCols && i < this.colNames.length; i++) {
            if (this.colNames[i]) {
                var value = activeRow[i].getContent();
                //if (activeRow[i].__secretHiddenValue) {
                //       // FIXME this will be gone once we have refactored the data model
                //    value = activeRow[i].__secretHiddenValue;
                //}
                result[this.colNames[i]] = value;
            }
        }
        return result;
    },
    getActiveRowIndex: function() {
        return this.activeCell.gridCoords.y - (this.hideColHeads ? 0 : 1);
    },
    getActiveColIndex: function() {
        return this.activeCell.gridCoords.x;
    },

    getActiveRow: function() {
        return this.rows[this.getActiveRowIndex()];
    },
    getActiveColName: function() {
        return this.colNames[this.getActiveColIndex()];
    },

    addCol: function(colName) {
        this.colNames.push(undefined);
        var realColName = (colName && typeof(colName) == 'string') ? colName : undefined;
        this.colNames[this.numCols] = realColName;
        
        if (!this.hideColHeads) {
            var head = this.createColHead(this.numCols, realColName);
            this.colHeads.push(head);
        }
        for (var i = 0; i < this.numRows; i++) {
            var cell = this.createCell(this.numCols, i, this.hideColHeads ? 0 : 1);
            this.rows[i].push(cell);
        }
        this.numCols++;
        this.createLayout();
    },
    addRow: function() {
    //debugger;
        var row = [];
        for (var i = 0; i < this.numCols; i++) {
            var cell = this.createCell(i, this.numRows, this.hideColHeads ? 0 : 1);
            row.push(cell);
        }
        this.rows.push(row);
        this.numRows++;
        this.createLayout();
    },
    removeCol: function() {
        var lastColIndex = this.numCols - 1;
//debugger;
        this.rows.map(function(ea) {
            return ea[lastColIndex];}).
                forEach(function(ea) {
                    delete ea.gridCoords;
                    ea.remove();});
        this.rows.forEach(function(ea) {
            ea.pop();});

        delete this.colHeads[lastColIndex].gridCoords;
        this.colHeads[lastColIndex].remove();
        this.colHeads.pop();
        while (this.colNames.length > lastColIndex) {
            this.colNames.pop();
        }
        
        this.numCols--;
        this.createLayout();
//Hak March 26 2012 reset height.
        var that=this;
        this.rows.map(function(ea){
            for (var i = 0; i < that.numCols; i++) {
               if (ea[i]!=null){
                    ea[i].setExtent(pt(that.defaultCellWidth, that.defaultCellHeight));
                }
            }
        });
        for (var i = 0; i < this.numCols; i++) {
            if (this.colHeads[i]!=null){
                this.colHeads[i].setExtent(pt(that.defaultCellWidth, that.defaultCellHeight));
            }
        }
//Hak March 26 2012 reset height done.

    },
    removeRow: function() {
        var lastRowIndex = this.numRows - 1;
        this.rows[lastRowIndex].forEach(function(ea) {
            delete ea.gridCoords;
            ea.remove();});
        this.rows.pop();
        this.numRows--;
        this.createLayout();
        var that=this;
        this.rows.map(function(ea){
            for (var i = 0; i < that.numCols; i++) {
               if (ea[i]!=null){
                    ea[i].setExtent(pt(that.defaultCellWidth, that.defaultCellHeight));
                }
            }
        });

    },
/*
Hak March 27 2012.
we need smart parser!! this is for POS only
currently only support 
=AVERAGE(E3:E7)
=SUM(E3:E6)
=E3
*/
    parseFormula: function(sValue) {	
        var arrValue;
        var nTotal = 0;
        var nAve = 0;
    	var nValue; 
        
        //debugger;
        if (sValue){
        
            sValue = sValue.toUpperCase();
            if (sValue.substr(0,5)=="=SUM("){
                arrValue= sValue.replace(/=SUM\(/g, "").replace(/\)/g,"").split(":");
                var oStartCell = this.parseformulaCellIndex(arrValue[0]);
                var oEndCell = this.parseformulaCellIndex(arrValue[1]);

	       //summing vertically
                if (oStartCell.columnIndex==oEndCell.columnIndex){
                    for (var nRow = oStartCell.rowIndex; nRow <= oEndCell.rowIndex; nRow ++) {
                        
                        nValue = parseFloat(this.arrData[nRow][oStartCell.columnIndex].value);
                        //nValue = parseFloat(this.at(oStartCell.columnIndex,nRow).textString);
		        if (isNaN(nValue)) {nValue=0}
		        nTotal  +=nValue;
		    }
	       }else{//summing horizontally
                    for (var nCol = oStartCell.columnIndex; nCol <= oEndCell.columnIndex; nCol ++) {
						
		      }
                }
                return nTotal;  
            }else if(sValue.substr(0,9)=="=AVERAGE("){
                arrValue= sValue.replace(/=AVERAGE\(/g, "").replace(/\)/g,"").split(":");
                var oStartCell = this.parseformulaCellIndex(arrValue[0]);
                var oEndCell = this.parseformulaCellIndex(arrValue[1]);
                var nCount=0;
                if (oStartCell.columnIndex==oEndCell.columnIndex){
                    for (var nRow = oStartCell.rowIndex; nRow <= oEndCell.rowIndex; nRow ++) {
                        
                        nValue = parseFloat(this.arrData[nRow][oStartCell.columnIndex].value);
		        if (isNaN(nValue)) {nValue=0}
		        nTotal  +=nValue;
                        nCount +=1;
		    }
                    nAve = parseInt(nTotal/nCount)
	       }else{//summing horizontally
                    for (var nCol = oStartCell.columnIndex; nCol <= oEndCell.columnIndex; nCol ++) {
						
		      }
                }
                return nAve;	
	   }else{  //copying other cell
                var oCell = this.parseformulaCellIndex(sValue.replace(/=/g, ""));
               
                nValue =  parseFloat(this.arrData[oCell.rowIndex][oCell.columnIndex].value);
                return nValue; 
	   }		
        }
    return 255;
    },
    parseformulaCellIndex: function (sValue){
        var oIndex={};
	var sRow = sValue.replace(/[A-Za-z]/g,'');
	var sCol = sValue.replace(sRow,'');
	var instruct = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var sNewCol = '';
		
	for (var i=0; i<sCol.length; i++) {
	   var n = instruct.indexOf(sCol[i]);
	   if (n == -1) { sNewCol += sCol[i]; } else { sNewCol += n.toString(); }
	}
		
	oIndex.columnIndex = sNewCol;
	oIndex.rowIndex = sRow;
	return oIndex;
    },
    morphMenuItems: function ($super) {
        var items = $super();
        items.push(['+ column', this.addCol.bind(this)]);
        items.push(['- column', this.removeCol.bind(this)]);
        items.push(['+ row', this.addRow.bind(this)]);
        items.push(['- row', this.removeRow.bind(this)]);
        return items;
    },
});


lively.morphic.Text.subclass('lively.morphic.SAPGridCell',
'default category', {
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
        this.setBorderColor(Color.rgb(177,181,186));
        this.setFill(Color.rgb(255, 2550, 255));
        //this.cellformula='';
        //this.annotation='';//maybe we need array object to save more than one
    },
    activate: function() {
        if (this.grid.activeCell) {
            this.grid.activeCell.deactivate();
        }    
        this.grid.activeCell = this;
        this.grid.activeCellContent = this.textString;
        this.setBorderColor(Color.red);
        this.setBorderWidth(2);
        //this.displayExpression();
    },
    deactivate: function() {
        console.log("deactivate ")
        if (this.grid.activeCell !== this) {    
            
            return;
        }
        this.grid.activeCell = null;
        this.setBorderColor(Color.rgb(177,181,186));
        this.setBorderWidth(1);
        //this.updateEvalExpression();
        //this.updateDisplay();
        //this.grid.recalculateRowsFirst();
        //debugger;
        if (this.hasAnnotation()){
	   this.annotationCell();
	}
        if (this.hasFormula()){
	   this.formulaCell();
	}
    },
    hasAnnotation: function() {
        var bResult = false;
        var nCol= this.gridCoords.x;
        var nRow = this.gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
        
        var nOrgRow = nRow + this.grid.startRow;
        var nOrgCol = nCol+ this.grid.startColumn;


        if (this.grid.arrData[nOrgRow][nOrgCol].annotation){
            bResult = true;
        }
        return bResult
    },
    hasFormula: function() {
        var bResult = false;
        var nCol= this.gridCoords.x;
        var nRow = this.gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
        var nOrgRow = nRow + this.grid.startRow;
        var nOrgCol = nCol+ this.grid.startColumn;

        if (this.grid.arrData[nOrgRow][nOrgCol].formula){
            bResult = true;
        }
        return bResult
    },
    deactivateCell: function() {
        this.grid.activeCell = null;
        this.setBorderColor(Color.rgb(177,181,186));
        this.setBorderWidth(1);
        //this.updateEvalExpression();
        //this.updateDisplay();
        //this.grid.recalculateRowsFirst();
    },
    annotationCell: function() {
        this.setBorderColor(Color.orange);
        this.setBorderWidth(1);
    },
    formulaCell: function() {
        this.setBorderColor(Color.green);
        this.setBorderWidth(1);
    },
    onMouseDown: function (evt) {
        console.log('SAPGridCell.onMouseDown')
        this.grid.hideAnnotation();
        if (evt.isLeftMouseButtonDown()) {
            this.activate();
        }
    },
    onDoubleClick: function (evt) {
        //if (this.annotation){
            var nCol= this.gridCoords.x;
            var nRow = this.gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
            
            console.log("onDoubleClick [" + nCol + ", "+ nRow + "]");
	    this.grid.showAnnotation(nCol,nRow);
	//}
    },

    put: function(aValue) {
        // TODO: check if aValue starts with =, then evaluate it or not
        debugger;
        this.textString = aValue;
    },
    onKeyUp: function($super, evt) {

        console.log("SAPGridCell.onKeyUp: "  + this.textString);
        var nCol= this.gridCoords.x;
        var nRow = this.gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
        nRow  = nRow  + this.grid.startRow;
        nCol = nCol + this.grid.startColumn;
        
        this.grid.arrData[nRow][nCol].value=this.textString;

        $super(evt);
    },
    /*onKeyPress: function($super, evt) {
        console.log("SAPGridCell.onKeyPress: " + this.textString );  
        $super(evt);
         
        //this.textString += String.fromCharCode(evt.getKeyCode());
    },*/
    /*
    onBackspacePressed: function($super, evt) {
        $super(evt);
        if (!this.textString) {
            evt.stop(); 
            return true; 
        }
        this.textString = this.textString.substring(0, this.textString.length-1);
        evt.stop();
    },*/
    initialize: function($super, arg) {
        $super(arg);
        this.evalExpression = undefined;
        //this.cellformula='';
        //this.annotation='';//maybe we need array object to save more than one
    },
    updateDisplay: function() {
        if (this.evalExpression !== undefined) {
            this.textString = this.grid.evaluateExpression(this.evalExpression);
        }
    },
    updateEvalExpression: function() {
        if (this.textString.substring(0,1) === '=') {
            this.evalExpression = this.textString.substring(1);
            //this.textString = this.grid.evaluateExpression(this.textString.substring(1));
        } else {
            this.evalExpression = undefined;
        }
    },

    displayExpression: function() {
        if (this.evalExpression !== undefined) {
            this.textString = '=' + this.evalExpression;
        }
    },
    getContent: function() {
        var content = this.textString,
            floatValue = parseFloat(content);
        if (isNaN(floatValue)) {
            return content;
        }
        return floatValue;
    },
});
lively.morphic.Text.subclass('lively.morphic.SAPGridColHead',
'default category', {
    initialize: function($super, arg1, arg2) {
        $super(arg1, arg2);
        this.setFill(Color.rgb(223, 227, 232));
        this.setBorderColor(Color.rgb(177,181,186));
    },
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },

});
lively.morphic.Text.subclass('lively.morphic.SAPGridAnnotation',
'default category', {
    initialize: function($super, arg1, arg2) {
        $super(arg1, arg2);
        this.nColumn=0; //need to know which cell
        this.nRow=0;
        this.setFill(Color.rgb(255, 255, 225));
        this.setBorderColor(Color.rgb(0,0,0));
    },
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },
    onKeyUp: function($super, evt) {
       
        $super(evt);
        //Saving annotation
        var nOrgRow = this.nRow+ this.grid.startRow;
        var nOrgCol = this.nColumn+ this.grid.startColumn;

console.log("SAPGridAnnotation.onKeyUp: org col/row " + nOrgCol +"," + nOrgRow);

        this.grid.setAnnotation(nOrgCol ,nOrgRow,this.textString);

        //this.textString += String.fromCharCode(evt.getKeyCode());
    },
    /*onKeyPress: function($super, evt) {
       console.log("SAPGridAnnotation.onKeyPress");
        $super(evt);
        alert(this.textString);
        //this.textString += String.fromCharCode(evt.getKeyCode());
    },*/
    /*onBackspacePressed: function($super, evt) {
        $super(evt);
        if (!this.textString) {
            evt.stop(); 
            return true; 
        }
        this.textString = this.textString.substring(0, this.textString.length-1);
        evt.stop();
    },
    onMouseDown: function (evt) {
    //debugger;
        if (evt.isLeftMouseButtonDown()) {
            this.displayExpression();
        }
    },
    displayExpression: function() {
        if (this.evalExpression !== undefined) {
            this.textString = '=' + this.evalExpression;
        }
    },

    put: function(aValue) {
        console.log("Annotation.put")
        this.textString = aValue;
    },
    */

});


lively.morphic.Morph.subclass('lively.morphic.SAPGridToolBar',
'settings', {
    style: {
        enableGrabbing: false,
        enableDropping: false,
        borderColor: Color.neutral.lightGray,
        borderWidth: 1,
        borderRadius: 5,
        padding: Rectangle.inset(0,3),
        fill: new lively.morphic.LinearGradient(
            [{offset: 0, color: Color.gray.mixedWith(Color.white, 0.2)},
            {offset: 0.4, color: Color.gray.mixedWith(Color.white, 0.9)},
            {offset: 0.6, color: Color.gray.mixedWith(Color.white, 0.9)},
            {offset: 1, color: Color.gray.mixedWith(Color.white, 0.3)}],
            "NorthSouth")
    },
    labelStyle: {
        borderWidth: 0,
        fill: null,
        padding: Rectangle.inset(0,3),
        fontSize: 10,
        align: 'center',
        fixedWidth: true,
        fixedHeight: true,
        textColor: Color.black
    }
},
'default category', {
    initialize: function($super,oGrid, nXpos, nYpos,nWidth,nHeight) {
        //Rectangle(xPos,yPox,width,height)
        nXpos = (nXpos==undefined) ? (0) : (nXpos);
        nYpos = (nWidth==undefined) ? (0) : (nYpos);
        nHeight = (nHeight==undefined) ? (30) : (nHeight);
        nWidth = (nWidth==undefined) ? (1200) : (nWidth);
        console.log(nHeight)
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(nXpos,nYpos,nWidth,nHeight)));
        this.grid=oGrid;
        this.initializeImages();
        this.initializeEvents();
        this.imgSave;
        this.imgSaveAs;
        this.imgCopy;
        this.imgCut;
        this.imgPaste;
        this.imgClear;
        this.imgBold;
        this.imgItalic;
        this.imgUnderline;
        this.imgBackGroundColor;
        this.imgFontColor;
        this.imgSignDollar;
        this.imgSignPercent;
        this.imgBoarder;
        this.imgFilter;


    },initializeImages: function() {
        var nGapWidth = 5;
        var nGapGroupWidth = 25;
        
        this.imgSave = new lively.morphic.Image(new Rectangle(10,3,24,24), "images/Save-icon.png"); 
        this.imgSaveAs = new lively.morphic.Image(new Rectangle(24*1 + 10 + nGapWidth,3,24,24), "images/Save-as-icon.png"); 

        this.imgCopy= new lively.morphic.Image(new Rectangle(nGapGroupWidth + 24*2 + 10 + 2*nGapWidth,3,24,24), "images/Actions-edit-copy-icon.png"); 
        this.imgCut= new lively.morphic.Image(new Rectangle(nGapGroupWidth + 24*3 + 10 + 3*nGapWidth,3,24,24), "images/Cut-icon.png"); 
        this.imgPaste= new lively.morphic.Image(new Rectangle(nGapGroupWidth + 24*4 + 10 + 4*nGapWidth,3,24,24), "images/Action-paste-icon.png"); 
        this.imgClear= new lively.morphic.Image(new Rectangle(nGapGroupWidth + 24*5 + 10 + 5*nGapWidth,3,24,24), "images/Actions-edit-clear-icon.png"); 

        this.imgBold= new lively.morphic.Image(new Rectangle(2*nGapGroupWidth + 24*6 + 10 + 6*nGapWidth,3,24,24), "images/Actions-format-text-bold-icon.png"); 
        this.imgItalic = new lively.morphic.Image(new Rectangle(2*nGapGroupWidth + 24*7 + 10 + 7*nGapWidth,3,24,24), "images/Actions-format-text-italic-icon.png"); 
        this.imgUnderline= new lively.morphic.Image(new Rectangle(2*nGapGroupWidth + 24*8 + 10 + 8*nGapWidth,3,24,24), "images/Actions-format-text-underline-icon.png"); 

        this.imgBackGroundColor= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*9 + 10 + 9*nGapWidth,3,24,24), "images/color-fill-icon.png"); 
        this.imgFontColor= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*10 + 10 + 10*nGapWidth,3,24,24), "images/Actions-format-text-color-icon.png"); 

        this.imgSignDollar= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*11 + 10 + 11*nGapWidth,3,24,24), "images/US-dollar-icon.png"); 
        this.imgSignPercent= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*12 + 10 + 12*nGapWidth,3,24,24), "images/Percent-icon2.png"); 

        this.imgBoarder = new lively.morphic.Image(new Rectangle(4*nGapGroupWidth + 24*13 + 10 + 13*nGapWidth,3,24,24), "images/border-2-bottom-icon.png"); 
        this.imgFilter = new lively.morphic.Image(new Rectangle(4*nGapGroupWidth + 24*14 + 10 + 14*nGapWidth,3,24,24), "images/filter-icon.png");   
    
        
        this.addMorph(this.imgSave);
        this.addMorph(this.imgSaveAs);

        this.addMorph(this.imgCopy);
        this.addMorph(this.imgCut);
        this.addMorph(this.imgPaste);
        this.addMorph(this.imgClear);
 
        this.addMorph(this.imgBold);
        this.addMorph(this.imgItalic );
        this.addMorph(this.imgUnderline);
   
        this.addMorph(this.imgBackGroundColor);
        this.addMorph(this.imgFontColor);

        this.addMorph(this.imgSignDollar);
        this.addMorph(this.imgSignPercent);

        this.addMorph(this.imgBoarder);
        this.addMorph(this.imgFilter);

    },
    initializeEvents: function() {
       
        connect(this.imgSave , "onMouseDown", this, "imgSaveClick", {});
        
    
        
    },
    imgSaveClick: function() {

        alert(this.grid.numCols )


    },
   

});

lively.morphic.Morph.subclass('lively.morphic.SAPWorkBook',
'default category', {
    initialize: function($super, numCols, numRows) {
        $super();
        this.numCols = numCols;
        this.numRows = numRows;
        this.grid;
        this.toolBar;
        this.initializeLayout();
       
    },
     initializeLayout: function() {
        this.grid = new lively.morphic.SAPGrid(10,10);
        this.grid.name="BPCGrid";
        this.addMorph(this.grid);
        this.grid.setPosition(pt(0,30));
        this.toolBar= new lively.morphic.SAPGridToolBar(this.grid);
        this.addMorph(this.toolBar);

        var nWidth= this.defaultCellWidth * this.numCols + 300;
        var nHeight = this.defaultCellHeight * this.numRows + 300;
        this.setExtent(lively.pt(nWidth,nHeight));
        
    },

});


}) // end of module