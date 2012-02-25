/*global require, process, console, setTimeout*/


/*
 * This script will rsync the webwerkstatt core directory with the
 * ww-mirror branch of the Lively Kernel core repository. The commit message
 * includes the svn revision that was used for the sync.
 *
 * The steps that are done:
 * - lock using a file to not allow concurrent syncs (sync will wait a certain time)
 * - if no core commit, unlock and do nothing
 * - update webwerkstatt working copy
 * - rsync svn repo with git repo (takes care of deletions, renames)
 * - git reset, clean, pull -- the git repo should be OK, just to be sure
 * - git add, commit, push
 * - unlock
 *
 * This script runs as a post commit hook of the webwerkstatt svn repo.
 * It is invoke with:
 *
 * node /home/robert/webwerkstatt/git-core-mirror/lk/scripts/svn-sync.js \
 *      --svn-repo /etc/environments/svn_repositories/webwerkstatt \
 *      --svn-wc /home/robert/webwerkstatt/git-core-mirror/ww/ \
 *      --git-repo /home/robert/webwerkstatt/git-core-mirror/svn-mirror/ \
 *      --rev 140250 \
 *      --lockfile /home/robert/webwerkstatt/git-core-mirror/mirror.lock
 */

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

function run(cmd, cb, next, options) {
    exec(cmd, options, function() {
	      var invokeNext = cb.apply(this, arguments);
	      if (invokeNext) {
	          next();
	      } else {
	          next(1);
	          console.log('early exit');
	      };
    });
}

// -=-=-=-=-=-=-=-=-=-=-
// svn / rsync
// -=-=-=-=-=-=-=-=-=-=-
function checkIfCoreCommit(thenDo) {
    function testIfCoreCommit(err, committedFiles) {
        var lines = committedFiles.split('\n'),
            pattern = 'core/',
	          isCoreCommit = lines.some(function (line) { return line.indexOf(pattern) >= 0; });
	      console.log('is core commit: ' + isCoreCommit);
	      return isCoreCommit;
    }
    run(['svnlook', 'changed', svnRepo , '-r', rev].join(' '), testIfCoreCommit, this);
}

function updateWebwerkstattWorkingCopy() {
    run(['svn up', svnWc, '-r', rev].join(' '),
	      function(err, out) { console.log('updated: ' + out); return true; }, this);
}

function rsyncWithGit() {
    run(['rsync -ra --delete --filter=". ', gitRepoDir, '/webwerkstatt_mirror.filter" ',
         svnWc, ' ', gitRepoDir, '/core/'].join(''),
	      function(err, out) { console.log('sync done: ' + out); return true; }, this);
}

// -=-=-=-=-=-=-=-=-=-=-
// git commands
// -=-=-=-=-=-=-=-=-=-=-
function runGitCmd(cmd, name, next) {
    exec(cmd, {env: process.env, cwd: gitRepoDir},
	       function(code, err, out) {
	           console.log(['== ' + name + ' ==', code, err, out].join('\n'));
	           next(); });
}

function gitClean() {
    runGitCmd('git reset --hard && git clean --force -d', 'CLEAN', this);
}

var gitMirrorBranchName = 'ww-mirror';
function gitPull() { // should not be necessary but just to be sure...
    runGitCmd('git pull origin ' + gitMirrorBranchName, 'PULL', this);
}

function gitPush() {
    runGitCmd(['git add .;',
	             'git commit -am "[mirror commit] {\\"rev\\":\\"', rev, '\\"}";',
	             'git push origin', gitMirrorBranchName].join(' '),
	            'PUSH', this);
}

// -=-=-=-=-=-=-=-=-=-=-
// lock / unlock
// -=-=-=-=-=-=-=-=-=-=-
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
        setTimeout(function() { lock.call(next); }, 200);
    } catch (e) {
        // if error, means that file not there, we are ready to go
        fs.writeFileSync(lockFile, 'locked by mirror script, rev ' + rev);
        console.log('lock aquired');
        next();
    }
}

function unlock() {
    var next = typeof this == 'function' && this;
    Seq().
        seq(fs.unlink, lockFile, Seq).
        seq(function() { console.log('unlocked'); next && next(); });
}

// -=-=-=-=-=-=-=-=-=-=-
// let it run
// -=-=-=-=-=-=-=-=-=-=-
try {
    Seq().
        seq(lock).
        seq(checkIfCoreCommit).
        seq(gitClean).
        seq(gitPull).
        seq(updateWebwerkstattWorkingCopy).
        seq(rsyncWithGit).
        seq(gitPush).
        seq(unlock).
        catch(unlock);
} catch(e) {
    console.log('Error: ' + e);
    Seq().seq(unlock);
}