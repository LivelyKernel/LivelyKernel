module('lively.lang.Runtime').requires("lively.lang.VM").toRun(function() {

Object.extend(lively.lang.Runtime, {

  loadLivelyRuntimeInProjectDir: function(dir, thenDo) {
      dir = dir || "./";
      var livelyRuntimeFileName = "lively-runtime.js",
          fullName = dir + (dir.endsWith("/") ? "" : "/") + livelyRuntimeFileName,
          noLivelyRuntimeFileMarker = "no lively-runtime file";
      lively.lang.fun.composeAsync(
          lively.shell.ls.curry(dir),
          function(files, next) {
              next(null, files && files.detect(function(ea) {
                  return ea.path.endsWith(livelyRuntimeFileName); }));
          },
          function(file, next) {
              if (!file) return next(noLivelyRuntimeFileMarker);
              lively.shell.readFile(file.path, function(cmd) {
                  next(cmd.getCode() ? noLivelyRuntimeFileMarker : null, cmd.resultString()); });
          },
          function(livelyRuntimeSource, next) {
              lively.require("lively.lang.VM").toRun(function() {
                  lively.lang.VM.runEval(livelyRuntimeSource, {sourceURL: fullName}, next); })
          }
      )(function(err, evalResult) {
          if (err === noLivelyRuntimeFileMarker) err = null;
          else if (err) show("error loading lively-runtime.js:\n" + (err.stack || err))
          else alertOK("lively runtime of\n" + dir + "\nloaded!");
          thenDo && thenDo(err);
      });
  },

  resourceChanged: function(resourceId, source, thenDo) {
    var runtime = lively.lang.Runtime,
        registry = runtime.Registry.default(),
        project = runtime.Registry.getProjectWithResource(registry, resourceId);
    project && runtime.Project.processChange(project, resourceId, source, thenDo);
  }

});

lively.lang.Runtime.Registry = {

  default: function () {
    return this._defaultRegistry 
        || (this._defaultRegistry = {projects: {}});
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
    if (!projectSpec.name) throw new Error("project needs a name");
    return registry.projects[projectSpec.name] = projectSpec;
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
    return project.resources[resourceId]
        || lively.lang.obj.values(project.resources).detect(function(r) {
          return doesResourceMatch(resourceId, r, r.matches); });

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
