/*globals exports*/

function RepoDiffReporter(spec) {
  this.rootLK = spec.rootLK;
  this.rootWW = spec.rootWW;
};

RepoDiffReporter.prototype.parseDiffOutput = function(string) {
  this.diffOutput = string;
  this.lines = string.split("\n");
}

RepoDiffReporter.prototype.filesDiffing = function() {
  // var diffLines = [];
  // this.lines.forEach(function(ea) { })

  return ["core/cop/CopBenchmark.js",
                    "core/lively/Base.js",
                    "core/lively/ide/SystemCodeBrowser.js",
                    "core/lively/localconfig.js"];
}


exports.RepoDiffReporter = RepoDiffReporter;