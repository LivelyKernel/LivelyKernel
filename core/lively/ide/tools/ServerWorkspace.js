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
        accessibleInInactiveWindow: true,
        className: "lively.morphic.CodeEditor",
        grabbingEnabled: false,
        layout: {resizeHeight: true,resizeWidth: true},
        sourceModule: "lively.ide.CodeEditor",
        textMode: "javascript",
        _ShowGutter: false,
        theme: lively.Config.get('aceWorkspaceTheme'),
        textString: "// all this code is evaluated in the server context!\n// try to print it:\nprocess.env.WORKSPACE_LK",
        boundEval: function boundEval(__evalStatement, __evalOptions) {
        __evalOptions = Object.extend({
          sourceURL: this.getWindow() ?
            this.getWindow().getTitle() : "lively-nodejs- workspace",
          varRecorderName: "global",
          topLevelVarRecorder: {}
        }, __evalOptions || {});
      
        var __evalStatement = lively.lang.VM.evalCodeTransform(
          __evalStatement, __evalOptions);
    
        var nodejsServer = this.serverURL.asWebResource();
        return nodejsServer.post(__evalStatement).content;
    },
        getCompletions: function getCompletions(string) {
            // this.getCompletions('lively.re')
            var nodejsServer = this.serverURL.withFilename('completions').asWebResource();
            var result = nodejsServer.post(JSON.stringify({string: string}), 'application/json').content;
            return JSON.parse(result);
        },
        doListProtocol: function doListProtocol() {
            var string = this.getSelectionOrLineString(),
                completions = this.getCompletions(string);
            lively.require("lively.ide.codeeditor.Completions").toRun(function() {
                new lively.ide.codeeditor.Completions.ProtocolLister(this).openNarrower(completions);
            }.bind(this));
        },
        printInspect: function printInspect(options) {
          options = options || {};
          var depth = options.depth ? options.depth-1 : 0;
          var s = this.getSelectionMaybeInComment();
          s = 'require("util").inspect(' + s + ', null, ' + depth + ')';
          var result = this.tryBoundEval(s);
          this.printObject(null, result);
      },
        setServerURL: function setServerURL(url) {
            this.serverURL = new URL(url);
            this.owner.setTitle && this.owner.setTitle('ServerWorkspace -- ' + this.serverURL);
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
