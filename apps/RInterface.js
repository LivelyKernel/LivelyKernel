module('apps.RInterface').requires('lively.net.WebSockets', 'lively.Network').toRun(function() {

Object.extend(apps.RInterface, {

    evalProcesses: [],

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    //  start an evaluation, with a callback to report the first state (error or result), with a maximum
    //      length of time to wait.
    //	reasons to return:
    //      - error (in start request or in evaluation)
    //      - end of the evaluation
    //      - timeout (in which case we try to stopEval, but don't wait for that to succeed)
    //  if timeout is null we keep waiting indefinitely.
    //  invokes callback(error, result)
    doEval: function(expr, timeout, callback) {
        var id;
        var statusOk = true;
        var self = this;
        var startTime = Date.now();
        var results = [];
        var indefinite = timeout==null;
        var exitOnCompletion = !indefinite;     // if indefinite, tell R not to add a marker signalling end of eval 
        var mergeVars = !indefinite;            // if indefinite, tell R not to merge vars into globalenv
        var pollForResult = function() {
            if (statusOk) {
                self.livelyREvaluate_URL.withQuery({id: id, merge: mergeVars}).asWebResource()
                    .beAsync().get().whenDone(function(content, status) {
                        if (!status.isSuccess()) {
                            callback(status, null)     // a communication error
                        } else {
                            var result = self.livelyREvaluate_extractResult(status,content);
                            if (result.state == 'UNKNOWN') return;      // nothing more to do
                            var out = result.output
                            if (out && out.length>0) {
                                out.forEach(function(res) {
                                    if (res.value || res.message || res.warning || res.error)
                                        results.push(res)
                                })
                            }
                            // console.log(result.state);
                            if (result.state == 'ERROR') {
                                console.log(results.last().error);
                                callback(results.last().error, results);
                                return;
                            }
                            if (['COMPLETE', 'INTERRUPT'].include(result.state)) {
                                callback(null, results);
                                return;
                            }
                            // results are delivered one step at a time, so if the timeout expires
                            // we might not see all the results that have been generated.  tough.
                            if (timeout && Date.now()-startTime > timeout) {
                                self.livelyREvaluate_stopEval(id, function(err,res) { if (err) show(err) });
                                callback({error: 'timeout', id: id}, results);
                                return;
                            }
                            // if this is an indefinite evaluation, deliver results as they arrive.
                            if (indefinite && results.length) {
                                callback(null, results);
                                results = [];
                            }
                            // if we found any results this time, don't wait long before asking again.
                            pollForResult.delay(out ? 0.1 : 0.3);
                        }
                    });
                }
        };
        id = this.livelyREvaluate_startEval(expr, exitOnCompletion, function(content, status) {
            // check only the status
            if (!status.isSuccess()) {
                self.statusOk = false;      // abandon result polling
                callback(status, null);
                }
            });

        //var evalProc = {id: id, state: null, output: null};
        //apps.RInterface.evalProcesses.push(evalProc);

        setTimeout(pollForResult, 500);         // give R a little time
        return id;
    },

    resetRServer: function() {
        new URL((Config.nodeJSWebSocketURL || Config.nodeJSURL) + '/RServer/reset')
            .asWebResource().beAsync().post();
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // simple eval
    createEvalExpression: function(code) {
        var escaped = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return Strings.format(
            "tryCatch({expr <- parse(text=\"%s\"); eval(expr)}, error = function(e) print(e))", escaped);
    },

    evalSync: function(expr, callback) {
        // simple R eval, using R's default eval method. Happens synchronous in
        // R (but of course asynchronous for usi n the browser session)
        var url = new URL(Config.nodeJSURL+'/').withFilename('RServer/eval'),
            sanitizedExpr = this.createEvalExpression(expr),
            self = this;
        url.asWebResource()
            .withJSONWhenDone(function(json, status) {
                var err = status.isSuccess() ? null : json.error || json.message || json.result || 'unknown error';
                callback(err, String(json.result).trim()); })
            .post(JSON.stringify({expr: sanitizedExpr, timeout: 3000}), 'application/json');
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // eval via lively-R-evaluate
    livelyREvaluate_URL: new URL(Config.nodeJSURL+'/').withFilename('RServer/evalAsync'),

    livelyREvaluate_extractResult: function(reqStatus, contentString) {
        // If the reqStatus indicates success (for the network request),
        // and the contentString is well formed, extract and return any result element(s) from it
        // as an object  { state: <PARTIAL/COMPLETE/INTERRUPT/ERROR>, output: [array of result elements] }
        // where each result element can include a value or null for value, text, message etc.
        // If the R process returned PENDING or UNKNOWN), output will be null.
        // If the extraction fails in some way, return an error string.
        return tryProcessResult(reqStatus, contentString);
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function tryProcessResult(reqStatus, evalResultString) {
            var result;
            return reqStatus.isSuccess()
                && evalResultString
                && processResult(evalResultString);
        }
        function processResult(output) {
            if (!output) return "No output for evaluation";
            var jso;
            try {
                jso = JSON.parse(output);
                if (!jso.hasOwnProperty('result'))
                    throw new Error("Malformed output " + output);
            } catch(e) {
                return 'Error: ' + String(e);
            }
            // jso is something like: {
            //     "processState": "PARTIAL",
            //     "result": {
            //         "source": ["1+2\n","44\n"],
            //         "value": ["3","44"],
            //         "text": ["NA","NA"],
            //         "graphics": ["NA","NA"],
            //         "message": ["NA","NA"],
            //         "warning": ["NA","NA"],
            //         "error": ["NA","NA"]
            //     }
            // }
            // note that source, value, ... can also be just a string when
            // there was only a single expressions
            var result = {state: jso.processState, output: null};
            if (['PENDING', 'UNKNOWN'].include(result.state)) { return result; }
            result.output = [];
            function cleanValue(val) { return val === "NA" ? null : val; }
            var singleExpr = jso.result && Object.isString(jso.result.source),
                length = singleExpr ? 1 : (jso.result && jso.result.source.length) || 0;
            if (singleExpr) {
                Properties.forEachOwn(jso.result, function(type, value) { jso.result[type] = [value]; });
            }
            for (var i = 0; i < length; i++) {
                var exprResult = {}
                Properties.forEachOwn(jso.result, function(type, values) {
                    exprResult[type] = cleanValue(values[i]); })
                result.output[i] = exprResult;
            }
            return result;
        }
    },

    livelyREvaluate_startEval: function(expr, exitOnCompletion, callback) {
        // init evaluation using the lively-R-evaluate package on the R side, and return its id.
        // This will start a new R process that runs the evaluation (asynchronously).
        // Invokes  callback(content, status) as received from the network request.
        var id = Strings.newUUID();
        var sanitizedExpr = expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"'),
            self = this;
        
        /* if we want to store intermediate state in evalProc
            if (result) {
                evalProc.state = result.state;
                evalProc.output = result.output;
            }
        */
        
        // run a quick test synchronously to ensure that the R server is truly up and running
        this.evalSync("pkgTest('LivelyREvaluate')\n", function(err, result) {
            if (err) { show(err) }
            else {
                self.livelyREvaluate_URL.asWebResource().beAsync() 
                    .post(JSON.stringify({expr: sanitizedExpr, id: id, exit: exitOnCompletion, debug: false}), 'application/json')
                    .whenDone(callback);
            }
        });
        return id;
    },
    oldlivelyREvaluate_startEval: function(expr, callback) {
        // init evaluation using the lively-R-evaluate package on the R side.
        // This will start a new R process that runs the evaluation (asynchronously)
        // apps.RInterface.evalProcesses
        var id = Strings.newUUID();
        var evalProc = {id: id, state: null, output: null};
        this.evalProcesses.push(evalProc);
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var sanitizedExpr = expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"'),
            self = this;
        // 2) get result
        var startTime = Date.now(), timeout = 3*1000;
        function done(err, result) {
            if (result) {
                evalProc.state = result.state;
                evalProc.output = result.output;
            }
            apps.RInterface.evalProcesses.remove(evalProc);
            callback(err, result);
        }
        // 1) start eval
        this.livelyREvaluate_URL.asWebResource().beAsync()
            .post(JSON.stringify({expr: sanitizedExpr, id: id}), 'application/json')
            .whenDone(function(content, status) {
                var result = self.livelyREvaluate_extractResult(status,content);
                if (result) done(null, result); else self.livelyREvaluate_getResult(id, done); });
        return id;
    },


    livelyREvaluate_getResults: function(id, timeout, callback) {
        // Ask for results from the specified asynchronous evaluation.
        // If none is forthcoming keep asking every 100ms for up to 3s, then generate a timeout error.
        // Invokes  callback(errorOrNull, resultsOrNull)
        var startTime = Date.now(), timeout = 3*1000, self = this;
        (function fetchResult() {
            self.livelyREvaluate_URL.withQuery({id: id}).asWebResource()
                .beAsync().get().whenDone(function(content, status) {
                    var result = self.livelyREvaluate_extractResult(status,content);
                    if (result) { thenDo(null, result); return; }
                    if (Date.now()-startTime < timeout) { fetchResult.delay(0.1); return; }
                    var err = {error: 'timeout', id: id};
                    thenDo(err, err);
                });
        })();
    },
    oldlivelyREvaluate_getResult: function(id, thenDo) {
        // Ask for a result for the specified asynchronous evaluation.
        // If none is forthcoming keep asking every 100ms for up to 3s, then generate a timeout error.
        // Invokes  thenDo(errorOrNull, errorOrResult)
        var startTime = Date.now(), timeout = 3*1000, self = this;
        (function fetchResult() {
            self.livelyREvaluate_URL.withQuery({id: id}).asWebResource()
                .beAsync().get().whenDone(function(content, status) {
                    var result = self.livelyREvaluate_extractResult(status,content);
                    if (result) { thenDo(null, result); return; }
                    if (Date.now()-startTime < timeout) { fetchResult.delay(0.1); return; }
                    var err = {error: 'timeout', id: id};
                    thenDo(err, err);
                });
        })();
    },


    livelyREvaluate_stopEval: function(id, thenDo) {
        // invokes thenDo(errorOrFalse, resultJson)
        this.livelyREvaluate_URL.withQuery({id: id}).asWebResource().beAsync()
            .del()
            .withJSONWhenDone(function(json, status) {
                var isError = !status.isSuccess() || (json && !!json.error)
                var processes = apps.RInterface.evalProcesses;
                processes.each(function(evalProc) {
                    if (evalProc.id == id) {
                        processes.remove(evalProc);
                        return false;       // break
                    }
                });
                if (isError) thenDo(json.message||json.error, null); else thenDo(null, json)
            });
    },

});

// lively.BuildSpec('apps.RInterface.Workspace', {
//     _BorderColor: Color.rgb(204,0,0),
//     _Extent: lively.pt(735.0,422.0),
//     _Position: lively.pt(15.0,143.0),
//     _StyleClassNames: ["Morph","Window"],
//     cameForward: true,
//     className: "lively.morphic.Window",
//     collapsedExtent: lively.pt(697.0,22.0),
//     collapsedPosition: lively.pt(163.0,21.0),
//     collapsedTransform: {
//         a: 1,
//         b: 0,
//         c: 0,
//         d: 1,
//         e: 163,
//         f: 21
//     },
//     contentOffset: lively.pt(4.0,22.0),
//     doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
//     draggingEnabled: true,
//     expandedExtent: lively.pt(697.0,428.0),
//     expandedPosition: lively.pt(163.0,21.0),
//     expandedTransform: {
//         a: 1,
//         b: 0,
//         c: 0,
//         d: 1,
//         e: 163,
//         f: 21
//     },
//     helperMorphs: "[<lively.morphic.ReframeHandle#DD5A9...>,<lively.morphic.ReframeHandle#369E0...>,<lively.morphic.ReframeHandle#F0A52...>]",
//     highlighted: false,
//     ignoreEventsOnExpand: false,
//     layout: {
//         adjustForNewBounds: true
//     },
//     prevDragPos: lively.pt(331.0,156.0),
//     sourceModule: "lively.morphic.Widgets",
//     state: "expanded",
//     submorphs: [{
//         R: {
//             connectionPoints: "result"
//         },
//         _BorderColor: Color.rgb(95,94,95),
//         _BorderWidth: 1,
//         _Extent: lively.pt(725.0,394.0),
//         _FontSize: 14,
//         _LineWrapping: false,
//         _Position: lively.pt(4.0,22.0),
//         _ShowActiveLine: true,
//         _ShowGutter: true,
//         _ShowIndents: true,
//         _ShowInvisibles: false,
//         _ShowPrintMargin: true,
//         _SoftTabs: true,
//         _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace_nobold","ace_multiselect","ace_dark","ace-pastel-on-dark"],
//         _TextMode: "r",
//         _setShowIndents: true,
//         accessibleInInactiveWindow: true,
//         className: "lively.morphic.CodeEditor",
//         connections: {
//             evalR: {},
//             evalRResult: {}
//         },
//         doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
//         droppingEnabled: true,
//         hasRobertsKeys: true,
//         layout: {
//             resizeHeight: true,
//             resizeWidth: true
//         },
//         name: "R-workspace",
//         sourceModule: "lively.ide.CodeEditor",
//         submorphs: [],
//         textMode: "r",
//         textString: "5 + 6",
//         boundEval: function boundEval(expr) {
//         return this.evalR(expr, function() {});
//     },
//         doit: function doit(printResult, editor) {
//         var text = this.getSelectionOrLineString(), self = this;
//         apps.RInterface.doEval(text, function(err, result) {
//             if (printResult) { self.printObject(editor, err ? err : result); }
//         });
//         if (printResult) return;
//         var sel = editor.selection;
//         if (sel && sel.isEmpty()) sel.selectLine();
//     },
//         evalR: function evalR(expr, thenDo) {
//         apps.RInterface.doEval(expr, function(err, result) {
//             thenDo(result);
//         }.bind(this));
//     },
//     onFromBuildSpecCreated: function onFromBuildSpecCreated() {
//         $super();
//          // r mode fix for weird keyboard behavior
//         Object.extend(
//             lively.ide.ace.require('ace/mode/r').Mode.prototype,
//             lively.ide.ace.require('ace/mode/javascript').Mode.prototype)
//     },
//         onLoad: function onLoad() {
//         $super();
//         // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//         // r mode fix for weird keyboard behavior
//         Object.extend(
//             lively.ide.ace.require('ace/mode/r').Mode.prototype,
//             lively.ide.ace.require('ace/mode/javascript').Mode.prototype)
//     },
//         reset: function reset() {
//         // this.getPartsBinMetaInfo().addRequiredModule('apps.RInterface');
//         disconnectAll(this);
//         // delete this.evalRResult;
//         // this.connections = {
//         //     evalR: {},
//         //     evalRResult: {}
//         // }
//     },
//         test: function test() {
//         /*
//         this.test();
//         */
//         this.reset()
//         this.onLoad();
//         [function test1(next) {
//             connect(this.R, 'result', Global, 'show', {converter: function(v) { return 'test1:' + v}, removeAfterUpdate: true});
//             this.R.doEval('1+2');
//             next.delay(1);
//         },
//         function test2(next) {
//             connect(this, 'evalRResult', Global, 'show', {converter: function(v) { return 'test2:' + v}, removeAfterUpdate: true});
//             this.evalR('99 + 1\n23 + 2');
//             next.delay(1);
//         },
//         function test3(next) {
//             connect(this, 'evalRResult', Global, 'show', {converter: function(v) { return 'test2:' + v}, removeAfterUpdate: true});
//             this.evalR('nonsense');
//             next.delay(1);
//         }].doAndContinue(null, show.curry('All tests done'), this);
//         // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//     }
//     }],
//     titleBar: "R Workspace",
//     withoutLayers: "[GrabbingLayer]"
// });

}) // end of module