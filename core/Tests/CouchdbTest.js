module('Tests.CouchdbTest').requires('lively.TestFramework', 'apps.Webcards').toRun(function(ownModule) {

TestCase.subclass('Tests.CouchdbTest.CouchdbTest', {
	
	setUp: function() {
		this.dbName = "test_couch_for_livelykernel";
		this.cdb = new CouchDB(this.dbName);
		var allDbs = this.cdb.allDbs();
		if(allDbs.include(this.dbName)){
			this.cdb.deleteDb();
		}
		this.cdb.createDb();
	},
	
	testDBConnection: function() {
		var res = this.cdb.info();
		this.assertEquals(res.db_name,this.dbName,"info broken");
	},
	
	testJens: function() {
		var o1 = {test:"Wumpe"};
		var o2 = {b: 2, r: o1};
		var o3 = {b: 3, r: o1};
		var o4 = {r1: o2, r2: o3};
		this.cdb.save(o4);
		var o5 = this.cdb.open(o4._id);
		this.assertEquals(o5.r1.r.test , o5.r2.r.test,"ident not preserved"); 
	},
	
	testNaming: function(){
		try{
			var o1 = {_clazz:"SimpleDataStore"};
			this.cdb.save(o1);
			var o2 = this.cdb.open(o1._id);
			this.assertEquals(o1._clazz,o2._clazz);
			this.assert(false);
		}
		catch(e){
			this.assertEquals(e.error, "doc_validation");
		}
	},
	
	testNaming2: function(){
		var o1 = {$clazz:"SimpleDataStore"};
		this.cdb.save(o1);
		var o2 = this.cdb.open(o1._id);
		this.assertEquals(o1.$clazz,o2.$clazz);
		this.cdb.deleteDoc(o1);
		
	}

}); //end of pure Couchdb test





MorphTestCase.subclass("Tests.CouchdbTest.JsonRestorer",{
	
	setUp: function($super) {
		$super();
		this.dbName = "test_couch_for_livelykernel";
		this.cdb = new CouchDB(this.dbName);
		var allDbs = this.cdb.allDbs();
		if(!allDbs.include(this.dbName)){
			this.cdb.createDb();
		}
		this.morph = new ContentTextMorph();
		this.nameString = "Hihi";
		this.morph.webCardModel.setName(this.nameString);
		this.morph.updateLabel();

	},

	tearDown: function($super) {
		$super();
		if(this.saved){
			this.cdb.deleteDoc(this.restoredMorph);
			this.cdb.deleteDoc(this.restoredMorphFromSubmorph);
			this.saved = false;
		}
	},
	
	saveAndLoad: function() {
		this.saved = true;
		this.restorer = new Restorer();
		
		var json2save = this.morph.toJSON();
		this.cdb.save(json2save);
		var jsonFromDb = this.cdb.open(json2save._id);
		this.restoredMorph = this.restorer.restore(json2save);
		
		var json2saveFromSubmorph =  this.morph.label.toJSON();
		this.cdb.save(json2saveFromSubmorph);
		var jsonFromSubmorphFromDb = this.cdb.open(json2saveFromSubmorph._id);
		this.restoredMorphFromSubmorph = this.restorer.restore(json2saveFromSubmorph);
		
		this.restorer.patchRefs();	
		this.restorer.runDeserializationHooks();

	},

	testSetUp: function() {
		this.assertEquals(this.morph.label.textString, this.nameString);
	},
	
	testSerializationSimpleMember:function() {
		this.morph.test = "Wums";
		this.saveAndLoad();
		this.assertEquals(this.morph.test,this.restoredMorph.test);
		this.assertEquals(this.morph.getType(),this.restoredMorph.getType());
		this.assertEquals(this.morph.id(),this.restoredMorph.id());
	},
	
	testSerializationMorphsMember: function() {
		this.saveAndLoad();
		this.assert("label" in this.restoredMorph,"No Label there");
		this.assertEquals(this.restoredMorph.label.textString,this.nameString);
	},
	
	testEscape:function() {
		this.morph._natoll = "natoll";
		this.morph["-minus"] = "minus";
		this.morph.aObj = {key: "value"};
		this.morph._asWell = this.morph.aObj;
		this.saveAndLoad();
		this.assertEquals("natoll",this.morph._natoll, "real Problem");
		this.assertEquals("natoll",this.restoredMorph._natoll,"propertie starting with _");
		this.assertEquals("minus",this.restoredMorph["-minus"],"propertie already starting with -");
		this.assertEquals(this.morph.aObj.key,this.restoredMorph.aObj.key, "ref/id problems with value");
		this.assertEquals(this.restoredMorph.aObj,this.restoredMorph._asWell, "ref/id problems");
	},
	
	testSerializationMorphsMemberId: function() {
		this.saveAndLoad();
		this.assertEquals(this.morph.label.id(),this.restoredMorph.label.id());
	},
	
	testSerializationSubmoprh: function() {
		this.saveAndLoad();
		this.assertEquals(this.morph.submorphs.length,this.restoredMorph.submorphs.length,"wrong submorphs.length");
		var allRestoredIds = this.restoredMorph.submorphs.map(function(m){return m.id();});
		this.assert(allRestoredIds.include(this.morph.label.id()));
		
		var allLabelSubmorphs = this.restoredMorphFromSubmorph.submorphs.map(function(m){return m.id();});
		this.assert(!allLabelSubmorphs.include(this.morph.label.id()),"The submorph should not have it self as a submorph");
		this.assert(!allLabelSubmorphs.include(this.morph.id()),"The submorph should not have its owner as a submorph");
	},
	
	testArraySerialization: function() {
		this.morph.myArray = [1,2,3];
		this.saveAndLoad();
		this.assertEquals(this.morph.myArray.length, this.restoredMorph.myArray.length);
		for(var i = 0; i<this.morph.myArray;i++){
			this.assertEquals(this.morph.myArray[i],this.restoredMorph.myArray[i]);
		}
	},
	
	testPlainObj: function() {
		this.morph.pojso = {foo:2000, bar: "blub"};
		this.saveAndLoad();
		this.assertEquals(this.morph.pojso.bar, this.restoredMorph.pojso.bar);
		this.assertEquals(this.morph.pojso.foo, this.restoredMorph.pojso.foo);
	},
	
	testObjWithMorph: function() {
		this.morph.objWithM = {supi:"toll", more:this.morph.label};
		this.saveAndLoad();
		this.assertEquals(this.morph.objWithM.supi,this.restoredMorph.objWithM.supi);
		this.assertEquals(this.morph.objWithM.more.id(),this.restoredMorph.objWithM.more.id());
	},
	
	testArrayWithMorph: function() {
		this.morph.objWithM = ["toll", this.morph.label];
		this.saveAndLoad();
		this.assertEquals(this.morph.objWithM[0],this.restoredMorph.objWithM[0]);
		this.assertEquals(this.morph.objWithM[1].id(),this.restoredMorph.objWithM[1].id());
	},
	
	testObjeWithoutId: function() {
		this.morph.myColor = new Color(1,0,0.5);
		this.saveAndLoad();
		this.assertEquals(this.morph.myColor.r, this.restoredMorph.myColor.r);
		this.assertEquals(this.morph.myColor.g, this.restoredMorph.myColor.g);
		this.assertEquals(this.morph.myColor.b, this.restoredMorph.myColor.b);
	},
	
	testMorphHasRawNode: function() {
		this.saveAndLoad();
		this.assert(!!this.restoredMorph.rawNode,"no rawNode found");
		this.assert(!!this.restoredMorphFromSubmorph.rawNode,"no rawNode found in label");
	},
	
	testHowItLooksLike: function() {
		this.morph.isMaster = false;
		var red = new Color(0.8,0,0);
		var color2 = new Color(0.1,0.3,0.4);
		var bowi = 7;
		this.morph.applyStyle({textColor: red, fill: color2, borderWidth: bowi});
		this.assertSameColor(this.morph.getTextColor(),red);
		this.assertSameColor(this.morph.getFill(),color2);
		this.assertEquals(this.morph.getBorderWidth(),bowi);
		
		this.morph.setScale(0.9);
		this.morph.setRotation(0.6);
		this.morph.setFontSize(15);
		
		this.saveAndLoad();
		this.saved = false;//for testing
		x = this.restoredMorph;
		this.openMorphAt(this.morph,pt(10,10));
		this.morphs.push(this.morph);
		this.restoredMorph.setId(this.restoredMorph.newId()); // For adding both to the world
		this.restoredMorphFromSubmorph.setId(this.restoredMorphFromSubmorph.newId());
		this.openMorphAt(this.restoredMorph,pt(100,10));
		this.morphs.push(this.restoredMorph);	
		this.assertSameColor(this.restoredMorph.getTextColor(),red);
		this.assertSameColor(this.restoredMorph.getFill(),color2);
		this.assertEquals(this.restoredMorph.getBorderWidth(),bowi);
		this.assertEquals(this.restoredMorph.label.getPosition(),this.morph.label.getPosition());
	},
	
	assertSameColor: function(col1,col2) {
		this.assertEquals(col1.r,col2.r);
		this.assertEquals(col1.g,col2.g);
		this.assertEquals(col1.b,col2.b);
	},
	
	testTransformator: function() {
		this.morph.setScale(0.3);
		this.morph.setRotation(2);
		this.saveAndLoad();
		this.assertEquals(this.morph.getScale(), this.restoredMorph.getScale(),"scale wrong");
		this.assertEquals(this.morph.getRotation(), this.restoredMorph.getRotation(),"Rotation wrong");
	},
	
	testFont: function() {
		this.morph.setFontFamily("Courier");
		this.morph.setFontSize(7);
		this.saveAndLoad();
		this.assertEquals(this.morph.getFontFamily(), this.restoredMorph.getFontFamily(),"FontFamily wrong");
		this.assertEquals(this.morph.getFontSize(), this.restoredMorph.getFontSize(),"FontSize wrong");
	},
	
	testPointerEventsNone: function() {
		this.assertEquals(this.morph.label.getTrait("pointer-events"),"none");
		this.saveAndLoad();
		this.assertEquals(this.restoredMorphFromSubmorph.getTrait("pointer-events"),"none");
	},
	
	testCollectReferencedMorphs: function() {
		var relaxer = new Relaxer();
		var jso = relaxer.anythingToJson(this.morph,'$');
		relaxer.cleanUp();
		var allReferencedMorphs = relaxer.getReferencedObjects();
		this.assert(Object.isArray(allReferencedMorphs),"should return an array.");
		this.assert(allReferencedMorphs.length>0,"array should not be empty");
		this.assert(allReferencedMorphs.include(this.morph.label),"label morph not referenced");
	},
		
	testShapeSave: function() {
		var relaxer = new Relaxer();
		var shp = new lively.scene.Rectangle(new Rectangle(1,2,3,4));
		var jso = relaxer.anythingToJson(this.morph,'$');
		relaxer.cleanUp();
		this.assert(jso.shape, "no shape object");
		this.assert(jso.shape.$shapeSpec, "no shape");
		this.assert(jso.shape.$shapeSpec.x !== undefined, "no shape.x");
	},
	
}); // End of TestCase JsonRestorer

TestCase.subclass('Tests.CouchdbTest.ReferenceSerializationTest', {
	
	setUp: function() {
		this.relaxer = new Relaxer();
		this.dbName = "test_couch_for_livelykernel";
		this.cdb = new CouchDB(this.dbName);
		var allDbs = this.cdb.allDbs();
		if(!allDbs.include(this.dbName)){
			this.cdb.createDb();
		}
	},
	
	testSameObject: function() {
		var parentObj = {};
		var childObj = {val:"test234"};
		parentObj.r1 = childObj;
		parentObj.r2 = childObj;
		this.assertEquals(parentObj.r1, parentObj.r2);
		var relaxedJso = this.relaxer.objToRelaxedJso(parentObj);
		this.cdb.save(relaxedJso);
		
		var restorer = new Restorer();
		var jsoFromDb = this.cdb.open(relaxedJso._id);
		var restored = restorer.restore(jsoFromDb);
		restorer.patchRefs();	
		this.assertEquals(restored.r1.val, restored.r2.val,"Something realy went wrong");
		this.assertEquals(restored.r1, restored.r2,"no identity");
	},
	
	testPathInResut: function() {
		var parentObj = {};
		var childObj = {val:"test234"};
		parentObj.r1 = childObj;
		parentObj.r2 = childObj;
		var jso = this.relaxer.objToRelaxedJso(parentObj);
		
		this.assertEquals(jso.r2.$ref,"$.r1");
		this.assert(!parentObj.$path,"$patch should not be in the original Object");
		this.assert(!parentObj.r1.$path,"$patch should not be in the original Objects");
	},
	
	testCycles: function() {
		var obj = {};
		obj.key1 = "test9";
		obj.that = obj;
		this.assertEquals(obj.that, obj);
		
		var relaxedJso = this.relaxer.objToRelaxedJso(obj);
		this.cdb.save(relaxedJso);
		var restorer = new Restorer();
		var jsoFromDb = this.cdb.open(relaxedJso._id);
		var restored = restorer.restore(jsoFromDb);
		restorer.patchRefs();
		
		this.assertEquals(obj.key1,restored.key1, "Simple values not correct");
		this.assertEquals(restored.that, restored,"Cycle not correctly restored");
	},
	
	testCycles2: function() {
		var obj = {};
		obj.key1 = "test9";
		
		var other = {};
		other.othKey1= "oth";
		
		other.r2 = obj;
		obj.r1 = other;
		this.assertEquals(other.r2.r1, other,"cycle starting at 'other' does not work");
		this.assertEquals(obj.r1.r2, obj,"cycle starting at 'obj' does not work");
		
		var relaxedJso = this.relaxer.objToRelaxedJso(obj);
		this.cdb.save(relaxedJso);
		var restorer = new Restorer();
		var jsoFromDb = this.cdb.open(relaxedJso._id);
		var restored = restorer.restore(jsoFromDb);
		restorer.patchRefs();
		
		this.assertEquals(restored.r1.r2, restored,"cycle starting at 'restored' does not work");
	}
	
});

MorphTestCase.subclass('Tests.CouchdbTest.ShapeJson', {
	
	testSelfSpace: function() {
		var shp = new lively.scene.Rectangle(new Rectangle(1,2,23,24));
		var shp2 = new lively.scene.Rectangle(new Rectangle(1,2,23,24));
		var m = new Morph(shp);
		var m2= new Morph(shp2);
		this.openMorph(m);
		this.morphs.push(m);
		this.openMorph(m2);
		this.morphs.push(m2);
		
		var spec = shp.makeSpec();
		shp.applySpec(spec);
		m.setPosition(pt(33,33));
		//you should see 2 rects
	},
	
	testRect: function() {
		var shp = new lively.scene.Rectangle(new Rectangle(1,2,3,4));
		var spec = shp.makeSpec();
		for(var i = 0; i<shp.rawNode.attributes.length; i++){
			var key = shp.rawNode.attributes[i].localName;
			var val = shp.rawNode.attributes[i].nodeValue;
			this.assertEquals(spec[key],val);
		}
		var newShp  = new lively.scene.Rectangle(new Rectangle(5,6,7,8));
		var newSpec = newShp.makeSpec();
		shp.applySpec(newSpec);
		
		for(var i = 0; i<shp.rawNode.attributes.length; i++){
			var key = shp.rawNode.attributes[i].localName;
			var val = shp.rawNode.attributes[i].nodeValue;
			if(key === "stroke-width"){
				continue;
			}
			this.assertEquals(newSpec[key],val);
		}
	},
	
	testPolygon: function() {
		var makeStarVertices = function(r,center,startAngle) {
                    var vertices = [];
                    var nVerts = 10;
                    for (var i=0; i <= nVerts; i++) {
                        var a = startAngle + (2*Math.PI/nVerts*i);
                        var p = Point.polar(r,a);
                        if (i%2 == 0) p = p.scaleBy(0.39);
                        vertices.push(p.addPt(center)); 
                    }
                    return vertices; 
		        };
        var star = Morph.makePolygon(makeStarVertices(50,pt(0,0),0), 1, Color.black, Color.yellow);
        var starSpec = star.shape.makeSpec();
        this.assert(starSpec);
        star.shape.applySpec(starSpec);
        this.openMorph(star);
	},
	
	testCard: function() {
		var sds = new SimpleDataStore(pt(600, 300));
		sds.animate = false;
		this.openMorphAt(sds,pt(22,22));
		sds.newCard();
		var card = sds.stack.cards[0];
		
		var morph = new ContentTextMorph();
		card.addMorphAt(morph,pt(9,9));
		var nameString = "Hihi";
		morph.webCardModel.setName(nameString);
		morph.updateLabel();
				
		var spec = card.makeStyleSpec();
		this.openMorphAt(sds.stack.cards[0],pt(22,22));
	}
	
});

TestCase.subclass('Tests.CouchdbTest.EqualTest', {
	
	testColorEqaul: function() {
		var c1 = new Color(1,2,3);
		var c2 = new Color(1,2,3);
		var c3 = new Color(2,2,3);
		this.assert(c1.equals(c2));
		this.assert(!c1.equals(c3));
	},

	testRectangleEqaul: function() {
		var r1 = new Rectangle(1,2,3,4);
		var r2 = new Rectangle(1,2,3,4);
		var r3 = new Rectangle(2,2,3,4);
		this.assert(r1.equals(r2));
		this.assert(!r1.equals(r3));
	}
	
});

TestCase.subclass('Tests.CouchdbTest.OtherTest', {
	testKlassGeneration: function() {
		var type = "ContentTextMorph";
		var klass = Class.forName(type);
        if (klass) {
            var morph = new klass();
            this.assertEquals(morph.getType(),type);
        } else {
            throw new Error("Error in deserializing Widget:" + type + ", no class");
        }
	},
	
	testArrayClean: function() {
		var myAry = ["a", {$id:12, $ref:122, $type:"notype"}, "b"];
		var restorer = new Restorer();
		var resAry = restorer.cleanArray(myAry);
		this.assertEquals(resAry.length,2);
		this.assertEquals(resAry[0],"a");
		this.assertEquals(resAry[1],"b");
		
		myAry = ["a", {$id:12, $ref:undefined, $type:"notype"}, "b"];
		resAry = restorer.cleanArray(myAry);
		this.assertEquals(resAry.length,2);
		this.assertEquals(resAry[0],"a");
		this.assertEquals(resAry[1],"b");
		
		
		myAry = ["a", {$id:12, noRef:"impo", $type:"notype"}, "b"];
		resAry = restorer.cleanArray(myAry);
		this.assertEquals(resAry.length,3);
		this.assertEquals(resAry[0],"a");
		this.assertEquals(resAry[2],"b");
	},
	
	testCurryInLoop: function() {
		var ary = [];
		var fun = function(z) {return z;};
		for(var i = 0; i < 10; i++){
			var curryFun = fun.curry(i);
			ary[i] = curryFun;
		}
		for(var i = 0; i < 10; i++){
			this.assertEquals(ary[i](),i);
		}
		
	},
	
	testEvalRef:function() {
		var parentObj = {};
		var childObj = {val:"test234"};
		parentObj.r1 = childObj;
		parentObj.r2 = childObj;
		parentObj.r1.val = "e";
		this.assertEquals(parentObj.r1.val,parentObj.r2.val);
		parentObj.r2 = eval("parentObj.r1");
		parentObj.r1.val = "eee";
		this.assertEquals(parentObj.r1.val,parentObj.r2.val);
	},
	
	testAddMethod: function() {
		
		Object.subclass("BaseTestClass", {
			foo: function() {
				return "BaseTestClass::foo";
			}
		});
			
		BaseTestClass.subclass("TestSubClass", {
			foo: function() {
				return "TestSubClass::foo";
			}
		});
		this.assertEquals(TestSubClass.prototype.foo(), "TestSubClass::foo", "wrong foo in TestSubClass proto");
			
		TestSubClass.subclass("TestSubSubClass", {
			bar: function() {
				return "TestSubSubClass::bar";
			}
		});
		this.assertEquals(TestSubSubClass.prototype.bar(), "TestSubSubClass::bar", "wrong bar in TestSubSubClass proto");
		
		var testSubObj = new TestSubClass();
		this.assertEquals(testSubObj.foo(), "TestSubClass::foo", "wrong foo in TestSubClass");
		
		var testSubSubObj = new TestSubSubClass();
		this.assertEquals(testSubSubObj.foo(), "TestSubClass::foo", "wrong foo in TestSubSubClass");
		
		
	},
	
	testAddMethodWebcards: function() {
		var mo = new Morph( new lively.scene.Rectangle(new Rectangle(1,2,3,4)));
		var propName = "rawNode";
		this.assert(mo.stopWords.include(propName),propName+" is no stopWord in Morph");
		this.assert(mo.shouldNotSerializePropertie(propName),"Morph wants to serial "+propName);
		
		var temo = new TextMorph();
		this.assert(temo.stopWords.include(propName),propName+" is no stopWord");
		this.assert(temo.shouldNotSerializePropertie(propName),"Textmorph wants to serial "+propName);
	}
});

console.log("couchdb test loaded");

});//end of module