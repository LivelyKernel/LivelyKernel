module('lively.groups.tests.Groups').requires('lively.TestFramework', 'lively.groups.Core').toRun(function() {

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