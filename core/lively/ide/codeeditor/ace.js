module('lively.ide.codeeditor.ace').requires().requiresLib({url: Config.codeBase + (false && lively.useMinifiedLibs ? 'lib/ace/lively-ace.min.js' : 'lib/ace/lively-ace.js'), loadTest: function() { return typeof ace !== 'undefined';}}).toRun(function() {

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

}); // end of module