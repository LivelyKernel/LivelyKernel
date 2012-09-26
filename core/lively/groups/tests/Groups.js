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
    testAnnotateObjectWithGroup: function() {
        var morph = new lively.morphic.Morph();
        var group = new lively.groups.ObjectGroup('testGroup');
        morph.addGroup(group);
        this.assert('testGroup', morph.getGroups().name);
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
    testAddScriptToMembers: function() {
        var group = new lively.groups.ObjectGroup('myGroup');
        group.addMembers([new lively.morphic.Morph(), new lively.morphic.Text()]);
        group.addScriptToMembers(function testScript() {});
        // this.assertEquals('myGroup', group.members.first().testScript.group.name);
        // this.assertEquals('myGroup', group.members.second().testScript.group.name);
    }
});

}) // end of module