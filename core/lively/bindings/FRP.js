module('lively.bindings.FRP').requires('lively.bindings.FRPCore', 'lively.persistence.Serializer', 'lively.morphic').toRun(function() {

lively.morphic.Morph.addMethods({
    openFRPInspector: function() {
        var inspectorWindow = $world.openPartItem('FRPInspector', 'PartsBin/Tools');
        var inspector = inspectorWindow.get("FRPInspector");
        inspector.setTarget(this);
    },
    frpConnect: function(fromProp, targetName, targetProp) {
        if (!this.frpConnections) {
            this.frpConnections = {};
        }
        if (!this.frpConnections[fromProp]) {
            this.frpConnections[fromProp] = [];
        }
        var connections = this.frpConnections[fromProp];
        var hasIt = connections.detect(function(c) {
            return c.targetName === targetName && c.targetProp === targetProp;
        });
        if (!hasIt) {
            var c = new lively.bindings.FRP.FRPConnection().connectTo(targetName, targetProp);
            connections.push(c);
        }
    },
    frpDisconnect: function(fromProp, targetName, targetProp) {
        if (!this.frpConnections) {
            return;
        }
        if (!this.frpConnections[fromProp]) {
            return;
        }
        var connections = this.frpConnections[fromProp];
        var hasIt = connections.detect(function(c) {
            return c.targetName === targetName && c.targetProp === targetProp;
        });
        if (hasIt) {
            connections.remove(hasIt);
        }
    },
    frpPublish: function(fromProp) {
        if (!this.frpPublishes) {
            this.frpPublishes = {};
        }
        var hasIt = this.frpPublishes[fromProp];
        if (!hasIt) {
            var c = new lively.bindings.FRP.FRPPublish().publish(fromProp);
            this.frpPublishes[fromProp] = c;
        }   
    },
    frpUnpublish: function(fromProp) {
        if (!this.frpPublishes) {
            return;
        }
        var hasIt = this.frpPublishes[fromProp];
        if (hasIt) {
            delete this.frpPublishes[fromProp];
        }
    },
    frpSubscribe: function(fromProp) {
        if (!this.frpSubscriptions) {
            this.frpSubscriptions = {};
        }
        var hasIt = this.frpSubscriptions[fromProp];
        if (!hasIt) {
            var c = new lively.bindings.FRP.FRPSubscribe().subscribe(this.getName(), fromProp);
            this.frpSubscriptions[fromProp] = c;
            var session = lively.net.SessionTracker.getSession();
            if (!session._frpSubsriberInitDone) {
                this.frpSubscriberInit();
            }
        }
    },
    frpUnsubscribe: function(fromProp) {
        if (!this.frpSubscriptions) {
            return;
        }
        var hasIt = this.frpSubscriptions[fromProp];
        if (hasIt) {
            hasIt.unsubscribe(fromProp);
            delete this.frpSubscriptions[fromProp];
        }
    },
    frpSubscriberInit: function() {
        // evaluate code below...
        var session = lively.net.SessionTracker.getSession();
        session._frpSubsriberInitDone = true;
        //session.channels = {};
        lively.net.SessionTracker.registerActions({
        // server will use this to send new updates from the channel to this subscriber
        FRPChannelGet: function (msg, session) { 
            var channel = msg.data.channel;
            var morphName = msg.data.morphName;
            var newValue = msg.data.value;
            console.log("I have received an update: channel '" + channel + "' <- " + newValue);
            //this.channels[channel] = newValue;
            $world.get(morphName)[channel].frpSet(newValue);
        }
        });
    }
});

ObjectLinearizerPlugin.subclass('lively.bindings.FRP.EventStreamPlugin',
'interface', {
    serializeObj: function(obj) {
        if (!this.isEventStream(obj)) {
            return null;
        }
        return {
            isSerializedStream: true,
            type: obj.type,
            owner: obj.owner,
            currentValue: (obj.isContinuous ? obj.currentValue : undefined),
            isContinuous: obj.isContinuous,
            code: obj.code,
            streamName: obj.streamName
        };
    },
    deserializeObj: function(copy) {
        if (!copy || !copy.isSerializedStream) return null;
        return copy.type === "value" ?
            new lively.bindings.FRPCore.EventStream().value(copy.currentValue) :
            (copy.type === "userEvent" ?
                new lively.bindings.FRPCore.EventStream().userEvent()
                    : lively.bindings.FRPCore.EventStream.fromString(copy.code));
    },
    afterDeserializeObj: function (obj) {
        if (this.isEventStream(obj)) {
            if (obj.owner) {
                return obj.installTo(obj.owner, obj.streamName);
            }
            delete this.isSerializedStream;
        }
        return null;
    }
},
'private', {
    isEventStream: function(obj) {
        return obj instanceof lively.bindings.FRPCore.EventStream;
    }
});

if (lively.persistence.pluginsForLively.indexOf(lively.bindings.FRP.EventStreamPlugin) < 0) {
    lively.persistence.pluginsForLively.push(lively.bindings.FRP.EventStreamPlugin);
}

Object.subclass('lively.bindings.FRP.FRPConnection',
'connecting', {
    connectTo: function(targetName, targetProp) {
        this.targetName = targetName;
        this.targetProp = targetProp;
        return this;
    },
    update: function (newValue, srcObj, maybeTime) {
        var target = typeof this.targetName === "string" ? srcObj.get(this.targetName) : this.targetName;
        if (target) {
            var strm = target[this.targetProp];
            if (strm && this.isEventStream(strm)) {
                strm.frpSet(newValue, maybeTime);
            }
        }
    },
    isEventStream: function(v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    }
});

Object.subclass('lively.bindings.FRP.FRPPublish',
'publishing', {
    publish: function(fromProp) {
        this.fromProp = fromProp;
        this.getServerSession();
        return this;
    },
    getServerSession: function() {
        this.session = lively.net.SessionTracker.getSession();
        this.serverSessionId = undefined;
        // HACK FIXME: hack to find the session id for the "frpserver.html" tab!
        this.session.getUserInfo(
            function (obj) { 
                var all = obj[$world.getUserName()]; // HACK FIME: need to use $USER intead...??
                for (var i = 0; i < all.length; i++) {
                    var curr = all[i];
                    if (curr.worldURL.toString().indexOf("frpserver") >= 0) {
                        this.serverSessionId = curr.id;
                        console.log("got server session: " + curr.id);
                        break;
                    }
                }  
            }.bind(this)
        );
    },
    update: function (newValue, srcObj, maybeTime) {
        console.log("frp publish pushing a new update... " + this.fromProp + " <- " + newValue);
         // tells frp server to push a new value on this channel (fromProp)
        this.session.sendTo(this.serverSessionId, 'FRPChannelPut', {channel: this.fromProp, recipient: undefined, value: newValue}, inspect);
    },
    isEventStream: function(v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    }
});
Object.subclass('lively.bindings.FRP.FRPSubscribe',
'subscribing', {
    subscribe: function(morphName, fromProp) {
        this.morphName = morphName;
        this.fromProp = fromProp;
        this.getServerSessionAndSendRequest();
        return this;
    },
    getServerSessionAndSendRequest: function() {
        this.session = lively.net.SessionTracker.getSession();
        this.serverSessionId = undefined;
        // HACK FIXME: hack to find the session id for the "frpserver.html" tab!
        this.session.getUserInfo(
            function (obj) { 
                var all = obj[$world.getUserName()]; // HACK FIME: need to use $USER intead...??
                for (var i = 0; i < all.length; i++) {
                    var curr = all[i];
                    if (curr.worldURL.toString().indexOf("frpserver") >= 0) {
                        this.serverSessionId = curr.id;
                        console.log("got server session: " + curr.id);
                        break;
                    }
                }
                console.log("frp subscribe to... " + this.fromProp);
                // tells the frp server to subscribe this client on this channel (fromProp)
                this.session.sendTo(this.serverSessionId, 'FRPChannelSubscribe', {channel: this.fromProp, morphName: this.morphName}, inspect);
            }.bind(this)
        );
    },
    unsubscribe: function(fromProp) {
        console.log("frp unsubscribe from... " + this.fromProp);
        // tells frp server to unsubscribe this client from this channel (fromProp)
        this.session.sendTo(this.serverSessionId, 'FRPChannelUnsubscribe', {channel: this.fromProp}, inspect);
        return this;
    },
    isEventStream: function(v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    }
});

}) // end of module
