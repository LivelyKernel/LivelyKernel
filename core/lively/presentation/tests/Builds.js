module('lively.presentation.tests.Builds').requires('lively.presentation.Builds', 'lively.morphic.tests.Helper').toRun(function() {

TestCase.subclass('lively.presentation.tests.Builds.Steps',
'running', {
    setUp: function() {
        var sut = this.sut = {applied: []};
        Trait('lively.presentation.Builds.BuildStepTrait').applyTo(sut);
        sut.applyBuildSteps = function(steps, revert) {
            sut.applied.push({steps: steps, reverted: !!revert});
        };
    }
},
"testing", {
    testInitMorphsFromAnimSpec: function()  {
        var steps = [
            {attributeName: "visibility",attributeValue: "visible",target: "id1",when: "on-click"},
            {attributeName: "visibility",attributeValue: "hidden",target: "id2",when: "with-previous"},
            {attributeName: "visibility", attributeValue: "visible",target: "id3",when: "on-click"}];
        var expectedInitSteps = [
                {attributeName: 'visibility', attributeValue: 'hidden', target: 'id1', when: 'initial'},
                {attributeName: 'visibility', attributeValue: 'visible', target: 'id2', when: 'initial'},
                {attributeName: 'visibility', attributeValue: 'hidden', target: 'id3', when: 'initial'}];
        this.sut.setBuildSteps(steps);
        this.sut.buildStepForward();
        this.assertEqualState([{steps: expectedInitSteps, reverted: false}], this.sut.applied, 'build step init');
    },
    testBuildForward: function()  {
        var steps = [
            {attributeName: "visibility",attributeValue: "visible",target: "id1",when: "on-click"},
            {attributeName: "visibility",attributeValue: "hidden",target: "id2",when: "with-previous"},
            {attributeName: "visibility", attributeValue: "visible",target: "id3",when: "on-click"}];
        this.sut.setBuildSteps(steps);
        this.sut.buildStepForward();
        this.sut.applied = [];
        var expected = [{
            steps: [{attributeName: "visibility",attributeValue: "visible",target: "id1",when: "on-click"},
                    {attributeName: "visibility",attributeValue: "hidden",target: "id2",when: "with-previous"}],
            reverted: false
        },{
            steps: [{attributeName: "visibility", attributeValue: "visible",target: "id3",when: "on-click"}],
            reverted: false
        }, {steps: [],reverted: false}];
        this.sut.buildStepForward();
        this.sut.buildStepForward();
        this.sut.buildStepForward();
        this.assertEqualState(expected, this.sut.applied, 'build step forward');
    },
    testBuildBackward: function()  {
        var steps = [
            {attributeName: "visibility",attributeValue: "visible",target: "id1",when: "on-click"},
            {attributeName: "visibility",attributeValue: "hidden",target: "id2",when: "with-previous"},
            {attributeName: "visibility", attributeValue: "visible",target: "id3",when: "on-click"}];
        this.sut.setBuildSteps(steps);
        this.sut.buildStepForward();
        this.sut.buildStepForward();
        this.sut.buildStepForward();
        this.sut.applied = [];
        var expected = [{
            steps: [{attributeName: "visibility", attributeValue: "visible",target: "id3",when: "on-click"}],
            reverted: true
        }, {
            steps: [{attributeName: "visibility",attributeValue: "hidden",target: "id2",when: "with-previous"},
                    {attributeName: "visibility",attributeValue: "visible",target: "id1",when: "on-click"}],
            reverted: true
        },{steps: [],reverted: true}];
        this.sut.buildStepBackward();
        this.sut.buildStepBackward();
        this.sut.buildStepBackward();
        this.assertEqualState(expected, this.sut.applied, 'build step backward');
    }

});

}) // end of module