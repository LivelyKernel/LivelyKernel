module('lively.ide.tests.GitInterface').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ide.tests.GitInterface.Differ',
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
            + " hello world\n"            // <-- out
            + "-this lines is removed\n"  // <-- out
            + "+this lines is added\n"  // <-- out
            + "+this line as well\n" // <-- in
            + " foo bar baz\n"       // <-- in
            + " har har har";        // <-- in
        var hunk = new lively.ide.FilePatchHunk().read(origHunk.split('\n'));
        var result, expected;

        // at end
        result = hunk.createPatchStringFromRows(4,6);
        expected = "@@ -4,2 +4,3 @@\n"
            + "+this line as well\n"
            + " foo bar baz\n"
            + " har har har";
        this.assertEquals(expected, result);
        
        // add and remove
        result = hunk.createPatchStringFromRows(2,3);
        expected = "@@ -3,1 +3,1 @@\n"
            + "-this lines is removed\n"
            + "+this lines is added"
            this.assertEquals(expected, result);

        // just add
        result = hunk.createPatchStringFromRows(3,3);
        expected = "@@ -4,0 +4,1 @@\n"
            + "+this lines is added"
            this.assertEquals(expected, result);
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
        expected = "diff --git a/test.txt b/test.txt\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,0 +2,0 @@\n"
        this.assertEquals(expected, result);

        // just the hunk header and one context line
        result = patch.createPatchStringFromRows(3,4);
        expected = "diff --git a/test.txt b/test.txt\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,1 +2,1 @@\n"
            + " of the world's largest, open, production economies. Even with a market\n";
        this.assertEquals(expected, result);

        // first hunk
        result = patch.createPatchStringFromRows(3,7);
        expected = "diff --git a/test.txt b/test.txt\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -2,3 +2,3 @@\n"
            + " of the world's largest, open, production economies. Even with a market\n"
            + "-capitalization of $2.5 billion, the bitcoin economy is dwarfed by $15 trillion\n"
            + "+capitalization of $2.5 billion, the bitcoin economy is dwarfed hey by $15 trillion\n"
            + " economies such as the U.S. Therefore, sudden and large increases in the user\n"
        this.assertEquals(expected, result);

        // first two hunks overlapping
        result = patch.createPatchStringFromRows(6, 10);
        expected = "diff --git a/test.txt b/test.txt\n"
            + "--- a/test.txt\n"
            + "+++ b/test.txt\n"
            + "@@ -4,1 +4,2 @@\n"
            + "+capitalization of $2.5 billion, the bitcoin economy is dwarfed hey by $15 trillion\n"
            + " economies such as the U.S. Therefore, sudden and large increases in the user\n"
            + "@@ -20,1 +20,2 @@\n"
            + " diff could be considered invalid and be rejected. Optionally, the hunk range\n"
            + "+123\n"
        this.assertEquals(expected, result);
    }

})

}) // end of module