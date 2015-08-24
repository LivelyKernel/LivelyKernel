module('lively.experimental.BiggerStatusMessages').requires().toRun(function() {

cop.create("BiggerStatusMessagesLayer").refineClass(lively.morphic.World, {
    setStatusMessage: function (msg, color, delay, callback, optStyle) {
        console[color == Color.red ? "error" : "log"](msg);

        if (!lively.Config.get('verboseLogging')) return null;

        var msgMorph = this.createStatusMessage(msg, Object.merge([{fill: color, extent: pt(600, 150)}, optStyle]));
        // callbacks are currently not supported...
        if (false && callback) {
            var btn = new lively.morphic.Button(lively.rect(0,0,50,20), 'more')
            btn.callbackFunc = callback;
            msgMorph.addMorph(btn);
            btn.align(btn.bounds().topRight(), closeBtn.bounds().topLeft().addPt(pt(-5,0)));
            connect(btn, 'fire', btn, 'callbackFunc')
        }
        msgMorph.setAppearanceStylingMode(false)
        msgMorph.setFill(color)
        return this.addStatusMessageMorph(msgMorph, delay || 5);
    },
    alert: function (msg, delay) {
        msg = String(msg);
        this.lastAlert = msg;
        this.setStatusMessage(msg, Color.red.withA(0.7), delay, function() {
            var w = $world.addTextWindow({title: 'ALERT',
                content: msg, syntaxHighlighting: false});
            w.owner.align(w.owner.bounds().topRight(), $world.visibleBounds().topRight())
        }, {extent: pt(600,150), cssStylingMode: true, cssStyling: true})
    },
    logError: function (er, optName) {
        Global.LastError = er;
        var msg = (optName || 'LOGERROR: ') + String(er) + "\nstack:" + er.stack;
        var morph = this.setStatusMessage(msg, Color.red.withA(0.7), 9, function() {
            var errorStackViewer = this.openPartItem("ErrorStackViewer", "PartsBin/Tools");
            errorStackViewer.align(
                errorStackViewer.bounds().topCenter(), this.visibleBounds().topCenter());
            errorStackViewer.setError(er);
        }.bind(this), 
        {extent: pt(800,150), cssStylingMode: true, cssStyling: true});
    }
}).beGlobal() 

}) // end of module
