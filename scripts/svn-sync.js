/*global require, process, console*/

var optparse = require('optparse'),
    exec = require('child_process').exec,
    Seq = require('seq');

var switches = [
    ['-h', '--help', "This tool requires a local path to a svn repository and a version number."
               + "From that it will rsync"],
    ['--svn-repo DIR', "Path to svn repository"],
    ['--svn-wc DIR', "Path to SVN workingcopy that is svn updated and used as a source for the sync"],
    ['--git-repo DIR', "local path to the git repository with the branch that mirrors the svn reository"],
    ['--rev NUM', "svn revision that should be synced"]],
    parser = new optparse.OptionParser(switches),
    svnRepo, svnWc, rev, targetDir, gitRepoDir;

function showHelpAndExit() { console.log(parser.toString()); process.exit(1); }
parser.on("help", showHelpAndExit);
parser.on("svn-repo", function(name, value) { svnRepo = value });
parser.on("svn-wc", function(name, value) { svnWc = value });
parser.on("rev", function(name, value) { rev = value });
parser.on("git-repo-dir", function(name, value) { gitRepoDir = value });

parser.parse(process.argv);

// if (!targetDir || !rev || !svnRepo || !svnWc || !gitRepoDir) showHelpAndExit();

// --repository /etc/environments/svn_repositories/webwerkstatt --rev 140250

function checkIfCoreCommit(thenDo) {
    var next = this;
    function isCoreCommit(committedFiles) {
        var lines = committedFiles.split('\n'),
            pattern = 'core/',
            isCoreCommit = lines.some(function (line) { return line.indexOf(pattern) >= 0 });
        console.log('rev ' + rev + ' is core commit: ' + isCoreCommit);
        if (isCoreCommit) next();
    }
    Seq().
        seq(exec, ['svnlook', 'changed', svnRepo , '-r', rev].join(' '), Seq).
        seq(isCoreCommit);
}

function updateWebwerkstattWorkingCopy() {
    Seq().
        seq(function() {
            console.log('svn updating: ' + ['svn up', svnWc, '-r', rev].join(' '));
            exec(['svn up', svnWc, '-r', rev].join(' '), this);
        }).
        seq(function(out) {
            console.log('updated: ' + out);
        });
}

function rsyncWithGit() {
    // Seq().
    //     seq(function() {
    //         console.log('svn updating: ' + ['svn up', svnWc, '-r', rev].join(' '));
    //         exec(['svn up', svnWc, '-r', rev].join(' '), this);
    //     }).
    //     seq(function(out) {
    //         console.log('updated: ' + out);
    //     });
}

Seq().
    seq(checkIfCoreCommit).
    seq(updateWebwerkstattWorkingCopy);