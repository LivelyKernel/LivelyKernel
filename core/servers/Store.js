var f = require('util').format;
var i = require('util').inspect;
var vm = require('vm');
var fs = require('fs');
var inMemoryStores = {};
var changes = {};

loadLivelyCode = function loadLivelyCode(path) {
    lively = global.lively || {};
    Global = global;
    try {
        fileContent = fs.readFileSync(require.resolve('../' + path));
        vm.runInThisContext(fileContent, {Global: global});
    } catch(e) {
        console.error(e);
        return false;
    }
    return true;
}

loadLivelyCode('lively/lang/Object');

function getStore(storeName) {
    return inMemoryStores[storeName];
}

// TODO:
// - when a change occurs multiple times and a change later has the same id
//   remove the prevously added changes (client has current value)
// - the change to be send should be the one that occured last
function retrieveChanges(since, requestingClientId, callback) {
    var pathsRead = [];
    var result = {startTime: Number(since) || 0, endTime: Date.now(), changes: []};
    Object.keys(changes).forEach(function(time) {
        time = Number(time);
        var change = changes[time];
        console.log('testing for %s for client %s', i(change), requestingClientId);
        if (time < result.startTime || time > result.endTime) return;
        console.log('time ok');
        if (pathsRead.indexOf(change.path) >= 0) return;
        console.log('not yet added');
        if (requestingClientId && change.hasOwnProperty("originClientId")
         && requestingClientId == change.originClientId) return;
        console.log('change from a different client');
        console.log('adding %s', i(change));
        result.changes.push(change);
        pathsRead.push(change.path);
    });
    console.log("changes: %s, result: %s", i(changes), i(result));
    callback(null, result);
}
function checkPrecondition(path, precondition) {
    var db = inMemoryStores,  err = {type: 'precondition'};
    if (!precondition || !path.isIn(db)) return null;
    var currentVal = path.get(db);
    if (precondition.type === 'equality') {
        return precondition.value == currentVal ? null : Object.extend(err, {message: 'equality mismatch'});
    } else if (precondition.type === 'id') {
        if (!currentVal || !currentVal.hasOwnProperty('id')) return null;
        var valId = String(currentVal.id),
            expectedId = String(precondition.id);
        return valId === expectedId ? null : Object.extend(err, {
            message: 'id mismatch, expected: '
                    + expectedId + ' actual: ' + valId
        });
    }
    return null;
}

function write(storeName, pathString, value, precondition, clientId, thenDo) {
    var storePath = lively.PropertyPath(storeName);
    if (!storePath.isIn(inMemoryStores)) storePath.set(inMemoryStores, {});
    var path = storePath.concat(pathString),
        err = checkPrecondition(path, precondition);
    if (!err) {
        changes[Date.now()] = {path: String(path), originClientId: clientId};
        path.set(inMemoryStores, value);
        console.log('stored %s in %s', i(value), path);
    } else {
        console.warn('could not store %s in %s, error: %s', value, path, i(err));
    }
    thenDo(err);
}

function read(storeName, pathString, thenDo) {
    var path = lively.PropertyPath(pathString),
        val = path.isRoot() ? inMemoryStores[storeName] : path.get(inMemoryStores[storeName]);
    console.log('read %s: %s', path, i(val));
    thenDo(null, val);
}

function pathFromRequest(req) {
    return (req.params[0] || '').replace(/\//g, function(match, i) {
        return i === 0 || i === req.params[0].length-1 ? '' : '.'
    });
}
module.exports = function(route, app) {

    app.get(route + ':store?*', function(req, res) {
        var changesSince = req.query['changes-since'],
            clientId = req.query['clientId'],
            path = pathFromRequest(req),
            store = req.params.store;
        if (changesSince) {
            retrieveChanges(changesSince, clientId, function(err, result) {
                res.end(JSON.stringify(result)); });
        } else if (!store) {
            res.end(JSON.stringify(inMemoryStores));
        } else {
            read(store, path, function(err, val) {
                res.end(JSON.stringify(val)); });
        }
    });

    app.put(route + ':store*', function(req, res) {
        var path = pathFromRequest(req),
            store = req.params.store,
            value = req.body && req.body.data,
            clientId = req.body && req.body.clientId,
            precondition = req.body && req.body.precondition;
        console.log('storeing from %s', clientId);
        write(store, path, value, precondition, clientId, function(err) {
            var status = 200;
            if (err) { status = err.type && err.type === 'precondition' ? 412 : 400; }
            res.status(status);
            res.end(JSON.stringify(err || 'OK'));
        });
    });
}
