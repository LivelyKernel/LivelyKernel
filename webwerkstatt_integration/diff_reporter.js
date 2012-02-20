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
    var lkUpdateMethod = 'update' + this.lk.repoType.toUpperCase(),
        wwUpdateMethod = 'update' + this.ww.repoType.toUpperCase(),
        lkIsUpdated = false, wwIsUpdated = false,
        tryCallback = function() { lkIsUpdated && wwIsUpdated && callback() },
        lkDone = function() { console.log('lk updated...'); lkIsUpdated = true; tryCallback() },
        wwDone = function() { console.log('ww updated...'); wwIsUpdated = true; tryCallback() };
    this.repoUpdater[lkUpdateMethod](this.lk.root, lkDone);
    this.repoUpdater[wwUpdateMethod](this.ww.root, wwDone);
}


exports.RepoDiffReporter = RepoDiffReporter;