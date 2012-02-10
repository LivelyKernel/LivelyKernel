module('cop.Tracing').requires('cop.Layers', 'lively.morphic', 'lively.TestFramework').toRun(function() {

cop.create("cop.Tracing.ObjectTraceLayer");

Object.extend(cop.Tracing.ObjectTraceLayer, {
    ignoreList: ["bounds"],
    stackDepth: 0,
});

Object.subclass('cop.Tracing.ObjectTracer', {
    ignoreList: ["bounds"],
    stackDepth: 0,
    targetLog: undefined,

    initialize: function() {
        this.rootActivations = [];
        this.currentActivation = null;
        this.recordTime = false;
    },



    logEnterMethod: function(obj, methodName, args, config) {
        var self = this;
        cop.withoutLayers([cop.Tracing.ObjectTraceLayer], function() {
            if (self.ignoreList.include(methodName)) return;

            var caller = self.currentActivation,
                activation = new cop.Tracing.MethodActivation(obj, methodName, args, caller, config && config.category);

            if (!caller)
                self.rootActivations.push(activation);
            self.currentActivation = activation;
            if (self.recordTime) activation.start();
        });
    },

    logLeaveMethod: function(obj, methodName, args) {
        var self = this;
        cop.withoutLayers([cop.Tracing.ObjectTraceLayer], function() {
            if (self.ignoreList.include(methodName)) return;
            if (self.recordTime) self.currentActivation.stop();
            self.currentActivation = self.currentActivation.caller;
        });
    },

    show: function(pattern, logger) {
        if (this.rootActivations.length == 0) {
            alert('no methods recorded!')
            return
        }
        logger = logger || $morph('DebugLog');
        logger.maxSafeSize = 80000;
        var str = '';
        pattern = pattern || function(frame, depth) {
            var style = {color: Color.black}
            return style
        };

        this.rootActivations.forEach(function(activation) {
            str += activation.print(pattern);
        })
        logger.setTextString(str)
    },

    explore: function() {
        if (this.rootActivations.length == 0) {
            alert('no methods recorded!')
            return
        }
        var self = this, world = WorldMorph.current();
        require('projects.ObjectExplorer.ObjectExplorerTreeNode').toRun(function() {
            var explorer = new ObjectExplorer({objectToExplore: self.rootActivations[0].forExploring()});
            explorer.openIn(world);
            explorer.panel.owner.align(explorer.panel.owner.bounds().center(), world.visibleBounds().center());
        });
    },
});


Object.extend(cop.Tracing.ObjectTracer, {

    current: function() {
        if (!this.currentTracer) this.reset();
        return this.currentTracer
    },

    reset: function(optTracer) {
        return this.currentTracer = optTracer || new cop.Tracing.ObjectTracer();
    },

    installTraceCodeInClass: function(classObject, category) {
        var ignoreList = [
            'constructor',  
            'activeLayers', 'collectWithLayersIn', 'collectWithoutLayersIn', 
            'dynamicLayers', 'structuralLayers', 'globalLayers', 'setWithLayers', 
            'addWithLayer', 'removeWithLayer', 'setWithoutLayers', 'getWithLayers',
            'getWithoutLayers'],
            funcNames = category ?
                (classObject.categories[category]||[]) : Functions.own(classObject.prototype),
            config = {category: category};
if (classObject == lively.morphic.Morph) debugger
        funcNames
            .select(function(ea){return !ignoreList.include(ea) && Object.isFunction(classObject.prototype[ea])})
            .forEach(function(functionName) {
                var obj = {};
                obj[functionName] = function() {
                        var args = $A(arguments);
                        var tracer = cop.Tracing.ObjectTracer.current();
                        tracer.logEnterMethod(this, functionName, args, config)

                        var result;
                        if (tracer.isExtentingIntoControlFlow)
                            withLayers([cop.Tracing.ObjectTraceLayer], 
                                function() { result =  cop.proceed.apply(this, args)})
                        else
                            result =  cop.proceed.apply(this, args)

                        tracer.logLeaveMethod(this, functionName, result, config)
                        return result
                }.binds({functionName: functionName, config: config});
                cop.Tracing.ObjectTraceLayer.refineClass(classObject, obj)
            });
     },
    installTraceCodeInAllCategoriesOfClass: function(classObj) {
        Properties.own(classObj.categories).forEach(function(eachCategory) {
            cop.Tracing.ObjectTracer.installTraceCodeInClass(classObj, eachCategory);
        });
    },
    instrument: function(classList) {
        classList.forEach(function(klass) {
            // this.installTraceCodeInAllCategoriesOfClass(klass);
                        this.installTraceCodeInClass(klass)
        }, this); 
    },

});

Object.subclass('cop.Tracing.MethodActivation', {

    initialize: function(obj, methodName, args, caller, categoryName) {
        this.obj = obj;
        this.className = obj.constructor ? obj.constructor.name : null;
        this.classType = obj.constructor ? obj.constructor.type : null;
        this.methodName = methodName;
        this.categoryName = categoryName;
        this.args = args;
        this.caller = caller;
        this.callees = [];
        this.startTime = null;
        this.executionTime = null;
        this.comment = null;
        if (caller) caller.addCallee(this);
    },
    addCallee: function(methodActivation) {
        this.callees.push(methodActivation);
    },
    start: function() {
        this.startTime = new Date();
    },
    stop: function() {
        if (!this.startTime) return;
        this.executionTime = new Date() - this.startTime;
    },


    print: function(emphasisFunc, depth) {
        depth = depth || 0;
        var ownStr = this.toString(),
            str = Strings.indent(ownStr, '  ', depth) + '\n'

            // emph = emphasisFunc && emphasisFunc(this, depth);
        // if (emph) txt.emphasize(emph, str.indexOf(ownStr), str.length-1)
        depth++;
        this.callees.forEach(function(ea) { str += ea.print(emphasisFunc, depth) });
        return str;
    },
    toString: function() {
        return Strings.format('%s>>%s(%s)%s %s',
            this.obj.name ? this.obj.name + '(' + this.className + ')' : this.classType,
            this.methodName, this.args.join(','),
            this.executionTime === undefined ? '' : ' ' + ( this.executionTime ? this.executionTime + 'ms' : ""), 
            this.comments ? this.comments.join(', ') : '')
    },
    addComment: function(c) {
        if (!this.comments) this.comments = [];
        this.comments.push(c)
    },

    forExploring: function() {
        var str = this.toString();
        // return [str, this.callees.collect(function(ea) { return ea.forExploring() })]
        return {
            toString: function() { return str },
            callees: this.callees.collect(function(ea) { return ea.forExploring() })
        };
    },

});

TestCase.subclass('cop.Tracing.TracerTest',
'running', {
    setUp: function($super) {
        $super();
    },

    tearDown: function($super) {
        $super();
        this.removeDummyClass();
    },
},
'helper', {
    createTracer: function() {
        this.tracer = new cop.Tracing.ObjectTracer();
        cop.Tracing.ObjectTracer.reset(this.tracer);
        return this.tracer
    },
    createDummyClass: function() {
        return this.dummyClass = Object.subclass('TracerDummyClass', {
            m1: function() {
                console.log('TracerDummyClass>>m1 activated');
            },
            m2: function() {
                console.log('TracerDummyClass>>m2 activated');
                this.m1();
                this.m1();
            },
        });
    },
    removeDummyClass: function() {
        if (!this.dummyClass) return
        this.dummyClass.remove()
        this.dummyClass = null;
    },
    createInstrumentedDummyClass: function() {
        this.createDummyClass();
        this.createTracer();
        this.tracer.constructor.instrument([this.dummyClass]);
        return this.dummyClass
    },
},
'testing', {
    test01SimpleMethodActivation: function() {
        var klass = this.createInstrumentedDummyClass();
        cop.withLayers([cop.Tracing.ObjectTraceLayer], function(){
            new klass().m1()
        });
        this.assert(this.tracer.rootActivations[0], 'no activation recorded');
        var activation = this.tracer.rootActivations[0];
        this.assertEquals('m1', activation.methodName);
        this.assertEquals(klass.type, activation.className);
    },
    test02CallerAndCallee: function() {
        var klass = this.createInstrumentedDummyClass();
        cop.withLayers([cop.Tracing.ObjectTraceLayer], function(){
            new klass().m2() // m2 calls m1 twice
        });
        var root = this.tracer.rootActivations[0],
            callees = root.callees;
        this.assertEquals(2, callees.length, 'no activation recorded');
        this.assertEquals('m1', callees[0].methodName);
        this.assertEquals('m1', callees[1].methodName);
        this.assertIdentity(root, callees[0].caller);
    },

});


}) // end of module