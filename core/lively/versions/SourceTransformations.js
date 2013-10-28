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
    
    wrapExpressionInProxyFor: function(node) {
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
    },
    transformFunctionDeclaration: function(functionDeclaration) {
        // takes function declaration: function fName() {...}
        // returns AST for:
        // var fName = lively.versions.ObjectVersioning.proxy(function fName() {...})
        return new UglifyJS.AST_Var({
            definitions: [new UglifyJS.AST_VarDef({
                name: new UglifyJS.AST_SymbolVar({
                    name: functionDeclaration.name.name
                }),
                value: this.wrapExpressionInProxyFor(functionDeclaration)
            })],
            start: functionDeclaration.start,
            end: functionDeclaration.end
        });
    },
    selectAccessorPropertiesFromObject: function(node) {
        return node.properties.select(function(each) {
            return each instanceof UglifyJS.AST_ObjectSetter ||
                each instanceof UglifyJS.AST_ObjectGetter;
        });
    },
    hasObjectAccessorProperties: function(node) {
        return this.selectAccessorPropertiesFromObject(node).length > 0;
    },
    transformObjectLiteralWithAccessorDefinitions: function(node) {
        var accessorProperties = this.selectAccessorPropertiesFromObject(node),
            accessorPropertyDefinitions = {},
            definitionNodes = [],
            currentDefinition;
        
        node.properties = node.properties.withoutAll(accessorProperties);
        
        // { value: {
        //     get: function(..),
        //     set: function(..)
        // }}
        accessorProperties.forEach(function(each) {
            if (!accessorPropertyDefinitions[each.value.name.name]) {
                accessorPropertyDefinitions[each.value.name.name] = {};
            }
            
            accessorPropertyDefinitions[each.value.name.name][each.key] = each.value;
        })
        
        
        for (var propName in accessorPropertyDefinitions) {
            // FIXME: don't use UglifyJS.parse...
            currentDefinition = accessorPropertyDefinitions[propName];
            
            definitionNodes.push(UglifyJS.parse('Object.defineProperty(newObject, \'' + propName  + '\', {' +
                (currentDefinition.get ? 'get: lively.versions.ObjectVersioning.proxyFor(' + currentDefinition.get.print_to_string() + '),' : '') +
                (currentDefinition.set ? 'set: lively.versions.ObjectVersioning.proxyFor(' + currentDefinition.set.print_to_string() + '),' : '') +
                'writable: true,\n' +
                'enumerable: true,\n' +
                'configurable: true\n' +
                '});'
            ).body[0]);
        }
        
        var code = '(function() {\n';
        code += 'var newObject = ' + this.wrapExpressionInProxyFor(node).print_to_string() + ';\n';
        definitionNodes.forEach(function(each) {
            code += each.print_to_string() + ';\n'
        })
        code += 'return newObject;\n'
        code += '})()';
        
        return UglifyJS.parse(code).body[0].body;
    },
    transformLiterals: function(node) {
        if (node instanceof UglifyJS.AST_Array ||
            node instanceof UglifyJS.AST_Function) {
            // an AST_Function is a function expression
            
            return this.wrapExpressionInProxyFor(node);
            
        } else if (node instanceof UglifyJS.AST_Object) {
            // an object literal might define accessor functions (getter or setter) for
            // properties. these accessor functions don't just expect an expression that
            // returns a function, but are recognized syntactically. for this reason, we
            // extract these accessors from object literals and define the accessor
            // functions immediatelty afterwards using Object.defineProperty(..)
            
            if (this.hasObjectAccessorProperties(node)) {
                return this.transformObjectLiteralWithAccessorDefinitions(node);
            } else {
                return this.wrapExpressionInProxyFor(node);
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
            
            return this.transformFunctionDeclaration(node);
        } else {
            return node;
        }
    },
    transformSource: function (originalSource, optCodeGeneratorOptions) {
        var originalAst,
            transformer,
            transformedAst,
            sourceMap,
            outputStream,
            codeGeneratorOptions = optCodeGeneratorOptions || {};
        
        originalAst = UglifyJS.parse(originalSource);
        
        transformer = new UglifyJS.TreeTransformer(null, this.transformLiterals.bind(this));
        transformedAst = originalAst.transform(transformer);
        
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
    generateCodeFromSource: function(source, optScriptName) {
        var sourceName = optScriptName || 'eval at runtime',
            sourceMapOptions = {
                sources: [sourceName],
                sourcesContent: [source]
            };

        return this.generateCodeWithMapping(source, sourceMapOptions);
    },
});
    
});