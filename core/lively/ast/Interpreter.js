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

module('lively.ast.Interpreter').requires('lively.ast.Parser', 'lively.ast.Meta').toRun(function() {

Object.subclass('lively.ast.Interpreter.Frame',
'initialization', {
    initialize: function(func, mapping) {
        this.func = func;
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
        var newFrame = new lively.ast.Interpreter.Frame(mapping);
        newFrame.setContainingScope(this);
        return newFrame;
    },
    breakAtFirstStatement: function() {
        this.bp = this.func.ast().firstStatement();
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
        if (caller) {
            this.caller = caller;
            caller.callee = this;
            if (caller.breakAtCalls) this.breakAtFirstStatement();
        }
    },
    setThis: function(thisObj) {
        this.addToMapping('this', thisObj);
        return thisObj;
    },
    getThis: function() {
        if (this.mapping["this"]) return this.mapping["this"];
        return Global;
    },
    setArguments: function(argValues) {
        var argNames = this.func.ast().argNames();
        for (var i = 0; i < argNames.length; i++)
            this.addToMapping(argNames[i], argValues[i]);
        return this.arguments = argValues;
    },
    getArguments: function(args) {
        return this.arguments;
    },
    getFuncName: function() {
        if (!this.func) {
            return 'frame has no function!';
        }
        return this.func.getOriginal().qualifiedMethodName();
    },
    getFuncSource: function() {
        if (!this.func) {
            return 'frame has no function!';
        }
        return this.func.getOriginal().evaluatedSource();
    },
    findFrame: function(name) {
        if (this.mapping.hasOwnProperty(name)) {
            return {val: this.mapping[name], frame: this};
        }
        if (this.mapping === Global) { // reached global scope
            throw new ReferenceError(name + " is not defined");
        }
        // lookup in my current function
        var mapping = this.func.getVarMapping();
        if (mapping) {
            var val = mapping[name];
            if (val) return {val: val, frame: this};
        }
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
        if (this.mapping === Global) {
            return items;
        }
        for (var name in this.mapping) {
            if (!this.mapping.hasOwnProperty(name)) continue;
            var value = this.mapping[name];
            items.push({
                isListItem: true,
                string: name + ': ' + String(value).truncate(50),
                value: value
            });
        }
        if (this.containingScope) {
            items.push({isListItem: true, string: '[[containing scope]]'});
            items.pushAll(this.containingScope.listItemsForIntrospection());
        }
        return items;
    },
},
'program counter', {
    halt: function() {
        this.unbreak();
        if (lively.ast.halt(this)) {
            throw {
                isUnwindException: true,
                topFrame: this,
                toString: function() {return "Debugger"}
            };
        }
    },
    haltAtNextStatement: function(breakAtCalls) {
        if (this.pc === this.func.ast()) {
            var caller = this.getCaller();
            if (caller && caller.isResuming()) {
                caller.haltAtNextStatement();
            }
        } else {
            var nextStmt = this.pc.nextStatement();
            this.bp = nextStmt ? nextStmt : this.func.ast();
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
        this.initialize(this.func, this.mapping);
        this.breakAtFirstStatement();
        this.resume();
    }
},
'resuming', {
    isResuming: function() {
        return this.pc !== null || this.bp !== null;
    },
    resumesNow: function() {
        this.pc = null;
    },
    isBreakingAt: function(node) {
        if (this.bp === null) return false;
        if (this.bp === node) return true;
        if (this.bp == node.nextStatement()) return false;
        return node.isAfter(this.bp);
    },
    findPC: function() {
        if (Object.isEmpty(this.values)) return;
        // find the last computed value
        var last = Object.keys(this.values).max(function(k) {
            var fromTo = k.split('-');
            return (+fromTo[1]) << 23 + (+fromTo[0]);
        });
        // find the node corresponding to this value
        var node = this.func.ast().nodesMatching(function(node) {
            return last == node.position();
        })[0];
        // the pc should be the next node right after the last one
        this.pc = this.func.ast().nodeForAstIndex(node.astIndex() + 1);
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
        var result = this.func.ast().resume(this);
        if (this.getCaller() && this.getCaller().isResuming()) {
            this.getCaller().putValue(this.getCaller().pc, result);
        }
        // break right after the last statement
        this.setPC(this.func.ast());
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
    create: function(func, mapping) {
        return new lively.ast.Interpreter.Frame(func, mapping || {});
    },
    global: function() {
        return this.create(null, Global);
    },
    fromTraceNode: function(trace) {
        var frame;
        if (trace.frame) {
            frame = trace.frame;
        } else {
            var frame = lively.ast.Interpreter.Frame.create(trace.method);
            frame.setThis(trace.itsThis);
            frame.setArguments(trace.args);
        }
        if (trace.caller && !trace.caller.isRoot) {
            frame.setCaller(lively.ast.Interpreter.Frame.fromTraceNode(trace.caller));
        }
        return frame;
    },
    fromScope: function(scope, callstack) {
        if (scope === Global) return lively.ast.Interpreter.Frame.global();
        var ast = lively.ast.Rewriting.table[scope[2]];
        var frame = new lively.ast.Interpreter.Frame(ast.asFunction(), scope[1]);
        var parent = lively.ast.Interpreter.Frame.fromScope(scope[3], callstack);
        if (callstack) {
            frame.values = scope[0];
            frame.findPC();
            frame.setCaller(parent);
        } else {
            frame.setContainingScope(parent);
        }
        return frame;
    }
});

lively.ast.Visitor.subclass('lively.ast.InterpreterVisitor', 'interface', {
    run: function(node, optMapping) {
        return this.runWithFrame(node, lively.ast.Interpreter.Frame.create(null, optMapping));
    },
    runWithFrame: function(node, frame) {
        this.currentFrame = frame;
        return this.visit(node);
    },
},
'invoking', {
    isNative: function(func) {
        if (!this._nativeFuncRegex) this._nativeFuncRegex = /\{\s+\[native\scode\]\s+\}$/;
        return this._nativeFuncRegex.test(func.toString())
    },
    shouldInterpret: function(frame, func) {
        if (this.isNative(func)) return false;
        return func.hasOwnProperty("forInterpretation") ||
            frame.breakAtCalls ||
            func.containsDebugger();
    },
    invoke: function(node, recv, func, argValues) {
        var isNew = node._parent && node._parent.isNew;
        this.currentFrame.setPC(node);
        // if we send apply to a function (recv) we want to interpret it
        // although apply is a native function
        if (recv && Object.isFunction(recv) && func === Function.prototype.apply) {
            func = recv; // The function object is what we want to run
            recv = argValues.shift(); // thisObj is first parameter
            argValues = argValues[0]; // the second arg are the arguments (as an array)
        }
        if (this.shouldInterpret(this.currentFrame, func)) {
            func = func.forInterpretation();
        }
        if (isNew) {
            if (this.isNative(func)) return new func();
            recv = this.newObject(func)
        }
        var result = func.apply(recv, argValues);
        if (isNew && !Object.isObject(result)) {
            // 13.2.2 ECMA-262 3rd. Ediion Specification:
            return recv;
        }
        return result;
    },
    newObject: function(func) {
        var proto = func.prototype;
        var constructor = function() {};
        constructor.prototype = proto;
        var newObj = new constructor();
        newObj.constructor = func;
        return newObj;
    },
},
'visiting', {
    visit: function(node) {
        var value = this.currentFrame.getValue(node);
        if (!value) {
            value = this.currentFrame.putValue(node, node.accept(this));
        }
        return value.val;
    },
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
            oldValue = this.visit(node.left),
            newValue;
        switch (op) {
            case '+=':
              newValue = oldValue + this.visit(node.right);
              break;
            case '-=':
              newValue = oldValue - this.visit(node.right);
              break;
            case '*=':
              newValue = oldValue * this.visit(node.right);
              break;
            case '/=':
              newValue = oldValue / this.visit(node.right);
              break;
            case '>>=':
              newValue = oldValue >>= this.visit(node.right);
              break;
            case '<<=':
              newValue = oldValue <<= this.visit(node.right);
              break;
            case '>>>=':
              newValue = oldValue >>> this.visit(node.right);
              break;
            case '&=':
              newValue = oldValue & this.visit(node.right);
              break;
            case '|=':
              newValue = oldValue | this.visit(node.right);
              break;
            case '&=':
              newValue = oldValue & this.visit(node.right);
              break;
            case '^=':
              newValue = oldValue ^ this.visit(node.right);
              break;
            case '||=':
              newValue = oldValue || this.visit(node.right);
              break;
            case '&&=':
              newValue = oldValue && this.visit(node.right);
              break;
            default:
              throw new Error('Modifying set has unknown operation ' + op);
        }
        return node.left.set(newValue, frame, this);
    },
    visitBinaryOp: function(node) {
        var frame = this.currentFrame;
        var leftVal = this.visit(node.left);
        switch (node.name) {
            case '||':
              return leftVal || this.visit(node.right);
            case '&&':
              return leftVal && this.visit(node.right);
        }
        var rightVal = this.visit(node.right);
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
              return leftVal instanceof rightVal;
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
    visitDebugger: function($super, node) {
        this.currentFrame.putValue(node, 1); // mark this 'debugger' as visited
        this.currentFrame.halt(node, true);
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
            argValues = node.args.collect(function(ea) { return this.visit(ea) }, this);
        return this.invoke(node, undefined, func, argValues);
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
        if (node.name()) frame.addToMapping(node.name(), node);
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

lively.ast.Node.addMethods('interpretation', {
    position: function() {
        return this.pos[0] + "-" + this.pos[1];
    },
    startInterpretation: function(optMapping) {
        var interpreter = new lively.ast.InterpreterVisitor();
        return interpreter.run(this, optMapping);
    },
    toSource: function() { return this.toString(); },
    parentSource: function() {
        if (this.source) return this.source;
        if (this.hasParent()) return this.getParent().parentSource();
        return this.toSource();
    }
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

lively.ast.Function.addMethods('interpretation', {
    position: function() {
        return (this.pos[1] - 1) + "-" + this.pos[1];
    },
    basicApply: function(frame) {
        var interpreter = new lively.ast.InterpreterVisitor();
        try {
            lively.ast.Interpreter.Frame.top = frame;
            // important: lively.ast.Interpreter.Frame.top is only valid
            // during the native VM-execution time. When the execution
            // of the interpreter is stopped, there is no top frame anymore.
            return interpreter.runWithFrame(this.body, frame);
        } finally {
            lively.ast.Interpreter.Frame.top = null;
        }
    },
    apply: function(thisObj, argValues, startHalted) {
        var calledFunction = this.asFunction();
        var mapping = Object.extend({}, calledFunction.getVarMapping());
        var argNames = this.argNames();
        // work-around for $super
        if (mapping["$super"] && argNames[0] == "$super") {
            argValues.unshift(mapping["$super"]);
        }
        var scope = this.lexicalScope ? this.lexicalScope : lively.ast.Interpreter.Frame.global();
        var newFrame = scope.newScope(calledFunction, mapping);
        if (thisObj !== undefined) newFrame.setThis(thisObj);
        newFrame.setArguments(argValues);
        newFrame.setCaller(lively.ast.Interpreter.Frame.top);
        if (startHalted) newFrame.breakAtFirstStatement();
        return this.basicApply(newFrame);
    },
    asFunction: function(optFunc) {
        if (this._chachedFunction) return this._chachedFunction;
        var that = this;
        var fn = function(/*args*/) {
            return that.apply(this, $A(arguments));
        };
        fn.forInterpretation = function() { return fn; };
        fn.ast = function() { return that; };
        fn.startHalted = function() { return function(/*args*/) {
            return that.apply(this, $A(arguments), true);
        }};
        fn.evaluatedSource = function() { return that.parentSource(); };
        if (optFunc) {
            fn.source = optFunc.toSource();
            fn.varMapping = optFunc.getVarMapping();
            if (optFunc.declaredClass) fn.declaredClass = optFunc.declaredClass;
            if (optFunc.methodName) fn.methodName = optFunc.methodName;
            if (optFunc.sourceModule) fn.sourceModule = optFunc.sourceModule;
            if (optFunc.declaredObject) fn.declaredObject = optFunc.declaredObject;
            if (optFunc.name) fn.name = optFunc.name;
        }
        return this._chachedFunction = fn;
    }
},
'continued interpretation', {
    resume: function(frame) {
        return this.basicApply(frame);
    },
});

Object.extend(lively.ast, {
    halt: function(frame) {
        // overwrite this function, e.g. to open a debugger
        return false; // return true to actually stop execution
    },
    doWithHalt: function(func, halt) {
        var oldHalt = lively.ast.halt;
        lively.ast.halt = halt || Functions.True;
        try {
            func();
        } finally {
            lively.ast.halt = oldHalt;
        }
    },
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

Function.addMethods(
'ast', {
    evaluatedSource: function() {
        return this.toSource();
    },
    ast: function() {
        if (this._cachedAst) return this._cachedAst;
        var parseResult = lively.ast.Parser.parse(this.toSource(), 'topLevel');
        if (!parseResult || Object.isString(parseResult)) return parseResult;
        parseResult = parseResult.children[0];
        if (parseResult.isVarDeclaration && parseResult.val.isFunction) {
            return this._cachedAst = parseResult.val;
        }
        return this._cachedAst = parseResult;
    },
},
'debugging', {
    forInterpretation: function(optMapping) {
        var funcAst = this.ast();
        if (this._cachedScope) {
            funcAst.lexicalScope = lively.ast.Interpreter.Frame.fromScope(this._cachedScope);
        }
        return funcAst.asFunction(this);
    },
    containsDebugger: function() {
        return new lively.ast.ContainsDebuggerVisitor().visit(this.ast());
    },
});

}) // end of module