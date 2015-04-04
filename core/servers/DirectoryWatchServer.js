// Watches a directory recursively for file changes.
// Provides two http methods:
//   GET files?dir=PATHNAME
//     -- {files: {PATHSTRING: FILESTAT}, startTime: NUMBER}
//   GET files?dir=PATHNAME&since=TIME&startWatchTime=TIME
//     -- {changes: {time,path,type,stat}} with type = 'removal', 'creation', 'change'

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// global.DirectoryWatchServerState.
// s=global.DirectoryWatchServerState["/Users/robert/Lively/fix-file-watcher/LivelyKernel"].getWatchedFiles(function(err, files) {
//     console.log(files.length);
// })
// s.changeList.length
// s.changeList[0].time


var fWatcher = require("watch-interface");
var path = require("path");
var util = require("util");
var url = require('url');
var domain = require('domain');
var dirWatcherDomain = domain.create();

function i(obj) { return util.inspect(obj, {depth: 1}); }

dirWatcherDomain.on('error', function(er) {
  console.error('DirectoryWatchServer error %s\n%s©', er, er.stack);
});


var watchState = global.DirectoryWatchServerState = fWatcher.watchStates;

function isSafeDir(dir) {
  // return path.resolve(dir).indexOf(process.env.WORKSPACE_LK) === 0;
  return path.resolve(dir).split('/').length > 2;
}

function startWatching(dir, thenDo) {
   var ignoredItems = [/(.*\/|^).git(\/.*|$)/,/(^|.*\/)node_modules(\/.*|$)/,/R-libraries(\/.*|$)/];
   fWatcher.on(dir, {excludes: ignoredItems}, thenDo);
}

function ensureWatchState(dir, thenDo) {
  if (!isSafeDir(dir)) {
      thenDo({error: dir + ' is not supported to be watched'}, []);
      return; }
  if (watchState[dir]) thenDo(null, watchState[dir]);
  else startWatching(dir, thenDo);
}

function getChangesSince(dir, timestampSince, timestampStart, thenDo) {
  timestampSince = timestampSince || 0;
  ensureWatchState(dir, function(err, watchState) {
    watchState.getChangesSince(timestampSince, thenDo); })
}

function getWatchedFiles(dir, thenDo) {
  ensureWatchState(dir, function(err, watchState) {
    watchState.getWatchedFiles(thenDo); });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = dirWatcherDomain.bind(function(route, app) {

    app.get(route + 'files', function(req, res) {
        var query = url.parse(req.url, true).query, dir = query.dir;
        if (!dir) { res.status(400).json({error: 'No dir specified', files: []}).end(); return; }
        dirWatcherDomain.run(function() {
            getWatchedFiles(dir, function(err, files, watchState) {
                console.log(files);
                if (err) res.status(500).json({error: String(err.error || err.message), files: files}).end();
                else res.json({files: files, startTime: watchState.startTime, lastChange: watchState.lastChange}).end();
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
                if (err) res.status(500).json({error: String(err.error || err.message)}).end();
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

module.exports.DirectoryWatchServerState = watchState;
module.exports.getChangesSince = getChangesSince;
module.exports.getWatchedFiles = getWatchedFiles;
