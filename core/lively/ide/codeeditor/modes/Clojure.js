module('lively.ide.codeeditor.modes.Clojure').requires('lively.ide.codeeditor.ace').toRun(function() {


lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment = {};

Object.extend(lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment, {

    currentEnv: function(codeEditor) {
        var runtime = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment;
        if (codeEditor) {
            var st = runtime.ensureClojureStateInEditor(codeEditor);
            if (st.env) return st.env;
        }

        var env = $morph('clojureEnv') && $morph('clojureEnv').getCurrentEnv()
        if (env) return env;

        return {
            port: 7888,
            host: "0.0.0.0",
            session: null
        }
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
        var runtime = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment,
            sess = editorMorph.getSession();
        return sess.$livelyClojureState || (sess.$livelyClojureState = {env: null});
    },
    
    changeInEditor: function(editorMorph, newEnv) {
        var runtime = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment;
        return runtime.ensureClojureStateInEditor(editorMorph).env = newEnv;
    }

});

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

Object.extend(lively.ide.codeeditor.modes.Clojure, {

    prettyPrint: function(runtimeEnv, code, thenDo) {
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
            prettify, {env: runtimeEnv, passError: true, resultIsJSON: false},
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

    fetchDoc: function(runtimeEnv, expr, thenDo) {
        this.doEval("(doc " + expr + ")", {env: runtimeEnv, prettyPrint: true}, thenDo);
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
        var clj = lively.ide.codeeditor.modes.Clojure;
        var env = evalObject.env;
        var options = evalObject.options;
        var expr = evalObject.expr;
        var pp = options.hasOwnProperty("prettyPrint") ? options.prettyPrint : false;
        var ppLevel = options.hasOwnProperty("prettyPrintLevel") ? options.prettyPrintLevel : null;
        var isJSON = options.hasOwnProperty("resultIsJSON") ? options.resultIsJSON : false;
        var catchError = options.hasOwnProperty("catchError") ? options.catchError : true;

        if (!module('lively.net.SessionTracker').isLoaded() || !lively.net.SessionTracker.isConnected()) {
            thenDo(new Error('Lively2Lively not running, cannot connect to Clojure nREPL server!'));
            return;
        }
        var sess = lively.net.SessionTracker.getSession();
        var cljSession = env.session;

        if (pp) expr = Strings.format("(with-out-str (clojure.pprint/write (do %s) %s))", expr, ppLevel ? ":level " + ppLevel : "");
        if (catchError) expr = Strings.format("(try %s (catch Exception e (clojure.repl/pst e)))", expr);

        evalObject.isRunning = true;
        var nreplOptions = {port: env.port || 7888, host: env.host || "127.0.0.1"};
        var nreplMessages = [];

        sess.send('clojureEval', {nreplOptions: nreplOptions, session: cljSession, ignoreMissingSession: true, code: expr}, function(answer) {
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
            else prepareRawResult(nreplMessages, thenDo); });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function prepareRawResult(messages, thenDo) {
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
                isError = !!errors.length,
                result = messages.pluck('value').concat(messages.pluck('out')).compact().join('\n'),
                err;

            if (status.include("interrupted")) result = result + "[interrupted eval]";

            if (isError) {
                errors.unshift(status.without("done"));
                var cause = messages.pluck('root-ex').flatten().compact();
                if (cause.length) errors.pushAll(["root-cause:"].concat(cause));
                err = errors.flatten().compact().invoke('trim').join('\n');
            }

            if (!isError && pp) try { result = eval(result); } catch (e) {}
            if (!isError && isJSON) try { result = JSON.parse(eval(result)); } catch (e) {
                err = e;
                result = {error: e};
            }

            if (isError && String(result).include("ECONNREFUSED")) {
                result = "No clojure server listening?" + result;
            }

            thenDo && thenDo(options.passError ? err : null, err || result);
        }

    },

    doEval: function(expr, options, thenDo) {
        if (!thenDo) { thenDo = options; options = null; };
        this.evalQueue.push({
            env: options.env || lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment.currentEnv(),
            expr: expr,
            options: options || {},
            isRunning: false,
            "eval-id": null,
            callback: thenDo});
        this.runEvalFromQueue();
    },

    evalInterrupt: function(env, thenDo) {
        // FIXME ... eval queue, eval objects should belong to a Clojure runtime env...!
        var clj = this;
        var evalObject = clj.evalQueue[0];
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
    }

});

var ClojureMode = lively.ide.ace.require('ace/mode/clojure').Mode;

ClojureMode.addMethods({

    commands: {
        prettyPrint: {
            exec: function(ed) {
                var string = ed.$morph.getSelectionOrLineString();
                var runtime = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment;
                var env = runtime.currentEnv(ed.$morph);
                lively.ide.codeeditor.modes.Clojure.prettyPrint(env, string, function(err, string) {
                    ed.insert(string);
                    // ed.$morph.printObject(ed, err ? err : string);
                });

            }
        },

        printDoc: {
            bindKey: 'Command-Shift-/',
            exec: function(ed) {
                var string = ed.$morph.getSelectionOrLineString();
                var runtime = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment;
                var env = runtime.currentEnv(ed.$morph);
                lively.ide.codeeditor.modes.Clojure.fetchDoc(env, string, function(err, docString) {
                    ed.$morph.printObject(ed, err ? err : docString);
                });
            }
        },

        evalInterrupt: {
            bindKey: 'Command-.',
            exec: function(ed) {
                ed.$morph.setStatusMessage("Interrupting eval...");
                var runtime = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment;
                var env = runtime.currentEnv(ed.$morph);
                lively.ide.codeeditor.modes.Clojure.evalInterrupt(env, function(err, answer) {
                    console.log("Clojure eval interrupt: ", Objects.inspect(err || answer));
                    // ed.$morph.setStatusMessage(Objects.inspect(err || answer), err ? Color.red : null);
                });
            }
        },

        changeClojureEnv: {
            bindKey: 'Command-e',
            exec: function(ed) {
                var runtime = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment;
                var env = runtime.currentEnv(ed.$morph);
                $world.prompt("Change clojure runtime environment:", function(input) {
                    var env = runtime.readEnv(input);
                    if (!env) show("not a valid host/port combo: " + input);
                    else runtime.changeInEditor(ed.$morph, env);
                }, {input: runtime.printEnv(env)})
            }
        }
    },

    keybindings: {
        "Command-Shift-/": "printDoc",
        "Tab": "prettyPrint",
        "Command-.": "evalInterrupt"
    },

    keyhandler: null,

    initKeyHandler: function() {
        this.keyhandler = new (lively.ide.ace.require("ace/keyboard/hash_handler")).HashHandler();
        this.keyhandler.addCommands(this.commands);
        return this.keyhandler;
    },

    attach: function(ed) {
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
        lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment.ensureClojureStateInEditor(ed.$morph);
    },

    detach: function(ed) {
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
        this.keyhandler = null;
    },

    morphMenuItems: function(items, editor) {
        var mode = this;
        items.push(['Clojure',[
            ['change Clojure runtime environment (Command-e)', function() { mode.commands.changeClojureEnv.exec(editor.aceEditor); }],
            ['interrupt eval (Command-.)', function() { mode.commands.evalInterrupt.exec(editor.aceEditor); }],
            ['pretty print code (Tab)', function() { mode.commands.prettyPrint.exec(editor.aceEditor); }],
            ['print doc for selected expression (Command-?)', function() { mode.commands.printDoc.exec(editor.aceEditor); }]
        ]]);
    
        return items;
    },

    evalAndPrint: function(codeEditor, insertResult, prettyPrint, prettyPrintLevel) {
        var sourceString = codeEditor.getSelectionOrLineString(),
            env = lively.ide.codeeditor.modes.Clojure.RuntimeEnvironment.currentEnv(codeEditor),
            options = {env: env, prettyPrint: prettyPrint, prettyPrintLevel: prettyPrintLevel, catchError: false};
        lively.ide.codeeditor.modes.Clojure.doEval(sourceString, options, printResult);

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            if (insertResult) codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
            else codeEditor.collapseSelection("end");
        }
    },

    doEval: function(codeEditor, insertResult) {
        return this.evalAndPrint(codeEditor, insertResult, false);
    },
    
    printInspect: function(codeEditor, options) {
        return this.evalAndPrint(codeEditor, true, true, options.depth || 4);
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
