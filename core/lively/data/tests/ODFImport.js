module('lively.data.tests.ODFImport').requires('lively.data.ODFImport', 'lively.morphic.tests.Helper').toRun(function() {

TestCase.subclass("lively.data.tests.ODFImport.EnhancedGeometry",
"running", {
    setUp: function()  {
        this.interpreter = new lively.data.ODFImport.FormulaInterpreter();
    },
    tearDown: function()  {}
},
'testing', {
    testReadEnhancedGeometryWithFormula: function() {
        var interpreter = new lively.data.ODFImport.FormulaInterpreter(),
            xmlString = "<draw:enhanced-geometry\n"
        	          + ' xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"'
        	          + ' xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"'
                      + " svg:viewBox=\"0 0 1000 500\"\n"
                      + " draw:modifiers=\"0 10\">\n"
                      + " <draw:equation draw:name=\"f0\" draw:formula=\"($0 + right) / 2\"/>\n"
                      + " <draw:equation draw:name=\"f1\" draw:formula=\"($1 + bottom) / 2\"/>\n"
                      + " <draw:equation draw:name=\"f2\" draw:formula=\"2*(bottom - top) / 3\"/>\n"
                      + "</draw:enhanced-geometry>",
            xml = stringToXML(xmlString),
            state = {enhancedGeometryXML: xml};
        this.assertEquals(1000, interpreter.width(state), 'width');
        this.assertEquals(0, interpreter.eval(state, ["modifier", "0"]), "modifier 1");
        this.assertEquals(10, interpreter.eval(state, ["modifier", "1"]), "modifier 2");
        this.assertEquals(500, interpreter.eval(state, ['function', 'f0']), "function 1");
        this.assertEquals(255, interpreter.eval(state, ["function", "f1"]), "function 2");
        this.assertEquals(333.3333333333333, interpreter.eval(state, ["function", "f2"]), "function 3");
        this.assertEquals(
            'M 0 1000 L 0 10 1000 1000 Z N M 0 1000 L 500 255 F N',
            interpreter.evalPath(state, 'M 0 1000 L $0 $1 1000 1000 Z N M 0 1000 L ?f0 ?f1 F N'), "path");
    }
});

}) // end of module