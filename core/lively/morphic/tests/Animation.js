module('lively.morphic.tests.Animation').requires('lively.morphic.tests.Helper', 'lively.morphic.Animation').toRun(function() {

// delete lively.morphic.tests.Animation.Atomic
AsyncTestCase.subclass('lively.morphic.tests.Animation.BasicBehavior',// lively.morphic.tests.MorphTests.prototype,
'testing', {
    testAnimationInstructionAppearAndDisapear: function() {
        var morph = {visible:false, setVisible: function(arg) { this.visible = arg; }};
        new lively.morphic.Animation.Appear('withPrevious', morph).run();
        this.assertEquals(true, morph.visible, 'appear');
        new lively.morphic.Animation.Disappear('withPrevious', morph).run();
        this.assertEquals(false, morph.visible, 'disappear');
        this.done();
    },

    testAnimationSequence: function() {
        var test = this,
            morphs = Array.range(1,2).map(function(i) {
                return {visible: false, setVisible: function(arg) { this.visible = arg; }}; }),
            animSeq = new lively.morphic.Animation.Sequence('withPrevious', [
                new lively.morphic.Animation.Appear('withPrevious', morphs[0]),
                new lively.morphic.Animation.Appear('withPrevious', morphs[1])]),
            nextStep = animSeq.run();
        this.assertEquals(true, morphs[0].visible, 'morph 1');
        this.assertEquals(true, morphs[1].visible, 'morph 2');
        this.assertEqualState({steps: [], when: ''}, nextStep, 'nextStep');
        this.done();
    },

    testAnimationSequenceWithStop: function() {
        var test = this,
            morphs = Array.range(1,3).map(function(i) {
                return {visible: false, setVisible: function(arg) { this.visible = arg; }}; }),
            animStep = new lively.morphic.Animation.Sequence('withPrevious', [
                new lively.morphic.Animation.Appear('withPrevious', morphs[0]),
                new lively.morphic.Animation.Appear('withPrevious', morphs[1]),
                new lively.morphic.Animation.Appear('onClick', morphs[2])]),
            nextStep = animStep.run();

        this.assertEquals(true, morphs[0].visible, 'morph 1');
        this.assertEquals(true, morphs[1].visible, 'morph 2');
        this.assertEquals(false, morphs[2].visible, 'morph 3');
        this.assertEquals(1, nextStep.steps.length, 'nextStep');
        this.assertIdentity(morphs[2], nextStep.steps[0].target, 'nextStep target');

        nextStep = nextStep.run();
        this.assertEquals(true, morphs[2].visible, 'morph 3');
        this.assertEqualState({steps: [], when: ''}, nextStep, 'nextStep');
        this.done();
    }
});



}) // end of module
