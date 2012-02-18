module('lively.lang.Closure').requires().toRun(function() {

///////////////////////////////////////////////////////////////////////////////
// Class defintion: lively.Closure
///////////////////////////////////////////////////////////////////////////////
// FIXME: change namespace lively.Closure ==> lively.lang.Closure
Object.subclass('lively.Closure',
'documentation', {
    documentation: 'represents a function and its bound values'  
},
'settings', {
    isLivelyClosure: true,
},
'initializing', {
    initialize: function(func, varMapping, source, funcProperties) {
        this.originalFunc = func;
        this.varMapping = varMapping || {};
        this.source = source;
        this.setFuncProperties(func || funcProperties);
    }
}, 
'accessing', {
    setFuncSource: function(src) {
        this.source = src
    },
    
    getFuncSource: function() {
        return this.source || String(this.originalFunc)
    },
    
    hasFuncSource: function() {
        return this.source && true
    },
    
    getFunc: function() {
        return this.originalFunc || this.recreateFunc()
    },
    
    getFuncProperties: function() {
        // a function may have state attached
        if (!this.funcProperties) this.funcProperties = {};
        return this.funcProperties;
    },
    
    setFuncProperties: function(obj) {
        var props = this.getFuncProperties();
        for (var name in obj)
        if (obj.hasOwnProperty(name)) props[name] = obj[name];
    },

    lookup: function(name) {
        return this.varMapping[name]
    },
    
    parameterNames: function(methodString) {
        var parameterRegex = /function\s*\(([^\)]*)\)/,
            regexResult = parameterRegex.exec(methodString);
        if (!regexResult || !regexResult[1]) return [];
        var parameterString = regexResult[1];
        if (parameterString.length == 0) return [];
        var parameters = parameterString.split(',').collect(function(str) {
            return Strings.removeSurroundingWhitespaces(str)
        }, this);
        return parameters;
    },
    
    firstParameter: function(src) {
        return this.parameterNames(src)[0] || null
    },
}, 
'function creation', {    
    recreateFunc: function() {
        return this.recreateFuncFromSource(this.getFuncSource())
    },
    
    recreateFuncFromSource: function(funcSource) {
        // what about objects that are copied by value, e.g. numbers?
        // when those are modified after the originalFunc we captured
        // varMapping then we will have divergent state
        var closureVars = [],
            thisFound = false,
            specificSuperHandling = this.firstParameter(funcSource) === '$super';
        for (var name in this.varMapping) {
            if (!this.varMapping.hasOwnProperty(name)) continue;
            if (name == 'this') {
                thisFound = true;
                continue
            };
            closureVars.push(name + '=this.varMapping["' + name + '"]');
        }
        var src = closureVars.length > 0 ? 'var ' + closureVars.join(',') + ';\n' : '';
        if (specificSuperHandling) src += '(function superWrapperForClosure() { return '
        src += '(' + funcSource + ')';

        if (specificSuperHandling) src += '.apply(this, [$super.bind(this)].concat($A(arguments))) })'

        try {
            var func = eval(src) || this.couldNotCreateFunc(src);
            this.addFuncProperties(func);
            return func;
        } catch (e) {
            alert('Cannot create function ' + e + ' src: ' + src);
            throw e
        };
    },
    
    addFuncProperties: function(func) {
        var props = this.getFuncProperties();
        for (var name in props)
        if (props.hasOwnProperty(name)) func[name] = props[name];
        this.addClosureInformation(func);
    },
   
    couldNotCreateFunc: function(src) {
        var msg = 'Could not recreate closure from source: \n' + src;
        console.error(msg);
        alert(msg);
        debugger;
        return function() {
            alert(msg)
        };
    },
}, 
'conversion', {
    asFunction: function() {
        return this.recreateFunc()
    }
},
'function modification',{
    addClosureInformation: function(f) {
        f.hasLivelyClosure = true;
        f.livelyClosure = this;
        return f;
    }
});

Object.extend(lively.Closure, {
    fromFunction: function(func, varMapping) {
        return new this(func, varMapping || {});
    },

    fromSource: function(source, varMapping) {
        return new this(null, varMapping || {}, source);
    },
});

}); // end of module