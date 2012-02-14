
/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module('cop.LayersTest').requires('cop.Layers', 'lively.TestFramework', 'cop.CopBenchmark').toRun(function(thisModule) {


// COP Example from: Hirschfeld, Costanza, Nierstrasz. 2008. Context-oriented Programming. JOT)
var copExample = function() { 

cop.create("AddressLayer");
cop.create("EmploymentLayer");


Object.subclass('cop.example.Person', {
    
    initialize: function(newName, newAddress, newEmployer) {
        this.name = newName;
        this.address = newAddress;
        this.employer = newEmployer;
    },
    
    print: function() {
        return "Name: " + this.name;
    },
    
    AddressLayer$print: function() {
        return cop.proceed() + "; Address: " + this.address;
    },
    
    EmploymentLayer$print: function() {
        return cop.proceed() + "; [Employer] " + this.employer.print();
    },
    
    toString: function() {
        return "Person: " + this.name;
    },

}); 


Object.subclass('cop.example.Employer', {
    
    initialize: function(newName, newAddress) {
        this.name = newName;
        this.address = newAddress;
    },
    
    print: function() {
        return "Name: " + this.name;
    },
    
    toString: function() {
        return "Employer: " + this.name;
    },
});

AddressLayer.refineClass(cop.example.Employer, {
    print: function() {
        return cop.proceed() + "; Address: " + this.address;
    },
});

};

cop.create("DummyLayer");
cop.create("DummyLayer2");
cop.create("DummyLayer3");


Object.subclass('cop.example.DummyClass', {
    initialize: function() {
        this.e = "Hello";
        this.m = "Hello";
        this.execution = [] 
    },
    f: function(a, b) {
        this.execution.push("d.f");
        // console.log("execute default f(" + a, ", " + b + ")");
        return 0; 
    },
    DummyLayer$f: function(a, n) {
        this.execution.push("ld.f");
        //console.log("execute dummy layer f(" + a, ", " + b + ")");
        return cop.proceed() + 100;
    },
    
    DummyLayer2$f: function(a, n) {
        this.execution.push("ld2.f");
        return cop.proceed() + 1000;
    },
    
    get DummyLayer$e() {
        return this._DummyLayer_e;
    },
    set DummyLayer$e(v) {
        this._DummyLayer_e = v;
    },
    get DummyLayer$m() {
        return cop.proceed() + " World";
    },
    h: function() {
        // console.log("h");
        return 2;
    },
    DummyLayer$h: function() {
        // console.log("D$h old(" + cop.proceed() +")");
        return 3;
    },
    DummyLayer3$h: function() {
        // console.log("D3$h old(" + cop.proceed() +")");
        return 4;
    },
    
    DummyLayer$newMethod: function() {
        return "totally new"
    },
    
    m1: function() {
        return 1;    
    },

    DummyLayer$m1: function() {
        return 7;    
    },


    m2: function() {
        return "m2";    
    },

    DummyLayer$m2: function() {
        return "D$m2," + cop.proceed();    
    },

    
    fooo: function() {
        return "base";
    },
    
    DummyLayer$newFoo: function() {
        return "newFoo";
    },
    
    say: function(a) {
        return "Say: " + a
    },
});


cop.example.DummyClass.subclass('cop.example.DummySubclass', {
    
    f2: function() {
        return 3;
    },
    
    DummyLayer$f2: function() {
        return 4;
    },

    m1: function() {
        return 10;
    },

    DummyLayer$m1: function() {
        return cop.proceed() + 1;
    },    
    
    DummyLayer$fooo: function() {
        var proc =  cop.proceed();
        return proc+"-layer-"+this.newFoo();    
    },
        
    toString: function() {
        return "[a DummySubclass]"
    },
    
    m2: function() {
        return "S$m2"
    }
    
});

cop.example.DummyClass.subclass('cop.example.SecondDummySubclass', {
    
    DummyLayer$m1: function() {
        return cop.proceed() + 100;
    },

});



TestCase.subclass('cop.LayersTest.CopExampleTest', {
    
    testCopExample: function() {
        copExample();

        var name = "Hans Peter",
            address = "Am Kiez 49, 123 Berlin",
            employer_name = "Doener AG",
            employer_address = "An der Ecke, 124 Berlin",
            employer = new cop.example.Employer(employer_name, employer_address),
            person = new cop.example.Person(name, address, employer);
                
        this.assertEquals(person.print(), "Name: " + name, "toString without a layer is broken");

        cop.withLayers([Global.AddressLayer], function() {
            this.assertEquals(person.print(), "Name: " + name + "; Address: " + address, "toString with address layer is broken");
        }.bind(this));

        cop.withLayers([Global.EmploymentLayer], function() {
            this.assertEquals(person.print(), "Name: " + name + "; [Employer] Name: " + employer_name, "toString with employment layer is broken");
        }.bind(this));

        cop.withLayers([Global.AddressLayer, Global.EmploymentLayer], function() { 
            this.assertEquals(person.print(), "Name: " + name +  "; Address: " + address +
                "; [Employer] Name: " + employer_name + "; Address: " + employer_address, 
                "toString with employment layer is broken");
        }.bind(this));            
    }
    
});

var currentTest = undefined;

TestCase.subclass('cop.LayersTest.LayerTest',
'running', {

    setUp: function() {
        this.execution  = [];
        Global.currentTest = this;
        this.oldGlobalLayers = cop.GlobalLayers;
        cop.GlobalLayers = []; // ok, when we are testing layers, there should be no other layers active in the system (to make things easier)
        cop.resetLayerStack();
    },
    
    tearDown: function() {
        cop.GlobalLayers = this.oldGlobalLayers;
        cop.resetLayerStack();
    },
},
'helper', {
    makeObject1: function() {
        this.object1 = {
            myString: "I am an object",
            f: function(a, b) {
                Global.currentTest.execution.push("d.f");
                // console.log("execute default f(" + a, ", " + b + ")");
                return 0;
            },
            g: function() {
                Global.currentTest.execution.push("d.g");
                // console.log("execute default g");
                return "Hello";
            },
            print: function() {
                return this.myString;
            },
            toString: function() {
                return "object1"
            }
            
        };
    },
    
    makeHtmlLayer: function() {
        var layer = cop.basicCreate('LmakeHtmlLayer');
        cop.ensurePartialLayer(layer, this.object1)["print"] =  function() {
            return "<b>"+ cop.proceed() + "</b>"; 
        };
        layer.toString = function() {return "Layer HTML";};
        this.htmlLayer = layer;
    },
    

    makeLayer1: function() {
        this.layer1 = cop.create('LmakeLayer1');
        cop.layerObject(this.layer1, this.object1, {
            f: function(a, b) {
                Global.currentTest.execution.push("l1.f");
                console.log("execute layer1 function for f");
                return cop.proceed(a, b) + a;
            }
        });
        this.layer1.toString = function() {return "Layer L1";};
    },

    makeLayer2: function() {
        this.layer2 = cop.basicCreate('makeLayer2');
        cop.layerObject(this.layer2, this.object1, {
            f: function(a, b) {
                Global.currentTest.execution.push("l2.f");
                // console.log("execute layer2 function for f");
                return cop.proceed(a, b) + b; 
            },
            g: function() {
                Global.currentTest.execution.push("l2.g");
                // console.log("execute default g");
                return cop.proceed() + " World";
            }
        });
        this.layer2.toString = function() {return "Layer L2"};
    },

    makeEmptyLayer: function() {
        this.emptyLayer = cop.basicCreate('LEmpty');
        this.emptyLayer.toString = function() {return "Empty Layer"};
    },

    makeLayer3: function() {
        this.layer3 = cop.basicCreate('LmakeLayer3');;
        cop.layerObject(this.layer3, this.object1, {
            f: function(a, b) {
                Global.currentTest.execution.push("l3.f");
                // console.log("execute layer3 function for f");
                return cop.proceed() * 10; 
            }
        });
        this.layer3.toString = function() {return "Layer L3"};
    },
},
'tests', {
    testCreateLayer: function() {
        cop.create("DummyLayer2");
        this.assert(Global.DummyLayer2);
        this.assert(Global.DummyLayer2.toString(), "DummyLayer2");
    },
    testCreateLayerInNamespace: function() {
        cop.create("cop.tests.DummyLayer3");
        this.assert(cop.tests.DummyLayer3);
        this.assert(cop.tests.DummyLayer3.toString(), "DummyLayer3");
    },


    testCurrentLayers: function() {
        this.makeObject1();
        this.makeLayer1();
        cop.withLayers([this.layer1], function() {
            this.assert(this.layer1, "no this.layer1");
            this.assert(cop.currentLayers().first(), "currentLayers failed");
        }.bind(this));
    },

    testOneLayer: function() {
        this.makeObject1();
        this.makeLayer1();
        this.assertEquals(this.object1.f(2,3), 0, "default result of f() failed");
        cop.makeFunctionLayerAware(this.object1,"f");
        this.assertEquals(this.object1.f(2,3), 0, "default result of f() with layer aware failed");
        cop.withLayers([this.layer1], function() {
            var r = this.object1.f(2,3);
            this.assertEquals(r, 2, "result of f() failed");
            this.assertEquals(String(Global.currentTest.execution), [ "d.f", "d.f", "l1.f", "d.f"]);
        }.bind(this));

      },
  
    testTwoLayers: function() {
          this.makeObject1();
          this.makeLayer1();
          this.makeLayer2();
        cop.withLayers([this.layer1, this.layer2], function() {
            this.assertEquals(this.object1.f(3,4), 7, "result of f() failed");
            this.assertEquals(Global.currentTest.execution.toString(), ["l2.f", "l1.f", "d.f"]);
        }.bind(this));
      },

    testTwoLayerInverse: function() {
          this.makeObject1();
          this.makeLayer1();
          this.makeLayer2();
        cop.withLayers([this.layer2, this.layer1], function() {
            cop.makeFunctionLayerAware(this.object1,"f");
            this.object1.f();
            this.assertEquals(Global.currentTest.execution.toString(), ["l1.f", "l2.f", "d.f"]);
        }.bind(this));
      },

    testThreeLayers: function() {
          this.makeObject1();
          this.makeLayer1();
          this.makeLayer2();
          this.makeLayer3();
        cop.withLayers([this.layer1, this.layer2, this.layer3], function() {
            cop.makeFunctionLayerAware(this.object1,"f");
            cop.makeFunctionLayerAware(this.object1,"g");
            this.object1.f();
            var r = this.object1.g();
            this.assertEquals(r, "Hello World", "result of g() is wrong");
            this.assertEquals(Global.currentTest.execution.toString(), ["l3.f", "l2.f","l1.f", "d.f", "l2.g", "d.g"]);
        }.bind(this));
      },

    testTwoLayersAndEmpty: function() {
          this.makeObject1();
          this.makeEmptyLayer();
          this.makeLayer1();
          this.makeLayer2();
        cop.withLayers([this.layer1, this.emptyLayer, this.layer2], function() {
            this.object1.f();
            this.assertEquals(Global.currentTest.execution.toString(), ["l2.f","l1.f", "d.f"]);
        }.bind(this));

      },
    
    testHTMLLayerExample: function() {
          this.makeObject1();
          this.makeHtmlLayer();
        cop.makeFunctionLayerAware(this.object1,"print");        
        cop.withLayers([this.htmlLayer], function() {
            this.assertEquals(this.object1.print(), "<b>"+this.object1.myString + "</b>", "html print does not work")        
        }.bind(this));
    },

    testLayerClass: function() {
        var layer1 = cop.basicCreate('LtestLayerClass');
        cop.layerClass(layer1, cop.example.DummyClass, {
            f: function(a, b) {
                this.execution.push("l1.f");
                // console.log("execute layer1 function for f");
                return cop.proceed() + a; 
            },
        });
        var object1 = new cop.example.DummyClass();
        cop.makeFunctionLayerAware(cop.example.DummyClass.prototype,"f");
        
        this.assertEquals(object1.f(2,3), 0, "default result of f() with layer aware failed");
        cop.withLayers([layer1], function() {
            var r = object1.f(2,3);
            this.assertEquals(r, 2, "result of f() failed");
            this.assertEquals(object1.execution.toString(), ["d.f", "l1.f", "d.f"]);
        }.bind(this))
      },

    testNestedLayerInClass: function() {
        var o = new cop.example.DummyClass();

        cop.withLayers([DummyLayer], function() {
            this.assertEquals(o.h(), 3, "outer layer broken");
            cop.withLayers([DummyLayer3], function() {
                // console.log("Layers: " + cop.currentLayers());
                // cop.currentLayers().each(function(ea){
                //     var p = ea[cop.example.DummyClass.prototype];
                //     if (p) {
                //         console.log("" + ea + ".h : " + p.h)
                //     }})
                this.assertEquals(o.h(), 4, "inner layer broken");
            }.bind(this))
        }.bind(this));
        // console.log("LOG: " + o.log)
        
      },

    testLayerObject: function() {
        var layer1 = cop.basicCreate('LtestLayerObject');
        this.makeObject1();
        cop.layerObject(layer1, this.object1, {
            f: function(a, b) {
                Global.currentTest.execution.push("l1.f");
                // console.log("execute layer1 function for f");
                return cop.proceed() + a; 
            },
        });
        cop.withLayers([layer1], function() {
            var r = this.object1.f(2);
            this.assertEquals(r, 2, "result of f() failed");
            this.assertEquals(Global.currentTest.execution.toString(), ["l1.f", "d.f"]);
        }.bind(this));
      },

    // How to lookup objects in layers
    testObjectAsDictionaryKeys: function() {
        // it seems that the string value is used as the "key" in dictionary lookups
        a = {name: "foo", toString: function() {return this.name}};
        b = {name: "bar", toString: function() {return this.name}};
        d = {};
        d[a] = 1;
        d[b] = 2;
        this.assertEquals(d[a], 1, "objects as keys are broken")
    },
    
    testLayerObjectsInOneLayer: function() {
        var layer = cop.basicCreate('LtestLayerObjectsInOneLayer');
        var o1 = {f: function() {return 1}};
        var o2 = {f: function() {return 2}};
        cop.layerObject(layer, o1, {
            f: function() {
                return 3 
            },
        });
        cop.layerObject(layer, o2, {
            f: function() {
                return 4 
            },
        });
        cop.withLayers([layer], function() {
            this.assertEquals(o1.f(), 3, "result of o1.f() failed");
            this.assertEquals(o2.f(), 4, "result of o2.f() failed");
        }.bind(this));        
    },

    testLayerMethod: function() {
        var object1 = {f: function() {return 0}, g: function() {}},
            layer1 = cop.basicCreate('LtestLayerMethod');
        
        cop.layerMethod(layer1, object1, "f", function(){
            return cop.proceed() + 1});
            
        this.assert(cop.getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");    
        
        cop.layerMethod(layer1, object1, "g", function(){});
    
        this.assert(cop.getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");    
        this.assert(cop.getLayerDefinitionForObject(layer1, object1).g, "g did not get stored");    
    },

    testLayerInClass: function() {
        var o = new cop.example.DummyClass();
        this.assert(!o['DummyLayer$f'], "layer code ended up in class");
        this.assert(cop.getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype).f, "f did not end up in DummyLayer");
        this.assert(cop.getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype), "DummyLayer2 has no partial class");
        this.assert(cop.getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype).h, "DummyLayer2 has no method for h");
    },

    testLayerActivation: function() {
        var layer1 = cop.basicCreate('LtestLayerActivation');
        var oldLength = cop.currentLayers().length;
        cop.withLayers([layer1], function() {
            this.assertEquals(cop.currentLayers().length, oldLength + 1, "layer1 is not actived");
        }.bind(this));
        this.assertEquals(cop.currentLayers().length, oldLength, "layer1 is not deactived");
      },

    testNestedLayerActivation: function() {
        var layer1 = cop.basicCreate('LtestNested1'),
            layer2 = cop.basicCreate('LtestNested1');
        this.assertEquals(cop.currentLayers().length, 0, "there are active layers where there shouldn't be ")
        cop.withLayers([layer1], function() {
            this.assertEquals(cop.currentLayers().length, 1, "layer1 is not active");
            cop.withLayers([layer2], function() {
                this.assertEquals(cop.currentLayers().length, 2, "layer2 is not active");
            }.bind(this));
            this.assertEquals(cop.currentLayers().length, 1, "layer2 is not deactivated");
        }.bind(this));
        this.assertEquals(cop.currentLayers().length, 0, "layer1 is not deactivated");
      },

    testNestedLayerDeactivationAndActivation: function() {
        var layer1 = cop.basicCreate('l1'),
            layer2 = cop.basicCreate('l2'),
            layer3 = cop.basicCreate('l3');
        cop.withLayers([layer1, layer2, layer3], function() {
            cop.withoutLayers([layer2], function() {
                this.assertEquals(cop.currentLayers().toString(), ["l1","l3"].toString());
                cop.withLayers([layer2], function() {
                    this.assertEquals(cop.currentLayers().toString(), ["l1","l3","l2"].toString());
                }.bind(this));
            }.bind(this));
        }.bind(this));
      },

    testDuplicateLayerActivation: function() {
        var layer1 = cop.basicCreate('LtestDup');
        cop.withLayers([layer1], function() {
            cop.withLayers([layer1], function() {
                this.assertEquals(cop.currentLayers().length, 1, "layer1 activated twice");
            }.bind(this));
            this.assertEquals(cop.currentLayers().length, 1, "layer1 is deactivated");
        }.bind(this));
      },

    testLayerDeactivation: function() {
        var layer1 = cop.basicCreate('LtestLayerDeactivation1');
        var layer2 = cop.basicCreate('LtestLayerDeactivation2');
        cop.withLayers([layer1, layer2], function() {
            cop.withoutLayers([layer2], function() {
                this.assertEquals(cop.currentLayers().length, 1, "layer2 is not deactiveated");
            }.bind(this));
            this.assertEquals(cop.currentLayers().length, 2, "layer2 is not reactivated");
        }.bind(this));
      },

    testErrorInLayeredActivation: function() {
        var layer1 = cop.basicCreate('LtestErrorInLayeredActivation')
        this.makeObject1();
        cop.layerObject(layer1, this.object1, {
            f: function() {
                throw {testError: true}
            },
        });
        try {
            cop.withLayers([layer1], function() {
                this.object1.f();
            }.bind(this));
        } catch (e) {
            if (!e.testError) throw e;
            this.assertEquals(cop.currentLayers().length, 0, "layer1 is still active");
            
        }
      },

    testErrorInLayeredDeactivation: function() {
        var layer1 = cop.basicCreate('LtestErrorInLayeredDeactivation');
        this.makeObject1();
        cop.layerObject(layer1, this.object1, {
            f: function() {
                throw {testError: true};
            },
        });
        cop.withLayers([layer1], function() {
            try {
                cop.withoutLayers([layer1], function() {
                    this.assertEquals(cop.currentLayers().length, 0, "layer1 deactivation is not active");
                    this.object1.f();
                }.bind(this));
            } catch (e) {
                if (!e.testError) throw e;            
            };
            this.assertEquals(cop.currentLayers().length, 1, "layer1 deactivation is still active");
        }.bind(this));
      },


    testComposeLayers: function() {
        var layer1 = {toString: function(){return "l1"}};
        var layer2 = {toString: function(){return "l2"}};
        var layer3 = {toString: function(){return "l3"}};
        
        var stack = [{}];
        this.assertEquals(cop.composeLayers(stack.clone()).toString(), [].toString());
        this.assertEquals(cop.composeLayers([{}, {withLayers: [layer1]}]).toString(), ["l1"].toString());
        this.assertEquals(cop.composeLayers([{}, {withLayers: [layer1]},{withLayers: [layer2, layer3]} ]).toString(), ["l1","l2","l3"].toString());
      },

    testComposeLayersWithWithoutLayers: function() {
        var layer1 = {toString: function(){return "l1"}},
            layer2 = {toString: function(){return "l2"}},
            layer3 = {toString: function(){return "l3"}};
        
        var stack = [{}];
        this.assertEquals(
            cop.composeLayers([
                {},
                {withLayers: [layer1, layer2, layer3]},
                {withoutLayers: [layer2]}]).toString(),
            ["l1","l3"].toString());
        
      },
    
    testThisReferenceInLayeredMethod: function(){
        var test = this,
            layer1 = cop.basicCreate('testThisReferenceInLayeredMethod')
        this.makeObject1();
        layer1.refineObject(this.object1, {
            f: function() {
                test.thisIsBound = test.object1 === this;
            }.binds({test: test}),
        });
        cop.withLayers([layer1], function() {
            test.object1.f();
        });
        this.assert(test.thisIsBound, "this is not object1 in layer");
    },

    testGlobalLayers: function() {
        var layer1 = {name: "Layer1"};
        var layer2 = {name: "Layer2"};
        cop.enableLayer(layer1);
        cop.enableLayer(layer2);
        this.assertIdentity(cop.GlobalLayers[0], layer1, "layer1 not global");
        this.assertIdentity(cop.GlobalLayers[1], layer2, "layer2 not global");
        cop.disableLayer(layer1);
        this.assertIdentity(cop.GlobalLayers[0], layer2, "layer1 not removed from global");
        cop.disableLayer(layer2);
        this.assertIdentity(cop.GlobalLayers.length, 0, "global layers still active");
    },

    testEnableDisableLayer: function() {
        var layer1 = cop.basicCreate("Layer1");
        cop.enableLayer(layer1);
        this.assertEquals(cop.currentLayers().length, 1, "layer 1 is not enabled");
        // console.log("current layers: " + cop.currentLayers())
        cop.disableLayer(layer1);
        this.assert(!cop.LayerStack.last().composition, "there is a cached composition!");
        this.assertEquals(cop.currentLayers().length, 0, "layer 1 is not disabeled");
    },
    

    testEnableLayersInContext: function() {
        var layer1 = cop.basicCreate("Layer1"),
            layer2 = cop.basicCreate("Layer2");
        cop.withLayers([layer2], function() {
            cop.enableLayer(layer1);
            this.assertEquals(cop.currentLayers().length, 2, "layer 2 is not enabled");            
        }.bind(this));
        this.assertEquals(cop.currentLayers().length, 1, "layer 1 is not enabled");
        cop.disableLayer(layer1);
    },
    
    testEnableLayersInContextAgain: function() {
        var layer1 = cop.basicCreate('Layer1');
        cop.withLayers([layer1], function() {
            cop.enableLayer(layer1);
            this.assertEquals(cop.currentLayers().length, 1, "layer 1 enabled twice?");            
        }.bind(this));
        this.assertEquals(cop.currentLayers().length, 1, "layer 1 is not enabled");
    },
    
    testLayerSubclass: function() {
        var o = new cop.example.DummySubclass();
        
        this.assert(o.f2.isLayerAware, "function is not layer aware when subclassing not directly from object")

    },
    
    testNewMethodOnlyInLayer: function() {
        var o = new cop.example.DummyClass();
        cop.withLayers([DummyLayer], function() {
            this.assert(o.newMethod, "new method is not there");
            this.assertEquals(o.newMethod(), "totally new","layered newMethod() is wrong");

        }.bind(this));
      },


    testLayerMethodInSubclass: function() {
        var o = new cop.example.DummySubclass();
        this.assertEquals(o.m1(), 10, "subclassing is broken")
        cop.withLayers([DummyLayer], function() {
            this.assertEquals(o.m1(), 11, "layer in subclass is broken")        
        }.bind(this));
      },
      
      testLayerMethodInSecondSubclass: function() {
        var o = new cop.example.SecondDummySubclass();
        this.assertEquals(o.m1(), 1, "base is broken")
        cop.withLayers([DummyLayer], function() {
debugger
            this.assertEquals(o.m1(), 101, "layer in second subclass is broken")        
        }.bind(this));
      },
      
      testSetWithLayers: function() {
          var o = new cop.example.DummySubclass();
          this.assertEquals(o.fooo(), "base", "base is broken");    
          cop.withLayers([DummyLayer], function() {
              this.assertEquals(o.fooo(), "base-layer-newFoo", "SecondDummySubclass is broken");        
          }.bind(this));
      },

      testExecuteLayeredBehaviorOfSuperclass: function() {
          var o = new cop.example.DummySubclass();
           cop.withLayers([DummyLayer], function() {
              this.assertEquals(o.newFoo(), "newFoo", "newFoo is broken");        
          }.bind(this));
      },


      testDoNotOverideLayeredMethodInSubclass: function() {
          var o = new cop.example.DummyClass();
           cop.withLayers([DummyLayer], function() {
              this.assertEquals(o.m2(), "D$m2,m2", "installing wrappers on base class broken");        
          }.bind(this));

          var s = new cop.example.DummySubclass();
           cop.withLayers([DummyLayer], function() {
              this.assertEquals(s.m2(), "S$m2", "not installing wrappers on subclassing broken`");        
          }.bind(this));
      },
    testLayerRemove: function() {
        this.makeObject1();
        var layer = cop.create('TestLayerRemoveLayer').refineObject(this.object1, {
            f: function(x) { return x }
        }).beGlobal();

        this.assertEquals(3, this.object1.f(3), 'layer not global');
        this.assert(Global.TestLayerRemoveLayer, 'layer not in Namespace');

        layer.remove();

        this.assertEquals(0, this.object1.f(3), 'layer still global');
        this.assert(!Global.TestLayerRemoveLayer, 'layer still in Namespace');
    },
    testLayersRememberSourceModule: function() {
        this.assert(DummyLayer.sourceModule, 'no sourceModule');
        this.assert(DummyLayer.sourceModule == cop.LayersTest, 'wrong sourceModule');
    },


});

TestCase.subclass('cop.LayersTest.AdaptArgumentsInLayer', {
    testAdaptArgumentsInLayer: function() {
        var o = {say: function(a) {return "Say: " +a}},
            l = cop.basicCreate('L')
                .refineObject(o, { say: function(a) {return cop.proceed(a + " World") + "!"}})
        this.assertEquals(o.say("Hello"), "Say: Hello", "test is broken");    
        cop.withLayers([l], function() {
            console.group("SayHello");
            var result = o.say("Hello")
            console.groupEnd("SayHello");
            this.assertEquals(result, "Say: Hello World!", "adapting arguments is broken");        
        }.bind(this));
    },
})

TestCase.subclass('cop.LayersTest.LayerTestCase', {
    setUp: function() {
        this.tmpClassName = 'TmpDummyClass';
        this.tmpSubclassName = 'TmpDummySubclass';
        this.tmpLayerName = 'TmpDummyLayer';
        this.tmpLayer2Name = 'TmpDummyLayer2';

        Object.subclass(this.tmpClassName, {});
        Global[this.tmpClassName].subclass(this.tmpSubclassName, {});
        cop.create(this.tmpLayerName);
        cop.create(this.tmpLayer2Name);
    },
        
    dummyClass: function() {
        return Global[this.tmpClassName];
    },
    
    dummySubclass: function() {
        return Global[this.tmpSubclassName];
    },

    dummyLayer: function() {
        return Global[this.tmpLayerName];
    },

    dummyLayer2: function() {
        return Global[this.tmpLayer2Name];
    },
    
    tearDown: function() {
        console.log("tear down classes....")
        Global[this.tmpSubclassName] = undefined;
        Global[this.tmpClassName] = undefined;    
        Global[this.tmpLayerName] = undefined;    
        Global[this.tmpLayer2Name] = undefined;    
    }
});

cop.LayersTest.LayerTestCase.subclass('cop.LayersTest.LayerSubclassingTest', {

    testSetup: function() {
        this.assert(this.dummyClass());
        this.assert(this.dummySubclass());
        this.assert(this.dummyLayer());
    },    

    testLayerClassAndSubclasses: function() {
        this.dummyClass().addMethods({
            m1: function(){return "m1"},
        });
    
        this.dummySubclass().addMethods({
            m1: function(){return "S$m1"},
            m2: function(){return "S$m2"},
        });
    
        cop.layerClassAndSubclasses(this.dummyLayer(), this.dummyClass(), {
            m1: function() {return "L$m1,"+cop.proceed()}
        });
        
        this.assert(this.dummySubclass().prototype.m1.isLayerAware,  "overriden m1 is not layer aware")
        this.assert(!this.dummySubclass().prototype.m2.isLayerAware,  "overriden m2 is layer aware, but it should't")

        var o = new (this.dummyClass())();
        this.assertEquals(o.m1(), "m1", "base m1 broken");
        cop.withLayers([this.dummyLayer()], function() {
            this.assertEquals(o.m1(), "L$m1,m1", "layered m1 broken");
        }.bind(this))
        
        var s = new (this.dummySubclass())();
        this.assertEquals(s.m1(), "S$m1", "base S$m1 broken");
        cop.withLayers([this.dummyLayer()], function() {
            this.assertEquals(s.m1(), "L$m1,S$m1", "layered S$m1 broken");
        }.bind(this))    
    },
    
    testLayerClassAndSubclassesWithSuper: function() {
        this.dummyClass().addMethods({
            m1: function() { return "m1" },
        });
    
        this.dummySubclass().addMethods({
            m1: function($super) { return "S$m1a " + $super() + " S$m1b" }
        });
    
        cop.layerClassAndSubclasses(this.dummyLayer(), this.dummyClass(), {
            m1: function() { return "L$m1a " + cop.proceed() + " L$m1b" }
        });
        

        var o = new (this.dummyClass())();
        this.assertEquals(o.m1(), "m1", "unlayered m1 in superclass broken");

        cop.withLayers([this.dummyLayer()], function() {
            this.assertEquals(o.m1(), "L$m1a m1 L$m1b", "layered m1 broken");
        }.bind(this))

        var s = new (this.dummySubclass())();
        debugger
        this.assertEquals(s.m1(), "S$m1a m1 S$m1b", "base S$m1 broken");
        cop.withLayers([this.dummyLayer()], function() {
            this.assertEquals(s.m1(), "L$m1a S$m1a L$m1a m1 L$m1b S$m1b L$m1b", "layered S$m1 broken");
        }.bind(this))    
    },
    
    
    testMultipleLayerDefintions: function() {
        this.dummyClass().addMethods({m1: function() { return "m1" }});
    
        this.dummySubclass().addMethods({m1: function() { return "S$m1" }});
    
        cop.layerClassAndSubclasses(this.dummyLayer(), this.dummyClass(), {
            m1: function() {return "L$m1,"+cop.proceed()}
        });

        cop.layerClassAndSubclasses(this.dummyLayer2(), this.dummySubclass(), {
            m1: function() {return "L$m1,"+cop.proceed()}
        });
                
        var s = new (this.dummySubclass())();
        cop.withLayers([this.dummyLayer()], function() {
debugger
            this.assertEquals(s.m1(), "L$m1,S$m1", "layered S$m1 broken");
        }.bind(this))    
    },
});

LayerExamples = {
    logSetPostionInMorph: function() {
        Morph.addMethods(LayerableObjectTrait);
        Morph.prototype.lookupLayersIn = ["owner"];
        WindowMorph.prototype.lookupLayersIn = [""];
        HandMorph.prototype.lookupLayersIn = [""];
    
        cop.create("LogPostionLayer");
        cop.layerClass(LogPostionLayer, Morph, {
            setPosition: function(pos) { 
                console.log(this + "setPosition(" + pos +")")
                return cop.proceed(pos);
            }
        });
    }
}

// LayerExamples.logSetPostionInMorph()
// WorldMorph.current().setWithLayers([LogPostionLayer]);


/*
 * Test for Getter and Setter Functionality
 * (Supportet in Mozilla, WebKit et al)
 *
 */
TestCase.subclass('cop.LayersTest.GetterAndSetterTest', {
    
    testGetterInObject: function() {
        var o = { get b() { return 4}};
        this.assertEquals(o.b, 4, "getter method is not supported");
    },
    
    testDefineGetter: function() {
        var o = {};
        o.__defineGetter__("b", function(){return 4});
        this.assertEquals(o.b, 4, "__defineGetter__ is not supported");
    },

    testDefineSetter: function() {
        var o = {a: 0};
        o.__defineSetter__("b", function(v){this.a = v});
        o.b = 4;
        this.assertEquals(o.a, 4, "__defineSetter__ is not supported");
    },

    testLookupGetter: function() {
        var o = {};
        var f1 = function(){return 4};
        o.__defineGetter__("b", f1);
        var f2 = o.__lookupGetter__("b");
        this.assertEquals(f1, f2, "__lookupGetter__ is not supported");
    },

    testLookupSetter: function() {
        var o = {};
        var f1 = function(v){};
        o.__defineSetter__("b", f1);
        var f2 = o.__lookupSetter__("b");
        this.assertEquals(f1, f2, "__lookupGetter__ is not supported");
    },    

    testSubclassWithGetterAndSetter: function() {
        var o = new cop.tests.GetterAndSetterTestDummy();
        this.assertEquals(o.b, 4, "subclass getter broken");
        o.c = 5;        
        this.assertEquals(o.a, 10, "subclass setter broken");
    },

    testOverideWithGetterInClass: function() {
        var o = new cop.tests.GetterAndSetterTestDummy();
        o.d = 7
        this.assertEquals(o.d, 14, "subclass getter broken");
    },

});


Object.subclass("cop.tests.GetterAndSetterTestDummy", {
    initialize: function() {
        this.a = 3;
        this.d = 5;
    },
    get b() {
        return this.a + 1;
    },
    set c(p) {
        this.a = p * 2;
    },
    get d() {
        return this._d * 2
    },
    set d(v) {
        this._d = v
    },    
});


cop.create("MyTestLayer1");
cop.create("MyTestLayer2");

Object.subclass('cop.tests.MyClass', {
    initialize: function() {
        this.a = 7;
    },
    get MyTestLayer1$a() {
        return this._MyLayer_a;
    },
    set MyTestLayer1$a(v) {
        this._MyLayer_a = v;
    },
    get MyTestLayer2$a() {
        return this._MyLayer2_a;
    },
    set MyTestLayer2$a(v) {
        this._MyLayer2_a = v;
    },
});

TestCase.subclass('cop.LayersTest.LayerStateTest', {

    testMakePropertyLayerAware: function() {
        var o = {a: 3};
        cop.makePropertyLayerAware(o,"a");
        
        this.assertEquals(o.a, 3, "getter is broken");
        o.a = 4;
        this.assertEquals(o.a, 4, "setter is broken");

        var getter = o.__lookupGetter__("a");
        this.assert(getter, "o has not getter for a");
        this.assert(getter.isLayerAware || getter.isInlinedByCop, "o.a getter is not layerAware");

        var setter = o.__lookupSetter__("a");
        this.assert(setter, "o has not setter for a");
        this.assert(setter.isLayerAware || getter.isInlinedByCop, "o.a setter is not layerAware");

        
    },
    
    testLayerGetter: function() {
        var o = {a: 5}, test = this;

        var layer1 = cop.basicCreate('L1');
        this.assertEquals(o.a, 5, "property access is broken");
        layer1.refineObject(o, {get a() { return 10 }})

        var layer2 = cop.basicCreate('L2');
        cop.withLayers([layer1], function() {
            test.assertEquals(o.a, 10, "layer getter broken");
            cop.withLayers([layer2], function() {
                test.assertEquals(o.a, 10, "with empty innner layer getter broken");
            });
        });
        test.assertEquals(o.a, 5, "layer getter broken after activation");
    },
    
    testLayerGetterAndSetter: function() {
        var o = {a: 5};
        var layer1 = cop.create('L1');
        this.assertEquals(o.a, 5, "property access is broken");

        o.l1_value = 10;
        layer1.refineObject(o, {
            get a() { return this.l1_value },
            set a(value) { return this.l1_value = value }
        });
        this.assert(
            cop.getLayerDefinitionForObject(layer1,o).__lookupSetter__("a"),
            "layer1 hast no setter for a");
        this.assert(o.__lookupSetter__("a").isLayerAware, "o.a setter is not layerAware");
        
        cop.withLayers([layer1], function() {
            this.assertEquals(o.a, 10, "layer getter broken");
debugger
            o.a = 20;
            this.assertEquals(o.l1_value, 20, "layer setter broken");
        }.bind(this));
    },

    testLayerStateInTwoObjects: function() {
        var o1 = new cop.example.DummyClass(),
            o2 = new cop.example.DummyClass(),
            layer1 = cop.basicCreate('LtestLayerStateInTwoObjects1');
        cop.layerClass(layer1, cop.example.DummyClass, {
            get a() { return this.l1_value },
            set a(value) { this.l1_value = value },        
        });
        cop.withLayers([layer1], function() {
            o1.a = 20;
            o2.a = 30;
            this.assertEquals(o1.a, 20, "layer state in two objects broken");
            this.assertEquals(o2.a, 30, "layer state in two objects broken 2");
        }.bind(this));
    },



    testGetterAndSetterClassInLayer: function() {
        var o = new cop.example.DummyClass();
        o.toString = function(){return "[o]"};
        var o2 = new cop.example.DummyClass();
        o2.toString= function(){return "[o2]"};
        var layer1 = cop.create('LtestGetterAndSetterClassInLayer');
        cop.layerClass(layer1, cop.example.DummyClass, {
            get a() {
                return 10;
            },        
        });
        o.a = 5; // initialize works only after layer installation
        o2.a = 7; // initialize works only after layer installation
        this.assert(cop.example.DummyClass.prototype.__lookupGetter__("a"), "DummyClass has no getter for a");
        this.assert(o.__lookupGetter__("a"), "o.a has no getter");
        
        this.assertEquals(o.a, 5, "layer getter broken after initialization");
        cop.withLayers([layer1], function() {
            this.assertEquals(o.a, 10, "layer getter broken");
        }.bind(this));
        this.assertEquals(o.a, 5, "layer getter broken after activation");
        this.assertEquals(o2.a, 7, "layer getter broken after activation for o2");
    },

    testGetterLayerInClass: function() {
        var o = new cop.example.DummyClass();
        this.assert(o.__lookupGetter__("e"), "o.e has no getter");
        this.assertEquals(o.e, "Hello", "layer getter broken after initialization");
        cop.withLayers([DummyLayer], function() {
            o.e = "World"
            this.assertEquals(o.e, "World", "layer getter broken");        
        }.bind(this));
        this.assertEquals(o.e, "Hello", "layer getter broken after activation");
        cop.withLayers([DummyLayer], function() {
            this.assertEquals(o.e, "World", "layer does not remember state");        
        }.bind(this));

    },
    
    testGetterProceed: function() {
        var o = new cop.example.DummyClass();
        cop.withLayers([DummyLayer], function() {
            this.assertEquals(o.m, "Hello World", "layer getter broken");        
        }.bind(this));
    },
    
    testLayerInstallation: function() {
        this.assert(cop.getLayerDefinitionForObject(DummyLayer, cop.example.DummyClass.prototype).__lookupGetter__("e"), "no getter in partial class");
        this.assert(cop.example.DummyClass.prototype.__lookupGetter__("e"), "no getter in class");
    },
    
    testLayerPropertyWithShadow: function() {
        var test = this, o = {}, layer1 = cop.create('LtestLayerPropertyWithShadow');
        cop.layerPropertyWithShadow(layer1, o, "a");
        o.a = 5;
        cop.withLayers([layer1], function() {
            o.a = 10;
            test.assertEquals(o.a, 10, "shadow broken");
        });
        this.assertEquals(o.a, 5, "shadow don't changes base");
        cop.withLayers([layer1], function() {
            test.assertEquals(o.a, 10, "shadow broken 2");
        });
    },
    
    testLayerClassPropertyWithShadow: function() {
        var test = this, o = new cop.example.DummyClass();
        cop.layerPropertyWithShadow(DummyLayer, o, "a");
        o.a = 5;
        cop.withLayers([DummyLayer], function() {
            o.a = 10;
            test.assertEquals(o.a, 10, "shadow broken");
        });
        test.assertEquals(o.a, 5, "shadow breaks base");
        cop.withLayers([DummyLayer], function() {
            test.assertEquals(o.a, 10, "shadow broken 2");
        });
    },
    
    testLayerPropertyWithShadowFallsBack: function() {
        var o = {};
        var layer1 = cop.basicCreate('LtestLayerPropertyWithShadowFallsBack');
        cop.layerPropertyWithShadow(layer1, o, "a");
        o.a = 5;
        cop.withLayers([layer1], function() {
            this.assertEquals(o.a, 5, "fallback is broken");
        }.bind(this));
    },
    
    testNestedStateAccess: function() {
        o = new cop.tests.MyClass();
        cop.withLayers([MyTestLayer1], function() {
            o.a = 9;
            cop.withLayers([MyTestLayer2], function() {
                o.a = 10;
            }.bind(this));
        }.bind(this));
        var self = this;
        cop.withLayers([MyTestLayer1], function() {
            this.assertEquals(o.a, 9, "outer layer broken")
            cop.withLayers([MyTestLayer2], function() {
                this.assertEquals(o.a, 10, "inner layer broken")
            }.bind(this));
        }.bind(this));        
    },
    
});

LayerableObject.subclass("DummyLayerableObject", {
    
    initialize: function() {
        this.otherObject = new DummyOtherObject();
        this.myObject = new DummyOtherObject();
        this.myObject.owner = this;
    },
    
    f: function() {
        return 3
    },
        
    DummyLayer$f: function() {
        return 4
    },

    k1: function() {
        return this.otherObject.k();
    },
    
    k2: function() {
        return this.myObject.k();
    },
    
    DummyLayer$thisRef: function() {
        return this
    }
});

LayerableObject.subclass("DummyOtherObject", {
    
    lookupLayersIn: ["owner"],
    
    initialize: function() {
        this.count_dummy_k = 0;
    },
    
    
    k: function() {
        return 5
    },
    
    DummyLayer$k: function() {
        cop.proceed();
        this.count_dummy_k = this.count_dummy_k + 1;
        return 7
    },

});

TestCase.subclass('cop.LayersTest.LayerObjectActivationTest', {
    
    setUp: function() {
        this.o = new DummyLayerableObject();
    },
    
    
    testSetAndGetActiveLayers: function() {    
        this.o.setWithLayers([DummyLayer]);
        var layers = this.o.withLayers;
        this.assert(layers, "no layers active")        
    },
    
    testDummyObjectDefault: function() {    
        this.assertEquals(this.o.f(), 3, " default fails");
        cop.withLayers([DummyLayer], function() {
            this.assertEquals(this.o.f(), 4, " dynamic layer activation is broken");            
        }.bind(this));
    },
    
    testSetLayersForObject: function() {
        this.o.setWithLayers([DummyLayer]);
        var r = this.o.structuralLayers({withLayers: [], withoutLayers: []})
        this.assertIdentity(r.withLayers[0], DummyLayer, "layer not set");
        this.assertEquals(this.o.f(), 4, " layered object broken");    
    },
    
    testLayerIsNotActivatedInOtherObject: function() {
        this.o.setWithLayers([DummyLayer]);
        this.assertEquals(this.o.k1(), 5, " layer is activated in other object?")
    },

    testLayerIsActivatedInMyObject: function() {
        this.o.setWithLayers([DummyLayer]);
debugger
        this.assertEquals(this.o.k2(), 7, " layer is not activated in my object")
    },
    
    
    testStateActivationAndWithLayers: function() {
        this.o.setWithLayers([DummyLayer]);
        cop.withLayers([DummyLayer], function() {
            this.assertEquals(this.o.k2(), 7, " layer is not activated in my object")
            this.assertEquals(this.o.myObject.count_dummy_k, 1, " layered method is excuted wrong number")
        }.bind(this));
    },
    
    testStateActivationAndWithoutLayers: function() {
        this.o.setWithLayers([DummyLayer]);
        cop.withoutLayers([DummyLayer], function() {
            this.assertEquals(this.o.k2(), 5, " layer is not deactivated in my object")
        }.bind(this));
    },

    testStateActivationAndObjectDeclaredWithoutLayers: function() {
        this.o.setWithLayers([DummyLayer]);
        this.o.myObject.setWithoutLayers([DummyLayer]);
        this.assertEquals(this.o.k2(), 5, " layer is not deactivated in my object")
    },

    testThisReference: function() {
        this.o.setWithLayers([DummyLayer]);
        this.assertIdentity(this.o.thisRef(), this.o, " 'this' reference is broken")        
    },
    
    testDoubleActivation: function() {
        this.o.setWithLayers([DummyLayer]);
        this.o.myObject.setWithLayers([DummyLayer]);
        var r = this.o.structuralLayers({withLayers: [], withoutLayers: []})
        this.assertEquals(r.withLayers.length, 1);
    },




    testAddWithLayerTest: function() {
        this.o.addWithLayer(DummyLayer);
        this.assert(this.o.withLayers.length, 1, "add failed")
        this.o.addWithLayer(DummyLayer);
        this.assert(this.o.withLayers.length, 1, "second add failed")
        this.o.addWithLayer(DummyLayer2);
        this.assert(this.o.withLayers.length, 2, "third add failed")
    
    },

    testRemoveWithLayerTest: function() {
        this.o.setWithLayers([DummyLayer, DummyLayer2]);
        this.o.removeWithLayer(DummyLayer);
        this.assert(this.o.withLayers.length, 1, "remove failed")
        this.o.removeWithLayer(DummyLayer);
        this.assert(this.o.withLayers.length, 1, "remove failed")
    
    },
    
});

TestCase.subclass('cop.LayersTest.ActiveLayersTest', {

    testOverrideActiveLayers: function() {
        var self = this, o = new cop.example.DummyClass();
        o.activeLayers = function() { return [] }
        cop.withLayers([DummyLayer], function(){
            self.assertEquals(o.f(), 0, "layer is still active")
        })            
    },
    testOverrideActiveLayersWithAdditionalLayer: function() {
        var self = this;
        // object overrides the layer composition
        var o = new cop.example.DummyClass();
        o.activeLayers= function($super) {
            return $super().concat([DummyLayer2]) 
        } 
        cop.withLayers([DummyLayer], function() {
debugger
            self.assertEquals(o.f(), 1100, "active layers failed")
        })            
    },
    
});

// DEPRICATED
cop.LayersTest.LayerTestCase.subclass('cop.LayersTest.LayerActivationRestrictionTest', {
    
    setUp: function($super) {
        $super();
        this.dummyClass().addMethods({m1:function(){return "m1"}});
        this.dummyClass().addMethods(LayerableObjectTrait);
        this.dummyClass().prototype.lookupLayersIn = ["owner"];
        cop.layerClass(this.dummyLayer(), this.dummyClass(), {m1:function(){return "L$m1," + cop.proceed()}});

        this.o1 = new (this.dummyClass())();
        this.o2 = new (this.dummyClass())();
        this.o3 = new (this.dummyClass())();
        
        this.o2.owner = this.o1;
        this.o3.owner = this.o2;        
    },
    

    
    tearDown: function($super) {
        $super()
    }
});

cop.LayersTest.LayerTestCase.subclass('cop.LayersTest.LayerAltSyntaxTest', {
    
    testNewSyntax: function() {
        var l = cop.create("MyDummyLayer2");
        this.assert(l instanceof Layer, "l is no layer")
        this.assert(l.layerClass instanceof Function, "l does not respond to layerClass")
        this.assert(l.layerObject instanceof Function, "l does not respond to layerObject")
    },

    testCreateLayer: function() {
        var l = cop.create("MyDummyLayer2");
        this.assert(l instanceof Layer, "l is no layer")
    },

    testRefineClass: function() {
        var l = cop.create("MyDummyLayer2");
        this.assert(l.refineClass instanceof Function, "l does not respond to refineClass")
    },

    testRefineObject: function() {
        var l = cop.create("MyDummyLayer2");
        this.assert(l.refineObject instanceof Function, "l does not respond to refineObject")

        var o = {foo: function() {return 1}}
        var r = l.refineObject(o, {
            foo: function() { }
        });

        this.assertIdentity(l, r, "refineObject does not return layer")
    },

    testBeGlobal: function() {
        var l = cop.create("MyDummyLayer2");
        l.beGlobal();        
        this.assert(cop.GlobalLayers.include(l), "be global is broken")
        
    }
});


TestCase.subclass('cop.LayersTest.CopProceedTest', {

    setUp: function() {
        this.originalProceed = cop.proceed;
        this.setupClasses();

    },

    tearDown: function() {

        cop.proceed = this.originalProceed;
    },

    setupClasses: function() {
        Global['CopProceedTestClass'] = undefined;

        Object.subclass('CopProceedTestClass', {
            m: function(a) {
                return a * a
            },

            p: "Hello"

        });

        cop.makeFunctionLayerAware(CopProceedTestClass.prototype, 'm')
        cop.makePropertyLayerAware(CopProceedTestClass.prototype, 'p')

        cop.create('CopProceedTestAddLayer').refineClass(CopProceedTestClass, {
            m: function(a) {
                return cop.proceed(a + 1)
            },
        });

        cop.create('CopProceedPropertyTestLayer').refineClass(CopProceedTestClass, {
            get p() {
                return cop.proceed() + " World"
            },

            set p(value) {
                cop.proceed(value.capitalize())
            },

        });


        cop.create('CopProceedMultAddLayer').refineClass(CopProceedTestClass, {
            m: function(a) {
                return cop.proceed(a) * 3
            }
        });

        cop.create('CopProceedMultipleProceedLayer').refineClass(CopProceedTestClass, {
            m: function(a) {
                return cop.proceed(a * 2) + cop.proceed(a *3)
            }
        });
    },

    testMakeFunctionLayerAware: function() {
        // inlining does not use proceedStack
        if (cop.staticInlining || cop.dynamicInlining) return;

        var testCase = this, newLength;
        cop.proceed = function() { newLength = cop.proceedStack.length }
        var o = {m: function() { return 1 }}
        cop.makeFunctionLayerAware(o, 'm')
        var oldLength = cop.proceedStack.length;
        o.m();
        this.assert(newLength > oldLength, "stack did not change")
    },

    testMakeFunctionLayerAwareSetsLayerComposition: function() {
        // inlining does not use proceedStack
        if (cop.staticInlining || cop.dynamicInlining) return;

        var testCase = this,
            partialMethods,
            object,
            functionName;

        cop.proceed = function() {
            var composition = cop.proceedStack.last();
            partialMethods = composition.partialMethods;
            object = composition.object;
            prototypeObject = composition.prototypeObject;
            functionName = composition.functionName;
        }

        var o = new CopProceedTestClass();
        withLayers([CopProceedTestAddLayer], function() {
            o.m();
        }.bind(this))

        this.assert(partialMethods, "no partialMethods")
        this.assert(object, "no  object")
        this.assert(prototypeObject, "no  prototypeObject")
        this.assert(functionName, "no functionName")

    },

    testProceedWithoutLayers: function() {
        var o = new CopProceedTestClass();
        this.assertEquals(o.m(2), 4, "base class broken")
    },

    testProceedFromAddToBase: function() {
        var o = new CopProceedTestClass();
        this.assertEquals(o.m(2), 4, "base class broken")
        withLayers([CopProceedTestAddLayer], function() {
            this.assertEquals(o.m(2), 9, "add layer broken")
        }.bind(this))
    },

    testProceedFromMultOverAddToBase: function() {
        var o = new CopProceedTestClass();
        this.assertEquals(o.m(2), 4, "base class broken")
        withLayers([CopProceedTestAddLayer], function() {
                withLayers([CopProceedMultAddLayer], function() {
                    this.assertEquals(o.m(2), 27, "mult and add layer broken")
            }.bind(this))
            this.assertEquals(o.m(2), 9, "mult and add layer broken")
        }.bind(this))
        this.assertEquals(o.m(2), 4, "mult and add layer broken")
    },

    testMultipleProceed: function() {
        var o = new CopProceedTestClass();
        this.assertEquals(o.m(2), 4, "base class broken")
        withLayers([CopProceedMultipleProceedLayer], function() {
            this.assertEquals(o.m(1), 13, "CopProceedMultipleProceedLayer")
        }.bind(this))
    },

    testCurrentLayerComposition: function() {
        var o = new CopProceedTestClass();
        this.assertIdentity(this.currentLayerComposition, undefined, "layer composition is undefined")
        withLayers([CopProceedTestAddLayer], function() {
            this.assertEquals(o.m(2), 9, "add layer broken")
        }.bind(this))    
        
    },





    testGetterAndSetterWithCopProceed: function() {
        var o = new CopProceedTestClass();
        this.assertEquals(o.m(2), 4, "base class broken")
        this.assertEquals(o.p, "Hello", "base getter broken")

        withLayers([CopProceedPropertyTestLayer], function() {
            this.assertEquals(o.p, "Hello World", "getter broken")
            o.p = "hi"
            this.assertEquals(o.p, "Hi World", "setter broken")
        }.bind(this))
    },


})

TestCase.subclass('cop.LayersTest.ContextJSBugs', {

    testLookupLayeredFunctionForObjectIgnoresInheritedProperties: function() {
        var layer = new Layer();
        var obj = {foo: function() {return 3} };
        layer.refineObject(obj, {foo: function() {return cop.proceed() + 1}});
        this.assertIdentity(cop.lookupLayeredFunctionForObject(obj, layer, 'toString'), undefined, 'toString should not be found')
    }
})

TestCase.subclass("cop.UninstallLayerTest", {

    testMakeFunctionLayerUnaware: function() {
        var obj = {m: function() {return 3}};
        var originalFunction = obj.m;
        cop.makeFunctionLayerAware(obj, "m");
        
        this.assert(obj.m !== originalFunction, "make layer aware failed")

        cop.makeFunctionLayerUnaware(obj, "m");

        this.assert(obj.m === originalFunction, "make layer unaware failed")
    },

    testMakeFunctionLayerUnawareThatIsConnected: function() {
        var obj1 = {m1: function(a) {return a}};
        var obj2 = {m2: function(b) { 
            this.b = b;
            // do nothing
        }};

        var originalFunction = obj1.m1;
        cop.makeFunctionLayerAware(obj1, "m1");

        var layerWrapper = obj1.m1;

        connect(obj1, "m1", obj2, "m2");
        var bindingsWrapper = obj1.m1;


        this.assert(bindingsWrapper !== layerWrapper, "binding did not work")
        this.assert(bindingsWrapper.originalFunction == layerWrapper, "bindings did not wrap around layer?")

        cop.makeFunctionLayerUnaware(obj1, "m1");
        this.assert(obj1.m1 === bindingsWrapper, "make layer unaware overwrote binding")

        obj1.m1(99)
        this.assertEquals(99, obj2.b);
    },

    

    testUninstallLayerInObject: function() {
        var obj1 = {
            m1: function() {return 3},
            m2: function() {return 2}
        };
        var originalM1 = obj1.m1;
        var originalM2 = obj1.m2;

        
        var layer = new Layer();
        layer.refineObject(obj1, {
            m1: function() { cop.proceed() + 1},
        });

        var layer2 = new Layer();
        layer2.refineObject(obj1, {
            m2: function() { cop.proceed() + 1},
        });


        cop.uninstallLayersInObject(obj1);

        this.assert(obj1.m1 === originalM1, "obj1.m1 is still wrapped");
        this.assert(obj1.m2 === originalM2, "obj2.m2 is still wrapped");
            
    }
});
TestCase.subclass('cop.LayersTest.UnrefineObjectTest', {

    testUntrefineObject: function() {
        var object = {foo: function() {return 3 }}

        var layer = new Layer("TestLayer")
        layer.refineObject(object, {
            foo: function() {
                return cop.proceed() + 4
            }
        })
        
        this.assert(cop.getLayerDefinitionForObject(layer, object), "no layer definition")
        layer.unrefineObject(object);    
        this.assert(cop.getLayerDefinitionForObject(layer, object) == undefined, "layer definition still there")

    },
    testUntrefineClass: function() {
        var klass = Object.subclass("CopDummyUnrefineClass",{
            foo: function() {return 3 }
        })

        var layer = new Layer("TestLayer")
        layer.refineClass(klass, {
            foo: function() {
                return cop.proceed() + 4
            }
        })
        
        this.assert(cop.getLayerDefinitionForObject(layer, klass.prototype), "no layer definition")
        layer.unrefineClass(klass);    
        this.assert(cop.getLayerDefinitionForObject(layer, klass.prototype) == undefined, "layer definition still there")

    },
});


});
console.log("loaded LayersTest.js");
