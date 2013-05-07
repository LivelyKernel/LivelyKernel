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
    },

    test2SendsAndReceivesWithCallbacks: function() {
        var ws = new lively.net.WebSocket('ws://foo.bar', {protocol: 'lively-json'}),
            msg = {data: 'hello'},
            receiveCount = 0,
            responses1 = [], responses2 = [];
        var msg1 = ws.send({action: 'test'}, function(response) { responses1.push(response); });
            msg2 = ws.send({action: 'test'}, function(response) { responses2.push(response); });
        lively.bindings.connect(ws, 'test', {count: function() { receiveCount++; }}, 'count');
        ws.socket.onmessage({data: JSON.stringify({action: 'test', data: 1, inResponseTo: msg1.messageId, expectMoreResponses: true})});
        ws.socket.onmessage({data: JSON.stringify({action: 'test', data: 2, inResponseTo: msg2.messageId})});
        ws.socket.onmessage({data: JSON.stringify({action: 'test', data: 3, inResponseTo: msg1.messageId})});
        this.assertEquals(3, receiveCount, 'receiveCount');
        this.assertEqualState([{action: 'test', data: 1}, {action: 'test', data: 3}], responses1, 'responses1');
        this.assertEqualState([{action: 'test', data: 2}], responses2, 'responses2');
        this.done();
    }
});

}) // end of module