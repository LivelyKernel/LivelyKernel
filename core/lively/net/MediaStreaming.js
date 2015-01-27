module('lively.net.MediaStreaming').requires().toRun(function() {
Object.subclass('lively.net.StreamingConnection',
'initializing', {
    'initialize': function(serverUrl) {
        // constants
        this.serverUrl = serverUrl || 'ws://localhost:1234';
        
        // arrays
        this.sendingBuffer = [];
        this.availableStreams = [];
        this.idRequestCallbacks = [];
        this.takeoverCallbacks = [];
        this.frameLoadingCallbacks = [];
        
        // objects
        this.streamedObjects = {};
        this.downstreams = {};
        this.trafficStats = {};
        this.steppingFunctions = {};
        
        // counters
        this.upstreamData = 0;
        this.downstreamData = 0;
        this.sendCount = 0;
        this.receiveCount = 0;
        
        // setup-functions
        var _this = this;
        function init(err, session) {
            _this.session = session;
            _this.openSocketConnection();
            _this.assignDefaultSteppingFunctions();
        }
        
        
        // retrieve l2l session
        this.withLively2LivelySessionDo(5000, init);
        
        // periodic functions
        var _this = this;
        this.statsInterval = Global.setInterval(function() {
            _this.generateMonitoringData();
        }, 1000);
    },
    assignDefaultSteppingFunctions: function() {
        var connection = this;
        var session = this.session;
        
        // in all those functions, this will be bound to the streamed morph
        this.steppingFunctions['image'] = function(dataString, force) {
            // lookup the config at time of execution, so that it can be
            // changed dynamically during steaming
            var config = this.streamingConfig;
            
            console.log(this.name);
            
            // Check if the morph wants to be streamed at the moment.
            // Although, it can be forced when the flag is set.
            if (!force && !config.streaming()) return;
            
            var compressionParams = config.compressionParameters;
            
            // aquire compression parameters for each frame from the params
            var encoding = compressionParams.imgCompression;
            var quality = compressionParams.imgQuality;
            var compression = compressionParams.lzwCompression;
            
            // capture a video frame
            var imageURL = dataString || this.captureFrame(encoding, quality);
            
            // apply lzw compression, if desired
            if (compression) {
                imageURL = connection.lzwEncode(imageURL);
            }
            
            // create a data packet
            var obj = {
                type: config.mediatype,
                senderId: session.sessionId,
                streamId: config.streamId,
                senderName: session.username,
                data: imageURL,
                record: !!config.record,
                size: {
                    width: this.getExtent().x,
                    height: this.getExtent().y
                },
                lzwEncoded: compression
            }
            
            // send it out into the universe
            connection.send(obj);
        }
        
        this.steppingFunctions['audio'] = function(typedArray, force) {
            // lookup the config at time of execution, so that it can be
            // changed dynamically during steaming
            var config = this.streamingConfig;
            
            // Check if the morph wants to be streamed at the moment.
            // It can be forced when the flag is set.
            if (!force && !config.streaming()) return;
            
            var audioString
            if (typedArray) {
                audioString = connection.arraybufferToString(typedArray.buffer);
            } else {
                audioString = this.captureFrame();
            }
            
            var obj = {
                type: config.mediatype,
                senderId: session.sessionId,
                streamId: config.streamId,
                senderName: session.username,
                data: audioString,
                record: !!config.record,
                lzwEncoded: false,
                reducedBitDepth: config.compressionParameters.reducedBitDepth
            }
            
            connection.send(obj);
        }
        
        this.steppingFunctions['data'] = function(dataString, force) {
            // lookup the config at time of execution, so that it can be
            // changed dynamically during steaming
            var config = this.streamingConfig;
            
            // Check if the morph wants to be streamed at the moment.
            // Although, it can be forced when the flag is set.
            if (!force && !config.streaming()) return;
            
            dataString = dataString || this.captureFrame();
            
            if (config.compressionParameters.lzwCompression) {
                dataString = connection.lzwEncode(dataString);
            }
            
            var obj = {
                type: config.mediatype,
                senderId: session.sessionId,
                streamId: config.streamId,
                senderName: session.username,
                data: dataString,
                record: !!config.record,
                lzwEncoded: !!config.compressionParameters.lzwCompression
            }
            
            connection.send(obj);
        }
    },
    openSocketConnection: function() {
        // open a connection to the socket server
        if (this.socket && this.socket.readyState < 2) {
            // socket is open or connecting
            this.socket.close();
        }
        var socket = new Global.WebSocket(this.serverUrl);
        socket.binaryType = 'arraybuffer';
        
        var _this = this;
        
        socket.onopen = function() {
            Global.alertOK('socket open');
            // greet the server to be registered
            var message = {
                type: 'hello-network',
                senderId: _this.session.sessionId,
                senderName: _this.session.username
            }
            
            _this.send(message);
        };
        
        socket.onerror = function(err) {
            show(err);
        }
        
        socket.onclose = function() {
            Global.alertOK('socket closed');
            _this.onClose();
        };
        
        socket.onmessage = function(evt) {
            var message = evt.data;
            _this.downstreamData += message.length;
            message = JSON.parse(message);
            
            // all media frames have a timestamp
            if (message.timestamp) {
                message.timestamp = Number.parseInt(message.timestamp);
            }
            
            _this.handleMessage(message);
        }
        
        this.socket = socket;
    },
    onClose: function() {
        Global.clearInterval(this.statsInterval);
    },
    close: function() {
        this.socket.close();
    },
    withLively2LivelySessionDo: function(timeoutMs, thenDo) {
        // wait for a lively2lively connection
        if (!thenDo) { thenDo = timeoutMs; timeoutMs = 5000; }
        Functions.composeAsync(
            function(next) { Global.require('lively.net.SessionTracker').toRun(function() { next() }); },
            function(next) { lively.whenLoaded(function() { next(); }); },
            function(next) {
                Functions.waitFor(timeoutMs,
                    function() { return !!lively.net.SessionTracker.getSession(); },
                    function(err) { next(err, lively.net.SessionTracker.getSession()) })
            },
            function(sess, next) {
                var online = false;
                sess.whenOnline(function() { online = true; })
                Functions.waitFor(timeoutMs,
                    function() { return !!online; },
                    function(err) { next(err, sess); });
            }
        )(thenDo);
    }
}, 
'message handling', {
    handleMessage: function(message) {
        this.receiveCount++;
        
        switch (message.type) {
            case 'image':
                // got image data
                var imageURL = message.data;
                var lzwEncoded = message.lzwEncoded;
            
                if (lzwEncoded) {
                    imageURL = this.lzwDecode(imageURL);
                }
                
                this.relateToStream(message, imageURL);
                break;
            case 'audio':
                // got audio data
                var audioString = message.data;
                var lzwEncoded = message.lzwEncoded;
                
                if (lzwEncoded) {
                    audioString = this.lzwDecode(audioString);
                }
                
                // retrieve an ArrayBuffer from the audioString
                var buffer = this.stringToArraybuffer(audioString);
                
                // if the bit depth was reduced to 16 bit, interpret it as 32 bit
                if (message.reducedBitDepth) {
                    buffer = this.to32BitBuffer(buffer);
                } else {
                    buffer = new Global.Float32Array(buffer);
                }
                
                this.relateToStream(message, buffer);
                break;
            case 'data':
                // got raw data packet
                var dataString = message.data;
                if (message.lzwEncoded) {
                    dataString = this.lzwDecode(dataString);
                }
                // TODO:
                // no hook for getting the data, yet
                console.log(dataString);
                break;
            case 'initial-information':
                var availableStreams = message.streams;
                this.updateAvailableStreams(availableStreams);
                // trigger event
                $(this).trigger('stream-changes', [availableStreams]);
                break;
            case 'new-clients':
                // nothing to do for now
                break;
            case 'stream-id':
                var callback = this.idRequestCallbacks.shift();
                if (callback) callback(message.id);
                break;
            case 'stream-changes':
                var streams = message.streams;
                Global.alertOK('stream changes');
                var removedStreams = this.updateAvailableStreams(streams);
                this.deactivateStreams(removedStreams);
                // trigger event
                $(this).trigger('stream-changes', [streams]);
                break;
            case 'recorded-data':
                var requestId = message.requestId;
                var data = this.decodeAll(message.data);
                
                var record = this.frameLoadingCallbacks.find(function(record) {
                    return record.requestId === requestId;
                });
                
                var idx = this.frameLoadingCallbacks.indexOf(record);
                this.frameLoadingCallbacks.splice(idx, 1);
                
                record.callback(data);
                break;
            case 'request-takeover':
                var streamId = message.streamId;
                var requesterId = message.requesterId;
                var requesterName = message.requesterName;
                
                this.decideTakeover(streamId, requesterId, requesterName);
                break;
            case 'response-takeover':
                var streamId = message.streamId;
                var response = message.response;
                
                var callbackRecord = this.takeoverCallbacks.find(function(record) {
                    return record.streamId === streamId;
                });
                
                var idx = this.takeoverCallbacks.indexOf(callbackRecord);
                this.takeoverCallbacks.splice(idx, 1);
                
                callbackRecord.callback(response);
                break;
            case 'continue-streaming':
                var streamId = message.streamId;
                Global.alertOK('continue stream ' + streamId);
                // not ported to module yet
                // this.continueStreaming(streamId);
                break;
            case 'progress-update':
                this.relateProgressInformation(message.streamId, message.timestamps);
                break;
            case 'error':
                show('Received error message: ' + message.message);
                break;
            default:
                show('Received unknown message type: ' + message.type);
                return;
        }
    },
    updateAvailableStreams: function(streams) {
        var _this = this;
        
        // substract streams from known items to detect removed streams
        var removedStreams = this.availableStreams.slice();
        streams.forEach(function(stream) {
            // this cannot be done using indexOf, because the objects
            // in streams and in removedStreams are not identical (although they
            // have the same values)
            var idx = -1;
            removedStreams.find(function(item, i) {
                idx = i;
                return item.id === stream.id;
            });
            removedStreams.splice(idx, 1);
        });
        
        // remove removedStreams from avalableStreams
        removedStreams.forEach(function(stream) {
            var idx = -1;
            _this.availableStreams.find(function(item, i) {
                idx = i;
                return item.id === stream.id;
            });
            _this.availableStreams.splice(idx, 1);
        });
        
        // substract the known items from the newStreams array to detect new streams
        var newStreams = streams.slice();
        this.availableStreams.forEach(function(item) {
            var idx = -1;
            newStreams.find(function(stream, i) {
                idx = i;
                return stream.id === item.id;
            });
            newStreams.splice(idx, 1);
        });
        
        // append newStreams to availableStreams
        newStreams.forEach(function(stream) {
            _this.availableStreams.push(stream);
        });
        
        return removedStreams;
    },
    'relateProgressInformation': function(streamId, timestamps) {
        var stream = this.downstreams[streamId];
        
        if (!stream || !stream.newTimelineData) return;
        
        stream.newTimelineData(timestamps);
    },
    relateToStream: function(message, data) {
        var id = message.streamId;
        var stream = this.downstreams[id];
        if (!stream) {
            show('no downstream registered for stream ' + id);
            return;
        }
        
        stream.newFrame(data, message.timestamp);
    },
},
'compression', {
    lzwDecode: function(string) {
        // found on stackoverflow, does its job
        var dict = {};
        var data = (string + "").split("");
        var currChar = data[0];
        var oldPhrase = currChar;
        var out = [currChar];
        var code = 256;
        var phrase;
        for (var i=1; i<data.length; i++) {
            var currCode = data[i].charCodeAt(0);
            if (currCode < 256) {
                phrase = data[i];
            }
            else {
               phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        
        return out.join("");
    },
    lzwEncode: function(string) {
        // found on stackoveflow, does its job
        var dict = {};
        var data = (string + "").split("");
        var out = [];
        var currChar;
        var phrase = data[0];
        var code = 256;
        for (var i=1; i<data.length; i++) {
            currChar=data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            }
            else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase=currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        for (var i=0; i<out.length; i++) {
            out[i] = String.fromCharCode(out[i]);
        }
        
        return out.join("");
    },
    stringToArraybuffer: function(string) {
        // create buffer with 2 bytes for each char
        var buffer = new Global.ArrayBuffer(string.length * 2);
        // create a 16 bit view on that buffer
        var bufferView = new Global.Uint16Array(buffer);
        // fill the buffer with the char codes of the string
        for (var i = 0; i < string.length; i++) {
            bufferView[i] = string.charCodeAt(i);
        }
        
        return buffer;
    },
    to32BitBuffer: function(buffer) {
        // this function expects an ArrayBuffer as buffer
    
        // create int-buffers for bit-shifting
        var buffer16Bit = new Global.Uint32Array(buffer);
        var tmpBuffer = new Global.Uint32Array(buffer16Bit.length * 2);
        
        // the 16 bit buffer is also a 32 bit buffer, but it holds two 16 bit
        // numbers in one 32 bit field
        
        for (var i = 0; i < buffer16Bit.length; i++) {
            // read IEEE-754 to see why this doesn't change the actual numbers
            
            // put the MSBs from the 16 bit buffer into on 32 bit field
            tmpBuffer[2*i] = buffer16Bit[i] & 0xffff0000;
            // put the LSBs into the next field.
            tmpBuffer[2*i + 1] = (buffer16Bit[i] & 0x0000ffff) << 16;
        }
        
        // interpret the resulting buffer as float32
        return new Global.Float32Array(tmpBuffer.buffer);
    },
    decodeAll: function(data) {
        var _this = this;
        data.forEach(function(frame) {
            if (frame.lzwEncoded) {
                frame.data = _this.lzwDecode(frame.data);
            }
            if (frame.type === 'audio') {
                frame.data = _this.stringToArraybuffer(frame.data);
                
                // if the bit depth was reduced to 16 bit, interpret it as 32 bit
                if (frame.reducedBitDepth) {
                    frame.data = _this.to32BitBuffer(frame.data);
                } else {
                    frame.data = new Global.Float32Array(frame.data);
                }
            }
            
        });
        
        return data;
    },
    arraybufferToString: function(buffer) {
        // create a Uint16Array data view from the buffer
        var array = new Global.Uint16Array(buffer);
        // create a string from the values in the array
        var str = String.fromCharCode.apply(null, array);
        
        return str;
    }
},
'stream handling', {
    'deactivateStreams': function(streams) {
        // nothing to do yet
    },
    publish: function(morph) {
        if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
            show('no websocket open');
            return;
        }
        
        // use the morphs config, fill up all required fields
        this.fillupConfig(morph);
        var config = morph.streamingConfig;
        
        if (config.mediatype === 'unknown') {
            show('Unknown media type. Set the mediatype field in the morphs streamingConfig');
            return;
        }
        
        var _this = this;
        this.requestNewStreamId(function(id) {
            config.streamId = id;
            _this.assignStreamingFunction(morph);
            _this.startStreaming(morph);
        });
    },
    unpublish: function(streamId) {
        var morph = this.streamedObjects[streamId];
        
        if (!morph) {
            show('Stream ' + streamId + ' unknown');
            return;
        }
        
        morph.isBeingStreamed = false;
        
        var mediatype = morph.streamingConfig.mediatype;
        switch (mediatype) {
            case 'image':
                morph.stopStepping();
                delete morph.streamingFunction;
                break;
            case 'audio':
                delete morph.streamingFunction;
                break;
            case 'data':
                morph.stopStepping();
                delete morph.streamingFunction;
                break;
            default: 
                show('Unknown media type');
                return;
        }
        
        this.send({
            type: 'unpublish',
            streamId: streamId,
            senderId: this.session.sessionId
        });
        
        delete this.streamedObjects[streamId];
    },
    assignStreamingFunction: function(morph) {
        if (typeof morph.streamingConfig.steppingFunction === 'function') {
            // this morph already has its own stepping function
            morph.streamingFunction = morph.streamingConfig.steppingFunction;
            return;
        }
        
        var steppingFunction = this.lookupSteppingFunction(morph);
        morph.streamingConfig.steppingFunction = steppingFunction;
        
        // morph.streamingFunction will be called with every tick
        morph.streamingFunction = steppingFunction;
    },
    lookupSteppingFunction: function(morph) {
        var fun = this.steppingFunctions[morph.streamingConfig.mediatype];
        
        if (!fun) {
            show('Unknown mediatype!');
            return;
        }
        
        fun.bind(morph);
        return fun;
    },
    startStreaming: function(morph) {
        var steptime = morph.streamingConfig.steptime;
    
        morph.isBeingStreamed = true;
        
        // register the streamed morph
        this.streamedObjects[morph.streamingConfig.streamId] = morph;
        
        // just start stepping, if the morph wants to be streamed periodically
        if (steptime >= 0) {
            // call the event listener, if it exists
            if (morph.streamingConfig.onStartStreaming) {
                morph.streamingConfig.onStartStreaming();
            }
            
            morph.startStepping(steptime, 'streamingFunction');
        }
    },
    subscribe: function(streamId) {
        var message = {
            type: 'subscribe',
            senderId: this.session.sessionId,
            streamId: streamId
        }
        
        this.send(message);
        
        return this.createNewDownstream(streamId);
    },
    deactivateDownstream: function(streamId) {
        var stream = this.downstreams[streamId];
        
        if (!stream) {
            show(streamId + ' does not exist');
            return;
        }
        
        stream.deactivate();
    },
    unsubscribe: function(streamId) {
        this.send({
            type: 'unsubscribe',
            senderId: this.session.sessionId,
            streamId: streamId
        });
        
        this.deactivateDownstream(streamId);
    },
    getStreamById: function(id) {
        return this.availableStreams.find(function(stream) {
            return stream.id === id;
        });
    },
    createNewDownstream: function(streamId) {
        var streamRecord = this.getStreamById(streamId);
        
        var stream;
        switch (streamRecord.type) {
            case 'image':
                if (streamRecord.record) {
                    stream = new lively.net.BackInTimeVideoStream(streamId, this, streamRecord.starttime);    
                } else {
                    stream = new lively.net.Stream(streamId, this);
                }
                break;
            case 'audio':
                if (streamRecord.record) {
                    stream = new lively.net.BackInTimeAudioStream(streamId, this, streamRecord.starttime);
                } else {
                    stream = new lively.net.AudioStream(streamId, this);
                }
                break;
            default: 
                stream = new lively.net.Stream(streamId, this);
        }
        
        this.downstreams[streamId] = stream;
        
        return stream;
    },
    fillupConfig: function(morph) {
        if (!morph.streamingConfig) morph.streamingConfig = {};
    
        var config = morph.streamingConfig;
        
        // set defaults for required fields
        config.mediatype = config.mediatype || 'unknown';
        config.steptime = config.steptime || 100;
        config.streaming = config.streaming || function() { return true; };
        config.record = config.record || false;
        config.compressionParameters = config.compressionParameters || {};
        
        // set defaults for media-specific properties
        switch (config.mediatype) {
            case 'image':
                var params = config.compressionParameters;
                params.imgCompression = params.imgCompression || 'image/webp';
                params.imgQuality = params.imgQuality || 1;
                if (params.lzwCompression === undefined) {
                    params.lzwCompression = true;
                }
                break;
            case 'audio':
                config.steptime = -1;
                if (config.compressionParameters.reducedBitDepth === undefined) {
                    config.compressionParameters.reducedBitDepth = true;
                }
                break;
        }
    }
},
'takeover', {
    'decideTakeover': function(streamId, requesterId, requesterName) {
        Global.alertOK(requesterName + ' wants to take over');
    
        // we always allow it atm
        var decision = 'ok';
        var message = {
            type: 'response-takeover',
            senderId: this.session.sessionId,
            streamId: streamId,
            requesterId: requesterId,
            response: decision
        }
        
        this.send(message);
    }
},
'communication', {
    'requestNewStreamId': function(callback) {
        // callback is needed
        if (typeof callback !== 'function') return;
        
        this.send({
            type: 'request-stream-id',
            senderId: this.session.sessionId
        });
        
        this.idRequestCallbacks.push(callback);
    },
    'requestTakeover': function(streamId, callback) {
        var message = {
            type: 'request-takeover',
            senderId: this.session.sessionId,
            streamId: streamId
        }
        
        this.takeoverCallbacks.push({
            streamId: streamId,
            callback: callback
        });
        
        this.send(message);
    },
    send: function(message) {
        // we are always sending strings, so stringify the message
        message = JSON.stringify(message);
        
        this.sendingBuffer.push(message);
        this.sendCount++;
        this.sendBuffer();
    },
    sendBuffer: function() {
        var OPEN = 1;
        // write all messages in the buffer into the socket
        while (true) {
            // pop the first message
            var message = this.sendingBuffer.shift();
            // no more messages left
            if (message === undefined) break;
            // send the message
            if (this.socket.readyState === OPEN) {
                this.socket.send(message);
                this.upstreamData += message.length;
            }
        }
    },
    sendProgress: function(streamId, currentTime) {
        var obj = {
            type: 'progress-time',
            senderId: this.session.sessionId,
            streamId: streamId,
            progressTime: currentTime
        }
        
        this.send(obj);
    }
},
'traffic monitoring', {
    'generateMonitoringData': function() {
        // upstream
        var size = Global.Numbers.humanReadableByteSize(this.upstreamData);
        this.trafficStats.upstream = size + '/s';
        this.upstreamData = 0;
        
        // downstream
        size = Global.Numbers.humanReadableByteSize(this.downstreamData);
        this.trafficStats.downstream = size + '/s';
        this.downstreamData = 0;
        
        // upstreamFps
        this.trafficStats.upstreamFps = this.sendCount;
        this.sendCount = 0;
        
        // downstreamFps
        this.trafficStats.downstreamFps = this.receiveCount;
        this.receiveCount = 0;
    },
    getTrafficStats: function() {
        return this.trafficStats;
    },
},
'data loading', {

    loadAmountOfFrames: function(streamId, before, amount, callback) {
        var message = {
            type: 'request-recorded-data',
            senderId: this.session.sessionId,
            streamId: streamId,
            requestId: Date.now(),
            before: before,
            amount: amount
        }
        
        this.frameLoadingCallbacks.push({
            requestId: message.requestId,
            callback: callback
        });
        
        this.send(message);
    },
    loadFramesByDuration: function(streamId, timecode, duration, callback) {
        var message = {
            type: 'request-recorded-data',
            senderId: this.session.sessionId,
            streamId: streamId,
            requestId: Date.now(),
            timecode: timecode,
            duration: duration
        }
        
        this.frameLoadingCallbacks.push({
            requestId: message.requestId,
            callback: callback
        });
        
        this.send(message);
    },
});

Object.subclass('lively.net.Stream',
'initializing', {
    initialize: function(id, streamingConnection) {
        this.streamId = id;
        this.streamingConnection = streamingConnection;
        this.viewer = [];
        this.active = false;
    },
},
'frame handling', {
    'newFrame': function(data, timestamp) {
        this.active = true;
        if (this.viewer.length === 0) return;
        
        var frameRecord = {
            timestamp: timestamp,
            data: data
        }
        
        this.viewer.forEach(function(viewer) {
            viewer.render(frameRecord);
        });
    },
},
'viewer handling', {
    'openViewerInHand': function() {
        var viewer = $world.loadPartItem('SimpleScreen', 'PartsBin/MediaStreaming');
        this.registerViewer(viewer);
        
        viewer.openInHand();
        
        return viewer;
    },
    registerViewer: function(viewer) {
        var idx = this.viewer.indexOf(viewer);
        if (idx >= 0) return;
        
        this.viewer.push(viewer);
    },
    removeViewer: function(viewer) {
        var idx = this.viewer.indexOf(viewer);
        if (idx < 0) return;
        
        this.viewer.splice(idx, 1);
    },
},
'stream handling', {
    'deactivate': function() {
        // nothing to do yet
        show('Stream ' + this.streamId + ' deactivated');
    },
    unsubscribe: function() {
        this.streamingConnection.unsubscribe(this.streamId);
    },
});


lively.net.Stream.subclass('lively.net.BackInTimeStream', 
'initializing', {
    'initialize': function($super, id, streamingConnection, starttime) {
        $super(id, streamingConnection);
        
        this.starttime = starttime || Date.now();
        this.lastFrameAccessedAt = Date.now();
        
        // constants
        this.maxRecentBuffer = 100;
        this.maxLoadedChunks = 5;
        this.keyframeTimeDifference = 10 * 1000;
        
        // arrays
        this.recentBuffer = [];
        this.availableBufferChunks = [];
        this.timelineData = [];
        
        // objects
        this.pastBufferIndex = {};
    },
},
'frame handling', {
    'newFrame': function(data, timestamp) {
        this.active = true;
        
        var frameRecord = {
            timestamp: timestamp,
            data: data
        }
        
        this.recentBuffer.push(frameRecord);
        
        this.viewer.forEach(function(viewer) {
            viewer.newFrame(frameRecord);
        });
        
        this.ensureRecentBufferSize();
        this.ensureFullHistory();
    },
},
'buffer management', {
    'ensureRecentBufferSize': function() {
        // load frames to fill the buffer, if needed
        // this will typically happen after subscribing to a stream
        if (this.recentBuffer.length < this.maxRecentBuffer && !this.isLoadingRecentBuffer) {
            var missingAmount = this.maxRecentBuffer - this.recentBuffer.length;
            var _this = this;
            var firstTimestamp;
            // we will load missingAmount-number of frames BEFORE firstTimestamp
            // so if there is something in recentBuffer, take the oldest available frame,
            // if there is nothing in there, load frames before now
            if (this.recentBuffer[0]) {
                firstTimestamp = this.recentBuffer[0].timestamp;
            } else {
                firstTimestamp = Date.now();
            }
            
            this.isLoadingRecentBuffer = true;
            
            // fill the recentBuffer by loading missingAmout-number of frames before firstTimestamp
            this.streamingConnection.loadAmountOfFrames(this.streamId, firstTimestamp, missingAmount, function(data) {
                // we received the requested data
                _this.isLoadingRecentBuffer = false;
                // First data element is the newest frame, last one is the oldest.
                // In recentBuffer, it is vice versa.
                for (var i = data.length - 1; i >= 0; i--) {
                    // create a new record and add it at the beginning of the buffer
                    var record = {
                        data: data[i].data,
                        timestamp: data[i].timestamp
                    }
                    // insert at the beginning of recentBuffer
                    _this.recentBuffer.unshift(record);
                };
            });
        }
        
        // ensure that recentBuffer does not grow bigger than max size
        while (this.recentBuffer.length > this.maxRecentBuffer) {
            var removed = this.recentBuffer.splice(0, 1);
            var time = removed[0].timestamp;
            // check whether the removed frame should be added as keyframe in the pastBuffer
            if (time > this.availableBufferChunks.last() + this.keyframeTimeDifference) {
                // removed is a one-element array
                this.pastBufferIndex[time] = {
                    data: removed,
                    loaded: false,
                    lastAccess: Date.now()
                }
                this.insertSorted(this.availableBufferChunks, time);
            }
        }
    },
    loadChunk: function(chunkTime, loadingStats) {
        if (!loadingStats) loadingStats = {};
        
        var idx = this.availableBufferChunks.indexOf(chunkTime);
        var nextChunkTime = this.availableBufferChunks[idx + 1] || Date.now();
        
        var duration = (nextChunkTime - chunkTime) / 1000;
        var _this = this;
        
        // prevent the chunk from being loaded multiple times
        this.pastBufferIndex[chunkTime].loaded = true;
        
        this.streamingConnection.loadFramesByDuration(this.streamId, chunkTime, duration, function(data) {
            _this.pastBufferIndex[chunkTime] = {
                data: data,
                loaded: true,
                lastAccess: Date.now()
            }
            _this.checkUnloadChunks();
            loadingStats.isLoading = false;
            if (loadingStats.onLoaded) loadingStats.onLoaded();
        });
    },
    checkUnloadChunks: function() {
        var loaded = [];
        var _this = this;
        
        Object.keys(this.pastBufferIndex).forEach(function(key) {
            if (_this.pastBufferIndex[key].loaded) {
                loaded.push(_this.pastBufferIndex[key]);
            }
        });
        
        // no need for unloading chunks
        if (loaded.length <= this.maxLoadedChunks) return;
        
        var unloadCandidate = loaded[0];
        for (var i = 1; i < loaded.length; i++) {
            if (loaded[i].lastAccess < unloadCandidate.lastAccess) {
                unloadCandidate = loaded[i];
            }
        }
        
        // unload the chunk by removing all data but the first frame
        unloadCandidate.data = [unloadCandidate.data[0]];
        unloadCandidate.loaded = false;
    },
    'ensureFullHistory': function() {
        var _this = this;
        // check whether pastBufferIndex is an empty object
        if (Object.keys(this.pastBufferIndex).length === 0) {
            // load history key frames
            var time = this.starttime;
            
            function requestAndSaveData(time) {
                // request stream data from time with a length of null, which returns just one frame
                _this.streamingConnection.loadFramesByDuration(_this.streamId, time, null, function(data) {
                    _this.pastBufferIndex[data[0].timestamp] = {
                        data: data,
                        loaded: false,
                        lastAccess: Date.now()
                    }
                    _this.insertSorted(_this.availableBufferChunks, data[0].timestamp);
                });
            }
            
            // load frames from starttime to present time
            while (time <= Date.now()) {
                requestAndSaveData(time);
                time += _this.keyframeTimeDifference;
            }
        }
    },
},
'utils', {
    'insertSorted': function(arr, item) {
        if (arr.length === 0) {
            arr.push(item);
            return;
        }
        
        // do not insert the same item twice
        if (arr.indexOf(item) !== -1) return;
        
        var i = 0;
        while (arr[i] && arr[i] < item) i++;
        arr.splice(i, 0, item);
    },
    getDuration: function() {
        if (this.recentBuffer.length === 0) return 0;
        
        return this.recentBuffer.last().timestamp - this.starttime;
    },
},
'viewer handling', {
    'openViewerInHand': function() {
        show('subclass responsibility');
    },

},
'frame access', {
    'getFrameAtMillisecond': function(ms, loadingStats) {
        // ms in milliseconds from the beginning of the video,
        // loadingStats can be an object with the following keys:
        // {
        //     load: set to true to load the containing chunk, if it's not loaded yet
        //     onLoaded: callback when the chunk is loaded
        // }
        // also, if the frame has to be loaded, loadingStats.isLoading will be set to true
        // until onLoaded is called
        
        if (this.recentBuffer.length === 0) return;
        
        if (!loadingStats) loadingStats = {};
        
        // time of first frame of stream
        var t0 = this.starttime;
        // time of first frame in recentBuffer
        var t1 = this.recentBuffer[0].timestamp;
        // time of most recent frame
        var t2 = this.recentBuffer.last().timestamp;
        
        // t0                         t1          t2
        // |--------------------------|------------|
        // |------- pastBuffer -------|recentBuffer|
        //                                         ^
        //                                        now
        
        var requestedTime = ms + t0;
        
        this.lastFrameAccessedAt = requestedTime;
        
        if (requestedTime >= t1 && requestedTime <= t2) {
            // requestedTime falls into recentBuffer
            for (var i = 0; i < this.recentBuffer.length; i++) {
                if (this.recentBuffer[i].timestamp > requestedTime) {
                    return this.recentBuffer[i-1];
                }
            }
            return this.recentBuffer.last();
        }
        
        if (requestedTime > t2) {
            // requestedTime exceeds buffer size
            return this.recentBuffer.last();
        }
        
        // requestedTime falls before recentBuffer, find appropriate chunk
        var i = 0;
        while (this.availableBufferChunks[i] <= requestedTime) i++;
        var chunkTime = this.availableBufferChunks[i-1];
        var chunk = this.pastBufferIndex[chunkTime];
        
        if (loadingStats.load) {
            // check if chunk of currently requested frame needs to be loaded
            if (!chunk.loaded) {
                loadingStats.isLoading = true;
                this.loadChunk(chunkTime, loadingStats);
            }
            
            // pre-load the following chunk, if it's not loaded yet
            var nextChunkTime = this.availableBufferChunks[i];
            if (nextChunkTime) {
                var nextChunk = this.pastBufferIndex[nextChunkTime];
                if (!nextChunk.loaded) {
                    this.loadChunk(nextChunkTime);
                }
            }
        }
        
        // If the requested time is bigger than the last frame available in that
        // chunk, the last frame is the best match. This is either the case if the 
        // chunk is not loaded (contains only one frame), or if the requested time
        // actually falls between the last frame in this chunk and the first frame 
        // in the next one.
        if (requestedTime >= chunk.data.last().timestamp) {
            return chunk.data.last();
        }
        
        // look for best match in chunk data
        // recently loaded chunks might not be available yet, but they will be 
        // for later requests
        // there is always more than one frame in the chunk, otherwise the previous
        // if-block would have been executed
        for (var i = 1; i < chunk.data.length; i++) {
            if (chunk.data[i].timestamp > requestedTime) {
                return chunk.data[i-1];
            }
        }
    },

    getAllAvailableFrames: function() {
        var _this = this;
        var frames = [];
        
        this.availableBufferChunks.forEach(function(timecode) {
            _this.pastBufferIndex[timecode].data.forEach(function(frame) {
                frames.push(frame);
            });
        });
        
        this.recentBuffer.forEach(function(frame) {
            frames.push(frame);
        });
        
        return frames;
    },
},
'user progress', {
    sendProgress: function(_this) {
        if (_this.lastFrameAccessedAt === -1) return;
        
        _this.streamingConnection.sendProgress(_this.streamId, _this.lastFrameAccessedAt);
    },
    startSendingProgress: function() {
        var _this = this;
        this.progressIntervalHandle = Global.setInterval(function() { _this.sendProgress(_this) }, 1000);
    },
    stopSendingProgress: function() {
        Global.clearInterval(this.progressIntervalHandle);
    },
    newTimelineData: function(data) {
        this.timelineData = data;
    },
    getViewerProgressData: function() {
        return this.timelineData;
    },
});

lively.net.BackInTimeStream.subclass('lively.net.BackInTimeVideoStream', 
'viewer handling', {
    'openViewerInHand': function() {
        var viewer = $world.loadPartItem('BackInTimeVideoStreamPlayer', 'PartsBin/MediaStreaming');
        viewer.stream = this;
        this.registerViewer(viewer);
        
        viewer.openInHand();
        
        return viewer;
    },
});

lively.net.BackInTimeStream.subclass('lively.net.BackInTimeAudioStream', 
'viewer handling', {
    'openViewerInHand': function() {
        var viewer = $world.loadPartItem('BackInTimeAudioStreamPlayer', 'PartsBin/MediaStreaming');
        viewer.stream = this;
        this.registerViewer(viewer);
        
        viewer.openInHand();
        
        return viewer;
    },
});

lively.net.Stream.subclass('lively.net.AudioStream',
'initializing', {
    initialize: function($super, id, streamingConnection) {
        $super(id, streamingConnection);
        
        if (!$world.audioContext) {
            $world.audioContext = new Global.AudioContext();
        }
        
        this.audioContext = $world.audioContext;
        
        // --- constants ---
        this.minBufferSize = 3;
        this.maxBufferSize = 10;
        
        // --- arrays ---
        this.audioBuffer = [];
    },
},
'frame handling', {
    'newFrame': function(data, timestamp) {
        this.audioBuffer.push({
            timestamp: timestamp,
            buffer: data
        });
        
        if (!this.playingAudioBuffer) {
            this.playAudioBuffer();
        }
    },
},
'replay', {
    'playAudioBuffer': function() {
        // check if buffer is filled
        if (this.audioBuffer.length < this.minBufferSize) {
            // still buffering
            this.playingAudioBuffer = false;
            return;
        }
        if (this.audioBuffer.length > this.maxBufferSize) {
            // eliminate overflow by throwing away the oldest sample buffers
            this.audioBuffer.splice(this.audioBuffer.length - this.maxBufferSize, this.maxBufferSize);
        }
        
        this.playingAudioBuffer = true;
        
        var sampleBuffer = this.audioBuffer.shift().buffer;
        // create buffer with 1 channel, #buffer.length samples, 44100Hz sampling rate
        var audioBuffer = this.audioContext.createBuffer(1, sampleBuffer.length, 44100);
        var channel = audioBuffer.getChannelData(0);
        
        // fill the buffer
        for (var i = 0; i < sampleBuffer.length; i++) {
            channel[i] = sampleBuffer[i];
        }
        
        var source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        var _this = this;
        source.onended = function() {
            // play the next audio frame
            _this.playAudioBuffer();
        };
        source.connect(this.audioContext.destination);
        source.start();
    },
});
}) // end of module
