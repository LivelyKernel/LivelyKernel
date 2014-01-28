module('lively.ast.AstHelper').requires("lively.ast.acorn").toRun(function() {

Object.subclass("lively.ast.MozillaAST.AstVisitor",
// This code was generated with:
// lively.ast.MozillaAST.createVisitorCode({pathAsParameter: true, asLivelyClass: true, parameters: ["depth","state"], name: "lively.ast.MozillaAST.AstPrinter"});
"visiting", {
    accept: function(node, depth, state, path, otherArg) {
        if (!node || !node.type) debugger;
        return this['visit' + node.type](node, depth, state, path, otherArg);
    },

    visitProgram: function(node, depth, state, path, otherArg) {
        node.body.forEach(function(ea, i) {
            // ea is of type Statement
            this.accept(ea, depth, state, ["body", i], otherArg);
        }, this);
    },

    visitFunction: function(node, depth, state, path, otherArg) {
        if (node.id) {
            // id is a node of type Identifier
            this.accept(node.id, depth, state, ["id"], otherArg);
        }

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i], otherArg);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i], otherArg);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"], otherArg);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"], otherArg);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitStatement: function(node, depth, state, path, otherArg) {
    },

    visitEmptyStatement: function(node, depth, state, path, otherArg) {
    },

    visitBlockStatement: function(node, depth, state, path, otherArg) {
        node.body.forEach(function(ea, i) {
            // ea is of type Statement
            this.accept(ea, depth, state, ["body", i], otherArg);
        }, this);
    },

    visitExpressionStatement: function(node, depth, state, path, otherArg) {
        // expression is a node of type Expression
        this.accept(node.expression, depth, state, ["expression"], otherArg);
    },

    visitIfStatement: function(node, depth, state, path, otherArg) {
        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"], otherArg);

        // consequent is a node of type Statement
        this.accept(node.consequent, depth, state, ["consequent"], otherArg);

        if (node.alternate) {
            // alternate is a node of type Statement
            this.accept(node.alternate, depth, state, ["alternate"], otherArg);
        }
    },

    visitLabeledStatement: function(node, depth, state, path, otherArg) {
        // label is a node of type Identifier
        this.accept(node.label, depth, state, ["label"], otherArg);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitBreakStatement: function(node, depth, state, path, otherArg) {
        if (node.label) {
            // label is a node of type Identifier
            this.accept(node.label, depth, state, ["label"], otherArg);
        }
    },

    visitContinueStatement: function(node, depth, state, path, otherArg) {
        if (node.label) {
            // label is a node of type Identifier
            this.accept(node.label, depth, state, ["label"], otherArg);
        }
    },

    visitWithStatement: function(node, depth, state, path, otherArg) {
        // object is a node of type Expression
        this.accept(node.object, depth, state, ["object"], otherArg);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitSwitchStatement: function(node, depth, state, path, otherArg) {
        // discriminant is a node of type Expression
        this.accept(node.discriminant, depth, state, ["discriminant"], otherArg);

        node.cases.forEach(function(ea, i) {
            // ea is of type SwitchCase
            this.accept(ea, depth, state, ["cases", i], otherArg);
        }, this);

        // node.lexical has a specific type that is boolean
        if (node.lexical) {/*do stuff*/}
    },

    visitReturnStatement: function(node, depth, state, path, otherArg) {
        if (node.argument) {
            // argument is a node of type Expression
            this.accept(node.argument, depth, state, ["argument"], otherArg);
        }
    },

    visitThrowStatement: function(node, depth, state, path, otherArg) {
        // argument is a node of type Expression
        this.accept(node.argument, depth, state, ["argument"], otherArg);
    },

    visitTryStatement: function(node, depth, state, path, otherArg) {
        // block is a node of type BlockStatement
        this.accept(node.block, depth, state, ["block"], otherArg);

        if (node.handler) {
            // handler is a node of type CatchClause
            this.accept(node.handler, depth, state, ["handler"], otherArg);
        }

        if (node.guardedHandlers) {
            node.guardedHandlers.forEach(function(ea, i) {
                // ea is of type CatchClause
                this.accept(ea, depth, state, ["guardedHandlers", i], otherArg);
            }, this);
        }

        if (node.finalizer) {
            // finalizer is a node of type BlockStatement
            this.accept(node.finalizer, depth, state, ["finalizer"], otherArg);
        }
    },

    visitWhileStatement: function(node, depth, state, path, otherArg) {
        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"], otherArg);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitDoWhileStatement: function(node, depth, state, path, otherArg) {
        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);

        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"], otherArg);
    },

    visitForStatement: function(node, depth, state, path, otherArg) {
        if (node.init) {
            // init is a node of type VariableDeclaration
            this.accept(node.init, depth, state, ["init"], otherArg);
        }

        if (node.test) {
            // test is a node of type Expression
            this.accept(node.test, depth, state, ["test"], otherArg);
        }

        if (node.update) {
            // update is a node of type Expression
            this.accept(node.update, depth, state, ["update"], otherArg);
        }

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitForInStatement: function(node, depth, state, path, otherArg) {
        // left is a node of type VariableDeclaration
        this.accept(node.left, depth, state, ["left"], otherArg);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"], otherArg);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);

        // node.each has a specific type that is boolean
        if (node.each) {/*do stuff*/}
    },

    visitForOfStatement: function(node, depth, state, path, otherArg) {
        // left is a node of type VariableDeclaration
        this.accept(node.left, depth, state, ["left"], otherArg);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"], otherArg);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitLetStatement: function(node, depth, state, path, otherArg) {
        node.head.forEach(function(ea, i) {
            // ea.id is of type node
            this.accept(ea.id, depth, state, ["head", i, "id"], otherArg);
            if (ea.init) {
                // ea.init can be of type node
                this.accept(ea.init, depth, state, ["head", i, "init"], otherArg);
            }
        }, this);

        // body is a node of type Statement
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitDebuggerStatement: function(node, depth, state, path, otherArg) {
    },

    visitDeclaration: function(node, depth, state, path, otherArg) {
    },

    visitFunctionDeclaration: function(node, depth, state, path, otherArg) {
        // id is a node of type Identifier
        this.accept(node.id, depth, state, ["id"], otherArg);

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i], otherArg);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i], otherArg);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"], otherArg);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"], otherArg);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitVariableDeclaration: function(node, depth, state, path, otherArg) {
        node.declarations.forEach(function(ea, i) {
            // ea is of type VariableDeclarator
            this.accept(ea, depth, state, ["declarations", i], otherArg);
        }, this);

        // node.kind is "var" or "let" or "const"
    },

    visitVariableDeclarator: function(node, depth, state, path, otherArg) {
        // id is a node of type Pattern
        this.accept(node.id, depth, state, ["id"], otherArg);

        if (node.init) {
            // init is a node of type Expression
            this.accept(node.init, depth, state, ["init"], otherArg);
        }
    },

    visitExpression: function(node, depth, state, path, otherArg) {
    },

    visitThisExpression: function(node, depth, state, path, otherArg) {
    },

    visitArrayExpression: function(node, depth, state, path, otherArg) {
        node.elements.forEach(function(ea, i) {
            if (ea) {
                // ea can be of type Expression or 
                this.accept(ea, depth, state, ["elements", i], otherArg);
            }
        }, this);
    },

    visitObjectExpression: function(node, depth, state, path, otherArg) {
        node.properties.forEach(function(ea, i) {
            // ea.key is of type node
            this.accept(ea.key, depth, state, ["properties", i, "key"], otherArg);
            // ea.value is of type node
            this.accept(ea.value, depth, state, ["properties", i, "value"], otherArg);
            // ea.kind is "init" or "get" or "set"
        }, this);
    },

    visitFunctionExpression: function(node, depth, state, path, otherArg) {
        if (node.id) {
            // id is a node of type Identifier
            this.accept(node.id, depth, state, ["id"], otherArg);
        }

        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i], otherArg);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i], otherArg);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"], otherArg);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"], otherArg);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitArrowExpression: function(node, depth, state, path, otherArg) {
        node.params.forEach(function(ea, i) {
            // ea is of type Pattern
            this.accept(ea, depth, state, ["params", i], otherArg);
        }, this);

        if (node.defaults) {
            node.defaults.forEach(function(ea, i) {
                // ea is of type Expression
                this.accept(ea, depth, state, ["defaults", i], otherArg);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            this.accept(node.rest, depth, state, ["rest"], otherArg);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"], otherArg);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
    },

    visitSequenceExpression: function(node, depth, state, path, otherArg) {
        node.expressions.forEach(function(ea, i) {
            // ea is of type Expression
            this.accept(ea, depth, state, ["expressions", i], otherArg);
        }, this);
    },

    visitUnaryExpression: function(node, depth, state, path, otherArg) {
        // node.operator is an UnaryOperator enum:
        // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"

        // node.prefix has a specific type that is boolean
        if (node.prefix) {/*do stuff*/}

        // argument is a node of type Expression
        this.accept(node.argument, depth, state, ["argument"], otherArg);
    },

    visitBinaryExpression: function(node, depth, state, path, otherArg) {
        // node.operator is an BinaryOperator enum:
        // "==" | "!=" | "===" | "!==" | | "<" | "<=" | ">" | ">=" | | "<<" | ">>" | ">>>" | | "+" | "-" | "*" | "/" | "%" | | "|" | "^" | "&" | "in" | | "instanceof" | ".."

        // left is a node of type Expression
        this.accept(node.left, depth, state, ["left"], otherArg);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"], otherArg);
    },

    visitAssignmentExpression: function(node, depth, state, path, otherArg) {
        // node.operator is an AssignmentOperator enum:
        // "=" | "+=" | "-=" | "*=" | "/=" | "%=" | | "<<=" | ">>=" | ">>>=" | | "|=" | "^=" | "&="

        // left is a node of type Expression
        this.accept(node.left, depth, state, ["left"], otherArg);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"], otherArg);
    },

    visitUpdateExpression: function(node, depth, state, path, otherArg) {
        // node.operator is an UpdateOperator enum:
        // "++" | "--"

        // argument is a node of type Expression
        this.accept(node.argument, depth, state, ["argument"], otherArg);

        // node.prefix has a specific type that is boolean
        if (node.prefix) {/*do stuff*/}
    },

    visitLogicalExpression: function(node, depth, state, path, otherArg) {
        // node.operator is an LogicalOperator enum:
        // "||" | "&&"

        // left is a node of type Expression
        this.accept(node.left, depth, state, ["left"], otherArg);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"], otherArg);
    },

    visitConditionalExpression: function(node, depth, state, path, otherArg) {
        // test is a node of type Expression
        this.accept(node.test, depth, state, ["test"], otherArg);

        // alternate is a node of type Expression
        this.accept(node.alternate, depth, state, ["alternate"], otherArg);

        // consequent is a node of type Expression
        this.accept(node.consequent, depth, state, ["consequent"], otherArg);
    },

    visitNewExpression: function(node, depth, state, path, otherArg) {
        // callee is a node of type Expression
        this.accept(node.callee, depth, state, ["callee"], otherArg);

        node.arguments.forEach(function(ea, i) {
            // ea is of type Expression
            this.accept(ea, depth, state, ["arguments", i], otherArg);
        }, this);
    },

    visitCallExpression: function(node, depth, state, path, otherArg) {
        // callee is a node of type Expression
        this.accept(node.callee, depth, state, ["callee"], otherArg);

        node.arguments.forEach(function(ea, i) {
            // ea is of type Expression
            this.accept(ea, depth, state, ["arguments", i], otherArg);
        }, this);
    },

    visitMemberExpression: function(node, depth, state, path, otherArg) {
        // object is a node of type Expression
        this.accept(node.object, depth, state, ["object"], otherArg);

        // property is a node of type Identifier
        this.accept(node.property, depth, state, ["property"], otherArg);

        // node.computed has a specific type that is boolean
        if (node.computed) {/*do stuff*/}
    },

    visitYieldExpression: function(node, depth, state, path, otherArg) {
        if (node.argument) {
            // argument is a node of type Expression
            this.accept(node.argument, depth, state, ["argument"], otherArg);
        }
    },

    visitComprehensionExpression: function(node, depth, state, path, otherArg) {
        // body is a node of type Expression
        this.accept(node.body, depth, state, ["body"], otherArg);

        node.blocks.forEach(function(ea, i) {
            // ea is of type ComprehensionBlock
            this.accept(ea, depth, state, ["blocks", i], otherArg);
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            this.accept(node.filter, depth, state, ["filter"], otherArg);
        }
    },

    visitGeneratorExpression: function(node, depth, state, path, otherArg) {
        // body is a node of type Expression
        this.accept(node.body, depth, state, ["body"], otherArg);

        node.blocks.forEach(function(ea, i) {
            // ea is of type ComprehensionBlock
            this.accept(ea, depth, state, ["blocks", i], otherArg);
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            this.accept(node.filter, depth, state, ["filter"], otherArg);
        }
    },

    visitLetExpression: function(node, depth, state, path, otherArg) {
        node.head.forEach(function(ea, i) {
            // ea.id is of type node
            this.accept(ea.id, depth, state, ["head", i, "id"], otherArg);
            if (ea.init) {
                // ea.init can be of type node
                this.accept(ea.init, depth, state, ["head", i, "init"], otherArg);
            }
        }, this);

        // body is a node of type Expression
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitPattern: function(node, depth, state, path, otherArg) {
    },

    visitObjectPattern: function(node, depth, state, path, otherArg) {
        node.properties.forEach(function(ea, i) {
            // ea.key is of type node
            this.accept(ea.key, depth, state, ["properties", i, "key"], otherArg);
            // ea.value is of type node
            this.accept(ea.value, depth, state, ["properties", i, "value"], otherArg);
        }, this);
    },

    visitArrayPattern: function(node, depth, state, path, otherArg) {
        node.elements.forEach(function(ea, i) {
            if (ea) {
                // ea can be of type Pattern or 
                this.accept(ea, depth, state, ["elements", i], otherArg);
            }
        }, this);
    },

    visitSwitchCase: function(node, depth, state, path, otherArg) {
        if (node.test) {
            // test is a node of type Expression
            this.accept(node.test, depth, state, ["test"], otherArg);
        }

        node.consequent.forEach(function(ea, i) {
            // ea is of type Statement
            this.accept(ea, depth, state, ["consequent", i], otherArg);
        }, this);
    },

    visitCatchClause: function(node, depth, state, path, otherArg) {
        // param is a node of type Pattern
        this.accept(node.param, depth, state, ["param"], otherArg);

        if (node.guard) {
            // guard is a node of type Expression
            this.accept(node.guard, depth, state, ["guard"], otherArg);
        }

        // body is a node of type BlockStatement
        this.accept(node.body, depth, state, ["body"], otherArg);
    },

    visitComprehensionBlock: function(node, depth, state, path, otherArg) {
        // left is a node of type Pattern
        this.accept(node.left, depth, state, ["left"], otherArg);

        // right is a node of type Expression
        this.accept(node.right, depth, state, ["right"], otherArg);

        // node.each has a specific type that is boolean
        if (node.each) {/*do stuff*/}
    },

    visitIdentifier: function(node, depth, state, path, otherArg) {
        // node.name has a specific type that is string
    },

    visitLiteral: function(node, depth, state, path, otherArg) {
        if (node.value) {
            // node.value has a specific type that is string or boolean or number or RegExp
        }
    }
});

lively.ast.MozillaAST.AstVisitor.subclass('lively.ast.MozillaAST.ASTPrinter', {

    accept: function($super, node, depth, tree, path) {
        var pathString = path
            .map(function(ea) { return typeof ea === 'string' ? '.' + ea : '[' + ea + ']'})
            .join('')
        var treeEntry = {node: node, path: pathString, source: node.source, children: []};
        tree.push(treeEntry);
        var res = $super(node, depth+1, treeEntry.children, path);
        return res;
    }

});

lively.ast.MozillaAST.AstVisitor.subclass("lively.ast.MozillaAST.Compare",
"comparison", {

    recordNotEqual: function(node1, node2, state, path, msg) {
        state.errors.push({
            node1: node1, node2: node2,
            path: path, msg: msg
        });
    },

    compareType: function(node1, node2, state, path) {
        return this.compareField('type', node1, node2, state, path);
    },

    compareField: function(field, node1, node2, state, path) {
        if (node1 && node2 && node1[field] === node2[field]) return true;
        if ((node1 && node1[field] === '*') || (node2 && node2[field] === '*')) return true;
        var fullPath = path.join('.') + '.' + field, msg;
        if (!node1) msg = "node1 on " + fullPath + " not defined";
        else if (!node2) msg = 'node2 not defined but node1 (' + fullPath + ') is: '+ node1[field];
        else msg = fullPath + ' is not equal: ' + node1[field] + ' vs. ' + node2[field];
        this.recordNotEqual(node1, node2, state, path, msg);
        return false;
    }

},
"visiting", {
    accept: function(node1, baseNode2, state, path, completePath) {
        if (!completePath) completePath = [];
        completePath = completePath.concat(path);
        var node2 = lively.PropertyPath(path.join('.')).get(baseNode2);
        if (node1 === '*' || node2 === '*') return;
        if (this.compareType(node1, node2, state, completePath))
            this['visit' + node1.type](node1, node2, state, path, completePath);
    },

    visitFunction: function($super, node1, node2, state, path, completePath) {
        // node1.generator has a specific type that is boolean
        if (node1.generator) { this.compareField("generator", node1, node2, state, completePath); }

        // node1.expression has a specific type that is boolean
        if (node1.expression) { this.compareField("expression", node1, node2, state, completePath); }

        $super(node1, node2, state, path, completePath);
    },

    visitSwitchStatement: function($super, node1, node2, state, path, completePath) {
        // node1.lexical has a specific type that is boolean
        if (node1.lexical) { this.compareField("lexical", node1, node2, state, completePath); }

        $super(node1, node2, state, path, completePath);
    },

    visitForInStatement: function($super, node1, node2, state, path, completePath) {
        // node1.each has a specific type that is boolean
        if (node1.each) { this.compareField("each", node1, node2, state, completePath); }

        $super(node1, node2, state, path, completePath);
    },

    visitFunctionDeclaration: function($super, node1, node2, state, path, completePath) {
        // node1.generator has a specific type that is boolean
        if (node1.generator) { this.compareField("generator", node1, node2, state, completePath); }

        // node1.expression has a specific type that is boolean
        if (node1.expression) { this.compareField("expression", node1, node2, state, completePath); }

        $super(node1, node2, state, path, completePath);
    },

    visitVariableDeclaration: function($super, node1, node2, state, path, completePath) {
        // node1.kind is "var" or "let" or "const"
        this.compareField("kind", node1, node2, state, completePath); 
        $super(node1, node2, state, path, completePath);
    },

    visitUnaryExpression: function($super, node1, node2, state, path, completePath) {
        // node1.operator is an UnaryOperator enum:
        // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
        this.compareField("operator", node1, node2, state, completePath); 

        // node1.prefix has a specific type that is boolean
        if (node1.prefix) { this.compareField("prefix", node1, node2, state, completePath); }

        $super(node1, node2, state, path, completePath);
    },

    visitBinaryExpression: function($super, node1, node2, state, path, completePath) {
        // node1.operator is an BinaryOperator enum:
        // "==" | "!=" | "===" | "!==" | | "<" | "<=" | ">" | ">=" | | "<<" | ">>" | ">>>" | | "+" | "-" | "*" | "/" | "%" | | "|" | "^" | "&" | "in" | | "instanceof" | ".."
        this.compareField("operator", node1, node2, state, completePath); 
        $super(node1, node2, state, path, completePath);
    },

    visitAssignmentExpression: function($super, node1, node2, state, path, completePath) {
        // node1.operator is an AssignmentOperator enum:
        // "=" | "+=" | "-=" | "*=" | "/=" | "%=" | | "<<=" | ">>=" | ">>>=" | | "|=" | "^=" | "&="
        this.compareField("operator", node1, node2, state, completePath); 
        $super(node1, node2, state, path, completePath);
    },

    visitUpdateExpression: function($super, node1, node2, state, path, completePath) {
        // node1.operator is an UpdateOperator enum:
        // "++" | "--"
        this.compareField("operator", node1, node2, state, completePath); 
        // node1.prefix has a specific type that is boolean
        if (node1.prefix) { this.compareField("prefix", node1, node2, state, completePath); }
        $super(node1, node2, state, path, completePath);
    },

    visitLogicalExpression: function($super, node1, node2, state, path, completePath) {
        // node1.operator is an LogicalOperator enum:
        // "||" | "&&"
        this.compareField("operator", node1, node2, state, completePath); 
        $super(node1, node2, state, path, completePath);
    },

    visitMemberExpression: function($super, node1, node2, state, path, completePath) {
        // node1.computed has a specific type that is boolean
        if (node1.computed) { this.compareField("computed", node1, node2, state, completePath); }
        $super(node1, node2, state, path, completePath);
    },

    visitComprehensionBlock: function($super, node1, node2, state, path, completePath) {
        // node1.each has a specific type that is boolean
        if (node1.each) { this.compareField("each", node1, node2, state, completePath); }
        $super(node1, node2, state, path, completePath);
    },

    visitIdentifier: function($super, node1, node2, state, path, completePath) {
        // node1.name has a specific type that is string
        this.compareField("name", node1, node2, state, completePath); 
        $super(node1, node2, state, path, completePath);
    },

    visitLiteral: function($super, node1, node2, state, path, completePath) {
        this.compareField("value", node1, node2, state, completePath); 
        $super(node1, node2, state, path, completePath);
    }
});

Object.extend(lively.ast.acorn, {

    printAst: function(astOrSource, options) {
        options = options || {};
        var printSource = options.printSource || false,
            printPositions = options.printPositions || false,
            source, ast, tree = [];

        if (Object.isString(astOrSource)) {
            source = astOrSource;
            ast = lively.ast.acorn.parse(astOrSource);
        } else { ast = astOrSource; source = options.source; }

        if (printSource && !ast.source) { // ensure that nodes have source attached
            if (!source) {
                source = escodegen.generate(ast);
                ast = lively.ast.acorn.parse(source);
            }
            acorn.walk.addSource(ast, source);
        }
        
        function printFunc(ea) {
            var string = ea.path + ':' + ea.node.type, additional = [];
            if (printPositions) { additional.push(ea.node.start + '-' + ea.node.end); }
            if (printSource) {
                additional.push(Strings.print((ea.source || '')
                    .truncate(60).replace(/\n/g, '').replace(/\s+/g, ' ')));
            }
            if (additional.length) { string += '(' + additional.join(',') + ')'; }
            return string;
        }

        new lively.ast.MozillaAST.ASTPrinter().accept(ast, 0, tree, []);
        return Strings.printTree(tree[0], printFunc, function(ea) { return ea.children; }, '    ');
    },

    compareAst: function(node1, node2) {
        if (!node1 || !node2) throw new Error('node' + (node1 ? '1' : '2') + ' not defined');
        var state = {errors: []};
        new lively.ast.MozillaAST.Compare().accept(node1, node2, state, []);
        return !state.errors.length ? null : state.errors.pluck('msg');
    }

});

}) // end of module
