module('lively.lang.Runtime').requires("lively.lang.VM").toRun(function() {

Object.extend(lively.lang.Runtime, {

  _livelyRuntimeFileName: "lively-runtime.js",
  _noLivelyRuntimeFileMarker: "no lively-runtime file",

  loadLivelyRuntimeInProjectDir: function(dir, thenDo) {
      dir = dir || "./";
      var fn = lively.lang.Runtime._livelyRuntimeFileName,
          marker = lively.lang.Runtime._noLivelyRuntimeFileMarker,
          fullName = dir + (dir.endsWith("/") ? "" : "/") + fn

      lively.lang.fun.composeAsync(
          lively.shell.ls.curry(dir),
          function(files, next) {
              next(null, files && files.detect(function(ea) {
                  return ea.path.endsWith(fn); }));
          },
          function(file, next) {
              if (!file) return next(marker);
              lively.shell.readFile(file.path, function(cmd) {
                  next(cmd.getCode() ? marker : null, cmd.resultString()); });
          },
          function(livelyRuntimeSource, next) {
              lively.require("lively.lang.VM").toRun(function() {
                lively.lang.Runtime.loadRuntimeConfFile(
                  lively.lang.Runtime.Registry.default(),
                  fullName, livelyRuntimeSource, next); });
          }
      )(function(err, evalResult) {
          if (err === marker) err = null;
          else if (err) show("error loading lively-runtime.js:\n" + (err.stack || err))
          else alertOK("lively runtime of\n" + dir + "\nloaded!");
          thenDo && thenDo(err);
      });

  },

  resourceChanged: function(registry, resourceId, source, dir, thenDo) {
      var runtime = lively.lang.Runtime;
      if (typeof registry === "string") {
        thenDo = dir;
        dir = source;
        source = resourceId;
        resourceId = registry;
        registry = runtime.Registry.default();
      }

      var runtimeConfFileName = lively.lang.Runtime._livelyRuntimeFileName;
      if (String(resourceId).split("/").last() === runtimeConfFileName) {
        runtime.loadRuntimeConfFile(registry, resourceId, source, thenDo);
      } else {
        lively.lang.fun.composeAsync(
          function(n) { runtime.findProjectForResource(registry, resourceId, n); },
          function(proj, n) { runtime.Project.processChange(proj, resourceId, source, n); }
        )(thenDo);
      }
  },

  loadRuntimeConfFile: function(registry, resourceId, source, thenDo) {
    var runtime = lively.lang.Runtime;
    if (typeof registry === "string") {
      thenDo = source;
      source = resourceId;
      resourceId = registry;
      registry = runtime.Registry.default();
    }

    var sepMatch = resourceId.match(/\\|\//), sep = sepMatch && sepMatch[0],
        rootDir = sep ? resourceId.split(sep).slice(0, -1).join(sep) : null,
        resetRegistry, t = Date.now();
    lively.lang.fun.composeAsync(
      function(n) { runtime.Registry.withCurrent(registry, function(reset) { resetRegistry = reset; n(); }); },
      function(n) { lively.lang.VM.runEval(source, {sourceURL: String(resourceId)}, function(err) { n(err); }); },
      function(n) { setTimeout(function() { n(); }, 100);},
      function(n) {
        var project = runtime.Registry.findFirstProjectUpdatedAfter(registry, t);
        if (rootDir && project) project.rootDir = rootDir;
        n(null, project);
      },
      function(project, n) {
        if (project && project.reloadAll) project.reloadAll(project, n);
        else n(null, null);
      }
    )(function(err) {
        if (err) $world.alert("Error loading " + resourceId + ":\n" + err);
        else $world.alertOK("Runtime conf file " + resourceId + " loaded");
        resetRegistry && resetRegistry();
        thenDo && thenDo(err);
    });
  },

  findProjectForResource: function(registry, resourceId, thenDo) {
      var runtime = lively.lang.Runtime;
      if (typeof registry === "string") {
        thenDo = resourceId;
        resourceId = registry;
        registry = runtime.Registry.default();
      }

      var project = runtime.Registry.getProjectWithResource(registry, resourceId);
      thenDo(project ? null : new Error("No project for " + resourceId + " found"), project);
  },

  readFiles: function(project, files, thenDo) {
    lively.lang.arr.mapAsyncSeries(files,
      function(fn,_,n) {
        lively.shell.cat(fn, {cwd: project.rootDir},
        function(err, c) { n(err, {name: fn, content: c}); });
      }, thenDo);
  },

  loadFiles: function(project, files, thenDo) {
    lively.lang.fun.composeAsync(
      lively.lang.Runtime.readFiles.curry(project, files),
      function(filesRead, next) {
        // filesRead = [{name: STRING, content: STRING}*]
        lively.lang.arr.mapAsyncSeries(filesRead,
          function(ea,_,n) {
            lively.lang.Runtime.Project.processChange(
              project, lively.lang.string.joinPath(project.rootDir, ea.name),
              ea.content, n);
          },
          next);
      }
    )(thenDo)
  },

  evalCode: function(project, code, state, resourceName, thenDo) {
    lively.lang.VM.runEval(code,
      {topLevelVarRecorder: state, context: state, sourceURL: resourceName},
      function(err, result) {
    		err && show("error when updating the runtime for " + resourceName + "\n" + (err.stack || err));
    		!err && alertOK("runtime updated for " + resourceName);
    		thenDo && thenDo(err, result);
    	});
  }

});

lively.lang.Runtime.Registry = {

  default: function () {
    return this._defaultRegistry
        || (this._defaultRegistry = {projects: {}});
  },

  current: function() {
    // will be set when pre-specifying a registry and then running runtime
    // related code like lively-runtime.js
    return this._current || this.default();
  },

  withCurrent: function(registry, doFunc) {
    var self = this,
        former = self._current;
    self._current = registry;
    var callbackCalled = false;
    lively.lang.fun.waitFor(6000, function() { return !!callbackCalled; },
      function(err) {
         if (!err) return;
         var msg = "Re-setting the lively.lang.Runtime current registry timed out...";
         console.warn(msg);
         $world.setStatusMessage(msg, Color.orange);
      });
    try { return doFunc(reset); } catch (e) { reset(); throw e; }

    function reset() { callbackCalled = true; self._current = former; }
  },

  hasProject: function(registry, name) { return !!this.get(registry, name); },

  get: function(registry, name) { return registry.projects[name]; },

  getProjectWithResource: function(registry, resourceId) {
    return Object.values(registry.projects).detect(function(p) {
        return !!lively.lang.Runtime.Project.getResource(p, resourceId);
    });
  },

  addProject: function(registry, projectSpec) {
    // each project can have a varRecorder, context
    // whole project can have a loader
    if (!projectSpec) {
      projectSpec = registry;
      registry = lively.lang.Runtime.Registry.default();
    }
    if (!projectSpec.name) throw new Error("project needs a name");
    var proj = registry.projects[projectSpec.name] ||
      (registry.projects[projectSpec.name] = {});
    proj._lastUpdated = Date.now();
    return lively.lang.obj.extend(proj, projectSpec);
  },

  findFirstProjectUpdatedAfter: function(registry, t) {
    return lively.lang.obj.values(registry.projects).detect(function(p) {
      return p._lastUpdated && p._lastUpdated >= t;
    });
  }
}

lively.lang.Runtime.Project = {

  processChange: function(project, resourceId, changedCode, thenDo) {
    var resource = this.getResource(project, resourceId);
    if (!resource) return thenDo && thenDo();

    if (!resource.changeHandler) {
      show("No change handler for resource %s", resource.name);
      return thenDo && thenDo();
    }

    var change = {resourceId: resourceId, newSource: changedCode, oldSource: ""};

    var thenDoCalled = false;

    try {
      resource.changeHandler(change, project, resource, callThenDo);
    } catch (e) { dealWithError(e); }

    // if change handler does not want to call callback itself:
    if (resource.changeHandler.length <= 3 && !thenDoCalled) callThenDo();

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function dealWithError(err) {
      var msg = "Error in change handler: " +  (err.stack || err);
      show(msg);
      if (!thenDoCalled) { thenDoCalled = true; thenDo && thenDo(err); }
    }

    function callThenDo(err) {
        if (thenDoCalled) return; thenDoCalled = true;
        err ? dealWithError(err) : thenDo && thenDo();
    }
  },

  getResource: function(project, resourceId) {
    var relativeName;

    if (isAbsoluteName(resourceId) && project.rootDir) {
      if (!resourceId.startsWith(project.rootDir)) return false;
      relativeName = resourceId.slice(project.rootDir.length).replace(/^\/|\\/, "");
    } else {
      relativeName = resourceId;
    }

    if (lively.lang.Runtime._livelyRuntimeFileName === relativeName) {
      return {name: relativeName};
    }

    var resources = project.resources || {};
    return resources[relativeName]
        || lively.lang.obj.values(resources).detect(function(r) {
          return doesResourceMatch(relativeName, r, r.matches); });

    function doesResourceMatch(id, resource, matcher) {
      try {
        if (!matcher) return false;
        if (Array.isArray(matcher)) return lively.lang.arr.some(matcher, doesResourceMatch.curry(id, resource));
        if (typeof matcher === "string") return id === matcher;
        else if (matcher instanceof RegExp) return matcher.test(id);
        else if (typeof matcher === 'function') return matcher(id, resource);
      } catch (e) {
          var msg = "Error in getResource: " +  (e.stack || e);
          show(msg);
      }
      return false;
    }

    function isAbsoluteName(fileName) { return !!fileName.match(/^\/|[a-z]:\\/i); }
  }

}

lively.lang.Runtime.Resource = {

  applyDeltas: function(resource, deltas, thenDo) {
    var nl = "\n";
    var lines = Strings.lines(resource.code);

    resource.code = deltas.reduce(function(lines, delta) {
      var range = delta.range;

      if (delta.action == "insertText") {
        var insertionLines = Strings.lines(delta.text),
            startLine = lines[range.start.row];
        if (insertionLines.length === 1) {
          insertionLines = [
            startLine.slice(0,range.start.column)
          + insertionLines[0]
          + startLine.slice(range.start.column)]
        } else {
          insertionLines = [
            startLine.slice(0,range.start.column)]
           .concat(insertionLines.slice(1,-1))
           .concat([insertionLines.last()+startLine.slice(range.start.column)])
        }
        return lines.slice(0,range.start.row)
          .concat(insertionLines)
          .concat(lines.slice(range.start.row+1));
      }

      if (delta.action == "removeText") {
        var startLine = lines[range.start.row], remainingLines;
        remainingLines = [
          startLine.slice(0,range.start.column)
        + lines[range.end.row].slice(range.end.column)]
        return lines.slice(0,range.start.row)
          .concat(remainingLines)
          .concat(lines.slice(range.end.row+1))
      }

      if (delta.action == "insertLines") {
        return lines.slice(0,range.start.row)
          .concat(delta.lines)
          .concat(lines.slice(range.start.row))
      }

      if (delta.action == "removeLines") {
        return lines.slice(0,range.start.row)
          .concat(lines.slice(range.end.row))
      }

    }, lines).join(nl);

    thenDo && thenDo();

    function index(code, pos) {
      var lines = Strings.lines(code);
      for (var index = 0, i = 0; i < lines.length; i++) {
        if (pos.row === i) {
          return index + Math.min(lines[i].length, pos.column)
        }
        index += lines[i].length+1/*for nl*/;
      }
      return -1;
    }
  }

}

}) // end of module
