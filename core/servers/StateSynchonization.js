var util = require("util"),
    async = require("async"),
    store = require("./Store");
    l2l = require("./LivelyServices");

if (!global.lively.PropertyPath) {
    console.log("throw up")
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

subscribers = [];
sTracker = require('./SessionTracker').SessionTracker.servers['/nodejs/SessionTracker/']

var storeName = "stateSynchronization",
    informSubscribers = function(pathName, value) {
        var path = global.lively.PropertyPath(pathName);
        subscribers.forEach(function(request) {
            if (path.isParentPathOf(request.path))
                sTracker.findConnection(request.l2lId, function(err, connection) {
                    if (err) return // any type of error will result in not informing this connection this time
                    connection.send({
                        action: 'syncValueChanged',
                        data: {path: path.toString(), value: value}
                    })
                })
        })
    };

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var stateSynchronizationServices = {
    syncSet: function(sessionServer, connection, msg) {
        // provide old and new value,
        // if old == current, then current = new
        // else notify failure and proivde current
        lastMessage = msg;
        store.write(storeName, msg.data.path, msg.data.newValue, {type: 'equality', value: msg.data.oldValue}, msg.sender, function(err) {
            if (err) {
                return store.read(storeName, msg.data.path, function(err, val) {
                    console.log("Unsuccessfully tried to store '" + msg.data.newValue + "' in stead of '" + msg.data.oldValue + "'")
                    connection.send({
                        action: msg.action + 'Result',
                        inResponseTo: msg.messageId,
                        data: { successful: false, value: val }
                    })
                })
            }
            connection.send({
                action: msg.action + 'Result',
                inResponseTo: msg.messageId,
                data: { successful: true, value: msg.data.newValue }
            })
            informSubscribers(msg.data.path, msg.data.newValue)
        })
    },
    syncGet: function(sessionServer, connection, msg) {
        // answer current value
        // register callback
        // TODO: unionize paths, to inform only about the most general node change...
        var path = global.lively.PropertyPath(msg.data);
        if (subscribers.indexOf(function(ea) { return ea.l2lId === msg.sender && ea.path.equal(path)}) === -1)
            subscribers.push({path: path, l2lId: msg.sender})
        store.read(storeName, msg.data, function(err, val) {
            connection.send({
                action: msg.action + 'Result',
                inResponseTo: msg.messageId,
                data: val,
                err: err
            })
        })
    },
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
module.exports = function(route, app) {
    app.get(route, function(req, res) {
        res.end("CycInterfaceServer is running!");
    });
}

var services = l2l.services;
util._extend(services, stateSynchronizationServices);

module.exports.subscribers = subscribers;
