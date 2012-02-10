module('lively.AST.generated.Nodes').requires().toRun(function() {
Object.subclass('lively.AST.Node');

lively.AST.Node.subclass('lively.AST.Sequence', 
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
	toString: function () {return Strings.format('%s(%s)',
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
					if (this.children[i].nodesMatching(function(node) { return node === existingNode }).length > 0)
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

lively.AST.Node.subclass('lively.AST.Number', 
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

lively.AST.Node.subclass('lively.AST.String', 
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

lively.AST.Node.subclass('lively.AST.Cond', 
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
	toString: function () { return Strings.format('%s(%s?%s:%s)',
				this.constructor.name, this.condExpr, this.trueExpr, this.falseExpr) },
},
'conversion', {
	asJS: function (depth) {
				return Strings.format('(%s) ? (%s) : (%s)',
					this.condExpr.asJS(depth), this.trueExpr.asJS(depth), this.falseExpr.asJS(depth));
			},
},'visiting', {
	accept: function(visitor) {
		return visitor.visitCond(this);
	},
})

lively.AST.Node.subclass('lively.AST.If', 
'testing', {
	isIf: true,
},
'initializing', {
	initialize: function ($super, pos, condExpr, trueExpr, falseExpr) {
				this.pos = pos;
				this.condExpr = condExpr;
				// FIXME actually this could be done with OMeta
				this.trueExpr = trueExpr.isSequence || this.isUndefined(trueExpr) ? trueExpr : new lively.AST.Sequence(trueExpr.pos, [trueExpr]);
				this.falseExpr = falseExpr.isSequence || this.isUndefined(falseExpr) ? falseExpr : new lively.AST.Sequence(trueExpr.pos, [falseExpr]);
				condExpr.setParent(this);
				this.trueExpr.setParent(this);
				this.falseExpr.setParent(this);
			},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.condExpr, this.trueExpr, this.falseExpr) },
	toString: function () { return Strings.format('%s(%s?%s:%s)',
				this.constructor.name, this.condExpr, this.trueExpr, this.falseExpr) },
},
'conversion', {
	asJS: function (depth) {
				var str = Strings.format('if (%s) {%s}',
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
                        if (node === this.condExpr) {
                            return this.trueExpr;
                        } else {
                            return $super(this);
                        }
                    },
	isComposite: function () {
                        return true;
                    },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitIf(this);
	},
})

lively.AST.Node.subclass('lively.AST.While', 
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
	toString: function () { return Strings.format('%s(%s?%s)',
				this.constructor.name, this.condExpr, this.body) },
},
'conversion', {
	asJS: function (depth) {
				return Strings.format('while (%s) {%s}',
					this.condExpr.asJS(depth), this.body.asJS(depth));
			},
},'visiting', {
	accept: function(visitor) {
		return visitor.visitWhile(this);
	},
})

lively.AST.Node.subclass('lively.AST.DoWhile', 
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
	toString: function () { return Strings.format('%s(%s while%s)',
				this.constructor.name, this.body, this.condExpr) },
},
'conversion', {
	asJS: function (depth) {
				return Strings.format('do {%s} while (%s);',
					this.body.asJS(depth), this.condExpr.asJS(depth));
			},
},'visiting', {
	accept: function(visitor) {
		return visitor.visitDoWhile(this);
	},
})

lively.AST.Node.subclass('lively.AST.For', 
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
	toString: function () { return Strings.format('%s(%s;%s;%s do %s)',
				this.constructor.name, this.init, this.condExpr, this.upd, this.body) },
},
'conversion', {
	asJS: function (depth) {
				return Strings.format('for (%s; %s; %s) {%s}',
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

lively.AST.Node.subclass('lively.AST.ForIn', 
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
	toString: function () { return Strings.format('%s(%s in %s do %s)',
				this.constructor.name, this.name, this.obj, this.body) },
},
'conversion', {
	asJS: function (depth) {
				return Strings.format('for (var %s in %s) {%s}',
					this.name.asJS(depth), this.obj.asJS(depth), this.body.asJS(depth));
			},
},'visiting', {
	accept: function(visitor) {
		return visitor.visitForIn(this);
	},
})

lively.AST.Node.subclass('lively.AST.Set', 
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
	toString: function () { return Strings.format('%s(%s = %s)',
				this.constructor.name, this.left, this.right) },
},
'conversion', {
	asJS: function (depth) { return this.left.asJS(depth) + ' = ' + this.right.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitSet(this);
	},
})

lively.AST.Node.subclass('lively.AST.ModifyingSet', 
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
	toString: function () { return Strings.format('%s(%s %s %s)',
				this.constructor.name, this.left, this.name, this.right) },
},
'conversion', {
	asJS: function (depth) { return this.left.asJS(depth) + ' ' + this.name + '= ' + this.right.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitModifyingSet(this);
	},
})

lively.AST.Node.subclass('lively.AST.BinaryOp', 
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
	toString: function () { return Strings.format('%s(%s %s %s)',
				this.constructor.name, this.left, this.name, this.right) },
},
'conversion', {
	asJS: function (depth) { return this.left.asJS(depth) + ' ' + this.name + ' ' + this.right.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitBinaryOp(this);
	},
})

lively.AST.Node.subclass('lively.AST.UnaryOp', 
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
	toString: function () { return Strings.format('%s(%s%s)',
				this.constructor.name, this.name, this.expr) },
},
'conversion', {
	asJS: function (depth) { return this.name + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitUnaryOp(this);
	},
})

lively.AST.Node.subclass('lively.AST.PreOp', 
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
	toString: function () { return Strings.format('%s(%s%s)',
				this.constructor.name, this.name, this.expr) },
},
'conversion', {
	asJS: function (depth) { return this.name + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitPreOp(this);
	},
})

lively.AST.Node.subclass('lively.AST.PostOp', 
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
	toString: function () { return Strings.format('%s(%s%s)',
				this.constructor.name, this.expr, this.name) },
},
'conversion', {
	asJS: function (depth) { return this.expr.asJS(depth) + this.name },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitPostOp(this);
	},
})

lively.AST.Node.subclass('lively.AST.This', 
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

lively.AST.Node.subclass('lively.AST.Variable', 
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
	toString: function () { return Strings.format('%s(%s)',
				this.constructor.name, this.name) },
},
'conversion', {
	asJS: function (depth) { return this.name },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitVariable(this);
	},
})

lively.AST.Node.subclass('lively.AST.GetSlot', 
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
	toString: function () { return Strings.format('%s(%s[%s])',
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

lively.AST.Node.subclass('lively.AST.Break', 
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

lively.AST.Node.subclass('lively.AST.Debugger', 
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

lively.AST.Node.subclass('lively.AST.Continue', 
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

lively.AST.Node.subclass('lively.AST.ArrayLiteral', 
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
	toString: function () { return Strings.format('%s(%s)',
				this.constructor.name, this.elements.join(',')) },
},
'conversion', {
	asJS: function (depth) { return '[' + this.elements.invoke('asJS').join(',') + ']' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitArrayLiteral(this);
	},
})

lively.AST.Node.subclass('lively.AST.Return', 
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
	toString: function () { return Strings.format('%s(%s)',
				this.constructor.name, this.expr) },
},
'conversion', {
	asJS: function (depth) { return 'return ' + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitReturn(this);
	},
})

lively.AST.Node.subclass('lively.AST.With', 
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
	toString: function () { return Strings.format('%s(%s %s)',
				this.constructor.name, this.obj, this.body) },
},
'conversion', {
	asJS: function (depth) { return 'with (' + this.obj.asJS(depth) + ') {' + this.body.asJS(depth) + '}' },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitWith(this);
	},
})

lively.AST.Node.subclass('lively.AST.Send', 
'testing', {
	isSend: true,
},
'initializing', {
	initialize: function($super, pos, name, recv, args) {
		this.pos = pos;
		this.name = name;
		this.recv = recv;
		this.args = args;
		args.forEach(function(node) { node.setParent(this) }, this);
		recv.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, '"'+this.name+'"', this.recv, this.args) },
	toString: function () { return Strings.format('%s(%s[%s](%s))',
				this.constructor.name, this.recv, this.name, this.args.join(',')) },
},
'conversion', {
	asJS: function (depth) {
				var recvJS = this.recv.asJS(depth);
				if (this.recv.isFunction) recvJS = '(' + recvJS + ')';
				return Strings.format('%s["%s"](%s)',
					recvJS, this.name, this.args.invoke('asJS').join(','));
			},
},
'accessing', {
	getName: function () { return this.name },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitSend(this);
	},
})

lively.AST.Node.subclass('lively.AST.Call', 
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
	toString: function () { return Strings.format('%s(%s(%s))',
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

lively.AST.Node.subclass('lively.AST.New', 
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
	toString: function () { return Strings.format('%s(%s)',
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

lively.AST.Node.subclass('lively.AST.VarDeclaration', 
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
	toString: function () { return Strings.format('%s(%s = %s)',
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

lively.AST.Node.subclass('lively.AST.Throw', 
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
	toString: function () { return Strings.format('%s(%s)',
				this.constructor.name, this.expr) },
},
'conversion', {
	asJS: function (depth) { return 'throw ' + this.expr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitThrow(this);
	},
})

lively.AST.Node.subclass('lively.AST.TryCatchFinally', 
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
	toString: function () { return Strings.format('%s(%s %s %s)',
				this.constructor.name, this.trySeq, this.catchSeq, this.finallySeq) },
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

lively.AST.Node.subclass('lively.AST.Function', 
'testing', {
	isFunction: true,
},
'initializing', {
	initialize: function($super, pos, args, body) {
		this.pos = pos;
		this.args = args;
		this.body = body;
		body.setParent(this);
	},
},
'debugging', {
	printConstruction: function () { return this.printConstructorCall(this.pos, this.args.collect(function(ea) { return '"' + ea + '"' }), this.body) },
	toString: function () { return Strings.format('%s(function(%s) %s)',
				this.constructor.name, this.args.join(','), this.body) },
},
'conversion', {
	asJS: function (depth) {
				return Strings.format('function%s(%s) {\n%s\n}',
					this.name ? ' ' + this.name : '',this.args.join(','),
					this.indent(depth+1) + this.body.asJS(depth+1));
			},
},
'accessing', {
	setName: function (name) { this.name = name },
	getName: function () { return this.name },
	parentFunction: function () { return this },
	statements: function () { return this.body.children },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitFunction(this);
	},
})

lively.AST.Node.subclass('lively.AST.ObjectLiteral', 
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
	toString: function () { return Strings.format('%s({%s})',
				this.constructor.name, this.properties.join(',')) },
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

lively.AST.Node.subclass('lively.AST.ObjProperty', 
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
	toString: function () { return Strings.format('%s(%s: %s)',
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

lively.AST.Node.subclass('lively.AST.Switch', 
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

lively.AST.Node.subclass('lively.AST.Case', 
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
	toString: function () { return Strings.format('%s(%s: %s)',
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

lively.AST.Node.subclass('lively.AST.Default', 
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
	toString: function () { return Strings.format('%s(default: %s)',
				this.constructor.name,  this.defaultExpr) },
},
'conversion', {
	asJS: function (depth) { return 'default: ' + this.defaultExpr.asJS(depth) },
},'visiting', {
	accept: function(visitor) {
		return visitor.visitDefault(this);
	},
})

lively.AST.Node.subclass('lively.AST.Regex', 
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
Object.subclass('lively.AST.Visitor', 
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