module('lively.bindings.FRPTranslationSupport').requires('lively.bindings.FRPTranslator', 'lively.bindings.FRPParser').toRun(function() {

Object.extend(FRPTranslator, {
    ref: function(n) {
        return 'new lively.bindings.FRPCore.StreamRef(' + Objects.inspect(n) + ')';
    },
    addSubExpression: function(id, strmDef, deps) {
        this.hasSubExpression = true;
        this.result.nextPutAll('var ' + id);
        this.result.nextPutAll(' = ');
        this.result.nextPutAll(strmDef);
        this.result.nextPutAll(".addDependencies([");
        this.result.nextPutAll(deps.collect(function(e) {return this.ref(e)}.bind(this)).join(', '));
        this.result.nextPutAll("]);\n");
        this.result.nextPutAll("strm.addSubExpression('" + id + "', " + id + ");\n");        
        },
    id: 0,
    nextId: function() {return '_t' + this.id++},

    makeBinop: function(args, op) {
        var genExpr = function() {
            var s = new StringBuffer();
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                s.nextPutAll(arg.isStream ? arg.refString : 'null');
                if (i !== args.length - 1) {
                    s.nextPutAll(', ');
                }
            }
            return s.contents();
        };
        var genBodyVars = function(i) {
            var arg = args[i];
             return arg.isStream ? 'arg' + i : arg.refString;
        };
        var genArgs = function() {
            var s = new StringBuffer();
            for (var i = 0; i < args.length; i++) {
                s.nextPutAll('arg' + i);
                if (i !== args.length - 1) {
                    s.nextPutAll(', ');
                }
            }
            return s.contents();
        };
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            genExpr() +
            '], ' +
            Strings.format('function (%s) {return %s %s %s})', genArgs(), genBodyVars(0), op, genBodyVars(1))
    },

    makeExpr: function(args, func) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
                args.join(', ') +
                '], ' +
                func + ')';
    },
    makeDurationE: function(interval, duration) {
        return 'new lively.bindings.FRPCore.EventStream().durationE(' +
                interval + ', ' + duration + ')';
    }
});

}); // end of module