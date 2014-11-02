module('lively.ast.AcornInterpreter').requires('lively.ast.acorn', 'lively.ast.Rewriting').toRun(function() {

/*
// reimplementation of lively.ast.InterpreterVisitor for Mozilla Parser API
// TODO: implement strict mode ?!
//       - different arguments handling (immutable)
//       - with statement would be SyntaxError
//       - introduction of (global) variables without var declaration
//       - no variable introduction through evaled code
//       - different behavior of delete
//       (to be continued)
*/
Object.subclass('lively.ast.AcornInterpreter.Interpreter',
'initialization', {

    initialize: function() {
        this.breakAtStatement = false; // for e.g. step over
        this.breakAtCall      = false; // for e.g. step into
    },

    statements: ['EmptyStatement', 'ExpressionStatement', 'IfStatement', 'LabeledStatement', 'BreakStatement', 'ContinueStatement', 'WithStatement', 'SwitchStatement', 'ReturnStatement', 'ThrowStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'DebuggerStatement', 'VariableDeclaration', 'FunctionDeclaration', 'SwitchCase'] // without BlockStatement and TryStatement

},
'interface', {

    run: function(node, optMapping) {
        var program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program, optMapping);
        program.lexicalScope = frame.getScope(); // FIXME
        return this.runWithFrameAndResult(node, frame, undefined);
    },

    runWithContext: function(node, ctx, optMapping) {
        var program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program);
        if (optMapping != null) {
            var parentScope = new lively.ast.AcornInterpreter.Scope(optMapping);
            frame.getScope().setParentScope(parentScope);
        }
        program.lexicalScope = frame.getScope(); // FIXME
        frame.setThis(ctx);
        return this.runWithFrameAndResult(node, frame, undefined);
    },

    runWithFrame: function(node, frame) {
        if (node.type == 'FunctionDeclaration' || node.type =='FunctionExpression')
            node = node.body;
        return this.runWithFrameAndResult(node, frame, undefined);
    },

    runFromPC: function(frame, lastResult) {
        var node = frame.getOriginalAst();
        if (frame.func.isFunction())
            node = node.body;
        return this.runWithFrameAndResult(node, frame, lastResult);
    },

    runWithFrameAndResult: function(node, frame, result) {
        var state = {
            currentFrame: frame,
            labels: {},
            result: result
        };
        if (!frame.isResuming()) this.evaluateDeclarations(node, frame);

        try {
            this.accept(node, state);
        } catch (e) {
            if (lively.Config.get('loadRewrittenCode') && e.unwindException)
                e = e.unwindException;
            if (e.isUnwindException && !frame.isResuming()) {
                frame.setPC(acorn.walk.findNodeByAstIndex(frame.getOriginalAst(), e.error.astIndex));
                e.shiftFrame(frame);
            }
            throw e;
        }
        // finished execution, remove break
        this.breakAtStatement = false;
        return state.result;
    }

},
'accessing', {

    setVariable: function(name, state) {
        var scope = state.currentFrame.getScope();
        if (name != 'arguments')
            scope = scope.findScope(name, true).scope; // may throw ReferenceError
        scope.set(name, state.result);
    },

    setSlot: function(node, state) {
        if (node.type != 'MemberExpression')
            throw new Error('setSlot can only be called with a MemberExpression node');
        var value = state.result;
        this.accept(node.object, state);
        var obj = state.result, prop;
        if (node.property.type == 'Identifier' && !node.computed) {
            prop = node.property.name;
        } else {
            this.accept(node.property, state);
            prop = state.result;
        }

        var setter = obj.__lookupSetter__(prop);
        if (setter) {
            this.invoke(obj, setter, [value], state.currentFrame, false/*isNew*/);
        } else if (obj === state.currentFrame.arguments) {
            obj[prop] = value;
            state.currentFrame.setArguments(obj);
        } else {
            obj[prop] = value;
        }
        state.result = value;
    }

},
'invoking', {

    evaluateDeclarations: function(node, frame) {
        // lookup all the declarations but stop at new function scopes
        var self = this;
        acorn.walk.matchNodes(node, {
            VariableDeclaration: function(node, state, depth, type) {
                if (type != 'VariableDeclaration') return;
                node.declarations.forEach(function(decl) {
                    frame.getScope().addToMapping(decl.id.name);
                });
            },
            FunctionDeclaration: function(node, state, depth, type) {
                if (type != 'FunctionDeclaration') return;
                self.visitFunctionDeclaration(node, { currentFrame: frame });
            }
        }, null, { visitors: acorn.walk.visitors.stopAtFunctions });
    },

    invoke: function(recv, func, argValues, frame, isNew) {
        // if we send apply to a function (recv) we want to interpret it
        // although apply is a native function
        if (recv && Object.isFunction(recv) && func === Function.prototype.apply) {
            func = recv; // The function object is what we want to run
            recv = argValues.shift(); // thisObj is first parameter
            argValues = argValues[0]; // the second arg are the arguments (as an array)
        }
        var origFunc = func;

        if (this.shouldHaltAtNextCall()) // try to fetch interpreted function
            func = this.fetchInterpretedFunction(func) || func;

        if (this.shouldInterpret(frame, func)) {
            func.setParentFrame(frame);
            if (this.shouldHaltAtNextCall()) {
                this.breakAtCall = false;
                this.breakAtStatement = false;
                func = func.startHalted(this);
            } else {
                func = func.forInterpretation();
            }
        }
        if (isNew) {
            if (this.isNative(func)) return new func();
            recv = this.newObject(origFunc);
        }

        var result = func.apply(recv, argValues);
        if (isNew) {// && !Object.isObject(result)) {
            // FIXME: Cannot distinguish real result from (accidental) last result
            //        which might also be an object but which should not be returned
            // 13.2.2 ECMA-262 3rd. Edition Specification
            return recv;
        }
        return result;
    },

    isNative: function(func) {
        if (!this._nativeFuncRegex) this._nativeFuncRegex = /\{\s+\[native\scode\]\s+\}$/;
        return this._nativeFuncRegex.test(func.toString());
    },

    shouldInterpret: function(frame, func) {
        return !this.isNative(func) && !!func.isInterpretableFunction;
        // TODO: reactivate when necessary
            // || func.containsDebugger();
    },

    newObject: function(func) {
        var proto = func.prototype;
        function constructor() {}
        constructor.prototype = proto;
        var newObj = new constructor();
        newObj.constructor = func;
        return newObj;
    }

},
'execution', {

    haltAtNextStatement: function() {
        this.breakAtStatement = true;
    },

    shouldHaltAtNextStatement: function() {
        return this.breakAtStatement;
    },

    stepToNextStatement: function(frame) {
        this.haltAtNextStatement();
        try { // should throw Break
            return frame.isResuming() ?
                this.runFromPC(frame) :
                this.runWithFrame(frame.getOriginalAst(), frame);
        } catch (e) {
            // TODO: create continuation
            if (e.isUnwindException && e.error.toString() == 'Break')
                e = e.error;
            return e;
        }
    },

    haltAtNextCall: function() {
        this.breakAtCall = true;
    },

    shouldHaltAtNextCall: function() {
        return this.breakAtCall;
    },

    stepToNextCallOrStatement: function(frame) {
        this.haltAtNextCall();
        return this.stepToNextStatement(frame);
    },

    resumeToAndBreak: function(node, frame) {
        frame.setPC(node);
        this.breakOnResume = true;
        return this.runFromPC(frame);
    }
},
'helper', {

    findNodeLabel: function(node, state) {
        return Object.getOwnPropertyNames(state.labels).reduce(function(res, label) {
            if (state.labels[label] === node) res = label;
            return res;
        }, undefined);
    },

    wantsInterpretation: function(node, frame) {
        if (node.type == 'FunctionDeclaration')
            return false; // is done in evaluateDeclarations()

        if (!frame.isResuming()) return true;

        // Have we reached the statement the pc is in already? If yes then we
        // need to resume interpretation
        if (frame.resumeHasReachedPCStatement()) return true;

        // is the pc is in sub-ast of node? return false if not
        if (node.astIndex < frame.pcStatement.astIndex) return false;

        return true;
    },

    fetchInterpretedFunction: function(func) {
        if (!func.livelyDebuggingEnabled) return null;
        if (func.isInterpretableFunction !== undefined) return func;
        var topScope = lively.ast.AcornInterpreter.Scope.recreateFromFrameState(func._cachedScopeObject);
        func = new lively.ast.AcornInterpreter.Function(func._cachedAst, topScope, func);
        return func.asFunction();
    }

},
'visiting', {

    accept: function(node, state) {
        function throwableBreak() {
            return new UnwindException({
                toString: function() { return 'Break'; },
                astIndex: node.astIndex,
                lastResult: state.result
            });
        }

        var frame = state.currentFrame;

        if (!this.wantsInterpretation(node, frame)) return;

        if (frame.isResuming()) {
            if (frame.isPCStatement(node)) frame.resumeReachedPCStatement();
            if (frame.resumesAt(node)) {
                frame.resumesNow();
                if (this.breakOnResume) {
                    this.breakOnResume = false;
                    throw throwableBreak();
                }
            }
            if (frame.isAlreadyComputed(node.astIndex)) {
                state.result = frame.alreadyComputed[node.astIndex];
                return;
            }
        } else if (this.shouldHaltAtNextStatement() && this.statements.include(node.type)) {
            if (node.type == 'DebuggerStatement')
                frame.alreadyComputed[node.astIndex] = undefined;
            this.breakAtStatement = false;
            this.breakAtCall = false;
            throw throwableBreak();
        }

        try {
            this['visit' + node.type](node, state);
        } catch (e) {
            if (lively.Config.get('loadRewrittenCode') && !(e instanceof UnwindException)) {
                if (e.unwindException)
                    e = e.unwindException;
                else {
                    e = new UnwindException(e);
                    frame.setPC(node);
                    e.shiftFrame(frame);
                }
            }
            if (!frame.isResuming() && e.error && e.error.toString() != 'Break') {
                frame.setPC(node);
                e.shiftFrame(frame);
            }
            throw e;
        }
    },

    visitProgram: function(node, state) {
        var frame = state.currentFrame;
        for (var i = 0; i < node.body.length; i++) {
            this.accept(node.body[i], state);
            if (frame.returnTriggered) // frame.breakTriggered || frame.continueTriggered
                return;
        }
    },

    visitEmptyStatement: function(node, state) {
        // do nothing, not even change the result
    },

    visitBlockStatement: function(node, state) {
        var frame = state.currentFrame;
        for (var i = 0; i < node.body.length; i++) {
            this.accept(node.body[i], state);
            if (frame.returnTriggered || frame.breakTriggered || frame.continueTriggered)
                return;
        }
    },

    visitExpressionStatement: function(node, state) {
        this.accept(node.expression, state);
    },

    visitIfStatement: function(node, state) {
        var oldResult = state.result,
            frame = state.currentFrame;
        this.accept(node.test, state);
        var condVal = state.result;
        state.result = oldResult;

        if (condVal) {
            this.accept(node.consequent, state);
        } else if (node.alternate) {
            this.accept(node.alternate, state);
        }
    },

    visitLabeledStatement: function(node, state) {
        var frame = state.currentFrame,
            label = node.label.name;
        state.labels[label] = node.body;
        this.accept(node.body, state);
        delete state.labels[label];
        if (frame.breakTriggered)
            frame.stopBreak(label);
        if (frame.continueTriggered)
            frame.stopContinue(label);
    },

    visitBreakStatement: function(node, state) {
        state.currentFrame.triggerBreak(node.label ? node.label.name : undefined);
    },

    visitContinueStatement: function(node, state) {
        state.currentFrame.triggerContinue(node.label ? node.label.name : undefined);
    },

    visitWithStatement: function(node, state) {
        var frame = state.currentFrame,
            oldResult = state.result;
        this.accept(node.object, state);
        var lexicalObj = state.result;
        state.result = oldResult;
        var withScope = frame.newScope(lexicalObj);
        state.currentFrame.setScope(withScope);
        this.accept(node.body, state);
        state.currentFrame.setScope(withScope.getParentScope());
    },

    visitSwitchStatement: function(node, state) {
        var result = state.result,
            frame = state.currentFrame;
        this.accept(node.discriminant, state);
        var leftVal = state.result,
            rightVal, caseMatched = false, defaultCaseId;
        for (var i = 0; i < node.cases.length; i++) {
            if (node.cases[i].test === null) {
                // default
                defaultCaseId = i;
                if (!caseMatched)
                    continue;
            } else {
                this.accept(node.cases[i].test, state);
                rightVal = state.result;
                state.result = result;
            }
            if (frame.isResuming() && this.wantsInterpretation(node.cases[i], frame)) {
                caseMatched = true; // resuming node is inside this case
            }
            if (leftVal === rightVal || caseMatched) {
                this.accept(node.cases[i], state);
                caseMatched = true;

                if (frame.breakTriggered) {
                    frame.stopBreak(); // only non-labled break
                    return;
                }
                if (frame.continueTriggered || frame.returnTriggered)
                    return;
            }
        }
        if (!caseMatched && (defaultCaseId !== undefined)) {
            caseMatched = true;
            for (i = defaultCaseId; i < node.cases.length; i++) {
                this.accept(node.cases[i], state);
                caseMatched = true;

                if (frame.breakTriggered) {
                    frame.stopBreak(); // only non-labled break
                    return;
                }
                if (frame.continueTriggered || frame.returnTriggered)
                    return;
            }
        }
        return result;
    },

    visitReturnStatement: function(node, state) {
        if (node.argument)
            this.accept(node.argument, state);
        else
            state.result = undefined;
        state.currentFrame.triggerReturn();
    },

    visitTryStatement: function(node, state) {
        var frame = state.currentFrame,
            hasError = false, err;

        try {
            this.accept(node.block, state);
        } catch (e) {
            if (lively.Config.get('loadRewrittenCode')) {
                if (e instanceof UnwindException)
                    throw e;
                else  if (e.unwindException && e.toString() == 'Break')
                    throw e.unwindException;
            }
            hasError = true;
            state.error = err = e;
        }
        if (!hasError && frame.isResuming() && (node.handler !== null)  && !frame.isAlreadyComputed(node.handler))
            hasError = true;

        try {
            if (hasError && (node.handler !== null)) {
                hasError = false;
                this.accept(node.handler, state);
                delete state.error;
            }
        } catch (e) {
            hasError = true;
            err = e;
        } finally {
            if (node.finalizer !== null)
                this.accept(node.finalizer, state);
        }

        if (hasError)
            throw err;
    },

    visitCatchClause: function(node, state) {
        var frame = state.currentFrame;
        if (!frame.isResuming() || state.hasOwnProperty('error')) {
            var catchScope = frame.newScope();
            catchScope.set(node.param.name, state.error);
            frame.setScope(catchScope);
        }
        this.accept(node.body, state);
        state.currentFrame.setScope(frame.getScope().getParentScope()); // restore original scope
    },

    visitThrowStatement: function(node, state) {
        this.accept(node.argument, state);
        throw state.result;
    },

    visitWhileStatement: function(node, state) {
        var result = state.result,
            frame = state.currentFrame;
        this.accept(node.test, state);
        var testVal = state.result;
        state.result = result;

        if (frame.isResuming()) testVal = true; // resuming node inside loop
        while (testVal) {
            this.accept(node.body, state);
            result = state.result;

            if (frame.breakTriggered) {
                frame.stopBreak(); // only non-labled break
                break;
            }
            if (frame.continueTriggered) {
                frame.stopContinue(this.findNodeLabel(node, state)); // try a labled continue
                if (frame.continueTriggered) // still on: different labeled continue
                    break;
            }
            if (frame.returnTriggered)
                return;

            this.accept(node.test, state);
            testVal = state.result;
            state.result = result;
        }
    },

    visitDoWhileStatement: function(node, state) {
        var frame = state.currentFrame,
            testVal, result;
        do {
            this.accept(node.body, state);
            result = state.result;

            if (frame.breakTriggered) {
                frame.stopBreak(); // only non-labled break
                break;
            }
            if (frame.continueTriggered) {
                frame.stopContinue(this.findNodeLabel(node, state)); // try a labled continue
                if (frame.continueTriggered) // still on: different labeled continue
                    break;
            }
            if (frame.returnTriggered)
                return;

            this.accept(node.test, state);
            testVal = state.result;
            state.result = result;
        } while (testVal);
        return result;
    },

    visitForStatement: function(node, state) {
        var result = state.result,
            frame = state.currentFrame;
        node.init && this.accept(node.init, state);

        var testVal = true;
        if (node.test) {
            this.accept(node.test, state);
            testVal = state.result;
        }
        state.result = result;

        if (frame.isResuming()) testVal = true; // resuming node inside loop or update
        while (testVal) {
            this.accept(node.body, state);
            result = state.result;

            if (frame.breakTriggered) {
                frame.stopBreak(); // only non-labled break
                break;
            }
            if (frame.continueTriggered) {
                frame.stopContinue(this.findNodeLabel(node, state)); // try a labled continue
                if (frame.continueTriggered) // still on: different labeled continue
                    break;
            }
            if (frame.returnTriggered)
                return;

            if (node.update) {
                this.accept(node.update, state);
            }

            if (node.test) {
                this.accept(node.test, state);
                testVal = state.result;
            }
            state.result = result;
        }
    },

    visitForInStatement: function(node, state) {
        var result = state.result,
            frame = state.currentFrame,
            keys, left;

        if (frame.isResuming() && frame.isAlreadyComputed(node.right.astIndex)) {
            // computed value only contains property names
            keys = frame.alreadyComputed[node.right.astIndex];
        } else {
            this.accept(node.right, state);
            keys = Object.keys(state.result); // collect enumerable properties (like for-in)
        }
        if (node.left.type == 'VariableDeclaration') {
            this.accept(node.left, state);
            left = node.left.declarations[0].id;
        } else
            left = node.left;
        state.result = result;

        for (var i = 0; i < keys.length; i++) {
            state.result = keys[i];
            if (left.type == 'Identifier') {
                if (frame.isResuming() && frame.lookup(left.name) !== state.result)
                    continue;
                this.setVariable(left.name, state);
            } else if (left.type == 'MemberExpression') {
                this.setSlot(left, state);
            }

            this.accept(node.body, state);

            if (frame.breakTriggered) {
                frame.stopBreak(); // only non-labled break
                break;
            }
            if (frame.continueTriggered) {
                frame.stopContinue(this.findNodeLabel(node, state)); // try a labled continue
                if (frame.continueTriggered) // still on: different labeled continue
                    break;
            }
            if (frame.returnTriggered)
                return;
            // TODO: reactivate for debugger
            // frame.removeValue(node.body);
        }
    },

    visitDebuggerStatement: function(node, state) {
        // FIXME: might not be in debug session => do nothing?
        //        node.astIndex might be missing
        var e = {
            toString: function() {
                return 'Debugger';
            },
            astIndex: node.astIndex
        };
        state.currentFrame.alreadyComputed[node.astIndex] = undefined;
        throw new UnwindException(e);
    },

    visitVariableDeclaration: function(node, state) {
        var oldResult = state.result;
        if (node.kind == 'var') {
            node.declarations.forEach(function(decl) {
                this.accept(decl, state);
            }, this);
        } else
            throw new Error('No semantics for VariableDeclaration of kind ' + node.kind + '!');
        state.result = oldResult;
    },

    visitVariableDeclarator: function(node, state) {
        var oldResult = state.result, val;
        if (node.init) {
            this.accept(node.init, state);
            // addToMapping is done in evaluateDeclarations()
            this.setVariable(node.id.name, state);
        }
        state.result = oldResult;
    },

    visitThisExpression: function(node, state) {
        state.result = state.currentFrame.getThis();
    },

    visitArrayExpression: function(node, state) {
        var result = new Array(node.elements.length);
        node.elements.forEach(function(elem, idx) {
            if (elem) {
                this.accept(elem, state);
                result[idx] = state.result;
            }
        }, this);
        state.result = result;
    },

    visitObjectExpression: function(node, state) {
        var result = {};
        node.properties.forEach(function(prop) {
            var propName;
            if (prop.key.type == 'Identifier')
                propName = prop.key.name;
            else {
                this.accept(prop.key, state);
                propName = state.result;
            }
            switch (prop.kind) {
            case 'init':
                this.accept(prop.value, state);
                result[propName] = state.result;
                break;
            case 'get':
                this.accept(prop.value, state);
                Object.defineProperty(result, propName, {
                    get: state.result,
                    enumerable : true,
                    configurable : true
                });
                break;
            case 'set':
                this.accept(prop.value, state);
                Object.defineProperty(result, propName, {
                    set: state.result,
                    enumerable : true,
                    configurable : true
                });
                break;
            default: throw new Error('Invalid kind for ObjectExpression!');
            }
        }, this);
        state.result = result;
    },

    visitFunctionDeclaration: function(node, state) {
        // IS NOT CALLED DIRECTLY FROM THE accept()
        var result = state.result;
        this.visitFunctionExpression(node, state);
        state.currentFrame.getScope().set(node.id.name, state.result);
        state.result = result;
    },

    visitFunctionExpression: function(node, state) {
        var fn = new lively.ast.AcornInterpreter.Function(node, state.currentFrame.getScope());
        state.result = fn.asFunction();

        // if (node.defaults) {
        //     node.defaults.forEach(function(ea) {
        //         // ea is of type Expression
        //         this.accept(ea, state);
        //     }, this);
        // }
        // if (node.rest) {
        //     // rest is a node of type Identifier
        //     this.accept(node.rest, state);
        // }
    },

    visitSequenceExpression: function(node, state) {
        node.expressions.forEach(function(expr) {
            this.accept(expr, state);
        }, this);
    },

    visitUnaryExpression: function(node, state) {
        if (node.operator == 'delete') {
            node = node.argument;
            if (node.type == 'Identifier') {
                // do not delete
                try {
                    state.currentFrame.getScope().findScope(node.name);
                    state.result = false;
                } catch (e) { // should be ReferenceError
                    state.result = true;
                }
            } else if (node.type == 'MemberExpression') {
                this.accept(node.object, state);
                var obj = state.result, prop;
                if ((node.property.type == 'Identifier') && !node.computed)
                    prop = node.property.name;
                else {
                    this.accept(node.property, state);
                    prop = state.result;
                }
                state.result = delete obj[prop];
            } else
                throw new Error('Delete not yet implemented for ' + node.type + '!');
            return;
        }

        this.accept(node.argument, state);
        switch (node.operator) {
            case '-':       state.result = -state.result; break;
            case '+':       state.result = +state.result; break;
            case '!':       state.result = !state.result; break;
            case '~':       state.result = ~state.result; break;
            case 'typeof':  state.result = typeof state.result; break;
            case 'void':    state.result = void state.result; break; // or undefined?
            default: throw new Error('No semantics for UnaryExpression with ' + node.operator + ' operator!');
        }
    },

    visitBinaryExpression: function(node, state) {
        this.accept(node.left, state);
        var left = state.result;
        this.accept(node.right, state);
        var right = state.result;

        switch (node.operator) {
            case '==':  state.result = left == right; break;
            case '!=':  state.result = left != right; break;
            case '===': state.result = left === right; break;
            case '!==': state.result = left !== right; break;
            case '<':   state.result = left < right; break;
            case '<=':  state.result = left <= right; break;
            case '>':   state.result = left > right; break;
            case '>=':  state.result = left >= right; break;
            case '<<':  state.result = left << right; break;
            case '>>':  state.result = left >> right; break;
            case '>>>': state.result = left >>> right; break;
            case '+':   state.result = left + right; break;
            case '-':   state.result = left - right; break;
            case '*':   state.result = left * right; break;
            case '/':   state.result = left / right; break;
            case '%':   state.result = left % right; break;
            case '|':   state.result = left | right; break;
            case '^':   state.result = left ^ right; break;
            case '&':   state.result = left & right; break;
            case 'in':  state.result = left in right; break;
            case 'instanceof': state.result = left instanceof right; break;
            // case '..': // E4X-specific
            default: throw new Error('No semantics for BinaryExpression with ' + node.operator + ' operator!');
        }
    },

    visitAssignmentExpression: function(node, state) {
        if (node.operator == '=') {
            this.accept(node.right, state);
        } else {
            this.accept(node.left, state);
            var oldVal = state.result;
            this.accept(node.right, state);
            switch (node.operator) {
                case '+=':    state.result = oldVal + state.result; break;
                case '-=':    state.result = oldVal - state.result; break;
                case '*=':    state.result = oldVal * state.result; break;
                case '/=':    state.result = oldVal / state.result; break;
                case '%=':    state.result = oldVal % state.result; break;
                case '<<=':   state.result = oldVal << state.result; break;
                case '>>=':   state.result = oldVal >> state.result; break;
                case '>>>=':  state.result = oldVal >>> state.result; break;
                case '|=':    state.result = oldVal | state.result; break;
                case '^=':    state.result = oldVal ^ state.result; break;
                case '&=':    state.result = oldVal & state.result; break;
                default: throw new Error('No semantics for AssignmentExpression with ' + node.operator + ' operator!');
            }
        }
        if (node.left.type == 'Identifier')
            this.setVariable(node.left.name, state);
        else if (node.left.type == 'MemberExpression')
            this.setSlot(node.left, state);
        else
            throw new Error('Invalid left-hand in AssigmentExpression!');
    },

    visitUpdateExpression: function(node, state) {
        this.accept(node.argument, state);
        var oldVal = state.result,
            newVal;

        switch (node.operator) {
        case '++': newVal = oldVal + 1; break;
        case '--': newVal = oldVal - 1; break;
        default: throw new Error('No semantics for UpdateExpression with ' + node.operator + ' operator!');
        }
        state.result = newVal;
        if (node.argument.type == 'Identifier')
            this.setVariable(node.argument.name, state);
        else if (node.argument.type == 'MemberExpression')
            this.setSlot(node.argument, state);
        else
            throw new Error('Invalid argument in UpdateExpression!');
        if (!node.prefix)
            state.result = oldVal;
    },

    visitLogicalExpression: function(node, state) {
        this.accept(node.left, state);
        var left = state.result;
        if ((node.operator == '||' && !left)
         || (node.operator == '&&' && left))
         this.accept(node.right, state);
    },

    visitConditionalExpression: function(node, state) {
        this.visitIfStatement(node, state);
    },

    visitNewExpression: function(node, state) {
        state.isNew = true;
        this.visitCallExpression(node, state);
        delete state.isNew; // FIXME: nested NewExpressions?
    },

    visitCallExpression: function(node, state) {
        var recv, prop, fn;
        if (node.callee.type == 'MemberExpression') {
            // send
            this.accept(node.callee.object, state);
            recv = state.result;

            if ((node.callee.property.type == 'Identifier') && !node.callee.computed)
                prop = node.callee.property.name;
            else {
                this.accept(node.callee.property, state);
                prop = state.result;
            }
            fn = recv[prop];
        } else {
            // simple call
            this.accept(node.callee, state);
            fn = state.result;
        }
        var args = [];
        node.arguments.forEach(function(arg) {
            this.accept(arg, state);
            args.push(state.result);
        }, this);
        try {
            state.result = this.invoke(recv, fn, args, state.currentFrame, state.isNew);
        } catch (e) {
            if (lively.Config.get('loadRewrittenCode') && e.unwindException)
                e = e.unwindException;
            state.result = e;
            state.currentFrame.setPC(node);
            if (e.isUnwindException) {
                e.shiftFrame(state.currentFrame);
                e = e.error;
            }
            throw e.unwindException || e;
        }
    },

    visitMemberExpression: function(node, state) {
        this.accept(node.object, state);
        var object = state.result,
            property;
        if ((node.property.type == 'Identifier') && !node.computed)
            property = node.property.name;
        else {
            this.accept(node.property, state);
            property = state.result;
        }
        var getter = object != null ? object.__lookupGetter__(property) : false;
        if (getter) {
            state.result = this.invoke(object, getter, [], state.currentFrame, false/*isNew*/)
        } else {
            state.result = object[property];
        }
    },

    visitSwitchCase: function(node, state) {
        var frame = state.currentFrame;
        for (var i = 0; i < node.consequent.length; i++) {
            this.accept(node.consequent[i], state);
            if (frame.returnTriggered || frame.breakTriggered || frame.continueTriggered)
                return;
        }
    },

    visitIdentifier: function(node, state) {
        state.result = state.currentFrame.lookup(node.name);
    },

    visitLiteral: function(node, state) {
        state.result = node.value;
        return;
    }

});

Object.subclass('lively.ast.AcornInterpreter.Function',
'settings', {
    isInterpretableFunction: true
},
'initialization', {
    initialize: function(node, scope, optFunc) {
        this.lexicalScope = scope;
        this.node = node;
        this.source = undefined;

        if (!optFunc && node.type == 'FunctionExpression' && node.source) {
            // FIXME: make sure that source really is a FunctionExpression (and not the complete source)
            optFunc = eval('(' + node.source + ')'); // multiple brackets don't hurt
        }
        this.prepareFunction(optFunc);
    },

    prepareFunction: function(optFunc) {
        if (this._cachedFunction)
            return this._cachedFunction;

        var self = this,
            forwardFn = function FNAME(/*args*/) {
                return self.apply(this, Array.from(arguments));
            },
            forwardSrc = forwardFn.toStringRewritten ? forwardFn.toStringRewritten() : forwardFn.toString();
        var fn = Object.extend(
            // FIXME: this seems to be the only way to get the name attribute right
            eval('(' + forwardSrc.replace('FNAME', this.name() || '') + ')'), {
            isInterpretableFunction: true,
            forInterpretation: function() { return fn; },
            ast: function() { return self.node; },
            setParentFrame: function(frame) { self.parentFrame = frame; },
            startHalted: function(interpreter) {
                interpreter.haltAtNextStatement();
                return function(/*args*/) { return self.apply(this, Array.from(arguments), interpreter); }
            },
            // TODO: reactivate when necessary
            // evaluatedSource: function() { return ...; },
            // custom Lively stuff
            methodName: (optFunc && optFunc.methodName) || this.name(),
            declaredClass: (optFunc && optFunc.declaredClass),
            sourceModule: (optFunc && optFunc.sourceModule),
            argumentNames: function() {
                return self.argNames();
            },
            toString: function() {
                return self.getSource();
            }
        });
        if (fn.methodName && fn.declaredClass)
            fn.displayName = fn.declaredClass + '$' + fn.methodName;
        else if (optFunc && optFunc.displayName)
            fn.displayName = optFunc.displayName;

        if (optFunc) {
            fn.prototype = optFunc.prototype;
            this.source = optFunc.toString();
            // TODO: prepare more stuff from optFunc
        }
        this._cachedFunction = fn;
    },
},
'accessing', {

    argNames: function() {
        return this.node.params.map(function(param) {
            // params are supposed to be of type Identifier
            return param.name;
        });
    },

    name: function() {
        return this.node.id ? this.node.id.name : undefined;
    },

    getAst: function() {
        return this.node;
    },

    isFunction: function() {
        var astType = this.getAst().type;
        return astType == 'FunctionExpression' || astType == 'FunctionDeclaration';
    },

    getSource: function() {
        var source = this.source || this.getAst().source;
        if (source) return source;

        var ast = this.getAst();
        if (ast._parentEntry != null) {
            source = __getClosure(ast.sourceFile || "[runtime]", ast._parentEntry).source;
        }
        if (!source && ast.sourceFile) {
            source = new WebResource(URL.root.withFilename(ast.sourceFile)).get().content;
        }
        if (source)
            return source.substring(ast.start, ast.end);

        return escodegen.generate(this.getAst());
    }

},
'interpretation', {
    apply: function(thisObj, argValues, interpreter) {
        var // mapping = Object.extend({}, this.getVarMapping()),
            argNames = this.argNames();
        // work-around for $super
        // if (mapping['$super'] && argNames[0] == '$super')
        //     argValues.unshift(mapping['$super']);

        var parentFrame = this.parentFrame ? this.parentFrame : lively.ast.AcornInterpreter.Frame.global(),
            frame = parentFrame.newFrame(this, this.lexicalScope);
        // FIXME: add mapping to the new frame.getScope()
        if (thisObj !== undefined)
            frame.setThis(thisObj);
        frame.setArguments(argValues);
        // TODO: reactivate when necessary
        // frame.setCaller(lively.ast.Interpreter.Frame.top);
        return this.basicApply(frame, interpreter);
    },

    basicApply: function(frame, interpreter) {
        interpreter = interpreter || new lively.ast.AcornInterpreter.Interpreter();
        try {
            // TODO: reactivate?!
            // lively.ast.AcornInterpreter.Frame.top = frame;
            // important: lively.ast.Interpreter.Frame.top is only valid
            // during the native VM-execution time. When the execution
            // of the interpreter is stopped, there is no top frame anymore.
            return interpreter.runWithFrame(this.node, frame);
        } catch (ex) {
            if (lively.Config.get('loadRewrittenCode') && ex.unwindException)
                ex = ex.unwindException;
            if (ex.isUnwindException && !frame.getPC()) {
                var pc = acorn.walk.findNodeByAstIndex(frame.getOriginalAst(), ex.error.astIndex);
                frame.setPC(pc);
                ex.shiftFrame(frame);
            }
            throw ex;
        }
    },

    asFunction: function() {
        return this.prepareFunction() && this._cachedFunction;
    }

},
'continued interpretation', {

    resume: function(frame) {
        return this.basicApply(frame);
    }

},
'meta programming', {

    browse: function(thisObject) {
        var fn = this.asFunction();
        if (fn.sourceModule && fn.methodName && fn.declaredClass) {
            $world.browseCode(fn.declaredClass, fn.methodName, fn.sourceModule.name());
        } else if (thisObject && lively.Class.isClass(thisObject) && fn.displayName) {
            $world.browseCode(thisObject.name, fn.displayName, (fn.sourceModule || thisObject.sourceModule).name());
        } else if (thisObject && thisObject.isMorph && this.node.type != 'Program') {
            $world.openObjectEditorFor(thisObject, function(ed) {
                ed.targetMorph.get('ObjectEditorScriptList').setSelection(fn.methodName || this.name());
            });
        } else
            //TODO: Add browse implementation for other functions
            throw new Error('Cannot browse anonymous function ' + this);
    }

});

Object.subclass('lively.ast.AcornInterpreter.Scope',
'initialization', {

    initialize: function(mapping, parentScope) {
        this.mapping     = mapping || {};
        this.parentScope = parentScope || null;
    },

	copy: function() {
        return new this.constructor(
            Object.extend({}, this.mapping),
            this.parentScope ? this.parentScope.copy() : null
        );
	}

},
'accessing', {

    getMapping: function() { return this.mapping; },

    setMapping: function(mapping) { this.mapping = mapping ; },

    getParentScope: function() { return this.parentScope; },

    setParentScope: function(parentScope) { this.parentScope = parentScope; }

},
'accessing - mapping', {

    has: function(name) { return this.mapping.hasOwnProperty(name); },

    get: function(name) { return this.mapping[name]; },

    set: function(name, value) { return this.mapping[name] = value; },

    addToMapping: function(name) {
        return this.has(name) ? this.get(name) : this.set(name, undefined);
    },

    findScope: function(name, isSet) {
        if (this.has(name)) {
            return { val: this.get(name), scope: this };
        }
        if (this.getMapping() === Global) { // reached global scope
            if (!isSet)
                throw new ReferenceError(name + ' is not defined');
            else
                return { val: undefined, scope: this };
        }
        // TODO: what is this doing?
        // lookup in my current function
        // if (!this.func) return null;
        // var mapping = this.func.getVarMapping();
        // if (mapping) {
        //     var val = mapping[name];
        //     if (val)
        //         return { val: val, frame: this };
        // }
        var parentScope = this.getParentScope();
        if (!parentScope)
            throw new ReferenceError(name + ' is not defined');
        return parentScope.findScope(name, isSet);
    }

});

Object.extend(lively.ast.AcornInterpreter.Scope, {

    recreateFromFrameState: function(frameState) {
        var scope, topScope, newScope;
        // frameState: [0], alreadyComputed, [1] = varMapping, [2] = parentFrameState
        do {
            newScope = new lively.ast.AcornInterpreter.Scope(frameState == Global ? Global : frameState[1]);
            if (scope)
                scope.setParentScope(newScope);
            else
                topScope = newScope;
            scope = newScope
            frameState = frameState == Global ? null : frameState[2];
        } while (frameState);
        return topScope;
    }

});

Object.extend(lively.ast.AcornInterpreter.Interpreter, {

    stripInterpreterFrames: function(topFrame) {
        var allFrames = [topFrame];
        while (allFrames.last().getParentFrame())
            allFrames.push(allFrames.last().getParentFrame());
        allFrames = allFrames.select(function(frame) {
            return !frame.isInternal();
        });
        allFrames.push(undefined);
        allFrames.reduce(function(frame, parentFrame) {
            frame.setParentFrame(parentFrame);
            return parentFrame;
        });
        return allFrames[0];
    }

})

Object.subclass('lively.ast.AcornInterpreter.Frame',
'initialization', {

    initialize: function(func, scope) {
        this.func              = func;      // Function object
        this.scope             = scope;     // lexical scope
        this.returnTriggered   = false;
        this.breakTriggered    = null;      // null, true or string (labeled break)
        this.continueTriggered = null;      // null, true or string (labeled continue)
        this.parentFrame       = null;
        this.pc                = null;      // program counter, actually an AST node
        this.pcStatement       = null;      // statement node of the pc
        this.alreadyComputed   = {};        // maps astIndex to values. Filled
                                            // when we unwind from captured state
    },

    newFrame: function(func, scope, mapping) {
        mapping = mapping || {};
        var newScope = new lively.ast.AcornInterpreter.Scope(mapping, scope); // create new scope
        var newFrame = new lively.ast.AcornInterpreter.Frame(func, newScope);
        newFrame.setParentFrame(this);
        return newFrame;
    },

    newScope: function(mapping) { return new lively.ast.AcornInterpreter.Scope(mapping, this.scope); },

	copy: function() {
	    var scope = this.scope.copy();
	    var func = new lively.ast.AcornInterpreter.Function(this.func.node, scope);
        var copy = new this.constructor(func, scope);
        copy.returnTriggered = this.returnTriggered;
        copy.breakTriggered = this.breakTriggered;
        copy.continueTriggered = this.continueTriggered;
        var parentFrame = this.getParentFrame();
        if (parentFrame) copy.setParentFrame(parentFrame.copy());
        copy.pc = this.pc;
        copy.pcStatement = this.pcStatement;
        copy.alreadyComputed = Object.extend({}, this.alreadyComputed);
        return copy;
	},

    reset: function() {
        try {
            var args = this.getArguments();
        } catch (e) { /* might throw ReferenceError */ }
        this.scope             = new lively.ast.AcornInterpreter.Scope(null, this.scope.getParentScope());
        this.returnTriggered   = false;
        this.breakTriggered    = null;      // null, true or string (labeled break)
        this.continueTriggered = null;      // null, true or string (labeled continue)
        this.pc                = null;      // program counter, actually an AST node
        this.pcStatement       = null;      // statement node of the pc
        this.alreadyComputed   = {};        // maps astIndex to values. Filled
                                            // when we unwind from captured state
        if (args != undefined) this.setArguments(args);
    }

},
'accessing', {

    setScope: function(scope) { return this.scope = scope; },

    getScope: function() { return this.scope; },

    setParentFrame: function(frame) { return this.parentFrame = frame; },

    getParentFrame: function() { return this.parentFrame; },

    getOriginalAst: function() { return this.func.getAst(); },

},
'accessing - mapping', {

    lookup: function(name) {
        if (name === 'undefined') return undefined;
        if (name === 'NaN') return NaN;
        if (name === 'arguments')
            return this.scope.has(name) ? this.scope.get(name) : this.getArguments();
        var result = this.scope.findScope(name);
        if (result) return result.val;
        return undefined;
    },

    setArguments: function(argValues) {
        var argNames = this.func.argNames();
        argNames.forEach(function(arg, idx) {
            this.scope.set(arg, argValues[idx]);
        }, this);
        return this.arguments = argValues;
    },

    getArguments: function() {
        if (this.scope && this.scope.getMapping() != Global && this.func.isFunction())
            return this.arguments;
        throw new ReferenceError('arguments is not defined');
    },

    setThis: function(thisObj) { return this.thisObj = thisObj; },

    getThis: function() { return this.thisObj ? this.thisObj : Global; }

},
'control-flow', {

    triggerReturn: function() { this.returnTriggered = true; },

    triggerBreak: function(label) { this.breakTriggered = label ? label : true; },

    stopBreak: function(label) {
        if (label === undefined) label = true;
        if (this.breakTriggered === label)
            this.breakTriggered = null;
    },

    triggerContinue: function(label) { this.continueTriggered = label ? label : true; },

    stopContinue: function(label) {
        if (label === undefined) label = true;
        if (this.continueTriggered === label)
            this.continueTriggered = false;
    }

},
'resuming', {

    setAlreadyComputed: function(mapping) {
        // mapping == {astIndex: value}
        return this.alreadyComputed = mapping;
    },

    isAlreadyComputed: function(nodeOrAstIndex) {
        var astIndex = typeof nodeOrAstIndex === "number" ?
            nodeOrAstIndex : nodeOrAstIndex.astIndex;
        return this.alreadyComputed.hasOwnProperty(astIndex);
    },

    setPC: function(node) {
        if (!node) {
            this.pcStatement = null;
            return this.pc = null;
        } else {
            var ast = this.getOriginalAst();
            this.pcStatement = acorn.walk.findStatementOfNode(ast, node) || ast;
            return this.pc = node;
        }
    },

    getPC: function(node) { return this.pc; },

    isResuming: function() { return this.pc !== null; },

    resumesAt: function(node) { return node === this.pc; },

    resumesNow: function() { this.setPC(null); },

    resumeHasReachedPCStatement: function() {
        // For now: Just remove the pcStatement attribute to signal that
        // resuming reached it
        return this.pcStatement == null;
    },

    resumeReachedPCStatement: function() { this.pcStatement = null; },

    isPCStatement: function(node) {
        return this.pcStatement
            && (node === this.pcStatement
             || node.astIndex === this.pcStatement.astIndex);
    }

},
'testing', {

    isInternal: function() {
        if (!this._internalModules) {
            var internalModules = [
                lively.ast.AcornInterpreter
            ];
            this._internalModules = internalModules.map(function(m) {
                return new URL(m.uri()).relativePathFrom(URL.root);
            });
        }
        return this._internalModules.include(this.getOriginalAst().sourceFile);
    }

});

Object.extend(lively.ast.AcornInterpreter.Frame, {
    create: function(func, mapping) {
        var scope = new lively.ast.AcornInterpreter.Scope(mapping);
        return new lively.ast.AcornInterpreter.Frame(func, scope);
    },

    global: function() {
        return this.create(null, Global);
    }
});

}); // end of module
