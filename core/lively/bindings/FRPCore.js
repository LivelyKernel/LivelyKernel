module('lively.bindings.FRPCore').requires('lively.bindings.FRPTranslationSupport').toRun(function() {

Object.subclass('lively.bindings.FRPCore.StreamRef',
// StreamRef represents the loose-coupled variable name.
// It is used for the key to look up the corresponding stream
// in the owner object.
'all', {
    initialize: function($super, ref) {
        this.ref = ref;
        this.isSubExpression = ref.match(/^_t/) !== null;
    }
});

Object.subclass('lively.bindings.FRPCore.EventStream',
//EventStream represents a node in the data flow graph.
'initialization', {
    setUp: function(type, srcs, updater, checker, isContinuous) {
    // type is either a pre-defined combinator ("timerE", "collectE", etc) or
    // generic "exprE", that is used for everything else.
    //
    // sources is a list of (StreamsRef | value) that is used to compute
    // the new value of the stream.  a value is allowed when a sub term is not
    // a stream, but a value.
    //
    // depenencies is a list of (StreamRef) that is used to determine whether
    // this stream should be updated.  Usually, dependencies are a super-set of
    // sources.
    //
    // currentValue is the currentValue of the stream.  Last Value is the
    // last value.
    //
    // checker and updater are functions to determine the stream should be updated,
    // and compute the actual new value.
        this.id = this.constructor.nextId++;
        this.type = type;
        this.updater = updater || this.basicUpdater;
        this.sources = srcs;
        this.dependencies = srcs.filter(function(e) { return this.isStreamRef(e); }, this);
        this.currentValue = undefined;
        this.lastValue = undefined;
        this.checker = checker || this.basicChecker;
        this.isContinuous = isContinuous !== undefined ? isContinuous : null;
        this.setLastTime(0);
        return this;
    },
    setCode: function(aString) {
        this.code = aString;
        return this;
    },

    beContinuous: function(val) {
        this.currentValue = this.lastValue = val;
        this.isContinuous = val !== undefined;
        return this;
    },

    installTo: function(object, name) {
    // Install this into the owner object under the name
    // When the stream is continuous, the potential dependents will be evaluated
    // upon next available step.
        if (object[name] && this.isEventStream(object[name])) {
            object[name].uninstall();
        }
        object[name] = this;
        this.owner = object;
        this.streamName = name;
        if (this.isContinuous) {
            this.setLastTime(object.__evaluator.currentTime + 1 /* hmm */);
        }
        this.owner["_" + name] = Function("n", "this." + name + ".frpSet(n)");
        object.__evaluator.installStream(this);
        return this;
    },

    uninstall: function() {
        if (this.owner) {
            if (this.owner.__evaluator) {
                this.owner.__evaluator.uninstallStream(this);
            }
            delete this.owner[this.streamName];
            delete this.owner["_" + this.streamName];
            delete this.owner;
            delete this.streamName;
        }
    },
},
'combinators', {
    timerE: function(interval) {
        this.setUp("timerE", [],
            function(space, evaluator) {return this.ceilTime(evaluator.currentTime, this.interval)},
            function(space, time, evaluator) {
                return !this.dormant && this.lastTime + (space.frpGet(this.interval)) <= time},
            false);
        this.interval = interval;
        return this;
    },

    durationE: function(interval, duration) {
        this.setUp("durationE", [],
            function(space, evaluator) {
                var dur = space.frpGet(this.duration);
                if (this.start === null) {
                    this.start = this.ceilTime(evaluator.currentTime, this.interval);
                }
                var val = this.ceilTime(evaluator.currentTime, this.interval) - this.start;
                if (val >= dur) {
                    this.done = true;
                    evaluator.removeTimer(this);
                    val = dur;
                }
                return val;
            },
            function(space, time, evaluator) {
                return this.start === null || !this.done ||
                    ((this.lastTime + space.frpGet(this.interval) <= time) &&
                        (this.start + space.frpGet(this.duration) >= time));
            },
            false);
        this.interval = interval;
        this.duration = duration;
        this.done = false;
        this.start = null;
        return this;
    },
    delayE: function(event, interval) {
        this.setUp("delayE", [event],
            function(space, evaluator) {
                var val = space.frpGet(this.event);
                var lastTime = space.lookup(this.event).lastTime;
                if (lastTime > this.lastTime) {
                    this.pastValues.push({value: val, time: lastTime});
                }
                if (this.pastValues.length === 0) {
                    return undefined;
                }
                var t = evaluator.currentTime - space.frpGet(this.interval);
                while (this.pastValues.length > 1) {
                    if (this.pastValues[1].time > t) {
                        break;
                    }
                    this.pastValues.shift();
                }
                var result = this.pastValues[0].time <= t
                    ? this.pastValues.shift().value
                    : undefined;
                if (this.pastValues.length > 0) {
                    evaluator.addNextDelay(this, this.pastValues[0].time - space.frpGet(this.interval));
                }
                return result;
            },
            function(space, time, evaluator) {
                return this.basicChecker(space, time, evaluator)
                    || (this.pastValues.length > 0
                        && this.pastValues[0].time <= (time - space.frpGet(this.interval)));
            });
        this.event = event;
        this.pastValues = [];
        this.interval = interval;
        return this;
    },

    collectE: function(event, initialValue, func) {
        this.setUp("collectE", [this.ref(event)],
            function(space, evaluator) {
                return (space.frpGet(this.func))
                    (space.frpGet(this.event),
                    (this.currentValue === undefined
                        ? space.frpGet(this.initialValue)
                        : this.currentValue))},
            null,
            false);
        this.initialValue = initialValue;
        this.func = func;
        this.event = this.ref(event);
        return this;
    },

    mergeE: function() {
        var ary = [];
        for (var i = 0; i < arguments.length; i++) {
            ary[i] = arguments[i];
        }
        this.setUp("mergeE", ary,
            function(space, evaluator) {
                return evaluator.arguments[this.id][0];
            },
            this.mergeEChecker);
        return this;
    },
    mapE: function(input, expression) {
        this.expr([input], function(x) {return expression.call(this.owner, x)});
        return this;
    },
    expr: function(arguments, expression, isContinuous, initialValue) {
        this.setUp("exprE", arguments, null, null, isContinuous);
        if (initialValue !== undefined) {
            this.currentValue = this.lastValue = initialValue;
        }
        this.expression = expression;
        return this;
    },
    value: function(initialValue) {
        this.setUp("value", [], null, null);
        this.beContinuous(initialValue);
        return this.finalize([]);
    },
    anyE: function(input, fieldName) {
        this.setUp("anyE", [input],
            function(space, evaluator) {
	            if (this.__found__) {
			        var f = this.__found__;
			        this.__found__ = null;
                    return space.frpGet(f);
	            } else {
                    return undefined;
	            }
            },
            function(space, time, evaluator) {
                var col = space.lookup(this.argCollection);
                var field = space.lookup(this.fieldName);
                for (var i = 0; i < col.length; i++) {
                    var arg = col[i];
                    var s = space.lookup(arg)[field];
                    if (this.isEventStream(s) && this.isEarlierThan(s)) {
                        this.__found__ = s;
                        return true;
                    }
                }
                this.__found__ = null;
                return false;
            })
        this.argCollection = input;
        this.fieldName = fieldName;
        return this;
    },
    sendE: function(input, recipient) {
        this.recipient = recipient;
        this.input = input;
        this.thrower = function(val, space, evaluator) {
            var remote = this.lookup(recipient);
            remote = remote.remoteRef(space, evaluator);
            throw {type: "quitAndSend", target: remote, value: val};
        };
        this.setUp("sendE", [input],
            function(space, evaluator) {
                return this.frpGet(input);
            }
        );
        return this;
    },
    userEvent: function() {
        this.setUp("userEvent", [], null, null, false);
        this.dormant = false;
        return this.finalize([]);
    }
},
'evaluation', {
    addSubExpression: function(id, stream) {
    // Add a sub stream for a complex stream.  A sub stream is an internal stream
    // that represents a sub expression of a stream.  For example, if the stream
    // definition is "a + b * c", "b * c" is a sub-stream, and the top level stream
    // is "+" with "a" and the sub-stream.
        if (!this.subExpressions) {
            this.subExpressions = [];
        }
        this.subExpressions.push(this.ref(id));
        this[id] = stream;
    },

    addDependencies: function(collection) {
    // Make sure that subExpressions field at least has a value.
    // collection is a collection of additional dependencies.
        if (!this.subExpressions) {
            this.subExpressions = [];
        }
        collection.forEach(function(elem) {
            var hasIt = false;
            this.dependencies.forEach(function(e) {
                if (this.isStreamRef(e) && e.ref === elem.ref) {
                    hasIt = true;
                }
            }.bind(this));
            if (!hasIt) {
               this.dependencies.push(elem);
            }
        }.bind(this));
        return this;
    },

    finalize: function(collection, maybe) {
        if (!this.subExpressions || this.subExpressions.length === 0) {
            if (this.type === undefined) {
                if (collection.length === 0) {
                    return maybe;
                }
                return this.expr([collection.pop()], function(n) {return n});
            }
            this.addDependencies(collection);
            return this;
        }
        var top = this[this.subExpressions.pop().ref];
        top.subExpressions = this.subExpressions || [];
        for (var k in this) {
            if (this.hasOwnProperty(k) && k.match('^_t')) {
                if (top !== this[k]) {
                    top[k] = this[k];
                }
            }
        }
        top.addDependencies(collection);
        return top;
    },

    evalSubExpression: function(time, space, evaluator) {
    // Evaluate this as a sub expression.
    // When evaluating a sub expression, there is no need to keep the last value
        var val = this.updater(space, evaluator);
        if (val !== undefined) {
            this.lastValue = this.currentValue = val;
            this.setLastTime(this.type === "timerE" ? val : time);
            return true;
        }
        return false;
    },

    maybeEvalAt: function(time, evaluator) {
    // Evaluate a stream.  First attempt to evaluate the sub expressions in order
    //  and then evaluate the top level stream (this) if necessary.
        var changed = false;
        var val;
        for (var i = 0; i < this.subExpressions.length; i++) {
            var ref = this.subExpressions[i];
            var elem = this[ref.ref] || this.owner[ref.ref];
            if (elem.checker(this, time, evaluator)) {
                changed = elem.evalSubExpression(time, this, evaluator) || changed;
            }
        }
        if (this.checker(this, time, evaluator)) {
            val = this.updater(this, evaluator);
            if (val !== undefined) {
                this.lastValue = this.currentValue;
                this.setLastTime(this.type === "timerE" ? val : time);
                this.currentValue = val;
                changed = true;
            }
        }
        if (time > this.lastCheckTime) {
			this.lastCheckTime = time;
            if (this.lastTime === -1){
                this.lastTime = time;
            }
		}
        if (this.type === "sendE" && val !== undefined) {
            this.thrower(val, this, evaluator);
        }
        return changed;
    },

    basicChecker: function(space, time, evaluator) {
    // The default implementation of checker.  It checks all dependencies of
    // this stream.  If it should be evaluated, it fetches the values to be used.
        var dependencies = evaluator.dependencies[this.id];
        var result = null;
        var args = evaluator.arguments[this.id];
        for (var i = 0; i < dependencies.length; i++) {
            var src = dependencies[i];
            if (this.isEventStream(src)) {
                if (src.currentValue === undefined)
                    result = result === null ? false : result;
                if (this.isEarlierThan(src)) {
                    result = result === null ? true: result;
                }
            }
        }
        if (result) {
            var sources = evaluator.sources[this.id];
            for (i = 0; i < sources.length; i++) {
                args[i] = this.isEventStream(sources[i]) ? sources[i].currentValue : sources[i];
            }
        }
        return result === null ? false : result;
    },

    mergeEChecker: function(space, time, evaluator) {
    // The checker for mergeE().  For mergeE, an undefined in sources is allowed.
        var sources = evaluator.sources[this.id];
        var result = null;
        var args = evaluator.arguments[this.id];
        for (var i = 0; i < sources.length; i++) {
            var src = sources[i];
            if (this.isEventStream(src)
                && (this.isEarlierThan(src) && src.currentValue !== undefined)) {
                    if (result === null) {
                        result = true;
                        args[0] = src.currentValue;
                    }
            }
        }
        return result === null ? false : result;
    },

    basicUpdater: function(space, evaluator) {
    // The updater for the expr type
        return this.expression.apply(space, evaluator.arguments[this.id]);
    },

    remoteRef: function(space, evaluator) {
        var dependencies = evaluator.dependencies[this.id];
        var result = null;
        var args = evaluator.arguments[this.id];
        for (var i = 0; i < dependencies.length; i++) {
            var src = dependencies[i];
            if (this.isEventStream(src)
                && src.currentValue !== undefined) {
                    if (result === null) {
                        result = true;
                        args[0] = src.currentValue;
                    }
            }
        }
        result = result === null ? false : result;
        if (result) {
            var sources = evaluator.sources[this.id];
            for (i = 0; i < sources.length; i++) {
                args[i] = this.isEventStream(sources[i]) ? sources[i].currentValue : sources[i];
            }
            return this.basicUpdater(space, evaluator);
        }
        return null;
    },

    frpSet: function(val, maybeTime) {
        this.currentValue = val;
        this.setLastTime(maybeTime || this.owner.__evaluator.currentTime+1);
        this.owner.__evaluator.changedExternally = true;
        if (maybeTime) {
            this.owner.__evaluator.evaluateAt(maybeTime);
        } else {
            this.owner.__evaluator.evaluate();
        }
        return val;
    },

    frpGet: function(ref) {
    // Fetches the value from ref
        if (this.isStreamRef(ref)) {
            var v = this.lookup(ref);
            var last = ref.last;
            if (last && this.isEventStream(v)) {
                return v.lastValue;
            }
            return v.currentValue;
        }
        return ref;
    },

    getLast: function(name) {
    // Fetches the value from ref and return its last value
        var v =  this[name] || this.owner[name];
        if (this.isEventStream(v)) {
            return v.lastValue;
        }
        return v;
    },

    isEarlierThan: function(other) {
        var otherTime = other.lastTime;
        return otherTime === -1 || otherTime > this.lastCheckTime;
    },
    lookup: function(ref) {
        if (this.isStreamRef(ref)) {
            return this[ref.ref] || this.owner[ref.ref];
        }
        return ref;
    },
    setLastTime: function(aNumber) {
        this.lastTime = aNumber;
        this.lastCheckTime = aNumber;
    },
    ceilTime: function(time, interval) {
        return Math.floor(time / interval) * interval;
    },
    sync: function(maybeTime) {
    // refresh the last value cache at the end of evaluation cycle.
        if (this.lastValue !== this.currentValue && this.currentValue !== undefined) {
            if (this.owner.frpConnections && this.owner.frpConnections[this.streamName]) {
                var connections = this.owner.frpConnections[this.streamName];
                for (var i = 0; i < connections.length; i++) {
                    connections[i].update(this.currentValue, this.owner, maybeTime);
                }
            }
        }
		this.lastValue = this.currentValue;
    },

    isEventStream: function(v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    },

    isStreamRef: function(v) {
        return v instanceof lively.bindings.FRPCore.StreamRef;
    },
    ref: function(name, last) {
        return new lively.bindings.FRPCore.StreamRef(name, last);
    }
});

Object.extend(lively.bindings.FRPCore.EventStream, {
    fromString: function(aString) {
        var tree = OMetaSupport.matchAllWithGrammar(FRPParser, "topLevel", aString);
        var code = FRPTranslator.match(tree, "start");
        var strm = eval(code);
        if (!this.isEventStream(strm)) {
            strm = new lively.bindings.FRPCore.EventStream().value(strm);
        }
        strm.setCode(aString);
        return strm;
    },
    isEventStream: function (v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    }
});

lively.bindings.FRPCore.EventStream.nextId = 0;

Object.subclass('lively.bindings.FRPCore.Evaluator',
'initialization', {
    initialize: function($super) {
        this.reset();
        this.deletedNode = null;
        this.timers = [];
        this.syncWithRealTime = false;
        this.clearTimers();
        return this;
    },
    reset: function() {
        delete this.results;
        this.sources = {};
        this.arguments = {};
        this.dependencies = {};
        this.endNodes = {};
        this.continuity = {};
        this.changedExternally = false;
        return this;
    },
    setSyncWithRealTime: function(aBoolean) {
        this.syncWithRealTime = aBoolean;
        if (aBoolean) {
            this.currentTime = this.object.__startTime;
        }
    },
    onstore: function() {
        this.reset();
    },
    installTo: function(object) {
        object.__startTime = Date.now();
        object.__evaluator = this;
        this.object = object;
        return this;
    },
    setUpMorphicEvent: function(fName, original) {
        var mName = "on" + fName.capitalize();
        var str =
"       function X(evt) {\n" +
"           if (this.__evaluator && this.Y\n" +
"               && this.Y instanceof lively.bindings.FRPCore.EventStream\n" +
"                   && !this.Y.dormant) {\n" +
"                   this.Y.frpSet(evt);\n" +
"                   return true;\n" +
"           }\n" +
"           return false;\n" +
"       }";
        str = str.replace(/X/g, mName);
        str = str.replace(/Y/g, fName);
        var func = Function.fromString(str);
        this.object[mName] = func;
        if (!original) {
            var strm = new lively.bindings.FRPCore.EventStream().userEvent();
            strm.installTo(this.object, fName);
        }
    },
    setUpMorphicEvents: function() {
        this.setUpMorphicEvent("mouseDown");
        this.setUpMorphicEvent("mouseMove");
        this.setUpMorphicEvent("mouseUp");
    }
},
'evaluation', {
    addDependencies: function(elem, top) {
        var srcs = this.sources[elem.id] = [];
        var deps = this.dependencies[elem.id] = [];
        elem.visited = false;
        for (var i = 0; i < elem.dependencies.length; i++) {
            var depRef = elem.dependencies[i];
            var dep = top.lookup(depRef);
            if (this.isEventStream(dep) && !depRef.isSubExpression) {
                deps.push(dep);
                this.endNodes[dep.id] = this.deletedNode;
            }
        }
        this.arguments[elem.id] = new Array(elem.sources.length);
        for (i = 0; i < elem.sources.length; i++) {
            var ref = elem.sources[i];
            var src = top.lookup(ref);
            srcs.push(src);
        }
    },
    addStreamsFrom: function(object) {
    // An entry point to gather all streams in object.  For each top-level
    // stream, its sub expressions are visited.
        for (var k in object) {
            var v = object[k];
            if (this.isEventStream(v) && !this.sources[v.id]) {
                if (this.endNodes[v.id] !== this.deletedNode) {
                    this.endNodes[v.id] = v;
                }
                this.addDependencies(v, v);
                for (i = 0; i < v.subExpressions.length; i++) {
                    var s = v.lookup(v.subExpressions[i]);
                    this.addDependencies(s, v);
                }
            }
        }
    },
    isEventStream: function(v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    },
    visit: function(elem, col) {
    // Starting from the "endNodes", recursively visit their sources.  col is used to detect circular dependency.
        if (col.indexOf(elem) >= 0 && !elem.visited) {
            this.results.push(elem);
            return;
        }
        if (!elem.visited) {
            elem.visited = true;
            col.push(elem);
            for (var i = 0; i < this.dependencies[elem.id].length; i++) {
                var srcElem = this.dependencies[elem.id][i];
                this.visit(srcElem, col);
            }
            col.pop();
            this.results.push(elem);
        }
    },
    detectContinuityFor: function(v) {
        if (v.isContinuous === true || v.isContinuous === false) {
            this.continuity[v.id] = v.isContinuous;
            return false;
        }
        var srcs = this.sources[v.id];
        var maybeContinous = true;
        for (var i = 0; i < srcs.length; i++) {
            var s = srcs[i];
            if (this.isEventStream(s) && this.continuity[s.id] === false) {
                this.continuity[v.id] = false;
                return false;
            }
        }
        return true;
    },
    detectContinuity: function() {
    // Compute the continuousness of unknown stream.
    // Assumes that the results field holds onto the properly sorted streams
        var foundNewContnuous = false;
        for (var i = 0; i < this.results.length; i++) {
            var v = this.results[i];
            for (var j = 0; j < v.subExpressions.length; j++) {
                var ref = v.subExpressions[j];
                if (ref.isSubExpression) {
                    var s = v.lookup(ref);
                    foundNewContnuous = this.detectContinuityFor(s) || foundNewContnuous;
                }
            }
            foundNewContnuous = this.detectContinuityFor(v) || foundNewContnuous; 
        }
        return foundNewContnuous;
    },
    sort: function() {
        var results = this.results = [];
        for (var k in this.endNodes) {
            var e = this.endNodes[k];
            if (e !== this.deletedNode) {
                this.visit(e, []);
            }
        }
        return results;
    },
    sortAndMaybeEvaluate: function() {
        var now = Date.now();
        if (!this.results) {
            this.addStreamsFrom(this.object);
            this.sort();
        }
        if (this.detectContinuity()) {
            return this.evaluateAt(now - this.object.__startTime);
        }
    },
    evaluate: function() {
        var now = Date.now();
        return this.evaluateAt(now - this.object.__startTime);
    },
    evaluateAt: function(time) {
        if (!this.results) {
            this.addStreamsFrom(this.object);
            this.sort();
            this.detectContinuity();
        }
        this.changed = this.changedExternally;
        var sent = this.frpSent;
        this.frpSent = false;
        this.currentTime = time;
        var i;
        try {
            for (i = 0; i < this.results.length; i++) {
                this.changed = this.results[i].maybeEvalAt(time, this) || this.changed;
            }
        } catch (e) {
            if (e.type === "quitAndSend") {
                e.evaluator = this;
                if (this.syncWithRealTime) {
                    setTimeout(this.realSend.curry(e), 0);
                } else {
                    this.realSend(e);
                }
                this.changedExternally = false;
                return this.changed;
            }
            if (e.type === "reevaluate") {
                setTimeout(this.reevaluate.bind(this), 0);
                this.changedExternally = false;
                return this.changed;
            } else {
                this.changedExternally = false;
                throw e;
            }
        }
        if (this.changed) {
            this.syncAll(sent);
        }
        this.changedExternally = false;
        return this.changed;
    },
    syncAll: function(sent) {
        if (!this.results) {
            this.addStreamsFrom(this.object);
            this.sort();
            this.detectContinuity();
        }
        for (var i = 0; i < this.results.length; i++) {
            this.results[i].sync(sent ? this.currentTime : undefined);
        }
    },
    reevaluate: function() {
        this.evaluateAt(this.currentTime);
    },
    realSend: function(parameter) {
        parameter.target.owner.__evaluator.frpSent = true;
        parameter.target.frpSet(parameter.value, parameter.evaluator.currentTime);
    },
    installStream: function(strm) {
    // For a timer, it starts the timer.
    // The evaluator is reset as the network may change.
        if (strm.type === "timerE" || strm.type === "durationE") {
            this.addTimer(strm);
        }
        if (strm.type === "delayE") {
            this.addDelay(strm);
        }
        if (strm.type === "userEvent") {
            this.setUpMorphicEvent(strm.streamName, strm);
        }
        this.reset();
    },

    uninstallStream: function(strm) {
        if (strm.type === "timerE" || strm.type === "durationE") {
            this.removeTimer(strm);
        }
        this.reset();
   },
},
'timers', {
    addTimer: function(timer) {
        if (this.syncWithRealTime) {
            this.timers.push(timer);
            this.constructor.allTimers.push(timer);
            timer.timerId = setInterval(function() {this.evaluate();}.bind(this), timer.interval);
        }
    },
    addDelay: function(timer) {
        if (this.syncWithRealTime) {
            this.timers.push(timer);
            this.constructor.allTimers.push(timer);
        }
    },
    addNextDelay: function(timer, schedule) {
        timer.timerId = setTimeout(function() {this.evaluate();}.bind(this), this.currentTime - schedule);
    },
    removeTimer: function(strm) {
        window.clearInterval(strm.timerId);
        this.timers.remove(strm);
        this.constructor.allTimers.remove(strm);
    },

    clearTimers: function() {
        if (this.timers) {
            this.timers.forEach(function(strm) {
                window.clearInterval(strm.timerId);
                this.constructor.allTimers.remove(strm);
            }.bind(this));
        }
        this.timers = [];
    },
    clearAllTimers: function() {
        for (var i = 1; i < 99999; i++) {
            window.clearInterval(i);
        }
    }
});

lively.bindings.FRPCore.Evaluator.allTimers = [];

}); // end of module
