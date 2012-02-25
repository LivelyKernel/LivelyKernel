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
                   replace(this.repo1.root, "").
                   replace(this.repo2.root, "").
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
                repo2: self.filesOnlyIn('repo2', rawQuickDiff),
                repo1: self.filesOnlyIn('repo1', rawQuickDiff)
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
                si.fileDiff(filePath, self.repo2.root, self.repo1.root, function(diff) {
                    diffs[filePath] = diff;
                    diffDoneFor(filePath);
                    if (allDiffsDone()) whenDone(diffs);
                });
            });
        }
    }

    function runDiff() {
        si.quickDiff(self.repo2.root, self.repo1.root, function(rawQuickDiff) {
            produceReport(rawQuickDiff);
        });
    }

    function runUpdate(whenDone) {
        var repo1IsUpdated = false, repo2IsUpdated = false,
            tryDone = function() { repo1IsUpdated && repo2IsUpdated && whenDone() },
            repo1Done = function() { console.log('-> repo1 updated...'); repo1IsUpdated = true; tryDone() },
            repo2Done = function() { console.log('-> repo2 updated...'); repo2IsUpdated = true; tryDone() };
        si[self.repo1.updateMethod](self.repo1.root, repo1Done);
        si[self.repo2.updateMethod](self.repo2.root, repo2Done);
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

    quickDiff: function(repo1Dir, repo2Dir, whenDone) {
        this.runCommandAndDo('diff ' + repo1Dir + '/core ' + repo2Dir
                            + '/core -x ".svn" -u -r -q | sort',
                             {cwd: null, env: process.env},
                             whenDone);
    },

    fileDiff: function(relativePath, repo1Dir, repo2Dir, whenDone) {
        this.runCommandAndDo('diff ' + repo1Dir + relativePath + ' '
                            + repo2Dir + relativePath + ' -u',
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