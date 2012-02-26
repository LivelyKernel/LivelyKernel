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

module('lively.TestFramework').requires(['lively.bindings']).toRun(function() {

Object.subclass('TestCase',
'settings', {
    isTestCase: true,
    shouldRun: true,
    verbose: Functions.True,
},
'initializing', {
    initialize: function(testResult, optTestSelector) {
        this.result = testResult || new TestResult();
        this.currentSelector = optTestSelector;
        this.statusUpdateFunc = null;
    },
    createTests: function() {
        return this.allTestSelectors().collect(function(sel) {
            return new this.constructor(this.result, sel);
        }, this);
    },
},
'accessing', {
    name: function() { return this.constructor.type },
    testName: function() { return this.name() + '>>' + this.currentSelector },
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
    runAll: function(statusUpdateFunc) {
        var tests = this.createTests(),
            time = Functions.timeToRun(function() {
                tests.forEach(function(test) {
                    test.statusUpdateFunc = statusUpdateFunc;
                    test.runTest();
                })
            })
        this.result.setTimeToRun(this.name(), time);
        return this.result;
    },
    runAllThenDo: function(statusUpdateFunc, whenDoneFunc) {
        this.runAll(statusUpdateFunc);
        whenDoneFunc();
    },
    setUp: function() {},
    tearDown: function() {},
    runTest: function(aSelector) {
        if (!this.shouldRun) return;
        this.currentSelector = aSelector || this.currentSelector;

        this.running();
        try {
            this.setUp();
            this[this.currentSelector]();
            this.addAndSignalSuccess();
        } catch (e) {
            this.addAndSignalFailure(e);
         } finally {
            try {
                this.tearDown();
            } catch(e) {
                this.log('Couldn\'t run tearDown for ' + this.id() + ' ' + e);
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
    },
},
'running (private)', {
    show: function(string) { this.log(string) },
    running: function() {
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
    },

},

'assertion', {
    assert: function(bool, msg) {
        if (bool) return;
        msg = " assert failed " + msg ? '(' + msg + ')' : '';
        this.show(this.id() + msg);
        throw {isAssertion: true, message: msg, toString: function() { return msg }}
    },
    assertEquals: function(a, b, msg) {
        var eps = this.epsilon || 0;

        if (Object.isNumber(a) && Object.isNumber(b) && Math.abs(a-b) <= eps) return;

        if (a instanceof lively.Point && b instanceof lively.Point &&
            Math.abs(a.x-b.x) <= eps && Math.abs(a.y-b.y) <= eps) return;

        if (a instanceof Rectangle && b instanceof Rectangle &&
            Math.abs(a.x-b.x) <= eps && Math.abs(a.y-b.y) <= eps &&
            Math.abs(a.width-b.width) <= eps && Math.abs(a.height-b.height) <= eps) return;

        if (a instanceof Color && b instanceof Color && a.equals(b)) return;

        if (Global.URL && a instanceof URL && b instanceof URL && a.eq(b)) return;

        if (a == b) return;

        this.assert(false, (msg ? msg : '') + ' (' + a +' != ' + b +')');
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

        if (a == b) return;

        this.assert(false, (msg ? msg : '') + ' (' + a +' != ' + b +')');
    },
    assertIdentity: function(firstValue, secondValue, msg){
        if(firstValue === secondValue) return
        this.assert(false, (msg ? msg : '') + ' (' + firstValue +' !== ' + secondValue +')');
    },
    assertEqualState: function(leftObj, rightObj, msg) {
        // have leftObj and rightObj equal properties?
        msg = (msg ? msg : ' ') + leftObj + " != " + rightObj + " because ";
        if (!leftObj && !rightObj) return;
        if (!leftObj || !rightObj) this.assert(false, msg);
        switch (leftObj.constructor) {
            case String:
            case Boolean:
            case Boolean:
            case Number: {
                this.assertEquals(leftObj, rightObj, msg);
                return;
            }
        };
        if (leftObj.isEqualNode) {
            this.assert(leftObj.isEqualNode(rightObj), msg);
            return;
        };
        var cmp = function(left, right) {
            for (var value in left) {
                if (!(left[value] instanceof Function)) {
                    try {
                        this.assertEqualState(left[value], right[value], msg);
                    } catch (e) {
                        throw e;
                    }
                };
            };
        }.bind(this);
        cmp(leftObj, rightObj);
        cmp(rightObj, leftObj);
    },
    assertMatches: function(expectedSpec, obj, msg) {
        // are all properties in expectedSpec also in and equal in obj?
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
            this.assertMatches(expected, actual, msg);
        }
    }
},

'logging', {
    log: function(aString) {
        if (this.verbose())
            console.log(aString);
    },
},
'world test support', {
    answerPromptsDuring: function(func, questionsAndAnswers) {
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
    },
},
'event test support', {
    // event simulation methods
    createMouseEvent: function(type, pos, button) {
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
        // type one of click, mousedown, mouseup, mouseover, mousemove, mouseout.
        if (!spec.type) spec.type = 'mousedown';
        if (!spec.pos) spec.pos = pt(0,0);
        if (!spec.button) spec.button = 0;
        var targetMorphOrNode = spec.target;

        var evt = this.createMouseEvent(spec.type, spec.pos, spec.button);
        if (!Config.isNewMorphic && targetMorphOrNode.isMorph) {
            if (spec.shouldFocus) {
                var hand = targetMorphOrNode.world().firstHand()
                hand.setMouseFocus(targetMorphOrNode);
            }
            targetMorphOrNode.world().rawNode.dispatchEvent(evt);
            return
        }
        if (Config.isNewMorphic && targetMorphOrNode.isMorph) {
                    targetMorphOrNode = targetMorphOrNode.renderContext().morphNode;
                }
        targetMorphOrNode.dispatchEvent(evt)
    },
    createKeyboardEvent: function(spec) {
        // FIXME depends on jQuery
        return lively.morphic.EventHandler.prototype.patchEvent(
            jQuery.Event(spec.type, {keyCode: spec.charCode, ctrlKey: spec.ctrl}));
    },
    doKeyboardEvent: function(spec, morph) {
        spec.targetMorph = morph || spec.targetMorph;
        return lively.morphic.EventSimulator.doKeyboardEvent(spec);
    },
},
'scripting', {
    addScript: function (funcOrString, optName) {
        var func = Function.fromString(funcOrString);
        return func.asScriptOf(this, optName);
    }
});

Function.addMethods(
'test support', {
    isRunnableTestCaseClass: function() { return this.isSubclassOf(TestCase) && this.prototype.shouldRun },
});

TestCase.subclass('AsyncTestCase', {
    initialize: function($super, testResult, testSelector) {
        $super(testResult, testSelector);
        this._maxWaitDelay = 1000; // ms
        this._done = false;
    },
    setMaxWaitDelay: function(ms) { this._maxWaitDelay = ms },
    show: function(string) { console.log(string) },
    done: function() {
        this._done = true;
    },
    isDone: function() { return this._done },
    delay: function(func, ms) {
        var self = this;
        console.log('Scheduled action for ' + self.currentSelector);
        (function() {
            console.log('running delayed action for ' + self.currentSelector);
            try { func.call(self) } catch(e) { self.done(); self.addAndSignalFailure(e) }
        }).delay(ms / 1000)
    },
    runTest: function(aSelector) {
        if (!this.shouldRun) return;
        this.currentSelector = aSelector || this.currentSelector;
        this.running();
        try {
            this.setUp();
            this[this.currentSelector]();
        } catch (e) { this.addAndSignalFailure(e) }
    },
    runAll: function(statusUpdateFunc, whenDoneFunc) {
        var self = this, tests = this.createTests();

        tests.forEach(function(test) {
            test.statusUpdateFunc = statusUpdateFunc;
            test.scheduled();
        });

        tests.doAndContinue(
            function(next, test) { test.runAndDoWhenDone(next) },
            function() { whenDoneFunc && whenDoneFunc();
                         console.log('All tests of ' + self.name() + ' done') },
            this);

        return tests;
    },
    runAllThenDo: function(statusUpdateFunc, whenDoneFunc) {
        this.runAll(statusUpdateFunc, whenDoneFunc);
    },
    runAndDoWhenDone: function(func) {
        this.runTest();
        var self = this, waitMs = 100; // time for checking if test is done
        (function doWhenDone(timeWaited) {
            if (timeWaited >= self._maxWaitDelay) {
                if (!self._errorOccured) {
                    var msg = 'Asynchronous test was not done after ' + timeWaited + 'ms';
                    self.addAndSignalFailure({message: msg, toString: function() { return msg }});
                }
                self.done();
            }
            if (!self.isDone()) {
                doWhenDone.curry(timeWaited + waitMs).delay(waitMs / 1000);
                return;
            }
            try {
                self.tearDown();
            } catch(e) { if (!self._errorOccured) self.addAndSignalFailure(e) }
            if (!self._errorOccured) self.addAndSignalSuccess();
            func();
        })(0);
    },
    scheduled: function() { this.show('Scheduled ' + this.id()) },
    success: function($super) {
        this.isDone() ? $super() : this.running();
    }
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
    },

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
        return filter ? filter(Class.className(testClass)) : true;
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
        var testCaseClass = this.testClassesToRun.shift();

        if (!testCaseClass) {
            this.runFinished && this.runFinished(); return }

        if (!this.shouldTestClassRun(testCaseClass)) {
            this.runDelayed(); return }

        var testCase = new testCaseClass(this.result);
        testCase.setTestSelectorFilter(this.testSelectorFilter);
        this.showProgress && this.showProgress(testCase);

        (function() {
            testCase.runAllThenDo(Functions.Null, this.runDelayed.bind(this))
        }).bind(this).delay(0);
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
        return this.timeToRun[testCaseName]= time
    },

    getTimeToRun: function(testCaseName) {
        return this.timeToRun[testCaseName]
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
                className, selector, error.toString(), error.constructor? error.constructor.type : '' )
            },
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
                    + ea.err.message +  '\n';
            });
        }
        string += ' -- TestCases timeToRuns: \n';
        var self = this;
        var sortedList = $A(Properties.all(this.timeToRun)).sort(function(a,b) {
            return self.getTimeToRun(a) - self.getTimeToRun(b)});
        sortedList.each(function(ea){
           string +=  this.getTimeToRun(ea)  + " " + ea+ "\n"
        }, this);
        string += this.failed.length == 0 ? '\n[PASSED]' : '\n[FAILED]' ;
        return string;
    },

    failuresToString: function(withError) {
        return this.failed.collect(function(ea) {
            return Strings.format("%s>>%s%s", ea.classname, ea.selector,
                                  withError ? '\n\t--> ' + ea.err.message : "");
        });
    },

    asJSONString: function() {
        var resultData = Properties.all(this.timeToRun),
            sortedByExecTime = resultData.sortBy(function(result) {
                return this.getTimeToRun(result);
            }, this),
            jsonData = {
                runs: this.runs(),
                fails: this.failed.length,
                failedTestNames: this.failuresToString(),
                messages: this.failuresToString(true),
                runtimes: sortedByExecTime.map(function(ea) {
                    return {time: this.getTimeToRun(ea), module: ea};
                }, this)
            };
        return JSON.stringify(jsonData);
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
