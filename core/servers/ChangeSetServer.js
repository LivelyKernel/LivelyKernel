var fs    = require('fs'),
    url   = require('url'),
    path  = require('path'),
    async = require('async');
var exec  = require('child_process').execFile,
    spawn = require('child_process').spawn;
var gitHelper = require('lively-git-helper');

var FS_BRANCH = 'master',
    TEST_PREFIX = '_test-',
    NAMESPACE = 'changeset', // for notes and stash
    SUB_REPOS = []; // FIXME: do not hard-code

// determine sub-repos (inside node_mdoules)
fs.readdir(path.join(process.env.WORKSPACE_LK, 'node_modules'), function(err, files) {
    if (err) return;
    files = files.map(function(filename) {
        return path.join(process.env.WORKSPACE_LK, 'node_modules', filename);
    });
    async.map(files, fs.stat, function(err, stats) {
        if (err) return;
        var dirs = files.filter(function(file, idx) {
            return stats[idx].isDirectory();
        });
        dirs = dirs.map(function(dirname) {
            return path.join(dirname, '.git');
        });
        async.filter(dirs, fs.exists, function(dirs){
            SUB_REPOS = dirs.map(function(dir) {
                return dir.substr(0, dir.length - 5);
            });
        });
    });
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function getBranches(cb) {
    // only list branches of the main repo
    gitHelper.listBranches(process.env.WORKSPACE_LK, function(err, branches) {
        if (err) return cb(err);
        cb(null, branches);
    });
}

function topologicalSort(arrs, diffProp1, diffProp2) {
    var itemsLeft = arrs.map(function(arr) { return arr.length; }).reduce(function(sum, len) { return sum + len; }, 0),
        ordered = [],
        atArr = 0,
        headItem,
        hasDependency;
    while (itemsLeft > 0) {
        headItem = arrs[atArr][0];
        if (headItem != undefined) {
            hasDependency = arrs.some(function(arr, aIdx) {
                if (aIdx == atArr) return false;
                return arr.some(function(elem, eIdx) {
                    if (eIdx == 0) return false;
                    return (elem[diffProp1] != null ? elem[diffProp1] == headItem[diffProp1] : false) &&
                        (elem[diffProp2] != null ? elem[diffProp2] == headItem[diffProp2] : false);
                })
            });
            if (!hasDependency) {
                arrs.forEach(function(arr, idx) {
                    var elem = arr[0];
                    if (elem && ((elem == headItem) ||
                        (elem[diffProp1] != null ? elem[diffProp1] == headItem[diffProp1] : false) ||
                        (elem[diffProp2] != null ? elem[diffProp2] == headItem[diffProp2] : false))) {
                        arr.shift();
                        itemsLeft--;
                    }
                });
                ordered.push(headItem);
                atArr = -1; // reset idx to prefer first array
            }
        }
        atArr = (atArr + 1) % arrs.length;
    }
    return ordered;
}

function getCommitsByBranch(branch, cb) {
    var repos = [process.env.WORKSPACE_LK].concat(SUB_REPOS);
    branch = branch;

    async.map(repos, function(repo, callback) {
        gitHelper.util.diffCommits(branch, FS_BRANCH, repo, function(err, info) {
            if (err) {
                if (err.code == 'NOTACOMMIT')
                    return callback(null, { added: [], missing: [] }); // empty result
                return callback(err);
            }

            // find commit notes with info what belongs to this changeset
            async.map(info.added.concat(info.missing), function(change, callback) {
                gitHelper.util.readCommitInfo(repo, change.commitId, NAMESPACE, function(err, info) {
                    change.note = info && info.notes;
                    callback(err, info);
                });
            }, function(err) {
                if (err) return callback(err);

                // FIXME: not neccessary anymore when every FS access is commited too
                exec('git', ['ls-files', '-mdso', '--exclude-standard'], { cwd: repo }, function(err, changes) {
                    if (err) return callback(err);
                    if ((branch != FS_BRANCH) && (changes[0].trim() != '')) {
                        // artificial commit for uncommited changes
                        info.missing.unshift({
                            commitId: null, message: '[Filesystem changes]', note: null
                        });
                    }
                    callback(null, info);
                });
            });
        });
    }, function(err, commitInfoByRepo) {
        var sortedCommits = topologicalSort(commitInfoByRepo.map(function(repo) { return repo.added.reverse(); }), 'note', 'message');
        sortedCommits.reverse();
        sortedCommits.forEach(function(commit) {
            if (commit.note) {
                var repos = commit.note.split('\n');
                commit.repos = repos.reduce(function(allRepos, repo) {
                    var parsed = repo.match(/^(.*): ([0-9a-f]+)$/);
                    allRepos[parsed[1]] = parsed[2];
                    return allRepos;
                }, {});
                commit.commitId = commit.repos['.'] || null;
            }
            delete commit.note;
        });
        var result = {
            added: sortedCommits,
            missing: commitInfoByRepo[0].missing
        };
        cb(err, result);
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
        commitsForBranches([branch]);
    else {
        getBranches(function(err, branches) {
            if (err) cb(err);
            else commitsForBranches(branches);
        });
    }
}

function getChanges(b, cb) {
    var repos = [process.env.WORKSPACE_LK].concat(SUB_REPOS),
        branch = b;

    async.map(repos, function(repoPath, callback) {
        gitHelper.util.getStashHash(branch, repoPath, function(err, changeHash) {
            if (err && !(err instanceof Error))
                err = new Error(err);
            callback(null, err || changeHash)
        });
    }, function(err, results) {
        if (err) return cb('Unexpected error when assembling change set "' + b + '"!');

        var repoInfos = results.reduce(function(res, result, idx) { // filter and zip
            if (!(result instanceof Error))
            res.push({ path: repos[idx], changeHash: result });
            return res;
        }, []);

        if (repoInfos.length == 0) return cb('Could not find change set "' + b + '"!');
        async.map(repoInfos, function(repoInfo, callback) {
            gitHelper.util.readCommit(repoInfo.path, repoInfo.changeHash, process.env.WORKSPACE_LK, callback);
        }, function(err, changesArr) {
            if (err) return cb(err);

            var changeSet = changesArr.reduce(function(all, changes, idx) {
                var subst = '$1 ' + repoInfos[idx].changeHash;
                changes.forEach(function(change) {
                    all.push(change.replace(/^(@@.*@@).*$/m, subst));
                });
                return all;
            }, []);
            cb(null, changeSet);
        });
    });
}

function getBranchAndParentFromChangeId(changeId, repo, cb) {
    gitHelper.util.getBranchesByHash(changeId, repo, function(err, branches) {
        if (err) return cb(err);
        gitHelper.util.getParentHash(changeId + '^1', repo, function(err, parent) {
            if (err) return cb(err);
            // should not be more than one branch!!
            cb(null, branches && branches[0], parent);
        });
    });
}

function getOldFilename(diff) {
    var filename = diff.match(/^\-\-\- (.*)$/m)[1].trim();
    return filename != '/dev/null' ? filename.substr(2) : null;
}

function getNewFilename(diff) {
    var filename = diff.match(/^\+\+\+ (.*)$/m)[1].trim();
    return filename != '/dev/null' ? filename.substr(2) : null;
}

function normalizeDiffFilenames(diffs, repoPath) {
    var relPath = path.relative(process.env.WORKSPACE_LK, repoPath);
    return diffs.map(function(diff) {
        var oldFilename = getOldFilename(diff),
            newFilename = getNewFilename(diff);
        if (oldFilename)
            diff = diff.replace('--- a/' + oldFilename, '--- a/' + path.relative(relPath, oldFilename));
        if (newFilename)
            diff = diff.replace('+++ b/' + newFilename, '+++ b/' + path.relative(relPath, newFilename));
        return diff;
    });
}

function commitChanges(diffsToCommit, diffsToStash, message, commiter, cb) {
    var files = [],
        reposByChangeId = {}; // { CHANGE_ID*: { path: PATH, changes: DIFF*, commitId: HASH } }

    function fillRepos(reposMap, diffs, storage) {
        diffs.each(function(diff) {
            var match = diff.match(/^@@.*@@ (.+)$/m),
                changeId = match && match[1].trim();
            if (!reposMap.hasOwnProperty(changeId)) {
                reposMap[changeId] = { changes: [], stash: [] };
                var filename = getNewFilename(diff) || getOldFilename(diff);
                filename = path.join(process.env.WORKSPACE_LK, filename);
                reposMap[changeId].path = SUB_REPOS.filter(function(repoPath) {
                    return filename.indexOf(repoPath) == 0;
                })[0] || process.env.WORKSPACE_LK;
            }
            reposMap[changeId][storage].push(diff);
        });
    }

    fillRepos(reposByChangeId, diffsToCommit, 'changes');
    fillRepos(reposByChangeId, diffsToStash, 'stash');

    async.eachSeries(Object.getOwnPropertyNames(reposByChangeId),
    function(changeId, callback) {
        var repo = reposByChangeId[changeId];
        getBranchAndParentFromChangeId(changeId, repo.path, function(err, branch, parentHash) {
            if (err || branch == undefined) return callback(err || new Error('No branch found!'));

            var commitObj = {
                treeInfos: {},
                parent: parentHash,
            };

            repo.changes = normalizeDiffFilenames(repo.changes, repo.path);
            repo.stash = normalizeDiffFilenames(repo.stash, repo.path);

            async.waterfall([
                gitHelper.util.createCommitFromDiffs.bind(null, repo.path, repo.changes, commiter, message, commitObj),
                function(commitObj, callback) {
                    // clean commitObj
                    repo.commitId = commitObj.commit;
                    commitObj.parent = commitObj.commit;
                    delete commitObj.commit;
                    delete commitObj.rootTree;
                    callback(null, commitObj);
                },
                gitHelper.util.createCommitFromDiffs.bind(null, repo.path, repo.stash, commiter, null),
                gitHelper.util.updateBranch.bind(null, branch, repo.path)
            ], callback);
        });
    }, function(err) {
        if (err) return cb(err);

        var commitNote = Object.getOwnPropertyNames(reposByChangeId).map(function(changeId) {
            var repo = reposByChangeId[changeId],
                repoName = path.relative(process.env.WORKSPACE_LK, repo.path);
            if (repoName == '') repoName = '.';
            return repoName + ': ' + repo.commitId;
        }).join('\n');

        async.eachSeries(Object.getOwnPropertyNames(reposByChangeId),
        function(changeId, callback) {
            var repo = reposByChangeId[changeId];
            gitHelper.util.addCommitNote(repo.path, repo.commitId, commitNote, NAMESPACE, callback);
        }, cb);
    });
}

function applyChanges(branch, data, temporary, callback) {
    var refName = (temporary ? TEST_PREFIX : '') + branch;

    // TODO: handle multiple datasets
    var changes = data[0].changes,
        changesByRepos = changes.reduce(function(repos, change) {
            change.repos = change.repos || {};
            change.repos['.'] = change.repos['.'] ||  change.commitId; // commitId belongs to changes in main repo
            Object.getOwnPropertyNames(change.repos).forEach(function(repo) {
                if (repos[repo] == undefined)
                    repos[repo] = { changes: [] };
                repos[repo].changes.push(change.repos[repo]);
            });
            return repos;
        }, {});

    // find all start points for the repos + addition commits
    if (!data[0].after)
        data[0].after = { commitId: null, repos: {} };
    changesByRepos['.'].parent = data[0].after.commitId;
    async.each(Object.getOwnPropertyNames(changesByRepos), function (repo, cb) {
        changesByRepos[repo].parent = changesByRepos[repo].parent || (data[0].repos && data[0].repos[repo]);
        var repoPath = path.resolve(process.env.WORKSPACE_LK, repo);

        function findAdditionalCommits(repo) {
            gitHelper.util.diffCommits(repo.parent, branch, repoPath, function(err, info) {
                if (err) return cb(err);
                var commitIds = info.missing.map(function(commit) {
                    return commit.commitId;
                }).reverse();
                Array.prototype.push.apply(repo.changes, commitIds);
                cb(null);
            });
        }

        if (changesByRepos[repo].parent) {
            gitHelper.util.readCommitInfo(repoPath, changesByRepos[repo].parent, function(err, info) {
                if (err) return cb(err);
                changesByRepos[repo].parent = info.commitId;
                findAdditionalCommits(changesByRepos[repo]);
            });
        } else {
            gitHelper.util.findCommonBase(branch, FS_BRANCH, repoPath, function(err, parentId) {
                if (err) return cb(err);
                changesByRepos[repo].parent = parentId;
                findAdditionalCommits(changesByRepos[repo]);
            });
        }
    }, function(err) {
        if (err) return callback(err);

        var processings = Object.getOwnPropertyNames(changesByRepos).reduce(function(procs, repo) {
            var repoPath = path.resolve(process.env.WORKSPACE_LK, repo);
            procs[repo] = processChanges.bind(null, changesByRepos[repo], repoPath);
            return procs;
        }, {});
        async.parallel(processings, function(err, commitByRepo) {
            if (err) return callback(err);
            // TODO: handle notes
            updateBranches(commitByRepo, refName, callback);
        });
    });
}

function processChanges(changeObj, repoPath, callback) {
    async.reduce(changeObj.changes, changeObj.parent, function(parentId, commitId, cb) {
        async.waterfall([
            gitHelper.util.readCommit.bind(null, repoPath, commitId),
            function(diffs, next) {
                gitHelper.util.readCommitInfo(repoPath, commitId, function(err, info) {
                    if (err) return next(err);
                    var commitInfo = {
                            GIT_AUTHOR_NAME: info.author,
                            GIT_AUTHOR_EMAIL: info.authorEmail,
                            GIT_AUTHOR_DATE: info.authorDate.toISOString().substr(0, 19),
                            GIT_COMMITTER_NAME: info.commiter,
                            GIT_COMMITTER_EMAIL: info.commiterEmail,
                            GIT_COMMITTER_DATE: info.commiterDate.toISOString().substr(0, 19)
                        },
                        fileInfo = { parent: parentId };
                    gitHelper.util.createCommitFromDiffs(repoPath, diffs, commitInfo, info.message, fileInfo, next);
                })
            }
        ], function(err, fileInfo) {
            if (err) return cb(err);
            cb(null, fileInfo.commit);
        });
    }, function(err, commitId) {
        delete changeObj.parent;
        changeObj.commit = commitId;
        callback(err, { commit: commitId });
    });
}

function updateBranches(commitByRepo, refName, callback) {
    async.each(Object.getOwnPropertyNames(commitByRepo), function(repo, cb) {
        var repoPath = path.resolve(process.env.WORKSPACE_LK, repo);
        gitHelper.util.updateBranch(refName, repoPath, commitByRepo[repo], cb);
    }, function(err) {
        // TODO: on error, remove all the branches already created
        callback(err, refName);
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
        // TODO: Make it work with sub-repo commits
        gitHelper.util.readCommit(process.env.WORKSPACE_LK, commitId, function(err, changes) {
            if (err) res.status(400).json({ error: String(err) });
            else res.json(changes);
        });
    });

    app.post(route + 'commit', function(req, res) {
        var commit = req.body && req.body.commit,
            stash = req.body && req.body.stash,
            user = req.body && req.body.user,
            email = req.body && req.body.email,
            message = req.body && req.body.message,
            force = req.body && !!(req.body.force);
        if (!commit)
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
            commitChanges(commit, stash, message, commiter, function(err) {
                if (err)
                    res.status(409).json({ error: 'Files have changed!' });
                else
                    res.status(201).json('Commit successful!');
            });
        }
    });

    app.post(route + 'apply-to/:branch', function(req, res) {
        var branch = req.param('branch'),
            data = req.body,
            temporary = (req.param('temporary') == 'false' ? false : true);
        if (!data || !Array.isArray(data) || data.length == 0)
            res.status(400).json({ error: 'Could not find changes to apply.' });
        else if (data.length > 1) // TODO: implement
            res.status(400).json({ error: 'Applying changes in multiple places is not yet implemented!' });
        else {
            applyChanges(branch, data, temporary, function(err, csName) {
                if (err) {
                    console.log(err);
                    res.status(409).json({ error: 'Error applying changes to ' + branch + '!' });
                } else
                    res.json({ base: branch, temporary: temporary, branch: csName });
            });
        }
    });

    app.get(route + 'finalize/:branch', function(req, res) {
        var branch = req.param('branch'),
            originalBranch = branch.substr(TEST_PREFIX.length);

        var repos = [process.env.WORKSPACE_LK].concat(SUB_REPOS);
        async.each(repos, function(repoPath, callback) {
            async.waterfall([
                gitHelper.util.readCommitInfo.bind(null, repoPath, branch),
                function(info, cb) {
                    if (!info.commitId) return cb(new Error('Could not find test branch "' + branch + '"!'));
                    cb(null, { commit: info.commitId });
                },
                gitHelper.util.updateBranch.bind(null, originalBranch, repoPath),
                function(_, cb) { cb(); }, // remove all return values
                gitHelper.removeBranch.bind(null, branch, repoPath)
            ], function(err) {
                if (err && err.code == 'NOTACOMMIT') // ignore not existing branches
                    return callback(null);
                callback(err);
            });
        }, function(err) {
            // TODO: put back all the branches that already have been set!
            if (err) return res.status(400).json({ error: err.toString() });
            res.json({ success: true, updated: originalBranch, removed: branch });
        });
    });

    app.get(route + 'remove/:branch', function(req, res) {
        var branch = req.param('branch');
        if (branch == FS_BRANCH)
            return res.status(400).json({ error: 'You cannot remove the main change set (' + FS_BRANCH + ')!'});

        var repos = [process.env.WORKSPACE_LK].concat(SUB_REPOS);
        async.each(repos, function(repoPath, callback) {
            gitHelper.removeBranch(branch, repoPath, function() {
                callback(); // ignore errors!
            });
        }, function() {
            res.json({ success: true, removed: branch });
        });
    });

}

module.exports.getBranches = getBranches;
module.exports.getCommits = getCommits;