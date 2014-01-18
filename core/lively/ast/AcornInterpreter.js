module('lively.ast.AcornInterpreter').requires('lively.ast.acorn').toRun(function() {

/*
// reimplementation of lively.ast.InterpreterVisitor for Parser API
// TODO: implement strict mode ?!
*/
Object.subclass('lively.ast.AcornInterpreter.Interpreter',
'interface', {
    run: function(node, optMapping) {
        return this.runWithFrame(node, lively.ast.AcornInterpreter.Frame.create(null, optMapping));
    },

    runWithFrame: function(node, frame) {
        var state = {
            currentFrame: frame
        };
        this.accept(node, state);
        return state.result;
    },
},
'accessing', {
    setVariable: function(name, state) {
        var search = state.currentFrame.findFrame(name),
            scope = search ? search.frame : lively.ast.AcornInterpreter.Frame.global();
        scope.addToMapping(name, state.result);
    },

    setSlot: function(node, state) {
        if (node.type != 'MemberExpression')
            throw new Error('setSlot can only be called with a MemberExpression node');
        var value = state.result;
        this.accept(node.object, state);
        var obj = state.result,
            prop;
        if ((node.property.type == 'Identifier') && !node.computed)
            prop = node.property.name;
        else {
            this.accept(node.property, state);
            prop = state.result;
        }
        obj[prop] = value;
        state.result = value;
    },
},
'visiting', {
    accept: function(node, state) {
        return this['visit' + node.type.capitalize()](node, state);
    },

    visitProgram: function(node, state) {
        var frame = state.currentFrame;
        for (var i = 0; i < node.body.length; i++) {
            this.accept(node.body[i], state);
            if (frame.returnTriggered || frame.breakTriggered || frame.continueTriggered)
                return;
        }
    },

    // visitFunction: function(node, state) {
    //     if (node.id) {
    //         // id is a node of type Identifier
    //         this.accept(node.id, state);
    //     }

    //     node.params.forEach(function(ea) {
    //         // ea is of type Pattern
    //         this.accept(ea, state);
    //     }, this);

    //     if (node.defaults) {
    //         node.defaults.forEach(function(ea) {
    //             // ea is of type Expression
    //             this.accept(ea, state);
    //         }, this);
    //     }

    //     if (node.rest) {
    //         // rest is a node of type Identifier
    //         this.accept(node.rest, state);
    //     }

    //     // body is a node of type BlockStatement
    //     this.accept(node.body, state);

    //     // node.generator has a specific type that is boolean
    //     if (node.generator) {/*do stuff*/}

    //     // node.expression has a specific type that is boolean
    //     if (node.expression) {/*do stuff*/}
    // },

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
        var oldResult = state.result;
        this.accept(node.test, state);
        var condVal = state.result;
        state.result = oldResult;
        if (condVal) {
            this.accept(node.consequent, state);
        } else if (node.alternate) {
            this.accept(node.alternate, state);
        }
    },

    // visitLabeledStatement: function(node, state) {
    //     // label is a node of type Identifier
    //     this.accept(node.label, state);

    //     // body is a node of type Statement
    //     this.accept(node.body, state);
    // },

    visitBreakStatement: function(node, state) {
        // TODO: consider label references
        // if (node.label) {
        //     // label is a node of type Identifier
        //     this.accept(node.label, state);
        // }
        state.currentFrame.triggerBreak();
    },

    visitContinueStatement: function(node, state) {
        // TODO: consider label references
        // if (node.label) {
        //     // label is a node of type Identifier
        //     this.accept(node.label, state);
        // }
        state.currentFrame.triggerContinue();
    },

    // visitWithStatement: function(node, state) {
    //     // object is a node of type Expression
    //     this.accept(node.object, state);

    //     // body is a node of type Statement
    //     this.accept(node.body, state);
    // },

    visitSwitchStatement: function(node, state) {
        var result = state.result,
            frame = state.currentFrame;
        this.accept(node.discriminant, state);
        var leftVal = state.result;
        var rightVal,
            caseMatched = false,
            defaultCaseId;
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
            if ((leftVal === rightVal) || caseMatched) {
                this.accept(node.cases[i], state);
                caseMatched = true;

                if (frame.breakTriggered) {
                    frame.stopBreak();
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
                    frame.stopBreak();
                    return;
                }
                if (frame.continueTriggered || frame.returnTriggered)
                    return;
            }
        }
        return result;
    },

    // visitReturnStatement: function(node, state) {
    //     if (node.argument) {
    //         // argument is a node of type Expression
    //         this.accept(node.argument, state);
    //     }
    // },

    visitTryStatement: function(node, state) {
        try {
            this.accept(node.block, state);
        } catch (e) {
            if (node.handler === null)
                throw e;
            state.error = e;
            this.accept(node.handler, state);
            delete state.error;
        } finally {
            if (node.finalizer !== null)
                this.accept(node.finalizer, state);
        }
    },

    visitCatchClause: function(node, state) {
        var frame = state.currentFrame;
        state.currentFrame = frame.newScope();
        state.currentFrame.addToMapping(node.param.name, state.error);
        this.accept(node.body, state);
        state.currentFrame = frame;
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
        while (testVal) {
            this.accept(node.body, state);
            result = state.result;

            if (frame.continueTriggered)
                // TODO: consider labeled continue
                frame.stopContinue();
            if (frame.breakTriggered) {
                // TODO: consider labeled break
                frame.stopBreak();
                break;
            }
            if (frame.returnTriggered)
                return;
            // TODO: reactivate for debugger
            // frame.removeValue(node.test);
            // frame.removeValue(node.body);

            this.accept(node.test, state);
            testVal = state.result;
            state.result = result;
        }
    },

    visitDoWhileStatement: function(node, state) {
        var frame = state.currentFrame,
            testVal, result;
        do {
            // TODO: reactivate for debugger
            // frame.removeValue(node.test);
            this.accept(node.body, state);
            result = state.result;

            if (frame.continueTriggered)
                // TODO: consider labeled continue
                frame.stopContinue();
            if (frame.breakTriggered) {
                // TODO: consider labeled break
                frame.stopBreak();
                break;
            }
            if (frame.returnTriggered)
                return;
            // TODO: reactivate for debugger
            // frame.removeValue(node.body);

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

        while (testVal) {
            this.accept(node.body, state);
            result = state.result;

            if (frame.continueTriggered)
                // TODO: consider labeled continue
                frame.stopContinue();
            if (frame.breakTriggered) {
                // TODO: consider labeled break
                frame.stopBreak();
                break;
            }
            if (frame.returnTriggered)
                return;

            if (node.update) {
                this.accept(node.update, state);
            }
            // TODO: reactivate for debugger
            // frame.removeValue(node.test);
            // frame.removeValue(node.body);
            // frame.removeValue(node.update);

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
            left;
        this.accept(node.right, state);
        var right = state.result;
        if (node.left.type == 'VariableDeclaration') {
            this.accept(node.left, state);
            left = node.left.declarations[0].id.name;
        } else
            left = node.left.name;
        state.result = result;
        for (var name in right) {
            state.result = name;
            this.setVariable(left, state);

            this.accept(node.body, state);

            if (frame.continueTriggered)
                // TODO: consider labeled continue
                frame.stopContinue();
            if (frame.breakTriggered) {
                // TODO: consider labeled break
                frame.stopBreak();
                break;
            }
            if (frame.returnTriggered)
                return;
            // TODO: reactivate for debugger
            // frame.removeValue(node.body);
        }
    },

    // visitForOfStatement: function(node, state) {
    //     // left is a node of type VariableDeclaration
    //     this.accept(node.left, state);

    //     // right is a node of type Expression
    //     this.accept(node.right, state);

    //     // body is a node of type Statement
    //     this.accept(node.body, state);
    // },

    // visitDebuggerStatement: function(node, state) {
    // },

    // visitFunctionDeclaration: function(node, state) {
    //     // id is a node of type Identifier
    //     this.accept(node.id, state);

    //     node.params.forEach(function(ea) {
    //         // ea is of type Pattern
    //         this.accept(ea, state);
    //     }, this);

    //     if (node.defaults) {
    //         node.defaults.forEach(function(ea) {
    //             // ea is of type Expression
    //             this.accept(ea, state);
    //         }, this);
    //     }

    //     if (node.rest) {
    //         // rest is a node of type Identifier
    //         this.accept(node.rest, state);
    //     }

    //     // body is a node of type BlockStatement
    //     this.accept(node.body, state);

    //     // node.generator has a specific type that is boolean
    //     if (node.generator) {/*do stuff*/}

    //     // node.expression has a specific type that is boolean
    //     if (node.expression) {/*do stuff*/}
    // },

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
            val = state.result;
        }
        state.currentFrame.addToMapping(node.id.name, val);
        state.result = oldResult;
    },

    // visitThisExpression: function(node, state) {
    // },

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
            // case 'get':
            // case 'set':
            default: throw new Error('Invalid kind for ObjectExpression!');
            }
        }, this);
        state.result = result;
    },

    // visitFunctionExpression: function(node, state) {
    //     if (node.id) {
    //         // id is a node of type Identifier
    //         this.accept(node.id, state);
    //     }

    //     node.params.forEach(function(ea) {
    //         // ea is of type Pattern
    //         this.accept(ea, state);
    //     }, this);

    //     if (node.defaults) {
    //         node.defaults.forEach(function(ea) {
    //             // ea is of type Expression
    //             this.accept(ea, state);
    //         }, this);
    //     }

    //     if (node.rest) {
    //         // rest is a node of type Identifier
    //         this.accept(node.rest, state);
    //     }

    //     // body is a node of type BlockStatement
    //     this.accept(node.body, state);

    //     // node.generator has a specific type that is boolean
    //     if (node.generator) {/*do stuff*/}

    //     // node.expression has a specific type that is boolean
    //     if (node.expression) {/*do stuff*/}
    // },

    // visitArrowExpression: function(node, state) {
    //     node.params.forEach(function(ea) {
    //         // ea is of type Pattern
    //         this.accept(ea, state);
    //     }, this);

    //     if (node.defaults) {
    //         node.defaults.forEach(function(ea) {
    //             // ea is of type Expression
    //             this.accept(ea, state);
    //         }, this);
    //     }

    //     if (node.rest) {
    //         // rest is a node of type Identifier
    //         this.accept(node.rest, state);
    //     }

    //     // body is a node of type BlockStatement
    //     this.accept(node.body, state);

    //     // node.generator has a specific type that is boolean
    //     if (node.generator) {/*do stuff*/}

    //     // node.expression has a specific type that is boolean
    //     if (node.expression) {/*do stuff*/}
    // },

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
                    state.currentFrame.findFrame(node.name);
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

    // visitLogicalExpression: function(node, state) {
    //     // node.operator is an LogicalOperator enum:
    //     // "||" | "&&"

    //     // left is a node of type Expression
    //     this.accept(node.left, state);

    //     // right is a node of type Expression
    //     this.accept(node.right, state);
    // },

    // visitConditionalExpression: function(node, state) {
    //     // test is a node of type Expression
    //     this.accept(node.test, state);

    //     // alternate is a node of type Expression
    //     this.accept(node.alternate, state);

    //     // consequent is a node of type Expression
    //     this.accept(node.consequent, state);
    // },

    // visitNewExpression: function(node, state) {
    //     // callee is a node of type Expression
    //     this.accept(node.callee, state);

    //     node.arguments.forEach(function(ea) {
    //         // ea is of type Expression
    //         this.accept(ea, state);
    //     }, this);
    // },

    // visitCallExpression: function(node, state) {
    //     // callee is a node of type Expression
    //     this.accept(node.callee, state);

    //     node.arguments.forEach(function(ea) {
    //         // ea is of type Expression
    //         this.accept(ea, state);
    //     }, this);
    // },

    visitMemberExpression: function(node, state) {
        this.accept(node.object, state);
        var object = state.result,
            property;
        if (node.property.type == 'Identifier')
            property = node.property.name;
        else {
            this.accept(node.property, state);
            property = state.result;
        }
        state.result = object[property];
    },

    // visitObjectPattern: function(node, state) {
    //     node.properties.forEach(function(ea) {
    //         // ea.key is of type node
    //         this.accept(ea.key, state);
    //         // ea.value is of type node
    //         this.accept(ea.value, state);
    //     }, this);
    // },

    // visitArrayPattern: function(node, state) {
    //     node.elements.forEach(function(ea) {
    //         if (ea) {
    //             // ea can be of type Pattern or 
    //             this.accept(ea, state);
    //         }
    //     }, this);
    // },

    visitSwitchCase: function(node, state) {
        var frame = state.currentFrame;
        for (var i = 0; i < node.consequent.length; i++) {
            this.accept(node.consequent[i], state);
            if (frame.returnTriggered || frame.breakTriggered || frame.continueTriggered)
                return;
        }
    },

    // visitComprehensionBlock: function(node, state) {
    //     // left is a node of type Pattern
    //     this.accept(node.left, state);

    //     // right is a node of type Expression
    //     this.accept(node.right, state);

    //     // node.each has a specific type that is boolean
    //     if (node.each) {/*do stuff*/}
    // },

    visitIdentifier: function(node, state) {
        state.result = state.currentFrame.lookup(node.name);
    },

    visitLiteral: function(node, state) {
        state.result = node.value;
        return;
    },
});

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

        var visitors = {
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
        // TODO: what is this doing?
        // lookup in my current function
        // if (!this.func) return null;
        // var mapping = this.func.getVarMapping();
        // if (mapping) {
        //     var val = mapping[name];
        //     if (val)
        //         return { val: val, frame: this };
        // }
        var containingScope = this.getContainingScope();
        if (!containingScope)
            throw new ReferenceError(name + ' is not defined');
        return containingScope.findFrame(name);
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
