#!/usr/bin/env node
/*global require, console, process*/

// Requires
var optparse = require('optparse'),
    RepoDiffReporter = require('./diffReporter').RepoDiffReporter;


// shell options
var switches = [
      ['-h', '--help', "Shows this help section."],
      ['--lk DIR', "Root directory of the Lively Kernel git repository"],
      ['--ww DIR', "Root directory of the Webwerksatt svn repository"],
      ['--output FILE', "JSON file to write the diff report into"]],
    parser = new optparse.OptionParser(switches),
    lkDir, wwDir, outFile;

parser.on("help", function() {
    console.log(parser.toString());
    process.exit(0);
});
parser.on("lk", function(name, value) { lkDir = value });
parser.on("ww", function(name, value) { wwDir = value });
parser.on("output", function(name, value) { outFile = value });
parser.parse(process.argv);


// now do stuff
var settings = {
    lk: {root: lkDir, updateMethod: "updateGIT"},
    ww: {root: wwDir, updateMethod: "updateSVN"},
    reportFile: outFile
};

RepoDiffReporter.createReport(settings);
