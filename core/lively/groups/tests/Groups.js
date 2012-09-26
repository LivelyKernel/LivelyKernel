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
        group.addPropertyToMembers('testProp', 2);
        this.assertEquals(2, group.getMembers()[0].testProp);
        this.assertEquals(2, group.getMembers()[1].testProp);
    },
    testAddScriptToMembersAddsTheScript: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addScriptToMembers(function testScript() {});
        this.assert(group.getMembers()[0].testScript);
        this.assert(group.getMembers()[1].testScript);
    },
    testAddScriptToMembersAnnotatesScript: function() {
        var group = new lively.groups.ObjectGroup();
        group.groupID = '123';
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addScriptToMembers(function testScript() {});
        this.assertEquals('123', group.getMembers()[0].testScript.groupID);
        this.assertEquals('123', group.getMembers()[1].testScript.groupID);
    },
    testAddScriptToMembersAnnotatesMember: function() {
        var group = new lively.groups.ObjectGroup();
        group.groupID = '123';
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.addScriptToMembers(function testScript() {});
        this.assert(group.getMembers()[0].getGroups().include(group));
        this.assert(group.getMembers()[1].getGroups().include(group));
    },
    testPerformOnMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([this.newTestMorph(), this.newTestMorph()]);
        group.performOnMembers('setFill', [null]);
        this.assertEquals(null, group.getMembers()[0].getFill());
        this.assertEquals(null, group.getMembers()[1].getFill());
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
    }
});

}) // end of module