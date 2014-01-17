module('lively.ast.AcornInterpreter').requires('lively.ast.acorn').toRun(function() {

(function extendAcorn() {
    /*
    // reimplementation of lively.ast.InterpreterVisitor for Parser API
    // TODO: implement strict mode ?!
    */
    acorn.walk.interpret = function acornWalkInterpret(ast, frameOrMapping) {
        var currentFrame;
        if (frameOrMapping instanceof lively.ast.AcornInterpreter.Frame)
            var currentFrame = frameOrMapping;
        else
            var currentFrame = lively.ast.AcornInterpreter.Frame.create(null, frameOrMapping);

        function invoke(node, recv, fn, args) {
            // TODO: check whether it is 'new'
            // var isNew = node._parent && node._parent.isNew;
            currentFrame.setPC(node);

            // if we send apply to a function (recv) we want to interpret it
            // although apply is a native function
            // fn.apply(obj, args) => obj.fn(arg1, ..., argN)
            if (recv && Object.isFunction(recv) && fn === Function.prototype.apply) {
                fn = recv;
                recv = args.shift();
                args = args[0];
            }
            if (shouldInterpret(currentFrame, fn)) {
                fn = fn.forInterpretation();
            }
            // TODO: see above
            // if (isNew) {
            //     if (this.isNative(func)) return new func();
            //     recv = this.newObject(func)
            // }
            var result = fn.apply(recv, args);
            // TODO: see above
            // if (isNew) {// && !Object.isObject(result)) {
            //     //FIXME: Cannot distinguish real result from (accidental) last result
            //     //       which might also be an object but which should not be returned
            //     // 13.2.2 ECMA-262 3rd. Edition Specification:
            //     return recv;
            // }
            return result;
        }
        function shouldInterpret(frame, fn) {
            if (isNative(fn)) return false;
            // TODO: reimplement parts
            return fn.hasOwnProperty('forInterpretation') || frame.breakAtCalls || fn.containsDebugger;
        }
        function isNative(fn) {
            var nativeFuncRegex = /\{\s+\[native\scode\]\s+\}$/;
            return nativeFuncRegex.test(fn.toString());
        }
        function astToFunction(node) {
            // TODO
            throw new Error('TODO!');
        }
        function setVariable(name, frame, value) {
            var search = frame.findFrame(name),
                scope = search ? search.frame : lively.ast.AcornInterpreter.Frame.global();
            return scope.addToMapping(name, value);
        }
        function setSlot(node, value) {
            var obj = visit(node.object),
                prop = visit(node.property);
            return obj[prop] = value;
        }

        var visitors = {
            Program: function(node, visit) {
                var result, frame = currentFrame;
                for (var i = 0; i < node.body.length; i++) {
                    result = visit(node.body[i]);
                    if (frame.returnTriggered || frame.breakTriggered || frame.continueTriggered) {
                        return result;
                    }
                }
                return result;
            },
            BlockStatement: function(node, visit) {
                var result, nextResult, frame = currentFrame;
                for (var i = 0; i < node.body.length; i++) {
                    nextResult = visit(node.body[i]);
                    if (frame.returnTriggered)
                        return nextResult;
                    if (frame.breakTriggered || frame.continueTriggered)
                        return result;
                    result = nextResult;
                }
                return result;
            },
            SequenceExpression: function(node, visit) {
                var result, frame = currentFrame;
                for (var i = 0; i < node.expressions.length; i++) {
                    result = visit(node.expressions[i]);
                }
                return result;
            },
            FunctionExpression: function(node, visit) {
                var frame = currentFrame;
                if (node.id !== null)
                    frame.addToMapping(node.id.name, node);
                // TODO: What is this?
                // if (!node.prototype) node.prototype = {};
                node.lexicalScope = frame;
                return astToFunction(node);
            },
            CallExpression: function(node, visit) {
                var fn = visit(node.callee),
                    args = node.arguments.collect(function(arg) {
                        return visit(arg);
                    });
                return invoke(node, undefined, fn, args);
            },
            MemberExpression: function(node, visit) {
                var object = visit(node.object), property;
                if (node.property.type == 'Identifier')
                    property = node.property.name;
                else
                    property = visit(node.property);
                return object[property];
            },
            VariableDeclaration: function(node, visit) {
                if (node.kind == 'var') {
                    node.declarations.each(function(decl) {
                        visit(decl);
                    });
                } else
                    throw new Error('No semantics for VariableDeclaration of kind ' + node.kind + '!');
            },
            VariableDeclarator: function(node, visit) {
                var frame = currentFrame,
                    val = node.init ? visit(node.init) : undefined;
                frame.addToMapping(node.id.name, val);
            },
            IfStatement: function(node, visit) {
                var condVal = visit(node.test);
                return condVal ? visit(node.consequent) :
                    node.alternate ? visit(node.alternate) : undefined;
            },
            ForStatement: function(node, visit) {
                var frame = currentFrame, result;
                node.init && visit(node.init);
                while ((node.test === null) || visit(node.test)) {
                    result = visit(node.body);
                    if (frame.continueTriggered)
                        // TODO: consider labeled continue
                        frame.stopContinue();
                    if (frame.breakTriggered) {
                        // TODO: consider labeled break
                        frame.stopBreak();
                        break;
                    }
                    if (frame.returnTriggered)
                        return result;
                    node.update && visit(node.update);
                    // TODO: reactivate for debugger
                    // frame.removeValue(node.test);
                    // frame.removeValue(node.body);
                    // frame.removeValue(node.update);
                }
                return result;
            },
            ForInStatement: function(node, visit) {
                var frame = currentFrame, result,
                    left, right = visit(node.right);
                if (node.left.type == 'VariableDeclaration') {
                    result = visit(node.left);
                    left = node.left.declarations[0].id.name;
                } else
                    left = node.left.name;
                for (var name in right) {
                    setVariable(left, frame, name);
                    result = visit(node.body);
                    if (frame.continueTriggered)
                        // TODO: consider labeled continue
                        frame.stopContinue();
                    if (frame.breakTriggered) {
                        // TODO: consider labeled break
                        frame.stopBreak();
                        break;
                    }
                    if (frame.returnTriggered)
                        return result;
                    // TODO: reactivate for debugger
                    // frame.removeValue(node.body);
                }
                return result;
            },
            WhileStatement: function(node, visit) {
                var frame = currentFrame, result;
                while (visit(node.test)) {
                    result = visit(node.body);
                    if (frame.continueTriggered)
                        // TODO: consider labeled continue
                        frame.stopContinue();
                    if (frame.breakTriggered) {
                        // TODO: consider labeled break
                        frame.stopBreak();
                        break;
                    }
                    if (frame.returnTriggered)
                        return result;
                    // TODO: reactivate for debugger
                    // frame.removeValue(node.test);
                    // frame.removeValue(node.body);
                }
                return result;
            },
            DoWhileStatement: function(node, visit) {
                var frame = currentFrame, result, condResult;
                do {
                    // TODO: reactivate for debugger
                    // frame.removeValue(node.test);
                    result = visit(node.body);
                    if (frame.continueTriggered)
                        // TODO: consider labeled continue
                        frame.stopContinue();
                    if (frame.breakTriggered) {
                        // TODO: consider labeled break
                        frame.stopBreak();
                        break;
                    }
                    if (frame.returnTriggered)
                        return result;
                    condResult = visit(node.test);
                    // TODO: reactivate for debugger
                    // frame.removeValue(node.body);
                } while (condResult);
                return result;
            },
            SwitchStatement: function(node, visit) {
                var frame = currentFrame, result,
                    leftVal = visit(node.discriminant), rightVal,
                    caseMatched = false,
                    defaultCaseId;
                for (var i = 0; i < node.cases.length; i++) {
                    if (node.cases[i].test === null) {
                        // default
                        defaultCaseId = i;
                        if (!caseMatched)
                            continue;
                    } else {
                        rightVal = visit(node.cases[i].test);
                    }
                    if ((leftVal === rightVal) || caseMatched) {
                        result = visit(node.cases[i]);
                        caseMatched = true;
                    }
                    if (frame.breakTriggered) {
                        frame.stopBreak();
                        break;
                    }
                    if (frame.continueTriggered || frame.returnTriggered)
                        break;
                }
                if (!caseMatched && (defaultCaseId !== undefined)) {
                    for (i = defaultCaseId; i < node.cases.length; i++) {
                        if (node.cases[i].test !== null)
                            rightVal = visit(node.cases[i].test);
                        if ((leftVal === rightVal) || i == defaultCaseId || caseMatched) {
                            result = visit(node.cases[i]);
                            caseMatched = true;
                        }
                        if (frame.breakTriggered) {
                            frame.stopBreak();
                            break;
                        }
                        if (frame.continueTriggered || frame.returnTriggered)
                            break;
                    }
                }
                return result;
            },
            SwitchCase: function(node, visit) {
                var result, nextResult, frame = currentFrame;
                for (var i = 0; i < node.consequent.length; i++) {
                    nextResult = visit(node.consequent[i]);
                    if (frame.returnTriggered)
                        return nextResult;
                    if (frame.breakTriggered || frame.continueTriggered)
                        return result;
                    result = nextResult;
                }
                return result;
            },
            BreakStatement: function(node, visit) {
                // TODO: consider label references
                currentFrame.triggerBreak();
            },
            ContinueStatement: function(node, visit) {
                // TODO: consider label references
                currentFrame.triggerContinue();
            },
            TryStatement: function(node, visit) {
                var frame = currentFrame, result;
                try {
                    result = visit(node.block);
                } catch (e) {
                    if (node.handler === null)
                        throw e;
                    currentFrame = frame.newScope();
                    currentFrame.addToMapping(node.handler.param.name, e);
                    result = visit(node.handler.body);
                    currentFrame = frame;
                } finally {
                    if (node.finalizer !== null)
                        result = visit(node.finalizer);
                }
                return result;
            },
            ThrowStatement: function(node, visit) {
                throw visit(node.argument);
            },
            EmptyStatement: function(node, visit) {
                // FIXME: should not change the result of the last statement
                return;
            },
            ExpressionStatement: function(node, visit) {
                return visit(node.expression);
            },
            AssignmentExpression: function(node, visit) {
                var frame = currentFrame,
                    newVal;
                if (node.operator == '=') {
                    newVal = visit(node.right);
                } else {
                    var oldVal = visit(node.left),
                        val = visit(node.right);
                    switch (node.operator) {
                    case '+=':    newVal = oldVal + val; break;
                    case '-=':    newVal = oldVal - val; break;
                    case '*=':    newVal = oldVal * val; break;
                    case '/=':    newVal = oldVal / val; break;
                    case '%=':    newVal = oldVal % val; break;
                    case '<<=':   newVal = oldVal << val; break;
                    case '>>=':   newVal = oldVal >> val; break;
                    case '>>>=':  newVal = oldVal >>> val; break;
                    case '|=':    newVal = oldVal | val; break;
                    case '^=':    newVal = oldVal ^ val; break;
                    case '&=':    newVal = oldVal & val; break;
                    default: throw new Error('No semantics for AssignmentExpression with ' + node.operator + ' operator!');
                    }
                }
                if (node.left.type == 'Identifier')
                    setVariable(node.left.name, frame, newVal);
                else if (node.left.type == 'MemberExpression')
                    setSlot(node.left, newVal);
                else
                    throw new Error('Invalid left-hand in AssigmentExpression!');
                return newVal;
            },
            UnaryExpression: function(node, visit) {
                var val = visit(node.argument);
                switch (node.operator) {
                case '-':       return -val;
                case '+':       return +val;
                case '!':       return !val;
                case '~':       return ~val;
                case 'typeof':  return typeof val;
                case 'void':    return void val; // or undefined?
                case 'delete':  throw new Error('Delete not yet implemented!'); // TODO: implement
                default: throw new Error('No semantics for UnaryExpression with ' + node.operator + ' operator!');
                }
            },
            BinaryExpression: function(node, visit) {
                var left = visit(node.left),
                    right = visit(node.right);
                switch (node.operator) {
                case '==':  return left == right;
                case '!=':  return left != right;
                case '===': return left === right;
                case '!==': return left !== right;
                case '<':   return left < right;
                case '<=':  return left <= right;
                case '>':   return left > right;
                case '>=':  return left >= right;
                case '<<':  return left << right;
                case '>>':  return left >> right;
                case '>>>': return left >>> right;
                case '+':   return left + right;
                case '-':   return left - right;
                case '*':   return left * right;
                case '/':   return left / right;
                case '%':   return left % right;
                case '|':   return left | right;
                case '^':   return left ^ right;
                case '&':   return left & right;
                case 'in':  return left in right;
                case 'instanceof': return left instanceof right;
                // case '..': // E4X-specific
                default: throw new Error('No semantics for BinaryExpression with ' + node.operator + ' operator!');
                }
            },
            UpdateExpression: function(node, visit) {
                var frame = currentFrame;
                var oldVal = visit(node.argument),
                    newVal;
                switch (node.operator) {
                case '++': newVal = oldVal + 1; break;
                case '--': newVal = oldVal - 1; break;
                default: throw new Error('No semantics for UpdateExpression with ' + node.operator + ' operator!');
                }
                if (node.argument.type == 'Identifier')
                    setVariable(node.argument.name, frame, newVal);
                else if (node.argument.type == 'MemberExpression')
                    setSlot(node.argument, newVal);
                else
                    throw new Error('Invalid argument in UpdateExpression!');
                return node.prefix ? newVal : oldVal;
            },
            ObjectExpression: function(node, visit) {
                var result = {};
                node.properties.each(function(prop) {
                    var propName;
                    if (prop.key.type == 'Identifier')
                        propName = prop.key.name;
                    else
                        propName = visit(prop.key);
                    switch (prop.kind) {
                    case 'init':
                        result[propName] = visit(prop.value);
                        break;
                    // case 'get':
                    // case 'set':
                    default: throw new Error('Invalid kind for ObjectExpression');
                    }
                });
                return result;
            },
            ArrayExpression: function(node, visit) {
                var result = new Array(node.elements.length);
                node.elements.each(function(elem, idx) {
                    result[idx] = visit(elem);
                });
                return result;
            },
            Identifier: function(node, visit) {
                return currentFrame.lookup(node.name);
            },
            Literal: function(node, visit) {
                return node.value;
            }
        };
        function visit(node) {
            return visitors[node.type](node, visit);
        }
        return visit(ast);
    }
})();

Object.subclass('lively.ast.AcornInterpreter.Frame',
'initialization', {
    initialize: function(func, mapping) {
        this.func = func;
        this.mapping = mapping || {};
        this.returnTriggered = false;
        this.breakTriggered = false;
        this.continueTriggered = false;
        this.containingScope = null;
    },
    newScope: function(mapping) {
        var newFrame = new lively.ast.AcornInterpreter.Frame(mapping);
        newFrame.setContainingScope(this);
        return newFrame;
    },
},
'accessing', {
    setContainingScope: function(frame) {
        return this.containingScope = frame;
    },
    getContainingScope: function() {
        return this.containingScope;
    },
},
'mapping', {
    findFrame: function(name) {
        if (this.mapping.hasOwnProperty(name)) {
            return { val: this.mapping[name], frame: this };
        }
        if (this.mapping === Global) { // reached global scope
            throw new ReferenceError(name + ' is not defined');
        }
        // lookup in my current function
        if (!this.func) return null;
        var mapping = this.func.getVarMapping();
        if (mapping) {
            var val = mapping[name];
            if (val)
                return { val: val, frame: this };
        }
        var containingScope = this.getContainingScope();
        return containingScope ? containingScope.findFrame(name) : null;
    },
    lookup: function(name) {
        if (name === 'undefined') return undefined;
        if (name === 'NaN') return NaN;
        if (name === 'arguments') return this.getArguments();
        var frame = this.findFrame(name);
        if (frame) return frame.val;
        return undefined;
    },
    addToMapping: function(name, value) {
        return this.mapping[name] = value;
    },
},
'control-flow', {
    triggerReturn: function() {
        this.returnTriggered = true;
    },
    triggerBreak: function() {
        this.breakTriggered = true;
    },
    stopBreak: function() {
        this.breakTriggered = false;
    },
    triggerContinue: function() {
        this.continueTriggered = true;
    },
    stopContinue: function() {
        this.continueTriggered = false;
    },
});

Object.extend(lively.ast.AcornInterpreter.Frame, {
    create: function(func, mapping) {
        return new lively.ast.AcornInterpreter.Frame(func, mapping || {});
    },
    global: function() {
        return this.create(null, Global);
    },
});

}); // end of module
