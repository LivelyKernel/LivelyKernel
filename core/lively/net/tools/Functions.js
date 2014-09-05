module('lively.net.tools.Functions').requires().toRun(function() {

Object.extend(lively.net.tools.Functions, {

    getLocalSession: function() {
        return lively.net.SessionTracker.createSession();
    },

    getSessionTitle: function(session) {
        // lively.net.tools.Functions.getSessionTitle({user: 'test', worldURL: URL.source, id: 123})
        if (!session) return "no Lively world selected";
        var maxLength = 100;

        // making the title short enough to fit on the title line...
        var user = session.user, worldName = session.worldURL;

        // the user name should go on there in every case
        var worldNameMaxLength = maxLength - user.length;

        // time of last activity
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

    printSession: function(session) {

        var id = session.id || "?",
            trackerId = session.trackerId || "no tracker",
            ip = session.remoteAddress || "no ip",
            location = session.location ? session.location.locationString : "",
            user = session.user || "no user",
            url = session.worldURL || "no url",
            created = session.timeOfCreation ? new Date(session.timeOfCreation).relativeTo(new Date) : "a while",
            registered = session.timeOfRegistration ? new Date(session.timeOfRegistration).relativeTo(new Date) : "a while",
            lastActive = session.lastActivity ? new Date(session.lastActivity).relativeTo(new Date) : "a while";

        return Strings.format("id:            %s\n"
                            + "trackerId:     %s\n"
                            + "ip:            %s\n"
                            + "location:      %s\n"
                            + "user:          %s\n"
                            + "url:           %s\n"
                            + "created:       %s ago\n"
                            + "registered:    %s ago\n"
                            + "last activity: %s ago\n",
            id, trackerId, ip, location, user, url, created, registered, lastActive);
    },

    openWorkspaceForSession: function(session) {
        var workspace = lively.BuildSpec('lively.net.tools.Lively2LivelyWorkspace').createMorph();
        workspace.openInWorldCenter().comeForward();
        (function() {
            workspace.targetMorph.showNameInput();
            (function() {
                var sel = workspace.get('ConnectionInput').getList().detect(function(item) {
                    return item.value.id === session.id;
                });
                workspace.get('ConnectionInput').setSelection(sel);
            }).delay(1);
        }).delay(0);
    },

    openWorldPreview: function(session, title) {
        var preview = $morph('lively2livelyPreview');
        if (!preview) {
            preview = new lively.morphic.HtmlWrapperMorph(pt(400,400));
            $world.addFramedMorph(preview, title || 'world preview');
            var win = preview.getWindow();
            win.openInWorldCenter();
            var zoomInBtn = new lively.morphic.Button(lively.rect(0,0,20,20), '+');
            var zoomOutBtn = new lively.morphic.Button(lively.rect(0,0,20,20), '-');
            win.addMorph(zoomInBtn);
            win.addMorph(zoomOutBtn);
            zoomInBtn.align(zoomInBtn.getPosition(), preview.bounds().topLeft().addXY(10,10));
            zoomOutBtn.align(zoomOutBtn.getPosition(), preview.bounds().topLeft().addXY(10,35));
            lively.bindings.connect(zoomInBtn, 'fire', preview, 'zoomIn');
            lively.bindings.connect(zoomOutBtn, 'fire', preview, 'zoomOut');
            preview.zoom = 1;
        }
        preview.applyStyle({
            enableGrabbing: false, clipMode: 'auto',
            resizeWidth: true, resizeHeight: true
        });
        preview.name = 'lively2livelyPreview';

        preview.worldId = session.id;
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
        return preview;
    },

    sendMorph: function(fromSession, toSession, morph) {
        fromSession.sendObjectTo(toSession.id, morph,
            {withObjectDo: function(m) { m.openInWorldCenter(); }},
            function(msg) { alertOK('send object result:\n' + (msg.data.error || msg.data.result)); });
    },

    showEventLogger: function() {
        // this are events from the connected tracker

        var ed = $world.addCodeEditor({
            title: 'l2l event log',
            content: '',
            textMode: 'text',
            fontSize: 8
        });

        ed.addScript(function update() {
            // this.startStepping(5000, 'update');
            // this.startStepping(5000, 'update');
            // this.stopStepping();
            if (this._isUpdating) return;
            this._isUpdating = true;

            var s = lively.net.SessionTracker.getSession();
            var self = this;

            if (s && s.isConnected()) {
                var gotAnswer = false;
                Functions.waitFor(4000, function() { return !!gotAnswer; }, function(err) {
                    if (err) self._isUpdating = false;
                });
                s.sendTo(s.trackerId, 'getEventLog', {limit: 3000}, function(answer) {
                    self._isUpdating = false;
                    var log = answer.data.log;

                    self.saveExcursion(function(reset) {
                        self.textString = log.length + '\n\n' + log.map(function(ea) {
                            return Strings.format("[%s] %s", ea.timestamp, ea.message)
                        }).reverse().join('\n');
                        reset();
                    });

                });
            } else {
                self._isUpdating = false;
            }
        });

        ed.startStepping(5000, 'update');

        ed.getWindow().openInWorldCenter().comeForward();
    },

    withSessionsDo: function(localSession, thenDo, forceRefresh) {

        if (!localSession || !localSession.isConnected()) {
            thenDo(new Error("not connected"), []);
            return;
        }

        localSession.getSessions(function(remotes) {
            var sessions = Object.keys(remotes).map(function(trackerId) {
                return Object.keys(remotes[trackerId]).map(function(sessionId) {
                    return remotes[trackerId][sessionId];
                });
            }).flatten();

            var sorted = sessions
                .groupBy(function(ea) { return ea.user })
                .mapGroups(function(_, group) {
                    return group.sortBy(function(ea) {
                        return ea.lastActivity; }).reverse(); })
                .toArray().flatten();

            thenDo(null, sorted);
        }, localSession);
    },

    withTrackerSessionsDo: function(localSession, thenDo, forceRefresh) {
        URL.nodejsBase.withFilename("SessionTracker/sessions/default-flattened")
            .asWebResource().beAsync().get().withJSONWhenDone(function(sessions, status) {
                var trackers = sessions.filter(function(sess) { return sess.type === 'tracker'; });
                thenDo(null, trackers);
            });
    },

    visitWorldOfSession: function(session) {
        session && session.worldURL && window.open(session.worldURL);
    }

});


}) // end of module
