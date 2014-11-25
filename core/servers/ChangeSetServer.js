var path  = require('path');
var async = require('async');
var exec  = require('child_process').execFile,
    spawn = require('child_process').spawn;
var fs    = require('fs');
var url   = require('url');

var FS_BRANCH = 'master',
    BRANCH_PREFIX = 'lvChangeSet-';

var log = function log(/*args*/) {
    console.log.apply(console, arguments);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function getBranches(cb) {
    exec('git', ['branch', '--list'], { cwd: process.env.WORKSPACE_LK },
    function(err, stdout, stderr) {
        if (err) return cb(err);
        var branches = stdout.trimRight().split('\n').map(function(branch) {
            return branch.substr(2);
        }).filter(function(branch) {
            return branch.substr(0, BRANCH_PREFIX.length) == BRANCH_PREFIX;
        }).map(function(branch) {
            return branch.substr(BRANCH_PREFIX.length);
        });
        cb(null, branches);
    });
}

function getCommitsByBranch(branch, cb) {
    async.parallel({
        added: exec.bind(null, 'git',
            ['rev-list', '..' + BRANCH_PREFIX + branch, '--no-merges', '--pretty=oneline'],
            { cwd: process.env.WORKSPACE_LK }),
        missing: exec.bind(null, 'git',
            ['rev-list', BRANCH_PREFIX + branch + '..', '--no-merges', '--pretty=oneline'],
            { cwd: process.env.WORKSPACE_LK }),
        changes: exec.bind(null, 'git',
            ['ls-files', '-mdso', '--exclude-standard'],
            { cwd: process.env.WORKSPACE_LK })
    }, function(err, info) {
        if (err) return cb(err);
        info.added = info.added[0].trimRight();
        if (info.added != '') {
            info.added = info.added.split('\n').map(function(line) {
                var commit = line.match('^([0-9a-f]+) (.*)$');
                return { commitId: commit[1], message: commit[2] };
            });
        } else info.added = [];
        info.missing = info.missing[0].trimRight();
        if (info.missing != '') {
            info.missing = info.missing.split('\n').map(function(line) {
                var commit = line.match('^([0-9a-f]+) (.*)$');
                return { commitId: commit[1], message: commit[2] };
            });
        } else info.missing = [];
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

function getStashHash(branch, cb) {
    // always take the lastest commit as "stash" commit
    exec('git', ['rev-list', '..' + branch, '-1'], { cwd: process.env.WORKSPACE_LK },
    function(err, stdout, stderr) {
        if (err) return cb(err);
        cb(null, stdout.trimRight());
    });
}

function getChanges(b, cb) {
    var branch = b;
    if (branch) branch = BRANCH_PREFIX + branch;
    getStashHash(branch, function(err, changeHash) {
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
    // async.each(files, function(file, callback) {
    //     fs.unlink(path.join(process.env.WORKSPACE_LK, file), callback);
    // },
    // function() {
    //     // ignore errors;
    // });
}

function createHashObject(tempFile, callback) {
    exec('git', ['hash-object', '-t', 'blob', '-w', tempFile], { cwd: process.env.WORKSPACE_LK },
    function(err, stdout, stderr) {
        if (err) return callback(err);
        callback(null, stdout.trimRight());
    });
}

function treeFromString(str, withoutPath) {
    var objects = str.trimRight().split('\n'),
        withoutPath = !!withoutPath;

    if (objects.length == 1 && objects[0] == '') // no directory content
        objects = [];

    return objects.reduce(function(tree, objLine) {
        // ls-tree returns lines in the format of:
        // <mode> SP <type> SP <object> TAB <file> NL
        // (see http://git-scm.com/docs/git-ls-tree)
        var info = objLine.match(/^([0-9]+) (tree|blob) ([0-9a-f]+)\t(.*)$/);
        if (!info) // should not happen!!
            throw new Error('Found weird Git ls-tree info (unparseable): ' + objLine);
        var filename = withoutPath ? path.basename(info[4]) : info[4];
        tree[filename] = {
            fileMode: info[1],
            objectType: info[2],
            objectHash: info[3]
        };
        return tree;
    }, {});
}

function stringFromTree(tree) {
    var lines = Object.getOwnPropertyNames(tree).map(function(filename) {
        var info = tree[filename];
        return info.fileMode + ' ' + info.objectType + ' ' + info.objectHash + '\t' + filename;
    });
    return lines.join('\n');
}

function getGitTrees(commitId, filename, treeInfo, callback) {
    // TODO: eventually create empty trees

    var pathParts = filename.split(path.sep);
    pathParts.pop();
    var paths = pathParts.reduce(function(paths, part) {
        paths.unshift(path.join(paths[0], part) + '/');
        return paths;
    }, ['']);

    async.reduce(paths, treeInfo, function(tree, path, next) {
        if (tree.hasOwnProperty(path)) return next(null, tree);
        exec('git', ['ls-tree', commitId, path], { cwd: process.env.WORKSPACE_LK }, function(err, stdout, stderr) {
            if (err) return next(err);
            tree[path] = treeFromString(stdout, true);
            next(null, tree);
        });
    }, callback);
}

function createTree(treeInfo, callback) {
    var cmd = spawn('git', ['mktree'], { cwd: process.env.WORKSPACE_LK }),
        stdout = '',
        stderr = '';
    cmd.stdout.on('data', function(buffer) {
        stdout += buffer.toString();
    });
    cmd.stderr.on('data', function(buffer) {
        stderr += buffer.toString();
    });
    cmd.on('close', function(code) {
        if (code != 0)
            return callback(new Error(stderr));
        var newHash = stdout.trimRight();
        callback(null, newHash);
    });
    cmd.stdin.end(stringFromTree(treeInfo));
}

function commitChanges(treeHash, parentHash, commitMsg, commiter, callback) {
    exec('git', ['commit-tree', treeHash, '-p', parentHash, '-m', commitMsg], { cwd: process.env.WORKSPACE_LK, env: commiter },
    function(err, stdout, stderr) {
        if (err) return callback(err);
        callback(null, stdout.trimRight());
    });
}

function createCommit(changeId, commitDiffs, stashDiffs, message, commiter, cb) {
    var files = [];
    getBranchAndParentFromChangeId(changeId, function(err, branch, parentHash) {
        if (err || branch == undefined) return cb(err || new Error('No branch found!'));

        var changeObjects = commitDiffs.reduce(function(list, diff) {
            var hash = getOldFileHash(diff) + '-' + getNewFileHash(diff);
            if (!list.hasOwnProperty(hash))
                list[hash] = { diffs: [] };
            list[hash].diffs.push(diff);
            return list;
        }, {});

        // assemble tree info
        async.reduce(commitDiffs.map(getNewFilename), {}, function(tree, filename, next) {
            if (filename == '/dev/null') return tree;
            tree = getGitTrees(changeId, filename, tree, next);
        },
        function(err, treeInfo) {
            if (err) return cb(err);

            async.eachSeries(Object.getOwnPropertyNames(changeObjects),
            async.seq(
                function createTempFile(doubleHash, next) {
                    // make sure it exists
                    var hash = doubleHash.split('-')[0];
                    if (hash == 0000000000000000000000000000000000000000) return next(null, doubleHash, null);
                    exec('git', ['unpack-file', hash], { cwd: process.env.WORKSPACE_LK },
                    function(err, stdout, stderr) {
                        if (err) return next(err);
                        var tempFile = stdout.trimRight();
                        changeObjects[doubleHash].tempFile = tempFile;
                        files.push(tempFile);
                        next(null, doubleHash, tempFile);
                    });
                },
                function patchTempFile(doubleHash, tempFile, next) {
                    var args = []
                    if (tempFile == null) {
                        var hash = doubleHash.split('-')[1];
                        tempFile = '.merge_file_' + hash.substr(0, 8);
                        files.push(tempFile);
                        args.push('-o');
                    }
                    args.push(tempFile);
                    var patch = spawn('patch', args, { cwd: process.env.WORKSPACE_LK }),
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
                    patch.stdin.end(changeObjects[doubleHash].diffs.join('\n'));
                },
                function saveTempFile(doubleHash, tempFile, next) {
                    var newFilename = getNewFilename(changeObjects[doubleHash].diffs[0]),
                        dirname = path.dirname(newFilename);
                    changeObjects[doubleHash].targetFilename = path.basename(newFilename);
                    changeObjects[doubleHash].targetDir = (dirname == '.' ? '' : dirname + '/');

                    console.log('Saving ' + tempFile + ' to ' + newFilename);
                    createHashObject(tempFile, function(err, hash) {
                        if (err) return next(err);
                        changeObjects[doubleHash].fileHash = hash;
                        next(null);
                    });
                }
            ), function(err) {
                removeTempFiles(files);
                if (err) return cb(err);

                changeObjects = Object.getOwnPropertyNames(changeObjects).map(function(hash) {
                    return changeObjects[hash];
                });

                // updateing tree and commiting
                var changedDirs = Object.getOwnPropertyNames(treeInfo).sort().reverse();
                async.reduce(changedDirs, null, function(memo, dirname, next) {
                    // update tree with new files ...
                    changeObjects.each(function(obj) {
                        if (obj.targetDir != dirname) return;
                        treeInfo[dirname][obj.targetFilename] = treeInfo[dirname][obj.targetFilename] || {
                            fileMode: '100644', // default filemode
                            objectType: 'blob',
                        };
                        treeInfo[dirname][obj.targetFilename].objectHash = obj.fileHash;
                    });

                    // ... and propagate changed hash down
                    createTree(treeInfo[dirname], function(err, treeHash) {
                        if (err) return next(err);
                        if (dirname != '') {
                            var curDir = path.basename(dirname),
                                parentDir = path.dirname(dirname.substr(0, dirname.length - 1));
                            if (parentDir == '.')
                                parentDir = '';
                            else
                                parentDir += '/';
                            treeInfo[parentDir][curDir].objectHash = treeHash;
                        }
                        next(null, treeHash);
                    });
                },
                function(err, treeHash) {
                    if (err) return cb(err);
                    commitChanges(treeHash, parentHash, message, commiter, function(err, commitHash) {
                        console.log('Commited with hash:', commitHash);
                        cb(err, commitHash);
                        // TODO: create additional commit with stash (again)
                    });
                });
            });
        });
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
            createCommit(changeId, commit, stash, message, commiter, function(err) {
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