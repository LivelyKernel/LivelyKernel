module('lively.ide.git.Interface').requires("lively.ide.CommandLineInterface").toRun(function() {

var git = lively.ide.git.Interface;

Object.extend(git, {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // generic shell interface

  runCommandsThenDo: function(commands, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options; options = null;
    }
    options = options || {};

    var defaultOptions = ['--no-pager'];

    lively.lang.fun.composeAsync(
      findCwd,
      prepareCommands,
      options.dryRun ? function(cmds, n) { n(null, cmds); } : runCommands
    )(thenDo);

    function findCwd(n) {
      if (options.cwd) n(null, options.cwd);
      else if (lively.shell.rootDirectory) n(null, lively.shell.rootDirectory);
      else lively.shell.cwd(n);
    }

    function prepareCommands(cwd, n) {
      var cmds = commands.map(function(ea) {
          if (ea.gitCommand) {
            if (Object.isArray(ea.gitCommand)) ea.gitCommand = ea.gitCommand.join(' ');
            ea.command = ['git'].concat(defaultOptions).concat([ea.gitCommand]).join(' ');
          }
          ea.options = ea.options || {};
          ea.options.group = 'lively-git-interface';
          ea.options["cwd"] = cwd;
          return ea;
      }).compact();
      n(null, cmds);
    }

    function runCommands(cmds, n) {
      lively.shell.runAll(commands, function(err, result) {
          var result = Object.keys(result || {}).reduce(function(result, name) {
              var cmd = result[name];
              if (!cmd || !cmd.isShellCommand) return result;
              result['cmd' + name.capitalize()] = cmd;
              result[name] = cmd.resultString(true);
              return result
          }, result);
          thenDo && thenDo(err, result);
      });
    }
  },

  fileStatus: function(dir, options, thenDo) {
    /*
    git.fileStatus("/Users/robert/Lively/LivelyKernel", function(err, results) {
      err && show(String(err));
      Global.fileObjects = results;
      show("got fileObjects");
    });
    */

    if (typeof dir === "function") {
      thenDo = dir; options = null; dir = null;
    } else if (typeof options === "function") {
      thenDo = options; options = null;
    }
    options = options || {};

    lively.lang.fun.composeAsync(
      function(n) { if (dir) n(null, dir); else lively.shell.cwd(n); },
      fileStatus,
      function(fileObjects, n) {
        fileObjects = fileObjects.map(addFilenameAndChange);
        n(null, fileObjects);
      }
    )(thenDo);

    function fileStatus(dir, next) {
      var commands = [{
        name: "status",
        gitCommand: "status --porcelain",
        transform: function(cmd) { return cmd.getStdout(); }
      }];

      git.runCommandsThenDo(commands, {cwd: dir}, function(err, mapping) {
        var lines = mapping && mapping.status.split('\n');
        var results = lines && lively.lang.arr.flatmap(lines, function(line) {
          if (!line) return [];
          var m, results = [];
          if (m = line.match(/^(\s[A-Z]|[A-Z]{2})(.*)/)) results.push({status: "unstaged",  statusString: m[0]});
          if (m = line.match(/^[A-Z]{1,2}(.*)/))         results.push({status: "staged",    statusString: m[0]});
          if (m = line.match(/^\s*\?\?(.*)/))            results.push({status: "untracked", statusString: m[0]});
          return results;
        }).compact();
        err = err || (results ? null : new Error("failed to run git status on " + dir));
        next(err, results);
      });
    }

    function addFilenameAndChange(fileObject) {
        // statusString looks like "R  bar.txt -> foo.txt"
        //        +o   ' ' = unmodified
        //        +o    _M = modified
        //        +o    _A = added
        //        +o    _D = deleted
        //        +o    _R = renamed
        //        +o    _C = copied
        //        +o    _U = updated but unmerged
        //
        //        Ignored files are not listed, unless --ignored option is in effect, in
        //        which case XY are !!.
        //
        //            X          Y     Meaning
        //            -------------------------------------------------
        //                      [MD]   not updated
        //            M        [ MD]   updated in index
        //            A        [ MD]   added to index
        //            D         [ M]   deleted from index
        //            R        [ MD]   renamed in index
        //            C        [ MD]   copied in index
        //            [MARC]           index and work tree matches
        //            [ MARC]     M    work tree changed since index
        //            [ MARC]     D    deleted in work tree
        //            -------------------------------------------------
        //            D           D    unmerged, both deleted
        //            A           U    unmerged, added by us
        //            U           D    unmerged, deleted by them
        //            U           A    unmerged, added by them
        //            D           U    unmerged, deleted by us
        //            A           A    unmerged, both added
        //            U           U    unmerged, both modified
        //            -------------------------------------------------
        //            ?           ?    untracked
        //            !           !    ignored
        //            -------------------------------------------------

        var statusString = fileObject.statusString,
            type= fileObject.status,
            change = '',
            fileName = statusString.slice(3),
            statusFlags = statusString.slice(0,2), // git status --porcelain format
            statusFlagIndex = statusFlags[0],
            statusFlagWorkTree = statusFlags[1],
            statusFlag = type === 'unstaged' ? statusFlagWorkTree : statusFlagIndex;

        // for unmerged changes the status flags can be interpreted as follows:
        if (statusFlags ==="DD") change = "unmerged, deleted locally and remotely";
        else if (statusFlags ==="AU") change = "unmerged, added locally and modified remotely";
        else if (statusFlags ==="UD") change = "unmerged, modified locally and deleted remotely";
        else if (statusFlags ==="UA") change = "unmerged, modified locally and added remotely";
        else if (statusFlags ==="DU") change = "unmerged, deleted locally and modified remotely";
        else if (statusFlags ==="AA") change = "unmerged, added locally and remotely";
        else if (statusFlags ==="UU") change = "unmerged, modified locally and remotely";
        else if (statusFlag === "M") change = 'modfied';
        else if (statusFlag === "R") change = 'renamed';
        else if (statusFlag === "C") change = 'copied';
        else if (statusFlag === "A") change = 'added';
        else if (statusFlag === "D") change = 'deleted';

        if (change === 'renamed' || change === 'copied')
          fileName = fileName.split('->').last().trim();

        fileObject.change = change;
        fileObject.fileName = fileName;
        return fileObject;
    }

  },

  repoStatus: function(dir, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options; options = null;
    }
    options = options || {};

// changed at Tue Sep 24 2013 00:31:47 GMT-0700 (PDT) by undefined
this.addScript(function buildBasicInfo(thenDo) {
    /*
    this.initUpdate();
    this.buildBasicInfo(show.bind('mapping'));
    */
    var cwd = this.get('GitControlTabs').cwd,
        commands = [
        {name: "localBranch", gitCommand: "symbolic-ref HEAD", transform: function(cmd) { var out = cmd.getStdout().trim(); return out.slice(out.lastIndexOf('/')+1); }},
        {name: "rebase",      gitCommand: "config --bool branch.${localBranch}.rebase" /*--> "true"*/},
        {name: "rebaseInProgress",command: "test -d .git/rebase-merge -o -d .git/rebase-apply",  transform: function(cmd) { return cmd.getCode() === 0 }},
        {name: "mergeBranch", gitCommand: "config branch.${localBranch}.merge", transform: function(cmd) { var out = cmd.getStdout().trim(); return out.slice(out.lastIndexOf('/')+1); } /*--> "refs/heads/model-sync"*/},
        {name: "remote",      gitCommand: "config branch.${localBranch}.remote" /*--> "origin"*/},
        {name: "remoteURL",   gitCommand: "config remote.${remote}.url" /*--> "https://github.com/LivelyKernel/LivelyKernel"*/},
        {name: "head",        gitCommand: "log --max-count=1 --abbrev-commit --abbrev=7 --pretty=oneline"}];
    this.runCommandsThenDo(commands, function(mapping) {
        if (Object.isFunction(thenDo)) thenDo({
            onto:   Strings.format("Onto %s", mapping.localBranch).replace(/\n/g, ''),
            remote: Strings.format("remote: %s/%s - %s", mapping.mergeBranch, mapping.remote, mapping.remoteURL).replace(/\n/g, ''),
            local:  Strings.format("local: %s - %s", mapping.localBranch, cwd).replace(/\n/g, ''),
            head:   Strings.format("head: %s", mapping.head).replace(/\n/g, ''),
            localBranch: mapping.localBranch,
            rebaseInProgress: mapping.rebaseInProgress
        });
    })
});


// changed at Wed Apr 24 2013 12:56:33 GMT-0700 (PDT) by undefined
this.addScript(function buildStashInfo(func) {
    /*
    this.initUpdate()
    this.initUpdate(['fileInfo']);
    this.buildStashInfo(show);
    */
    var commands = [{name: "stashes", gitCommand: "stash list"}];
    this.runCommandsThenDo(commands, function(mapping) {
        var lines = mapping.stashes.trim().split('\n'),
            result = {stashes: lines};
        func(result);
    })
});

  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // committing, staging
  gitApplyFromEditor: function(action, diffEditor, options, thenDo) {
    // takes an editor with a git patch string (produced by `git diff`) and
    // figures out how to apply this patch based on the currently selected lines
    // and the state of the repo at options.cwd or the actual cwd.
    // If the editor has a selection that the patch that will be produced will
    // only for applying the selected lines.

    /*
    git.stageOrUnstageFromEditor(that, {dryRun: true}, function(err, cmds) {
      err && show(String(err));
      show(cmds.join("\n"));
    })
    */

    if (typeof options === "function") {
      thenDo = options; options = null;
    }
    options = options || {};

    lively.lang.fun.composeAsync(readFilesAndPatch, doStage)(thenDo);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function doStage(patches, n) {
      git.gitApply(action, patches, options, n);
    }

    function readFilesAndPatch(n) {
      var mode = diffEditor.getSession().getMode(),
          ed = diffEditor.aceEditor,
          hasSelection = !ed.selection.isEmpty(),
          patches;

      if (!hasSelection) {
        var patchInfo = mode.getPatchAtCursor(ed);
        patches = patchInfo && patchInfo.patch ? [patchInfo.patch] : null;
      } else {
        patches = mode.getPatchFromSelection(ed);
      }

      if (!patches) return n(new Error("Could not read patches"));

      n(null, patches);
    }
  },

  gitApply: function(action, patches, options, thenDo) {
    // action = "stage" || "unstage"
    // patches should be lively.ide.FilePatch objects

    lively.assert(action === "stage" || action === "unstage" || action === "discard" || action === "apply" || action === "reverseApply", action + " is not expected action");
    lively.assert(patches, "gitApply needs patches");

    if (typeof options === "function") {
      thenDo = options; options = null;
    }
    options = options || {};

    var args = [];
    if (action === "unstage" || action === "discard" || action === "reverseApply") args.push("--reverse");
    if (action === "stage" || action === "unstage" || action === "discard") args.push("--cached");
    var commands = [{
      name: "gitApply",
      options: {stdin: patches.invoke("createPatchString").join("\n")},
      command: "git apply " + args.join(" ") + " -"}];
    if (action === "discard") commands.push({
      name: "gitApply",
      options: {stdin: patches.invoke("createPatchString").join("\n")},
      command: "git apply --reverse -"})

    git.runCommandsThenDo(commands, options, function(err, cmds) {
      if (!err) {
          if (cmds.hasOwnProperty("gitApply") && cmds.cmdGitApply.getCode() > 0) {
            err = new Error('Could not apply patch:\n' + cmds.cmdGitApply.getStderr());
          }
      }
      thenDo && thenDo(err, patches, cmds);
    });
  },

  stageOrUnstageOrDiscardFiles: function(action, fileObjects, options, thenDo) {
    // action = "stage" || "unstage"
    // fileObjects come from git.fileStatus and should have a fileName and status property
    // patches should be lively.ide.FilePatch objects
    // EITHER fileObjects or patches are needed. patches take precdence

    lively.assert(action === "stage" || action === "unstage" || action === "discard", action + " is not expected action");
    lively.assert(fileObjects, "stageOrUnstage needs file status objects");

    if (typeof options === "function") {
      thenDo = options; options = null;
    }
    options = options || {};

    var filter;
    if (action === "stage") filter = function(fo) { return fo.status === "unstaged"; };
    if (action === "unstage") filter = function(fo) { return fo.status === "staged"; };
    if (action === "discard") filter = function(fo) { return true; };

    var cmdGroups = fileObjects.reduce(function(cmds, fo) {
      if (!filter(fo))  return cmds;
      var groups = [];
      if (action === "unstage" || action === "discard") groups.push(cmds.reset);
      if (action === "discard") groups.push(cmds.checkout);
      if ((action === "unstage" || action === "discard") && fo.status === "staged" && fo.change === 'added') groups.push(cmds.rmCached);
      if (action === "stage" && fo.status === "unstaged" && fo.change === 'deleted') groups.push(cmds.rm);
      else if (action === "stage") groups.push(cmds.add);
      groups.invoke("push", fo.fileName);
      return cmds;
    }, {checkout: [], reset: [], rmCached: [], rm: [], add: []});

    var commands = [];
    if (cmdGroups.rm.length)       commands.push({name: "rm",       gitCommand: "rm -- "          + cmdGroups.rm.join(" ")});
    if (cmdGroups.rmCached.length) commands.push({name: "rm",       gitCommand: "rm --cached -- " + cmdGroups.rmCached.join(" ")});
    if (cmdGroups.add.length)      commands.push({name: "add",      gitCommand: "add -- "         + cmdGroups.add.join(" ")});
    if (cmdGroups.reset.length)    commands.push({name: "reset",    gitCommand: "reset -- "       + cmdGroups.reset.join(" ")});
    if (cmdGroups.checkout.length) commands.push({name: "checkout", gitCommand: "checkout -- "    + cmdGroups.checkout.join(" ")});

    git.runCommandsThenDo(commands, options,
      function(err, cmds) { thenDo && thenDo(err, fileObjects, cmds); });
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  gitCommit: function(opts, thenDo) {
    opts = lively.lang.obj.merge({
      user: null, email: null, askForCommitInLively: false
    }, opts);

    lively.lang.fun.composeAsync(
      checkForUserNameAndEmail.curry(opts),
      doCommit.curry(opts)
    )(thenDo);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function commitCmd(message, author, email) {
        var cmdString = "commit";
        if (Global.Config.get('isPublicServer')) {
            author = author || $world.getUserName(true) || 'unknown-author';
            email = email || author + '@' + Global.URL.root.hostname;
            cmdString += Strings.format(' --author=\'%s <%s>\'', author, email);
        }
        if (message) cmdString += ' -m "' + message.replace(/"/g, '\\"') + '"';
        return cmdString;
    }

    function doCommit(opts, username, email, thenDo) {
        if (opts.askForCommitInLively) {
          $world.editPrompt('Please enter a commit message:',
            function(message) {
              if (!message) return thenDo('No commit message, commit aborted.');
              var commands = [{
                  name: "commit",
                  gitCommand: commitCmd(message, username, email),
                  transform: function(cmd) { cmd.code ? cmd.getStderr() : cmd.getStdout(); }
              }];
              lively.ide.git.Interface.runCommandsThenDo(commands, thenDo);
            },
            {
              textMode: 'text',
              historyId: 'lively.git.commit',
              input: "empty commit message"
            });
        } else {
          var commands = [{
              name: "commit",
              gitCommand: commitCmd(null, username, email),
              transform: function(cmd) { return cmd.code ? cmd.getStderr() : cmd.getStdout(); }
          }];
          lively.ide.git.Interface.runCommandsThenDo(commands, function(err, mapping) {
            inspect(mapping);
            thenDo && thenDo(err, mapping);
          });
        }
    }

    function checkForUserNameAndEmail(opts, thenDo) {
        if (opts.user && opts.email) {
          return thenDo(null, opts.user, opts.email);
        }

        var state = {user: null, email: null, error: null};

        [Global.Config.get('isPublicServer') ? function(next) { next(); } : testForUserAndEmail,
         askForGitUserName,
         askForGitEmail,
         Global.Config.get('isPublicServer') ? function(next) { next() } : setUserAndEmail]
         .doAndContinue(null, function() {
             thenDo(state.error, state.user, state.email); });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function testForUserAndEmail(next) {
            // is user name / email already set?
            var commands = [
                {name: "get username", gitCommand: "config --get user.name"},
                {name: "get email", gitCommand: "config --get user.email"}];
            lively.ide.git.Interface.runCommandsThenDo(commands, function(mapping) {
                var email = mapping['get email'].trim(),
                    name = mapping['get username'].trim();
                if (name.length && email.length) thenDo(null);
                else next();
            });
        }

        function askForGitUserName(next) {
            if (state.error) { next(); return; }
            $world.prompt('Git does not yet know your name. Please enter it here:', function(name) {
                if (!name || !name.length) state.error = "Missing username";
                else {
                    state.user = name;
                    lively.LocalStorage.set('GitUserName', name);
                }
                next();
            }, lively.LocalStorage.get('GitUserName') || $world.getUserName() || '');
        }

        function askForGitEmail(next) {
            if (state.error) { next(); return; }
            $world.prompt('Please also enter your email:', function(email) {
                if (!email || !email.length) state.error = "Missing email";
                else {
                    state.email = email;
                    lively.LocalStorage.set('GitUserEmail', email);
                }
                next();
            }, lively.LocalStorage.get('GitUserEmail') || '');
        }

        function setUserAndEmail(next) {
            if (state.error) { next(); return; }
            var commands = [
                {name: "set username", gitCommand: "config user.name \"" + state.user + "\""},
                {name: "set email", gitCommand: "config user.email \"" + state.email + "\""}];
            lively.ide.git.Interface.runCommandsThenDo(commands, function(mapping) { next(); });
        }
    }
  }
});

function extractedFromGitControl() {

// changed at Tue Apr 30 2013 18:52:57 GMT-0700 (PDT) by robertkrahn
this.addScript(function buildLogLines(func) {
    /*
    this.initUpdate()
    */
    var commands = [{
        name: "log",
        options: {ansiAttributeEscape: false},
        gitCommand: "log"
                  + " --graph"
                  + " --pretty=format:"
                  +   "'%Cred%h%Creset "
                  +   "-%C(green)%d%Creset "
                  +   "%C(bold)%s%Creset "
                  +   "%Cblue(%an, %ar)%Creset'"
                  + " --abbrev-commit"
                  + " --date=relative"
                  + " -n 100"
                  + " --all"}];
    this.runCommandsThenDo(commands, function(mapping) {
        var lines = mapping.log.split('\n'), result = {};
        result.logLines = lines;
        func(result);
    });
});


// changed at Tue Apr 28 2015 04:25:48 GMT-0700 (PDT) by unknown_user
this.addScript(function addDiffFor(morph) {
    var diffView = this.addCodeViewFor(morph, 'fileInfo', 'diffFor', 'preparing diff...');
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    diffView.addScript(function onKeyDown(evt) {
        var keys = evt.getKeyString();
        if (keys === 'S') {
            this.get('GitStatus').gitItemStageOrUnstage(this.getTargetMorph());
            evt.stop(); return true;
        } else if (keys === 'K') {
            this.get('GitStatus').gitItemReset(this.getTargetMorph());
            evt.stop(); return true;
        }
        return $super(evt);
    });
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    var commands = [{
        name: "diff",
        gitCommand: "diff " + (morph.fileInfo.status === 'staged' ? '--staged ' : '') + " -- " + morph.fileInfo.name
    }];

    this.runCommandsThenDo(commands, function(mapping) {
        diffView.applyStyle({textMode: 'diff'});
        diffView.textString = mapping.diff;
        diffView.resize();
        diffView.focus();
    });
    return diffView;
});

// changed at Mon Jul 08 2013 19:52:33 GMT-0700 (PDT) by robertkrahn
this.addScript(function addStashShowFor(morph) {
    var diffView = this.addCodeViewFor(morph, 'stashInfo', 'stashShowFor', 'preparing stash show...');
    var commands = [{name: "stashShowStat", gitCommand: "stash show " + morph.stashInfo.name},
                    {name: "stashShowDiff", gitCommand: "stash show -p " + morph.stashInfo.name}];
    this.runCommandsThenDo(commands, function(mapping) {
        diffView.applyStyle({textMode: 'diff'});
        diffView.textString = mapping.stashShowStat + '\n' + mapping.stashShowDiff;
        diffView.resize();
    });
    return diffView;
});

// changed at Wed Apr 24 2013 12:38:01 GMT-0700 (PDT) by undefined
this.addScript(function gitFetchRemoteChanges() {
    /*
    this. gitFetchRemoteChanges();
    */
    var builder = this;
    builder.notify('Fetching changes...');
    var commands = [{name: "fetch", gitCommand: "fetch --all -v"}];
    builder.runCommandsThenDo(commands, function(mapping) {
        var lines = mapping.fetch.split('\n'),
            msg = lines.withoutAll(lines.grep('up to date')).join('\n');
        builder.notify(msg);
    });
});

// changed at Tue Apr 23 2013 18:09:44 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitItemAdd(fileMorph) {
    var fileName = fileMorph.getFileName(),
        builder = this,
        commands = [{name: "add", gitCommand: "add " + fileName}];
    builder.runCommandsThenDo(commands, function(mapping) {
        builder.initUpdate(['cleanup', 'fileInfo']);
    });
});

// changed at Sat Nov 30 2013 20:10:59 GMT-0800 (PST) by robertkrahn
this.addScript(function gitItemReset(fileMorph) {
    var type = fileMorph.fileInfo.status, // 'staged', 'unstaged', 'untracked'
        isUnmerged = fileMorph.fileInfo.change.startsWith('unmerged'),
        fileName = fileMorph.getFileName(),
        commands = [], builder = this,
        diff = this.get('diffFor:' + fileName),
        range = diff && diff.getSelectionRange(),
        isEmpty = range && range[0] === range[1],
        modifiedPatchString;
    if (range && !isEmpty) {
        var startLine = diff.indexToPosition(range[0]).row-1,
            endLine = diff.indexToPosition(range[1]).row-1,
            patch = lively.ide.FilePatch.read(diff.textString);
        modifiedPatchString = patch.createPatchStringFromRows(startLine, endLine, true/*reverse*/);
    }
    if (type === 'staged' || isUnmerged) {
        if (modifiedPatchString) {
            commands = [{name: "gitApply", options: {stdin: modifiedPatchString}, command: "git apply -R --cached -"},
                        {name: "gitApply", options: {stdin: modifiedPatchString}, command: "git apply -R -"}];
        } else {
            commands = [{name: "reset", gitCommand: "reset " + fileName},
                        {name: "checkout", gitCommand: "checkout -- " + fileName}];
        }
    } else if (type === 'unstaged') {
        if (modifiedPatchString) {
            commands = [{name: "gitApply", options: {stdin: modifiedPatchString}, command: "git apply -R -"}];
        } else {
            commands = [{name: "checkout", gitCommand: "checkout -- " + fileName}];
        }
    } else if (type === 'untracked') {
        commands = [{name: "clean", gitCommand: "clean -f " + fileName}];
    }
    this.runCommandsThenDo(commands, function(mapping) {
        if (mapping.hasOwnProperty("gitApply")) {
            if (mapping.cmdGitApply.getCode() > 0) show('Could not apply patch: %s' + mapping.cmdGitApply.getStderr());
            else builder.initUpdate(['fileInfo']);
        } else {
            builder.initUpdate(['cleanup', 'fileInfo']);
        }
    });
});

// changed at Fri Aug 16 2013 18:20:01 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitItemStashAction(action, stashMorph, force) {
    if (!action) return;
    var stashName = stashMorph.getStashName(), builder = this;
    if (action === 'drop' && !force) {
        var query = Strings.format('Do you really want to remove %s?', stashName);
        $world.confirm(query, function(answer) {
            answer && builder.gitItemStashAction(action, stashMorph, true); });
        return;
    }
    var commands = [{name: "stashAction", gitCommand: ["stash", action, stashName]}];
    builder.runCommandsThenDo(commands, function(mapping) { builder.initUpdate(); });
});

// changed at Sat Apr 27 2013 04:14:53 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitItemStashPopOrApply(popOrApply, stashMorph) {
    if (!popOrApply) return;
    var stashName = stashMorph.getStashName(),
        builder = this,
        commands = [{name: "stashPopOrAply", gitCommand: ["stash", popOrApply, stashName]}];
    builder.runCommandsThenDo(commands, function(mapping) {
        builder.initUpdate(); });
});

// changed at Tue Apr 23 2013 23:54:41 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitPullRemoteChanges() {
    var builder = this;
    builder.notify('Pulling changes...');
    var commands = [{name: "pull", gitCommand: "pull --rebase"}];
    builder.runCommandsThenDo(commands, function(mapping) {
        builder.notify(mapping.pull);
    });
});

// changed at Tue Jul 15 2014 00:41:06 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitPushCurrentBranch() {
    var builder = this, world = this.world(),
        branchName, setUpstream = false, remote, askPassScriptFile;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    builder.notify('Pushing changes...');
    [localBranchInfo, findRemote, push].doAndContinue();
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function localBranchInfo(thenDo) {
        builder.runCommandsThenDo([
            {name: "localBranch", gitCommand: "symbolic-ref HEAD",
             transform: function(cmd) {
                var out = cmd.getStdout().trim();
                return out.slice(out.lastIndexOf('/')+1); }},
            {name: "remote",      gitCommand: "config branch.${localBranch}.remote" /*--> "origin"*/}],
            function(mapping) {
                branchName = mapping.localBranch.trim();
                remote = mapping.remote.trim();
                thenDo();
            });
    }

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function findRemote(thenDo) {
        if (branchName.length === 0) {
            builder.notify('Cannot pull because you are not on a local branch'); return;
        }
        if (remote.length > 0) {
            thenDo(); return;
        }
        builder.runCommandsThenDo([{name: "remotes", gitCommand: "remote -v"}], function(mapping) {
            // output like
            // origin    https://github.com/LivelyKernel/LivelyKernel (fetch)
            // origin	https://github.com/LivelyKernel/LivelyKernel (push)"
            var remotes = mapping.remotes.split('\n').map(function(string) {
                if (string.length === 0 || string.match(/\(fetch\)$/)) return;
                var parts = string.split(/\s+/);
                return {name: parts[0], url: parts[1]};
            }).compact();
            world.listPrompt(
                Strings.format('Branch %s does not track a remote.\n'
                             + 'Please choose one from the list below to continue.', branchName),
                function(choice) {
                    if (!choice || choice.length === 0 || !choice.name) {
                        builder.notify('No remote selected. Aborting push.'); return;
                    }
                    setUpstream = true; // FIXME offer choice?
                    remote = choice.name;
                    thenDo();
                }, remotes.map(function(remote) {
                    return {
                        isListItem: true,
                        string: remote.name + ' (' + remote.url + ')',
                        value: remote
                    };
                }), 'origin', pt(350,140));
        });
    }

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function push(thenDo) {
        builder.runCommandsThenDo([{
            name: "push",
            gitCommand: "push " + (setUpstream ? '--set-upstream ' : '') + remote + ' ' + branchName,
            transform: function(cmd) { return (cmd.getStdout() + ' ' + cmd.getStderr()).trim(); }
        }], function(mapping) {
            builder.notify("Push: " + mapping.push);
            thenDo();
        });
    }
});

// changed at Sat Apr 27 2013 04:14:53 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitRebase(action) {
    // action = ["continue"|"skip"|"abort"]
    var builder = this,
        commands = [{name: "rebase", gitCommand: "rebase --" + action}];
    builder.runCommandsThenDo(commands, function(mapping) {
        builder.initUpdate(null, function() {
            builder.notify.bind(builder, Strings.format('rebase %s:\n%s', action, mapping.rebase)).delay(0.7);
        });
    });
});

// changed at Wed Apr 24 2013 00:23:27 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitStageAll() {
    var builder = this,
        files = builder.findItems(function(item) { return item.fileInfo && item.getFileName && item.fileInfo.status === 'unstaged'}).invoke('getFileName'),
        commands = [{name: "add", gitCommand: "add -- " + files.join(' ')}];
    builder.runCommandsThenDo(commands, function(mapping) {
        builder.initUpdate(['cleanup', 'fileInfo']);
    });
});

// changed at Wed Apr 24 2013 15:56:42 GMT-0700 (PDT) by undefined
this.addScript(function gitStashChanges() {
    var builder = this,
        commands = [{name: "stash", gitCommand: "stash save"}];
    builder.runCommandsThenDo(commands, function(mapping) { builder.initUpdate(); });
});

// changed at Sun Apr 28 2013 00:05:14 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitSwitchBranch() {
    var builder = this,
        branchHandler = {
            commands: [{name: "branchList", isExec: true, command: 'git --no-pager branch --no-color | grep -v "*" | xargs -I BRANCH git --no-pager log -n 1 --format="BRANCH %ci" BRANCH -- '}],
            initFromCommands: function(mapping) {
                this.branches = this.getBranchList(mapping.branchList, {sortByLastChangeDate: true});
            },
            getBranchList: function(cmdOutput, options) {
                var branches = cmdOutput.split('\n').invoke('trim')
                    .map(function(line) {
                        var match = line.match(/([^\s]+)\s(.*)/);
                        return match && {name: match[1], date: new Date(match[2])}; })
                    .compact();
                if (options.sortByLastChangeDate) {
                    branches = branches.sortBy(function(ea) { return +ea.date; }).reverse();
                }
                return branches;
            },
            changeBranch: function(branch) {
                builder.runCommandsThenDo([{name: 'checkout', gitCommand: 'checkout ' + branch.name}], function(result) {
                    builder.initUpdate(function() {
                        builder.notify.bind(builder, result.checkout).delay(1);
                    });
                });
            },
            createBranch: function() {
                var w = builder.world();
                w.prompt('Name of the new branch', function(name) {
                    if (!name || name.length === 0) {
                        w.addFlapWithMorph(morph, alignment)
                        w.confirm(Strings.format('%s is not a valid branch name. No branch created.'));
                        return;
                    }
                    builder.runCommandsThenDo([{name: 'branch', gitCommand: 'branch ' + name + ' HEAD'},
                                               {name: 'checkout', gitCommand: 'checkout ' + name}], function(result) {
                        builder.initUpdate(null, function() {
                            var msg = (result.branch + '\n' + result.checkout).trim();
                            if (msg.length > 0) builder.notify.bind(builder, msg).delay(1);
                        });
                    });
                })
            },
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            getMenuItemsBranchList: function() {
                var items = this.branches.map(function(branch) {
                    return [branch.name, this.changeBranch.bind(this, branch)]; }, this),
                newest = items.slice(0,10),
                oldest = items.slice(10);
                // we just show the 10 recently changed branches
                if (oldest.length > 0) newest.push(['more...', oldest]);
                return newest;
            },
            getMenuItems: function() {
                return [
                    ['create branch', this.createBranch.bind(this)],
                    ['change branch...', this.getMenuItemsBranchList()]];
            },
            openMenu: function() {
                return lively.morphic.Menu.openAtHand('Choose branch', this.getMenuItems());
            }
    }

    this.runCommandsThenDo(branchHandler.commands, function(mapping) {
        branchHandler.initFromCommands(mapping);
        branchHandler.openMenu();
    });
});

// changed at Wed Apr 24 2013 00:24:40 GMT-0700 (PDT) by robertkrahn
this.addScript(function gitUnStageAll() {
    var builder = this,
        files = builder.findItems(function(item) { return item.fileInfo && item.getFileName && item.fileInfo.status === 'staged'}).invoke('getFileName'),
        commands = [{name: "reset", gitCommand: "reset -- " + files.join(' ')}];
    builder.runCommandsThenDo(commands, function(mapping) {
        builder.initUpdate(['cleanup', 'fileInfo']);
    });
});

// changed at Sun Nov 02 2014 01:00:05 GMT-0700 (PDT) by run_tests-137
this.addScript(function initUpdate(steps, thenDo) {
    /*
    this.initUpdate(['basicInfo', 'fileInfo']);
    this.initUpdate(['basicInfo']);
    this.initUpdate(['cleanup', 'basicInfo']);
    this.initUpdate(['fileInfo']);
    this.initUpdate(null, show.curry('test'));
    this.initUpdate();
    builder=this
    builder.removeAllMorphs();
    builder.buildText('test', {fontSize: 16});
    builder.buildText('test2', {fontSize: 16});
            this.findItems(function(item) { return item.basicInfo; })
            this.submorphs.select(function(item) { return item; })
    */
    var builder = this;
    var defaultSteps = ['cleanup', 'basicInfo', 'stashes', 'fileInfo'];
    thenDo = (Object.isFunction(thenDo) && thenDo) || (Object.isFunction(steps) && steps) || null;
    steps = steps && !Object.isFunction(steps) ? steps : defaultSteps;
    var availableSteps = {
        cleanup: function(next) {
            builder.findItems(function(item) { return item.name && item.name.startsWith('diffFor:'); }).invoke('remove');
            next();
        },
        basicInfo: function(next) {
            builder.findItems(function(item) { return item.basicInfo; }).invoke('remove');
            builder.buildBasicInfo(function(result) {
                builder.buildReset();
                builder.buildMoveTo(0);
                builder.buildSet({basicInfo: result.onto});
                builder.buildSpacer(5);
                if (result.rebaseInProgress) {
                    builder.buildText("Rebase in progress", {fontSize: 12, textColor: Global.Color.red}).gitActions = [
                        {name: 'continue', targetMethod: 'gitRebase', args: ['continue'], buttonWidth: 60},
                        {name: 'skip', targetMethod: 'gitRebase', args: ['skip'], buttonWidth: 60},
                        {name: 'abort', targetMethod: 'gitRebase', args: ['abort'], buttonWidth: 60}];
                } else {
                    builder.buildText(result.onto, {fontSize: 12}).gitActions = [
                        {name: 'switch branch', targetMethod: 'gitSwitchBranch', args: [], buttonWidth: 95},
                        {name: 'fetch', targetMethod: 'gitFetchRemoteChanges', args: [], buttonWidth: 55},
                        {name: 'pull', targetMethod: 'gitPullRemoteChanges', args: [], buttonWidth: 55},
                        {name: 'push', targetMethod: 'gitPushCurrentBranch', args: [], buttonWidth: 55}];
                    builder.buildText(result.remote, {padding: lively.Rectangle.inset(8,0,0,0)});
                }
                builder.buildText(result.local, {padding: lively.Rectangle.inset(8,0,0,0)});
                builder.buildText(result.head, {padding: lively.Rectangle.inset(8,0,0,0)});
                builder.buildSpacer(10);
                next();
            });
        },

        fileInfo: function(next) {
            var diffs = builder.findItems(function(item) { return item.name && item.name.startsWith('diffFor:'); });

            builder.findItems(function(item) { if (item.fileInfo) item.outdated = true; });
            builder.buildFileInfo(function(result) {
                var stashItems = builder.findItems(function(item) { return item.stashInfo; });
                var index = stashItems && stashItems.last() ? stashItems.last().index : 6;
                builder.buildReset();
                builder.buildMoveTo(index+1);

                if (result.unstaged.length > 0) {
                    builder.buildSet({fileInfo: {status: 'unstaged'}});
                    builder.buildText('Unstaged changes:', {fontSize: 11}).gitActions = [
                        {name: 'stage all', targetMethod: 'gitStageAll', args: [], buttonWidth: 85}];
                    result.unstaged.forEach(builder.buildFileChange.bind(builder, 'unstaged'));
                    builder.buildSpacer(10);
                }

                if (result.staged.length > 0) {
                    builder.buildSet({fileInfo: {status: 'staged'}});
                    builder.buildText('Staged changes:', {fontSize: 11}).gitActions = [
                        {name: 'commit', targetMethod: 'gitCommit', args: [], buttonWidth: 85},
                        {name: 'unstage all', targetMethod: 'gitUnStageAll', args: [], buttonWidth: 85}];
                    result.staged.forEach(builder.buildFileChange.bind(builder, 'staged'));
                    builder.buildSpacer(10);
                }

                if (result.untracked.length > 0) {
                    builder.buildSet({fileInfo: {status: 'untracked'}});
                    builder.buildText('Untracked files:', {fontSize: 11});
                    result.untracked.forEach(builder.buildFileChange.bind(builder, 'untracked'));
                }

                diffs.forEach(function(diff) {
                    var fileMorph = diff.getTargetMorph();
                    if (fileMorph) { builder.gitItemToggleDiff(fileMorph); }
                });

            });
            builder.findItems(function(item) { return !!item.outdated; }).invoke('remove');
            next();
        },
        stashes: function(next) {
            builder.findItems(function(item) { return item.stashInfo; }).invoke('remove');
            builder.buildStashInfo(function(result) {
                builder.buildReset();
                var basicInfoItems = builder.findItems(function(item) { return !!item.basicInfo; })
                var index = basicInfoItems && basicInfoItems.last() ? basicInfoItems.last().index : 6;
                builder.buildMoveTo(index+1);
                builder.buildSet({stashInfo: {}});
                builder.buildText("Stashes", {fontSize: 12}).gitActions = [
                    {name: 'Stash changes', targetMethod: 'gitStashChanges', args: [], buttonWidth: 95}
                ];
                result.stashes.forEach(function(stashString) {
                    var stashMatch = stashString.match(/^\s*(stash@\{([0-9]+)\}):\s*(.*)/);
                    if (!stashMatch) {console.warn('Could not create stash item for %s', stashString); return; }
                    var stashName = stashMatch[1], stashNo = stashMatch[2], stashInfo = stashMatch[3];
                    var m = builder.buildText(stashNo + ': ' + stashInfo, {padding: lively.Rectangle.inset(8,0,0,0)});
                    m.stashInfo = {name: stashName};
                    m.name = stashName;
                    m.addScript(function getStashName() { return this.stashInfo.name; });
                    m.gitActions = [
                        {name: 'show', targetMethod: 'gitItemToggleShowStash', args: [m], buttonWidth: 50},
                        {name: 'apply', targetMethod: 'gitItemStashAction', args: ['apply', m], buttonWidth: 50},
                        {name: '  x', targetMethod: 'gitItemStashAction', args: ['drop', m], buttonWidth: 22}];
                });
                builder.buildSpacer(10);
                next();
            });
        }
    }

    builder.isInLayoutCycle = true;
    steps.map(function(step) { return availableSteps[step] }).doAndContinue(null, function() {
        builder.isInLayoutCycle = false;
        thenDo && thenDo();
        builder.applyLayout();
    });
});

}

}) // end of module
