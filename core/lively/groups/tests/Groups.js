module('lively.groups.tests.Groups').requires('lively.TestFramework', 'lively.groups.Core').toRun(function() {

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

TestCase.subclass('lively.groups.tests.Groups.GroupTest', 'testing', {
    testCreateGroup: function() {
        var group = new lively.groups.ObjectGroup('newGroup');
        this.assertEquals(group.name, 'newGroup');
    },
    testAddMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMember(new lively.morphic.Morph());
        group.addMembers([new lively.morphic.Text(), new lively.morphic.Morph()]);
        this.assertEquals(3, group.members.size());
    },
    testMemberKnowsItsGroups: function() {
        var firstGroup = new lively.groups.ObjectGroup('firstGroup');
        var secondGroup = new lively.groups.ObjectGroup('secondGroup');
        var morph = new lively.morphic.Morph();
        morph.addGroup(firstGroup);
        morph.addGroup(secondGroup);
        var groupNames = morph.getGroups().collect(function (ea) {
            return ea.name;
        });
        this.assert(groupNames.include('firstGroup'));
        this.assert(groupNames.include('secondGroup'));
    },
    testAddScriptToMembersAddsTheScript: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMembers([new lively.morphic.Morph(), new lively.morphic.Text()]);
        group.addScriptToMembers(function testScript() {});
        this.assert(group.members[0].testScript);
        this.assert(group.members[1].testScript);
    },
    testAddScriptToMembersAnnotatesScript: function() {
        var group = new lively.groups.ObjectGroup();
        group.groupID = '123';
        group.addMembers([new lively.morphic.Morph(), new lively.morphic.Text()]);
        group.addScriptToMembers(function testScript() {});
        this.assertEquals('123', group.members[0].testScript.groupID);
        this.assertEquals('123', group.members[1].testScript.groupID);
    },
    testAddScriptToMembersAnnotatesMember: function() {
        var group = new lively.groups.ObjectGroup();
        group.groupID = '123';
        group.addMembers([new lively.morphic.Morph(), new lively.morphic.Text()]);
        group.addScriptToMembers(function testScript() {});
        this.assert(group.members[0].getGroups().include(group));
        this.assert(group.members[1].getGroups().include(group));
    },

});

}) // end of module