module('lively.morphic.constraints.Core').requires().toRun(function() {


Object.subclass("lively.morphic.constraints.Constraint", {
  priority: 1,
  epsilon: function() { return 0; },
  error: function(time) { return this.isSatisfied(time) ? 0 : 1; },
  solve: function(time) { return {}; },
  apply: function() {}
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
        delta = p2.subPt(p1).normalized().scaleBy(magn),
        solution = {};
    solution["position " + this.morph1.id] = {morph: this.morph1, type: "position", value: p1.addPt(delta)};
    solution["position " + this.morph2.id] = {morph: this.morph2, type: "position", value: p2.addPt(delta.negated())};
    return solution;
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
        delta = p1.subPt(p2).scaleBy(m1.getExtent().fastR()/100),
        solution = {};
    solution["position " + this.morph1.id] = {morph: this.morph1, type: "position", value: p1.addPt(delta)};
    solution["position " + this.morph2.id] = {morph: this.morph2, type: "position", value: p2.addPt(delta.negated())};
    return solution;
  }

});


Object.extend(lively.morphic.constraints, {

  solve: function(constraints, mergeFn, applyFn, maxDuration) {
    
    if (!mergeFn) mergeFn = lively.morphic.constraints.merge
    if (!applyFn) applyFn = lively.morphic.constraints.apply;
    if (maxDuration === undefined) maxDuration = 50;
    var t = Date.now(), i = 0, currError, lastError = Infinity;

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
      var solutionMap = constraints.reduce((solutionMap, c) => {
        var error = c.error();
        if (error <= c.epsilon()) return solutionMap; // satisfied?
        currError += error; empty = false;

        var solved = c.solve(t);
        Object.keys(solved).forEach(varId => {
          // ignore variable if current constraint is blacklisted
          if (priorityBlacklist[varId] && priorityBlacklist[varId].include(c)) return;

          var solvedVar = solved[varId];
          if (!solvedVar.hasOwnProperty("type")) throw new Error("constraint solve: Solution expected to have type");
          if (!solvedVar.hasOwnProperty("value")) throw new Error("constraint solve: Solution expected to have value");

          var s = solutionMap[varId];
          if (!s) { // first solution for var
            s = solutionMap[varId] = {
              priority: c.priority,
              morph: solvedVar.morph,
              type: solvedVar.type,
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
          }
          s.values.push(solvedVar);
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
        applyFn(mergeFn(solutionMap[variable], variable), variable);
      }

      // stop if we run out of time
      if (Date.now() - t > maxDuration) break;
    }
  },
  
  mergePosition: function(values, constraints) {
    // solutions = [value: {morph: MORPH, value: POINT, type: "position"}]
    // 	var damping = 0.25, avg = lively.lang.num.average(solutions);
    // 	return curr + (damping * (avg - curr))

    // var morph = values[0].morph;
    // if (morph.showsHalos) return {type: "position", morph: morph, value: morph.getPosition()}  

    // var c = constraints.max(c => c.error());
    // var i = constraints.indexOf(c);
    // return {type: "position", morph: morph, value: values[i].value};
    

    // var damping = 0.25,
    var damping = 1,
        morph = values[0].morph,
        avg = values.pluck("value").reduce((all, ea) => all.addPt(ea)).scaleBy(1/values.length);

    if (morph.showsHalos) return {type: "position", morph: morph, value: morph.getPosition()}
    return {type: "position", morph: morph, value: morph.getPosition().addPt(avg.subPt(morph.getPosition()).scaleBy(damping))};
  },
  
  merge: function(solution, varId) {
    // solution = {type: STRING, values: [...], constraints: [...], errors: [...]}
    // returns {type: STRING, value: OBJECT, morph: MORPH}
    var sel = "merge" + solution.type.capitalize(),
        propMerge = lively.morphic.constraints[sel];
    if (!propMerge) throw new Error("constraint merge: No merge function for property " + solution.type);
    return propMerge(solution.values, solution.constraints);
  },
  
  apply: function(solution, varId) {
    // solutions = {morph: MORPH, value: OBJECT, type: STRING}}
    if (!solution.hasOwnProperty("type")) throw new Error("constraint apply: solution for " + varId + " expected to have type");
    if (!solution.hasOwnProperty("morph")) throw new Error("constraint apply: solution for " + varId + " expected to have morph");
    if (!solution.hasOwnProperty("value")) throw new Error("constraint apply: solution for " + varId + " expected to have value");
    switch (solution.type) {
      case 'position': solution.morph.setPosition(solution.value); break;
      default: throw new Error("Cannot apply solution constraint of type " + solution.type + " for " + varId);
    }
  }

});


}) // end of module
