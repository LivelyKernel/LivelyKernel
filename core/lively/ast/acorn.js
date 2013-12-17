// FIXME rk 2013-06-10
// we need the right order of libs to be loaded, this should eventually be
// supported by lively.Module>>requireLib
// also: when requirejs is present the acorn library files try to use it for
// loading and don't expose the acorn global. the current solution for this
// right now is to support both schemes here
var acornLibsLoaded = false;
(function loadAcornLibs() {
    if (typeof requirejs !== "undefined") loadAcornWithRequireJS()
    else loadAcornManually();
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function loadAcornManually() {
        var dependencies = [
            {url: Config.codeBase + 'lib/acorn/acorn.js',       loadTest: function() { return typeof acorn !== 'undefined'; }},
            {url: Config.codeBase + 'lib/acorn/acorn-loose.js', loadTest: function() { return typeof acorn !== 'undefined' && typeof acorn.parse_dammit !== 'undefined'; }},
            {url: Config.codeBase + 'lib/acorn/acorn-walk.js',  loadTest: function() { return typeof acorn !== 'undefined' && typeof acorn.walk !== 'undefined'; }},
            {url: Config.codeBase + 'lib/escodegen.browser.js', loadTest: function() { return typeof escodegen !== 'undefined'; }}
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

module("lively.ast.acorn").requires("lively.ide.SourceDatabase").requiresLib({loadTest: function() { return !!acornLibsLoaded; }}).toRun(function() {

(function extendAcorn() {

    acorn.walk.all = function walkASTNode(astNode, iterator, state) {
        // walks the tree that's defined by astNode and its referenced objects.
        // will maintain depth and path information of the current astNode. this
        // walker will follow all properties of astNode and every value that has a
        // "type" property will be interpreted as ast node. Note that astNode my
        // refere to intermediate objects (such as arrays) that are not nodes but
        // contain nodes.
        // Example:
        // all = []; acorn.walk.all(acorn.parse("1+2"), function(node, state) {
        //     all.push(Strings.indent(
        //         node.type + ' ' + state.referencedAs.join('.'),
        //         ' ', state.depth));
        // }); all.join('\n');
        //   result:
        //     Program
        //      ExpressionStatement body.0
        //       BinaryExpression expression
        //       Literal left
        //       Literal right
        function makeScope(parentScope) {
            var scope = {id: Strings.newUUID(), parentScope: parentScope, containingScopes: []};
            parentScope && parentScope.containingScopes.push(scope);
            return scope;
        }
        if (!state) state = {depth: 0, path: [], node: astNode, referencedAs: [], scope: makeScope(), parentState: {}};
        if (state.depth > 100) throw new Error('Endless recursion?');
        var isASTNode = !!astNode.type;
        if (isASTNode && astNode.type === 'FunctionExpression') state.scope = makeScope(state.scope);
        if (isASTNode) iterator(astNode, state);
        var excludedKeys = ['start', 'end', 'raw', 'source'];

        Object.getOwnPropertyNames(astNode).forEach(function(key) {
            if (excludedKeys.indexOf(key) !== -1) return;
            var val = astNode[key];
            if (val && typeof val === 'object') {
                walkASTNode(val, iterator, {
                    node: val,
                    depth: isASTNode ? state.depth + 1 : state.depth,
                    scope: state.scope,
                    path: state.path.concat([key]),
                    parentNode: isASTNode ? astNode : state.parentNode,
                    referencedAs: isASTNode ? [key] : state.referencedAs.concat([key]),
                    parentState: isASTNode ? state : state.parentState
                });
            }
        });
    };

    acorn.walk.forEachNode = function(ast, func, state, options) {
        // note: func can get called with the same node for different
        // visitor callbacks!
        // func args: node, state, depth, type
        options = options || {};
        var traversal = options.traversal || 'preorder'; // also: postorder
        var visitors = options.visitors ? Object.extend({}, options.visitors) : acorn.walk.make({
            MemberExpression: function(node, st, c) {
                c(node.object, st, "Expression");
                c(node.property, st, "Expression");
            }
        });
        var iterator = traversal === 'preorder' ?
            function(orig, type, node, depth, cont) { func(node, state, depth, type); return orig(node, depth+1, cont); } :
            function(orig, type, node, depth, cont) { var result = orig(node, depth+1, cont); func(node, state, depth, type); return result; };
        Object.keys(visitors).forEach(function(type) {
            var orig = visitors[type];
            visitors[type] = function(node, depth, cont) { return iterator(orig, type, node, depth, cont); };
        });
        acorn.walk.recursive(ast, 0, null, visitors);
        return ast;
    };

    acorn.walk.matchNodes = function(ast, visitor, state, options) {
        function visit(node, state, depth, type) {
            if (visitor[node.type]) visitor[node.type](node, state, depth, type);
        }
        return acorn.walk.forEachNode(ast, visit, state, options);
    };

    acorn.walk.findNodesIncluding = function(ast, pos, test, base) {
        var nodes = [];
        base = base || acorn.walk.make({
            MemberExpression: function(node, st, c) {
                c(node.object, st, "Expression");
                c(node.property, st, "Expression");
            }
        });
        Object.keys(base).forEach(function(name) {
            var orig = base[name];
            base[name] = function(node, state, cont) {
                nodes.pushIfNotIncluded(node);
                return orig(node, state, cont);
            }
        });
        acorn.walk.findNodeAround(ast, pos, test, base);
        return nodes;
    };

    acorn.walk.addSource = function(ast, source) {
        source = Object.isString(ast) ? ast : source;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        return acorn.walk.forEachNode(ast, function(node) {
            node.source || (node.source = source.slice(node.start, node.end));
        });
    };

    acorn.walk.inspect = function(ast, source) {
        source = Object.isString(ast) ? ast : null;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        source && acorn.walk.addSource(ast, source);
        return Objects.inspect(ast);
    };

    acorn.walk.withParentInfo = function(ast, iterator, options) {
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
    };

    acorn.walk.print = function(ast, source, options) {
        // options = {addSource: BOOL, nodeIndexes: BOOL, nodeLines: BOOL}
        // acorn.walk.print('12+3')
        options = options || {};
        source = Object.isString(ast) ? ast : source;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        var lineComputer = source && options.nodeLines ? Strings.lineIndexComputer(source) : null;
        var result = [];
        acorn.walk.all(ast, function(node, state) {
            // indent
            var string = Strings.indent('', '  ', state.depth);
            // referenced as
            string += state.referencedAs.length ? state.referencedAs.join('.') : 'root'
            // type
            string += ':' + node.type;
            // attributes, start/end index
            var attrs = [];
            if (options.nodeIndexes) attrs.push(node.start + '-' + node.start);
            if (lineComputer) attrs.push(lineComputer(node.start) + '-' + lineComputer(node.end));
            if (source && options.addSource) attrs.push(Strings.print(source.slice(node.start, node.end).replace(/\n|\r/g, '').truncate(20)));
            if (attrs.length) string += '<' + attrs.join(',') + '>';
            result.push(string);
        });
        return result.join('\n');
    };

    acorn.walk.toLKObjects = function(ast) {
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
    };

    acorn.walk.copy = function(ast, override) {
        var visitors = Object.extend({
            Program: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'Program',
                    body: n.body.map(c)
                };
            },
            FunctionDeclaration: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'FunctionDeclaration',
                    id: c(n.id), params: n.params.map(c), body: c(n.body)
                };
            },
            BlockStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'BlockStatement',
                    body: n.body.map(c)
                };
            },
            ExpressionStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ExpressionStatement',
                    expression: c(n.expression)
                };
            },
            CallExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'CallExpression',
                    callee: c(n.callee), arguments: n.arguments.map(c)
                };
            },
            MemberExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'MemberExpression',
                    object: c(n.object), property: c(n.property), computed: n.computed
                };
            },
            NewExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'NewExpression',
                    callee: c(n.callee), arguments: n.arguments.map(c)
                };
            },
            VariableDeclaration: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'VariableDeclaration',
                    declarations: n.declarations.map(c), kind: n.kind
                };
            },
            VariableDeclarator: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'VariableDeclarator',
                    id: c(n.id), init: c(n.init)
                };
            },
            FunctionExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'FunctionExpression',
                    id: c(n.id), params: n.params.map(c), body: c(n.body)
                };
            },
            IfStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'IfStatement',
                    test: c(n.test), consequent: c(n.consequent),
                    alternate: c(n.alternate)
                };
            },
            ConditionalExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ConditionalExpression',
                    test: c(n.test), consequent: c(n.consequent),
                    alternate: c(n.alternate)
                };
            },
            SwitchStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'SwitchStatement',
                    discriminant: c(n.discriminant), cases: n.cases.map(c)
                };
            },
            SwitchCase: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'SwitchCase',
                    test: c(n.test), consequent: n.consequent.map(c)
                };
            },
            BreakStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'BreakStatement',
                    label: n.label
                };
            },
            ContinueStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ContinueStatement',
                    label: n.label
                };
            },
            TryStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'TryStatement',
                    block: c(n.block), handler: c(n.handler), finalizer: c(n.finalizer),
                    guardedHandlers: n.guardedHandlers.map(c)
                };
            },
            CatchClause: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'CatchClause',
                    param: c(n.param), guard: c(n.guard), body: c(n.body)
                };
            },
            ThrowStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ThrowStatement',
                    argument: c(n.argument)
                };
            },
            ForStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ForStatement',
                    init: c(n.init), test: c(n.test), update: c(n.update),
                    body: c(n.body)
                };
            },
            ForInStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ForInStatement',
                    left: c(n.left), right: c(n.right), body: c(n.body)
                };
            },
            WhileStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'WhileStatement',
                    test: c(n.test), body: c(n.body)
                };
            },
            DoWhileStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'DoWhileStatement',
                    test: c(n.test), body: c(n.body)
                };
            },
            WithStatement: function(n ,c) {
                return {
                    start: n.start, end: n.end, type: 'WithStatement',
                    object: c(n.object), body: c(n.body)
                };
            },
            UnaryExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'UnaryExpression',
                    argument: c(n.argument), operator: n.operator, prefix: n.prefix
                };
            },
            BinaryExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'BinaryExpression',
                    left: c(n.left), operator: n.operator, right: c(n.right)
                };
            },
            LogicalExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'LogicalExpression',
                    left: c(n.left), operator: n.operator, right: c(n.right)
                };
            },
            AssignmentExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'AssignmentExpression',
                    left: c(n.left), operator: n.operator, right: c(n.right)
                };
            },
            UpdateExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'UpdateExpression',
                    argument: c(n.argument), operator: n.operator, prefix: n.prefix
                };
            },
            ReturnStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ReturnStatement',
                    argument: c(n.argument)
                };
            },
            Identifier: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'Identifier',
                    name: n.name
                };
            },
            Literal: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'Literal',
                    value: n.value, raw: n.raw /* Acorn-specific */
                };
            },
            ObjectExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ObjectExpression',
                    properties: n.properties.map(function(prop) {
                        return {
                            key: c(prop.key), value: c(prop.value), kind: prop.kind
                        };
                    })
                };
            },
            ArrayExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ArrayExpression',
                    elements: n.elements.map(c)
                };
            },
            SequenceExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'SequenceExpression',
                    expressions: n.expressions.map(c)
                };
            },
            EmptyStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'EmptyStatement'
                };
            },
            ThisExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ThisExpression'
                };
            },
            DebuggerStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'DebuggerStatement'
                };
            },
            LabeledStatement: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'LabeledStatement',
                    label: n.label, body: c(n.body)
                };
            }
        }, override || {});

        function c(node) {
            if (node === null) return null;
            return visitors[node.type](node, c);
        }
        return c(ast);
    };

})();

lively.ide.ModuleWrapper.addMethods(
'acorn lib', {
    acornParse: function() {
        return acorn.parse(this.getSource());
    },

    acornGetSource: function(node) {
        return this.getSourceFragment(node.start, node.end);
    }
});

Object.extend(lively.ast.acorn, {

    parse: function(source) {
        return acorn.parse(source);
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

    tokenize: function(input) {
        return acorn.tokenize(input);
    },

    fuzzyParse: function(source, options) {
        // options: verbose, addSource, type
        options = options || {};
        var ast, safeSource, err;
        if (options.type === 'LabeledStatement') { safeSource = '$={' + source + '}'; }
        try {
            // we only parse to find errors
            ast = acorn.parse(safeSource || source);
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
            ast = acorn.parse_dammit(source);
            if (options.addSource) acorn.walk.addSource(ast, source);
            ast.isFuzzy = true;
            ast.parseError = err;
        }
        return ast;
    },

    nodesAt: function(pos, ast) {
        ast = Object.isString(ast) ? this.parse(ast) : ast;
        return acorn.walk.findNodesIncluding(ast, pos);
    },

    nodeSource: function(source, node) {
        return source.slice(node.start, node.end);
    },

    transformReturnLastStatement: function(source) {
        // lively.ast.acorn.transformReturnLastStatement('foo + 3;\n this.baz(99 * 3) + 4;')
        // source = that.getTextRange()
        var ast = lively.ast.acorn.parse(source),
            last = ast.body.pop(),
            newLastsource = 'return ' + lively.ast.acorn.nodeSource(source, last),
            newLast = lively.ast.acorn.fuzzyParse(newLastsource).body.last(),
            newSource = source.slice(0, last.start) + 'return ' + source.slice(last.start)
        ast.body.push(newLast);
        ast.end += 'return '.length
        return lively.ast.acorn.nodeSource(newSource, ast);
    },
    tokens: function(input) {
        //this returns an array of all tokens, including recreating the skipped ones (comments and whitespace)
        var next = acorn.tokenize(input);
        var tokens = [];
        var token = next();
        if(token.start > 0) {
            whitespace = input.substring(0, token.start);
            tokens.push({value: whitespace, start: 0, end: token.start, type: "whitespace"});
        }
        var previousEnd = token.end;
        var whitespace, prevValue, prevType, prevIndex;
        var _eof = acorn.tokTypes.eof;
        var _slash = acorn.tokTypes.slash;
        var _name = acorn.tokTypes.name;
        var _bracketR = acorn.tokTypes.bracketR;
        while(token.type !== _eof) {
            prevType = token.type;
            prevValue = token.value || prevType.type.valueOf();
            prevIndex = tokens.length;
            tokens.push({value: prevValue, start: token.start, end: token.end, type: prevType.type});
            token = next();
            if(token.start > previousEnd) {
                whitespace = input.substring(previousEnd, token.start);
                tokens.push({value: whitespace, start: previousEnd, end: token.start, type: "whitespace"});
            }
            if (token.type.type == "assign" && token.value == "/=" && prevType !== _name && prevType !== _bracketR) {
                debugger;
                token = next(true);
            }
            else if(token.type === _slash && prevValue === ")") {
                var count = 1;
                for(var i = prevIndex - 1; i > 0; i--) {
                    var value = tokens[i].value;
                    if(value == ")")
                        count++;
                    else if(value == "(")
                        count--;
                    if(count == 0)
                        break;
                }
                if(i > 0 && ["if", "while", "for", "with"].indexOf(tokens[i - 1].value.valueOf()) > -1 ) {
                    debugger;
                    token = next(true);
                }
            }
            previousEnd = token.end;
        }
        return tokens;
    },

    simpleWalk: function(aNode, arg) {
        acorn.walk.simple(aNode, arg);
    }

});

}); // end of module
