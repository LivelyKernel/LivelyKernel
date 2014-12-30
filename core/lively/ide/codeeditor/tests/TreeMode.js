/*global describe, it, expect*/
module('lively.ide.codeeditor.modes.tests.TreeMode').requires('lively.ide.codeeditor.modes.TextTree', 'lively.MochaTests').toRun(function() {

describe("lively.ide.codeeditor.modes.TextTree", function() {

  var sut = lively.ide.codeeditor.modes.TextTree;
  var tree = "row0\n"
           + "|-row1\n"
           + "|-row-2\n"
           + "| |-row3\n"
           + "| \\-row4\n"
           + "|   \\-row5\n"
           + "|-row6\n"
           + "| \\-row7\n"
           + "\\-row8";

  it('extracts row text', function() {
    expect(sut.itemTextOfRow(tree, 5)).equals("row5");
  });

  it.only('finds parent row', function() {
    expect(sut.parentRowOfRow(tree, 5)).equals(4);
    expect(sut.parentRowOfRow(tree, 6)).equals(0);
    expect(sut.parentRowOfRow(tree, 0)).equals(0);
    expect(sut.parentRowOfRow(tree, 4)).equals(2);
  });

  it('extracts parent row text', function() {
    expect(sut.parentItemTextOfRow(tree, 5)).equals("row4");
    expect(sut.parentItemTextOfRow(tree, 6)).equals("row0");
  });

  it('finds path to root', function() {
    expect(sut.rootPathFromRow(tree, 5)).deep.equals(["row0", "row-2", "row4", "row5"]);
  });

});

}) // end of module
