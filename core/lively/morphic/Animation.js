module('lively.morphic.Animation').requires().toRun(function() {

// lively.morphic.Animation.Base.withAllSubclasses().invoke('remove')
Object.subclass("lively.morphic.Animation.Base",
"initializing", {
    initialize: function(when) {
        this.when = when;
    }
},
'animation', {
    run: function() {
        throw new Error('Subclasses should override #run!');
    }
});

lively.morphic.Animation.Base.subclass("lively.morphic.Animation.Sequence",
"initializing", {
    initialize: function($super, when, animations) {
        $super(when);
        this.steps = animations;
    }
},
'animation', {
    run: function() {
        var steps = this.steps;
        if (!steps.length) return this;
        // always run first animation. Only run those animations after the
        // first that have "when" set to "withPrevious"
        var animsToRun = this.steps.slice(1).groupBy(function(anim) { return anim.when === 'withPrevious'; });
        var toRun = [steps[0]].concat(animsToRun['true'] || []);
        toRun.invoke('run');
        var animsInNextStep = animsToRun['false'] || [];
        return new lively.morphic.Animation.Sequence(animsInNextStep.length ?
            animsInNextStep.first().when : '', animsInNextStep);
    }
});

lively.morphic.Animation.Base.subclass("lively.morphic.Animation.MorphProperty",
"initializing", {
    initialize: function($super, when, target, propertyName, value) {
        $super(when);
        this.target = target;
        this.propertyName = propertyName;
        this.value = value;
    }
},
'animation', {
    run: function() {
        this.target['set' + Strings.camelCaseString(this.propertyName)](this.value);
    }
});

lively.morphic.Animation.MorphProperty.subclass("lively.morphic.Animation.Appear",
"initializing", {
    initialize: function($super, when, target) {
        $super(when, target, 'visible', true);
    }
});

lively.morphic.Animation.MorphProperty.subclass("lively.morphic.Animation.Disappear",
"initializing", {
    initialize: function($super, when, target) {
        $super(when, target, 'visible', false);
    }
});

}) // end of module