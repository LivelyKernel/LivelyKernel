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
            }, function(err) { thenDo(null, cmd); });
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
                var cmdString = Strings.format("lsof -i tcp:%s -t | xargs kill; ", port);
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


        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            if (insertResult) codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
            else codeEditor.collapseSelection("end");
        }

        function prepareRawResult(rawResult) {
            if (!Object.isArray(rawResult) || !rawResult.length) return rawResult;
            var isError = !!rawResult[0].ex;
            return isError ?
                [rawResult.pluck('ex'), rawResult.pluck('root-ex'), rawResult.pluck('err')].flatten().compact().invoke('trim').uniq().join('\n') :
                 rawResult.pluck('value').concat(rawResult.pluck('out')).compact().join('\n');
        }
    }
});

}) // end of module
