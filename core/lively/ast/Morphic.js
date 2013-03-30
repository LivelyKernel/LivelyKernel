module('lively.ast.Morphic').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.ast.Interpreter','lively.Tracing').toRun(function() {

Object.extend(lively.ast, {
    halt: function(frame) {
        (function() {
            lively.ast.openDebugger(frame, "Debugger");
        }).delay(0);
        return true;
    },
    openDebugger: function openDebugger(frame, title) {
        var part = lively.PartsBin.getPart("Debugger", "PartsBin/Debugging");
        part.targetMorph.setTopFrame(frame);
        if (title) part.setTitle(title);
        part.openInWorld();
        var m = part;
        m.align(
            m.bounds().topCenter().addPt(pt(0,-20)),
            lively.morphic.World.current().visibleBounds().topCenter());
    },
});

cop.create('DebugScriptsLayer')
.refineClass(lively.morphic.Morph, {
    addScript: function(funcOrString, optName) {
        var func = Function.fromString(funcOrString),
            name = func.name || optName;
        if (func.containsDebugger()) {
            func = func.forInterpretation();
        }
        var script = func.asScriptOf(this, name);
        var source = script.livelyClosure.source = funcOrString.toString();
        script.toString = function() { return source };
        return script;
    }
});

cop.create('DebugMethodsLayer').refineObject(Function.prototype, {
    addCategorizedMethods: function(categoryName, source) {
        for (var property in source) {
            var func = source[property];
            if (Object.isFunction(func)) {
                console.log('parsing ' + property);
                if (func.containsDebugger()) {
                    console.log('interpreting ' + property);
                    source[property] = func.forInterpretation();
                }
            }
        }
        return cop.proceed(categoryName, source);
    }
});

lively.morphic.Text.addMethods(
'debugging', {
    debugSelection: function() {
        var str = "function(){\n" + this.getSelectionOrLineString() + "\n}",
            fun = Function.fromString(str).forInterpretation(),
            ctx = this.getDoitContext() || this;
        try {
            return fun.startHalted().apply(ctx, []);
        } catch(e) {
            if (!e.isUnwindException) {
                this.showError(e);
            }
        }
        return null;
    }
});

cop.create('DebugGlobalErrorHandlerLayer')
.beGlobal()
.refineClass(lively.morphic.World, {
    logError: function(err, optName) {
        if (err.isUnwindException) {
            var frame = null
            if (err.simStack) {
                frame = lively.ast.Interpreter.Frame.fromTraceNode(err.simStack);
            } else if (err.top) {
                frame = lively.ast.Interpreter.Frame.fromScope(err.top, true);
            }
            if (frame) lively.ast.openDebugger(frame, err.toString());
            return false;
        } else {
            return cop.proceed(err, optName);
        }
    }
})

Object.extend(lively.Tracing, {
    startGlobalDebugging: function() {
        var root = new TracerStackNode(null, {
            qualifiedMethodName: function() { return "trace root" }
        });
        root.isRoot = true;
        // delayed so we don't trace our own invocation
        (function() {
            lively.Tracing.globalTracingEnabled = true;
            lively.Tracing.setCurrentContext(root);
        }).delay(0.2);
    },
    stopGlobalDebugging: function() {
        (function() {
            lively.Tracing.globalTracingEnabled = false;
            lively.Tracing.setCurrentContext(null);
        }).delay(0.2);
    }
});

cop.create('DeepInterpretationLayer')
.refineClass(lively.ast.InterpreterVisitor, {
    shouldInterpret: function(frame, func) {
        return !this.isNative(func);
    }
});

}) // end of module
