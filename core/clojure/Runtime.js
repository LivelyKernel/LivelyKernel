module('clojure.Runtime').requires().requiresLib({url: Config.codeBase + 'lib/ace/paredit-bundle.js',loadTest: function() { return !!Global.paredit; }}).toRun(function() {

// "exports"
// lively.ide.codeeditor.modes.Clojure.ReplServer = {};
clojure.Runtime
clojure.Runtime.ReplServer = {};
clojure.StaticAnalyzer;

Object.extend(clojure.Runtime, {

    _cache: {},
    _defaultEnv: {
        port: 7888,
        host: "0.0.0.0",
        session: null,
        doAutoLoadSavedFiles: false
    },

    reset: function() {
      var runtime = clojure.Runtime;
      runtime._cache = {};
      runtime._defaultEnv = {port: 7888, host: "0.0.0.0", session: null, doAutoLoadSavedFiles: false};
    },

    resetEditorState: function(ed) {
      var runtime = clojure.Runtime;
      runtime.ensureClojureStateInEditor(ed).env = null;
    },

    currentEnv: function(codeEditor) {
        // clojure.Runtime.currentEnv(that);
        var runtime = clojure.Runtime;
        if (codeEditor) {
            var st = runtime.ensureClojureStateInEditor(codeEditor);
            if (st.env) return st.env;
        }

        return this._defaultEnv;
    },

    readEnv: function(inputString) {
        if (!Object.isString(inputString)) return null;
        var match = inputString.match(/^([^:]+):([0-9]+)$/);
        var host = match[1].trim(), port = parseInt(match[2]);
        return !host || !port ? null : {host: host, port: port};
    },

    printEnv: function(env) {
        return Strings.format("%s:%s%s",
            env.host, env.port,
            env.session ? "(session: " + env.session + ")" : "");
    },

    ensureClojureStateInEditor: function(editorMorph) {
        var runtime = clojure.Runtime,
            sess = editorMorph.getSession();
        return sess.$livelyClojureState || (sess.$livelyClojureState = {env: null});
    },
    
    changeInEditor: function(editorMorph, newEnvSpec) {
        var runtime = clojure.Runtime;
        var defaultEnv = runtime.currentEnv();
        var editorEnv = runtime.currentEnv(editorMorph);
        if (defaultEnv === editorEnv) {
          editorEnv = Object.create(defaultEnv);
        }
        Object.keys(newEnvSpec).forEach(function(k) {
          if (newEnvSpec[k] !== editorEnv[k]) editorEnv[k] = newEnvSpec[k];
        });
        return runtime.ensureClojureStateInEditor(editorMorph).env = editorEnv;
    },

    change: function(newDefaultEnv) {
      Object.extend(this._defaultEnv, newDefaultEnv);
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // helper for editors

    detectNs: function(editorMorph) {
      if (editorMorph.clojureGetNs) return editorMorph.clojureGetNs();
      var nsDef = clojure.StaticAnalyzer.findNsForm(
          editorMorph.getSession().$ast || editorMorph.textString);
      return nsDef ? nsDef.nsName : null;
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // communicating with clojure runtimes via nrepl

    fetchDoc: function(runtimeEnv, ns, expr, thenDo) {
      if (!expr.trim().length) thenDo(new Error("doc: no input"))
      else this.doEval("(do (require '[clojure.repl]) (clojure.repl/doc " + expr + "))",
        {ns:ns, env: runtimeEnv, prettyPrint: true, passError: true}, thenDo);
    },

    evalQueue: [],

    runEvalFromQueue: function() {
        var clj = this;
        var evalObject = clj.evalQueue[0];
        if (!evalObject || evalObject.isRunning) return;
        clj.runEval(evalObject, function(err, result) {
            clj.evalQueue.remove(evalObject);
            try { if (evalObject.callback) evalObject.callback(err, result); } catch (e) {
                show("error in clj eval callback: %s", e);
            }
            clj.runEvalFromQueue.bind(clj).delay(0);
        });
    },

    runEval: function(evalObject, thenDo) {
        if (!module('lively.net.SessionTracker').isLoaded() || !lively.net.SessionTracker.isConnected()) {
            thenDo(new Error('Lively2Lively not running, cannot connect to Clojure nREPL server!'));
            return;
        }

        var clj        = clojure.Runtime,
            env        = evalObject.env,
            options    = evalObject.options,
            expr       = evalObject.expr,
            ns         = evalObject.ns,
            pp         = options.prettyPrint = options.hasOwnProperty("prettyPrint") ? options.prettyPrint : false,
            ppLevel    = options.hasOwnProperty("prettyPrintLevel") ? options.prettyPrintLevel : null,
            isJSON     = options.resultIsJSON = options.hasOwnProperty("resultIsJSON") ? options.resultIsJSON : false,
            isFileLoad = !expr && evalObject["file-content"],
            catchError = options.hasOwnProperty("catchError") ? options.catchError : true,
            sess       = lively.net.SessionTracker.getSession(),
            cljSession = env.session;

        if (expr) {
          if (pp) expr = Strings.format("(with-out-str (clojure.pprint/write (do %s) %s))", expr, ppLevel ? ":level " + ppLevel : "");
          if (catchError) expr = Strings.format("(try %s (catch Exception e (clojure.repl/pst e)))", expr);
        }

        evalObject.isRunning = true;
        var nreplOptions = {port: env.port || 7888, host: env.host || "127.0.0.1"};
        var nreplMessages = [];
        var message = {
          nreplOptions: nreplOptions,
          session: cljSession,
          ignoreMissingSession: true};

        if (isFileLoad) {
          message["file-content"] = evalObject["file-content"];
          message["file-name"] = evalObject["file-name"];
          message["file-path"] = evalObject["file-path"];
        } else {
          message.code = expr;
          message.ns = ns;
        }

        sess.send('clojureEval', message, function(answer) {
            if (Object.isArray(answer.data)) {
                nreplMessages.pushAll(answer.data);
            } else nreplMessages.push(answer.data);

            if (answer.data['eval-id']) {
                evalObject['eval-id'] = answer.data['eval-id'];
                cljSession = evalObject.env.session = answer.data.session;
            }

            if (answer.expectMoreResponses) return;
            evalObject.isRunning = false;

            if (answer.data.error) thenDo && thenDo(answer.data.error, null);
            else clj.processNreplEvalAnswers(nreplMessages, options, thenDo); });
    },

    doEval: function(expr, options, thenDo) {
        if (!thenDo) { thenDo = options; options = null; };
        var evalState = {
          env: options.env || clojure.Runtime.currentEnv(),
          expr: expr,
          ns: options ? options.ns : undefined,
          options: options || {},
          isRunning: false,
          "eval-id": null,
          callback: thenDo
        }
        this.evalQueue.push(evalState);
        this.runEvalFromQueue();
        return evalState;
    },

    evalInterrupt: function(env, thenDo) {
        // FIXME ... eval queue, eval objects should belong to a Clojure runtime env...!
        var clj = this;
        var evalObject = clj.evalQueue[0];
        if (!evalObject) return thenDo(new Error("no evaluation in progress"));
        var env = evalObject.env || {};
        var nreplOptions = {port: env.port || 7888, host: env.host || "127.0.0.1"};

        if (!evalObject) thenDo(new Error("no clj eval running"));
        else if (!evalObject.isRunning || !evalObject['eval-id']) cleanup();
        else {
            var sess = lively.net.SessionTracker.getSession();
            sess.send('clojureEvalInterrupt',
                {nreplOptions: nreplOptions, session: evalObject.env.session,
                 "eval-id": evalObject['eval-id']},
                function(answer) {
                    cleanup();
                    thenDo(answer.error || answer.data.error, answer.data);
                });
        }

        function cleanup() {
            clj.evalQueue.remove(evalObject);
            clj.runEvalFromQueue.bind(clj).delay(0);
        }
    },

    loadFile: function(content, pathToFile, options, thenDo) {
        options = options || {};
        options.passError = true;
        var env = options.env || clojure.Runtime.currentEnv();
        if (!env.doAutoLoadSavedFiles) return;
        this.evalQueue.push({
            env: env,
            "file-content": content,
            "file-name": pathToFile.split('\\').last(),
            "file-path": pathToFile,
            options: options,
            isRunning: false,
            "eval-id": null,
            callback: thenDo});
        this.runEvalFromQueue();
    },

    processNreplEvalAnswers: function(messages, options, thenDo) {
      if (Object.isString(messages) && messages.match(/error/i))
          messages = [{err: messages}];

      if (!Object.isArray(messages) || !messages.length) {
          console.warn("strange clj eval messages: %o", messages);
          return;
      };

      var status = messages.pluck("status").compact().flatten(),
          errors = messages.pluck("error").compact()
              .concat(messages.pluck("err").compact())
              .concat(messages.pluck("ex").compact()),
          isError = !!errors.length || status.include("error"),
          result = messages.pluck('value').concat(messages.pluck('out')).compact().join('\n'),
          err;

      if (status.include("interrupted")) result = result + "[interrupted eval]";

      if (isError) {
          if (status.include("namespace-not-found")) {
            errors.unshift("namespace not found" + (options.ns ? ": " + options.ns : ""))
          } else {
            errors.unshift(status.without("done"));
            var cause = messages.pluck('root-ex').flatten().compact();
            if (cause.length) errors.pushAll(["root-cause:"].concat(cause));
            err = errors.flatten().compact().invoke('trim').join('\n');
          }
      }

      if (!isError && options.prettyPrint) try { result = eval(result); } catch (e) {}
      if (!isError && options.resultIsJSON) try { result = JSON.parse(eval(result)); } catch (e) {
          err = e;
          result = {error: e};
      }

      if (isError && String(result).include("ECONNREFUSED")) {
          result = "No clojure server listening?" + result;
      }

      // "print" error if result is a string anyway
      if (err && (!result || typeof result === 'string')) {
        result = ("" || result) + "\n" + err;
      }

      thenDo && thenDo(options.passError ? err : null, result);
  },

  lookupIntern: function(nsName, symbol, options, thenDo) {
    var code = Strings.format(
          "(do (require 'rksm.system-navigator.ns-internals)\n"
        + "    (rksm.system-navigator.ns-internals/symbol-info->json\n"
        + "     %s '%s))\n",
        nsName ? "(find-ns '"+nsName+")" : "*ns*", symbol);
    this.doEval(code, lively.lang.obj.merge(options||{},{resultIsJSON: true}), thenDo);
  },

  retrieveDefinition: function(symbol, inns, options, thenDo) {
    lively.lang.fun.composeAsync(
      function(n) { clojure.Runtime.lookupIntern(inns, symbol, {}, n); },
      function(intern, n) {
        if (!intern) return n(new Error("Cannot retrieve meta data for " + symbol));
        var cmd = lively.lang.string.format(
          "(do\n"
          + "  (require 'clojure.data.json)\n"
          + "  (require 'rksm.system-navigator)\n"
          + "  (-> '%s rksm.system-navigator/source-for-ns clojure.data.json/write-str))",
          intern.ns);
        clojure.Runtime.doEval(cmd, {resultIsJSON:true}, function(err,nsSrc) {
          n(err,intern, nsSrc); });
      },
      function(intern, nsSrc, n) {
        // lively.lang.string.lines(source).length
        intern.line = intern.line && Number(intern.line);
        if (!intern.line && intern.protocol) intern.line = Number(intern.protocol.line);
        if (intern.line) {
          var range = lively.lang.string.lineNumberToIndexesComputer(nsSrc)(Number(intern.line));
          var ast = paredit.parse(nsSrc);
          var rangeDef = range && paredit.navigator.rangeForDefun(ast, range[0]);
        }
        n(null, {intern: intern, nsSource: nsSrc, defRange: rangeDef});
      }
    )(thenDo);
  }
});

Object.extend(clojure.Runtime.ReplServer, {

    livelyLeinProfile: "{:plugins [[lein-pprint \"1.1.1\"]]\n"
                     + " :dependencies [[rksm/repl.utils \"0.1.1\"]\n"
                     + "                ;; for vinyasa lein\n"
                     + "                [leiningen #=(leiningen.core.main/leiningen-version)]\n"
                     + "                ;; trace execution\n"
                     + "                [org.clojure/tools.trace \"0.7.8\"]\n"
                     + "                ;; install dependencies / packages without restart\n"
                     + "                [com.cemerick/pomegranate \"0.3.0\"]\n"
                     + "                ;; cljs repl ++\n"
                     + "                [com.cemerick/piggieback \"0.1.4-SNAPSHOT\"]\n"
                     + "                ;; \"quick and dirty debugging\n"
                     + "                [spyscope \"0.1.4\"]\n"
                     + "                ;; reload namespaces, recursively tracking dependencies\n"
                     + "                [org.clojure/tools.namespace \"0.2.4\"]\n"
                     + "                ;; java reflection\n"
                     + "                [im.chit/iroh \"0.1.11\"]\n"
                     + "                ;; pretty stacktraces\n"
                     + "                [io.aviso/pretty \"0.1.8\"]\n"
                     + "                ;; inject stuff in namespace + other goodies\n"
                     + "                ;; see http://z.caudate.me/give-your-clojure-workflow-more-flow/\n"
                     + "                [im.chit/vinyasa \"0.2.2\"]\n"
                     + "                ;; for inspection\n"
                     + "                [org.clojure/data.json \"0.2.5\"]]\n"
                     + " :injections [(require 'spyscope.core)\n"
                     + "              (require 'vinyasa.inject)\n"
                     + "              (require 'iroh.core)\n"
                     + "              (vinyasa.inject/in\n"
                     + "              clojure.core\n"
                     + "              [rksm.repl.utils lein search-for-symbol get-stack print-stack dumb-stack traced-fn]\n"
                     + "              [vinyasa.pull [pull pull]]\n"
                     + "              [clojure.java.shell sh]\n"
                     + "              [clojure.repl apropos dir doc find-doc source [root-cause cause]]\n"
                     + "              [clojure.tools.namespace.repl [refresh refresh]]\n"
                     + "              [clojure.pprint [pprint >pprint]]\n"
                     + "              [iroh.core .% .%> .*]\n"
                     + "              [clojure.tools.trace dotrace trace-ns untrace-ns])]}\n",

    ensure: function(options, thenDo) {
        if (!thenDo) { thenDo = options; options = {}; }
        var cmd = this.getCurrentServerCommand();
        if (cmd) {
            Functions.waitFor(5000, function() {
                return cmd.getStdout().include("nREPL server started");
            }, function(err) { thenDo(err, cmd); });
        } else this.start(options, thenDo);
    },

    getCurrentServerCommand: function() {
        var cmdQueueName = "lively.clojure.replServer";
        var q = lively.shell.commandQueue[cmdQueueName];
        var cmd = q && q[0];
        return cmd && String(cmd.getCommand()).include("+lively repl") ?
            cmd : null;
    },

    start: function(options, thenDo) {
        if (!thenDo) { thenDo = options; options = {}; }
        var port = options.env ? options.env.port : "7888",
            host = options.env ? options.env.host : "127.0.0.1",
            cwd = options.cwd,
            self = this,
            cmdQueueName = "lively.clojure.replServer";

        // FIXME
        if (!["127.0.0.1", "0.0.0.0", "localhost"].include(host)) {
            thenDo(new Error("Cannot start clj server " + host + ":" + port));
            return;
        }

        Functions.composeAsync(
            function(next) { lively.require("lively.ide.CommandLineInterface").toRun(function() { next(); }); },
            this.stop.bind(this, port),
            this.ensureLivelyProfile.bind(this),
            function startServer(next) {
                var cmdString = Strings.format(
                    "lein with-profile +lively repl :headless :port %s", port);
                var cmd = lively.shell.run(cmdString, {cwd: cwd, group: cmdQueueName});
                next(null,cmd);
            },
            function waitForServerStart(cmd, next) {
                Functions.waitFor(5000, function() {
                    return cmd.getStdout().include("nREPL server started");
                }, function(err) { next(null, cmd); });
            }
        )(thenDo);
    },

    stop: function(env, thenDo) {
        env = env || {};
        // FIXME
        if (env.host && !["127.0.0.1", "0.0.0.0", "localhost"].include(env.host)) {
            thenDo(new Error("Cannot stop clj server " + env.host + ":" + port));
            return;
        }

        var port = env ? env.port : "7888";
        var cmdQueueName = "lively.clojure.replServer";
        Functions.composeAsync(
            function clearLivelyClojureCommands(next) {
                var q = lively.shell.commandQueue[cmdQueueName];
                if (!q || !q[0]) return next();
                delete lively.shell.commandQueue[cmdQueueName];
                q[0].kill("SIGKILL", function(err, answer) { next(); });
            },
            function stopRunningServer(next) {
                var cmdString = Strings.format(
                    "lsof -i tcp:%s -a -c ^node -a -c ^Google -t | xargs kill -9 ", port);
                lively.shell.run(cmdString, {group: cmdQueueName}, function(err, cmd) { next(); });
            }
        )(thenDo);
    },

    reset: function(thenDo) {
        Global.URL.nodejsBase.withFilename("ClojureServer/reset").asWebResource().beAsync()
            .post().whenDone(function(response, status) { thenDo(null,  show(status + '\n' + response)); });
    },

    ensureLivelyProfile: function(thenDo) {
        var profilesDir, livelyClojureProfileFile;
        var  livelyLeinProfile = this.livelyLeinProfile;
        Functions.composeAsync(
            function(next) {
                lively.shell.run("echo $HOME", {}, function(err, cmd) {
                    if (cmd.getCode()) next(cmd.resultString(true));
                    else {
                        var home = cmd.getStdout().trim()
                        profilesDir = home + "/.lein/profiles.d";
                        livelyClojureProfileFile = profilesDir + "/lively.clj";
                        next();
                    }
                });
            },
            function(next) {
                lively.shell.run("mkdir -p " + profilesDir, {}, function(err, cmd) { next(); });
            },
            function(next) {
                lively.ide.CommandLineInterface.writeFile(
                    livelyClojureProfileFile,
                    {content: livelyLeinProfile},
                    function() { next(); })
            }
        )(thenDo);
    }

});

clojure.StaticAnalyzer = {
  
  ensureAst: function(astOrSource) {
    return typeof astOrSource === 'string' ?
      paredit.parse(astOrSource) : astOrSource;
  },

  findFuncCallNode: function(parent, funcName) {
    if (!parent.children) return;
    var found;
    parent.children.detect(function(n) {
      return n.type === 'list' && n.children[0]
          && n.children[0].source === "ns"
          && (found = n);
    });
    return found;
  },

  findNsForm: function(astOrSource) {
    // clojure.StaticAnalyzer.findNsForm(that.textString)
    var ast = this.ensureAst(astOrSource);
    var nsForm = this.findFuncCallNode(ast, 'ns');
    var nsNameNode = nsForm && nsForm.children && nsForm.children.slice(1).detect(function(n) {
      return n.type === 'symbol'; })
    return nsForm ? {
      nsName: nsNameNode ? nsNameNode.source : null,
      node: nsForm
    } : null;
  },

  nodeAtPoint: function(astOrSource, idx) {
    return paredit.walk.sexpsAt(
      this.ensureAst(astOrSource), idx).last();
  },

  nodeAtCursor: function(aceEd) {
    // convenience for ace
    var idx = aceEd.session.doc.positionToIndex(aceEd.getCursorPosition())
    return this.nodeAtPoint(aceEd.session.$ast||aceEd.getValue(), idx);
  },
  
  sourceForNodeAtCursor: function(aceEd) {
    // convenience for ace
    var node = this.nodeAtCursor(aceEd);
    if (!node) return "";
    return node.source || aceEd.getValue().slice(node.start,node.end);
  },

  createDefinitionQuery: function(astOrSource, idx, optNsName) {
    var ast = this.ensureAst(astOrSource);
    var thing = this.nodeAtPoint(ast, idx);
    if (!thing || !thing.source) return null;
    var ns = !optNsName && this.findNsForm(ast);
    var nsName = optNsName || (ns && ns.nsName) || "user";
    return {
      nsName: nsName,
      ns: ns,
      node: thing,
      source: thing.source.replace(/^'/,"")
    };
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // completion related
  // -=-=-=-=-=-=-=-=-=-

  buildElementCompletionForm: function(astOrSource, src, idx) {
    if (typeof idx === "undefined") {
      idx = src; src = astOrSource;
    }

    var ast = this.ensureAst(astOrSource);
    var parent = paredit.walk.containingSexpsAt(ast, idx, paredit.walk.hasChildren).last();
    if (!parent.type === "list" || !parent.children.length) return null;

    var wrapExpr = "(do (require '[rksm.system-navigator.completions]) %s)";
    var complFunc = "rksm.system-navigator.completions/instance-elements->json"

    // simple dot completion
    if (parent.children[0].source === ".") {
      var expr = paredit.walk.source(src, parent);
      var offs = -parent.start;
      return lively.lang.string.format(wrapExpr,
            expr.slice(0,parent.children[0].start+offs)
          + complFunc
          + expr.slice(parent.children[0].end+offs));
    }

    if (parent.children[0].source.include("->")
     && parent.children.last().source === ".") {
      var expr = paredit.walk.source(src, parent);
      var offs = -parent.start;
      return lively.lang.string.format(wrapExpr,
            expr.slice(0,parent.children.last().start+offs)
          + complFunc
          + expr.slice(parent.children.last().end+offs));
    }

    return null
  }
}

}) // end of module
