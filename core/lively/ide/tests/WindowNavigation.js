module('lively.ide.tests.WindowNavigation').requires('lively.ide.WindowNavigation', 'lively.morphic.tests.Helper').toRun(function() {

AsyncTestCase.subclass('lively.ide.tests.WindowNavigation.WindowManager', lively.morphic.tests.TestCase.prototype,
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
        this.sut = new lively.ide.WindowNavigation.WindowManager(this.world);
    }
},
'testing', {
    testGetListOfWindows: function() {
        this.world.addFramedMorph(lively.morphic.Morph.makeRectangle(0,0, 100, 100), 'A', pt(20, 20));
        this.world.addTextWindow({title: 'B', content: 'foo', position: pt(10,10)});
        var windows = this.sut.getWindows();
        this.assertEqualState(['A', 'B'], windows.invoke('getTitle'));
        this.done();
    },
    testSelectWindow: function() {
        this.world.addCodeEditor({title: 'A', content: 'foo', position: pt(10,10)});
        this.world.addCodeEditor({title: 'B', content: 'bar', position: pt(20,20)});
        var windows = this.sut.getWindows();
        this.assertEqualState(['A', 'B'], windows.invoke('getTitle'));
        this.delay(function() {
            this.sut.activate(windows[0]);
            this.assert(windows[0].targetMorph.isFocused(), 'code editor in window A not focused');
            this.sut.activate('B');
        }, 0);
        this.delay(function() {
            this.assert(windows[1].targetMorph.isFocused(), 'code editor in window B not focused');
            this.done();
        }, 50);
    }
});

}) // end of module
