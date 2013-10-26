module('lively.ide.codeeditor.DocumentChange').requires().toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// how to deal with document changes
Object.subclass('lively.ide.CodeEditor.DocumentChangeHandler',
'initialize', {
    initialize: function(plugins) {
        this.plugins = plugins;
        this.onDocumentChangeDebounced = Functions.debounce(200, this.onDocumentChange.bind(this));
        this.onDocumentChangeResetDebounced = Functions.debounce(200, this.onDocumentChangeReset.bind(this), true);
    }
},
'editor state changes', {
    onDocumentChangeReset: function(evt, codeEditor) {
        // called when a document change occurs and is supposed to reset state
        // that will be recomputed in the real on doc change handler
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

        // reacts to a document change by dispatching to plugins depending on
        // session.$mode
        var session = codeEditor.getSession();
        var plugins = this.getPlugins().select(function(plugin) {
            return plugin.isActiveFor(codeEditor, session); });
        if (!plugins.length) {
            session.$ast = null;
            session.$livelyCodeMarker && (session.$livelyCodeMarker.globals = []);
            session.$livelyCodeMarker && (session.$livelyCodeMarker.errors = []);
            session._emit("changeBackMarker");
        } else {
            plugins.invoke('onDocumentChange', {originalEvent: evt, codeEditor: codeEditor, session: session});
        }
    }
},
'plugins', {
    getPlugins: function() {
        return this.plugins;
    }
});

Object.subclass('lively.ide.CodeEditor.CodeMarker',
// used as a "dynamic marker" inside an ace editor. The update method draws
// into the ace rendering area
"initializing", {
    initialize: function() {
        this.errors = [];
        this.globals = [];
    }
},
"rendering", {
    update: function(html, markerLayer, session, config) {
        var Range = lively.ide.ace.require("ace/range").Range;
        var screenStartRow = config.firstRow, screenEndRow = config.lastRow;
        this.errors.forEach(function(err) {
            var posStart = session.doc.indexToPosition(err.pos-1),
                posEnd = session.doc.indexToPosition(err.pos+1);
            if (posEnd.row < screenStartRow || posStart.row > screenEndRow) return;
            var range = Range.fromPoints(posStart, posEnd);
            markerLayer.drawSingleLineMarker(html, range.toScreenRange(session), "ace-syntax-error", config);
        });
        this.globals.forEach(function(node) {
            var start = session.doc.indexToPosition(node.start);
            if (start.row < screenStartRow) return;
            var end = session.doc.indexToPosition(node.end);
            if (end.row > screenEndRow) return;
            var range = Range.fromPoints(start, end);
            markerLayer.drawSingleLineMarker(html, range.toScreenRange(session), "ace-global-var", config);
        });
    }
});

}) // end of module