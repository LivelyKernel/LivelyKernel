module('apps.DiffMatchPatch').requires().toRun(function() {

var libURL = URL.codeBase.withFilename('lib/diff_match_patch/diff_match_patch_uncompressed.js');
JSLoader.loadJs(libURL.toString(), null, true);

Object.extend(diff_match_patch.prototype,{

    diff_lineMode: function(text1, text2) {
        var dmp = new diff_match_patch();
        var a = dmp.diff_linesToChars_(text1, text2);
        var lineText1 = a[0];
        var lineText2 = a[1];
        var lineArray = a[2];

        var diffs = dmp.diff_main(lineText1, lineText2, false);

        dmp.diff_charsToLines_(diffs, lineArray);
        return diffs;
    },

    showDiffsIn: function(diffs, textMorph, insertAt) {
        insertAt = insertAt || 0;
        var string = "";
        for (var x = 0; x < diffs.length; x++) {
            string += diffs[x][1];
        }
        textMorph.insertTextStringAt(insertAt, string);
        // textMorph.unEmphasize(insertAt, insertAt + string.length - 1);

        var from = insertAt;
        for (var x = 0; x < diffs.length; x++) {
            var op = diffs[x][0],    // Operation (insert, delete, equal)
                data = diffs[x][1],  // Text of change.
                to =  from + data.length;
            switch (op) {
                case DIFF_INSERT:
                    textMorph.emphasize({color: 'green', textDecoration: 'underline'}, from, to);
                    break;
                case DIFF_DELETE:
                    textMorph.emphasize({color: 'red', textDecoration: 'line-through'}, from, to);
                    break;
                case DIFF_EQUAL:
                    break;
            }
            from = to;
        }
    }
})

}) // end of module