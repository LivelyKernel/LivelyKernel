var f = require('util').format;
var i = require('util').inspect;
var vm = require('vm');
var fs = require('fs');
var inMemoryStores = {};

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

function write(storeName, pathString, value, precondition, thenDo) {
    var storePath = lively.PropertyPath(storeName);
    if (!storePath.isIn(inMemoryStores)) storePath.set(inMemoryStores, {});
    var path = storePath.concat(pathString),
        err = checkPrecondition(path, precondition);
    if (!err) {
        path.set(inMemoryStores, value);
        console.log('stored %s in %s', value, path);
    } else {
        console.warn('could not store %s in %s, error: %s', value, path, i(err));
    }
    thenDo(err);
}

function read(storeName, pathString, thenDo) {
    var path = lively.PropertyPath(pathString);
    var val = path.isRoot() ? inMemoryStores[storeName] : path.get(inMemoryStores[storeName]);
    thenDo(null, val);
}

module.exports = function(route, app) {
    app.get(route, function(req, res) {
        res.end(JSON.stringify(inMemoryStores));
    });

    app.get(route + ':store/*', function(req, res) {
        var path = (req.params[0] || '').replace(/\//g, '.'),
            store = req.params.store;
        read(store, path, function(err, val) {
            res.end(JSON.stringify(val));
        });
    });

    app.put(route + ':store/*', function(req, res) {
        var path = (req.params[0] || '').replace(/\//g, '.'),
            store = req.params.store,
            value = req.body && req.body.data,
            precondition = req.body && req.body.precondition;
        console.log('setting %s.%s=%s', store, path, i(req.body));
        write(store, path, value, precondition, function(err) {
            var status = 200;
            if (err) { status = err.type && err.type === 'precondition' ? 412 : 400; }
            res.status(status);
            res.end(JSON.stringify(err || 'OK'));
        });
    });
}
