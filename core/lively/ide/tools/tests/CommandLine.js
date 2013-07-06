module('lively.ide.tools.tests.CommandLine').requires('lively.ide.tools.CommandLine', 'lively.TestFramework').toRun(function() {

AsyncTestCase.subclass('lively.ide.tools.CommandLine.Interface',
"running", {
    setUp: function()  {
        this.sut = lively.BuildSpec('lively.ide.tools.CommandLine').createMorph();
        this.sut.openInWorld();
    },
    tearDown: function()  {
        this.sut && this.sut.remove();
    }
},
'testing', {
    testSetLabel: function() {
        this.sut.setLabel('foo: ');
        this.sut.setInput('bar');
        this.sut.selectAll();
        var selString = this.sut.getSelectionOrLineString();
        this.assertEquals('bar', selString);
        this.assertEquals('bar', this.sut.getInput());
        this.done();
    }
});

}) // end of module