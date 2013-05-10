// for client side code see
// lively.ide.browse("lively.net.WebSocket", "example", "lively.net.WebSockets");

var inspect = require("util").inspect;
var WebSocketServer = require('./support/websockets').WebSocketServer;
var actions = {
    helloWorld: function(c, msg) {
        console.log("Got message %s", inspect(msg));
        c.send({action: 'helloWorldReply', data: 'received message, ' + msg.data.length + ' chars'});
        setTimeout(c.close.bind(c), 5 * 1000);
    }
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// register routes
module.exports = function(route, app, subserver) {
    webSocketHandler = new WebSocketServer();
    webSocketHandler.debug = true; // logs infos
    webSocketHandler.listen({
        route: route + 'connect',
        subserver: subserver,
        actions: actions
    });
    app.get(route, function(req, res) {
        res.end("WebSocketExample is running!");
    });
}
