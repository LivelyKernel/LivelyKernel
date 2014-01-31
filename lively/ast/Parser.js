module('lively.ast.Parser').requires('lively.Ometa', 'lively.ast.generated.Translator', 'lively.ast.generated.Nodes', 'lively.ast.LivelyJSParser').toRun(function() {


// LivelyJSParser is the OMeta parser defined in lively.ast.LivelyJSParser.ometa
// Here we add a few helper methods that are used in the parser rules
Object.extend(LivelyJSParser, {

    hexDigits: "0123456789abcdef",

    keywords: (function() {
        var keywordWithIdx ={},
            keywords = ["break", "case", "catch", "continue", "default", "delete", "do", "else", "finally",
                        "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try",
                        "typeof", "var", "void", "while", "with", "ometa", "debugger"];
        for (var idx = 0; idx < keywords.length; idx++)
            keywordWithIdx[keywords[idx]] = true;
        return keywordWithIdx;
    })(),

    _isKeyword: function(k) {
        return this.keywords[k] === true;
    }

});

Object.extend(lively.ast.Parser, {

    jsParser: LivelyJSParser,
    astTranslator: JSTranslator,

    basicParse: function(source, rule) {
        // first call the LKJSParser. this will result in a synbolic AST tree.
        // translate this into real AST objects using JSTranslator
        var errorHandler = function() { throw Array.from(arguments) },
            intermediate = OMetaSupport.matchAllWithGrammar(this.jsParser, rule, source, errorHandler);
        if (!intermediate || Object.isString(intermediate)) {
            throw [source, rule, 'Could not parse JS source code', 0, intermediate];
        }
        var ast = OMetaSupport.matchWithGrammar(this.astTranslator, 'trans', intermediate);
        if (!ast || Object.isString(ast)) {
            throw [source, rule, 'Could not translate symbolic AST tree', 0, intermediate, ast];
        }
        ast.source = source;
        return ast;
    },

    parse: function(src, optRule) { return this.basicParse(src, optRule || 'topLevel') }
});

lively.ast.Node.addMethods(
'accessing', {
    setParent: function(parentNode) { return this._parent = parentNode },
    getParent: function(parentNode) { return this._parent },
    hasParent: function(parentNode) { return this._parent != undefined },
    parentSequence: function() {
        return this.hasParent() && this.getParent().parentSequence();
    },
    parentFunction: function() {
        return this.hasParent() && this.getParent().parentFunction();
    },
    astIndex: function() {
        var parentFunc = this.parentFunction();
        if (!parentFunc) throw new Error('astIndex: cannot get parent fucntion of ' + this);
        return parentFunc.linearlyListNodesWithoutNestedFunctions().indexOf(this);
    },
    nodeForAstIndex: function(idx) {
        return this.linearlyListNodesWithoutNestedFunctions()[idx]
    }
},
'testing', {
    isASTNode: true,
    isUndefined: function(expr) {
        return expr.isVariable && expr.name === 'undefined';
    }
},
'enumerating', {
    withAllChildNodesDo: function(func, parent, nameInParent, depth) {
        // args of func: node, parent, nameInParent, depth; func returns true if recursive call should be made
        var node = this,
            shouldContinue = func(node, parent, nameInParent, depth || 0);
        if (!shouldContinue) return;
        this.doForAllChildNodes(function(childNode, nameInParent) {
            childNode.withAllChildNodesDo(func, node, nameInParent, depth ? depth + 1 : 1)
        });
    },
    withAllChildNodesDoPostOrder: function(func, stopFunc, parent, nameInParent, depth) {
        // args of func: node, parent, nameInParent, depth; func returns true if recursive call should be made
        var node = this,
            shouldStop = stopFunc && stopFunc(node, parent, nameInParent, depth || 0);
        if (shouldStop) return;
        this.doForAllChildNodes(function(childNode, nameInParent) {
            childNode.withAllChildNodesDoPostOrder(func, stopFunc, node, nameInParent, depth ? depth + 1 : 1)
        });
        func(node, parent, nameInParent, depth || 0);
    },

    doForAllChildNodes: function(func) {
        for (var name in this) {
            if (!this.hasOwnProperty(name) || name == '_parent') continue;
            var value = this[name];
            if (value.isASTNode) {
                func(value, name, null)
            } else if (Object.isArray(value)) {
                value.forEach(function(item, i) { if (item.isASTNode) func(item, name, i) });
            }
        }
    },

    nodesMatching: function(matchFunc) {
        var result = [];
        this.withAllChildNodesDo(function(node, parent, nameInParent, depth) {
            if (matchFunc(node, parent, nameInParent, depth)) result.push(node);
            return true;
        });
        return result;
    },

    linearlyListNodes: function() {
        var nodes = [];
        this.withAllChildNodesDoPostOrder(function(node) { nodes.push(node) });
        return nodes;
    },

    linearlyListNodesWithoutNestedFunctions: function() {
        var root = this, nodes = [];
        this.withAllChildNodesDoPostOrder(
            function(node) { nodes.push(node) },
            function(node) { return node.isFunction && node !== root } // stopFunc
        );
        return nodes;
  },

    isAfter: function(other) {
        var that = this, first = null;
        this.parentFunction().body.withAllChildNodesDo(function(node) {
            if (!first) {
                if (node === that) first = that;
                if (node === other) first = other;
            }
            return !first;
        });
        return first === other;
    }
},
'replacing', {

    replaceNodesMatching: function(testFunc, replacementNodeOrFunction) {
        var nodes = this.nodesMatching(testFunc);
        nodes.forEach(function(node) {
            // Careful here! One could directly use node.replaceWith but if the replacement function
            // reuses node and replaces it already then parent will be changed!
            var parent = node.getParent();
            if (!parent) throw new Error('No parent for node in replaceNodesMatching ' + node);
            var replacementNode = (typeof replacementNodeOrFunction == 'function') ?
                replacementNodeOrFunction(node) : replacementNodeOrFunction;
            parent.replaceChildNode(node, replacementNode);
        })
        return this;
    },

    replaceWith: function(otherNode) {
        if (!this.hasParent())
            throw new Error('Need parent node for replaceWith but cannot find it ' + this);
        this.getParent().replaceChildNode(this, otherNode);
        return otherNode;
    },

    replaceChildNode: function(childNode, newNode) {
        // find name if childNode in me
        var slotName, idx;
        this.doForAllChildNodes(function(node, nameInParent, i) {
            if (node !== childNode) return;
            slotName = nameInParent;
            idx = i;
        });
        if (slotName === undefined) {
            throw new Error('Cannot find childNode in me! (#replaceChildNode)');
        }
        if (idx === undefined || idx === null) {
            this[slotName] = newNode;
        } else { // Array
            this[slotName][idx] = newNode;
        }
        newNode.setParent(this);
    }
},
'evaluation', {

    eval: function() {
        var result, js;
        try {
            js = this.asJS();
            var src = '(' + js + ')';
            result = eval(src);
        } catch(e) {
            alert('Could not eval ' + js + ' because:\n' + e + '\n' + e.stack);
        }
        return result;
    }

},
'debugging', {

    error: function(msg) { throw new Error(msg) },
    indent: function(depth) { return Strings.indent('', ' ', depth) },
    toString: function() { return this.constructor.name },

    printTree: function(postOrder) {
        var nodeStrings = [], idx = 0,
            enumFunc = postOrder ? 'withAllChildNodesDoPostOrder' : 'withAllChildNodesDo';
        this[enumFunc](function(node, parent, nameInParent, depth) {
            nodeStrings.push(idx.toString() + ' ' +
                             Strings.indent(node.constructor.name + '(' + nameInParent + ')', ' ', depth));
            idx++;
            return true;
        })
        return nodeStrings.join('\n');
    },

    printConstructorCall: function(/* args */) {
        var call = 'new ' + this.constructor.type + '(', argCalls = [];
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i], argCall = '';
            if (Object.isArray(arg)) {
                argCall += '[';
                argCall += arg.collect(function(ea) {return ea.isASTNode ? ea.printConstruction() : ea}).join(',');
                argCall += ']';
            } else if (arg.isASTNode) {
                argCall += arg.printConstruction();
            } else {
                argCall += arg;
            }
            argCalls.push(argCall);
        }
        call += argCalls.join(',');
        call += ')';
        return call;
  },

},
'stepping', {
    firstStatement: function() {
        return this;
    },
    nextStatement: function(node) {
        var stmt = this.getParent().nextStatement(this);
        return stmt ? stmt.firstStatement() : null;
    },
    isComposite: function() {
        return false;
    }
},
'matching', {
    match: function(patternAst) {
        var matchedPlaceholder = true;
        for (var key in patternAst) {
            var result = this.matchVal(key, this[key], patternAst[key]);
            if (result !== true) matchedPlaceholder = result;
        }
        return matchedPlaceholder;
    },
    matchVal: function(key, value, pattern) {
        if (pattern === lively.ast.Node.placeholder) return value;
        if (value == pattern) return true;
        if (Object.isString(pattern)) {
            if (value.toString() == pattern) return true;
            if (value.value == pattern) return true;
            if (value.name == pattern) return true;
        }
        if (Object.isArray(pattern) && Object.isArray(value)) {
            var matchedPlaceholder = true;
            for (var i = 0; i < pattern.length; i++) {
                var success = false,
                    lastError = null;
                for (var j = 0; j < value.length; j++) {
                    try {
                        var res = this.matchVal(key, value[j], pattern[i]);
                        if (res !== true) matchedPlaceholder = res;
                        success = true;
                    } catch(e) { lastError = e; }
                }
                if (!success) throw lastError;
            }
            if (value.length !== pattern.length) {
                throw {key: key, err: "count",
                       expected: pattern.length, actual: value.length};
            }
            return matchedPlaceholder;
        }
        if (Object.isObject(pattern) && value.isASTNode) {
            return value.match(pattern);
        }
        throw {key: key, err: "missmatch", expected: String(pattern), actual: String(value)};
    }
});

Object.subclass('lively.ast.SourceGenerator',
'documentation', {
    usage: 'gen = new lively.ast.SourceGenerator();\n\
gen.writeAndEvalTranslator();\n\
gen.evalAndWriteClasses();\n\
lively.ast.Parser.astTranslator = JSTranslator;\n\
lively.ast.Parser.jsParser = LivelyJSParser;',

    showUsage: function() {
        $world.addTextWindow({content: this.usage, title: "lively.ast.SourceGenerator usage"})
    }
},
'settings', {
    customRules: function() { return ['trans = [:t apply(t):ans] -> ans,'] },
    customClasses: function() { return ["Object.subclass('" + this.rootNodeClassName + "')"] },

    translatorRules: function() {
        var names = this.constructor.categories['translator rules'],
            result = {};
        names.forEach(function(name) { result[name] = this[name] }, this);
        return result;
    },

    modulePath: 'lively.ast.',
    rootNodeClassName: 'lively.ast.Node',
    visitorClassName: 'lively.ast.Visitor'
},
'translator rules', {

    begin: {
        className: 'Sequence', rules: [':pos', 'trans*:children', 'end'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.children) },
            toString: function() {
                return Strings.format(
                    '%s(%s)',
                    this.constructor.name, this.children.join(','))
            },
        },
        conversion: {
            asJS: function(depth) {
                var indent = this.indent(depth || 0);
                depth = depth || -1;
                return this.children.invoke('asJS', depth + 1).join(';\n' + indent);
            },
        },
        insertion: {
            insertBefore: function(newNode, existingNode) {
                for (var i = 0; i < this.children.length; i++)
                    if (this.children[i].nodesMatching(function(node) {
                        return node === existingNode }).length > 0)
                        break;
                if (!this.children[i])
                    throw dbgOn(new Error('insertBefore: ' + existingNode + ' not in ' + this));
                return this.insertAt(newNode, i);
            },
            insertAt: function(newNode, idx) {
                this.children.pushAt(newNode, idx);
                newNode.setParent(this);
                return newNode;
            },
        },
        accessing: {
            parentSequence: function() { return this },
        },
        stepping: {
            firstStatement: function() {
                return this.children.length > 0
                     ? this.children[0].firstStatement()
                     : this;
            },
            nextStatement: function($super, node) {
                var idx = this.children.indexOf(node);
                if (idx >= 0 && idx < this.children.length - 1)
                    return this.children[idx + 1];
                return $super(this);
            },
            isComposite: function() {
                return true;
            }
        }
    },

    number: {
        className: 'Number', rules: [':pos', ':value'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.pos, this.value) },
            toString: function() { return Strings.format('%s(%s)', this.constructor.name, this.value) },
        },
        conversion: {
            asJS: function(depth) { return this.value },
        },
    },

    string: {
        className: 'String', rules: [':pos', ':value'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"' + this.value + '"') },
            toString: function() { return Strings.format('%s(%s)', this.constructor.name, this.value) },
    },
        conversion: {
            asJS: function(depth) { return '"' + this.value + '"' },
        },
    },

    condExpr: {
        className: 'Cond', rules: [':pos', 'trans:condExpr', 'trans:trueExpr', 'trans:falseExpr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.condExpr, this.trueExpr, this.falseExpr) },
            toString: function() { return Strings.format(
                '%s(%s?%s:%s)',
                this.constructor.name, this.condExpr, this.trueExpr, this.falseExpr) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format(
                    '(%s) ? (%s) : (%s)',
                    this.condExpr.asJS(depth), this.trueExpr.asJS(depth), this.falseExpr.asJS(depth));
            },
        },
    },

    'if': {
        className: 'If', rules: [':pos', 'trans:condExpr', 'trans:trueExpr', 'trans:falseExpr'],
        initializing: {
            initialize: function($super, pos, condExpr, trueExpr, falseExpr) {
                this.pos = pos;
                this.condExpr = condExpr;
                // FIXME actually this could be done with OMeta
                this.trueExpr = trueExpr.isSequence || this.isUndefined(trueExpr) ?
                    trueExpr : new lively.ast.Sequence(trueExpr.pos, [trueExpr]);
                this.falseExpr = falseExpr.isSequence || this.isUndefined(falseExpr) ?
                    falseExpr : new lively.ast.Sequence(trueExpr.pos, [falseExpr]);
                condExpr.setParent(this);
                this.trueExpr.setParent(this);
                this.falseExpr.setParent(this);
            },
        },
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.condExpr, this.trueExpr, this.falseExpr) },
            toString: function() { return Strings.format(
                '%s(%s?%s:%s)',
                this.constructor.name, this.condExpr, this.trueExpr, this.falseExpr) },
        },
        conversion: {
            asJS: function(depth) {
                var str = Strings.format(
                    'if (%s) {%s}',
                    this.condExpr.asJS(depth), this.trueExpr.asJS(depth));
                if (!this.isUndefined(this.falseExpr))
                    str += ' else {' + this.falseExpr.asJS(depth) + '}';
                return str;
            },
        },
        stepping: {
            firstStatement: function() {
                return this.condExpr.firstStatement();
            },
            nextStatement: function($super, node) {
                return node === this.condExpr ? this.trueExpr : $super(this);
            },
            isComposite: function() { return true; }
        }
    },

    'while': {
        className: 'While', rules: [':pos', 'trans:condExpr', 'trans:body'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.condExpr, this.body) },
            toString: function() { return Strings.format(
                '%s(%s?%s)',
                this.constructor.name, this.condExpr, this.body) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format(
                    'while (%s) {%s}',
                    this.condExpr.asJS(depth), this.body.asJS(depth));
            },
        },
        stepping: {
            firstStatement: function() {
                return this.condExpr.firstStatement();
            },
            nextStatement: function($super, node) {
                if (node === this.condExpr) {
                    return this.body;
                } else if (node === this.body) {
                    return this.condExpr;
                } else {
                    return $super(this);
                }
            },
            isComposite: function() {
                return true;
            }
        },
    },

    'doWhile': {
        className: 'DoWhile', rules: [':pos', 'trans:body', 'trans:condExpr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.body, this.condExpr) },
            toString: function() { return Strings.format(
                '%s(%s while%s)',
                this.constructor.name, this.body, this.condExpr) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format(
                    'do {%s} while (%s);',
                    this.body.asJS(depth), this.condExpr.asJS(depth));
            },
        },
        stepping: {
            firstStatement: function() {
                return this.body.firstStatement();
            },
            nextStatement: function($super, node) {
                if (node === this.condExpr) {
                    return this.body;
                } else if (node === this.body) {
                    return this.condExpr;
                } else {
                    return $super(this);
                }
            },
            isComposite: function() {
                return true;
            }
        },
    },

    'for': {
        className: 'For', rules: [':pos', 'trans:init', 'trans:condExpr', 'trans:body', 'trans:upd'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.init, this.condExpr, this.body, this.upd) },
            toString: function() { return Strings.format(
                '%s(%s;%s;%s do %s)',
                this.constructor.name, this.init, this.condExpr, this.upd, this.body) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format(
                    'for (%s; %s; %s) {%s}',
                    this.init.asJS(depth), this.condExpr.asJS(depth), this.upd.asJS(depth), this.body.asJS(depth));
            },
        },
        stepping: {
            firstStatement: function() {
                return this.init.firstStatement();
            },
            nextStatement: function($super, node) {
                if (node === this.init || node === this.upd) {
                    return this.condExpr;
                } else if (node === this.condExpr) {
                    return this.body;
                } else if (node === this.body) {
                    return this.upd;
                } else {
                    return $super(this);
                }
            },
            isComposite: function() {
                return true;
            }
        }
    },

    forIn: {
        className: 'ForIn', rules: [':pos', 'trans:name', 'trans:obj', 'trans:body'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.name, this.obj, this.body) },
            toString: function() {
                return Strings.format(
                    '%s(%s in %s do %s)',
                    this.constructor.name, this.name, this.obj, this.body);
            },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format(
                    'for (%s in %s) {%s}',
                    this.name.asJS(depth), this.obj.asJS(depth), this.body.asJS(depth));
            },
        },
    },

    set: {
        className: 'Set', rules: [':pos', 'trans:left', 'trans:right'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.left, this.right) },
            toString: function() { return Strings.format(
                '%s(%s = %s)',
                this.constructor.name, this.left, this.right) },
        },
        conversion: {
            asJS: function(depth) { return this.left.asJS(depth) + ' = ' + this.right.asJS(depth) },
        },
    },

    mset: {
        className: 'ModifyingSet', rules: [':pos', 'trans:left', ':name', 'trans:right'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.left, '"' + this.name + '"', this.right) },
            toString: function() { return Strings.format(
                '%s(%s %s %s)',
                this.constructor.name, this.left, this.name, this.right) },
        },
        conversion: {
            asJS: function(depth) { return this.left.asJS(depth) + ' ' + this.name + '= ' + this.right.asJS(depth) },
        },
    },

    binop: {
        className: 'BinaryOp', rules: [':pos', ':name', 'trans:left', 'trans:right'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"' + this.name + '"', this.left, this.right) },
            toString: function() { return Strings.format(
                '%s(%s %s %s)',
                this.constructor.name, this.left, this.name, this.right) },
        },
        conversion: {
            asJS: function(depth) { return '(' + this.left.asJS(depth) + ') ' + this.name + ' (' + this.right.asJS(depth) + ')' },
        },
    },

    unop: {
        className: 'UnaryOp', rules: [':pos', ':name', 'trans:expr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"' + this.name + '"', this.expr) },
            toString: function() { return Strings.format(
                '%s(%s%s)',
                this.constructor.name, this.name, this.expr) },
    },
        conversion: {
            asJS: function(depth) { return '(' + this.name + this.expr.asJS(depth) + ')'},
        },
    },

    preop: {
        className: 'PreOp', rules: [':pos', ':name', 'trans:expr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"' + this.name+'"', this.expr) },
            toString: function() { return Strings.format(
                '%s(%s%s)',
                this.constructor.name, this.name, this.expr) },
        },
        conversion: {
            asJS: function(depth) { return '(' + this.name + this.expr.asJS(depth) + ')' },
        },
    },

    postop: {
        className: 'PostOp', rules: [':pos', ':name', 'trans:expr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.expr) },
            toString: function() { return Strings.format(
                '%s(%s%s)',
                this.constructor.name, this.expr, this.name) },
        },
        conversion: {
            asJS: function(depth) { return '(' + this.expr.asJS(depth) + this.name + ')'},
        },
    },

    'this': {
        className: 'This', rules: [':pos'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos) },
            toString: function() { return this.constructor.name },
        },
        conversion: {
            asJS: function(depth) { return 'this' },
        },
    },

    get: {
        className: 'Variable', rules: [':pos', ':name'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"'+this.name+'"') },
            toString: function() { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.name) },
        },
        conversion: {
            asJS: function(depth) { return this.name },
        },
    },

    getp: {
        className: 'GetSlot', rules: [':pos', 'trans:slotName', 'trans:obj'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.slotName, this.obj) },
            toString: function() { return Strings.format(
                '%s(%s[%s])',
                this.constructor.name, this.obj, this.slotName) },
        },
        conversion: {
            asJS: function(depth) {
                var objJS = this.obj.asJS(depth);
                if (this.obj.isFunction) objJS = '(' + objJS + ')';
                return objJS + '[' + this.slotName.asJS(depth) + ']';
            },
        },
    },

    'break': {
        className: 'Break', rules: [':pos', 'trans:label'],
        initializing: {
          	initialize: function($super, pos, label) {
            		this.pos = pos;
            		this.label = label || new lively.ast.Label([pos[1], pos[1]], '');
            		this.label.setParent(this);
          	},
        },
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.label) },
        },
        conversion: {
            asJS: function(depth) { return 'break' + this.label.asJS(); },
        },
    },

    'debugger': {
        className: 'Debugger', rules: [':pos'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos) },
        },
        conversion: {
            asJS: function(depth) { return 'debugger' },
        },
    },

    'continue': {
        className: 'Continue', rules: [':pos', 'trans:label'],
        initializing: {
          	initialize: function($super, pos, label) {
            		this.pos = pos;
            		this.label = label || new lively.ast.Label([pos[1], pos[1]], '');
            		this.label.setParent(this);
          	},
        },
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.label) },
        },
        conversion: {
            asJS: function(depth) { return 'continue' + this.label.asJS(); },
        },
    },

    arr: {
        className: 'ArrayLiteral', rules: [':pos', 'trans*:elements'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.elements) },
            toString: function() { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.elements.join(',')) },
        },
        conversion: {
            asJS: function(depth) { return '[' + this.elements.invoke('asJS').join(',') + ']' },
        },
    },

    'return': {
        className: 'Return', rules: [':pos', 'trans:expr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.expr) },
            toString: function() { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.expr) },
        },
        conversion: {
            asJS: function(depth) { return 'return ' + this.expr.asJS(depth) },
        },
    },

    'with': {
        className: 'With', rules: [':pos', 'trans:obj', 'trans:body'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.obj, this.body) },
            toString: function() { return Strings.format(
                '%s(%s %s)',
                this.constructor.name, this.obj, this.body) },
        },
        conversion: {
            asJS: function(depth) { return 'with (' + this.obj.asJS(depth) + ') {' + this.body.asJS(depth) + '}' },
        },
    },

    send: {
        className: 'Send', rules: [':pos', 'trans:property', 'trans:recv', 'trans*:args'],
        debugging: {
            printConstruction: function() {
                return this.printConstructorCall(this.pos, this.property, this.recv, this.args)
            },
            toString: function() {
                return Strings.format('%s(%s[%s](%s))',
                    this.constructor.name, this.recv, this.property, this.args.join(','))
            },
        },
        conversion: {
            asJS: function(depth) {
                var recvJS = this.recv.asJS(depth);
                if (this.recv.isFunction) recvJS = '(' + recvJS + ')';
                return Strings.format(
                    '%s[%s](%s)',
                    recvJS, this.property.asJS(depth), this.args.invoke('asJS').join(','));
            },
        },
        accessing: {
            getName: function() { return this.property },
        },
    },

    call: {
        className: 'Call', rules: [':pos', 'trans:fn', 'trans*:args'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.fn, this.args) },
            toString: function() { return Strings.format(
                '%s(%s(%s))',
                this.constructor.name, this.fn, this.args.join(',')) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format('%s(%s)',
                                      this.fn.asJS(depth), this.args.invoke('asJS').join(','));
            },
        },
        accessing: {
            getName: function() { return this.fn.name },
        },
    },

    'new': {
        className: 'New', rules: [':pos', 'trans:clsExpr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.clsExpr) },
            toString: function() { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.clsExpr) },
        },
        conversion: {
            asJS: function(depth) {
                return 'new ' + this.clsExpr.asJS(depth);
            }
        }
    },

    'var': {
        className: 'VarDeclaration', rules: [':pos', ':name', 'trans:val'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.val) },
            toString: function() { return Strings.format(
                '%s(%s = %s)',
                this.constructor.name, this.name, this.val) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format('var %s = %s', this.name, this.val.asJS(depth));
            },
        },
    },

    'throw': {
        className: 'Throw', rules: [':pos', 'trans:expr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.expr) },
            toString: function() {
                return Strings.format(
                    '%s(%s)',
                    this.constructor.name, this.expr)
            },
        },
        conversion: {
            asJS: function(depth) { return 'throw ' + this.expr.asJS(depth) },
        },
    },

    'try': {
        className: 'TryCatchFinally', rules: [':pos', 'trans:trySeq', 'trans:err', 'trans:catchSeq', 'trans:finallySeq'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.trySeq, '"'+this.err.name+'"', this.catchSeq, this.finallySeq) },
            toString: function() {
                return Strings.format(
                    '%s(%s %s %s)',
                    this.constructor.name, this.trySeq, this.catchSeq, this.finallySeq)
            },
        },
        conversion: {
            asJS: function(depth) {
                var baseIndent = this.indent(depth-1),
                    indent = this.indent(depth),
                str = 'try {\n' + indent + this.trySeq.asJS(depth) + '\n' + baseIndent + '}';
                if (!this.isUndefined(this.catchSeq))
                    str += ' catch(' + this.err.name + ') {\n' +
                    indent + this.catchSeq.asJS(depth) + '\n' + baseIndent + '}';
                if (!this.isUndefined(this.finallySeq))
                    str += ' finally {\n' + indent + this.finallySeq.asJS(depth) + '\n' + baseIndent + '}';
                return str;
            },
        },
    },

    func: {
        className: 'Function', rules: [':pos', 'trans:body', 'trans*:args'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.body, this.args.collect(function(ea) { return '"' + ea.name + '"' })) },
            toString: function() {
                return Strings.format(
                    '%s(function %s(%s) %s)',
                    this.constructor.name, this.name(), this.argNames().join(','), this.body)
            },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format('function%s(%s) {\n%s\n}',
                                      this.name() ? ' ' + this.name() : '', this.argNames().join(','),
                                      this.indent(depth+1) + this.body.asJS(depth+1));
            },
        },
        accessing: {
            name: function() {
                if (this._parent && this._parent.isVarDeclaration) {
                    return this._parent.name;
                }
                return undefined;
            },
            parentFunction: function() { return this },
            argNames: function() { return this.args.collect(function(a){ return a.name }); },
            statements: function() { return this.body.children },
        },
        stepping: {
            firstStatement: function() { return this.body.firstStatement(); },
            nextStatement: function(node) { return null; },
            isComposite: function() { return true; }
        },
        evaluation: {
            eval: function() {
                return new Function(this.argNames().join(","), this.body.asJS());
            },
        }
    },

    json: {
        className: 'ObjectLiteral', rules: [':pos', 'trans*:properties'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.properties) },
            toString: function() {
                return Strings.format(
                    '%s({%s})',
                    this.constructor.name, this.properties.join(','))
            },
        },
        conversion: {
            asJS: function(depth) {
                return '{' + this.properties.invoke('asJS').join(',') + '}';
            },
        },
    },

    binding: {
        className: 'ObjProperty', rules: [':pos', ':name', 'trans:property'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.property) },
      toString: function() {
          return Strings.format(
              '%s(%s: %s)',
              this.constructor.name, this.name, this.property) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format('"%s": %s', this.name, this.property.asJS(depth));
            },
        },
    },
    jsonGetter: {
        className: 'ObjPropertyGet', rules: [':pos', ':name', 'trans:body'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.body) },
      toString: function() {
          return Strings.format(
              '%s(%s() { %s })',
              this.constructor.name, this.name, this.body) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format('get "%s"() { %s }', this.name, this.body.asJS(depth));
            },
        },
    },
    jsonSetter: {
        className: 'ObjPropertySet', rules: [':pos', ':name', 'trans:body', ':arg'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.body, this.arg) },
      toString: function() {
          return Strings.format(
              '%s(%s(%s) { %s })',
              this.constructor.name, this.name, this.arg, this.body) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format('set "%s"(%s) { %s }', this.name, this.arg, this.body.asJS(depth));
            },
        },
    },


    'switch': {
        className: 'Switch', rules: [':pos', 'trans:expr', 'trans*:cases'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.expr, this.cases) },
            toString: function() { return Strings.format('%s(%s %s)',
                                                         this.constructor.name, this.expr, this.cases.join('\n')) },
        },
        conversion: {
            asJS: function(depth) {
                return Strings.format('switch (%s) {%s}',
                                      this.expr.asJS(depth), this.cases.invoke('asJS').join('\n'));
            },
        },
    },

    'case': {
        className: 'Case', rules: [':pos',  'trans:condExpr', 'trans:thenExpr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.condExpr, this.thenExpr) },
            toString: function() {
                return Strings.format(
                    '%s(%s: %s)',
                    this.constructor.name, this.condExpr, this.thenExpr) },
        },
        conversion: {
            asJS: function(depth) {
                return 'case ' + this.condExpr.asJS(depth) + ': ' + this.thenExpr.asJS(depth);
            },
        },
    },

    'default': {
        className: 'Default', rules: [':pos', 'trans:defaultExpr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.defaultExpr) },
            toString: function() { return Strings.format(
                '%s(default: %s)',
                this.constructor.name,  this.defaultExpr) },
        },
        conversion: {
            asJS: function(depth) { return 'default: ' + this.defaultExpr.asJS(depth) },
        },
    },

    'regex': {
        className: 'Regex', rules: [':pos', ':exprString', ':flags'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, this.exprString, this.flags) },
            toString: function() { return Strings.format('(/%s/%s)', this.exprString, this.flags) },
        },
        conversion: {
            asJS: function(depth) { return '/' + this.exprString + '/' + this.flags},
        },
    },

    label: {
        className: 'Label', rules: [':pos', ':name'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"' + this.name + '"') },
            toString: function() { return Strings.format('%s(%s)', this.constructor.name, this.name) },
        },
        conversion: {
            asJS: function(depth) { return this.name; },
        },
    },

    labelDcl: {
        className: 'LabelDeclaration', rules: [':pos', ':name', 'trans:expr'],
        debugging: {
            printConstruction: function() { return this.printConstructorCall(this.pos, '"' + this.name + '"', this.expr) },
            toString: function() { return Strings.format('%s(%s is %s)', this.constructor.name, this.name, this.expr) },
        },
        conversion: {
            asJS: function(depth) { return this.name + ': ' + this.expr.asJS(depth) },
        },
    },
},
'rule helper', {

    rulesReturningSomething: function(ruleSpec) {
        if (!ruleSpec.rules) return [];
        return ruleSpec.rules.reject(function(ea) { return ea.startsWith(':') || !ea.include(':') });
    },

    forCollectionRulesDo: function(ruleSpec, func) {
        // rule "trans*:foo"
        var rules = this.rulesReturningSomething(ruleSpec),
            collectionRules = rules.select(function(ea) {return ea.include('*:') });
        collectionRules.forEach(function(rule) {
            var ruleParts = rule.split('*:');
            func.apply(this, ruleParts);
        }, this);
        return collectionRules;
    },

    forSimpleRulesDo: function(ruleSpec, func) {
        // rule "trans:foo"
        var rules = this.rulesReturningSomething(ruleSpec),
            collectionRules = rules.select(function(ea) {return ea.include('*:') }),
        simpleRules = rules.withoutAll(collectionRules);
        simpleRules.forEach(function(rule) {
            var ruleParts = rule.split(':');
            func.apply(this, ruleParts);
        }, this);
        return simpleRules;
    },

},
'file handling', {

    writeToFile: function(fileName, content) {
        var baseURL = URL.codeBase.withFilename(this.modulePath.replace(/\./g, '/')),
            url = baseURL.withFilename('generated/' + fileName);
        new WebResource(url).put(content);
    },

},
'rule creation', {

    createRule: function(name, spec) {
        var ownRules = spec.rules || [],
            argNames = this.argsFromRules(ownRules),
            className = this.modulePath + spec.className,
            ruleAppString = ownRules.length > 0 ? ('\t' + ownRules.join(' ') + '\n') : '',
            ruleStart = name + ' =\n',
            ruleReturn = Strings.format('\t-> { new %s(%s) },', className, argNames.join(', '));
        return ruleStart + ruleAppString + ruleReturn;
    },

    argsFromRules: function(rules) {
        if (!rules) return [];
        return rules
               .select(function(ea) { return ea.include(':') })
               .collect(function(ea) { return ea.split(':').last() });
    },

    createJSTranslatorSource: function() {
        var rules = this.customRules();
        Properties.forEachOwn(this.translatorRules(), function(name, ruleSpec) {
            rules.push(this.createRule(name, ruleSpec));
        }, this);

        var head = 'ometa JSTranslator <: Parser {\n',
            body = rules.join('\n'),
            end = '\n}';

        body = body.substring(0, body.length-1); // remove last ,

        return head + body + end;
    },

    writeAndEvalTranslator: function() {
        var source = this.createJSTranslatorSource(),
            translated = OMetaSupport.translateToJs(source);
        eval(translated);
        var content = Strings.format(
            'module(\'lively.ast.generated.Translator\').' +
                'requires(\'ometa.lively\').toRun(function() {\n%s\n});', translated)
        this.writeToFile('Translator.ometa', source);
        this.writeToFile('Translator.js', content);
    },
},

'class creation', {

    assignmentsFromArgs: function(argNames) {
        return argNames.collect(function(ea) {
            return Strings.format('\t\tthis.%s = %s;', ea, ea);
        }).join('\n');
    },

    parentCallsFromRules: function(ruleSpec) {
        // new lively.ast.SourceGenerator().parentCallsFromRules({rules: ['trans:foo', 'trans*:bar']})
        var parentCalls = [];
        this.forCollectionRulesDo(ruleSpec, function(rule, ruleVarName) {
            var str = Strings.format('\t\t%s.forEach(function(node) { node.setParent(this) }, this);', ruleVarName);
            parentCalls.push(str)
        });

        this.forSimpleRulesDo(ruleSpec, function(rule, ruleVarName) {
            var str = Strings.format('\t\t%s.setParent(this);', ruleVarName);
            parentCalls.push(str);
        });

        return parentCalls.join('\n');
    },

    createASTClass: function(ruleSpec) {
        var className = this.modulePath + ruleSpec.className,
            superclassName = this.rootNodeClassName,
            args = this.argsFromRules(ruleSpec.rules),
            setParentCalls = this.parentCallsFromRules(ruleSpec),
            assignments = this.assignmentsFromArgs(args),
            categories = [];

        // testing category
        categories.push(Strings.format('\n\'testing\', {\n\t%s: true,\n}',
                                       this.genTypeProperty(ruleSpec.className)));

        // intializer category
        if (args.length > 0 && !Properties.own(ruleSpec).include('initializing')) {
            categories.push(Strings.format(
                '\n\'initializing\', {\n\tinitialize: function($super, %s) {\n%s\n%s\n\t},\n}',
                args.join(', '), assignments, setParentCalls));
        }

        // other categories
        Properties.own(ruleSpec).without('className', 'rules').forEach(function(catName) {
            var src = '\n\'' + catName + '\', {\n',
                category = ruleSpec[catName],
                functionNames = Functions.own(category);
            functionNames.forEach(function(name) {
                src += Strings.format('\t%s: %s,\n', name, category[name])
            });
            src += '}';
            categories.push(src);
        });

        categories.push(this.visitingCategoryForNode(ruleSpec));

        var body = categories.join(','),
        def = Strings.format('%s.subclass(\'%s\',%s)', superclassName, className, body);

        return def
    },

    genTypeProperty: function(className) {
        return 'is' + className;
    },

    createASTClassSourcesFromRules: function() {
        var classDefs = this.customClasses();
        Properties.forEachOwn(this.translatorRules(), function(name, ruleSpec) {
            classDefs.push(this.createASTClass(ruleSpec));
        }, this);
        return classDefs.join(';\n\n')
    },

    evalAndWriteClasses: function() {
        var src = this.createASTClassSourcesFromRules();
        src += ';\n\n';
        src += this.abstractVisitorClassSource();
        eval(src);

        var baseName = 'Nodes',
            moduleName = this.modulePath + 'generated.' + baseName,
            fileName = baseName + '.js',
            content = Strings.format('module(\'%s\').requires().toRun(function() {\n%s\n});', moduleName, src);
        this.writeToFile(fileName, content);
    },

},
'visitor creation', {

    abstractVisitorClassSource: function() {
        var categories = [this.visitingCategoryForAbstractVisitor()/*, this.doubleDispatchCategoryForVisitor()*/];
        return Strings.format('Object.subclass(\'%s\',%s)', this.visitorClassName, categories.join(',\n'));
    },

    visitingCategoryForAbstractVisitor: function(ruleSpec) {
        var src = '\n\'visiting\', {\n';
        src += '\tvisit: function(node) { return node.accept(this) },\n';
        Properties.forEachOwn(this.translatorRules(), function(name, ruleSpec) {
            src += Strings.format('\tvisit%s: function(node) {},\n', ruleSpec.className);
        });
        src += '\n}'
        return src;
    },

    doubleDispatchCategoryForVisitor: function() {
        // new lively.ast.SourceGenerator().doubleDispatchCategoryForVisitor()
        // currently not used
        var createVisitAndAcceptCalls = function(ruleSpec) {
            var calls = [];
            calls.push('\t\this.visit(node);')
            this.forCollectionRulesDo(ruleSpec, function(rule, ruleVarName) {
                var str = Strings.format('\t\tnode.%s.forEach(function(ea) { this.visit(ea) }, this);', ruleVarName);
                calls.push(str)
            });

            this.forSimpleRulesDo(ruleSpec, function(rule, ruleVarName) {
                var str = Strings.format('\t\tthis.visit(node.%s);', ruleVarName);
                calls.push(str);
            });
            return calls.join('\n')

        }.bind(this)

        var src = '\n\'double dispatch\', {\n';
        Properties.forEachOwn(this.translatorRules(), function(name, ruleSpec) {
            src += Strings.format('\taccept%s: function(node) {\n%s\n\t},\n', ruleSpec.className, createVisitAndAcceptCalls(ruleSpec));
        });

        src += '\n}'

        return src;
    },

    visitingCategoryForNode: function(ruleSpec) {
        return "\n'visiting', {\n"
             + "    accept: function(visitor) {\n"
             + "        return visitor.visit" + ruleSpec.className + "(this);\n"
             + "    }\n"
             + " }";
    }

});


Object.extend(lively.ast.Node, {
    placeholder: {}
});

}) // end of module
