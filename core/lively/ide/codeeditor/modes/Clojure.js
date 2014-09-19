module('lively.ide.codeeditor.modes.Clojure').requires('lively.ide.codeeditor.ace').toRun(function() {

lively.ide.codeeditor.modes.Clojure.ReplServer = {};

Object.extend(lively.ide.codeeditor.modes.Clojure.ReplServer, {

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
                     + "                [im.chit/vinyasa \"0.2.2\"]]\n"
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
        var port = options.port || "7888",
            self = this,
            cmdQueueName = "lively.clojure.replServer";

        Functions.composeAsync(
            function(next) { lively.require("lively.ide.CommandLineInterface").toRun(function() { next(); }); },
            this.stop.bind(this, port),
            this.ensureLivelyProfile.bind(this),
            function startServer(next) {
                var cmdString = Strings.format(
                    "lein with-profile +lively repl :headless :port %s", port);
                var cmd = lively.shell.run(cmdString, {group: cmdQueueName});
                next(null,cmd); 
            },
            function waitForServerStart(cmd, next) {
                Functions.waitFor(5000, function() {
                    return cmd.getStdout().include("nREPL server started");
                }, function(err) { next(null, cmd); });
            }
        )(thenDo);
    },

    stop: function(port, thenDo) {
        port = port || "7888";
        var cmdQueueName = "lively.clojure.replServer";
        Functions.composeAsync(
            function clearLivelyClojureCommands(next) {
                var q = lively.shell.commandQueue[cmdQueueName];
                if (!q || !q[0]) return next();
                delete lively.shell.commandQueue[cmdQueueName];
                q[0].kill("SIGKILL", function(err, answer) { next(); });
            },
            function stopRunningServer(next) {
                var cmdString = Strings.format("lsof -i tcp:%s -t | xargs kill -9 ", port);
                lively.shell.run(cmdString, {group: cmdQueueName}, function(cmd) { next(); });
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
                lively.shell.run("echo $HOME", {}, function(cmd) {
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
                lively.shell.run("mkdir -p " + profilesDir, {}, function(cmd) { next(); });
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

Object.extend(lively.ide.codeeditor.modes.Clojure, {

    prettyPrint: function(code, thenDo) {
        // this is WORK IN PROGRESS!
        var prettify = Strings.format(
            "(require '(rewrite-clj parser printer))\n"
          + "(rewrite-clj.printer/print-edn (rewrite-clj.parser/parse-string-all \"%s\"))",
            code.replace(/"/g, '\\"'));

        // var prettify = Strings.format(
        //     "(clojure.pprint/write '%s :dispatch clojure.pprint/code-dispatch)",
        //     code);
        // var prettify = Strings.format(
        //     "(require '[fipp.edn :refer (pprint) :rename {pprint fipp}]) (fipp '%s)",
        //     code);

        lively.ide.codeeditor.modes.Clojure.doEval(
            prettify, {passError: true, resultIsJSON: false},
            function(err, prettified) {
                if (err) show(err);
                if (err) prettified = code;
                else {
                    // try { prettified = eval(prettified); } catch (e) { prettified = code; }
                    prettified = prettified.replace(/^(nil\s*)+/g, '');
                    // FIXME pretty printer seems to add additional newlines after comments
                    prettified = prettified.replace(/(;[^\n]*)[\n]+/gm, '$1\n');
                    if (!prettified.length) prettified = code;
                }
                thenDo && thenDo(err, prettified);
            });
    },

    fetchDoc: function(expr, thenDo) {
        this.doEval("(doc " + expr + ")", {prettyPrint: true}, thenDo);
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
        var options = evalObject.options;
        var expr = evalObject.expr;
        var pp = options.hasOwnProperty("prettyPrint") ? options.prettyPrint : false;
        var isJSON = options.hasOwnProperty("resultIsJSON") ? options.resultIsJSON : false;
        var catchError = options.hasOwnProperty("catchError") ? options.catchError : true;

        if (!module('lively.net.SessionTracker').isLoaded() || !lively.net.SessionTracker.isConnected()) {
            thenDo(new Error('Lively2Lively not running, cannot connect to Clojure nREPL server!'));
            return;
        }
        var sess = lively.net.SessionTracker.getSession();

        if (pp) expr = Strings.format("(with-out-str (>pprint (do %s)))", expr);
        if (catchError) expr = Strings.format("(try %s (catch Exception e (clojure.repl/pst e)))", expr);

        evalObject.isRunning = true;
        var result;
        sess.send('clojureEval', {code: expr}, function(answer) {
            result = Object.merge([result || {}, answer.data]);
            if (answer.data['eval-id']) evalObject['eval-id'] = answer.data['eval-id'];
            if (answer.expectMoreResponses) return;
            evalObject.isRunning = false;
            if (result.error) thenDo && thenDo(result.error, null);
            else prepareRawResult(result.result, thenDo); });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function prepareRawResult(rawResult, thenDo) {

            if (Object.isString(rawResult) && rawResult.match(/error/i))
                rawResult = [{err: rawResult}];

            if (!Object.isArray(rawResult) || !rawResult.length) {
                console.warn("strange clj eval rawResult: %o", rawResult);
                return;
            };

            var errors = rawResult.pluck("ex").compact().concat(rawResult.pluck("err").compact()),
                isError = !!errors.length,
                result = rawResult.pluck('value').concat(rawResult.pluck('out')).compact().join('\n'),
                err;

            if (isError) {
                errors.unshift(rawResult.pluck("status").flatten().without("done"));
                var cause = rawResult.pluck('root-ex').flatten().compact();
                if (cause.length) errors.pushAll(["root-cause:"].concat(cause));
                err = errors.flatten().compact().invoke('trim').join('\n');
            }

            if (!isError && pp) try { result = eval(result); } catch (e) {}
            if (!isError && isJSON) try { result = JSON.parse(eval(result)); } catch (e) {
                err = e;
                result = {error: e};
            }
            thenDo && thenDo(options.passError ? err : null, err || result);
        }
    },

    doEval: function(expr, options, thenDo) {
        if (!thenDo) { thenDo = options; options = null; };
        this.evalQueue.push({
            expr: expr,
            options: options || {},
            isRunning: false,
            "eval-id": null,
            callback: thenDo});
        this.runEvalFromQueue();
    },

    evalInterrupt: function(thenDo) {
        var clj = this;
        var evalObject = clj.evalQueue[0];
        if (!evalObject) thenDo(new Error("no clj eval running"));
        else if (!evalObject.isRunning || !evalObject['eval-id']) cleanup();
        else {
            var sess = lively.net.SessionTracker.getSession();
            sess.send('clojureEvalInterrupt', {"eval-id": evalObject['eval-id']}, function(answer) {
                cleanup();
                thenDo(answer.error || answer.data.error, answer.data);
            });
        }
        
        function cleanup() {
            clj.evalQueue.remove(evalObject);
            clj.runEvalFromQueue.bind(clj).delay(0);
        }
    }

});

var ClojureMode = lively.ide.ace.require('ace/mode/clojure').Mode;

ClojureMode.addMethods({

    commands: {
        prettyPrint: {
            exec: function(ed) {
                var string = ed.$morph.getSelectionOrLineString();
                lively.ide.codeeditor.modes.Clojure.prettyPrint(string, function(err, string) {
                    ed.insert(string);
                    // ed.$morph.printObject(ed, err ? err : string);
                });
                
            }
        },

        printDoc: {
            exec: function(ed) {
                var string = ed.$morph.getSelectionOrLineString();
                lively.ide.codeeditor.modes.Clojure.fetchDoc(string, function(err, docString) {
                    ed.$morph.printObject(ed, err ? err : docString);
                });
            }
        },
        
        evalInterrupt: {
            exec: function(ed) {
                ed.$morph.setStatusMessage("Interrupting eval...");
                lively.ide.codeeditor.modes.Clojure.evalInterrupt(function(err, answer) {
                    ed.$morph.setStatusMessage(Objects.inspect(err || answer), err ? Color.red : null);
                });
            },
        }
    },

    keybindings: {
        "Command-Shift-/": "printDoc",
        "Tab": "prettyPrint"
    },

    keyhandler: null,

    initKeyHandler: function() {
        Properties.forEachOwn(this.keybindings, function(key, commandName) {
            if (this.commands[commandName]) {
                if (this.commands[commandName].bindKey) {
                    var bound = this.commands[commandName].bindKey;
                    if (!Object.isArray(bound)) bound = [bound];
                    bound.push(key);
                    this.commands[commandName].bindKey = bound;
                } else this.commands[commandName].bindKey = key
            }
        }, this);
        return this.keyhandler = lively.ide.ace.createKeyHandler({
            keyBindings: this.keybindings,
            commands: this.commands
        });
    },

    attach: function(ed) {
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
    },

    detach: function(ed) {
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
        this.keyhandler = null;
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    doEval: function(codeEditor, insertResult) {
        var sourceString = codeEditor.getSelectionOrLineString();
        lively.ide.codeeditor.modes.Clojure.doEval(sourceString, {prettyPrint: true}, function(err, result) {
            printResult(err, result)
        });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            if (insertResult) codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
            else codeEditor.collapseSelection("end");
        }
    }
});

lively.ide.codeeditor.ModeChangeHandler.subclass('lively.ide.codeeditor.modes.Clojure.ChangeHandler',
"settings", {
    targetMode: "ace/mode/clojure"
},
"parsing", {
    parse: function(src, session) {
        var options = {};
        return null;
        // return closer.parse(src, options);
    }
},
'rendering', {

    onDocumentChange: function(evt) {
        this.updateAST(evt)
    },

    updateAST: function(evt) {
        var codeEditor = evt.codeEditor,
            session = evt.session,
            src = evt.codeEditor.textString,
            ast;

        // 1. parse
        try {
            ast = session.$ast = this.parse(src, session);
        } catch(e) { ast = session.$ast = e; }

        // 2. update lively codemarker
        var marker = this.ensureLivelyCodeMarker(session);
        marker.modeId = this.targetMode;
        marker.markerRanges.length = 0;

        // if (codeEditor.getShowWarnings()) {
        //     marker.markerRanges.pushAll(
        //         lively.ast.query.findGlobalVarRefs(ast, {jslintGlobalComment: true}).map(function(ea) {
        //             ea.cssClassName = "ace-global-var"; return ea; }));
        // }

        // if (ast.parseError && codeEditor.getShowErrors()) {
        //     ast.parseError.cssClassName = "ace-syntax-error";
        //     marker.markerRanges.push(ast.parseError);
        // }

        // marker.redraw(session);

        // 3. emit session astChange event
        var astChange = {ast: ast, docChange: evt.data, codeEditor: codeEditor};
        session._signal('astChange', astChange);
    }

});

(function registerModeHandler() {
    lively.module('lively.ide.codeeditor.DocumentChange').runWhenLoaded(function() {
        lively.ide.CodeEditor.DocumentChangeHandler.registerModeHandler(lively.ide.codeeditor.modes.Clojure.ChangeHandler);
    });
})();

}) // end of module
