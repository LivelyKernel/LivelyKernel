module('lively.net.tools.Lively2Lively').requires('lively.persistence.BuildSpec', 'lively.net.tools.Functions', 'lively.morphic.tools.FilterableList', "lively.morphic.tools.MenuBar").toRun(function() {

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
    },

    getMenuBarEntries: function() {
      return [lively.BuildSpec("lively.net.tools.ConnectionIndicatorMenuBarEntry").createMorph()];
    },
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
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    }, 500, function() {});
},
    expand: function expand() {
    var self = this,
        items = [],
        isConnected = lively.net.SessionTracker.isConnected(),
        allowRemoteEval = !!lively.Config.get('lively2livelyAllowRemoteEval');
    if (!isConnected) {
        items.push(['show login info', function() {
            lively.net.Wiki.showLoginInfo();
            self.collapse();
        }]);
        items.push(['connect', function() {
            lively.net.SessionTracker.resetSession();
            self.update.bind(self).delay(0.2);
            self.collapse();
        }]);
    } else {
        items = [
        ['show login info', function() {
            lively.net.Wiki.showLoginInfo();
            self.collapse();
        }],
        ['open chat', function() {
            if ($morph('Lively2LivelyChat')) $morph('Lively2LivelyChat').openInWorldCenter().comeForward();
            else lively.BuildSpec('lively.net.tools.Lively2LivelyChat').createMorph().openInWorldCenter();
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            self.collapse();
        }],
        ['open inspector', function() {
            lively.BuildSpec('lively.net.tools.Lively2LivelyInspector').createMorph().openInWorldCenter().comeForward();
            self.collapse();
        }],
        ['[' + (allowRemoteEval ? 'x' : ' ') + '] allow remote eval', function() {
            lively.Config.set('lively2livelyAllowRemoteEval', !allowRemoteEval);
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
        this.setExtent(pt(140, m.getExtent().y + 15));
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
    Functions.debounceNamed(this.id + '-onWorldResize', 300, this.alignInWorld.bind(this))();
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
        if (messages.submorphs.last().textString === string) {
            // UGLY HACK: Muss anders, geht aber jetzt nicht,
            return;
        }
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
        submorphs: [
        lively.BuildSpec("lively.morphic.tools.FilterableList").customize({
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(622.0,320),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(10.0,35.0),
            _StyleClassNames: ["SessionList"],
            droppingEnabled: true,
            itemList: [],
            layout: {resizeHeight: false,resizeWidth: true},
            name: "SessionList",
            connectionRebuilder: function connectionRebuilder() {
                var connectionToMorphNamedFilterableList = this.get('filter').attributeConnections.find(function(ea) {
                    return ea.sourceAttrName === 'inputChanged';
                })
                connectionToMorphNamedFilterableList && connectionToMorphNamedFilterableList.disconnect();
                lively.bindings.connect(this.get('filter'),"inputChanged", this, "inputChanged", {});
                lively.bindings.connect(this.get('list'), "selection", this.get("Lively2LivelyInspector"), "setWorkspaceTarget", {});
            }
        }),{
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
        }, {
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(290.0,10.0),
            className: "lively.morphic.Button",
            label: "show event log",
            name: "ShowEventLogButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "showEventLogger", {});
        }
        }, {
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(400.0,10.0),
            className: "lively.morphic.Button",
            label: "visit world",
            name: "VisitWorldButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyInspector"), "visitWorldOfSelectedSession", {});
        }
        }],
        zoom: 1,

        onLoad: function onLoad() {
            this.updateSessions();
        },

        openWorldPreview: function openWorldPreview() {
            lively.net.tools.Functions.openWorldPreview(
                this.get('SessionList').getSelection(),
                this.get('SessionList').getSelectedItem().string);
        },

        reset: function reset() {
            lively.bindings.connect(this.get("RefreshButton"), 'fire', this, 'updateSessions');
            lively.bindings.connect(this.get("PreviewButton"), 'fire', this, 'openWorldPreview');
            lively.bindings.connect(this.get("SendMorphButton"), 'fire', this, 'sendMorphOnUserClick');
            lively.bindings.connect(this.get("SessionList").get('list'), 'selection', this, 'setWorkspaceTarget');
            this.get("SessionList").setSelection(null);
            this.get("SessionList").setList([]);
            // this.get('Title').applyStyle({whitespaceHandling: 'pre', wordBreak: 'break-all'})
            this.getPartsBinMetaInfo().addRequiredModule("lively.net.SessionTracker");
            this.stopStepping();
        },

        sendMorphOnUserClick: function sendMorphOnUserClick() {
        var world = this.world(),
            sessInspector = this,
            sel = this.get("SessionList").getSelection(),
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
                if (!answer) { lively.morphic.log('Morph send canceled'); return; }
                lively.net.tools.Functions.sendMorph(
                    lively.net.tools.Functions.getLocalSession(),
                    sel, morph);
            });
        };
        (function() {
            lively.bindings.connect(world, 'onMouseUp', doSend, 'call', {
                removeAfterUpdate: true});
        }).delay(0.2);
    },

        openWorkspaceForSelectedSession: function openWorkspaceForSelectedSession() {
            var sel = this.get("SessionList").getSelection();
            if (!sel) { alert('No session selected!'); return }
            lively.net.tools.Functions.openWorkspaceForSession(sel);
        },

        visitWorldOfSelectedSession: function visitWorldOfSelectedSession() {
            var sel = this.get("SessionList").getSelection();
            sel && lively.net.tools.Functions.visitWorldOfSession(sel);
        },

        showEventLogger: function showEventLogger() {
            lively.net.tools.Functions.showEventLogger();
        },

        updateSessions: function updateSessions() {
            var sessionListMorph = this.get('SessionList'),
                localSession = lively.net.tools.Functions.getLocalSession();

            lively.net.tools.Functions.withSessionsDo(localSession, function(err, sessions) {
                if (err) {
                    sessionListMorph.setList([]);
                    sessionListMorph.setSelection(null);
                    return;
                }

                var items = sessions.map(function(ea) {
                    return {
                        isListItem: true,
                        string: lively.net.tools.Functions.getSessionTitle(ea),
                        value: ea
                    }
                });

                var id = sessionListMorph.getSelection() && sessionListMorph.getSelection().id;
                sessionListMorph.setList(items);
                var prevSel  = sessionListMorph.itemList.detect(function(item) {
                    return item.value.id === id; })
                sessionListMorph.setSelection(prevSel);
            })
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
})
lively.BuildSpec("lively.net.tools.Lively2LivelyWorkspace", {
    _BorderColor: null,
    _BorderWidth: 1,
    _Extent: lively.pt(729.0,450.0),
    _Position: lively.pt(492.0,160.0),
    _StyleClassNames: ["Morph","Window"],
    cameForward: false,
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "Lively2LivelyWorkspace",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(723.0,425.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        _targetSession: null,
        className: "lively.morphic.Box",
        doNotSerialize: ["_targetSession"],
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "Lively2LivelyWorkspace",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(700.0,20.0),
            _Position: lively.pt(10.0,10.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "no session selected",
            layout: {
                resizeWidth: true
            },
            name: "sessionChooseButton",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("Lively2LivelyWorkspace"), "interactivelyChooseSession", {});
        }
        },{
            _Extent: lively.pt(169.7,18.5),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(10.0,40.0),
            className: "lively.morphic.Box",
            grabbingEnabled: false,
            layout: {
                adjustForNewBounds: true,
                borderSize: 0.265,
                extentWithoutPlaceholder: lively.pt(100.0,18.0),
                resizeWidth: false,
                spacing: 4.760000000000001,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "LabeledCheckBox",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(12.0,18.0),
                _Position: lively.pt(0.3,0.3),
                checked: false,
                className: "lively.morphic.CheckBox",
                name: "autoConnectToNewerSession",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get("LabeledCheckBox"), "signalChecked", {});
            }
            },{
                _Extent: lively.pt(152.4,14.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 8,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 120,
                _MinTextWidth: 120,
                _Padding: lively.rect(4,2,0,0),
                _Position: lively.pt(17.0,0.3),
                allowInput: true,
                className: "lively.morphic.Text",
                emphasis: [[0,29,{}]],
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                layout: {
                    resizeWidth: true
                },
                name: "Label",
                sourceModule: "lively.morphic.TextCore",
                textString: "auto connect to newer session"
            }],
            isChecked: function isChecked() {
          return this.get(/CheckBox/).isChecked();
        },
            onMouseDown: function onMouseDown(evt) {
          if (evt.getTargetMorph() == this.get(/CheckBox/)) return false;
          if (evt.getTargetMorph() == this.get("Label") && this.get("Label").inputAllowed()) return false;

          this.setChecked(!this.isChecked());
          evt.stop(); return true;
        },
            ondMouseDown: function ondMouseDown(evt) {
          if (evt.getTargetMorph() !== this.get(/CheckBox/)) {
            this.setChecked(!this.isChecked());
            evt.stop(); return true;
          }
          return false;
        },
            reset: function reset() {
          this.connections = {checked: {}};
          lively.bindings.connect(this.get(/CheckBox/), 'checked', this, 'signalChecked');
        },
            setChecked: function setChecked(bool) {
          return this.get(/CheckBox/).setChecked(bool);
        },
            setLabel: function setLabel(string) {
            this.get('Label').setTextString(string);
        },
            signalChecked: function signalChecked(val) {
          lively.bindings.signal(this, 'checked', val);
        }
        },{
            _Extent: lively.pt(169.7,18.5),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(190.0,40.0),
            className: "lively.morphic.Box",
            grabbingEnabled: false,
            layout: {
                adjustForNewBounds: true,
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(100.0,18.0),
                resizeWidth: false,
                spacing: 4,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "LabeledCheckBox",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(12.0,18.0),
                _Position: lively.pt(0.3,0.3),
                checked: false,
                className: "lively.morphic.CheckBox",
                name: "forceRefreshCheckBox",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get("LabeledCheckBox"), "signalChecked", {});
            }
            },{
                _Extent: lively.pt(152.4,14.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 8,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 120.695652,
                _MinTextWidth: 120.695652,
                _Padding: lively.rect(4,2,0,0),
                _Position: lively.pt(17.0,0.3),
                allowInput: true,
                className: "lively.morphic.Text",
                emphasis: [[0,13,{}]],
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                layout: {
                    resizeWidth: true
                },
                name: "Label",
                sourceModule: "lively.morphic.TextCore",
                textString: "force refresh"
            }],
            isChecked: function isChecked() {
          return this.get(/CheckBox/).isChecked();
        },
            onMouseDown: function onMouseDown(evt) {
          if (evt.getTargetMorph() == this.get(/CheckBox/)) return false;
          if (evt.getTargetMorph() == this.get("Label") && this.get("Label").inputAllowed()) return false;

          this.setChecked(!this.isChecked());
          evt.stop(); return true;
        },
            ondMouseDown: function ondMouseDown(evt) {
          if (evt.getTargetMorph() !== this.get(/CheckBox/)) {
            this.setChecked(!this.isChecked());
            evt.stop(); return true;
          }
          return false;
        },
            reset: function reset() {
          this.connections = {checked: {}};
          lively.bindings.connect(this.get(/CheckBox/), 'checked', this, 'signalChecked');
        },
            setChecked: function setChecked(bool) {
          return this.get(/CheckBox/).setChecked(bool);
        },
            setLabel: function setLabel(string) {
            this.get('Label').setTextString(string);
        },
            signalChecked: function signalChecked(val) {
          lively.bindings.signal(this, 'checked', val);
        }
        },{
            _AutocompletionEnabled: true,
            _BorderColor: Color.rgb(95,94,95),
            _Extent: lively.pt(720,365),
            _LineWrapping: false,
            _Position: lively.pt(1.0,60.0),
            _ShowGutter: false,
            _TextMode: "javascript",
            _Theme: "",
            _aceInitialized: true,
            accessibleInInactiveWindow: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            droppingEnabled: false,
            evalEnabled: true,
            grabbingEnabled: false,
            layout: { resizeHeight: true, resizeWidth: true },
            name: "editor",
            sourceModule: "lively.ide.CodeEditor",
            textMode: "javascript",
            textString: '// code in here is evaluated in the context of the connected session\n',
            doListProtocol: function doListProtocol() {
            var string = this.getSelectionMaybeInComment(), self = this;
            this.withCompletionsDo(string, function(err, result) {
                if (err) { self.setStatusMessage(err, Global.Color.red); return; }
                lively.require("lively.ide.codeeditor.Completions").toRun(function() {
                    new lively.ide.codeeditor.Completions.ProtocolLister(self).openNarrower(result);
                });
            });
        },
            doSave: function doSave() {
            this.savedTextString = this.textString;
            if (this.evalEnabled) {
              this.saveExcursion(function(done) {
                this.selectAll();
                this.doit(false, null, function(err, msg) { done(); });
              });
            }
        },
            doit: function doit(printResult, editor, thenDo) {
            var self = this, text = this.getSelectionMaybeInComment();
            function output(msg, isError) {
                if (printResult) {
                    self.printObject(editor, msg, false);
                } else {
                    if (isError) self.setStatusMessage(msg, Global.Color.red);
                    var sel = self.getSelection();
                    if (sel && sel.isEmpty()) sel.selectLine();
                }
            }
            try {
                this.remoteEval(text, function(err, result) {
                    output(String(result), err);
                    thenDo && thenDo(err, result);
                });
            } catch (e) { output(e, true); }
        },
            printInspect: function printInspect(options) {
            var self = this,
                s = this.getSelectionMaybeInComment(),
                code = Global.Strings.format(
                  "var inspector, options, depth = %s, result;\n"
                + "if (typeof lively !== 'undefined' && lively.lang) { inspector = lively.lang.obj; options = {maxDepth: depth}; }\n"
                + "else if (typeof lv !== 'undefined') { inspector = lv; }\n"
                + "else if (typeof process !== 'undefined' && typeof require !== 'undefined') { inspector = require('util'); options = {depth: depth-1}; }\n"
                + "else throw new Error('no inspect available');\n"
                + "try { result = (function() { return %s })(); } catch(e) { result = e; }\n"
                + "inspector.inspect(result, options);\n", options.depth || 1, s);
            this.collapseSelection('end');
            this.remoteEval(code, function(err, result) {
                self.insertAtCursor(String(err || result), true, false, true);
            });
        },
            remoteEval: function remoteEval(code, doFunc) {
            var localSess = lively.net.SessionTracker.getSession();
            this.owner.withTargetSession(function(err, targetSess) {
                if (err) { doFunc(new Error('cannot get target session: %s' + err), err); return; }
                localSess.remoteEval(targetSess.id, processCode(code), function(msg) {
                    var isError = true, result = 'something went wrong';
                    if (!msg || !msg.data) { result = 'remote eval failed'; }
                    else if (msg.data.error) { result = 'remote eval error: ' + msg.data.error; }
                    else { result = msg.data.result; isError = false; }
                    doFunc(isError, result);
                });
            });

            function processCode(code) {
              return lively.lang.VM.evalCodeTransform(code, {
                topLevelVarRecorder: {},
                varRecorderName: 'window',
                sourceURL: "remote Lively2Lively workspace " + Date.now()
              })
            }
        },
            withCompletionsDo: function withCompletionsDo(code, doFunc) {
            var localSess = lively.net.SessionTracker.getSession();
            this.owner.withTargetSession(function(err, targetSess) {
                if (err) { doFunc(new Error('cannot get target session: %s' + err), err); return; }
                localSess.sendTo(targetSess.id, 'completions', {expr: code}, function(msg) {
                    var err = msg.error || msg.data.error;
                    doFunc(err ? err : null, msg.data);
                });
            });
        }
        }],
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "sessionChanged", this, "updateFromTargetSession", {});
    },
        interactivelyChooseSession: function interactivelyChooseSession(thenDo) {
      var self = this;
      lively.ide.commands.exec('lively.net.lively2lively.listSessions', function(err, session) {
        self._targetSession = session;
        lively.bindings.signal(self, "sessionChanged", session);
        thenDo && thenDo(err, session);
      }, this.get("forceRefreshCheckBox").isChecked());
    },
        lookForNewerSessionOfSameTarget: function lookForNewerSessionOfSameTarget() {
      // this.startStepping(2000, 'lookForNewerSessionOfSameTarget');
      // this.stopStepping();

      // if enabled, we will try to connect to a newer session of the same user / worldURL combo
      if (!this.get("autoConnectToNewerSession").isChecked() || !this._targetSession) return;

      var self = this, userName = this._targetSession.user, url = this._targetSession.worldURL;
      var forceUpdate = this.get("forceRefreshCheckBox").isChecked();

      withLastActiveSessionOfUserDo(userName, url, function(err, targetSession) {
        if (!targetSession) return;
        self._targetSession = targetSession;
    // show(targetSession)
        lively.bindings.signal(self, "sessionChanged", targetSession);
      });


      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      function withLastActiveSessionOfUserDo(username, url, thenDo) {
        var localSession = lively.net.SessionTracker.getSession();
        lively.net.tools.Functions.withSessionsDo(localSession, function(err, sessions) {
          if (err) return show(err.stack || String(err));
          thenDo(null, sessions.filter(function(s) {
            return s.user == username && s.worldURL === url; })
            .sortByKey("timeOfRegistration").last());
        }, forceUpdate);
      }
    },
      selectTargetSession: function selectTargetSession(sess) {
          this._targetSession = sess;
          lively.bindings.signal(this, 'sessionChanged', sess);
      },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.startStepping(2000, 'lookForNewerSessionOfSameTarget');
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('editor').focus();
    },
        reset: function reset() {
      lively.bindings.connect(this.get("sessionChooseButton"), 'fire', this, 'interactivelyChooseSession');

      lively.bindings.connect(this, 'sessionChanged', this, 'updateFromTargetSession');
      this.doNotSerialize = ["_targetSession"];

      this.get('editor').textString = '// code in here is evaluated in the context of the connected session\n';
    },
        updateFromTargetSession: function updateFromTargetSession() {
        var s = this._targetSession;
        if (s) this.get("sessionChooseButton").setLabel(Strings.format("%s - %s (%s)", s.worldURL, s.user,lively.lang.date.relativeTo(new Date(s.lastActivity), new Date())));
        else this.get("sessionChooseButton").setLabel("No session selected");

    },
        withTargetSession: function withTargetSession(func) {
        func.call(null, null, this._targetSession);
    }
    }],
    titleBar: "Lively2LivelyWorkspace"
});

lively.BuildSpec("lively.net.tools.ConnectionIndicatorMenuBarEntry", lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "lively2livelyStatusLabel",
  menuBarAlign: "right",
  changeColorForMenu: false,

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    extent: lively.pt(130,20),
    textColor: Color.rgb(127,230,127),
    toolTip: "Shows the connection status to the cloxp (Lively) server environment. If the indicator is red this means that the server currently cannot be reached."
  }),

  morphMenuItems: function morphMenuItems() {
    var self = this,
        items = [],
        isConnected = lively.net.SessionTracker.isConnected(),
        allowRemoteEval = !!lively.Config.get('lively2livelyAllowRemoteEval');

    var livelyItems = [
        ['show login info', function() { lively.net.Wiki.showLoginInfo(); }],
    ];

    if (!isConnected) {
      return livelyItems.concat([
        ['connect', function() {
            lively.net.SessionTracker.resetSession();
            self.update.bind(self).delay(0.2);
        }]
      ]);
    } else {
      return livelyItems.concat([
        ['[' + (allowRemoteEval ? 'x' : ' ') + '] allow remote eval', function() {
            lively.Config.set('lively2livelyAllowRemoteEval', !allowRemoteEval);
        }],
        ['reset connection', function() {
            lively.net.SessionTracker.resetSession();
        }],
        ['disconnect', function() {
            lively.net.SessionTracker.closeSessions();
            self.update.bind(self).delay(0.2);
        }]
      ]);
    }

  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  messageReceived: function messageReceived(msgAndSession) {
    var msg = msgAndSession.message, s = msgAndSession.session;
    if (msg.action === 'remoteEvalRequest') {
        msg = Strings.format(
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
    this.applyStyle({
      fill: Global.Color.green,
      textColor: Global.Color.white
    });
    this.textString = '[l2l] connected';
  },

  onConnecting: function onConnecting(session) {
    this.informsAboutMessages = false;
    this.textString = '[l2l] connecting';
    this.applyStyle({
      fill: Global.Color.gray,
      textColor: Global.Color.white
    });
  },

  onDisconnect: function onDisconnect(session) {
    // this.onDisconnect()
    this.informsAboutMessages = false;
    this.textString = '[l2l] disconnected';
    this.applyStyle({
      fill: Global.Color.red,
      textColor: Global.Color.white
    });
  },

  update: function update() {
    var s = lively.net.SessionTracker.getSession();
    switch (s && s.status()) {
        case null: case undefined:
        case 'disconnected': this.onDisconnect(s); break;
        case 'connected': this.onConnect(s); break;
        case 'connecting': this.onConnecting(s); break;
    }
  },

  onLoad: function onLoad() {
    (function() { this.update(); }).bind(this).delay(0);
    this.startStepping(5*1000, 'update');
    this.onConnecting(null);
  }

}));

}); // end of module
