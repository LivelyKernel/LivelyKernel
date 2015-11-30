module('lively.morphic.constraints.tests.Core').requires("lively.TestFramework", 'lively.morphic.constraints.Core').toRun(function() {

TestCase.subclass('lively.morphic.constraints.tests.BasicConstraintSolving',
"testing", {
  
  testSolveNumericConstraint: function() {
    var state = {variable: 1},
        constraint = {
          epsilon: function() { return 0.01; },
          error: function() { return state.variable; },
          solve: function() { return [{id: "variable", type: "number", value: state.variable - 0.1}]; },
        }

    function merge(solution, varId) {
      if (varId !== "variable") throw new Error("Unexpected constrain to merge: " + varId);
      return {value: lively.lang.num.average(solution.values)};
    }
    function apply(solution, varId) {
      if (varId !== "variable") throw new Error("Unexpected constrain to apply: " + varId);
      state[varId] = solution.value;
    }

    lively.morphic.constraints.solve([constraint], {mergeFn: merge, applyFn: apply});

    this.epsilon = 0.1;
    this.assertEqualsEpsilon(0, state.variable, "constraint not solved");
  },
  
  testSolveMorphicConstraint: function() {
    var c = {
      epsilon: function() { return 0.01; },
      error: function(time) { return m.getPosition().dist(fixedPos); },
      solve: function(time) {
        var mp = m.getPosition();
        return [{morph: m, property: "position", value: mp.addPt(fixedPos.subPt(mp))}];
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
        return [{id: "variable", type: "number", value: state.variable + (this.desiredValue - state.variable)}];
      }
    }

    function merge(solution, varId) {
    	var avg = lively.lang.num.average(solution.values),
        	val = state.variable + (avg - state.variable);
      return {type: "number", value: val};
    }

    function apply(solution, varId) { state[varId] = solution.value; }

    var c1 = Object.create(constraintProto), c2 = Object.create(constraintProto);

    c1.desiredValue = 30; c1.priority = 1; c2.desiredValue = 20; c2.priority = 1;
    lively.morphic.constraints.solve([c1, c2], {mergeFn: merge, applyFn: apply});
    this.assertEqualsEpsilon(25, state.variable, "priorities 1 1");

    c1.priority = 1; c2.priority = 2;
    lively.morphic.constraints.solve([c1, c2], {mergeFn: merge, applyFn: apply});
    this.assertEqualsEpsilon(20, state.variable, "priorities 1 2");

  }

});

TestCase.subclass('lively.morphic.constraints.tests.ConstraintManagement',
"running", {

  setUp: function($super) {
    $super();
    this.realConstraints = $world.constraints;
    this.constraintProcessWasRunning = $world.constraintSolveLoopIsRunning();
    $world.constraintsRemoveAll();
  },

  tearDown: function($super) {
    $super();
    $world.constraints = this.realConstraints;
    if (this.constraintProcessWasRunning)
      $world.constraintSolveLoopStart();
  }

},
"testing", {
  
  testConstraintTickingProcess: function() {
    this.assert(!$world.constraintSolveLoopIsRunning());
    var m = lively.newMorph({position: pt(300,200)}),
        fixedPos = pt(100,100),
        c = new lively.morphic.constraints.FixedPositionConstraint(m, fixedPos);
    $world.constraintAddAndSolve(c);
    this.assert($world.constraintSolveLoopIsRunning());
    this.assertEquals($world.constraints, [c], "not added");
    this.assertEquals(fixedPos, m.getPosition(), "not solved");
  },

  testDontAddSimilarConstraintTwice: function() {
    var m = lively.newMorph({position: pt(300,200)}),
        fixedPos = pt(100,100),
        c1 = new lively.morphic.constraints.FixedPositionConstraint(m, fixedPos, 1),
        c2 = new lively.morphic.constraints.FixedPositionConstraint(m, fixedPos, 2);
    $world.constraintAdd(c1);
    $world.constraintAdd(c2);
    this.assert($world.constraintSolveLoopIsRunning());
    this.assertEquals(1, $world.constraints.length, "constraint added twice");
    this.assertEquals(2, $world.constraints[0].priority, "priority wasn't changed");
  },

  testAddConstrainedByName: function() {
    var m = lively.newMorph({position: pt(300,200)}), fixedPos = pt(100,100);
    $world.constraintAddAndSolve("FixedPositionConstraint", m, fixedPos);
    this.assertEquals(1, $world.constraints.length, "not added");
    this.assert($world.constraints[0] instanceof lively.morphic.constraints.FixedPositionConstraint, "wrong constraint type");
    this.assertEquals(fixedPos, m.getPosition(), "not solved");
  }

});

}) // end of module
