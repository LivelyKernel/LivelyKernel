module('lively.morphic.constraints.tests.Core').requires("lively.TestFramework", 'lively.morphic.constraints.Core').toRun(function() {

TestCase.subclass('lively.morphic.constraints.tests.BasicConstraintSolving',
"testing", {
  
  testSolveNumericConstraint: function() {
    var state = {variable: 1},
        constraint = {
          epsilon: function() { return 0.01; },
          error: function() { return state.variable; },
          solve: function() { return {"variable": {type: "number", value: state.variable - 0.1}}; },
        }

    function merge(solution, varId) {
      return {type: "number", value: lively.lang.num.average(solution.values.pluck("value"))};
    }
    function apply(solution, varId) { state[varId] = solution.value; }

    lively.morphic.constraints.solve([constraint], merge, apply);

    this.epsilon = 0.1;
    this.assertEqualsEpsilon(0, state.variable, "constraint not solved");
  },
  
  testSolveMorphicConstraint: function() {
    var c = {
      epsilon: function() { return 0.01; },
      error: function(time) { return m.getPosition().dist(fixedPos); },
      solve: function(time) {
        var solution = {};
        var mp = m.getPosition();
        solution["position " + m.id] = {morph: m, type: "position", value: mp.addPt(fixedPos.subPt(mp))};
        return solution;
      }
    };

    var m = lively.newMorph({position: pt(300,200)}),
        fixedPos = pt(100,100);
    
    lively.morphic.constraints.solve([c]);
    
    this.epsilon = 0.1;
    this.assertEqualsEpsilon(pt(100,100), m.getPosition());
  },

  testConstraintPriority: function() {
    this.epsilon = 0.1;

    var state = {variable: 1};
    var constraintProto = {
      epsilon: function() { return 0.1; },
      error: function() { return Math.abs(state.variable - this.desiredValue); },
      solve: function() {
        return {"variable": {type: "number", value: state.variable + (this.desiredValue - state.variable)}};
      }
    }

    function merge(solution, varId) {
    	var avg = lively.lang.num.average(solution.values.pluck("value")),
        	val = state.variable + (avg - state.variable);
      return {type: "number", value: val};
    }

    function apply(solution, varId) { state[varId] = solution.value; }

    var c1 = Object.create(constraintProto), c2 = Object.create(constraintProto);

    c1.desiredValue = 30; c1.priority = 1; c2.desiredValue = 20; c2.priority = 1;
    lively.morphic.constraints.solve([c1, c2], merge, apply);
    this.assertEqualsEpsilon(25, state.variable, "priorities 1 1");

    c1.priority = 1; c2.priority = 2;
    lively.morphic.constraints.solve([c1, c2], merge, apply);
    this.assertEqualsEpsilon(20, state.variable, "priorities 1 2");

  }
})

}) // end of module
