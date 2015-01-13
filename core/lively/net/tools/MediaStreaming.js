module('lively.net.tools.MediaStreaming').requires('lively.persistence.BuildSpec', 'lively.net.tools.Functions').toRun(function() {
    
lively.BuildSpec('lively.net.tools.BackInTimeStreamViewer',{
    _BorderWidth: 1,
    _Extent: lively.pt(525.0,449.0),
    _Fill: Color.rgb(255,255,255),
    _Position: lively.pt(415.0,716.0),
    availableBufferChunks: [],
    className: "lively.morphic.Box",
    currentTime: NaN,
    doNotSerialize: ["recentBuffer"],
    droppingEnabled: true,
    isBeingStreamed: false,
    isLive: true,
    isReplaying: true,
    keyframeTimeDifference: 10000,
    lastPastBufferEntry: 1419966773579,
    layout: {
        adjustForNewBounds: true
    },
    maxLoadedChunks: 5,
    maxRecentBuffer: 100,
    name: "BackInTimeCanvas",
    pastBufferIndex: {},
    playbackInterval: 286674,
    playbackRate: 1,
    recentBuffer: [],
    reporting: false,
    sourceModule: "lively.morphic.Core",
    streamingConfig: {
        compressionParameters: {
            imgCompression: "image/webp",
            imgQuality: 0.2,
            lzwCompression: true
        },
        mediatype: "image",
        steptime: 100
    },
    submorphs: [{
        _BorderWidth: 1,
        _Extent: lively.pt(524.8,35.9),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(0.0,378.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: true,
            borderSize: 3.9699999999999998,
            extentWithoutPlaceholder: lively.pt(524.8,35.9),
            moveVertical: true,
            resizeWidth: true,
            spacing: 3.175,
            type: "lively.morphic.Layout.HorizontalLayout"
        },
        name: "ControlBar",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Position: lively.pt(4.0,4.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "▶",
            name: "Button",
            pinSpecs: [{
                accessor: "fire",
                location: 1.5,
                modality: "output",
                pinName: "fire",
                type: "Boolean"
            }],
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var slider = this.owner.get('TimeSlider');
            var canvas = this.owner.owner;
            
            if (slider.value === 1) return;
            
            var fromMs = slider.value * canvas.getDuration();
            canvas.replayAll(fromMs);
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Position: lively.pt(27.1,4.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "◼",
            name: "Button1",
            pinSpecs: [{
                accessor: "fire",
                location: 1.5,
                modality: "output",
                pinName: "fire",
                type: "Boolean"
            }],
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var canvas = this.owner.owner;
            canvas.stopReplay();
        }
        },{
            _BorderColor: Color.rgb(192,192,192),
            _BorderRadius: 6,
            _BorderWidth: 1,
            _Extent: lively.pt(270.8,26.0),
            _Fill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(204,204,204),
            offset: 0
          },{
            color: Color.rgb(240,240,240),
            offset: 0.4
          },{
            color: Color.rgb(245,245,245),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            _Position: lively.pt(135.8,4.0),
            _StyleClassNames: ["Morph","Box","Slider"],
            className: "lively.morphic.Slider",
            continueOnStopSliding: true,
            droppingEnabled: true,
            layout: {
                resizeWidth: true
            },
            name: "TimeSlider",
            sliderExtent: 0.1,
            sliderKnob: {
                isMorphRef: true,
                path: "submorphs.0"
            },
            sourceModule: "lively.morphic.Widgets",
            styleClass: ["slider_background_horizontal"],
            submorphs: [{
                _BorderColor: Color.rgb(102,102,102),
                _BorderRadius: 6,
                _BorderWidth: 1,
                _Extent: lively.pt(27.1,26.0),
                _Fill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(196,211,221),
                offset: 0
              },{
                color: Color.rgb(137,167,187),
                offset: 0.5
              },{
                color: Color.rgb(96,130,153),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                _Position: lively.pt(244.0,0.0),
                className: "lively.morphic.SliderKnob",
                draggingEnabled: true,
                droppingEnabled: true,
                hitPoint: lively.pt(261.2,13.0),
                slider: {
                    isMorphRef: true,
                    name: "TimeSlider"
                },
                sourceModule: "lively.morphic.Widgets",
                styleClass: ["slider_horizontal"],
                submorphs: [],
                onMouseDownEntry: function onMouseDownEntry(evt, all) {
                $super(evt, all);
                this.owner.onStartSliding();
            },
                onMouseUpEntry: function onMouseUpEntry(evt, all) {
                $super(evt, all);
                this.owner.onStopSliding();
            }
            }],
            value: 1,
            valueScale: 1,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
            lively.bindings.connect(this, "value", this, "onValueChange", {});
        },
            onStartSliding: function onStartSliding() {
            this.sliding = true;
            var canvas = this.owner.owner;
            if (canvas.isReplaying) {
                canvas.stopReplay();
                this.continueOnStopSliding = true;
            } else if (canvas.isLive) {
                this.continueOnStopSliding = true;
            }
        },
            onStopSliding: function onStopSliding() {
            this.sliding = false;
            if (this.continueOnStopSliding) {
                var canvas = this.owner.owner;
                canvas.replayAll(this.value);
                this.continueOnStopSliding = false;
            }
        },
            onValueChange: function onValueChange() {
            var value = this.value;
            var canvas = this.owner.owner;
            if (value === 1) {
                canvas.isLive = true;
            } else {
                canvas.isLive = false;
            }
            
            var duration = canvas.getDuration();
            var time = duration * value;
            canvas.setTime(time);
            
            // if the slider is not being dragged, don't do anything else
            if (!this.sliding) return;
            // catch the case of an empty buffer
            if (canvas.recentBuffer.length === 0) return;
            
            var frame = canvas.getFrameAtMillisecond(time);
            if (!frame) return;
            
            canvas.render(frame);
        }
        },{
            _Extent: lively.pt(111.0,28.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 14,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Padding: lively.rect(4,2,0,0),
            _Position: lively.pt(409.8,4.0),
            className: "lively.morphic.Text",
            droppingEnabled: false,
            emphasis: [[0,11,{}]],
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {
                moveHorizontal: true,
                resizeWidth: false
            },
            name: "Progress",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "00:00/00:00"
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(28.0,20.0),
            _Position: lively.pt(50.3,4.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "◀◀",
            name: "Button3",
            pinSpecs: [{
                accessor: "fire",
                location: 1.5,
                modality: "output",
                pinName: "fire",
                type: "Boolean"
            }],
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var canvas = this.owner.owner;
            if (canvas.playbackRate <= 1) return;
            canvas.playbackRate /= 2;
            Global.alertOK(canvas.playbackRate + 'x');
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(28.0,20.0),
            _Position: lively.pt(81.5,4.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "►►",
            name: "Button2",
            pinSpecs: [{
                accessor: "fire",
                location: 1.5,
                modality: "output",
                pinName: "fire",
                type: "Boolean"
            }],
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var canvas = this.owner.owner;
            if (canvas.playbackRate >= 4) return;
            canvas.playbackRate *= 2;
            Global.alertOK(canvas.playbackRate + 'x');
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Position: lively.pt(112.7,4.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "M",
            name: "Button4",
            pinSpecs: [{
                accessor: "fire",
                location: 1.5,
                modality: "output",
                pinName: "fire",
                type: "Boolean"
            }],
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var screen = this.owner.owner;
            var menuItems = [
                ['Take-over', function() {
                    screen.requestTakeover();
                }],
                ['Release', function() {
                    screen.releaseStream();
                }]
            ];
            var menu = new lively.morphic.Menu('More...', menuItems);
            menu.openIn(lively.morphic.World.current(),
                this.getPositionInWorld(),
                false
            );
        }
        }]
    },{
        _BorderColor: Color.rgb(255,255,255),
        _ClipMode: "hidden",
        _Extent: lively.pt(521.0,374.0),
        _Fill: Color.rgb(247,247,247),
        _Position: lively.pt(2.0,2.0),
        _StyleClassNames: ["Morph","HtmlWrapperMorph","selectable"],
        className: "lively.morphic.HtmlWrapperMorph",
        droppingEnabled: true,
        isLive: true,
        isReplaying: false,
        layout: {
            resizeHeight: true,
            resizeWidth: true
        },
        name: "RewindCanvas",
        playbackInterval: 41373,
        sourceModule: "lively.morphic.AdditionalMorphs",
        stop: false,
        submorphs: [],
        videoStream: {
            ended: true,
            id: "CQTMOOTdGmm8AC8P78AS2RM1pfl9WW7UP8us",
            label: "CQTMOOTdGmm8AC8P78AS2RM1pfl9WW7UP8us",
            onaddtrack: null,
            onended: null,
            onremovetrack: null
        },
        getCanvas: function getCanvas() {
        return this.jQuery().children('canvas').get(0);
    },
        reset: function reset() {
        this.setClipMode("auto");
        this.jQuery().html('<canvas width="0" height="0" id="canvas"></canvas>');
    },
        setExtent: function setExtent(ext) {
        $super(ext);
        var canvas = this.getCanvas();
        canvas.width = ext.x;
        canvas.height = ext.y;
    }
    },{
        _BorderWidth: 1,
        _Extent: lively.pt(524.8,35.9),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(0.0,413.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: true,
            extentWithoutPlaceholder: lively.pt(508.5,35.9),
            moveVertical: true,
            resizeWidth: true
        },
        name: "TimelineContainer",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(255,255,255),
            _ClipMode: "hidden",
            _Extent: lively.pt(523.0,34.0),
            _Fill: Color.rgb(247,247,247),
            _Position: lively.pt(1.0,1.0),
            _StyleClassNames: ["Morph","HtmlWrapperMorph","selectable"],
            className: "lively.morphic.HtmlWrapperMorph",
            droppingEnabled: true,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "VisualBuffer",
            sourceModule: "lively.morphic.AdditionalMorphs",
            submorphs: [],
            videoStream: {
                ended: true,
                id: "CQTMOOTdGmm8AC8P78AS2RM1pfl9WW7UP8us",
                label: "CQTMOOTdGmm8AC8P78AS2RM1pfl9WW7UP8us",
                onaddtrack: null,
                onended: null,
                onremovetrack: null
            },
            clear: function clear() {
            var canvas = this.getCanvas();
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        },
            getCanvas: function getCanvas() {
            return this.jQuery().children('canvas').get(0);
        },
            registerEventOnScreen: function registerEventOnScreen(event, callback) {
            var video = this.jQuery().children('video').get(0);
            video.addEventListener(event, callback);
        },
            reset: function reset() {
            this.setClipMode("auto");
            this.jQuery().html('<canvas width="0" height="0" id="canvas"></canvas>');
        },
            setExtent: function setExtent(ext) {
            $super(ext);
            var canvas = this.getCanvas();
            canvas.width = ext.x;
            canvas.height = ext.y;
        },
            visualizeBuffer: function visualizeBuffer() {
            this.clear();
            var player = this.owner.owner;
            var start = player.starttime;
            var end = player.recentBuffer.last().timestamp;
            var duration = end - start;
            var canvas = this.getCanvas();
            var ctx = canvas.getContext('2d');
            
            player.availableBufferChunks.forEach(function(timecode) {
                player.pastBufferIndex[timecode].data.forEach(function(frame) {
                    var pos = ((frame.timestamp - start) / duration) * canvas.width;
                    ctx.fillstyle = '#ffffff';
                    ctx.fillRect(pos, 0, 1, canvas.height);
                });
            });
            
            player.recentBuffer.forEach(function(frame) {
                var pos = ((frame.timestamp - start) / duration) * canvas.width;
                ctx.fillstyle = '#ffffff';
                ctx.fillRect(pos, 0, 1, canvas.height);
            });
        }
        },{
            _Extent: lively.pt(523.0,5.0),
            _Fill: Color.rgb(115,146,236),
            _Position: lively.pt(1.0,30.0),
            className: "lively.morphic.Box",
            currentMaxValue: 60000,
            droppingEnabled: true,
            extensionValue: 60000,
            layout: {
                moveVertical: true,
                resizeWidth: true
            },
            name: "Timeline",
            overflow: false,
            pins: [],
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            t0: -1,
            createPin: function createPin(name) {
            var points = [
                lively.pt(0, 0),
                lively.pt(10, 0),
                lively.pt(5, 20),
                lively.pt(0, 0)
            ];
            var pin = new lively.morphic.Path(points);
            pin.setBorderColor(Global.Color.black);
            pin.setBorderWidth(1);
            pin.setOrigin(lively.pt(5, 20));
            pin.setFill(Global.Color.black);
            pin.setOpacity(0.3);
            
            var label = new lively.morphic.Text().beLabel();
            label.setTextString(name);
            label.setFill(Global.Color.black);
            label.setTextColor(Global.Color.white)
            label.setBorderRadius(3);
            label.setRotation(Math.PI / 4);
            label.setPosition(lively.pt(0, 10));
            label.growOrShrinkToFit();
            
            pin.addMorph(label);
            this.addMorph(pin);
            
            return pin;
        },
            getPinForId: function getPinForId(id, name) {
            var pin = this.pins.find(function(pin) {
                return pin.recordId === id;
            });
            
            if (!pin) {
                pin = this.createPin(name);
                pin.recordId = id;
                this.pins.push(pin);
            }
            
            return pin;
        },
            getPositionForValue: function getPositionForValue(value) {
            var canvas = this.owner.owner;
            
            value -= canvas.starttime;
            
            var relPos = value / canvas.getDuration();
            var absPos = relPos * this.getExtent().x;
            
            return absPos;
        },
            initVars: function initVars() {
            this.pins = [];
            this.removeAllMorphs();
        },
            updateData: function updateData(dataArray) {
            var _this = this;
            
            dataArray.forEach(function(dataRecord) {
                var pin = _this.getPinForId(dataRecord.id, dataRecord.username);
                var position = _this.getPositionForValue(dataRecord.timecode);
                
                pin.setPosition(lively.pt(position, 0));
            });
        }
        }]
    }],
    adjustSlider: function adjustSlider(prevDuration, newDuration) {
    var slider = this.get('TimeSlider');
    var val = slider.value * prevDuration;
    slider.value = val / newDuration;
},
    captureFrame: function captureFrame(encoding, quality) {
    return this.getCanvas().toDataURL(encoding, quality);
},
    checkUnloadChunks: function checkUnloadChunks() {
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
    connectionRebuilder: function connectionRebuilder() {
    lively.bindings.connect(this, "replayRate", this, "onReplayRateChange", {});
    lively.bindings.connect(this, "playbackRate", this, "onPlaybackRateChange", {});
},
    ensureFullHistory: function ensureFullHistory() {
    var _this = this;
    // check whether pastBufferIndex is an empty object
    if (Object.keys(this.pastBufferIndex).length === 0) {
        // load history key frames
        var time = this.starttime;
        var wormhole = $morph('WormHole');
        
        function requestAndSaveData(time) {
            wormhole.loadFramesByDuration(_this.streamId, time, null, function(data) {
                _this.pastBufferIndex[data[0].timestamp] = {
                    data: data,
                    loaded: false,
                    lastAccess: Date.now()
                }
                _this.insertSorted(_this.availableBufferChunks, data[0].timestamp);
            });
        }
        
        while (time <= Date.now()) {
            requestAndSaveData(time);
            time += _this.keyframeTimeDifference;
        }
    }
},
    ensureRecentBufferSize: function ensureRecentBufferSize() {
    // load frames to fill the buffer, if needed
    // this will typically happen after subscribing to a stream
    if (this.recentBuffer.length < this.maxRecentBuffer) {
        var wormhole = $morph('WormHole');
        var missingAmount = this.maxRecentBuffer - this.recentBuffer.length;
        var _this = this;
        var firstTimestamp;
        if (this.recentBuffer[0]) {
            firstTimestamp = this.recentBuffer[0].timestamp;
        } else {
            firstTimestamp = Date.now();
        }
        
        // fill the recentBuffer
        wormhole.loadAmountOfFrames(this.streamId, firstTimestamp, missingAmount, function(data) {
            // First data element is the newest frame, last one is the oldest.
            // In recentBuffer, it is vice versa.
            for (var i = data.length - 1; i >= 0; i--) {
                // create a new record and add it at the beginning of the buffer
                var record = {
                    image: data[i].image,
                    timestamp: data[i].timestamp
                }
                _this.recentBuffer.unshift(record);
            };
        });
    }
    
    // ensure recentBuffer does not grow bigger than max size
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
    getCanvas: function getCanvas() {
    return this.get('RewindCanvas').getCanvas();
},
    getDuration: function getDuration() {
    if (this.recentBuffer.length === 0) return 0;
    
    return this.recentBuffer.last().timestamp - this.starttime;
},
    getFrameAtMillisecond: function getFrameAtMillisecond(ms, load) {
    // ms in milliseconds from the beginning of the video,
    // if load is set, chunks will be loaded if not available
    
    if (this.recentBuffer.length === 0) return;
    
    // time of first frame of stream
    var t0 = this.starttime;
    // time of first frame in recentBuffer
    var t1 = this.recentBuffer[0].timestamp;
    // time of most recent frame
    var t2 = this.recentBuffer.last().timestamp;
    
    // t0                         t1          t2
    // |--------------------------|------------|
    // |------- pastBuffer -------|recentBuffer|
    
    var requestedTime = ms + t0;
    
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
    
    // requestedTime falls before recentBuffer
    var i = 0;
    while (this.availableBufferChunks[i] <= requestedTime) i++;
    var chunkTime = this.availableBufferChunks[i-1];
    var chunk = this.pastBufferIndex[chunkTime];
    
    if (load) {
        // check if chunk of currently requested frame needs to be loaded
        if (!chunk.loaded) {
            this.loadChunk(chunkTime);
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
    
    // look for best match in chunk data
    // recently loaded chunks might not be available, but they will be later
    for (var i = 1; i < chunk.data.length; i++) {
        if (chunk.data[i].timestamp > requestedTime) {
            return chunk.data[i-1];
        }
    }
    
    // If no good match was found, return the first frame in the chunk.
    // This is the case if either there is no better match in the chunk,
    // or the chunk is not loaded and only contains a key frame.
    return chunk.data[0];
},
    getMaxScale: function getMaxScale(image) {
    var canvas = this.getCanvas();
    var scale = canvas.width / image.width;
    if (scale * image.height > canvas.height) {
        scale = canvas.height / image.height;
    }
    
    return scale;
},
    initVars: function initVars() {
    this.maxRecentBuffer = 100;
    this.maxLoadedChunks = 5;
    this.recentBuffer = [];
    this.availableBufferChunks = [];
    this.pastBufferIndex = {};
    this.keyframeTimeDifference = 10 * 1000;
    this.playbackRate = 1;
    this.currentTime = -1;
    this.reporting = false;
    this.resetWidgets();
},
    insertSorted: function insertSorted(arr, item) {
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
    loadChunk: function loadChunk(chunkTime, stopLoading) {
    var idx = this.availableBufferChunks.indexOf(chunkTime);
    var nextChunkTime = this.availableBufferChunks[idx + 1] || Date.now();
    
    var wormhole = $morph('WormHole');
    var duration = (nextChunkTime - chunkTime) / 1000;
    var _this = this;
    
    // prevent the chunk from loaded multiple times
    this.pastBufferIndex[chunkTime].loaded = true;
    
    wormhole.loadFramesByDuration(this.streamId, chunkTime, duration, function(data) {
        _this.pastBufferIndex[chunkTime] = {
            data: data,
            loaded: true,
            lastAccess: Date.now()
        }
        _this.checkUnloadChunks();
    });
},
    newFrame: function newFrame(imageURL, timestamp) {
    // image should be an Image
    
    // When subscribing to a new stream, newFrame is called
    // before onLoad had a chance to run. That's why recentBuffer
    // is not defined at that moment. Just skip this call.
    if (!this.recentBuffer) return;
    if (!this.reporting) this.startReportingProgress();
    
    var prevDuration = 0;
    if (this.recentBuffer.length > 0) {
        prevDuration = this.getDuration();
    }
    
    var frameRecord = {
        timestamp: timestamp,
        image: imageURL
    }
    
    this.recentBuffer.push(frameRecord);
    
    this.ensureRecentBufferSize();
    this.ensureFullHistory();
    
    if (this.isLive) {
        this.setTime(frameRecord.timestamp - this.starttime);
        this.render(frameRecord);
    } else {
        var newDuration = this.getDuration();
        this.adjustSlider(prevDuration, newDuration);
    }
},
    newTimelineData: function newTimelineData(data) {
    this.get('Timeline').updateData(data);
},
    onDropOn: function onDropOn(aMorph) {
    if (aMorph.onMorphAdded) {
        aMorph.onMorphAdded(this);
    }
    
    return false;
},
    onLoad: function onLoad() {
    this.doNotSerialize = ['recentBuffer'];
    this.initVars();
    this.restoreStreamingConfig();
},
    onPlaybackRateChange: function onPlaybackRateChange() {
    if (this.isReplaying) {
        this.stopReplay();
        var slider = this.get('TimeSlider');
        this.replayAll(slider.value);
    }
},
    releaseStream: function releaseStream() {
    if (!this.streaming) return;
    
    this.streaming = false;
    var wormhole = $morph('WormHole');
    
    wormhole.releaseStream(this.streamId);
},
    render: function render(frameRecord) {
    var image = new Global.Image();
    image.src = frameRecord.image;
    
    var scale = this.getMaxScale(image);
    this.getCanvas().getContext('2d').drawImage(image, 0, 0, image.width * scale, image.height * scale);
},
    replayAll: function replayAll(from) {
    if (!from) {
        show('from missing');
    }
    
    // from can be either in ms or between 0 and 1
    var i = 0;
    var timeOffset = 0;
    this.isReplaying = true;
    var _this = this;
    
    // assure from is in ms
    if (from <= 1) from *= this.getDuration();
    // set from to global time value
    from += this.starttime;
    
    // timeOffset always tells, how far you are back in the past
    var timeOffset = Date.now() - from;
    var previousTime = Date.now();
    
    function showFrame() {
        var now = Date.now();
        var frameOffset = now - previousTime;
        // if the playback rate is bigger than 1, timeOffset shrinks
        // with every showFrame-call, so the playback accelerates
        timeOffset -= (_this.playbackRate - 1) * frameOffset;
        var time = now - timeOffset - _this.starttime;
        var frame = _this.getFrameAtMillisecond(time, true);
        if (!frame) return;
        _this.render(frame);
        
        var relProgress = time / _this.getDuration();
        if (relProgress > 1) {
            // playback ends
            _this.get('TimeSlider').value = 1;
            _this.replayRate = 1;
            _this.stopReplay();
            return;
        }
        // set slider value to move the slider
        _this.get('TimeSlider').value = relProgress;
        
        _this.playbackInterval = Global.setTimeout(showFrame, 100);
        
        previousTime = now;
    }
    
    showFrame();
},
    requestTakeover: function requestTakeover() {
    var wormhole = $morph('WormHole');
    var _this = this;
    
    wormhole.requestTakeover(this.streamId, function(response) {
        if (response === 'ok') {
            _this.takeoverStream();
        }
    });
},
    resetWidgets: function resetWidgets() {
    this.get('TimeSlider').value = 1;
    this.get('Progress').setTextString('00:00/00:00');
},
    restoreStreamingConfig: function restoreStreamingConfig() {
    this.streamingConfig = {
        mediatype: "image",
        compressionParameters: {
            imgQuality: 0.2,
            imgCompression: "image/webp",
            lzwCompression: true
        },
        steptime: 100
    }
},
    sendProgress: function sendProgress() {
    var wormHole = $morph('WormHole');
    if (!wormHole) return;
    
    var timeSlider = $morph('TimeSlider');
    
    if (this.currentTime === -1) return;
    
    wormHole.sendProgress(this.streamId, this.currentTime);
},
    setExtent: function setExtent(ext) {
    if (ext.x < 450) ext.x = 450;
    $super(ext);
},
    setScreenExtent: function setScreenExtent(ext) {
    var ctrlBarExt = this.get('ControlBar').getExtent();
    var timelineExt = this.get('TimelineContainer').getExtent();
    var realExtent = ext.addPt(lively.pt(0, ctrlBarExt.y + timelineExt.y));
    this.setExtent(realExtent);
},
    setTime: function setTime(relTime) {
    var label = this.get('Progress');
    var absTime = this.starttime + relTime;
    label.setTextString(new Date(absTime).toLocaleTimeString());
    this.currentTime = absTime;
},
    startReportingProgress: function startReportingProgress() {
    
    show('reporting');
    if (this.reporting) return;
    
    this.startStepping(1000, 'sendProgress');
    this.startStepping(1000, 'visualizeBuffer');
    this.reporting = true;
},
    stopReplay: function stopReplay() {
    if (this.playbackInterval) {
        Global.clearInterval(this.playbackInterval);
        this.isReplaying = false;
    }
},
    stopReportingProgress: function stopReportingProgress() {
    if (!this.reporting) return;
    
    this.stopStepping();
    this.reporting = false;
},
    stopStreaming: function stopStreaming() {
    var wormhole = $morph('WormHole');
    show('stop')
    wormhole.stopStreaming(this, true);
    this.startStepping(1000, 'sendProgress');
    this.startStepping(1000, 'visualizeBuffer');
},
    takeoverStream: function takeoverStream() {
    if (this.streaming) return;
    
    var wormhole = $morph('WormHole');
    this.streaming = true;
    // stop receiving frames, since we are the sender now
    wormhole.unsubscribe(this.streamId);
    // handle the streaming stuff without drag'n'drop
    wormhole.fillupConfig(this);
    wormhole.attachStreamingUtils(this, this.streamId);
    wormhole.startStreaming(this);
},
    visualizeBuffer: function visualizeBuffer() {
    this.get('VisualBuffer').visualizeBuffer();
}
})

lively.BuildSpec('lively.net.tools.StreamList', {
    _BorderColor: Color.rgb(95,94,95),
    _BorderRadius: 3.335,
    _BorderWidth: 1,
    _ClipMode: "auto",
    _Extent: lively.pt(393.7,237.0),
    _Fill: Color.rgb(255,255,255),
    _Position: lively.pt(3.0,22.0),
    checkElementPrototype: null,
    className: "lively.morphic.Box",
    conn: "[object Object]",
    doNotSerialize: ["listItems"],
    droppingEnabled: true,
    layout: {
        borderSize: 2.91,
        extentWithoutPlaceholder: lively.pt(393.7,237.0),
        resizeHeight: true,
        resizeWidth: true,
        spacing: 2.91,
        type: "lively.morphic.Layout.VerticalLayout"
    },
    listItems: [],
    name: "StreamList",
    sourceModule: "lively.morphic.Core",
    submorphs: [],
    initVars: function initVars() {
    // remove all list morphs
    this.removeAllMorphs();
    
    this.checkElementPrototype = this.checkElementPrototype || $world.loadPartItem('LabeledCheckBox', 'PartsBin/Inputs');
    
    // initialize instance variables
    this.listItems = [];
    
    this.conn = null;
},
    onLoad: function onLoad() {
    this.doNotSerialize = ['listItems', 'conn'];
    this.initVars();
    
    if ($world.streamingConnection) {
        show('initializing')
        this.conn = $world.streamingConnection;
        Global.$(this.conn).on('stream-changes', this.onStreamChanges.bind(this));
    }
},
    onFromBuildSpecCreated: function() {
        this.onLoad();
    },
    onStreamChanges: function onStreamChanges(evt, streams) {
    this.updateList(streams);
},
    updateList: function updateList(streams) {
    var _this = this;
    
    // substract streams from known items to detect removed streams
    var removedStreams = this.listItems.slice();
    streams.forEach(function(stream) {
        var idx = -1; 
        removedStreams.find(function(item, i) {
            idx = i;
            return item.id === stream.id;
        })
        removedStreams.splice(idx, 1);
    });
    
    // remove check elements of removed streams
    removedStreams.forEach(function(stream) {
        var idx = -1;
        _this.listItems.find(function(item, i) {
            idx = i;
            return item.id === stream.id;
        });
        _this.listItems.splice(idx, 1);
        
        var checkElement = _this.submorphs.find(function(checkElement) {
            return checkElement.streamId === stream.id;
        });
        checkElement.remove();
    });
    
    // substract the known items from the newStreams array to detect new streams
    var newStreams = streams.slice();
    this.listItems.forEach(function(item) {
        var idx = -1;
        newStreams.find(function(stream, i) {
            idx = i;
            return stream.id === item.id;
        });
        newStreams.splice(idx, 1);
    });
    
    // create new check elements for new streams
    newStreams.forEach(function(stream) {
        _this.listItems.push(stream);
        var checkElement = _this.checkElementPrototype.copy();
        checkElement.setLabel(stream.publisherName + ' - ' + stream.type + ' - ' + stream.id);
        checkElement.streamId = stream.id;
        checkElement.setChecked(false);
        checkElement.previousValue = false;
        checkElement.onChange = function() {
            var val = this.isChecked();
            // The onChange function is triggered twice,
            // once before the value changes, once after the change.
            // We are just interested in the after-change call.
            if (val === this.previousValue) return;
            
            this.previousValue = val;
            
            if (val === true) {
                _this.conn.subscribe(stream.id).openViewerInHand();
            } else {
                _this.conn.unsubscribe(stream.id)
            }
        }
        Global.connect(checkElement.get('CheckBox'), 'checked', checkElement, 'onChange', {});
        
        _this.addMorph(checkElement);
    });
    
    return removedStreams;
}
})

}) // end of module
