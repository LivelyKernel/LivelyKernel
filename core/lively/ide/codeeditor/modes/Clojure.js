module('lively.ide.codeeditor.modes.Clojure').requires('lively.ide.codeeditor.ace').toRun(function() {

Object.extend(lively.ide.codeeditor.modes.Clojure, {
    AceClojureMode: lively.ide.ace.require('ace/mode/clojure').Mode,

    sessions: {},

    getSessionStates: function() { return this.sessions; },

    getSessionState: function(sessId) {
        sessId = sessId || "default";
        var sessions = this.getSessionStates()
        return sessions[sessId] || (sessions[sessId] = {});
    },

    sendQueuePush: function(sessId, sendData, sendCallback) {
        var sessSt = this.getSessionState(sessId);
        var sends = sessSt.sendQueue || (sessSt.sendQueue = []);
        sends.push({data: sendData, callback: sendCallback});
    },

    sendQueueShift: function(sessId, sendData, sendCallback) {
        var sessSt = this.getSessionState(sessId);
        var sends = sessSt.sendQueue;
        return sends && sends.shift();
    },

    sendQueuePeek: function(sessId, sendData, sendCallback) {
        var sessSt = this.getSessionState(sessId);
        var sends = sessSt.sendQueue;
        return sends && sends[0];
    },

    sendQueueRunNext: function(sessId) {
        var nextJob = this.sendQueuePeek(sessId);
        nextJob && this._nReplSend(nextJob.data, nextJob.callback);
    },

    sendInProgress: function(sessId) { return !!this.sendQueuePeek(sessId); },

    // see https://github.com/clojure/tools.nrepl/blob/master/doc/ops.md
    _nReplSend: function(data, callback) {
        // (!) sess is not nRepl session but lively2lively session
        var next = this.sendQueueRunNext.bind(this, data.session);
        var disposeCurrentSendFromQueue = this.sendQueueShift.bind(this);
        var sess = lively.net.SessionTracker.getSession();
        sess.send('clojureNreplSend', data, function(answer) {
            disposeCurrentSendFromQueue();
            setTimeout(next, 0);
            try {
                callback(!answer || answer.data.error, answer.data);
            } catch(e) {
                console.error(e);
            }
        });
    },

    nReplSend: function(data, callback) {
        data = data || {};
        if (!module('lively.net.SessionTracker').isLoaded() || !lively.net.SessionTracker.getSession()) {
            callback(new Error('Lively2Lively not loaded, cannot connect to Clojure nREPL server!'));
            return;
        }
        var sendInProgress = this.sendInProgress(data.session);
        this.sendQueuePush(data.session, data, callback);
        if (!sendInProgress) this.sendQueueRunNext(data.session);
    },

    describe: function(options, callback) {
        // :describe
        // Produce a machine- and human-readable directory and documentation for the
        // operations supported by an nREPL endpoint.
        // Optional parameters
        // :verbose? Include informational detail for each "op"eration in the return
        // message.
        // Returns
        // :ops Map of "op"erations supported by this nREPL endpoint
        // :versions Map containing version maps (like *clojure-version*, e.g. major,
        // minor, incremental, and qualifier keys) for values, component names as keys.
        // Common keys include "nrepl" and "clojure".
        this.nReplSend({op: 'describe', "verbose?": "true"}, callback);
    },

    clone: function(options, callback) {
        // Clones the current session, returning the ID of the newly-created session.
        // Optional parameters
        // :session The ID of the session to be cloned; if not provided, a new session with default bindings is created, and mapped to the returned session ID.
        // Returns
        // :new-session The ID of the new session.
        this.nReplSend({op: 'clone', session: options.session}, callback);
    },

    close: function(options, callback) {
        // :close
        // Closes the specified session.
        // Required parameters
        // :session The ID of the session to be closed.
        this.nReplSend({op: 'close', session: options.session}, callback);
    },

    interrupt: function(options, callback) {
        // :interrupt
        // Attempts to interrupt some code evaluation.
        // Required parameters
        // :session The ID of the session used to start the evaluation to be
        // interrupted.
        // Optional parameters
        // :interrupt-id The opaque message ID sent with the original "eval" request.
        // Returns
        // :status 'interrupted' if an evaluation was identified and
        // interruption will be attempted 'session-idle' if the session is not
        // currently evaluating any code 'interrupt-id-mismatch' if the session is
        // currently evaluating code sent using a different ID than specified by
        // the "interrupt-id" value
        this.nReplSend({op: 'interrupt', "interrupt-id": options.interruptId, session: options.session}, callback);
    },

    loadFile: function(options, callback) {
        // :load-file
        // Loads a body of code, using supplied path and filename info to set
        // source file and line number metadata. Delegates to underlying "eval"
        // middleware/handler.
        // Required parameters
        // :file Full contents of a file of code.
        // Optional parameters
        // :file-name Name of source file, e.g. io.clj
        // :file-path Source-path-relative path of the source file, e.g.
        // clojure/java/io.clj
        this.nReplSend({op: 'loadFile', file: options.file, "file-name": options.fileName, "file-path": options.filePath}, callback);
    },

    lsSessions: function(options, callback) {
        // :ls-sessions
        // Lists the IDs of all active sessions.
        // Returns
        // :sessions A list of all available session IDs.    
        this.nReplSend({op: 'ls-sessions'}, callback);
    },

    stdin: function(options, callback) {
        // :stdin
        // Add content from the value of "stdin" to *in* in the current session.
        // Required parameters
        // :stdin Content to add to *in*.
        // Returns
        // :status A status of "need-input" will be sent if a session's *in
        // requires content in order to satisfy an attempted read operation.
        this.nReplSend({op: 'stdin', stdin: options.stdin}, callback);
    },

    doEval: function(options, callback) {
        // :eval
        // Evaluates code.
        // Required parameters
        // :code The code to be evaluated.
        // :session The ID of the session within which to evaluate the code.
        // Optional parameters
        // :id An opaque message ID that will be included in responses related to the evaluation, and which may be used to restrict the scope of a later "interrupt" operation.
        // Returns
        function prepareRawResult(rawResult) {
            if (!Object.isArray(rawResult) || !rawResult.length) return rawResult;
            var isError = !!rawResult[0].ex;
            return isError ?
                [rawResult.pluck('ex'), rawResult.pluck('root-ex'), rawResult.pluck('err')].flatten().compact().join('\n') :
                rawResult.pluck('value').concat(rawResult.pluck('out')).compact().join('\n');
        }
        this.nReplSend({op: 'eval', code: options.code}, function(err, data) {
            callback(err, prepareRawResult(data.result)); });
    }
});

lively.ide.codeeditor.modes.Clojure.AceClojureMode.addMethods({
     doEval: function(codeEditor, insertResult) {
        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
        }
        function prepareRawResult(rawResult) {
            if (!Object.isArray(rawResult) || !rawResult.length) return rawResult;
            var isError = !!rawResult[0].ex;
            return isError ?
                [rawResult.pluck('ex'), rawResult.pluck('root-ex'), rawResult.pluck('err')].flatten().compact().join('\n') :
                rawResult.pluck('value').concat(rawResult.pluck('out')).compact().join('\n');
        }
         if (!module('lively.net.SessionTracker').isLoaded()) {
             printResult('Lively2Lively not loaded, cannot connect to Clojure nREPL server!');
             return;
         }
        var sourceString = codeEditor.getSelectionOrLineString(),
            sess = lively.net.SessionTracker.getSession()
        sess.send('clojureNreplSend', {op: 'eval', code: sourceString}, function(answer) {
            printResult(answer.data.error, prepareRawResult(answer.data.result)); });
    }
});

}) // end of module