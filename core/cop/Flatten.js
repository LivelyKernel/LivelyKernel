/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module('cop.Flatten').requires().toRun(function() {

Object.subclass('MethodManipulator',
'initializing', {
    initialize: function() {
        this.parameterRegex = /function\s*\(([^\)]*)\)/;
    },
},
'string manipulation', {
    
    removeSurroundingWhitespaces: function(str) {
        return Strings.removeSurroundingWhitespaces(str);
    },

    removeSpacesAfterFunctionKeyword: function(methodString) {
        return methodString.replace(/(function)\s*(\(.*)/, '$1$2');
    },
},
'method accessing', {
    methodBody: function(methodString) {
        var result = methodString
        result = result.substring(result.indexOf('{') + 1, result.length);
        result = result.substring(0, result.lastIndexOf('}'));
        result = this.removeSurroundingWhitespaces(result);
        return result
    },

    parameterNames: function(methodString) {
        var regexResult = this.parameterRegex.exec(methodString);
        if (!regexResult || !regexResult[1]) return [];
        var parameterString = regexResult[1];
        if (parameterString.length == 0) return [];
        var parameters = parameterString.split(',').collect(function(str) {
            return this.removeSurroundingWhitespaces(str)
        }, this);
        return parameters;
    },

    firstParameter: function(methodString) {
        return this.parameterNames(methodString)[0] || null
    },
},
'method manipulation', {
    removeFirstParameter: function(methodString) {
        var params = this.parameterNames(methodString);
        params.shift(); // remove first
        return methodString.replace(this.parameterRegex, 'function(' + params.join(', ') + ')');
    },
    removeOuterFunction: function(src) {
        var front = /^\s*(function[^\(]*\([^\)]*\)\s+\{\s*)/,
            back = /\s*},?\s*$/;
        return src.replace(front, '').replace(back, '')
    },


    addFirstParameter: function(methodString, param) {
        var params = this.parameterNames(methodString);
        params.unshift(param); // remove first
        return methodString.replace(this.parameterRegex, 'function(' + params.join(', ') + ')');
    },

    inlineProceed: function(layerSrc, originalSrc, proceedVarName) {
        // if layerSrc has a proceed call then replace the call with originalSrc

        layerSrc = this.removeSpacesAfterFunctionKeyword(layerSrc);
        originalSrc = this.removeSpacesAfterFunctionKeyword(originalSrc);

        // remove proceed parameter
        if (this.firstParameter(layerSrc) == proceedVarName)
            layerSrc = this.removeFirstParameter(layerSrc);

        // super check
        var superVarName = '$super';
        var hasSuper = this.firstParameter(originalSrc) == superVarName;
        if (hasSuper) {
            originalSrc = this.removeFirstParameter(originalSrc);
            layerSrc = this.addFirstParameter(layerSrc, superVarName);
        }

        // remove trailing ,
        originalSrc = this.removeSurroundingWhitespaces(originalSrc);
        if (originalSrc.endsWith(',')) originalSrc = originalSrc.substring(0, originalSrc.length-1);

        // is there a procced call?
        if (!proceedVarName || !layerSrc.include(proceedVarName)) return layerSrc;

        // fix indentation (each line of original source but the first gets a tab
        var lines = originalSrc.split('\n'), tab = lively.morphic.Text.prototype.tab;
        for (var i = 1; i< lines.length; i++) lines[i] = tab + lines[i];
        originalSrc = lines.join('\n');

        originalSrc = '(' + originalSrc + ')';
        // proceedVarName = proceedVarName.replace('$', '\\$')

        if (!this.regexpCache) this.regexpCache = {}
        if (!this.regexpCache[proceedVarName])
            this.regexpCache[proceedVarName] = {
                argRegExp: new RegExp('([^\\/]*(\\/\\/)?.*)' + proceedVarName + '\\(([^\\)]*)\\)', 'g'),
                simpleRegexp: new RegExp('([^\\/]*(\\/\\/)?.*)' + proceedVarName, 'g')
            }

        var regexps = this.regexpCache[proceedVarName];
        
        // replace the calls with + w/o args, this means something like "cop.proceed(args)"
        layerSrc = layerSrc.replace(regexps.argRegExp,
                function(match, beforeComment, comment, args) {
                    if (comment) return match;
                    var rewritten = beforeComment.replace(/(\))\s*$/, '$1;\n')
                    // var rewritten = beforeComment.replace(/\n[\s]*$/, ';\n')
                    return  rewritten + originalSrc + '.call(this' + 
                        (args ? ', ' + args : '') + ')';
                })

        // replace the proceeds that are not normally activated
        layerSrc = layerSrc.replace(regexps.simpleRegexp,
                function(match, beforeComment, comment) {
                    return comment ? match : (beforeComment + originalSrc);
                });

        return layerSrc;
    },
    inlineProceedDirect: function(layerSrc, originalSrc, proceedVarName) {
        // if layerSrc has a proceed call then replace the call with originalSrc

        layerSrc = this.removeSpacesAfterFunctionKeyword(layerSrc);
        originalSrc = this.removeSpacesAfterFunctionKeyword(originalSrc);

        // super check
        var superVarName = '$super';
        var hasSuper = this.firstParameter(originalSrc) == superVarName;
        if (hasSuper) {
            originalSrc = this.removeFirstParameter(originalSrc);
            layerSrc = this.addFirstParameter(layerSrc, superVarName);
        }

        originalSrc = this.removeOuterFunction(originalSrc);

        // is there a procced call?
        if (!proceedVarName || !layerSrc.include(proceedVarName)) return layerSrc;

        // fix indentation (each line of original source but the first gets a tab
        var lines = originalSrc.split('\n'), tab = lively.morphic.Text.prototype.tab;
        for (var i = 1; i< lines.length; i++) lines[i] = tab + lines[i];
        originalSrc = lines.join('\n');

        originalSrc = '\n' + originalSrc + '\n';

        if (!this.regexpCache) this.regexpCache = {}
        if (!this.regexpCache[proceedVarName])
            this.regexpCache[proceedVarName] = {
                argRegExp: new RegExp('([^\\/]*(\\/\\/)?.*)' + proceedVarName + '\\(([^\\)]*)\\)', 'g'),
                simpleRegexp: new RegExp('([^\\/]*(\\/\\/)?.*)' + proceedVarName, 'g')
            }

        var regexps = this.regexpCache[proceedVarName];
        
        // replace the calls with + w/o args, this means something like "cop.proceed(args)"
        layerSrc = layerSrc.replace(regexps.argRegExp,
                function(match, beforeComment, comment, args) {
                    if (comment) return match;
                    var rewritten = beforeComment.replace(/(\))\s*$/, '$1;\n')
                    return  rewritten + originalSrc;
                })

        // replace the proceeds that are not normally activated
        layerSrc = layerSrc.replace(regexps.simpleRegexp,
                function(match, beforeComment, comment) {
                    return comment ? match : (beforeComment + originalSrc);
                });

        return layerSrc;
    },

    addFirstLine: function(src, line) {
        var regexp = /(function[^\(]*\([^\)]*\)\s+\{)/;
        if (line[line.length-1] !== ';') line += ';'
        return src.replace(regexp, '$1' + line)
    },


});

Layer.addMethods(
'flattening', {
    layerDefOfObject: function(object) {
        var result = this[object._layer_object_id];
        if (!result) return {};
            // throw new Error('Cannot access layer def for ' + object.type ? object.type : object + ' in ' + this);
        return result
    },

    layerDefOfProperty: function(object, name, type) {
        return cop.lookupLayeredFunctionForObject(object, this, name, type)
    },

    namesOfLayeredMethods: function(obj) {
        var layerDef = this.layerDefOfObject(obj);
        return Functions.all(layerDef).reject(function(ea) { return Class.isClass(layerDef[ea]) });
    },
    
    namesOfLayeredProperties: function(obj) {
        var layerDef = this.layerDefOfObject(obj), result = [];
        for (var name in layerDef) {
            if (!layerDef.hasOwnProperty(name)) continue;
            var value = layerDef[name];
            if (value === obj) continue; /*discard _layered_object*/
            if (Object.isFunction(value) && !obj.__lookupGetter__(name)) continue;
            result.push(name);
        }
        return result
    },

    generateMethodReplacement: function(object, methodName) {
        var proceedReplacement = object[methodName].getOriginal().toString();
        return Strings.format('%s: %s,',
            methodName, this.generateMethodBody(object, methodName, proceedReplacement));
    },
    generateMethodBody: function(object, methodName, proceedReplacement, type, varMapping, partialMethod) {
        var method = partialMethod ||
            cop.lookupLayeredFunctionForObject(object, this, methodName, type);
        if (!method)
            throw new Error('method ' + object.type ? object.type : object +
                '>>' + methodName + ' not layered in ' + this);

        return cop.inliner.inlineProceedInPartialMethod(method, proceedReplacement, varMapping)
    },
    
    generatePropertyReplacement: function(object, propName, type) {
        var def = this.layerDefOfProperty(object, propName, type);
        if (!def) return null;
        var result = String(def);
        if (result.startsWith('function')) result = result.replace(/^function/, 'get');
        if (!result.endsWith(',')) result += ',';
        return result
    },


    layeredObjects: function() {
        // retrieve all the defs objects stored inside me with counter numbers
        var result = [];
        for (var name in this) {
            if (!this.hasOwnProperty(name)) continue;
            var prop = this[name]
            if (prop._layered_object && !result.include(prop._layered_object))
                result.push(prop._layered_object)
        }
        return result;
    },

    flattened: function(blacklist) {
        blacklist = blacklist || [];
        var objects = this.layeredObjects(),
            objectDefs = [],
            tab = lively.morphic.Text.prototype.tab;
        for (var i = 0; i < objects.length; i++) {
            var object = objects[i];
            if (!this.objectName(object)) continue;
            var def = '\n\n',
                props = this.namesOfLayeredProperties(object).reject(function(prop) {
                    return blacklist.any(function(spec) {
                        return spec.object == object && spec.name == prop
                    });
                });
            for (var j = 0; j < props.length; j++) {
                var getter = this.generatePropertyReplacement(object, props[j], 'getter');
                if (getter) def += tab + getter + '\n\n';
                var setter = this.generatePropertyReplacement(object, props[j], 'setter');
                if (setter) def += tab + setter + '\n\n';
            }
            

            var methods = this.namesOfLayeredMethods(object).reject(function(method) {
                return blacklist.any(function(spec) {
                    return spec.object == object && spec.name == method;
                });
            });
            def += methods.collect(function(method) {
                return tab + this.generateMethodReplacement(object, method);
            }, this). join('\n\n');
            if (methods.length > 0) def += '\n\n';

            objectDefs.push(this.objectDef(object, def));
        }

        return objectDefs.join('\n\n')
    },
    
    writeFlattened: function(moduleName, blacklist, requirements) {
        blacklist = blacklist || [];
        var blacklistDescr = blacklist.collect(function(spec) {
            return '{object: ' + this.objectName(spec.object) + ', name: ' + spec.name + '}'
        }, this);
        require('lively.ide.IDE').toRun(function() {
            var flattened = this.flattened(blacklist);
            var note = Strings.format('/*\n * Generated file\n * %s\n * %s.writeFlattened(\'%s\', [%s], [%s])\n */',
                new Date(), this.name, moduleName, blacklistDescr.join(','), JSON.stringify(requirements));
            var src = Strings.format('%s\nmodule(\'%s\').requires(%s).toRun(function() {\n\n%s\n\n}); // end of module',
                note, moduleName, JSON.stringify(requirements), flattened);
            var w = new lively.ide.ModuleWrapper(moduleName, 'js');
            w.setSource(src);
        }.bind(this));
    },

    objectName: function(obj) {
        if (Class.isClass(obj))
            return obj.type;
        if (obj.namespaceIdentifier)
            obj.namespaceIdentifier;
        if (Class.isClass(obj.constructor))
            return obj.constructor.type + '.prototype';
        return null;
    },

    objectDef: function(obj, bodyString) {
        if (Class.isClass(obj))
            return 'Object.extend(' + obj.type + ', {' + bodyString + '});';
        if (obj.namespaceIdentifier)
            return 'Object.extend(' + obj.namespaceIdentifier + ', {' + bodyString + '});';
        if (Class.isClass(obj.constructor))
            return obj.constructor.type + '.addMethods({' + bodyString + '});';
        return null;
    },

},
'installation', {
    recompile: function() {
        return;
        var objs = this.layeredObjects();
        objs.forEach(function(ea) {
            var def = this.layerDefOfObject(ea);
            cop.uninstallLayersInObject(ea);
            this.refineObject(ea, def)
        }, this)
    },
    ensureHash: function() {
        if (!this.hash) this.generateHash()
        return this.hash
    },
    generateHash: function() {
        return this.hash = this.fullName() + ':' + Date.now()
        // return this.hash = Date.now()
    },




},
'hashing', {

});
Object.subclass('cop.LayerInliner',
'inlining', {

    inlinePartialMethods: function(object, methodName, type, partialMethods, justReturnSource) {
        // rewrite the source of the function object[methodName] so that all partial methods
        // that are defined in layers are inlined. Will either return the source
        // or a recompiled function that also includes bound closure values if the partial
        // methods were created with lively.Closures 
        var method = this.lookupOriginalMethod(object, methodName, type),
            varMapping = method.getVarMapping(),
            source = String(method);

        for (var i = 0; i < partialMethods.length; i++)
	    source = this.inlineProceedInPartialMethod(partialMethods[i], source, varMapping)
        return justReturnSource ?
            source : lively.Closure.fromSource(source, varMapping).asFunction();
    },
    inlinePartialMethodsAndValidationCheck: function(object, methodName, type, partialMethods, validationSrc, validationFailureAction, justReturnSource) {
        // rewrite the source of the function object[methodName] so that all partial methods
        // that are defined in layers are inlined. Will either return the source
        // or a recompiled function that also includes bound closure values if the partial
        // methods were created with lively.Closures 
        var method = this.lookupOriginalMethod(object, methodName, type),
            varMapping = method.getVarMapping(),
            source = String(method);

        for (var i = 0; i < partialMethods.length; i++)
	    source = this.inlineProceedInPartialMethod(partialMethods[i], source, varMapping)

        source = cop.methodManipulator.addFirstLine(source, validationSrc);
        varMapping.validationFailure = validationFailureAction;

        if (justReturnSource) return source;
        var newMethod = lively.Closure.fromSource(source, varMapping).asFunction();
        newMethod.originalFunction = method;
        return newMethod;
    },


    inlinePartialMethodsWithValidation: function(object, methodName, methodType, partialMethods, inlineCreator, preComputedHash) {
        var method =  this.inlinePartialMethods(object, methodName, methodType, partialMethods);

        function checkValidation(hash) { return preComputedHash === hash }

        var firstRun = true;

        function validate() {
            var currentHash = cop.hashForCurrentComposition(this),
                isValid = checkValidation(currentHash);
            if (firstRun) {
                firstRun = false;
                if (!isValid)
                    throw new Error('Layer validation check failed on first call... this should not be!\nprecomputed hash: ' + preComputedHash + '\nactualHash: ' + currentHash)
            }
            return isValid ?
                method.apply(this, arguments) :
                inlineCreator.apply(this, arguments); // creates new inlined method
        }

        validate.originalFunction = inlineCreator.originalFunction
        validate.inlinedMethod = method

        return validate;

    },

    inlinePartialMethodsWithDirectValidation: function(object, methodName, methodType, partialMethods, inlineCreator, preComputedHash) {

        var validationCheck =
'\nvar currentHash = cop.hashForCurrentComposition(this);\n\
if (' + preComputedHash + ' !== currentHash)\n\
    return validationFailure.apply(this, arguments);\n';

        var method = this.inlinePartialMethodsAndValidationCheck(
            object, methodName, methodType, partialMethods, validationCheck, inlineCreator);

        return method;
    },


},
'accessing', {
    lookupOriginalMethod: function(object, methodName, type) {
        var method;
        if (type == 'getter') method = object.__lookupGetter__(methodName)
        else if (type == 'setter') method = object.__lookupSetter__(methodName)
        else method = object[methodName];
        return method.getOriginal();
    },
},
'source rewriting', {


    inlineProceedInPartialMethod: function(partialMethod, proceedReplacement, varMapping) {
        if (varMapping) { // add bound variables of method to varMapping, overwrite existing
            var partialVarMapping = partialMethod.getVarMapping();
            for (var name in partialVarMapping) varMapping[name] = partialVarMapping[name];
        }
        var source = String(partialMethod), proceedName = 'cop.proceed';
        if (cop.directDynamicInlining)
            return cop.methodManipulator.inlineProceedDirect(source, proceedReplacement, proceedName);
        return cop.methodManipulator.inlineProceed(source, proceedReplacement, proceedName);
    },

});
Object.extend(cop, {
    layerObject: function(layer, object, defs) {
        // log("cop.layerObject");
        Object.keys(defs).forEach(function(function_name) {
            // log(" layer property: " + function_name);
            cop.layerProperty(layer, object, function_name, defs);
        });
        layer.generateHash && layer.generateHash();
        cop.invalidateLayerComposition()
    },

    recompileLayers: function(layers) {
        var layeredObjects = layers.invoke('layeredObjects').flatten();
        layeredObjects.forEach(function(obj) {
            var defs = layers.invoke('layerDefOfObject', obj);
            cop.uninstallLayersInObject(obj);
            layers.forEach(function(layer, i) { layer.refineObject(obj, defs[i]) })
        }, this)
    },
    computeHashForLayers: function(layers) {
        if (false) {
            var hash = 0;
            for (var i = 0; i < layers.length; i++)
                hash += layers[i].ensureHash()
            return hash;
        }
        var hashes = new Array(layers.length);
        for (var i = 0; i < layers.length; i++)
            hashes[i] = layers[i].ensureHash()
        return hashes.join('');
    },
    hashForCurrentComposition: function(object) {
        if (object.activeLayers)
            return cop.computeHashForLayers(cop.computeLayersFor(object));

        function hashFromStack() {
            var composition = cop.LayerStack[cop.LayerStack.length - 1].composition;
            return composition && composition.hash
        }

        return hashFromStack() || cop.currentLayers().hash;
    },
    inliner: new cop.LayerInliner(),
    methodManipulator: new MethodManipulator(),


    makeSlotLayerAwareWithDynamicInlining: function(defObj, slotName, baseValue, type) {
        // beware defObj can be different from this (ie some object in this' proto chain)
        function inlinedFunctionCreator() {
            var layers = cop.computeLayersFor(this),
                hashForLayers = cop.computeHashForLayers(layers);

/*
// inline method caching -- accessing
var cache = cop.inlinedMethodCache[defObj._layer_object_id],
    cachedMethod = cache && cache[hashForLayers];
if (cachedMethod) {
    cop.installMethod(cachedMethod, defObj, slotName, type)
    return cachedMethod.apply(this, arguments)
}
*/
// if (slotName == 'connect') debugger
            var partialMethods = cop.findPartialMethodsForObject(layers, this, slotName, type),
                inlineFunc = cop.directDynamicInlining ?
                    'inlinePartialMethodsWithDirectValidation' : 
                    'inlinePartialMethodsWithValidation',
                inlinedMethod = cop.inliner[inlineFunc](
                    defObj, slotName, type, partialMethods, inlinedFunctionCreator, hashForLayers);

            inlinedMethod.isInlinedByCop = true;
            inlinedMethod.hash = hashForLayers;

/*            
// inline method caching -- storing
if (!cache) cache = cop.inlinedMethodCache[defObj._layer_object_id] = {}
cache[hashForLayers] = inlinedMethod;
*/

            cop.installMethod(inlinedMethod, defObj, slotName, type)
            return inlinedMethod.apply(this, arguments)
        };

        inlinedFunctionCreator.isLayerAware = true;
        inlinedFunctionCreator.originalFunction = baseValue;

        cop.installMethod(inlinedFunctionCreator, defObj, slotName, type)
    },
    makeSlotLayerAwareWithStaticInlining: function(defObj, slotName, baseValue, type) {
        function inlinedFunctionCreator() {
            var layers = cop.computeLayersFor(this),
                hashForLayers = cop.computeHashForLayers(layers),
                partialMethods = cop.findPartialMethodsForObject(layers, obj, slotName, type),
                inlinedMethod = cop.inliner.inlinePartialMethods(
                    defObj, slotName, type, partialMethods);

            inlinedMethod.isInlinedByCop = true;
            cop.installMethod(inlinedMethod, defObj, slotName, type)
            return inlinedMethod.apply(this, arguments)
        };

        inlinedFunctionCreator.isLayerAware = true;
        inlinedFunctionCreator.originalFunction = baseValue;
        cop.installMethod(inlinedFunctionCreator, defObj, slotName, type)
    },
    installMethod: function(method, obj, name, type) {
        if (type == "getter") obj.__defineGetter__(name, method);
        else if (type == "setter") obj.__defineSetter__(name, method);
        else obj[name] = method
    },
    getSlotValue: function(obj, name, type) {
        if (type == "getter") return obj.__lookupGetter__(name);
        else if (type == "setter") return obj.__lookupSetter__(name);
        else return obj[name]
    },

    findPartialMethodsForObject: function(layers, obj, slotName, type) {
        var result = [];
        for (var i = 0; i < layers.length; i++) {
            var partialMethod = cop.lookupLayeredFunctionForObject(
                obj, layers[i], slotName, type)
            if (partialMethod) result.push(partialMethod);
        }
        return result;
    },
    invalidateInlineMethodCache: function() {
        cop.inlinedMethodCache = {}
    },
    inlinedMethodCache: {},




});

}) // end of module
