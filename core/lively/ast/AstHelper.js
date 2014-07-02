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

        node.guardedHandlers.forEach(function(ea, i) {
            // ea is of type CatchClause
            retVal = this.accept(ea, depth, state, path.concat(["guardedHandlers", i]));
        }, this);

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
    }
});

lively.ast.MozillaAST.BaseVisitor.subclass("lively.ast.ScopeVisitor",
'scope specific', {
    newScope: function(scopeNode, parentScope) {
        var scope = {node: scopeNode, varDecls: [], funcDecls: [], refs: [], params: [], subScopes: []}
        if (parentScope) parentScope.subScopes.push(scope);
        return scope;
    }
},
'visiting', {

    accept: function (node, depth, scope, path) {
        path = path || [];
        return this['visit' + node.type](node, depth, scope, path);
    },

    visitVariableDeclaration: function ($super, node, depth, scope, path) {
        scope.varDecls.push(node);
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

    acorn.walk.findStatementOfNode = function(ast, target) {
        // find the statement that a target node is in. Example:
        // let source be "var x = 1; x + 1;" and we are looking for the
        // Identifier "x" in "x+1;". The second statement is what will be found.
        if (!ast.astIndex) acorn.walk.addAstIndex(ast);
        var found, targetReached = false, bodyNode, lastStatement;
        lively.ast.acorn.withMozillaAstDo(ast, {}, function(next, node, _) {
            if (targetReached || node.astIndex < target.astIndex) return;
            if (node.type === "Program" || node.type === "BlockStatement") {
                bodyNode = node;
            }
            if (bodyNode) {
                var nodeIdxInProgramNode = bodyNode.body.indexOf(node);
                if (nodeIdxInProgramNode > -1) lastStatement = node;
            }
            if (!targetReached && (node === target || node.astIndex === target.astIndex)) {
                targetReached = true; found = lastStatement;
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

    scopes: function(ast) {
        var vis = new lively.ast.ScopeVisitor();
        var scope = vis.newScope(ast, null);
        vis.accept(ast, 0, scope, []);
        return scope;
    },

    scopesAtPos: function(pos, ast) {
        return lively.ast.acorn.nodesAt(pos, ast).filter(function(node) {
            return node.type === 'Program'
                || node.type === 'FunctionDeclaration'
                || node.type === 'FunctionExpression'
        });
    },

    nodesInScopeOf: function(node) {
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

    topLevelDecls: function(ast) {
        var scope = lively.ast.query.scopes(ast);
        return scope.varDecls.concat(scope.funcDecls);
    }

});

Object.extend(lively.ast.transform, {

    replaceNode: function(ast, targetNode, transformedNode, options) {
        var source = options && options.source ? options.source : lively.ast.acorn.stringify(ast),
            newSourceOfReplacement = transformedNode.source
                                  || lively.ast.acorn.stringify(transformedNode),
            newSource = source.slice(0, targetNode.start)
                      + newSourceOfReplacement
                      + source.slice(targetNode.end);
        return {
            ast: lively.ast.acorn.parse(newSource),
            source: newSource,
            diff: {
                removed: {from: targetNode.start, to: targetNode.end},
                added: {
                    from: targetNode.start,
                    to: targetNode.start + newSourceOfReplacement.length
                }
            }
        };
    },

    replaceNodeWithMany: function(ast, targetNode, replacementNodes, options) {
        var source = options && options.source ? options.source : lively.ast.acorn.stringify(ast);
        var bol = Strings.peekLeft(source, targetNode.start, /\s+$/),
            indent = typeof bol === 'number' ? source.slice(bol, targetNode.start) : '';
        if (indent[0] === '\n') indent = indent.slice(1);

        var newSourceOfReplacements = replacementNodes.map(function(ea) {
            return ea.source || lively.ast.acorn.stringify(ea);
        }).join('\n' + indent);

        var newSource = source.slice(0, targetNode.start)
                      + newSourceOfReplacements
                      + source.slice(targetNode.end)

        return {
            ast: lively.ast.acorn.parse(newSource),
            source: newSource,
            diff: {
                removed: {from: targetNode.start, to: targetNode.end},
                added: {
                    from: targetNode.start,
                    to: targetNode.start + newSourceOfReplacements.length
                }
            }
        };
    },

    replaceTopLevelVarDeclsWithAssignment: function(ast, assignToObj) {
        /* replaces var and function declarations with assignment statements.
         * Example:
              ast = lively.ast.acorn.parse("var x = 3, y = 2");
              ast2 = lively.ast.transform.replaceTopLevelVarDeclsWithAssignment(ast, {name: "A", type: "Identifier"});
              src = lively.ast.acorn.stringify(ast2); // => "A.x = 3; A.y = 2;"
         */

        // transform "var x = 3, y = 2;" into "var x = 3; var y = 2;"
        ast = lively.ast.transform.oneDeclaratorPerVarDecl(ast).ast;

        var decls = lively.ast.query.topLevelDecls(ast).groupByKey('type'),
            funcDecls = decls.FunctionDeclaration || [],
            varDecls = decls.VariableDeclaration || [],
            astCopy = makeCopy(ast),
            topLevelScope = lively.ast.query.scopes(astCopy).node;

        funcDecls.forEach(function(decl) {
            topLevelScope.body.unshift(assign(decl.id, decl.id));
        });

        return {ast: astCopy};

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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

        function makeCopy(ast) {
            return acorn.walk.copy(ast, {

                VariableDeclaration: function(n, c) {
                    return varDecls.include(n) ?
                        assign(n.declarations[0].id, n.declarations[0].init) :
                        {
                            start: n.start, end: n.end, type: 'VariableDeclaration',
                            declarations: n.declarations.map(c), kind: n.kind,
                            source: n.source, astIndex: n.astIndex
                        };
                }

            })
        }

    },

    replaceTopLevelVarDeclAndUsageForCapturing: function(ast, assignToObj, options) {
        // replaces var and function declarations with assignment statements.
        // Example:
        //    ast = lively.ast.acorn.parse("var x = 3, y = 2");
        //    ast2 = lively.ast.transform.replaceTopLevelVarDeclsWithAssignment(ast, {name: "A", type: "Identifier"});
        //    src = lively.ast.acorn.stringify(ast2); // => "A.x = 3; A.y = 2;"

        var source = options && options.source ? options.source : lively.ast.acorn.stringify(ast);
        var scope = lively.ast.query.scopes(ast);
        var shiftAndSource = {shift: 0, source: source};

        var nodePosAndTransform = scope.funcDecls.map(function(decl) {
            return {
                pos: decl.start,
                transform: function(shiftAndSource) {
                    return insertNodeBeforeOtherNode(
                        shiftAndSource,
                        assign(decl.id, decl.id),
                        scope.node.body[0]);
                }
            };
        }).concat(scope.varDecls.map(function(decl) {
            return {
                pos: decl.start,
                transform: function(shiftAndSource) {
                    return replaceNodeWithMany(
                        shiftAndSource,
                        decl.declarations.map(function(d) { return assign(d.id, d.init); }),
                        decl);
                }
            }
        })).sortByKey('pos');

        shiftAndSource = nodePosAndTransform.reduce(function(shiftAndSource, ea) {
            return ea.transform(shiftAndSource);
        }, shiftAndSource);

        // shiftAndSource = scope.funcDecls.reduce(function(shiftAndSource, decl) {
        //     return insertNodeBeforeOtherNode(
        //         shiftAndSource,
        //         assign(decl.id, decl.id),
        //         scope.node.body[0]);
        // }, shiftAndSource);

        // shiftAndSource = scope.varDecls.reduce(function(shiftAndSource, decl) {
        //     return replaceNodeWithMany(
        //         shiftAndSource,
        //         decl.declarations.map(function(d) { return assign(d.id, d.id); }),
        //         decl);
        // }, shiftAndSource);

        return {ast: lively.ast.acorn.parse(shiftAndSource.source)};

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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

        function replaceNodeWith(shiftAndSource, newNode, oldNode) {
            var shift      = shiftAndSource.shift,
                source     = shiftAndSource.source,
                start      = oldNode.start + shift,
                end        = oldNode.end + shift,
                repl       = lively.ast.acorn.stringify(newNode),
                prevLength = end - start,
                replLength = repl.length;
            source = source.slice(0, start) + repl + source.slice(end);
            return {source: source, shift: shift};
        }

        function replaceNodeWithMany(shiftAndSource, newNodes, oldNode) {
            var shift      = shiftAndSource.shift,
                source     = shiftAndSource.source,
                start      = oldNode.start + shift,
                end        = oldNode.end + shift,
                repl       = newNodes.map(lively.ast.acorn.stringify).join('\n'),
                prevLength = end - start,
                replLength = repl.length;
            source = source.slice(0, start) + repl + source.slice(end);
            return {source: source, shift: shift};
        }

        function insertNodeBeforeOtherNode(shiftAndSource, node, otherNode) {
            var source = shiftAndSource.source, shift = shiftAndSource.shift;
            var newNodeString = lively.ast.acorn.stringify(node);
            var insertionNode = otherNode;
            var pos = insertionNode.start + shift;
            return {
                source: source.slice(0, pos) + newNodeString + source.slice(pos),
                shift: shift + newNodeString.length
            }
        }

    },

    oneDeclaratorPerVarDecl: function(ast, options) {
        var source = options && options.source ? options.source : lively.ast.acorn.stringify(ast),
            decls = [];

        lively.ast.acorn.withMozillaAstDo(ast, {}, function(next, node, state, depth, path) {
            if (node.type === "VariableDeclaration" /*&& node.declarations.length > 1*/) decls.push(node);
            next();
        });

        var replacements = decls.map(function(decl) {
            return {
                decl: decl,
                replacement: decl.declarations.map(function(ea) {
                    return {type: "VariableDeclaration", kind: "var", declarations: [ea]}
                })
            };
        });

        return replacements.reduce(function(stepResult, r, i) {
            var result = lively.ast.transform.replaceNodeWithMany(
                stepResult.ast, r.decl, r.replacement, {source: stepResult.source});
            // move indices of yet to replace nodes so they fit to the new source
            patchReplacements(result, replacements.slice(i));
            return result;
        }, {ast: acorn.walk.copy(acorn.walk.addAstIndex(ast)), source: source});

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function patchReplacements(formerReplacementResult, replacementsToMake) {
            var d = formerReplacementResult.diff,
                byN = d.added.to - d.removed.to,
                pos = d.added.from;

            replacementsToMake.forEach(function(ea) {
                lively.ast.acorn.withMozillaAstDo(ea.decl, {}, function(next, node, state, depth, path) {
                    if (node.start >= pos) node.start += byN;
                    if (node.end >= pos) node.end += byN;
                    next();
                });
                
            });

        }
    },

    returnLastStatement: function(source) {
        // lively.ast.transformReturnLastStatement('foo + 3;\n this.baz(99 * 3) + 4;')
        // source = that.getTextRange()
        var ast = lively.ast.acorn.parse(source),
            last = ast.body.pop(),
            newLastsource = 'return ' + source.slice(last.start, last.end),
            newLast = lively.ast.acorn.fuzzyParse(newLastsource).body.last(),
            newSource = source.slice(0, last.start) + 'return ' + source.slice(last.start)
        ast.body.push(newLast);
        ast.end += 'return '.length
        return newSource.slice(ast.start, ast.end);
    }

});

}) // end of module
