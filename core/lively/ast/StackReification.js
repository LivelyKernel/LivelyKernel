module('lively.ast.StackReification').requires('lively.ast.AcornInterpreter').toRun(function() {

lively.Closure.subclass('lively.ast.RewrittenClosure',
'initializing', {

    initialize: function($super, func, varMapping, source) {
        $super(func, varMapping, source);
        this.ast = null;
    }

},
'accessing', {

    getRewrittenFunc: function() {
        // FIXME: should be:
        // return this.recreateFuncFromSource(this.getRewrittenSource());
        var func = eval(this.getRewrittenSource());
        func.livelyDebuggingEnabled = true;
        return func;
    },

    getRewrittenSource: function() {
        return this.ast && escodegen.generate(this.ast);
    },

    getOriginalFunc: function() {
        return this.addClosureInformation(this.getFunc());
    }
},
'rewriting', {

    rewrite: function(astRegistry) {
        var src = this.getFuncSource(),
            ast = lively.ast.acorn.parse('(' + src + ')')
        return this.ast = lively.ast.Rewriting.rewriteFunction(ast, astRegistry);
    }

});

Object.extend(lively.ast.StackReification, {

    halt: function() {
        var frame = lively.ast.Interpreter.Frame.create();
        throw {isUnwindException: true, lastFrame: frame, topFrame: frame}
    },

    run: function(func, astRegistry) {
        if (!func.livelyDebuggingEnabled) func = func.stackCaptureMode(null, astRegistry);
        var result;
        try { return {isContinuation: false, returnValue: func()} } catch(e) {
            return e.isUnwindException ?
                lively.ast.Continuation.fromUnwindException(e) : e
        }
    }
});

Object.extend(Global, {
    catchUnwind: lively.ast.StackReification.run,
    halt: lively.ast.StackReification.halt,
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    __createClosure: function(idx, scope, f) {
        f._cachedAst = lively.ast.Rewriting.getCurrentASTRegistry()[idx];
        f._cachedScope = scope;
        return f;
    },

    __getClosure: function(idx) {
        return lively.ast.Rewriting.getCurrentASTRegistry()[idx];
    }
});

Object.extend(Function.prototype, {

    asRewrittenClosure: function(varMapping, astRegistry) {
        var closure = new lively.ast.RewrittenClosure(this, varMapping);
        closure.rewrite(astRegistry);
        return closure;
    },

    stackCaptureMode: function(varMapping, astRegistry) {
        var closure = this.asRewrittenClosure(varMapping, astRegistry),
            rewrittenFunc = closure.getRewrittenFunc();
        if (!rewrittenFunc) throw new Error('Cannot rewrite ' + this);
        return rewrittenFunc;
    },

    stackCaptureSource: function(varMapping, astRegistry) {
        return this.asRewrittenClosure(astRegistry).getRewrittenSource();
    }
});

Object.subclass('lively.ast.Continuation',
'settings', {
    isContinuation: true
},
'initializing', {
    initialize: function(frame) {
        this.currentFrame = frame; // the frame in which the the unwind was triggered
    },

    copy: function() {
        return new this.constructor(this.currentFrame.copy());
    }
},
'accessing', {
    frames: function() {
        var frame = this.currentFrame, result = [];
        do { result.push(frame); } while (frame = frame.getContainingScope());
        return result;
    }
},
'resuming', {
    resume: function() {
        throw new Error('TODO');
        // FIXME: outer context usually does not have func
        // attaching the program node would possibly be right (otherwise the pc's context is missing)
        // rename to getContextNode ??
        // if (!this.currentFrame.getFunc())
        //     throw new Error('Cannot resume because frame has no function!');
        if (!this.currentFrame.pc)
            throw new Error('Cannot resume because frame has no pc!');

        var frame = this.currentFrame,
            isComputed = false,
            interpreter = new lively.ast.AcornInterpreter.Interpreter(),
            node, result;
        // go through all frames on the stack. beginning with the top most, resume each of them
        while (frame && frame.getContainingScope()) { // !frame.getContainingScope() means we reached the last frame
            node = frame.getFunc(); // FIXME
            frame.setComputedPC(isComputed)
            result = interpreter.runWithFrameAndResult(node, frame, result);
            frame = frame.getContainingScope();
            isComputed = true; // all outer scopes should not recompute
        }
        return result;
    }
});

Object.extend(lively.ast.Continuation, {
    fromUnwindException: function(e) {
        if (!e.isUnwindException) console.error("No unwind exception?");
        return new this(e.top);
    }
});

Object.subclass('lively.ast.Rewriting.UnwindException',
'settings', {
    isUnwindException: true
},
'initializing', {
    initialize: function(error) {
        this.error = error;
    }
},
'printing', {
    toString: function() {
        return '[UNWIND] ' + this.error.toString();
    }
},
'frames', {
    shiftFrame: function(thiz, frame, astPointer) {
        var varMapping = frame[1],
            astValueRanges = frame[0],
            calledFrame = null,
            parentScope = frame[2],
            frame = lively.ast.AcornInterpreter.Frame.create(__getClosure(astPointer), varMapping);
        frame.setThis(thiz);
        if (!this.top) {
            this.top = this.last = frame;
        } else {
            // this.last.calledFrame = frameState;
            this.last.setContainingScope(frame);
            this.last = frame;
        }
        return frame;
    }
});

}) // end of module
