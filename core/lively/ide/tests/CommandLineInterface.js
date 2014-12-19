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
    },

    testGetChangedLines: function() {
      var diff = "Index: no file\n"
               + "===================================================================\n"
               + "--- no file\n"
               + "+++ no file\n"
               + "@@ -97,9 +97,7 @@\n"
               + " 96\n"
               + "-97\n"
               + " 98\n"
               + " 99\n"
               + "-100\n"
               + " 101\n"
               + " 102\n"
               + " 103\n"
               + " 104\n"
               + "@@ -197,9 +195,11 @@\n"
               + " 196\n"
               + " 197\n"
               + " 198\n"
               + " 199\n"
               + "+XXX\n"
               + "+YYY\n"
               + "+ZZZ\n"
               + "-200\n"
               + " 201\n"
               + " 202\n"
               + " 203\n"
               + " 204\n"
               + "@@ -297,9 +297,9 @@\n"
               + " 296\n"
               + " 297\n"
               + " 298\n"
               + " 299\n"
               + "+300X\n"
               + "-300\n"
               + " 301\n"
               + " 302\n"
               + " 303\n"
               + " 304\n";

        var patch = lively.ide.FilePatch.read(diff);
        var lines = patch.changesByLines();
        var expected = [
          {lineNoRemoved: 98, lineNoAdded: 98, removed: "97\n", added: ""},
          {lineNoRemoved: 100, lineNoAdded: 100, removed: "100\n", added: ""},
          {lineNoRemoved: 201, lineNoAdded: 199, removed: "200\n", added: "XXX\nYYY\nZZZ\n"},
          {lineNoRemoved: 301, lineNoAdded: 301, removed: "300\n", added: "300X\n"}
        ]
        this.assertEqualState(expected, lines);
    },

    testSuccessfulPatch: function() {
      var diff = "Index: no file\n"
               + "===================================================================\n"
               + "--- no file\n"
               + "+++ no file\n"
               + "@@ -97,9 +97,7 @@\n"
               + " 96\n"
               + "-97\n"
               + " 98\n"
               + " 99\n"
               + "-100\n"
               + " 101\n"
               + " 102\n"
               + " 103\n"
               + " 104\n"
               + "@@ -197,9 +195,11 @@\n"
               + " 196\n"
               + " 197\n"
               + " 198\n"
               + " 199\n"
               + "+XXX\n"
               + "+YYY\n"
               + "+ZZZ\n"
               + "-200\n"
               + " 201\n"
               + " 202\n"
               + " 203\n"
               + " 204\n"
               + "@@ -297,9 +297,9 @@\n"
               + " 296\n"
               + " 297\n"
               + " 298\n"
               + " 299\n"
               + "+300X\n"
               + "-300\n"
               + " 301\n"
               + " 302\n"
               + " 303\n"
               + " 304\n";

        var patch = lively.ide.FilePatch.read(diff),
            a = Array.range(0,400).join("\n") + "\n",
            b = a.replace("\n97\n", "\n")
                 .replace("\n100\n", "\n")
                 .replace("\n200\n", "\nXXX\nYYY\nZZZ\n")
                 .replace("\n300\n", "\n300X\n"),
            result = patch.patch(a);
        this.assertEquals(b, result);
    },

    testUnsuccessfulPatch: function() {
      var diff = "Index: no file\n"
               + "===================================================================\n"
               + "--- no file\n"
               + "+++ no file\n"
               + "@@ -97,9 +97,7 @@\n"
               + " 96\n"
               + "-97\n"
               + " 98\n"
               + " 99\n"
               + "-100\n"
               + " 101\n"
               + " 102\n"
               + " 103\n"
               + " 104\n"
               + "@@ -197,9 +195,11 @@\n"
               + " 196\n"
               + " 197\n"
               + " 198\n"
               + " 199\n"
               + "+XXX\n"
               + "+YYY\n"
               + "+ZZZ\n"
               + "-AAA\n"
               + " 201\n"
               + " 202\n"
               + " 203\n"
               + " 204\n"
               + "@@ -297,9 +297,9 @@\n"
               + " 296\n"
               + " 297\n"
               + " 298\n"
               + " 299\n"
               + "+300X\n"
               + "-300\n"
               + " 301\n"
               + " 302\n"
               + " 303\n"
               + " 304\n";

        var patch = lively.ide.FilePatch.read(diff),
            a = Array.range(0,400).join("\n") + "\n";
        try { patch.patch(a); } catch (e) {
            this.assertEquals("Change 3 not matching: Expected \"AAA\", got \"200\"", e.message);
            return;
        }
        this.assert(false, "patch successful?");
    },

    testPrintDiffReverse: function() {
        var orig = Array.range(0,10).join("\n") + "\n";
        var changed = orig.replace("\n5\n", "\nHello\nWorld\n");
        var diff = "Index: foo\n"
                   + "--- foo\n"
                   + "+++ foo\n"
                   + "@@ -2,9 +2,10 @@\n"
                   + " 1\n"
                   + " 2\n"
                   + " 3\n"
                   + " 4\n"
                   + "+Hello\n"
                   + "+World\n"
                   + "-5\n"
                   + " 6\n"
                   + " 7\n"
                   + " 8\n"
                   + " 9\n"

        var reverseDiff = "Index: foo\n"
                        + "--- foo\n"
                        + "+++ foo\n"
                        + "@@ -2,10 +2,9 @@\n"
                        + " 1\n"
                        + " 2\n"
                        + " 3\n"
                        + " 4\n"
                        + "-Hello\n"
                        + "-World\n"
                        + "+5\n"
                        + " 6\n"
                        + " 7\n"
                        + " 8\n"
                        + " 9\n"

        var patch = lively.ide.FilePatch.read(diff);
        // lively.ide.diff(orig, changed)
        // lively.ide.diff(changed, orig)

        var resultForward = patch.createPatchString();
        this.assertEquals(diff, resultForward, "normal diff");

        var resultReverse = patch.createPatchString(true)
        this.assertEquals(reverseDiff, resultReverse, "reverse");

    },

    testSuccessfulPatchReverse: function() {
        var orig = Array.range(0,10).join("\n") + "\n";
        var changed = orig.replace("\n5\n", "\nHello\nWorld\n");
        var diff = "Index: foo\n"
                   + "--- foo\n"
                   + "+++ foo\n"
                   + "@@ -2,9 +2,10 @@\n"
                   + " 1\n"
                   + " 2\n"
                   + " 3\n"
                   + " 4\n"
                   + "+Hello\n"
                   + "+World\n"
                   + "-5\n"
                   + " 6\n"
                   + " 7\n"
                   + " 8\n"
                   + " 9\n"

        var patch = lively.ide.FilePatch.read(diff).reverse(),
            result = patch.patch(changed);
        this.assertEquals(orig, result);
    },
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

AsyncTestCase.subclass('lively.ide.tests.CommandLineInterface.RunCommand',
'running', {
    setUp: function($super) {
        $super();
        lively.ide.CommandLineInterface.history.setId("cmd-history-" + this.currentSelector);
    },
    tearDown: function($super) {
        $super();
        lively.ide.CommandLineInterface.history.clear();
        lively.ide.CommandLineInterface.history.setDefaultId();
    }
},
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
    },

    testInterface: function() {
        var cmdString = 'echo 4; sleep 0.1; echo 2', result = '',
            cmd = lively.ide.CommandLineInterface.run(cmdString,{}, function() { result += cmd.resultString(); });
        this.waitFor(function() { return cmd.isDone(); }, 10, function() {
            this.assertEquals('4\n2', result);
            this.done();
        });
    },

    testRead: function() {
        this.onTearDown(function() { cmd.isRunning() && cmd.kill(); });
        var cmdString = 'echo "Enter stuff:"; read input; echo "input was $input"', result = '',
            cmd = lively.ide.CommandLineInterface.run(cmdString,{}, function() {});
        this.delay(function() {
            this.assertEquals("Enter stuff:", cmd.getStdout().trim());
            cmd.write('aha\n');
        }, 250);
        this.waitFor(function() { return cmd.isDone(); }, 10, function() {
            this.assertEquals("Enter stuff:\ninput was aha", cmd.resultString());
            this.done();
        });
    },

    testCommandsAreRecordedInHistory: function() {
        var t = Date.now(),
            cmd1 = lively.ide.CommandLineInterface.run('echo 1', {addToHistory: true, }),
            cmd2 = lively.ide.CommandLineInterface.run('echo 2', {addToHistory: true, group: 'test'});
            cmd2 = lively.ide.CommandLineInterface.run('echo 3', {addToHistory: false, group: 'test'});
        this.waitFor(function() { return cmd1.getStdout().trim() && cmd2.getStdout().trim(); }, 10, function() {
            var hist = lively.ide.CommandLineInterface.history.getCommands();
            this.assertMatches([
                {group: null, commandString: "echo 1"},
                {group: "test", commandString: "echo 2"}], hist);
            this.done();
        })
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

AsyncTestCase.subclass('lively.ide.tests.CommandLineInterface.RemoteShellExecute',
'running', {
    setUp: function($super) {
        $super();

        // 1. Prepare fake nslookup
        var nslookupTable = this.nslookupTable = {};
        var shellRun = this.origShellRun = lively.shell.run;
        lively.shell.run = function(cmd, options, callback) {
            if (cmd.startsWith("nslookup")) {
                var addr = cmd.match(/nslookup\s+(.*)$/)[1];
                var c = new lively.ide.CommandLineInterface.PersistentCommand(cmd, options);
                Object.extend(c, {_code: 0,_done: true, _stdout: nslookupTable[addr], _stderr: ""});
                callback(c);
            } else return shellRun.call(lively.shell, cmd, options, callback);
        };

        // 2. Prepare fake l2l runShellCommand
        var sess = lively.net.SessionTracker.getSession();
        var sendTo = this.origSendTo = sess.sendTo;
        var l2lReceiver = this.l2lReceiver = {};
        sess.sendTo = function(id, action, data, callback) {
            if (l2lReceiver[id]) l2lReceiver[id].call(sess, id, action, data, callback);
            else sendTo.call(sess, id, action, data, callback);
        };

        // 3. Prepare fake getSession results
        var fakeTrackers = this.fakeTrackers = [];
        var withTrackerSessionsDo = this.origWithTrackerSessionsDo = lively.net.tools.Functions.withTrackerSessionsDo;
        lively.net.tools.Functions.withTrackerSessionsDo = function(localSess, callback) {
            withTrackerSessionsDo.call(lively.net.tools.Functions, localSess, function(err, trackers) {
                callback(err, trackers ? trackers.concat(fakeTrackers) : trackers); });
        };
    },

    tearDown: function($super) {
        $super();
        lively.shell.run = this.origShellRun;
        var sess = lively.net.SessionTracker.getSession();
        sess.sendTo = sess.constructor.prototype.sendTo;
        lively.net.tools.Functions.withTrackerSessionsDo = this.origWithTrackerSessionsDo;
    }

},
'testing', {

    testExecuteRemoteShellCommand: function() {
        this.setMaxWaitDelay(2000);
        var test = this;

        // 1. fake domain - ip mapping
        this.nslookupTable['foo.bar.com'] = "Server:		74.207.241.5\n"
                                           + "Address:	74.207.241.5#53\n"
                                           + "\n"
                                           + "Non-authoritative answer:\n"
                                           + "Name:	foo.bar.com\n"
                                           + "Address: 123.456.0.789\n";

        // 2. fake get session result (get a "tracker" session for the fake ip)
        this.fakeTrackers.push({
          id: "tracker-A111111-000-000-000-123456789012",
          location: {}, remoteAddress: "123.456.0.789", type: "tracker"});

        // 3. l2lReceiver
        this.l2lReceiver["tracker-A111111-000-000-000-123456789012"] = function(id, action, data, callback) {
            callback({expectMoreResponses: true, data: {pid: 321}})
            callback({expectMoreResponses: true, data: {stdout: "foo"}})
            callback({expectMoreResponses: true, data: {stdout: "bar"}})
            callback({expectMoreResponses: false, data: 1})
        };

        // Now run the actual test
        lively.shell.run("ls -l", {server: "foo.bar.com"}, function(err, cmd) {
            test.assertEquals(1, cmd.getCode());
            test.assertEquals("foobar", cmd.getStdout());
            test.done();
        });
    }

});

}) // end of module
