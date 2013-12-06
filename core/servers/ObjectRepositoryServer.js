var path = require('path');
var async = require('async');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var log = function log(/*args*/) {
    console.log.apply(console, arguments);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = function(route, app) {
    app.get(route, function(req, res) {
        var err, query = req.query, getRecords;
        if (!query.getRecords) { 
            err = "no getRecords data";
        } else {
            try {
                getRecords = JSON.parse(decodeURIComponent(query.getRecords));
            } catch (e) { err = e; }
        }
        if (err || !query || !query.getRecords) {
            res.status(400).end(JSON.stringify({error: err && err.stack || err || 'Need query.getRecords!'}));
            return;
        }
        lively.repository.getRecords(getRecords, function(err, rows) {
            if (err) res.status(400).end(String(err))
            else res.json(rows);
        });
    });
}
