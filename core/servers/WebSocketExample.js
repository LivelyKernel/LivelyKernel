// this code can be used on the client to initiate a websocket connection:
// url = URL.root.withFilename('lively-websocket-example').toString().replace('http', 'ws');
// ws = Object.extend(new WebSocket(url.toString(), 'lively-sync'), {
//     onerror: function(evt) { show('websocket error %o', evt) },
//     onopen: function(evt) {
//         ws.send('Hello server?')
//     },
//     onclose: function(evt) { show('connection to %o closed', evt.target.URL); },
//     onmessage: function(evt) {
//         show('got message: %o', evt.data);
//         ws.close();
//     }
// });

module.exports = function(route, app, subserver) {
    var websockets = subserver.handler.server.websocketHandler,
        route = '/lively-websocket-example',
        connection = null; // we allow only one connection for this route

    function removeConnection() {
        if (!connection) return;
        connection.close();
        connection = null;
    }

    function newConnection(request) {
        removeConnection();
        var c = connection = request.accept();
        c.on('close', function(msg) { if (connection === c) connection = null; });
        return c;
    }
    
    websockets.registerSubhandler({path: route, handler: function(req) {
        var c = newConnection(req);
        c.on('message', function(evt) {
            c.send('server received "' + evt.utf8Data + '"');
        });
        return !!connection;
    }});

    subserver.on('close', function() {
        removeConnection();
        websockets.unregisterSubhandler({path: route});
    });
}
