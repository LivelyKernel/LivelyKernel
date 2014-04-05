module('lively.net.tools.Lively2Lively').requires('lively.persistence.BuildSpec').toRun(function() {

Object.extend(lively.net.tools.Lively2Lively, {

    openWorkspaceForSession: function(sess) {
        var world = lively.morphic.World.current();
        var workspace = lively.BuildSpec('lively.net.tools.Lively2LivelyWorkspace').createMorph();
        workspace.openInWorldCenter().comeForward();
        (function() {
            workspace.targetMorph.showSessionIdInput();
            (function() {
                var sel = workspace.get('ConnectionInput').getList().detect(function(item) {
                    return item.value.id === sess.id;
                });
                workspace.get('ConnectionInput').setSelection(sel);
            }).delay(.5);
        }).delay(0);
    },

    withWikiRecordsDo: function(lastUpdate, thenDo) {
        lively.net.Wiki.getRecords({
            limit: 10,
            newer: lastUpdate,
            newest: true,
            attributes: ['path', 'change', 'author', 'date']
        }, function(err, result) {
            if (err) { thenDo(err, []); return; }
            thenDo(null, result.reject(function(dbRec) {
                // PartsBin items always have three associated files, just use
                // .metainfo for counting updates.
                return dbRec.path.startsWith("PartsBin")
                    && (dbRec.path.endsWith(".html")
                     || dbRec.path.endsWith(".json"));
            }));
        })
    },
    withSessionsAndDeltaDo: function(knownSessions, thenDo){
        // assumes knownSessions is sorted by id
        var self = this;
        var localSession = lively.net.SessionTracker.getSession();
        if (localSession && localSession.isConnected()) {
            localSession.getSessions(function(remotes) {
                var items = Object.keys(remotes).map(function(trackerId) {
                    return Object.keys(remotes[trackerId]).map(function(sessionId) {
                        return remotes[trackerId][sessionId];
                    });
                }).flatten();
                var delta = lively.net.tools.Lively2Lively.sessionDeltaOf(knownSessions, items);
                thenDo(null, items, delta[1], delta[0]);
            });
        } else {
            thenDo("L2L not connected.", [], [], [])
        }
    },
    sessionDeltaOf: function (knownSessions, items){
        items.sort(function(a, b) {
            if (a.id < b.id) return -1;
            if (b.id < a.id) return 1;
            return 0;
        });
        var newSessions = [], disconnectedSessions = [];
        if (knownSessions === undefined) {
            newSessions = items;
        }
        for(var i = 0, j = 0; i < items.length; i ++){
            while(knownSessions[j] && items[i].id > knownSessions[j].id){
                disconnectedSessions.push(knownSessions[j]);
                j = j + 1;
            }
            if (knownSessions[j] && items[i].id == knownSessions[j].id) {
                // session still active, i.e. neither new nor disconnected
                j = j + 1;
            } else {
                newSessions.push(items[i]);
            }
        }
        while(j < knownSessions.length){
            disconnectedSessions.push(knownSessions[j])
            j = j + 1;
        }
        return [disconnectedSessions, newSessions];
    }
});

lively.BuildSpec('lively.net.tools.ConnectionIndicator', {
    _BorderRadius: 20,
    _Extent: lively.pt(130.0,30.0),
    _Fill: Color.rgba(255,255,255,0.8),
    _HandStyle: "pointer",
    _StyleSheet: ".Menu {\n"
               + "	box-shadow: none;\n"
               + "}\n",
    className: "lively.morphic.Box",
    currentMenu: null,
    doNotSerialize: ["currentMenu"],
    grabbingEnabled: false,
    isEpiMorph: true,
    isFixed: true,
    menu: null,
    name: "Lively2LivelyStatus",
    style: {zIndex: 998},
    statusText: {
        isMorphRef: true,
        name: "statusText"
    },
    submorphs: [{
        _Align: "center",
        _ClipMode: "hidden",
        _Extent: lively.pt(87.0,20.0),
        _FontFamily: "Helvetica",
        _HandStyle: "pointer",
        _InputAllowed: false,
        _Position: lively.pt(21.5,12.0),
        _TextColor: Color.rgb(127,230,127),
        allowInput: false,
        className: "lively.morphic.Text",
        doNotSerialize: ["charsTyped"],
        evalEnabled: false,
        eventsAreIgnored: true,
        fixedHeight: true,
        fixedWidth: true,
        isLabel: true,
        name: "statusText",
        sourceModule: "lively.morphic.TextCore",
        style: {
            align: "center",
            allowInput: false,
            clipMode: "hidden",
            extent: lively.pt(87.0,20.0),
            fixedHeight: true,
            fixedWidth: true,
            fontFamily: "Helvetica",
            handStyle: "pointer",
            position: lively.pt(6.5,12.0),
            textColor: Color.rgb(127,230,127)
        },
        textString: "Connected"
    }],
    alignInWorld: function alignInWorld() {
    var topRight = this.world().visibleBounds().topRight().addXY(-40,-10);
    this.align(this.worldPoint(this.innerBounds().topRight()),topRight);
    this.statusText.align(this.statusText.bounds().center(), this.innerBounds().bottomCenter().addXY(0,-8));
    this.menu && this.menu.align(
        this.menu.bounds().bottomCenter(),
        this.innerBounds().bottomCenter().addXY(2, -8-20));
},
    collapse: function collapse() {
    // this.collapse()
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(lively.pt(130.0,30.0));
        this.alignInWorld();
        this.alignNotificationIcon();
    }, 500, function() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    });
},
    expand: function expand() {
    var self = this;
    var isConnected = lively.net.SessionTracker.isConnected();
    var items = [];
    if (!isConnected) {
        items.push(['connect', function() {
            lively.net.SessionTracker.resetSession();
            self.update.bind(self).delay(0.2);
            self.collapse();
        }]);
    } else {
        items = [['open chat', function() {
            if ($morph('Lively2LivelyChat')) $morph('Lively2LivelyChat').openInWorldCenter().comeForward();
            else lively.BuildSpec('lively.net.tools.Lively2LivelyChat').createMorph().openInWorldCenter();
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            self.collapse();
        }],
        ['open inspector', function() {
            lively.BuildSpec('lively.net.tools.Lively2LivelyInspector').createMorph().openInWorldCenter().comeForward();
            self.collapse();
        }],
        ['reset connection', function() {
            lively.net.SessionTracker.resetSession();
            self.collapse();
        }],
        ['disconnect', function() {
            lively.net.SessionTracker.closeSessions();
            self.update.bind(self).delay(0.2);
            self.collapse();
        }]];
    }
    var m = this.menu = new lively.morphic.Menu(null, items);
    m.openIn(this, pt(0,-items.length * 23), false);
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(pt(140, this.getExtent().y + m.getExtent().y + 10));
        this.alignInWorld();
        this.alignNotificationIcon();
    }, 500, function() {});
},
    messageReceived: function messageReceived(msgAndSession) {
    var msg = msgAndSession.message, s = msgAndSession.session;
    if (msg.action === 'remoteEvalRequest') {
        var msg = Strings.format(
            'got %s\n%s\n from %s',
            msg.action,
            msg.data.expr.replace(/\n/g, '').truncate(100),
            msg.sender);
        $world.setStatusMessage(msg, Color.gray);
    }
},
    onConnect: function onConnect(session) {
    if (!this.informsAboutMessages && lively.Config.get('lively2livelyInformAboutReceivedMessages')) {
        var self = this;
        function onClose() {
            self.informsAboutMessages = false;
            lively.bindings.disconnect(session, 'message', self, 'messageReceived');
            lively.bindings.disconnect(session, 'sessionClosed', onClose, 'call');
        }
        this.informsAboutMessages = true;
        lively.bindings.connect(session, 'message', this, 'messageReceived');
        lively.bindings.connect(session, 'sessionClosed', onClose, 'messageReceived');
    }
    this.statusText.textString = 'Connected';
    this.statusText.applyStyle({textColor: Color.green.lighter()});
},
    onConnecting: function onConnecting(session) {
    this.informsAboutMessages = false;
    this.statusText.textString = 'Connecting';
    this.statusText.applyStyle({textColor: Color.gray});
},
    onDisconnect: function onDisconnect(session) {
    // this.onDisconnect()
    this.informsAboutMessages = false;
    this.statusText.textString = 'Disconnected'
    this.statusText.applyStyle({textColor: Color.red});
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        // $super();
        this.onLoad();
    },
    onLoad: function onLoad() {
    this.startStepping(5*1000, 'update');
    this.openInWorld();
    this.setFixed(true);
    this.alignInWorld();
    this.onConnecting(null);
    this.update();
    this.statusText.setHandStyle('pointer');
    this.isEpiMorph = true;
    this.showNotificationIcon();
},
    onMouseDown: function onMouseDown(evt) {
    if (evt.getTargetMorph() !== this.statusText && evt.getTargetMorph() !== this) {
        return false;
    }
    if (this.menu) {
        this.collapse();
    } else {
        this.expand();
    }
    evt.stop(); return true;
},
    onWorldResize: function onWorldResize() {
    this.alignInWorld();
},
    reset: function reset() {
    this.setExtent(lively.pt(100.0,30.0));
    this.statusText = lively.morphic.Text.makeLabel('Disconnected', {align: 'center', textColor: Color.green, fill: null});
    // this.statusText = this.get('statusText')
    this.addMorph(this.statusText);
    this.statusText.name = 'statusText'
    this.setFixed(true);
    this.isEpiMorph = true;
    this.setHandStyle('pointer');
    this.statusText.setHandStyle('pointer');
    this.startStepping(5*1000, 'update');
    this.grabbingEnabled = false;
    this.lock();
    this.doNotSerialize = ['currentMenu']
    this.currentMenu = null;
    this.buildSpec();
},
    session: function session() {
    return lively.net.SessionTracker.getSession();
},

    showNotificationIcon: function showNotificationIcon() {
        var icon = lively.PartsBin.getPart('NotificationRectangle', 'PartsBin/Collaboration');
        if (icon) {
            this.addMorph(icon);
            this.alignNotificationIcon();
        } else {
            console.warn("wiki notificications not available");
        }
    },

    alignNotificationIcon: function alignNotificationIcon() {
        var icon = this.get('NotificationRectangle');
        icon && icon.align(icon.bounds().bottomRight(), this.innerBounds().bottomRight().addXY(3,8));
    },

    update: function update() {
    var s = this.session();
    switch (s && s.status()) {
        case null: case undefined:
        case 'disconnected': this.onDisconnect(s); break;
        case 'connected': this.onConnect(s); break;
        case 'connecting': this.onConnecting(s); break;
    }
}
})
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -----
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
lively.BuildSpec('lively.net.tools.Lively2LivelyChat', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(630.0,395.0),
    _Position: lively.pt(2310.0,23.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "Lively2LivelyChat",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(622.0,369.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        doNotSerialize: ['usersInitialized'],
        droppingEnabled: true,
        layout: { adjustForNewBounds: true, resizeHeight: true, resizeWidth: true },
        name: "Lively2LivelyChat",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(242,242,242),
            _BorderWidth: 3,
            _ClipMode: "auto",
            _Extent: lively.pt(600.0,110.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(10.0,10.0),
            _StyleClassNames: ["Morph","Box","MorphList"],
            _StyleSheet: ".Morph .selected {\n\
            outline: 3px orange solid;\n\
        }",
            className: "lively.morphic.MorphList",
            droppingEnabled: true,
            name: "UserList",
            selection: null,
            sourceModule: "lively.morphic.Widgets",
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
            $super();
            this.layout = null;
            this.initializeLayout({type: 'tiling', spacing: 10});
            this.itemList = [];
            this.itemMorphs = [];
        },
            reset: function reset() {
            this.initializeLayout({type: 'tiling'});
            this.grabbingEnabled = false;
            this.removeAllMorphs();
            this.selection = null;
            this.applyStyle({borderColor: Color.rgb(242,242,242), borderWidth: 3.404})
        }
        },{
            _BorderColor: Color.rgb(242,242,242),
            _BorderWidth: 3.404,
            _Extent: lively.pt(598.4,20.4),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(10.0,340.0),
            _ShowGutter: false,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","ace_nobold","emacs-mode","ace-tm"],
            _TextMode: "text",
            _Theme: "",
            _setShowActiveLine: false,
            _setShowIndents: true,
            className: "lively.morphic.CodeEditor",
            isCommandLine: true,
            layout: { moveVertical: true, resizeWidth: true },
            name: "CommandLine",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            style: {
                clipMode: "hidden",
                enableDragging: false,
                enableGrabbing: false,
                fontSize: 12,
                gutter: false
            },
            submorphs: [],
            theme: "",
            initCommandLine: function initCommandLine(ed) {
                this.isCommandLine = true;
                ed.renderer.scrollBar.element.style.display = 'none';
                ed.renderer.scrollBar.width = 0;
                ed.resize(true);
                this.setShowActiveLine(false);
                this.setBounds(lively.rect(10,340,598,20))
            },
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                this.withAceDo(function(ed) { this.initCommandLine(ed); });
            },
            onKeyDown: function onKeyDown(evt) {
            var keys = evt.getKeyString();
            if (keys === 'Enter') {
                this.get('Lively2LivelyChat').sendMessage(this.textString, function(result) {
                    this.textString = '';
                }.bind(this));
                evt.stop(); return true;
            }
            return false;
        },
            onLoad: function onLoad() {
                $super();
                this.withAceDo(function(ed) { this.initCommandLine(ed); });
            },
            reset: function reset() {
            this.setShowActiveLine(false);
        }
        },{
            _BorderColor: Color.rgb(242,242,242),
            _BorderWidth: 3.404,
            _ClipMode: "auto",
            _Extent: lively.pt(600.0,210.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(10.0,126.0),
            className: "lively.morphic.Box",
            droppingEnabled: true,
            isInLayoutCycle: false,
            name: "MessageList",
            sourceModule: "lively.morphic.Core"
        }],
        getLastActiveSessionIfFor: function getLastActiveSessionIfFor(userMorph) {
        // userMorph = this.get('robertkrahn')
        var lastActive = userMorph.sessions.sortBy(function(sess) { return sess.lastActivity; }).last();
        return lastActive && lastActive.id;
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.onLoad();
    },
        onLoad: function onLoad() {
        this.updateUserList.bind(this).delay(0);
        this.startStepping(5*1000, 'updateUserList');
    },
        reset: function reset() {
        // this.reset();
        this.usersInitialized = false;
        this.get("UserList").reset();
        this.get("MessageList").removeAllMorphs();
        this.stopStepping();
    },
    onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('CommandLine').focus();
    },
    selectUser: function selectUser(username) {
        if (!this.usersInitialized) {
            lively.bindings.connect(this, 'usersInitialized', this.selectUser.bind(this, username), "call", {
                removeAfterUpdate: true});
            return;
        }
        var list = this.get("UserList"),
            idx = list.getList().pluck('morph').pluck('name').indexOf(username);
        idx > -1 && list.selectAt(idx);
    },
        addText: function addText(string) {
        var messages = this.get('MessageList')
        var y = messages.submorphs.length ? messages.submorphs.last().bounds().bottom() : 0;
        var t = new lively.morphic.Text(lively.rect(0,y, messages.getExtent().x-6, 20), string);
        t.applyStyle({fixedWidth: true, fixedHeight: false,
            borderWidth: 1, borderColor: Color.white});
        t.fit();
        messages.addMorph(t);
        messages.scrollToBottom();
    },
        sendMessage: function sendMessage(string, thenDo) {
        // messages.removeAllMorphs();
        var userMorph = this.get('UserList').selection;
        if (!userMorph || !userMorph.owner) {
            show('Cannot send, no user selected');
            return;
        }
        var sess = this.session();
        if (!sess || !sess.isConnected()) {
            show('Cannot send, session not connected ' + sess);
            return;
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // finding send target, doing the network stuff
        var id = this.getLastActiveSessionIfFor(userMorph);
        if (!id) { show('cannot find last active world of ' + userMorph.name); return }
        sess.sendTo(id, 'chatMessage', {
            message: string,
            fromWorld: URL.source,
            user: this.world().getUserName(true)
        }, function(response) {
            this.addText(string);
            thenDo(response);
        }.bind(this));
    },
        session: function session() {
        return lively.net.SessionTracker.getSession();
    },
        updateUserList: function updateUserList() {
        // this.updateUserList()
        if (!this.session()) {
            show('not online!'); return;
        }
        var list = this.get("UserList");
        // createUserItem('AKay').openInWorldCenter()
        function createUserItem(userName) {
            var imgWidth = 64, imgHeight = 64, textHeight = 20,
                width = 100, height = imgHeight + textHeight;
            new URL('http://lively-web.org/nodejs/UserServer/avatar/' + userName).asWebResource().beAsync().get().whenDone(function(url, _) {
                img.setImageURL(url, false);
            });
            var img = lively.morphic.Image.fromURL('',lively.rect(width/2-imgWidth/2,0, imgWidth, imgHeight));
            var label = lively.morphic.Text.makeLabel(userName, {fixedWidth: true, clipMode: "hidden", extent: pt(width, textHeight), align: 'center'});
            var item = lively.morphic.Morph.makeRectangle(0,0, width, height).applyStyle({fill: null, borderWidth: 0});
            item.lock();
            item.addMorph(img);
            item.addMorph(label);
            label.setPosition(pt(0,imgHeight));
            return item;
        }
        var chat = this;
        this.session().getUserInfo(function(users) {
            var offline = list.itemMorphs.clone();
            Properties.forEachOwn(users, function(user, sessions) {
                var item = list.get(user) || createUserItem(user);
                offline.remove(item);
                if (!item.owner) list.addMorph(item);
                item.sessions = sessions;
                item.name = user;
            });
            offline.invoke('remove');
            chat.usersInitialized = true;
        });
    }
    }],
    titleBar: "Lively2LivelyChat"
})
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -----
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.BuildSpec('lively.net.tools.Lively2LivelyInspector', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(650.0,386.0),
    _Position: lively.pt(3921.0,533.5),
    _StyleSheet: ".SessionList, .CodeEditor {\n\
    border: 1px solid #DDD;\n\
}",
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "Lively2LivelyInspector",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(642.0,360.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        _StyleClassNames: ["Lively2LivelyInspector"],
        _StyleSheet: ".Lively2LivelyInspector {\n\
        background: white;\n\
    }\n\
    \n\
    .SessionList select {\n\
        border: 0;\n\
    }",
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {adjustForNewBounds: true,resizeHeight: true,resizeWidth: true},
        name: "Lively2LivelyInspector",
        submorphs: [{
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(622.0,320),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(10.0,35.0),
            _StyleClassNames: ["SessionList"],
            _StyleSheet: ".List {\n\
        	border: 1px solid #DDD;\n\
        }",
            className: "lively.morphic.List",
            droppingEnabled: true,
            itemList: [],
            layout: {resizeHeight: false,resizeWidth: true},
            name: "SessionList",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("Lively2LivelyInspector"), "setWorkspaceTarget", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Position: lively.pt(10.0,10.0),
            className: "lively.morphic.Button",
            label: "⟳",
            name: "RefreshButton",
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "updateSessions", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(40.0,20.0),
            _Position: lively.pt(40.0,10.0),
            className: "lively.morphic.Button",
            isPressed: false,
            label: "view",
            name: "PreviewButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "openWorldPreview", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(80.0,20.0),
            _Position: lively.pt(90.0,10.0),
            className: "lively.morphic.Button",
            label: "send morph",
            name: "SendMorphButton",
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "sendMorphOnUserClick", {});
        }
        }, {
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(180.0,10.0),
            className: "lively.morphic.Button",
            label: "open workspace",
            name: "OpenWorkspaceButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "openWorkspaceForSelectedSession", {});
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
                    lastActivity += new Date(session.lastActivity).relativeTo(new Date()) + ' ago';
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
                return user + ', ' + lastActivity + ' (' + worldName+ ')';
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
                        session.remoteEval(id, '"["+document.body.scrollHeight+","+document.body.scrollWidth+"]"', function(msg) {
                        var scale;
                        try {
                            var size = eval(msg.data.result), extent = pt(size[0], size[1]);
                            scale = extent && preview.getExtent().scaleByPt(extent.inverted());
                        } catch(e) {
                            show('Error in generating view of remote world:\n'+e);
                        }
                        if (!scale) { preview.inUpdate = false; return; }
                        var previewCode = "document.documentElement.innerHTML;";
                        session.remoteEval(id, previewCode, function(msg) {
                            var html = msg.data.result;
                            try {
                                preview.jQuery().html('');
                                lively.$(lively.$.parseHTML(html, null, false/*keepScripts*/ ))
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
                connect(this.get("SendMorphButton"), 'fire', this, 'sendMorphOnUserClick');
                connect(this.get("SessionList"), 'selection', this, 'setWorkspaceTarget');
                this.get("SessionList").selection = null;
                this.get("SessionList").setList([]);
                // this.get('Title').applyStyle({whitespaceHandling: 'pre', wordBreak: 'break-all'})
                this.getPartsBinMetaInfo().addRequiredModule("lively.net.SessionTracker");
                this.stopStepping();
            },
        sendMorph: function sendMorph(id, morph) {
            var sess = this.getLocalSession();
            sess.sendObjectTo(id, morph,
                {withObjectDo: function(m) { m.openInWorldCenter(); }},
                function(msg) { alertOK('send object result:\n' + (msg.data.error || msg.data.result)); });
        },
        sendMorphOnUserClick: function sendMorphOnUserClick() {
        var world = this.world(),
            sessInspector = this,
            sel = this.get("SessionList").selection,
            worldName = sel && sel.worldURL;
        if (!sel) { alert('No session selected!'); return }
        alertOK('Please click on the morph that should be send to ' + worldName);
        // ----
        function doSend() {
            var morph = world.hands[0].morphUnderMe(),
                 win = morph.getWindow();
            if (win) morph = win;
            if (!morph || morph === world) { alert('Sending the world is not supported, sorry.'); return; }
            morph.show();
            world.confirm('Send morph "' + (morph.name || morph) + '" to ' + worldName + '?', function(answer) {
                if (!answer) { lively.log('Morph send canceled'); return; }
                sessInspector.sendMorph(sel.id, morph);
            });
        };
        (function() {
            lively.bindings.connect(world, 'onMouseUp', doSend, 'call', {
                removeAfterUpdate: true});
        }).delay(0.2);
    },
        openWorkspaceForSelectedSession: function openWorkspaceForSelectedSession() {
        var world = this.world(),
            sessInspector = this,
            sel = this.get("SessionList").selection;
        if (!sel) { alert('No session selected!'); return }
        // ----
        var worldURL = sel.worldURL, user = sel.user,
            workspace = lively.BuildSpec('lively.net.tools.Lively2LivelyWorkspace').createMorph();
        workspace.openInWorldCenter().comeForward();
        (function() {
            workspace.targetMorph.showNameInput();
            (function() {
                var sel = workspace.get('ConnectionInput').getList().detect(function(item) {
                    return item.value.user === user && item.value.worldURL === worldURL;
                });
                workspace.get('ConnectionInput').setSelection(sel);
            }).delay(.5);
        }).delay(0);
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
                    var items = Object.keys(remotes).map(function(trackerId) {
                        return Object.keys(remotes[trackerId]).map(function(sessionId) {
                            var sess = remotes[trackerId][sessionId];
                            return {isListItem: true, string: self.getSessionTitle(sess), value: sess};
                        });
                    }).flatten();
                    var id = sessionListMorph.selection && sessionListMorph.selection.id;
                    sessionListMorph.setList(items);
                    var prevSel  = sessionListMorph.itemList.detect(function(item) { return item.value.id === id; })
                    sessionListMorph.setSelection(prevSel);
                });
            } else {
                sessionListMorph.setList([]);
                sessionListMorph.selection = null;
                // thi.get('Title').textString = 'not connected';
            }
        }
    }],
    titleBar: "Lively2LivelyInspector",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.onLoad();
    },
    onLoad: function onLoad() {
    this.targetMorph.updateSessions();
    this.targetMorph.startStepping(30 * 1000, 'updateSessions');
}
});

lively.BuildSpec("lively.net.tools.Lively2LivelyWorkspace", {
    _Extent: lively.pt(629.0,267.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    layout: {adjustForNewBounds: true},
    name: "Lively2LivelyWorkspace",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(623.0,242.0),
        _Position: lively.pt(3.0,22.0),
        _Fill: Color.rgb(243,243,243),
        _targetSession: null,
        className: "lively.morphic.Box",
        doNotSerialize: ["_targetSession"],
        layout: {adjustForNewBounds: true, resizeHeight: true, resizeWidth: true },
        name: "Lively2LivelyWorkspace",
        submorphs: [{
            _BorderColor: Color.rgb(95,94,95),
            _Extent: lively.pt(621.0,218.0),
            _FontSize: 12,
            _Position: lively.pt(1.0,24.0),
            _ShowGutter: false,
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "editor",
            sourceModule: "lively.ide.CodeEditor",
            textMode: "javascript",
            textString: "// code in here is evaluated in the context of the connected session\n\
        \n\
        ",
            doListProtocol: function doListProtocol() {
            var string = this.getSelectionMaybeInComment(), self = this;
            this.withCompletionsDo(string, function(err, result) {
                if (err) { self.setStatusMessage(err, Color.red); return; }
                new lively.morphic.Text.ProtocolLister(self).openNarrower(result);
            });
        },
            doit: function doit(printResult, editor) {
            var self = this, text = this.getSelectionMaybeInComment();
            function output(msg, isError) {
                if (printResult) {
                    self.printObject(editor, msg, false);
                } else {
                    if (isError) self.setStatusMessage(msg, Color.red);
                    var sel = self.getSelection();
                    if (sel && sel.isEmpty()) sel.selectLine();
                }
            }
            try {
                this.remoteEval(text, function(err, result) {
                    output(String(result), err);
                });
            } catch (e) { output(e, true); }
        },
            printInspect: function printInspect(options) {
            var self = this,
                s = this.getSelectionMaybeInComment(),
                code = Strings.format(
                  "var inspector, result;\n"
                + "if (typeof Objects !== 'undefined') inspector = Objects;\n"
                + "else if (typeof lv !== 'undefined') inspector = lv;\n"
                + "else throw new Error('no inspect available');\n"
                + "try { result = (function() { return %s })(); } catch(e) { result = e; }\n"
                + "inspector.inspect(result, {maxDepth: %s});\n", s, options.depth || 1);
            this.remoteEval(code, function(err, result) {
                self.printObject(null, String(err || result));
            });
        },
            remoteEval: function remoteEval(code, doFunc) {
            var localSess = this.owner.localSession();
            this.owner.withTargetSession(function(err, targetSess) {
                if (err) { doFunc(new Error('cannot get target session: %s' + err), err); return; }
                localSess.remoteEval(targetSess.id, code, function(msg) {
                    var isError = true, result = 'something went wrong';
                    if (!msg || !msg.data) { result = 'remote eval failed'; }
                    else if (msg.data.error) { result = 'remote eval error: ' + msg.data.error; }
                    else { result = msg.data.result; isError = false; }
                    doFunc(isError, result);
                });
            });
        },
            withCompletionsDo: function withCompletionsDo(code, doFunc) {
            var localSess = this.owner.localSession();
            this.owner.withTargetSession(function(err, targetSess) {
                if (err) { doFunc(new Error('cannot get target session: %s' + err), err); return; }
                localSess.sendTo(targetSess.id, 'completions', {expr: code}, function(msg) {
                    var err = msg.error || msg.data.error;
                    doFunc(err ? err : null, msg.data);
                });
            });
        }
        },{
            _ClipMode: "auto",
            _Extent: lively.pt(110.0,25.0),
            _Fill: Color.rgb(243,243,243),
            _Position: lively.pt(3.0,2.0),
            changeTriggered: true,
            className: "lively.morphic.DropDownList",
            droppingEnabled: true,
            itemList: ["session id","name"],
            name: "ConnectionChoice",
            selectOnMove: false,
            selectedLineNo: 1,
            selection: "name",
            sourceModule: "lively.morphic.Lists",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("Lively2LivelyWorkspace"), "switchConnectionChoice", {});
        }
        },{
            _Extent: lively.pt(20,20),
            _Position: lively.pt(598.0,2.0),
            label: '⟳',
            className: "lively.morphic.Button",
            layout: { resizeWidth: false, moveHorizontal: true },
            name: "RefreshButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyWorkspace"), "reloadSessions", {});
        }
        }],
        addDropDownTargetSessionList: function addDropDownTargetSessionList(listItemGenerator) {
        var self = this;
        self.withSessionsDo(function(sessions) {
            var choiceBounds = self.get('ConnectionChoice').bounds(),
                containerBounds = self.bounds(),
                items = sessions.map(listItemGenerator),
                list = new lively.morphic.DropDownList(
                    rect(0,0, 100, 20), items);
            lively.bindings.connect(list, 'selection', self, 'selectTargetSession');
            list.setExtent(pt(465,20));
            list.align(list.getPosition(), choiceBounds.topRight().addXY(10,0));
            self.addMorph(list);
            list.applyStyle({resizeWidth: true});
            list.name = "ConnectionInput";
        });
    },
        localSession: function localSession() {
        return lively.net.SessionTracker.getSession();
    },
        message: function message(/*args*/) {
        var msg = Strings.format.apply(Strings, arguments);
        this.get("editor").setStatusMessage(msg, Color.black);
    },
        onLoad: function onLoad() {
        this.showNameInput();
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
            $super();
            this.onLoad();
        },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('editor').focus();
    },
        removeOtherInput: function removeOtherInput() {
        this.get('ConnectionInput') && this.get('ConnectionInput').remove();
    },
        reloadSessions: function reloadSessions() {
            var choice = this.get('ConnectionChoice');
            lively.bindings.signal(choice, 'selection', choice.selection);
        },
        reset: function reset() {
        this.get("ConnectionChoice").setList(['session id', 'name']);
        lively.bindings.connect(this.get("ConnectionChoice"), "selection", this, "switchConnectionChoice");
        this.doNotSerialize = ["_targetSession"];
        this.get('ConnectionInput').setList([]);
        this.get('editor').textString = '// code in here is evaluated in the context of the connected session';
    },
        selectTargetSession: function selectTargetSession(sess) {
        this._targetSession = sess;
    },
        showNameInput: function showNameInput() {
        this.removeOtherInput();
        this.addDropDownTargetSessionList(function(session) {
            return {
                string: session.user + ' (' + session.worldURL + ')',
                value: {worldURL: session.worldURL, user: session.user},
                isListItem: true
            };
        });
    },
        showSessionIdInput: function showSessionIdInput() {
        this.removeOtherInput();
        this.addDropDownTargetSessionList(function(session) {
            return {string: session.id, value: session, isListItem: true};
        });
    },
        switchConnectionChoice: function switchConnectionChoice(choice) {
        switch (choice) {
            case 'session id':
                this.showSessionIdInput();
                break;
            case 'name':
                this.showNameInput();
                break;
        }
    },
        withSessionsDo: function withSessionsDo(doFunc, forceFreshList) {
        lively.net.SessionTracker.sessionLister.withSessionListDo(this.localSession(), function(err, sessions) {
            if (err) { show('withSessionsDo error: %s', err); return; }
            doFunc(sessions);
        }, forceFreshList);
    },
        withTargetSession: function withTargetSession(doFunc) {
        if (!this._targetSession) return doFunc(new Error('Cannot find target session'), null);
        // target session can be an object with an id or a user/worldURL pair
        if (this._targetSession.id) return doFunc(null, this._targetSession);
        if (this._targetSession.user && this._targetSession.worldURL) {
            var user = this._targetSession.user, url = this._targetSession.worldURL;
            this.withSessionsDo(function(sessions) {
                var s = sessions
                    .select(function(s) { return s.user === user && s.worldURL === url; })
                    .sortBy(function(s) { return Math.max(s.lastActivity, s.timeOfRegistration); })
                    .last()
                doFunc(s ? null : new Error('Cannot find session with ' + user + ' and ' + url), s);
            }, true/*force fresh list*/);
            return;
        }
        doFunc(null, null);
    }
    }],
    titleBar: "Lively2LivelyWorkspace"
});

}) // end of module
