/*global require, process, console, setTimeout*/

var optparse = require('optparse'),
    exec = require('child_process').exec,
    fs = require('fs'),
    Seq = require('seq');

var switches = [
    ['-h', '--help', "This tool requires a local path to a svn repository and a version number."
               + "From that it will rsync"],
    ['--svn-repo DIR', "Path to svn repository"],
    ['--svn-wc DIR', "Path to SVN workingcopy that is svn updated and used as a source for the sync"],
    ['--git-repo DIR', "local path to the git repository with the branch that mirrors the svn reository"],
    ['--rev NUM', "svn revision that should be synced"],
    ['--lockfile FILE', "path to lock file used for synchronisation"]],
    parser = new optparse.OptionParser(switches),
    svnRepo, svnWc, rev, targetDir, gitRepoDir, lockFile;

function showHelpAndExit() { console.log(parser.toString()); process.exit(1); }
parser.on("help", showHelpAndExit);
parser.on("svn-repo", function(name, value) { svnRepo = value });
parser.on("svn-wc", function(name, value) { svnWc = value });
parser.on("rev", function(name, value) { rev = value });
parser.on("git-repo", function(name, value) { gitRepoDir = value });
parser.on("lockfile", function(name, value) { lockFile = value });

parser.parse(process.argv);

if (!rev || !svnRepo || !svnWc || !gitRepoDir || !lockFile) showHelpAndExit();

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
    var next = this;
    Seq().
        seq(function() {
            console.log('svn updating: ' + ['svn up', svnWc, '-r', rev].join(' '));
            exec(['svn up', svnWc, '-r', rev].join(' '), this);
        }).
        seq(function(out) { console.log('updated: ' + out); next(); });
}

function rsyncWithGit() {
    var next = this;
    Seq().
        seq(exec, ['rsync -ra --delete --exclude=".svn" --exclude="localconfig.js"',
                   svnWc, gitRepoDir + '/core/'].join(' '), Seq).
        seq(function() { console.log('sync done'); next(); });
}

function gitPush() {
    var gitMirrorBranchName = 'ww-mirror',
        next = this;
    Seq().
        seq(exec, ['git commit -am \'[mirror commit] {"rev": "' + rev + '"}\''].join(' '),
            {cwd: gitRepoDir}, Seq).
        seq(exec, ['git push origin', gitMirrorBranchName].join(' '),
            {cwd: gitRepoDir, env: process.env}, Seq).
        // seq(exec, 'ssh-agent ssh-add /home/robert/.ssh/webwerkstatt_mirror_rsa; git push origin ' + gitMirrorBranchName, {cwd: gitRepoDir}, Seq).
        seq(function() { console.log('push done'); next(); });
}

function sshSetup() {
    var next = this;
    Seq().
        seq(exec, 'eval `ssh-agent`; ssh-add /home/robert/.ssh/webwerkstatt_mirror_rsa', Seq).
        seq(function() { console.log('ssh setup done'); next(); });
}

var timeout = Date.now() + 5000;
function lock() {
    if (Date.now() > timeout) {
        console.error('lock file was not unlocked, abort mirror');
        process.exit(1);
    }
    var next = this;
    try {
        fs.statSync(lockFile);
        console.log('is locked, waiting');
        setTimeout(function() { lock.call(next) }, 200);
    } catch (e) {
        // if error, means that file not there, we are ready to go
        fs.writeFileSync(lockFile, 'locked by mirror script, rev ' + rev);
        console.log('lock aquired');
        next();
    }
}

function unlock() {
    var next = this;
    Seq().
        seq(fs.unlink, lockFile, Seq).
        seq(function() { console.log('unlocked'); next(); });
}

Seq().
    seq(lock).
    seq(checkIfCoreCommit).
    seq(updateWebwerkstattWorkingCopy).
    seq(rsyncWithGit).
    seq(sshSetup).
    seq(gitPush).
    seq(unlock);