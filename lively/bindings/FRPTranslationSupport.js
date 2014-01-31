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
    triggerStackLast: function() {return this.triggerStack[this.triggerStack.length-1]},

    genExpr: function(args) {
        var col = args;
        if (this.triggerStackLast()) {
            col = args.concat([this.triggerStackLast()]);
        }
       return col.map(function(arg) {
            return arg.isStream ? arg.refString : 'null'}).join(', ');
    },
    genBodyVars: function(args, i) {
        var arg = args[i];
        return arg.isStream ? 'arg' + i : arg.refString;
    },
    genArgs: function(args) {
        var col = args;
        if (this.triggerStackLast()) {
            col = args.concat([this.triggerStackLast()]);
        }
        return Array.range(0, col.length - 1).map(function(i) {return 'arg' + i}).join(', ');
    },
    makeBinop: function(args, op) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return %s %s %s})',
                this.genArgs(args), this.genBodyVars(args, 0), op, this.genBodyVars(args, 1));
    },
    makeCond: function(args) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return (%s) ? (%s) : (%s)})',
                this.genArgs(args), this.genBodyVars(args, 0), this.genBodyVars(args, 1), this.genBodyVars(args, 2));
    },
    makeGet: function(args) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return %s[%s]})',
                this.genArgs(args), this.genBodyVars(args, 1), this.genBodyVars(args, 0));
    },
    makeUnop: function(args, op) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return %s%s})',
                this.genArgs(args), op, this.genBodyVars(args, 0));
    },
    makeCombinator: function(comb, args) {
        return 'new lively.bindings.FRPCore.EventStream().' + comb + '(' +
                args.map(function(arg) {return arg.refString}).join(", ") + ')';
    },
    makeFby: function(init, args) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return %s}, true, %s)',
                this.genArgs(args), this.genBodyVars(args, 0), init);
    },
    makeJson: function(args) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return {%s}})',
                this.genArgs(args), Array.range(0, args.length-1).map(function(i) {
                    return args[i].name.toProgramString() + ': ' + this.genBodyVars(args, i)}.bind(this)).join(', '))
    },
    makeArray: function(args) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return [%s]})',
                this.genArgs(args), Array.range(0, args.length-1).map(function(i) {
                    return this.genBodyVars(args, i)}.bind(this)).join(', '))
    },
    makeCall: function(name, args) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr(args) + '], ' +
            Strings.format('function(%s) {return %s(%s)})',
                this.genArgs(args), name, Array.range(0, args.length-1).map(function(i) {return this.genBodyVars(args, i)}.bind(this)).join(', '))
    },
    makeSend: function(name, rec, args) {
        return 'new lively.bindings.FRPCore.EventStream().expr([' +
            this.genExpr([rec].concat(args)) + '], ' +
            Strings.format('function(%s) {return %s.%s(%s)})',
                this.genArgs([rec].concat(args)), this.genBodyVars([rec], 0), name, Array.range(1, args.length).map(function(i) {return this.genBodyVars([rec].concat(args), i)}.bind(this)).join(', '))
    }
});

FRPParser.keywords = {};
FRPParser.keywords["fby"] = true;
FRPParser.keywords["on"] = true;
FRPParser._isKeyword = function(k) {
                        return this.keywords.hasOwnProperty(k)
                            || BSOMetaJSParser.keywords.hasOwnProperty(k)}

}); // end of module