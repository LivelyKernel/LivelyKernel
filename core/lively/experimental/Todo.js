module('lively.experimental.Todo').requires('cop.Layers','lively.morphic.Widgets').toRun(function() {

cop.create("TodoLayer").refineClass(lively.morphic.Text, {

    doDoit: function() {

        var str = this.getSelectionOrLineString()

        if (str.match(/^[ \t]*☐.*/)) {

            str = str.replace("☐","✔") + " @done ("

                + new Date().format("yy-mm-dd HH:MM") + ")"

            this.insertAtCursor(str, false, true)

        } else if (str.match(/^[ \t]*✔.*/)) {

            str = str.replace("✔","☐")

            str = str.replace(/\@done.*/,"")

            this.insertAtCursor(str, false, true)

        } else {

            return cop.proceed()

        }

    }, 

    onEnterPressed: function (evt) {

        if (!this.isInputLine && evt.isCommandKey() && evt.isShiftDown()) {

            // this.selectCurrentLine()

            var str = this.getSelectionOrLineString()

            var m = str.match(/^([ \t]*)/)

            if (!m || str == m[1]) {

                this.insertAtCursor("☐ ", false, false)

            } else {

                this.insertAtCursor("\n" + m[1] +"☐ ", false, false)

            }

            evt.stop();

            return true;

        } else {

            return cop.proceed(evt)

        }

    }

}).beGlobal()



}) // end of module
