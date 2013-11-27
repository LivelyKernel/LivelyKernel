module('lively.ide.codeeditor.DocumentChange').requires().toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// how to deal with document changes
// this class connects the lively.morphic.CodeEditor with the change handlers
// out there
Object.subclass('lively.ide.CodeEditor.DocumentChangeHandler',
'initialize', {
    initialize: function(plugins) {
        this.plugins = plugins;
        this.onDocumentChangeDebounced = Functions.debounce(200, this.onDocumentChange.bind(this));
        this.onModeChangeDebounced = Functions.debounce(200, this.onModeChange.bind(this));
        this.onDocumentChangeResetDebounced = Functions.debounce(200, this.onDocumentChangeReset.bind(this), true);
        this.onSelectionChangeDebounced = Functions.debounce(300, this.onSelectionChange.bind(this), true);
    }
},
'editor state changes', {
    onDocumentChangeReset: function(evt, codeEditor) {
        // called when a document change occurs and is supposed to reset state
        // that will be recomputed in the real on doc change handler
    },

    onModeChange: function(evt, codeEditor) {
        var session = codeEditor.getSession();
        evt.codeEditor = codeEditor;
        evt.session = session;
        var self = this;
        lively.ide.codeeditor.Modes.ensureModeExtensionIsLoaded(session.getMode(),
            function(err, modeExtModule) { self.invokePlugins('onModeChange', evt); });
    },

    onDocumentChange: function(evt, codeEditor) {
        // 1. signal connection
        var conns = codeEditor.attributeConnections;
        if (conns) {
            for (var i = 0; i < conns.length; i++) {
                var con = conns[i];
                if (con.sourceAttrName === 'textChange') con.update(evt);
                if (con.sourceAttrName === 'textString') con.update(codeEditor.textString);
            }
        }

        // reacts to a document change by dispatching to plugins
        var session = codeEditor.getSession();
        evt.codeEditor = codeEditor;
        evt.session = session;
        this.invokePlugins('onDocumentChange', evt);
    },

    onSelectionChange: function(evt, codeEditor) {
        evt.codeEditor = codeEditor;
        evt.session = codeEditor.getSession();
        this.invokePlugins('onSelectionChange', evt);
    }
},
'plugins', {
    invokePlugins: function(methodName, evt) {
        return this.getPlugins()
            .select(function(plugin) { return plugin[methodName] && plugin.isActiveFor(evt); })
            .invoke(methodName, evt)
            .length;
    },
    getPlugins: function() { return this.plugins; }
});

Object.extend(lively.ide.CodeEditor.DocumentChangeHandler, {
    plugins: [],
    create: function() {
        return new lively.ide.CodeEditor.DocumentChangeHandler(this.plugins);
    },
    registerModeHandler: function(handlerClass) {
        if (!this.plugins.pluck('constructor').include(handlerClass))
            this.plugins.push(new handlerClass());
    }
});

// Abstract super class for specific text modes
Object.subclass('lively.ide.codeeditor.ModeChangeHandler',
"settings", {
    targetMode: null
},
"testing", {
    isActiveFor: function(evt) {
        if (!this.targetMode) return false;
        var mode = evt.session.getMode();
        if (mode.$id === this.targetMode) return true;
        var codeMarker = evt.session.$livelyCodeMarker;
        return codeMarker && codeMarker.modeId === this.targetMode;
    }
},
"markers", {
    // simple background markers for highlighting
    ensureLivelyCodeMarker: function(session) {
        var marker = session.$livelyCodeMarker;
        if (!marker) {
            marker = session.$livelyCodeMarker = new lively.ide.CodeEditor.CodeMarker();
            marker.attach(session);
        }
        return marker;
    },

    drawMarkerHighlight: function(spec, codeEditor, marker) {
        // spec = {pos: {start: NUMBER, end: NUMBER}, message: STRING, cssClassName: STRING
        var pos = spec.pos;
        var line = codeEditor.getSession().getLine(pos) || '';
        var start = {row: pos.row, column: Math.max(0, pos.column-1)};
        var end = {row: pos.row, column: Math.min(pos.column+1, line.length)};
        if (start.column === end.column) end.column++;
        var absStart = codeEditor.positionToIndex(start);
        var absEnd = codeEditor.positionToIndex(end);
        var markerPart = {
            cssClassName: spec.cssClassName,
            end: absEnd, start: absStart
        }
        marker.markerRanges.push(markerPart);
        marker.redraw(codeEditor.getSession());
    }
},
"overlays", {
    // text overlay that is rendered on top of the real text
    addOverlay: function(spec, codeEditor, marker, overlayBounds) {
        // spec = {pos: {start: NUMBER, end: NUMBER}, message: STRING, cssClassName: STRING
        var messageWidth = spec.message.split('\n').pluck('length').max(),
            r = codeEditor.aceEditor.renderer,
            edWidth = Math.floor((r.$size.width-r.gutterWidth-r.scrollBarV.width)/r.characterWidth),
            col = edWidth-messageWidth,
            row = spec.pos.row,
            overlay = {start: {column: col, row: row}, text: spec.message};
        overlay = this.transformOverlaySpecToNotOverlap(overlay, overlayBounds);
        this.recordOverlayedArea(overlay, overlayBounds);
        codeEditor.addTextOverlay(overlay);
    },

    overlaySpecBounds: function(overlaySpec) {
        var x = overlaySpec.start.column, y = overlaySpec.start.row,
            lines = overlaySpec.text.split('\n'),
            width = lines.max(function(line) { return line.length; }).length,
            height = lines.length;
        return lively.rect(x,y,width,height);
    },

    recordOverlayedArea: function(overlaySpec, overlayBounds) {
        overlayBounds.push(this.overlaySpecBounds(overlaySpec));
    },

    transformOverlaySpecToNotOverlap: function(overlaySpec, otherOverlayBounds) {
        var bounds = this.overlaySpecBounds(overlaySpec), last = otherOverlayBounds.last();
        if (!last || !last.intersects(bounds)) return overlaySpec;
        return Object.extend(Object.create(overlaySpec), {start: {column: bounds.left(), row: last.bottom()}});
    }
},
'update', {
    onModeChange: function(evt) {
        var sess = evt.session;
        if (sess.getMode().$id === this.targetMode) { this.onDocumentChange(evt); return; }
        var marker = this.ensureLivelyCodeMarker(sess);
        sess.$ast = null;
        marker.markerRanges.length = 0;
        marker.modeId = null;
        marker.redraw(sess);
    },
    onDocumentChange: function(evt) {}
});

Object.subclass('lively.ide.CodeEditor.CodeMarker',
// used as a "dynamic marker" inside an ace editor. The update method draws
// into the ace rendering area
"initializing", {
    initialize: function() {
        this.markerRanges = [];
    },
    attach: function(session) {
        if (!this.id || !(this.id in session.$backMarkers))
            session.addDynamicMarker(this);
    },
    detach: function(session) {
        this.markerRanges.length = 0;
        session._emit('changeBackMarker');
        session.removeMarker(this);
        session.$astFeedbackMarker = null;
    }
},
"rendering", {
    update: function(html, markerLayer, session, config) {
        var Range = lively.ide.ace.require("ace/range").Range;
        var screenStartRow = config.firstRow, screenEndRow = config.lastRow;
        this.markerRanges.forEach(function(range) {
            var start, end;
            if (range.pos) {
                start = session.doc.indexToPosition(range.pos-1),
                end = session.doc.indexToPosition(range.pos+1);
            } else if (range.start && range.end) {
                start = session.doc.indexToPosition(range.start);
                end = session.doc.indexToPosition(range.end);
            } else if (range.startPos &&range.endPos) {
                start = range.startPos; end = range.endPos;
            } else {
                console.warn('lively.morphic.CodeMarker cannot render %s', range);
                return;
            }
            if (start.row < screenStartRow || end.row > screenEndRow) return;
            var realRange = Range.fromPoints(start, end);
            var method = start.row === end.row ? 'drawSingleLineMarker' : 'drawTextMarker';
            markerLayer[method](html, realRange.toScreenRange(session), range.cssClassName || "lively-ace-codemarker", config);
        });
    },

    redraw: function(session) {
        session._emit('changeBackMarker');
    }
});

}) // end of module
