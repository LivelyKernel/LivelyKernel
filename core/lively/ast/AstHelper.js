module('lively.ast.AstHelper').requires("lively.ast.acorn").toRun(function() {

Object.subclass("lively.ast.MozillaAST.BaseVisitor",
// This code was generated with:
// lively.ast.MozillaAST.createVisitorCode({pathAsParameter: true, asLivelyClass: true, parameters: ["depth","state"], name: "lively.ast.MozillaAST.BaseVisitor", useReturn: true, openWindow: true});
"visiting", {
    accept: function(node, depth, state, path) {
        path = path || [];
        return this['visit' + node.type](node, depth, state, path);
    },

    visitProgram: function(node, depth, state, path) {
        var retVal;
        node.body.forEach(function(ea, i) {
            // ea is of type Statement
            retVal = this.accept(ea, depth, state, path.concat(["body", i]));
        }, this);
        return retVal;
    },

    visitFunction: function(node, depth, state, path) {
        var retVal;
        if (node.id) {
            // id is a node of type Identifier
            retVal = this.accept(node.id, depth, state, path.concat(["id"]));
        }

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            retVal = this.accept(ea, depth, state, path.concat(["params", i]));
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                retVal = this.accept(ea, depth, state, path.concat(["defaults", i]));
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            retVal = this.accept(node.rest, depth, state, path.concat(["rest"]));
        }

        // body is a node of type BlockStatement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
        return retVal;
    },

    visitStatement: function(node, depth, state, path) {
        var retVal;
        return retVal;
    },

    visitEmptyStatement: function(node, depth, state, path) {
        var retVal;
        return retVal;
    },

    visitBlockStatement: function(node, depth, state, path) {
        var retVal;
        node.body.forEach(function(ea, i) {
            // ea is of type Statement
            retVal = this.accept(ea, depth, state, path.concat(["body", i]));
        }, this);
        return retVal;
    },

    visitExpressionStatement: function(node, depth, state, path) {
        var retVal;
        // expression is a node of type Expression
        retVal = this.accept(node.expression, depth, state, path.concat(["expression"]));
        return retVal;
    },

    visitIfStatement: function(node, depth, state, path) {
        var retVal;
        // test is a node of type Expression
        retVal = this.accept(node.test, depth, state, path.concat(["test"]));

        // consequent is a node of type Statement
        retVal = this.accept(node.consequent, depth, state, path.concat(["consequent"]));

        if (node.alternate) {
            // alternate is a node of type Statement
            retVal = this.accept(node.alternate, depth, state, path.concat(["alternate"]));
        }
        return retVal;
    },

    visitLabeledStatement: function(node, depth, state, path) {
        var retVal;
        // label is a node of type Identifier
        retVal = this.accept(node.label, depth, state, path.concat(["label"]));

        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitBreakStatement: function(node, depth, state, path) {
        var retVal;
        if (node.label) {
            // label is a node of type Identifier
            retVal = this.accept(node.label, depth, state, path.concat(["label"]));
        }
        return retVal;
    },

    visitContinueStatement: function(node, depth, state, path) {
        var retVal;
        if (node.label) {
            // label is a node of type Identifier
            retVal = this.accept(node.label, depth, state, path.concat(["label"]));
        }
        return retVal;
    },

    visitWithStatement: function(node, depth, state, path) {
        var retVal;
        // object is a node of type Expression
        retVal = this.accept(node.object, depth, state, path.concat(["object"]));

        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitSwitchStatement: function(node, depth, state, path) {
        var retVal;
        // discriminant is a node of type Expression
        retVal = this.accept(node.discriminant, depth, state, path.concat(["discriminant"]));

        node.cases.forEach(function(ea, i) {
            // ea is of type SwitchCase
            retVal = this.accept(ea, depth, state, path.concat(["cases", i]));
        }, this);

        // node.lexical has a specific type that is boolean
        if (node.lexical) {/*do stuff*/}
        return retVal;
    },

    visitReturnStatement: function(node, depth, state, path) {
        var retVal;
        if (node.argument) {
            // argument is a node of type Expression
            retVal = this.accept(node.argument, depth, state, path.concat(["argument"]));
        }
        return retVal;
    },

    visitThrowStatement: function(node, depth, state, path) {
        var retVal;
        // argument is a node of type Expression
        retVal = this.accept(node.argument, depth, state, path.concat(["argument"]));
        return retVal;
    },

    visitTryStatement: function(node, depth, state, path) {
        var retVal;
        // block is a node of type BlockStatement
        retVal = this.accept(node.block, depth, state, path.concat(["block"]));

        if (node.handler) {
            // handler is a node of type CatchClause
            retVal = this.accept(node.handler, depth, state, path.concat(["handler"]));
        }

        if (node.guardedHandlers) {
            node.guardedHandlers.forEach(function(ea, i) {
                // ea is of type CatchClause
                retVal = this.accept(ea, depth, state, path.concat(["guardedHandlers", i]));
            }, this);
        }

        if (node.finalizer) {
            // finalizer is a node of type BlockStatement
            retVal = this.accept(node.finalizer, depth, state, path.concat(["finalizer"]));
        }
        return retVal;
    },

    visitWhileStatement: function(node, depth, state, path) {
        var retVal;
        // test is a node of type Expression
        retVal = this.accept(node.test, depth, state, path.concat(["test"]));

        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitDoWhileStatement: function(node, depth, state, path) {
        var retVal;
        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        // test is a node of type Expression
        retVal = this.accept(node.test, depth, state, path.concat(["test"]));
        return retVal;
    },

    visitForStatement: function(node, depth, state, path) {
        var retVal;
        if (node.init) {
            // init is a node of type VariableDeclaration
            retVal = this.accept(node.init, depth, state, path.concat(["init"]));
        }

        if (node.test) {
            // test is a node of type Expression
            retVal = this.accept(node.test, depth, state, path.concat(["test"]));
        }

        if (node.update) {
            // update is a node of type Expression
            retVal = this.accept(node.update, depth, state, path.concat(["update"]));
        }

        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitForInStatement: function(node, depth, state, path) {
        var retVal;
        // left is a node of type VariableDeclaration
        retVal = this.accept(node.left, depth, state, path.concat(["left"]));

        // right is a node of type Expression
        retVal = this.accept(node.right, depth, state, path.concat(["right"]));

        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        // node.each has a specific type that is boolean
        if (node.each) {/*do stuff*/}
        return retVal;
    },

    visitForOfStatement: function(node, depth, state, path) {
        var retVal;
        // left is a node of type VariableDeclaration
        retVal = this.accept(node.left, depth, state, path.concat(["left"]));

        // right is a node of type Expression
        retVal = this.accept(node.right, depth, state, path.concat(["right"]));

        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitLetStatement: function(node, depth, state, path) {
        var retVal;
        node.head.forEach(function(ea, i) {
            // ea.id is of type node
            retVal = this.accept(ea.id, depth, state, path.concat(["head", i, "id"]));
            if (ea.init) {
                // ea.init can be of type node
                retVal = this.accept(ea.init, depth, state, path.concat(["head", i, "init"]));
            }
        }, this);

        // body is a node of type Statement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitDebuggerStatement: function(node, depth, state, path) {
        var retVal;
        return retVal;
    },

    visitDeclaration: function(node, depth, state, path) {
        var retVal;
        return retVal;
    },

    visitFunctionDeclaration: function(node, depth, state, path) {
        var retVal;
        // id is a node of type Identifier
        retVal = this.accept(node.id, depth, state, path.concat(["id"]));

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            retVal = this.accept(ea, depth, state, path.concat(["params", i]));
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                retVal = this.accept(ea, depth, state, path.concat(["defaults", i]));
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            retVal = this.accept(node.rest, depth, state, path.concat(["rest"]));
        }

        // body is a node of type BlockStatement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
        return retVal;
    },

    visitVariableDeclaration: function(node, depth, state, path) {
        var retVal;
        node.declarations.forEach(function(ea, i) {
            // ea is of type VariableDeclarator
            retVal = this.accept(ea, depth, state, path.concat(["declarations", i]));
        }, this);

        // node.kind is "var" or "let" or "const"
        return retVal;
    },

    visitVariableDeclarator: function(node, depth, state, path) {
        var retVal;
        // id is a node of type Pattern
        retVal = this.accept(node.id, depth, state, path.concat(["id"]));

        if (node.init) {
            // init is a node of type Expression
            retVal = this.accept(node.init, depth, state, path.concat(["init"]));
        }
        return retVal;
    },

    visitExpression: function(node, depth, state, path) {
        var retVal;
        return retVal;
    },

    visitThisExpression: function(node, depth, state, path) {
        var retVal;
        return retVal;
    },

    visitArrayExpression: function(node, depth, state, path) {
        var retVal;
        node.elements.forEach(function(ea, i) {
            if (ea) {
                // ea can be of type Expression or
                retVal = this.accept(ea, depth, state, path.concat(["elements", i]));
            }
        }, this);
        return retVal;
    },

    visitObjectExpression: function(node, depth, state, path) {
        var retVal;
        node.properties.forEach(function(ea, i) {
            // ea.key is of type node
            retVal = this.accept(ea.key, depth, state, path.concat(["properties", i, "key"]));
            // ea.value is of type node
            retVal = this.accept(ea.value, depth, state, path.concat(["properties", i, "value"]));
            // ea.kind is "init" or "get" or "set"
        }, this);
        return retVal;
    },

    visitFunctionExpression: function(node, depth, state, path) {
        var retVal;
        if (node.id) {
            // id is a node of type Identifier
            retVal = this.accept(node.id, depth, state, path.concat(["id"]));
        }

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            retVal = this.accept(ea, depth, state, path.concat(["params", i]));
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                retVal = this.accept(ea, depth, state, path.concat(["defaults", i]));
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            retVal = this.accept(node.rest, depth, state, path.concat(["rest"]));
        }

        // body is a node of type BlockStatement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
        return retVal;
    },

    visitArrowExpression: function(node, depth, state, path) {
        var retVal;
        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            retVal = this.accept(ea, depth, state, path.concat(["params", i]));
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                retVal = this.accept(ea, depth, state, path.concat(["defaults", i]));
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            retVal = this.accept(node.rest, depth, state, path.concat(["rest"]));
        }

        // body is a node of type BlockStatement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
        return retVal;
    },

    visitArrowFunctionExpression: function(node, depth, state, path) {
        var retVal;
        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            retVal = this.accept(ea, depth, state, path.concat(["params", i]));
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                retVal = this.accept(ea, depth, state, path.concat(["defaults", i]));
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            retVal = this.accept(node.rest, depth, state, path.concat(["rest"]));
        }

        // body is a node of type BlockStatement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
        return retVal;
    },

    visitSequenceExpression: function(node, depth, state, path) {
        var retVal;
        node.expressions.forEach(function(ea, i) {
            // ea is of type Expression
            retVal = this.accept(ea, depth, state, path.concat(["expressions", i]));
        }, this);
        return retVal;
    },

    visitUnaryExpression: function(node, depth, state, path) {
        var retVal;
        // node.operator is an UnaryOperator enum:
        // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"

        // node.prefix has a specific type that is boolean
        if (node.prefix) {/*do stuff*/}

        // argument is a node of type Expression
        retVal = this.accept(node.argument, depth, state, path.concat(["argument"]));
        return retVal;
    },

    visitBinaryExpression: function(node, depth, state, path) {
        var retVal;
        // node.operator is an BinaryOperator enum:
        // "==" | "!=" | "===" | "!==" | | "<" | "<=" | ">" | ">=" | | "<<" | ">>" | ">>>" | | "+" | "-" | "*" | "/" | "%" | | "|" | "^" | "&" | "in" | | "instanceof" | ".."

        // left is a node of type Expression
        retVal = this.accept(node.left, depth, state, path.concat(["left"]));

        // right is a node of type Expression
        retVal = this.accept(node.right, depth, state, path.concat(["right"]));
        return retVal;
    },

    visitAssignmentExpression: function(node, depth, state, path) {
        var retVal;
        // node.operator is an AssignmentOperator enum:
        // "=" | "+=" | "-=" | "*=" | "/=" | "%=" | | "<<=" | ">>=" | ">>>=" | | "|=" | "^=" | "&="

        // left is a node of type Expression
        retVal = this.accept(node.left, depth, state, path.concat(["left"]));

        // right is a node of type Expression
        retVal = this.accept(node.right, depth, state, path.concat(["right"]));
        return retVal;
    },

    visitUpdateExpression: function(node, depth, state, path) {
        var retVal;
        // node.operator is an UpdateOperator enum:
        // "++" | "--"

        // argument is a node of type Expression
        retVal = this.accept(node.argument, depth, state, path.concat(["argument"]));

        // node.prefix has a specific type that is boolean
        if (node.prefix) {/*do stuff*/}
        return retVal;
    },

    visitLogicalExpression: function(node, depth, state, path) {
        var retVal;
        // node.operator is an LogicalOperator enum:
        // "||" | "&&"

        // left is a node of type Expression
        retVal = this.accept(node.left, depth, state, path.concat(["left"]));

        // right is a node of type Expression
        retVal = this.accept(node.right, depth, state, path.concat(["right"]));
        return retVal;
    },

    visitConditionalExpression: function(node, depth, state, path) {
        var retVal;
        // test is a node of type Expression
        retVal = this.accept(node.test, depth, state, path.concat(["test"]));

        // alternate is a node of type Expression
        retVal = this.accept(node.alternate, depth, state, path.concat(["alternate"]));

        // consequent is a node of type Expression
        retVal = this.accept(node.consequent, depth, state, path.concat(["consequent"]));
        return retVal;
    },

    visitNewExpression: function(node, depth, state, path) {
        var retVal;
        // callee is a node of type Expression
        retVal = this.accept(node.callee, depth, state, path.concat(["callee"]));

        node.arguments.forEach(function(ea, i) {
            // ea is of type Expression
            retVal = this.accept(ea, depth, state, path.concat(["arguments", i]));
        }, this);
        return retVal;
    },

    visitCallExpression: function(node, depth, state, path) {
        var retVal;
        // callee is a node of type Expression
        retVal = this.accept(node.callee, depth, state, path.concat(["callee"]));

        node.arguments.forEach(function(ea, i) {
            // ea is of type Expression
            retVal = this.accept(ea, depth, state, path.concat(["arguments", i]));
        }, this);
        return retVal;
    },

    visitMemberExpression: function(node, depth, state, path) {
        var retVal;
        // object is a node of type Expression
        retVal = this.accept(node.object, depth, state, path.concat(["object"]));

        // property is a node of type Identifier
        retVal = this.accept(node.property, depth, state, path.concat(["property"]));

        // node.computed has a specific type that is boolean
        if (node.computed) {/*do stuff*/}
        return retVal;
    },

    visitYieldExpression: function(node, depth, state, path) {
        var retVal;
        if (node.argument) {
            // argument is a node of type Expression
            retVal = this.accept(node.argument, depth, state, path.concat(["argument"]));
        }
        return retVal;
    },

    visitComprehensionExpression: function(node, depth, state, path) {
        var retVal;
        // body is a node of type Expression
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        node.blocks.forEach(function(ea, i) {
            // ea is of type ComprehensionBlock
            retVal = this.accept(ea, depth, state, path.concat(["blocks", i]));
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            retVal = this.accept(node.filter, depth, state, path.concat(["filter"]));
        }
        return retVal;
    },

    visitGeneratorExpression: function(node, depth, state, path) {
        var retVal;
        // body is a node of type Expression
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));

        node.blocks.forEach(function(ea, i) {
            // ea is of type ComprehensionBlock
            retVal = this.accept(ea, depth, state, path.concat(["blocks", i]));
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            retVal = this.accept(node.filter, depth, state, path.concat(["filter"]));
        }
        return retVal;
    },

    visitLetExpression: function(node, depth, state, path) {
        var retVal;
        node.head.forEach(function(ea, i) {
            // ea.id is of type node
            retVal = this.accept(ea.id, depth, state, path.concat(["head", i, "id"]));
            if (ea.init) {
                // ea.init can be of type node
                retVal = this.accept(ea.init, depth, state, path.concat(["head", i, "init"]));
            }
        }, this);

        // body is a node of type Expression
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitPattern: function(node, depth, state, path) {
        var retVal;
        return retVal;
    },

    visitObjectPattern: function(node, depth, state, path) {
        var retVal;
        node.properties.forEach(function(ea, i) {
            // ea.key is of type node
            retVal = this.accept(ea.key, depth, state, path.concat(["properties", i, "key"]));
            // ea.value is of type node
            retVal = this.accept(ea.value, depth, state, path.concat(["properties", i, "value"]));
        }, this);
        return retVal;
    },

    visitArrayPattern: function(node, depth, state, path) {
        var retVal;
        node.elements.forEach(function(ea, i) {
            if (ea) {
                // ea can be of type Pattern or
                retVal = this.accept(ea, depth, state, path.concat(["elements", i]));
            }
        }, this);
        return retVal;
    },

    visitSwitchCase: function(node, depth, state, path) {
        var retVal;
        if (node.test) {
            // test is a node of type Expression
            retVal = this.accept(node.test, depth, state, path.concat(["test"]));
        }

        node.consequent.forEach(function(ea, i) {
            // ea is of type Statement
            retVal = this.accept(ea, depth, state, path.concat(["consequent", i]));
        }, this);
        return retVal;
    },

    visitCatchClause: function(node, depth, state, path) {
        var retVal;
        // param is a node of type Pattern
        retVal = this.accept(node.param, depth, state, path.concat(["param"]));

        if (node.guard) {
            // guard is a node of type Expression
            retVal = this.accept(node.guard, depth, state, path.concat(["guard"]));
        }

        // body is a node of type BlockStatement
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitComprehensionBlock: function(node, depth, state, path) {
        var retVal;
        // left is a node of type Pattern
        retVal = this.accept(node.left, depth, state, path.concat(["left"]));

        // right is a node of type Expression
        retVal = this.accept(node.right, depth, state, path.concat(["right"]));

        // node.each has a specific type that is boolean
        if (node.each) {/*do stuff*/}
        return retVal;
    },

    visitIdentifier: function(node, depth, state, path) {
        var retVal;
        // node.name has a specific type that is string
        return retVal;
    },

    visitLiteral: function(node, depth, state, path) {
        var retVal;
        if (node.value) {
            // node.value has a specific type that is string or boolean or number or RegExp
        }
        return retVal;
    },

    visitClassDeclaration: function(node, depth, state, path) {
        var retVal;
        // id is a node of type Identifier
        retVal = this.accept(node.id, depth, state, path.concat(["id"]));

        if (node.superClass) {
            // superClass is a node of type Identifier
            retVal = this.accept(node.superClass, depth, state, path.concat(["superClass"]));
        }

        // body is a node of type ClassBody
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },

    visitClassBody: function(node, depth, state, path) {
        var retVal;
        node.body.forEach(function(ea, i) {
            // ea is of type MethodDefinition
            retVal = this.accept(ea, depth, state, path.concat(["body", i]));
        }, this);
        return retVal;
    },

    visitMethodDefinition: function(node, depth, state, path) {
        var retVal;
        // node.static has a specific type that is boolean
        if (node.static) {/*do stuff*/}

        // node.computed has a specific type that is boolean
        if (node.computed) {/*do stuff*/}

        // node.kind is ""

        // key is a node of type Identifier
        retVal = this.accept(node.key, depth, state, path.concat(["key"]));

        // value is a node of type FunctionExpression
        retVal = this.accept(node.value, depth, state, path.concat(["value"]));
        return retVal;
    }
});

lively.ast.MozillaAST.BaseVisitor.subclass('lively.ast.PrinterVisitor', {

    accept: function($super, node, state, tree, path) {
        var pathString = path
            .map(function(ea) { return typeof ea === 'string' ? '.' + ea : '[' + ea + ']'})
            .join('')
        var myChildren = [];
        $super(node, state, myChildren, path);
        tree.push({
            node: node,
            path: pathString,
            index: state.index++,
            children: myChildren
        });
    }

});

lively.ast.MozillaAST.BaseVisitor.subclass("lively.ast.ComparisonVisitor",
"comparison", {

    recordNotEqual: function(node1, node2, state, msg) {
        state.comparisons.errors.push({
            node1: node1, node2: node2,
            path: state.completePath, msg: msg
        });
    },

    compareType: function(node1, node2, state) {
        return this.compareField('type', node1, node2, state);
    },

    compareField: function(field, node1, node2, state) {
        node2 = lively.PropertyPath(state.completePath.join('.')).get(node2);
        if (node1 && node2 && node1[field] === node2[field]) return true;
        if ((node1 && node1[field] === '*') || (node2 && node2[field] === '*')) return true;
        var fullPath = state.completePath.join('.') + '.' + field, msg;
        if (!node1) msg = "node1 on " + fullPath + " not defined";
        else if (!node2) msg = 'node2 not defined but node1 (' + fullPath + ') is: '+ node1[field];
        else msg = fullPath + ' is not equal: ' + node1[field] + ' vs. ' + node2[field];
        this.recordNotEqual(node1, node2, state, msg);
        return false;
    }

},
"visiting", {

    accept: function(node1, node2, state, path) {
        var patternNode = lively.PropertyPath(path.join('.')).get(node2);
        if (node1 === '*' || patternNode === '*') return;
        var nextState = {
            completePath: path,
            comparisons: state.comparisons
        };
        if (this.compareType(node1, node2, nextState))
            this['visit' + node1.type](node1, node2, nextState, path);
    },

    visitFunction: function($super, node1, node2, state, path) {
        // node1.generator has a specific type that is boolean
        if (node1.generator) { this.compareField("generator", node1, node2, state); }

        // node1.expression has a specific type that is boolean
        if (node1.expression) { this.compareField("expression", node1, node2, state); }

        $super(node1, node2, state, path);
    },

    visitSwitchStatement: function($super, node1, node2, state, path) {
        // node1.lexical has a specific type that is boolean
        if (node1.lexical) { this.compareField("lexical", node1, node2, state); }

        $super(node1, node2, state, path);
    },

    visitForInStatement: function($super, node1, node2, state, path) {
        // node1.each has a specific type that is boolean
        if (node1.each) { this.compareField("each", node1, node2, state); }

        $super(node1, node2, state, path);
    },

    visitFunctionDeclaration: function($super, node1, node2, state, path) {
        // node1.generator has a specific type that is boolean
        if (node1.generator) { this.compareField("generator", node1, node2, state); }

        // node1.expression has a specific type that is boolean
        if (node1.expression) { this.compareField("expression", node1, node2, state); }

        $super(node1, node2, state, path);
    },

    visitVariableDeclaration: function($super, node1, node2, state, path) {
        // node1.kind is "var" or "let" or "const"
        this.compareField("kind", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitUnaryExpression: function($super, node1, node2, state, path) {
        // node1.operator is an UnaryOperator enum:
        // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
        this.compareField("operator", node1, node2, state);

        // node1.prefix has a specific type that is boolean
        if (node1.prefix) { this.compareField("prefix", node1, node2, state); }

        $super(node1, node2, state, path);
    },

    visitBinaryExpression: function($super, node1, node2, state, path) {
        // node1.operator is an BinaryOperator enum:
        // "==" | "!=" | "===" | "!==" | | "<" | "<=" | ">" | ">=" | | "<<" | ">>" | ">>>" | | "+" | "-" | "*" | "/" | "%" | | "|" | "^" | "&" | "in" | | "instanceof" | ".."
        this.compareField("operator", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitAssignmentExpression: function($super, node1, node2, state, path) {
        // node1.operator is an AssignmentOperator enum:
        // "=" | "+=" | "-=" | "*=" | "/=" | "%=" | | "<<=" | ">>=" | ">>>=" | | "|=" | "^=" | "&="
        this.compareField("operator", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitUpdateExpression: function($super, node1, node2, state, path) {
        // node1.operator is an UpdateOperator enum:
        // "++" | "--"
        this.compareField("operator", node1, node2, state);
        // node1.prefix has a specific type that is boolean
        if (node1.prefix) { this.compareField("prefix", node1, node2, state); }
        $super(node1, node2, state, path);
    },

    visitLogicalExpression: function($super, node1, node2, state, path) {
        // node1.operator is an LogicalOperator enum:
        // "||" | "&&"
        this.compareField("operator", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitMemberExpression: function($super, node1, node2, state, path) {
        // node1.computed has a specific type that is boolean
        if (node1.computed) { this.compareField("computed", node1, node2, state); }
        $super(node1, node2, state, path);
    },

    visitComprehensionBlock: function($super, node1, node2, state, path) {
        // node1.each has a specific type that is boolean
        if (node1.each) { this.compareField("each", node1, node2, state); }
        $super(node1, node2, state, path);
    },

    visitIdentifier: function($super, node1, node2, state, path) {
        // node1.name has a specific type that is string
        this.compareField("name", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitLiteral: function($super, node1, node2, state, path) {
        this.compareField("value", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitClassDeclaration: function($super, node1, node2, state, path) {
        this.compareField("id", node1, node2, state);
        if (node1.superClass) {
            this.compareField("superClass", node1, node2, state);
        }
        this.compareField("body", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitClassBody: function($super, node1, node2, state, path) {
        this.compareField("body", node1, node2, state);
        $super(node1, node2, state, path);
    },

    visitMethodDefinition: function($super, node1, node2, state, path) {
        this.compareField("static", node1, node2, state);
        this.compareField("computed", node1, node2, state);
        this.compareField("kind", node1, node2, state);
        this.compareField("key", node1, node2, state);
        this.compareField("value", node1, node2, state);
        $super(node1, node2, state, path);
    }
});

lively.ast.MozillaAST.BaseVisitor.subclass("lively.ast.ScopeVisitor",
'scope specific', {
    newScope: function(scopeNode, parentScope) {
        var scope = {
          node: scopeNode,
          varDecls: [],
          varDeclPaths: [],
          funcDecls: [],
          classDecls: [],
          methodDecls: [],
          refs: [],
          params: [],
          catches: [],
          subScopes: []
        }
        if (parentScope) parentScope.subScopes.push(scope);
        return scope;
    }
},
'visiting', {

    accept: function (node, depth, scope, path) {
        path = path || [];
        try {
            if (!this['visit' + node.type]) throw new Error("No AST visit handler for type " + node.type);
            return this['visit' + node.type](node, depth, scope, path);
        } catch (e) { show(e.stack) }
    },

    visitVariableDeclaration: function ($super, node, depth, scope, path) {
        scope.varDecls.push(node);
        scope.varDeclPaths.push(path);
        return $super(node, depth, scope, path);
    },

    visitVariableDeclarator: function (node, depth, state, path) {
        //ignore id
        var retVal;
        if (node.init) {
            retVal = this.accept(node.init, depth, state, path.concat(["init"]));
        }
        return retVal;
    },

    visitFunction: function (node, depth, scope, path) {
        var newScope = this.newScope(node, scope);
        newScope.params = node.params.clone();
        return newScope;
    },

    visitFunctionDeclaration: function ($super, node, depth, scope, path) {
        scope.funcDecls.push(node);
        var newScope = this.visitFunction(node, depth, scope, path);

        // don't visit id and params
        var retVal;
        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                retVal = this.accept(ea, depth, newScope, path.concat(["defaults", i]));
            }, this);
        }
        if (node.rest) {
            retVal = this.accept(node.rest, depth, newScope, path.concat(["rest"]));
        }
        retVal = this.accept(node.body, depth, newScope, path.concat(["body"]));
        return retVal;
    },

    visitFunctionExpression: function ($super, node, depth, scope, path) {
        var newScope = this.visitFunction(node, depth, scope, path);

        // don't visit id and params
        var retVal;
        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                retVal = this.accept(ea, depth, newScope, path.concat(["defaults", i]));
            }, this);
        }

        if (node.rest) {
            retVal = this.accept(node.rest, depth, newScope, path.concat(["rest"]));
        }
        retVal = this.accept(node.body, depth, newScope, path.concat(["body"]));
        return retVal;

    },

    visitArrowFunctionExpression: function($super, node, depth, scope, path) {
        var newScope = this.visitFunction(node, depth, scope, path);

        var retVal;
        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                retVal = this.accept(ea, depth, newScope, path.concat(["defaults", i]));
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            retVal = this.accept(node.rest, depth, newScope, path.concat(["rest"]));
        }

        // body is a node of type BlockStatement
        retVal = this.accept(node.body, depth, newScope, path.concat(["body"]));

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
        return retVal;
    },

    visitIdentifier: function ($super, node, depth, scope, path) {
        scope.refs.push(node);
        return $super(node, depth, scope, path);
    },

    visitMemberExpression: function (node, depth, state, path) {
        // only visit property part when prop is computed so we don't gather
        // prop ids
        var retVal;
        retVal = this.accept(node.object, depth, state, path.concat(["object"]));
        if (node.computed) {
            retVal = this.accept(node.property, depth, state, path.concat(["property"]));
        }
        return retVal;
    },

    visitObjectExpression: function (node, depth, state, path) {
        var retVal;
        node.properties.forEach(function(ea, i) {
            // ignore keys: ["properties", i, "key"]
            retVal = this.accept(ea.value, depth, state, path.concat(["properties", i, "value"]));
        }, this);
        return retVal;
    },

    visitTryStatement: function (node, depth, scope, path) {
        var retVal;
        // block is a node of type Blockscopement
        retVal = this.accept(node.block, depth, scope, path.concat(["block"]));

        if (node.handler) {
            // handler is a node of type CatchClause
            retVal = this.accept(node.handler, depth, scope, path.concat(["handler"]));
            scope.catches.push(node.handler.param);
        }

        node.guardedHandlers && node.guardedHandlers.forEach(function(ea, i) {
            retVal = this.accept(ea, depth, scope, path.concat(["guardedHandlers", i]));
        }, this);

        if (node.finalizer) {
            retVal = this.accept(node.finalizer, depth, scope, path.concat(["finalizer"]));
        }
        return retVal;
    },

    visitLabeledStatement: function (node, depth, state, path) {
        var retVal;
        // ignore label
        retVal = this.accept(node.body, depth, state, path.concat(["body"]));
        return retVal;
    },


    visitClassDeclaration: function(node, depth, scope, path) {
        scope.classDecls.push(node);

        var retVal;
        // id is a node of type Identifier
        // retVal = this.accept(node.id, depth, state, path.concat(["id"]));

        if (node.superClass) {
            this.accept(node.superClass, depth, scope, path.concat(["superClass"]));
        }

        // body is a node of type ClassBody
        retVal = this.accept(node.body, depth, scope, path.concat(["body"]));
        return retVal;
    },

    visitMethodDefinition: function(node, depth, scope, path) {
        var retVal;

        // don't visit key Identifier for now
        // retVal = this.accept(node.key, depth, scope, path.concat(["key"]));

        // value is a node of type FunctionExpression
        retVal = this.accept(node.value, depth, scope, path.concat(["value"]));
        return retVal;
    }
});

Object.extend(lively.ast.acorn, {

    withMozillaAstDo: function(ast, state, func) {
        // simple interface to mozilla AST visitor. function gets passed three
        // arguments:
        // acceptNext, -- continue visiting
        // node, -- current node being visited
        // state -- state variable that is passed along
        var vis = new lively.ast.MozillaAST.BaseVisitor(),
            origAccept = vis.accept;
        vis.accept = function(node, depth, st, path) {
            var next = function() { origAccept.call(vis, node, depth, st, path); }
            return func(next, node, st, depth, path);
        }
        return vis.accept(ast, 0, state, []);
    },

    printAst: function(astOrSource, options) {
        options = options || {};
        var printSource = options.printSource || false,
            printPositions = options.printPositions || false,
            printIndex = options.printIndex || false,
            source, ast, tree = [];

        if (Object.isString(astOrSource)) {
            source = astOrSource;
            ast = lively.ast.acorn.parse(astOrSource);
        } else { ast = astOrSource; source = options.source || ast.source; }

        if (printSource && !ast.source) { // ensure that nodes have source attached
            if (!source) {
                source = escodegen.generate(ast);
                ast = lively.ast.acorn.parse(source);
            }
            acorn.walk.addSource(ast, source);
        }

        function printFunc(ea) {
            var string = ea.path + ':' + ea.node.type, additional = [];
            if (printIndex) { additional.push(ea.index); }
            if (printPositions) { additional.push(ea.node.start + '-' + ea.node.end); }
            if (printSource) {
                var src = ea.node.source || source.slice(ea.node.start, ea.node.end),
                    printed = Strings.print(src.truncate(60).replace(/\n/g, '').replace(/\s+/g, ' '));
                additional.push(printed);
            }
            if (additional.length) { string += '(' + additional.join(',') + ')'; }
            return string;
        }

        new lively.ast.PrinterVisitor().accept(ast, {index: 0}, tree, []);
        return Strings.printTree(tree[0], printFunc, function(ea) { return ea.children; }, '    ');
    },

    compareAst: function(node1, node2) {
        if (!node1 || !node2) throw new Error('node' + (node1 ? '1' : '2') + ' not defined');
        var state = {completePath: [], comparisons: {errors: []}};
        new lively.ast.ComparisonVisitor().accept(node1, node2, state, []);
        return !state.comparisons.errors.length ? null : state.comparisons.errors.pluck('msg');
    },

    pathToNode: function(ast, index, options) {
        options = options || {};
        if (!ast.astIndex) acorn.walk.addAstIndex(ast);
        var vis = new lively.ast.MozillaAST.BaseVisitor(), found = null;
        (vis.accept = function (node, pathToHere, state, path) {
            if (found) return;
            var fullPath = pathToHere.concat(path);
            if (node.astIndex === index) {
                var pathString = fullPath
                    .map(function(ea) { return typeof ea === 'string' ? '.' + ea : '[' + ea + ']'})
                    .join('');
                found = {pathString: pathString, path: fullPath, node: node};
            }
            return this['visit' + node.type](node, fullPath, state, path);
        }).call(vis,ast, [], {}, []);
        return found;
    },

    rematchAstWithSource: function(ast, source, addLocations, subTreePath) {
        addLocations = !!addLocations;
        var ast2 = lively.ast.acorn.parse(source, addLocations ? { locations: true } : undefined),
            visitor = new lively.ast.MozillaAST.BaseVisitor();
        if (subTreePath) ast2 = lively.PropertyPath(subTreePath).get(ast2);

        visitor.accept = function(node, depth, state, path) {
            path = path || [];
            var node2 = path.reduce(function(node, pathElem) {
                return node[pathElem];
            }, ast);
            node2.start = node.start;
            node2.end = node.end;
            if (addLocations) node2.loc = node.loc;
            return this['visit' + node.type](node, depth, state, path);
        }

        visitor.accept(ast2);
    },

    stringify: function(ast, options) {
        return escodegen.generate(ast, options)
    }

});

(function extendAcornWalk() {

    acorn.walk.findNodeByAstIndex = function(ast, astIndexToFind, addIndex) {
        addIndex = addIndex == null ? true : !!addIndex;
        if (!ast.astIndex && addIndex) acorn.walk.addAstIndex(ast);
        // we need to visit every node, acorn.walk.forEachNode is highly
        // inefficient, the compilled Mozilla visitors are a better fit
        var found = null;
        lively.ast.acorn.withMozillaAstDo(ast, null, function(next, node, state) {
            if (found) return;
            var idx = node.astIndex;
            if (idx < astIndexToFind) return;
            if (node.astIndex === astIndexToFind) { found = node; return; }
            next();
        });
        return found;
    };
    // FIXME: global (and temporary) findNodeByAstIndex is used by __getClosure and defined in Rewriting.js
    Global.findNodeByAstIndex = acorn.walk.findNodeByAstIndex;

    acorn.walk.findStatementOfNode = function(options, ast, target) {
        // Can also be called with just ast and target. options can be {asPath: BOOLEAN}.
        // Find the statement that a target node is in. Example:
        // let source be "var x = 1; x + 1;" and we are looking for the
        // Identifier "x" in "x+1;". The second statement is what will be found.
        if (!target) { target = ast; ast = options; options = null }
        if (!options) options = {}
        if (!ast.astIndex) acorn.walk.addAstIndex(ast);
        var found, targetReached = false, bodyNodes, lastStatement;
        lively.ast.acorn.withMozillaAstDo(ast, {}, function(next, node, depth, state, path) {
            if (targetReached || node.astIndex < target.astIndex) return;
            if (node.type === "Program" || node.type === "BlockStatement") {
                bodyNodes = node.body;
            } else if (node.type === "SwitchCase") {
                bodyNodes = node.consequent;
            }
            if (bodyNodes) {
                var nodeIdxInProgramNode = bodyNodes.indexOf(node);
                if (nodeIdxInProgramNode > -1) lastStatement = node;
            }
            if (!targetReached && (node === target || node.astIndex === target.astIndex)) {
                targetReached = true; found = options.asPath ? path : lastStatement;
            }
            !targetReached && next();
        });
        return found;
    };

    acorn.walk.addAstIndex = function(ast) {
        // we need to visit every node, acorn.walk.forEachNode is highly
        // inefficient, the compilled Mozilla visitors are a better fit
        lively.ast.acorn.withMozillaAstDo(ast, {index: 0}, function(next, node, state) {
            next(); node.astIndex = state.index++;
        });
        return ast;
    };


})();

(function setupASTHelper() {
    lively.ast.query = {};
    lively.ast.transform = {};
})();

Object.extend(lively.ast.query, {

    knownGlobals: [
       "true", "false", "null", "undefined", "arguments",
       "Object", "Function", "String", "Array", "Date", "Boolean", "Number", "RegExp",
       "Error", "EvalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError",
       "Math", "NaN", "Infinity", "Intl", "JSON",
       "parseFloat", "parseInt", "isNaN", "isFinite", "eval", "alert",
       "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",
       "window", "document", "console",
       "Node", "HTMLCanvasElement", "Image", "Class",
       "Global", "Functions", "Objects", "Strings",
       "module", "lively", "pt", "rect", "rgb", "$super", "$morph", "$world", "show"],

    scopes: function(ast) {
        var vis = new lively.ast.ScopeVisitor();
        var scope = vis.newScope(ast, null);
        vis.accept(ast, 0, scope, []);
        return scope;
    },

    nodesAtIndex: function(ast, index) {
      return lively.ast.acorn.withMozillaAstDo(ast, [], function(next, node, found) {
        if (node.start <= index && index <= node.end) { found.push(node); next(); }
        return found;
      });
    },

    scopesAtIndex: function(ast, index) {
      return lively.lang.tree.filter(
        lively.ast.query.scopes(ast),
        function(scope) {
          var n = scope.node;
          if (n.type === 'FunctionDeclaration') n = n.body;
          return n.start <= index && index <= n.end;
        },
        function(s) { return s.subScopes; });
    },

    scopeAtIndex: function(ast, index) {
      return lively.ast.query.scopesAtIndex(ast, index).last();
    },

    scopesAtPos: function(pos, ast) {
        // DEPRECATED
        // FIXME "scopes" should actually not referer to a node but to a scope
        // object, see lively.ast.query.scopes!
        return lively.ast.acorn.nodesAt(pos, ast).filter(function(node) {
            return node.type === 'Program'
                || node.type === 'FunctionDeclaration'
                || node.type === 'FunctionExpression'
        });
    },

    nodesInScopeOf: function(node) {
        // DEPRECATED
        // FIXME "scopes" should actually not referer to a node but to a scope
        // object, see lively.ast.query.scopes!
        return lively.ast.acorn.withMozillaAstDo(node, {root: node, result: []}, function(next, node, state) {
            state.result.push(node);
            if (node !== state.root
            && (node.type === 'Program'
             || node.type === 'FunctionDeclaration'
             || node.type === 'FunctionExpression')) return state;
            next();
            return state;
        }).result;
    },

    topLevelDeclsAndRefs: function(ast, options) {
        if (typeof ast === "string") ast = lively.ast.acorn.parse(ast, {withComments: true});

        var scope         = lively.ast.query.scopes(ast),
            useComments   = options && !!options.jslintGlobalComment,
            declared      = declaredVarNames(scope),
            refs          = scope.refs.concat(scope.subScopes.map(findUndeclaredReferences).flatten()),
            undeclared    = refs.pluck('name').withoutAll(declared);

        return {
            scope:           scope,
            varDecls:        scope.varDecls,
            funcDecls:       scope.funcDecls,
            declaredNames:   declared,
            undeclaredNames: undeclared,
            refs:            refs
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function declaredVarNames(scope) {
            return [scope.node.id && scope.node.id.name]
                .concat(scope.funcDecls.pluck('id').pluck('name')).compact()
                .concat(scope.params.pluck('name'))
                .concat(scope.catches.pluck('name'))
                .concat(scope.varDecls.pluck('declarations').flatten().pluck('id').pluck('name'))
                .concat(scope.classDecls.pluck('id').pluck('name'))
                .concat(!useComments ? [] :
                    findJsLintGlobalDeclarations(
                        scope.node.type === 'Program' ?
                            scope.node : scope.node.body));
        }

        function findUndeclaredReferences(scope) {
            var names = declaredVarNames(scope);
            return scope.subScopes
                .map(findUndeclaredReferences)
                .reduce(function(refs, ea) { return refs.concat(ea); }, scope.refs)
                .filter(function(ref) { return names.indexOf(ref.name) === -1; });
        }

        function findJsLintGlobalDeclarations(node) {
            if (!node || !node.comments) return [];
            return node.comments
                .filter(function(ea) { return ea.text.trim().startsWith('global') })
                .map(function(ea) {
                    return ea.text.replace(/^\s*global\s*/, '').split(',').invoke('trim');
                }).flatten();
        }

    },

    findGlobalVarRefs: function(ast, options) {
        var q = lively.ast.query,
            topLevel = q.topLevelDeclsAndRefs(ast, options),
            noGlobals = topLevel.declaredNames.concat(q.knownGlobals);
        return topLevel.refs.filter(function(ea) {
            return noGlobals.indexOf(ea.name) === -1; })
    },

    findNodesIncludingLines: function(ast, code, lines, options) {
      if (!code && !ast) throw new Error("Need at least ast or code");
      code = code ? code : lively.ast.acorn.stringify(ast);
      ast = ast && ast.loc ? ast : lively.ast.acorn.parse(code, {locations: true});
      return lively.ast.acorn.withMozillaAstDo(ast, [], function(next, node, found) {
        if (lines.every(function(line) {
          return Numbers.between(line, node.loc.start.line, node.loc.end.line); })) {
            found.pushIfNotIncluded(node); next(); }
        return found;
      });
    },

    findReferencesAndDeclsInScope: function(scope, name) {
      function varDeclIdsOf(scope) {
        return scope.params
          .concat(
            scope.funcDecls.concat(
              scope.varDecls.pluck("declarations").flatten()).pluck('id'));
      }

      var refs = lively.lang.tree.map(
        scope,
        function(scope) {
          return scope.refs.concat(varDeclIdsOf(scope))
            .filter(function(ref) { return ref.name === name; });
        },
        function(s) {
          return s.subScopes.filter(function(subScope) {
            return varDeclIdsOf(subScope)
              .every(function(id) { return  id.name !== name; })
          });
        }).flatten();

      return refs;
    },

    findDeclarationClosestToIndex: function(ast, name, index) {
      // var scopes = lively.ast
      function varDeclIdsOf(scope) {
        return scope.params
          .concat(
            scope.funcDecls.concat(
              scope.varDecls.pluck("declarations").flatten()).pluck('id'));
      }
      var found = null;
      lively.ast.query.scopesAtIndex(ast, index)
        .reverse().detect(function(scope) {
          var decls = varDeclIdsOf(scope),
              idx = decls.pluck('name').indexOf(name);
          if (idx === -1) return false;
          found = decls[idx]; return true;
      });
      return found;
    }
});

Object.extend(lively.ast.transform, {

    helper: {
        // currently this is used by the replacement functions below but
        // I don't wan't to make it part of our AST API

        _node2string: function(node) {
            return node.source || lively.ast.acorn.stringify(node)
        },

        _findIndentAt: function(string, pos) {
            var bol = Strings.peekLeft(string, pos, /\s+$/),
                indent = typeof bol === 'number' ? string.slice(bol, pos) : '';
            if (indent[0] === '\n') indent = indent.slice(1);
            return indent;
        },

        _applyChanges: function(changes, source) {
            return changes.reduce(function(source, change) {
                if (change.type === 'del') {
                    return source.slice(0, change.pos) + source.slice(change.pos + change.length);
                } else if (change.type === 'add') {
                    return source.slice(0, change.pos) + change.string + source.slice(change.pos);
                }
                throw new Error('Uexpected change ' + Objects.inspect(change));
            }, source);
        },

        _compareNodesForReplacement: function(nodeA, nodeB) {
            // equals
            if (nodeA.start === nodeB.start && nodeA.end === nodeB.end) return 0;
            // a "left" of b
            if (nodeA.end <= nodeB.start) return -1;
            // a "right" of b
            if (nodeA.start >= nodeB.end) return 1;
            // a contains b
            if (nodeA.start <= nodeB.start && nodeA.end >= nodeB.end) return 1;
            // b contains a
            if (nodeB.start <= nodeA.start && nodeB.end >= nodeA.end) return -1;
            throw new Error('Comparing nodes');
        },

        replaceNode: function(target, replacementFunc, sourceOrChanges) {
            // parameters:
            //   - target: ast node
            //   - replacementFunc that gets this node and its source snippet
            //     handed and should produce a new ast node.
            //   - sourceOrChanges: If its a string -- the source code to rewrite
            //                      If its and object -- {changes: ARRAY, source: STRING}

            var sourceChanges = typeof sourceOrChanges === 'object' ?
                sourceOrChanges : {changes: [], source: sourceOrChanges},
                insideChangedBefore = false,
                pos = sourceChanges.changes.reduce(function(pos, change) {
                    // fixup the start and end indices of target using the del/add
                    // changes already applied
                    if (pos.end < change.pos) return pos;

                    var isInFront = change.pos < pos.start;
                    insideChangedBefore = insideChangedBefore
                                       || change.pos >= pos.start && change.pos <= pos.end;

                    if (change.type === 'add') return {
                        start: isInFront ? pos.start + change.string.length : pos.start,
                        end: pos.end + change.string.length
                    };

                    if (change.type === 'del') return {
                        start: isInFront ? pos.start - change.length : pos.start,
                        end: pos.end - change.length
                    };

                    throw new Error('Cannot deal with change ' + Objects.inspect(change));
                }, {start: target.start, end: target.end});

            var helper = lively.ast.transform.helper,
                source = sourceChanges.source,
                replacement = replacementFunc(target, source.slice(pos.start, pos.end), insideChangedBefore),
                replacementSource = Object.isArray(replacement) ?
                    replacement.map(helper._node2string).join('\n' + helper._findIndentAt(source, pos.start)):
                    replacementSource = helper._node2string(replacement);

            var changes = [{type: 'del', pos: pos.start, length: pos.end - pos.start},
                           {type: 'add', pos: pos.start, string: replacementSource}];

            return {
                changes: sourceChanges.changes.concat(changes),
                source: this._applyChanges(changes, source)
            };
        },

        replaceNodes: function(targetAndReplacementFuncs, sourceOrChanges) {
            // replace multiple AST nodes, order rewriting from inside out and
            // top to bottom so that nodes to rewrite can overlap or be contained
            // in each other
            return targetAndReplacementFuncs.sort(function(a, b) {
                return lively.ast.transform.helper._compareNodesForReplacement(a.target, b.target);
            }).reduce(function(sourceChanges, ea) {
                return lively.ast.transform.helper.replaceNode(ea.target, ea.replacementFunc, sourceChanges);
            }, typeof sourceOrChanges === 'object' ?
                sourceOrChanges : {changes: [], source: sourceOrChanges});
        }

    },

    replace: function(astOrSource, targetNode, replacementFunc, options) {
        // replaces targetNode in astOrSource with what replacementFunc returns
        // (one or multiple ast nodes)
        // Example:
        // var ast = lively.ast.acorn.parse('foo.bar("hello");')
        // lively.ast.transform.replace(
        //     ast, ast.body[0].expression,
        //     function(node, source) {
        //         return {type: "CallExpression",
        //             callee: {name: node.arguments[0].value, type: "Identifier"},
        //             arguments: [{value: "world", type: "Literal"}]
        //         }
        //     });
        // => {
        //      source: "hello('world');",
        //      changes: [{pos: 0,length: 16,type: "del"},{pos: 0,string: "hello('world')",type: "add"}]
        //    }

        var ast = typeof astOrSource === 'object' ? astOrSource : null,
            source = typeof astOrSource === 'string' ?
                astOrSource : (ast.source || lively.ast.acorn.stringify(ast)),
            result = lively.ast.transform.helper.replaceNode(targetNode, replacementFunc, source);

        return result;
    },

    replaceTopLevelVarDeclAndUsageForCapturing: function(astOrSource, assignToObj, options) {
        /* replaces var and function declarations with assignment statements.
         * Example:
              lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(
                  "var x = 3, y = 2, z = 4",
                  {name: "A", type: "Identifier"}, ['z']).source;
              // => "A.x = 3; A.y = 2; z = 4"
         */

        var ignoreUndeclaredExcept = (options && options.ignoreUndeclaredExcept) || null
        var whitelist = (options && options.include) || null;
        var blacklist = (options && options.exclude) || [];
        var recordDefRanges = options && options.recordDefRanges;

        var ast = typeof astOrSource === 'object' ?
                astOrSource : lively.ast.acorn.parse(astOrSource),
            source = typeof astOrSource === 'string' ?
                astOrSource : (ast.source || lively.ast.acorn.stringify(ast)),
            topLevel = lively.ast.query.topLevelDeclsAndRefs(ast);

        if (ignoreUndeclaredExcept) {
            blacklist = topLevel.undeclaredNames
              .withoutAll(ignoreUndeclaredExcept)
              .concat(blacklist);
        }

        // 1. find those var declarations that should not be rewritten. we
        // currently ignore var declarations in for loops and the error parameter
        // declaration in catch clauses
        var scope = topLevel.scope;
        blacklist.pushAll(scope.catches.pluck("name"));
        var forLoopDecls = scope.varDecls.filter(function(decl, i) {
            var path = lively.PropertyPath(scope.varDeclPaths[i]),
                parent = path.slice(0,-1).get(ast);
            return parent.type === "ForStatement";
        });
        blacklist.pushAll(forLoopDecls.pluck("declarations").flatten().pluck("id").pluck("name"));

        // 2. make all references declared in the toplevel scope into property
        // reads of assignToObj
        // Example "var foo = 3; 99 + foo;" -> "var foo = 3; 99 + Global.foo;"
        var result = lively.ast.transform.helper.replaceNodes(
            topLevel.refs
                .filter(shouldRefBeCaptured)
                .map(function(ref) {
                  return {
                    target: ref,
                    replacementFunc: function(ref) { return member(ref, assignToObj); }
                  };
                }), source);

        // 3. turn var declarations into assignments to assignToObj
        // Example: "var foo = 3; 99 + foo;" -> "Global.foo = 3; 99 + foo;"
        result = lively.ast.transform.helper.replaceNodes(
            topLevel.varDecls.withoutAll(forLoopDecls)
                .map(function(decl) {
                    return {
                        target: decl,
                        replacementFunc: function(declNode, s, wasChanged) {
                            if (wasChanged) {
                                var scopes = lively.ast.query.scopes(lively.ast.acorn.parse(s, {addSource: true}));
                                declNode = scopes.varDecls[0]
                            }

                            return declNode.declarations.map(function(ea) {
                                var init = {
                                  operator: "||",
                                  type: "LogicalExpression",
                                  left: {computed: true, object: assignToObj,property: {type: "Literal", value: ea.id.name},type: "MemberExpression"},
                                  right: {name: "undefined", type: "Identifier"}
                                }
                                return shouldDeclBeCaptured(ea) ?
                                    assign(ea.id, ea.init || init) : varDecl(ea); });
                        }
                    }
                }), result);

        // 4. assignments for function declarations in the top level scope are
        // put in front of everything else:
        // "return bar(); function bar() { return 23 }" -> "Global.bar = bar; return bar(); function bar() { return 23 }"
        if (topLevel.funcDecls.length) {
            var globalFuncs = topLevel.funcDecls
                .filter(shouldDeclBeCaptured)
                .map(function(decl) {
                    var funcId = {type: "Identifier", name: decl.id.name};
                    return lively.ast.acorn.stringify(assign(funcId, funcId));
                }).join('\n');


            var change = {type: 'add', pos: 0, string: globalFuncs};
            result = {
                source: globalFuncs + '\n' + result.source,
                changes: result.changes.concat([change])
            }
        }

        // 5. def ranges so that we know at which source code positions the
        // definitions are
        if (recordDefRanges)
            result.defRanges = scope.varDecls
                .pluck("declarations").flatten()
                .concat(scope.funcDecls)
                .reduce(function(defs, decl) {
                    if (!defs[decl.id.name]) defs[decl.id.name] = []
                    defs[decl.id.name].push({type: decl.type, start: decl.start, end: decl.end});
                    return defs;
                }, {});

        return result;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function shouldRefBeCaptured(ref) {
            return blacklist.indexOf(ref.name) === -1
                && (!whitelist || whitelist.indexOf(ref.name) > -1);
        }

        function shouldDeclBeCaptured(decl) { return shouldRefBeCaptured(decl.id); }

        function assign(id, value) {
            return {
              type: "ExpressionStatement", expression: {
                type: "AssignmentExpression", operator: "=",
                right: value || {type: "Identifier", name: 'undefined'},
                left: {
                    type: "MemberExpression", computed: false,
                    object: assignToObj, property: id
                }
              }
            }
        }

        function varDecl(declarator) {
            return {
              declarations: [declarator],
              kind: "var", type: "VariableDeclaration"
            }
        }

        function member(prop, obj) {
            return {
                type: "MemberExpression", computed: false,
                object: obj, property: prop
            }
        }
    },

    oneDeclaratorPerVarDecl: function(astOrSource) {
        // lively.ast.transform.oneDeclaratorPerVarDecl(
        //    "var x = 3, y = (function() { var y = 3, x = 2; })(); ").source

        var ast = typeof astOrSource === 'object' ?
                astOrSource : lively.ast.acorn.parse(astOrSource),
            source = typeof astOrSource === 'string' ?
                astOrSource : (ast.source || lively.ast.acorn.stringify(ast)),
            scope = lively.ast.query.scopes(ast),
            varDecls = (function findVarDecls(scope) {
                return scope.varDecls
                    .concat(scope.subScopes.map(findVarDecls))
                    .flatten();
            })(scope);

        var targetsAndReplacements = varDecls.map(function(decl) {
            return {
                target: decl,
                replacementFunc: function(declNode, s, wasChanged) {
                    if (wasChanged) {
                        // reparse node if necessary, e.g. if init was changed before like in
                        // var x = (function() { var y = ... })();
                        declNode = lively.ast.acorn.parse(s).body[0];
                    }

                    return declNode.declarations.map(function(ea) {
                        return {
                            type: "VariableDeclaration",
                            kind: "var", declarations: [ea]
                        }
                    });
                }
            }
        });

        return lively.ast.transform.helper.replaceNodes(targetsAndReplacements, source);
    },

    returnLastStatement: function(source, opts) {
        opts = opts || {};
        var parse = lively.ast.acorn.parse,
            ast = parse(source, {ecmaVersion: 6}),
            last = ast.body.pop(),
            newLastsource = 'return ' + source.slice(last.start, last.end);
        if (!opts.asAST) return source.slice(0, last.start) + newLastsource;
        
        var newLast = parse(newLastsource, {allowReturnOutsideFunction: true, ecmaVersion: 6}).body.slice(-1)[0];
        ast.body.push(newLast);
        ast.end += 'return '.length;
        return ast;
    },

    wrapInFunction: function(code, opts) {
        opts = opts || {};
        var transformed = lively.ast.transform.returnLastStatement(code, opts);
        return opts.asAST ?  {
          type: "Program",
          body: [{
            type: "ExpressionStatement",
            expression: {
              body: {body: transformed.body, type: "BlockStatement"},
              params: [],
              type: "FunctionExpression"
            },
          }]
        } : "function() {\n" + transformed + "\n}";
    }
});

(function extendLivelyAst() {
  ["withMozillaAstDo","printAst","compareAst","pathToNode","rematchAstWithSource","stringify","parse","parseFunction","parseLikeOMeta","fuzzyParse","nodesAt"].forEach(function(k) {
    lively.ast[k] = lively.ast.acorn[k];
  });
})();

}) // end of module
