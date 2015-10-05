module('lively.persistence.tests.MorphicProperties').requires('lively.persistence.MorphicProperties', 'lively.TestFramework').toRun(function() {

TestCase.subclass("lively.persistence.tests.MorphicProperties.PropertyTest",
"testing", {

  test01PositionProperty: function() {
    var m = lively.morphic.Morph.makeRectangle(10,30,100,20);
    var prop = lively.morphic.Property.propertyFor(m, "position");
    this.assertEquals(pt(10,30), prop.value);
    prop.value = pt(50,100);
    this.assertEquals(pt(50, 100), m.getPosition());
    this.assertEquals("getPosition()", prop.getterExpr());
    this.assertEquals("setPosition(pt(50.0,100.0))", prop.setterExpr());
    this.assertEquals("setPosition(foo)", prop.setterExpr("foo"));
    this.assertIdentity(m, prop.target);
  }

});

TestCase.subclass("lively.persistence.tests.MorphicProperties.MethodTest",
"testing", {

  test01MethodInvocation: function() {
    var obj = {counter: 0, m: function(x) { this.counter++; this.lastArg = x; }};
    var method = lively.morphic.Method.methodFor(obj, "m", [23]);

    method.run();
    this.assertEquals(1, obj.counter);
    this.assertEquals(23, obj.lastArg);

    method.setArgs([99]);
    method.run();
    this.assertEquals(2, obj.counter);
    this.assertEquals(99, obj.lastArg);
  },

  test01MethodPrinting: function() {
    var obj = {counter: 0, m: function(x) { this.counter++; this.lastArg = x; }};
    var method = lively.morphic.Method.methodFor(obj, "m", [23]);

    this.assertEquals("unknownObject.m(45)", method.printWithArgsAndReceiver([45]).pluck("0").join(""));
    method.target.addOptions({referenceExpression: "obj"});
    this.assertEquals("obj.m(23)", method.printWithArgsAndReceiver().pluck("0").join(""));
    method.target.addOptions({referenceExpression: null});
    obj.generateReferenceExpression = function() { return "foo"; };
    this.assertEquals("foo.m(23)", method.printWithArgsAndReceiver().pluck("0").join(""));
  }

});

}) // end of module
