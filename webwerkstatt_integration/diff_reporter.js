/*globals exports*/

function RepoDiffReporter(spec) {
    for (var name in spec) {
        this[name] = spec[name];
    }
};

RepoDiffReporter.prototype.parseDiffOutput = function(string) {
    this.diffOutput = string;
    this.lines = string.split("\n");
}

RepoDiffReporter.prototype.filesDiffing = function() {
    return this.lines
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

RepoDiffReporter.prototype.filesOnlyIn = function(repoName) {
    var repoDir = this[repoName].root;
    return this.lines
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

RepoDiffReporter.prototype.produceResultThenDo = function(callback) {
    var self = this, si = this.systemInterface;
    function runDiff() {
        si.quickDiff(self.lk.root, self.ww.root, callback);
    }
    function runUpdate(whenDone) {
        var lkUpdateMethod = 'update' + self.lk.repoType.toUpperCase(),
            wwUpdateMethod = 'update' + self.ww.repoType.toUpperCase(),
            lkIsUpdated = false, wwIsUpdated = false,
            tryDone = function() { lkIsUpdated && wwIsUpdated && whenDone() },
            lkDone = function() { console.log('lk updated...'); lkIsUpdated = true; tryDone() },
            wwDone = function() { console.log('ww updated...'); wwIsUpdated = true; tryDone() };
        si[lkUpdateMethod](self.lk.root, lkDone);
        si[wwUpdateMethod](self.ww.root, wwDone);
    }
    runUpdate(runDiff);
}


exports.RepoDiffReporter = RepoDiffReporter;