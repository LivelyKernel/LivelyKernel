module('lively.ide.tools.SubserverViewer').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.SubserverViewer', {
    LK2: true,
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(788.8,391.0),
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(4.0,22.0),
    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
    draggingEnabled: true,
    droppingEnabled: false,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "SubserverViewer",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(780.8,365.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        _StyleClassNames: ["Morph","Box","SubserverViewer"],
        _StyleSheet: ".SubserverViewer .StatusText {\n\
        font-size: 8px;\n\
    }",
        className: "lively.morphic.Box",
        doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
        grabbingEnabled: false,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "SubserverViewer",
        nodejsURL: URL.create("http://localhost:9001/nodejs/"),
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(221,221,221),
            _BorderStyle: "inset",
            _BorderWidth: 1.278,
            _ClipMode: "auto",
            _Extent: lively.pt(161.6,331.3),
            _Fill: Color.rgb(243,243,243),
            _FontFamily: "Helvetica",
            _FontSize: 10,
            _Position: lively.pt(7.7,5.8),
            _StyleClassNames: ["Morph","Box","List","ServerList"],
            className: "lively.morphic.List",
            doNotCopyProperties: [],
            doNotSerialize: [],
            itemList: [],
            layout: {
                resizeHeight: true,
                resizeWidth: false
            },
            name: "ServerList",
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("SubserverViewer"), "subserverSelected", {});
        }
        },{
            _ClipMode: "hidden",
            _Extent: lively.pt(600.5,18.4),
            _FontFamily: "Arial, sans-serif",
            _HandStyle: null,
            _InputAllowed: true,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Position: lively.pt(173.5,342.0),
            _StyleClassNames: ["Morph","Text","StatusText"],
            _TextColor: Color.rgb(64,64,64),
            _WordBreak: "break-all",
            allowInput: true,
            className: "lively.morphic.Text",
            doNotSerialize: ["charsTyped"],
            emphasis: [[0,0,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            fixedHeight: true,
            fixedWidth: true,
            layout: {
                moveVertical: true,
                resizeWidth: true
            },
            name: "StatusText",
            sourceModule: "lively.morphic.TextCore",
            submorphs: []
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(23.0,19.0),
            _Position: lively.pt(8.8,339.7),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "⟳",
            layout: {
                moveVertical: true
            },
            name: "UpdateButton",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
            lively.bindings.connect(this, "fire", this.get("SubserverViewer"), "listSubservers", {});
        },
            doAction: function doAction() {
        
                }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(23.0,19.0),
            _Position: lively.pt(33.8,339.7),
            addSubserver: false,
            className: "lively.morphic.Button",
            doAction: false,
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "+",
            layout: {
                moveVertical: true
            },
            name: "AddSubserverButton",
            removeSubserver: false,
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
            lively.bindings.connect(this, "fire", this.get("SubserverViewer"), "addSubserver", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(23.0,19.0),
            _Position: lively.pt(59.1,339.6),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "-",
            layout: {
                moveVertical: true
            },
            name: "RemoveSubserverButton",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
            lively.bindings.connect(this, "fire", this.get("AddSubserverButton"), "removeSubserver", {});
            lively.bindings.connect(this, "fire", this.get("SubserverViewer"), "removeSubserver", {});
        },
            doAction: function doAction() {
        
                }
        },{
            _AutocompletionEnabled: true,
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(603.0,331.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(173.0,5.0),
            _ShowActiveLine: false,
            _ShowGutter: true,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _SoftTabs: true,
            _StyleSheet: "#ace-editor {\n\
            position: absolute;\n\
        	top: 0;\n\
        	bottom: 0;\n\
        	left: 0;\n\
        	right: 0;\n\
        }",
            _TextMode: "javascript",
            _Theme: "twilight",
            accessibleInInactiveWindow: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            doNotCopyProperties: [],
            doNotSerialize: ["whenOpenedInWorldCallbacks"],
            hasRobertsKeys: true,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "ServerSourceCode",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            storedTextString: "",
            submorphs: [],
            textMode: "javascript",
            theme: "twilight",
            boundEval: function boundEval(string) {
                        var nodejsServer = URL.create(Config.nodeJSURL).asDirectory().withFilename('NodeJSEvalServer/').asWebResource();
                        return nodejsServer.post(string).content;
                    },
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "savedTextString", this.get("SubserverViewer"), "writeServerSource", {});
        },
            printInspect: function printInspect() {
                        var s = this.getSelectionMaybeInComment();
                        s = 'require("util").inspect(' + s + ', null, 0)';
                        var result = this.tryBoundEval(s);
                        this.printObject(null, result);
                    }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(55.0,20.0),
            _Position: lively.pt(111.9,338.5),
            className: "lively.morphic.Button",
            label: "open log",
            name: "openServerLogButton",
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
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
            require('lively.ide.tools.SubserverViewer').toRun(function() {
               var logWindow = lively.BuildSpec('lively.ide.tools.ServerLog').createMorph();
               start(logWindow);
            });
        }
        }],
        subserverURL: URL.create("http://localhost:9001/nodejs/subservers/"),
        addSubserver: function addSubserver() {
            this.world().prompt(
                'Please enter a server name',
                function(input) {
                    if (!input) { alert('aborting'); return };
                    var success = this.reallyAddSubserver(input);
                    if (!success) return;
                    this.listSubservers();
                    this.selectServer(input);
                }.bind(this), 'NewServer')
        },
        getServerResource: function getServerResource(serverName) {
            return this.subserverURL.withFilename(serverName).asWebResource();
        },
        listSubservers: function listSubservers() {
            var list;
            try {
                list = JSON.parse(this.subserverURL.asWebResource().get().content);
            } catch(e) {
                list = []
            }
            this.get('ServerList').setList(list);
            this.selectServer(null);
        },
        onLoad: function onLoad() {
            this.nodejsURL = URL.root.withFilename('nodejs/');
            this.subserverURL = this.nodejsURL.withFilename('subservers/');
            this.listSubservers();
        },
        onWindowGetsFocus: function onWindowGetsFocus() {
            this.get('ServerSourceCode').focus();
        },
        reallyAddSubserver: function reallyAddSubserver(serverName) {
            var src = "module.exports = function(route, app) {\n"
                    + "    app.get(route, function(req, res) {\n"
                    + "        res.end(\""
                    + serverName
                    + " is running!\");\n"
                    + "    });\n"
                    + "}\n",
                status = this.getServerResource(serverName).put(src).status;
            if (!status.isSuccess()) {
                alert('Could not create server ' + serverName);
                return false;
            } else {
                alertOK('Server ' + serverName + ' created');
                return true;
            }
        },
        reallyRemoveSubserver: function reallyRemoveSubserver(serverName) {
            var status = this.getServerResource(serverName).del().status;
            if (status.isSuccess()) {
                alertOK('Server removed successfully!');
            } else {
                alert('Server could not be removed.');
            }
        },
        removeSubserver: function removeSubserver() {
            var serverName = this.get('ServerList').selection;
            if (!serverName || serverName === "") {
                $world.setStatusMessage('No server selected!', Color.red, 500);
                return;
            }
            this.world().confirm(
                'Really remove ' + serverName + '?' ,
                function(input) {
                    if (!input) { alertOK('nothing removed'); return };
                    this.reallyRemoveSubserver(serverName);
                    this.listSubservers();
                }.bind(this))
        },
        reset: function reset() {
            this.get('ServerList').setList([]);
            this.nodejsURL = URL.root.withFilename('nodejs/');
            this.subserverURL = this.nodejsURL.withFilename('subservers/');
            connect(this.get('ServerList'), 'selection', this, 'subserverSelected');
            connect(this.get('AddSubserverButton'), 'fire', this, 'addSubserver');
            connect(this.get('RemoveSubserverButton'), 'fire', this, 'removeSubserver');
            connect(this.get('ServerSourceCode'), "savedTextString", this, "writeServerSource", {})
        },
        selectServer: function selectServer(serverName) {
            this.get('ServerList').setSelection(serverName);
        },
        setStatus: function setStatus(msg) {
            this.get("StatusText").textString = msg;
        },
        subserverSelected: function subserverSelected(serverName) {
            var src = '';
            if (serverName && serverName !== '') {
                src = this.getServerResource(serverName).get().content;
                var serverURL = this.nodejsURL.withFilename(serverName + '/');
                this.get("StatusText").textString = serverName + ' is running at ' + serverURL.pathname;
                this.get("StatusText").emphasizeRegex(/([^ ]+)$/g, {uri: serverURL});
            } else {
                this.get("StatusText").textString = '';
            }
            this.get('ServerSourceCode').textString = src;
            this.selectedServer = serverName;
        },
        writeServerSource: function writeServerSource(src) {
            if (!this.selectedServer || this.selectedServer == '') {
                return false;
            }
            var serverName = this.selectedServer;
            var status = this.getServerResource(serverName).put(src).status;
            if (!status.isSuccess()) {
                alert('Could not update source for ' + serverName);
                return false;
            } else {
                alertOK('Server ' + serverName + ' updated');
                return true;
            }
        }
    }],
    titleBar: "SubserverViewer",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.get("SubserverViewer").onLoad();
    }
});

}) // end of module