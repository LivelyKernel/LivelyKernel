module('lively.groups.tests.Groups').requires('lively.TestFramework', 'lively.groups.Core').toRun(function() {

TestCase.subclass('lively.groups.tests.Groups.ScriptTest', 'testing', {
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
        func.setGroup('123456789', ['1', '2', '3']);
        this.assertEquals(func.group.id, '123456789');
        this.assertEquals(func.group.history.size(), 3);
    }
});

TestCase.subclass('lively.groups.tests.Groups.GroupTest', 'testing', {
    testCreateGroup: function() {
        var group = new lively.groups.ObjectGroup('newGroup');
        this.assertEquals(group.name, 'newGroup');
    },
    testAddMembers: function() {
        var group = new lively.groups.ObjectGroup();
        group.addMember({});
        group.addMembers([new lively.morphic.Text(), {a:2}]);
        this.assertEquals(3, group.members.size());
    },
    testAddScriptToMembers: function() {
        var group = new lively.groups.ObjectGroup('myGroup');
        group.addMembers([{}, new lively.morphic.Text()]);
        group.addScriptToMembers(function testScript() {});
        // this.assertEquals('myGroup', group.members.first().testScript.group.name);
        // this.assertEquals('myGroup', group.members.second().testScript.group.name);
    }
});

}) // end of module