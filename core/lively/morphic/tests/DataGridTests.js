module('lively.morphic.tests.DataGridTests').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.DataGridTests.DataGridTests',
'running', {
    setUp: function($super) {
        $super();
        this.grid = new lively.morphic.DataGrid(5,5, {showColHeads: false});
        this.grid.openInWorld();
    },
    tearDown: function($super) {
        $super();
        this.grid.remove();
    },
},
'testing', {
    test01activateCell: function() {
        this.grid.at(2,2).activate();
        this.assertEquals(this.grid.activeCell, this.grid.at(2,2), 'cell (2,2) should be active after activation');
    },
    test02TestEvaluate: function() {
        this.grid.evaluateExpression("this.at(3,3).activate()");
        this.assertEquals(this.grid.activeCell, this.grid.at(3,3), "could not activate cell (3,3) using evaluateExpression");
    },
    test03evaluateNumericExpressions: function() {
        this.grid.at(2,2).put('76');
        this.grid.at(2,3).put('22');
        this.grid.at(2,4).put(this.grid.evaluateExpression("cell(2,2) + cell(2,3)"));
        this.assertEquals(this.grid.at(2,4).textString, '98', 'evaluated expression did not add correctly');
    },
    test04setArrayData: function() {
        this.grid.setData([['Hello', 'World'], [1, 3] ]);
        this.assertEquals(this.grid.at(0,0).textString, 'Hello', 'cell(0,0) expected to display Hello');
        this.assertEquals(this.grid.at(1,1).textString, '3', 'cell(0,0) expected to display 3');
    },

    test05setObjectData: function() {
        this.grid.setColNames(new Array(this.grid.numCols));
        this.grid.setData([{a: 'Hello', b:'World'}, {a:1, b:3} ]);
        this.assertEquals(this.grid.at(0,0).textString, 'Hello', 'cell(0,0) expected to display Hello');
        this.assertEquals(this.grid.at(1,1).textString, '3', 'cell(0,0) expected to display 3');
    },

    test05bSetNamedDataObject: function() {
        this.grid.setColNames(['a', 'c']);
        this.grid.setData([{a: 1, b: 2, c: 3}]);
        this.assertEquals(this.grid.at(0,0).getContent(), 1, '(0,0) expected to contain 1');
        this.assertEquals(this.grid.at(1,0).getContent(), 3, '(0,1) expected to contain 3');
    },

    test06resizeRowsAndCols: function() {
        // TODO does not belong here - write GridLayout
        //this.grid.at(1,1).setExtent(pt(77,77));
        //this.assertEquals(this.grid.at(1,0).getExtent().x, 77, 'column should have been resized');
        //this.assertEquals(this.grid.at(0,1).getExtent().y, 77, 'row should have been resized');
    },
    test07saveAndEditEvalExpression: function() {
        var cell = this.grid.at(0,0);
        cell.activate();
        cell.textString = '=8*2';
        this.grid.at(0,1).activate();
        this.assertEquals(cell.textString, '16', 'cell should display result of 8*2');
        cell.activate();
        this.assertEquals(cell.textString, '=8*2', 'cell should display expression =8*2');
    },
    test08recalculateRowsFirst: function() {
        var cell1, cell2;
        cell1 = this.grid.at(0,0);
        cell2 = this.grid.at(0,1);
        cell2.activate();
        cell2.textString = '=cell(0,0) * 2';
        cell1.activate();
        cell1.textString = '8';
        this.grid.at(0,2).activate();
        this.assertEquals(cell2.textString, '16', 'cell at (0,1) should update its display');
    },

    test09fancySyntaxForEvalExpressions: function() {
        this.grid.at(0,0).textString = '999';
        var c = this.grid.at(0,1);
        c.activate();
        c.textString = '=cell(0,0)';
        this.grid.at(0,2).activate();
        this.assert(c.textString, '999', 'cells should be accessible via cell variable');
    },

    test10nameColsAndReturnActiveRow: function() {
        this.grid.setColNames(['Col1', 'Col2', 'Col3']);
        this.grid.at(0,0).put('Value1');
        this.grid.at(1,0).put('Value2');
        this.grid.at(2,0).put('Value3');
        this.grid.at(3,0).put('Value4');
        this.grid.at(0,0).activate();
        var result = this.grid.getActiveRowObject();
        this.assertEquals(result['Col1'], 'Value1', 'expected Col1 to be Value1');
        this.assertEquals(result['Col2'], 'Value2', 'expected Col2 to be Value2');
        this.assertEquals(result['Col3'], 'Value3', 'expected Col3 to be Value3');
        // fourth column is not named
    },

    test11getActiveRowIndex: function() {
        this.grid.at(2,3).activate();
        this.assertEquals(this.grid.getActiveRowIndex(), 3, 'getActiveRowIndex should return 3');
    },
    test13addColAddsColumn: function() {
        var numCols = this.grid.numCols;
        this.grid.addCol('newCol');
        this.assertEquals(this.grid.numCols, numCols + 1, 'numCols did not change');
    },
    test14addColAddsCells: function() {
        var numCols = this.grid.numCols;
        this.grid.addCol();
        this.grid.at(numCols, 3).put(42);
        this.assertEquals(42, this.grid.evaluateExpression('cell(' + numCols + ', 3)'),
                          'expresssion did not evaluate correctly')
    },
    test15addRowAddsRow: function() {
        var numRows = this.grid.numRows;
        this.grid.addRow();
        this.assertEquals(this.grid.numRows, numRows + 1, 'expected numRows to increment by 1');
    },
    test16addRowAddsCells: function() {
        var numRows = this.grid.numRows;
        this.grid.addRow();
        this.grid.at(0, numRows).put(23);
        this.assertEquals(23, this.grid.evaluateExpression('cell(0,' + numRows + ')'),
            'expected content of newly added cell to be 23');
    },
    test17addRowSetsGridCoords: function() {
        var numRows = this.grid.numRows;
        this.grid.addRow();
        this.assertEquals(numRows + (this.grid.hideColHeads ? 0 : 1), this.grid.at(0,numRows).gridCoords.y,
                          'addRow did not set gridCoords');
    },

    test18getDataObjects: function() {
        this.grid.clear();
        this.grid.setColNames(['foo','bar']);
        this.grid.at(0,0).put(1);
        this.grid.at(0,1).put(2);
        this.grid.at(1,0).put(3);
        this.grid.at(1,1).put(4);
        var numRows = this.grid.numRows;
        var dataObjects = this.grid.getDataObjects();
        this.assertEquals(dataObjects.length, numRows, 'grid did not return enough data objects');
        this.assertEquals(dataObjects[0].foo, 1);
        this.assertEquals(dataObjects[1].foo, 2);
        this.assertEquals(dataObjects[0].bar, 3);
        this.assertEquals(dataObjects[1].bar, 4);
    },

    test19removeRow: function() {
        var numRows = this.grid.numRows;
        this.assertEquals(this.grid.getDataObjects().length, numRows, 'setup failed');
        this.grid.removeRow();
        this.assertEquals(this.grid.getDataObjects().length, numRows - 1, 'row was not removed');
    },

    test20removeCol: function() {
        this.grid.clear();
        var numCols = this.grid.numCols,
            names = new Array(numCols);
        for (var i = 0; i < numCols; i++) {
            names[i] = 'col' + i;
            this.grid.at(0,i).put(i);
        }
        this.grid.setColNames(names);
        this.grid.removeCol();
        this.assertEquals(this.grid.getDataObjects()[0]['col'+ (numCols-1)],
                          undefined,
                          'last column was not removed');
        this.assertEquals(this.grid.colHeads[numCols-1],
                          undefined,
                          'last column head was not removed');
    },

    test21getActiveColName: function() {
        this.grid.clear();
        this.grid.setColNames(['Foo', 'Bar']);
        this.grid.at(1,3).activate();
        this.assertEquals(this.grid.getActiveColName(), 'Bar', 'col name should be Bar');
    },

    test22MoveActiveCell: function() {
        this.grid.at(1,1).activate();
        this.grid.moveActiveCellBy(pt(0,1));
        this.assertIdentity(this.grid.at(1,2), this.grid.activeCell);
    },

});


lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.DataGridTests.DataGridColHeadTests',
'running', {

    setUp: function($super) {
        $super();
        this.grid = new lively.morphic.DataGrid(5,5, {showColHeads: true});
        this.grid.openInWorld();
    },

    tearDown: function($super) {
        $super();
        this.grid.remove();
    }

},
'testing', {

    test01ColHeadsAreCreatedAndAreInGrid: function() {
        this.assert(this.grid.rows[0][0].isColHead, 'not a col head at rows[0][0]');
        this.assert('[0]', this.grid.rows[0][0].name, 'head name not OK');
    },

    test02COlHeadCountsAsRow: function() {
        this.assert(!this.grid.rows[5], 'one row to much');
    },

    test03ColHeadsDoNotBelongToActiveGrid: function() {
        this.assertIdentity(this.grid.rows[1][0], this.grid.at(0,0));
        this.assertEquals('[0;0]', this.grid.rows[1][0].name, 'cell name not OK');
    },

    test04NewColHeadIsCreatedOnAddCol: function() {
        this.grid.addCol();
        this.assert(this.grid.rows[0][5].isColHead, 'no colHead created');
        this.assertIdentity(this.grid.rows[1][5], this.grid.at(5, 0), 'at not working');
        this.assert(!this.grid.rows[5], 'one row too much!');
    },

    test05MoveActiveCell: function() {
        this.grid.at(4,3).activate();
        this.grid.moveActiveCellBy(pt(0,1));
        this.assertIdentity(this.grid.at(4,3), this.grid.activeCell);
    },

    xtest10nameColsAndReturnActiveRow: function() {
        this.grid.setColNames(['Col1', 'Col2', 'Col3']);
        this.grid.at(0,0).put('Value1');
        this.grid.at(1,0).put('Value2');
        this.grid.at(2,0).put('Value3');
        this.grid.at(3,0).put('Value4');
        this.grid.at(0,0).activate();
        var result = this.grid.getActiveRowObject();
        this.assertEquals(result['Col1'], 'Value1', 'expected Col1 to be Value1');
        this.assertEquals(result['Col2'], 'Value2', 'expected Col2 to be Value2');
        this.assertEquals(result['Col3'], 'Value3', 'expected Col3 to be Value3');
        // fourth column is not named
    },

    xtest12setHeadingsForColNames: function() {
        this.grid.openInWorld();
        this.grid.setColNames(['Foo', 'Bar']);
        this.assertEquals(this.grid.getColHead(0).textString, 'Foo', 'column header not set');
        this.assertEquals(this.grid.getColHead(1).textString, 'Bar', 'column header not set');
    },



});


}) // end of module