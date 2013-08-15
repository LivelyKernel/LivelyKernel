module('lively.versions.UglifyTransformer').requires().toRun(function() {
    
// UglifyJS expects Mozilla's source-map library to be globally available as MOZ_SourceMap
Global.MOZ_SourceMap = Global.sourceMap;
        
Object.extend(lively.versions.UglifyTransformer, {
    
    // FIXME: instead of creating new nodes by parsing (assembled) strings
    // it's probably faster and definitely cleaner to just use ordinary constructors
    // to build the necessary sub-trees with which original nodes should be replaced
    wrapAllLiterals: function (source, optCodeGeneratorOptions) {
        var originalAst,
            transformedAst,
            sourceMap,
            outputStream,
            codeGeneratorOptions = optCodeGeneratorOptions || {};
        
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
                
                // FIXME: is this really a problem? can this really happen?
                if (!node.name.name || !Object.isString(node.name.name)) 
                    throw new Error('Source Transformations encountered function declaration without name');
                                
                var newStmt = 'var ' + node.name.name + ' = ' + '"standin"';
                
                var newStmtAst = UglifyJS.parse(newStmt);
                var newVarStmtAst = newStmtAst.body[0];
                
                newVarStmtAst.start = node.start;
                newVarStmtAst.end = node.end;
                
                // exchange the AST node of the 'standin' string with the wrapped original node
                newVarStmtAst.definitions[0].value = wrapIntoProxyFunction(node);
                
                return newVarStmtAst;
            } else if (node instanceof UglifyJS.AST_Accessor) {
                // FIXME: what the heck is this?
                throw new Error('Transformations of AST_Accessor not yet implemented');
            } else {
                result = node;
            }
                        
            return result;
        });
        
        originalAst = UglifyJS.parse(source);
        
        transformedAst = originalAst.transform(wrapLiterals);
        
        outputStream = UglifyJS.OutputStream(codeGeneratorOptions);
        transformedAst.print(outputStream);
        
        return outputStream;
    },
    transformSource: function(source, optCodeGeneratorOptions) {
        return this.wrapAllLiterals(source, optCodeGeneratorOptions).toString();
    },
    generateSourceFrom: function(url) {
        var absoluteUrl = URL.ensureAbsoluteURL(url),
            originalSources = JSLoader.getSync(absoluteUrl),
            uglifySourceMap = UglifyJS.SourceMap({}),
            outputStream,
            sourceMap,
            dataUri,
            generatedSources;
        
        outputStream = this.wrapAllLiterals(originalSources, {source_map: uglifySourceMap});
        
        sourceMap = JSON.parse(uglifySourceMap.toString());
        sourceMap.sourceRoot = absoluteUrl.dirname();
        sourceMap.sources[0] = absoluteUrl.filename();
        sourceMap.sourcesContent = [originalSources];
        
        // see http://kybernetikos.github.io/jsSandbox/srcmaps/dynamic.html
        dataUri = 'data:application/json;charset=utf-8;base64,'+ btoa(JSON.stringify(sourceMap));
        
        generatedSources = outputStream.toString() 
            + '\n//@ sourceMappingURL=' + dataUri;
        
        return generatedSources;
    },
    loadSource: function(url) {
        var source = this.generateSourceFrom(url);
        eval(source);
    }
    // try this:
    // lively.versions.UglifyTransformer.loadSource('core/lively/versions/tests/benchmarks/richards.js');
    
});
    
});