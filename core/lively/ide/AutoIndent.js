module('lively.ide.AutoIndent').requires('lively.morphic.TextCore').toRun(function() {

cop.create('AutoIndentLayer').refineClass(lively.morphic.Text, {
    onEnterPressed: function(evt) {
        cop.proceed(evt);
        if (!this.isInputLine && !evt.isCommandKey() && this.getSelectionRange()) {
            var endOfLastLine = this.getSelectionRange()[0] - 2;
            var beginOfLastLine = this.textString.lastIndexOf('\n', endOfLastLine);
            var lastLine = this.textString.substring(beginOfLastLine + 1, endOfLastLine + 1);
            var indent = lastLine.match(/^[\ \t]*/).join();
            if (['{','[','('].include(this.textString[endOfLastLine])) indent += this.tab;
            this.insertAtCursor(indent, false, false);
        }
        return true;
    },
})

}) // end of module