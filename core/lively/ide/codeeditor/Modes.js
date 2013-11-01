module('lively.ide.codeeditor.Modes').requires('lively.ide.codeeditor.ace').toRun(function() {

// Used as a plugin for the lively.ide.CodeEditor.DocumentChangeHandler
Object.subclass('lively.ide.codeeditor.Modes.ChangeHandler',
"initializing", {
    initialize: function() {
    }
},
"testing", {
    isActiveFor: function(evt) {
        return evt.type === 'changeMode';
    }
},
'rendering', {
    onModeChange: function(evt) {
        var s = evt.session,
            modeState = s.$livelyModeState || (s.$livelyModeState = {}),
            lastMode = modeState.lastMode,
            currentMode = evt.session.getMode();
        if (lastMode && lastMode.detach) {
            lastMode.detach(evt.codeEditor.aceEditor);
        }
        modeState.lastMode = currentMode;
        if (currentMode && currentMode.attach) {
            currentMode.attach(evt.codeEditor.aceEditor);
        }
    }
});

(function setupModes() {
    // R-mode
    lively.ide.ace.require('ace/mode/r').Mode.addMethods({
        morphMenuItems: function(items, editor) {
            var mode = this,
                livelyREvaluateEnabled = !mode.livelyEvalMethod || mode.livelyEvalMethod === 'lively-R-evaluate',
                s = editor.getSession();
            items.push(['R',
                [[Strings.format('[%s] lively-R-evaluate', livelyREvaluateEnabled ? 'x' : ' '),
                 function() {
                     mode.livelyEvalMethod = livelyREvaluateEnabled ? 'simple' : 'lively-R-evaluate';
                 }]]]);
            return items;
        },

        doEval: function(codeEditor, insertResult) {
            // FIXME: Cleanup really needed!
            if (!module('apps.RInterface').isLoaded()) module('apps.RInterface').load(true);
            var sourceString = codeEditor.getSelectionOrLineString();
            if (!this.livelyEvalMethod || this.livelyEvalMethod == 'lively-R-evaluate') {
                apps.RInterface.livelyREvaluate_startEval(sourceString, function(err, result) {
                    if (!insertResult && !err) addOverlay(err, result);
                    else printResult(err, result);
                });
            } else {
                apps.RInterface.evalSync(sourceString, function(err, result) {
                    if (!insertResult && !err) return;
                    else printResult(err, result);
                });
            }
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            function addOverlay(err, result) {
                module("lively.ide.codeeditor.TextOverlay").load(true);
                var range = codeEditor.getSelection().getRange();
                var lines = codeEditor.getSession().getLines(range.start.row, range.end.row)
                lines.forEach(function(line, i) {
                    var out = result.output[i];
                    if (!out) return;
                    var pos = {row: range.start.row + i, column: line.length + 1},
                        text = [out.error, out.waning, out.message, out.value].compact().join(' ');
                    codeEditor.addTextOverlay({start: pos, text: text});
                });
                (function() {
                    function removeOverlay() {
                        codeEditor.removeTextOverlay();
                        codeEditor.aceEditor.removeEventListener('change', removeOverlay);
                    }
                    codeEditor.aceEditor.addEventListener('change', removeOverlay);
                }).delay(0.8);
            }
            function printResult(err, result) {
                if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
                if (!insertResult && err) { codeEditor.world().alert(err); return;}
                if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
                codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
            }
        }
    });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Shell-mode
    lively.ide.ace.require('ace/mode/sh').Mode.addMethods({
        doEval: function(codeEditor, insertResult) {
            lively.ide.commands.exec('lively.ide.execShellCommand', codeEditor, {
                insert: insertResult,
                count: 4,
                shellCommand: codeEditor.getSelectionOrLineString()
            });
        }
    });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // SQL-mode, for the server database
    lively.ide.ace.require('ace/mode/sql').Mode.addMethods({
        doEval: function(codeEditor, insertResult) {
            var doQuery = !!insertResult,
                sourceString = codeEditor.getSelectionOrLineString();
            function sendToServer(code, thenDo) {
                var server = new WebResource(Config.nodeJSURL+'/NodeJSEvalServer/async');
                var data = JSON.stringify({callback: 'sendSQLResult', code: code, timeout: 20*1000});
                return server.beAsync().post(data, 'application/json')
                .whenDone(function(content, status) {
                    // if (!status.isSuccess()) { show(status); return; }
                    var result = content;
                    try {
                        result = JSON.parse(content);
                        result = doQuery ? Grid.tableFromObjects(result) : result;
                    } catch (e) {}
                    thenDo(status.isSuccess() ? null : result || status, result);
                });
            }
            // is is a query or a modify statement?
            var template = doQuery ?
                function queryTemplate() {
                    lively.repository.fs.storage.db.all("__STMT__", function(err, rows) {
                        try {
                            sendSQLResult(err ? String(err) : JSON.stringify(rows));
                        } catch (e) {
                            console.warn('SQL query from browser. Timed out?: %s', e);
                        }
                    });
                } : 
                function runTemplate() {
                    lively.repository.fs.storage.db.run("__STMT__", function(err, rows) {
                        try {
                            sendSQLResult(err ? String(err) : JSON.stringify({lastID: this.lastID, change: this.changes}));
                        } catch (e) {
                            console.warn('SQL query from browser. Timed out?: %s', e);
                        }
                    });
                },
                sql = Strings.format('(%s)();', template).replace(/__STMT__/, sourceString.replace(/\n/g, '\\n'));
            sendToServer(sql, function(err, result) {
                if (doQuery) {
                    var objToPrint = Object.isArray(result) ? Strings.printTable(result) : Objects.inspect(result);
                    codeEditor.printObject(codeEditor.aceEditor, objToPrint);
                } else {
                    if (err) alert(Objects.inspect(err))
                    else alertOK(Objects.inspect(result));
                }
            })
        }
    });
})();

}) // end of module