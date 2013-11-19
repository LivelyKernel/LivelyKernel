module('lively.versions.SourceTransformations').requires().toRun(function() {
    
// UglifyJS expects Mozilla's source-map library to be globally available as
// MOZ_SourceMap
Global.MOZ_SourceMap = Global.sourceMap;
        
Object.extend(lively.versions.SourceTransformations, {
    isCallToEval: function(node) {
        
        if (!node instanceof UglifyJS.AST_Call)
            return false;
        
        // eval('something')
        if (node.expression instanceof UglifyJS.AST_SymbolRef &&
            node.expression.name === 'eval')
            return true;
        
        // e.g. Global.eval('something') || window.eval('something')
        if (node.expression instanceof UglifyJS.AST_Dot &&
            node.expression.property === 'eval')
            return true;
            
        return false;
    },
    isCallToObjectCreate: function(node) {
        return node instanceof UglifyJS.AST_Dot &&
            node.property === 'create' &&
            node.expression.name === 'Object';
    },
    isProxyForCall: function(node) {
        return node instanceof UglifyJS.AST_Call &&
            node.expression instanceof UglifyJS.AST_Dot &&
            node.expression.property === 'proxyFor' &&
            node.args.length === 1;
    },
    wrapInCallOnSymbol: function(symbolName, functionName, argOrArgs) {
        return new UglifyJS.AST_Call({
            expression: new UglifyJS.AST_Dot({
                expression:  new UglifyJS.AST_SymbolRef({
                    name: symbolName
                }),
                property: functionName,
            }),
            args: Object.isArray(argOrArgs) ? argOrArgs : [argOrArgs],
        });
    },
    wrapInLivelyCall: function(functionName, argOrArgs) {
        return this.wrapInCallOnSymbol('lively', functionName, argOrArgs);
    },
    wrapInProxyForCall: function(node) {
       return this.wrapInLivelyCall('proxyFor', node);
    },
    wrapInTransformSourceCall: function(node) {
        return this.wrapInLivelyCall('transformSource', node);
    },
    wrapInObjectInstanceOfCall: function(args) {
        return this.wrapInCallOnSymbol('Object', 'instanceOf', args);
    },
    createAssignmentNode: function(variableName, value) {
        return new UglifyJS.AST_Var({
            definitions: [new UglifyJS.AST_VarDef({
                name: new UglifyJS.AST_SymbolVar({
                    name: variableName
                }),
                value: value
            })]
        });
    },
    transformFunctionDeclaration: function(functionDeclaration) {
        var variableName = functionDeclaration.name.name,
            value = this.wrapInProxyForCall(functionDeclaration);
        
        functionDeclaration.shouldBeHoisted = true;
        
        return this.createAssignmentNode(variableName, value);
    },
    hasObjectAccessorProperties: function(node) {
        return this.selectAccessorPropertiesFromObject(node).length > 0;
    },
    selectAccessorPropertiesFromObject: function(node) {
        return node.properties.select(function(each) {
            return each instanceof UglifyJS.AST_ObjectSetter ||
                each instanceof UglifyJS.AST_ObjectGetter;
        });
    },
    transformObjectLiteralWithAccessorDefinitions: function(node) {
        var accessorProperties = this.selectAccessorPropertiesFromObject(node),
            objectLiteralNode,
            accessorPropertyDefinitions = {},
            definitionNodes = [],
            currentDefinition;
        
        node.properties = node.properties.withoutAll(accessorProperties);
        objectLiteralNode = this.wrapInProxyForCall(node);
        
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
                (currentDefinition.get ? 'get: lively.proxyFor(' + currentDefinition.get.print_to_string() + '),' : '') +
                (currentDefinition.set ? 'set: lively.proxyFor(' + currentDefinition.set.print_to_string() + '),' : '') +
                'enumerable: true,\n' +
                'configurable: true\n' +
                '});'
            ).body[0]);
        }
        
        var code = '(function() {\n';
        
        code += this.createAssignmentNode('newObject', objectLiteralNode).print_to_string() + ';\n'; 
        definitionNodes.forEach(function(each) {
            code += each.print_to_string() + ';\n'
        })
        code += 'return newObject;\n'
        code += '})()';
        
        return UglifyJS.parse(code).body[0].body;
    },
    isAKeyValuePairWithAProxiedFunction: function (node) {
        // search key value pairs of object literals for assignments of
        // the following form: {func: lively.proxyFor(function(..) {..})}
        
        // note: we're checking for proxyFor, because the tree transformation
        // looks at leaves first, that
        
        return node instanceof UglifyJS.AST_ObjectKeyVal &&
            this.isProxyForCall(node.value) &&
            node.value.args[0] instanceof UglifyJS.AST_Function &&
            !node.value.args[0].name;
    },
    addKeyAsFunctionNameForAnonymousFunctions: function (node) {
        var functionNode = node.value.args[0],
            invalidFunctionNames = /[-|]|true|false|this|break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|this|throw|try|typeof|var|void|while|with/;
        
        if (node.key.match(invalidFunctionNames))
            return;
        
        functionNode.name = new UglifyJS.AST_SymbolLambda({name: node.key});
    },
    isTransformedFunctionDeclaration: function(node) {
        var proxyForCall;
        
        // 1. check: var [NAME] = [EXPR];
        if (!(node instanceof UglifyJS.AST_Var &&
            node.definitions.length === 1))
            return false;
        
        // 2. check: var xy = lively.proxyFor([EXPR])
        if (!this.isProxyForCall(node.definitions[0].value))
            return false;
        
        proxyForCall = node.definitions[0].value;
        
        // 3. check [EXPR] in (2) is a function we wrapped previously
        return proxyForCall.args[0] instanceof UglifyJS.AST_Defun &&
            proxyForCall.args[0].shouldBeHoisted;
    },
    transformNode: function(node) {
        
        // function declarations get hoisted in JavaScript, so we need to move
        // the function declarations we transformed to variable assignments (of
        // the form 'var funcName = function expression') (and note that we
        // transform leaves first) to the beginning of each scope, while
        // preserving the order of function declarations. for examples, see:
        // javascriptweblog.wordpress.com/2010/07/06/function-declarations-vs-function-expressions/
        
        if (node instanceof UglifyJS.AST_Scope) {
            // find function declarations that need to hoisted
            var toHoist = node.body.select((function(each) {
                return this.isTransformedFunctionDeclaration(each);
            }).bind(this));
            
            // actually hoist them
            node.body = toHoist.concat(node.body.withoutAll(toHoist));
        }
        
        if (node instanceof UglifyJS.AST_Array ||
            node instanceof UglifyJS.AST_Function) {
            // Note: AST_Function is a function expression, not a declaration,
            // function declarations are handled below (AST_Defun)
            
            return this.wrapInProxyForCall(node);
            
        } else if (node instanceof UglifyJS.AST_Object) {
            // an object literal might define accessor functions (getter or
            // setter) for properties. these accessor functions don't just
            // expect an expression that returns a function, but are recognized
            // syntactically. for this reason, we extract these accessors from
            // object literals and define the accessor functions immediatelty
            // afterwards using Object.defineProperty(..)
            
            if (this.hasObjectAccessorProperties(node)) {
                return this.transformObjectLiteralWithAccessorDefinitions(node);
            } else {
                return this.wrapInProxyForCall(node);
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
            
            // TODO: function declarations get hoisted in JavaScript, so we
            // need to move the func decs we transform to variable assignments
            // of function expressions to the beginning of each function
            // scope, while preserving the lexical order of function
            // declarations, see javascriptweblog.wordpress.com/2010/07/06/function-declarations-vs-function-expressions/
            
            return this.transformFunctionDeclaration(node);
        } else if (node instanceof UglifyJS.AST_SymbolRef &&
            lively.GlobalObjectsToWrap.include(node.name)) {
            
            // global native and host Objects / Constructors need to be wrapped
            // into proxyFor-calls
            
            return this.wrapInProxyForCall(node);
        } else if (this.isCallToEval(node)) {
            
            // rewrite: eval([code]) -> eval(lively.transformSource([code]))
            node.args[0] = this.wrapInTransformSourceCall(node.args[0]);
            
            return node;
        } else if (node instanceof UglifyJS.AST_Binary &&
            node.operator === 'instanceof') {
            
            // rewrite: o instanceof T  ==> Object.instanceOf(o, T)
            // as instanceof doesn't work when proxies are used as virtual
            // objects
            
            return this.wrapInObjectInstanceOfCall([node.left, node.right]);
        } if (this.isAKeyValuePairWithAProxiedFunction(node)) {
            
            // use property keys as function names to have less anonymous
            // functions in the browser's developer tools
            
            // obj = {myMethod: lively.proxyFor(function())}
            // -->
            // obj = {myMethod: lively.proxyFor(function myMethod())}
            
            this.addKeyAsFunctionNameForAnonymousFunctions(node);
            return node;
        } else {
            return node;
        }
    },
    transformSource: function (originalSource, optCodeGeneratorOptions) {
        var originalAst, treeTransformer, transformedAst, sourceMap,
            outputStream,
            codeGeneratorOptions = optCodeGeneratorOptions || {};
        
        originalAst = UglifyJS.parse(originalSource);
        
        treeTransformer = new UglifyJS.TreeTransformer(null,
            this.transformNode.bind(this));
        transformedAst = originalAst.transform(treeTransformer);
        
        outputStream = UglifyJS.OutputStream(codeGeneratorOptions);
        transformedAst.print(outputStream);
        
        return outputStream.toString();
    },
    generateCodeWithMapping: function(originalSource, sourceMapOptions) {
        var uglifySourceMap = UglifyJS.SourceMap({}),
            generatedCode,
            sourceMap,
            dataUri;  
        
        generatedCode = this.transformSource(originalSource, 
            {source_map: uglifySourceMap});
                
        sourceMap = JSON.parse(uglifySourceMap.toString());
        Object.extend(sourceMap, sourceMapOptions);
        
        // see kybernetikos.github.io/jsSandbox/srcmaps/dynamic.html
        dataUri = 'data:application/json;charset=utf-8;base64,' +
            btoa(JSON.stringify(sourceMap));
        
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