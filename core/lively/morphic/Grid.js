module('lively.morphic.Grid').requires('lively.morphic.Core', 'lively.morphic.TextCore', 'lively.persistence.MassMorphCreation').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.DataGrid',
'settings', {
    defaultCellHeight: 30,
    defaultCellWidth: 80,
    borderSize: 50
},
'initialization', {

    initialize: function($super, numCols, numRows, spec) {
        $super();
        this.hideColHeads = spec && !spec.showColHeads;
        this.hideRowHeads = spec && !spec.showRowHeads;
        this.colNames = new Array(numCols);
        this.rowNames = new Array(numRows);
        this.colHeads = [];
        this.rowHeads = [];
        this.numCols = numCols;
        this.numRows = numRows;
        this.activeCellContent = '';
        this.initializeData();
        this.initializeMorphs();
    },

    initializeData: function() {
        this.rows = [];
        this.dataModel = [];
        this.addScript(function renderFunction(value) { return value; });
    },

    initializeMorphs: function() {
        this.setExtent(pt(
            this.numCols * this.defaultCellWidth  + 2 * this.borderSize,
            this.numRows * this.defaultCellHeight + 2 * this.borderSize));
        this.setFill(Color.rgb(230,230,230));
        if (!this.hideColHeads) {
            this.createColHeads();
        }
        if (!this.hideRowHeads) {
            this.createRowHeads();
        }
        this.createCells();
        this.createLayout();
    },

    createColHeads: function() {
        for (var i = 0; i < this.numCols; i++) {
            this.colHeads.push(this.createColHead(i));
        }
        this.rows[0] = this.colHeads;
    },

    createRowHeads: function() {
        for (var i = 0; i < this.numRows; i++) {
            var rowHead = this.createRowHead(i);
            this.rowHeads.push(rowHead);
            if (!this.rows[i]) { this.rows[i] = []; }
            var row = this.rows[i];
            row[0] = rowHead;
        }
    },

    createHead: function(isRow, index, title) {
        var head = isRow ? new lively.morphic.DataGridRowHead() : new lively.morphic.DataGridColHead();
        head.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
        head.addToGrid(this);
        head.gridCoords = isRow ? pt(0, index) : pt(index, 0);
        var name = title;
        if (!name) {
            var titleIndex = index;
            if (isRow && !this.hideColHeads) {
                titleIndex--;
            } else if (!isRow && !this.hideRowHeads) {
                titleIndex--;
            }
            name = '[' + titleIndex + ']';
        }
        head.textString = head.name = name;
        return head;
    },

    createColHead: function(index, title) {
        return this.createHead(false, index, title);
    },

    createRowHead: function(index, title) {
        return this.createHead(true, index, title);
    },

    createCells: function() {
        var rowOffset = this.hideColHeads ? 0 : 1,
            colOffset = this.hideRowHeads ? 0 : 1,
            numCellRows = this.numRows - rowOffset,
            numCellCols = this.numCols - colOffset,
            self = this,
            cells = lively.morphic.Morph.createN(numCellRows * numCellCols, function() {
                return self.createCellOptimized();
            });

        function addCellToRow(row, x, y) {
            var cell = cells.pop();
            cell.addToGrid(self);
            cell.gridCoords = pt(x + colOffset, y + rowOffset);
            cell.name = '[' + x + ';' + y + ']';
            row[x + colOffset] = cell;
        }

        for (var y = 0; y < numCellRows; y++) {
            var row = new Array(numCellRows);
            for (var x = 0; x < numCellCols; x++) {
                addCellToRow(row, x, y);
            }
            this.rows[y + rowOffset] = row;
        }
    },

    createCell: function(x, y, headOffsetX, headOffsetY, string) {
        // numRows, i.e. y, contains the headOffsetY, i.e. the colHeads row.
        // Only in naming, it has to be removed.
        var cell = new lively.morphic.DataGridCell(new Rectangle(0, 0, this.defaultCellWidth, this.defaultCellHeight), string);
        cell.doitContext = this;
        cell.addToGrid(this);
        cell.gridCoords = pt(x + headOffsetX, y);
        cell.name = '[' + x + ';' + (y - headOffsetY) + ']';
        return cell;
    },

    createCellOptimized: function() {
       var cell = new lively.morphic.DataGridCell();
       cell.doitContext = this;
       cell.setExtent(pt(this.defaultCellWidth, this.defaultCellHeight));
       return cell;
   },

    createLayout: function() {
        var layouter = new lively.morphic.Layout.GridLayout(
                this, this.numCols, this.numRows);
        layouter.rows = this.rows;
        this.applyLayout();
    },

    getLayoutableSubmorphs: function() {
        // FIXME this is for improving the layouting performance
        // but it actually should work like $super
        return this.submorphs;
    },

    at: function(x, y) {
        if (!this.hideColHeads) y++;
        if (!this.hideRowHeads) x++;
        return this.rows[y] && this.rows[y][x];
    },

    atPut: function(x, y, value) {
        this.at(x,y).put(value);
    },

    clear: function() {
        for (var y = 0; y < this.numRows; y++) {
            for (var x = 0; x < this.numCols; x++) {
                this.rows[y][x].clear();
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
        var activePos = this.activeCell.gridPos(),
            newPos = activePos.addPt(aPoint),
            nextCell = this.at(newPos.x, newPos.y);
        nextCell && nextCell.activate();
    },

    setData: function(aJsArray) {
        this.clear();
        this.dataModel = [];
        aJsArray.forEach(function(ea) {
            if (Object.isArray(ea)) {
                this.dataModel.push(ea);
                return;
            }
            this.dataModel.push(this.createDataRowFromObject(ea));
        }, this);
        this.updateDisplay();
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

    createDataRowFromObject: function(anObject) {
        var row,
            names = this.getColNames();
        if (!names.some(function(ea) { return ea })) {
            //col names have not been set
            row = [];
            for (var prop in anObject) {
               row.push(anObject[prop]);
            }
        } else {
            var i;
            row = new Array(this.numCols);
            for (i = 0; i < row.length; i++) { row[i] = '' };
            for (i = 0; i < names.length && i < this.numCols; i++) {
                if (names[i] in anObject) {
                    row[i] = anObject[names[i]];
                }
            }
        }
        return row;
    },

    updateDisplay: function() {
        for (var y = 0; y < this.dataModel.length && y < this.numRows; y++) {
            for (var x = 0; x < this.dataModel[y].length && x < this.numCols; x++) {
                this.at(x,y).put(this.renderFunction(this.dataModel[y][x]));
            }
        }
        if (this.activeCell) {
            this.activeCellContent = this.activeCell.getContent();
        }
    },

    onKeyPress: function(evt) {
        if (!this.activeCell) {
            this.at(0,0).activate();
        }
        this.activeCell.onKeyPress(evt);
        evt.stop();
    },

    onBackspacePressed: function(evt) {
        if (!this.activeCell) {
            this.at(0,0).activate();
        }
        this.activeCell.onBackspacePressed(evt);
        return true;
    },
    onEnterPressed: function($super, evt) {
        this.onDownPressed(evt);
        return true;
    },
    onTabPressed: function($super, evt) {
        this.onRightPressed(evt);
        return true;
    },

    setActiveCellContent: function(aString) {
        if (!this.activeCell) { this.at(0,0).activate(); }
        this.activeCell.textString = aString;
    },

    evaluateExpression: function(anExpression) {
        var exprFunc = Strings.format(
            "(function() {\n" +
                "    var that = this,\n" +
                "        cell = function(x,y) { return that.at(x,y).getContent(); }; \n" +
                "    return %s; })", anExpression);
        try {
            return eval(exprFunc).call(this);
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
        for (var i = 0; i < this.colHeads.length; i++) {
            this.colHeads[i].textString = i < anArray.length ? anArray[i] : '';
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
        return this.activeCell.gridCoords.y;
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
        var realColName = Object.isString(colName) ? colName : '';
        this.colNames[this.numCols] = realColName;

        if (!this.hideColHeads) {
            var head = this.createColHead(this.numCols, realColName);
            this.colHeads.push(head);
            this.rows[0].push(head);
        }
        
        var start = this.hideColHeads ? 0 : 1;
        for (var i = start; i < this.numRows; i++) {
            var cell = this.createCell(this.numCols, i, this.hideRowHeads ? 0 : 1, this.hideColHeads ? 0 : 1);
            this.rows[i].push(cell);
        }
        this.numCols++;
        this.createLayout();
    },

    addRow: function(content) {
        var row = [];
        if(content !== undefined && content.length != this.numCols){
            throw new Error("Not enough content supplied.");
        }
        if (!this.hideRowHeads) {
            var head = this.createRowHead(this.numRows, '[' + this.numRows + ']');
            this.rowHeads.push(head);
            row.push(head);
        }
        var numCellCols = this.numCols - (this.hideRowHeads ? 0 : 1);
        for (var i = 0; i < numCellCols; i++) {
            var cell = this.createCell(i, this.numRows, this.hideRowHeads ? 0 : 1, this.hideColHeads ? 0 : 1, content && content[i]);
            row.push(cell);
        }
        this.rows.push(row);
        this.numRows++;
        this.createLayout();
    },

    removeCol: function() {
        var lastColIndex = this.numCols - 1;
        for (var i = 0; i < this.numRows; i++) {
            delete this.rows[i][lastColIndex].gridCoords;
            this.rows[i][lastColIndex].remove();
            this.rows[i].pop();
        }
        var lastColHead = this.colHeads[lastColIndex];
        if (lastColHead) { this.colHeads.pop(); }
        while (this.colNames.length > lastColIndex) {
            this.colNames.pop();
        }

        this.numCols--;
        this.createLayout();
    },

    removeRow: function() {
        if(this.numRows == 0) return
        var lastRowIndex = this.numRows - 1;
        this.rows[lastRowIndex].forEach(function(ea) {
            delete ea.gridCoords; ea.remove(); });
        this.rows.pop();
        var lastRowHead = this.rowHeads[lastRowIndex];
        if (lastRowIndex) { this.rowHeads.pop(); }
        this.numRows--;
        this.createLayout();
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

lively.morphic.Text.subclass('lively.morphic.DataGridCell',
'settings', {
    isCell: true
},
'accessing', {
    gridPos: function() {
        if (!this.gridCoords) throw new Error(this + ' has no grid coordinates');
        if (!this.grid) throw new Error(this + ' has no grid');
        return this.gridCoords.addXY(this.grid.hideRowHeads ? 0 : -1, this.grid.hideColHeads ? 0 : -1);
    }
},
'default category', {
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },
    activate: function() {
        if (this.grid.activeCell) {
            this.grid.activeCell.deactivate();
        }
        this.grid.activeCell = this;
        this.grid.activeCellContent = this.textString;
        this.setBorderColor(Color.red);
        this.setBorderWidth(2);
        this.displayExpression();
    },
    deactivate: function() {
        if (this.grid.activeCell !== this) {
            return;
        }
        this.grid.activeCell = null;
        this.setBorderColor(Color.black);
        this.setBorderWidth(1);
        this.updateEvalExpression();
        this.updateDisplay();
        this.grid.recalculateRowsFirst();
    },

    onMouseDown: function (evt) {
        if (evt.isLeftMouseButtonDown()) {
            this.activate();
        }
    },

    put: function(aValue) {
        if (("" + aValue).startsWith("=")){
            // We need to bind eval-'this' to 'this'
            var ctxt = this.getDoitContext();
            this.doitContext = this;
            this.tryBoundEval("this.textString " + aValue)
            this.doitContext = ctxt;
        } else
            this.textString = aValue;
    },
    onKeyPress: function($super, evt) {
        // enter comment here
        $super(evt);
        this.textString += String.fromCharCode(evt.getKeyCode());
    },
    onBackspacePressed: function($super, evt) {
        $super(evt);
        if (!this.textString) {
            evt.stop();
            return true;
        }
        this.textString = this.textString.substring(0, this.textString.length-1);
        evt.stop();
        return false;
    },

    initialize: function($super, arg, string) {
        $super(arg, string);
        this.evalExpression = undefined;
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
        return isNaN(floatValue) ? content : floatValue;
    },

    clear: function() {
        this.textString = '';
        this.evalExpression = undefined;
    }

},
'rendering values', {
    updateRelativeTimestamp: function(baseTime) {
        this.textString = (baseTime.relativeTo(new Date()) + ' ago');
    }
});

lively.morphic.DataGridCell.subclass('lively.morphic.DataGridHeadCell',
'settings', {
    style: { fill: Color.rgb(220, 220, 200) }
},
'default category', {
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },
    updateDisplay: Functions.Null
});


lively.morphic.DataGridHeadCell.subclass('lively.morphic.DataGridColHead',
'settings', {
    isColHead: true
},
'default category', {
    clear: function() {
        this.evalExpression = undefined;
    }
});

lively.morphic.DataGridHeadCell.subclass('lively.morphic.DataGridRowHead',
'settings', {
    isRowHead: true
});

Object.extend(lively.morphic.Grid, {
    openWithData: function(data) {
        var grid = new lively.morphic.DataGrid(data[0].length, data.length, {
            showRowHeads: false, showColHeads: false});

        grid.setData(data)
        grid.openInWorld($world.visibleBounds().center());
        grid.openInWindow.bind(grid).delay(0.1)

        grid.getLayoutableSubmorphs().invoke('setClipMode', 'auto')
        grid.getLayoutableSubmorphs().invoke('setExtent', pt(300, 100))

        grid.setClipMode('auto')
        grid.setExtent(pt(600, 500))

        grid.withAllSubmorphsDo(function(ea) { ea.setFill(Color.white); })
        // grid.getLayoutableSubmorphs().invoke('applyStyle', {fixedHeight: false})


        return grid;
    }
})

});
