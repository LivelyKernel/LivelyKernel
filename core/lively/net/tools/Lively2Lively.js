module('lively.net.tools.Lively2Lively').requires().toRun(function() {

lively.BuildSpec('lively.net.tools.Lively2LivelyInspector', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(838.0,386.0),
    _Position: lively.pt(1140.0,1068.0),
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
        _Extent: lively.pt(830.0,360.0),
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
            _Extent: lively.pt(180.0,310.0),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(10.0,40.0),
            _StyleClassNames: ["Morph","Box","List","SessionList"],
            className: "lively.morphic.List",
            doNotCopyProperties: [],
            doNotSerialize: [],
            grabbingEnabled: false,
            itemList: [],
            layout: {
                resizeHeight: true
            },
            name: "SessionList",
            selectedLineNo: 2,
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
            _Extent: lively.pt(620.0,310.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(200.0,40.0),
            _ShowGutter: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: true,
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace-chrome"],
            _TextMode: "javascript",
            _Theme: "chrome",
            _setShowIndents: true,
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
            grabbingEnabled: false,
            hasRobertsKeys: true,
            layout: {
                resizeHeight: false,
                resizeWidth: false
            },
            name: "RemoteWorkspace",
            selectedSession: null,
            sourceModule: "lively.ide.CodeEditor",
            storedString: "3 + 4",
            submorphs: [],
            textMode: "javascript",
            textString: "// Text here gets evaluated in other Lively worlds",
            boundEval: function boundEval(string) {
            if (!this.selectedSession) { lively.bindings.signal(self, 'evalResult', 'no remote session selected'); return; }
            var localSess = this.get('Lively2LivelyInspector').getLocalSession();
            var self = this;
            localSess.remoteEval(this.selectedSession.id, string, function(r) {
                lively.bindings.signal(self, 'evalResult', r);
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
            _ClipMode: "hidden",
            _Extent: lively.pt(620.7,26.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 11,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(200.0,10.0),
            _WordBreak: "break-all",
            className: "lively.morphic.Text",
            doNotSerialize: ["charsTyped"],
            droppingEnabled: false,
            emphasis: [[0,24,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            fixedHeight: true,
            fixedWidth: true,
            grabbingEnabled: false,
            name: "Title",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "no Lively world selected"
        }],
        getLocalSession: function getLocalSession() {
        return lively.net.SessionTracker.createSession();
    },
        getSessionTitle: function getSessionTitle(session) {
        if (!session) return "no Lively world selected";
        var maxLength = 90;
        // making the title short enough to fit on the title line...
        var user = session.user, worldName = session.worldURL;
        // the user name should go on there in every case
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
        return worldName + ' (' + user + ')';
    },
        reset: function reset() {
        connect(this.get("RefreshButton"), 'fire', this, 'updateSessions');
        connect(this.get("SessionList"), 'selection', this.get('RemoteWorkspace'), 'selectedSession');
        connect(this.get("SessionList"), 'selection', this, 'setWorkspaceTarget');
        this.get("SessionList").selection = null;
        this.get("SessionList").setList([]);
        this.get("RemoteWorkspace").textString = '// Text here gets evaluated in other Lively worlds';
        this.get('Title').applyStyle({whitespaceHandling: 'pre', wordBreak: 'break-all'})
        this.getPartsBinMetaInfo().addRequiredModule("lively.net.SessionTracker");
    },
        setWorkspaceTarget: function setWorkspaceTarget(session) {
        this.get('Title').textString = this.getSessionTitle(session);
    },
        updateSessions: function updateSessions() {
        var sessionListMorph = this.get('SessionList');
        var localSession = this.getLocalSession();
        localSession.getSessions(function(sessions) {
            var localSessions = sessions.local
            var items = localSessions.map(function(sess) {
                if (sess.id === localSession.sessionId) return null;
                var url = new URL(sess.worldURL);
                return {isListItem: true, string: url.filename(), value: sess};
            }).compact();
            sessionListMorph.setList(items);
        });
    
    // lively.net.SessionTracker.closeSessions()
    
    },
    onLoad: function onLoad() {
        this.updateSessions();
    }
    }],
    onLoad: function onLoad() {
        this.targetMorph.get('Lively2LivelyInspector').updateSessions();
    },
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.onLoad();
    },
    titleBar: "Lively2LivelyInspector"
});

}) // end of module