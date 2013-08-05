module('lively.ide.tools.ServerWorkspace').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.ServerWorkspace', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(605.0,302.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    layout: {adjustForNewBounds: true},
    name: "ServerWorkspace",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(597.0,275.0),
        _FontSize: 12,
        _Position: lively.pt(4.0,22.0),
        _Theme: "twilight",
        accessibleInInactiveWindow: true,
        className: "lively.morphic.CodeEditor",
        grabbingEnabled: false,
        layout: {resizeHeight: true,resizeWidth: true},
        sourceModule: "lively.ide.CodeEditor",
        textMode: "javascript",
        textString: "// all this code is evaluated in the server context!\n// try to print it:\nprocess.env.WORKSPACE_LK",
        theme: "twilight",
        boundEval: function boundEval(string) {
            var nodejsServer = this.serverURL.asWebResource();
            return nodejsServer.post(string).content;
        },
        printInspect: function printInspect() {
            var s = this.getSelectionMaybeInComment();
            s = 'require("util").inspect(' + s + ', null, 0)';
            var result = this.tryBoundEval(s);
            this.printObject(null, result);
        },
        setServerURL: function setServerURL(url) {
            this.serverURL = new URL(url);
            this.owner.setTitle('ServerWorkspace -- ' + this.serverURL);
        },
        setServerURLInteractively: function setServerURL() {
            this.world().prompt('Change server URL', function(url) {
                if(!url) { alert('no url!'); return; }
                this.setServerURL(url);
            }.bind(this), this.serverURL);
        },
        onKeyDown: function onKeyDown(evt) {
            var keys = evt.getKeyString();
            if (keys === 'Command-U') { this.setServerURLInteractively(); return true; }
            return false;
        },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
            $super();
            this.setServerURL(URL.create(Config.nodeJSURL).asDirectory().withFilename('NodeJSEvalServer/'));
        }
    }],
    titleBar: "ServerWorkspace"
});

}) // end of module