
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
})
