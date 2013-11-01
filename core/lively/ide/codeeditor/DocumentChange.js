module('lively.ide.codeeditor.DocumentChange').requires().toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// how to deal with document changes
Object.subclass('lively.ide.CodeEditor.DocumentChangeHandler',
'initialize', {
    initialize: function(plugins) {
        this.plugins = plugins;
        this.onDocumentChangeDebounced = Functions.debounce(200, this.onDocumentChange.bind(this));
        this.onModeChangeDebounced = Functions.debounce(200, this.onModeChange.bind(this));
        this.onDocumentChangeResetDebounced = Functions.debounce(200, this.onDocumentChangeReset.bind(this), true);
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
        this.invokePlugins('onModeChange', evt);
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
    }
},
'plugins', {
    invokePlugins: function(methodName, evt) {
        return this.getPlugins()
            .select(function(plugin) { return plugin.isActiveFor(evt); })
            .invoke(methodName, evt)
            .length;
    },
    getPlugins: function() { return this.plugins; }
});

Object.extend(lively.ide.CodeEditor.DocumentChangeHandler, {
    create: function() {
        return new lively.ide.CodeEditor.DocumentChangeHandler(
                    [new lively.ide.codeeditor.Modes.ChangeHandler(),
                     new lively.ide.codeeditor.JS.ChangeHandler()]);
    }
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