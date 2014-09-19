module('lively.ast.tests.InterpreterTests').requires('lively.ast.AcornInterpreter', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.InterpreterTests.AcornInterpreterTests',
'helper', {

    parse: function(src) {
        return lively.ast.acorn.parse(src);
    },

    interpret: function(node, optMapping) {
        var interpreter = new lively.ast.AcornInterpreter.Interpreter();
        return interpreter.run(node, optMapping);
    },

    interpretWithContext: function(node, ctx, optMapping) {
        var interpreter = new lively.ast.AcornInterpreter.Interpreter();
        return interpreter.runWithContext(node, ctx, optMapping);
    }

},
'testing', {

    test00Program: function() {
        var node = this.parse('');
        this.assertEquals(undefined, this.interpret(node));
    },

    test01Number: function() {
        var node = this.parse('1');
        this.assertEquals(1, this.interpret(node));
    },

    test02aAddNumbers: function() {
        var node = this.parse('1 + 2');
        this.assertEquals(3, this.interpret(node));
    },

    test02bOrBooleans: function() {
        var node = this.parse('false || true');
        this.assertEquals(true, this.interpret(node));
    },

    test03aLookupVar: function() {
        var node = this.parse('a + 1');
        this.assertEquals(2, this.interpret(node, { a: 1 }));
    },

    test03bLookupMember: function() {
        var node = this.parse('a.b + 2');
        this.assertEquals(3, this.interpret(node, { a: { b: 1 } }));
    },

    test04aIfTrue: function() {
        var node = this.parse('if (true) 1; else 2;');
        this.assertEquals(1, this.interpret(node));
    },

    test04bIfFalse: function() {
        var node = this.parse('if (false) 1; else 2;');
        this.assertEquals(2, this.interpret(node));
    },

    test04cIfWithoutElse: function() {
        var node = this.parse('if (false) 1;');
        this.assertEquals(undefined, this.interpret(node));
    },

    test05aFunctionInvocation: function() {
        var node = this.parse('1; (function() { })();');
        this.assertEquals(undefined, this.interpret(node));
    },

    test05bFunctionInvocationWithReturn: function() {
        var node = this.parse('(function() { return 1; })();');
        this.assertEquals(1, this.interpret(node));
    },

    test06aFunctionInvocationWithArgs: function() {
        var node = this.parse('(function(a) { return a + 1; })(2);');
        this.assertEquals(3, this.interpret(node));
    },

    test06bFunctionInvocationWithArgsAndOuterVar: function() {
        var node = this.parse('var a = 1; (function(a) { return a + 1; })(2);');
        this.assertEquals(3, this.interpret(node));
    },

    test07Closure: function() {
        var node = this.parse('var a = 6; (function(b) { return a / b; })(3);');
        this.assertEquals(2, this.interpret(node));
    },

    test08RealClosure: function() {
        var node = this.parse('var foo = function() { var a = 1; return function() { return a; } }; foo()();');
        this.assertEquals(1, this.interpret(node));
    },

    test09aEarlyReturn: function() {
        var node = this.parse('(function() { return 1; 2; })();');
        this.assertEquals(1, this.interpret(node));
    },

    test09bEarlyReturnInFor: function() {
        var node = this.parse('(function() { for (var i = 0; i < 10; i++) if (i == 5) return i; })();');
        this.assertEquals(5, this.interpret(node));
    },

    test09cEarlyReturnInWhile: function() {
        var node = this.parse('(function() { var i = 0; while (i < 10) { i++; if (i==5) return i; } })();');
        this.assertEquals(5, this.interpret(node));
    },

    test09dEarlyReturnInDoWhile: function() {
        var node = this.parse('(function() { var i = 0; do { i++; if (i==5) return i; } while (i < 10); })();');
        this.assertEquals(5, this.interpret(node));
    },

    test09eEarlyReturnInForIn: function() {
        var node = this.parse('(function() { for (var name in { a: 1, b: 2 }) { return name; } })();');
        this.assertEquals('a', this.interpret(node));
    },

    test10Recursion: function() {
        var node = this.parse('function foo(n) { return n == 1 ? 1 : foo(n - 1); } foo(10);');
        this.assertEquals(1, this.interpret(node));
    },

    test11MethodCall: function() {
        var node = this.parse('var obj = { foo: function() { return 3; } }; obj.foo();');
        this.assertEquals(3, this.interpret(node));
    },

    test12aUsingThis: function() {
        var node = this.parse('var obj = { foo: function() { this.x = 3; } }; obj.foo(); obj.x;');
        this.assertEquals(3, this.interpret(node));
    },

    test12bFunctionalThis: function() {
        var node = this.parse('function foo() { return this; } foo();');
        this.assertEquals(Global, this.interpret(node));
    },

    test12cBoundThis: function() {
        var node = this.parse('var obj = { x: 1 }; function foo() { return this.x; } foo.bind(obj)();');
        this.assertEquals(1, this.interpret(node));
    },

    test12dCallThis: function() {
        var node = this.parse('var obj = { x: 1 }; function foo() { return this.x; } foo.call(obj);');
        this.assertEquals(1, this.interpret(node));
    },

    test13aModifyingVar: function() {
        var node = this.parse('var x = 1; x = 3; x;');
        this.assertEquals(3, this.interpret(node));
    },

    test13bModifyingMember: function() {
        var node = this.parse('var x = { y: 1 }; x.y = 3; x.y;');
        this.assertEquals(3, this.interpret(node));
    },

    test13cCreateMember: function() {
        var node = this.parse('var x = {}; x.y = 3; x.y;');
        this.assertEquals(3, this.interpret(node));
    },

    test14NoDynamicScope: function() {
        var node = this.parse('var a = 1; ' +
            'function bar () { return a; } ' +
            'function foo() { var a = 2; return bar(); } ' +
            'foo();');
        this.assertIdentity(1, this.interpret(node));
    },

    test15ForLoop: function() {
        var node = this.parse('var arr = []; for (var i = 0; i < 5; i++) arr[i] = i; arr;');
        this.assertEqualState([0, 1, 2, 3, 4], this.interpret(node));
    },

    test16aWhile: function() {
        var node = this.parse('var i = 0; while (i < 3) i++; i;');
        this.assertEquals(3, this.interpret(node));
    },

    test16bWhileReturnValue: function() {
        // actually a test for pre/post op
        var node = this.parse('var obj = { i: 0 }; while (obj.i < 3) { ++obj.i; }'),
            mapping = { obj: { i: 0 } };
        this.assertEqualState(3, this.interpret(node, mapping));
        this.assertEqualState(3, mapping.obj.i);

        node = this.parse('var obj = { i: 0 }; while (obj.i < 3) { obj.i++; }');
        mapping = { obj: { i: 0 } };
        this.assertEqualState(2, this.interpret(node, mapping));
        this.assertEqualState(3, mapping.obj.i);
    },

    test17DoWhile: function() {
        var node = this.parse('var i = 0; do { ++i; } while (i == 0); i;');
        this.assertEquals(1, this.interpret(node));
    },

    test18aForIn: function() {
        var node = this.parse('var obj = { a: 1, b: 2 }, result; ' +
                'for (result in obj); result;');
        this.assertEqualState('b', this.interpret(node));
    },

    test18bForInWithDeclaration: function() {
        var node = this.parse('var obj = { a: 1, b: 2 }, result; ' +
                'for (var name in obj) result = name; result;');
        this.assertEqualState('b', this.interpret(node));
    },

    test18cForInWithExpression: function() {
        var node = this.parse('var obj = { a: 1, b: 2 }, m = {}, result; ' +
                'for (m.a in obj) result = m; result.a;');
        this.assertEqualState('b', this.interpret(node));
    },

    test19ModifyingSet: function() {
        var node    = this.parse('a += 2;'),
            mapping = { a: 3 };
        this.assertEquals(5, this.interpret(node, mapping));
        this.assertEquals(5, mapping.a);
    },

    test20UnaryOp: function() {
        var node = this.parse('var a = 4; -a');
        this.assertEquals(-4, this.interpret(node));
    },

    test21aBreakInFor: function() {
        var node = this.parse('for (var i = 0; i < 10; i++) { if (i == 2) break; } i;');
        this.assertEquals(2, this.interpret(node));
    },

    test21bBreakInWhile: function() {
        var node = this.parse('var i = 0; while (i < 10) { if (i == 2) break; i++; } i;');
        this.assertEquals(2, this.interpret(node));
    },

    test21cBreakInDoWhile: function() {
        var node = this.parse('var i = 0; do { if (i == 2) break; i++; } while (i < 10); i;');
        this.assertEquals(2, this.interpret(node));
    },

    test21dBreakInFor: function() {
        var node = this.parse('for (var name in { a: 1, b: 2 }) { if (name == "a") break; } name;');
        this.assertEquals('a', this.interpret(node));
    },

    test21eBreakInCase: function() {
        var node = this.parse('var a = 2; switch(a) { case 1: 1; case 2: 2; break; case 3: 3; }');
        this.assertEquals(2, this.interpret(node));
    },

    test22aSwitch: function() {
        var node = this.parse('switch (2) { case 1: a++; case 2: a++; case 3: a++; break; case 4: a++ } a;');
        this.assertEquals(2, this.interpret(node, { a: 0 }));
    },

    test22bSwitchDefault: function() {
        var node = this.parse('switch (3) { case 1: a = 1; case 2: a = 2; default: a = 3; } a;');
        this.assertEquals(3, this.interpret(node, { a: 0 }));
    },

    test22cSwitchDefaultFallThrough: function() {
        var node = this.parse('switch (3) { case 1: a = 1; default: a = 3; case 2: a = 2; } a;');
        this.assertEquals(2, this.interpret(node, { a: 0 }));
    },

    test22dSwitchNoDefault: function() {
        var node = this.parse('switch (3) { case 1: a = 1; case 2: a = 2; } a;');
        this.assertEquals(0, this.interpret(node, { a: 0 }));
    },

    test23aContinueInFor: function() {
        var node = this.parse('for (var i = 0; i < 5; i++) { if (i > 2) continue; a = i; } a;');
        this.assertEquals(2, this.interpret(node, { a: 0 }));
    },

    test23bContinueInWhile: function() {
        var node = this.parse('var i = 0; while (i < 5) { i++; if (i > 2) continue; a = i; } a;');
        this.assertEquals(2, this.interpret(node, { a: 0 }));
    },

    test23cContinueInDoWhile: function() {
        var node = this.parse('var i = 0; do { i++; if (i > 2) continue; a = i; } while (i < 5); a;');
        this.assertEquals(2, this.interpret(node, { a: 0 }));
    },

    test23dContinueInForIn: function() {
        var node = this.parse('for (var name in { a: 1, b: 2 }) { if (name != "a") continue; a = name; } a;');
        this.assertEquals('a', this.interpret(node, { a: '' }));
    },

    test24aSimpleTryCatch: function() {
        var node = this.parse('try { throw { a: 1 }; } catch(e) { e.a; }');
        this.assertEquals(1, this.interpret(node));
    },

    test24bSimpleTryCatchFinally: function() {
        var node = this.parse('try { throw { a: 1 }; } catch(e) { e.a; } finally { 2; }');
        this.assertEquals(2, this.interpret(node));
    },

    test24cSimpleTryFinally: function() {
        var node = this.parse('try { 1; } finally { 2; }');
        this.assertEquals(2, this.interpret(node));
    },

    test24dSimpleTryWithoutCatch: function() {
        var self = this,
            node = this.parse('try { throw { a: 1 }; } finally { 2; }');
        this.assertRaises(this.interpret.curry(node), function(e) {
            return (typeof e == 'object') && (e.a == 1);
        });
    },

    test24eMultipleTry: function() {
        var node = this.parse('try { ' +
                'try { throw 1; } finally { inner.finalizer = true; } ' +
            '} catch (e) { outer.catcher = true; } finally { outer.finalizer = true; }'),
            mapping = {
                inner: {},
                outer: {}
            };
        this.interpret(node, mapping);
        this.assertEquals(true, mapping.outer.finalizer, 'outer finalizer was not called');
        this.assertEquals(true, mapping.outer.catcher, 'outer catch was not called');
        this.assertEquals(true, mapping.inner.finalizer, 'inner finalizer was not called');
    },

    test24fTryCatchMultipleLevels: function() {
        var src = 'function m1() { for (var i = 0; i < 10; i++) if (i == 3) throw i; } ' +
                'function m2() { m1(); return 2 }; try { m2(); } catch(e) { e; }',
            node = this.parse(src);
        this.assertEquals(3, this.interpret(node), 'wrong result');
    },

    test24gTryCatchVariableDecl: function() {
        var node = this.parse('try { throw 1; } catch (e) { var x = 1; }; x;'),
            mapping = {};
        this.assertEquals(1, this.interpret(node, mapping));
        this.assertEquals(1, mapping.x, 'x was not created in the right scope');
    },

    test24hTryWithThrowInCatch: function() {
        var self = this,
            node = this.parse('var a = 1; try { throw 3; } catch (e) { throw 4; } finally { a = 2; }'),
            mapping = {};
        this.assertRaises(this.interpret.curry(node, mapping), function(e) {
            return (typeof e == 'number') && (e == 4);
        }, 'wrong error was raised');
        this.assertEquals(2, mapping.a, 'finally was not executed');
    },

    test25aNewWithFunc: function() {
        var node = this.parse('function m() { this.a = 2; } var obj = new m(); obj.a;');
        this.assertEquals(2, this.interpret(node));
    },

    test25bNewThenObjAccess: function() {
        var node = this.parse('function m() { this.a = 2; } new m().a;');
        this.assertEquals(2, this.interpret(node));
    },

    test25cNewPrototypeInheritence: function() {
        var node = this.parse('function m() { this.a = 1; } m.prototype.b = 2; new m().b;');
        this.assertEquals(2, this.interpret(node));
    },

    test25dFunctionPrototypeNotChanged: function() {
        var node = this.parse('function m() { this.a = 1; } m.prototype.a = 2; new m(); m.prototype.a;');
        this.assertEquals(2, this.interpret(node));
    },

    test25eObjReallyInherits: function() {
        var node = this.parse('function m() {} m.prototype.a = 2; var obj = new m(); m.prototype.a = 1; obj.a;');
        this.assertEquals(1, this.interpret(node));
    },

    test25fFuncCallInNewExpr: function() {
        var node = this.parse('function m() { this.a = (function() { return 1; })() }; new m().a;');
        this.assertEquals(1, this.interpret(node));
    },

    test26InstantiateClass: function() {
        var className = 'Dummy_test26InstantiateClass';
        this.onTearDown(function() { delete Global[className]; })
        var klass = Object.subclass(className, { a: 1 }),
            src = Strings.format('var obj = new %s(); obj.a;', className),
            node = this.parse(src),
            mapping = {};
        mapping[className] = klass;
        this.assertEquals(1, this.interpret(node, mapping));
        this.assert(lively.Class.isClass(Global[className]), 'Class changed!');
    },

    test27ArgumentsOfConstructorAreUsed: function() {
        var className = 'Dummy_test27ArgumentsOfConstructorAreUsed';
        this.onTearDown(function() { delete Global[className]; })
        Object.subclass(className, { initialize: function(n) { this.n = n } });
        var src = Strings.format('var obj = new %s(1); obj.n;', className),
            node = this.parse(src);
        this.assertEquals(1, this.interpret(node, Global));
    },

    test28aSpecialVarArguments: function() {
        var node = this.parse('function x() { return arguments[0]; } x(1);');
        this.assertEquals(1, this.interpret(node));
    },

    test28bSetSpecialVarArguments: function() {
        var node = this.parse('function x() { arguments = [2]; return arguments[0]; } x(1);');
        this.assertEquals(2, this.interpret(node));
    },

    test28cModifySpecialVarArguments: function() {
        var node = this.parse('function x() { arguments[0] = 2; return arguments[0]; } x(1);');
        this.assertEquals(2, this.interpret(node), 'directly modifying arguments did not work');

        node = this.parse('function x(a) { arguments[0] = 2; return a; } x(1);');
        this.assertEquals(2, this.interpret(node), 'indirectly modifying arguments did not work');

        node = this.parse('function x(a) { var z = []; arguments = z; z[0] = 23; return a; } x(5)');
        this.assertEquals(5, this.interpret(node), 'actual arguments changed via non-Argument obj');

        // FIXME: this should work too! (non-strict)
        // node = this.parse('function x(a) { a = 2; return arguments[0]; } x(1);');
        // this.assertEquals(2, this.interpret(node), 'modifying named argument did not work');
    },

    test28dArgumentsWithoutFunction: function() {
        var node = this.parse('arguments;');
        this.assertRaises(this.interpret.curry(node));
    },

    test28eLocalVariableArguments: function() {
        var node = this.parse('var arguments = 2; arguments;');
        this.assertEquals(2, this.interpret(node));
    },

    test28fMixedSpecialAndLocalVar: function() {
        var src = 'function foo() {\n'
                + '    var arguments = "hey";\n'
                + '    function bar() {\n'
                + '        arguments = undefined;\n'
                + '        return arguments;\n'
                + '    }\n'
                + '    return bar();\n'
                + '}\n'
                + 'foo();\n',
            node = this.parse(src);
        this.assertEquals(undefined, this.interpret(node));
    },

    test28gArgumentCalledArguments: function() {
        var node = this.parse('function x(arguments) { return arguments; } x(1, 2, 3);');
        this.assertEquals(1, this.interpret(node));
    },

    test29NullisNull: function() {
        var node = this.parse('null');
        this.assertIdentity(null, this.interpret(node));
    },

    test30SimpleRegex: function() {
        var node = this.parse('/aaa/.test("aaa")');
        this.assertIdentity(true, this.interpret(node));
    },

    test31FunctionReturnsRealFunction: function() {
        var node = this.parse('function m() {} m;'),
            result = this.interpret(node);
        this.assert(Object.isFunction(result));
    },

    test32InstanceOf: function() {
        var node = this.parse('pt(0,0) instanceof lively.Point;');
        this.assert(this.interpret(node, Global), 'instanceof not working');
    },

    test33ForWithSequenceExpr: function() {
        var node = this.parse('var i, j; for (i = 0, j = 1; i < 10; i++, j*=2) { }; [i, j]');
        this.assertEqualState([10, 1024], this.interpret(node));
    },

    test34AttrNameInObject: function() {
        var node = this.parse('"a" in ({ a: 23 })');
        this.assertIdentity(true, this.interpret(node));
    },

    test35WhileTrue: function() {
        var node = this.parse('(function() { while(true) return 23; return 24; })()');
        this.assertEquals(23, this.interpret(node));
    },

    test36IfSequenceExpr: function() {
        var node = this.parse('if (2,3,4) 5;');
        this.assertEqualState(5, this.interpret(node));
    },

    test37aAssignVarsOfOuterScope: function() {
        var node = this.parse('(function() { var a = 2; (function() { a++; })(); return a; })();');
        this.assertEquals(3, this.interpret(node));
    },

    test37bAssignVarsOfInnerScope: function() {
        var node = this.parse('(function() { var a = 2; (function() { var a = 3; })(); return a; })();');
        this.assertEquals(2, this.interpret(node));
    },

    test37cAssignVarsFallThrough: function() {
        var node = this.parse('(function() { var a = b = 1; })();'),
            mapping = { b: 0 };
        this.interpret(node, mapping);
        this.assertEquals(1, mapping.b);
    },

    test38aAlternativeMethodSend: function() {
        var node = this.parse('(function(){ var obj = { foo: function() { return 23; } }; return obj["foo"](); })();');
        this.assertEquals(23, this.interpret(node));
    },

    test38bAlternativeMemberAccess: function() {
        var node = this.parse('var obj = { foo: 1, bar: 2 }, bar = "foo"; obj.bar;');
        this.assertEquals(2, this.interpret(node));

        var node = this.parse('var obj = { foo: 1, bar: 2 }, bar = "foo"; obj[bar]');
        this.assertEquals(1, this.interpret(node));
    },

    test39NativeConstructor: function() {
        var node = this.parse('(function() { return typeof new Date(); })();');
        this.assertEquals('object', this.interpret(node, Global));
    },

    test40aDeleteExistingVar: function() {
        var node = this.parse('delete x;'),
            mapping = { x: 1 };
        this.assertEquals(false, this.interpret(node, mapping));
        this.assertEquals(1, mapping.x);
    },

    test40bDeleteNonExistingVar: function() {
        var node = this.parse('delete x;');
        this.assertEquals(true, this.interpret(node));
    },

    test40cDeleteExistingMember: function() {
        var node = this.parse('delete x.a;'),
            mapping = { x: { a: 1 } };
        this.assertEquals(true, this.interpret(node, mapping));
        this.assert(!mapping.x.hasOwnProperty('a'));
    },

    test40dDeleteNonExistingMember: function() {
        var node = this.parse('delete x.b;'),
            mapping = { x: { a: 1 } };
        this.assertEquals(true, this.interpret(node, mapping));
        this.assert(!mapping.x.hasOwnProperty('b'));
    },

    test40eDeleteDeepMember: function() {
        var node = this.parse('delete x.y.z;'),
            mapping = { x: { y: { z: 1 } } };
        this.assertEquals(true, this.interpret(node, mapping));
        this.assert(!mapping.x.y.hasOwnProperty('z'));
    },

    test40fDeleteNonExisting: function() {
        var node = this.parse('delete x.y;');
        this.assertRaises(this.interpret.curry(node));
    },

    test41aLabeledBreak: function() {
        var node = this.parse('outer: for (i = 0; i < 3; i++) { for (j = 0; j < 3; j++) break outer; } i += 5;'),
            mapping = { i: 0, j: 0 };
        this.interpret(node, mapping);
        this.assertEquals(5, mapping.i, 'labeled break did not break outer for');
        this.assertEquals(0, mapping.j, 'labeled break did not break to outer for');
    },

    test41bLabeledContinue: function() {
        var node = this.parse('outer: for (i = 0; i < 3; i++) { for (j = 0; j < 3; j++) continue outer; } i += 5;'),
            mapping = { i: 0, j: 0 };
        this.interpret(node, mapping);
        this.assertEquals(8, mapping.i, 'labeled continue did not continue at outer for');
        this.assertEquals(0, mapping.j, 'labeled continue did not stop at inner for');
    },

    test42aLateVariableDeclaration: function() {
        var node = this.parse('x; var x;');
        this.assertEquals(undefined, this.interpret(node)); // should not raise an error
    },

    test42bLateFunctionDeclaration: function() {
        var node = this.parse('var bar = foo(); function foo() { return 1; } bar;');
        this.assertEquals(1, this.interpret(node));
    },

    test43aUseGetter: function() {
        var node = this.parse('var obj = { get prop() { return 123; } }; obj.prop;');
        this.assertEquals(123, this.interpret(node));
    },

    test43bUseSetter: function() {
        var node = this.parse('var bar, obj = { set foo(val) { bar = val; } }; obj.foo = 123; bar;');
        this.assertEquals(123, this.interpret(node));
    },

    test44aWithStatement: function() {
        var node = this.parse('with({ a: 1 }) { a; }'),
            mapping = {};
        this.assertEquals(1, this.interpret(node, mapping));
        this.assert(!mapping.hasOwnProperty('a'));
    },

    test44bWithStatementFallThrough: function() {
        var node = this.parse('var a = 1; with({ b: 2 }) { a; }');
        this.assertEquals(1, this.interpret(node));
    },

    test44cWithStatementWithDelete: function() {
        var node = this.parse('var obj = { a: 1 }; with(obj) { delete obj.a; a; }');
        this.assertRaises(this.interpret.curry(node));
    },

    test45InterpretWithContext: function() {
        var node = this.parse('this');
        this.assertEquals(42, this.interpretWithContext(node, 42));
    },

    test46aReadUndefinedVarFromGlobalScope: function() {
        var node = this.parse('a1b2c3;')
        this.assertRaises(this.interpret.curry(node, Global), 'undefined variable read did not throw error');
    },

    test46bAddVarToGlobalScope: function() {
        var node = this.parse('a1b2c3 = 123;')
        this.assertEquals(123, this.interpret(node, Global));
        this.assertEquals(Global.a1b2c3, 123, 'global variable was not set');
        delete Global.a1b2c3;
    },

    test47Debugger: function() {
        var node = this.parse('debugger; 123;');
        this.assertRaises(this.interpret.curry(node), /UNWIND.*Debugger/);
    },

    test48aLeakingFunctionImplementation: function() {
        var src = 'function foo() {}\nfoo.name;',
            node = this.parse(src);
        this.assertEquals('foo', this.interpret(node), 'wrong function name returned');

        src = '(function() {}).name;',
        node = this.parse(src);
        this.assertEquals('', this.interpret(node), 'function name for anonymous function not empty');
    },

    test48bLeakingFunctionImplementation: function() {
        var src = '(function foo(a, b, c) {}).argumentNames();',
            node = this.parse(src);
        this.assertEqualState(['a', 'b', 'c'], this.interpret(node), 'wrong argument names returned');
    },

    test48cLeakingFunctionImplementation: function() {
        var fnStr = 'function foo(a, b, c) {}',
            src = '(' + fnStr + ').toString();',
            node = this.parse(src);
        acorn.walk.addSource(node, src);
        this.assertEqualState(fnStr, this.interpret(node), 'wrong function string/source was returned');
    },

    test49SameFunctionArgAndVarDeclaration: function() {
        var src = '(function(a) { var a; return a; })(123);',
            node = this.parse(src);
        this.assertEquals(123, this.interpret(node), 'variable declaration overwrote argument');
    },

    test50AccesingSlotOnUndefined: function() {
        var src = 'var foo; foo.bar',
            node = this.parse(src);
        this.assertRaises(this.interpret.curry(node), /TypeError.*property.*bar.*undefined/);
    }

});

TestCase.subclass('lively.ast.tests.InterpreterTests.AcornResumeTests',
'helper', {

    parse: function(src) {
        return acorn.walk.addAstIndex(lively.ast.acorn.parse(src));
    },

    resumeWithMapping: function(resumeNode, contextNode, mapping) {
        var interpreter = new lively.ast.AcornInterpreter.Interpreter(),
            func = new lively.ast.AcornInterpreter.Function(contextNode),
            frame = lively.ast.AcornInterpreter.Frame.create(func, mapping);
        frame.setPC(resumeNode);
        return interpreter.runWithFrame(contextNode, frame);
    },

    resumeWithFrameAndResult: function(contextNode, frame, result) {
        var interpreter = new lively.ast.AcornInterpreter.Interpreter();
        if (result !== undefined) frame.alreadyComputed[frame.pc.astIndex] = result;
        return interpreter.runWithFrameAndResult(contextNode, frame, result);
    }

},
'testing', {

    test01SimpleResumeFromStart: function() {
        var node = this.parse('var x = 1; x;'),
            resumeNode = node,
            mapping = { x: undefined };
        this.assertEquals(1, this.resumeWithMapping(resumeNode, node, mapping), 'did not fully resume');
        this.assertEquals(1, mapping.x);
    },

    test02SimpleResume: function() {
        var node = this.parse('var x = 1; var y = 2; y;'),
            resumeNode = node.body[1],
            mapping = { y: undefined };

        // make sure resume node is: var y = 2;
        this.assertMatches({
            type: 'VariableDeclaration',
            declarations: [{ type: 'VariableDeclarator',
                id: { type: 'Identifier', name: 'y' },
                init: { type: 'Literal', value: 2 }
            }]
        }, resumeNode, 'resume node was incorrect');

        this.assertEquals(2, this.resumeWithMapping(resumeNode, node, mapping), 'did not fully resume');
        this.assertEquals(2, mapping.y);
        this.assertEquals(undefined, mapping.x, 'did not resume but restart');
    },

    test03InnerResume: function() {
        var node = this.parse('var x = 1 + 2; x;'),
            resumeNode = node.body[0].declarations[0].init,
            mapping = { x: undefined };

        // make sure resume node is: 1 + 2
        this.assertMatches({
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Literal', value: 1 },
            right: { type: 'Literal', value: 2 }
        }, resumeNode, 'resume node was incorrect');

        this.assertEquals(3, this.resumeWithMapping(resumeNode, node, mapping), 'did not fully resume');
        this.assertEquals(3, mapping.x);
    },

    test04ResumeFunction: function() {
        var node = this.parse('(function() { var x = 1; return x; })();'),
            funcNode = node.body[0].expression.callee,
            resumeNode = funcNode.body.body[1];

        // make sure resume node is: return x;
        this.assertMatches({
            type: 'ReturnStatement',
            argument: { type: 'Identifier', name: 'x' }
        }, resumeNode, 'resume node was incorrect');

        // construct frames but change x in mapping
        var program = new lively.ast.AcornInterpreter.Function(node),
            outerFrame = lively.ast.AcornInterpreter.Frame.create(program, {}),
            func = new lively.ast.AcornInterpreter.Function(funcNode),
            innerFrame = outerFrame.newFrame(func, outerFrame.getScope(), { x: 2 });
        innerFrame.setPC(resumeNode);

        var result = this.resumeWithFrameAndResult(funcNode.body, innerFrame);
        this.assertEquals(2, result, 'did not correctly resume');
    },

    test05ResumeFunctionWithOuter: function() {
        var node = this.parse('(function() { var x = 1; return x; })() + 5;'),
            funcNode = node.body[0].expression.left.callee,
            resumeNode = funcNode.body.body[1];

        // construct some frames but change x in mapping
        var program = new lively.ast.AcornInterpreter.Function(node),
            outerFrame = lively.ast.AcornInterpreter.Frame.create(program, {}),
            func = new lively.ast.AcornInterpreter.Function(funcNode),
            innerFrame = outerFrame.newFrame(func, outerFrame.getScope(), { x: 2 });

        // make sure resume node is: return x;
        this.assertMatches({
            type: 'ReturnStatement',
            argument: { type: 'Identifier', name: 'x' }
        }, resumeNode, 'resume node was incorrect');

        // 1. interpret inner function
        innerFrame.setPC(resumeNode);
        var result1 = this.resumeWithFrameAndResult(funcNode.body, innerFrame);
        this.assertEquals(2, result1, 'did not resume inner correctly');

        // 2. with the result from the previous interpretation run the outer
        outerFrame.setPC(node.body[0].expression.left);
        var result2 = this.resumeWithFrameAndResult(node, outerFrame, result1);
        this.assertEquals(7, result2, 'did not resume outer correctly');
    },

    test06ResumeFunctionWithOuterAndMore: function() {
        var node = this.parse('var y = 5; (function() { var x = 1; return x; })() + y;'),
            funcNode = node.body[1].expression.left.callee,
            resumeNode = funcNode.body.body[1];

        // construct some frames but change x and y in mapping
        var program = new lively.ast.AcornInterpreter.Function(node),
            outerFrame = lively.ast.AcornInterpreter.Frame.create(program, { y: 10 }),
            func = new lively.ast.AcornInterpreter.Function(funcNode),
            innerFrame = outerFrame.newFrame(func, outerFrame.getScope(), { x: 2 });

        // make sure resume node is: return x;
        this.assertMatches({
            type: 'ReturnStatement',
            argument: { type: 'Identifier', name: 'x' }
        }, resumeNode, 'resume node was incorrect');

        innerFrame.setPC(resumeNode);
        var result1 = this.resumeWithFrameAndResult(funcNode.body, innerFrame);
        this.assertEquals(2, result1, 'did not resume inner correctly');
        
        outerFrame.setPC(node.body[1].expression.left);
        var result2 = this.resumeWithFrameAndResult(node, outerFrame, result1)
        this.assertEquals(12, result2, 'did not resume outer correctly');
    },

    test07ResumeSwitch: function() {
        var node = this.parse('var i = 1; switch (i) { case 1: i++; 1; break; case 2: 2; break; }'),
            resumeNode = node.body[1].cases[0].consequent[1].expression;

        // make sure resume node is 1; in case 1
        this.assertMatches({
            type: 'Literal', value: 1
        }, resumeNode, 'resume node was incorrect');

        // construct some frames but change x and y in mapping
        var program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program, { i: 2 });
        frame.setPC(resumeNode);
        var result = this.resumeWithFrameAndResult(node, frame);
        this.assertEquals(1, result, 'did not resume correctly');
    }

});

TestCase.subclass('lively.ast.tests.InterpreterTests.AcornSteppingTests',
'helper', {

    parse: function(src) {
        return acorn.walk.addAstIndex(lively.ast.acorn.parse(src));
    }

},
'testing', {

    test01SimpleSteppingFromStart: function() {
        var node = this.parse('var x = 1; x = 2;'),
            program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program),
            interpreter = new lively.ast.AcornInterpreter.Interpreter(),
            result = interpreter.stepToNextStatement(frame);

        this.assertEquals('Break', result && result.toString(), 'did not halt before next statement');
        this.assertEquals(undefined, frame.getScope().get('x'), 'did not stop at first statement');
        this.assertEquals(2, interpreter.runFromPC(frame), 'did not finish resume');
    },

    test02SimpleSteppingInTheMiddle: function() {
        var node = this.parse('var x = 1; x = 2; x = 3;'),
            program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program, { x: undefined }),
            interpreter = new lively.ast.AcornInterpreter.Interpreter();

        frame.setPC(node.body[0]); // var x = 1;
        var result = interpreter.stepToNextStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'did not halt before next statement');
        this.assertEquals(1, frame.getScope().get('x'), 'did not execute first statement');
        this.assertEquals(node.body[1], frame.getPC(), 'PC was not set to second statement');

        result = interpreter.stepToNextStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'did not halt after second statement');
        this.assertEquals(2, result && result.lastResult, 'did not return last statements result');
        this.assertEquals(node.body[2], frame.getPC(), 'PC was not set to third statement');
        this.assertEquals(3, interpreter.runFromPC(frame), 'did not finish resume');
    },

    test03SteppingOverFunction: function() {
        var node = this.parse('(function() { x = 1; })();'),
            program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program, { x: 0 }),
            interpreter = new lively.ast.AcornInterpreter.Interpreter();

        frame.setPC(node.body[0]);
        var result = interpreter.stepToNextStatement(frame);
        this.assertEquals(1, frame.getScope().get('x'), 'did not execute first statement');
    },

    test04SteppingWithinFunction: function() {
        var node = this.parse('function foo() { x = 1; return x; } foo();'),
            program = new lively.ast.AcornInterpreter.Function(node),
            func = new lively.ast.AcornInterpreter.Function(node.body[0]), // function foo() { ... }
            frame = lively.ast.AcornInterpreter.Frame.create(program, { x: 0, foo: func }),
            funcFrame = lively.ast.AcornInterpreter.Frame.create(func),
            interpreter = new lively.ast.AcornInterpreter.Interpreter();

        funcFrame.setParentFrame(frame);
        funcFrame.getScope().setParentScope(frame.getScope());

        frame.setPC(node.body[1]); // foo();
        funcFrame.setPC(node.body[0].body.body[0]); // x = 1;
        var result = interpreter.stepToNextStatement(funcFrame);
        this.assertEquals(1, frame.getScope().get('x'), 'did not execute first statement');
        this.assertEquals(1, interpreter.runFromPC(funcFrame), 'did not finish resume');
    },

    test05SteppingIntoFunction: function() {
        var node = this.parse('function foo() { return 1; } var x = foo(); ++x;'),
            program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program),
            interpreter = new lively.ast.AcornInterpreter.Interpreter(),
            result;

        result = interpreter.stepToNextStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'first step');
        this.assertEquals(node.body[1], frame.getPC(), 'did not halt at initial position');

        result = interpreter.stepToNextCallOrStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'second step');
        var newFrame = result.unwindException.top;
        while (newFrame && newFrame.isInternal()) {
            newFrame = newFrame.getParentFrame();
        }
        this.assertEquals(node.body[0].body.body[0], newFrame && newFrame.getPC(),
            'no new top frame returned');
        this.assertEquals(undefined, frame.getScope().get('x'), 'did not halt at call');
        this.assertEquals(node.body[1].declarations[0].init, frame.getPC(),
            'parent frame does not have correct PC');

        this.assertEquals(2, interpreter.runFromPC(frame), 'did not finish resume');
    },

    test06SteppingIntoFunctionResetAndResume: function() {
        var node = this.parse('(function foo(arg) { return arg; })(123);'),
            program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program),
            interpreter = new lively.ast.AcornInterpreter.Interpreter(),
            result;

        result = interpreter.stepToNextStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'first step');
        this.assertEquals(node.body[0], frame.getPC(), 'did not halt at initial position');

        result = interpreter.stepToNextCallOrStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'second step');
        var newFrame = result.unwindException.top;
        while (newFrame && newFrame.isInternal()) {
            newFrame = newFrame.getParentFrame();
        }

        var functionNode = node.body[0].expression.callee;
        this.assertEquals(functionNode.body.body[0], newFrame && newFrame.getPC(),
            'no new top frame returned');
        this.assertEquals(123, newFrame.getScope().get('arg'), 'argument "arg" was not set correctly');
        this.assertEquals(node.body[0].expression, frame.getPC(),
            'parent frame does not have correct PC');

        newFrame.reset();
        this.assertEquals(undefined, newFrame.getPC(), 'PC of frame was not reset');
        this.assertEquals(node.body[0].expression, frame.getPC(),
            'parent frame does not have correct PC after reset');
        this.assertEquals(123, newFrame.getScope().get('arg'), 'argument "arg" was not stored by reset');

        this.assertEquals(123, interpreter.runFromPC(frame), 'did not finish resume');
    },

    test07SteppingInsideIf: function() {
        var node = this.parse('function foo(a) { return x += a; } var x = 0; (false ? foo(1) : foo(5));'),
            program = new lively.ast.AcornInterpreter.Function(node),
            frame = lively.ast.AcornInterpreter.Frame.create(program),
            interpreter = new lively.ast.AcornInterpreter.Interpreter(),
            result;

        result = interpreter.stepToNextStatement(frame);
        result = interpreter.stepToNextStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'first two steps');
        this.assertEquals(node.body[2], frame.getPC(), 'did not halt at initial position');

        result = interpreter.stepToNextCallOrStatement(frame);
        this.assertEquals('Break', result && result.toString(), 'third step');
        var newFrame = result.unwindException.top;
        while (newFrame && newFrame.isInternal()) {
            newFrame = newFrame.getParentFrame();
        }
        this.assertEquals(node.body[0].body.body[0], newFrame && newFrame.getPC(),
            'no new top frame returned');
        this.assertEquals(5, newFrame.getScope().get('a'), 'did not go into else branch');

        result = interpreter.stepToNextStatement(newFrame);
        this.assertEquals(5, result, 'forth step');
        this.assertEquals(5, frame.getScope().get('x'), 'did not execute addition');
        this.assertEquals(null, newFrame.getPC(), 'did not finish function execution');
        frame.alreadyComputed[frame.getPC().astIndex] = result;

        result = interpreter.stepToNextStatement(frame);
        this.assertEquals(5, result, 'fifth step');
        this.assertEquals(5, frame.getScope().get('x'), 'did execute addition twice');
        this.assertEquals(null, frame.getPC(), 'did not finish if statement');
    }

});

}) // end of module
