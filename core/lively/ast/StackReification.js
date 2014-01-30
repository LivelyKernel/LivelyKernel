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
            ast = lively.ast.acorn.parseFunction(src);
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
        f.livelyDebuggingEnabled = true;
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
        do { result.push(frame); } while (frame = frame.getParentFrame());
        return result;
    }
},
'resuming', {
    resume: function() {
        // FIXME: outer context usually does not have original AST
        // attaching the program node would possibly be right (otherwise the pc's context is missing)
        if (!this.currentFrame.getOriginalAst())
            throw new Error('Cannot resume because frame has no AST!');
        if (!this.currentFrame.pc)
            throw new Error('Cannot resume because frame has no pc!');

        var interpreter = new lively.ast.AcornInterpreter.Interpreter();

        // go through all frames on the stack. beginning with the top most,
        // resume each of them
        return this.frames().reduce(function(result, frame, i) {
            var originalAst = frame.getOriginalAst(); // FIXME
            frame.alreadyComputed[frame.pc.astIndex] = result;
            // FIXME frames hold on to function ASTs but resuming from a
            // function is not supported right now. So we set the resumable
            // node to the functions body here as a quick fix
            var resumeNode = frame.getOriginalAst().body;
            return interpreter.runWithFrameAndResult(resumeNode, frame, result);
        }, undefined);
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
    shiftFrame: function(thiz, frameState, lastNodeAstIndex, pointerToOriginalAst) {
        var alreadyComputed = frameState[0],
            // varMapping = frameState[1],
            parentFrameState = frameState[2],
            frame = lively.ast.AcornInterpreter.Frame.create(
                __getClosure(pointerToOriginalAst) /*, varMapping */),
            pc;
        frame.setThis(thiz);
        frame.setAlreadyComputed(alreadyComputed);
        if (!this.top) {
            this.top = this.last = frame;
            pc = this.error && this.error.astIndex ?
                acorn.walk.findNodeByAstIndex(frame.getOriginalAst(), this.error.astIndex) :
                null;
        } else {
            if (frame.isAlreadyComputed(lastNodeAstIndex)) lastNodeAstIndex++;
            pc = acorn.walk.findNodeByAstIndex(frame.getOriginalAst(), lastNodeAstIndex);
            this.last.setParentFrame(frame);
            this.last = frame;
        }
        frame.setPC(pc);

        var scope, topScope, newScope,
            fState = frameState;
        do {
            newScope = new lively.ast.AcornInterpreter.Scope(fState[1]); // varMapping
            if (scope)
                scope.setParentScope(newScope);
            else
                topScope = newScope;
            scope = newScope
            fState = fState[2]; // parentFrameState
        } while (fState && fState != Global);
        frame.setScope(topScope);

        return frame;
    }
});

}) // end of module
