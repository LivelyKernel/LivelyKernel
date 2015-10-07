module('lively.ide.codeeditor.tests.DraggableCode').requires('lively.ide.tests.CodeEditor', 'lively.ide.codeeditor.DraggableCode').toRun(function() {

lively.ide.tests.CodeEditor.Base.subclass('lively.ide.tests.DraggableCode.EditorExtension',
'running', {
    setUp: function($super, run) {
        var self = this;
        $super(function() {
            this.editor.setShowGutter(false);
            this.editor.openInWorldCenter();
            this.editor.withAceDo(function(ed) { run.delay(0); });
        });
    }
},
'testing', {

    nodeFromEvent: function() {
      this.editor.textString = "foo.bar";
    },

});

}) // end of module
