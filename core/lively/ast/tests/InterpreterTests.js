module('lively.ast.tests.InterpreterTests').requires('lively.ast.AcornInterpreter', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.InterpreterTests.AcornTests',
'helper', {
    parse: function(src) {
        return lively.ast.acorn.parse(src);
    },
    interpret: function(node, optMapping) {
        var interpreter = new lively.ast.AcornInterpreter.Interpreter();
        return interpreter.run(node, optMapping);
    },
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
    test12UsingThis: function() {
        var node = this.parse('var obj = { foo: function() { this.x = 3; } }; obj.foo(); obj.x;');
        this.assertEquals(3, this.interpret(node));
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
            'function bar () { return a; }; ' +
            'function foo() { var a = 2; return bar(); }; ' +
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
        var node = this.parse('var i = 0; while (i < 3) { ++i; }');
        this.assertEqualState(3, this.interpret(node));

        var node = this.parse('var i = 0; while (i < 3) { i++; }');
        this.assertEqualState(2, this.interpret(node));
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
        var self = this;
        var node = this.parse('try { throw { a: 1 }; } finally { 2; }');
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
        this.assertEquals(true, mapping.outer.finalizer);
        this.assertEquals(true, mapping.outer.catcher);
        this.assertEquals(true, mapping.inner.finalizer);
    },
    test24fTryCatchMultipleLevels: function() {
        var src = 'function m1() { for (var i = 0; i < 10; i++) if (i == 3) throw i; } ' +
                'function m2() { m1(); return 2 }; try { m2(); } catch(e) { e; }',
            node = this.parse(src);
        this.assertEquals(3, this.interpret(node), 'wrong result');
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
/*    test26InstantiateClass: function() {
        Config.deepInterpretation = true
        var className = 'Dummy_test25InstantiateClass';
        try {
        var klass = Object.subclass(className, { a: 1 }),
            src = Strings.format('var obj = new %s(); obj.a', className),
            ast = this.parseJS(src),
            mapping = {Dummy_test25InstantiateClass: klass},
            result  = ast.startInterpretation(mapping);
        this.assertEquals(1, result);
        this.assert(lively.Class.isClass(Global[className]), 'Class changed!')
        } finally {
            delete Global[className];
        }
    },
    test27ArgumentsOfConstructorAreUsed: function() {
        try {
            Object.subclass('Dummy_test26ArgumentsOfConstructorAreUsed', { initialize: function(n) { this.n = n }})
            var src = 'var obj = new Dummy_test26ArgumentsOfConstructorAreUsed(1); obj.n',
                ast = this.parseJS(src),
                result  = ast.startInterpretation(Global);
            this.assertEquals(1, result);
        } finally {
            delete Global.Dummy_test26ArgumentsOfConstructorAreUsed
        }
    }, */
    test28SpecialVarArguments: function() {
        var node = this.parse('function x() { return arguments[0]; } x(1);');
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
    // test39NativeConstructor: function() {
    //     var node = '(function() { return typeof new Date(); })();';
    //     this.assertEquals('object', this.interpret(node));
    // },
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
        this.assertEquals(false, mapping.x.hasOwnProperty('a'));
    },
    test40dDeleteNonExistingMember: function() {
        var node = this.parse('delete x.b;'),
            mapping = { x: { a: 1 } };
        this.assertEquals(true, this.interpret(node, mapping));
        this.assertEquals(false, mapping.x.hasOwnProperty('b'));
    },
    test40eDeleteDeepMember: function() {
        var node = this.parse('delete x.y.z;'),
            mapping = { x: { y: { z: 1 } } };
        this.assertEquals(true, this.interpret(node, mapping));
        this.assertEquals(false, mapping.x.y.hasOwnProperty('z'));
    },
    test40fDeleteNonExisting: function() {
        var node = this.parse('delete x.y;');
        this.assertRaises(this.interpret.curry(node));
    },
});

}) // end of module
