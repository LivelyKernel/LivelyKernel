module('lively.net.MediaStreaming').requires().toRun(function() {
Object.subclass('lively.net.StreamingConnection',
'initializing', {
    'initialize': function() {
        // constants
        this.serverUrl = 'ws://localhost:1234';
        
        // arrays
        this.sendingBuffer = [];
        this.availableStreams = [];
        this.idRequestCallbacks = [];
        this.takeoverCallbacks = [];
        this.streamedObjects = [];
        
        // objects
        this.downstreams = {};
        
        // counters
        this.upstreamData = 0;
        
        // setup functions
        var _this = this;
        function init(err, session) {
            _this.session = session;
            _this.openSocketConnection();
        }
        
        // retrieve l2l session
        this.withLively2LivelySessionDo(5000, init);
        
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
        };
        
        socket.onmessage = function(evt) {
            var message = evt.data;
            _this.downstreamData += message.length;
            message = JSON.parse(message);
            
            // all media frames have a timestamp
            if (message.timestamp) message.timestamp = Number.parseInt(message.timestamp);
            
            _this.handleMessage(message);
        }
        
        this.socket = socket;
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
        switch (message.type) {
            // frames from a video and a canvas are rendered equally
            case 'image':
                // got image data
                var imageURL = message.image;
                var lzwEncoded = message.lzwEncoded;
            
                if (lzwEncoded) {
                    imageURL = this.lzwDecode(imageURL);
                }
                
                this.relateToStream(message, imageURL);
                // var id = message.streamId;
                // this.getScreen(id, message.size).newFrame(imageURL, message.timestamp);
                break;
            case 'audio':
                // got audio data
                var audioString = message.audioBuffer;
                
                // retrieve an ArrayBuffer from the audioString
                var buffer = this.stringToArraybuffer(audioString);
                
                // if the bit depth was reduced to 16 bit, interpret it as 32 bit
                if (message.reducedBitDepth) {
                    buffer = this.to32BitBuffer(buffer);
                } else {
                    buffer = new Global.Float32Array(buffer);
                }
                
                // TODO: what to do with the audio?
                show('Audio playback not implemented');
                // this.audioBuffer.push(buffer);
                // if (!this.playingAudioBuffer) {
                //     this.playAudioBuffer();
                // }
                break;
            case 'data':
                // got raw data packet
                var dataString = message.data;
                if (message.lzwEncoded) {
                    dataString = this.lzwDecode(dataString);
                }
                
                console.log(dataString);
                break;
            case 'initial-information':
                var availableStreams = message.streams;
                this.updateAvailableStreams(availableStreams);
                break;
            case 'new-clients':
                var clients = message.clients;
                break;
            case 'stream-id':
                console.log('received id ' + message.id);
                var callback = this.idRequestCallbacks.shift();
                if (callback) callback(message.id);
                break;
            case 'stream-changes':
                var streams = message.streams;
                var removedStreams = this.updateAvailableStreams(streams);
                this.deactivateStreams(removedStreams);
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
                
                callbackRecord.callback(response);
                // TODO remove callback from array?
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
        // TODO
        // should return array of removed streams
    },
    'relateProgressInformation': function(streamId, timestamps) {
        // TODO
    },
    relateToStream: function(message, imageURL) {
        var id = message.streamId;
        var stream = this.downstreams[id];
        if (!stream) {
            show('no downstream registered for stream ' + id);
            return;
        }
        
        stream.newFrame(imageURL, message.timestamp);
    },
},
'compression', {
    lzwDecode: function(string) {
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
        
        for (var i = 0; i < buffer16Bit.length; i++) {
            tmpBuffer[2*i] = buffer16Bit[i] & 0xffff0000;
            tmpBuffer[2*i + 1] = (buffer16Bit[i] & 0x0000ffff) << 16;
        }
        
        // interpret the resulting buffer as float32
        return new Global.Float32Array(tmpBuffer.buffer);
    },
    arraybufferToString: function() {
        // create a Uint16Array data view from the buffer
        var array = new Global.Uint16Array(buffer);
        // create a string from the values in the array
        var str = String.fromCharCode.apply(null, array);
        
        return str;
    }
},
'stream handling', {
    'deactivateStreams': function(streams) {
        // TODO
    },
    addStream: function(morph) {
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
        
        // if (this.sources.indexOf(morph) === -1) {
        //     this.sources.push(morph);
        // }
        
        var _this = this;
        this.requestNewStreamId(function(id) {
            config.streamId = id;
            _this.assignStreamingFunction(morph);
            _this.startStreaming(morph);
        });
    },
    assignStreamingFunction: function(morph) {
        if (typeof morph.streamingConfig.steppingFunction === 'function') {
            // this morph already has his own stepping function
            morph.streamingFunction = morph.streamingConfig.steppingFunction;
            return;
        }
        
        var steppingFunction = this.lookupSteppingFunction(morph);
        morph.streamingConfig.steppingFunction = steppingFunction;
        
        // morph.streamingFunction will be called with every tick
        morph.streamingFunction = steppingFunction;
    },
    lookupSteppingFunction: function(morph) {
        var _this = this;
        var session = this.session;
        
        function lookupStreamingConfig() {
            return morph.streamingConfig;
        }
        
        switch (morph.streamingConfig.mediatype) {
            case 'image':
                return function(force) {
                    // lookup the config at time of execution, so that it can be
                    // changed dynamically during steaming
                    var config = lookupStreamingConfig();
                    
                    // Check if the morph wants to be streamed at the moment.
                    // Although, it can be forced when the flag is set.
                    if (!force && !config.streaming()) return;
                    
                    var compressionParams = config.compressionParameters;
                    
                    // aquire compression parameters for each frame from the params
                    var encoding = compressionParams.imgCompression;
                    var quality = compressionParams.imgQuality;
                    var compression = compressionParams.lzwCompression;
                    
                    // capture a video frame
                    var imageURL = morph.captureFrame(encoding, quality);
                    
                    // apply lzw compression, if desired
                    if (compression) {
                        imageURL = _this.lzwEncode(imageURL);
                    }
                    
                    // create a data packet
                    var obj = {
                        type: config.mediatype,
                        senderId: session.sessionId,
                        streamId: config.streamId,
                        senderName: session.username,
                        image: imageURL,
                        record: !!config.record,
                        size: {
                            width: morph.getExtent().x,
                            height: morph.getExtent().y
                        },
                        lzwEncoded: compression
                    }
                    
                    // send it out into the universe
                    _this.send(obj);
                }
            case 'audio':
                return function(typedArray, force) {
                    // lookup the config at time of execution, so that it can be
                    // changed dynamically during steaming
                    var config = lookupStreamingConfig();
                    
                    // Check if the morph wants to be streamed at the moment.
                    // Although, it can be forced when the flag is set.
                    if (!force && !config.streaming()) return;
                    
                    var audioString = _this.arraybufferToString(typedArray.buffer);
                    
                    var obj = {
                        type: config.mediatype,
                        senderId: session.sessionId,
                        senderName: session.username,
                        audioBuffer: audioString,
                        lzwEncoded: false,
                        reducedBitDepth: config.compressionParameters.reducedBitDepth
                    }
                    
                    _this.send(obj);
                }
            case 'data':
                return function(dataString, force) {
                    // lookup the config at time of execution, so that it can be
                    // changed dynamically during steaming
                    var config = lookupStreamingConfig();
                    
                    // Check if the morph wants to be streamed at the moment.
                    // Although, it can be forced when the flag is set.
                    if (!force && !config.streaming()) return;
                    
                    dataString = dataString || morph.captureFrame();
                    
                    if (config.compressionParameters.lzwCompression) {
                        dataString = _this.lzwEncode(dataString);
                    }
                    
                    var obj = {
                        type: config.mediatype,
                        senderId: session.sessionId,
                        senderName: session.username,
                        data: dataString,
                        lzwEncoded: !!config.compressionParameters.lzwCompression
                    }
                    
                    _this.send(obj);
                }
            default:
                show('No steppingFunction registered for this mediatype. Either put one into the streamingConfig or write one into lookupSteppingFunction of the MediaStreaming module');
                return;
        }
    },
    startStreaming: function(morph) {
        var steptime = morph.streamingConfig.steptime;
    
        morph.isBeingStreamed = true;
        
        this.streamedObjects.push(morph);
        
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
        
        this.createNewDownstream(streamId);
    },
    createNewDownstream: function(streamId) {
        var stream = new lively.net.Stream(streamId);
        this.downstreams[streamId] = stream;
    },
    fillupConfig: function(morph) {
        if (!morph.streamingConfig) morph.streamingConfig = {};
    
        var config = morph.streamingConfig;
        
        // set defaults for required fields
        config.mediatype = config.mediatype || 'unknown';
        config.steptime = config.steptime || 100;
        config.streaming = config.streaming || function() { return true; };
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
            type: 'request-stream-id'
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
    },
    sendBuffer: function() {
        var OPEN = 1;
        // write all messages in the buffer into the socket
        while (true) {
            // pop the first message
            var message = this.buffer.shift();
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
});

Object.subclass('lively.net.Stream',
'initializing', {
    initialize: function(id) {
        this.streamId = id;
        this.viewer = null;
        // bla
    },
},
'frame handling', {
    'newFrame': function(imageURL, timestamp) {
        if (!this.viewer) return;
        
        var frameRecord = {
            timestamp: timestamp,
            image: imageURL
        }
        
        this.viewer.render(frameRecord);
    },
},
'viewer handling', {
    'openViewerInHand': function() {
        var viewer = $world.loadPartItem('CanvasScreen', 'PartsBin/Felix');
        this.viewer = viewer;
        
        viewer.openInHand();
        
        return viewer;
    },
});

}) // end of module
