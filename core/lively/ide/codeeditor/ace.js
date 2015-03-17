var aceLoaded = false;

var libs = [{
  url: Config.codeBase + 'lib/ace/lively-ace.js',
  loadTest: function() { return typeof ace !== 'undefined';}
}, {
  url: Config.codeBase + 'lib/ace/ace.improvements.js',
  loadTest: function() { return Global.ace && ace.improved; }
}, {
  url: Config.codeBase + 'lib/ace/ace.ext.lang.ast-commands.js',
  loadTest: function() { return lively.lang.Path("ext.lang.astCommands").get(ace); }
}, {
  url: Config.codeBase + 'lib/ace/ace.ext.lang.codemarker.js',
  loadTest: function() { return lively.lang.Path("ext.lang.codemarker").get(ace); }
}, {
  url: Config.codeBase + 'lib/ace/ace.ext.custom-text-attributes.js',
  loadTest: function() { return !!ace.require('ace/mode/attributedtext'); }
}, {
  url: Config.codeBase + 'lib/ace/ace.ext.keys.js',
  loadTest: function() { return ace.ext && !!ace.ext.keys; }
}];

lively.lang.arr.mapAsyncSeries(libs,
  function(lib, _, n) { JSLoader.loadJs(lib.url); lively.lang.fun.waitFor(lib.loadTest, n); },
  function(err) { err && console.error(err); aceLoaded = true; });

module('lively.ide.codeeditor.ace').requires('lively.Network'/*to setup lib*/).requiresLib({loadTest: function() { return !!aceLoaded; }}).toRun(function() {

(function configureAce() {
    ace.config.set("basePath", URL.root.withFilename("core/lib/ace/").toString());
    ace.config.set("modePath", URL.root.withFilename("core/lib/ace/").toString());
    // disable currently broken worker

    (function aceSessionSetup(p) {
      p.setUseWorker(false);
      p.__defineGetter__("$useEmacsStyleLineStart", lively.lang.fun.False);
      p.__defineSetter__("$useEmacsStyleLineStart", function(v) { return false; });
    })(ace.require('ace/edit_session').EditSession.prototype);
    
    ace.require('ace/editor').Editor.prototype.focus = function () {
        var _self = this;
        var x = Global.scrollX, y = Global.scrollY;
        console.log("%s %s",x,y);
        setTimeout(function() {
            _self.textInput.focus();
            (function() {
                Global.scrollTo(x, y);
            }).delay(0);
        });
        this.textInput.focus();
        Global.scrollTo(x, y)
    };
    
    
ace.require("ace/virtual_renderer").VirtualRenderer.prototype.screenToTextCoordinates = function (x, y) {
        var canvasPos = this.scroller.getBoundingClientRect();
        var scale = lively.morphic.World.current().getScale()
        x = x / scale;
        y = y / scale;
        var col = Math.round(
            (x + this.scrollLeft - (canvasPos.left / scale) - this.$padding) / this.characterWidth
        );

        var row = (y + this.scrollTop - (canvasPos.top / scale)) / this.lineHeight;

        return this.session.screenToDocumentPosition(row, Math.max(col, 0));
    }

})();

module('lively.ide');

Object.extend(lively.ide, {
    ace: Object.extend(ace, {

        modules: function(optPrefix, shorten) {
            // return ace modules, optionally filtered by optPrefix. If shorten is
            // true remove optPrefix from name
            var moduleNames = Object.keys(ace.define.modules);
            if (!optPrefix) return moduleNames;
            moduleNames = moduleNames.select(function(ea) {
                return ea.startsWith(optPrefix); });
            if (!shorten) return moduleNames;
            return moduleNames.map(function(ea) {
                return ea.substring(optPrefix.length); })
        },

        customTextModes: [],
        availableTextModes: function() {
            return lively.ide.ace.modules('ace/mode/', false)
                .select(function(moduleName) { var mod = ace.require(moduleName); return mod && !!mod.Mode; })
                .map(function(name) { return name.substring('ace/mode/'.length); })
                .concat(ace.customTextModes || []).uniq();
        },


        moduleNameForTextMode: function(textModeName) {
            return this.availableTextModes().include(textModeName) ?
                'ace/mode/' + textModeName : null;
        },

        availableThemes: function() { return this.modules('ace/theme/', true).compact() },

        moduleNameForTheme: function(themeName) {
            return this.availableThemes().include(themeName) ?
                "ace/theme/" + themeName : null
        },

        createKeyHandler: function(options) {
            // Easily create a new key handler. Example usage
            // handler = lively.ide.ace.createKeyHandler({
            //     bindings: {'Alt-a': 'test'},
            //     commands: {test: {exec: function(ed) { show(123); }}}});
            // aceEditor.keyBinding.addKeyboardHandler(handler)
            options = options || {};
            var commands = options.commands || {},
                bindings = options.bindings || {},
                resolvedBindings = {},
                h = new (lively.ide.ace.require("ace/keyboard/hash_handler")).HashHandler();
            for (var key in bindings) { // inline commands
                if (!bindings.hasOwnProperty(key)) continue;
                resolvedBindings[key] = Object.isString(bindings[key]) ?
                    commands[bindings[key]] : bindings[key];
            }
            h.addCommands(commands);
            h.bindKeys(resolvedBindings);
            return h;
        }
    })
});

(function acePatches() {

    // auto close "{", https://github.com/LivelyKernel/LivelyKernel/issues/197
    var CstyleBehaviour = lively.ide.ace.require('ace/mode/behaviour/cstyle').CstyleBehaviour;
    var oop = lively.ide.ace.require('ace/lib/oop')
    var LivelyCstyleBehaviour = function() {
        this.inherit(CstyleBehaviour);
        this.add("braces", "insertion", function (state, action, editor, session, text) {
            if (text == '{') {
                var selection = editor.getSelectionRange();
                var selected = session.doc.getTextRange(selection);
                if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                    return {
                        text: '{' + selected + '}',
                        selection: false
                    };
                } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                    CstyleBehaviour.recordAutoInsert(editor, session, '}');
                    return {
                        text: '{}',
                        selection: [1, 1]
                    };
                }
            } else if (text == '}') {
                var cursor = editor.getCursorPosition();
                var line = session.doc.getLine(cursor.row);
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == '}') {
                    var matching = session.$findOpeningBracket('}', {column: cursor.column + 1, row: cursor.row});
                    if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                        CstyleBehaviour.popAutoInsertedClosing();
                        return {
                            text: '',
                            selection: [1, 1]
                        };
                    }
                }
            } else if (text == "\n" || text == "\r\n") {
                // if we are left of a closing brace and press enter then move
                // that closing brace down one more line to open a typically
                // c-style block and indent it correctly
                var cursor = editor.getCursorPosition();
                var line = session.doc.getLine(cursor.row);
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar == '}') {
                    var openBracePos = session.findMatchingBracket({row: cursor.row, column: cursor.column+1}, '}');
                    if (!openBracePos)
                         return null;

                    var indent = this.getNextLineIndent(state, line.substring(0, cursor.column), session.getTabString());
                    var next_indent = this.$getIndent(line);

                    return {
                        text: '\n' + indent + '\n' + next_indent, // <- existing bracket will be indented
                        selection: [1, indent.length, 1, indent.length]
                    };
                }
            }
        });
    }
    Object.extend(LivelyCstyleBehaviour, CstyleBehaviour);
    oop.inherits(LivelyCstyleBehaviour, CstyleBehaviour);
    lively.ide.ace.require('ace/mode/behaviour/cstyle').CstyleBehaviour = LivelyCstyleBehaviour;

    if (UserAgent.fireFoxVersion || UserAgent.isMozilla /* UserAgent.isMozilla is also true for Chrome */) {
        var cssOverrides = document.createElement("style");
        cssOverrides.textContent = "\n/* ACE CSS Workarounds for Firefox */" +
                ["div.ace_scrollbar",
                 "div.ace_gutter", "div.ace_layer.ace_cursor-layer",
                 "div.ace_layer.ace_text-layer", "div.ace_layer.ace_marker-layer",
                 "div.ace_marker-layer .ace_bracket"].inject("\n", function (css, next) {
            return css + next + " { z-index: 0 !important; }\n"
        });
        document.head.insertBefore(cssOverrides, document.head.firstChild);
    }
})();

}); // end of module
