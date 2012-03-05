/*global require, process, console*/

/*
 * Script for copying changes between webwerkstatt and git lk
 *
 */
var args  = require('./helper/args'),
    fs    = require('fs'),
    shell = require('./helper/shell'),
    async = require('async'),
    exec  = require('child_process').exec,
    path  = require('path'),
    env   = process.env;


// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-
var options = args.options([
    ['-h', '--help', 'Show this help'],
    ['--from-ww-to-lk', 'Update a lk repo with ww changes'],
    ['--from-lk-to-ww', 'Update ww working copy with lk changes'],
    ['--ww-dir DIR', 'Path to Webwerkstatt repository'],
    ['--lk-dir DIR', 'Path to Lively Kernel repository']],
    {},
    "This utility rsyncs changes from local Webwerkstatt repositories to local Lively Kernel core repositories and vice versa.\nIt is internally used by `lk ww-mirror` and `lk core-link`, however, it is also useful in itself when porting changes between git and svn.\n\nIt applies modifications only locally and will not commit any changes.\n\n"
    + "In case you want to reset the local changes following commands are handy:\n"
    + "git: `git clean -f -d && git reset --hard`\n"
    + "svn: `svn revert core/ -R`");

if (!options.lkDir || !options.wwDir) {
    options.showHelpAndExit();
}

// fixed for now
options.filter = path.join(env.LK_SCRIPTS_ROOT, '/webwerkstatt_mirror.filter');
options.lkCore = path.join(options.lkDir, "core/");
options.wwCore = path.join(options.wwDir, "core/");

// -=-=-=-=-=-=-=-=-=-=-
// the real thing
// -=-=-=-=-=-=-=-=-=-=-
if (options.defined('fromLkToWw')) { // lk -> ww
    async.series([
        function(next) {
            exec(['rsync -ra --delete --filter=". ', options.filter, '" ',
                  options.lkCore, ' ', options.wwCore].join(''), next);
        },
        function(next) {
            exec('svn rm $( svn status | sed -e "/^!/!d" -e "s/^!//" )', // `svn rm` missing
                 {cwd: options.wwCore}, next);
        },
        function(next) {
            exec('svn add . --force', {cwd: options.wwCore}, next);
        },
        function(next) {
            exec('svn status', {cwd: options.wwCore}, function(code, out, err) {
                console.log("lk -> ww sync done, status:\n" + out);
                next(code);
            });
        }
    ]);
} else if (options.defined('fromWwToLk')) { // ww -> lk
    async.waterfall([
        function(next) {
            exec(['rsync -v -ra --delete --filter=". ', options.filter, '" ',
                  options.wwCore, ' ', options.lkCore].join(''), next);
        },
        function(out, err, next) {
            exec('git add .', {cwd: options.lkDir}, next);
        },
        function(out, err, next) {
            exec('git status --porcelain', {cwd: options.lkDir}, next);
        },
        function(out, err, next) {
            // git adds everything except deleted files, so look for those and add them manually
            var lines = out.split('\n'),
                delRegEx = /^ D (.*)$/,
                deleted = lines
                          .filter(function(ea) { return ea.match(delRegEx); })
                          .map(function(ea) { return ea.match(delRegEx)[1]; });
            async.forEachSeries(deleted, function(file, next) {
                exec('git rm --cached ' + file, {cwd: options.lkDir}, next);
            }, next);
        },
        function(next) {
            exec('git status', {cwd: options.lkDir}, function(code, out, err) {
                console.log("ww -> lk sync done, status:\n" + out);
                next(code);
            });
        }
    ]);
} else {
    options.showHelpAndExit();
}