module('lively.LogHelper').requires().toRun(function() {

Object.extend(Global, {

logStackFor: function(obj, methodName) {
    obj[methodName] = obj[methodName].wrap(function(proceed) {
        var args = $A(arguments); args.shift(); 
        MyLogDepth++;
        dbgOn(true);
        var result = proceed.apply(this, args);
        
        logStack();
        MyLogDepth--;
        return result
    })
},

indentForDepth: function(depth) {
    var s=""
    for(var i=depth; i > 0; i--) s += " ";
    return s
},

MyLogDepth: 0,
resetLogDepth: function() { MyLogDepth = 0 },

logCall: function(args, from, shift) {
    s = ""
    s += indentForDepth(MyLogDepth);
    if(from)
        s += String(from) + " ";
    s += args.callee.qualifiedMethodName() + "("
    var myargs = $A(args);
    if(shift) myargs.shift(); // for loggin inside wrapper functions
    myargs.each(function(ea){ s += ea + ", "});
    s += ")";
    console.log(s)
},

logCallHelper: function(from, methodName, args, indent) {
    return Strings.format('%s%s>>%s(%s)',
        indentForDepth(indent),
        from.toString(),
        methodName,
        args.collect(function(ea) { return ea.toString() }).join(', '));
},

toExpression: function toExpression(obj) {
	return new ExpressionSerializer().serialize(obj);
},


logMethod: function(obj, methodName) {
    obj[methodName] = obj[methodName].wrap(function(proceed) {
        var args = $A(arguments); args.shift(); 
        MyLogDepth++;
        console.log(logCallHelper(this, methodName, args, MyLogDepth * 2))
        var result = proceed.apply(this, args);
        MyLogDepth--;
        return result
    })
},


printObject: function (obj) {
    var s = String(obj) + ":";
    Properties.own(obj).forEach(function(ea) {
        var value;
        try { value = String(obj[ea])} catch (e) { };
        s += " " + ea + ":" + value + "\n"
    });
    return s
},

printObjectFull: function(obj) {
    var s = "{";
    for(ea in obj) { 
        s += " " + ea + ":" + String(obj[ea]) + ", \n"
    };
    return s + "}"
},

logObject: function(obj) {
    console.log(printObject(obj))
},
});

})


