module('lively.ide.tools.ServerLog').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.ServerLog', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(781.0,458.0),
    cameForward: true,
    className: "lively.morphic.Window",
    name: 'ServerLog',
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: { adjustForNewBounds: true },
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(773.0,432.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        isUpdating: false,
        layout: {adjustForNewBounds: true, resizeHeight: true, resizeWidth: true },
        name: "ServerLogPanel",
        prevLog: null,
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(767.0,48.0),
            _FontSize: 11,
            _LineWrapping: false,
            _Position: lively.pt(3.0,3.0),
            _ShowGutter: false,
            _TextMode: "text",
            accessibleInInactiveWindow: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["whenOpenedInWorldCallbacks"],
            layout: { resizeHeight: false, resizeWidth: true },
            name: "serverState",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            textString: ""
        },{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(767.0,355.0),
            _FontSize: 9,
            _LineWrapping: false,
            _Position: lively.pt(3.0,53.0),
            _ShowGutter: false,
            _TextMode: "text",
            accessibleInInactiveWindow: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            layout: { resizeHeight: true, resizeWidth: true },
            name: "stdout",
            sourceModule: "lively.ide.CodeEditor",
            storedString: ""
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(3.0,410.0),
            className: "lively.morphic.Button",
            label: "clear log",
            layout: { moveVertical: true },
            name: "clearButton",
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            this.get('stdout').clear();
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(104.0,410.0),
            className: "lively.morphic.Button",
            label: "start updating",
            layout: { moveVertical: true },
            name: "stopStartButton",
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            this.get('ServerLogPanel').toggleUpdating();
        }
        }],
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('stdout').focus();
    },
        printServerStatus: function printServerStatus(report) {
        var uptime = (new Date(Date.now()-report.uptime*1000)).relativeTo(new Date()),
            pid = report.pid, platform = report.platform + '(' + report.arch + ')',
            version = report.version,
            rss = Numbers.humanReadableByteSize(report.memoryUsage.rss),
            heapTotal = Numbers.humanReadableByteSize(report.memoryUsage.heapTotal),
            heapUsed = Numbers.humanReadableByteSize(report.memoryUsage.heapUsed),
            string = Strings.format('uptime: %s, pid: %s,\n'
                                  + 'platform: %s, nodejs version: %s,\n'
                                  + 'memory usage (RAM / heap allocated / heap used): %s / %s / %s',
                                    uptime, pid, platform, version, rss, heapTotal, heapUsed);
        this.get('serverState').textString = string;
    },
        printServerStdout: function printServerStdout(log) {
        // var maxSize = Math.pow(2,18)// 256KB
        // var newString = (this.get('stdout').textString + log.stdout).slice(-maxSize);
        // this.get('stdout').textString = newString;
        var string = log.stdout.replace(lively.ide.CommandLineInterface.ansiAttributesRegexp, '');
        this.prevLog = {stdoutIndex: log.stdoutIndex};
        if (string === '') return;
        if (!string.endsWith('\n')) string += '\n';
        var logText = this.get('stdout')
        logText.withAceDo(function(ed) {
            var maxLength = 500000,
                length = ed.getValue().length,
                atBottom = ed.getCursorPosition().row >= length-2;
            if (length + string.length > maxLength) {
                var cutoff = Math.max(0, length - string.length - 100000),
                    snip = logText.indexToPosition(cutoff);
                logText.replace({
                    start: {column: 0, row: 0},
                    end: {column: snip.column, row: snip.row}
                }, '');
            }
            ed.session.insert(
                ed.session.screenToDocumentPosition(Number.MAX_VALUE, Number.MAX_VALUE),
                string);
            atBottom && ed.selection.moveCursorFileEnd(); })
    },
        reset: function reset() {
        // this.reset();
        // this.startStepping(2000, 'update')
        this.getPartsBinMetaInfo().addRequiredModule('lively.ide.CommandLineInterface');
        this.get('serverState').applyStyle({allowInput: false});
        this.get('stdout').applyStyle({allowInput: false});
        this.get('serverState').textString = '';
        this.get('stdout').textString = '';
        this.get('stdout').storedString = '';
        this.stopStepping();
        this.prevLog = null;
        if (this.isUpdating) this.toggleUpdating();
    },
        startUpdating: function startUpdating() {
        if (!this.isUpdating) {
        this.toggleUpdating();
    }
    },
        toggleUpdating: function toggleUpdating() {
        if (this.isUpdating) {
            this.get('stopStartButton').setLabel('start updating');
            this.stopStepping();
        } else {
            this.get('stopStartButton').setLabel('stop updating');
            this.startStepping(2000, 'update');
        }
        this.isUpdating = !this.isUpdating;
    },
        update: function update() {
        // this.update();
        this.updateServerStatus();
        this.updateStdoutLog();
    },
        updateServerStatus: function updateServerStatus() {
        // this.updateServerStatus();
        var webR = new URL(Config.nodeJSURL + '/LogServer/serverStatus').asWebResource();
        lively.bindings.connect(webR, 'content', this, 'printServerStatus', {
            updater: function($upd, val) {
                if (!this.sourceObj.status.isDone()) return;
                try { $upd(JSON.parse(val)) } catch (e) {}
            }, removeAfterUpdate: true
        });
        webR.beAsync().get();
    },
        updateStdoutLog: function updateStdoutLog() {
        // this.updateStdoutLog();
        var prevLog = this.prevLog;
        var webR = new URL(Config.nodeJSURL + '/LogServer/read').withQuery({lastReadIndex: prevLog ? prevLog.stdoutIndex : 0}).asWebResource();
        lively.bindings.connect(webR, 'content', this, 'printServerStdout', {
            updater: function($upd, val) {
                if (!this.sourceObj.status.isDone()) return;
                try { $upd(JSON.parse(val)) } catch (e) { }
            }, removeAfterUpdate: true
        });
        webR.beAsync().get();    
    }
    }],
    titleBar: "Server Log"
});

Object.extend(lively.ide.tools.ServerLog, {
    open: function() {
        function start(logWindow) {
            if (!logWindow.world() || !$world.visibleBounds().intersects(logWindow.globalBounds())) {
                logWindow.openInWorldCenter();
            }
            logWindow.comeForward();
            logWindow.get('ServerLogPanel').startUpdating();
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var logWindow = $world.get('ServerLog');
        if (logWindow) { start(logWindow); return; }
        start(lively.BuildSpec('lively.ide.tools.ServerLog').createMorph());
    }
});

}) // end of module
