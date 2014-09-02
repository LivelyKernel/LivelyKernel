var util = require("util");
var path = require("path");
var async = require("async");
var sqlite3 = require('sqlite3').verbose();

var debug = true;

var dbs = module.exports.sqliteDBs || {};
function getDB(dbAccessCode, thenDo) {
    var db;
    try {
        db = dbs[dbAccessCode] || eval(dbAccessCode);
        if (!db || !db.all) throw new Error('Cannot access sqlite DB? ' + dbAccessCode);
        if (!dbs[dbAccessCode]) dbs[dbAccessCode] = db;
    } catch (e) { thenDo(e, null); return; }    
    thenDo(null, db);
}

function ensureDB(key, fileName, thenDo) {
    // fileName === ":memory:" for in-mem DB
    getDB(key, function(_, db) {
        if (db) {
            thenDo(null, 'db ' + key + ' exists');
        } else {
            fileName = fileName || ':memory:';
            var isInMem = fileName === ':memory:';
            if (!isInMem) {
                fileName = path.join(process.env.WORKSPACE_LK || process.cwd(), fileName);
                if (debug) console.log('Creating file-based SQLite DB %s', fileName);
            }

            var msg, error;
            try {
                dbs[key] = new sqlite3.Database(fileName);
                msg = 'db ' + key + ' (' + fileName + ') created';
            } catch (e) {
                error = String(e.stack || e);
                msg = "Error creating SQLite database " + fileName + ':\n' + error;
            }
            if (debug) console.log(msg);
            thenDo(error, msg);
        }
    });
}

function dbAction(dbName, db, methodName, sql, args, thenDo) {
    if (debug) console.log('SQlite server: db %s runs %s on\n%s',
                dbName, methodName, sql.slice(0,500) + (sql.length > 500 ? '...' : ''));
    db[methodName].apply(db, [sql].concat(args).concat([function(err, rows) {
        try {
            var json;
            if (err) json = {error: String(err.stack || err)};
            else if (methodName === 'run') json = {lastID: this.lastID, change: this.changes};
            else json = rows
            thenDo(err, json);
        } catch (e) {
            console.warn('SQL query from browser. Timed out?: %s', e);
        }
    }]));
}

module.exports = function(route, app) {

    app.post(route + 'ensureDB', function(req, res) {
        var key = req.body.dbAccessor,
            fileName = req.body.fileName;
        ensureDB(key, fileName, function(err, msg) {
            if (err) {
                res.status(500);
                msg = msg ? msg + '\n' + String(err) : String(err);
            }
            res.end(msg);
        });
    });

    app.post(route + 'removeDB', function(req, res) {
        var key = req.body.dbAccessor;
        getDB(key, function(err, db) {
            if (!db) {
                var msg = 'db ' + key + ' does not exist';
                if (debug) console.log(msg);
                res.end(msg);
                return;
            }
            db.close(function(err) {
                err && console.err('Error when closing db %s:\n%s', key, err);
            });
            if (dbs[key]) delete dbs[key];
            else try {
                eval('delete ' + key);
            } catch (e) {
                var msg = 'Error removing DB ' + key + ': ' + String(err);
                if (debug) console.error(msg);
                res.status(500).end(msg);
                return;
            }
            var msg = 'db ' + key + ' removed';
            if (debug) console.log(msg);
            res.end('db ' + key + ' remove');
        });
    });
    
    app.get(route + 'allDBs', function(req, res) {
        res.end(JSON.stringify(dbs))
    })

    app.post(route, function(req, res) {
        // req.body = {
        //     dbAccessor: STRING, -- code that should return a reference to the sqlite DB
        //     statements: [{
        //         action: 'all'|'run', -- query with 'all', mutate with 'run'
        //         sql: STRING -- SQL statement to run
        //     }]
        // }

        var statements = req.body.statements;
        if (!util.isArray(statements)) {
            res.status(400).json({error: 'statements is not an array! ' + JSON.stringify(req.body)});
            return;
        }
        getDB(req.body.dbAccessor, function(err, db) {
            if (err) {
                res.status(500).json({error: String(err.stack || err)});
                return;
            }

            var results = [];
            db.serialize(function() {
                statements.forEach(function(stmt) {
                    dbAction(req.body.dbAccessor, db, stmt.action, stmt.sql, stmt.args || [], function(err, json) {
                        results.push(err || json);
                        if (results.length === statements.length) res.json(results);
                    });
                });
            });

        });
    });

}

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
require('./SQLiteServer').sqliteDBs
*/

module.exports.ensureDB = ensureDB;
module.exports.sqliteDBs = dbs;
module.exports.getDB = getDB;
module.exports.dbAction = dbAction;

