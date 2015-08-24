module('lively.experimental.TextPaste').requires('cop.Layers','lively.morphic.Widgets', 'lively.ide.CodeEditor').toRun(function() {
cop.create("TextPasteLayer").refineClass(lively.morphic.Text, {
   onPaste: function (evt) {
        var textData = evt.clipboardData && evt.clipboardData.getData("text/plain");
        // automatically remove hyphens when e.g. copying from pdf...
        // maybe this should be explicitly be turned on and off
        textData = textData.replace(/([a-z])- ([a-z])/g, function($0,$1,$2) {
            return $1+$2
        })
        this.insertAtCursor(textData, true, true);
        evt.stop()
        return true;
    }
}).refineClass(ace.require("./editor").Editor, {
    onPaste: function(s){
        return cop.proceed(s.replace(/\r\n/g,"\n")) // take care of line endings under windows....
    }, 
}).beGlobal()


}) // end of module
