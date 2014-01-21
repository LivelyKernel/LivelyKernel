module('lively.ast.StackReification').requires('lively.ast.Interpreter', 'lively.ast.acorn').toRun(function() {

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
        return eval(this.getRewrittenSource());
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
        try {
            return func();
        } catch(e) {
            if (e.isUnwindException) {
                e.lastFrame.setContainingScope(lively.ast.Interpreter.Frame.global());
                return lively.ast.Continuation.fromUnwindException(e);
            }
            throw e;
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
        this.asRewrittenClosure().getRewrittenSource();
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
        while (frame) {
            result.push(frame);
            frame = frame.getContainingScope();
        }
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
        return new this(e.topFrame.getContainingScope());
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
        return this.error.toString();
    }
},
'frames', {
    shiftFrame: function(thiz, frame) {
        var computationFrame = frame[0];
        var localFrame = frame[1];
        localFrame["this"] = thiz;
        var astIndex = frame[2];
        var scope = frame[3];
        var stackFrame = [computationFrame, localFrame, astIndex, Global, scope];
        if (!this.top) {
            this.top = this.last = stackFrame;
            return;
        }
        this.last[3] = stackFrame;
        this.last = stackFrame;
    }
});

}) // end of module
