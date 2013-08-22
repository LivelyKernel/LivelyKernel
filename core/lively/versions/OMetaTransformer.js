module('lively.versions.OMetaTransformer').requires('lively.ast.Parser').toRun(function() {

Object.extend(lively.versions.OMetaTransformer, {
    transformSource: function(source) {
        var ast = lively.ast.Parser.parse(source);
                
        ast.replaceNodesMatching(
            function(node) {
                return node.isObjectLiteral ||
                        node.isArrayLiteral ||
                        node.isFunction;
            },
            function(node) {
                var fn = new lively.ast.Variable(node.pos, "lively.versions.ObjectVersioning.proxyFor");
                return new lively.ast.Call(node.pos, fn, [node]);
            }
        );
        
        return ast.asJS();
    }
});

});