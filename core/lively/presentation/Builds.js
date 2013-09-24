module('lively.presentation.Builds').requires().toRun(function() {

/* This module defines the logic necessar to allow for "builds" or slide
 * animations. These are basically multiple steps that are sequentially executed
 * either after each other or initiated by user input to change the slide content,
 * e.g. let objects appear/disappear. This particular version allows for generic
 * builds but the build step definitions are modeled for representing builds
 * defined in OpenOffice slides. Those can be imported and converted to
 * lively.presentation.Slides.PageMorphs and the pages will then contain builds if
 * those were exisiting in the imported version.
 *
 * To make a morph build-aware apply the BuildStep trait to it
 * Trait('lively.data.ODFImport.BuildStepTrait').applyTo(morph);
 * 
 * A build definition right now looks like: [{
 *        attributeName: "visibility",
 *        attributeValue: "visible",
 *        target: "slideElem1",
 *        when: "on-click"
 *    },{
 *        attributeName: "visibility",
 *        attributeValue: "hidden",
 *        target: "slideElem2",
 *        when: "with-previous"
 *    }]
 * attributeName and attributeValue are currently hardcoded. target is a morph
 * name. when can currently be: "on-click", "with-previous"
 *
 * Example:
   lively.BuildSpec('lively.presentation.Builds.Example').createMorph().openInWorldCenter();
 */

Trait('lively.presentation.Builds.BuildStepTrait', {

    computeInitBuildSteps: function(buildSteps) {
        // before the first build step, morphs need to be in a certain
        // state (visible or not). Given the buildSteps for a page this
        // computes the initial state.
        var targetsInitialized = [], initSteps = [];
        buildSteps.forEach(function(step) {
            if (!step.target
             || targetsInitialized.include(step.target)
             || !step.attributeName === 'visibility') return;
            targetsInitialized.push(step.target);
            initSteps.push({
                target: step.target,
                attributeName: 'visibility',
                attributeValue: step.attributeValue === 'visible' ? 'hidden' : 'visible',
                when: 'initial'
            });
        });
        return initSteps;
    },

    initBuildSteps: function() {
        if (!this.buildStepState) this.resetBuildSteps();
        if (this.buildStepState.index === undefined) this.buildStepForward(); // hides build step morphs that later appear
    },

    applyBuildSteps: function(steps, revert) {
        steps.forEach(function(step) {
            var target = this.submorphs.detect(function(m) { return m.name === step.target; });
            if (!target) return;
            if (step.attributeName === 'visibility') {
                var setToVisible = step.attributeValue === 'visible';
                if (revert) setToVisible = !setToVisible;
                target.setVisible(setToVisible);
            }
        }, this);
    },

    moreBuildStepsForward: function() {
        return this.buildStepState
            && this.buildStepState.steps.length
            && (this.buildStepState.index === undefined 
             || this.buildStepState.index < this.buildStepState.steps.length);
    },

    moreBuildStepsBackward: function() {
        return this.buildStepState
            && this.buildStepState.steps.length
            && this.buildStepState.index;
    },

    buildStepForward: function() {
        var stepsToRun = [];
        if (this.buildStepState.index === undefined) {
            stepsToRun = this.computeInitBuildSteps(this.buildStepState.steps);
            this.buildStepState.index = 0;
        } else {
            // find the next "on-click" build step
            var steps = this.buildStepState.steps;
            stepsToRun.push(steps[this.buildStepState.index]);
            for (var i = this.buildStepState.index + 1; i <= steps.length; i++) {
                var step = steps[i];
                if (step && step.when !== 'on-click') { stepsToRun.push(step); continue; }
                this.buildStepState.index = i; break;
            }
        }
        this.applyBuildSteps(stepsToRun.compact());
    },

    buildStepBackward: function() {
        var stepsToRun = [];
        if (this.buildStepState.index === undefined) {
            return;
        } else {
            // find the next "on-click" build step
            var steps = this.buildStepState.steps;
            for (var i = this.buildStepState.index - 1; i >= 0; i--) {
                var step = steps[i];
                stepsToRun.push(step);
                if (step && step.when !== 'on-click') { continue; }
                this.buildStepState.index = i; break;
            }
        }
        this.applyBuildSteps(stepsToRun.compact(), true);
    },
    
    setBuildSteps: function(steps) {
        this.resetBuildSteps();
        this.buildStepState.steps = steps;
    },

    resetBuildSteps: function() {
        this.buildStepState = {steps: [], index: undefined};
        this.submorphs && this.submorphs.invoke('setVisible', true);
    }

});

lively.BuildSpec('lively.presentation.Builds.Example', {
    _Extent: lively.pt(246.0,221.0),
    _Fill: Color.rgb(240,240,240),
    // buildStepState: {index: undefined,steps: []},
    className: "lively.morphic.Box",
    name: "BuildStepExample",
    submorphs: [{
        _Position: lively.pt(40, 200),
        _Extent: lively.pt(50, 20),
        className: "lively.morphic.Button",
        label: 'reset',
        connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, 'fire', this.owner, 'reset');
        }
    }, {
        _Position: lively.pt(20, 200),
        _Extent: lively.pt(20, 20),
        className: "lively.morphic.Button",
        label: '>',
        connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, 'fire', this.owner, 'buildStepForward');
        }
    }, {
        _Position: lively.pt(0, 200),
        _Extent: lively.pt(20, 20),
        className: "lively.morphic.Button",
        label: '<',
        connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, 'fire', this.owner, 'buildStepBackward');
        }
    }, {
        _Extent: lively.pt(77.0,67.0),
        _Fill: Color.rgb(204,204,204),
        _Position: lively.pt(126.0,31.0),
        className: "lively.morphic.Box",
        name: "slideElem2",
        submorphs: [{className: "lively.morphic.Text",textString: "2"}]
    },{
        _Extent: lively.pt(77.0,67.0),
        _Fill: Color.rgb(204,204,204),
        _Position: lively.pt(28.0,27.0),
        className: "lively.morphic.Box",
        name: "slideElem1",
        submorphs: [{className: "lively.morphic.Text",textString: "1"}]
    },{
        _Extent: lively.pt(77.0,67.0),
        _Fill: Color.rgb(204,204,204),
        _Position: lively.pt(32.0,118.0),
        className: "lively.morphic.Box",
        name: "slideElem3",
        submorphs: [{className: "lively.morphic.Text",textString: "3"}]
    },{
        _Extent: lively.pt(77.0,67.0),
        _Fill: Color.rgb(204,204,204),
        _Position: lively.pt(136.0,116.0),
        className: "lively.morphic.Box",
        name: "slideElem4",
        submorphs: [{className: "lively.morphic.Text",textString: "4"}]
    }],
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.reset();
    },
    reset: function reset() {
    // this.buildStepForward()
    // this.buildStepBackward()
    // this.reset()
    Trait('lively.presentation.Builds.BuildStepTrait').applyTo(this);
    this.setBuildSteps([{
        attributeName: "visibility",
        attributeValue: "visible",
        target: "slideElem1",
        when: "on-click"
    },{
        attributeName: "visibility",
        attributeValue: "hidden",
        target: "slideElem2",
        when: "with-previous"
    },{
        attributeName: "visibility",
        attributeValue: "visible",
        target: "slideElem3",
        when: "on-click"
    }]);
}
});

}) // end of module