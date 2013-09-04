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
    frpConnectVariable: function(propName) {
        var strm = new lively.bindings.FRPCore.EventStream().value(this[propName]);
        strm.installTo(this, "frp_" + propName);
        connect(this, propName, this, "_frp_" + propName);
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
        /*
        
        lively.net.SessionTracker.registerActions({
        // server will use this to send new updates from the channel to this subscriber
        FRPChannelGet: function (msg, session) { 
            var channel = msg.data.channel;
            var morphName = msg.data.morphName;
            var newValue = msg.data.value;
            console.log("I have received an update: channel '" + channel + "' <- " + newValue);
            //this.channels[channel] = newValue;
            $world.get(morphName)[channel].frpSet(newValue, Date.now());
        }
        });
        */
        /*
        
        var url = new URL(Config.nodeJSURL + '/FRPPubSubServer/connect');
        this.frpPubSubSocket = new lively.net.WebSocket(url, {protocol: 'lively-json'});
        //this.frpPubSubSocket.onMessage = function(msg) { debugger; console.log(msg); }
        connect(this.frpPubSubSocket, 'FRPChannelGet', this, 'rrr');
        */
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
Object.subclass('lively.bindings.FRP.FRPPublishSubscribe',
'publish-subscribe', {
    setupServerSocket: function() {
        var sessionId = lively.net.SessionTracker.getSession().sessionId;
        var url = new URL(Config.nodeJSURL + '/FRPPubSubServer/connect');
        var socket = new lively.net.WebSocket(url, {protocol: 'lively-json'});
        $world.frpPubSub_socket = socket;
        $world.frpPubSub_sessionId = sessionId;
        $world.frpPubSub_initDone = true;
        connect(socket, 'closed', Global, 'show', {converter: function() { return 'websocket closed'; }});

        socket.onLivelyJSONMessage = function (msg) { 
            console.log("FRPPubSub reply: " + Objects.inspect(msg,2)); 
            if (msg.action === 'FRPChannelSubscribeReply') {
                console.log("this was a FRPChannelSubscribeReply...");
            } else if (msg.action === 'FRPChannelPutReply') {
                console.log("this was a FRPChannelPutReply...");
            } else if (msg.action === 'FRPChannelGet') {
                console.log("this was a FRPChannelGet...");
                var channel = msg.data.channel;
                var morphName = msg.data.morphName;
                var newValue = msg.data.value;
                console.log("I have received an update: channel '" + channel + "' <- " + newValue);
                //this.channels[channel] = newValue;
                $world.get(morphName)[channel].frpSet(newValue, Date.now());
            } else {
                console.log("this was a what?...");
            }
        }
    },
    isEventStream: function(v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    }
});
lively.bindings.FRP.FRPPublishSubscribe.subclass('lively.bindings.FRP.FRPPublish',
'publish-subscribe', {
    publish: function(fromProp) {
        this.fromProp = fromProp;
        if (!$world.frpPubSub_initDone)
            this.setupServerSocket();
        this.sendPublish();
        return this;
    },
    sendPublish: function() {
        console.log("frp publish to... (currently a noop!)" + this.fromProp);
        // tells the frp server to publish this channel (fromProp)
        //$world.frpPubSub_socket.send({action: 'FRPChannelPublish', data: {channel: this.fromProp, session: $world.frpPubSub_sessionId}});
    },
    update: function (newValue, srcObj, maybeTime) {
        console.log("frp publish pushing a new update... " + this.fromProp + " <- " + newValue);
        // tells frp server to push a new value on this channel (fromProp)
        $world.frpPubSub_socket.send({action: 'FRPChannelPut', data: {channel: this.fromProp, recipient: undefined, value: newValue}});

    }
});
lively.bindings.FRP.FRPPublishSubscribe.subclass('lively.bindings.FRP.FRPSubscribe',
'publish-subscribe', {
    subscribe: function(morphName, fromProp) {
        this.morphName = morphName;
        this.fromProp = fromProp;
        if (!$world.frpPubSub_initDone)
            this.setupServerSocket();
        this.sendSubscribe();
        return this;
    },
    sendSubscribe: function() {
        console.log("frp subscribe to... " + this.fromProp);
        // tells the frp server to subscribe this client on this channel (fromProp)
        $world.frpPubSub_socket.send({action: 'FRPChannelSubscribe', data: {channel: this.fromProp, morphName: this.morphName, session: $world.frpPubSub_sessionId}});
    },
    unsubscribe: function(fromProp) {
        console.log("frp unsubscribe from... " + this.fromProp);
        // tells frp server to unsubscribe this client from this channel (fromProp)
         $world.frpPubSub_socket.send({action: 'FRPChannelUnsubscribe', data: {channel: this.fromProp, session: $world.frpPubSub_sessionId}});
        return this;
    }
});

}) // end of module