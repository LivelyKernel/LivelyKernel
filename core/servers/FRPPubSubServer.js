// FRPPubSubServer handles publish/subsribe style messages for 
// distributed FRP sessions so that changes can propogate on a
// network (e.g. different tabs in a browser on a local network)

var inspect = require("util").inspect;
var WebSocketServer = require('./support/websockets').WebSocketServer;

var subscriptions = {};
var channels = {};

var actions = {
    helloWorld: function(c, msg) {
        console.log("Got message %s", inspect(msg));
        c.send({action: 'helloWorldReply', data: 'received message, ' + msg.data.length + ' chars'});
    },
    
    // a publisher tells the server to put a new value on the channel
    FRPChannelPut: function (connection, msg) {
        
        var channel = msg.data.channel;
        var newValue = msg.data.value;
        connection.send({action: 'FRPChannelPutReply', data: 'Got put to channel ' + channel + " <- " + newValue}); 
        channels[channel] = newValue;
        console.log(msg);
        // if this channel has subscribers forward the new value to them
        if (subscriptions[channel]) {
            var all = subscriptions[channel];
            Object.keys(all).forEach(function (morphName) {
                var rcvr = all[morphName];
                console.log('will forward update to ' + inspect(rcvr, 2) + " : " + morphName + '' + rcvr);
                rcvr.send({action: 'FRPChannelGet', data: {channel: channel, morphName: morphName, value: newValue}});
            });
        }
    },
    
    // a client can subscribe to a channel
    FRPChannelSubscribe: function (connection, msg) { 
        var channel = msg.data.channel;
        var morphName = msg.data.morphName;
        var rcvr = connection;
        connection.send({action: 'FRPChannelSubscribeReply', data: 'Got subscribe by ' + morphName + ' to ' + channel + ' by ' + rcvr});
        console.log('got subscribe from ' + inspect(rcvr, 2));
        
        if (!subscriptions[channel]) {
            subscriptions[channel] = {};
        }
        var morphsSubscriptions = subscriptions[channel];
        morphsSubscriptions[morphName] = rcvr;
        console.log(msg);
    },
    
    // a client can unsubscribe from a channel
    FRPChannelUnsubscribe: function (connection, msg) { 
        var channel = msg.data.channel;
        var rcvr = connection;
        connection.send({action: 'FRPChannelUnsubscribeReply', data: 'Got unsubscribe to ' + channel + ' by ' + rcvr}); 
        if (subscriptions[channel]) {
            var hasIt = subscriptions[channel].detect(function(c) {
            return c === rcvr; });
            if (hasIt) {
                subscriptions[channel].remove(hasIt);
            }
        }
        console.log(msg);
    }
};

function startFRPPubSubSocketServer(route, subserver, thenDo) {
     var webSocketFRPPubSubHandler = new WebSocketServer();
     webSocketFRPPubSubHandler.debug = true;
     webSocketFRPPubSubHandler.listen({
        route: route + 'connect',
        subserver: subserver,
        actions: actions
    });
    webSocketFRPPubSubHandler.on('lively-message', function(msg, connection) {
        if (!actions[msg.action]) {
            console.warn('FRPPubSub subserver cannot handle message ', msg);
            return;
        }
        try {
            console.log('FRPPubSub running act ' + msg.action);
            actions[msg.action](connection, msg);
        } catch(e) {
            console.error('FRPPubSub subserver error when handlinglin', msg, e);
        }
    });
    thenDo(null, webSocketFRPPubSubHandler);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// register routes
module.exports = function(route, app, subserver) {
     startFRPPubSubSocketServer(route, subserver, function(err, websocketFRPPubSubHandler) {
        console.log('WebSocket FRPPubSub Handler ready to rumble...');
    });
    app.get(route, function(req, res) {
        res.end("FRPPubSubServer is running!");
    });
}
