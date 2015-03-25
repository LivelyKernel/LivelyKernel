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
        this.invokePlugins('onSelectionChange', {
            codeEditor: codeEditor,
            session: codeEditor.getSession()});
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
      // lively.ide.CodeEditor.DocumentChangeHandler.plugins[0].
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
            marker = session.$livelyCodeMarker = ace.ext.lang.codemarker.ensureIn(session);
        }
        return marker;
    },

    drawMarkerHighlight: function(spec, codeEditor, marker) {
        // spec = {pos: {start: NUMBER, end: NUMBER}, message: STRING, cssClassName: STRING}
        var pos = spec.pos;
        var start = {row: pos.row, column: Math.max(0, pos.column-1)};
        var end = {row: pos.row, column: pos.column+1};
        if (start.column === end.column) end.column++;
        var absStart = codeEditor.positionToIndex(start);
        var absEnd = codeEditor.positionToIndex(end);
        var cssClass = spec.cssClassName;
        if (!cssClass) {
            if (spec.type === 'error') cssClass = "ace-syntax-error";
            if (spec.type === 'warning') cssClass = "ace-marker-warning";
        }
        var markerPart = {cssClassName: cssClass, pos: absStart, end: absEnd, start: absStart}
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

}) // end of module
