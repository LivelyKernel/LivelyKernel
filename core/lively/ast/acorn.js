// FIXME rk 2013-06-10
// we need the right order of libs to be loaded, this should eventually be
// supported by lively.Module>>requireLib
var allDependenciesLoaded = false;
var dependencies = [
    {url: Config.codeBase + 'lib/acorn/acorn.js', loadTest: function() { return typeof acorn !== 'undefined'; }},
    {url: Config.codeBase + 'lib/acorn/acorn-loose.js', loadTest: function() { return typeof acorn !== 'undefined' && typeof acorn.parse_dammit !== 'undefined'; }},
    {url: Config.codeBase + 'lib/acorn/acorn-walk.js', loadTest: function() { return typeof acorn !== 'undefined' && typeof acorn.walk !== 'undefined'; }}
];

dependencies.doAndContinue(function(next, lib) {
    JSLoader.loadJs(lib.url);
    var interval = Global.setInterval(function() {
        if (!lib.loadTest()) return;
        Global.clearInterval(interval);
        next();
    }, 50);
}, function() { allDependenciesLoaded = true; });

module("lively.ast.acorn").requires("lively.ide.SourceDatabase").requiresLib({loadTest: function() { return !!allDependenciesLoaded; }}).toRun(function() {

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
        if (!state) state = {depth: 0, path: [], referencedAs: [], scope: makeScope()};
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
                    depth: isASTNode ? state.depth + 1 : state.depth,
                    scope: state.scope,
                    path: state.path.concat([Object.isNumber ? 'number:'+  key : key]),
                    parentNode: isASTNode ? astNode : state.parentNode,
                    referencedAs: isASTNode ? [key] : state.referencedAs.concat([key])
                });
            }
        });
    }

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
    }

    acorn.walk.matchNodes = function(ast, visitor, state, options) {
        function visit(node, state, depth, type) {
            if (visitor[node.type]) visitor[node.type](node, state, depth, type);
        }
        return acorn.walk.forEachNode(ast, visit, state, options);
    }

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
    }

    acorn.walk.addSource = function(ast, source) {
        source = Object.isString(ast) ? ast : source;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        return acorn.walk.forEachNode(ast, function(node) {
            node.source || (node.source = source.slice(node.start, node.end));
        });
    }

    acorn.walk.inspect = function(ast, source) {
        source = Object.isString(ast) ? ast : null;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        source && acorn.walk.addSource(ast, source);
        return Objects.inspect(ast);
    }

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
    }

    acorn.walk.print = function(ast, source) {
        // acorn.walk.print('12+3')
        source = Object.isString(ast) ? ast : source;
        ast = Object.isString(ast) ? acorn.parse(ast) : ast;
        var result = [];
        acorn.walk.all(ast, function(node, state) {
            var nodeSrc = source ? ',' + Strings.print(source.slice(node.start, node.end).replace(/\n|\r/g, '').truncate(20)) : '';
            var indent = Strings.indent('', '  ', state.depth);
            result.push(Strings.format('%s%s:%s<%s-%s%s>',
                                    indent, state.referencedAs.length ? state.referencedAs.join('.') : 'root',
                                    node.type, node.start, node.end, nodeSrc));
        });
        return result.join('\n');
    }
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
        var next = acorn.tokenize(input, {onComment: function(bool, text, start, end){
            tokens.push({value: text, start: start, end: end, type: "comment"});
        }});
        var tokens = [];
        var token = next();
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
