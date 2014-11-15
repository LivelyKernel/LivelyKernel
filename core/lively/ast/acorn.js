// FIXME rk 2013-06-10
// we need the right order of libs to be loaded, this should eventually be
// supported by lively.Module>>requireLib
// also: when requirejs is present the acorn library files try to use it for
// loading and don't expose the acorn global. the current solution for this
// right now is to support both schemes here
var acornLibsLoaded = false;
var acornLibs = [
    Config.codeBase + 'lib/acorn/acorn.js',
    Config.codeBase + 'lib/acorn/acorn-loose.js',
    Config.codeBase + 'lib/acorn/acorn-walk.js',
    Config.codeBase + 'lib/escodegen.browser.js'
];
(function loadAcornLibs() {
    if (typeof requirejs !== "undefined") loadAcornWithRequireJS()
    else loadAcornManually();
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function loadAcornManually() {
        var dependencies = [
            {url: acornLibs[0], loadTest: function() { return typeof acorn !== 'undefined'; }},
            {url: acornLibs[1], loadTest: function() { return typeof acorn !== 'undefined' && typeof acorn.parse_dammit !== 'undefined'; }},
            {url: acornLibs[2], loadTest: function() { return typeof acorn !== 'undefined' && typeof acorn.walk !== 'undefined'; }},
            {url: acornLibs[3], loadTest: function() { return typeof escodegen !== 'undefined'; }}
        ];
        dependencies.doAndContinue(function(next, lib) {
            JSLoader.loadJs(lib.url);
            var interval = Global.setInterval(function() {
                if (!lib.loadTest()) return;
                Global.clearInterval(interval);
                next();
            }, 50);
        }, function() { acornLibsLoaded = true; });
    }
    function loadAcornWithRequireJS() {
        // FIXME how to access requirejs' require cleanly?
        requirejs.s.contexts._.require(['core/lib/acorn/acorn.js', 'core/lib/acorn/acorn-loose.js', 'core/lib/acorn/acorn-walk.js'], function(acorn, acornLoose, acornWalk) {
            Global.acorn = acorn;
            Object.extend(acorn, acornLoose);
            acorn.walk = acornWalk;
            acornLibsLoaded = true; });
    }
})();

module("lively.ast.acorn").requires().requiresLib({urls: acornLibs, loadTest: function() { return !!acornLibsLoaded; }}).toRun(function() {

module('lively.ast.AstHelper').load();

Object.extend(acorn.walk, {

    forEachNode: function(ast, func, state, options) {
        // note: func can get called with the same node for different
        // visitor callbacks!
        // func args: node, state, depth, type
        options = options || {};
        var traversal = options.traversal || 'preorder'; // also: postorder
        var visitors = Object.clone(options.visitors ? options.visitors : acorn.walk.visitors.withMemberExpression);
        var iterator = traversal === 'preorder' ?
            function(orig, type, node, depth, cont) { func(node, state, depth, type); return orig(node, depth+1, cont); } :
            function(orig, type, node, depth, cont) { var result = orig(node, depth+1, cont); func(node, state, depth, type); return result; };
        Object.keys(visitors).forEach(function(type) {
            var orig = visitors[type];
            visitors[type] = function(node, depth, cont) { return iterator(orig, type, node, depth, cont); };
        });
        acorn.walk.recursive(ast, 0, null, visitors);
        return ast;
    },

    matchNodes: function(ast, visitor, state, options) {
        function visit(node, state, depth, type) {
            if (visitor[node.type]) visitor[node.type](node, state, depth, type);
        }
        return acorn.walk.forEachNode(ast, visit, state, options);
    },

    findNodesIncluding: function(ast, pos, test, base) {
        var nodes = [];
        base = base || Object.clone(acorn.walk.visitors.withMemberExpression);
        Object.keys(base).forEach(function(name) {
            var orig = base[name];
            base[name] = function(node, state, cont) {
                nodes.pushIfNotIncluded(node);
                return orig(node, state, cont);
            }
        });
        base["Property"] = function (node, st, c) {
            nodes.pushIfNotIncluded(node);
            c(node.key, st, "Expression");
            c(node.value, st, "Expression");
        }
        base["LabeledStatement"] = function (node, st, c) {
            node.label && c(node.label, st, "Expression");
            c(node.body, st, "Statement");
        }
        acorn.walk.findNodeAround(ast, pos, test, base);
        return nodes;
    },

    addSource: function(ast, source, completeSrc, forceNewSource) {
        source = Object.isString(ast) ? ast : source;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        completeSrc = !!completeSrc;
        return acorn.walk.forEachNode(ast, function(node) {
            if (node.source && !forceNewSource) return;
            node.source = completeSrc ?
                source : source.slice(node.start, node.end);
        });
    },

    inspect: function(ast, source) {
        source = Object.isString(ast) ? ast : null;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        source && acorn.walk.addSource(ast, source);
        return Objects.inspect(ast);
    },

    withParentInfo: function(ast, iterator, options) {
        // options = {visitAllNodes: BOOL}
        options = options || {};
        function makeScope(parentScope) {
            var scope = {id: Strings.newUUID(), parentScope: parentScope, containingScopes: []};
            parentScope && parentScope.containingScopes.push(scope);
            return scope;
        }
        var visitors = acorn.walk.make({
            Function: function(node, st, c) {
                if (st && st.scope) st.scope = makeScope(st.scope);
                c(node.body, st, "ScopeBody");
            },
            VariableDeclarator: function(node, st, c) {
                // node.id && c(node.id, st, 'Identifier');
                node.init && c(node.init, st, 'Expression');
            },
            VariableDeclaration: function(node, st, c) {
                for (var i = 0; i < node.declarations.length; ++i) {
                    var decl = node.declarations[i];
                    if (decl) c(decl, st, "VariableDeclarator");
                }
            },
            ObjectExpression: function(node, st, c) {
                for (var i = 0; i < node.properties.length; ++i) {
                    var prop = node.properties[i];
                    c(prop.key, st, "Expression");
                    c(prop.value, st, "Expression");
                }
            },
            MemberExpression: function(node, st, c) {
                c(node.object, st, "Expression");
                c(node.property, st, "Expression");
            }
        });
        var lastActiveProp, getters = [];
        acorn.walk.forEachNode(ast, function(node) {
            Object.keys(node).without('end', 'start', 'type', 'source', 'raw').forEach(function(propName) {
                if (node.__lookupGetter__(propName)) return; // already defined
                var val = node[propName];
                node.__defineGetter__(propName, function() { lastActiveProp = propName; return val; });
                getters.push([node, propName, node[propName]]);
            });
        }, null, {visitors: visitors});
        var result = [];
        Object.keys(visitors).forEach(function(type) {
            var orig = visitors[type];
            visitors[type] = function(node, state, cont) {
                if (type === node.type || options.visitAllNodes) {
                    result.push(iterator.call(null, node, {scope: state.scope, depth: state.depth, parent: state.parent, type: type, propertyInParent: lastActiveProp}));
                    return orig(node, {scope: state.scope, parent: node, depth: state.depth+1}, cont);
                } else {
                    return orig(node, state, cont);
                }
            }
        });
        acorn.walk.recursive(ast, {scope: makeScope(), parent: null, propertyInParent: '', depth: 0}, null, visitors);
        getters.forEach(function(nodeNameVal) {
            delete nodeNameVal[0][nodeNameVal[1]];
            nodeNameVal[0][nodeNameVal[1]] = nodeNameVal[2];
        });
        return result;
    },

    toLKObjects: function(ast) {
        if (!!!ast.type) throw new Error('Given AST is not an Acorn AST.');
        function newUndefined(start, end) {
            start = start || -1;
            end = end || -1;
            return new lively.ast.Variable([start, end], 'undefined');
        }
        var visitors = {
            Program: function(n, c) {
                return new lively.ast.Sequence([n.start, n.end], n.body.map(c))
            },
            FunctionDeclaration: function(n, c) {
                var args = n.params.map(function(param) {
                    return new lively.ast.Variable(
                        [param.start, param.end], param.name
                    );
                });
                var fn = new lively.ast.Function(
                    [n.id.end, n.end], c(n.body), args
                );
                return new lively.ast.VarDeclaration(
                    [n.start, n.end], n.id.name, fn
                );
            },
            BlockStatement: function(n, c) {
                var children = n.body.map(c);
                return new lively.ast.Sequence([n.start + 1, n.end], children);
            },
            ExpressionStatement: function(n, c) {
                return c(n.expression); // just skip it
            },
            CallExpression: function(n, c) {
                if ((n.callee.type == 'MemberExpression') &&
                    (n.type != 'NewExpression')) { // reused in NewExpression
                    // Send
                    var property; // property
                    var r = n.callee.object; // reciever
                     if (n.callee.computed) {
                        // object[property] => Expression
                        property = c(n.callee.property)
                    } else {
                        // object.property => Identifier
                        property = new lively.ast.String(
                            [n.callee.property.start, n.callee.property.end],
                            n.callee.property.name
                        );
                    }
                    return new lively.ast.Send(
                        [n.start, n.end], property, c(r), n.arguments.map(c)
                    );
                } else {
                    return new lively.ast.Call(
                        [n.start, n.end],
                        c(n.callee),
                        n.arguments.map(c)
                    );
                }
            },
            MemberExpression: function(n, c) {
                var slotName;
                if (n.computed) {
                    // object[property] => Expression
                    slotName = c(n.property)
                } else {
                    // object.property => Identifier
                    slotName = new lively.ast.String(
                        [n.property.start, n.property.end], n.property.name
                    );
                }
                return new lively.ast.GetSlot(
                    [n.start, n.end], slotName, c(n.object)
                );
            },
            NewExpression: function(n, c) {
                return new lively.ast.New(
                    [n.start, n.end], this.CallExpression(n, c)
                );
            },
            VariableDeclaration: function(n, c) {
                var start = n.declarations[0] ? n.declarations[0].start - 1 : n.start;
                return new lively.ast.Sequence(
                    [start, n.end], n.declarations.map(c)
                );
            },
            VariableDeclarator: function(n, c) {
                var value = n.init ? c(n.init) : newUndefined(n.start -1, n.start - 1);
                return new lively.ast.VarDeclaration(
                    [n.start - 1, n.end], n.id.name, value
                );
            },
            FunctionExpression: function(n, c) {
                var args = n.params.map(function(param) {
                    return new lively.ast.Variable(
                        [param.start, param.end], param.name
                    );
                });
                return new lively.ast.Function(
                    [n.start, n.end], c(n.body), args
                );
            },
            IfStatement: function(n, c) {
                return new lively.ast.If(
                    [n.start, n.end],
                    c(n.test),
                    c(n.consequent),
                    n.alternate ? c(n.alternate) :
                        newUndefined(n.consequent.end, n.consequent.end)
                );
            },
            ConditionalExpression: function(n, c) {
                return new lively.ast.Cond(
                    [n.start, n.end], c(n.test), c(n.consequent), c(n.alternate)
                );
            },
            SwitchStatement: function(n, c) {
                return new lively.ast.Switch(
                    [n.start, n.end], c(n.discriminant), n.cases.map(c)
                );
            },
            SwitchCase: function(n, c) {
                var start = n.consequent.length > 0 ? n.consequent[0].start : n.end;
                var end = n.consequent.length > 0 ? n.consequent[n.consequent.length - 1].end : n.end;
                var seq = new lively.ast.Sequence([start, end], n.consequent.map(c));
                if (n.test != null) {
                    return new lively.ast.Case([n.start, n.end], c(n.test), seq);
                } else {
                    return new lively.ast.Default([n.start, n.end], seq);
                }
            },
            BreakStatement: function(n, c) {
                var label;
                if (n.label == null) {
                    label = new lively.ast.Label([n.end, n.end], '');
                } else {
                    label = new lively.ast.Label(
                        [n.label.start, n.label.end], n.label.name
                    );
                }
                return new lively.ast.Break([n.start, n.end], label);
            },
            ContinueStatement: function(n, c) {
                var label;
                if (n.label == null) {
                    label = new lively.ast.Label([n.end, n.end], '');
                } else {
                    label = new lively.ast.Label(
                        [n.label.start, n.label.end], n.label.name
                    );
                }
                return new lively.ast.Continue([n.start, n.end], label);
            },
            TryStatement: function(n, c) {
                var errVar, catchSeq;
                if (n.handler) {
                    catchSeq = c(n.handler.body);
                    errVar = c(n.handler.param);
                } else {
                    catchSeq = newUndefined(n.block.end + 1, n.block.end + 1);
                    errVar = newUndefined(n.block.end + 1, n.block.end + 1);
                }
                var finallySeq = n.finalizer ?
                    c(n.finalizer) : newUndefined(n.end, n.end);
                return new lively.ast.TryCatchFinally(
                    [n.start, n.end], c(n.block), errVar, catchSeq, finallySeq
                );
            },
            ThrowStatement: function(n, c) {
                return new lively.ast.Throw([n.start, n.end], c(n.argument));
            },
            ForStatement: function(n, c) {
                var init = n.init ? c(n.init) : newUndefined(4, 4);
                var cond = n.test ? c(n.test) :
                    newUndefined(init.pos[1] + 1, init.pos[1] + 1);
                var upd = n.update ? c(n.update) :
                    newUndefined(cond.pos[1] + 1, cond.pos[1] + 1);
                return new lively.ast.For(
                    [n.start, n.end], init, cond, c(n.body), upd
                );
            },
            ForInStatement: function(n, c) {
                var left = n.left.type == 'VariableDeclaration' ?
                    c(n.left.declarations[0]) : c(n.left);
                return new lively.ast.ForIn(
                    [n.start, n.end], left, c(n.right), c(n.body)
                );
            },
            WhileStatement: function(n, c) {
                return new lively.ast.While(
                    [n.start, n.end], c(n.test), c(n.body)
                );
            },
            DoWhileStatement: function(n, c) {
                return new lively.ast.DoWhile(
                    [n.start, n.end], c(n.body), c(n.test)
                );
            },
            WithStatement: function(n ,c) {
                return new lively.ast.With([n.start, n.end], c(n.object), c(n.body));
            },
            UnaryExpression: function(n, c) {
                return new lively.ast.UnaryOp(
                    [n.start, n.end], n.operator, c(n.argument)
                );
            },
            BinaryExpression: function(n, c) {
                return new lively.ast.BinaryOp(
                    [n.start, n.end], n.operator, c(n.left), c(n.right)
                );
            },
            AssignmentExpression: function(n, c) {
                if (n.operator == '=') {
                    return new lively.ast.Set(
                        [n.start, n.end], c(n.left), c(n.right)
                    );
                } else {
                    return new lively.ast.ModifyingSet(
                        [n.start, n.end],
                        c(n.left), n.operator.substr(0, n.operator.length - 1), c(n.right)
                    );
                }
            },
            UpdateExpression: function(n, c) {
                if (n.prefix) {
                    return new lively.ast.PreOp(
                        [n.start, n.end], n.operator, c(n.argument)
                    );
                } else {
                    return new lively.ast.PostOp(
                        [n.start, n.end], n.operator, c(n.argument)
                    );
                }
            },
            ReturnStatement: function(n, c) {
                return new lively.ast.Return(
                    [n.start, n.end],
                    n.argument ? c(n.argument) : newUndefined(n.end, n.end)
                );
            },
            Identifier: function(n, c) {
                return new lively.ast.Variable([n.start, n.end], n.name);
            },
            Literal: function(n, c) {
                if (Object.isNumber(n.value)) {
                    return new lively.ast.Number([n.start, n.end], n.value);
                } else if (Object.isBoolean(n.value)) {
                    return new lively.ast.Variable(
                        [n.start, n.end], n.value.toString()
                    );
                } else if (Object.isString(n.value)) {
                    return new lively.ast.String(
                        [n.start, n.end], n.value
                    );
                } else if (Object.isRegExp(n.value)) {
                    var flags = n.raw.substr(n.raw.lastIndexOf('/') + 1);
                    return new lively.ast.Regex(
                        [n.start, n.end], n.value.source, flags
                    );
                } else if (n.value === null) {
                    return new lively.ast.Variable([n.start, n.end], 'null');
                }
                throw new Error('Case of Literal not handled!');
            },
            ObjectExpression: function(n, c) {
                var props = n.properties.map(function(prop) {
                    var propName = prop.key.type == 'Identifier' ?
                        prop.key.name :
                        prop.key.value;
                    if (prop.kind == 'init') {
                        return new lively.ast.ObjProperty(
                            [prop.key.start, prop.value.end], propName, c(prop.value)
                        );
                    } else if (prop.kind == 'get') {
                        return new lively.ast.ObjPropertyGet(
                            [prop.key.start, prop.value.end], propName,
                            c(prop.value.body)
                        );
                    } else if (prop.kind == 'set') {
                        return new lively.ast.ObjPropertySet(
                            [prop.key.start, prop.value.end], propName,
                            c(prop.value.body), c(prop.value.params[0])
                        );
                    } else {
                        throw new Error('Case of ObjectExpression not handled!');
                    }
                });
                return new lively.ast.ObjectLiteral(
                    [n.start, n.end], props
                );
            },
            ArrayExpression: function(n, c) {
                return new lively.ast.ArrayLiteral([n.start, n.end], n.elements.map(c));
            },
            SequenceExpression: function(n, c) {
                return new lively.ast.Sequence(
                    [n.start, n.end], n.expressions.map(c)
                );
            },
            EmptyStatement: function(n, c) {
                return newUndefined(n.start, n.end);
            },
            ThisExpression: function(n, c) {
                return new lively.ast.This([n.start, n.end]);
            },
            DebuggerStatement: function(n, c) {
                return new lively.ast.Debugger([n.start, n.end]);
            },
            LabeledStatement: function(n, c) {
                return new lively.ast.LabelDeclaration(
                    [n.start, n.end], n.label.name, c(n.body)
                );
            }
        }
        visitors.LogicalExpression = visitors.BinaryExpression;
        function c(node) {
            return visitors[node.type](node, c);
        }
        return c(ast);
    },

    copy: function(ast, override) {
        var visitors = Object.extend({
            Program: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'Program',
                    body: n.body.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            FunctionDeclaration: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'FunctionDeclaration',
                    id: c(n.id), params: n.params.map(c), body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            BlockStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'BlockStatement',
                    body: n.body.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            ExpressionStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ExpressionStatement',
                    expression: c(n.expression),
                    source: n.source, astIndex: n.astIndex
                };
            },
            CallExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'CallExpression',
                    callee: c(n.callee), arguments: n.arguments.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            MemberExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'MemberExpression',
                    object: c(n.object), property: c(n.property), computed: n.computed,
                    source: n.source, astIndex: n.astIndex
                };
            },
            NewExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'NewExpression',
                    callee: c(n.callee), arguments: n.arguments.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            VariableDeclaration: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'VariableDeclaration',
                    declarations: n.declarations.map(c), kind: n.kind,
                    source: n.source, astIndex: n.astIndex
                };
            },
            VariableDeclarator: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'VariableDeclarator',
                    id: c(n.id), init: c(n.init),
                    source: n.source, astIndex: n.astIndex
                };
            },
            FunctionExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'FunctionExpression',
                    id: c(n.id), params: n.params.map(c), body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            IfStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'IfStatement',
                    test: c(n.test), consequent: c(n.consequent),
                    alternate: c(n.alternate),
                    source: n.source, astIndex: n.astIndex
                };
            },
            ConditionalExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ConditionalExpression',
                    test: c(n.test), consequent: c(n.consequent),
                    alternate: c(n.alternate),
                    source: n.source, astIndex: n.astIndex
                };
            },
            SwitchStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'SwitchStatement',
                    discriminant: c(n.discriminant), cases: n.cases.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            SwitchCase: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'SwitchCase',
                    test: c(n.test), consequent: n.consequent.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            BreakStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'BreakStatement',
                    label: n.label,
                    source: n.source, astIndex: n.astIndex
                };
            },
            ContinueStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ContinueStatement',
                    label: n.label,
                    source: n.source, astIndex: n.astIndex
                };
            },
            TryStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'TryStatement',
                    block: c(n.block), handler: c(n.handler), finalizer: c(n.finalizer),
                    guardedHandlers: n.guardedHandlers.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            CatchClause: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'CatchClause',
                    param: c(n.param), guard: c(n.guard), body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            ThrowStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ThrowStatement',
                    argument: c(n.argument),
                    source: n.source, astIndex: n.astIndex
                };
            },
            ForStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ForStatement',
                    init: c(n.init), test: c(n.test), update: c(n.update),
                    body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            ForInStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ForInStatement',
                    left: c(n.left), right: c(n.right), body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            WhileStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'WhileStatement',
                    test: c(n.test), body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            DoWhileStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'DoWhileStatement',
                    test: c(n.test), body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            WithStatement: function(n ,c) {
                return {
                    start: n.start, end: n.end, type: 'WithStatement',
                    object: c(n.object), body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            },
            UnaryExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'UnaryExpression',
                    argument: c(n.argument), operator: n.operator, prefix: n.prefix,
                    source: n.source, astIndex: n.astIndex
                };
            },
            BinaryExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'BinaryExpression',
                    left: c(n.left), operator: n.operator, right: c(n.right),
                    source: n.source, astIndex: n.astIndex
                };
            },
            LogicalExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'LogicalExpression',
                    left: c(n.left), operator: n.operator, right: c(n.right),
                    source: n.source, astIndex: n.astIndex
                };
            },
            AssignmentExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'AssignmentExpression',
                    left: c(n.left), operator: n.operator, right: c(n.right),
                    source: n.source, astIndex: n.astIndex
                };
            },
            UpdateExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'UpdateExpression',
                    argument: c(n.argument), operator: n.operator, prefix: n.prefix,
                    source: n.source, astIndex: n.astIndex
                };
            },
            ReturnStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ReturnStatement',
                    argument: c(n.argument),
                    source: n.source, astIndex: n.astIndex
                };
            },
            Identifier: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'Identifier',
                    name: n.name,
                    source: n.source, astIndex: n.astIndex
                };
            },
            Literal: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'Literal',
                    value: n.value, raw: n.raw /* Acorn-specific */,
                    source: n.source, astIndex: n.astIndex
                };
            },
            ObjectExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ObjectExpression',
                    properties: n.properties.map(function(prop) {
                        return {
                            key: c(prop.key), value: c(prop.value), kind: prop.kind
                        };
                    }),
                    source: n.source, astIndex: n.astIndex
                };
            },
            ArrayExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ArrayExpression',
                    elements: n.elements.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            SequenceExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'SequenceExpression',
                    expressions: n.expressions.map(c),
                    source: n.source, astIndex: n.astIndex
                };
            },
            EmptyStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'EmptyStatement',
                    source: n.source, astIndex: n.astIndex
                };
            },
            ThisExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ThisExpression',
                    source: n.source, astIndex: n.astIndex
                };
            },
            DebuggerStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'DebuggerStatement',
                    source: n.source, astIndex: n.astIndex
                };
            },
            LabeledStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'LabeledStatement',
                    label: n.label, body: c(n.body),
                    source: n.source, astIndex: n.astIndex
                };
            }
        }, override || {});

        function c(node) {
            if (node === null) return null;
            return visitors[node.type](node, c);
        }
        return c(ast);
    },

    findSiblings: function(ast, node, beforeOrAfter) {
        if (!node) return [];
        var nodes = acorn.walk.findNodesIncluding(ast, node.start),
            idx = nodes.indexOf(node),
            parents = nodes.slice(0, idx),
            parentWithBody = parents.reverse().detect(function(p) { return Object.isArray(p.body); }),
            siblingsWithNode = parentWithBody.body;
        if (!beforeOrAfter) return siblingsWithNode.without(node);
        var nodeIdxInSiblings = siblingsWithNode.indexOf(node);
        return beforeOrAfter === 'before' ?
            siblingsWithNode.slice(0, nodeIdxInSiblings) :
            siblingsWithNode.slice(nodeIdxInSiblings + 1);
    },

    visitors: []

});

// cached visitors that are used often
Object.extend(acorn.walk.visitors, {

    stopAtFunctions: acorn.walk.make({
        'Function': function() { /* stop descent */ }
    }),

    withMemberExpression: acorn.walk.make({
        MemberExpression: function(node, st, c) {
            c(node.object, st, "Expression");
            c(node.property, st, "Expression");
        }
    })

});

Object.extend(lively.ast.acorn, {

    parse: function(source, options) {
        // proxy function to acorn.parse.
        // Note that we will implement useful functionality on top of the pure
        // acorn interface and make it available here (such as more convenient
        // comment parsing). For using the pure acorn interface use the acorn
        // global.
        // See https://github.com/marijnh/acorn for full acorn doc and parse options.
        // options: {
        //   addSource: BOOL, -- add source property to each node
        //   addAstIndex: BOOL, -- each node gets an index  number
        //   withComments: BOOL, -- adds comment objects to Program/BlockStatements:
        //                          {isBlock: BOOL, text: STRING, node: NODE,
        //                           start: INTEGER, end: INTEGER, line: INTEGER, column: INTEGER}
        //   ecmaVersion: 3|5|6,
        //   allowReturnOutsideFunction: BOOL, -- Default is false
        //   locations: BOOL -- Default is false
        // }

        options = options || {};
        options.ecmaVersion = 6;

        if (options.withComments) {
            // record comments
            delete options.withComments;
            var comments = [];
            options.onComment = function(isBlock, text, start, end, line, column) {
                comments.push({
                    isBlock: isBlock,
                    text: text, node: null,
                    start: start, end: end,
                    line: line, column: column
                });
            };
        }

        var ast = options.addSource ?
            acorn.walk.addSource(source, options) : // FIXME
            acorn.parse(source, options);

        if (options.addAstIndex && !ast.hasOwnProperty('astIndex')) acorn.walk.addAstIndex(ast);

        if (ast && comments) attachCommentsToAST({ast: ast, comments: comments, nodesWithComments: []});

        return ast;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function attachCommentsToAST(commentData) {
            // for each comment: assign the comment to a block-level AST node
            commentData = mergeComments(assignCommentsToBlockNodes(commentData));
            ast.allComments = commentData.comments;
        }

        function assignCommentsToBlockNodes(commentData) {
            comments.forEach(function(comment) { 
              var node = lively.ast.acorn.nodesAt(comment.start, ast)
                      .reverse().detect(function(node) {
                          return node.type === 'BlockStatement' || node.type === 'Program'; })
              if (!node) node = ast;
              if (!node.comments) node.comments = [];
              node.comments.push(comment);
              commentData.nodesWithComments.push(node);
            });
            return commentData;
        }

        function mergeComments(commentData) {
            // coalesce non-block comments (multiple following lines of "// ...") into one comment.
            // This only happens if line comments aren't seperated by newlines
            commentData.nodesWithComments.forEach(function(blockNode) {
                blockNode.comments.clone().reduce(function(coalesceData, comment) {
                    if (comment.isBlock) {
                        coalesceData.lastComment = null;
                        return coalesceData;
                    }

                    if (!coalesceData.lastComment) {
                        coalesceData.lastComment = comment;
                        return coalesceData;
                    }
            
                    // if the comments are seperated by a statement, don't merge
                    var last = coalesceData.lastComment;
                    var nodeInbetween = blockNode.body.detect(function(node) { return node.start >= last.end && node.end <= comment.start; });
                    if (nodeInbetween) {
                        coalesceData.lastComment = comment;
                        return coalesceData;
                    }
                    
                    // if the comments are seperated by a newline, don't merge
                    var codeInBetween = source.slice(last.end, comment.start);
                    if (/[\n\r][\n\r]+/.test(codeInBetween)) {
                        coalesceData.lastComment = comment;
                        return coalesceData; 
                    }
            
                    // merge comments into one
                    last.text += "\n" + comment.text;
                    last.end = comment.end;
                    blockNode.comments.remove(comment);
                    commentData.comments.remove(comment);
                    return coalesceData;
                }, {lastComment: null});
            });
            return commentData;
        }

    },

    parseFunction: function(source, options) {
        options = options || {};
        options.ecmaVersion = 6;
        var src = '(' + source + ')',
            ast = acorn.parse(src);
        /*if (options.addSource) */acorn.walk.addSource(ast, src);
        return ast.body[0].expression;
    },

    parseLikeOMeta: function(src, rule) {
        // only an approximation, _like_ OMeta
        var self = this;
        function parse(source) {
            return acorn.walk.toLKObjects(self.parse(source));
        }

        var ast;
        switch (rule) {
        case 'expr':
        case 'stmt':
        case 'functionDef':
            ast = parse(src);
            if (ast.isSequence && (ast.children.length == 1)) {
                ast = ast.children[0];
                ast.setParent(undefined);
            }
            break;
        case 'memberFragment':
            src = '({' + src + '})'; // to make it valid
            ast = parse(src);
            ast = ast.children[0].properties[0];
            ast.setParent(undefined);
            break;
        case 'categoryFragment':
        case 'traitFragment':
            src = '[' + src + ']'; // to make it valid
            ast = parse(src);
            ast = ast.children[0];
            ast.setParent(undefined);
            break;
        default:
            ast = parse(src);
        }
        ast.source = src;
        return ast;
    },

    fuzzyParse: function(source, options) {
        // options: verbose, addSource, type
        options = options || {};
        options.ecmaVersion = 6;
        var ast, safeSource, err;
        if (options.type === 'LabeledStatement') { safeSource = '$={' + source + '}'; }
        try {
            // we only parse to find errors
            ast = lively.ast.acorn.parse(safeSource || source, options);
            if (safeSource) ast = null; // we parsed only for finding errors
            else if (options.addSource) acorn.walk.addSource(ast, source);
        } catch (e) { err = e; }
        if (err && err.raisedAt !== undefined) {
            if (safeSource) { // fix error pos
                err.pos -= 3; err.raisedAt -= 3; err.loc.column -= 3; }
            var parseErrorSource = '';
            parseErrorSource += source.slice(err.raisedAt - 20, err.raisedAt);
            parseErrorSource += '<-error->';
            parseErrorSource += source.slice(err.raisedAt, err.raisedAt + 20);
            options.verbose && show('parse error: ' + parseErrorSource);
            err.parseErrorSource = parseErrorSource;
        } else if (err && options.verbose) {
            show('' + err + err.stack);
        }
        if (!ast) {
            ast = acorn.parse_dammit(source, options);
            if (options.addSource) acorn.walk.addSource(ast, source);
            ast.isFuzzy = true;
            ast.parseError = err;
        }
        return ast;
    },

    nodesAt: function(pos, ast) {
        ast = Object.isString(ast) ? this.parse(ast) : ast;
        return acorn.walk.findNodesIncluding(ast, pos);
    }

});

}); // end of module
