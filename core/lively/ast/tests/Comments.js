module('lively.ast.tests.Comments').requires('lively.ast.Comments', 'lively.TestFramework').toRun(function() {

TestCase.subclass("lively.ast.tests.Comments.Extraction",
"running", {
    setUp: function()  {},
    tearDown: function()  {}
},
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
        this.assertEqualState(expected, comments);
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
        this.assertEqualState(expected, comments);
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
        var expected = [{
            comment: " lalalala\n 'nother comment!",
            type: "object", name: "someObject"}]
        this.assertEqualState(expected, comments);
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
        this.assertEqualState(expected, comments);
    },

    testExtractCommentFromObjectExtension: function() {
        var code = Functions.extractBody(function() {
            Object.extend(Foo.prototype, {
                m: function() {/*some comment*/ return 23; }
            })
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: "some comment", type: "method", name: "m", objectName: "Foo.prototype", args: []}];
        this.assertEqualState(expected, comments);
    },

    testExtractCommentFromAssignment: function() {
        var code = Functions.extractBody(function() {
            exports.foo = {
                m: function() {/*some comment*/ return 23; }
            }
        });

        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: "some comment",type: "method", name: "m", objectName: "exports.foo",args: []}]
        this.assertEqualState(expected, comments);
    },

    testExtractCommentFromAssignedFunction: function() {
        var code = Functions.extractBody(function() {
            Group.foo = function(test) {
                // hello
            };
        });
        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: " hello",type: "method", name: "foo", objectName: "Group", args: ["test"]}]
        this.assertEqualState(expected, comments);

        var code = Functions.extractBody(function() {
            Group.bar.foo = function(test) {
                // hello
            };
        });
        var comments = lively.ast.Comments.extractComments(code);
        var expected = [{comment: " hello",type: "method", name: "foo", objectName: "Group.bar", args: ["test"]}]
        this.assertEqualState(expected, comments);
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
        this.assertEqualState(expected, comments);
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
        this.assertEqualState(expected, comments);
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
        this.assertEqualState(expected, comments);
    }
});

}) // end of module
