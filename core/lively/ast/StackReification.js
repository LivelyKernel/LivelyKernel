module('lively.ast.StackReification').requires('lively.ast.AcornInterpreter', 'lively.ast.Rewriting').toRun(function() {

lively.Closure.subclass('lively.ast.RewrittenClosure',
'initializing', {

    initialize: function($super, func, varMapping, source) {
        $super(func, varMapping, source);
        this.ast = null;
    }

},
'accessing', {

    getRewrittenFunc: function() {
        var func = this.recreateFuncFromSource(this.getRewrittenSource());
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
            ast = lively.ast.acorn.parseFunction(src),
            namespace = '[runtime]';
        if (this.originalFunc && this.originalFunc.sourceModule)
            namespace = new URL(this.originalFunc.sourceModul.findUri()).relativePathFrom(URL.root);
        return this.ast = lively.ast.Rewriting.rewriteFunction(ast, astRegistry, namespace);
    }

});

Object.extend(lively.ast.StackReification, {

    debugReplacements: {
        Function: {
            bind: {},
            call: {},
            applyt: {}
        },
        Array: {
            sort: {
                dbg: NativeArrayFunctions.sort
            },
            filter: {
                dbg: NativeArrayFunctions.filter
            },
            forEach: {
                dbg: NativeArrayFunctions.forEach
            },
            some: {
                dbg: NativeArrayFunctions.some
            },
            every: {
                dbg: NativeArrayFunctions.every
            },
            map: {
                dbg: NativeArrayFunctions.map
            },
            reduce: {
                dbg: NativeArrayFunctions.reduce
            },
            reduceRight: {
                dbg: NativeArrayFunctions.reduceRight
            }
        },
        String: {
            // TODO: second parameter can be function (replaceValue)
            replace: {}
        },
        JSON: {
            // TODO: second parameter can be function (replacer)
            stringify: {}
        }
    },

    enableDebugSupport: function(astRegistry) {
        // FIXME currently only takes care of Array
        try {
            if (!this.hasOwnProperty('configOption')) {
                this.configOption = lively.Config.enableDebuggerStatements;
                lively.Config.enableDebuggerStatements = true;
            }
            var replacements = lively.ast.StackReification.debugReplacements;
            for (var method in replacements.Array) {
                if (!replacements.Array.hasOwnProperty(method)) continue;
                var spec = replacements.Array[method],
                    dbgVersion = spec.dbg.stackCaptureMode(null, astRegistry);
                if (!spec.original) spec.original = Array.prototype[method];
                Array.prototype[method] = dbgVersion;
            }
        } catch(e) {
            this.disableDebugSupport();
            throw e;
        }
    },

    disableDebugSupport: function() {
        if (this.hasOwnProperty('configOption')) {
            lively.Config.enableDebuggerStatements = this.configOption;
            delete this.configOption;
        }
        var replacements = lively.ast.StackReification.debugReplacements;
        for (var method in replacements.Array) {
            var spec = replacements.Array[method],
                original = spec.original || Array.prototype[method];
            Array.prototype[method] = original;
        }
    },

    // TODO: reactivate if really necessary (use debugger instead?!)
    // halt: function() {
    //     // FIXME: cannot be called without Function object
    //     var frame = lively.ast.AcornInterpreter.Frame.create(/* func */);
    //     throw { isUnwindException: true, lastFrame: frame, topFrame: frame };
    // },

    run: function(func, astRegistry, args, optMapping) {
        // FIXME: __getClosure - needed for UnwindExceptions also used here - uses
        //        lively.ast.Rewriting.getCurrentASTRegistry()
        astRegistry = astRegistry || lively.ast.Rewriting.getCurrentASTRegistry();
        lively.ast.StackReification.enableDebugSupport(astRegistry);
        if (!func.livelyDebuggingEnabled)
            func = func.stackCaptureMode(optMapping, astRegistry);
        try {
            return { isContinuation: false, returnValue: func.apply(null, args || []) };
        } catch (e) {
            // e will not be an UnwindException in rewritten system (gets unwrapped)
            e = e.isUnwindException ? e : e.unwindException;
            if (e.error instanceof Error)
                throw e.error;
            else
                return lively.ast.Continuation.fromUnwindException(e);
        } finally {
            lively.ast.StackReification.disableDebugSupport(astRegistry);
        }
    }

});

Object.extend(Global, {

    catchUnwind: lively.ast.StackReification.run,
    // TODO: reactivate if really necessary (use debugger instead?!)
    // halt: lively.ast.StackReification.halt,
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    __createClosure: Global.__createClosure || function(namespace, idx, parentFrameState, f) {
        // FIXME: Either save idx and use __getClosure later or attach the AST here and now (code dup.)?
        f._cachedAst = lively.ast.Rewriting.getCurrentASTRegistry()[namespace][idx];
        // parentFrameState = [computedValues, varMapping, parentParentFrameState]
        f._cachedScopeObject = parentFrameState;
        f.livelyDebuggingEnabled = true;
        return f;
    },

    // FIXME naming -- actually we return the ast node not a closure
    __getClosure: Global.__getClosure || function(namespace, idx) {
        var subRegistry = lively.ast.Rewriting.getCurrentASTRegistry()[namespace];
        return (subRegistry != null ? subRegistry[idx] : null); // ast
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
        var result = this.frames().reduce(function(result, frame, i) {
            if (result.error) {
                result.error.shiftFrame(frame);
                return result;
            }

            // disconnect frames to ensure correct reconnection later
            frame.parentFrame = null;

            if (result.hasOwnProperty('val'))
                frame.alreadyComputed[frame.pc.astIndex] = result.val;

            try {
                return { val: interpreter.runFromPC(frame, result.val) };
            } catch (ex) {
                if (!ex.isUnwindException)
                    throw ex;
                return { error: ex };
            }
        }, {});

        if (result.error)
            return lively.ast.Continuation.fromUnwindException(result.error);
        else
            return result.val;
    }

});

Object.extend(lively.ast.Continuation, {

    fromUnwindException: function(e) {
        if (!e.isUnwindException) console.error("No unwind exception?");
        e.recreateFrames();
        var frame = lively.ast.AcornInterpreter.Interpreter.stripInterpreterFrames(e.top),
            continuation = new this(frame);
        continuation.error = e.error;
        return continuation;
    }

});

}) // end of module
