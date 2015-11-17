/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
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

module('lively.TestFramework').requires('lively.bindings', 'lively.Helper').toRun(function() {

Object.subclass('TestCase',
'settings', {
    isTestCase: true,
    shouldRun: true,
    verbose: Functions.True
},
'initializing', {
    initialize: function(testResult, optTestSelector) {
        this.result = testResult || new TestResult();
        this.currentSelector = optTestSelector;
        this.statusUpdateFunc = null;
    },
    createTests: function(selectors) {
        selectors = selectors || this.allTestSelectors();
        return selectors.collect(function(sel) {
            return new this.constructor(this.result, sel); }, this);
    }
},
'accessing', {
    name: function() { return this.constructor.type },
    getTestName: function() {
        // renamed from testName. not called. remove?
        return this.name() + '>>' + this.currentSelector;
    },
    id: function() { return this.name() + '>>' + this.currentSelector },
    allTestSelectors: function() {
        return this.constructor.functionNames().select(
            this.getTestSelectorFilter());
    },

    getTestSelectorFilter: function() {
        if (this._selectorFilterFunc) return this._selectorFilterFunc;
        var self = this;
        function isMyOwn(sel) {
            return self.constructor.prototype.hasOwnProperty(sel)
                && sel.startsWith('test');
        }
        var filter = this.testSelectorFilter, filterFunc;
        if (Object.isString(filter)) {
            filterFunc = function(sel) { return sel.include(filter); }
        } else if (filter && filter.test && Object.isFunction(filter.test)) {
            filterFunc = function(sel) { return filter.test(sel); };
        } else if (Object.isFunction(filter)) { // important that this is last
            filterFunc = filter;
        }
        return this._selectorFilterFunc = function(sel) {
            return isMyOwn(sel) && (filterFunc ? filterFunc(sel) : true);
        };
    },

    setTestSelectorFilter: function(filter) {
        this.testSelectorFilter = filter;
        return this;
    },

    toString: function() {
        return "a" + this.constructor.name +"" + "(" + this.timeToRun +")"
    }
},
'running', {
    runAll: function(statusUpdateFunc, tests) {
        tests = tests || this.createTests();
        var time = Functions.timeToRun(function() {
            tests.forEach(function(test) {
                test.statusUpdateFunc = statusUpdateFunc;
                test.runTest();
            });
        });
        this.result.setTimeToRun(this.name(), time);
        return this.result;
    },
    runAllThenDo: function(statusUpdateFunc, whenDoneFunc, tests) {
        this.runAll(statusUpdateFunc, tests);
        whenDoneFunc();
    },
    setUp: function() {},
    tearDown: function() {},
    onTearDown: function(func) {
        (this._onTearDownCallbacks || (this._onTearDownCallbacks = [])).push(func);
    },
    runOnTearDownCallbacks: function() {
        if (!this._onTearDownCallbacks) return [];
        var errors = [], cb;
        while ((cb = this._onTearDownCallbacks.shift()))
            try { cb.call(this); } catch(e) { errors.push(e); }
        return errors;
    },
    runTest: function(aSelector) {
        if (!this.shouldRun) return null;
        this.currentSelector = aSelector || this.currentSelector;

        this.running();
        try {
            this.setUp();
            this[this.currentSelector]();
            this.addAndSignalSuccess();
        } catch (e) {
            this.addAndSignalFailure(e);
         } finally {
            var tearDownErrors = [];
            try { this.uninstallMocks(); } catch (e) { tearDownErrors.push(e); }
            try { this.tearDown(); } catch (e) { tearDownErrors.push(e); }
            tearDownErrors.pushAll(this.runOnTearDownCallbacks());
            if (tearDownErrors.length) {
                this.log('Errors in tearDown of ' + this.id() + ':\n' + tearDownErrors.join('\n'));
            }
        }
        return this.result;
    },
    debugTest: function(selector) {
        // FIXME
            lively.lang.Execution.installStackTracers();
        this.runTest(selector);
            lively.lang.Execution.installStackTracers("uninstall");
        return this.result.failed.last();
    }
},
'running (private)', {
    show: function(string) { this.log(string) },
    running: function() {
        if (Config.serverInvokedTest)
          URL.nodejsBase.withFilename("NodeJSEvalServer/").asWebResource().post("console.log('Test: " + this.id() + "');").content
        this.show('Running ' + this.id());
        this.statusUpdateFunc && this.statusUpdateFunc(this, 'running');
    },
    success: function() {
        this.show(this.id()+ ' done', 'color: green;');
        this.statusUpdateFunc && this.statusUpdateFunc(this, 'success');
    },
    failure: function(error) {
        this._errorOccured = true;
        var message = error.toString();
        var file = error.sourceURL || error.fileName;
        var line = error.line || error.lineNumber;
        message += ' (' + file + ':' + line + ')';
        message += ' in ' + this.id();
        this.show(message , 'color: red;');
        this.statusUpdateFunc && this.statusUpdateFunc(this, 'failure', message, error);
    },
    addAndSignalSuccess: function() {
        this.result.addSuccess(this.constructor.type, this.currentSelector);
        this.success();
    },
    addAndSignalFailure: function(e) {
        this.result.addFailure(this.constructor.type, this.currentSelector, e);
        this.failure(e);
    }

},

'assertion', {
    assert: function(bool, msg) {
        if (bool) return;
        msg = " assert failed " + msg ? '(' + msg + ')' : '';
        this.show(this.id() + msg);
        throw {isAssertion: true, message: msg, toString: function() { return msg }}
    },
    assertEquals: function(a, b, msg) {
        if (Object.isNumber(a) && Object.isNumber(b) && a == b) return;

        if (Object.isArray(a) && Object.isArray(b) && a.equals(b)) return;

        if (a instanceof lively.Point && b instanceof lively.Point && a.equals(b)) return;

        if (a instanceof Rectangle && b instanceof Rectangle && a.equals(b)) return;

        if (a instanceof Color && b instanceof Color && a.equals(b)) return;

        if (a instanceof lively.Line && b instanceof lively.Line && a.equals(b)) return;

        if (Global.URL && a instanceof URL && b instanceof URL && a.eq(b)) return;

        if (a instanceof Date & b instanceof Date && a.equals(b)) return;

        if (a == b) return;

        var remainder = ' (' + a +' != ' + b +')';
        if (typeof a === 'string' || typeof b === 'string')
            remainder += '\n<diff>\n' + Strings.diff(String(a), String(b)) + '\n</diff>\n';

        this.assert(false, (msg || '') + remainder);
    },
    assertEqualsEpsilon: function(a, b, msg) {
        var eps = this.epsilon || 0;

        if (Object.isNumber(a) && Object.isNumber(b) && Math.abs(a-b) <= eps) return;

        if (a instanceof lively.Point && b instanceof lively.Point &&
            Math.abs(a.x-b.x) <= eps && Math.abs(a.y-b.y) <= eps) return;

        if (a instanceof Rectangle && b instanceof Rectangle &&
            Math.abs(a.x-b.x) <= eps && Math.abs(a.y-b.y) <= eps &&
            Math.abs(a.width-b.width) <= eps && Math.abs(a.height-b.height) <= eps) return;

        if (a instanceof Color && b instanceof Color && a.equals(b)) return;

        if (Global.URL && a instanceof URL && b instanceof URL && a.eq(b)) return;

        if (a instanceof Date && b instanceof Date &&
            Math.abs(a.getTime() - b.getTime()) <= eps) return;

        if (a == b) return;

        this.assert(false, (msg ? msg : '') + ' (' + a +' != ' + b +')');
    },
    assertIdentity: function(firstValue, secondValue, msg){
        if(firstValue === secondValue) return
        this.assert(false, (msg ? msg : '') + ' (' + firstValue +' !== ' + secondValue +')');
    },
    assertEqualOwnState: function(leftObj, rightObj, msg) {
        return this.assertEqualState(leftObj, rightObj, msg, true);
    },
    assertEqualState: function(leftObj, rightObj, msg, noProtoLookup) {
        // have leftObj and rightObj equal properties?
        Objects.inspect(leftObj, {maxDepth: 1})
        msg = msg || Strings.format("%s != %s because ", leftObj, rightObj);
        this.assertEquals(typeof leftObj, typeof rightObj, msg + ' object types differ');
        if (leftObj == rightObj) return;
        if ((leftObj !== leftObj) && (rightObj !== rightObj)) return; // both are NaN
        switch (leftObj.constructor) {
            case String:
            case Boolean:
            case Boolean:
            case Date: {
                this.assertEquals(leftObj, rightObj, msg);
                return;
            }
            case Number: {
                this.assertEquals(leftObj, rightObj, msg);
                return;
            }
            case Array: {
                this.assertEquals(leftObj.length, rightObj.length, msg +
                                  Strings.format(' (length %s!=%s\n%s vs. %s)',
                                      leftObj.length, rightObj.length,
                                      Objects.inspect(leftObj, {maxDepth: 1}),
                                      Objects.inspect(rightObj, {maxDepth: 1})));
                for (var i = 0; i < leftObj.length; i++) {
                    this.assertEqualState(leftObj[i], rightObj[i],
                                          msg + " [" + i + "]", noProtoLookup);
                }
                return;
            }
        };
        if (leftObj.isEqualNode) {
            this.assert(leftObj.isEqualNode(rightObj), msg);
            return;
        };
        var rightKeys = [];
        for (var key in rightObj) {
            if (noProtoLookup && !rightObj.hasOwnProperty(key)) continue;
            if (rightObj[key] instanceof Function) continue;
            rightKeys.push(key);
        }
        for (var key in leftObj) {
            if (noProtoLookup && !leftObj.hasOwnProperty(key)) continue;
            if (leftObj[key] instanceof Function) continue;
            this.assertEquals(leftObj.hasOwnProperty(key),
                              rightObj.hasOwnProperty(key), msg + " [" + key + "] ");
            this.assertEqualState(leftObj[key], rightObj[key], msg + " [" + key + "] ");
            rightKeys.remove(key);
        }
        this.assertEquals(0, rightKeys.length, msg + " no " + rightKeys[0] + " in " + rightObj);
    },
    assertMatches: function(expectedSpec, obj, msg) {
        // are all properties in expectedSpec also in and equal in obj?
        if (expectedSpec === obj) return;
        this.assert(obj && Object.isObject(obj), String(obj) + " was expected to be an object");
        for (var name in expectedSpec) {
            var expected = expectedSpec[name], actual = obj[name];
            if (expected === undefined || expected === null) {
              this.assertEquals(expected, actual, name + ' was expected to be ' + expected + (msg ? ' -- ' + msg : ''));
              continue;
            }

            if (expected.constructor === Function) continue;

            switch (expected.constructor) {
              case String:
              case Boolean:
              case Number: {
                this.assertEquals(expected, actual, name + ' was expected to be ' + expected + (msg ? ' -- ' + msg : ''));
                continue;
              }
            };
            this.assert(actual && Object.isObject(actual),
                        name + ' was expected to be ' + expected +
                        ' but is ' + String(actual) + (msg ? ' -- ' + msg : ''));
            this.assertMatches(expected, actual, msg);
        }
    },
    assertRaises: function(/*func, optMatcher, msg*/) {
        var args = Array.from(arguments),
            func = args[0],
            matcherRegexp = Object.isRegExp(args[1]) && args[1],
            matcherFunc = (matcherRegexp && function(e) { return matcherRegexp.test(String(e)); })
                       || (Object.isFunction(args[1]) && args[1]),
            msg = matcherFunc || matcherRegexp ? args[2] : args[1];
        try {
            func();
        } catch(e) {
            if (matcherFunc) {
                this.assert(matcherFunc(e), 'exception ' + e + ' raised but did no match '
                                          + matcherFunc);
            }
            return;
        }
        this.assert(false, "No assertion raised. " + msg);
    }
},
'logging', {
    log: function(aString) {
        if (this.verbose()) console.log(aString);
    }
},
'world test support', {
    answerPromptsDuring: function(func, questionsAndAnswers) {
        // cs: this should be moved to lively.morphic.tests TestCase
        // for providing sunchronous answers when world.prompt is used
        var oldPrompt = lively.morphic.World.prototype.prompt;
        lively.morphic.World.prototype.prompt = function(msg, cb, defaultInput) {
            for (var i = 0; i < questionsAndAnswers.length; i++) {
                var spec = questionsAndAnswers[i];
                if (new RegExp(spec.question).test(msg)) {
                    console.log('Answering ' + msg + ' with ' + spec.answer);
                    cb && cb(spec.answer);
                    return
                }
            }
            if (defaultInput) {
                console.log('Answering ' + msg + ' with ' + defaultInput);
                cb && cb(defaultInput);
                return;
            }
            console.log('Could not answer ' + msg);
        }

        try {
            func();
        } finally {
            lively.morphic.World.prototype.prompt = oldPrompt;
        }
    }
},
'event test support', {
    // event simulation methods
    createMouseEvent: function(type, pos, button) {
        // cs: this should be moved to lively.morphic.tests.TestCase
        // event.initMouseEvent(type, canBubble, cancelable, view,
        // detail, screenX, screenY, clientX, clientY,
        // ctrlKey, altKey, shiftKey, metaKey,
        // button, relatedTarget);

        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            0, 0, //pos.x, pos.y+100,
            pos.x - Global.scrollX, pos.y - Global.scrollY,
            false, false, false, false,
            button || 0/*left*/, null);
        return simulatedEvent;
    },
    doMouseEvent: function(spec) {
        // cs: this should be moved to lively.morphic.tests.TestCase
        // type one of click, Global.Event.INPUT_TYPE_DOWN, Global.Event.INPUT_TYPE_UP, Global.Event.INPUT_TYPE_UP, Global.Event.INPUT_TYPE_MOVE, Global.Event.INPUT_TYPE_OUT.
        if (!spec.type) spec.type = 'Global.Event.INPUT_TYPE_DOWN';
        if (!spec.pos) spec.pos = pt(0,0);
        if (!spec.button) spec.button = 0;
        var targetMorphOrNode = spec.target;

        var evt = this.createMouseEvent(spec.type, spec.pos, spec.button);
        if (targetMorphOrNode.isMorph) {
            targetMorphOrNode = targetMorphOrNode.renderContext().morphNode;
        }
        targetMorphOrNode.dispatchEvent(evt);
    },
    createKeyboardEvent: function(spec) {
        // cs: this should be moved to lively.morphic.tests.TestCase
        // FIXME depends on jQuery
        return lively.morphic.EventHandler.prototype.patchEvent(
            lively.$.Event(spec.type, {keyCode: spec.charCode, ctrlKey: spec.ctrl}));
    },
    doKeyboardEvent: function(spec, morph) {
        // cs: this should be moved to lively.morphic.tests.TestCase
        spec.targetMorph = morph || spec.targetMorph;
        return lively.morphic.EventSimulator.doKeyboardEvent(spec);
    }
},
'scripting', {
    addScript: function (funcOrString, optName) {
        var func = Function.fromString(funcOrString);
        return func.asScriptOf(this, optName);
    }
},
'spies', {
    mock: function(obj, selector, spyFunc) {
        // DEPERECATED, use #spy
        return this.spy(obj, selector, spyFunc);
    },
    spy: function(obj, selector, spyFunc) {
        spyFunc = spyFunc || Functions.Null;
        var orig = obj[selector],
            own = obj.hasOwnProperty(selector),
            spy = {
                install: function() { obj[selector] = spyFunc; return this },
                uninstall: function() {
                    if (own) obj[selector] = orig;
                    else delete obj[selector];
                    return this;
                },
                callsThrough: function() {
                    obj[selector] = function() {
                        spyFunc.apply(this, arguments);
                        return orig.apply(this, arguments);
                    };
                    return this;
                }
            };
        this.spies = this.spies || [];
        this.spies.push(spy);
        return spy.install();
    },

    mockClass: function(klass, selector, mockFunc) {
        // DEPERECATED, use #spyInClass
        return this.spyInClass(klass, selector, mockFunc);
    },

    spyInClass: function(klass, selector, mockFunc) {
        return this.spy(klass.prototype, selector, mockFunc);
    },

    uninstallMocks: function() {
        // DEPERECATED, use #uninstallSpies
        return this.uninstallSpies();
    },

    uninstallSpies: function() {
        if (!this.spies) return;
        this.spies.invoke('uninstall');
    }
});

Function.addMethods(
'test support', {
    isRunnableTestCaseClass: function() {
        return this.isSubclassOf(TestCase)
            && !this.isAbstractTestClass
            && this.prototype.shouldRun;
    }
});

TestCase.subclass('AsyncTestCase',
'intializing', {
    initialize: function($super, testResult, testSelector) {
        $super(testResult, testSelector);
        this._maxWaitDelay = 1000; // ms
        this._done = false;
    }
},
'accessing', {
    name: function($super) { return $super() + ' (async)'; },
    setMaxWaitDelay: function(ms) { this._maxWaitDelay = ms },
    show: function(string) { console.log(string) },
    done: function() { this._done = true; },
    isDone: function() { return this._done }
},
'runnning', {
    delay: function(func, ms) {
        var self = this;
        console.log('Scheduled action for ' + self.currentSelector);
        setTimeout(function() {
            console.log('running delayed action for ' + self.currentSelector);
            try { func.call(self) } catch(e) { self.done(); self.addAndSignalFailure(e) }
        }, ms);
    },
    waitFor: function(guardFunc, interval, callback) {
        var self = this;
        console.log('Scheduled wait for ' + self.currentSelector);
        var i = setInterval(function() {
            try {
                if (guardFunc.call(self)) {
                    clearInterval(i);
                    callback.call(self);
                } else if (self.isDone())
                    clearInterval(i);
            } catch(e) {
                clearInterval(i);
                self.done();
                self.addAndSignalFailure(e);
            }
        }, interval);
    },
    runTest: function(aSelector) {
        if (!this.shouldRun) return;
        function detectAsyncSetUp(test) {
            // FIXME! setUp should be async by default!!!
            var args = test.setUp && test.setUp.argumentNames();
            return args && args.length && args.last() !== '$super';
        }
        this.asyncSetUp = detectAsyncSetUp(this);
        this.currentSelector = aSelector || this.currentSelector;
        this.running();
        var runTest = function(test, selector) {
            try { test[selector](); } catch (e) { test.addAndSignalFailure(e); return; }
        }.curry(this, this.currentSelector);
        var runSetUp = function(test) {
            try {
                test.setUp(test.asyncSetUp ? runTest : undefined);
                if (!test.asyncSetUp) runTest();
            } catch (e) { test.addAndSignalFailure(e); return; }
        }
        runSetUp(this);
    },

    runAll: function(statusUpdateFunc, whenDoneFunc, tests) {
        tests = tests || this.createTests();
        var self = this, duration = 0, startTime;

        function recordTime(thenDo) { duration += Date.now() - startTime; thenDo() }

        tests.forEach(function(test) {
            test.statusUpdateFunc = statusUpdateFunc;
            test.scheduled();
        });

        tests.doAndContinue(
            function(next, test) { startTime = Date.now();
                                   test.runAndDoWhenDone(recordTime.curry(next)) },
            function() { self.result.setTimeToRun(self.name(), duration);
                         whenDoneFunc && whenDoneFunc();
                         console.log('All tests of %s done', self.name()) },
            this);

        return tests;
    },
    runAllThenDo: function(statusUpdateFunc, whenDoneFunc, tests) {
        this.runAll(statusUpdateFunc, whenDoneFunc, tests);
    },
    runAndDoWhenDone: function(/*optTestSelector, whenDoneFunc*/) {
        var args            = Array.from(arguments),
            optTestSelector = (Object.isString(args[0]) && args[0]),
            sel             = optTestSelector || this.currentSelector,
            whenDoneFunc    = optTestSelector ? args[1] : args[0];
        this.runTest(optTestSelector);
        var self = this, waitMs = 100; // time for checking if test is done
        (function doWhenDone(timeWaited) {
            if (timeWaited >= self._maxWaitDelay) {
                if (!self._errorOccured) {
                    var msg = 'Asynchronous test #' + sel
                            + ' was not done after ' + timeWaited + 'ms';
                    self.addAndSignalFailure({message: msg, toString: function() { return msg }});
                }
                self.done();
            }
            if (!self.isDone()) {
                doWhenDone.curry(timeWaited + waitMs).delay(waitMs / 1000);
                return;
            }
            var tearDownErrors = [];
            try { self.uninstallMocks(); } catch (e) { tearDownErrors.push(e); }
            try { self.tearDown(); } catch (e) { tearDownErrors.push(e); }
            tearDownErrors.pushAll(self.runOnTearDownCallbacks());
            tearDownErrors.forEach(function(err) { self.addAndSignalFailure(err); })
            if (!self._errorOccured) self.addAndSignalSuccess();
            whenDoneFunc && whenDoneFunc();
        })(0);
    },
    scheduled: function() { this.show('Scheduled ' + this.id()) },
    success: function($super) {
        this.isDone() ? $super() : this.running();
    }
});

Object.extend(AsyncTestCase, {
    isAbstractTestClass: true
});

TestCase.subclass('MorphTestCase', {
    setUp: function() {
        this.morphs = [];
        this.world = lively.morphic.World.current();
    },
    tearDown: function() {
        if (!this._errorOccured)
            this.morphs.each(function(ea) { ea.remove()})
        // let the morphs stay open otherwise
    },
    openMorph: function(m) {
        this.morphs.push(m);
        this.world.addMorph(m)
        return m;
    },
    openMorphAt: function(m, loc) {
        this.morphs.push(m);
        this.world.addMorphAt(m, loc)
        return m;
    }

});

Object.extend(MorphTestCase, {
    isAbstractTestClass: true
});

Object.subclass('TestSuite', {
    initialize: function() {
        this.result = new TestResult();
        this.testsToRun = [];
        this.testCaseClasses = [];
    },
    setTestCases: function(testCaseClasses) {
        this.testCaseClasses = testCaseClasses
    },

    setTestSelectorFilter: function(filter) {
        this.testSelectorFilter = filter;
        return this;
    },

    setTestCaseFilter: function(filter) {
        this.testCaseFilter = filter;
        return this;
    },

    getTestCaseFilter: function() {
        // FIXME duplication with TestCase>>getTestSelectorFilter
        var filter = this.testCaseFilter, filterFunc;
        if (Object.isString(filter)) {
            filterFunc = function(name) { return name.include(filter); }
        } else if (filter && filter.test && Object.isFunction(filter.test)) {
            filterFunc = function(name) { return filter.test(name); };
        } else if (Object.isFunction(filter)) { // important that this is last
            filterFunc = filter;
        }
        return filterFunc;
    },

    setTestFilterSpec: function(spec) {
        if (!spec) return this;
        var parts = spec.split('|');
        this.setTestCaseFilter(new RegExp(parts[0], "i")).
            setTestSelectorFilter(new RegExp(parts[1], "i"));
        return this;
    },

    shouldTestClassRun: function(testClass) {
        var filter = this.getTestCaseFilter();
        return filter ? filter(lively.Class.className(testClass)) : true;
    },

    addTestCases: function(testClasses) {
        this.setTestCases(this.testCaseClasses.concat(testClasses));
    },
    addTestCasesFromModule: function (module) {
        if (!module) throw new Error('testCasesFromModule: Module not defined!');
        var testClasses = module.classes().select(function(ea) { return ea.isRunnableTestCaseClass() });
        this.addTestCases(testClasses);
    },
    loadModulesAndAddTestCases: function (moduleNames) {
        moduleNames.forEach(function(moduleName) {
            var m = module(moduleName);
            m.load(true);
            this.addTestCasesFromModule(m);
        }, this);
        return this;
    },

    runAll: function(statusUpdateFunc) {
        this.testClassesToRun = this.testCaseClasses;
        this.runDelayed(statusUpdateFunc);
    },

    runDelayed: function() {
        var self = this,
            testCaseClass = this.testClassesToRun.shift();

        if (!testCaseClass) {
            this.runFinished && this.runFinished(); return }

        if (!this.shouldTestClassRun(testCaseClass)) {
            this.runDelayed(); return }

        var testCase = new testCaseClass(this.result);
        testCase.setTestSelectorFilter(this.testSelectorFilter);
        this.showProgress && this.showProgress(testCase);

        setTimeout(function() {
            testCase.runAllThenDo(Functions.Null, self.runDelayed.bind(self))
        }, 0);
    }
});

Object.extend(TestSuite, {
    runAllInModule: function(m, optFilterSpec) {
        var suite = this.forTestsInModule(m, optFilterSpec);
        suite.runAll();
        return suite;
    },
    forTestsInModule: function(m, optFilterSpec) {
        var suite = new this();
        suite.setTestFilterSpec(optFilterSpec).addTestCasesFromModule(m);
        return suite;
    },
    forAllAvailableTests: function(optFilterSpec) {
        var classes = Global.classes(true).select(function(ea) {
            return ea.isRunnableTestCaseClass && ea.isRunnableTestCaseClass();
        });
        var suite = new this();
        suite.setTestFilterSpec(optFilterSpec).addTestCases(classes);
        return suite;
    }
});

Object.subclass('TestResult', {
    initialize: function() {
        this.failed = [];
        this.succeeded = [];
        this.timeToRun = {};
    },

    setTimeToRun: function(testCaseName, time) {
        return this.timeToRun[testCaseName] = time
    },

    getTimeToRun: function(testCaseName) {
        return testCaseName ?
            this.timeToRun[testCaseName] :
            Properties.values(this.timeToRun).sum();
    },

    addSuccess: function(className, selector) {
        this.succeeded.push({
                classname: className,
                selector: selector});
    },

    addFailure: function(className, selector, error) {
        this.failed.push({
            classname: className,
            selector: selector,
            err: error,
            toString: function(){ return Strings.format('%s.%s failed: \n\t%s (%s)',
                className, selector, error.stack || String(error), error.constructor? error.constructor.type : '' )
            }
        });
    },

    runs: function() {
        if (!this.failed) return 0;
        return this.failed.length + this.succeeded.length;
    },

    toString: function() {
        return "[TestResult " + this.shortResult() + "]"
    },

    // FIXME remove unless needed
    printResult: function() {
        var string = 'Tests run: ' + this.runs()+ ' -- Tests failed: ' + this.failed.length;
        if (this.failed.length) {
            string += ' -- Failed tests: \n';
            this.failed.each(function(ea) {
                string +=  ea.classname + '.' + ea.selector + '\n   -->'
                    + (ea.err.stack || ea.err.message) +  '\n';
            });
        }
        string += ' -- TestCases timeToRuns: \n';
        var self = this;
        var sortedList = Array.from(Properties.all(this.timeToRun)).sort(function(a,b) {
            return self.getTimeToRun(a) - self.getTimeToRun(b)});
        sortedList.forEach(function(ea) {
           string +=  this.getTimeToRun(ea)  + " " + ea+ "\n"
        }, this);
        string += 'Overall time: ' + (this.getTimeToRun() / 1000) + 's';
        string += this.failed.length == 0 ? '\n[PASSED]' : '\n[FAILED]' ;
        return string;
    },

    failuresToString: function(withError) {
        return this.failed.collect(function(ea) {
            var errString = withError ? "\n\t--> " + (ea.err.stack || ea.err.message || ea.err) : "";
            return Strings.format("%s>>%s%s", ea.classname, ea.selector, errString);
        });
    },

    asJSON: function() {
        var resultData = Properties.all(this.timeToRun);
        var sortedByExecTime = resultData.sortBy(function(result) {
            return this.getTimeToRun(result);
        }, this);
        return {
            runs: this.runs(),
            fails: this.failed.length,
            failedTestNames: this.failuresToString(),
            messages: this.failuresToString(true),
            runtimes: sortedByExecTime.map(function(ea) {
                return {time: this.getTimeToRun(ea), module: ea};
            }, this).concat({time: this.getTimeToRun(), module: 'all'})
        };
    },

    asJSONString: function() {
        return JSON.stringify(this.asJSON());
    },

    shortResult: function() {
        if (!this.failed) return "";
        var time = Object.values(this.timeToRun)
                   .inject(0, function(sum, ea) { return sum + ea }),
            msg = Strings.format('Tests run: %s -- Tests failed: %s -- Time: %ss',
                                 this.runs(), this.failed.length, time/1000);
        return msg;
    },

    getFileNameFromError: function(err) {
        return err.sourceURL ? new URL(err.sourceURL).filename() : "";
    },

    failureList: function() {
        var result = this.failed.collect(function(ea) {
            return Strings.format('%s in %s %s\n\t%s',
                ea.toString(),
                this.getFileNameFromError(ea.err),
                (ea.err.line ? ' ( Line '+ ea.err.line + ')' : ""),
                (ea.err.stack ? ' ( Stack '+ ea.err.stack + ')' : ""))
            }, this);
        return result
    },

    successList: function() {
        return this.succeeded.collect(function(ea) { return ea.classname + '.' + ea.selector });
    }
});

}); // end of module
