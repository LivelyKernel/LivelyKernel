/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
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

module('lively.ast.Interpreter').requires('lively.ast.generated.Nodes', 'lively.ast.Parser').toRun(function() {

Object.subclass('lively.ast.Interpreter.Frame',
'initialization', {
    initialize: function(mapping) {
        this.mapping = mapping || {};
        this.returnTriggered = false;
        this.breakTriggered = false;
        this.continueTriggered = false;
        this.findSetterMode = false;
        this.breakAtCalls = false;
        this.pc = null; // "program counter", actually an AST node
        this.bp = null; // "break point", actually an AST node
        this.values = {}; // stores the results of computed expressions and statements
    },
    newScope: function(mapping) {
        var newFrame = new this.constructor(mapping);
        newFrame.setContainingScope(this);
        return newFrame;
    },
    breakAtFirstStatement: function() {
        this.bp = this.getFuncAst().firstStatement();
    },
},
'accessing', {
    setContainingScope: function(frame) {
        return this.containingScope = frame;
    },
    getContainingScope: function() {
        return this.containingScope;
    },
    getCaller: function() {
        return this.caller;
    },
    setCaller: function(caller) {
        if (caller.breakAtCalls) {
            this.breakAtFirstStatement();
        }
        if (caller.func) {
            this.caller = caller;
            caller.callee = this;
        }
    },
    setThis: function(thisObj) {
        this.addToMapping('this', thisObj);
        return this.thisObj = thisObj;
    },
    getThis: function() {
        // return this.lookup('this')
        return this.thisObj !== undefined ?
            this.thisObj : (this.containingScope && this.containingScope.getThis());
    },
    setArguments: function(argValues) {
        var argNames = this.getFuncAst().argNames();
        for (var i = 0; i < argNames.length; i++)
            this.addToMapping(argNames[i], argValues[i]);
        return this.arguments = argValues;
    },


    getArguments: function(args) {
        return this.arguments;
    },
    getFunc: function() {
        return this.func
    },
    setFunc: function(func) {
        this.funcAst = null;
        this.func = func;
    },
    getFuncAst: function() {
        if (!this.funcAst) {
            if (!this.func) throw new Error('Frame has no function to create AST!');
            if (!this.funcAst) this.funcAst = this.func.ast();
        }
        return this.funcAst;
    },
    setFuncAst: function(funcAst) {
        this.funcAst = funcAst;
        this.func = funcAst.getRealFunction();
    },
    getFuncName: function() {
        if (!this.getFunc()) {
            return 'frame has no function!';
        }
        if (this.getFunc().name)
            return this.getFunc().name;
        if (this.getFunc().declaredClass)
            return this.getFunc().declaredClass + ">>" + this.getFunc().methodName;
        if (this.funcAst && this.funcAst._parent && this.funcAst._parent.isVarDeclaration)
            return this.funcAst._parent.name;
        return 'anonymous';
    },
    getFuncSource: function() {
        // get the top-most 'real function'
        var current = this.funcAst;
        var realFunc = this.getFunc(); // fallback: this function
        while (current) {
            if (current.realFunction) realFunc = current.realFunction;
            current = current._parent;
        }
        return String(realFunc);
    },
    findFrame: function(name) {
        if (this.mapping.hasOwnProperty(name)) return {
            val: this.mapping[name],
            frame: this
        };
        // lookup in my current function
        var func = this.getFunc(),
            val = func && func.hasLivelyClosure && func.livelyClosure.lookup(name);
        if (val !== undefined) return {
            val: val,
            frame: this
        };
        var containingScope = this.getContainingScope();
        return containingScope ? containingScope.findFrame(name) : null;
    },
    lookup: function(name) {
        if (name === 'undefined') return undefined;
        if (name === 'null') return null;
        if (name === 'true') return true;
        if (name === 'false') return false;
        if (name === 'NaN') return NaN;
        if (name === 'arguments') return this.getArguments();
        var frame = this.findFrame(name);
        if (frame) return frame.val;
        return undefined;
    },
    addToMapping: function(name, value) {
        return this.mapping[name] = value;
    },
    addAllToMapping: function(otherMapping) {
        for (var name in otherMapping) {
            if (!otherMapping.hasOwnProperty(name)) continue;
            this.mapping[name] = otherMapping[name];
        }
    },
    triggerReturn: function() {
        this.returnTriggered = true
    },
    triggerBreak: function() {
        this.breakTriggered = true
    },
    stopBreak: function() {
        this.breakTriggered = false
    },
    triggerContinue: function() {
        this.continueTriggered = true
    },
    stopContinue: function() {
        this.continueTriggered = false
    },
},
'accessing for UI', {
    listItemsForIntrospection: function() {
        var items = [];
        Properties.forEachOwn(this.mapping, function(name, value) {
            items.push({
                isListItem: true,
                string: name + ': ' + String(value).truncate(50),
                value: value
            })
        });
        return items;
    },
},
'program counter', {
    halt: function() {
        this.unbreak();
        throw {
            isUnwindException: true,
            topFrame: this,
            toString: function() {return "Debugger"}
        };
    },
    haltAtNextStatement: function(breakAtCalls) {
        if (this.pc === this.getFuncAst()) {
            var caller = this.getCaller();
            if (caller && caller.isResuming()) {
                caller.haltAtNextStatement();
            }
        } else {
            var nextStmt = this.pc.nextStatement();
            this.bp = nextStmt ? nextStmt : this.getFuncAst();
        }
    },
    stepToNextStatement: function(breakAtCalls) {
        this.haltAtNextStatement();
        return this.resume(breakAtCalls);
    },
    hasNextStatement: function() {
        return this.pc.nextStatement() != null;
    },
    restart: function() {
        this.initialize(this.mapping);
        this.breakAtFirstStatement();
        this.resume();
    }
},
'resuming', {
    isResuming: function() {
        return this.pc !== null || this.bp !== null
    },
    resumesNow: function() {
        this.pc = null
    },
    isBreakingAt: function(node) {
        if (this.bp === null) return false;
        if (this.bp === node) return true;
        return node.isAfter(this.bp);
    },
    setPC: function(node) {
        this.pc = node.isFunction ? node : node.firstStatement();
        if (this.isBreakingAt(node)) this.halt();
    },
    getValue: function(node) {
        var value = this.values[node.position()];
        // if no value was cached, set PC and compute normally
        return value ? value : this.setPC(node);
    },
    putValue: function(node, value) {
        return this.values[node.position()] = {
            val: value
        };
    },
    removeValue: function(node) {
        var that = this;
        node.withAllChildNodesDo(function(child){
            delete that.values[child.position()];
            return true;
        });
    },
    resume: function(breakAtCalls) {
        this.breakAtCalls = breakAtCalls ? true : false;
        var result = this.getFuncAst().resume(this);
        if (this.getCaller() && this.getCaller().isResuming()) {
            this.getCaller().putValue(this.getCaller().pc, result);
        }
        // break right after the last statement
        this.setPC(this.getFuncAst());
        if (this.getCaller() && this.getCaller().isResuming()) {
            return this.getCaller().resume(breakAtCalls);
        }
        return result;
    },
    unbreak: function() {
            // remove all previous breakpoints in this and caller frames
        this.bp = null;
        if (this.getCaller()) {
            this.getCaller().unbreak();
        }
    }
},
'printing', {
    highlightSourceText: function(text) {
        text.setTextString(this.getFuncSource());
        text.highlightJavaScriptSyntax();
        if (this.pc !== null) {
            var style = { backgroundColor: Color.rgb(255, 230, 200) };
            text.emphasize(style, this.pc.pos[0], this.pc.pos[1]);
        }
    },
},
'debugging', {
    toString: function() {
        var mappings = [];
        for (var name in this.mapping) {
            if (this.mapping.hasOwnProperty(name)) {
                mappings.push(name + ': ' + this.mapping[name]);
            }
        }
        var mappingString = '{' + mappings.join(',') + '}';
        return 'Frame(' + mappingString + ')';
    },
});

Object.extend(lively.ast.Interpreter.Frame, {
    create: function(mapping) {
        return new lively.ast.Interpreter.Frame(mapping || {});
    },
    global: function() {
        return this.create(Global);
    },
    fromTraceNode: function(trace) {
        var frame;
        if (trace.frame) {
            frame = trace.frame;
        } else {
            var frame = lively.ast.Interpreter.Frame.create();
            frame.setFuncAst(trace.method.ast());
            frame.setThis(trace.itsThis);
            frame.setArguments(trace.args);
        }
        if (trace.caller && !trace.caller.isRoot) {
            frame.setCaller(lively.ast.Interpreter.Frame.fromTraceNode(trace.caller));
        }
        return frame;
    }
});

Object.extend(Function.prototype, {
    forInterpretation: function(optMapping) {
        var func = this.ast();
        func.lexicalScope = lively.ast.Interpreter.Frame.create(optMapping || Global);
        func.prototype = this.prototype;
        return func;
    },
});

lively.ast.Visitor.subclass('lively.ast.InterpreterVisitor', 'interface', {
    run: function(node, optMapping) {
        return this.runWithFrame(node, lively.ast.Interpreter.Frame.create(optMapping));
    },
    runWithFrame: function(node, frame) {
        this.setRootFrame(frame);
        return this.visit(node);
    },
},
'frame management', {
    setRootFrame: function(frame) {
        this.rootFrame = frame;
        this.currentFrame = frame;
    },
},
'invoking', {
    invoke: function(node, recv, func, argValues) {
        var frame = this.currentFrame,
            newCall = node._parent && node._parent.isNew;
        var caller = lively.ast.FunctionCaller.defaultInstance;
        frame.setPC(node);
        return caller.activate(frame, newCall, func, node.name, recv, argValues);
    },
},
'visiting', {
    visitSequence: function(node) {
        var result, frame = this.currentFrame;
        for (var i = 0; i < node.children.length; i++) {
            result = this.visit(node.children[i]);
            if (frame.returnTriggered || frame.breakTriggered || frame.continueTriggered) {
                return result;
            }
        }
        return result;
    },
    visitNumber: function(node) {
        return node.value;
    },
    visitString: function(node) {
        return node.value;
    },
    visitCond: function(node) {
        var frame = this.currentFrame,
            condVal = this.visit(node.condExpr);
        return condVal ? this.visit(node.trueExpr) : this.visit(node.falseExpr);
    },
    visitIf: function(node) {
        return this.visitCond(node);
    },
    visitWhile: function(node) {
        var result, frame = this.currentFrame;
        while (this.visit(node.condExpr)) {
            result = this.visit(node.body);
            if (frame.continueTriggered) {
                frame.stopContinue()
            };
            if (frame.breakTriggered) {
                frame.stopBreak();
                break
            };
            if (frame.returnTriggered) {
                return result
            };
            frame.removeValue(node.condExpr);
            frame.removeValue(node.body);
        }
        return result;
    },
    visitDoWhile: function(node) {
        var frame = this.currentFrame, result;
        do {
            frame.removeValue(node.condExpr);
            result = this.visit(node.body);
            if (frame.continueTriggered) {
                frame.stopContinue()
            };
            if (frame.breakTriggered) {
                frame.stopBreak();
                break
            };
            if (frame.returnTriggered) {
                return result
            };
            var condResult = this.visit(node.condExpr);
            frame.removeValue(node.body);
        } while (condResult);
        return result;
    },
    visitFor: function(node) {
        var frame = this.currentFrame, result;
        this.visit(node.init);
        while (this.visit(node.condExpr)) {
            result = this.visit(node.body);
            if (frame.continueTriggered) {
                frame.stopContinue()
            };
            if (frame.breakTriggered) {
                frame.stopBreak();
                break
            };
            if (frame.returnTriggered) {
                return result
            };
            this.visit(node.upd);
            frame.removeValue(node.condExpr);
            frame.removeValue(node.body);
            frame.removeValue(node.upd);
        }
        return result;
    },
    visitForIn: function(node) {
        var frame = this.currentFrame,
            varPart = node.name,
            obj = this.visit(node.obj),
            result;
        if (varPart.isVarDeclaration) {
          varPart.val.name = varPart.name;
        }
        for (var name in obj) {
            frame.addToMapping(varPart.name, name);
            result = this.visit(node.body);
            if (frame.continueTriggered) {
                frame.stopContinue()
            };
            if (frame.breakTriggered) {
                frame.stopBreak();
                break
            };
            if (frame.returnTriggered) {
                return result
            };
            frame.removeValue(node.body);
        }
        return result;
    },
    visitSet: function(node) {
        var frame = this.currentFrame;
        return node.left.set(this.visit(node.right), frame, this);
    },
    visitModifyingSet: function(node) {
        var frame = this.currentFrame,
            op = node.name + '=',
            right = this.visit(node.right),
            oldValue = this.visit(node.left),
            newValue;
        switch (op) {
            case '+=':
              newValue = oldValue + right;
              break;
            case '-=':
              newValue = oldValue - right;
              break;
            case '*=':
              newValue = oldValue * right;
              break;
            case '/=':
              newValue = oldValue / right;
              break;
            case '>>=':
              newValue = oldValue >>= right;
              break;
            case '<<=':
              newValue = oldValue <<= right;
              break;
            case '>>>=':
              newValue = oldValue >>> right;
              break;
            case '&=':
              newValue = oldValue & right;
              break;
            case '|=':
              newValue = oldValue | right;
              break;
            case '&=':
              newValue = oldValue & right;
              break;
            case '^=':
              newValue = oldValue ^ right;
              break;
            case '||=':
              newValue = oldValue || right;
              break; // FIXME lazy evaluation
            case '&&=':
              newValue = oldValue && right;
              break; // FIXME lazy evaluation
            default:
              throw new Error('Modifying set has unknown operation ' + op);
        }
        return node.left.set(newValue, frame, this);
    },
    visitBinaryOp: function(node) {
        var frame = this.currentFrame;
        switch (node.name) {
            case '||':
              return this.visit(node.left) || this.visit(node.right);
            case '&&':
              return this.visit(node.left) && this.visit(node.right);
        }
        var leftVal = this.visit(node.left),
            rightVal = this.visit(node.right);
        switch (node.name) {
            case '+':
              return leftVal + rightVal;
            case '-':
              return leftVal - rightVal;
            case '*':
              return leftVal * rightVal;
            case '/':
              return leftVal / rightVal;
            case '%':
              return leftVal % rightVal;
            case '<':
              return leftVal < rightVal;
            case '<=':
              return leftVal <= rightVal;
            case '>':
              return leftVal > rightVal;
            case '>=':
              return leftVal >= rightVal;
            case '==':
              return leftVal == rightVal;
            case '===':
              return leftVal === rightVal;
            case '!=':
              return leftVal != rightVal;
            case '!==':
              return leftVal !== rightVal;
            case '&':
              return leftVal & rightVal;
            case '|':
              return leftVal | rightVal;
            case '^':
              return leftVal ^ rightVal;
            case '>>':
              return leftVal >> rightVal;
            case '<<':
              return leftVal << rightVal;
            case '>>>':
              return leftVal >>> rightVal;
            case 'in':
              return leftVal in rightVal;
            case 'instanceof':
              return leftVal instanceof (rightVal.isFunction ?
                                         rightVal.prototype.constructor : rightVal);
            default:
              throw new Error('No semantics for binary op ' + node.name)
        }
    },
    visitUnaryOp: function(node) {
        var frame = this.currentFrame,
            val = this.visit(node.expr);
        switch (node.name) {
            case '-':
              return -val;
            case '!':
              return !val;
            case '~':
              return~val;
            case 'typeof':
              return typeof val;
            default:
              throw new Error('No semantics for unary op ' + node.name)
        }
    },
    visitPreOp: function(node) {
        var frame = this.currentFrame,
            setExpr = node.expr;
        if (!setExpr.isVariable && !setExpr.isGetSlot) {
            throw new Error('Invalid expr in pre op ' + setExpr);
        }
        var value = this.visit(setExpr),
            newValue;
        switch (node.name) {
            case '++':
              newValue = value + 1;
              break;
            case '--':
              newValue = value - 1;
              break;
            default:
              throw new Error('No semantics for pre op ' + node.name)
        }
        setExpr.set(newValue, frame, this);
        return newValue;
    },
    visitPostOp: function(node) {
        var frame = this.currentFrame,
            setExpr = node.expr;
        if (!setExpr.isVariable && !setExpr.isGetSlot) {
            throw dbgOn(new Error('Invalid expr in post op ' + setExpr));
        }
        var value = this.visit(setExpr), newValue;
        switch (node.name) {
            case '++':
              newValue = value + 1;
              break;
            case '--':
              newValue = value - 1;
              break;
            default:
              throw new Error('No semantics for post op ' + node.name)
        }
        setExpr.set(newValue, frame, this);
        return value;
    },
    visitThis: function(node) {
        return this.currentFrame.getThis();
    },
    visitVariable: function(node) {
        return this.currentFrame.lookup(node.name);
    },
    visitGetSlot: function(node) {
        var obj = this.visit(node.obj),
        name = this.visit(node.slotName),
        value = obj[name];
        return value;
    },
    visitBreak: function(node) {
        this.currentFrame.triggerBreak();
    },
    visitContinue: function(node) {
        this.currentFrame.triggerContinue();
    },
    visitArrayLiteral: function(node) {
        var result = new Array(node.elements.length);
        for (var i = 0; i < node.elements.length; i++)
            result[i] = this.visit(node.elements[i]);
        return result;
    },
    visitReturn: function(node) {
        var frame = this.currentFrame,
        val = this.visit(node.expr);
        frame.triggerReturn();
        return val;
    },
    visitWith: function(node) {
        throw new Error('with statement not yet supported');
    },
    visitSend: function(node) {
        var recv = this.visit(node.recv),
        property = this.visit(node.property),
        argValues = node.args.collect(function(ea) { return this.visit(ea) }, this);
        return this.invoke(node, recv, recv[property], argValues);
    },
    visitCall: function(node) {
        var func = this.visit(node.fn),
            recv = func.isFunction ? func.lexicalScope.getThis() : Global,
            argValues = node.args.collect(function(ea) { return this.visit(ea) }, this);
        return this.invoke(node, recv, func, argValues);
    },
    visitNew: function(node) {
        // No need to do anything because Send and Call
        // will look up _parent for New
        return this.visit(node.clsExpr);
    },
    visitVarDeclaration: function(node) {
        var frame = this.currentFrame,
        val = this.visit(node.val);
        frame.addToMapping(node.name, val);
        return val;
    },
    visitThrow: function(node) {
        var frame = this.currentFrame,
        exceptionObj = this.visit(node.expr);
        throw exceptionObj;
    },
    visitTryCatchFinally: function(node) {
        var frame = this.currentFrame,
            result;
        try {
            result = this.visit(node.trySeq);
        } catch(e) {
            frame.addToMapping(node.err.name, e);
            result = this.visit(node.catchSeq);
        } finally {
            if (node.finallySeq.isVariable && node.finallySeq.name == 'undefined') {
                // do nothing, no finally block
            } else {
                result = this.visit(node.finallySeq);
            }
        }
        return result
    },
    visitFunction: function(node) {
        var frame = this.currentFrame;
        if (node.name) frame.addToMapping(node.name, node);
        if (!node.prototype) node.prototype = {};
        node.lexicalScope = frame;
        return node.asFunction();
    },
    visitObjectLiteral: function(node) {
        var frame = this.currentFrame,
            obj = {};
        for (var i = 0; i < node.properties.length; i++) {
            var name = node.properties[i].name,
            prop = this.visit(node.properties[i].property);
            obj[name] = prop;
        }
        return obj;
    },
    visitObjProperty: function(node) {
        throw new Error('?????');
    },
    visitSwitch: function(node) {
        var frame = this.currentFrame,
            val = this.visit(node.expr),
            caseMatched = false,
            result;
        for (var i = 0; i < node.cases.length; i++) {
            node.cases[i].prevCaseMatched = caseMatched;
            node.cases[i].switchValue = val;
            result = this.visit(node.cases[i]);
            caseMatched = result !== undefined; // FIXME what when case returns undefined?
            if (frame.breakTriggered) {
                frame.stopBreak();
                break
            };
        }
        return result;
    },
    visitCase: function(node) {
        return node.prevCaseMatched || node.switchValue == this.visit(node.condExpr) ?
            this.visit(node.thenExpr) : undefined;
    },
    visitDefault: function(node) {
        return node.prevCaseMatched ? undefined : this.visit(node.defaultExpr);
    },
    visitRegex: function(node) {
        return new RegExp(node.exprString, node.flags);
    },

});

lively.ast.InterpreterVisitor.subclass('lively.ast.ResumingInterpreterVisitor',
'visiting', {
    visit: function($super, node) {
        var value = this.currentFrame.getValue(node);
        if (!value) {
            value = this.currentFrame.putValue(node, $super(node));
        }
        return value.val;
    },
    visitDebugger: function($super, node) {
        this.currentFrame.putValue(node, 1); // mark this 'debugger' as visited
        this.currentFrame.halt(node, true);
        return $super(node);
    },
});

Object.extend(lively.ast, {
    getInterpreter: function() {
        return new lively.ast.ResumingInterpreterVisitor();
    },
});

Object.subclass('lively.ast.FunctionCaller', 'documentation', {
    documentation: 'strategy for invoking functions',
},
'initializiation', {
    initialize: function() {
        this.logEnabled = false;
        this.resetLog();
    },
},
'interpretation', {
    shouldInterpret: function(frame, func) {
        if (this.isNative(func))
            return false;
        return func.hasOwnProperty("forInterpretation") ||
                frame.breakAtCalls ||
                func.containsDebugger();
    },
    activate: function(frame, isNewCall, func, funcName, recv, argValues) {
        // if we send apply to a function (recv) we want to interpret it
        // although apply is a native function
        if (recv && (Object.isFunction(recv) || recv.isFunction) && funcName == 'apply') {
            if (!recv.isFunction) recv = recv.forInterpretation(Global);
            func = recv; // The function object is what we want to run
            recv = argValues.shift(); // thisObj is first parameter
            argValues = argValues[0]; // the second arg are the arguments (as an array)
        }

        if (this.shouldInterpret(frame, func)) {
            func = func.forInterpretation(Global);
        }

        if (!func || !func.apply) this.lookupError(recv, funcName)

        try {
            if (!this.logEnabled) {
                return isNewCall ?
                    this.doNew(frame, func, argValues) : func.apply(recv, argValues, frame);
            }
            return this.doLog(
                function() { return isNewCall ? this.doNew(frame, func, argValues) : func.apply(recv, argValues, frame); },
                funcName, recv, argValues, frame)
        } catch(e) {
            throw e
        }
    },

    doNew: function(frame, func, args) {
        var proto = func.prototype,
            constructor = function() {};
        constructor.prototype = proto;
        var newObj = new constructor();
        func.apply(newObj, args, frame); // call with new object
        return newObj;
    },

    lookupError: function(recv, slotName) {
        debugger
        var msg = Strings.format('Send error: recevier %s does not understand %s', recv, slotName);
        throw new Error(msg);
    },

    isNative: function(func) {
        if (func.isFunction) return false; // ast node
        if (!this._nativeFuncRegex) this._nativeFuncRegex = /\{\s+\[native\scode\]\s+\}$/;
        return this._nativeFuncRegex.test(func.toString())
    },
    isSpecial: function(func, funcName) {
        var realName = func.isFunction ? func.getRealFunction().name : func.name;
        return realName == 'wrapped';
    },
},
'logging', {
    log: function(msg) {
        this.logMsgs.push(this.logIndent + msg);
    },
    doLog: function(callback, funcName, recv, args, interpreter) {
        function shorten(obj) {
            return String(obj).replace(/\n/g, '').truncate(20)
        }
        try {
            // this.log( shorten(recv) + '>>' + funcName + '(' + args.collect(function(ea) { return shorten(ea) }).join(',') + ')')
            this.log(funcName)
        } catch(e) {
            this.log('Cannot log ' + funcName + ' because ' + e)
        }
        this.increaseLogIndent()
        var result = callback.call(this)
        this.decreaseLogIndent()
        return result
    },
    loggingOnOrOff: function(state) {
        this.logEnabled = state
    },
    increaseLogIndent: function(msg) {
        this.logIndent += '  '
    },
    decreaseLogIndent: function(msg) {
        this.logIndent = this.logIndent.slice(2)
    },
    resetLog: function() {
        this.logIndent = '',
        this.logMsgs = []
    },
    getLog: function() {
        return this.logMsgs.join('\n')
    },
});

Object.extend(lively.ast.FunctionCaller, {
    defaultInstance: new lively.ast.FunctionCaller(),
});

lively.ast.Node.addMethods('interpretation', {
    position: function() {
        return this.pos[0] + "-" + this.pos[1];
    },
    startInterpretation: function(optMapping) {
        return lively.ast.getInterpreter().run(this, optMapping);
    },
});

lively.ast.Variable.addMethods('interpretation', {
    set: function(value, frame, interpreter) {
        var search = frame.findFrame(this.name),
            scope = search ? search.frame : lively.ast.Interpreter.Frame.global();
        return scope.addToMapping(this.name, value);
    },
});

lively.ast.GetSlot.addMethods('interpretation', {
    set: function(value, frame, interpreter) {
        var obj = interpreter.visit(this.obj),
            name = interpreter.visit(this.slotName);
        return obj[name] = value;
    },
});

lively.ast.Function.addMethods('accessing', {
    getRealFunction: function() {
        if (this.realFunction) return this.realFunction;
        return this.realFunction = this.eval();
    },
},
'interpretation', {
    forInterpretation: function() {
        return this;
    },
    position: function() {
        return[this.pos[1] - 1, this.pos[1]];
    },
    basicApply: function(frame) {
        return lively.ast.getInterpreter().runWithFrame(this.body, frame);
    },
    apply: function(thisObj, argValues, callerFrame) {
        var mapping = Object.extend({}, this.getRealFunction().getVarMapping());
        var argNames = this.argNames();
        if (this.getRealFunction().isWrapper) {
            var vm = this.getRealFunction().getVarMapping();
            if (vm["$super"] && argNames[0] == "$super") {
                argValues.unshift(vm["$super"]);
            }
        }
        for (var i = 0; i < argNames.length; i++)
            mapping[argNames[i]] = argValues[i];
        var newFrame = this.lexicalScope.newScope(mapping);
        newFrame.setThis(thisObj);
        newFrame.setFuncAst(this);
        newFrame.setArguments(argValues);
        if (callerFrame) {
            newFrame.setCaller(callerFrame);
        }
        try {
            if (lively.Tracing && lively.Tracing.getCurrentContext()) {
                lively.Tracing.getCurrentContext().traceCall(this.getRealFunction(),
                                                             thisObj, argValues);
                lively.Tracing.getCurrentContext().frame = newFrame;
            }
            return this.basicApply(newFrame);
        } catch(e) {
            if (!e.simStack && lively.Tracing && lively.Tracing.getCurrentContext()) {
                e.simStack = lively.Tracing.getCurrentContext().copyMe();
            }
            if (!e.isUnwindException) {
                e.isUnwindException = true;
                e.topFrame = newFrame;
            }
            throw e;
        } finally {
            if (lively.Tracing && lively.Tracing.getCurrentContext()) {
                lively.Tracing.getCurrentContext().traceReturn(this.getRealFunction());
            }
        }
    },
    call: function(/*args*/) {
        var args = $A(arguments),
        thisObj = args.shift();
            return this.apply(thisObj, args);
    },
    asFunction: function() {
        var that = this;
        var fn = function(/*args*/) {
            return that.apply(this, $A(arguments));
        };
        fn.forInterpretation = function() { return that; };
        fn.prototype = this.prototype;
        return fn;
    }
},
'continued interpretation', {
    resume: function(frame) {
        return this.basicApply(frame);
    },
},
'stepping', {
    firstStatement: function() {
        return this.body.firstStatement();
    },
    nextStatement: function(node) {
        return null;
    },
    isComposite: function() {
        return true;
    }
});

lively.ast.Visitor.subclass('lively.ast.ContainsDebuggerVisitor', 'visiting', {
    visitSequence: function(node) {
        for (var i = 0; i < node.children.length; i++) {
            if (this.visit(node.children[i])) {
                return true;
            }
        }
        return false;
    },
    visitNumber: function(node) {
        return false;
    },
    visitString: function(node) {
        return false;
    },
    visitCond: function(node) {
        return this.visit(node.condExpr) || this.visit(node.trueExpr) || this.visit(node.falseExpr);
    },
    visitIf: function(node) {
        return this.visitCond(node);
    },
    visitWhile: function(node) {
        return this.visit(node.condExpr) || this.visit(node.body);
    },
    visitDoWhile: function(node) {
        return this.visit(node.body) || this.visit(node.condExpr);
    },
    visitFor: function(node) {
        return this.visit(node.init) || this.visit(node.condExpr) || this.visit(node.body) || this.visit(node.upd);
    },
    visitForIn: function(node) {
        return this.visit(node.obj) || this.visit(node.body);
    },
    visitSet: function(node) {
        return this.visit(node.left) || this.visit(node.right);
    },
    visitModifyingSet: function(node) {
        return this.visit(node.left) || this.visit(node.right);
    },
    visitBinaryOp: function(node) {
        return this.visit(node.left) || this.visit(node.right);
    },
    visitUnaryOp: function(node) {
        return this.visit(node.expr);
    },
    visitPreOp: function(node) {
        return this.visit(node.expr);
    },
    visitPostOp: function(node) {
        return this.visit(node.expr);
    },
    visitThis: function(node) {
        return false;
    },
    visitVariable: function(node) {
        return false;
    },
    visitGetSlot: function(node) {
        return false;
    },
    visitBreak: function(node) {
        return false;
    },
    visitDebugger: function(node) {
        return true;
    },
    visitContinue: function(node) {
        return false;
    },
    visitArrayLiteral: function(node) {
        for (var i = 0; i < node.elements.length; i++) {
            if (this.visit(node.elements[i])) {
                return true;
            }
        }
        return false;
    },
    visitReturn: function(node) {
        return this.visit(node.expr);
    },
    visitWith: function(node) {
        throw new Error('with statement not yet supported');
    },
    visitSend: function(node) {
        if (this.visit(node.recv)) return true;
        for (var i = 0; i < node.args.length; i++) {
            if (this.visit(node.args[i])) {
                return true;
            }
        }
        return false;
    },
    visitCall: function(node) {
        if (this.visit(node.fn)) return true;
        for (var i = 0; i < node.args.length; i++) {
            if (this.visit(node.args[i])) {
                return true;
            }
        }
        return false;
    },
    visitNew: function(node) {
        return this.visit(node.clsExpr);
    },
    visitVarDeclaration: function(node) {
        return this.visit(node.val);
    },
    visitThrow: function(node) {
                 return this.visit(node.expr);
    },
    visitTryCatchFinally: function(node) {
        return this.visit(node.trySeq) || this.visit(node.catchSeq) || this.visit(node.finallySeq);
    },
    visitFunction: function(node) {
        return this.visit(node.body);
    },
    visitObjectLiteral: function(node) {
        for (var i = 0; i < node.properties.length; i++) {
            if (this.visit(node.properties[i].property)) {
                return true;
            }
        }
        return false;
    },
    visitObjProperty: function(node) {
        return false;
    },
    visitSwitch: function(node) {
        if (this.visit(node.expr)) {
            return true;
        }
        for (var i = 0; i < node.cases.length; i++) {
            if (this.visit(node.cases[i])) {
                return true;
            }
        }
        return false;
    },
    visitCase: function(node) {
        return this.visit(node.condExpr) || this.visit(node.thenExpr);
    },
    visitDefault: function(node) {
        return this.visit(node.defaultExpr);
    },
    visitRegex: function(node) {
        return false;
    }
});

Function.addMethods('debugging', {
    containsDebugger: function() {
        return new lively.ast.ContainsDebuggerVisitor().visit(this.ast());
    },
    forDebugging: function(onbreakpoint) {
        var self = this,
            wrapper = (function wrapper() {
                try {
                    var frame = null;
                    if (lively.Tracing && lively.Tracing.getCurrentContext()) {
                        var trace = lively.Tracing.getCurrentContext().caller;
                        frame = lively.ast.Interpreter.Frame.fromTraceNode(trace);
                    }
                    return thisFunc.forInterpretation(Global).apply(this, $A(arguments), frame);
                } catch(e) {
                    if (e.isUnwindException) {
                        BREAKPOINT_CALLBACK(e.topFrame, e.toString());
                    } else {
                        throw e;
                    }
                }
            }).toString();
        if (this.name) wrapper = wrapper.replace("wrapper", this.name);
        wrapper = wrapper.replace("thisFunc", "(" + this.toString() + ")");
        wrapper = wrapper.replace("BREAKPOINT_CALLBACK", onbreakpoint);
        wrapper = Function.fromString(wrapper);
        wrapper.forInterpretation = function(m) {
            return self.forInterpretation(m);
        };
        return wrapper;
    }
});

}) // end of module