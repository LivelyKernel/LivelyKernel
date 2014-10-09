module('lively.ast.Comments').requires('lively.ast.AstHelper').toRun(function() {

Object.extend(lively.ast.Comments, {
    extractComments: function(code) {
        var ast = lively.ast.acorn.parse(code, {withComments: true})
        var parsedComments = commentsWithPaths(ast);
        return parsedComments.map(function(c, i) {

            // 1. a method comment like "x: function() {\n//foo\n ...}"?
            if (isInMethod(c)) {
                return Object.merge([{
                    type: 'method',
                    comment: c.comment.text
                }, methodAttributesOf(c)]);
            }

            // 2. function statement comment like "function foo() {\n//foo\n ...}"?
            if (isInFunctionStatement(c)) {
                return Object.merge([{
                    type: 'function',
                    comment: c.comment.text
                }, functionAttributesOf(c)]);
            }

            // 2. comment preceding another node?
            var followingNode = followingNodeOf(c);
            if (!followingNode) return null;

            // is there another comment in front of the node>
            var followingComment = parsedComments[i+1];
            if (followingComment && followingComment.comment.start <= followingNode.start) return null;

            // 3. an obj var comment like "// foo\nvar obj = {...}"?
            if (isObjVarDeclaration(followingNode)) {
                return Object.merge([{
                    type: 'object',
                    comment: c.comment.text
                }, objAttributesOf(followingNode)])
            }
            
            return null;
        }).compact();

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function commentsWithPaths(ast) {
            var comments = [];
            lively.ast.acorn.withMozillaAstDo(ast, comments, function(next, node, comments, depth, path) {
                if (node.comments) {
                    comments.pushAll(
                        node.comments.map(function(comment) {
                            return {path: path, comment: comment, node: node}; }));
                }
                next();
            });
            return comments;
        }

        function followingNodeOf(comment) {
            return comment.node.body.detect(function(node) {
                return node.start > comment.comment.end; });
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-        

        function isInFunctionStatement(comment) {
            var node = lively.PropertyPath(comment.path.slice(0,-1)).get(ast);
            return node && node.type === "FunctionDeclaration";
        }

        function functionAttributesOf(comment) {
            var funcNode = lively.PropertyPath(comment.path.slice(0,-1)).get(ast),
                name = funcNode.id ? funcNode.id.name : "<error: no name for function>";
            return {name: name, args: funcNode.params.pluck("name")};
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function isInMethod(comment) {
            return comment.path.slice(-2).equals(["value", "body"]);
        }

        function methodAttributesOf(comment) {
            var methodNode = lively.PropertyPath(comment.path.slice(0, -2)).get(ast),
                name = methodNode.key ? methodNode.key.name : "<error: no name for method>";

            // if it's someting like "var obj = {foo: function() {...}};"
            var path = comment.path.slice();
            var objectName = "<error: no object found for method>";

            while (path.length && path.last() !== 'init') path.pop();
            if (path.length) {
                objectName = lively.PropertyPath(path.slice(0, -1).concat(["id", "name"])).get(ast);
            }

            // if it's someting like "exports.obj = {foo: function() {...}};"
            if (objectName.startsWith("<error")) {
                path = comment.path.slice();
                while (path.length && path.last() !== 'right') path.pop();
                if (path.length) {
                    var assignNode = lively.PropertyPath(path.slice(0, -1).concat(["left"])).get(ast);
                    objectName = code.slice(assignNode.start, assignNode.end);
                }
            }

            // if it's someting like "Object.extend(Foo.prototype, {m: function() {/*some comment*/ return 23; }})"
            if (objectName.startsWith("<error")) {
                path = comment.path.slice();
                var callExpr = lively.PropertyPath(path.slice(0, -6)).get(ast),
                    isCall = callExpr && callExpr.type === "CallExpression",
                    firstArg = isCall && callExpr.arguments[0];
                if (firstArg) objectName = code.slice(firstArg.start, firstArg.end);
            }

            return {name: name, args: methodNode.value.params.pluck("name"), objectName: objectName}
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        // like "var foo = {/*...*/}" or  "var foo = bar = {/*...*/};"
        function isObjVarDeclaration(node) {
            // should be a var declaration with one declarator with a value
            // being an JS object
            return node && node.type === 'VariableDeclaration'
                && node.declarations.length === 1
                && (node.declarations[0].init.type === "ObjectExpression"
                 || isObjectAssignment(node.declarations[0].init));
        }

        function objAttributesOf(node) {
            return {name: node.declarations[0].id.name};
        };

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        
        // like "foo = {/*...*/}"
        function isObjectAssignment(node) {
            if (node.type !== "AssignmentExpression") return false;
            if (node.right.type === "ObjectExpression") return true;
            if (node.right.type === "AssignmentExpression") return isObjectAssignment(node.right);;
            return false;
        }
    }
});

}) // end of module
