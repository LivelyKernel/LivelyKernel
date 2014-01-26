module('lively.ast.tests.OldDebuggerTests').requires('lively.ast.Parser', 'lively.ast.StackReification', 'lively.ast.Interpreter', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.AstTests.ExecutionStateReifierTest',
'running', {
    setUp: function($super) {
        this.sut = new lively.ast.StackReification.Rewriter();
    },
},
'helper', {
    funcAst: function(funcSrc) {
        var func = eval('(' + funcSrc + ')');
        return func.ast();
    },
    catsch: function(funcName, idx, optRecv, varNames) {
        varNames = varNames || [];
        var call = Strings.format('var result%s_%s = %s%s();',
            idx, funcName, optRecv ? optRecv + '.' : '', funcName),
            varRecorder = varNames.collect(function(name) { return name + ':' + name }).join(','),
            src = Strings.format('try {\n%s\n} catch(e) {\n' +
                'if (e.isUnwindException) {\n' +
                '    e.lastFrame = e.lastFrame.addCallingFrame({%s}, %s, arguments.callee.livelyClosure.getOriginalFunc())\n' +
                '}\nthrow e\n};', call, varRecorder, idx);
        return src;
    },
},
'testing', {
    /*test01RewriteSimpleFunction: function() {
        var func = function() { return bar() },
            expectedSrc = Strings.format('function(){ %s return result1_bar; }', this.catsch('bar', 1)),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');
        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test02RewriteTwoCalls: function() {
        var func = function() { return this.foo() + bar() },
            expectedSrc = Strings.format('function(){ %s %s return result1_foo + result3_bar; }',
                this.catsch('foo', 1, 'this'), this.catsch('bar', 3, null, ['result1_foo'])),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');
        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test03RewriteCallsInIf: function() {
        if (!Config.suppressRobertsWarnings)
        // FIXME: test03RewriteCallsInIf: lazy evaluation of or expressions and cond exprs'
        var func = function() { if (this.foo() || bar()) { 1 } },
            expectedSrc = Strings.format('function(){ %s %s if (result1_foo || result3_bar) { 1 } }',
                this.catsch('foo', 1, 'this'), this.catsch('bar', 3, null, ['result1_foo'])),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');

        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test04aRewriteCallsInIfBody: function() {
        var func = function() { if (true) { return this.foo() } },
            expectedSrc = Strings.format('function(){ if (true) { %s return result2_foo } }',
                this.catsch('foo', 2, 'this')),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');

        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test04bRewriteCallsInIfBody: function() {
        var func = function() { if (true) foo() },
            expectedSrc = Strings.format('function(){ if (true) { %s result2_foo } }',
                this.catsch('foo', 2)),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');

        this.assertEquals(expectedAST.asJS(), result.asJS());
    },

    test05aFindAllVarsAndArgsInScope: function() {
        var func = function(a) { var b = 2; if (a) { var c = b + 1 }; return bar() },
            expected = ['a', 'b', 'c'],
            result = this.sut.findVarAndArgNamesInScope(func.ast());
        this.assertEqualState(expected, result);
    },
    test05bFindAllVarsAndArgsInScope: function() {
        var func = function() { var a; function foo() { var b = 3 } },
            expected = ['a', 'foo'],
            result = this.sut.findVarAndArgNamesInScope(func.ast());
        this.assertEqualState(expected, result);
    },
    testCaptureSimpleStack: function() {
        var unwindException = null,
            halt = lively.ast.StackReification.halt,
            func = function() { var b = 2; halt() }.stackCaptureMode();
        try { func() } catch(e) { if (e.isUnwindException) { unwindException = e } else { throw e }}
        this.assert(unwindException, 'no unwindException')
        this.assertEquals(2, unwindException.lastFrame.lookup('b'));
    },*/

});

TestCase.subclass('lively.ast.tests.AstTests.ContinuationTest',
'running', {
    shouldRun: false,
    setUp: function($super) {
        this.rewriter = new lively.ast.StackReification.Rewriter();
        Global.currentTest = this;
    },
    tearDown: function($super) {
        $super();
        delete Global.currentTest;
    },

},
'testing', {
    test01RestartSimpleFunction: function() {
        var state = {before: 0, after: 0},
            func = function() {
                state.before++;
                lively.ast.StackReification.halt();
                state.after++;
            }.stackCaptureMode({state: state}),
            continuation = lively.ast.StackReification.run(func);
        this.assertEquals(1, state.before, 'before not run');
        this.assertEquals(0, state.after, 'after run');
        continuation.resume();
        this.assertEquals(1, state.before, 'before run again');
        this.assertEquals(1, state.after, 'after not run');
    },
    test02RestartFunctions: function() {
        var t = Global.currentTest;
        Object.extend(t, {
            a_before: 0, a_after: 0, b_before: 0, b_after: 0,
            b: function(arg) {
                arg++
                Global.currentTest.b_before++;
                halt();
                Global.currentTest.b_after++;
            }.stackCaptureMode(),
            a: function() {
                var x = 3;
                Global.currentTest.a_before++
                Global.currentTest.b(x)
                Global.currentTest.a_after++
            }.stackCaptureMode(),
        })
        var continuation = lively.ast.StackReification.run(t.a);
        this.assertEquals(1, t.a_before, 'a_before not run');
        this.assertEquals(1, t.b_before, 'b_before not run');
        this.assertEquals(0, t.a_after, 'a_after did run');
        this.assertEquals(0, t.b_after, 'b_after did run');
        continuation.resume();
        this.assertEquals(1, t.a_before, 'a_before run again');
        this.assertEquals(1, t.b_before, 'b_before run again');
        this.assertEquals(1, t.a_after, 'a_after not run');
        this.assertEquals(1, t.b_after, 'b_after not run');
    },
    test03ResumedFunctionHasNoNextStatement: function() {
        var func = function() {
                lively.ast.StackReification.halt();
            }.stackCaptureMode(),
            continuation = lively.ast.StackReification.run(func);
        continuation.resume();
    },
});

Object.subclass('lively.ast.tests.AstTests.Examples',
'initialization', {
    initialize: function() {
        this.val = 0;
    },
},
'subjects', {
    nodebugger: function() {
        var i = 23;
        return i;
    },
    factorial: function(n) {
        if (n == 1) {
            return 1;
        } else {
            return n * this.factorial(n - 1);
        }
    },
    miniExample: function() {
        debugger;
    },
    simpleLocalVariable: function() {
        var a = 23;
        debugger;
    },
    simpleArgument: function(a) {
        debugger;
    },
    stopAtFive: function() {
        for (var i = 0; i < 10; i++) {
            if (i == 5) {
                debugger;
            }
        }
    },
    nestedFunction: function() {
        var a = 23;
        var fun = function() {
            var b = 42;
            debugger;
        };
        fun();
    },
    forEach: function() {
        var a = [1,2,3,4,5,6];
        a.forEach(function(i) {
            if (i == 5) {
                debugger;
            }
        });
    },
    method: function() {
        var obj = {
            hello: function() {
                debugger;
            }
        };
        obj.hello();
    },
    withinComputation: function() {
        var i = 1;
        var j = i + 2;
        debugger;
        i += j;
        i += 2;
        return i;
    },
    callAnotherDebugger: function() {
        var i = 23;
        debugger;
        this.simpleArgument(i);
    },
    callNoDebugger: function() {
        var a = 65;
        debugger;
        this.nodebugger();
    },
    returnNoDebugger: function() {
        var j = 23;
        debugger;
        var k = this.nodebugger() + j;
        return k;
    },
    ifthenelse: function(i) {
        debugger;
        if (i == 1) {
            i = 23;
        } else {
            i = 24;
        }
    },
    forloop: function(i) {
        debugger;
        var a = 0;
        for (var i = 0; i < 4; i++) {
            a += i;
        }
        var b = 2;
        return a;
    },
    whileloop: function(i) {
        var a = 4;
        debugger;
        while (a > 1) {
            a--;
        }
        var b = a + 4;
        return b;
    },
    dowhileloop: function() {
        var a = 3;
        debugger;
        do {
            a--;
        } while (a > 0);
        var b = a + 2;
        return b;
    },

    restart: function() {
        var i = 0;
        i++;
        debugger;
        i++;
        return i;
    },
    restartSideEffect: function() {
        var i = this.val + 1;
        debugger;
    }
});

TestCase.subclass('lively.ast.tests.AstTests.ContainsDebuggerTest',
'running', {
    setUp: function($super) {
        $super();
        this.examples = new lively.ast.tests.AstTests.Examples();
    },
},
'testing', {
    testItself: function() {
        var a = 1;
        var b = 2;
        var c = a + b;
        this.assertEquals(3, c);
        this.assert(this.testItself.containsDebugger() == false);
    },
    testMiniExample: function() {
        this.assert(this.examples.miniExample.containsDebugger());
    },
    testSimpleLocalVariable: function() {
        this.assert(this.examples.simpleLocalVariable.containsDebugger());
    },
    testSimpleArgument: function(a) {
        this.assert(this.examples.simpleArgument.containsDebugger());
    },
    testStopAtFive: function() {
        this.assert(this.examples.stopAtFive.containsDebugger());
    },
    testForEach: function() {
        this.assert(this.examples.forEach.containsDebugger());
    },
    testMethod: function() {
        this.assert(this.examples.method.containsDebugger());
    }
});

TestCase.subclass('lively.ast.tests.AstTests.SteppingAstTest',
'running', {
    setUp: function() {}
},
'testing', {
    testSimpleStatements: function() {
        var fun = function() { var a = 1; var b = 2; alert(b); };
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isVarDeclaration);
        node = node.nextStatement();
        this.assert(node.isVarDeclaration);
        node = node.nextStatement();
        this.assert(node.isCall);
    },
    testIf: function() {
        var fun = function() { if (2 == 1+1) alert(3) ; var a = 1};
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isBinaryOp);
        node = node.nextStatement();
        this.assert(node.isCall);
        node = node.nextStatement();
        this.assert(node.isVarDeclaration);
    },
    testIfBlock: function() {
        var fun = function() { if (2 == 1+1) { a(3); a(4) } var a = 1};
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isBinaryOp);
        node = node.nextStatement();
        this.assert(node.isCall);
        node = node.nextStatement();
        this.assert(node.isCall);
        node = node.nextStatement();
        this.assert(node.isVarDeclaration);
    },
    testIfThenElseBlock: function() {
        var fun = function() {if(2>1){a(3);a(4)}else{c=3;c=4}var a=1};
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isBinaryOp, "2>1");
        node = node.nextStatement();
        this.assert(node.isCall, "a(3)");
        node = node.nextStatement();
        this.assert(node.isCall, "a(4)");
        node = node.nextStatement();
        this.assert(node.isVarDeclaration, "var a=1");
        node = ast.nodeForAstIndex(12);
        this.assert(node.isSet, "c=3");
        node = node.nextStatement();
        this.assert(node.isSet, "c=4");
        node = node.nextStatement();
        this.assert(node.isVarDeclaration, "var a=1");
    },
    testForLoop: function() {
        var fun = function() {var a=0;for(var i=1;i<4;i++){a=i}};
        var ast = fun.ast();
        var node = ast.firstStatement(); //var a=0
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //var i=1
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //i<4
        this.assert(node.isBinaryOp);
        node = node.nextStatement(); //a=i
        this.assert(node.isSet);
        node = node.nextStatement(); //i++
        this.assert(node.isPostOp);
        node = node.nextStatement(); //i<4
        this.assert(node.isBinaryOp);
    },
    testWhileLoop: function() {
        var fun = function() {var i=4;while(i>1){i--};var b=2};
        var ast = fun.ast();
        var node = ast.firstStatement(); //var i=4
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //i>1
        this.assert(node.isBinaryOp);
        node = node.nextStatement(); //i--
        this.assert(node.isPostOp);
        node = node.nextStatement(); //i>1
        this.assert(node.isBinaryOp);
    },
    testDoWhileLoop: function() {
        var fun = function() {var a=3;do{a--}while(a>0);var b=2};
        var ast = fun.ast();
        var node = ast.firstStatement(); //var a=3
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //a--
        this.assert(node.isPostOp);
        node = node.nextStatement(); //a>0
        this.assert(node.isBinaryOp);
        node = node.nextStatement(); //a--
        this.assert(node.isPostOp);
    },
    testForLoopIsAfter: function() {
        var fun = function() {var a=0;for(var i=1;i<4;i++){a=i;}var b;return b;};
        var ast = fun.ast();
        var node = ast.firstStatement().nextStatement(); //var i=1
        var set = node._parent._parent.body.children[0];
        var decl = ast.body.children[2].children[0];
        this.assert(decl.isVarDeclaration);
        this.assert(decl.isAfter(set), "declaration should be after set");
    },
    testPostOpStatements: function() {
        var src = "i++;a++";
        var ast = lively.ast.Parser.parse(src, "topLevel");
        this.assert(ast.children[0].isPostOp);
        this.assert(ast.children[0].nextStatement().isPostOp);
        this.assert(ast.children[0].expr.nextStatement().isPostOp);
    }
});

}) // end of module
