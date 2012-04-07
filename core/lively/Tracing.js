module('lively.Tracing').requires().toRun(function() {

var rootContext;
var currentContext;

Object.extend(lively.Tracing, {
    getCurrentContext: function() { return currentContext },
    setCurrentContext: function(context) { currentContext = context }
});

Object.subclass('TracerStackNode', {

    isTracerNode: true,

    initialize: function(caller, method) {
        this.caller = caller;
        this.method = method;
        this.itsThis = null;  // These two get nulled after return
        this.args = null;  //  .. only used for stack trace on error
    },

    copyMe: function() {
        var caller = this.caller ? this.caller.copyMe() : null;
        var result = new TracerStackNode(caller, this.method);
        result.itsThis = this.itsThis;
        result.args = this.args;
        if (this.isRoot) result.isRoot = true;
        if (this.frame) result.frame = this.frame;
        return result;
    },

    traceCall: function(method , itsThis, args) {
        // this is the currentContext (top of stack)
        // method has been called with itsThis as receiver, and args as arguments
        // --> Check here for exceptions
        var newNode = new TracerStackNode(this, method);
        newNode.itsThis = itsThis;
        newNode.args = args;
        currentContext = newNode;
        if (Function.prototype.logAllCalls)
            console.log(" ".times(currentContext.stackSize()) + "\\" + currentContext);
    },

    traceReturn: function(method) {
        // this is the currentContext (top of stack)
        // method is returning
        this.args = null;  // release storage from unused stack
        this.itsThis = null;  //   ..
        if (Function.prototype.logAllCalls) console.log(" ".times(this.stackSize()) + "/" + this);
        currentContext = this.caller;
    },

    each: function(funcToCall) {
        // Stack walk (leaf to root) applying function
        for (var c = this; c; c=c.caller) funcToCall(this, c);
    },

    stackSize: function() {
        var size = 0;
        for (var c = this; c; c=c.caller) size++;
        return size;
    },

    dashes: function(n) {
        var lo = n % 5;
        return '----|'.times((n-lo)/5) + '----|'.substring(0,lo);
    },

    toString: function() {
        return "<" + this.method.qualifiedMethodName() + ">";
    }

});

TracerStackNode.subclass('TracerTreeNode', {

    initialize: function($super, caller, method) {
        $super(caller, method);
        this.callees = {};
        this.tally = 0;
        this.ticks = 0;
        this.calltime = null;
    },

    traceCall: function(method , itsThis, args) {
        // this is the currentContext (top of stack)
        // method has been called with itsThis as receiver, and args as arguments
        // --> Check here for exceptions
        var newNode = this.callees[method];
        if (!newNode) {
            // First hit -- need to make a new node
            newNode = new TracerTreeNode(this, method);
            this.callees[method] = newNode;
        }
        newNode.itsThis = itsThis;
        newNode.args = args;
        newNode.tally++;
        newNode.callTime = new Date().getTime();
        currentContext = newNode;
    },

    traceReturn: function(method) {
        // this is the currentContext (top of stack)
        // method is returning
        //if(stackNodeCount < 20) console.log("returning from " + method.qualifiedMethodName());
        this.args = null;  // release storage from unused stack info
        this.itsThis = null;  //   ..
        this.ticks += (new Date().getTime() - this.callTime);
        currentContext = this.caller;
    },

    each: function(funcToCall, level, sortFunc) {
        // Recursive tree visit with callees order parameter (eg, tallies, ticks, alpha)
        if (level == null) level = 0;
        funcToCall(this, level);
        var sortedCallees = [];
        Properties.forEachOwn(this.callees, function(meth, node) { sortedCallees.push(node); })
        if (sortedCallees.length == 0) return;
        sortedCallees.sort(sortFunc);
        sortedCallees.forEach(function(node) { node.each(funcToCall, level+1, sortFunc); });
    },

    fullString: function(options) {
        var totalTicks = 0;
        Properties.forEachOwn(this.callees, function(meth, node) { totalTicks += node.ticks; })
        var major = (options.sortBy == "tally") ? "tally" : "ticks";
        var minor = (major == "tally") ? "ticks" : "tally";
        var threshold = options.threshold;
        if (!threshold && threshold !== 0)  threshold = major == "ticks" ? (totalTicks/100).roundTo(1) : 0;

        var sortFunction = function(a, b) {
            if(a[major] == b[major]) return (a[minor] > b[minor]) ? -1 : (a[minor] < b[minor]) ? 1 : 0;
            return (a[major] > b[major]) ? -1 : 1;
        }
        var str = "Execution profile (" + major + " / " + minor + "):\n";
        str += "    options specified = {" ;
        str += " repeat: "  + (options.repeat || 1);
        str += ", sortBy: " + '"' + major + '"' ;
        str += ", threshold: " + threshold + " }\n" ;
        var leafCounts = {};

        // Print the call tree, and build the dictionary of leaf counts...
        this.each(function(node, level, sortFunc) {
            if (node.ticks >= threshold) str += (this.dashes(level) + node.toString(major, minor) + "\n");
            if (leafCounts[node.method] == null) leafCounts[node.method] =
            {methodName: node.method.qualifiedMethodName(), tallies: 0, ticks: 0};
            var leafCount = leafCounts[node.method];
            leafCount.tallies += node.tally;
            leafCount.ticks += node.ticksInMethod();
        }.bind(this), 0, sortFunction);

        str += "\nLeaf nodes sorted by ticks within that method (ticks / tallies):\n" ;
        var sortedLeaves = [];
        Properties.forEachOwn(leafCounts, function(meth, count) { sortedLeaves.push(count); })
        if (sortedLeaves.length == 0) return null;
        sortedLeaves.sort(function (a, b) { return (a.ticks > b.ticks) ? -1 : (a.ticks < b.ticks) ? 1 : 0 } );
        sortedLeaves.forEach( function (count) {
            if (count.ticks >= threshold*0.4)  str += "(" + count.ticks + " / " + count.tallies + ") " + count.methodName + "\n";
        });

        return str;
    },

    toString: function(major, minor) {
        if(!major) {major = "ticks";  minor = "tally"};
        return '(' + this[major].toString() + ' / ' + this[minor].toString() + ') ' + this.method.qualifiedMethodName();
    },

    ticksInMethod: function() {
        var localTicks = this.ticks;
        // subtract ticks of callees to get net ticks in this method
        Properties.forEachOwn(this.callees, function(meth, node) { localTicks -= node.ticks; })
        return localTicks;
    }

});

Object.extend(lively.Tracing, {
    resetDebuggingStack: function resetDebuggingStack() {
        var rootMethod = arguments.callee.caller;
        rootContext = new TracerStackNode(null, rootMethod);
        currentContext = rootContext;
        Function.prototype.logAllCalls = false;
    },

    showStack: function(useViewer, context) {
        if (lively.Tracing.globalTracingEnabled) {
            var currentContext = lively.Tracing.getCurrentContext();
            var msgParts = [];
            for (var c = currentContext, i = 0; c != null; c = c.caller, i++) {
                var args = c.args;
                if (!args) {
                    msgParts.push("no frame at " + i);
                    continue;
                }
                var header = Object.inspect(args.callee.getOriginal());
                var frame = i.toString() + ": " + header + "\n";
                frame += "this: " + c.itsThis + "\n";
                var k = header.indexOf('(');
                header = header.substring(k + 1, 999);  // ')' or 'zort)' or 'zort,baz)', etc
                for (var j = 0; j <args.length; j++) {
                    k = header.indexOf(')');
                    var k2 = header.indexOf(',');
                    if (k2 >= 0) k = Math.min(k,k2);
                    var argName = header.substring(0, k);
                    header = header.substring(k + 2);
                    if (argName.length > 0) frame += argName + ": " + Object.inspect(args[j]) + "\n";
                }
                msgParts.push(frame);
                if (i >= 500) {
                    msgParts.push("stack overflow?");
                    break;
                }
            }
            if (useViewer) {
                lively.morphic.World.current().addTextWindow(msgParts.join('\n'));
            } else {
                console.log(msgParts.join('\n'));
            }
        } else {
            var visited = [], msgs = [];
            for (var c = arguments.callee.caller, i = 0; c != null; c = c.caller, i++) {
                msgs.push(Strings.format("%s: %s", i, Object.inspect(c)));
                if (visited.indexOf(c) >= 0) {
                    msgs.push("possible recursion");
                    break;
                } else {
                    visited.push(c);
                }
                if (i > 500) {
                    msgs.push("stack overflow?");
                    break;
                }
            }
            if (useViewer) {
                lively.morphic.World.current().addTextWindow(msgs.join('\n'));
            } else {
                console.log(msgs.join('\n'));
            }
        }
    },

    testTrace: function(options) {
        // lively.Tracing.testTrace()
        var world = lively.morphic.World().current();
        this.trace(function() { world.setFill(Color.random()) }, {openWindow: true});
    },

    trace: function(method, options) {
        // options: openWindow, printToConsole, returnTrace, repeat, threshold
        if (!options) options = {};
        var traceRoot = new TracerTreeNode(currentContext, method);
        currentContext = traceRoot;
        for (var result, i = 1; i <= (options.repeat || 1); i++)
            result = method.call(this);
        currentContext = traceRoot.caller;
        traceRoot.caller = null;
        if (options.returnTrace) { result = traceRoot }
        this.actOnTrace(traceRoot, options);
        return result;
    },

    actOnTrace: function(context, options) {
        if (options.printToConsole) {
            console.log(context.fullString(options));
        } else if (options.openWindow) {
            lively.morphic.World.current().addTextWindow(context.fullString(options));
        }
    },

    installStackTracers: function(remove) {
        if (!remove && this.stackTracingEnabled) return;
        this.stackTracingEnabled = !remove;
        Global.classes(true/*recursive*/).forEach(function(theClass) {
            lively.Tracing.instrumentClass(theClass, remove);
        });
        lively.morphic.World.current().withAllSubmorphsDo(function(morph) {
           lively.Tracing.instrumentObject(morph, remove);
        });
        return this;
    },

    uninstallStackTracers: function() { this.installStackTracers(true) },

    tallyLOC: function() {
        console.log("Tallying lines of code by decompilation");
        var classNames = [];
        Class.withAllClassNames(Global, function(n) { classNames.push(n)});
        classNames.sort();
        var tallies = "";
        for (var ci= 0; ci < classNames.length; ci++) {
            var cName = classNames[ci];
            if (cName != 'Global' && cName != 'Object') {
                var theClass = Class.forName(cName);
                var methodNames = theClass.localFunctionNames();
                var loc = 0;
                for (var mi = 0; mi < methodNames.length; mi++) {
                    var mName = methodNames[mi];
                    var originalMethod = theClass.prototype[mName];
                    // decompile and count lines with more than one non-blank character
                    var lines = originalMethod.toString().split("\n");
                    lines.forEach( function(line) { if(line.replace(/\s/g, "").length>1) loc++ ; } );
                }
            }
            console.log(cName + " " + loc);
            // tallies += cName + " " + loc.toString() + "\n";
        }
    },

});

Object.extend(lively.Tracing, {

    excludedClasses: ["TracerTreeNode", "TracerStackNode", "Global", "String", "Object"],

    excludedModules: ["lively.Tracing", "lively.ast.Parser", "lively.ast.generated.Nodes", "lively.ast.Interpreter", "lively.ast.Morphic"],

    instrumentMethod: function(obj, selector, propsToAdd) {
        var method = obj[selector];
        if (propsToAdd) Object.extend(method, propsToAdd);
        this.warnIfMethodComposition(method, obj, selector);
        if (this.isInstrumented(method)) return true;
        if (!this.canBeInstrumented(method, obj, selector)) return false;
        if (!method.methodName) method.methodName = selector;
        obj[selector] = method.tracingWrapper();
        return true;
    },

    uninstrumentMethod: function(obj, selector) {
        var rootMethod = obj[selector],
            composition = Functions.methodChain(rootMethod),
            index = -1,
            tracingWrapper = composition.detect(function(ea, i) {
                index = i;
                return ea.isLivelyTracingWrapper;
            });
        if (!tracingWrapper) return;
        var before = composition[index - 1];
        if (before) {
            // we know how to uninstall with cop
            if (before.isContextJSWrapper) {
                before.originalFunction = tracingWrapper.originalFunction;
                return;
            }
            var msg = "lively.Tracing trying to uninstall but found unknowm method composition: ";
            msg += this.methodCompositionString(obj, selector, composition);
            console.error(msg);
        } else {
            obj[selector] = tracingWrapper.originalFunction;
        }
    },

    instrumentObject: function(object, should_remove, propsToAdd) {
        propsToAdd = propsToAdd || {declaredObject: Objects.safeToString(object)};
        Functions.own(object).forEach(function(selector) {
            should_remove ?
                lively.Tracing.uninstrumentMethod(object, selector) :
                lively.Tracing.instrumentMethod(object, selector, propsToAdd);
        });
    },

    isExcluded: function(m) {
        for (var i = 0; i < this.excludedModules.length; i++) {
            if (module(this.excludedModules[i]) === m) {
                return true;
            }
        }
        return false;
    },

    instrumentClass: function(klass, should_remove) {
        var cName = klass.type || klass.name;
        if (this.excludedClasses.include(cName)) return;
        if (this.isExcluded(klass.sourceModule)) return;
        this.instrumentObject(klass.prototype, should_remove, {declaredClass: cName});
        this.instrumentObject(klass, should_remove, {declaredClass: "class " + cName});
    },

    warnIfMethodComposition: function(method, obj, selector) {
        var composition = Functions.methodChain(method);
        if (composition.length === 1) return;
        if (composition.length === 2 && method.isSuperWrapper) return;
        var msg = 'Found unknown method composition while tracing ';
        msg += this.methodCompositionString(obj, selector, composition);
        console.warn(msg);
    },

    methodCompositionString: function(obj, selector, composition) {
        var string = Objects.safeToString(obj) + '>>' + selector + ": <";
        string += composition.invoke('qualifiedMethodName').join(', ')
        string += ">";
        return string;
    },

    isInstrumented: function(method) {
        return Functions.methodChain(method).any(function(m) { return m.isLivelyTracingWrapper });
    },

    canBeInstrumented: function(method, obj, selector) {
        // leave the constructor alone and other classes alone
        return !Class.isClass(method) &&
                !method.isContextJSWrapper &&
                (method.declaredClass + "." + selector) != "Function.qualifiedMethodName" &&
                obj.hasOwnProperty(selector) &&
                typeof(method) === 'function';
    },

    startGlobalTracing: function() {
        // here we build a tracing controller (button)
        // that when pressed will stop tracing and display results
        var tracingController = new lively.morphic.Button(
            new Rectangle(0,0,100,35),
            "Click here to stop tracing");

        tracingController.setName("TracingController");

        tracingController.tracingStyle = {
            fill: new lively.morphic.LinearGradient(
                [{offset: 0, color: Color.red.mixedWith(Color.white, 0.2)},
                 {offset: 0.33, color: Color.red.mixedWith(Color.white, 0.9)},
                 {offset: 0.66, color: Color.red.mixedWith(Color.white, 0.9)},
                 {offset: 1, color: Color.red.mixedWith(Color.white, 0.3)}],
                "NorthSouth"),
            labelStyle: {
                textColor: Color.white
            }
        };

        tracingController.addScript(function startTrace() {
            connect(this, 'fire', this, 'stopTrace');
            this.openInWorld();
            this.centerAt(this.world().visibleBounds().center());
            this.applyStyle(this.tracingStyle);
            this.label.applyStyle(this.tracingStyle.labelStyle);
            this.collectedContexts = new TracerTreeNode(null, {
                qualifiedMethodName: function() { return "trace root" },
                tallies: 0, ticks: 0});

            // delayed so we don't trace our own invocation
            (function() {
                lively.Tracing.globalTracingEnabled = true;
                lively.Tracing.setCurrentContext(this.collectedContexts);
            }).bind(this).delay(0.2);
        });

        tracingController.addScript(function stopTrace() {
            // delayed because setting currentContext to null would raise
            // error when current stack is popped
            (function() {
                lively.Tracing.globalTracingEnabled = false;
                lively.Tracing.setCurrentContext(null);
            }).delay(0);
            // delayed so we don't trace our own invocation
            (function() {
                this.applyStyle(this.style);
                this.label.applyStyle(this.labelStyle);
                this.remove();
                lively.Tracing.actOnTrace(this.collectedContexts, {openWindow: true});
            }).bind(this).delay(0.1);
        });

        alertOK('Global tracing starts now. Click button to stop and show results');

        tracingController.startTrace();
    }

});

Function.addMethods(
'tracing', {

    tracingWrapper: function () {
        // Make a proxy method (traceFunc) that calls the tracing routines before
        // and after this method
        var originalFunction = this;
        var traceFunc = function () {
            if (!currentContext) return originalFunction.apply(this, arguments);  // not started yet
            try {
                currentContext.traceCall(originalFunction, this, arguments);
                var result = originalFunction.apply(this, arguments);
                if (result && result.inspectMe === true)
                    result.openTracer(currentContext);
                return result;
            } catch(e) {
                console.log('got error:' + e.message);
                if (!e.simStack) e.simStack = currentContext.copyMe();
                if (!e.stack) console.log('caller ' + currentContext.caller);
                if (!e.stack) e.stack = e.simStack;
                throw e;
            } finally {
                currentContext.traceReturn(originalFunction);
            }
        };
        // Attach this (the original function) to the tracing proxy, used by #getOriginal
        traceFunc.originalFunction = originalFunction;
        traceFunc.isLivelyTracingWrapper = true;
        traceFunc.methodName = "tracing wrapper for <" + originalFunction.qualifiedMethodName() + ">";
        return traceFunc;
    }

});

}) // end of module