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

    rewrite: function(rewriter) {
        var src = this.getFuncSource(),
            ast = lively.ast.acorn.parse('(' + src + ')')
        return this.ast = rewriteFunction(ast);
    }

});

Object.extend(lively.ast.StackReification, {

    halt: function() {
        var frame = lively.ast.Interpreter.Frame.create();
        throw {isUnwindException: true, lastFrame: frame, topFrame: frame}
    },

    run: function(func) {
        if (!func.livelyDebuggingEnabled) func = func.stackCaptureMode();
        try { return func(); } catch(e) {
            return e.isUnwindException ?
                lively.ast.Continuation.fromUnwindException(e) : e;
        }
    }
});

Object.extend(Global, {
    catchUnwind: lively.ast.StackReification.run,
    halt: lively.ast.StackReification.halt
});

Object.extend(Function.prototype, {

    asRewrittenClosure: function(varMapping) {
        var rewriter = {rewrite: Global.rewrite},
            closure = new lively.ast.RewrittenClosure(this, varMapping);
        closure.rewrite(rewriter);
        return closure;
    },

    stackCaptureMode: function(varMapping) {
        var closure = this.asRewrittenClosure();
        var rewrittenFunc = closure.getRewrittenFunc();
        if (!rewrittenFunc) throw new Error('Cannot rewrite ' + this);
        return rewrittenFunc;
    },

    stackCaptureSource: function(varMapping) {
        return this.asRewrittenClosure().getRewrittenSource();
    }
});

Object.subclass('lively.ast.Continuation',
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
    //     if (!this.currentFrame.getFunc())
    //         throw new Error('Cannot resume because frame has no function!');
    //     if (!this.currentFrame.pc)
    //         throw new Error('Cannot resume because frame has no pc!');
    //     var frame = this.currentFrame, result;
    //     // go through all frames on the stack. beginning with the top most, resume each of them
    //     while (frame && frame.getFunc()) { // !frame.func means we reached the last frame
    //         if (frame.hasNextStatement()) { // dont repeat halt!
    //             frame.jumpToNextStatement();
    //             result = frame.resume();
    //         } else { result = undefined } // FIXME
    //         frame = frame.getContainingScope();
    //     }
    //     return result;
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
    shiftFrame: function(thiz, frame) {
        var varMapping = frame[1],
            astValueRanges = frame[0],
            calledFrame = null,
            parentScope = frame[2];
        var frame = lively.ast.AcornInterpreter.Frame.create(null, varMapping);
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
