///////////////////////////////////////////////////////////////////////////////
// Extensions to Function instances
///////////////////////////////////////////////////////////////////////////////

Object.extend(Function.prototype, {
    argumentNames: function() {
        var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].
                replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').
                replace(/\s+/g, '').split(',');

        return names.length == 1 && !names[0] ? [] : names;
    },

    curry: function() {
        if (!arguments.length) return this;
        var __method = this,
            args = $A(arguments),
            wrappedFunc = function curried() {
                return __method.apply(this, args.concat($A(arguments)));
            }
        wrappedFunc.isWrapper = true;
        wrappedFunc.originalFunction = __method;
        return wrappedFunc;
    },

    delay: function() {
        var __method = this,
            args = $A(arguments),
            timeout = args.shift() * 1000;
        return window.setTimeout(function delayed() {
            return __method.apply(__method, args);
        }, timeout);
    },

    wrap: function(wrapper) {
        var __method = this;
        var wrappedFunc = function wrapped() {
                var wrapperArgs = wrapper.isWrapper ? $A(arguments) : [__method.bind(this)].concat($A(arguments));
                return wrapper.apply(this, wrapperArgs);
            }
        wrappedFunc.isWrapper = true;
        wrappedFunc.originalFunction = __method;
        return wrappedFunc;
    },

    inspectFull: function() {
        var methodBody = this.toString();
        methodBody = methodBody.substring(8, methodBody.length);
        return this.qualifiedMethodName() + methodBody;
    },

    inspect: function() {
        // Print method name (if any) and the first 80 characters of the 
        // decompiled source (without 'function')
        var def = this.toString(),
            i = def.indexOf('{'),
            header = this.qualifiedMethodName() + def.substring(8, i),
            // strip newlines
            body = (def.substring(i, 88) +
                     (def.length > 88 ? '...' : '')).replace(/\n/g, ' '); 
        return header + body;
    },

    qualifiedMethodName: function() {
        var objString = "";
        if (this.declaredClass) {
            objString += this.declaredClass + '.';
        } else if (this.declaredObject) {
            objString += this.declaredObject + '>>';
        }
        return objString + (this.methodName || this.name || "anonymous");
    },

    functionNames: function(filter) {
        var functionNames = [];

        for (var name in this.prototype) {
            try {
                if ((this.prototype[name] instanceof Function) && (!filter || filter(name))) {
                    functionNames.push(name);
                }
            } catch (er) {
                // FF can throw an exception here ...
            }
        }

        return functionNames;
    },

    withAllFunctionNames: function(callback) {
        for (var name in this.prototype) {
            try {
                var value = this.prototype[name];
                if (value instanceof Function) callback(name, value, this);
            } catch (er) {
                // FF can throw an exception here ...
            }
        }
    },

    localFunctionNames: function() {
        var sup = this.superclass || ((this === Object) ? null : Object);

        try {
            var superNames = (sup == null) ? [] : sup.functionNames();
        } catch (e) {
            var superNames = [];
        }
        var result = [];

        this.withAllFunctionNames(function(name, value, target) {
            if (!superNames.include(name) || target.prototype[name] !== sup.prototype[name]) result.push(name);
        });
        return result;
    },

    getOriginal: function() {
        // get the original 'unwrapped' function, traversing as many wrappers as necessary.
        var func = this;
        while (func.originalFunction) func = func.originalFunction;
        return func;
    },

    logErrors: function(prefix) {
        if (Config.ignoreAdvice) return this;

        var advice = function logErrorsAdvice(proceed /*,args*/ ) {
                var args = $A(arguments);
                args.shift();
                try {
                    return proceed.apply(this, args);
                } catch (er) {
                    if (Global.lively && lively.morphic && lively.morphic.World && lively.morphic.World.current()) {
                        lively.morphic.World.current().logError(er)
                        throw er;
                    }

                    if (prefix) console.warn("ERROR: %s.%s(%s): err: %s %s", this, prefix, args, er, er.stack || "");
                    else console.warn("ERROR: %s %s", er, er.stack || "");
                    logStack();
                    if (Global.printObject) console.warn("details: " + printObject(er));
                    // lively.lang.Execution.showStack();
                    throw er;
                }
            }

        advice.methodName = "$logErrorsAdvice";
        var result = this.wrap(advice);
        result.originalFunction = this;
        result.methodName = "$logErrorsWrapper";
        return result;
    },

    logCompletion: function(module) {
        if (Config.ignoreAdvice) return this;

        var advice = function logCompletionAdvice(proceed) {
                var args = $A(arguments);
                args.shift();
                try {
                    var result = proceed.apply(this, args);
                } catch (er) {
                    console.warn('failed to load ' + module + ': ' + er);
                    lively.lang.Execution.showStack();
                    throw er;
                }
                console.log('completed ' + module);
                return result;
            }

        advice.methodName = "$logCompletionAdvice::" + module;

        var result = this.wrap(advice);
        result.methodName = "$logCompletionWrapper::" + module;
        result.originalFunction = this;
        return result;
    },

    logCalls: function(isUrgent) {
        if (Config.ignoreAdvice) return this;

        var original = this,
            advice = function logCallsAdvice(proceed) {
                var args = $A(arguments);
                args.shift(), result = proceed.apply(this, args);
                if (isUrgent) {
                    console.warn('%s(%s) -> %s', original.qualifiedMethodName(), args, result);
                } else {
                    console.log('%s(%s) -> %s', original.qualifiedMethodName(), args, result);
                }
                return result;
            }

        advice.methodName = "$logCallsAdvice::" + this.qualifiedMethodName();

        var result = this.wrap(advice);
        result.originalFunction = this;
        result.methodName = "$logCallsWrapper::" + this.qualifiedMethodName();
        return result;
    },

    traceCalls: function(stack) {
        var advice = function traceCallsAdvice(proceed) {
                var args = $A(arguments);
                args.shift();
                stack.push(args);
                var result = proceed.apply(this, args);
                stack.pop();
                return result;
            };
        return this.wrap(advice);
    },

    webkitStack: function() {
        // this won't work in every browser
        try {
            throw new Error()
        } catch (e) {
            // remove "Error" and this function from stack, rewrite it nicely
            var trace = Strings.lines(e.stack).slice(2).invoke('replace', /^\s*at\s*([^\s]+).*/, '$1').join('\n');
            return trace;
        }
    },
    
    unbind: function() {
        // for serializing functions
        return Function.fromString(this.toString());
    },
    
    asScript: function(optVarMapping) {
        return lively.Closure.fromFunction(this, optVarMapping).recreateFunc();
    },
    asScriptOf: function(obj, optName, optMapping) {
        var name = optName || this.name;
        if (!name) {
            throw Error("Function that wants to be a script needs a name: " + this);
        }
        var constructor = obj.constructor,
            mapping = {
                "this": obj
            };
        if (optMapping) mapping = Object.merge([mapping, optMapping]);
        if (constructor && constructor.prototype && constructor.prototype[name]) {
            var superFunc = function() {
                    try {
                        return obj.constructor.prototype[name].apply(obj, arguments)
                    } catch (e) {
                        if ($world) 
                            $world.logError(e, 'Error in $super call')
                        else
                            alert('Error in $super call: ' + e + '\n' + e.stack);
                        return null;
                    }
                };
            mapping["$super"] = lively.Closure.fromFunction(superFunc, {
                "obj": obj,
                name: name
            }).recreateFunc();
        }
        return this.asScript(mapping).addToObject(obj, name);
    },
    
    addToObject: function(obj, name) {
        this.name = name;
        obj[name] = this;
        // suppport for tracing
        if (lively.Tracing && lively.Tracing.stackTracingEnabled) {
            lively.Tracing.instrumentMethod(obj, name, {
                declaredObject: Objects.safeToString(obj)
            });
        }
        return this;
    },
    
    binds: function(varMapping) {
        // convenience function
        return lively.Closure.fromFunction(this, varMapping || {}).recreateFunc()
    },
    
    setProperty: function(name, value) {
        this[name] = value;
        if (this.hasLivelyClosure) this.livelyClosure.funcProperties[name] = value
    },
    
    getVarMapping: function() {
        if (this.hasLivelyClosure) return this.livelyClosure.varMapping;
        if (this.isWrapper) return this.originalFunction.varMapping;
        if (this.varMapping) return this.varMapping;
        return {}
    }

});


///////////////////////////////////////////////////////////////////////////////
// Extensions to the Function object
///////////////////////////////////////////////////////////////////////////////

Object.extend(Function, {
    fromString: function(funcOrString) {
        return eval('(' + funcOrString.toString() + ')')
    }    
});


///////////////////////////////////////////////////////////////////////////////
// Global Helper - Functions
///////////////////////////////////////////////////////////////////////////////

Functions = {
    Empty: function() {},

    K: function(arg) {
        return arg;
    },

    Null: function() {
        return null;
    },

    False: function() {
        return false;
    },

    True: function() {
        return true;
    },

    all: function(object) {
        var a = [];
        for (var name in object) {
            try {
                if (!object.__lookupGetter__(name) && Object.isFunction(object[name])) a.push(name);
            } catch (e) {
                alert(e)
            }
        }
        return a;
    },

    own: function(object) {
        var a = [];
        for (var name in object) {
            try {
                if (!object.__lookupGetter__(name) && object.hasOwnProperty(name) && Object.isFunction(object[name])) a.push(name);
            } catch (e) {
                alert(e)
            }
        }
        return a;
    },

    timeToRun: function(func) {
        var startTime = (new Date()).getTime();
        func();
        return new Date().getTime() - startTime;
    },

    timeToRunN: function(func, n) {
        var time = 0;
        for (var i = 0; i < n; i++)
        time += Functions.timeToRun(func);
        return time / n;
    },

    notYetImplemented: function() {
        throw new Error('Not yet implemented');
    },

    methodChain: function(method) {
        // method wrappers used for wrapping, cop, and other method 
        // manipulations attach a property "originalFunction" to the wrapper by 
        // convention this property references the wrapped method like wrapper 
        // -> cop wrapper -> real method 
        // this method gives access to the linked list starting at "method
        var result = [];
        do {
            result.push(method);
            method = method.originalFunction;
        } while (method);
        return result;
    }
};