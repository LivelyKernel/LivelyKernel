module('lively.morphic.SAPWorkSheet').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles','lively.persistence.MassMorphCreation','lively.morphic.SAPCommonWidgets').toRun(function() {
lively.morphic.Morph.subclass('lively.morphic.SAPGrid',
'initialization', { 
    initialize: function($super, numCols, numRows) {
        $super();
        this.disableHalos();
        this.defaultCellHeight = 30;
        this.defaultCellWidth = 120;
        this.borderSize = 50;

        this.defalutFontSize=10;
        this.defaultFontFamily="helvetica";

        this.colNames = new Array(numCols);
        this.numCols = numCols;
        this.numRows = numRows;
        this.oAnnotation = null;
        this.oWorkBook = null; //parent morph:  need this to access toolbar object
        
        this.arrSelectedCells=[];  //saving selected cells: to support mult select.
        this.arrSelectedData=[];
        
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

        this.selectedColumnHeader=null;
    
        this.vScroll = null;
        this.hScroll = null;

        this.activeCellContent = '';
        this.initializeData();
        this.initializeMorph();
        this.initializeScrolls();
        this.initializeAnnotation();
        $.getScript("../../core/lively/date.format.js")
            .done(function(script, textStatus) {
            console.log( "success loading date.format.js");
            })
            .fail(function(jqxhr, settings, exception) {
                console.log("error loading date.format.js");
        }); 

    },
    getAlignforValueType: function(sValue) {
        var sAlign="right";
        var sNewvalue = sValue;
        sNewvalue = this.cleanUpValue(sValue);
        if (isNaN(sNewvalue)) {
            sAlign="left";
        }
        return sAlign;
    },
    //when focus changed:  formula..etc
    applyCellChanges: function() {
        if (this.activeCell !=null){
            var sValue = this.activeCell.textString;
            if (sValue .charAt(0)=="="){
                var nColumn = this.getActiveColIndex();
                var nRow= this.getActiveRowIndex();
                var nOrgRow = nRow  + this.startRow;
                var nOrgCol = nColumn+ this.startColumn;
                
                this.arrData[nOrgRow][nOrgCol].formula = sValue; 
                this.activeCell.textString=this.parseFormula(sValue);
                this.activeCell.setToolTip('Formula: \n' + sValue);
                this.activeCell.setBorderStyle("dotted");
                
            }

        }
    },
    applyDataFormates: function(sValue,sFormatType) {
            sValue = $.trim(sValue)
            switch(sFormatType){
                case "currency":
                    debugger;
                    sValue = this.cleanUpValue(sValue);
                    if (!isNaN(sValue)){
                        sValue = "$" +  this.roundtoFixNumber(sValue ,2,true); 
                    }
                    
                    break;
                case "percentage":
                    if (sValue){
                        if (sValue.charAt(sValue.length-1)=="%"){
                            sValue = this.cleanUpValue(sValue);
                            if (!isNaN(sValue)){
                                sValue = this.roundtoFixNumber(sValue ,2,false) + "%";
                            }
                            
                        }else{
                            sValue = this.cleanUpValue(sValue);
                            if (!isNaN(sValue)){
                                sValue = this.converttoPercentage(sValue ,2) + "%";
                            }
                            
                        }
                    }
                    
                
                    break;
                case "date":
                    break;
                case "time":
                    break;
                case "number":
                    break;
                    default:

                }

        return sValue

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
        //console.log("updateDataModel");
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
        //var start = new Date().getTime();    
        //debugger;
        var nStartColumn = this.arrData[0].length;
        var nEndColumn =nStartColumn + this.maxEmptyColumntoCreate;
        if (nEndColumn < nDataLength ){
            nEndColumn = nDataLength ;
        }
        
        //Expend column names
        for (var nCol = nStartColumn ; nCol < nEndColumn ; nCol++) {
            //this.getColumnName(i+1)
            //this.colNames.push('Col' + nCol);
            this.colNames.push(this.getColumnName(nCol + 1));
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

        //var elapsed = new Date().getTime() - start;
	//elapsed = elapsed/1000;
	//console.log('expandColumns=' + elapsed);
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
            //this.colNames[i]='Col' + i;

            this.colNames[i]=this.getColumnName(i+1);

            var head = this.createColHead(i,this.colNames[i]);
            this.colHeads.push(head);
        }
    },
    createColHead: function(index, title) {
        var head = new lively.morphic.SAPGridColHead();
        head.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
        head.addToGrid(this);
        head.gridCoords = pt(index, 0);
        head.name = title ? title : 'Col' + index;
        head.textString = head.name;
        head.setAlign('center'); 
        return head;
    },


    createLayout: function() {
               var start = new Date().getTime();
        var head = this.hideColHeads ? 0 : 1;

        //debugger;

        console.log(this.numCols + "," + this.numRows + "," + head )
        
        var layouter = new lively.morphic.Layout.GridLayout(this, this.numCols, this.numRows + head);
        layouter.defaultRowHeight = this.defaultCellHeight;
        layouter.defaultColWidth = this.defaultCellWidth;
        this.setLayouter(layouter);
        //this is optimize code but if we use this it adds header to rows so it messup
        //layouter.rows = this.rows;

	//this.setLayouter(new lively.morphic.Layout.GridLayout(this, this.numCols, this.numRows + head));



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

    
    moveActiveCellBy: function(evt,aPoint) {
        
        if (!this.activeCell) {
            this.at(0,0).activate();
            return;
        }

        this.applyCellChanges();
        var curX = this.getActiveColIndex();
        var curY = this.getActiveRowIndex();
        var newX = curX + aPoint.x;
        var newY = curY + aPoint.y;

        if (evt.isShiftDown()){
            this.setCellSelection(this,this.activeCell);
        }else{
            this.removeSelectedCells();
        }

        if (this.numRows > newY  && this.numCols > newX && newY >= 0 && newX >= 0) {
            this.at(newX , newY ).activate(evt.isShiftDown());
            this.at(newX , newY ).focus();
            this.setCellSelection(this,this.at(newX , newY ));
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
                this.colNames.push(this.getColumnName(nCol + 1));
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
/*this get called when scroll is moving*/
        var nOrgRow;
        var nOrgCol;
        var sValue;
//debugger;
var start = new Date().getTime();

        //need to reset selected cell for grid display when scrolls
        this.arrSelectedCells.lenght=0;
        this.arrSelectedCells =[];

        for (var y = 0; y < this.dataModel.length && y < this.numRows; y++) {
            for (var x = 0; x < this.dataModel[y].length && x < this.numCols; x++) {
                nOrgRow = y  + this.startRow;
                nOrgCol = x + this.startColumn;
                sValue = this.dataModel[y][x].value.toString();
                //Annotation
                if (this.arrData[nOrgRow][nOrgCol].annotation){
                    this.at(x,y).annotationCell();
                }else{
                    this.at(x,y).deactivateCell();
                }
                //formula
                if (this.arrData[nOrgRow][nOrgCol].formula){
                    sValue = this.parseFormula(this.arrData[nOrgRow][nOrgCol].formula);
                    this.at(x,y).formulaCell();
                    this.at(x,y).setToolTip('Formula: \n' + this.arrData[nOrgRow][nOrgCol].formula);
                    this.at(x,y).setBorderStyle("dotted");
                }else{
                    this.at(x,y).setToolTip("");
                    this.at(x,y).setBorderStyle("solid");
                }

                //selected cell
                if (this.arrData[nOrgRow][nOrgCol].selected){
                    this.at(x,y).selectedCell();
                    this.arrSelectedCells.push(this.at(x,y));
                }

                //data formats
                if (this.arrData[nOrgRow][nOrgCol].dataFormat){
                    if (this.arrData[nOrgRow][nOrgCol].dataFormat.type){
                         sValue= this.applyDataFormates(sValue,this.arrData[nOrgRow][nOrgCol].dataFormat.type);
                    }
                }

                this.at(x,y).textString = sValue;


                //cell formats
                /*fontWeight: 'bold'
                textDecoration: 'underline'
                fontStyle: 'italic'
                fontSize:12
                fontFamily:sFont
                textAlign: 'left'
                borderColor: 
                textColor:
                fill
                */
                var sFontWeight="normal";
                var sTextDecoration="normal";
                var sFontStyle="normal";
                var sFontSize = this.defalutFontSize;
                var sFontFamily = this.defaultFontFamily;
                var sTextAlign = "left";
                var oBorderColor=null;
                var oFill = null;
                var oTextColor=null;
                //if value is number then should return right
                sTextAlign = this.getAlignforValueType(sValue)
                
                if (this.arrData[nOrgRow][nOrgCol].fontWeight){
                    sFontWeight=this.arrData[nOrgRow][nOrgCol].fontWeight;
                }
                if (this.arrData[nOrgRow][nOrgCol].textDecoration){
                    sTextDecoration=this.arrData[nOrgRow][nOrgCol].textDecoration;
                }
                if (this.arrData[nOrgRow][nOrgCol].fontStyle){
                    sFontStyle=this.arrData[nOrgRow][nOrgCol].fontStyle;
                }
                if (this.arrData[nOrgRow][nOrgCol].fontSize){
                    sFontSize =this.arrData[nOrgRow][nOrgCol].fontSize;
                }                
                if (this.arrData[nOrgRow][nOrgCol].fontFamily){
                    sFontFamily =this.arrData[nOrgRow][nOrgCol].fontFamily;
                }
                if (this.arrData[nOrgRow][nOrgCol].textAlign){
                    sTextAlign =this.arrData[nOrgRow][nOrgCol].textAlign;
                }

                if (this.arrData[nOrgRow][nOrgCol].borderColor){
                    oBorderColor=eval(this.arrData[nOrgRow][nOrgCol].borderColor);
                }                
                if (this.arrData[nOrgRow][nOrgCol].fill){
                    oFill =eval(this.arrData[nOrgRow][nOrgCol].fill);
                } 
                if (this.arrData[nOrgRow][nOrgCol].textColor){
                    oTextColor=eval(this.arrData[nOrgRow][nOrgCol].textColor);
                } 
                //oText.applyStyle({borderColor: oBorderColor, fill: oFill ,textColor: oTextColor});
                //bug in applystyle textDecoration & fontStyle & fontWeight do not work
                
                //this.at(x,y).applyStyle({fontSize:sFontSize,fontFamily:sFontFamily,fill: oFill ,textColor: oTextColor});
                //this.at(x,y).emphasizeAll({fontWeight: sFontWeight,fontStyle: sFontStyle,textDecoration: sTextDecoration});  

                this.at(x,y).applyStyle({fontSize:sFontSize,fontFamily:sFontFamily,
                                        fill: oFill ,textColor: oTextColor,
                                        fontWeight: sFontWeight,fontStyle: sFontStyle,textDecoration: sTextDecoration});
                //bug in applystyle textDecoration & fontStyle & fontWeight do not work.. if this is fixed then remove below line
                this.at(x,y).emphasizeAll({fontWeight: sFontWeight,fontStyle: sFontStyle,textDecoration: sTextDecoration});
  
                //borderColor does not take null value.
                if (oBorderColor){
                    this.at(x,y).applyStyle({borderColor: oBorderColor});
                }
                this.at(x,y).setAlign(sTextAlign); 
            }
        }

        if (this.activeCell) {
            this.activeCellContent = this.activeCell.getContent();
        }
var elapsed = new Date().getTime() - start;
console.log('updateDisplay:'  + elapsed/1000);
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
    addColBetween: function(colName) {
        if (this.activeCell) {
            var nRow = this.activeCell.gridCoords.y - (this.hideColHeads ? 0 : 1);
            var nColumn = this.activeCell.gridCoords.x;

            var nOrgRow = nRow  + this.startRow;
            var nOrgCol = nColumn + this.startColumn;
            var oCell;
            
            for (var n = 0; n < this.arrData.length; n++) {
                oCell ={}; 
                oCell.value = "";
                oCell.annotation = "";
                oCell.formula = ""; 
                this.arrData[n].splice(nOrgCol,0,oCell);
            }

            this.updateDataModel();

        }
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
     addRowBetween: function() {
        if (this.activeCell) {
            var nRow = this.activeCell.gridCoords.y - (this.hideColHeads ? 0 : 1);
            var nColumn = this.activeCell.gridCoords.x;

            var nOrgRow = nRow  + this.startRow;
            var nOrgCol = nColumn + this.startColumn;
            var oCell
            var arrColumns=[];
        

            for (nCol = 0; nCol < this.arrData[0].length; nCol++) {
                oCell ={}; 
                oCell.value = "";
                oCell.annotation = "";
                oCell.formula = "";
                arrColumns.push(oCell); 
            }
            this.arrData.splice(nOrgRow ,0,arrColumns);
            this.updateDataModel()

        }
        
        
    },
    addRow: function() {
        var row = [];
        for (var i = 0; i < this.numCols; i++) {
            var cell = this.createCell(i, this.numRows, this.hideColHeads ? 0 : 1);
            row.push(cell);
        }
        this.rows.push(row);
        this.numRows++;
        this.createLayout();
    },
    removeRowBetween: function() {
        if (this.activeCell) {
            var nRow = this.activeCell.gridCoords.y - (this.hideColHeads ? 0 : 1);
            var nColumn = this.activeCell.gridCoords.x;

            var nOrgRow = nRow  + this.startRow;
            var nOrgCol = nColumn + this.startColumn;

            this.arrData.splice(nOrgRow ,1);
            this.updateDataModel();
        }
    },
    removeColBetween: function() {
        if (this.activeCell) {
            var nRow = this.activeCell.gridCoords.y - (this.hideColHeads ? 0 : 1);
            var nColumn = this.activeCell.gridCoords.x;

            var nOrgRow = nRow  + this.startRow;
            var nOrgCol = nColumn + this.startColumn;
        
            for (var n = 0; n < this.arrData.length; n++) {
                this.arrData[n].splice(nOrgCol,1);
            }
            this.updateDataModel();
        }
    },
    removeCol: function() {
        var lastColIndex = this.numCols - 1;
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
    parseFormula: function(sOrgValue) {	
        var arrValue;
        var nTotal = 0;
        var nAve = 0;
    	var nValue; 
        var sValue;
        
        //debugger;
        if (sOrgValue){
        
        try{

            sValue= sOrgValue.toUpperCase();
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
        catch(err){
            return sOrgValue;
        }	
        }
    return sOrgValue;
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
},
'Keyboard Events', {
        /*onBackspacePressed: function(evt) {
        if (!this.activeCell) {
            this.at(0,0).activate();
        }
        this.activeCell.onBackspacePressed(evt);
        return true;
    },*/
    onEnterPressed: function($super, evt) {
        //Hak March27 2012:  calculate formula
        
        this.onDownPressed(evt);
        return true;
    },
    onTabPressed: function($super, evt) {
        this.onRightPressed(evt);
        return true;
    },
    onUpPressed: function(evt) {
        this.moveActiveCellBy(evt,pt(0,-1));
        evt.stop();
    },
    onDownPressed: function(evt) {
   
        if (evt.isShiftDown()){
            console.log("onDownPressed: ShiftDown")
        }else{
            console.log("onDownPressed: no ShiftDown")
        }
        this.moveActiveCellBy(evt,pt(0,1));
        evt.stop();
    },
    onLeftPressed: function(evt) {
        
        this.moveActiveCellBy(evt,pt(-1,0));
        evt.stop();
    },
    onRightPressed: function(evt) {
        this.moveActiveCellBy(evt,pt(1,0));
        evt.stop();
    },
        
    onKeyDown: function($super, evt) {
        $super(evt);
         //console.log("SAPGrid.onKeyDown");
    },

    onKeyPress: function($super,evt) {
         $super(evt);
        //console.log("SAPGrid.onKeyPress");

    },

    onKeyUp: function($super,evt) {
         $super(evt);
         //console.log("SAPGrid.onKeyUp");
    },
    
},
'Select cells', {
    setCellSelection: function(oGrid, oCell) {
        if (oCell){
            //getting cell coords
            var nRow = oCell.gridCoords.y - (oGrid.hideColHeads ? 0 : 1);
            var nColumn = oCell.gridCoords.x;
            //getting data coords
            var nOrgRow = nRow  + oGrid.startRow;
            var nOrgCol = nColumn + oGrid.startColumn;

            this.setGridCellSelection(oGrid, oCell)
            this.setDataCellSelection(oGrid,nOrgCol,nOrgRow);
            
        }
    },
    setGridCellSelection: function(oGrid, oCell) {
        oGrid.arrSelectedCells.push(oCell);
        oCell.selectedCell();
    },
    setDataCellSelection: function(oGrid,nCol, nRow) {
        var oSelectedData={};
        oSelectedData.x = nCol;
        oSelectedData.y = nRow;
        oGrid.arrData[nRow][nCol].selected=true;
        oGrid.arrSelectedData.push(oSelectedData);
    },
    getCellSelections: function() {
       
    },
    removeSelectedCells: function() {
        for (i= 0; i< this.arrSelectedCells.length; i++) {
            this.arrSelectedCells[i].deactivateCell();
        }
        this.arrSelectedCells.lenght=0;
        this.arrSelectedCells =[];

        //for data
        for (i= 0; i< this.arrSelectedData.length; i++) {
            this.arrData[this.arrSelectedData[i].y][this.arrSelectedData[i].x].selected=false;
        }
        this.arrSelectedData.lenght=0;
        this.arrSelectedData=[];

    },
},
'Mouse Events', {
    onMouseMove: function($super, evt) {
        
/*
evt.MOUSEDOWN:1
clientX:551
ClientY:359;
layerX:106
layerY:50
offsetX:57
offSetY:16
pageX:551
pageY:359

screenX:496
screenY:384
x:551
y359
*/
        //console.log("SAPGrid.onMouseMove");
        $super(evt);
    },
    onMouseDown: function($super, evt) {
        $super(evt);
         //console.log("SAPGrid.onMouseDown");
    },

    onMouseUp: function($super, evt) {
        $super(evt);
         //console.log("SAPGrid.onMouseUp");
    },
    onMouseWheel: function(evt) {
        console.log("onMouseWheel");
    }
},
'Common Tool', {
    getColumnNumber: function(sColumnName) {
        var nColumnNumber = 0;
        var nPow = 1;
        for (var i = sColumnName.length - 1; i >= 0; i--) {
            nColumnNumber += (sColumnName.charCodeAt(i) - "A".charCodeAt(0) + 1) * nPow;
            nPow = nPow * 26;
        }
        return nColumnNumber;
    },
    getColumnName: function(nColumnNumber) {
        var nDividend = nColumnNumber;
        var sColumnName = "";
        var nMod;
        while (nDividend>0){
            nMod = (nDividend - 1) % 26;
            sColumnName = String.fromCharCode(65 + nMod) + sColumnName;
            nDividend = parseInt((nDividend - nMod) / 26);
        }
        return sColumnName
    },
    converttoPercentage: function(num,nDecimalPlaces){
        var sResult;
        sResult= num.toString(); //bug when rnum cotains comma
        sResult= sResult.replace(/,/g, "");
        if (isNaN(sResult) || sResult== null || sResult== "") {
            sResult= parseFloat("0").toFixed(nDecimalPlaces);
        } else {
            sResult = sResult/100;
            sResult= parseFloat(sResult).toFixed(nDecimalPlaces);
        }
        return sResult;
    },
    roundtoFixNumber: function(num, nDecimalPlaces, bAddTousandSeparator) {
        var sResult;
        sResult= num.toString(); //bug when rnum cotains comma
        sResult= sResult.replace(/,/g, "");

        if (isNaN(sResult) || sResult== null || sResult== "") {
            sResult= parseFloat("0").toFixed(nDecimalPlaces);
        } else {
            sResult= parseFloat(sResult).toFixed(nDecimalPlaces);
        }

        if (bAddTousandSeparator) {
            sResult= this.addThousandSeparator(sResult, ".", ",");
        }

        return sResult;
    },

    addThousandSeparator: function(num, sDecpointChar, sSepChar) {
       if (num == null) {
            return "0";
        }
        num = num.toString();
        var a = num.split(sDecpointChar);
        var x = a[0]; // decimal
        var y = a[1]; // fraction
        var z = "";
        var i;
        if (typeof (x) != "undefined") {
            for (i = x.length - 1; i >= 0; i--)
                z += x.charAt(i);
            z = z.replace(/(\d{3})/g, "$1" + sSepChar);
            if (z.slice(-sSepChar.length) == sSepChar)
                z = z.slice(0, -sSepChar.length);
            x = "";
            for (i = z.length - 1; i >= 0; i--)
                x += z.charAt(i);
            if (typeof (y) != "undefined" && y.length > 0)
                x += sDecpointChar + y;
        }
        return x;
    },
    cleanUpValue: function (sValue) {
        sValue = sValue.toString();
        if (sValue) {
            if (sValue.indexOf(" ") != -1)
                sValue = this.substituteStr(sValue, " ", "");
            if (sValue.indexOf(",") != -1)
                sValue = this.substituteStr(sValue, ",", "");

            if (sValue.indexOf("%") != -1)
                sValue = this.substituteStr(sValue, "%", "");

            if (sValue.indexOf("$") != -1)
                sValue = this.substituteStr(sValue, "$", "");
        }else{
            sValue = "";
        }
        return sValue
    },
     substituteStr: function (Target, OldVal, NewVal) {
        OldLength = OldVal.length;
        NewLength = NewVal.length;

        TargetX = Target.toUpperCase();
        OldVal2 = OldVal.toUpperCase();

        nSubstz = TargetX.indexOf(OldVal2);
        while (nSubstz > -1) {
            LeftStr = "" + Target.substring(0, nSubstz);
            RightStr = "" + Target.substring(nSubstz + OldLength);
            Target = LeftStr + NewVal + RightStr;
            nSubstz = RightStr.indexOf(OldVal);
            if (nSubstz > -1)
                nSubstz = nSubstz + LeftStr.length + NewVal.length;
        }
        return Target;
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
    activate: function(isSelected) {
        if (this.grid.activeCell) {
            if (!isSelected){
                this.grid.activeCell.deactivate();
            }
            
        }    
        this.grid.activeCell = this;
        this.grid.activeCellContent = this.textString;
        //this.setBorderColor(Color.red);
        this.setBorderColor(Color.rgb(0,0,0));

        this.setBorderWidth(1);
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
        //removed below April 24
        //this.grid.activeCell = null;
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
    selectedCell: function() {
        this.setBorderColor(Color.rgb(0,0,0));
        this.setBorderWidth(1);
    },
    onMouseDown: function (evt) {
        console.log('SAPGridCell.onMouseDown');

        var sFontFamily =this.grid.defaultFontFamily;
        var sFontSize = this.grid.defalutFontSize;

       /*bug below code always return Helvetica and 10
        sFontFamily = this.getFontFamily();
        sFontSize = this.getFontSize();
        */
        var nCol= this.gridCoords.x;
        var nRow = this.gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
        
        var nOrgRow = nRow + this.grid.startRow;
        var nOrgCol = nCol+ this.grid.startColumn;

        if (this.grid.arrData[nOrgRow][nOrgCol].fontFamily){
            sFontFamily =this.grid.arrData[nOrgRow][nOrgCol].fontFamily;
        }
        if (this.grid.arrData[nOrgRow][nOrgCol].fontSize){
            sFontSize =this.grid.arrData[nOrgRow][nOrgCol].fontSize;
        }
        this.grid.oWorkBook.toolBar.setfontFamily(sFontFamily); 
        this.grid.oWorkBook.toolBar.setFontSize(sFontSize); 

        this.grid.hideAnnotation();
        if (evt.isLeftMouseButtonDown()) {
            var ctrl = evt.isCtrlDown();
            if (evt.isCtrlDown()){
                this.grid.setCellSelection(this.grid,this);
                this.activate(true);
            }else{
                if (evt.isShiftDown()){
                    if (this.grid.activeCell) {
                        var nActiveX = this.grid.getActiveColIndex();
                        var nActiveY = this.grid.getActiveRowIndex();
                        console.log("Active: " + nActiveX + "," +nActiveY )
                        console.log("Current: " + nCol+ "," +nRow )
                        var nStartX,nStartY,nEndX,nEndY;
                        if (nActiveX > nCol){
                            nStartX=nCol;
                            nEndX = nActiveX; 
                        }else{
                            nStartX=nActiveX;
                            nEndX = nCol; 
                        }
                        if (nActiveY > nRow ){
                            nStartY = nRow ;
                            nEndY = nActiveY;
                        }else{
                            nStartY = nActiveY;
                            nEndY = nRow ;
                        }
                        for (var x = nStartX; x <= nEndX ; x++) {
                            for (var y = nStartY; y <= nEndY ; y++) {
                                this.grid.setCellSelection(this.grid,this.grid.at(x,y));
                            }
                        }
                    }
                }else{    
                    this.grid.removeSelectedCells();
                    this.grid.setCellSelection(this.grid,this);
                }
                this.activate(evt.isShiftDown());
            }
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
    onBlur: function($super,evt) {
        //$super(evt);
        var nCol= this.gridCoords.x;
        var nRow = this.gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
        
        var nOrgRow = nRow + this.grid.startRow;
        var nOrgCol = nCol+ this.grid.startColumn;
        var sValue = this.textString;
        debugger;
        console.log("before: " + sValue )
        this.grid.arrData[nRow][nCol].value=sValue ;
        if (this.grid.arrData[nOrgRow][nOrgCol].dataFormat){
            if (this.grid.arrData[nOrgRow][nOrgCol].dataFormat.type){
                sValue= this.grid.applyDataFormates(sValue,this.grid.arrData[nOrgRow][nOrgCol].dataFormat.type);
                 this.textString = sValue ;
            }
        }
        console.log("after: " +sValue )
       
 

        
    },
    put: function(aValue) {
        // TODO: check if aValue starts with =, then evaluate it or not
        debugger;
        this.textString = aValue;
    },
    /*onKeyUp: function($super, evt) {
        $super(evt);
    },
    onKeyPress: function($super, evt) {
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
        this.disableHalos();
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
        this.disableHalos();
        this.setFill(Color.rgb(223, 227, 232));
        this.setBorderColor(Color.rgb(177,181,186));
        this.renderContext().textNode.setAttribute('contenteditable', false);
        //this.disableEvents();
    },
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },
    onMouseDown: function (evt) {

        this.grid.hideAnnotation();
        if (evt.isLeftMouseButtonDown()) {
           
            var nCol= this.gridCoords.x;
            var nOrgCol = nCol + this.grid.startColumn;
            var oSelectedData={};

            this.grid.selectedColumnHeader = this;
            this.grid.removeSelectedCells();

            //for grid selected
            for (var y = 0; y < this.grid.numRows; y++) {
                this.grid.setGridCellSelection(this.grid,this.grid.rows[y][nCol]);
            }
            //for data selected
            for (var y = 0; y < this.grid.arrData.length; y++) {
                this.grid.setDataCellSelection(this.grid,nOrgCol,y)
            }
            
        }
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
        this.imgInsertRow;
        this.imgRemoveRow;
        this.imgInsertColumn;
        this.imgRemoveColumn;
        this.imgFormatCell;
        this.imgTextAlignLeft;
        this.imgTextAlignCenter;
        this.imgTextAlignRight;
        this.ddlFontSize;
        this.ddlFont;

        this.fontPicker;
        this.oDataFormat = null;

/*



fontWeight: 'bold'
textDecoration: 'underline'
fontStyle: 'italic'
fontSize:12
fontFamily:sFont
textAlign: 'left'
backgroundcolor: ss
boardercolor: xx
formula: xx
value: yy


getFontSize()
getFontWeight()
getFontFamily
getColor
setColor
getTextDecoration
getTextAlignment
getBackgroundColor
getItalics


formula:
notes:
dataformat: currency & percentage & date & time
    - currency: symbol , decimalPlaces ,useThousandSeparator, unitOfMeasure (whole,thousand,million), negativeType (withminus, red, withBracket, redwithBracket) 
    - percentage: Decimal places
    - date: dateformat (~5 types)
    - time: timeformat (~5 types)
*/


    },initializeImages: function() {
        var nGapWidth = 6;
        var nGapGroupWidth = 25;
        var nSecondLineYPos = 30;

        this.imgSave = new lively.morphic.Image(new Rectangle(10,3,24,24), "images/Save-icon.png"); 
        this.imgSaveAs = new lively.morphic.Image(new Rectangle(24*1 + 10 + nGapWidth,3,24,24), "images/Save-as-icon.png"); 
        this.imgPaste= new lively.morphic.Image(new Rectangle(nGapGroupWidth + 24*2 + 10 + 2*nGapWidth,3,24,24), "images/Action-paste-icon.png"); 
        this.imgCut= new lively.morphic.Image(new Rectangle(nGapGroupWidth + 24*3 + 10 + 3*nGapWidth,3,24,24), "images/Cut-icon.png"); 
        this.imgCopy= new lively.morphic.Image(new Rectangle(nGapGroupWidth + 24*3 + 10 + 3*nGapWidth,nSecondLineYPos,24,24), "images/Actions-edit-copy-icon.png"); 
    
        this.ddlFont = new lively.morphic.DropDownList(new Rectangle(2*nGapGroupWidth + 24*4 + 10 + 4*nGapWidth, 3, 120, 20), []);

        this.ddlFontSize = new lively.morphic.DropDownList(new Rectangle(2*nGapGroupWidth + 24*4 + 10 + 4*nGapWidth + 120, 3, 100, 20), ['8', '9', '10','11','12','13','14','16','18','20','22','24']);

        this.addMorph(this.ddlFont );
        this.addMorph(this.ddlFontSize );

        this.imgBold= new lively.morphic.Image(new Rectangle(2*nGapGroupWidth + 24*4 + 10 + 4*nGapWidth,nSecondLineYPos,24,24), "images/Actions-format-text-bold-icon.png"); 
        this.imgBold.setToolTip("Bold");
        this.imgItalic = new lively.morphic.Image(new Rectangle(2*nGapGroupWidth + 24*5 + 10 + 5*nGapWidth,nSecondLineYPos,24,24), "images/Actions-format-text-italic-icon.png"); 
        this.imgItalic.setToolTip("Italic");
        this.imgUnderline= new lively.morphic.Image(new Rectangle(2*nGapGroupWidth + 24*6 + 10 + 6*nGapWidth,nSecondLineYPos,24,24), "images/Actions-format-text-underline-icon.png"); 
        this.imgUnderline.setToolTip("Underline");

        this.imgBackGroundColor= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*8 + 10 + 7*nGapWidth,nSecondLineYPos,24,24), "images/color-fill-icon.png"); 
        this.imgFontColor= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*9 + 10 + 8*nGapWidth,nSecondLineYPos,24,24), "images/Actions-format-text-color-icon.png"); 

        this.imgSignDollar= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*11 + 10 + 11*nGapWidth,3,24,24), "images/US-dollar-icon.png"); 
        this.imgSignDollar.setToolTip("Number Format: Currency");
        this.imgSignPercent= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*12 + 10 + 12*nGapWidth,3,24,24), "images/Percent-icon2.png"); 
        this.imgSignPercent.setToolTip("Number Format: Percentage");

        this.imgFormatCell= new lively.morphic.Image(new Rectangle(3*nGapGroupWidth + 24*11 + 10 + 11*nGapWidth,nSecondLineYPos,24,24), "images/rick-text-format-icon.png"); 


        this.imgBoarder = new lively.morphic.Image(new Rectangle(4*nGapGroupWidth + 24*13 + 10 + 13*nGapWidth,3,24,24), "images/border-2-bottom-icon.png"); 
        this.imgFilter = new lively.morphic.Image(new Rectangle(4*nGapGroupWidth + 24*14 + 10 + 14*nGapWidth,3,24,24), "images/filter-icon.png"); 

        this.imgInsertRow = new lively.morphic.Image(new Rectangle(5*nGapGroupWidth + 24*15 + 10 + 13*nGapWidth,3,24,24), "images/table-row-insert-icon.png");
        this.imgInsertRow.setToolTip("Insert Row");

        this.imgInsertColumn = new lively.morphic.Image(new Rectangle(5*nGapGroupWidth + 24*15 + 10 + 13*nGapWidth,nSecondLineYPos,24,24), "images/table-column-insert-icon.png");
        this.imgInsertColumn .setToolTip("Insert Column");
        
        this.imgRemoveRow = new lively.morphic.Image(new Rectangle(5*nGapGroupWidth + 25*16 + 10 + 11*nGapWidth,3,24,24), "images/table-row-delete-icon.png");
        this.imgRemoveRow .setToolTip("Delete Row");
        this.imgRemoveColumn = new lively.morphic.Image(new Rectangle(5*nGapGroupWidth + 25*16 + 10 + 11*nGapWidth,nSecondLineYPos,24,24), "images/table-column-delete-icon.png");
        this.imgRemoveColumn .setToolTip("Delete Column");
    
        this.imgTextAlignLeft = new lively.morphic.Image(new Rectangle(6*nGapGroupWidth + 25*19 + 10 + 13*nGapWidth,3,24,24), "images/Text-align-left-icon.png");
        this.imgTextAlignLeft.setToolTip("Align Text Left");
        this.imgTextAlignCenter = new lively.morphic.Image(new Rectangle(6*nGapGroupWidth + 25*20 + 10 + 13*nGapWidth,3,24,24), "images/Text-align-center-icon.png");
        this.imgTextAlignCenter.setToolTip("Align Text Center");
        this.imgTextAlignRight = new lively.morphic.Image(new Rectangle(6*nGapGroupWidth + 25*21 + 10 + 13*nGapWidth,3,24,24), "images/Text-align-right-icon.png");
        this.imgTextAlignRight.setToolTip("Align Text Right");

        this.imgClear= new lively.morphic.Image(new Rectangle(6*nGapGroupWidth + 25*22 + 10 + 14*nGapWidth,3,24,24), "images/Actions-edit-clear-icon.png"); 

        this.addMorph(this.imgInsertRow);
        this.addMorph(this.imgRemoveRow);
        this.addMorph(this.imgInsertColumn);
        this.addMorph(this.imgRemoveColumn);

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
        this.addMorph(this.imgFormatCell);


        this.addMorph(this.imgBoarder);
        this.addMorph(this.imgFilter);

        this.addMorph(this.imgInsertRow);
        this.addMorph(this.imgRemoveRow);
        this.addMorph(this.imgInsertColumn);
        this.addMorph(this.imgRemoveColumn);

        this.addMorph(this.imgTextAlignLeft);
        this.addMorph(this.imgTextAlignCenter);
        this.addMorph(this.imgTextAlignRight);

        this.ddlFontSize.grabbingEnabled = false;
        this.ddlFont.grabbingEnabled = false;


        var oSubmorphs= this.submorphs
        //debugger;
        //for (var i = 0; i < oSubmorphs.length; i++) {
            //if (oSubmorphs[i].shape==lively.morphic.Image){
            //      console.log("image")
            //}
        //}

        this.imgSave.grabbingEnabled = false;
        this.imgSaveAs.grabbingEnabled = false;
        this.imgCopy.grabbingEnabled = false;
        this.imgCut.grabbingEnabled = false;
        this.imgPaste.grabbingEnabled = false;
        this.imgClear.grabbingEnabled = false;
        this.imgBold.grabbingEnabled = false;
        this.imgItalic.grabbingEnabled = false;
        this.imgUnderline.grabbingEnabled = false;
        this.imgBackGroundColor.grabbingEnabled = false;
        this.imgFontColor.grabbingEnabled = false;
        this.imgSignDollar.grabbingEnabled = false;
        this.imgSignPercent.grabbingEnabled = false;
        this.imgBoarder.grabbingEnabled = false;
        this.imgFilter.grabbingEnabled = false;
        this.imgInsertRow.grabbingEnabled = false;
        this.imgRemoveRow.grabbingEnabled = false;
        this.imgInsertColumn.grabbingEnabled = false;
        this.imgRemoveColumn.grabbingEnabled = false;
        this.imgTextAlignLeft.grabbingEnabled = false;
        this.imgTextAlignCenter.grabbingEnabled = false;
        this.imgTextAlignRight.grabbingEnabled = false;
        this.imgFormatCell.grabbingEnabled = false;


        this.imgSave.disableHalos();
        this.imgSaveAs.disableHalos();
        this.imgCopy.disableHalos();
        this.imgCut.disableHalos();
        this.imgPaste.disableHalos();
        this.imgClear.disableHalos();
        this.imgBold.disableHalos();
        this.imgItalic.disableHalos();
        this.imgUnderline.disableHalos();
        this.imgBackGroundColor.disableHalos();
        this.imgFontColor.disableHalos();
        this.imgSignDollar.disableHalos();
        this.imgSignPercent.disableHalos();
        this.imgBoarder.disableHalos();
        this.imgFilter.disableHalos();
        this.imgInsertRow.disableHalos();
        this.imgRemoveRow.disableHalos();
        this.imgInsertColumn.disableHalos();
        this.imgRemoveColumn.disableHalos();
        this.imgTextAlignLeft.disableHalos();
        this.imgTextAlignCenter.disableHalos();
        this.imgTextAlignRight.disableHalos();
        this.imgFormatCell.disableHalos();
    },
    setFontSize: function(sFontSize){
        this.ddlFontSize.setSelectionMatching(sFontSize);
    },
    setfontFamily: function(sFontFamily){
        if (this.fontPicker){
            this.fontPicker.setDefaultFont(sFontFamily);
        }else{
            this.fontPicker= new lively.morphic.SAPFontPicker(sFontFamily,this.fontPicker_callBack);
            this.fontPicker.setPosition(pt(181,24));
            this.fontPicker.setVisible(false);
            this.addMorph(this.fontPicker);
            connect(this.fontPicker, "onBlur", this, "fontPicker_onBlur", {});
        }
   
        this.ddlFont.setList([this.fontPicker.selectedFont]);
    },    
    fontPicker_callBack: function(sFont){
        var i;
        var that = this.owner;
        that.ddlFont.updateList([sFont]);
        for (i= 0; i< that.grid.arrSelectedCells.length; i++) {
            that.grid.arrSelectedCells[i].emphasizeAll({fontFamily:sFont});
        }

        //for data
        for (i= 0; i< that.grid.arrSelectedData.length; i++) {
            that.grid.arrData[that.grid.arrSelectedData[i].y][that.grid.arrSelectedData[i].x].fontFamily=sFont;
        }


        that.fontPicker.setVisible(false);
        
    },
    ddlFont_onMouseDown: function(){
        if (this.fontPicker){
            //debugger;
            if (this.fontPicker.isVisible()){
                this.fontPicker.setVisible(false);
            }else{
                this.fontPicker.setVisible(true);
                //this.fontPicker.focus();
            }
        }else{
            this.fontPicker= new lively.morphic.SAPFontPicker("courier",this.fontPicker_callBack);
            this.fontPicker.setPosition(pt(181,24));
            this.addMorph(this.fontPicker);
            connect(this.fontPicker, "onBlur", this, "fontPicker_onBlur", {});
        }
        
    
    },
    ddlFontSize_onChange: function(){
        var i;
        var nFontsize = this.ddlFontSize.getSelectedItem();
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            this.grid.arrSelectedCells[i].emphasizeAll({fontSize:nFontsize });
        }
         //for data
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].fontSize=nFontsize;
        }

    },
    
    fontPicker_onBlur: function(){
       console.log("onBlur");
       this.fontPicker.setVisible(false);

    },
    initializeEvents: function() {
        connect(this.imgBold, "onMouseDown", this, "imgBold_Click", {});
        connect(this.imgItalic, "onMouseDown", this, "imgItalic_Click", {});
        connect(this.imgUnderline, "onMouseDown", this, "imgUnderline_Click", {});
    
        connect(this.imgSave , "onMouseDown", this, "imgSave_Click", {});
        connect(this.imgInsertRow, "onMouseDown", this, "imgInsertRow_Click", {});
        connect(this.imgInsertColumn, "onMouseDown", this, "imgInsertColumn_Click", {});
        connect(this.imgRemoveRow, "onMouseDown", this, "imgRemoveRow_Click", {});
        connect(this.imgRemoveColumn, "onMouseDown", this, "imgRemoveColumn_Click", {});

        connect(this.imgSignDollar, "onMouseDown", this, "imgSignDollar_Click", {});
        connect(this.imgSignPercent, "onMouseDown", this, "imgSignPercent_Click", {});

        connect(this.imgTextAlignLeft, "onMouseDown", this, "imgTextAlignLeft_Click", {});
        connect(this.imgTextAlignCenter, "onMouseDown", this, "imgTextAlignCenter_Click", {});
        connect(this.imgTextAlignRight, "onMouseDown", this, "imgTextAlignRight_Click", {});

        connect(this.ddlFontSize, "onChange", this, "ddlFontSize_onChange", {});
        connect(this.ddlFont , "onMouseDown", this, "ddlFont_onMouseDown", {});
        connect(this.imgFormatCell, "onMouseDown", this, "imgFormatCell_Click", {});
        

    },
    imgFormatCell_Click: function() {
          
        debugger;
        if (this.oDataFormat){
            if (this.oDataFormat.owner.isShutdown()){
               alert("bring it to the world")
            }
        }else{
            this.oDataFormat= new lively.morphic.SAPCellFormatter();
            this.oDataFormat.grid=this.grid;
            this.oDataFormat.openInWindow(pt(300,300));
            this.oDataFormat.owner.setTitle("Format Cells");
        }
        
    },
    imgTextAlignLeft_Click: function() {
        var i;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            this.grid.arrSelectedCells[i].setAlign('left'); 
        }
        //for data
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].textAlign='left';
        }
    },
    imgTextAlignCenter_Click: function() {
        var i;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            this.grid.arrSelectedCells[i].setAlign('center'); 
        }
        //for data
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].textAlign='center';
        }
    },
    imgTextAlignRight_Click: function() {
        var i;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            this.grid.arrSelectedCells[i].setAlign('right'); 
        }
        //for data
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].textAlign='right';
        }
    },
    imgItalic_Click: function() {
        var i;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            this.grid.arrSelectedCells[i].emphasizeAll({fontStyle: 'italic'});
        }
        //for data
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].fontStyle='italic';
        }
    },
    imgUnderline_Click: function() {
        var i;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            this.grid.arrSelectedCells[i].emphasizeAll({textDecoration: 'underline'});
        }
         //for data
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].textDecoration='underline';
        }
    },
    imgBold_Click: function() {
        var i;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            this.grid.arrSelectedCells[i].emphasizeAll({fontWeight: 'bold'});
        }
        //for data
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].fontWeight='bold';
        }
    },
    imgBackGroundColor_Click: function() {
        alert(this.grid.numCols )
    },
    imgFontColor_Click: function() {
        alert(this.grid.numCols )
    },
    imgSignDollar_Click: function() {
        var nRow;
        var nColumn;
        var nOrgRow;
        var nOrgCol;
        var sValue;
         var i;
        debugger;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            nRow  = this.grid.arrSelectedCells[i].gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
            nColumn = this.grid.arrSelectedCells[i].gridCoords.x;
            nOrgRow = nRow  + this.grid.startRow;
            nOrgCol = nColumn + this.grid.startColumn; 
            sValue = this.grid.arrData[nOrgRow][nOrgCol].value;
            sValue = this.grid.applyDataFormates(sValue ,"currency");
            
            this.grid.arrSelectedCells[i].textString= sValue;
        }
         //for data
        var oDataFormat;
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            // - currency: symbol , decimalPlaces ,useThousandSeparator, unitOfMeasure (whole,thousand,million), negativeType (withminus, red, withBracket, redwithBracket) 
            //we need to get from default value...?
            oDataFormat = {};    
            oDataFormat.type ="currency";
            oDataFormat.symbol = "$";
            oDataFormat.decimalPlaces = 2;
            oDataFormat.unitOfMeasure = 1;
            oDataFormat.useThousandSeparator = true;
            oDataFormat.negativeType= 1;
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].dataFormat=oDataFormat;
        }
    },
    imgSignPercent_Click: function() {
        var nRow;
        var nColumn;
        var nOrgRow;
        var nOrgCol;
        var sValue;
        var i;
        debugger;
        for (i= 0; i< this.grid.arrSelectedCells.length; i++) {
            nRow  = this.grid.arrSelectedCells[i].gridCoords.y - (this.grid.hideColHeads ? 0 : 1);
            nColumn = this.grid.arrSelectedCells[i].gridCoords.x;
            nOrgRow = nRow  + this.grid.startRow;
            nOrgCol = nColumn + this.grid.startColumn; 
            sValue = this.grid.arrData[nOrgRow][nOrgCol].value;
            //sValue = this.grid.converttoPercentage(sValue ,2)
            sValue = this.grid.applyDataFormates(sValue ,"percentage");
            this.grid.arrSelectedCells[i].textString= sValue;
        }
        var oDataFormat;
        for (i= 0; i< this.grid.arrSelectedData.length; i++) {
            // percentage: Decimal places
            //we need to get from default value...?
            oDataFormat = {};    
            oDataFormat.type ="percentage";
            oDataFormat.decimalPlaces = 2;
            this.grid.arrData[this.grid.arrSelectedData[i].y][this.grid.arrSelectedData[i].x].dataFormat=oDataFormat;
        }
        //this.focus();
        //if (this.grid.activeCell) {
        //      
        //}


    },
    imgSave_Click: function() {
        alert(this.grid.numCols )
    },
    imgInsertRow_Click: function() {
        this.grid.addRowBetween();
    },
    imgInsertColumn_Click: function() {
        this.grid.addColBetween();
    },
    imgRemoveRow_Click: function() {
        this.grid.removeRowBetween();
    },
    imgRemoveColumn_Click: function() {
        this.grid.removeColBetween();
    },

});    

lively.morphic.Morph.subclass('lively.morphic.SAPWorkBook',
'default category', {
    initialize: function($super, numCols, numRows) {
        $super();
        this.numCols = numCols;
        this.numRows = numRows;
        this.toolBarHeight = 60;
        this.grid;
        this.toolBar;
        this.dataFormatter;
        this.initializeLayout();
    },
     initializeLayout: function() {
        this.grid = new lively.morphic.SAPGrid(this.numCols,this.numRows);
        this.grid.name="BPCGrid";
        this.grid.oWorkBook = this;
        this.addMorph(this.grid);
        this.grid.setPosition(pt(0,this.toolBarHeight+2));

        var nToolBarWidth= this.grid.defaultCellWidth * this.grid.numCols;
        this.toolBar= new lively.morphic.SAPGridToolBar(this.grid,0,0,nToolBarWidth,this.toolBarHeight);
        this.addMorph(this.toolBar);

        var nWidth= this.grid.defaultCellWidth * this.grid.numCols + 50;
        var nHeight = this.grid.defaultCellHeight * this.grid.numRows + 50;
        this.setExtent(lively.pt(nWidth,nHeight));
        //this.setFill(Color.rgb(255, 255, 225));
    },
     onMouseDown: function($super, evt) {
        
        $super(evt);
    },
    onScroll: function(evt) {
        console.log("SAPWorkBook: onScroll");
    },
    onMouseWheel: function($super,evt) {
        console.log("SAPWorkBook: onMouseWheel");
        $super(evt);
    }

});


}) // end of module