module('apps.RInterface').requires('lively.net.WebSockets').toRun(function() {

Object.extend(apps.RInterface, {

    ensureConnection: function() {
        if (this.webSocket) return this.webSocket;
        var url = new URL((Config.nodeJSWebSocketURL || Config.nodeJSURL) + '/RServer/connect');            
        return this.webSocket = new lively.net.WebSocket(url, {protocol: 'lively-json'});
    },

    createEvalExpression: function(code) {
        var escaped = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return Strings.format(
            "tryCatch({expr <- parse(text=\"%s\"); eval(expr)}, error = function(e) print(e))", escaped);
    },

    doEvalWebSocket: function(expr, callback) {
        var ws = this.ensureConnection(),
            sanitizedExpr = this.createEvalExpression(expr),
            self = this;
        this.webSocket.send(
            {action: 'doEval', data: {expr: sanitizedExpr}},
            function(msg) { self.processResult(msg, callback); });
    },

    doEvalHTTP: function(expr, callback) {
        var sanitizedExpr = this.createEvalExpression(expr), self = this;
        new URL(Config.nodeJSURL+'/').withFilename('RServer/eval')
            .asWebResource()
            .withJSONWhenDone(function(json, status) { self.processResult({data: json}, callback); })
            .post(JSON.stringify({expr: sanitizedExpr, evalTimeout: 5*1000}), 'application/json');
    },

    doEvalHTTP2: function(id, expr, callback) {
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
            //     "interrupted": false,
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
            var result = {interrupted: jso.interrupted, output: []},
                singleExpr = Object.isString(jso.result.source),
                length = singleExpr ? 1 : jso.result.source.length;
            if (singleExpr) {
                result.output[0] = jso.result;
            } else {
                for (var i = 0; i < length; i++) {
                    var exprResult = {}
                    Properties.forEachOwn(jso.result, function(type, values) {
                        exprResult[type] = values[i]; })
                    result.output[i] = exprResult;
                }
            }
            return JSON.stringify(result, null, 2);
        }
        var url = new URL(Config.nodeJSURL+'/').withFilename('RServer/asyncEval'),
            sanitizedExpr = expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"'),
            self = this;
        // 1) start eval
        url.asWebResource().post(JSON.stringify({expr: sanitizedExpr, id: id}), 'application/json');
        // 2) get result
        (function() {
            var content = url.withQuery({id: id}).asWebResource().get().content;
            callback(null, processResult(content));
        }).delay(1);
    },

    doEval: function(expr, callback) {
        // return this.doEvalWebSocket(expr, callback);
        return this.doEvalHTTP2(Strings.newUUID(), expr, callback);
    },

    processResult: function(msg, callback) {
        if (msg.action === "error") {
            show('R handler got error: %o', msg.data.message || msg);
            callback && callback(msg.data.message || msg, null);
            return;
        }
        var err = null, result = msg.data.result.trim();
        if (false && msg.data.type === 'stdout') {
            // by default stdout of R includes line number indicators
            // we remove those here. Also, all statements are usually
            // included, we just diplay the result of the last statement
            var re = /^\[[0-9]+\]\s+/;
            if (result.match(re)) {
                var lines = result.split('\n');
                result = lines.last().replace(re, '');
            }
        }
        callback && callback(err, result);
    },

    resetRServer: function() {
        new URL((Config.nodeJSWebSocketURL || Config.nodeJSURL) + '/RServer/reset')
            .asWebResource().beAsync().post();
    },

    openWorkspace: function() {
        lively.BuildSpec('apps.RInterface.Workspace').createMorph().openInWorld();
    }

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