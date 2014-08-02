var util = require("util"),
    async = require("async"),
    store = require("./Store");
    l2l = require("./LivelyServices");
require("../lively/lang/Array");

if (!global.lively.PropertyPath) {
    console.log("StateSynchonization depends on PropertyPath, which should have been loaded by Store.");
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// subscribers[0].paths

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
                    if (err) 
                        return // any type of error will result in not informing this connection this time
                        // should  the connection be removed?
                    if (path.equals(changedPath))
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
    subscribers = [];
})()

var retry = function(connection, msg) {
    store.read(storeName, msg.data.path, function(err, val) {
        // console.log("Unsuccessfully tried to store '" + msg.data.newValue + "' in stead of '" + msg.data.oldValue + "', while the current value is '" + val + "'")
        connection.send({
            action: msg.action + 'Result',
            inResponseTo: msg.messageId,
            data: { successful: false, value: val }
        })
    })
};

var searchForIn = function(searchStrings, object, initialPath) {
    var searchInString = (function searchInString(string) {
            return searchStrings.all(function(searchString) { 
                return searchString.test(string)});
        }),
        searchInObject = (function searchInObject(object) {
            if (typeof object === 'string') {
                return searchInString(object)
            } else if (typeof object === 'object') {
                return Object.getOwnPropertyNames(object).any(function(name) {
                    if (searchInString(name)) {
                        return true
                    } else {
                        return searchInObject(object[name])
                    }
                })
            } else {
                return false
            }
        })
    var result = [];
    // search through the contents of the db and remember all paths which had searchString in them or 
    (function search(object, path) {
        if(object.hasOwnProperty("length")) {
            for(var i = 0; i < object.length; i++){
                if (searchInObject(object[i]))
                    result.push({path: path.concat(i + ""), 
                                shortString: object[i].shortString,
                                changeTime: object[i].changeTime,
                                author: object[i].author,
                            })
            }
        } else {
            Object.getOwnPropertyNames(object).forEach(function(name) {
                try {
                    search(object[name], path.concat(name))
                }
                catch (e){ /* stop recursion */ }
            })
        }
    })(object, global.lively.PropertyPath(initialPath || ""));
    return result
};

(function testSearchForIn() {
    var assert = require('assert'),
        pp = global.lively.PropertyPath,
        result = searchForIn([new RegExp("ab", "im")], {
            stickyNote: { length: 6,
                "0": {content: "a"}, 
                "1": {content: "ab"}, 
                "2": {content: "b"}, 
                "3": {content: "lalelu ab"}, 
                "4": {content: "ab lalelu"}, 
                "5": {content: "laleablu"}},
            artificialTestForm: { ".form": "ab", 
                "0": {ab: "cd"}, length: 1}});
    assert.ok(result.length == 5, "Not enough results found");
    assert.ok(result[0].path.equals(pp("stickyNote.1")), "Element missing from results 1.");
    assert.ok(result[1].path.equals(pp("stickyNote.3")), "Element missing from results 2.");
    assert.ok(result[2].path.equals(pp("stickyNote.4")), "Element missing from results 3.");
    assert.ok(result[3].path.equals(pp("stickyNote.5")), "Element missing from results 4.");
    assert.ok(result[4].path.equals(pp("artificialTestForm.0")), "Element missing from results 5.");
})()

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var stateSynchronizationServices = {
    syncSet: function(sessionServer, connection, msg) {
        // provide old and new value,
        // if old == current, then current = new
        // else notify failure and proivde current

        // why is this line here? undefined newValues should be just like remove, shouldn't they?
        // no they should not. If you set and definitely want to merge, you don't supply an argument for the value.
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
        store.read(storeName, msg.data, function(error, val) {
            connection.send({
                action: msg.action + 'Result',
                inResponseTo: msg.messageId,
                data: val,
                error: error
            })
        });
    },
    syncRemove: function(sessionServer, connection, msg) {
        var path = global.lively.PropertyPath(msg.data);
        store.write(storeName, msg.data, undefined, false, msg.sender, function(err) {
            if (err) {
                console.warn("StateSynchronization: syncRemove failed because of " + err);
                return retry(connection, msg)
            }
            connection.send({
                action: msg.action + 'Result',
                inResponseTo: msg.messageId,
                data: { successful: true }
            });
        })
        informSubscribers(msg.data, undefined)
    },
    syncSearch: function(sessionServer, connection, msg) {
        if (typeof msg.data !== "string") connection.send({
                action: msg.action + "Result",
                inResponseTo: msg.messageId,
                error: "Can search but for strings... (" + (typeof msg.data) + ")"
            })
        // console.log("Searching for '" + msg.data + "'");
        store.read(storeName, '', function(error, val) {
            connection.send({
                action: msg.action + "Result",
                inResponseTo: msg.messageId,
                data: searchForIn(msg.data.split(/\s/).collect(function(ea) { return new RegExp(ea, "im")}), val),
                error: error
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
