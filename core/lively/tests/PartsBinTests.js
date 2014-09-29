module('lively.tests.PartsBinTests').requires('lively.TestFramework', 'lively.PartsBin').toRun(function() {

TestCase.subclass('lively.tests.PartsBinTests.OnlinePartsBinTest',
'running', {
    setUp: function($super) {
        $super();

        var part = new lively.morphic.Box(lively.rect(0,0,262,239));
        part.setFill(Color.rgb(0,0,204));
        part.setBorderWidth(0);
        part.setName('TestObject');

        var ellipse = new lively.morphic.Morph(
            new lively.morphic.Shapes.Ellipse(lively.rect(0,0,100,100))
        );
        part.addMorph(ellipse);
        ellipse.setFill(Color.rgb(158,0,0));
        ellipse.setPosition(lively.pt(28.0,17.0));
        ellipse.setName('Ellipse');

        ellipse = ellipse.copy();
        part.addMorph(ellipse);
        ellipse.setFill(Color.rgb(0,204,0));
        ellipse.setPosition(lively.pt(80.0,61.0));
        ellipse.setName('Ellipse1');

        ellipse = ellipse.copy();
        part.addMorph(ellipse);
        ellipse.setFill(Color.rgb(255,215,102));
        ellipse.setPosition(lively.pt(127.0,110.0));
        ellipse.setName('Ellipse2');

        this.testPartItem = part.getPartItem();
        this.testPartItem.uploadPart(false, true); // FIXME: should not be uploaded
    },
	tearDown: function($super) {
		$super();

        this.testPartItem.del();

		lively.PartsBin.partsSpaceNamed('PartsBin').clearCache();
		if (this.urlsForDeletion)
			this.urlsForDeletion.forEach(function(url) { new WebResource(url).del() })
	}
},
'helper', {
	deleteURLAfterTest: function(url) {
		if (!this.urlsForDeletion) this.urlsForDeletion = [];
		this.urlsForDeletion.push(url);
	}
},
'testing', {
	testLoadNamesFromDefaultPartsBin: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin');
		partsSpace.load();
		this.assert(partsSpace.getPartNames().length > 0, 'something is wrong, no names');
	},
	testGetPartItemNamed: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		this.assertEquals('TestObject.svg', item.getLogoURL().filename());
		this.assertEquals('TestObject.json', item.getFileURL().filename());
		this.assertEquals('TestObject.metainfo', item.getMetaInfoURL().filename());
		this.assertEquals('PartsBin/', item.getFileURL().getDirectory().filename());
	},
	testLoadPartItem: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.load();
		this.assert(item.json.include('TestObject'), 'loaded JSON is strange');
	},
	testLoadPart: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.loadPart();
		this.assert(item.part, 'part not loaded!')
		this.assert(item.part.name.startsWith('TestObject'));
	},
    testOverwriteTest: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.loadPart();
		var asked = false;
		var morph = item.part, newItem = morph.getPartItem();
		(function askToOverwrite(url) {
            asked = true;
		}).addToObject(newItem, 'askToOverwrite')
		newItem.uploadPart(true, true);
		this.assert(asked === false, 'asked when it shouldnt have');
		this.assertEquals(newItem.part, morph);
		// setTime modifies the object, also updating all the other places where it is referenced
		morph.getPartsBinMetaInfo().lastModifiedDate.setTime(Date.now() - 10^3);
		newItem.uploadPart(true, true);
		this.assert(asked === true, 'didnt ask when it should have');
    },
	testPartGetsUpdatedMetaInfo: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject'),
			id = Date.now();
		item.loadPartMetaInfo().loadedMetaInfo.id = id;
		this.assertEquals(item.getMetaInfo().id, id, 'setting the value to be tested failed.');
		item.uploadMetaInfoOnly();
		item.loadPart();
		this.assertEquals(id, item.part.getPartsBinMetaInfo().id, 'meta info not updated!')
	},
	testCreatePartsSpace: function() {
		var name = 'PartsBin/testCreatePartsSpace/',
			url = URL.common.domain.withFilename(name),
			partsSpace = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpace.ensureExistance();
		var webR = new WebResource(url);
		this.assert(webR.exists(), 'PartsBin not created!!!');
	},

	testCopyPartItem: function() {
		// create a parts space
		var name = 'PartsBin/testCopyPartItemTarget/',
			url = URL.common.domain.withFilename(name),
			partsSpaceTo = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpaceTo.ensureExistance();

		this.testPartItem.copyToPartsSpace(partsSpaceTo);
		partsSpaceTo.load();
		var copiedItem = partsSpaceTo.getPartItemNamed('TestObject')
		this.assert(copiedItem, 'part item not copied!');
		this.assert(new WebResource(copiedItem.getFileURL()).exists(), 'not created on server: ' + copiedItem.getFileURL());

		copiedItem.loadPart();
		var copiedPart =  copiedItem.part;

		this.assert(copiedPart.partsBinMetaInfo, "no partsBinMetaInfo")
		this.assertEquals(url.withFilename(copiedPart.name + '.json'), copiedPart.getPartItem().getFileURL());

		this.assertEquals(url, copiedPart.partsBinMetaInfo.getPartsSpaceURL());
	},
	testMovePartItem: function() {
		// create a parts space to copy the part to
		var name = 'PartsBin/TestSpace1/',
			url = URL.common.domain.withFilename(name),
			partsSpace1 = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpace1.ensureExistance();

		// create a parts space to move the part to
		var name = 'PartsBin/TestSpace2/',
			url = URL.common.domain.withFilename(name),
			partsSpace2 = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpace2.ensureExistance();

		this.testPartItem.copyToPartsSpace(partsSpace1);

		var item2 = partsSpace1.getPartItemNamed(this.testPartItem).loadPart();

		item2.moveToPartsSpace(partsSpace2);

		partsSpace1.load();
		partsSpace2.load();

		this.assert(!partsSpace1.partItems['TestObject'], 'part item not deleted!');
		this.assert(partsSpace2.partItems['TestObject'], 'part item not moved to target space!');
		this.assertEquals(partsSpace2.getName(), item2.part.getPartsBinMetaInfo().getPartsSpaceName());
	},
	testLoadPartHasRevisionOnLoad: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.loadPart();
		this.assert(item.part.partsBinMetaInfo.revisionOnLoad || item.part.partsBinMetaInfo.lastModifiedDate, 'no revision on load')
	},
	testUpdateRevisionOnLoadAfterPublishing: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.loadPart();
		var oldRevision = item.part.partsBinMetaInfo.revisionOnLoad
		    || item.part.partsBinMetaInfo.lastModifiedDate;

        item.uploadPart(false, true);
        var newRevision = item.part.partsBinMetaInfo.revisionOnLoad
            || item.part.partsBinMetaInfo.lastModifiedDate;
        this.assert(oldRevision !== newRevision, 'rev did not change')
	}
});

AsyncTestCase.subclass('lively.tests.PartsBinTests.AsyncOnlinePartsBinTest', {
	testLoadPartVersions: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		connect(item, "partVersions", {cb : function() {
            this.assert(item.partVersions, 'partVetsions not loaded!')
            this.assert(item.partVersions.length > 0, 'no partVersiosn');
            this.done();
		}.bind(this)}, "cb", {removeAfterUpdate: true})
		item.loadPartVersions();
	},
	testLoadRevision: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		connect(item, "partVersions", {cb : function() {
            var rev = item.partVersions.last().rev,
                obj = item.loadRevision(rev);
            this.assertEquals(obj.name , 'TestObject');
            this.done();
		}.bind(this)}, "cb", {removeAfterUpdate: true})
		item.loadPartVersions();
	},
	deleteURLAfterTest: function(url) {
		if (!this.urlsForDeletion) this.urlsForDeletion = [];
		this.urlsForDeletion.push(url);
	},
	tearDown: function($super) {
		$super();
		lively.PartsBin.partsSpaceNamed('PartsBin').clearCache();
		if (this.urlsForDeletion)
			this.urlsForDeletion.forEach(function(url) { new WebResource(url).del() })
	},
});

lively.tests.PartsBinTests.OnlinePartsBinTest.subclass('lively.tests.PartsBinTests.DroppableBehaviorTest',
'helper', {
	get: function(name) {
		return lively.PartsBin.getPart(name, 'PartsBin/DroppableBehaviors');
	}
},
'testing', {
	testDropColorBehaviorOnMorph: function() {
		var colorBehavior = this.get('ColorBehavior');
		this.assert(colorBehavior, 'no color behavior there')

		colorBehavior.setDropColor(Color.green);

		var morph = lively.morphic.Morph.makeRectangle(0,0, 100, 100);
		morph.setFill(Color.red);

		colorBehavior.applyTo(morph)
		this.assertEquals(Color.green, morph.getFill(), 'behavior not applied');
	}
});

TestCase.subclass('lively.tests.PartsBinTests.MetaInfo',
'running', {
    setUp: function($super) {
        $super();
                this.world = lively.morphic.World.current()
    }
},
'testing', {
    test01MetaInfoOfLoadedPartHasLastModDate: function() {
        var part = this.world.loadPartItem("Rectangle", "PartsBin/Basic"),
            partItem = part.getPartItem(),
            metaInfo = part.getPartsBinMetaInfo(),
            actualDate = partItem.getFileURL().asWebResource().head().lastModified;
        this.assertEquals(actualDate, metaInfo.getLastModifiedDate(), 'metainfo last mod');
    },

    test02LastModDateIsUsedForUpload: function() {
        var putCallCount = 0, putOptions, webR;
        this.spyInClass(WebResource, 'put', function(source, mimeType, options) {
            putCallCount++;
            putOptions = options;
            webR = this;
        });

        var part = this.world.loadPartItem("Rectangle", "PartsBin/Basic"),
            partItem = part.getPartItem(),
            metaInfo = part.getPartsBinMetaInfo(),
            actualDate = partItem.getFileURL().asWebResource().head().lastModified,
            now = new Date();

        // upload
        part.copyToPartsBin();
        this.assertEquals(actualDate, putOptions.ifUnmodifiedSince, 'no if-unmodified-since PUT');

        // trigger upload done
        webR.lastModified = now;
        webR.status = {isDone: Functions.True, isSuccess: Functions.True,
                       code: function() { return 200 }};

        // check if upload done handling worked
        this.assertEquals(now, metaInfo.getLastModifiedDate(), 'metainfo last mod');
    }
});

}); // end of module
