module('lively.ide.tools.Terminal').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.Terminal', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(735.0,430.0),
    className: "lively.morphic.Window",
    sourceModule: "lively.morphic.Widgets",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: {
        adjustForNewBounds: true
    },
    name: "Terminal",
    submorphs: [
        lively.BuildSpec('lively.ide.tools.CommandLine').customize({name: 'CommandLine'}), {
        _Position: lively.pt(4.0,22.0),
        _Extent: lively.pt(727.0,380.0),
        style: {
            borderColor: Color.rgb(212,212,212), borderWidth: 1,
            fontSize: 11,
            theme: "chrome",
            textMode: 'text',
            showIndents: false,
            softTabs: true,
            lineWrapping: false,
            showActiveLine: false,
            gutter: false,
            showIndents: false,
            invisibles: false,
            printMargin: false
        },
        accessibleInInactiveWindow: true,
        className: "lively.morphic.CodeEditor",
        layout: {
            resizeHeight: true,
            resizeWidth: true
        },
        name: "Output",
        sourceModule: "lively.ide.CodeEditor",
        onWindowGetsFocus: function onWindowGetsFocus() {
            this.get('CommandLine').focus();
        }
    }],
    titleBar: "Terminal",
    onKeyDown: function onKeyDown(evt) {
        var sig = evt.getKeyString(),
            cmdLine = this.get('CommandLine'),
            output = this.get('Output');
        switch(sig) {
            case 'Tab': cmdLine.isFocused() ? output.focus() : cmdLine.focus(); evt.stop(); return true;
        }
        if (!cmdLine.isFocused()) return;
        switch(sig) {
            case 'Alt-Up': output.focus(); evt.stop(); return true;
            case 'Alt-Down': cmdLine.focus(); evt.stop(); return true;
            default: $super(evt);
        }
    },
    sendCommand: function sendCommand(commandString, thenDo) {
        // module("lively.ide.CommandLineInterface").load()
        var cmd = lively.ide.CommandLineInterface.run(commandString, thenDo),
            output = this.get('Output');
        output.clear();
        lively.bindings.connect(cmd, 'stdout', output, 'insertTextStringAt', {updater: function($upd, data) { $upd(null, data); }});
        lively.bindings.connect(cmd, 'stderr', output, 'insertTextStringAt', {updater: function($upd, data) { $upd(null, '\n' + data); }});
        lively.bindings.connect(cmd, 'code', output, 'insertTextStringAt', {updater: function($upd, data) { $upd(null, '\nexited: ' + data); }});
    },

    connectionRebuilder: function connectionRebuilder() {
        var cmdLine = this.get('CommandLine');
        cmdLine && lively.bindings.connect(cmdLine, 'input', this, 'sendCommand', {
            updater: function($upd, cmdString) { $upd(cmdString, function() { this.scrollToRow(0); this.setSelectionRange(0,0); }.bind(this.targetObj.get('Output'))); },
        });
    },
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        var cmdLine = this.get('CommandLine'), output = this.get('Output');
        (function() {
            output.setExtent(output.getExtent().withX(output.owner.getExtent().x-8))
            cmdLine.setExtent(cmdLine.getExtent().withX(output.getExtent().x));
            cmdLine.align(cmdLine.bounds().topLeft(), output.bounds().bottomLeft().addXY(0, 3));
            cmdLine.applyStyle({
                borderWidth: output.getBorderWidth(), borderColor: output.getBorderColor(),
                moveVertical: true, resizeWidth: true
            });
        }).delay(0);
    }
});

}) // end of module