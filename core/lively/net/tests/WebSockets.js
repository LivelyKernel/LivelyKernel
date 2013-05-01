module('lively.net.tests.WebSockets').requires('lively.TestFramework', 'lively.net.WebSockets').toRun(function() {

Object.subclass('lively.net.tests.WebSockets.WebSocketFake',
'initializing', {
    initialize: function(url, options) {
        this.url = url;
        this.options = options;
        this.messages = [];
        this.beOpen();
    },
    beOpen: function() { this.readyState = 1; }
},
'network', {
    send: function(data) {
        this.messages.push(data);
    }
});

AsyncTestCase.subclass('lively.net.tests.WebSockets.Interface',
'running', {
    setUp: function($super) {
        $super();
        this.OriginalWebSocketClass = Global.WebSocket;
        Global.WebSocket = lively.net.tests.WebSockets.WebSocketFake
    },

    tearDown: function($super) {
        $super();
        Global.WebSocket = this.OriginalWebSocketClass;
    }
},
'helper', {
    expectSend: function(webSocket, msg) {
        // this.expectedMessages.push(msg);
    }
},
'testing', {
    testSend: function() {
        var ws = new lively.net.WebSocket('ws://foo.bar'),
            msg = {data: 'hello'};
        ws.send(msg);
        this.assertEqualState([JSON.stringify(msg)], ws.socket.messages);
        this.done();
    }
});

}) // end of module