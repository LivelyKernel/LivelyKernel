module('lively.versions.SourceTransformations').requires().toRun(function() {
    
// UglifyJS expects Mozilla's source-map library to be globally available as
// MOZ_SourceMap
Global.MOZ_SourceMap = Global.sourceMap;
        
Object.extend(lively.versions.SourceTransformations, {
    
    // TODO: function declarations get hoisted in JavaScript, so we need to
    // move the func decs we transform to variable assignments of function
    // expressions to the beginning of each function scope, while preserving
    // the lexical order of function declarations, see
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
                    property: 'proxyFor'
                }),
                args: [node],
                start: node.start,
                end: node.end
            });
        };
        
        var exchangeFunctionDeclaration = function(functionDeclaration) {
            // takes function declaration: function fName() {...}
            // returns AST for: var fName =
            // lively.versions.ObjectVersioning.proxy(function fName() {...})
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
                // an AST_Function is a function expression
                
                result = exchangeLiteralExpression(node);
                
            } else if (node instanceof UglifyJS.AST_Defun) {
                // an AST_Defun is a function declaration, not function
                // expression, but wrapping the function literal into a
                // function (in this case the proxy function), makes the
                // declaration an expression, which then isn't accessible in
                // the current scope by name.therefore, we need to assign all
                // function declarations to variables reflecting the function
                // names. and it's syntactically legal to declare variables
                // multiple times (var declaration gets hoisted)
                result = exchangeFunctionDeclaration(node);
            } else if (node instanceof UglifyJS.AST_Accessor) {
                // FIXME: what is an AST_Accessor node?
                throw new Error('Transformations of AST_Accessor ' +
                    'not yet implemented');
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