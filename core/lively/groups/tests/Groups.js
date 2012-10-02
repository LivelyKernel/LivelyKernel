module('lively.groups.tests.Groups').requires('lively.TestFramework', 'lively.groups.Core', 'lively.morphic.tests.Morphic').toRun(function() {

TestCase.subclass('lively.groups.tests.Groups.ExtensionsTest', 'testing', {
    testAnnotateScriptWithID: function() {
        var func = function() {};
        func.setID();
        this.assert(func.id);
        func.setID('123456789');
        this.assert(func.id);
    },
    testAnnotateScriptWithTimestamp: function() {
        var func = function() {};
        func.setTimestamp();
        this.assert(func.timestamp);
    },
    testAddingScriptsAnnotatesWithIdAndTimestamp: function() {
        var morph = new lively.morphic.Morph();
        morph.addScript(function testFunction() {});
        this.assert(morph.testFunction.id);
        this.assert(morph.testFunction.timestamp);
    },
    testAddingScriptsAnnotatesWithExistingIdAndTimestamp: function() {
        var morph = new lively.morphic.Morph();
        var func = function testFunction() {};
        var id = '1234567890';
        var timestamp = new Date('Thu Sep 27 2012 15:00:00 GMT+0200 (CEST)');
        func.setID(id);
        func.setTimestamp(timestamp);
        morph.addScript(func);
        this.assertEquals(id, morph.testFunction.id);
        this.assertEquals(timestamp, morph.testFunction.timestamp);
    },
    testOverwritingScriptsCreatesScriptHistory: function() {
        var morph = new lively.morphic.Morph();
        morph.addScript(function testFunction() {});
        var firstID = morph.testFunction.id;
        morph.addScript(function testFunction() {});
        var secondID = morph.testFunction.id;
        morph.addScript(function testFunction() {});

        this.assertEquals(2, morph.testFunction.history.size());
        this.assert(morph.testFunction.history.include(firstID));
        this.assert(morph.testFunction.history.include(secondID));
    },
    testAnnotateScriptWithGroup: function() {
        var func = function() {};
        func.setGroupID('123456789');
        this.assertEquals('123456789', func.groupID);
    },
    testAnnotateScriptWithHistory: function() {
        var func = function() {};
        func.setHistory(['1', '2', '3']);
        this.assertEquals(3, func.history.size());
    },
    testAddingScriptsCreatesAHistory: function() {
        var morph = new lively.morphic.Morph();
        morph.addScript(function testScript() {});
        morph.addScript(function testScript() {});
        morph.addScript(function testScript() {});
        this.assertEquals(2, morph.testScript.history.size());
    },
    testAnnotateMorphWithGroup: function() {
        var morph = new lively.morphic.Morph();
        var group = new lively.groups.ObjectGroup('testGroup');
        morph.addGroup(group);
        this.assert('testGroup', morph.getGroups().first().name);
    },
    testAnnotateMorphWithGroups: function() {
        var morph = new lively.morphic.Morph();
        var firstGroup = new lively.groups.ObjectGroup('firstGroup');
        var secondGroup = new lively.groups.ObjectGroup('secondGroup');
        morph.addGroup(firstGroup);
        morph.addGroup(firstGroup);
        morph.addGroup(secondGroup);
        this.assertEquals(2, morph.getGroups().size());
    }
});

lively.morphic.tests.TestCase.subclass('lively.groups.tests.Groups.GroupTestCase',
'helpers', {
    newTestMorph: function(optGroup) {
        var m = new lively.morphic.Morph();
        if (optGroup) {
            m.addGroup(optGroup);
        }
        lively.morphic.World.current().addMorph(m);
        return m;
    },
    serialize: function(morph) {
        var serializer = lively.persistence.Serializer.createObjectGraphLinearizerForCopy();
        var copyPlugin = new CopyOnlySubmorphsPlugin();
        copyPlugin.root = morph;
        serializer.addPlugin(copyPlugin);
        return serializer.serialize(morph);
    },
    deserialize: function(json) {
        return lively.persistence.Serializer.createObjectGraphLinearizerForCopy().deserialize(json);
    }
});

lively.groups.tests.Groups.GroupTestCase.subclass('lively.groups.tests.Groups.GroupCreationTest', 
'testing', {
    testCreateGroup: function() {
        var group = new lively.groups.ObjectGroup('newGroup');
        this.assertEquals(group.name, 'newGroup');
    },
    testAddMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMember(this.newTestMorph());

        group.addMembers([this.newTestMorph(group), this.newTestMorph()]);
        this.assertEquals(3, group.getMembers().size());
    },
    testMemberKnowsItsGroups: function() {
        var firstGroup = new lively.groups.ObjectGroup('firstGroup');
        var secondGroup = new lively.groups.ObjectGroup('secondGroup');
        var morph = this.newTestMorph();
        morph.addGroup(firstGroup);
        morph.addGroup(secondGroup);
        var groupNames = morph.getGroups().collect(function (ea) {
            return ea.name;
        });
        this.assert(groupNames.include('firstGroup'));
        this.assert(groupNames.include('secondGroup'));
    },
    testFindGroupMembersByID: function() {
        var morphA = new lively.morphic.Morph();
        var morphB = new lively.morphic.Morph();
        var morphC = new lively.morphic.Morph();
        morphA.addMorph(morphB);

        var group = new lively.groups.ObjectGroup();
        morphA.addGroup(group);
        morphB.addGroup(group);

        var members = morphA.findGroupMembersByID(group.groupID);
        this.assert(members.include(morphA))
        this.assert(members.include(morphB))
        this.assert(!members.include(morphC))
    },
    testWorldKnowsGroups: function() {
        var firstGroup = new lively.groups.ObjectGroup('firstGroup');
        var secondGroup = new lively.groups.ObjectGroup('secondGroup');
        var thirdGroup = new lively.groups.ObjectGroup('thirdGroup');

        this.newTestMorph(firstGroup).addGroup(secondGroup);
        this.newTestMorph(thirdGroup);

        var allGroupNames = lively.morphic.World.current().allObjectGroups().collect(function (ea) {
            return ea.name;
        });
        this.assert(allGroupNames.include('firstGroup'));
        this.assert(allGroupNames.include('secondGroup'));
        this.assert(allGroupNames.include('thirdGroup'));
    },
});

lively.groups.tests.Groups.GroupTestCase.subclass('lively.groups.tests.Groups.GroupOperationsTest', 
'testing', {
    testAddPropertyToMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addProperty('testProp', 2);
        this.assertEquals(2, group.getMembers()[0].testProp);
        this.assertEquals(2, group.getMembers()[1].testProp);
    },
    testPerformOnMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.perform('setFill', [null]);
        this.assertEquals(null, group.getMembers()[0].getFill());
        this.assertEquals(null, group.getMembers()[1].getFill());
    },
    testPerformOnMembersContinuesThroughErrors: function() {
        var group = new lively.groups.ObjectGroup();
        var xyzMorph = this.newTestMorph();
        group.addMembers([this.newTestMorph(), this.newTestMorph(), xyzMorph]);
        xyzMorph.addScript(function xyzMethod() {
            this.xyz = '123';
        });
        group.perform('xyzMethod', []);
        this.assertEquals('123', xyzMorph.xyz);
    },
    testEvaluateForMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.evaluate('this.setFill(null)');
        this.assertEquals(null, group.getMembers()[0].getFill());
        this.assertEquals(null, group.getMembers()[1].getFill());
    },
    testEvaluateForMembersContinuesThroughErrors: function() {
        var group = new lively.groups.ObjectGroup();
        var xyzMorph = this.newTestMorph();
        group.addMembers([this.newTestMorph(), this.newTestMorph(), xyzMorph]);
        xyzMorph.addScript(function xyzMethod() {
            this.xyz = '123';
        });
        group.evaluate('this.xyzMethod()');
        this.assertEquals('123', xyzMorph.xyz);
    }
});

lively.groups.tests.Groups.GroupTestCase.subclass('lively.groups.tests.Groups.GroupScriptsTest', 
'testing', {
    testAddScriptToMembersAddsTheScript: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addScript(function testScript() {});
        this.assert(group.getMembers()[0].testScript);
        this.assert(group.getMembers()[1].testScript);
    },
    testAddScriptToMembersAnnotatesScript: function() {
        var group = new lively.groups.ObjectGroup();
        group.groupID = '123';
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addScript(function testScript() {});
        this.assertEquals('123', group.getMembers()[0].testScript.groupID);
        this.assertEquals('123', group.getMembers()[1].testScript.groupID);
    },
    testAddScriptToMembersAnnotatesMember: function() {
        var group = new lively.groups.ObjectGroup();
        group.groupID = '123';
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addScript(function testScript() {});
        this.assert(group.getMembers()[0].getGroups().include(group));
        this.assert(group.getMembers()[1].getGroups().include(group));
    },
    testGroupGetScriptsOfGroup: function() {
        var group = new lively.groups.ObjectGroup();
        var morph = this.newTestMorph(group);

        group.addScript(function testScript1() {});
        group.addScript(function testScript2() {});
        morph.addScript(function testScript3() {});
        
        this.assertEquals(2, group.getScripts().size());
    },
    testMorphGetScriptsOfGroup: function() {
        var group = new lively.groups.ObjectGroup();
        var morph = this.newTestMorph(group);

        group.addScript(function testScript1() {});
        group.addScript(function testScript2() {});
        morph.addScript(function testScript3() {});

        this.assertEquals(2, morph.getScriptsForGroup(group).size());
    },
    testGroupScriptAdditionOverwrites: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);
        var func = function testFunction() {};

        func.setID('1');
        group.addScript(func);

        func.setID('2');
        morphA.addScript(func);

        func.setID('3');
        group.addScript(func);
        this.assertEquals('3', morphA.testFunction.id);
        this.assertEquals('3', morphB.testFunction.id);
        this.assertEquals(group.groupID, morphA.testFunction.groupID);
        this.assertEquals(group.groupID, morphB.testFunction.groupID);
    },
    testAddScriptCreatesCorrectHistory: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);

        var firstID = group.addScript(function testScript() {}).id;
        var secondID = group.addScript(function testScript() {}).id;
        group.addScript(function testScript() {});

        this.assert(group.getMembers()[0].testScript.history.include(firstID));
        this.assert(group.getMembers()[0].testScript.history.include(secondID));
        this.assert(group.getMembers()[1].testScript.history.include(firstID));
        this.assert(group.getMembers()[1].testScript.history.include(secondID));
    },
    testIndividualScriptAdditionOverwrites: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);
        var func = function testFunction() {};

        func.setID('1');
        group.addScript(func);

        func.setID('2');
        morphA.addScript(func);
        this.assertEquals('2', morphA.testFunction.id);
        this.assertEquals('1', morphB.testFunction.id);
        this.assert(group.groupID !== morphA.testFunction.groupID);
        this.assertEquals(group.groupID, morphB.testFunction.groupID);
    },
    testRemoveScriptRemovesAllGroupScripts: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        var script = group.addScript(function testFunction() {});
        group.removeScript(script);

        this.assertEquals(undefined, morphA.testFunction);
        this.assertEquals(undefined, morphB.testFunction);
    },
    testRemoveScriptLeavesIndividualScripts: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        group.addScript(function testFunction() {});
        morphA.addScript(function testFunction() {});

        group.removeScript('testFunction');

        this.assert(morphA.testFunction);
    },
    testRemoveScriptDoesntRemoveDerivedScripts: function() {
        var group = new lively.groups.ObjectGroup();
        var morph = this.newTestMorph(group);

        var oldScript = group.addScript(function testFunction() {});
        var newScript = group.addScript(function testFunction() {});

        group.removeScript(oldScript);

        this.assertEquals(newScript.id, morph.testFunction.id);
    },
    testRemoveScriptDoesntRemoveAmbiguousScriptsByName: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        morphA.addScript(function testFunction() {});
        morphA.testFunction.groupID = group.groupID;
        morphB.addScript(function testFunction() {});
        morphB.testFunction.groupID = group.groupID;

        group.removeScript('testFunction');
        this.assert(morphA.testFunction);
        this.assert(morphB.testFunction);
    }
});

lively.groups.tests.Groups.GroupTestCase.subclass('lively.groups.tests.Groups.GroupUpdatesTest',
'testing', {
    testUnavailableGroupMemberReceivesUpdate: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        var func = function testFunction() {};
        func.setID('1');
        group.addScript(func);

        var serializedMorphB = this.serialize(morphB);
        morphB.remove();

        func.setID('2');
        group.addScript(func);

        var morphB = this.deserialize(serializedMorphB);
        morphB.updateGroupBehavior();
        this.assertEquals('2', morphB.testFunction.id);
    },
    testUnavailableGroupMemberBringsUpdate: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        var func = function testFunction() {};
        func.setID('1');
        group.addScript(func);

        var serializedMorphB = this.serialize(morphB);
        morphB.remove();

        func.setID('2');
        group.addScript(func);

        var serializedMorphA = this.serialize(morphA);
        morphA.remove();

        morphB = this.deserialize(serializedMorphB);
        lively.morphic.World.current().addMorph(morphB);
        morphB.updateGroupBehavior();
        this.assertEquals('1', morphB.testFunction.id);

        morphA = this.deserialize(serializedMorphA);
        lively.morphic.World.current().addMorph(morphA);
        morphA.updateGroupBehavior();
        this.assertEquals('2', morphB.testFunction.id);
    },
    testConflictingGroupUpdatesDontOverwriteButAreAConflict: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        var func = function testFunction() {};
        func.setID('1');
        group.addScript(func);

        var serializedMorphB = this.serialize(morphB);
        morphB.remove();

        func.setID('A');
        group.addScript(func);

        var serializedMorphA = this.serialize(morphA);
        morphA.remove();

        morphB = this.deserialize(serializedMorphB);
        lively.morphic.World.current().addMorph(morphB);
        morphB.updateGroupBehavior();

        func.setID('B');
        group.addScript(func);

        morphA = this.deserialize(serializedMorphA);
        lively.morphic.World.current().addMorph(morphA);
        morphA.updateGroupBehavior();

        this.assertEquals('A', morphA.testFunction.id);
        this.assertEquals('B', morphB.testFunction.id);

        this.assertEquals(1, group.getConflicts().size());
        var ids = group.getConflicts().first().collect(function (ea) {return ea.id})
        this.assert(ids.include('A'));
        this.assert(ids.include('B'));
    },
    testAGroupConflictCanBeResolvedByAddingAScript: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        var func = function testFunction() {};
        func.setID('1');
        group.addScript(func);

        var serializedMorphB = this.serialize(morphB);
        morphB.remove();

        func.setID('A');
        group.addScript(func);

        var serializedMorphA = this.serialize(morphA);
        morphA.remove();

        morphB = this.deserialize(serializedMorphB);
        lively.morphic.World.current().addMorph(morphB);
        morphB.updateGroupBehavior();
        
        func.setID('B');
        group.addScript(func);

        morphA = this.deserialize(serializedMorphA);
        lively.morphic.World.current().addMorph(morphA);
        morphA.updateGroupBehavior();

        func.setID('2');
        group.addScript(func);

        this.assertEquals(0, group.getConflicts().size());
        this.assertEquals('2', group.getMembers()[0].testFunction.id);
        this.assertEquals('2', group.getMembers()[1].testFunction.id);
    },
    testRemoveScriptAffectsUnavailableMorphsEventually: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        group.addScript(function testFunction() {});

        var serializedMorphA = this.serialize(morphA);
        morphA.remove();

        group.removeScript('testFunction');

        morphA = this.deserialize(serializedMorphA);
        lively.morphic.World.current().addMorph(morphA);
        morphA.updateGroupBehavior();

        this.assertEquals(undefined, morphA.testFunction);
        this.assertEquals(undefined, morphB.testFunction);
    },
    testLoadingAMorphMightRemoveGroupScript: function() {
        var group = new lively.groups.ObjectGroup();
        var morphA = this.newTestMorph(group);
        var morphB = this.newTestMorph(group);

        group.addScript(function testFunction() {});

        var serializedMorphA = this.serialize(morphA);
        morphA.remove();

        group.removeScript('testFunction');

        var serializedMorphB = this.serialize(morphB);
        morphB.remove();

        morphA = this.deserialize(serializedMorphA);
        lively.morphic.World.current().addMorph(morphA);

        morphB = this.deserialize(serializedMorphB);
        lively.morphic.World.current().addMorph(morphB);

        morphB.updateGroupBehavior();

        this.assertEquals(undefined, morphA.testFunction);
        this.assertEquals(undefined, morphB.testFunction);
    }
});

lively.groups.tests.Groups.GroupTestCase.subclass('lively.groups.tests.Groups.GroupMemberTest',
'testing', {
   testLeavingGroupDisconnectsMember: function() { 
        var group = new lively.groups.ObjectGroup();
        var morph = this.newTestMorph(group);

        group.addScript(function testFunction1() {});
        group.addScript(function testFunction2() {});

        morph.leaveGroup(group);

        this.assertEquals(0, morph.getGroups().size());
   },
   testLeavingGroupDisconnectsAllScripts: function() {
        var group = new lively.groups.ObjectGroup();
        var morph = this.newTestMorph(group);

        group.addScript(function testFunction1() {});
        group.addScript(function testFunction2() {});

        group.removeMember(morph);

        this.assert(morph.testFunction1);
        this.assert(morph.testFunction1);
        this.assert(!morph.testFunction1.groupID);
        this.assert(!morph.testFunction2.groupID);
    },
});

}) // end of module