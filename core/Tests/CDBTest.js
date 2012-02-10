module('Tests.CDBTest').requires('lively.TestFramework', 'apps.CDB').toRun(function() {

TestCase.subclass('Tests.CDBTest.RepositoryTest', 'running', {
    setUp: function() {
        this.repositoryName = 'cdb_test';
        this.repository = this.createNewRepository();

        this.repository.drop();
        this.repository.create();
        this.repository.initializeDesign();
    },

    tearDown: function() {
        //this.repository.drop();
    },

    createNewRepository: function() {
        return new CDB.Repository(new CouchDB(this.repositoryName, new URL('http://www.lively-kernel.org/couchbase')));
    },
},
'assertion', {
    testDraftSaveInEmptyRepository: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        try {
            mod.save();
            this.assert(false, 'Module must not be saved successfully');
        } catch (ex) {
            this.assert(ex instanceof CDB.Exception, 'No CDB exception was thrown');
            this.assertEquals(ex.message, 'Code Object is not assigned to a repository');
        }

        var cs = this.repository.createChangeSet();
        cs.add(mod); mod.save();

        try {
            var rep = this.createNewRepository();
            var mod_retrieved = rep.getCodeObject(CDB.Module, 'TestModule');
            this.assert(false, 'No active version should be available');
        } catch (ex) {
            this.assert(ex instanceof CDB.ObjectNotFoundException, 'Unexpected exception was thrown');
        }
    },

    testSaveCommitInEmptyRepository: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();
        cs.commit();

        var rep = this.createNewRepository();
        var mod_retrieved = rep.getCodeObject(CDB.Module, 'TestModule');

        this.assert(mod_retrieved);

        this.assertEquals(mod.name, mod_retrieved.name);
        this.assertEquals(mod.documentation, mod_retrieved.documentation);

        var revHistory = mod_retrieved.getRevisionHistory();

        this.assert(revHistory);
        this.assert(revHistory.currentRevision);
        this.assertEquals(revHistory.currentRevision.number, mod.revision.number);
    },

    testRetrieveActiveRevision: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();
        cs.commit();

        var activeRevision = mod.revision;

        cs = this.repository.createChangeSet();
        mod.documentation = 'Now the documentation has changed';

        cs.add(mod);
        mod.save();

        var rep = this.createNewRepository();
        var mod_retrieved = rep.getCodeObject(CDB.Module, 'TestModule');

        this.assert(mod_retrieved);

        this.assertEquals(mod.name, mod_retrieved.name);
        this.assertEquals(mod_retrieved.documentation, 'This is a test module');

        var revHistory = mod_retrieved.getRevisionHistory();

        this.assert(revHistory);
        this.assert(revHistory.currentRevision);
        this.assertEquals(revHistory.currentRevision.number, activeRevision.number);

        this.assertEquals(Properties.all(revHistory.revisions).length, 2);
        var draftRevision = revHistory.getRevision(mod.revision.number);
        this.assertEquals(draftRevision.status, 'draft');
    },

    testModuleClassMethod: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var cls2 = new CDB.Klass('ns1.TestClass');
        cls2.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        mod.addMethod(meth);

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        cs.add(cls);
        cls.save();

        cs.add(cls2);
        cls2.save();

        cs.add(meth);
        meth.save();

        cs.commit();

        var rep = this.createNewRepository();

        var mod_retrieved = rep.getCodeObject(CDB.Module, mod.name);
        this.assert(mod_retrieved, 'TestModule could not be retrieved.');
        this.assertEquals(mod.name, mod_retrieved.name, 'TestModule does not have the right name.');
        this.assertEquals(mod.documentation, mod_retrieved.documentation, 'TestModule does not have the right documentation.');

        var cls_retrieved = rep.getCodeObject(CDB.Klass, cls.name);
        this.assert(cls_retrieved, 'TestClass could not be retrieved.');
        this.assertEquals(cls.name, cls_retrieved.name, 'TestClass does not have the right name.');
        this.assertEquals(cls.documentation, cls_retrieved.documentation, 'TestClass does not have the right documentation.');

        cls_retrieved = rep.getCodeObject(CDB.Klass, cls2.name);
        this.assert(cls_retrieved, 'ns1.TestClass could not be retrieved.');
        this.assertEquals(cls2.name, cls_retrieved.name, 'ns1.TestClass does not have the right name.');
        this.assertEquals(cls2.documentation, cls_retrieved.documentation, 'ns1.TestClass does not have the right documentation.');

        var meth_retrieved = rep.getCodeObject(CDB.Klass, cls.name, CDB.Method, meth.name);
        this.assert(meth_retrieved, 'doSomething could not be retrieved.');
        this.assertEquals(meth.name, meth_retrieved.name, 'doSomething does not have the right name.');
        this.assertEquals(meth.documentation, meth_retrieved.documentation, 'doSomething does not have the right documentation.');
    },

    testListCodeObjects: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);
        mod.addMethod(meth);

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        cs.add(cls);
        cls.save();

        cs.add(meth);
        meth.save();

        cs.commit();

        var rep = this.createNewRepository();

        var modules = rep.listCodeObjects(CDB.Module);
        this.assert(modules, 'Could not retrieve modules from repository.');
        this.assertEquals(modules.length, 1, 'Could not retrieve TestModule.');
        this.assertEquals(modules[0].name, mod.name, 'TestModule does not have the right name.'); 

        var classes = rep.listCodeObjects(CDB.Klass, mod.name);
        this.assert(classes, 'Could not retrieve classes from repository.');
        this.assertEquals(classes.length, 1, 'Could not retrieve TestClass.');
        this.assertEquals(classes[0].name, cls.name, 'TestClass does not have the right name.');
    },

    testCommitWithoutSave: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cs = this.repository.createChangeSet();

        try {
            cs.add(mod);
            cs.commit();
        } catch (ex) {
            this.assert(ex instanceof CDB.ConsistencyException);
        }

        mod.save();
        cs.commit();
    },

    testSuperclass: function() {
        var cls = new CDB.Klass('MyClass');
        cls.superclass = 'YetAnotherClass';

        var cs = this.repository.createChangeSet();

        cs.add(cls);
        cls.save();

        cs.commit();

        var rep = this.createNewRepository();
        var cls_retrieved = rep.getCodeObject(CDB.Klass, 'MyClass');

        this.assert(cls_retrieved, 'MyClass could not be retrieved.');
        this.assertEquals(cls_retrieved.superclass, cls.superclass, 'MyClass does not have the right superclass.'); 
    },

    testModuleRequirements: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        mod.requirements.push('lively.ide');
        mod.requirements.push('apps.CouchDB');

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        cs.commit();

        var rep = this.createNewRepository();
        var mod_retrieved = rep.getCodeObject(CDB.Module, 'TestModule');

        this.assert(mod_retrieved);
        this.assertEquals(JSON.serialize(mod_retrieved.requirements), JSON.serialize(mod.requirements));
    },

    testLoadMethodWithoutClass: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);
        mod.addMethod(meth);

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        cs.add(cls);
        cls.save();

        cs.add(meth);
        meth.save();

        cs.commit();

        var rep = this.createNewRepository();
        var meth_retrieved = rep.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        this.assert(meth_retrieved, 'doSomething could not be retrieved.');
        this.assert(meth_retrieved.klass, 'doSomething has no class relation loaded.');

        this.assertEquals(meth_retrieved.klass.name, 'TestClass', 'doSomething\'s class name is not TestClass');
    },

    testListDraftModules: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cs = this.repository.createChangeSet();

        var objects = this.repository.listCodeObjects(CDB.Module, true);
        this.assertMatches([], objects);    

        cs.add(mod);
        mod.save();

        var objects = this.repository.listCodeObjects(CDB.Module, true);

        this.assert(objects);
        this.assertEquals(objects.length, 1);
        this.assertEquals(objects[0].name, mod.name);        

        cs.commit();
    },

    testCommitWithExistingDraft: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        var rep = this.createNewRepository();
        var cs_new = rep.createChangeSet();

        var mod_new = new CDB.Module('TestModule');
        mod_new.documentation = 'Another module documentation';

        cs_new.add(mod_new);
        mod_new.save();
    
        cs_new.commit();

        var rep_new = this.createNewRepository();
        var mod_retrieved = rep_new.getCodeObject(CDB.Module, mod_new.name);

        this.assertEquals(mod_retrieved.revision.number, mod_new.revision.number);
    },

    testGetDraftCodeObject: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        var rep = this.createNewRepository();
        var mod_retrieved = rep.getCodeObject(CDB.Module, mod.name, true);

        this.assertEquals(mod_retrieved.revision.number, mod.revision.number);
    },

    testModuleClassMethod2: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        mod.addMethod(meth);

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        cs.add(cls);
        cls.save();

        cs.add(meth);
        meth.save();

        cs.commit();

        var rep = this.createNewRepository();

        var mod_retrieved = rep.getCodeObject(CDB.Module, mod.name);
        this.assert(mod_retrieved, 'TestModule could not be retrieved.');
        this.assertEquals(mod.name, mod_retrieved.name, 'TestModule does not have the right name.');
        this.assertEquals(mod.documentation, mod_retrieved.documentation, 'TestModule does not have the right documentation.');

        var objects = mod_retrieved.getClasses();
        this.assertEquals(objects.length, 1, 'Could not retrieve classes from module.');
        var cls_retrieved = objects[0];
        this.assertEquals(cls.name, cls_retrieved.name, 'TestClass does not have the right name.');
        this.assertEquals(cls.documentation, cls_retrieved.documentation, 'TestClass does not have the right documentation.');

        var meth_retrieved = cls_retrieved.getMethod(meth.name);
        this.assert(meth_retrieved, 'doSomething could not be retrieved.');
        this.assertEquals(meth.name, meth_retrieved.name, 'doSomething does not have the right name.');
        this.assertEquals(meth.documentation, meth_retrieved.documentation, 'doSomething does not have the right documentation.');
    },

    testGetCodeObjectAfterDelete: function() {
        var cs = this.repository.createChangeSet();

        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        cs.add(mod);
        mod.save();

        this.assertEquals('draft', mod.revision.status, 'status should be "draft"');
        cs.commit();
        this.assertEquals('active', mod.revision.status, 'status should be "active"');

        var mod_retrieved = this.repository.getCodeObject(CDB.Module, 'TestModule');

        this.assertEquals(mod, mod_retrieved);
        this.assertEquals('active', mod_retrieved.revision.status, 'status should be "active"');

        cs = this.repository.createChangeSet();
        mod.deleteFromRepository();    

        cs.add(mod);
        mod.save();

        this.assertEquals('draft', mod.revision.status, 'status should be "draft"');
        cs.commit();
        this.assertEquals('deleted', mod.revision.status, 'status should be "deleted"');

        try {
            this.repository.getCodeObject(CDB.Module, 'TestModule');
            this.assert(false, 'should throw an exception');
        } catch (ex) {
            if (ex.isAssertion) throw ex; // caused by this.assert in the try block
            this.assert(ex instanceof CDB.ObjectNotFoundException, 'should throw CDB.ObjectNotFoundException');
        }
    },

    testDraftPropagatedOnRetrieval: function() {
        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        var rep = this.createNewRepository();
        var cls_retrieved = rep.getCodeObject(CDB.Klass, 'TestClass', true);
        
        var methods_retrieved = cls_retrieved.getMethods();
        this.assertEquals(1, methods_retrieved.length, 'Should return one method');
        this.assertEquals('draft', methods_retrieved[0].revision.status, 'Could not find doSomething as draft.');
    },
    testMethodDraftsAfterBranching1: function() {
        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.commit();


        var rep1 = this.createNewRepository();
        var cs1 = rep1.createChangeSet();

        var meth1_retrieved = rep1.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs1.add(meth1_retrieved);
        meth1_retrieved.save()

        var rep2 = this.createNewRepository();
        var cs2 = rep2.createChangeSet();
        
        var meth2_retrieved = rep2.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs2.add(meth2_retrieved);
        meth2_retrieved.save()

        var rep3 = this.createNewRepository();
        var cls_retrieved = rep3.getCodeObject(CDB.Klass, 'TestClass', true);
        
        var methods_retrieved = cls_retrieved.getMethods()
        this.assertEquals(3, methods_retrieved.length, 'Should return three methods');

        
        var activeRevisionFound = false;
        var draftRevisionNumber = false;
        
        for (var i = 0; i < methods_retrieved.length; i++) {

            if (methods_retrieved[i].revision.status == 'active') {
                if (activeRevisionFound != false) {
                    this.fail('Two active revisions found');
                } else {
                    activeRevisionFound = i; continue;
                }
            }

            this.assertEquals(methods_retrieved[i].revision.parentNumber, meth.revision.number, 'Method not derived from base revision');

            if (draftRevisionNumber != false) {
                this.assert(draftRevisionNumber != methods_retrieved[i].revision.number, 'Draft revisions should not be equal');
            }

            draftRevisionNumber = methods_retrieved[i].revision.number;            
        }
    },
    testMethodDraftsAfterBranching2: function() {
        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.commit();


        var rep1 = this.createNewRepository();
        var cs1 = rep1.createChangeSet();

        var meth1_retrieved = rep1.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs1.add(meth1_retrieved);
        meth1_retrieved.save();
        meth1_retrieved.save();
        meth1_retrieved.save();


        var rep3 = this.createNewRepository();
        var cls_retrieved = rep3.getCodeObject(CDB.Klass, 'TestClass', true);
        
        var methods_retrieved = cls_retrieved.getMethods()
        this.assertEquals(2, methods_retrieved.length, 'Should return two methods');

        
        var activeRevisionFound = false;
        
        for (var i = 0; i < methods_retrieved.length; i++) {

            if (methods_retrieved[i].revision.status == 'active') {
                if (activeRevisionFound != false) {
                    this.fail('Two active revisions found');
                } else {
                    activeRevisionFound = true; continue;
                }
            }

			var revisionHistory = methods_retrieved[0].getRevisionHistory();
			var currentRevision = methods_retrieved[i].revision;

			this.assert(currentRevision.number != meth.revision.number, 'Incorrent draft revision number (1)');
			currentRevision = revisionHistory.getRevision(currentRevision.parentNumber);
			this.assert(currentRevision.number != meth.revision.number, 'Incorrent draft revision number (2)');
			currentRevision = revisionHistory.getRevision(currentRevision.parentNumber);
			this.assert(currentRevision.number != meth.revision.number, 'Incorrent draft revision number (3)');
			currentRevision = revisionHistory.getRevision(currentRevision.parentNumber);
			this.assert(currentRevision.number == meth.revision.number, 'Incorrent draft revision number (4)');
        }
    },
    testMethodDraftsAfterBranching3: function() {
        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.commit();


        var rep1 = this.createNewRepository();
        var cs1 = rep1.createChangeSet();

        var meth1_retrieved = rep1.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs1.add(meth1_retrieved);
        meth1_retrieved.save();


        var rep2 = this.createNewRepository();
        var cs2 = rep2.createChangeSet();

        var meth2_retrieved = rep2.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs2.add(meth2_retrieved);
        cs2.add(meth2_retrieved.parent);
	
        meth2_retrieved.deleteFromRepository();
        meth2_retrieved.parent.save();
        meth2_retrieved.save();

	cs2.commit();


        var rep3 = this.createNewRepository();
        var cs3 = rep3.createChangeSet();

        var cls3_retrieved = rep3.getCodeObject(CDB.Klass, 'TestClass');
	var meth3 = new CDB.Method('doSomething');
        meth3.documentation = 'This method does something';
        meth3.source = 'function(myarg) {\n\talert(myarg);\n}';
        
	cls3_retrieved.addMethod(meth3);
	
        cs3.add(cls3_retrieved);
        cs3.add(meth3);

        cls3_retrieved.save();
        meth3.save();

	cs3.commit();


        var rep4 = this.createNewRepository();
        var cs4 = rep4.createChangeSet();

        var meth4_retrieved = rep4.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs4.add(meth4_retrieved);
        meth4_retrieved.save();


        var rep5 = this.createNewRepository();
        var cs5 = rep5.createChangeSet();

        var meth5_retrieved = rep5.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');
    
        cs5.add(meth5_retrieved);
        meth5_retrieved.save();

	cs5.commit();


        var rep6 = this.createNewRepository();
        var cs6 = rep6.createChangeSet();

        var meth6_retrieved = rep6.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs6.add(meth6_retrieved);
        meth6_retrieved.save();
        meth6_retrieved.save();


        var rep7 = this.createNewRepository();
        var cs7 = rep7.createChangeSet();

        var meth7_retrieved = rep7.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs7.add(meth7_retrieved);
        meth7_retrieved.save();


	/* CHECKING */

        var rep8 = this.createNewRepository();
        var cls8_retrieved = rep8.getCodeObject(CDB.Klass, 'TestClass', true);
        
        var methods_retrieved = cls8_retrieved.getMethods()
        this.assertEquals(3, methods_retrieved.length, 'Should return three methods');

        
        var activeRevisionFound = false;
        var draftRevisionNumbers = [];
        
        for (var i = 0; i < methods_retrieved.length; i++) {

            if (methods_retrieved[i].revision.status == 'active') {
                if (activeRevisionFound != false) {
                    this.fail('Two active revisions found');
                } else {
                    activeRevisionFound = i; continue;
                }
            }

			var currentRevision = methods_retrieved[i].revision;
			var revisionHistory = methods_retrieved[0].getRevisionHistory();

			while (currentRevision.number != revisionHistory.getCurrentRevision().number) {
				currentRevision = revisionHistory.getRevision(currentRevision.parentNumber);
			}
			
			draftRevisionNumbers.push(methods_retrieved[i].revision.number);
        }

		this.assertEquals(2, draftRevisionNumbers.uniq().length, 'Did not find two different draft revisions');
    },
    testSaveWithoutChangeSetAdd: function() {
        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.commit();


        var rep1 = this.createNewRepository();
        var cs1 = rep1.createChangeSet();

        var meth1_retrieved = rep1.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        try {
            meth1_retrieved.save()
            this.assert(false, 'save without change set assigned should throw an exception');
        } catch (ex) {
            if (ex.isAssertion) throw ex; // caused by this.assert in the try block
            this.assert(ex instanceof CDB.Exception, 'should throw CDB.Exception');
        }
    },
    testParentRevisionForChangeSets: function() {
       var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.commit();


        var rep1 = this.createNewRepository();
        var cs1 = rep1.createChangeSet();

        var meth1_retrieved = rep1.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        cs1.add(meth1_retrieved);
        meth1_retrieved.save()

        cs1.commit();


        /* CHECKING */
    
        var rep3 = this.createNewRepository();
        var revHistory = rep3.getRevisionHistory();

        this.assert(revHistory != null, 'Change set revision does not exist');
        var currentRev = revHistory.getCurrentRevision();
        this.assert(currentRev != null, 'Change set revision history has current revision');
        this.assert(currentRev.parentNumber != null, 'Current change set revision has parent');

        var parentRev = revHistory.getRevision(currentRev.parentNumber);
        this.assert(parentRev != null, 'Change set revision history contains parent revision');
        this.assert(parentRev.parentNumber == null, 'Parent change set revision has no parent'); 
     },





    testCreateAfterDelete: function() {
        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        cs.add(cls);
        cls.save();

        cs.commit();

        // now delete everything
        var cs = this.repository.createChangeSet();

        cs.add(cls);

        cls.deleteFromRepository();
        cls.save();

        cs.commit();

        // now try to recreate it
        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        cs.add(cls);
        cls.save();

        cs.commit();
    },

    testCreateOnDraftAfterDelete: function() {
        var cs = this.repository.createChangeSet();

        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        cs.add(mod);
        mod.save();

        cs.commit();

        // now delete everything
        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.deleteFromRepository();
        mod.save();

        cs.commit();

        // now try to recreate it
        var cs = this.repository.createChangeSet();

        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        cs.add(mod);
        mod.save();

        // do not commit

        var rep = this.createNewRepository();
        var cs = rep.createChangeSet();

        var mod = rep.getCodeObject(CDB.Module, 'TestModule', true);

        cs.add(mod);
        cs.commit();
    },

    testCheckLazilyLoaded: function() {
        var cs = this.repository.createChangeSet();

        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        cls.addMethod(meth);
        mod.addMethod(meth);

        cs.add(mod);
        cs.add(cls);
        cs.add(meth);

        mod.save();
        cls.save();
        meth.save();

        cs.commit();

        var rep = this.createNewRepository();
        var mod = rep.getCodeObject(CDB.Module, 'TestModule');

        var classes = mod.getClasses();
        this.assertEquals(classes[0].name, 'TestClass', 'TestClass could not be retrieved.');

        var methods = classes[0].getMethods();
        this.assertEquals(methods[0].name, 'doSomething', 'doSomething could not be retrieved.');
    },
    testConflictCodeObjectRevision1: function() {
        /*

TEST 1 - should succeed - save a new code object that exists already as draft
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(b) create module M1
	(b) save module M1

TEST 2 - should succeed - save a new code object that exists already as deleted
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(a) delete module M1
	(a) commit
	(b) create module M1
	(b) save module M1   

TEST 3 - should fail - save a new code object that exists already as active
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(b) create module M1
	(b) save module M1   

TEST 4 - should succeed - save an existing code object that exists as draft now
	(a) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(b) begin
	(b) save module M1
	(a) save module M1

TEST 5 - should succeed - save an existing code object that was deleted in the meantime
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(b) get module M1
	(a) delete module M1
	(a) commit
	(b) save module M1

TEST 6 - should succeed - save an existing code object that was committed in the meantime
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(b) save module M1
	(b) commit
	(a) save module M1

TEST 7 - should succeed - commit a new code object that exists already as draft
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(b) create module M1
	(b) save module M1
	(a) commit   

TEST 8 - should succeed - commit a new code object that exists already as deleted
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(a) delete module M1
	(a) commit
	(b) create module M1
	(b) save module M1
	(a) create module M1
	(a) save module M1
	(b) commit

TEST 9 - should succeed - commit an existing code object that exists as draft now
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(b) save module M1
	(a) save module M1
	(b) commit

TEST 10 - should fail - commit an existing code object that was deleted in the meantime
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(a) save module M1
	(b) delete module M1
	(b) commit
	(a) commit

TEST 11 - should fail - commit an existing code object that was committed in the meantime
	(a) begin
	(b) begin
	(a) create module M1
	(a) save module M1
	(a) commit
	(a) save module M1
	(b) save module M1
	(b) commit
	(a) commit
*/

        // save a new code object that exists already as draft
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        var mod2 = new CDB.Module('TestModule');
        mod2.documentation = 'This is a test module';

        cs1.add(mod1);
        cs2.add(mod2);
        
        mod1.save();
        mod2.save();

        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision(), null, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    

    },
    testConflictCodeObjectRevision2: function() {
        // save a new code object that exists already as deleted
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        var mod2 = new CDB.Module('TestModule');
        mod2.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.deleteFromRepository();
        mod1.save();
        cs1.commit();

        cs2.add(mod2);
        mod2.save();
        

        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod1.getRevisionHistory().currentRevision.number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision3: function() {
        // save a new code object that exists already as active
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        var mod2 = new CDB.Module('TestModule');
        mod2.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        cs2.add(mod2);

        try {
            mod2.save();
            this.assert(false, 'Module should not be saved');
        } catch (ex) {
            this.assert(ex instanceof CDB.ConsistencyException, 'Unexpected exception thrown');
        }


        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod1.getRevisionHistory().currentRevision.number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod1.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision5: function() {
        // save an existing code object that was deleted in the meantime
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        var mod2 = rep2.getCodeObject(CDB.Module, 'TestModule');
        
        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.deleteFromRepository();
        mod1.save();
        cs1.commit();

        cs2.add(mod2);
        mod2.save();


        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod1.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision4: function() {
        // save an existing object that exists as draft now
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        var mod2 = rep2.getCodeObject(CDB.Module, 'TestModule');
        cs2.add(mod2);
        mod2.save();
        
        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.save();


        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod1.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod1.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision6: function() {
        // save an existing code object that was committed in the meantime
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        var mod2 = rep2.getCodeObject(CDB.Module, 'TestModule');
        cs2.add(mod2);
        mod2.save();
        cs2.commit();
        
        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.save();


        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod2.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod1.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision7: function() {
        // commit a new code object that exists already as draft
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        var mod2 = new CDB.Module('TestModule');
        mod2.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();

        cs2.add(mod2);
        mod2.save();
        cs2.commit();
        

        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod2.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision8: function() {
        // commit a new code object that exists already as deleted
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        var mod2 = new CDB.Module('TestModule');
        mod2.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.deleteFromRepository();
        mod1.save();
        cs1.commit();

        cs2.add(mod2);
        mod2.save();

        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.save();

        cs2.commit();
        

        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod2.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision9: function() {
        // commit an existing code object that exists as draft now
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        var mod2 = rep2.getCodeObject(CDB.Module, 'TestModule');
        cs2.add(mod2);
        mod2.save();

        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.save();
        
        cs2.commit();
        

        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod2.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision10: function() {
        // commit an existing code object that was deleted in the meantime
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.save();
        
        var mod2 = rep2.getCodeObject(CDB.Module, 'TestModule');
        cs2.add(mod2);
        mod2.deleteFromRepository();
        cs2.commit();

        try {
            cs1.commit();
            this.assert(false, 'Module should not be committed');
        } catch (ex) {
            this.assert(ex instanceof CDB.ConsistencyException, 'Unexpected exception thrown');
        }
        

        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod2.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },
    testConflictCodeObjectRevision11: function() {
        // commit an existing code object that was committed in the meantime
        
        var rep1 = this.createNewRepository();        
        var rep2 = this.createNewRepository();

        var cs1 = rep1.createChangeSet();
        var cs2 = rep2.createChangeSet();

        var mod1 = new CDB.Module('TestModule'); 
        mod1.documentation = 'This is a test module';

        cs1.add(mod1);
        mod1.save();
        cs1.commit();

        cs1 = rep1.createChangeSet();
        cs1.add(mod1);
        mod1.save();
        
        var mod2 = rep2.getCodeObject(CDB.Module, 'TestModule');
        cs2.add(mod2);
        mod2.save();
        cs2.commit();

        try {
            cs1.commit();
            this.assert(false, 'Module should not be committed');
        } catch (ex) {
            this.assert(ex instanceof CDB.ConsistencyException, 'Unexpected exception thrown');
        }
        

        var rep3 = this.createNewRepository();
        var mod3 = rep3.getCodeObject(CDB.Module, 'TestModule', true);
        
        this.assertEquals(mod3.getRevisionHistory().getCurrentRevision().number, mod2.getRevisionHistory().getCurrentRevision().number, 'TestModule has wrong current revision');
        this.assertEquals(mod3.getRevisionHistory().getLastRevision().number, mod2.getRevisionHistory().getLastRevision().number, 'TestModule has wrong last revision');    
    },











testCodeObjectLanguage: function() {

        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        meth.language = 'JavaScript';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.commit();

        var rep = this.createNewRepository();
        var meth_retrieved = rep.getCodeObject(CDB.Klass, 'TestClass', CDB.Method, 'doSomething');

        this.assertEquals(meth_retrieved.language, meth.language, 'Method does not have the proper language.');
},
testSVNRevision: function() {

        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        meth.language = 'JavaScript';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.svnBase = 'http://www.lively-kernel.org/repository/webwerkstatt';
        cs.svnRevision = 111046;
        
        cs.commit();

        var rep = this.createNewRepository();
        var rev = rep.getRevisionHistory().getLastRevision();

        this.assertEquals(rev.svnBase, cs.svnBase, 'SVN base directory is incorrect');
        this.assertEquals(rev.svnRevision, cs.svnRevision, 'SVN revision is incorrect');
},
testTransientChangeSet: function() {

        var cs = this.repository.createChangeSet();

        var cls = new CDB.Klass('TestClass');
        cls.documentation = 'Here is the class summary';

        var meth = new CDB.Method('doSomething');
        meth.documentation = 'This method does something';
        meth.source = 'function(myarg) {\n\talert(myarg);\n}';
        meth.language = 'JavaScript';
        cls.addMethod(meth);

        cs.add(cls);
        cs.add(meth);

        cls.save();
        meth.save();

        cs.svnBase = 'http://www.lively-kernel.org/repository/webwerkstatt';
        cs.svnRevision = 111046;
        
        cs.commit();

        var rep = this.createNewRepository();
        var rev = rep.getRevisionHistory().getLastRevision();

        this.assertEquals(rev.svnBase, cs.svnBase, 'SVN base directory is incorrect');
        this.assertEquals(rev.svnRevision, cs.svnRevision, 'SVN revision is incorrect');
    },
});

TestCase.subclass('Tests.CDBTest.CodeGenerationTest',
'running', {
    setUp: function() {
        this.repositoryName = 'cdb_test';
        this.repository = this.createNewRepository();

        this.repository.drop();
        this.repository.create();
        this.repository.initializeDesign();
    },

    tearDown: function() {
        //this.repository.drop();
    },
    createNewRepository: function() {
        return new CDB.Repository(new CouchDB(this.repositoryName, new URL('http://www.lively-kernel.org/couchbase')));
    },
},
'assertion', {
    testEmptyModuleGeneration: function() {
        var mod = new CDB.Module('TestModule');
        mod.documentation = 'This is a test module';

        mod.requirements.push('lively.ide');
        mod.requirements.push('apps.CouchDB');

        var cs = this.repository.createChangeSet();

        cs.add(mod);
        mod.save();

        cs.commit();

        

        // this.assert(mod_retrieved);
        // this.assertEquals(JSON.serialize(mod_retrieved.requirements), JSON.serialize(mod.requirements));
    },
});

}) // end of module