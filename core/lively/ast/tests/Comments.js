module('lively.ast.tests.Comments').requires('lively.ast.Comments', 'lively.TestFramework').toRun(function() {

TestCase.subclass("lively.ast.tests.Comments.Extraction",
'testing', {

    testExtractCommentFromMethod: function() {
        var code = Functions.extractBody(function() {
            var obj = {
                foo: function(arg1, arg2) {
                    // This is a comment!
                    return 123;
                }
            }
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{
            comment: " This is a comment!",
            type: "method", name: "foo", objectName: "obj",
            args: ["arg1", "arg2"]}];
        this.assertMatches(expected, comments);
    },

    testExtractCommentFromFunction: function() {
        var code = Functions.extractBody(function() {
            function fooBar(x, y) {
                // this is a function comment!
                return x + y;
            }
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{
            comment: " this is a function comment!",
            name: "fooBar", type: "function",
            args: ["x", "y"]}]
        this.assertMatches(expected, comments);
    },

    testExtractCommentFromObject: function() {
        var code = Functions.extractBody(function() {
            var bar = {x: 23, m: function() { return 24; }};
            // I don't belong to someObject...!

            // lalalala
            // 'nother comment!
            var someObject = exports.foo = {foo: function(arg1, arg2) { return 123; }};
        });

        var comments = lively.ast.Comments.extractComments(code);

        var expected = [
          {comment: " I don't belong to someObject...!"},
          {comment: " lalalala\n 'nother comment!",
           type: "object", name: "someObject"}]
        this.assertMatches(expected, comments);
    },

    testExtractCommentFromVarDeclaration: function() {
        var code = Functions.extractBody(function() {
            // test-test
            var Group = exports.GroupExport = function GroupFunc() {}
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{
            comment: " test-test",
            type: "var", name: "Group"}]
        this.assertMatches(expected, comments);
    },

    testExtractCommentFromObjectExtension: function() {
        var code = Functions.extractBody(function() {
            Object.extend(Foo.prototype, {
                m: function() {/*some comment*/ return 23; }
            })
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: "some comment", type: "method", name: "m", objectName: "Foo.prototype", args: []}];
        this.assertMatches(expected, comments);
    },

    testExtractCommentFromAssignment: function() {
        var code = Functions.extractBody(function() {
            exports.foo = {
                m: function() {/*some comment*/ return 23; }
            }
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: "some comment",type: "method", name: "m", objectName: "exports.foo",args: []}]
        this.assertMatches(expected, comments);
    },

    testExtractCommentFromAssignedFunction: function() {
        var code = Functions.extractBody(function() {
            Group.foo = function(test) {
                // hello
            };
        });
        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: " hello",type: "method", name: "foo", objectName: "Group", args: ["test"]}]
        this.assertMatches(expected, comments);

        var code = Functions.extractBody(function() {
            Group.bar.foo = function(test) {
                // hello
            };
        });
        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: " hello",type: "method", name: "foo", objectName: "Group.bar", args: ["test"]}]
        this.assertMatches(expected, comments);
    },

    testExtractFromAppliedFunction: function() {
        var code = Functions.extractBody(function() {
            var foo = {
              func: (function() {
                // test comment
                return function() { return 23; }
              })()
            }
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{
          comment: " test comment",
          type: "method", name: "func", objectName: "foo", args: []}]
        this.assertMatches(expected, comments);
    },

    testExtractCommentBug: function() {
        var code = Functions.extractBody(function() {
            var string = exports.string = {
              format: function strings$format() {
                // Takes a variable number of arguments. The first argument is the format
                // string. Placeholders in the format string are marked with "%s".
                // Example:
                //
                // ```
                // jsext.string.format("Hello %s!", "Lively User"); // => "Hello Lively User!"
                // ```
                
                return string.formatFromArray(Array.prototype.slice.call(arguments));
              }
            }
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{
          comment: " Takes a variable number of arguments. The first argument is the format\n"
                 + " string. Placeholders in the format string are marked with \"%s\".\n"
                 + " Example:\n"
                 + "\n"
                 + " ```\n"
                 + " jsext.string.format(\"Hello %s!\", \"Lively User\"); // => \"Hello Lively User!\"\n"
                 + " ```",
          type: "method", name: "format", objectName: "string", args: []}]
        this.assertMatches(expected, comments);
    },

    testExtractCommentBug2: function() {
        var code = Functions.extractBody(function() {
            // test-test
            var Group = exports.GroupExport = function GroupFunc() {}
            Group.foo = function(test) {
                // hello
            };
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [
            {comment: " test-test",type: "var", name: "Group"},
            {comment: " hello",type: "method", name: "foo", objectName: "Group", args: ["test"]}]
        this.assertMatches(expected, comments);
    }
});

TestCase.subclass("lively.ast.tests.Comments.Accessing",
'testing', {

    testGetCommentForFunctionCall: function() {
        var code = Functions.extractBody(function() {
          // comment 1
          
          // comment 2
          // comment 2
          var x = (function functionName() {
              var x = 23;
              bla(x);
            /* comment3 */
              foo(x);
          })();
          
          // comment 4
        });

        var ast = lively.ast.acorn.parse(code, {withComments: true});

        var node1 = ast.body[0];
        var comment = lively.ast.Comments.getCommentPrecedingNode(ast, node1);
        var expected = {comment: " comment 2\n comment 2",type: "var", name: "x"}

        this.assertMatches(expected, comment, "node1");

        var node2 = ast.body[0].declarations[0].init.callee.body.body[2]
        var comment = lively.ast.Comments.getCommentPrecedingNode(ast, node2);
        var expected = {isBlock: true, comment: " comment3 "};
        this.assertMatches(expected, comment, "node2");
    }

});

}) // end of module
