module('lively.morphic.constraints.Core').requires("lively.morphic.Core", "lively.Traits").toRun(function() {

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

# solver #

lively.morphic.constraints.solve(constraints, options) defines how to generically
1. Gather a set of variable solutions proposed by a list of constraints
2. Merge those solutions to a single solution per variable
3. Apply those solutions

solve() defines a default strategy for merge and apply of solutions that target
morphs.  If an options object is specified it can provide:
mergeFn: mergeFn to use instead of the default mergeFn for non-morph solutions
applyFn: applyFn to use instead of the default mergeFn for non-morph solutions
maxDuration: time in ms that defines how long the system tries to solve
constraints. Default is 50ms.


# solver for morphs #

The default strategy for how to merge and apply morph solutions is defined in
the methods
  Morph>>constraintsMerge
  Morph>>constraintsApply
This allows individual morphs to re-implement how to deal with constraints.


# constraints #

Constraints can inherit from lively.morphic.constraints.Constraint but can also be arbitrary objects.
The following methods need to be implemented:
  error: Returns a number, indicating "how much" the constaint is unsatisfied
  epsilon: A number, the error limit below which the constraint should be considered solved
  solve: A function which returns a list of proposed solutions. Solutions are supported in two forms:
    1. Solution for morphs of the form:
    {morph: MORPH, property: STRING, value: OBJECT}
    2. Solution for arbitrary variables of the form:
    {id: STRING, type: STRING, value: OBJECT}
    The id field should uniquely identify the variable to be solved.
Constraints also can define a field priority which should be a number.
Solutions for variables provided by constraints with lower priorities will be
ignored.

The following morphic constraints are provided:
  MorphDistanceConstraint: keep two morphs a specified distance apart
  NoCollisionConstraint: don't have the bounding boxes of two morphs overlap
  FixedPositionConstraint: Keep a morph at a specified position
  TwoPointRotationAndScaleConstraint: given two morphs, scale and rotate a
    third morph depending on the angle and distance of the first two morphs


# solver process / management #

lively.morphic.constraints.solve can be called manually or it can be driven by
a "solver process".  A default implementation for a solver process is provided
in the SolverProcessTrait.  Instances of world morphs have this trait applied
and can be used for driving constraint solution processes. Here is how:

Given a constraint c, add it to the set of constraints to be solved:
  $world.constraintAdd(c);

Remove it:
  $world.constraintRemove(c);

-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */

Object.extend(lively.morphic.constraints, {

  solve: function(constraints, options) {
    var mergeFn = (options && options.mergeFn) || lively.morphic.constraints.merge,
        applyFn = (options && options.applyFn) || lively.morphic.constraints.apply,
        maxDuration = (options && options.maxDuration) || 50,
        t = Date.now(), i = 0, currError, lastError = Infinity;

    // ignore constraints per var that have a lower priority than the
    // constraint with the highest priority affecting the var. We use a
    // blacklist so that the constraints won't be considered even if the high
    // priority constrained was solved (to not undo its changes)
    var priorityBlacklist = {};

    while (true) {
      currError = 0;
      i++;

      // for all constraints, gather proposed solutions and order them in a dictionary by variable:
      // solutions = {
      //   variable-id: {values: ARRAY, constraints: ARRAY, errors: ARRAY}
      // }
      // This will be fed to a merge function that reduces values to a single new value

      var empty = true;
      var solutionMap = constraints.reduce(function(solutionMap, c) {
        var error = c.error();
        if (error <= Math.abs(c.epsilon())) return solutionMap; // satisfied?
        currError += error; empty = false;

        // Gather solutions for all constraints. Constraint>>solve returns a
        // list of proposed values, for each variable that needs to be changed
        var solutionsOfConstraint = c.solve(t);
        solutionsOfConstraint.forEach(function(solution) {
          // Solutions for morph or arbitrary variable? Derive var-id accordingly...
          var varId, isMorphSolution = false;
          if (solution.morph) {
            if (!solution.property) throw new Error("constraint solve: Solution for morph " + solution.morph + " needs a property field!");
            varId = solution.morph.id + " " + solution.property;
            isMorphSolution = true;
          } else {
            if (!solution.id) throw new Error("constraint solve: Solution for non-morph needs an id!");
            if (!solution.type) throw new Error("constraint solve: Solution for non-morph needs a type!");
            varId = solution.id;
          }

          // ignore variable if current constraint is blacklisted
          if (priorityBlacklist[varId] && priorityBlacklist[varId].include(c)) return;

          if (!solution.hasOwnProperty("value")) throw new Error("constraint solve: Solution " + varId + " expected to have a value");

          var s = solutionMap[varId];
          if (!s) { // first solution for var
            s = solutionMap[varId] = {
              isMorphSolution: isMorphSolution,
              priority: c.priority,
              morph: solution.morph,
              type: solution.type,
              property: solution.property,
              values: [], constraints: [], errors: []
            }
          } else if (c.priority < s.priority) {
            priorityBlacklist[varId] = (priorityBlacklist[varId] || []).concat([c]);
            return;
          } else if (c.priority > s.priority) {
            // if current constraint is ranked with a higher priority than the
            // constraints that were used for the recorded solutions, get rid
            // of existing recordings and blacklist those lower priority constraints
            priorityBlacklist[varId] = (priorityBlacklist[varId] || []).concat(s.constraints);
            s.priority = c.priority;
            s.values.clear(); s.constraints.clear(); s.errors.clear();
          } else if (isMorphSolution !== s.isMorphSolution) {
            throw new Error("Constraint solve: solution for morph and arbitrary var mixed up? " + varId);
          }
          s.values.push(solution.value);
          s.constraints.push(c);
          s.errors.push(error);
        });
        return solutionMap;
      }, {});

      // show("%s\n%s", Date.now() - t, Object.keys(solutionMap).map((k) => k + ": " + solutionMap[k].values.length + ", " + solutionMap[k].constraints.pluck("priority")).join("\n"))

      // all constraints satisfied, nothing todo
      if (empty) break;

      // stop if we aren't converging;
      if (currError > lastError) break;
      lastError = currError;
      
      // merge solutions and modify the system's state
      for (var variable in solutionMap) {
        if (solutionMap[variable].isMorphSolution) {
          var m = solutionMap[variable].morph;
          m.constraintsApply(m.constraintsMerge(solutionMap[variable], variable));
        } else {
          applyFn(mergeFn(solutionMap[variable], variable), variable);
        }
      }

      // stop if we run out of time
      if (Date.now() - t > maxDuration) break;
    }
  },

  merge: function(solution, varId) {
    // solution = {type: STRING, values: [OBJECT], constraints: [CONSTRAINTS], errors: [NUMBER], priority: NUMBER}
    if (!solution.type) throw new Error("constraint merge: Expected solution " + varId + " to have a type");
    if (!Array.isArray(solution.values)) throw new Error("constraint merge: Expected solution " + varId + " to have a list of values");
    switch (solution.type) {
      case 'number': solution.value = lively.lang.num.average(solution.values);
      default: throw new Error("constraint merge: Don't know how to merge solution " + varId + " of type " + solution.type);
    }
    return solution;
  },
  
  apply: function(solution, varId) {
    // solution as in merge
    throw new Error("Don't know how to apply solution " + varId);
  }

});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// support for merging and applying constraints in morphs
// Note: a morph can override constraintsMerge and constraintsApply
// to customize the behavior
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.morphic.Morph.addMethods(
"constraints", {
  
  constraintsMergePosition: function(values, constraints) {
    // solutions = [value: {morph: MORPH, value: POINT, property: "position"}]
    // 	var damping = 0.25, avg = lively.lang.num.average(solutions);
    // 	return curr + (damping * (avg - curr))

    // var morph = values[0].morph;
    // if (morph.showsHalos) return {property: "position", morph: morph, value: morph.getPosition()}  

    // var c = constraints.max(c => c.error());
    // var i = constraints.indexOf(c);
    // return {property: "position", morph: morph, value: values[i].value};
    

    // var damping = 0.25,
    if (this.showsHalos) return {property: "position", value: this.getPosition()}

    var damping = 1,
        avg = values.reduce(function(all, ea) { return all.addPt(ea); }, pt(0,0)).scaleBy(1/values.length);
    return {property: "position", value: this.getPosition().addPt(avg.subPt(this.getPosition()).scaleBy(damping))};
  },
  
  constraintsMergeRotation: function(values, constraints) {
    return this.showsHalos ?
      {property: "rotation", value: this.getRotation()} :
      {property: "rotation", value: this.getRotation() + lively.lang.num.average(values) - this.getRotation()};
  },

  constraintsMergeScale: function(values, constraints) {
    return this.showsHalos ?
      {property: "scale", value: this.getScale()} :
      {property: "scale", value: this.getScale() + lively.lang.num.average(values)-this.getScale()};
  },
  
  constraintsMerge: function(solution, varId) {
    // solution = {property: STRING, values: [...], constraints: [...], errors: [...]}
    // returns {property: STRING, value: OBJECT}
    if (!solution.isMorphSolution) throw new Error("constraint merge: Expected morph solution!");
    var sel = "constraintsMerge" + solution.property.capitalize();
    if (typeof this[sel] !== "function") throw new Error("morphic constraint merge: No merge method " + sel + " of constraint " + varId + " in morph " + this);
    return this[sel](solution.values, solution.constraints);
  },

  constraintsApply: function(solution, varId) {
    // solutions = {value: OBJECT, property: STRING}}
    if (!solution.hasOwnProperty("property")) throw new Error("constraint apply: solution for " + varId + " expected to have property");
    if (!solution.hasOwnProperty("value")) throw new Error("constraint apply: solution for " + varId + " expected to have value");
    switch (solution.property) {
      case 'position': this.setPosition(solution.value); break;
      case 'rotation': this.setRotation(solution.value); break;
      case 'scale': this.setScale(solution.value); break;
      default: throw new Error("Cannot apply solution constraint of property " + solution.property + " for " + varId);
    }
  }

});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// solver process aka. how to drive a constraint solution process
// World morphs are solver process managers by default
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Trait("lively.morphic.constraints.SolverProcessTrait",
"constraints", {

  constraintSolveLoopTickTime: 30,
  constraintOptions: {},

  constraintsAreEqual: function(c1, c2) {
    return Object.keys(c1).without("priority").every(function(k) {
      // show("%s %s", k, lively.lang.obj.equals(c1[k], c2[k]));
      
      return c1[k] === c2[k] || lively.lang.obj.equals(c1[k], c2[k]);
    });
  },

  constraintAdd: function(/*c, args...*/) {
    var c;
    if (arguments.length === 0) { // constraint object
      throw new Error("constraintAdd: need constraint object!")
    } else if (arguments.length === 1) { // constraint object
      c = arguments[0];
    } else { // isntantiate constraint
      var args = lively.lang.arr.from(arguments),
          klassName = args.shift(),
          klass = lively.morphic.constraints[klassName] || lively.lookup(klassName);
      if (typeof klass !== "function") throw new Error("constraintAdd: cannot find constraint klass " + klassName);
      var c = new (Function.prototype.bind.apply(klass, arguments));
    }
    
    var cs = this.constraints = (this.constraints || []),
        other = cs.detect(this.constraintsAreEqual.bind(this, c));
    if (other) other.priority = c.priority;
    else cs.push(c);
    if (!this.constraintSolveLoopIsRunning()) this.constraintSolveLoopStart();
  },

  constraintAddAndSolve: function(/*c, ...*/) {
    this.constraintAdd.apply(this, arguments);
    this.constraintSolveLoop();
  },

  constraintsRemoveAll: function() {
    try {
      (this.constraints || []).forEach(function(c) { return c.onRemove && c.onRemove(); });
    } catch (e) {
      console.error("Error stopping constraints: ", e);
    }
    this.constraints = [];
    this.stopSteppingScriptNamed("constraintSolveLoop");
  },

  setConstraintOptions: function(opts) {
    this.constraintOptions = opts;
  },

  constraintSolveLoopIsRunning: function() {
    return ($world.scripts || []).some(function(script) { return script.selector === "constraintSolveLoop"; });
  },

  constraintSolveLoopStart: function() {
    this.startStepping(this.constraintSolveLoopTickTime || 30, "constraintSolveLoop");
  },

  constraintSolveLoop: function() {
    var cs = this.constraints, opts = this.constraintOptions;
    if (cs && cs.length) lively.morphic.constraints.solve(cs, opts);
  }

});

Trait("lively.morphic.constraints.SolverProcessTrait").applyTo(lively.morphic.World, {override: ["constraintAdd", "constraintsRemove", "constraintSolveLoopTickTime", "constraintSolveLoopIsRunning", "constraintSolveLoop", "constraintSolveLoopStart", "constraintsAreEqual", "constraintsRemoveAll", "constraintOptions", "constraintAddAndSolve", "setConstraintOptions"]});



// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Some constraints for your convenience
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Object.subclass("lively.morphic.constraints.Constraint", {
  priority: 1,
  epsilon: function() { return 0; },
  isSatisfied: function(time) { return this.error(time) <= Math.abs(this.epsilon()); },
  error: function(time) { return this.isSatisfied(time) ? 0 : 1; },
  solve: function(time) { return []; }
});

lively.morphic.constraints.Constraint.subclass("lively.morphic.constraints.FixedPositionConstraint", {

  initialize: function(morph, fixedPos, priority) {
    this.morph = morph;
    this.fixedPos = fixedPos;
    if (priority !== undefined) this.priority = priority;
  },

  epsilon: function() { return 0.1; },

  error: function(time) { return Math.sqrt(this.morph.getPosition().distSquared(this.fixedPos)); },

  solve: function(time) {
    var p1 = this.morph.getPosition(), p2 = this.fixedPos;
    return [{morph: this.morph, property: "position", value: p1.addPt(p2.subPt(p1))}];
  }

});

lively.morphic.constraints.Constraint.subclass("lively.morphic.constraints.MorphDistanceConstraint", {
  initialize: function(morph1, morph2, dist, priority) {
    this.morph1 = morph1;
    this.morph2 = morph2;
    this.dist = dist;
    if (priority !== undefined) this.priority = priority;
  },
  epsilon: function() { return 0.1; },
  error: function(time) { return Math.sqrt(this.morph1.getPosition().distSquared(this.morph2.getPosition())); },
  solve: function(time) {
    var p1 = this.morph1.getPosition(), p2 = this.morph2.getPosition(), dist = this.dist,
        magn = (p1.dist(p2) - dist) / 2,
        delta = p2.subPt(p1).normalized().scaleBy(magn);
    return [{morph: this.morph1, property: "position", value: p1.addPt(delta)},
            {morph: this.morph2, property: "position", value: p2.addPt(delta.negated())}];
  }
});

lively.morphic.constraints.Constraint.subclass("lively.morphic.constraints.NoCollisionConstraint", {
  initialize: function(morph1, morph2, priority) {
    this.morph1 = morph1;
    this.morph2 = morph2;
    if (priority !== undefined) this.priority = priority;
  },

  error: function(time) { 
    // var area = this.morph1.bounds().intersection(this.morph2.bounds()).area();
    // return area <= 0 ? 0 : area;
    // this.morph1.globalBounds().intersects(this.morph2.globalBounds())
    // var intersects = this.morph1.globalBounds().intersects(this.morph2.globalBounds())
    // if (!intersects) return 0;
    // return 1/this.morph1.bounds().dist(this.morph2.bounds())
    return this.morph1.owner === this.morph2.owner && this.morph1.globalBounds().intersects(this.morph2.globalBounds()) ? 1 : 0;
  },

  solve: function(time) {
    var m1 = this.morph1, m2 = this.morph2,
        p1 = m1.getPosition(), p2 = m2.getPosition(),
        delta = p1.subPt(p2).scaleBy(m1.getExtent().fastR()/100);
    return [{morph: this.morph1, property: "position", value: p1.addPt(delta)},
            {morph: this.morph2, property: "position", value: p2.addPt(delta.negated())}];
  }

});

lively.morphic.constraints.Constraint.subclass("lively.morphic.constraints.TwoPointRotationAndScaleConstraint", {
  initialize: function(targetMorph, morph1, morph2, priority) {
    this.targetMorph = targetMorph;
    this.morph1 = morph1;
    this.morph2 = morph2;
    this.startRotation = morph2.getPosition().subPt(morph1.getPosition()).theta() - targetMorph.getRotation();
    this.startScale = this.targetMorph.getScale();
    this.startDist = morph2.getPosition().dist(morph1.getPosition());
    if (priority !== undefined) this.priority = priority;
  },

  computeAngle: function() {
    var angle = this.morph2.getPosition().subPt(this.morph1.getPosition()).theta() - this.startRotation;
    return angle.toDegrees().detent(10, 45).toRadians();
  },

  computeScale: function() {
    var scale = (this.morph2.getPosition().dist(this.morph1.getPosition()) / (this.startDist-this.startScale));
    return lively.lang.num.detent(scale, 0.2, 1);
  },

  error: function(time) {
    return Math.abs(this.targetMorph.getRotation() - this.computeAngle()) + Math.abs(this.targetMorph.getScale() - this.computeScale());
  },

  solve: function(time) {
    // var m1 = this.morph1, m2 = this.morph2,
    //     p1 = m1.getPosition(), p2 = m2.getPosition(),
    //     delta = p1.subPt(p2).scaleBy(m1.getExtent().fastR()/100),
    var angle = this.computeAngle(),
        scale = this.computeScale();
    return [{morph: this.targetMorph, type: "rotation", value: angle},
            {morph: this.targetMorph, type: "scale", value: scale}]
  }

});

}) // end of module
