module('lively.bindings.FRPPubSubServer').requires('lively.bindings.FRP', 'lively.net.SessionTracker').toRun(function() {
// frpserver.html will act as the FRP publish/subscribe server
// evaluate code below...
    var session = lively.net.SessionTracker.getSession();
    session.subscriptions = {};
    session.channels = {};
    lively.net.SessionTracker.registerActions({
        // a publisher tells the server to put a new value on the channel
        FRPChannelPut: function (msg, session) { 
            var channel = msg.data.channel;
            var newValue = msg.data.value;
            session.answer(msg, 'Got put to channel ' + channel + " <- " + newValue); 
            this.channels[channel] = newValue;
            console.log(msg);
            // if this channel has subscribers forward the new value to them
            if (this.subscriptions[channel]) {
                var all = this.subscriptions[channel];
                Object.keys(all).forEach(function (morphName) {
                    var rcvSession = all[morphName];
                    console.log('will forward update to ' + rcvSession + " : " + morphName + '');
                    this.sendTo(rcvSession, 'FRPChannelGet', {channel: channel, morphName: morphName, value: newValue}, inspect);
                }.bind(this));
            }
        }.bind(session)
    });
    lively.net.SessionTracker.registerActions({
        // a client can subscribe to a channel
        FRPChannelSubscribe: function (msg, session) { 
            var channel = msg.data.channel;
            var morphName = msg.data.morphName;
            session.answer(msg, 'Got subscribe by ' + morphName + ' to ' + channel + ' by ' + msg.sender); 
            var morphsSubscriptions;
            if (!this.subscriptions[channel]) {
                this.subscriptions[channel] = {};
            }
            morphsSubscriptions = this.subscriptions[channel];
            morphsSubscriptions[morphName] = msg.sender;
            console.log(msg);
        }.bind(session)
    });
    lively.net.SessionTracker.registerActions({ 
        // a client can unsubscribe from a channel
        FRPChannelUnsubscribe: function (msg, session) { 
            var channel = msg.data.channel;
            session.answer(msg, 'Got unsubscribe to ' + channel + ' by ' + msg.sender); 
            if (this.subscriptions[channel]) {
                var hasIt = this.subscriptions[channel].detect(function(c) {
                return c === msg.sender; });
                if (hasIt) {
                    this.subscriptions[channel].remove(hasIt);
                }
            }
            console.log(msg);
        }.bind(session)
    });
    console.log("Server started at: " + session.sessionId)
}) // end of module
