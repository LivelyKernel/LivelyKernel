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
            
            if (node instanceof UglifyJS.AST_Array ||
                node instanceof UglifyJS.AST_Function) {
                // an AST_Function is a function expression
                
                result = exchangeLiteralExpression(node);
                
            } else if (node instanceof UglifyJS.AST_Object) {
                
                var accessorProps = node.properties.select(function(each) {
                    return each instanceof UglifyJS.AST_ObjectSetter ||
                        each instanceof UglifyJS.AST_ObjectGetter;
                });
                
                if (accessorProps.length == 0) {
                    result = exchangeLiteralExpression(node);
                } else {
                    node.properties = node.properties.withoutAll(accessorProps);
                
                    var propsToDefine = {};
                    accessorProps.forEach(function(each) {
                        if (!propsToDefine[each.value.name.name]) propsToDefine[each.value.name.name] = {};
                        propsToDefine[each.value.name.name][each.key] = each.value;
                    })
                    
                    var propDefinitionNodes = [];
                    for (var propName in propsToDefine) {
                        // FIXME: don't use UglifyJS.parse...
                        // TODO: add other property properties (enumerable, writable, and configurable)
                        propDefinitionNodes.push(UglifyJS.parse('Object.defineProperty(newObject, \'' + propName  + '\', {' +
                            (propsToDefine[propName].get ? 'get: lively.versions.ObjectVersioning.proxyFor(' + propsToDefine[propName].get.print_to_string() + '),' : '') +
                            (propsToDefine[propName].set ? 'set: lively.versions.ObjectVersioning.proxyFor(' + propsToDefine[propName].set.print_to_string() + '),' : '') +
                            'writable: true,\n' +
                            'enumerable: true,\n' +
                            'configurable: true\n' +
                            '});'
                        ).body[0]);
                    }
                    
                    var code = '(function() {\n';
                    code += 'var newObject = ' + exchangeLiteralExpression(node).print_to_string() + ';\n';
                    propDefinitionNodes.forEach(function(each) {
                        code += each.print_to_string() + ';\n'
                    })
                    
                    code += 'return newObject;\n'
                    code += '})()'
                    
                    result = UglifyJS.parse(code).body[0].body;
                }
                
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
    }
});
    
});