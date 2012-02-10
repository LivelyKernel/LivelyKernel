module('lively.ide.JSLint').requires('cop.Layers', 'lib.jslint', 'lively.Widgets').toRun(function() {
cop.create('JSLintLayer').refineClass(TextMorph, {
    tryBoundEval: function(str, offset, printIt) {
        if (this.jslintContents(str, offset)) { 
            return cop.proceed(str, offset, printIt);
        } else {
            // I don't care if there where errors!
            // continue anywhay
            return cop.proceed(str, offset, printIt);
        }
    },
    
    handleFirstJSLintError: function(error, pos) {
        this.setSelectionRange(pos, pos);
        if (Config.showJSLintErrorsInline) {
            var replacement = "/* " + error.reason + " */"
            this.replaceSelectionWith(replacement);
            this.setSelectionRange(pos, pos + replacement.length);
        } else {
            this.setStatusMessage(error.reason, Color.orange);
        }
    },
        
    handleJSLintErrors: function(errors, lines, offset) {
        if (errors.length < 1) return;

        var allErrors = errors.collect(function(ea) {
            return "" + ea.line + "[" + ea.character + "]: " + ea.reason
        }).join('\n');
        var world = this.world();
        world.setStatusMessage("JSLint found " + errors.length + " errors:\n" + allErrors, Color.orange, 10, function() {
            var fullErrors = errors.collect(function(ea) {
                return "" + ea.id + " " + ea.line + "[" + ea.character + "]: " + ea.reason + " (" + ea.evidence + ")" + "raw=" + ea.raw
            }).join('\n');
            var dialog = world.editPrompt("JSLint Errors", undefined, fullErrors)
            dialog.owner.setExtent(pt(900,500))
        })
        offset = offset || 0;

        var errorPos = this.pvtPositionInString(lines, errors[0].line - 1, errors[0].character);
        var pos = offset + errorPos;
        this.handleFirstJSLintError(errors[0], pos)
    },

    jslintContents: function(contentString, offset) {
        var lines = contentString.split(/[\n\r]/)
        JSLINT(lines);
        var errors = JSLINT.errors
            .select(function(ea){ return ea})
            .reject(function(ea){ return JSLintLayer.ignoreErrorList.include(ea.raw)});
        this.handleJSLintErrors(errors, lines, offset)
        return errors.length === 0    
    },
});

Object.extend(JSLintLayer, {
    ignoreErrorList: [
        'Extra comma.', 'Missing semicolon.', 
        "Expected '{a}' and instead saw '{b}'.",
        "eval is evil.",
        "Unnecessary semicolon.",
        "Expected an assignment or function call and instead saw an expression.",
        "'new' should not be used as a statement.",
        "Bad escapement.",
        "All 'debugger' statements should be removed." ]});

JSLintLayer.beGlobal();

}) // end of module