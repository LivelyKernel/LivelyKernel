module('lively.ast.generated.Nodes').requires().toRun(function() {
Object.subclass('lively.ast.Node');

lively.ast.Node.subclass('lively.ast.Sequence', 
'testing', {
	isSequence: true,
},
'initializing', {
	initialize: function($super, pos, children) {
		this.pos = pos;
		this.children = children;
		children.forEach(function(node) { node.setParent(this) }, this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.children) },
	toString: function () {
                return Strings.format(
                    '%s(%s)',
                    this.constructor.name, this.children.join(','))
            },
},
'conversion', {
	asJS: function (depth) {
                var indent = this.indent(depth || 0);
                depth = depth || -1;
                return this.children.invoke('asJS', depth + 1).join(';\n' + indent);
            },
},
'insertion', {
	insertBefore: function (newNode, existingNode) {
                for (var i = 0; i < this.children.length; i++)
                    if (this.children[i].nodesMatching(function(node) {
                        return node === existingNode }).length > 0)
                        break;
                if (!this.children[i])
                    throw dbgOn(new Error('insertBefore: ' + existingNode + ' not in ' + this));
                return this.insertAt(newNode, i);
            },
	insertAt: function (newNode, idx) {
                this.children.pushAt(newNode, idx);
                newNode.setParent(this);
                return newNode;
            },
},
'accessing', {
	parentSequence: function () { return this },
},
'stepping', {
	firstStatement: function () {
                return this.children.length > 0
                     ? this.children[0].firstStatement()
                     : this;
            },
	nextStatement: function ($super, node) {
                var idx = this.children.indexOf(node);
                if (idx >= 0 && idx < this.children.length - 1)
                    return this.children[idx + 1];
                return $super(this);
            },
	isComposite: function () {
                return true;
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitSequence(this);
	},
})

lively.ast.Node.subclass('lively.ast.Number', 
'testing', {
	isNumber: true,
},
'initializing', {
	initialize: function($super, pos, value) {
		this.pos = pos;
		this.value = value;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.pos, this.value) },
	toString: function () { return Strings.format('%s(%s)', this.constructor.name, this.value) },
},
'conversion', {
	asJS: function (depth) { return this.value },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitNumber(this);
	},
})

lively.ast.Node.subclass('lively.ast.String', 
'testing', {
	isString: true,
},
'initializing', {
	initialize: function($super, pos, value) {
		this.pos = pos;
		this.value = value;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"' + this.value + '"') },
	toString: function () { return Strings.format('%s(%s)', this.constructor.name, this.value) },
},
'conversion', {
	asJS: function (depth) { return '"' + this.value + '"' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitString(this);
	},
})

lively.ast.Node.subclass('lively.ast.Cond', 
'testing', {
	isCond: true,
},
'initializing', {
	initialize: function($super, pos, condExpr, trueExpr, falseExpr) {
		this.pos = pos;
		this.condExpr = condExpr;
		this.trueExpr = trueExpr;
		this.falseExpr = falseExpr;
		condExpr.setParent(this);
		trueExpr.setParent(this);
		falseExpr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.condExpr, this.trueExpr, this.falseExpr) },
	toString: function () { return Strings.format(
                '%s(%s?%s:%s)',
                this.constructor.name, this.condExpr, this.trueExpr, this.falseExpr) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format(
                    '(%s) ? (%s) : (%s)',
                    this.condExpr.asJS(depth), this.trueExpr.asJS(depth), this.falseExpr.asJS(depth));
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitCond(this);
	},
})

lively.ast.Node.subclass('lively.ast.If', 
'testing', {
	isIf: true,
},
'initializing', {
	initialize: function ($super, pos, condExpr, trueExpr, falseExpr) {
                this.pos = pos;
                this.condExpr = condExpr;
                // FIXME actually this could be done with OMeta
                this.trueExpr = trueExpr.isSequence || this.isUndefined(trueExpr) ?
                    trueExpr : new lively.ast.Sequence(trueExpr.pos, [trueExpr]);
                this.falseExpr = falseExpr.isSequence || this.isUndefined(falseExpr) ?
                    falseExpr : new lively.ast.Sequence(trueExpr.pos, [falseExpr]);
                condExpr.setParent(this);
                this.trueExpr.setParent(this);
                this.falseExpr.setParent(this);
            },
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.condExpr, this.trueExpr, this.falseExpr) },
	toString: function () { return Strings.format(
                '%s(%s?%s:%s)',
                this.constructor.name, this.condExpr, this.trueExpr, this.falseExpr) },
},
'conversion', {
	asJS: function (depth) {
                var str = Strings.format(
                    'if (%s) {%s}',
                    this.condExpr.asJS(depth), this.trueExpr.asJS(depth));
                if (!this.isUndefined(this.falseExpr))
                    str += ' else {' + this.falseExpr.asJS(depth) + '}';
                return str;
            },
},
'stepping', {
	firstStatement: function () {
                return this.condExpr.firstStatement();
            },
	nextStatement: function ($super, node) {
                return node === this.condExpr ? this.trueExpr : $super(this);
            },
	isComposite: function () { return true; },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitIf(this);
	},
})

lively.ast.Node.subclass('lively.ast.While', 
'testing', {
	isWhile: true,
},
'initializing', {
	initialize: function($super, pos, condExpr, body) {
		this.pos = pos;
		this.condExpr = condExpr;
		this.body = body;
		condExpr.setParent(this);
		body.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.condExpr, this.body) },
	toString: function () { return Strings.format(
                '%s(%s?%s)',
                this.constructor.name, this.condExpr, this.body) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format(
                    'while (%s) {%s}',
                    this.condExpr.asJS(depth), this.body.asJS(depth));
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitWhile(this);
	},
})

lively.ast.Node.subclass('lively.ast.DoWhile', 
'testing', {
	isDoWhile: true,
},
'initializing', {
	initialize: function($super, pos, body, condExpr) {
		this.pos = pos;
		this.body = body;
		this.condExpr = condExpr;
		body.setParent(this);
		condExpr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.body, this.condExpr) },
	toString: function () { return Strings.format(
                '%s(%s while%s)',
                this.constructor.name, this.body, this.condExpr) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format(
                    'do {%s} while (%s);',
                    this.body.asJS(depth), this.condExpr.asJS(depth));
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitDoWhile(this);
	},
})

lively.ast.Node.subclass('lively.ast.For', 
'testing', {
	isFor: true,
},
'initializing', {
	initialize: function($super, pos, init, condExpr, upd, body) {
		this.pos = pos;
		this.init = init;
		this.condExpr = condExpr;
		this.upd = upd;
		this.body = body;
		init.setParent(this);
		condExpr.setParent(this);
		upd.setParent(this);
		body.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.init, this.condExpr, this.upd, this.body) },
	toString: function () { return Strings.format(
                '%s(%s;%s;%s do %s)',
                this.constructor.name, this.init, this.condExpr, this.upd, this.body) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format(
                    'for (%s; %s; %s) {%s}',
                    this.init.asJS(depth), this.condExpr.asJS(depth), this.upd.asJS(depth), this.body.asJS(depth));
            },
},
'stepping', {
	firstStatement: function () {
                return this.init.firstStatement();
            },
	nextStatement: function ($super, node) {
                if (node === this.init || node === this.upd) {
                    return this.condExpr;
                } else if (node === this.condExpr) {
                    return this.body;
                } else if (node === this.body) {
                    return this.upd;
                } else {
                    return $super(this);
                }
            },
	isComposite: function () {
                return true;
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitFor(this);
	},
})

lively.ast.Node.subclass('lively.ast.ForIn', 
'testing', {
	isForIn: true,
},
'initializing', {
	initialize: function($super, pos, name, obj, body) {
		this.pos = pos;
		this.name = name;
		this.obj = obj;
		this.body = body;
		name.setParent(this);
		obj.setParent(this);
		body.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.name, this.obj, this.body) },
	toString: function () {
                return Strings.format(
                    '%s(%s in %s do %s)',
                    this.constructor.name, this.name, this.obj, this.body);
            },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format(
                    'for (var %s in %s) {%s}',
                    this.name.asJS(depth), this.obj.asJS(depth), this.body.asJS(depth));
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitForIn(this);
	},
})

lively.ast.Node.subclass('lively.ast.Set', 
'testing', {
	isSet: true,
},
'initializing', {
	initialize: function($super, pos, left, right) {
		this.pos = pos;
		this.left = left;
		this.right = right;
		left.setParent(this);
		right.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.left, this.right) },
	toString: function () { return Strings.format(
                '%s(%s = %s)',
                this.constructor.name, this.left, this.right) },
},
'conversion', {
	asJS: function (depth) { return this.left.asJS(depth) + ' = ' + this.right.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitSet(this);
	},
})

lively.ast.Node.subclass('lively.ast.ModifyingSet', 
'testing', {
	isModifyingSet: true,
},
'initializing', {
	initialize: function($super, pos, left, name, right) {
		this.pos = pos;
		this.left = left;
		this.name = name;
		this.right = right;
		left.setParent(this);
		right.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.left, '"' + this.name + '"', this.right) },
	toString: function () { return Strings.format(
                '%s(%s %s %s)',
                this.constructor.name, this.left, this.name, this.right) },
},
'conversion', {
	asJS: function (depth) { return this.left.asJS(depth) + ' ' + this.name + '= ' + this.right.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitModifyingSet(this);
	},
})

lively.ast.Node.subclass('lively.ast.BinaryOp', 
'testing', {
	isBinaryOp: true,
},
'initializing', {
	initialize: function($super, pos, name, left, right) {
		this.pos = pos;
		this.name = name;
		this.left = left;
		this.right = right;
		left.setParent(this);
		right.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"' + this.name + '"', this.left, this.right) },
	toString: function () { return Strings.format(
                '%s(%s %s %s)',
                this.constructor.name, this.left, this.name, this.right) },
},
'conversion', {
	asJS: function (depth) { return this.left.asJS(depth) + ' ' + this.name + ' ' + this.right.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitBinaryOp(this);
	},
})

lively.ast.Node.subclass('lively.ast.UnaryOp', 
'testing', {
	isUnaryOp: true,
},
'initializing', {
	initialize: function($super, pos, name, expr) {
		this.pos = pos;
		this.name = name;
		this.expr = expr;
		expr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"' + this.name + '"', this.expr) },
	toString: function () { return Strings.format(
                '%s(%s%s)',
                this.constructor.name, this.name, this.expr) },
},
'conversion', {
	asJS: function (depth) { return this.name + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitUnaryOp(this);
	},
})

lively.ast.Node.subclass('lively.ast.PreOp', 
'testing', {
	isPreOp: true,
},
'initializing', {
	initialize: function($super, pos, name, expr) {
		this.pos = pos;
		this.name = name;
		this.expr = expr;
		expr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"' + this.name+'"', this.expr) },
	toString: function () { return Strings.format(
                '%s(%s%s)',
                this.constructor.name, this.name, this.expr) },
},
'conversion', {
	asJS: function (depth) { return this.name + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitPreOp(this);
	},
})

lively.ast.Node.subclass('lively.ast.PostOp', 
'testing', {
	isPostOp: true,
},
'initializing', {
	initialize: function($super, pos, name, expr) {
		this.pos = pos;
		this.name = name;
		this.expr = expr;
		expr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.expr) },
	toString: function () { return Strings.format(
                '%s(%s%s)',
                this.constructor.name, this.expr, this.name) },
},
'conversion', {
	asJS: function (depth) { return this.expr.asJS(depth) + this.name },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitPostOp(this);
	},
})

lively.ast.Node.subclass('lively.ast.This', 
'testing', {
	isThis: true,
},
'initializing', {
	initialize: function($super, pos) {
		this.pos = pos;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos) },
	toString: function () { return this.constructor.name },
},
'conversion', {
	asJS: function (depth) { return 'this' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitThis(this);
	},
})

lively.ast.Node.subclass('lively.ast.Variable', 
'testing', {
	isVariable: true,
},
'initializing', {
	initialize: function($super, pos, name) {
		this.pos = pos;
		this.name = name;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"'+this.name+'"') },
	toString: function () { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.name) },
},
'conversion', {
	asJS: function (depth) { return this.name },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitVariable(this);
	},
})

lively.ast.Node.subclass('lively.ast.GetSlot', 
'testing', {
	isGetSlot: true,
},
'initializing', {
	initialize: function($super, pos, slotName, obj) {
		this.pos = pos;
		this.slotName = slotName;
		this.obj = obj;
		slotName.setParent(this);
		obj.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.slotName, this.obj) },
	toString: function () { return Strings.format(
                '%s(%s[%s])',
                this.constructor.name, this.obj, this.slotName) },
},
'conversion', {
	asJS: function (depth) {
                var objJS = this.obj.asJS(depth);
                if (this.obj.isFunction) objJS = '(' + objJS + ')';
                return objJS + '[' + this.slotName.asJS(depth) + ']';
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitGetSlot(this);
	},
})

lively.ast.Node.subclass('lively.ast.Break', 
'testing', {
	isBreak: true,
},
'initializing', {
	initialize: function($super, pos) {
		this.pos = pos;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos) },
},
'conversion', {
	asJS: function (depth) { return 'break' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitBreak(this);
	},
})

lively.ast.Node.subclass('lively.ast.Debugger', 
'testing', {
	isDebugger: true,
},
'initializing', {
	initialize: function($super, pos) {
		this.pos = pos;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos) },
},
'conversion', {
	asJS: function (depth) { return 'debugger' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitDebugger(this);
	},
})

lively.ast.Node.subclass('lively.ast.Continue', 
'testing', {
	isContinue: true,
},
'initializing', {
	initialize: function($super, pos) {
		this.pos = pos;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos) },
},
'conversion', {
	asJS: function (depth) { return 'continue' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitContinue(this);
	},
})

lively.ast.Node.subclass('lively.ast.ArrayLiteral', 
'testing', {
	isArrayLiteral: true,
},
'initializing', {
	initialize: function($super, pos, elements) {
		this.pos = pos;
		this.elements = elements;
		elements.forEach(function(node) { node.setParent(this) }, this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.elements) },
	toString: function () { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.elements.join(',')) },
},
'conversion', {
	asJS: function (depth) { return '[' + this.elements.invoke('asJS').join(',') + ']' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitArrayLiteral(this);
	},
})

lively.ast.Node.subclass('lively.ast.Return', 
'testing', {
	isReturn: true,
},
'initializing', {
	initialize: function($super, pos, expr) {
		this.pos = pos;
		this.expr = expr;
		expr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.expr) },
	toString: function () { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.expr) },
},
'conversion', {
	asJS: function (depth) { return 'return ' + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitReturn(this);
	},
})

lively.ast.Node.subclass('lively.ast.With', 
'testing', {
	isWith: true,
},
'initializing', {
	initialize: function($super, pos, obj, body) {
		this.pos = pos;
		this.obj = obj;
		this.body = body;
		obj.setParent(this);
		body.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.obj, this.body) },
	toString: function () { return Strings.format(
                '%s(%s %s)',
                this.constructor.name, this.obj, this.body) },
},
'conversion', {
	asJS: function (depth) { return 'with (' + this.obj.asJS(depth) + ') {' + this.body.asJS(depth) + '}' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitWith(this);
	},
})

lively.ast.Node.subclass('lively.ast.Send', 
'testing', {
	isSend: true,
},
'initializing', {
	initialize: function($super, pos, property, recv, args) {
		this.pos = pos;
		this.property = property;
		this.recv = recv;
		this.args = args;
		args.forEach(function(node) { node.setParent(this) }, this);
		property.setParent(this);
		recv.setParent(this);
	},
},
'debugging', {
	printConstruction: function () {
                return this.printConstructorCall(this.pos, this.property, this.recv, this.args)
            },
	toString: function () {
                return Strings.format('%s(%s[%s](%s))',
                    this.constructor.name, this.recv, this.property, this.args.join(','))
            },
},
'conversion', {
	asJS: function (depth) {
                var recvJS = this.recv.asJS(depth);
                if (this.recv.isFunction) recvJS = '(' + recvJS + ')';
                return Strings.format(
                    '%s[%s](%s)',
                    recvJS, this.property.asJS(depth), this.args.invoke('asJS').join(','));
            },
},
'accessing', {
	getName: function () { return this.property },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitSend(this);
	},
})

lively.ast.Node.subclass('lively.ast.Call', 
'testing', {
	isCall: true,
},
'initializing', {
	initialize: function($super, pos, fn, args) {
		this.pos = pos;
		this.fn = fn;
		this.args = args;
		args.forEach(function(node) { node.setParent(this) }, this);
		fn.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.fn, this.args) },
	toString: function () { return Strings.format(
                '%s(%s(%s))',
                this.constructor.name, this.fn, this.args.join(',')) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format('%s(%s)',
                                      this.fn.asJS(depth), this.args.invoke('asJS').join(','));
            },
},
'accessing', {
	getName: function () { return this.fn.name },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitCall(this);
	},
})

lively.ast.Node.subclass('lively.ast.New', 
'testing', {
	isNew: true,
},
'initializing', {
	initialize: function($super, pos, clsExpr) {
		this.pos = pos;
		this.clsExpr = clsExpr;
		clsExpr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.clsExpr) },
	toString: function () { return Strings.format(
                '%s(%s)',
                this.constructor.name, this.clsExpr) },
},
'conversion', {
	asJS: function (depth) {
                return 'new ' + this.clsExpr.asJS(depth);
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitNew(this);
	},
})

lively.ast.Node.subclass('lively.ast.VarDeclaration', 
'testing', {
	isVarDeclaration: true,
},
'initializing', {
	initialize: function($super, pos, name, val) {
		this.pos = pos;
		this.name = name;
		this.val = val;
		val.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.val) },
	toString: function () { return Strings.format(
                '%s(%s = %s)',
                this.constructor.name, this.name, this.val) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format('var %s = %s', this.name, this.val.asJS(depth));
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitVarDeclaration(this);
	},
})

lively.ast.Node.subclass('lively.ast.Throw', 
'testing', {
	isThrow: true,
},
'initializing', {
	initialize: function($super, pos, expr) {
		this.pos = pos;
		this.expr = expr;
		expr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.expr) },
	toString: function () {
                return Strings.format(
                    '%s(%s)',
                    this.constructor.name, this.expr)
            },
},
'conversion', {
	asJS: function (depth) { return 'throw ' + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitThrow(this);
	},
})

lively.ast.Node.subclass('lively.ast.TryCatchFinally', 
'testing', {
	isTryCatchFinally: true,
},
'initializing', {
	initialize: function($super, pos, trySeq, errName, catchSeq, finallySeq) {
		this.pos = pos;
		this.trySeq = trySeq;
		this.errName = errName;
		this.catchSeq = catchSeq;
		this.finallySeq = finallySeq;
		trySeq.setParent(this);
		catchSeq.setParent(this);
		finallySeq.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.trySeq, '"'+this.errName+'"', this.catchSeq, this.finallySeq) },
	toString: function () {
                return Strings.format(
                    '%s(%s %s %s)',
                    this.constructor.name, this.trySeq, this.catchSeq, this.finallySeq)
            },
},
'conversion', {
	asJS: function (depth) {
                var baseIndent = this.indent(depth-1),
                    indent = this.indent(depth),
                str = 'try {\n' + indent + this.trySeq.asJS(depth) + '\n' + baseIndent + '}';
                if (!this.isUndefined(this.catchSeq))
                    str += ' catch(' + this.errName + ') {\n' +
                    indent + this.catchSeq.asJS(depth) + '\n' + baseIndent + '}';
                if (!this.isUndefined(this.finallySeq))
                    str += ' finally {\n' + indent + this.finallySeq.asJS(depth) + '\n' + baseIndent + '}';
                return str;
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitTryCatchFinally(this);
	},
})

lively.ast.Node.subclass('lively.ast.Function', 
'testing', {
	isFunction: true,
},
'initializing', {
	initialize: function($super, pos, args, body) {
		this.pos = pos;
		this.args = args;
		this.body = body;
		args.forEach(function(node) { node.setParent(this) }, this);
		body.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.args.collect(function(ea) { return '"' + ea.name + '"' }), this.body) },
	toString: function () {
                return Strings.format(
                    '%s(function(%s) %s)',
                    this.constructor.name, this.argNames().join(','), this.body)
            },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format('function%s(%s) {\n%s\n}',
                                      this.name ? ' ' + this.name : '',this.argNames().join(','),
                                      this.indent(depth+1) + this.body.asJS(depth+1));
            },
},
'accessing', {
	setName: function (name) { this.name = name },
	getName: function () { return this.name },
	parentFunction: function () { return this },
	argNames: function () { return this.args.collect(function(a){ return a.name }); },
	statements: function () { return this.body.children },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitFunction(this);
	},
})

lively.ast.Node.subclass('lively.ast.ObjectLiteral', 
'testing', {
	isObjectLiteral: true,
},
'initializing', {
	initialize: function($super, pos, properties) {
		this.pos = pos;
		this.properties = properties;
		properties.forEach(function(node) { node.setParent(this) }, this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.properties) },
	toString: function () {
                return Strings.format(
                    '%s({%s})',
                    this.constructor.name, this.properties.join(','))
            },
},
'conversion', {
	asJS: function (depth) {
                return '{' + this.properties.invoke('asJS').join(',') + '}';
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitObjectLiteral(this);
	},
})

lively.ast.Node.subclass('lively.ast.ObjProperty', 
'testing', {
	isObjProperty: true,
},
'initializing', {
	initialize: function($super, pos, name, property) {
		this.pos = pos;
		this.name = name;
		this.property = property;
		property.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.property) },
	toString: function () {
          return Strings.format(
              '%s(%s: %s)',
              this.constructor.name, this.name, this.property) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format('"%s": %s', this.name, this.property.asJS(depth));
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitObjProperty(this);
	},
})

lively.ast.Node.subclass('lively.ast.Switch', 
'testing', {
	isSwitch: true,
},
'initializing', {
	initialize: function($super, pos, expr, cases) {
		this.pos = pos;
		this.expr = expr;
		this.cases = cases;
		cases.forEach(function(node) { node.setParent(this) }, this);
		expr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.expr, this.cases) },
	toString: function () { return Strings.format('%s(%s %s)',
                                                         this.constructor.name, this.expr, this.cases.join('\n')) },
},
'conversion', {
	asJS: function (depth) {
                return Strings.format('switch (%s) {%s}',
                                      this.expr.asJS(depth), this.cases.invoke('asJS').join('\n'));
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitSwitch(this);
	},
})

lively.ast.Node.subclass('lively.ast.Case', 
'testing', {
	isCase: true,
},
'initializing', {
	initialize: function($super, pos, condExpr, thenExpr) {
		this.pos = pos;
		this.condExpr = condExpr;
		this.thenExpr = thenExpr;
		condExpr.setParent(this);
		thenExpr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.condExpr, this.thenExpr) },
	toString: function () {
                return Strings.format(
                    '%s(%s: %s)',
                    this.constructor.name, this.condExpr, this.thenExpr) },
},
'conversion', {
	asJS: function (depth) {
                return 'case ' + this.condExpr.asJS(depth) + ': ' + this.thenExpr.asJS(depth);
            },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitCase(this);
	},
})

lively.ast.Node.subclass('lively.ast.Default', 
'testing', {
	isDefault: true,
},
'initializing', {
	initialize: function($super, pos, defaultExpr) {
		this.pos = pos;
		this.defaultExpr = defaultExpr;
		defaultExpr.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.defaultExpr) },
	toString: function () { return Strings.format(
                '%s(default: %s)',
                this.constructor.name,  this.defaultExpr) },
},
'conversion', {
	asJS: function (depth) { return 'default: ' + this.defaultExpr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitDefault(this);
	},
})

lively.ast.Node.subclass('lively.ast.Regex', 
'testing', {
	isRegex: true,
},
'initializing', {
	initialize: function($super, pos, exprString, flags) {
		this.pos = pos;
		this.exprString = exprString;
		this.flags = flags;

	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.exprString, this.flags) },
	toString: function () { return Strings.format('(/%s/%s)', this.exprString, this.flags) },
},
'conversion', {
	asJS: function (depth) { return '/' + this.exprString + '/' + this.flags},
},'visiting', {
	accept: function(visitor) {
		return visitor.visitRegex(this);
	},
})
Object.subclass('lively.ast.Visitor', 
'visiting', {
	visit: function(node) { return node.accept(this) },
	visitSequence: function(node) {},
	visitNumber: function(node) {},
	visitString: function(node) {},
	visitCond: function(node) {},
	visitIf: function(node) {},
	visitWhile: function(node) {},
	visitDoWhile: function(node) {},
	visitFor: function(node) {},
	visitForIn: function(node) {},
	visitSet: function(node) {},
	visitModifyingSet: function(node) {},
	visitBinaryOp: function(node) {},
	visitUnaryOp: function(node) {},
	visitPreOp: function(node) {},
	visitPostOp: function(node) {},
	visitThis: function(node) {},
	visitVariable: function(node) {},
	visitGetSlot: function(node) {},
	visitBreak: function(node) {},
	visitDebugger: function(node) {},
	visitContinue: function(node) {},
	visitArrayLiteral: function(node) {},
	visitReturn: function(node) {},
	visitWith: function(node) {},
	visitSend: function(node) {},
	visitCall: function(node) {},
	visitNew: function(node) {},
	visitVarDeclaration: function(node) {},
	visitThrow: function(node) {},
	visitTryCatchFinally: function(node) {},
	visitFunction: function(node) {},
	visitObjectLiteral: function(node) {},
	visitObjProperty: function(node) {},
	visitSwitch: function(node) {},
	visitCase: function(node) {},
	visitDefault: function(node) {},
	visitRegex: function(node) {},

})
});