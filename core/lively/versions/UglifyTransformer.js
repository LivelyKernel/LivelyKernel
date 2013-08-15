module('lively.versions.UglifyTransformer').requires().toRun(function() {
    
// UglifyJS expects Mozilla's source-map library to be globally available as MOZ_SourceMap
Global.MOZ_SourceMap = Global.sourceMap;
        
Object.extend(lively.versions.UglifyTransformer, {
    
    // FIXME: function declarations get hoisted in JavaScript, so we need to move the func 
    // decs we transform to variable assignments (of func exprs) to the beginning of each 
    // scope (function scope), while preserving the lexical order of function declarations 
    // (that is, the order of parsing, not the order of execution)
    // javascriptweblog.wordpress.com/2010/07/06/function-declarations-vs-function-expressions/
    
    transformSource: function (originalSource, optCodeGeneratorOptions) {
        var originalAst,
            transformedAst,
            sourceMap,
            outputStream,
            codeGeneratorOptions = optCodeGeneratorOptions || {};
        
        var exchangeLiteralExpression = function(node) {
            // returns AST for: lively.versions.ObjectVersioning.proxy(node)
           return new UglifyJS.AST_Call({
                expression: new UglifyJS.AST_Dot({
                    expression: new UglifyJS.AST_Dot({
                        expression: new UglifyJS.AST_Dot({
                            expression: new UglifyJS.AST_SymbolRef({
                                name: 'lively'
                            }),
                            property: 'versions'
                        }),
                        property: 'ObjectVersioning'
                    }),
                    property: 'proxy'
                }),
                args: [node],
                start: node.start,
                end: node.end
            });
        };
        
        var exchangeFunctionDeclaration = function(functionDeclaration) {
            // takes function declaration: function fName() {...}
            // returns AST for: var fName = lively.versions.ObjectVersioning.proxy(function fName() {...})
            return new UglifyJS.AST_Var({
                definitions: [new UglifyJS.AST_VarDef({
                    name: new UglifyJS.AST_SymbolVar({
                        name: functionDeclaration.name.name
                    }),
                    value: exchangeLiteralExpression(functionDeclaration)
                })],
                start: functionDeclaration.start,
                end: functionDeclaration.end
            }); 
        }
        
        var wrapLiterals = new UglifyJS.TreeTransformer(null, function(node) {
            var result;
            
            if (node instanceof UglifyJS.AST_Object || 
                node instanceof UglifyJS.AST_Array ||
                node instanceof UglifyJS.AST_Function) {
                // AST_Function is a function expression, not a function declaration.
                // function expressions aren't accessible by name outside of the function body,
                // so there's no need to expose the function name via a variable
                                
                result = exchangeLiteralExpression(node);
            } else if (node instanceof UglifyJS.AST_Defun) {
                // AST_Defun is a function declaration, not a function expression, but wrapping the
                // function literal with the proxy function, meaning supplying the literal as an argument
                // to the proxy function, makes the original function declaration a function expression,
                // which isn't automatically accessible by its name in the current scope. therefore, we
                // need to assign all function declarations to variables matching the function names.
                // btw. it's syntactically legal to declare variables multiple times, their declaration
                // gets hoisted anyway (only their declaration, not their assignment(s)...
                
                // FIXME: is this really a problem? can this really happen?
                if (!node.name.name || !Object.isString(node.name.name)) 
                    throw new Error('Source Transformations encountered function declaration without name');
                
                result = exchangeFunctionDeclaration(node);
            } else if (node instanceof UglifyJS.AST_Accessor) {
                // FIXME: what is an AST_Accessor node?
                throw new Error('Transformations of AST_Accessor not yet implemented');
            } else {
                result = node;
            }
                        
            return result;
        });
        
        originalAst = UglifyJS.parse(originalSource);
        
        transformedAst = originalAst.transform(wrapLiterals);
        
        outputStream = UglifyJS.OutputStream(codeGeneratorOptions);
        transformedAst.print(outputStream);
        
        return outputStream.toString();
    },
    generateCodeWithMapping: function(originalSource, sourceMapOptions) {
        var uglifySourceMap = UglifyJS.SourceMap({}),
            generatedCode,
            sourceMap,
            dataUri;  
        
        generatedCode = this.transformSource(originalSource, {source_map: uglifySourceMap});
                
        sourceMap = JSON.parse(uglifySourceMap.toString());
        Object.extend(sourceMap, sourceMapOptions);
        
        // see kybernetikos.github.io/jsSandbox/srcmaps/dynamic.html
        dataUri = 'data:application/json;charset=utf-8;base64,'+ btoa(JSON.stringify(sourceMap));
        
        return generatedCode + '\n//@ sourceMappingURL=' + dataUri;
    },
    generateCodeFromUrl: function(url) {
        var absoluteUrl = URL.ensureAbsoluteURL(url),
            originalSource = JSLoader.getSync(absoluteUrl),
            sourceMapOptions = {
                sourceRoot: absoluteUrl.dirname(),
                sources: [absoluteUrl.filename()]
            };
        
        return this.generateCodeWithMapping(originalSource, sourceMapOptions);
    },
    generateCodeFromSource: function(originalSource, optScriptName) {
        var sourceName = optScriptName || 'eval at runtime',
            sourceMapOptions = {
                sources: [sourceName],
                sourcesContent: [originalSource]
            };

        return this.generateCodeWithMapping(originalSource, sourceMapOptions);
    },
    loadSource: function(url) {
        eval(this.generateCodeFromUrl(url));
    },
    evalCode: function(code, optScriptName) {
        eval(this.generateCodeFromSource(code, optScriptName));
    }
});
    
});