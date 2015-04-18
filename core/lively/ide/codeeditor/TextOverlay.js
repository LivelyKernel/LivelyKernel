module('lively.ide.codeeditor.TextOverlay').requires('lively.DOMAbstraction').toRun(function() {

Object.subclass("lively.ide.CodeEditorTextOverlay.Overlay",
"properties", {
    baseClassName: "text-overlay",
    overlays: null,
    id: null
},
"initializing", {
    initialize: function()  {
        this.overlays = [];
        this.$redraw = this.redraw.bind(this);
        this.$onDocumentChange = this.onDocumentChange.bind(this)
    },
    attach: function(session) {
        var isInstalled = this.id && this.id in session.$frontMarkers;
        if (isInstalled) this.detach(session);
        session.addDynamicMarker(this, true);
        session.on('change', this.$onDocumentChange);
        var overlays = this.overlays.clone();
        this.redraw(session);
    },
    detach: function(session) {
        var id = this.id;
        session.removeMarker(id);
        session.removeEventListener('change', this.$onDocumentChange);
        delete this.id;
    }
},
"updating", {
    onChange: function(evt, session) {
        this.redraw(session);
        lively.bindings.signal(this, 'changed');
    },
    onDocumentChange: function(evt, session) {
        this.onChange(evt,session);
    },
    update: function(html, markerLayer, session, config) {

        var startRow = config.firstRowScreen,
            endRow = config.lastRow,
            overlays = this.overlays || [],
            classNames = [this.baseClassName],
            overlaysPerRow = {};

        var tagsToReplace = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};

        function replaceTag(tag) { return tagsToReplace[tag] || tag; }

        overlays.forEach(function(overlay) {
            if (overlay.start.row < startRow || overlay.start.row > endRow) return;

            var row = overlay.start.row,
                col = overlay.atLineEnd ? session.getLine(row).length : overlay.start.column,
                overlaysAtRow = overlaysPerRow[row] || (overlaysPerRow[row] = []);

            var lineEndOffset = overlay.atLineEnd ?
              overlaysAtRow.reduce(function(sum, ea, i) {
                return sum + (ea.text.length*config.characterWidth); },
                overlaysAtRow.length*2*config.padding) : 0;

            overlaysAtRow.push(overlay);

            var screenPos = session.documentToScreenPosition(row, col),
                offs = overlay.offset,
                x = config.padding
                  + lineEndOffset
                  + (config.characterWidth * screenPos.column)
                  + (offs ? offs.x : 0),
                y = config.lineHeight * (screenPos.row-config.firstRowScreen) + (offs ? offs.y : 0),
                data = overlay.data ? Object.keys(overlay.data).map(function(ea) {
                  return "data-" + ea + '="' + overlay.data[ea] + '"'; }).join("") : "",
                classes = classNames.concat(overlay.classNames).join(" "),
                text = overlay.text.replace(/[&<>]/g, replaceTag);

            html.pushAll([
                "<span",
                " class=\"", classes, "\"",
                " title=\"", text, "\"",
                " style=\"", "top:", y, "px;", "left:", x ,"px;"," \"",
                data,
                ">",
                text,
                "</span>"]);
        });
    },
    redraw: function(session) {
        session._signal('changeFrontMarker');
    }
},
"accessing", {
    add: function(overlay, session) {
        if (!overlay.classNames) overlay.classNames = [];
        this.overlays.push(overlay);
        if (session.$textOverlay !== this) this.attach(session);
        this.onChange({type: 'overlayAdded', data: overlay}, session);
    },
    remove: function(overlay, session) {
        this.overlays.remove(overlay);
        this.onChange({type: 'overlayRemoved', data: overlay}, session);
    },
    removeAllOverlays: function(session) {
        this.overlays.clone().forEach(function(overlay) {
            this.remove(overlay, session); }, this);
    },
    getElements: function(editor) {
        return Array.from(editor.renderer.container.getElementsByClassName(this.baseClassName));
    }
});

(function extendCodeEditor() {
require('lively.ide.CodeEditor').toRun(function() {

    lively.morphic.CodeEditor.addMethods(
    'text overlay', {
        setupOverlaySupport: function(ed) {
            var session = ed.session;
            var $overlay = session.$textOverlay;
            if ($overlay) $overlay.detach(session)
            session.$textOverlay = new lively.ide.CodeEditorTextOverlay.Overlay()
            session.$textOverlay.attach(session);
            return session.$textOverlay;
        },

        withOverlaySupport: function(func) {
            this.withAceDo(function(ed) {
                func.call(this, ed.session.$textOverlay || this.setupOverlaySupport(ed), ed);
            });
        },

        addTextOverlay: function(overlay) {
            if (!this.getTextOverlaysEnabled()) return;
            this.withOverlaySupport(function($overlay, ed) {
                $overlay.add(overlay, ed.session); });
        },

        redrawTextOverlays: function() {
            this.withOverlaySupport(function(overlay, ed) {
                overlay.redraw(ed.session);
            });
        },

        removeTextOverlay: function(options) {
            var klass = options && options.className,
                self = this;
            this.withOverlaySupport(function($overlay, ed) {
                if (klass) {
                  $overlay.overlays = $overlay.overlays.filter(function(ea) {
                    return !ea.classNames || !ea.classNames.include(klass); });
                }
                if (klass && $overlay.overlays.length) {
                  self.redrawTextOverlays();
                } else {
                  $overlay.detach(ed.session);
                  delete ed.session.$textOverlay;
                }
            });
        },

        hideTextOverlays: function() {
            this.jQuery().find('.text-overlay').addClass('hidden');
        },

        unhideTextOverlays: function() {
            this.jQuery().find('.text-overlay').removeClass('hidden');
        },

        setTextOverlaysEnabled: function(bool) {
            if (bool) this.textString += ''; // force redraw
            else this.removeTextOverlay();
            return this._TextOverlaysEnabled = bool;
        },
        getTextOverlaysEnabled: function() {
            return this._TextOverlaysEnabled === undefined || this._TextOverlaysEnabled;
        }
    });
});
})();

}) // end of module
