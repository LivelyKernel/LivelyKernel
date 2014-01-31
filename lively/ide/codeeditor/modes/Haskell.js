module('lively.ide.codeeditor.modes.Haskell').requires('lively.ide.codeeditor.ace').toRun(function() {

var HaskellMode = lively.ide.ace.require('ace/mode/haskell').Mode

HaskellMode.addMethods({

    commands: {test: {exec: function(ed) { show(123); }}},
    keybindings: {"Alt-a": "test"},
    keyhandler: null,
    initKeyHandler: function() {
        var h = this.keyhandler = lively.ide.ace.createKeyHandler({
            keyBindings: this.keybindings,
            commands: this.commands
        });
    },

    attach: function(ed) {
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
    },

    detach: function(ed) {
        this.keyhandler = null;
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
    },

    doEval: function doEval(codeEditor, insertResult) {
        // FIXME: Cleanup really needed!
        var sourceString = codeEditor.getSelectionOrLineString();
        var noDefRe = /^\s*(<class|data|i(mport|n(fix(|[lr])|stance))|module|primitive|type|newtype)>/;
        evalHaskellCode(wrapHaskellCode(sourceString), printResult);
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function wrapHaskellCode(code) {
            code = code.replace(/\n+$/, "")
            function wrap(code) { return Strings.format(':{\n%s\n:}\n', code) }
            if (noDefRe.test(code)) return wrap(code);
            
            if (!code.include('|') && !code.include('::')) {
                var equalSigns = code.match(/\=+/g) || [];
                var hasAssignment = equalSigns.any(function(match) { return match.length === 1; });
                if (!hasAssignment) return wrap(code);
            }
            var lines = code.split('\n').invoke('trim').reject(function(line) { line.trim().length; });
            lines = lines.map(function(line, i) {
                var nextLine = lines[i+1];
                if (!nextLine || nextLine.match(/^\||where/)) return line + ' ';
                return line + '; ';
            });
            code = lines.join('')
            var needsLet = !lines[0].include('let');
            if (needsLet) code = Strings.format("let { %s }", code);
            console.log('Haskell eval: %s', code);
            return wrap(code);
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function evalHaskellCode(code, thenDo) {
            var webR = URL.nodejsBase.withFilename('HaskellServer/eval').asWebResource().beAsync(),
                prompt = '>>>',
                data = {expr: code};
            webR.post(JSON.stringify(data), "application/json").withJSONWhenDone(function(json, status) {
                if (json.error) { thenDo('Haskell error ' + json.error, ''); return; }
                var cleaned = json.result
                    .replace(/^(\*?\w+\|\s+)+/, '')
                    .replace(new RegExp('\\n?'+prompt+"$"), '');
                thenDo(null, cleaned);
            });
        }
    }
});

}) // end of module