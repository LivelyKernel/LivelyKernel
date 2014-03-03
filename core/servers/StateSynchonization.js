var util = require("util"),
    async = require("async"),
    store = require("./Store");
    l2l = require("./LivelyServices");
require("../lively/lang/Array");

if (!global.lively.PropertyPath) {
    console.log("StateSynchonization depends on PropertyPath, which should have been loaded by Store.");
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

subscribers = [];
sTracker = require('./SessionTracker').SessionTracker.servers['/nodejs/SessionTracker/']

var storeName = "stateSynchronization",
    informSubscribers = function(pathName, value) {
        var changedPath = global.lively.PropertyPath(pathName);
        subscribers.forEach(function(request) {
            var path
            if (path = request.paths.detect(function(ea) { 
                    return ea.isParentPathOf(changedPath) || changedPath.isParentPathOf(ea)}))
                sTracker.findConnection(request.l2lId, function(err, connection) {
                    if (err) return // any type of error will result in not informing this connection this time
                    if (path.equal(changedPath))
                        connection.send({
                            action: 'syncValueChanged',
                            data: {changedPath: path.toString(), value: value, valuePath: path.toString()}
                        })
                    else if (path.isParentPathOf(changedPath))
                        store.read(storeName, path, function(err, val) {
                            connection.send({
                                action: 'syncValueChanged',
                                data: {changedPath: changedPath.toString(), value: val, valuePath: path.toString()}
                            })
                        })
                    else // changedPath.isParentPathOf(path)
                        connection.send({
                            action: 'syncValueChanged',
                            data: {changedPath: changedPath.toString(), value: path.slice(changedPath.size(), path.size()).get(value), valuePath: path.toString()}
                        })
                })
        })
    };

var subscribe = function(sender, path, subscribers) {
    var existingInterests = subscribers.detect(function(ea) { return ea.l2lId === sender })
    if (existingInterests === undefined)
        subscribers.push({paths: [path], l2lId: sender})
    else {
        // first test: l2lId already wants to know about any changes at this place -> ignore this update
        var parentPath = existingInterests.paths.detect(function(ea) { return ea.isParentPathOf(path)})
        if (parentPath !== undefined) return
        // second test: drop all children of this place, beacuse they are included
        existingInterests.paths = existingInterests.paths.filter(function(ea) { return !path.isParentPathOf(ea) });
        
        existingInterests.paths.push(path);
    }
};

(function testSubscribe() {
    var assert = require('assert');
    subscribers = [{paths: [], l2lId: "1"}],
        pp = global.lively.PropertyPath;
    assert.ok(subscribers.length == 1 && subscribers[0].paths.length == 0, "initial state is ok")
    subscribe("1", pp("a.b"), subscribers)
    assert.ok(subscribers.length == 1 && subscribers[0].paths.length == 1, "adding first path failed")
    subscribe("1", pp("a.c"), subscribers)
    assert.ok(subscribers.length == 1 && subscribers[0].paths.length == 2, "adding second path failed")
    subscribe("1", pp("a.b.a"), subscribers)
    assert.ok(subscribers.length == 1 && subscribers[0].paths.length == 2, "adding child failed")
    subscribe("1", pp("a"), subscribers)
    assert.ok(subscribers.length == 1 && subscribers[0].paths.length == 1, "merge paths with newcomer failed")
})()

var retry = function(connection, msg) {
    store.read(storeName, msg.data.path, function(err, val) {
        console.log("Unsuccessfully tried to store '" + msg.data.newValue + "' in stead of '" + msg.data.oldValue + "', while the current value is '" + val + "'")
        connection.send({
            action: msg.action + 'Result',
            inResponseTo: msg.messageId,
            data: { successful: false, value: val }
        })
    })
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var stateSynchronizationServices = {
    syncSet: function(sessionServer, connection, msg) {
        // provide old and new value,
        // if old == current, then current = new
        // else notify failure and proivde current

        if (msg.data.newValue === undefined) return retry(connection, msg)
        store.write(storeName, msg.data.path, msg.data.newValue, {type: 'equality', value: msg.data.oldValue}, msg.sender, function(err) {
            if (err) {
                return retry(connection, msg)
            }
            connection.send({
                action: msg.action + 'Result',
                inResponseTo: msg.messageId,
                data: { successful: true, value: msg.data.newValue }
            });
            informSubscribers(msg.data.path, msg.data.newValue)
        })
    },
    syncGet: function(sessionServer, connection, msg) {
        // answer current value
        // register callback
        subscribe(msg.sender, global.lively.PropertyPath(msg.data), subscribers);
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
