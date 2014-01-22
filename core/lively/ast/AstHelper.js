module('lively.AST.AstHelper').requires("lively.ast.acorn").toRun(function() {

Object.subclass("lively.ast.MozillaAST.AstPrinter",
// This code was generated with:
// lively.ast.MozillaAST.createVisitorCode({pathAsParameter: true, asLivelyClass: true, parameters: ["depth","state"], name: "lively.ast.MozillaAST.AstPrinter"});
"visiting", {
    accept: function(node, depth, state, path) {
        if (!node || !node.type) debugger;
        return this['visit' + node.type](node, depth, state, path);
    },

    visitProgram: function(node, depth, state, path) {
        node.body.forEach(function(ea, i) {
            // ea is of type Statement
            this.accept(ea, depth, state, ["body", i]);
        }, this);
    },

    visitFunction: function(node, depth, state, path) {
        if (node.id) {
            // id is a node of type Identifier
            this.accept(node.id, depth, state, ["id"]);
        }

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i]);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i]);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"]);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"]);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitStatement: function(node, depth, state, path) {
    },

    visitEmptyStatement: function(node, depth, state, path) {
    },

    visitBlockStatement: function(node, depth, state, path) {
        node.body.forEach(function(ea, i) {
            // ea is of type Statement
            this.accept(ea, depth, state, ["body", i]);
        }, this);
    },

    visitExpressionStatement: function(node, depth, state, path) {
        // expression is a node of type Expression
        this.accept(node.expression, depth, state, ["expression"]);
    },

    visitIfStatement: function(node, depth, state, path) {
        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"]);

        // consequent is a node of type Statement
        this.accept(node.consequent, depth, state, ["consequent"]);

        if (node.alternate) {
            // alternate is a node of type Statement
            this.accept(node.alternate, depth, state, ["alternate"]);
        }
    },

    visitLabeledStatement: function(node, depth, state, path) {
        // label is a node of type Identifier
        this.accept(node.label, depth, state, ["label"]);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);
    },

    visitBreakStatement: function(node, depth, state, path) {
        if (node.label) {
            // label is a node of type Identifier
            this.accept(node.label, depth, state, ["label"]);
        }
    },

    visitContinueStatement: function(node, depth, state, path) {
        if (node.label) {
            // label is a node of type Identifier
            this.accept(node.label, depth, state, ["label"]);
        }
    },

    visitWithStatement: function(node, depth, state, path) {
        // object is a node of type Expression
        this.accept(node.object, depth, state, ["object"]);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);
    },

    visitSwitchStatement: function(node, depth, state, path) {
        // discriminant is a node of type Expression
        this.accept(node.discriminant, depth, state, ["discriminant"]);

        node.cases.forEach(function(ea, i) {
            // ea is of type SwitchCase
            this.accept(ea, depth, state, ["cases", i]);
        }, this);

        // node.lexical has a specific type that is boolean
        if (node.lexical) {/*do stuff*/}
    },

    visitReturnStatement: function(node, depth, state, path) {
        if (node.argument) {
            // argument is a node of type Expression
            this.accept(node.argument, depth, state, ["argument"]);
        }
    },

    visitThrowStatement: function(node, depth, state, path) {
        // argument is a node of type Expression
        this.accept(node.argument, depth, state, ["argument"]);
    },

    visitTryStatement: function(node, depth, state, path) {
        // block is a node of type BlockStatement
        this.accept(node.block, depth, state, ["block"]);

        if (node.handler) {
            // handler is a node of type CatchClause
            this.accept(node.handler, depth, state, ["handler"]);
        }

        node.guardedHandlers.forEach(function(ea, i) {
            // ea is of type CatchClause
            this.accept(ea, depth, state, ["guardedHandlers", i]);
        }, this);

        if (node.finalizer) {
            // finalizer is a node of type BlockStatement
            this.accept(node.finalizer, depth, state, ["finalizer"]);
        }
    },

    visitWhileStatement: function(node, depth, state, path) {
        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"]);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);
    },

    visitDoWhileStatement: function(node, depth, state, path) {
        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);

        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"]);
    },

    visitForStatement: function(node, depth, state, path) {
        if (node.init) {
            // init is a node of type VariableDeclaration
            this.accept(node.init, depth, state, ["init"]);
        }

        if (node.test) {
            // test is a node of type Expression
            this.accept(node.test, depth, state, ["test"]);
        }

        if (node.update) {
            // update is a node of type Expression
            this.accept(node.update, depth, state, ["update"]);
        }

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);
    },

    visitForInStatement: function(node, depth, state, path) {
        // left is a node of type VariableDeclaration
        this.accept(node.left, depth, state, ["left"]);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"]);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);

        // node.each has a specific type that is boolean
        if (node.each) {/*do stuff*/}
    },

    visitForOfStatement: function(node, depth, state, path) {
        // left is a node of type VariableDeclaration
        this.accept(node.left, depth, state, ["left"]);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"]);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);
    },

    visitLetStatement: function(node, depth, state, path) {
        node.head.forEach(function(ea, i) {
            // ea.id is of type node
            this.accept(ea.id, depth, state, ["head", i, "id"]);
            if (ea.init) {
                // ea.init can be of type node
                this.accept(ea.init, depth, state, ["head", i, "init"]);
            }
        }, this);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"]);
    },

    visitDebuggerStatement: function(node, depth, state, path) {
    },

    visitDeclaration: function(node, depth, state, path) {
    },

    visitFunctionDeclaration: function(node, depth, state, path) {
        // id is a node of type Identifier
        this.accept(node.id, depth, state, ["id"]);

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i]);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i]);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"]);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"]);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitVariableDeclaration: function(node, depth, state, path) {
        node.declarations.forEach(function(ea, i) {
            // ea is of type VariableDeclarator
            this.accept(ea, depth, state, ["declarations", i]);
        }, this);

        // node.kind is "var" or "let" or "const"
    },

    visitVariableDeclarator: function(node, depth, state, path) {
        // id is a node of type Pattern
        this.accept(node.id, depth, state, ["id"]);

        if (node.init) {
            // init is a node of type Expression
            this.accept(node.init, depth, state, ["init"]);
        }
    },

    visitExpression: function(node, depth, state, path) {
    },

    visitThisExpression: function(node, depth, state, path) {
    },

    visitArrayExpression: function(node, depth, state, path) {
        node.elements.forEach(function(ea, i) {
            if (ea) {
                // ea can be of type Expression or 
                this.accept(ea, depth, state, ["elements", i]);
            }
        }, this);
    },

    visitObjectExpression: function(node, depth, state, path) {
        node.properties.forEach(function(ea, i) {
            // ea.key is of type node
            this.accept(ea.key, depth, state, ["properties", i, "key"]);
            // ea.value is of type node
            this.accept(ea.value, depth, state, ["properties", i, "value"]);
            // ea.kind is "init" or "get" or "set"
        }, this);
    },

    visitFunctionExpression: function(node, depth, state, path) {
        if (node.id) {
            // id is a node of type Identifier
            this.accept(node.id, depth, state, ["id"]);
        }

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i]);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i]);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"]);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"]);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitArrowExpression: function(node, depth, state, path) {
        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i]);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i]);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"]);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"]);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitSequenceExpression: function(node, depth, state, path) {
        node.expressions.forEach(function(ea, i) {
            // ea is of type Expression
            this.accept(ea, depth, state, ["expressions", i]);
        }, this);
    },

    visitUnaryExpression: function(node, depth, state, path) {
        // node.operator is an UnaryOperator enum:
        // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"

        // node.prefix has a specific type that is boolean
        if (node.prefix) {/*do stuff*/}

        // argument is a node of type Expression
        this.accept(node.argument, depth, state, ["argument"]);
    },

    visitBinaryExpression: function(node, depth, state, path) {
        // node.operator is an BinaryOperator enum:
        // "==" | "!=" | "===" | "!==" | | "<" | "<=" | ">" | ">=" | | "<<" | ">>" | ">>>" | | "+" | "-" | "*" | "/" | "%" | | "|" | "^" | "&" | "in" | | "instanceof" | ".."

        // left is a node of type Expression
        this.accept(node.left, depth, state, ["left"]);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"]);
    },

    visitAssignmentExpression: function(node, depth, state, path) {
        // node.operator is an AssignmentOperator enum:
        // "=" | "+=" | "-=" | "*=" | "/=" | "%=" | | "<<=" | ">>=" | ">>>=" | | "|=" | "^=" | "&="

        // left is a node of type Expression
        this.accept(node.left, depth, state, ["left"]);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"]);
    },

    visitUpdateExpression: function(node, depth, state, path) {
        // node.operator is an UpdateOperator enum:
        // "++" | "--"

        // argument is a node of type Expression
        this.accept(node.argument, depth, state, ["argument"]);

        // node.prefix has a specific type that is boolean
        if (node.prefix) {/*do stuff*/}
    },

    visitLogicalExpression: function(node, depth, state, path) {
        // node.operator is an LogicalOperator enum:
        // "||" | "&&"

        // left is a node of type Expression
        this.accept(node.left, depth, state, ["left"]);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"]);
    },

    visitConditionalExpression: function(node, depth, state, path) {
        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"]);

        // alternate is a node of type Expression
        this.accept(node.alternate, depth, state, ["alternate"]);

        // consequent is a node of type Expression
        this.accept(node.consequent, depth, state, ["consequent"]);
    },

    visitNewExpression: function(node, depth, state, path) {
        // callee is a node of type Expression
        this.accept(node.callee, depth, state, ["callee"]);

        node.arguments.forEach(function(ea, i) {
            // ea is of type Expression
            this.accept(ea, depth, state, ["arguments", i]);
        }, this);
    },

    visitCallExpression: function(node, depth, state, path) {
        // callee is a node of type Expression
        this.accept(node.callee, depth, state, ["callee"]);

        node.arguments.forEach(function(ea, i) {
            // ea is of type Expression
            this.accept(ea, depth, state, ["arguments", i]);
        }, this);
    },

    visitMemberExpression: function(node, depth, state, path) {
        // object is a node of type Expression
        this.accept(node.object, depth, state, ["object"]);

        // property is a node of type Identifier
        this.accept(node.property, depth, state, ["property"]);

        // node.computed has a specific type that is boolean
        if (node.computed) {/*do stuff*/}
    },

    visitYieldExpression: function(node, depth, state, path) {
        if (node.argument) {
            // argument is a node of type Expression
            this.accept(node.argument, depth, state, ["argument"]);
        }
    },

    visitComprehensionExpression: function(node, depth, state, path) {
        // body is a node of type Expression
        this.accept(node.body, depth, state, ["body"]);

        node.blocks.forEach(function(ea, i) {
            // ea is of type ComprehensionBlock
            this.accept(ea, depth, state, ["blocks", i]);
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            this.accept(node.filter, depth, state, ["filter"]);
        }
    },

    visitGeneratorExpression: function(node, depth, state, path) {
        // body is a node of type Expression
        this.accept(node.body, depth, state, ["body"]);

        node.blocks.forEach(function(ea, i) {
            // ea is of type ComprehensionBlock
            this.accept(ea, depth, state, ["blocks", i]);
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            this.accept(node.filter, depth, state, ["filter"]);
        }
    },

    visitLetExpression: function(node, depth, state, path) {
        node.head.forEach(function(ea, i) {
            // ea.id is of type node
            this.accept(ea.id, depth, state, ["head", i, "id"]);
            if (ea.init) {
                // ea.init can be of type node
                this.accept(ea.init, depth, state, ["head", i, "init"]);
            }
        }, this);

        // body is a node of type Expression
        this.accept(node.body, depth, state, ["body"]);
    },

    visitPattern: function(node, depth, state, path) {
    },

    visitObjectPattern: function(node, depth, state, path) {
        node.properties.forEach(function(ea, i) {
            // ea.key is of type node
            this.accept(ea.key, depth, state, ["properties", i, "key"]);
            // ea.value is of type node
            this.accept(ea.value, depth, state, ["properties", i, "value"]);
        }, this);
    },

    visitArrayPattern: function(node, depth, state, path) {
        node.elements.forEach(function(ea, i) {
            if (ea) {
                // ea can be of type Pattern or 
                this.accept(ea, depth, state, ["elements", i]);
            }
        }, this);
    },

    visitSwitchCase: function(node, depth, state, path) {
        if (node.test) {
            // test is a node of type Expression
            this.accept(node.test, depth, state, ["test"]);
        }

        node.consequent.forEach(function(ea, i) {
            // ea is of type Statement
            this.accept(ea, depth, state, ["consequent", i]);
        }, this);
    },

    visitCatchClause: function(node, depth, state, path) {
        // param is a node of type Pattern
        this.accept(node.param, depth, state, ["param"]);

        if (node.guard) {
            // guard is a node of type Expression
            this.accept(node.guard, depth, state, ["guard"]);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"]);
    },

    visitComprehensionBlock: function(node, depth, state, path) {
        // left is a node of type Pattern
        this.accept(node.left, depth, state, ["left"]);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"]);

        // node.each has a specific type that is boolean
        if (node.each) {/*do stuff*/}
    },

    visitIdentifier: function(node, depth, state, path) {
        // node.name has a specific type that is string
    },

    visitLiteral: function(node, depth, state, path) {
        if (node.value) {
            // node.value has a specific type that is string or boolean or number or RegExp
        }
    }
});

lively.ast.MozillaAST.AstPrinter.subclass('lively.ast.MozillaAST.ASTPrinter', {

    accept: function($super, node, depth, tree, path) {
        var pathString = path
            .map(function(ea) { return typeof ea === 'string' ? '.' + ea : '[' + ea + ']'})
            .join('')
        var treeEntry = {type: pathString + ':' + node.type, children: []};
        tree.push(treeEntry);
        var res = $super(node, depth+1, treeEntry.children, path);
        return res;
    }

});

Object.extend(lively.ast.acorn, {

    printAst: function(astOrSource) {
        var ast = Object.isString(astOrSource) ?
            lively.ast.acorn.parse(astOrSource) : astOrSource,
            tree = [];
        new lively.ast.MozillaAST.ASTPrinter().accept(ast, 0, tree, []);
        return Strings.printTree(tree[0],
            function(ea) { return ea.type; },
            function(ea) { return ea.children; }, '    ');
    }

});

}) // end of module
