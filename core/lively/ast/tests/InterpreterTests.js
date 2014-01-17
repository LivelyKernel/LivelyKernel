module('lively.ast.tests.InterpreterTests').requires('lively.ast.Interpreter', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.InterpreterTests.AcornTests',
'helper', {
    parse: function(src) {
        return lively.ast.acorn.parse(src);
    },
    interpret: function(ast, optMapping) {
        return acorn.walk.interpret(ast, optMapping);
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
    test02AddNumbers: function() {
        var node = this.parse('1 + 2');
        this.assertEquals(3, this.interpret(node));
    },
    test03LookupVar: function() {
        var node = this.parse('a + 2');
        this.assertEquals(3, this.interpret(node, { a: 1 }));
    },
    test04aIf: function() {
        var node = this.parse('if (false) 1; else 2;');
        this.assertEquals(2, this.interpret(node));
    },
    test04aIfWithoutElse: function() {
        var node = this.parse('if (false) 1;');
        this.assertEquals(undefined, this.interpret(node));
    },
/*    test05FunctionInvocation: function() {
        var node = this.parse('(function() { return 1; })()');
        this.assertEquals(1, this.interpret(node));
    },
    test06FunctionInvocationWithArgs: function() {
        var node = this.parseJS('(function(a) { return a + 1 })(2)', 'expr');
        this.assertEquals(3, node.startInterpretation());
    },
    test07Closue: function() {
        var node = this.parseJS('var a = 6; (function(b) { return a / b })(3)');
        this.assertEquals(2, node.startInterpretation());
    },
    test08RealClosue: function() {
        var node = this.parseJS('var foo = function(){var a = 1; return function() {return a}}; foo()()');
        this.assertEquals(1, node.startInterpretation());
    },
    test09aEarlyReturn: function() {
        var node = this.parseJS('(function() { return 1; 2; })()');
        this.assertEquals(1, node.startInterpretation());
    },
    test09bEarlyReturnInFor: function() {
        var node = this.parseJS('(function() { for (var i=0;i<10;i++) if (i==5) return i; })()');
        this.assertEquals(5, node.startInterpretation());
    },
    test09cEarlyReturnInWhile: function() {
        var node = this.parseJS('(function() { var i = 0; while (i<10) { i++; if (i==5) return i; } })()');
        this.assertEquals(5, node.startInterpretation());
    },
    test10Recursion: function() {
        var node = this.parseJS('function foo(n) { return n == 1 ? 1 : foo(n - 1)}; foo(10)');
        this.assertEquals(1, node.startInterpretation());
    },
    test11MethodCall: function() {
        var node = this.parseJS('var obj = {foo: function() {return 3}}; obj.foo()');
        this.assertEquals(3, node.startInterpretation());
    },
    test12UsingThis: function() {
        var node = this.parseJS('var obj = {foo: function() {this.x=3}}; obj.foo(); obj.x');
        this.assertEquals(3, node.startInterpretation());
    }, */
    test13ModifyingVar: function() {
        var node = this.parse('var x = 1; x = 3; x');
        this.assertEquals(3, this.interpret(node));
    },
/*    test14NoDynamicScop: function() {
        var ast = this.parseJS('var a = 1; ' +
            'function bar () { return a }; ' +
            'function foo() { var a = 2; return bar() }; ' +
            'foo()')
            result  = ast.startInterpretation();
        this.assertIdentity(1, result, 'function barr can access dynamic scope of foo');
    }, */
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
        // var node = this.parse('var obj = { a: 1, b: 2 }, result = []; ' +
        //         'for (var name in obj) result.push(name); result;');
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
        var node    = this.parse('a += 2'),
            mapping = { a: 3 },
            result  = this.interpret(node, mapping);
        this.assertEquals(5, result);
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
/*    test24eTryCatchMultipleLevels: function() {
        var src = 'function m1() { for (var i = 0; i < 10; i++) if (i == 3) throw i }; ' +
                'function m2() { m1(); return 2 }; try { m2() } catch(e) { e }',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(3, result, 'wrong result');
    },
    test25aNewWithFunc: function() {
        var src = 'function m() { this.a = 2 }; var obj = new m(); obj.a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test25bNewThenObjAccess: function() {
        var src = 'function m() { this.a = 2 }; new m().a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test25cNewPrototypeInheritence: function() {
        var src = 'function m() { this.a = 1 }; m.prototype.b = 2; new m().b',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test25dFunctionPrototypeNotChanged: function() {
        var src = 'function m() { this.a = 1 }; m.prototype.a = 2; new m(); m.prototype.a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test25eObjReallyInherits: function() {
        var src = 'function m() {}; m.prototype.a = 2; var obj = new m(); m.prototype.a = 1; obj.a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(1, result);
    },
    test25eFuncCallInNewExpr: function() {
        var src = 'function m() { this.a = (function() { return 1 })() }; new m().a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(1, result);
    },
    test26InstantiateClass: function() {
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
    },
    test28SpecialVarArguments: function() {
        var src = 'function x() { return arguments[0] }; x(1)',
            ast = this.parseJS(src),
            result  = ast.startInterpretation(Global);
        this.assertEquals(1, result);
    }, */
    test29NullisNull: function() {
        var node = this.parse('null');
        this.assertIdentity(null, this.interpret(node));
    },
/*    test30SimpleRegex: function() {
        var node = this.parse('/aaa/.test("aaa")');
        this.assertIdentity(true, this.interpret(node));
    },
    test31FunctionReturnsRealFunction: function() {
        var src = 'function m() {}',
            ast = this.parseJS(src, 'expr'),
            result  = ast.startInterpretation();
        this.assert(Object.isFunction(result), 'not a real function');
    },
    test32InstanceOf: function() {
        var src = 'pt(0,0) instanceof lively.Point',
            ast = this.parseJS(src, 'expr'),
            result  = ast.startInterpretation(Global);
        this.assert(result, 'instanceof not working');
    }, */
    test33ForWithMultipleExpr: function() {
        var node = this.parse('var i, j; for (i = 0, j = 1; i < 10; i++, j*=2) { }; [i, j]');
        this.assertEqualState([10, 1024], this.interpret(node));
    },
    test34AttrNameInObject: function() {
        var node = this.parse('"a" in ({ a: 23 })');
        this.assertIdentity(true, this.interpret(node));
    },
/*    test35WhileTrue: function() {
        var src = '(function() { while(true) return 23; return 24; })()',
            ast = this.parseJS(src, 'topLevel'),
            result  = ast.startInterpretation();
        this.assertIdentity(result, 23, 'while(true) not working');
    },
    test36IfMultipleExpr: function() {
        var src = 'if (2,3,4) 5;',
            ast = this.parseJS(src, 'stmt'),
            result = ast.startInterpretation();
        this.assertEqualState(5, result, 'multiple expressions in if not working');
    },
    test37AssignVarsOfOuterScope: function() {
        var func = function m(){var a=2;(function(){a++})(); return a};
        var result = func.forInterpretation().call();
        this.assertEquals(3, result);
    },
    test37AlternativeMethodSend: function() {
        var func = function(){var obj = {a:23,foo:function(){return this.a}};return obj["foo"]()};
        var result = func.forInterpretation().call();
        this.assertEquals(23, result);
    },
    test38NativeConstructor: function() {
        var func = function(){return typeof new Date()};
        var result = func.forInterpretation().call();
        this.assertEquals("object", result);
    }, */
});

}) // end of module
