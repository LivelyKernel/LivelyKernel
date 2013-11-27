module('lively.ide.tests.CommandLineInterface').requires('lively.TestFramework', 'lively.ide.CommandLineInterface').toRun(function() {

TestCase.subclass('lively.ide.tests.CommandLineInterface.Shell',
'testing', {
    testCommandParsing: function() {
        var commandParseData = [
            ["foo", ["foo"]],
            ["foo -bar", ["foo", "-bar"]],
            ["foo -bar 3", ["foo", "-bar", "3"]],
            ["foo --bar=123", ["foo", "--bar=123"]],
            ["foo -x --bar", ["foo", "-x", "--bar"]],
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            ["foo --bar \"to ge ther\"", ["foo", "--bar", 'to ge ther']],
            ["foo --bar \"to ge\\\"ther\"", ["foo", "--bar", 'to ge"ther']],
            ["foo 'bar baz'", ['foo', "bar baz"]],
            ["foo 'bar \\\'baz'", ['foo', "bar 'baz"]],
            ["foo 'bar \"baz zork\"'", ['foo', "bar \"baz zork\""]],
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            ["foo -- bar", ['foo', '--', 'bar']]
        ];

        commandParseData.forEach(function(spec) {
            var cmd = spec[0], expected = spec[1],
                result = lively.ide.CommandLineInterface.parseCommandIntoCommandAndArgs(cmd);
            this.assertEquals(expected, result,
                              Strings.format('\n%s\n%s vs %s', cmd, expected, result));
        }, this);
    }    
});

TestCase.subclass('lively.ide.tests.CommandLineInterface.Differ',
'testing', {
    testParsePatch: function() {
        var patchString = "diff --git a/test.txt b/test.txt\n"
            + "index bb53c45..3b6c223 100644\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,3 +2,3 @@ Bitcoins are used in a small, open, pure-exchange economy embedded within many\n"
            + " of the world's largest, open, production economies. Even with a market\n"
            + "-capitalization of $2.5 billion, the bitcoin economy is dwarfed by $15 trillion\n"
            + "+capitalization of $2.5 billion, the bitcoin economy is dwarfed hey by $15 trillion\n"
            + " economies such as the U.S. Therefore, sudden and large increases in the user\n"
            + "@@ -20,2 +20,3 @@ information does not correspond with the number of lines in the hunk, then the\n"
            + " diff could be considered invalid and be rejected. Optionally, the hunk range\n"
            + "+123\n"
            + " can be followed by the heading of the section or function that the hunk is\n"
            + "@@ -25,3 +26,3 @@ matching.[8] If a line is modified, it is represented as a deletion and\n"
            + " addition. Since the hunks of the original and new file appear in the same\n"
            + "-hunk, such changes would appear adjacent to one another.[9] An occurrence of\n"
            + "+hunk, foo such changes would appear adjacent to one another.[9] An occurrence of\n"
            + " this in the example below is:";
        var patch = lively.ide.FilePatch.read(patchString);

        // header
        this.assertEquals('diff --git a/test.txt b/test.txt', patch.command);
        this.assertEquals('a/test.txt', patch.pathOriginal);
        this.assertEquals('b/test.txt', patch.pathChanged);

        // hunks
        var hunks = patch.hunks;
        this.assertEquals(3, hunks.length);

        // hunnk 0
        this.assertEquals(2, hunks[0].originalLine);
        this.assertEquals(3, hunks[0].originalLength);
        this.assertEquals(2, hunks[0].changedLine);
        this.assertEquals(3, hunks[0].changedLength);
        this.assertEquals(5, hunks[0].length);
        var expectedHunkString = "@@ -2,3 +2,3 @@\n"
            + " of the world's largest, open, production economies. Even with a market\n"
            + "-capitalization of $2.5 billion, the bitcoin economy is dwarfed by $15 trillion\n"
            + "+capitalization of $2.5 billion, the bitcoin economy is dwarfed hey by $15 trillion\n"
            + " economies such as the U.S. Therefore, sudden and large increases in the user"
        this.assertEquals(expectedHunkString, hunks[0].createPatchString());
    },

    testCreateHunkFromSelectedRows: function() {
        var origHunk = "@@ -2,4 +2,5 @@ xxx yyy\n"
                     + " hello world\n"
                     + "-this lines is removed\n"
                     + "+this lines is added\n"
                     + "+this line as well\n"
                     + " foo bar baz\n"
                     + " har har har";
        var hunk = new lively.ide.FilePatchHunk().read(origHunk.split('\n'));
        var result, expected;

        result = hunk.createPatchStringFromRows(4,6);
        expected = "@@ -2,4 +2,5 @@\n"
                 + " hello world\n"
                 + " this lines is removed\n"
                 + "+this line as well\n"
                 + " foo bar baz\n"
                 + " har har har";
        // expected = "@@ -4,2 +4,3 @@\n"
        //     + "+this line as well\n"
        //     + " foo bar baz\n"
        //     + " har har har";
        this.assertEquals(expected, result, 'at end');
        
        result = hunk.createPatchStringFromRows(2,3);
        expected = "@@ -2,4 +2,4 @@\n"
                 + " hello world\n"
                 + "-this lines is removed\n"
                 + "+this lines is added\n"
                 + " foo bar baz\n"
                 + " har har har";
        // expected = "@@ -3,1 +3,1 @@\n"
        //     + "-this lines is removed\n"
        //     + "+this lines is added"
        this.assertEquals(expected, result, 'add and remove');

        result = hunk.createPatchStringFromRows(3,3);
        expected = "@@ -2,4 +2,5 @@\n"
                 + " hello world\n"
                 + " this lines is removed\n"
                 + "+this lines is added\n"
                 + " foo bar baz\n"
                 + " har har har";
        // expected = "@@ -4,0 +4,1 @@\n"
        //     + "+this lines is added"
        this.assertEquals(expected, result, 'just add');

        result = hunk.createPatchStringFromRows(7,9);
        expected = null;
        this.assertEquals(expected, result, 'outside');

        result = hunk.createPatchStringFromRows(4,9);
        expected = "@@ -2,4 +2,5 @@\n"
                 + " hello world\n"
                 + " this lines is removed\n"
                 + "+this line as well\n"
                 + " foo bar baz\n"
                 + " har har har";
        // expected = "@@ -4,2 +4,3 @@\n"
        //     + "+this line as well\n"
        //     + " foo bar baz\n"
        //     + " har har har";
        this.assertEquals(expected, result, 'too long');
    },
    
    testCreatePatchFromSelectedRows: function() {
        var patchString = "diff --git a/test.txt b/test.txt\n"
                        + "--- a/test.txt\n"
                        + "+++ b/test.txt\n"
                        + "@@ -2,3 +2,3 @@ Bitcoins are used in a small, open, pure-exchange economy embedded within many\n"
                        + " of the world's largest, open, production economies. Even with a market\n"
                        + "-capitalization of $2.5 billion, the bitcoin economy is dwarfed by $15 trillion\n"
                        + "+capitalization of $2.5 billion, the bitcoin economy is dwarfed hey by $15 trillion\n"
                        + " economies such as the U.S. Therefore, sudden and large increases in the user\n"
                        + "@@ -20,2 +20,3 @@ information does not correspond with the number of lines in the hunk, then the\n"
                        + " diff could be considered invalid and be rejected. Optionally, the hunk range\n"
                        + "+123\n"
                        + " can be followed by the heading of the section or function that the hunk is\n"
                        + "@@ -25,3 +26,3 @@ matching.[8] If a line is modified, it is represented as a deletion and\n"
                        + " addition. Since the hunks of the original and new file appear in the same\n"
                        + "-hunk, such changes would appear adjacent to one another.[9] An occurrence of\n"
                        + "+hunk, foo such changes would appear adjacent to one another.[9] An occurrence of\n"
                        + " this in the example below is:";
        var patch = lively.ide.FilePatch.read(patchString);
        var result, expected;

        // just the hunk header
        result = patch.createPatchStringFromRows(3,3);
        expected = null;
        this.assertEquals(expected, result, "just the hunk header");

        result = patch.createPatchStringFromRows(3,4);
        expected = "diff --git a/test.txt b/test.txt\n"
                 + "--- a/test.txt\n"
                 + "+++ b/test.txt\n"
                 + "@@ -2,3 +2,3 @@\n"
                 + " of the world's largest, open, production economies. Even with a market\n"
                 + " capitalization of $2.5 billion, the bitcoin economy is dwarfed by $15 trillion\n"
                 + " economies such as the U.S. Therefore, sudden and large increases in the user\n";
        this.assertEquals(expected, result, "just the hunk header and one context line");

        result = patch.createPatchStringFromRows(3,7);
        expected = "diff --git a/test.txt b/test.txt\n"
                 + "--- a/test.txt\n"
                 + "+++ b/test.txt\n"
                 + "@@ -2,3 +2,3 @@\n"
                 + " of the world's largest, open, production economies. Even with a market\n"
                 + "-capitalization of $2.5 billion, the bitcoin economy is dwarfed by $15 trillion\n"
                 + "+capitalization of $2.5 billion, the bitcoin economy is dwarfed hey by $15 trillion\n"
                 + " economies such as the U.S. Therefore, sudden and large increases in the user\n";
        this.assertEquals(expected, result, "first hunk");

        result = patch.createPatchStringFromRows(6, 10);
        expected = "diff --git a/test.txt b/test.txt\n"
                 + "--- a/test.txt\n"
                 + "+++ b/test.txt\n"
                 + "@@ -2,3 +2,4 @@\n"
                 + " of the world's largest, open, production economies. Even with a market\n"
                 + " capitalization of $2.5 billion, the bitcoin economy is dwarfed by $15 trillion\n"
                 + "+capitalization of $2.5 billion, the bitcoin economy is dwarfed hey by $15 trillion\n"
                 + " economies such as the U.S. Therefore, sudden and large increases in the user\n"
                 + "@@ -20,2 +20,3 @@\n"
                 + " diff could be considered invalid and be rejected. Optionally, the hunk range\n"
                 + "+123\n"
                 + " can be followed by the heading of the section or function that the hunk is\n";
        this.assertEquals(expected, result, "first two hunks overlapping");
    },

    testPatchStringFromRowsForReverse: function() {
        var patch, result, expected, patchString;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        patchString = "diff --git a/test.txt b/test.txt\n"
            + "index bb53c45..3b6c223 100644\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,5 +2,2 @@\n"
            + " a\n"
            + "-b\n"
            + "-c\n"
            + "-d\n"
            + " e\n";
        patch = lively.ide.FilePatch.read(patchString);
        result = patch.createPatchStringFromRows(6,8, true/*reverse*/); // -c,-d
        expected = "diff --git a/test.txt b/test.txt\n"
                 + "--- a/test.txt\n"
                 + "+++ b/test.txt\n"
                 + "@@ -2,4 +2,2 @@\n"
                 + " a\n"
                 + "-c\n"
                 + "-d\n"
                 + " e\n"
        this.assertEquals(expected, result, "1");

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        patchString = "diff --git a/test.txt b/test.txt\n"
            + "index bb53c45..3b6c223 100644\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,2 +2,5 @@\n"
            + " a\n"
            + "+b\n"
            + "+c\n"
            + "+d\n"
            + " e\n";
        patch = lively.ide.FilePatch.read(patchString);
        result = patch.createPatchStringFromRows(6,6, true/*reverse*/); // +c
        expected = "diff --git a/test.txt b/test.txt\n"
                 + "--- a/test.txt\n"
                 + "+++ b/test.txt\n"
                 + "@@ -2,4 +2,5 @@\n"
                 + " a\n"
                 + " b\n"
                 + "+c\n"
                 + " d\n"
                 + " e\n"
        this.assertEquals(expected, result, "2");

        patchString = "diff --git a/test.txt b/test.txt\n"
            + "index bb53c45..3b6c223 100644\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,2 +2,3 @@\n"
            + " a\n"
            + "-b1\n"
            + "+b2\n"
            + "+c\n";
        patch = lively.ide.FilePatch.read(patchString);
        result = patch.createPatchStringFromRows(6,6, true/*reverse*/); // +b2
        expected = "diff --git a/test.txt b/test.txt\n"
                 + "--- a/test.txt\n"
                 + "+++ b/test.txt\n"
                 + "@@ -2,2 +2,3 @@\n"
                 + " a\n"
                 + "+b2\n"
                 + " c\n";
        this.assertEquals(expected, result, "3");

        patchString = "diff --git a/test.txt b/test.txt\n"
            + "index bb53c45..3b6c223 100644\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,3 +2,3 @@\n"
            + " a\n"
            + "-b1\n"
            + "-c1\n"
            + "+b2\n"
            + "+c2\n";
        patch = lively.ide.FilePatch.read(patchString);
        result = patch.createPatchStringFromRows(6,7, true/*reverse*/); // -c1, +b2
        expected = "diff --git a/test.txt b/test.txt\n"
                 + "--- a/test.txt\n"
                 + "+++ b/test.txt\n"
                 + "@@ -2,3 +2,3 @@\n"
                 + " a\n"
                 + "-c1\n"
                 + "+b2\n"
                 + " c2\n";
        this.assertEquals(expected, result, "4");
    }

});

TestCase.subclass('lively.ide.tests.CommandLineInterface.AnsiColorParser',
'testing', {

    testParseSimpleColors: function() {
        var string = "hello\033[31mworld\033[0m",
            expectedTextSpec = {
                string: 'helloworld',
                ranges: [[0,5, {}], [5, 10, {color: Color.red}]]},
            result = lively.ide.CommandLineInterface.toStyleSpec(string);
        this.assertEqualState(expectedTextSpec, result);
    },

    testParseTwoTextAttributes: function() {
        var string = "hello\033[4;31mwor\033[44mld\033[0m",
            expectedTextSpec = {
                string: 'helloworld',
                ranges: [
                    [0, 5, {}],
                    [5,8, {textDecoration: 'underline', color: Color.red}],
                    [8,10, {textDecoration: 'underline', color: Color.red, backgroundColor: Color.blue}]]},
            result = lively.ide.CommandLineInterface.toStyleSpec(string);
        this.assertEqualState(expectedTextSpec, result);
    },

    testAnsiAttributesCanDealWithMissingEnd: function() {
        var string = "\033[31mhelloworld",
            expectedTextSpec = {
                string: 'helloworld',
                ranges: [[0,10, {color: Color.red}]]},
            result = lively.ide.CommandLineInterface.toStyleSpec(string);
        this.assertEqualState(expectedTextSpec, result);
    }
});

AsyncTestCase.subclass('lively.ide.tests.CommandLineInterface.RunServerShellProcess',
'testing', {
    testRunSimpleCommand: function() {
        var cmdString = 'echo 1', result = '',
            cmd = lively.ide.CommandLineInterface.run(cmdString,{}, function() { result += cmd.resultString(); });
        this.waitFor(function() { return cmd.isDone(); }, 10, function() {
            this.assertEquals('1', result);
            this.done();
        });
    },

    testRunTwoCommandsConcurrently: function() {
        var cmd1String = 'bash -c "sleep 0.2; echo 1"', cmd2String = 'bash -c "echo 2"', result = '',
            cmd1 = lively.ide.CommandLineInterface.run(cmd1String, function() { result += cmd1.resultString(); }),
            cmd2 = lively.ide.CommandLineInterface.run(cmd2String, function() { result += cmd2.resultString(); });
        this.waitFor(function() { return cmd1.isDone() && cmd2.isDone(); }, 10, function() {
            this.assertEquals('21', result);
            this.done();
        });
    },

    testRunGroupCommandsConsecutively: function() {
        // lively.ide.CommandLineInterface.commandQueue
        var cmd1String = 'bash -c "sleep 0.2; echo 1"', cmd2String = 'echo 2', result = '',
            cmd1 = lively.ide.CommandLineInterface.run(cmd1String, {group: this.currentSelector}, function() { result += cmd1.resultString(); }),
            cmd2 = lively.ide.CommandLineInterface.run(cmd2String, {group: this.currentSelector}, function() { result += cmd2.resultString(); });
        this.waitFor(function() { return cmd1.isDone() && cmd2.isDone(); }, 10, function() {
            this.assertEquals('12', result);
            this.done();
        });
    },

    testExecCommandSynchronous: function() {
        var result = lively.ide.CommandLineInterface.exec('expr 1 + 2', {sync:true}).resultString();
        this.assertEquals(3, result);
        this.done();
    },

    testExecCommandWithSettingEnvVar: function() {
        var result = lively.ide.CommandLineInterface.exec('echo $FOO', {sync:true, env: {FOO: 'bar'}}).resultString();
        this.assertEquals('bar', result);
        this.done();
    }
});

AsyncTestCase.subclass('lively.ide.tests.CommandLineInterface.RunPersistentCommand',
'testing', {
    testRunSimpleCommand: function() {
        var cmd = new lively.ide.CommandLineInterface.PersistentCommand('echo 1; sleep 0.5; echo 2', {});
        var result, listener = { onOut: function(out) { result = out; } };
        lively.bindings.connect(cmd, 'stdout', listener, 'onOut');
        cmd.start();
        this.delay(function() {
            this.assertEquals('1', result.trim());
        }, 200);
        this.delay(function() {
            this.assertEquals('2', result.trim());
            this.assert(cmd.isDone(), 'cmd is not done!');
            this.assertEquals(0, cmd.getCode(), 'code: ' + cmd.getCode());
            this.done();
        }, 700);
    }

});


TestCase.subclass("lively.ide.tests.CommandLineInterface.CommandLineSearch",
"running", {
    setUp: function()  {},
    tearDown: function()  {}
},
'testing', {
    testParseDirectoryListOutput: function() {
        var sut = lively.ide.CommandLineSearch;
        var tests = [{
            rootDirectory: null,
            string: "-rw-r-r-       1 robert   SAP_ALL\\Domain User       5298 Dec 17 14:04:02 2012 test.html",
            expected: [{
                mode: "-rw-r-r-",
                linkCount: 1,
                isLink: false,
                user: "robert",
                group: "SAP_ALL\\Domain User",
                size: 5298,
                lastModified: new Date('Dec 17 14:04:02 2012 GMT'),
                path: "test.html",
                fileName: "test.html",
                isDirectory: false
            }]
        }, {
            rootDirectory: null,
            string: "drwxrwxr-x  2 lively lively       4096 Aug 29 03:39 bin\n",
            expected: [{
                mode: "drwxrwxr-x",
                linkCount: 2,
                isLink: false,
                // linkTarget: undefined,
                user: "lively",
                group: "lively",
                size: 4096,
                lastModified: new Date('Aug 29 03:39 GMT'),
                path: "bin",
                fileName: "bin",
                isDirectory: true
            }]
        }];
        tests.forEach(function(spec) {
            var result = sut.parseDirectoryList(spec.string, spec.rootDirectory);
            this.assertEqualState(spec.expected, result);
        }, this);
    }
});

AsyncTestCase.subclass('lively.ide.tests.CommandLineInterface.SpellChecker',
'testing', {
    testCheckWord: function() {
        var suggestions;
        lively.ide.CommandLineInterface.SpellChecker.spellCheckWord('hrlp', function(err, result) {
            suggestions = result;
        });
        this.waitFor(function() { return !!suggestions; }, 10, function() {
            this.assert(suggestions.include('help'), 'suggestions ' + suggestions);
            this.done();
        });
    },
    testCheckCorrectWord: function() {
        lively.ide.CommandLineInterface.SpellChecker.spellCheckWord('checker', function(err, suggestions) {
            this.assertEquals(0, suggestions.length, 'suggestions ' + suggestions);
            this.done();
        }.bind(this));
    }
});

}) // end of module