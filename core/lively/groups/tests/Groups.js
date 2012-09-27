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

lively.morphic.tests.TestCase.subclass('lively.groups.tests.Groups.GroupTest', 
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
},
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
    testAddPropertyToMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addProperty('testProp', 2);
        this.assertEquals(2, group.getMembers()[0].testProp);
        this.assertEquals(2, group.getMembers()[1].testProp);
    },
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
    testPerformOnMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.perform('setFill', [null]);
        this.assertEquals(null, group.getMembers()[0].getFill());
        this.assertEquals(null, group.getMembers()[1].getFill());
    },
    testPerformOnMembersContinuesOnErrors: function() {
        var group = new lively.groups.ObjectGroup();
        var xyzMorph = this.newTestMorph();
        group.addMembers([this.newTestMorph(), this.newTestMorph(), xyzMorph]);
        xyzMorph.addScript(function xyzMethod() {
            this.xyz = '123';
        });
        group.perform('xyzMethod', []);
        this.assertEquals('123', xyzMorph.xyz);
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
});

}) // end of module