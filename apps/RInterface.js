module('apps.RInterface').requires('lively.net.WebSockets').toRun(function() {

Object.extend(apps.RInterface, {

    ensureConnection: function() {
        if (this.webSocket) return this.webSocket;
        var url = new URL((Config.nodeJSWebSocketURL || Config.nodeJSURL) + '/RServer/connect');            
        return this.webSocket = new lively.net.WebSocket(url, {protocol: 'lively-json'});
    },

    doEval: function(expr, callback) {
        var ws = this.ensureConnection();
        var escaped = expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        var exprWithTryCatch = Strings.format(
            "tryCatch({expr <- parse(text=\"%s\"); eval(expr)}, error = function(e) print(e))", escaped);
        this.webSocket.send({action: 'doEval', data: {expr: exprWithTryCatch}}, function(msg) {
            this.processResult(msg, callback);
        }.bind(this));
    },

    processResult: function(msg, callback) {
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
    }

});

}) // end of module