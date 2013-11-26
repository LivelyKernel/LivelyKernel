module('lively.ide.codeeditor.ace').requires('lively.Network'/*to setup lib*/).requiresLib({url: Config.codeBase + (false && lively.useMinifiedLibs ? 'lib/ace/lively-ace.min.js' : 'lib/ace/lively-ace.js'), loadTest: function() { return typeof ace !== 'undefined';}}).toRun(function() {

(function configureAce() {
    ace.config.set("workerPath", URL.codeBase.withFilename('lib/ace/').fullPath());
    // disable currently broken worker
    ace.require('ace/edit_session').EditSession.prototype.setUseWorker(false);
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
    
        // currently supported:
        // "abap", "clojure", "coffee", "css", "dart", "diff", "haml", "html",
        // "jade", "java", "javascript", "json", "latex", "less", "lisp",
        // "makefile", "markdown", "objectivec", "python", "r", "rdoc", "sh",
        // "sql", "svg", "text", "xml"
        // available but not loaded by default are:
        // "asciidoc", "c9search", "c_cpp", "coldfusion", "csharp", "curly",
        // "dot", "glsl", "golang", "groovy", "haxe", "jsp", "jsx", "liquid",
        // "lua", "luapage", "lucene", "ocaml", "perl", "pgsql", "php",
        // "powershell", "rhtml", "ruby", "scad", "scala", "scss", "stylus",
        // "tcl", "tex", "textile", "typescript", "vbscript", "xquery", "yaml"
    
        availableTextModes: function() {
            return lively.ide.ace.modules('ace/mode/', false)
                .select(function(moduleName) { return !!ace.require(moduleName).Mode })
                .map(function(name) { return name.substring('ace/mode/'.length); });
        },
    
        moduleNameForTextMode: function(textModeName) {
            return this.availableTextModes().include(textModeName) ?
                'ace/mode/' + textModeName : null;
        },
    
        // supported:
        // "ambiance", "monokai", "chrome", "pastel_on_dark", "textmate",
        // "solarized_dark", "twilight", "tomorrow", "tomorrow_night",
        // "tomorrow_night_blue", "tomorrow_night_bright", "eclipse"
        // not loaded by default are:
        // "xcode", "vibrant_ink", "tomorrow_night_eighties",
        // "tomorrow_night_bright", "tomorrow_night_blue", "solarized_light",
        // "mono_industrial", "merbivore_soft", "merbivore", "kr", "idle_fingers",
        // "github", "dreamweaver", "dawn", "crimson_editor", "cobalt",
        // "clouds_midnight", "clouds", "chaos"
        availableThemes: function() { return this.modules('ace/theme/', true) },
    
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
    var CstyleBehaviour = lively.ide.ace.require('ace/mode/behaviour/cstyle').CstyleBehaviour;
    // CstyleBehaviour = origCstyleBehaviour
    // origCstyleBehaviour = CstyleBehaviour
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
})();
}); // end of module