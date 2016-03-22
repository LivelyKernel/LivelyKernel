module('lively.ast.Visualization').requires('lively.ast.acorn', 'apps.Graphviz').toRun(function() {

Object.extend(lively.ast, {
    visualize: function(astOrCode, optSource) {

        // lively.ast.visualize("obj = {Y: a};").openInWorldCenter()

        var source = Object.isString(astOrCode) ? astOrCode : optSource,
            ast = Object.isString(astOrCode) ? lively.ast.fuzzyParse(astOrCode) : astOrCode,
            renderer = apps.Graphviz.Renderer;

        var subgraphAttrs = {}
        var nodesAndEdges = [];

        runVisitor(ast, captureNode.curry(renderer, nodesAndEdges, subgraphAttrs));

        nodesAndEdges = nodesAndEdges.flatten();

        return renderer.render({
            asWindow: true,
            createNodesAndEdges: function() { return nodesAndEdges }
        });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function runVisitor(ast, captureNode) {
            var v = new lively.ast.MozillaAST.BaseVisitor()

            function makeScope(parentScope) {
                var scope = {id: Strings.newUUID(), parentScope: parentScope, containingScopes: []};
                parentScope && parentScope.containingScopes.push(scope);
                return scope;
            }

            v.accept = function (node, depth, state, path) {
                path = path || [];
                if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression')
                    state.scope = makeScope(state.scope)

                var referencedAs = state.parentState ?
                    path.slice(state.parentState.path.length) : path;

                state.path = path;
                state.referencedAs = referencedAs;
                state.node = node;
                state.source = source.slice(node.start, node.end);

                captureNode(node, state, path, depth);

                var nextState = {
                    result: state.result,
                    scope: state.scope,
                    parentNode: node,
                    parentState: state
                };

                return this['visit' + node.type](node, depth, nextState, path);
            }

            v.accept(ast, 0, {
                result: [], path: [],
                scope: makeScope()
            }, []);

        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function printNode(node, source) { return Strings.format('%s:%s-%s', node.type, node.start, node.end); }

        function captureNode(renderer, nodesAndEdges, subgraphAttrs, node, state, path, depth) {

            var subgraphId = 'cluster' + state.scope.id.replace(/-/g, '');
            if (!subgraphAttrs[subgraphId]) {
                subgraphAttrs[subgraphId] = {style: 'filled', fillcolor: '#' + Color.random(140, 255).toHexString()};
                nodesAndEdges.push(renderer.vizSubgraph(subgraphId, 'node', subgraphAttrs[subgraphId]));
            }

            nodesAndEdges.push(renderer.vizSubgraphNode(subgraphId, printNode(node), Object.extend({
                shape: 'Mrecord', rankdir: 'LR',
                tooltip: state.source.replace(/\n/g, '\\n'),
                label: Strings.format(' { %s | "%s" } ',
                    printNode(node),
                    state.source.truncate(40).replace(/\n/g, '').replace(/([\{\}><])/g, '\\$1'))
            }, subgraphAttrs[subgraphId] || {})));


            if (state.parentState && state.parentState.node) {
                var ref = state.referencedAs, propName = ref.join('.');
                nodesAndEdges.push(
                    renderer.vizEdge(printNode(state.parentState.node), printNode(node),
                    {label: propName}))
            }
        }

    }

});

}) // end of module
