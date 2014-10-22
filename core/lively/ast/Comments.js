module('lively.ast.Comments').requires('lively.ast.AstHelper').toRun(function() {

Object.extend(lively.ast.Comments, {

    getCommentPrecedingNode: function(ast, node) {
        var statementPath = acorn.walk.findStatementOfNode({asPath: true}, ast, node),
            blockPath = statementPath.slice(0, -2),
            block = lively.PropertyPath(blockPath).get(ast);
        return !block.comments || !block.comments.length ? null :
            lively.ast.Comments.extractComments(ast)
                .clone().reverse()
                .detect(function(ea) { return ea.followingNode === node; })
    },

    extractComments: function(astOrCode, optCode) {
        var ast = typeof astOrCode === "string" ?
            lively.ast.acorn.parse(astOrCode, {withComments: true}) : astOrCode;
        var code = optCode ? optCode : (typeof astOrCode === "string" ?
            astOrCode : lively.ast.acorn.stringify(astOrCode));

        var parsedComments = commentsWithPathsAndNodes(ast).sortBy(function(c) {
            return c.comment.start; });

        return parsedComments
          .map(function(c, i) {

            // 1. a method comment like "x: function() {\n//foo\n ...}"?
            if (isInObjectMethod(c)) {
                return Object.merge([c, c.comment,
                  {type: 'method', comment: c.comment.text},
                  methodAttributesOf(c)]);
            }

            if (isInComputedMethod(c)) {
                return Object.merge([c, c.comment,
                  {type: 'method', comment: c.comment.text},
                  computedMethodAttributesOf(c)]);
            }

            // 2. function statement comment like "function foo() {\n//foo\n ...}"?
            if (isInFunctionStatement(c)) {
                return Object.merge([c, c.comment,
                  {type: 'function', comment: c.comment.text},
                  functionAttributesOf(c)]);
            }

            // 3. assigned method like "foo.bar = function(x) {/*comment*/};"
            if (isInAssignedMethod(c)) {
                return Object.merge([c, c.comment,
                  {type: 'method', comment: c.comment.text},
                  methodAttributesOfAssignment(c)]);
            }

            // 4. comment preceding another node?
            var followingNode = followingNodeOf(c);
            if (!followingNode) return Object.merge([c, c.comment, {followingNode:followingNode}, unknownComment(c)]);

            // is there another comment in front of the node>
            var followingComment = parsedComments[i+1];
            if (followingComment && followingComment.comment.start <= followingNode.start)
                return Object.merge([c, c.comment, {followingNode:followingNode}, unknownComment(c)]);

            // 3. an obj var comment like "// foo\nvar obj = {...}"?
            if (isSingleObjVarDeclaration(followingNode)) {
                return Object.merge([c, c.comment, {followingNode:followingNode},
                  {type: 'object',comment: c.comment.text},
                  objAttributesOf(followingNode)])
            }

            // 4. Is it a simple var declaration like "// foo\nvar obj = 23"?
            if (isSingleVarDeclaration(followingNode)) {
                return Object.merge([c, c.comment, {followingNode:followingNode},
                  {type: 'var',comment: c.comment.text},
                  objAttributesOf(followingNode)])
            }
            
            return Object.merge([c, c.comment, {followingNode:followingNode}, unknownComment(c)]);
        });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function commentsWithPathsAndNodes(ast) {
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

        function unknownComment(comment) {
            return {type: "unknown", comment: comment.comment.text}
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

        function isInObjectMethod(comment) {
            return comment.path.slice(-2).equals(["value", "body"]) // obj expr
        }

        function isInAssignedMethod(comment) {
            return comment.path.slice(-2).equals(["right", "body"]); // asignment
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

        function methodAttributesOfAssignment(comment) {
            var node = lively.PropertyPath(comment.path.slice(0,-1)).get(ast)
            if (node.type !== "FunctionExpression"
             && node.type !== "FunctionDeclaration") return {};

            var statement = acorn.walk.findStatementOfNode(ast, node);
            if (statement.type !== "ExpressionStatement"
             || statement.expression.type !== "AssignmentExpression") return {};

            var objName = code.slice(
                statement.expression.left.object.start,
                statement.expression.left.object.end);

            var methodName = code.slice(
                statement.expression.left.property.start,
                statement.expression.left.property.end);
            
            return {name: methodName, objectName: objName, args: node.params.pluck("name")};
        }

        function isInComputedMethod(comment) {
            var path = comment.path.slice(-5);
            path.removeAt(1);
            return path.equals(["properties","value","callee","body"]);
        }

        function computedMethodAttributesOf(comment) {
            var name, args, pathToProp;
            
            pathToProp = comment.path.slice(0, -3);
            var propertyNode = lively.PropertyPath(pathToProp).get(ast);
            if (propertyNode && propertyNode.type === "Property") {
              // if it is a function immediatelly called
              args = propertyNode.value.callee.params.pluck("name");
              name = propertyNode.key ? propertyNode.key.name : "<error: no name for method>";
            }
            
            if (!name) {
              // if it is an object member function
              pathToProp = comment.path.slice(0, -2);
              propertyNode = lively.PropertyPath(pathToProp).get(ast);
              if (propertyNode && propertyNode.type === "Property") {
                args = propertyNode.value.params.pluck("name");
                name = propertyNode.key ? propertyNode.key.name : "<error: no name for method>";
              }
            }

            if (!name) {
              name = "<error: no name for method>";
              args = [];
              pathToProp = comment.path
            }

            // if it's someting like "var obj = {foo: function() {...}};"
            var path = pathToProp.clone();
            var objectName = "<error: no object found for method>";

            while (path.length && path.last() !== 'init') path.pop();
            if (path.length) {
                objectName = lively.PropertyPath(path.slice(0, -1).concat(["id", "name"])).get(ast);
            }

            // if it's someting like "exports.obj = {foo: function() {...}};"
            if (objectName.startsWith("<error")) {
                var path = pathToProp.clone();
                while (path.length && path.last() !== 'right') path.pop();
                if (path.length) {
                    var assignNode = lively.PropertyPath(path.slice(0, -1).concat(["left"])).get(ast);
                    objectName = code.slice(assignNode.start, assignNode.end);
                }
            }

            // if it's someting like "Object.extend(Foo.prototype, {m: function() {/*some comment*/ return 23; }})"
            if (objectName.startsWith("<error")) {
                var path = pathToProp.clone();
                var callExpr = lively.PropertyPath(path.slice(0, -4)).get(ast),
                    isCall = callExpr && callExpr.type === "CallExpression",
                    firstArg = isCall && callExpr.arguments[0];
                if (firstArg) objectName = code.slice(firstArg.start, firstArg.end);
            }

            return {name: name, args: args, objectName: objectName}
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        // like "var foo = {/*...*/}" or  "var foo = bar = {/*...*/};"
        function isSingleObjVarDeclaration(node) {
            // should be a var declaration with one declarator with a value
            // being an JS object
            return isSingleVarDeclaration(node)
                && (node.declarations[0].init.type === "ObjectExpression"
                 || isObjectAssignment(node.declarations[0].init));
        }

        function isSingleVarDeclaration(node) {
            return node && node.type === 'VariableDeclaration'
                && node.declarations.length === 1;
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
