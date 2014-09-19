var path  = require('path');
var async = require('async');
var exec  = require("child_process").exec;
var fs    = require("fs");
var url   = require("url");

var log = function log(/*args*/) {
    console.log.apply(console, arguments);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function withDBDo(doFunc) {
    // FIXME
    var db = lively.repository.fs.storage.db;
    doFunc(db ? null : new Error('Cannot access database'), db);
}

function withRecordsDo(queryString, thenDo) {
    var getRecordsQuery;
    try {
        getRecordsQuery = JSON.parse(decodeURIComponent(queryString));
    } catch (e) {
        thenDo(new Error("Error parsing records query:\n" + e), null);
        return;
    }
    if (getRecordsQuery.paths) getRecordsQuery.paths = getRecordsQuery.paths.map(decodeURI);
    lively.repository.getRecords(getRecordsQuery, thenDo);
}

module.exports = function(route, app) {

    app.get(route, function(req, res) {
        var query = url.parse(req.url, true).query;
        if (query.getRecords) {
            withRecordsDo(query.getRecords, function(err, rows) {
                if (err) res.status(400).json({error: String(err)});
                else res.json(rows);
            });
        } else {
            res.status(400).json({error: 'no getRecords query found'});
        }
    });

    app.get(route + 'diff', function(req, res) {
        // a prototypical diff implementation. Needs cleanup and extraction
        var err, query = req.query;
        if (!query.getRecordsA) {
            res.status(400).json({error: 'Need query.getRecordsA!'});
        } else if (!query.getRecordsB) {
            res.status(400).json({error: 'Need query.getRecordsB!'});
        } else {

            var isJSON = query.isJSON === 'true';
            var isLivelyWorld = query.isLivelyWorld === 'true';

            async.parallel([
                function(next) { withRecordsDo(query.getRecordsA, next); },
                function(next) { withRecordsDo(query.getRecordsB, next); }
            ], function(err, results) {
                err && console.error(err);
                if (err) res.status(400).json({error: String(err)})
                var a = results[0][0], b = results[1][0];
                if (!a || !a.content || !b || !b.content) {
                    res.status(400).json({error: "query result not diffable!"});
                    return;
                }

                var contentA = a.content;
                var contentB = b.content;

                if (isLivelyWorld) {
                    var roughly = contentA.slice(contentA.indexOf('<script type="text/x-lively-world"')+6, contentA.lastIndexOf("</script>"));
                    contentA = roughly.slice(roughly.indexOf('{'));
                    var roughly = contentB.slice(contentB.indexOf('<script type="text/x-lively-world"')+6, contentB.lastIndexOf("</script>"));
                    contentB = roughly.slice(roughly.indexOf('{'));
                }

                if (isJSON) {
                    try { contentA = JSON.stringify(JSON.parse(contentA), null, 2); } catch (e) { console.log('Cannot parse content a: ' + e + '\n' + contentA.slice(0,250)); }
                    try { contentB = JSON.stringify(JSON.parse(contentB), null, 2); } catch (e) { console.log('Cannot parse content b: ' + e + '\n' + contentB.slice(0,250)); }
                }

                var diffResult = 'nothing yet';
                async.series([
                    function(next) { exec('mkdir -p diff-tmp/', next); },
                    function(next) { fs.writeFile("diff-tmp/a", contentA, next); },
                    function(next) { fs.writeFile("diff-tmp/b", contentB, next); },
                    function(next) {
                        exec('git diff --no-index --histogram diff-tmp/a diff-tmp/b',
                        {maxBuffer: 10000*1024},
                        function(code, out, err) {
                            if (!out && code) { next(new Error("Diff error: " + code + ' ' + err)); }
                            else { diffResult = out +'\n' + err; next(); }
                        });
                    },
                    function(next) { exec('rm -rfd diff-tmp/', next); }
                ], function(err) {
                    if (err) {
                        console.error(err);
                        res.status(400).json({error: String(err)});
                    } else res.json({diff: diffResult});
                });
            })
        }
    });

}

module.exports.withDBDo = withDBDo;
