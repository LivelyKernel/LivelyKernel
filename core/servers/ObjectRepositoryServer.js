var path = require('path');
var async = require('async');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var log = function log(/*args*/) {
    console.log.apply(console, arguments);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function withDBDo(doFunc) {
    // FIXME
    doFunc(null, lively.repository.fs.storage.db);
}

function handleGetRecords(query, res) {
    var getRecords;
    try {
        getRecords = JSON.parse(decodeURIComponent(query.getRecords));
    } catch (e) {
        res.status(400).end(JSON.stringify({error: e && e.stack || e}));
        return;
    }
    if (getRecords.paths)
        getRecords.paths = getRecords.paths.map(decodeURI);
    lively.repository.getRecords(getRecords, function(err, rows) {
        if (err) res.status(400).end(String(err));
        else res.json(rows);
    });
}

function handleGetASTRegistryIndex(query, res) {
    var idx = Number(query.getASTRegistryIndex);
    if (isNaN(idx))
        res.status(400).end(JSON.stringify({error: 'Index to AST registry has to be a number!'}));
    else {
        lively.repository.getRecords({
            astIndex: idx,
            attributes: ['path', 'version', 'ast', 'registry_id', 'registry_additions', 'additions_count'],
            limit: 1,
            rewritten: true
        }, function(err, rows) {
            if (err) {
                res.status(400).end(String(err));
                return;
            }
            res.json(rows[0]);
        });
    }
}

module.exports = function(route, app) {
    app.get(route, function(req, res) {
        var query = req.query;
        if (query.getRecords) {
            handleGetRecords(query, res);
        } else if (query.getASTRegistryIndex) {
            handleGetASTRegistryIndex(query, res);
        } else {
            res.status(400).end(JSON.stringify({error: 'no getRecords/getASTRegistryIndex query found'}));
        }
    });
}

module.exports.withDBDo = withDBDo;
