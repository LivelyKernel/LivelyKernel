/*global require, exports, process, console, JSON*/

var spawn = require('child_process').spawn,
    fs = require('ls');

var RepoDiffReporter = function RepoDiffReporter(spec) {
    for (var name in spec) {
        this[name] = spec[name];
    }
};

RepoDiffReporter.prototype.filesDiffing = function(rawQuickDiff) {
    var lines = rawQuickDiff.split('\n');
    return lines
           .filter(function(ea) { return ea.match(/ differ$/) })
           .map(function(ea) {
               return ea.
                   replace(this.lk.root, "").
                   replace(this.ww.root, "").
                   replace(/^Files /, "").
                   replace(/ differ$/, "").
                   replace(/ and .*/, "");
           }, this);
}

RepoDiffReporter.prototype.filesOnlyIn = function(repoName, rawQuickDiff) {
    var repoDir = this[repoName].root,
        lines = rawQuickDiff.split('\n');
    return lines
           .filter(function(ea) {
               return ea.indexOf(repoDir) >= 0 && ea.indexOf("Only in") >= 0;
           })
           .map(function(ea) {
               return ea.
                   replace(repoDir, "").
                   replace("Only in ", "").
                   replace(/\/?: /, "/");
           });
}

RepoDiffReporter.prototype.produceReportThenDo = function(callback) {
    //stitching steps together
    var self = this, si = this.systemInterface;

    function produceReport(rawQuickDiff) {
        var report = {
            onlyin: {
                ww: self.filesOnlyIn('ww', rawQuickDiff),
                lk: self.filesOnlyIn('lk', rawQuickDiff)
            },
            diffingFiles: self.filesDiffing(rawQuickDiff)
        }
        callback(report);
    }

    function runDiff() {
        si.quickDiff(self.lk.root, self.ww.root, function(rawQuickDiff) {
            produceReport(rawQuickDiff);
        });
    }

    function runUpdate(whenDone) {
        var lkIsUpdated = false, wwIsUpdated = false,
            tryDone = function() { lkIsUpdated && wwIsUpdated && whenDone() },
            lkDone = function() { console.log('lk updated...'); lkIsUpdated = true; tryDone() },
            wwDone = function() { console.log('ww updated...'); wwIsUpdated = true; tryDone() };
        si[self.lk.updateMethod](self.lk.root, lkDone);
        si[self.ww.updateMethod](self.ww.root, wwDone);
    }

    runUpdate(runDiff);
}


var SystemInterface = {
    runCommandAndDo: function(cmd, args, whenDone, env) {
        var spawned = spawn(cmd, args), out = "", err = "";
        spawned.stdout.on('data', function (data) {
            console.log(cmd + ' stdout: ' + data);
            out += data;
        });
        spawned.stderr.on('data', function (data) {
            console.log(cmd + ' stderr: ' + data);
            err += data;
        });
        spawned.on('exit', function (code) {
            if (code == 0) {
                whenDone(out, err);
                return;
            }
            console.log('Error in ' + cmd + '\n' + err);
            process.exit(1);
        });
    },
    updateSVN: function(dir, whenDone) {
        this.runCommandAndDo('svn', ['update'], whenDone);
    },
    updateGIT: function(dir, whenDone) {
        this.runCommandAndDo('git', ['pull'], whenDone);
    },
    quickDiff: function(lk_dir, ww_dir, whenDone) {
        process.env.LK_DIR = lk_dir;
        process.env.WW_DIR = ww_dir;
        this.runCommandAndDo('web inte/quickDiff.sh', whenDone);
    },
    diff: function() {},
    writeFile: function(path, content) {
        fs.writeFileSync(path, content);
    }
}

function doDiff() {
    var settings = {
        systemInterface: SystemInterface,
        lk: {root: rootLK, updateMethod: "updateGIT"},
        ww: {root: rootWW, updateMethod: "updateSVN"}
    };
    var reporter = new RepoDiffReporter(settings);
    reporter.produceReportThenDo(function(result) {
        SystemInterface.writeFile("...", JSON.stringify(result));
    });
}

exports.RepoDiffReporter = RepoDiffReporter;