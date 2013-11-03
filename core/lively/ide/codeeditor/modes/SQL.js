module('lively.ide.codeeditor.modes.SQL').requires('lively.ide.codeeditor.ace').toRun(function() {

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

}) // end of module