module('lively.morphic.tests.Logging').requires('lively.morphic.tests.Helper','lively.morphic.GlobalLogger').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.LoggingTests.SimpleLogging',
'running', {
    setUp: function($super) {
        $super();
        var self = this;
        this.testMorph = Morph.makeRectangle(pt(0,0).extent(pt(100,100)))
        this.testMorph.isLoggable = true;
        this.testMorph.shape.isLoggable = true;
        this.dummyAction = {
            morph: this.testMorph,
            undo: function () {
                self.testMorph.dummyProperty = 'undo'
            },
            redo: function () {
                self.testMorph.dummyProperty = 'redo'
            }
        }
        this.dummyFunction = function dummyFunction() {return 'foo'}
        lively.morphic.World.current().GlobalLogger = new lively.GlobalLogger();
    },
},
'logging', {
    testLogAction: function() {
        // enter comment here
        $world.GlobalLogger.logAction(this.dummyAction)
        this.assertEquals($world.GlobalLogger.stack.length, 1, 'did not log action')
    },
    testForceNewSlot: function() {
        $world.GlobalLogger.logAction(this.dummyAction);
        $world.GlobalLogger.forceNewSlot();
        $world.GlobalLogger.logAction(this.dummyAction);
        this.assertEquals($world.GlobalLogger.stack.length, 2, 'forcing new slot did not work')
    }


},
'undoredo', {
    testUndoLastAction: function () {
        $world.GlobalLogger.logAction(this.dummyAction);
        $world.GlobalLogger.undoLastAction();
        this.assertEquals(this.testMorph.dummyProperty, 'undo', 'wrong effect of undo last action')
    },
    testUndoAction: function () {
        $world.GlobalLogger.undoAction(this.dummyAction);
        this.assertEquals(this.testMorph.dummyProperty, 'undo', 'wrong effect of undo action')
    },
    testRedoNextAction: function () {
        $world.GlobalLogger.logAction(this.dummyAction);
        $world.GlobalLogger.undoLastAction();
        $world.GlobalLogger.redoNextAction();
        this.assertEquals(this.testMorph.dummyProperty, 'redo', 'wrong effect of redo next action')
    },
    testRedoAction: function () {
        $world.GlobalLogger.redoAction(this.dummyAction);
        this.assertEquals(this.testMorph.dummyProperty, 'redo', 'wrong effect of redo action')
    },
},
'disable and enable', {
    testDisableLogging: function () {
        $world.GlobalLogger.disableLogging();
        this.testMorph.setFill(Color.red);
        this.assertEquals($world.GlobalLogger.stack.length, 0, 'logged an action without being enabled')
    },
    testEnableLogging: function () {
        $world.GlobalLogger.disableLogging();
        $world.GlobalLogger.enableLogging();
        this.testMorph.setPosition(pt(0,0));
        this.assertEquals($world.GlobalLogger.stack.length, 1, 'did not log an action allthough being enabled')
    },
},
'customized logging functions', {
    testUndoAddMorph: function () {
        $world.GlobalLogger.disableLogging();
        var container = $world.addMorph(Morph.makeRectangle(pt(0,0).extent(pt(100,100))));
        $world.GlobalLogger.enableLogging();
        container.isLoggable = true;
        container.shape.isLoggable = true;
        container.addMorph(this.testMorph);
        $world.GlobalLogger.undoLastAction();
        this.assertEquals(container.submorphs.length, 0, 'unable to undo morph addition')
    },
    testUndoRemove: function () {
        $world.GlobalLogger.disableLogging();
        var container = $world.addMorph(Morph.makeRectangle(pt(0,0).extent(pt(100,100))));
        container.isLoggable = true;
        container.addMorph(this.testMorph);
        this.testMorph.isLoggable = true;
        $world.GlobalLogger.enableLogging();
        this.testMorph.remove()
        $world.GlobalLogger.undoLastAction();
        this.assertEquals(container.submorphs.length, 1, 'unable to undo morph addition')
    },
    testUndoSetPosition: function () {
        var pos = this.testMorph.getPosition()
        this.testMorph.setPosition(pt(100,100));
        $world.GlobalLogger.undoLastAction();
        this.assertEquals(this.testMorph.getPosition(), pos, 'unable to undo Position setting')
    },
    testUndoSetFill: function () {
        var originalColor = this.testMorph.getFill();
        var color = Color.random();
        while (color === this.testMorph.getFill()) {
            color = Color.random();
        }
        this.testMorph.setFill(color)
        $world.GlobalLogger.undoLastAction();
        this.assertEquals(this.testMorph.getFill(), originalColor, 'undo setFill did not work')
    },
    testUndoAddScript: function () {
        this.testMorph.addScript(this.dummyFunction.toString());
        $world.GlobalLogger.undoLastAction();
        this.assert(!this.testMorph.dummyFunction, 'unable to undo add script');
    },
    testUndoStartStepping: function () {
        // not implemented yet
        this.testMorph.dummyProperty = 'original value'
        this.testMorph.dummyFunction = this.dummyFunction;
        this.testMorph.startStepping(100, 'dummyFunction');
        $world.GlobalLogger.undoLastAction();
        this.assertEquals(this.testMorph.scripts.length, 0, 'running script was not removed')
    },
    testUndoOpenInWindow: function () {
        $world.addMorph(this.testMorph);
        $world.GlobalLogger.forceNewSlot();
        this.testMorph.openInWindow();
        $world.GlobalLogger.undoLastAction();
        this.assert(!(this.testMorph.owner instanceof lively.morphic.Window), 'unable to undo openInWindow')
    },
    testUndoLock: function () {
        // TODO: write test
    },
})

}) // end of module