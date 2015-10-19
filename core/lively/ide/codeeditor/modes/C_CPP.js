module('lively.ide.codeeditor.modes.C_CPP').requires('lively.ide.codeeditor.ace', 'lively.ide.CommandLineInterface', 'lively.ide.codeeditor.MorphicOverlay').toRun(function() {

/*

We are currently requiring clang + cmake. Some features like completion are
based on rtags: https://github.com/Andersbakken/rtags, rc --help

When compiling add source meta DB like via
  cd build; cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=1 ..; make
  
In cpp files the interactive commands below are available. Direct API like:

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var fmt = lively.lang.string.format

var editor = that;
var ed = that.aceEditor

var file = ed.$morph.getTargetFilePath();
var pos = ed.getCursorPosition()

var args = ['--symbol-info']
var args = [fmt('--follow-location=%s:%s:%s', file, pos.row+1, pos.column)]
var args = ['--find-project-build-root', "/usr/local/Cellar/opencv/2.4.12/include/opencv2/highgui/highgui_c.h"]
var args = ["--diagnose", "/usr/local/Cellar/opencv/2.4.12/include/opencv2/highgui/highgui_c.h"]
var args = ["--current-project"]
var args = ["--fixit", file]
var args = ['--references-name', "CV_WINDOW_AUTOSIZE"]
var args = ['--find-symbols', "CV_WINDOW_AUTOSIZE"]
var args = ['--list-symbols', "CV_WINDOW"]
var args = [fmt('--symbol-info=%s:%s:%s', file, pos.row+1, pos.column+1)]

lively.ide.codeeditor.modes.C_CPP.RTags.runRtagsUnsavedFile(
  args, file, ed.getValue(),
  function(err, result) { show(err ? "error:" + String(err) : result); })

RTags.getCompletions(ed.getValue(), file, pos, function(err, compl) { Global.comletions = compl; })

lively.ide.codeeditor.modes.C_CPP.RTags.runRtags(
  args, {},
  function(err, result) { show(err ? "error:" + String(err) : result); })

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Run rtags:

cd! $HOME/Projects/
git clone https://github.com/Andersbakken/rtags;
cd! rtags
git submodule init; git submodule update

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
rm -rf build
mkdir build;
cd build;
CLANG_ROOT="/usr/local/Cellar/llvm/3.6.2" \
LLVM_CONFIG="/usr/local/Cellar/llvm/3.6.2/bin/llvm-config" \
cmake -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_EXPORT_COMPILE_COMMANDS=1 \
    -DCMAKE_INSTALL_PREFIX=$HOME/usr/local ..
make install
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
rdm &
rc -J build # code database dir

rc --help

*/

var fmt = lively.lang.string.format;

Object.extend(lively.ide.codeeditor.modes.C_CPP, {

  ensureLogWindow: function(options) {
    options = lively.lang.obj.merge({
      activateWindow: false,
      name: "c_cpp.compile-log",
      buildCommand: null
    }, options);

    var existing = $world.submorphs.detect(function(ea) {
      return ea.isWindow
          && ea.targetMorph.name === options.name
          && !ea.targetMorph.state.isRunning;
    });

    var ed;

    if (existing) {
      if (existing.isCollapsed()) existing.expand();
      ed = existing.targetMorph;
    } else {
      var ed = $world.addCodeEditor({
        name: options.name,
        extent: pt(700, 400),
        textMode: "text",
        title: "build log for " + options.buildDir,
        content: "",
      });
    }

    if (!existing || (options.activateWindow && !ed.getWindow().isActive()))
      ed.getWindow().comeForward();

    ed.addScript(function onBuildStart(buildCmd) {
      this.textString = "";
      this.state.isRunning = true;
      this.state.currentCommand = buildCmd;
      lively.bindings.connect(buildCmd, 'stdout', this, 'onBuildUpdate');
      lively.bindings.connect(buildCmd, 'stderr', this, 'onBuildUpdate');
      lively.bindings.connect(buildCmd, 'end', this, 'onBuildEnd');
    });

    ed.addScript(function onBuildUpdate(newBuildOutput) {
      var pos = this.state.lastInsertionPos;
      var lines = newBuildOutput.split("\n");
      var endPos = {column: lines.last().length, row: pos.row + lines.length};
      if (endPos.column = endPos.row) endPos.column += pos.column;
      var delta = {
        action: "insert",
        lines: lines,
        start: pos,
        end: endPos
      };
      this.withAceDo(function(ed) {
        ed.session.doc.applyDelta(delta, true);
        ed.selection.moveCursorFileEnd();
        ed.renderer.scrollCursorIntoView();
        this.state.lastInsertionPos = ed.selection.getCursor();
      });
    });

    ed.addScript(function onBuildEnd(buildCmd) {
      this.state.isRunning = false;
      this.state.currentCommand = null;
    });

    ed.options = options;
    ed.state = {
      isRunning: false,
      currentCommand: null,
      lastInsertionPos: {row: 0, column: 0}
    }

    if (options.buildCommand) {
      ed.onBuildStart(options.buildCommand);
    }

    return ed;
  },

  _withCMakeBuildDirDo: function(options, doFunc) {
    options = lively.lang.obj.merge({
      buildDir: "build/"
    }, options);

    var isAbsBuildDir = options.buildDir.startsWith("/") || options.buildDir.match(/[a-z]:/i);

    lively.lang.fun.composeAsync(
      isAbsBuildDir ?
        function(n) { return n(null, options.buildDir); } :
        function(n) {
          lively.shell.cwd(function(err, cwd) { n(err, lively.lang.string.joinPath(cwd, options.buildDir)); });
        }
    )(doFunc);
  },

  _findExecutables: function(options, doFunc) {
    lively.lang.fun.composeAsync(
      lively.ide.codeeditor.modes.C_CPP._withCMakeBuildDirDo.curry(options),
      function(cwd, n) { lively.shell.run("find " + cwd + " -type f -perm +111 -maxdepth 3 -print", {}, n); },
      function(cmd, n) {
        var files = lively.lang.string.lines(cmd.getStdout());
        var filtered = files
          .filter(function(f) {
            f = f.trim();
            return f && !f.endsWith(".bin")
                && !f.endsWith(".out") &&
                !f.include("CMakeScripts")
                && !f.include("CMakeFiles");
          })
          .map(function(f) { return f.replace(/\/\//g, "/"); });
        n(null, filtered);
      }
    )(doFunc);
  },

  interactivelyRunExecutable: function(options, doFunc) {
    options = lively.lang.obj.merge({askForExecutable: false}, options);

    lively.lang.fun.composeAsync(
      lively.ide.codeeditor.modes.C_CPP._findExecutables.curry(options),

      options.askForExecutable ?
        function(files, n) {
          lively.ide.tools.SelectionNarrowing.chooseOne(
            files, n, {name: "lively.ide.codeeditor.modes.C_CPP.run-executable"});
        } : function(files, n) { n(null, files[0]); },

      function(execFile, n) {
        var m = module("lively.ide.tools.ShellCommandRunner");
        if (m.isLoaded()) n(null, execFile);
        else require(m.namespaceIdentifier).toRun(function() { n(null,execFile); });
      },

      function(execFile, n) {
        var runnerName = "shell-command-runner-for-" + execFile, runner;
        if ($morph(runnerName) && !$morph(runnerName).currentCommand) {
          runner = $morph(runnerName);
          runner.runCommand(execFile);
        } else {
          runner = lively.ide.tools.ShellCommandRunner.run(execFile);
          runner.name = runnerName;
        }
        n(null, runner); }
    )(doFunc);
  },

  buildCmakeProject: function(args, options, thenDo) {
    options = lively.lang.obj.merge({
      showLogWindow: true,
      buildDir: "build/",
      useXCode: false
    }, options);

    var isAbsBuildDir = options.buildDir.startsWith("/") || options.buildDir.match(/[a-z]:/i);
    var baseCommand;

    if (options.useXCode) {
      args = [
        "-G", "Xcode",
        "-DCMAKE_BUILD_TYPE=Debug",
        "-DCMAKE_EXPORT_COMPILE_COMMANDS=1",
      ].concat(args);
      baseCommand = "cmake %s ..; xcodebuild -target LiveTable -configuration DEBUG build";
    } else {
      args = [
        "-DCMAKE_BUILD_TYPE=Debug",
        "-DCMAKE_EXPORT_COMPILE_COMMANDS=1",
      ].concat(args);
      baseCommand = "cmake %s ..; make";
    }

    lively.lang.fun.composeAsync(
      lively.ide.codeeditor.modes.C_CPP._withCMakeBuildDirDo.curry(options),
      function runBuild(cwd, n) {
        var cmdString = fmt(baseCommand, args.join(" ")),
            cmd = lively.shell.run(cmdString, {cwd: cwd});
        n(null, cmd);
      },

      options.showLogWindow ?
        function(cmd, n) {
          var log = lively.ide.codeeditor.modes.C_CPP.ensureLogWindow(lively.lang.obj.merge(options, {buildCommand: cmd}));
          n(null, cmd);
        } : function(cmd, n) { n(null, cmd) }
    )(thenDo);
  },

  cleanCmakeProject: function(options, thenDo) {
    options = lively.lang.obj.merge({prompt: true, showLogWindow: true, buildDir: "build/"}, options);

    lively.lang.fun.composeAsync(
      lively.ide.codeeditor.modes.C_CPP._withCMakeBuildDirDo.curry(options),

      options.prompt ?
        function(cwd, n) {
          $world.confirm("Really clean " + cwd + "?", function(input) {
            n(input ? null : "clean canceled", cwd);
          })
        } : function(cwd, n) { n(null, cwd); },

        function runClean(cwd, n) {
          var cmdString = 'rm -rf *; echo "Cleaned `pwd`."',
              cmd = lively.shell.run(cmdString, {cwd: cwd});
          n(null, cmd);
        },

      options.showLogWindow ?
        function(cmd, n) {
          var log = lively.ide.codeeditor.modes.C_CPP.ensureLogWindow(lively.lang.obj.merge(options, {buildCommand: cmd}));
          n(null, cmd);
        } : function(cmd, n) { n(null, cmd) },
      
      function(cmd, n) {
        lively.bindings.once(cmd, 'end', {next: function() { n(null, cmd); }}, 'next');
      }
    )(thenDo);
  },

  openDefinition: function(file, pos, content, thenDo) {
    if (typeof content === "function") { thenDo = content; content = null; }
    lively.lang.fun.composeAsync(
      function(n) { ns.RTags.symbolInfoAtPos(file, pos, content, n); },
      function(info, n) {
        if (!info) return n(new Error("Cannot find definition"));
        var ed = lively.ide.allCodeEditors().detect(function(ea) {
          return ea.getTargetFilePath && ea.getTargetFilePath() === info.file && ea.name !== "urlText";
        });

        if (ed) {
          var win = ed.getWindow();
          if (win && win.isCollapsed()) {
            win.expand();
            (function() { n(null, info, ed); }).delay(.1);
            return;
          }
          if (win) win.comeForward();
          n(null, info, ed)
        }
        else lively.ide.openFile(info.file, function(edWindow) {
          edWindow.getWindow().openInWorldCenter();
          lively.bindings.once(
            edWindow, 'contentLoaded',
            {next: function() { n(null, info, edWindow.get("editor")); }}, 'next');
        });
      },
      function(info, ed, n) {
        ed.withAceDo(function(e) {
          e.gotoLine(info.row, info.column-1, true);
          n(null, ed);
        });
      }
    )(thenDo);
  },

  checkCompile: function(file, fileContent, options, thenDo) {

    lively.lang.fun.composeAsync(
      compileCheckAndHighlight.curry(file, fileContent),
      function(cmd, n) { n(null, cmd.getStderr()); },
      parseErrors
    )(thenDo);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function compileCheckAndHighlight(file, fileContent, thenDo) {
      lively.ide.codeeditor.modes.C_CPP.Clang.runFileSpecificCommand(
        file,
        ["-fsyntax-only", "-fdiagnostics-print-source-range-info", "-fdiagnostics-parseable-fixits", "-Wformat", "-x", "c++", "-"],
        {stdin: fileContent}, thenDo);
    }

    function parseErrors(compilerOut, thenDo) {
      var lines = lively.lang.string.lines(compilerOut);
      var errors = [];
      var fixits = [];
      var errStartRe = /^([^:]+):(([0-9]+):([0-9]+):)?(\{([0-9]+):([0-9]+)-([0-9]+):([0-9]+)\}:)?\s*([^:]+): (.*)/;
      var fixitRe = /^(?:fix-it:)?([^:]+):(\{([0-9]+):([0-9]+)-([0-9]+):([0-9]+)\}:)?(.*)/;
      for (var i = 0, lastError; i < lines.length; i++) {
        // var i = 4;
        if (lines[i].match(/generated\.$/)) continue;
        var errMatch = lines[i].match(errStartRe);
        var fixitMatch = !errMatch && lines[i].match(fixitRe);
        if (!errMatch && !fixitMatch) {
          if (lastError) {
            lastError.longMessage = (lastError.longMessage || "") + "\n" + lines[i];
          }
          continue;
        } else if (errMatch) {
          lastError = {
            file: errMatch[1],
            row: Number(errMatch[3])-1,
            column: Number(errMatch[4])-1,
            range: errMatch[5] ? {
              start: {row: Number(errMatch[6])-1, column: Number(errMatch[7])-1},
              end: {row: Number(errMatch[8])-1, column: Number(errMatch[9])-1}} : null,
            type: errMatch[10],
            message: errMatch[11]
          };
          errors.push(lastError);
          if (lastError.range && !lastError.range.start.row) debugger;
        } else if (fixitMatch) {
          lastError = {
            file: fixitMatch[1],
            range: fixitMatch[2] ? {
              start: {row: Number(fixitMatch[3])-1, column: Number(fixitMatch[4])-1},
              end: {row: Number(fixitMatch[5])-1, column: Number(fixitMatch[6])-1}} : null,
            type: "fixit",
            message: fixitMatch[7]
          };
          fixits.push(lastError);
        }
      }
      thenDo(null, errors);
    }

  },
  
  showErrorOverlays: function(editor, parsedErrors, thenDo) {
    (editor.morphicOverlays || [])
      .filter(function(o) { return o.state.isClangError; })
      .forEach(function(o) { editor.morphicOverlaysRemove(o); })
    parsedErrors.forEach(function(parsedError) {
      var range = parsedError.range ? 
        editor.createRange(parsedError.range.start, parsedError.range.end) :
        editor.createRange({row: parsedError.row, column: parsedError.column-1}, {row: parsedError.row, column: parsedError.column});
      var overlay = editor.morphicOverlayCreate()
      overlay.setAtRange(editor, range)
      overlay.setLabelString(editor, parsedError.message);
      overlay.state.isClangError = true;
    });
    thenDo(null, parsedErrors);
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  showCompletionNarrower: function(editor, options) {
    // editor = that
      var file = editor.getTargetFilePath();
      // var pos = editor.aceEditor.getCursorIndex();
      var pos = editor.aceEditor.getCursorPosition();
      var src = editor.textString;
      var term = editor.find({needle: /(\.|\s)/g, backwards: true, preventScroll: true, inbetween: true, asString: true})

      term = term.replace(/^(\.|\s)/, "");

      lively.lang.fun.composeAsync(
        ns.RTags.getCompletions.curry(src, file, pos),
        // function(n) { ns.ClangCC1Completer.getCcompletions(editor.aceEditor, editor.getSession(), pos, term, n); },
        createCandidates,
        openNarrower
      )(handlerError)

      return true;
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      function handlerError(err) {
        if (err) {
          var msg = "Completion error: " + String(err);
          editor.showError(msg);
        }
      }

      function createCandidates(aceCompletions, thenDo) {
        var maxNameLength = 0;
        var displaySpec = aceCompletions.map(function(c) {
          var val = c.value, docString = c.name + " [" + c.type + "]";
          var doc = docString.trim() || "";
          maxNameLength = Math.max(maxNameLength, doc.length);
          return {insertion: c.valueWithArgs, doc: doc};
        });

        var candidates = displaySpec.map(function(ea) {
          var string = lively.lang.string.pad(ea.doc, maxNameLength+1 - ea.doc.length)
          return {isListItem: true, string: string, value: ea};
        });

        thenDo(null, candidates)
      }


      function openNarrower(candidates, thenDo) {
        var n = lively.ide.tools.SelectionNarrowing.getNarrower({
          name: "lively.ide.codeEditor.c_cpp.completion-narrower",
          spec: {
            input: term,
            candidates: candidates,
            actions: [
              function insert(candidate) {
                // var slice = candidate.insertion.slice(candidate.insertion.indexOf(term)+term.length);
                // var slice = candidate.insertion;
                editor.collapseSelection("end");
                this.find
                var range = editor.find({needle: term, backwards: true, preventScroll: true, inbetween: true, start: editor.getCursorPositionAce()})
                if (range) editor.replace(range, candidate.insertion);
                else editor.insertAtCursor(candidate.insertion, false);
              }
            ]
          }
        });
        thenDo && thenDo(null, n);
      }
  }

});

var ns = lively.ide.codeeditor.modes.C_CPP;

var Navigator = {

    backwardSexp: function(ed) {
      // ed.moveCursorToPosition(target);
    },

    forwardSexp: function(ed) {},

    backwardUpSexp: function(ed) {},

    forwardDownSexp: function(ed) { show("Not yet implemented"); },

    expandRegion: function(ed, src, ast, expandState) {

      var newRange = this.findContainingHunkOrPatchRange(ed, ed.getSelectionRange());
      if (!newRange) return expandState;

      return {
          range: [
            ed.posToIdx(newRange.start),
            ed.posToIdx(newRange.end)],
          prev: expandState
      }

      var startIdx = expandState.range[0];
      var endIdx = expandState.range[1];
      var start = ed.idxToPos(startIdx);
      var end = ed.idxToPos(endIdx);
      var newExpandRange = [];

      ed.saveExcursion(function(reset) {
        ed.clearSelection();
        ed.moveCursorToPosition(start);
        this.backwardSexp(ed);
        newExpandRange[0] = ed.posToIdx(ed.getCursorPosition());
        ed.moveCursorToPosition(end);
        this.forwardSexp(ed);
        newExpandRange[1] = ed.posToIdx(ed.getCursorPosition());
        reset();
      }.bind(this));

      if (startIdx === endIdx) {
        // ...
      } else {
        if (newExpandRange[0] < startIdx) newExpandRange[1] = endIdx;
        else if (newExpandRange[1] > endIdx) newExpandRange[0] = startIdx;
        else return expandState;
      }

      return {
          range: newExpandRange,
          prev: expandState
      }

    },

    contractRegion: function(ed, src, ast, expandState) { return expandState.prev || expandState; }

};

lively.ide.codeeditor.modes.Diff.Navigator = Navigator;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

ns.RTags = {

  symbolInfoAtPos: function(file, pos, content, thenDo) {
    // var file = that.getTargetFilePath();
    // var pos = that.aceEditor.getCursorPosition();
    // var content = that.aceEditor.getValue(); thenDo = function(err, info) { show(info); };

    var args = [fmt('--follow-location="%s:%s:%s"', file, pos.row+1, pos.column+1)];

    lively.lang.fun.composeAsync(
      function(n) {
        if (content) ns.RTags.runRtagsUnsavedFile(args, file, content, {}, n);
        else ns.RTags.runRtags(args, {}, n);
      },
      function parse(result, n) {
        result = result.trim();
        if (!result.length) return n(new Error("No info for " + file + ":" + pos.row));
        var match = result.match(/([^:]+):([^:]+):([^:]+):\s*(.*)/);
        if (!match) return n(new Error("Cannot parse symbol info for " + file + ":" + pos.row + ":" + result));
        n(null, {
          file: match[1], row: Number(match[2]), column: Number(match[3]),
          content: match[4]
        });
      },
      function(info, n) {
        if (!info.file || info.file.startsWith("/") || info.file.match(/^[a-z]:/i)) { n(null, info); }
        else {
          ns.RTags.runRtags(["--current-project"], {}, function(err, out) {
            info.file = lively.lang.string.joinPath(out.trim(), info.file);
            n(null, info);
          });
        }
      })(thenDo);

  },

  getCompletions: function(content, file, pos, thenDo) {
    lively.lang.fun.composeAsync(
      function invokeRc(n) {
        ns.RTags.runRtagsUnsavedFile(
          [fmt('--code-complete-at="%s:%s:%s"', file, pos.row+1, pos.column+1),
          "--synchronous-completions"],
            file, content, n);
      },
      
      function parse(out, n) {
        var startTag = "<![CDATA[", endTag = "]]>";

        var content = out.slice(out.indexOf(startTag) + startTag.length, out.lastIndexOf(endTag));

        var completions = lively.lang.string.lines(content).invoke("trim").map(function(line, i) {
          // lines like
          // delete void delete [] expression NotImplemented
          // CascadeClassifier CascadeClassifier() CXXConstructor
          // argc int argc ParmDecl
          // Mat Mat(const CvMatND *m) CXXConstructor
          // tm tm:: StructDecl
          // sa_sigaction sa_sigaction macro definition
          // __SIGN __SIGN macro definition
          // CV_BGR2RGB enum <anonymous> CV_BGR2RGB EnumConstantDecl
          // cvPutText void cvPutText(CvArr *img, const char *text, CvPoint org, const CvFont *font, CvScalar color) FunctionDecl
          // static_cast static_cast<type>(expression) NotImplemented
          var match = line && line.match(/([^\s]+)\s+(.*)\s+([^\s]+)/);
          var type = match[3];
          var value = match[1];
          var name = match[2];
          var valueWithArgs = name;
           // remove return type and stuff
          if (type === "EnumConstantDecl") {
            valueWithArgs = value;
          }
          if (type === "FieldDecl") {
            valueWithArgs = valueWithArgs.slice(valueWithArgs.indexOf(" ")).trim();
          }
          if (type === "CXXMethod") { // remove return type
          valueWithArgs = "cv::Mat col(int x) const"
            var match = valueWithArgs.match(/[^\s\(]+\([^\)]*\)/);
            valueWithArgs = match ? match[0] : valueWithArgs;
          }
          return match ? {value: value, name: name, type: type, valueWithArgs: valueWithArgs} : null;
        }).compact();
        n(null, completions);
      }
    )(thenDo);
  },
  
  runRtagsUnsavedFile: function(args, file, content, opts, thenDo) {
    if (typeof opts === "function") { thenDo = opts; opts = null; }
    opts = lively.lang.obj.merge(opts, {stdin: content});
    ns.RTags.runRtags(args.concat([fmt("--unsaved-file=%s:%s", file, content.length)]), opts, thenDo);
  },
  
  runRtags: function(args, opts, thenDo) {
    lively.shell.run("rc " + args.join(" "), opts, function(err, cmd) { thenDo(err, cmd.getStdout()); });
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var Clang = {

  runFileSpecificCommand: function(file, args, opts, thenDo) {
    if (typeof opts === "function") {
      thenDo = opts; opts = null;
    }
    lively.lang.fun.composeAsync(
      Clang.withBuildInfoDo.curry(file),
      function(info, n) {
        var cmdString = fmt("%s %s", info.baseCommand, args.join(" "));
        lively.shell.run(cmdString, opts, n);
      }
    )(thenDo)
  },

  withBuildInfoDo: function(file, thenDo) {

    // FIXME!
    var buildDir = "build/";
    
    lively.lang.fun.composeAsync(
      function findBuildCommand(n) {
        lively.shell.cat(buildDir + "compile_commands.json", function(err, out) {
          var cmds = [];
          try { cmds = JSON.parse(out); } catch (e) {} finally { n(null, cmds); }
        });
      },
    
      function extractCommand(buildCommands, n) {
        var buildCommand = buildCommands.detect(function(ea) { return ea.file === file; });
        if (!buildCommand) return n(null, {baseCommand: "gcc"});
        var commandString = buildCommand.command
          .slice(0, buildCommand.command.lastIndexOf("-o")).replace(/ /, "");
        buildCommand.baseCommand = commandString;
        n(null, buildCommand);
      }
    )(thenDo);

  },

}

ns.Clang = Clang;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

ns.ClangCC1Completer = ns.ClangCC1Completer || (ns.ClangCC1Completer = {});

Object.extend(ns.ClangCC1Completer, {
  
  getDocTooltip: function(snippet) {
    return snippet.value
  },

  getCompletions: function(editor, session, pos, prefix, callback) {
    var mode = session.getMode();
    if (mode.$id !== "ace/mode/c_cpp") { callback(null, []); return }
    this.fetchCompletions(editor, function(err, completions) {
      if (err) {
        console.error("ClangCC1Completer error: " + err);
        callback(null, []); return;
      }
  
      var aceCompletions = completions.map(function(ea) {
        ea.name = ea.completion + " " + ea.type;
        ea.value = ea.completion;
        ea.meta = "clang";
        return ea;
      });

      callback(null, aceCompletions);
    });
  },

  fetchCompletions: function(ed, thenDo) {
    var file = ed.$morph.getTargetFilePath();
    if (!file) return thenDo(null, []);
    
    var pos = ed.getCursorPosition();
    var content = ed.getValue();

    // FIXME!
    var buildDir = "build/";
    
    lively.lang.fun.composeAsync(
      function findBuildCommand(n) {
        lively.shell.cat(buildDir + "compile_commands.json", function(err, out) {
          var cmds = [];
          try { cmds = JSON.parse(out); } catch (e) {} finally { n(null, cmds); }
        });
      },
    
      function makeCompletionCommand(buildCommands, n) {
        var buildCommand = buildCommands.detect(function(ea) { return ea.file === file; }),
            buildCommand = null,
            commandString = buildCommand ?
              buildCommand.command
                .slice(0, buildCommand.command.lastIndexOf("-o"))
                .replace(/ /, " -cc1")
                // .replace(/^[^\s]+/, "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang")
                : "clang -cc1",
            completionCommand = lively.lang.string.format(
                                '%s -fsyntax-only -code-completion-at="-:%s:%s" -code-completion-brief-comments -',
                                // '%s -fsyntax-only -code-completion-at="-:%s:%s" -code-completion-brief-comments -code-completion-patterns -code-completion-macros -',
                                commandString, pos.row, pos.column);
        n(null, completionCommand);
      },
    
      function getCompletions(cmdString, n) {
// show(cmdString)
        lively.shell.run(cmdString, {stdin: content},
          function(err, cmd) {
// show(cmd.getStderr());
            n(err, cmd.getStdout()); });
      },
      
      function parseCompletions(completionOutput, n) {
// show(completionOutput)
        var completionsParsed = lively.lang.string.lines(completionOutput).map(function(line, i) {
          var match = line.match(/^COMPLETION:\s*([^:]+)(:\s*(.*))?/)
          return match ? {completion: match[1].trim(), type: (match[3] || "").trim()} : null;
        }).compact();
        n(null, completionsParsed);
      }
    )(thenDo);
  }
});

ns.ClangRTagsCompleter = ns.ClangRTagsCompleter || (ns.ClangRTagsCompleter = {});

Object.extend(ns.ClangRTagsCompleter, {
  
  getDocTooltip: function(snippet) {
        // ed.completer.updateDocTooltip()
    if (snippet.symboldInfo) return snippet.symboldInfo;
    if (!snippet.editor) return null;
    var args = ['--find-symbols', snippet.value];
    lively.ide.codeeditor.modes.C_CPP.RTags.runRtags(
      args, {},
      function(err, result) {
        var line = lively.lang.string.lines(result)[0];
        snippet.symboldInfo = line.split(/:\s+/).join("\n");
        snippet.editor.completer.updateDocTooltip();
      });
    return "computing...";
  },

  getCompletions: function(editor, session, pos, prefix, callback) {
    var mode = session.getMode();
    if (mode.$id !== "ace/mode/c_cpp") { callback(null, []); return }
    ns.RTags.getCompletions(
      editor.getValue(),
      editor.$morph.getTargetFilePath(),
      editor.getCursorPosition(),
      function(err, completions) {
        if (err) {
          console.error("ClangRTagsCompleter error: " + err);
          callback(null, []); return;
        }
        completions.forEach(function(ea) { ea.editor = editor; });
        callback(null, completions);
      });
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var ModeExtension = {

    getCodeNavigator: function() { return Navigator; },

    commands: {

        "lively.ide.c_cpp.getDocAtPoint": {
          exec: function(ed) {
            ns.RTags.symbolInfoAtPos(
              ed.$morph.getTargetFilePath(),
              ed.getCursorPosition(),
              ed.getValue(),
              function(err, symbolInfo) {
                if (err) ed.$morph.showError(err);
                else ed.$morph.setStatusMessage(
                  symbolInfo ?
                    symbolInfo.file + ":" + symbolInfo.row + "\n" + symbolInfo.content :
                    "nothing found");
              });
          }
        },

        "lively.ide.c_cpp.findDefinitionAtPoint": {
          exec: function(ed) {
            var file = ed.$morph.getTargetFilePath();
            var pos = ed.getCursorPosition();
            var content = ed.getValue();
            lively.ide.codeeditor.modes.C_CPP.openDefinition(file, pos, content, function(err, ed) {})
          }
        },

        "lively.ide.c_cpp.clean": {
          exec: function(ed) {
            lively.ide.codeeditor.modes.C_CPP.cleanCmakeProject({showLogWindow: false}, function(err, cmd) {
              if (err) ed.$morph.showError(err);
              else ed.$morph.setStatusMessage(cmd.resultString(true));
            });
          }
        },

        "lively.ide.c_cpp.build": {
          exec: function(ed) {
            ed.$morph.doSave();
            lively.ide.codeeditor.modes.C_CPP.buildCmakeProject([], {}, function(err, cmd) {
              if (err) ed.$morph.showError(err);
            })
            // lively.ide.codeeditor.modes.C_CPP.cleanlCmakeProject({showLogWindow: false}, function(err, cmd) {
            //   if (err) ed.$morph.showError(err);
            //   else ed.$morph.setStatusMessage(cmd.resultString(true));
            // });
          }
        },

        "lively.ide.c_cpp.run": {
          handlesCount: true,
          exec: function(ed, args) {
            args = args || {};
            ed.$morph.doSave();
            lively.lang.fun.composeAsync(
              lively.ide.codeeditor.modes.C_CPP.buildCmakeProject.curry([], {}),
              function(buildCmd, n) {
                lively.bindings.once(buildCmd, 'end', {next: function() { n(null, buildCmd); }}, 'next');
              },
              function(buildCmd, n) {
                if (buildCmd.getCode() > 0) n(buildCmd.getStderr(), null);
                else lively.ide.codeeditor.modes.C_CPP.interactivelyRunExecutable({askForExecutable: !!args.count}, n); }
            )(function(err) { if (err) ed.$morph.showError(err); });
          }
        },

        "lively.ide.c_cpp.check-comile-with-overlays": {
          exec: function(ed, args) {
            args = args || {};
            var file = ed.$morph.getTargetFilePath();
            lively.lang.fun.composeAsync(
              function(n) { lively.ide.codeeditor.modes.C_CPP.checkCompile(file, ed.getValue(), {}, n); },
              function(parsedErrors, n) {
                lively.ide.codeeditor.modes.C_CPP.showErrorOverlays(ed.$morph, parsedErrors, n);
              }
            )(function(err, errors) {
              if (err) ed.$morph.showError(err);
              else if (!errors.length && !args.noMessage) ed.$morph.setStatusMessage("All OK");
              if (args.thenDo) args.thenDo(err, errors);
            });
          }
        },

    },

    keybindings: {
        // "lively.ide.patch.openFileAtCursor":    "alt-o",
        "lively.ide.c_cpp.getDocAtPoint":    "¿|Alt-Shift-?",
        "lively.ide.c_cpp.findDefinitionAtPoint":    "Alt-.",
        "lively.ide.c_cpp.clean":    "Î|Alt-Shift-D",
        "lively.ide.c_cpp.build":    "Alt-Shift-B",
        "lively.ide.c_cpp.run":    "Alt-Shift-R",
    },

    keyhandler: null,

    initKeyHandler: function() {
        Properties.forEachOwn(this.keybindings, function(commandName, key) {
            if (this.commands[commandName]) this.commands[commandName].bindKey = key;
        }, this);
        return this.keyhandler = lively.ide.ace.createKeyHandler({
            keyBindings: this.keybindings,
            commands: this.commands
        });
    },

    attach: function(ed) {
        ed.session.$c_cpp = {
          checkOnChange: true
        };
        ed.commands.addCommands(this.commands);
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
        // FIXME: only needed to make expandRegion work, can go when ace.ext
        // calls expandRegion even if no ed.session.$ast exists
        // ed.session.$ast = {};
    },

    detach: function(ed) {
        delete ed.session.$c_cpp;
        ed.commands.removeCommands(this.commands);
        this.keyhandler = null;
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
    },

    morphMenuItems: function(items, editor) {
        var mode = this;
        var hasSelection = !editor.getSelectionRangeAce().isEmpty();

        // items.pushAll([
        //   {isMenuItem: true, isDivider: true},
        //   ["open file at patch", function() { editor.aceEditor.execCommand("lively.ide.patch.openFileAtCursor"); }],
        // ]);

        return items;
    },

    doSave: function(editor) {
      editor.doSave();
      editor.aceEditor.execCommand("lively.ide.c_cpp.check-comile-with-overlays")
    },

    doListProtocol: function(codeEditor) {
      lively.ide.codeeditor.modes.C_CPP.showCompletionNarrower(codeEditor, {});
    }
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.ide.codeeditor.ModeChangeHandler.subclass('lively.ide.codeeditor.modes.C_CPP.ChangeHandler',
"settings", {
    targetMode: "ace/mode/c_cpp"
},

'rendering', {

    onDocumentChange: function(evt) {
        var codeEditor = evt.codeEditor,
            session = evt.session,
            changeHandler = this;

        if (!session.$c_cpp) return;

        codeEditor.setStatusMessage("checking...");

        lively.lang.fun.debounceNamed(this.id + "after-change-compile-check", 1500,
          function() {
            codeEditor.aceEditor.execCommand("lively.ide.c_cpp.check-comile-with-overlays", {
              noMessage: true,
              thenDo: function(_, parsedErrors) {
                // changeHandler.updateCodeMarkers(codeEditor, session, parsedErrors || []);
              }
            })
          })();
    },

    updateCodeMarkers: function(codeEditor, session, parsedErrors) {
      var changeHandler = this;
      var marker = changeHandler.ensureLivelyCodeMarker(session);
      marker.modeId = changeHandler.targetMode;
      marker.markerRanges.length = 0;
    
      // if (codeEditor.getShowWarnings()) {
      //     marker.markerRanges.pushAll(
      //         lively.ast.query.findGlobalVarRefs(ast, {jslintGlobalComment: true}).map(function(ea) {
      //             ea.cssClassName = "ace-global-var"; return ea; }));
      // }
    
      if (parsedErrors.length && codeEditor.getShowErrors()) {
        marker.markerRanges.pushAll(parsedErrors.map(function(err) {
          return {
            cssClassName: "ace-syntax-error",
            loc: {column: err.column, row: err.row},
            pos: codeEditor.positionToIndex({column: err.column, row: err.row})
          };
        }));
      }
      
      marker.redraw(session);
    
      // var astChange = {ast: ast, docChange: evt.data, codeEditor: codeEditor};
      // session._signal('astChange', astChange);
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

(function registerModeHandler() {
    lively.module('lively.ide.codeeditor.DocumentChange').runWhenLoaded(function() {
        lively.ide.CodeEditor.DocumentChangeHandler.registerModeHandler(lively.ide.codeeditor.modes.C_CPP.ChangeHandler);
    });
})();

function addClangCC1Completer() {
  if (ns.isClangCC1CompleterInstalled) return;
  var langTools = lively.ide.ace.require('ace/ext/language_tools');
  langTools.addCompleter(ns.ClangCC1Completer);
  ns.isClangCC1CompleterInstalled = true;
};

function addClangRTagsCompleter() {
  if (ns.isClangRTagsCompleterInstalled) return;
  var langTools = lively.ide.ace.require('ace/ext/language_tools');
  langTools.addCompleter(ns.ClangRTagsCompleter);
  ns.isClangRTagsCompleterInstalled = true;
};

(function extendAceMode() {
  lively.ide.ace.config.loadModule(["mode", 'ace/mode/c_cpp'], function(_, mode) {
    var Mode = lively.ide.ace.require('ace/mode/c_cpp').Mode
    lively.lang.obj.extend(Mode.prototype, ModeExtension);
  });
  addClangRTagsCompleter();
  // addClangCC1Completer();
})();

}); // end of module
