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


function write(storeName, pathString, value, precondition, thenDo) {
    var storePath = lively.PropertyPath(storeName);
    if (!storePath.isIn(inMemoryStores)) storePath.set(inMemoryStores, {});
    var path = storePath.concat(pathString), err = null;
    if (precondition) {
        if (precondition.type === 'identity') {
            var currentVal = path.get(inMemoryStores);
            err = precondition.value !== currentVal
              && {type: "precondition", message: 'identity mismatch'};
            console.log('Precondition test: %s vs. %s', i(currentVal), i(precondition.value))
        }
    }
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
            if (err) { status = err.type && err.type === 'precondition' ? 419 : 400; } 
            res.status(status);
            res.end(JSON.stringify(err || 'OK'));
        });
    });
}
