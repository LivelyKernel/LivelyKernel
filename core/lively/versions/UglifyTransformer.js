module('lively.versions.UglifyTransformer').requires().toRun(function() {
    
Object.extend(lively.versions.UglifyTransformer, {
    transformSource: function (source) {
        var originalAst,
            transformedAst,
            printOptions;
            
        printOptions = {
            beautify: true,
        };
        
        var wrapIntoProxyFunction = function(node) {
            var exprNode = UglifyJS.parse('lively.versions.ObjectVersioning.proxy()'),
                callNode = exprNode.body[0].body;
                
            callNode.args.push(node);
            
            // FIXME: is the following necessary?
            callNode.start = node.start;
            callNode.end = node.end;
            
            return callNode;
        };
        
        var wrapLiterals = new UglifyJS.TreeTransformer(null, function(node) {
            var result;
            
            if (node instanceof UglifyJS.AST_Object || 
                node instanceof UglifyJS.AST_Array ||
                node instanceof UglifyJS.AST_Function) {
                // AST_Function is a function expression, not a function declaration, but
                                
                result = wrapIntoProxyFunction(node);
            } else if (node instanceof UglifyJS.AST_Defun) {
                // AST_Defun is a function declaration, not a function expression, but wrapping the
                // function literal with the proxy function, meaning supplying the literal as an argument
                // to the proxy function, makes the original function declaration a function expression,
                // which isn't automatically accessible by its name in the current scope. therefore, we
                // need to assign all function declarations to variables matching the function names.
                // btw. it's syntactically legal to declare variables multiple times, their declaration
                // gets hoisted anyway (only their declaration, not their assignment(s)...)
                
                // FIXME: function declarations get hoisted in JavaScript, so we need to move the func 
                // decs we transform to variable assignments (of func exprs) to the beginning of each 
                // scope (function scope), while preserving the lexical order of function declarations 
                // (that is, the order of parsing, not the order of execution)
                
                // for more info see:
                // javascriptweblog.wordpress.com/2010/07/06/function-declarations-vs-function-expressions/
                
                
                // FIXME: Is node.name.name always correct? throw an error for now if not?
                
                var callNode = wrapIntoProxyFunction(node);
                
                var newStmt = 'var ' + node.name.name + ' = ' + callNode.print_to_string(printOptions);
                
                var newStmtAst = UglifyJS.parse(newStmt);
                var newVarStmtAst = newStmtAst.body[0];
                
                newVarStmtAst.start = node.start;
                newVarStmtAst.end = node.end;
                
                // FIXME: maybe it's better to exchange the node for the right-side of the assignment
                // with the original node... !?!?
                
                return newVarStmtAst;
            } else if (node instanceof UglifyJS.AST_Accessor) {
                // FIXME: what the heck is this?
                debugger;
                throw new Error('Transformations of AST_Accessor not yet implemented');
            } else {
                result = node;
            }
                        
            return result;
        });
        
        
        originalAst = UglifyJS.parse(source);
        
        transformedAst = originalAst.transform(wrapLiterals);
        
        return transformedAst.print_to_string(printOptions);
    }
});
    
});