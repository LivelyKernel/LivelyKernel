module('lively.morphic.tests.DraggableJavaScript').requires('lively.morphic.DraggableJavaScript', 'lively.TestFramework').toRun(function() {

function applyChange(string, change) {
  if (change.action === "insert") {
    return string.slice(0, change.start)
         + change.lines.join("\n")
         + string.slice(change.start);
  } else if (change.action === "remove") {
      return string.slice(0, change.start)
           + string.slice(change.end);
  }
  return string;
}

function applyChanges(string, changes) {
  return changes.reduce(applyChange, string);
}
  
TestCase.subclass('lively.morphic.tests.DraggableJavaScript.DropJS',
"testing", {

  testCreatesInsertionForProperty: function()  {
    var m = new lively.morphic.Box(rect(0,0,10,20));
    var prop = lively.morphic.Property.propertyFor(m, "extent");
    var dropjs = lively.morphic.DraggableJavaScript.DropJS.forProperty(prop);

    var gen1 = dropjs.generateCode({addReceiver: false, get: true});
    this.assertEquals("getExtent()", gen1, "1");

    var gen2 = dropjs.generateCode({addReceiver: true, get: true, context: m});
    this.assertEquals("this.getExtent()", gen2, "2");

    var gen3 = dropjs.generateCode({addReceiver: false, set: true, args: [pt(10,10), "foo"]});
    this.assertEquals('setExtent(pt(10.0,10.0), "foo")', gen3, "3");

    var gen4 = dropjs.generateCode({addReceiver: false, set: true, args: []});
    this.assertEquals('setExtent()', gen4, "4");

    var gen5 = dropjs.generateCode({addReceiver: false, set: true});
    this.assertEquals('setExtent(pt(10.0,20.0))', gen5, "5");
  },

  testCreatesInsertionForMethod: function()  {
    var m = new lively.morphic.Box(rect(0,0,10,20));
    var method = lively.morphic.Method.methodFor(m, "moveBy", [pt(10,5)]);
    var dropjs = lively.morphic.DraggableJavaScript.DropJS.forProperty(method);

    var gen1 = dropjs.generateCode({addReceiver: false});
    this.assertEquals("moveBy(pt(10.0,5.0))", gen1, "1");

    var gen2 = dropjs.generateCode({addReceiver: true, context: m});
    this.assertEquals("this.moveBy(pt(10.0,5.0))", gen2, "2");

    var gen3 = dropjs.generateCode({dontCall: true});
    this.assertEquals("moveBy", gen3, "3");
  },

  testCreatesInsertionForArbitraryCode: function()  {
    var dropjs = lively.morphic.DraggableJavaScript.DropJS.forCode(
      "for (var i = 0; i < 10; i++) i;", {type: "Statement"});

    var gen1 = dropjs.generateCode();
    this.assertEquals("for (var i = 0; i < 10; i++) i;", gen1, "1");

    var gen2 = dropjs.generateCode({replacements: [{path: "body[0].init.declarations[0].init", code: "5"}]});
    this.assertEquals("for (var i = 5; i < 10; i++) i;", gen2, "2");
  },

  testOneDropIntoAnother: function()  {
    var djs = lively.morphic.DraggableJavaScript.DropJS;

    var dropjs1 = djs.forCode("for (var i = 0; i < 10; i++) i;");
    var gen1 = dropjs1.insertAndGenerateCode(djs.forCode("3 + 4"), {at: 13});
    this.assertEquals("for (var i = 3 + 4; i < 10; i++) i;", gen1, "1");

    // lively.ast.printAst("foo.bar(x);", {printPositions: true})
    var dropjs2 = djs.forCode("foo.bar();");
    var gen2 = dropjs2.insertAndGenerateCode(djs.forCode("3 + 4"), {at: 8});
    this.assertEquals("foo.bar(3 + 4);", gen2, "2");

    var dropjs3 = djs.forCode("foo.bar(3, 4);");
    var gen3 = dropjs3.insertAndGenerateCode(djs.forCode("3 + 4"), {at: 12});
    this.assertEquals("foo.bar(3, 3 + 4);", gen3, "3");

    var dropjs4 = djs.forCode("foo.bar(3, 4);");
    var gen4 = dropjs4.insertAndGenerateCode(djs.forCode("3 + 4"), {at: 12, addArgument: true});
    this.assertEquals("foo.bar(3, 4, 3 + 4);", gen4, "4");

    var dropjs5 = djs.forCode("3 + 99");
    var gen5 = dropjs5.insertAndGenerateCode(djs.forCode("3"), {at: 4});
    this.assertEquals("3 + 3", gen5, "5");

    var dropjs5 = djs.forCode("3 + 99");
    var gen6 = dropjs5.insertAndGenerateCode(djs.forCode("for (var i = 0; i < 10; i++) i;"), {at: 4});
    this.assertEquals("3 + 99\nfor (var i = 0; i < 10; i++) i;", gen6, "6");
  },

  testApplyDrop: function()  {
    var djs = lively.morphic.DraggableJavaScript.DropJS;

    var dropjs1 = djs.forCode("for (var i = 0; i < 10; i++) i;");
    var gen1 = applyChanges(dropjs1.getCode(), dropjs1.applyDropOp(djs.forCode("3 + 4"), {type: "replace", as: "Argument", replaceNodeIndex: 1}));
    this.assertEquals("for (var i = 3 + 4; i < 10; i++) i;", gen1, "1");

    var dropjs2 = djs.forCode("foo.bar();");
    var gen2 = applyChanges(dropjs2.getCode(), dropjs2.applyDropOp(djs.forCode("3 + 4"), {type: "splice", as: "Argument", at: 8, parentNodeIndex: 3}));
    this.assertEquals("foo.bar(3 + 4);", gen2, "2");

    var dropjs3 = djs.forCode("foo.bar(3, 4);");
    var gen3 = applyChanges(dropjs3.getCode(), dropjs3.applyDropOp(djs.forCode("3 + 4"), {type: "replace", as: "Argument", replaceNodeIndex: 4}));
    this.assertEquals("foo.bar(3, 3 + 4);", gen3, "3");

    var dropjs4 = djs.forCode("foo.bar(3, 4);");
// lively.debugNextMethodCall(dropjs4, "applyDropOp")
    var gen4 = applyChanges(dropjs4.getCode(), dropjs4.applyDropOp(djs.forCode("3 + 4"), {type: "splice", as: "Argument", at: 12, parentNodeIndex: 3}));
    this.assertEquals("foo.bar(3, 4, 3 + 4);", gen4, "4");

    var dropjs5 = djs.forCode("3 + 99");
    var gen5 = applyChanges(dropjs5.getCode(), dropjs5.applyDropOp(djs.forCode("3"), {type: "replace", as: "Argument", replaceNodeIndex: 1}));
    this.assertEquals("3 + 3", gen5, "5");

    lively.ast.printAst("3 + 99", {printIndex: true, printPositions: true})
    var dropjs6 = djs.forCode("3 + 99");
    var gen6 = applyChanges(dropjs6.getCode(), dropjs6.applyDropOp(djs.forCode("for (var i = 0; i < 10; i++) i;\n"), {type: "splice", as: "Statement", at: 6, parentNodeIndex: 4}));
    this.assertEquals("3 + 99\nfor (var i = 0; i < 10; i++) i;\n", gen6, "6");
  },

  testFindDropOperations: function()  {
    var djs = lively.morphic.DraggableJavaScript.DropJS;
    var droppable = djs.forCode("7");

    var dropOps = djs.forCode("3; 4;").findDropOperations(droppable);
    this.assertEqualState(
      [{at: 0, type: "splice", as: "Statement", parentNodeIndex: 4},
       {at: 2, type: "splice", as: "Statement", parentNodeIndex: 4},
       {at: 3, type: "splice", as: "Statement", parentNodeIndex: 4},
       {at: 5, type: "splice", as: "Statement", parentNodeIndex: 4}], dropOps, "1");

    var code = "function foo() { return 3 + 4; }";
    var ast = lively.ast.parse(code).body[0]
    var dropOps = djs.forCode(code).findDropOperations(droppable, {ast: ast, dropType: "Statement"});
    this.assertEqualState(
      [{at: 17, type: "splice", as: "Statement", parentNodeIndex: 5}], dropOps, "2");

    var code = "function foo() { return 3 + 4; }";
    var dropOps = djs.forCode(code).findDropOperations(droppable, {dropType: "Statement"});
    this.assertEqualState(
      [{at: 0, type: "splice", as: "Statement", parentNodeIndex: 7},
      {at: 32, type: "splice", as: "Statement", parentNodeIndex: 7}], dropOps, "3");

    var code = "function foo() { return 3 + 4; }";
    var ast = lively.ast.parse(code).body[0];
    var dropOps = djs.forCode(code).findDropOperations(droppable, {ast: ast, dropType: "Argument"});
    this.assertEqualState([
      {type: "replace", as: "Argument", replaceNodeIndex: 3},
      {type: "replace", as: "Argument", replaceNodeIndex: 1},
      {type: "replace", as: "Argument", replaceNodeIndex: 2},
    ], dropOps, "4");

    var code = "function foo() { return; }";
    var ast = lively.ast.parse(code).body[0];
    var dropOps = djs.forCode(code).findDropOperations(droppable, {ast: ast, dropType: "Argument"});
    this.assertEqualState([{type: "insert", as: "Argument", parentNodeIndex: 1, property: "argument"}], dropOps, "5");
    
    var code = "foo.bar(23);";
    var dropOps = djs.forCode(code).findDropOperations(droppable, {dropType: "Argument"});
    // lively.ast.printAst(code, {printIndex: true})
    this.assertEqualState([
      {type: "replace", as: "Argument", replaceNodeIndex: 3},
    ], dropOps, "6");

    var code = "foo.bar();";
    var dropOps = djs.forCode(code).findDropOperations(droppable, {dropType: "Argument"});
            // show("%o", dropOps)
    this.assertEqualState([{at: 8, type: "splice", as: "Argument", parentNodeIndex: 3}], dropOps, "7");
  }

});

AsyncTestCase.subclass('lively.morphic.tests.DraggableJavaScript.DocDropProcess',
"helper", {

  withEditorDo: function(code, doFunc) {
    var e = new lively.morphic.CodeEditor(rect(0,0,400, 400), code);
    e.openInWorld();
    this.onTearDown(function() { e.remove(); });
    var self = this;
    lively.lang.fun.waitFor(
      function() { return e.getSession() && e.getSession().$ast; },
      function() {
        try {
          doFunc.call(self, e);
        } catch (e) { self.addAndSignalFailure(e); self.done(); }
      });
  },
},
"testing", {

  testCodeEditorDragPreviews: function()  {
    var djs = lively.morphic.DraggableJavaScript.DropJS;
    var code = "this.foo(23);\n";
    this.withEditorDo(code, function(e) {
      // e=that

      var doc = lively.morphic.DraggableJavaScript.DroppableDocument.from(e);
      var bounds = e.rangeToGlobalMorphicBounds(e.find({needle: "23", start: {row: 0, column: 0}, preventScroll: true}));
      var dropOps = doc.findDropOperations(djs.forCode("3 + 4"), bounds.center(), true);

      this.assertEqualState(
        [{as: "Argument", indexInDocument: 10, replaceNodeIndex: 3, type: "replace"},
         {as: "Statement", at: 13, indexInDocument: 13, parentNodeIndex: 6, type: "splice"},
         {as: "Statement", at: 0, indexInDocument: 0, parentNodeIndex: 6, type: "splice"}],
        dropOps, "1: insertion of expression");

      e.textString = "this.foo(bar(23));\n";
      this.delay(function() {
        var doc = lively.morphic.DraggableJavaScript.DroppableDocument.from(e);
        var bounds = e.rangeToGlobalMorphicBounds(e.find({needle: "23", start: {row: 0, column: 0}, preventScroll: true}));
        var dropOps = doc.findDropOperations(djs.forCode("3 + 4"), bounds.center(), true);
    
        this.assertEqualState(
          [{as: "Statement", at: 13, indexInDocument: 13, parentNodeIndex: 6, type: "splice"},
           {as: "Argument", indexInDocument: 10, replaceNodeIndex: 3, type: "replace"},
           {as: "Statement", at: 0, indexInDocument: 0, parentNodeIndex: 6, type: "splice"}],
          dropOps, "2: insertion of expression");
          
        this.done();
      }, 100);

      // e.textString = "function foo(a, b) {\n  return 23;\n}\n"
      // var doc = lively.morphic.DraggableJavaScript.DroppableDocument.from(e);
      // var bounds = globalBoundsOfRange(e, e.find({needle: "23", start: {row: 0, column: 0}, preventScroll: true}));
      // var dropOps = doc.findDropOperations(djs.forCode("3 + 4"), bounds.center(), true);
      // this.assertEqualState(
      //   [{as: "Argument", at: 13, indexInDocument: 13, parentNodeIndex: 6, type: "splice"},
      //   {as: "Statement", at: 21, indexInDocument: 23, parentNodeIndex: 6, type: "splice"}],
      //   dropOps, "2: insertion of expression inside of function")

//       this.assertEquals("this.foo(3 + 4);\n", e.textString, "1: insertion of expression");
//       doc.showInsertionPreview(djs.forCode("22"), bounds.topLeft());
//       this.assertEquals("this.foo(22);\n", e.textString, "1: re-insertion");
//       doc.revert();
//       this.assertEquals("this.foo(23);\n", e.textString, "1: revert");

//       // as callee
//       bounds = globalBoundsOfRange(e, e.getLineRange(0));
//       doc.showInsertionPreview(djs.forCode("22"), bounds.topLeft());
//       this.assertEquals("22.foo(23);\n", e.textString, "2: ast callee");

//       // statement, restricted
//       doc.showInsertionPreview(djs.forCode("for (var i = 0; i < 10; i++) i"), bounds.topLeft(), true);
//       this.assertEquals("this.foo(23);\nfor (var i = 0; i < 10; i++) i", e.textString, "3: before");
//       // doc.showInsertionPreview(djs.forCode("for (var i = 0; i < 10; i++) i"), bounds.topRight());
//       // this.assertEquals("this.foo(23);\nfor (var i = 0; i < 10; i++) i", e.textString, "3: after");

//       // as arg, restricted
//       bounds = globalBoundsOfRange(e, e.getLineRange(0));
//       // djs.forCode("bar").getNode().type
// // lively.debugNextMethodCall(lively.morphic.DraggableJavaScript.DroppableDocument.prototype, "insertionPointsForArgument")
//       doc.showInsertionPreview(djs.forCode("bar"), bounds.topLeft(), true);
//       this.assertEquals("this.foo(bar);\n", e.textString, "4: arg insert");



    });
    
  },

});

}) // end of module
