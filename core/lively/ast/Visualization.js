module('lively.ast.Visualization').requires('lively.ast.acorn', 'apps.Graphviz').toRun(function() {

Object.extend(lively.ast, {
    visualize: function(astOrCode, optSource) {
        // lively.ast.visualize("obj = {Y: a};").openInWorldCenter()
        var source = Object.isString(astOrCode) ? astOrCode : optSource,
            ast = Object.isString(astOrCode) ? acorn.parse_dammit(astOrCode) : astOrCode,
            renderer = apps.Graphviz.Renderer;
        function printNode(node, source) { return Strings.format('%s:%s-%s', node.type, node.start, node.end); }
        var subgraphAttrs = {}
        var nodesAndEdges = [];
        acorn.walk.all(ast, function(node, info) {
            // var subgraphId = 'x'+info.scope.id.replace(/-/g, '');
            var subgraphId = 'cluster'+info.scope.id.replace(/-/g, '');
            if (!subgraphAttrs[subgraphId]) {
                subgraphAttrs[subgraphId] = {style: 'filled', fillcolor: '#' + Color.random(140, 255).toHexString()};
                nodesAndEdges.push(renderer.vizSubgraph(subgraphId, 'node', subgraphAttrs[subgraphId]));
            }
            var nodeCode = source.slice(node.start, node.end);
            nodesAndEdges.push(renderer.vizSubgraphNode(subgraphId, printNode(node), Object.extend({
                shape: 'Mrecord', rankdir: 'LR',
                tooltip: nodeCode.replace(/\n/g, '\\n'),
                label: Strings.format(' { %s | "%s" } ',
                    printNode(node),
                    nodeCode.truncate(40).replace(/\n/g, '').replace(/([\{\}><])/g, '\\$1'))
            }, subgraphAttrs[subgraphId] || {})));

            if (info.parentNode) {
                var ref = info.referencedAs, propName = ref.join('.');
                nodesAndEdges.push(
                    renderer.vizEdge(printNode(info.parentNode), printNode(node),
                    {label: propName}))
            }
        });
        nodesAndEdges = nodesAndEdges.flatten();
        return renderer.render({
            asWindow: true,
            createNodesAndEdges: function() { return nodesAndEdges }
        });
    }
});

}) // end of module