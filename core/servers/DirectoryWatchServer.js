// Watches a directory recursively for file changes.
// Provides two http methods:
//   GET files?dir=PATHNAME
//     -- {files: {PATHSTRING: FILESTAT}, startTime: NUMBER}
//   GET files?dir=PATHNAME&since=TIME&startWatchTime=TIME
//     -- {changes: {time,path,type,stat}} with type = 'removal', 'creation', 'change'

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// s=global.DirectoryWatchServerState['/Users/robert/Dropbox/Projects/LivelyKernel']
// s.changeList.length
// s.changeList[0].time

var watch;
try {
    watch = require('watch');
} catch (e) {
    console.warn('DirectoryWatcher could not load watch module!');
}

var path = require("path");
var util = require("util");
var url = require('url');
var domain = require('domain');
var dirWatcherDomain = domain.create();

function i(obj) { return util.inspect(obj, {depth: 1}); }

dirWatcherDomain.on('error', function(er) {
    console.error('DirectoryWatchServer error %s\n%s©', er, er.stack);
});

var watchState = global.DirectoryWatchServerState || (global.DirectoryWatchServerState = {});

function ignore(ignoredItems, f) {
    for (var i = 0; i < ignoredItems.length; i++) {
        var ign = ignoredItems[i];
        if (typeof ign === 'string' && f.indexOf(ign) >= 0) return true;
        if (util.isRegExp(ign) && f.match(ign)) return true;
    }
    return false;
}

function addChange(changeRecord, type, fileName, stat) {
    changeRecord.lastChange = Date.now()
    changeRecord.changeList.unshift({
        time: changeRecord.lastChange,
        path: fileName,
        type: type,
        stat: stat
    });
}

function startWatching(dir, thenDo) {
    var ignoredItems = ['node_modules'],
        options = {ignoreDotFiles: true, filter: ignore.bind(null, ignoredItems)},
        changes = watchState[dir] = {
            monitor: null,
            lastChange: null,
            startTime: null,
            changeList: []
        };
    if (!watch) { thenDo({error: 'watch not available!'}, changes); return changes; }
    watch.createMonitor(dir, options, function (monitor) {
        changes.startTime = changes.lastChange = Date.now();
        changes.monitor = monitor;
        monitor.on("created", function (f, stat) { addChange(changes, 'creation', f, stat); });
        monitor.on("changed", function (f, curr, prev) { addChange(changes, 'change', f, curr); })
        monitor.on("removed", function (f, stat) { addChange(changes, 'removal', f); })
        thenDo(null, changes);
    });
    return changes;
}

function ensureWatchState(dir, thenDo) {
    if (watchState[dir]) thenDo(null, watchState[dir])
    else startWatching(dir, thenDo);
}

function getChangesSince(dir, timestampSince, timestampStart, thenDo) {
    timestampSince = timestampSince || 0;
    ensureWatchState(dir, function(err, watchState) {
        if (!err && timestampStart && timestampStart !== watchState.startTime) {
            err = {error: 'Start time does not match! ' + timestampStart + ' vs ' +  watchState.startTime};
        }
        if (err) { thenDo(err, []); return; }
        var changes = watchState.changeList, result = [];
        for (var i = 0; i < changes.length; i++) {
            if (changes[i].time > timestampSince) { result.push(changes[i]); continue; }
            break;
        }
        thenDo(err, result, watchState.startTime);
    });
}

function getWatchedFiles(dir, thenDo) {
    if (!watch) { thenDo({error: 'watch not available'}, {}, null); return; }
    ensureWatchState(dir, function(err, watchState) {
        thenDo(
            err,
            watchState && watchState.monitor && watchState.monitor.files,
            watchState && watchState.startTime);
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = dirWatcherDomain.bind(function(route, app) {

    app.get(route + 'files', function(req, res) {
        var query = url.parse(req.url, true).query, dir = query.dir;
        if (!dir) { res.status(400).json({error: 'No dir specified', files: []}).end(); return; }
        dirWatcherDomain.run(function() {
            getWatchedFiles(dir, function(err, files, startTime) {
                if (err) res.status(500).json({error: String(err), files: files}).end();
                else res.json({files: files, startTime: startTime}).end();
            });
        });
    });

    app.get(route + 'changes', function(req, res) {
        var query = url.parse(req.url, true).query,
            dir = query.dir,
            since = Number(query.since),
            startWatchTime = Number(query.startWatchTime);
        if (!dir) { res.status(400).end(); return; }
        dirWatcherDomain.run(function() {
            getChangesSince(dir, since, startWatchTime, function(err, changes) {
                if (err) res.status(500).json({error: i(err)}).end();
                else res.json({changes: changes}).end();
            });
        });
    });

    app.post(route + 'reset', function(req, res) {
        dirWatcherDomain.run(function() {
            Object.keys(global.DirectoryWatchServerState).forEach(function(name) {
                delete global.DirectoryWatchServerState[name]; });
            res.json({message: 'OK'}).end();
        });
    });

});
