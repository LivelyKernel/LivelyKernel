var fs    = require('fs'),
    url   = require('url'),
    path  = require('path'),
    async = require('async');
var exec  = require('child_process').execFile,
    spawn = require('child_process').spawn;
var gitHelper = require('lively-git-helper');

var FS_BRANCH = 'master';
    BRANCH_PREFIX = 'lvChangeSet-';

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function getBranches(cb) {
    gitHelper.listBranches(process.env.WORKSPACE_LK, function(err, branches) {
        if (err) return cb(err);
        branches = branches.filter(function(branch) {
            return branch.substr(0, BRANCH_PREFIX.length) == BRANCH_PREFIX;
        }).map(function(branch) {
            return branch.substr(BRANCH_PREFIX.length);
        });
        cb(null, branches);
    });
}

function getCommitsByBranch(branch, cb) {
    async.parallel({
        added: gitHelper.util.listCommits.bind(null, '..' + BRANCH_PREFIX + branch, process.env.WORKSPACE_LK),
        missing: gitHelper.util.listCommits.bind(null, BRANCH_PREFIX + branch + '..', process.env.WORKSPACE_LK),
        changes: exec.bind(null, 'git',
            ['ls-files', '-mdso', '--exclude-standard'],
            { cwd: process.env.WORKSPACE_LK })
    }, function(err, info) {
        if (err) return cb(err);
        if ((branch != FS_BRANCH) && (info.changes[0].trim() != '')) {
            // artificial commit for uncommited changes
            info.missing.unshift({
                commitId: null, message: '[Filesystem changes]'
            });
        }
        delete info.changes;
        cb(null, info);
    });
}

function getCommits(branch, cb) {
    function commitsForBranches(branches) {
        var branchCmds = branches.reduce(function(list, branch) {
            list[branch] = getCommitsByBranch.bind(null, branch);
            return list;
        }, {});
        async.parallel(branchCmds, function(err, branchInfo) {
            cb(null, branchInfo);
        });
    }

    if (branch)
        commitsForBranches([branch])
    else {
        getBranches(function(err, branches) {
            if (err) cb(err);
            else commitsForBranches(branches);
        });
    }
}

function getChanges(b, cb) {
    var branch = b;
    if (branch) branch = BRANCH_PREFIX + branch;
    gitHelper.util.getStashHash(branch, process.env.WORKSPACE_LK, function(err, changeHash) {
        if (err) return cb('Could not find change set "' + b + '"!');
        var changes = { changeId: changeHash, changes: [] };

        exec('git', ['--no-pager', 'diff', '-U0', '--full-index', changeHash + '^', changeHash], { cwd: process.env.WORKSPACE_LK },
        function(err, stdout, stderr) {
            if (err) return cb(err);
            changes.changes = stdout.split('\n').reduce(function(all, line) {
                if (line.trim() != '') {
                    if (line.substr(0, 5) == 'diff ')
                        all.push(line);
                    else
                        all[all.length -1] += '\n' + line;
                }
                return all;
            }, []);
            cb(null, changes);
        });
    });
}

function getBranchAndParentFromChangeId(changeId, cb) {
    exec('git', ['branch', '--contains', changeId], { cwd: process.env.WORKSPACE_LK },
    function(err, stdout, stderr) {
        if (err) return cb(err);
        var branches = stdout.trimRight().split('\n').map(function(branch) {
            return branch.trim();
        });

        exec('git', ['log', '--pretty=%H', '-n', '1', changeId + '^1'], { cwd: process.env.WORKSPACE_LK },
        function(err, stdout, stderr) {
            if (err) return cb(err);

            // should not be more than one branch!!
            cb(null, branches && branches[0], stdout.trimRight());
        });
    });
}

function getCommit(commitId, cb) {
    exec('git', ['--no-pager', 'diff', '-U0', '--full-index', commitId + '^', commitId], { cwd: process.env.WORKSPACE_LK },
    function(err, stdout, stderr) {
        if (err) return cb('Could not find commit with id: ' + commitId);
        var changes = stdout.split('\n').reduce(function(all, line) {
            if (line.trim() != '') {
                if (line.substr(0, 5) == 'diff ')
                    all.push(line);
                else
                    all[all.length -1] += '\n' + line;
            }
            return all;
        }, []);
        cb(null, changes);
    });
}

function getOldFileHash(diff) {
    return diff.match(/^index ([0-9a-f]+)\.\./m)[1];
}

function getNewFileHash(diff) {
    return diff.match(/^index [0-9a-f]+\.\.([0-9a-f]+)/m)[1];
}

function getNewFilename(diff) {
    var filename = diff.match(/^\+\+\+ (.*)$/m)[1].trim();
    return filename != '/dev/null' ? filename.substr(2) : null;
}

function removeTempFiles(files) {
    async.each(files, function(file, callback) {
        fs.unlink(path.join(process.env.WORKSPACE_LK, file), callback);
    },
    function() {
        // ignore errors;
    });
}

function commitDiffs(diffs, commiter, message, commitObj, cb) {
    // commitObj has at least:
    //    .parent -    with parent hash (for commit)
    //    .repoPath -  with git directory name
    //    .treeInfos - empty hash table or previously loaded tree info
    var commitObjects = diffs.reduce(function(list, diff) {
        var hash = getOldFileHash(diff) + '-' + getNewFileHash(diff);
        if (!list.hasOwnProperty(hash))
            list[hash] = { diffs: [] };
        list[hash].diffs.push(diff);
        return list;
    }, {});
    var tempFiles = [];

    // assemble tree info
    async.reduce(diffs.map(getNewFilename), commitObj.treeInfos, function(tree, filename, next) {
        if (filename == '/dev/null') return tree;
        gitHelper.util.getTree(commitObj.repoPath, filename, commitObj.parent, tree, next);
    },
    function(err) {
        if (err) return cb(err);

        async.eachSeries(Object.getOwnPropertyNames(commitObjects),
        async.seq(
            function createTempFile(doubleHash, next) {
                // make sure it exists
                var hash = doubleHash.split('-')[0];
                if (hash == 0000000000000000000000000000000000000000) return next(null, doubleHash, null);
                exec('git', ['unpack-file', hash], { cwd: commitObj.repoPath },
                function(err, stdout, stderr) {
                    if (err) return next(err);
                    var tempFile = stdout.trimRight();
                    commitObjects[doubleHash].tempFile = tempFile;
                    tempFiles.push(tempFile);
                    next(null, doubleHash, tempFile);
                });
            },
            function patchTempFile(doubleHash, tempFile, next) {
                var args = []
                if (tempFile == null) {
                    var hash = doubleHash.split('-')[1];
                    tempFile = '.merge_file_' + hash.substr(0, 8);
                    tempFiles.push(tempFile);
                    args.push('-o');
                }
                args.push(tempFile);
                var patch = spawn('patch', args, { cwd: commitObj.repoPath }),
                    stderr = '';
                patch.stderr.on('data', function(buffer) {
                    stderr += buffer.toString();
                });
                patch.on('close', function(code) {
                    if (code == 0)
                        next(null, doubleHash, tempFile);
                    else
                        next(new Error(stderr));
                });
                patch.stdin.end(commitObjects[doubleHash].diffs.join('\n'));
            },
            function saveTempFile(doubleHash, tempFile, next) {
                var newFilename = getNewFilename(commitObjects[doubleHash].diffs[0]);
                gitHelper.util.createHashObjectFromFile(commitObj.repoPath, tempFile, function(err, hash) {
                    if (err) return next(err);
                    commitObjects[doubleHash].fileHash = hash;
                    gitHelper.util.injectHashObjectIntoTree(newFilename, hash, commitObj.treeInfos);
                    next(null);
                });
            }
        ), function(err) {
            removeTempFiles(tempFiles);
            if (err) return cb(err);

            async.waterfall([
                gitHelper.util.createTrees.bind(null, commitObj.repoPath, commitObj),
                gitHelper.util.createCommit.bind(null, commitObj.repoPath, commiter, message),
            ], cb);
        });
    });
}

function commitChanges(changeId, diffsToCommit, diffsToStash, message, commiter, cb) {
    var files = [];
    getBranchAndParentFromChangeId(changeId, function(err, branch, parentHash) {
        if (err || branch == undefined) return cb(err || new Error('No branch found!'));

        var commitObj = {
            treeInfos: {},
            parent: parentHash,
            repoPath: process.env.WORKSPACE_LK
        };

        async.waterfall([
            commitDiffs.bind(null, diffsToCommit, commiter, message, commitObj),
            function(commitObj, callback) {
                // clean commitObj
                commitObj.parent = commitObj.commit;
                delete commitObj.commit;
                delete commitObj.rootTree;
                callback(null, commitObj);
            },
            commitDiffs.bind(null, diffsToStash, commiter, null),
            gitHelper.util.updateBranch.bind(null, branch, commitObj.repoPath)
        ], cb);
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = function(route, app) {

    app.get(route + 'changesets', function(req, res) {
        getBranches(function(err, branches) {
            if (err) res.status(400).json({ error: String(err) });
            else res.json(branches);
        });
    });

    app.get(route + 'commits/:branch?', function(req, res) {
        var branch = req.param('branch') || req.cookies['livelykernel-branch'];
        if (branch == '*' || branch == undefined)
            branch = '';
        getCommits(branch, function(err, commits) {
            if (err) res.status(400).json({ error: String(err) });
            else res.json(commits);
        });
    });

    app.get(route + 'changes/:branch?', function(req, res) {
        var branch = req.param('branch') || req.cookies['livelykernel-branch'];
        getChanges(branch, function(err, changes) {
            if (err) res.status(400).json({ error: String(err) });
            else res.json(changes);
        });
    });

    app.get(route + 'commit/:commitId', function(req, res) {
        var commitId = req.param('commitId');
        getCommit(commitId, function(err, changes) {
            if (err) res.status(400).json({ error: String(err) });
            else res.json(changes);
        });
    });

    app.post(route + 'commit', function(req, res) {
        var changeId = req.body && req.body.changeId,
            commit = req.body && req.body.commit,
            stash = req.body && req.body.stash,
            user = req.body && req.body.user,
            email = req.body && req.body.email,
            message = req.body && req.body.message,
            force = req.body && !!(req.body.force);
        if (!changeId)
            res.status(400).json({ error: 'Could not find change ID!' });
        else if (!commit)
            res.status(400).json({ error: 'Could not find changes to commit (commit)!' });
        else if (!stash)
            res.status(400).json({ error: 'Could not find remaining, uncommited changes (stash)!' });
        else if (!message)
            res.status(400).json({ error: 'Could not find commit message!' });
        else if (!user)
            res.status(400).json({ error: 'Could not find user name!' });
        else if (!email)
            res.status(400).json({ error: 'Could not find user email!' });
        else {
            var commiter = {
                GIT_AUTHOR_NAME: user,
                GIT_AUTHOR_EMAIL: email,
                GIT_COMMITTER_NAME: 'Lively ChangeSets',
                GIT_COMMITTER_EMAIL: 'unknown-user@lively-web.local'
            };
            commitChanges(changeId, commit, stash, message, commiter, function(err) {
                if (err)
                    res.status(409).json({ error: 'Files have changed!' });
                else
                    res.status(201).json('Commit successful!');
            });
        }
    });

}

module.exports.getBranches = getBranches;
module.exports.getCommits = getCommits;