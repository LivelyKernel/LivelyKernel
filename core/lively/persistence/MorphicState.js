module('lively.persistence.MorphicState').requires().toRun(function() {

// This is an experimental implementation of creating and applying the
// "essence" of what state a morph really is made of

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// recording

function getMorphs(root) {
  return root.submorphs
    .filter(function(ea) { return !ea.isWindow && !ea.isEpiMorph && ea.isVisible() && !ea.isHand; })
    .invoke("withAllSubmorphsSelect", function(ea) { return !ea.isWindow && !ea.isEpiMorph && ea.isVisible() && !ea.isHand; })
    .flatten();
}

function captureMorphicState(root) {
  return getMorphs(root).map(morphicStateOf);
}

function morphicStateOf(m) {
  var state = {
    morph: m,
    owner: m.owner,
    submorphIndex: m.owner && m.owner.submorphs.indexOf(m),
    props: Object.keys(m).filter(function(prop) {
        return prop.startsWith("_") && m['get' + prop.slice(1)];
      }).map(function (prop) {
        return prop.slice(1);
      }).reduce(function (props, prop) {
        props[prop] = m['get' + prop]();
        return props;
      }, {})
  }

  if (m.isPath) state.path = {vertices: m.vertices().clone()};

  return state;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// apply

function applyMorphicState(root, morphicState) {
  if (!morphicState) return;

  morphicState.forEach(function(state) {
    var m = state.morph;

    if (!m) return;
    if (!m.owner || m.owner.submorphs.indexOf(m) !== state.submorphIndex)
      state.owner.addMorph(m, state.owner.submorphs[state.submorphIndex]);
      
    Object.keys(state.props).forEach(function (prop) {
      m["set" + prop](state.props[prop]);
    });

    if (state.path) {
      if (state.path.vertices && m.setVertices) m.setVertices(state.path.vertices);
    }
  });

  // removal
  var morphsInState = morphicState.pluck("morph");
  var actualMorphs = getMorphs(root);
  actualMorphs.withoutAll(morphsInState).invoke("remove");
}

Object.extend(lively.persistence.MorphicState, {
  getMorphs: getMorphs,
  captureMorphicState: captureMorphicState,
  morphicStateOf: morphicStateOf,
  applyMorphicState: applyMorphicState
});

}) // end of module
