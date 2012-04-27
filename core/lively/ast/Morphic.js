/*
 * Copyright (c) 2008-2012 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module('lively.ast.Morphic').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.ast.Interpreter','lively.Tracing').toRun(function() {

Object.extend(lively.morphic.Morph, {
    openDebugger: function openDebugger(frame, title) {
        var part = lively.PartsBin.getPart("Debugger", "PartsBin/Debugging");
        part.setTopFrame(frame);
        if (title) part.setTitle(title);
        part.openInWorld();
        var m = part;
        m.align(m.bounds().topCenter().addPt(pt(0,-20)), this.visibleBounds().topCenter());
    },
});

cop.create('DebugScriptsLayer')
.refineClass(lively.morphic.Morph, {
    addScript: function(funcOrString, optName) {
        var func = Function.fromString(funcOrString),
            name = func.name || optName;
        if (func.containsDebugger()) {
            func = func.forDebugging("lively.morphic.Morph.openDebugger");
        }
        var script = func.asScriptOf(this, name);
        var source = script.livelyClosure.source = funcOrString.toString();
        script.toString = function() { return source };
        return script;
    },
});
cop.create('DebugMethodsLayer').refineObject(Function.prototype, {
    addCategorizedMethods: function(categoryName, source) {
        console.log("sppp" + categoryName);
        for (var property in source) {
            var func = source[property];
            if (Object.isFunction(func)) {
                if (func.containsDebugger()) {
                    var origSource = func.toString();
                    source[property] = func.forDebugging("lively.morphic.Morph.openDebugger");
                    source[property].toString = function() { return origSource; };
                }
            }
        }
        return cop.proceed(categoryName, source);
    },
});

lively.morphic.Text.addMethods(
'debugging', {
    debugSelection: function() {
        var str = "function(){\n" + this.getSelectionOrLineString() + "\n}",
            fun = Function.fromString(str).forInterpretation(),
            ctx = this.getDoitContext() || this;
        try {
            return fun.apply(ctx, [], {breakAtCalls:true});
        } catch(e) {
            if (e.isUnwindException) {
                lively.morphic.Morph.openDebugger(e.topFrame);
            } else {
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
        if (err.simStack) {
            var frame = lively.ast.Interpreter.Frame.fromTraceNode(err.simStack);
            lively.morphic.Morph.openDebugger(frame, err.toString());
            return false;
        } else {
            return cop.proceed(err, optName);
        }
    },
});
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
    },
});
cop.create('DeepInterpretationLayer')
.refineClass(lively.ast.FunctionCaller, {
    shouldInterpret: function(frame, func) {
        return !this.isNative(func);
    }
});



}) // end of module