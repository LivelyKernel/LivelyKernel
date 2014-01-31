module('cop.Experiments').requires('cop.Layers').toRun(function() {

Object.extend(cop, {
resetStats: function() {
    cop.stats = {
        executions: 0,
        compositionChanges: 0, 
        resetTime: Date.now(),
        toString: function() {
            return JSON.prettyPrint(this);
            return "executions:\t" + this.executions + "\tcompositionChanges:\t" + this.compositionChanges 
                + "\tratio:\t" + (this.executions / this.compositionChanges)
                + '\n' + JSON.stringify(this)
        }
    }
}
})

// cop.resetStats()

cop.LayerInliner.addMethods( {
    inlinePartialMethodsWithValidation:  function(object, methodName, methodType, partialMethods, inlineCreator, preComputedHash) {
        var method =  this.inlinePartialMethods(object, methodName, methodType, partialMethods);

        function checkValidation(hash) { return preComputedHash === hash }

        var firstRun = true;

        function validate() {
            var currentHash = cop.hashForCurrentComposition(this),
                isValid = checkValidation(currentHash);
            if (cop.stats) {
                var key = this._layer_object_id + '>>' + methodName;
                cop.stats[key] = cop.stats[key] || {executions: 0, compositionChanges: 0};
                cop.stats[key].executions++;
                if (!isValid) cop.stats[key].compositionChanges++;
            }

            if (firstRun) {
                firstRun = false;
                if (!isValid)
                    throw new Error('Layer validation check failed on first call... this should not be!\nprecomputed hash: ' + preComputedHash + '\nactualHash: ' + currentHash)
            }
            return isValid ?
                method.apply(this, arguments) :
                inlineCreator.apply(this, arguments); // creates new inlined method
        }

        validate.originalFunction = inlineCreator.originalFunction
        validate.inlinedMethod = method

        return validate;

    }
})

}) // end of module
