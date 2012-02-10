module('Tests.ScriptingTests').requires('lively.TestFramework', 'lively.PartsBin').toRun(function() {

TestCase.subclass('Tests.ScriptingTests.OnlinePartsBinTest',
'running', {
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
	testPartGetsUpdatedMetaInfo: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject'),
			id = Date.now();
		item.loadPartMetaInfo().loadedMetaInfo.id = id;
		item.uploadMetaInfoOnly();
		item.loadPart();
		this.assertEquals(id, item.part.getPartsBinMetaInfo().id, 'meta info not updated!')
	},


	testLoadPartVersions: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.loadPartVersions();
		this.assert(item.partVersions, 'partVetsions not loaded!')
		this.assert(item.partVersions.length > 0, 'no partVersiosn');
	},
	testLoadRevision: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		var rev = item.loadPartVersions().partVersions.last().rev;
		var obj = item.loadRevision(rev);
		this.assertEquals(obj.name , 'TestObject')
	},

	testCreatePartsSpace: function() {
		var name = 'PartsBin/testCreatePartsSpace/',
			url = URL.codeBase.withFilename(name),
			partsSpace = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpace.ensureExistance();
		var webR = new WebResource(url);
		this.assert(webR.exists(), 'PartsBin not created!!!');
	},

	testCopyPartItem: function() {
		// create a parts space
		var name = 'PartsBin/testCopyPartItemTarget/',
			url = URL.codeBase.withFilename(name),
			partsSpaceTo = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpaceTo.ensureExistance();

		var item = lively.PartsBin.getPartItem('TestObject');
		item.copyToPartsSpace(partsSpaceTo);
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
			url = URL.codeBase.withFilename(name),
			partsSpace1 = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpace1.ensureExistance();

		// create a parts space to move the part to
		var name = 'PartsBin/TestSpace2/',
			url = URL.codeBase.withFilename(name),
			partsSpace2 = lively.PartsBin.addPartsSpaceNamed(name);
		this.deleteURLAfterTest(url)
		partsSpace2.ensureExistance();

		var item = lively.PartsBin.getPartItem('TestObject');
		item.copyToPartsSpace(partsSpace1);

		var item2 = partsSpace1.getPartItemNamed(item.name).loadPart()

		item2.moveToPartsSpace(partsSpace2)

		partsSpace1.load();
		partsSpace2.load();

		this.assert(!partsSpace1.partItems['TestObject'], 'part item not deleted!');
		this.assert(partsSpace2.partItems['TestObject'], 'part item not moved to target space!');
		this.assertEquals(partsSpace2.getName(), item2.part.getPartsBinMetaInfo().getPartsSpaceName());
	},
	testGetHeadRevision: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		var rev = item.getHeadRevision();
                alertOK('all revs ' + item.loadPartVersions().partVersions)
                var lastRev = item.loadPartVersions().partVersions.first().rev;
            	this.assertEquals(rev, lastRev , 'revs not equal')
	},
	testLoadPartHasRevisionOnLoad: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.loadPart();
		this.assert(item.part.partsBinMetaInfo.revisionOnLoad, 'no revision on load')
	},
	testUpdateRevisionOnLoadAfterPublishing: function() {
		var partsSpace = lively.PartsBin.partsSpaceNamed('PartsBin'),
			item = partsSpace.getPartItemNamed('TestObject');
		item.loadPart();
		var oldRevisionOnLoad = item.part.partsBinMetaInfo.revisionOnLoad;

                item.uploadPart();
                this.assert(oldRevisionOnLoad !== item.part.partsBinMetaInfo.revisionOnLoad, 
                    'rev did not change')
	},






})

Tests.ScriptingTests.OnlinePartsBinTest.subclass('Tests.ScriptingTests.DroppableBehaviorTest',
'helper', {
	get: function(name) {
		return lively.PartsBin.getPart(name, 'PartsBin/DroppableBehaviors');
	},
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
	},
});
}) // end of module