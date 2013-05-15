module('lively.net.tools.Lively2Lively').requires().toRun(function() {

lively.BuildSpec('lively.net.tools.Lively2LivelyInspector', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(650.0,386.0),
    _Position: lively.pt(3348.5,593.0),
    _StyleClassNames: ["Morph","Window"],
    _StyleSheet: ".SessionList, .CodeEditor {\n\
    border: 1px solid #DDD;\n\
}",
    cameForward: true,
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
    name: "Lively2LivelyInspector",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(642.0,360.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        _StyleClassNames: ["Morph","Box","Lively2LivelyInspector"],
        _StyleSheet: ".Lively2LivelyInspector {\n\
    	background: white;\n\
    }\n\
    \n\
    .SessionList select {\n\
    	border: 0;\n\
    }",
        className: "lively.morphic.Box",
        doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
        grabbingEnabled: false,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "Lively2LivelyInspector",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(622.0,100.0),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(10.0,34.0),
            _StyleClassNames: ["Morph","Box","List","SessionList"],
            _StyleSheet: ".List {\n\
        	border: 1px solid #DDD;\n\
        }",
            className: "lively.morphic.List",
            doNotCopyProperties: [],
            doNotSerialize: [],
            grabbingEnabled: false,
            itemList: [],
            layout: {
                resizeHeight: false,
                resizeWidth: true
            },
            name: "SessionList",
            selectedLineNo: 3,
            selection: null,
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("RemoteWorkspace"), "selectedSession", {});
            lively.bindings.connect(this, "selection", this.get("Lively2LivelyInspector"), "setWorkspaceTarget", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Position: lively.pt(10.0,10.0),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "⟳",
            name: "RefreshButton",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "updateSessions", {});
        },
            doAction: function doAction() {
                    
                }
        },{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(622.0,213.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(10.0,140.0),
            _ShowGutter: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: true,
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace_nobold","ace-tm"],
            _TextMode: "javascript",
            _Theme: "",
            _setShowIndents: true,
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
            grabbingEnabled: false,
            hasRobertsKeys: true,
            layout: {
                moveVertical: false,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "RemoteWorkspace",
            selectedSession: null,
            sourceModule: "lively.ide.CodeEditor",
            storedString: "// Text here gets evaluated in other Lively worlds",
            submorphs: [],
            textMode: "javascript",
            textString: "// Text here gets evaluated in other Lively worlds",
            theme: "",
            boundEval: function boundEval(string) {
                    if (!this.selectedSession) { lively.bindings.signal(self, 'evalResult', 'no remote session selected'); return; }
                    var localSess = this.get('Lively2LivelyInspector').getLocalSession();
                    var self = this;
                    localSess.remoteEval(this.selectedSession.id, string, function(msg) {
                        var result = 'something went wrong';
                        if (!msg || !msg.data) { result = 'remote eval failed'; }
                        else if (msg.data.error) { result = 'remote eval error: ' + msg.data.error; }
                        else result = msg.data.result;
                        lively.bindings.signal(self, 'evalResult', result);
                    });
                },
            doit: function doit(printResult, editor) {
                            var text = this.getSelectionMaybeInComment();
                            if (printResult) {
                                connect(this, 'evalResult', this, 'printObject', {
                                    updater: function($upd, val) { $upd(null, val); },
                                    removeAfterUpdate: true
                                });
                            }
                            this.tryBoundEval(text);
                            if (printResult) return;
                            var sel = editor.selection;
                            if (sel && sel.isEmpty()) sel.selectLine();
                        },
            printInspect: function printInspect() {
                            var s = this.getSelectionMaybeInComment()
                            s = "Objects.inspect(" + s + ", {maxDepth: 0})";
                            connect(this, 'evalResult', this, 'printObject', {
                                updater: function($upd, val) { $upd(null, val); },
                                removeAfterUpdate: true
                            });
                            this.tryBoundEval(s);
                        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(40.0,20.0),
            _Position: lively.pt(40.0,10.0),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "view",
            name: "PreviewButton",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "openWorldPreview", {});
        },
            doAction: function doAction() {
            
        }
        }],
        zoom: 1,
        getLocalSession: function getLocalSession() {
            return lively.net.SessionTracker.createSession();
        },
        getSessionTitle: function getSessionTitle(session) {
        // this.getSessionTitle({user: 'test', worldURL: URL.source, id: 123})
        if (!session) return "no Lively world selected";
        var maxLength = 100;
        // making the title short enough to fit on the title line...
        var user = session.user, worldName = session.worldURL;
    // var currentSess = lively.net.SessionTracker().getSession();
    // var isThisSession = currentSess.sessionId === session.id;
        // the user name should go on there in every case
        var worldNameMaxLength = maxLength - user.length;
        var lastActivity = '';
        if (session.lastActivity) {
            lastActivity += new Date(session.lastActivity).relativeTo(new Date());
        }
        worldNameMaxLength -= lastActivity.length;
        var worldNameMaxLength = maxLength - user.length;
        if (worldName.length > worldNameMaxLength) {
            // if the url does not fit in the remaining space...
            var url = URL.create(worldName);
            var fn = url.filename();
            // ...test if the file name portion does fit...
            if (fn.length > worldNameMaxLength) {
                // ...if not make the filename so short that it fits...
                worldName = fn.truncate(worldNameMaxLength);
            } else {
                // ... otherwise put the filename on and put enough of the
                // beginning of the url in the title as possibe (though,
                // if the beginning would be shorter than 5 chars, leave it
                // out)
                worldName = worldName.slice(0,-fn.length);
                worldName = worldName.truncate(worldNameMaxLength-fn.length);
                if (worldName.length < 5) {
                    worldName = "..." + fn;
                } else {
                    worldName += fn;
                }
            }
        }
        return worldName + ' (' + user + ', ' + lastActivity + ')';
    },
        onLoad: function onLoad() {
            this.updateSessions();
        },
        openWorldPreview: function openWorldPreview() {
        var preview = this.get('lively2livelyPreview');
        if (!preview) {
            preview = new lively.morphic.HtmlWrapperMorph(pt(400,400));
            this.world().addFramedMorph(preview, this.get('SessionList').getSelectedItem().string);
            var win = preview.getWindow();
            win.openInWorldCenter();
            var zoomInBtn = new lively.morphic.Button(lively.rect(0,0,20,20), '+');
            var zoomOutBtn = new lively.morphic.Button(lively.rect(0,0,20,20), '-');
            win.addMorph(zoomInBtn);
            win.addMorph(zoomOutBtn);
            zoomInBtn.align(zoomInBtn.getPosition(), preview.bounds().topLeft().addXY(10,10));
            zoomOutBtn.align(zoomOutBtn.getPosition(), preview.bounds().topLeft().addXY(10,35));
            connect(zoomInBtn, 'fire', preview, 'zoomIn');
            connect(zoomOutBtn, 'fire', preview, 'zoomOut');
            preview.zoom = 1;
        }
        preview.applyStyle({
            enableGrabbing: false, clipMode: 'auto',
            resizeWidth: true, resizeHeight: true
        });
        preview.name = 'lively2livelyPreview';
    
        preview.worldId = this.get('SessionList').selection.id;
        preview.addScript(function setZoom(zoom) {
            this.jQuery().children()
                .css({'-webkit-transform': Strings.format('scale(%s,%s)', zoom,zoom)});        
        });
        preview.addScript(function zoomIn() { this.setZoom(this.zoom += 0.2); });
        preview.addScript(function zoomOut() { this.setZoom(this.zoom -= 0.2); });
        preview.addScript(function update() {
            if (this.inUpdate) return;
            this.inUpdate = true;
            var session = lively.net.SessionTracker.getSession(),
                id = this.worldId,
                preview = this;
            session.remoteEval(id, '$world.getExtent()', function(msg) {
                var scale;
                try {
                    var extent = eval(msg.data.result);
                    scale = extent && preview.getExtent().scaleByPt(extent.inverted());
                } catch(e) {
                    show('Error in generating view of remote world:\n'+e);
                }
                if (!scale) { preview.inUpdate = false; return; }
                session.remoteEval(id, '$world.asHTMLLogo()', function(msg) {
                    var html = msg.data.result;
                    try {
                        preview.jQuery().html('')
                        $(html)
                            .css({left: '0px', top: '0px'})
                            .appendTo(preview.jQuery());
                        preview.setZoom(preview.zoom);
                    } finally {
                        preview.inUpdate = false;
                    }
                });
            });
        });
        preview.update();
        preview.startStepping(5*1000, 'update');
    },
        reset: function reset() {
        connect(this.get("RefreshButton"), 'fire', this, 'updateSessions');
        connect(this.get("PreviewButton"), 'fire', this, 'openWorldPreview');
        connect(this.get("SessionList"), 'selection', this.get('RemoteWorkspace'), 'selectedSession');
        connect(this.get("SessionList"), 'selection', this, 'setWorkspaceTarget');
        this.get("SessionList").selection = null;
        this.get("SessionList").setList([]);
        this.get("RemoteWorkspace").textString = '// Text here gets evaluated in other Lively worlds';
        // this.get('Title').applyStyle({whitespaceHandling: 'pre', wordBreak: 'break-all'})
        this.getPartsBinMetaInfo().addRequiredModule("lively.net.SessionTracker");
        this.stopStepping();
    },
        setWorkspaceTarget: function setWorkspaceTarget(session) {
    
        },
        updateSessions: function updateSessions() {
        // lively.net.SessionTracker.closeSessions()
        var sessionListMorph = this.get('SessionList');
        var self = this;
        var localSession = this.getLocalSession();
        if (localSession.isConnected()) {
            localSession.getSessions(function(remotes) {
                var items = Object.keys(remotes).map(function(url) {
                    return remotes[url].map(function(sess) {
                        return {isListItem: true, string: self.getSessionTitle(sess), value: sess};
                    });
                }).flatten();
                sessionListMorph.setList(items);
                // var remotes = sessions.local;
                // var items = localSessions.map(function(sess) {
                //     return {isListItem: true, string: self.getSessionTitle(sess), value: sess};
                // });
                // sessionListMorph.setList(items);
            });
        } else {
            sessionListMorph.setList([]);
            sessionListMorph.selection = null;
            // thi.get('Title').textString = 'not connected';
        }
    }
    }],
    titleBar: "Lively2LivelyInspector",
    withoutLayers: "[[GrabbingLayer]]",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.onLoad();
    },
    onLoad: function onLoad() {
    this.targetMorph.updateSessions();
    this.targetMorph.startStepping(30 * 1000, 'updateSessions');
}
});

}) // end of module