module('lively.store.SQLiteInterface').requires('lively.Network').toRun(function() {

Object.extend(lively.store.SQLiteInterface, {

    ensureDB: function(name, fileName, thenDo) {
        URL.nodejsBase.withFilename('SQLiteServer/ensureDB').asWebResource()
            .beAsync().post(JSON.stringify({dbAccessor: name, fileName: fileName}), 'application/json')
            .whenDone(function(content, status) {
                thenDo(status.isSuccess() ? null : content || status, content);
            });
    },

    removeDB: function(name, thenDo) {
        URL.nodejsBase.withFilename('SQLiteServer/removeDB').asWebResource()
            .beAsync().post(JSON.stringify({dbAccessor: name}), 'application/json')
            .whenDone(function(content, status) {
                thenDo(status.isSuccess() ? null : content || status, content);
            });
    },

    _sendToServer: function(data, thenDo) {
        URL.nodejsBase.withFilename('SQLiteServer/').asWebResource()
            .beAsync().post(JSON.stringify(data), 'application/json')
            .whenDone(function(content, status) {
                var result = content;
                try {
                    result = JSON.parse(content);
                    result = Object.isArray(result) ? result.map(Grid.tableFromObjects) : result;
                } catch (e) {}
                thenDo(status.isSuccess() ? null : result || status, result);
            });
    },

    query: function(dbAccessorCode, sqlStatements, thenDo) {
        this._sendToServer({
            statements: sqlStatements.map(function(ea) { return {action: 'all', sql: ea}; }),
            dbAccessor: dbAccessorCode
        }, thenDo);
    },

    run: function(dbAccessorCode, sqlStatements, thenDo) {
        this._sendToServer({
            statements: sqlStatements.map(function(ea) { return {action: 'run', sql: ea}; }),
            dbAccessor: dbAccessorCode
        }, thenDo);
    },

    insert: function(dbAccessorCode, statementsAndContent, thenDo) {
        // statementsAndContent = [{sql: STRING, args: ARRAY of content insert}]
        this._sendToServer({
            statements: statementsAndContent.map(function(ea) {
                return Object.extend({action: 'run'}, ea);
            }),
            dbAccessor: dbAccessorCode
        }, thenDo);
    }
    
});

}) // end of module
