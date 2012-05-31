module('lively.morphic.tests.SAPWorkBookTest').requires('lively.morphic.tests.Morphic','lively.morphic.SAPWorkSheet').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.SAPWorkBookTest.SAPWorkBookTest',
'running', {
    setUp: function($super) {
        $super();
        this.oWorkBook= new lively.morphic.SAPWorkBook(10,10);
        this.oWorkBook.openInWorld();


    },
    tearDown: function($super) {
        $super();
        this.oWorkBook.remove();
    },
},
'testing', {
    test01activateCell: function() {
        this.oWorkBook.grid.at(2,2).activate();
        this.assertEquals(this.oWorkBook.grid.activeCell, this.oWorkBook.grid.at(2,2), 'cell (2,2) should be active after activation');
    },
    test02TestEvaluate: function() {
        this.oWorkBook.grid.evaluateExpression("this.at(3,3).activate()");
        this.oWorkBook.assertEquals(this.oWorkBook.grid.activeCell, this.oWorkBook.grid.at(3,3), "could not activate cell (3,3) using evaluateExpression");
    }

});
}) // end of module