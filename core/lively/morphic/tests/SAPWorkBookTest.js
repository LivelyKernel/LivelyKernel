module('lively.morphic.tests.SAPWorkBookTest').requires('lively.morphic.tests.Morphic','lively.morphic.SAPWorkSheet').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.SAPWorkBookTest.SAPWorkBookTest',
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
    }

});
}) // end of module