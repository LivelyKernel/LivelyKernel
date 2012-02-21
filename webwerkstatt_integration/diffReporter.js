/*global require, exports, process, console, JSON*/

var exec = require('child_process').exec,
    fs = require('fs');

function RepoDiffReporter(spec) {
    for (var name in spec) {
        if (spec.hasOwnProperty(name)) {
            this[name] = spec[name];
        }
    }
    if (!this.systemInterface) {
        this.systemInterface = SystemInterface;
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
        console.log('-> Got diff, parsing...')
        var report = {
            onlyin: {
                ww: self.filesOnlyIn('ww', rawQuickDiff),
                lk: self.filesOnlyIn('lk', rawQuickDiff)
            },
            diffingFiles: self.filesDiffing(rawQuickDiff),
            fileDiffs: {}
        }

        doFileDiffs(report.diffingFiles, function(diffs) {
            report.fileDiffs = diffs;
            callback(report);
        })

    }

    function doFileDiffs(filesToDiff, whenDone) {
        var diffs = {};
        // helper
        var filesToDiffHelper = [].concat(filesToDiff); // clone
        function diffDoneFor(file) { // why is ther eno without or sth???!!!
            var idx = filesToDiffHelper.indexOf(file);
            if (idx >= 0) filesToDiffHelper.splice(idx, 1);
        }
        function allDiffsDone() { return filesToDiffHelper.length === 0 }

        if (filesToDiff.length == 0) {
            whenDone(diffs);
        } else {
            filesToDiff.forEach(function(filePath) {
                console.log('-> Diffing ' + filePath + '...');
                si.fileDiff(filePath, self.lk.root, self.ww.root, function(diff) {
                    diffs[filePath] = diff;
                    diffDoneFor(filePath);
                    if (allDiffsDone()) whenDone(diffs);
                });
            });
        }
    }

    function runDiff() {
        si.quickDiff(self.lk.root, self.ww.root, function(rawQuickDiff) {
            produceReport(rawQuickDiff);
        });
    }

    function runUpdate(whenDone) {
        var lkIsUpdated = false, wwIsUpdated = false,
            tryDone = function() { lkIsUpdated && wwIsUpdated && whenDone() },
            lkDone = function() { console.log('-> lk updated...'); lkIsUpdated = true; tryDone() },
            wwDone = function() { console.log('-> ww updated...'); wwIsUpdated = true; tryDone() };
        si[self.lk.updateMethod](self.lk.root, lkDone);
        si[self.ww.updateMethod](self.ww.root, wwDone);
    }

    runUpdate(runDiff);
}


var SystemInterface = {

    runCommandAndDo: function(cmd, options, whenDone, ignoreExitCode) {
        console.log('-> running ' + cmd + '...');
        exec(cmd, options, function(error, stdout, stderr) {
            if (!error || ignoreExitCode) {
                whenDone(stdout, stderr);
                return;
            }
            console.log('Error in ' + error + ' ' + cmd + '\n' + stderr + '\n-----\n' + stdout);
            process.exit(1);
        });
    },

    updateSVN: function(dir, whenDone) {
        this.runCommandAndDo('svn update', {cwd: dir, env: process.env}, whenDone);
    },

    updateGIT: function(dir, whenDone) {
        this.runCommandAndDo('git pull', {cwd: dir, env: process.env}, whenDone);
    },

    quickDiff: function(lkDir, wwDir, whenDone) {
        this.runCommandAndDo('diff ' + lkDir + '/core ' + wwDir
                            + '/core -x ".svn" -u -r -q | sort',
                             {cwd: null, env: process.env},
                             whenDone);
    },

    fileDiff: function(relativePath, lkDir, wwDir, whenDone) {
        this.runCommandAndDo('diff ' + lkDir + relativePath + ' '
                            + wwDir + relativePath + ' -u',
                             {cwd: null, env: process.env},
                             whenDone,
                             true);
    },

    diff: function() {},

    writeFile: function(path, content) {
        console.log('-> writing ' + path);
        fs.writeFileSync(path, content);
    }

}

RepoDiffReporter.createReport = function(settings) {
    var reporter = new this(settings);
    reporter.produceReportThenDo(function(result) {
        SystemInterface.writeFile(settings.reportFile, JSON.stringify(result));
    });
}

exports.RepoDiffReporter = RepoDiffReporter;