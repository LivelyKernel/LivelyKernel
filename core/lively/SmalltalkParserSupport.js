/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


module('lively.SmalltalkParserSupport').requires('lively.ide').toRun(function() {

Object.subclass('StNode', {

	toString: function() {
		return 'StNode';
	},
	
});

StNode.subclass('StAssignmentNode', {
	
	isAssignment: true,
	
	initialize: function($super, variable, value) {
		$super();
		this.variable = variable;
		this.value = value;
	},

	toString: function() {
		return Strings.format('Assignment(%s=%s)', this.variable.toString(), this.value.toString());
	},
});

StNode.subclass('StCascadeNode', {
	
	isCascade: true,
	
	initialize: function($super, messages, receiver) {
		$super();
		this.messages = messages;
		this.receiver = receiver;
	},

	toString: function() {
		return Strings.format('Cascade(%s,[%s])',
			this.receiver.toString(),
			this.messages.collect(function(ea) { return ea.toString() }).join(','));
	},
});

StNode.subclass('StMessageNode', {
	
	isMessage: true,
	
	initialize: function($super, messageName, args, receiver) {
		$super();
		this.messageName = messageName;
		this.args = args;
		this.receiver = receiver;
	},
	
	setReceiver: function(receiver) {
		this.receiver = receiver;
	},
});

StMessageNode.subclass('StUnaryMessageNode', {
	
	isUnary: true,

	toString: function() {
		return Strings.format('Msg(%s.%s)',
			this.receiver.toString(),
			this.messageName);
	},
});

StMessageNode.subclass('StBinaryMessageNode', {

	isBinary: true,

	toString: function() {
		return Strings.format('Msg(%s %s %s)',
			this.receiver.toString(),
			this.messageName,
			this.args.first().toString());
	},
});

StMessageNode.subclass('StKeywordMessageNode', {

	isKeyword: true,

	toString: function() {
		return Strings.format('Msg(%s.%s(%s))',
			this.receiver.toString(),
			this.messageName,
			this.args ? this.args.collect(function(ea) { return ea.toString() }).join(',') : 'no args');
	},	
});

StNode.subclass('StSequenceNode', {
	isSequence: true,
	
	initialize: function($super, children) {
		$super();
		this.children = children;
	},

	toString: function() {
		return Strings.format('Sequence(%s statements)',
			this.children.length);
	},
});

StNode.subclass('StPropertyNode', { /* for JS->St */
	
	isProperty: true,
	
	initialize: function($super, assignment) {
		$super();
		this.assignment = assignment;
		this.isMeta = false;
	},
	
	setMeta: function(isMeta) {
		this.isMeta = isMeta;
	},
	
	toString: function() {
	  return Strings.format('Property(%s)',
			this.assignment.variable.name);
	},
});

StNode.subclass('StInvokableNode', {
	
	isMethod: false,
	
	isBlock: true,
	
	initialize: function($super, sequence, args, declaredVars) {
		$super();
		this.args = args;
		this.sequence = sequence;
		this.declaredVars = declaredVars;
		this.isMeta = null;
		this.methodName = null;
	},
	
	setMethodName: function(methodName) {
		this.isBlock = false;
		this.isMethod = true;
		this.methodName = methodName;
	},

	setArgs: function(args) {
		this.args = args;
	},
	
	setMeta: function(isMeta) {
		if (this.isBlock) throw dbgOn(new Error('StBlockNode cannot be meta/non meta'))
		this.isMeta = isMeta;
	},

	toString: function() {
		return Strings.format('Method(%s(%s)%s)',
			this.methodName ? this.methodName : 'BLOCK',
			this.args ? this.args.collect(function(ea) { return ea.toString() }).join(',') : 'none',
			this.isMeta ? 'isMeta' : '')
	},
});

StInvokableNode.subclass('StPrimitveMethodNode', {
	
	isMethod: true,
	
	isPrimitive: true,
	
	initialize: function($super, methodName, primitiveBody, args) {
		$super(null, args, null);
		this.setMethodName(methodName);
		this.primitiveBody = primitiveBody;
	},

	toString: function() {
		return Strings.format('PrimitiveMethod(%s)',
			this.methodName);
	},
});

StNode.subclass('StClassNode', {
	
	isClass: true,
	
	initialize: function($super, className, methodsAndProperties, superclass) {
		$super();
		this.className = className;
		this.superclass = superclass;
		this.methods = [];
		this.properties = [];
		methodsAndProperties.forEach(function(ea) {
			ea.isMethod ? this.methods.push(ea) : this.properties.push(ea);
		}, this);
	},

	toString: function() {
		return Strings.format('Class(%s)',
			this.className);
	},	
});

StNode.subclass('StFileNode', {
  
  isFile: true,
  
  initialize: function($super, classes) {
    $super();
    this.classes = classes || [];
  },
  
  toString: function() {
		return Strings.format('StFileNode(%s, %s classes)',
		  this.fileName || 'no filename', this.classes.length);
	},
	
  setFileName: function(fileName) {
    this.fileName = fileName;
    this.classes.forEach(function(klass) {
      klass.fileName = fileName;
      klass.methods.concat(klass.properties).forEach(function(member) {
        member.fileName = fileName;
      });
    })
  },
  
});
  
StNode.subclass('StVariableNode', {
	
	isVariable: true,
	
	initialize: function($super, name) {
		$super();
		this.name = name;
	},

	toString: function() {
		return Strings.format('Var(%s)', this.name);
	},
});

StVariableNode.subclass('StInstanceVariableNode', {
	
	isInstance: true,

});

StNode.subclass('StLiteralNode', {
	
	isLiteral: true,
	
	initialize: function($super, value) {
		$super();
		this.value = value;
	},

	toString: function() {
		return 'Literal(' + (this.value ? this.value.toString() : 'UNDEFINED!') + ')';
	},
});

StNode.subclass('StArrayLiteralNode', {
	
	isArrayLiteral: true,
	
	initialize: function($super, sequence) {
		$super();
		this.sequence = sequence;
	},
	
	toString: function() {
		return '#{' + this.sequence.toString() + '}';
	},
});

StNode.subclass('StReturnNode', {

	isReturn: true,
	
	initialize: function($super, value) {
		$super();
		this.value = value;
	},
});

/* ==========================================
   ======= ST AST --> ST and JS Source ======
   ========================================== */

StNode.addMethods({

  toSmalltalk: function() {
    return '';
  },

  mangleMethodName: function(name) {
    return $A(name).collect(function(ea) {
      if (ea == ':') return '';
      if (SmalltalkParser.isBinaryChar(ea)) return this.mangleBinaryChar(ea);
      return ea
    }, this).join('');
  },
  
  mangleBinaryChar: function(character) {
    switch (character) {
      case '+': return '_plus_';
      case '-': return '_minus_';
      default: throw new Error('Cannot mangle binary char ' + character);
    }  
  },
  
  toJavaScript: function() {
    return '';
  },

  eval: function() {
    return eval(this.toJavaScript());
  },
  
});

StAssignmentNode.addMethods({

  toSmalltalk: function() {
    return this.variable.name + ' := ' + this.value.toSmalltalk();
  },

  toJavaScript: function() {
    return this.variable.toJavaScript() + ' = ' + this.value.toJavaScript();
  },

});

StCascadeNode.addMethods({

  toSmalltalk: function() {
    var recv = this.receiver.toSmalltalk();
    var rest = this.messages.collect(function(ea) {
      var part = ea.toSmalltalk();
      part = part.slice(recv.length);
      while (part[0] == ' ') part = part.slice(1);
      return '\t' + part;
      }).join(';\n');
      return recv + '\n' + rest;
    },

    toJavaScript: function(indent, isReturn) {
      var messages;
      var result = '';
      if (this.receiver.isVariable || this.receiver.isLiteral) {
        messages = this.messages.collect(function(ea) { return ea.toJavaScript() });
      } else {
        var recv = this.receiver.toJavaScript();
        result = 'var cascadeHelper = ' + recv + ';\n';
        messages = this.messages.collect(function(ea) { return 'cascadeHelper.' + ea.toJavaScriptWithoutReceiver() })
      } 
      var firsts = messages.slice(0,messages.length - 1)
      var last = messages.last();
      return result + firsts.join(';\n') + ';\n' + (isReturn ? 'return ' : '') + last + ';\n';
      // what about return?
    },

});

StMessageNode.addMethods({

  toJavaScriptWithoutReceiver: function() {
    throw new Error('Subclass responsibility');
  }

});

StUnaryMessageNode.addMethods({

  toSmalltalk: function() {
    return this.receiver.toSmalltalk() + ' ' + this.messageName;
  },

  toJavaScript: function() {
    return this.receiver.toJavaScript() + '.' + this.messageName + '()';
  },

  toJavaScriptWithoutReceiver: function() {
    return this.messageName + '()';
  }

});

StBinaryMessageNode.addMethods({

  toSmalltalk: function() {
    var arg = this.args.first();
    var argString = arg.toSmalltalk();
    if (arg.isBinary || arg.isKeyword)
      argString = '(' + argString + ')';
    var receiverString = this.receiver.toSmalltalk();
    if (this.receiver.isKeyword)
      receiverString = '(' + receiverString + ')';
    return Strings.format('%s %s %s',
    receiverString,
    this.messageName,
    argString);
  },

  toJavaScript: function() {
    var arg = this.args.first();
    var argString = arg.toJavaScript();
    if (arg.isBinary || arg.isKeyword)
      argString = '(' + argString + ')';
    var receiverString = this.receiver.toJavaScript();
    if (this.receiver.isKeyword || this.receiver.isBinary)
      receiverString = '(' + receiverString + ')';
    return Strings.format('%s %s %s',
    receiverString,
    this.messageName,
    argString);
  },

});

StKeywordMessageNode.addMethods({

  toSmalltalk: function() {
    var result = this.receiver.toSmalltalk();
    if (this.receiver.isKeyword) result = '(' + result + ')';
    result += ' ';
    var messageParts = this.messageName.split(':');
    messageParts.pop(); //last is nothing
    result += messageParts.zip(this.args).collect(function(ea) {
      var arg;
      if (ea[1]) {
        arg = ea[1].toSmalltalk();
        if (ea[1].isKeyword) arg = '(' + arg + ')';
      } else {
        arg = 'nil';
      }
      return ea[0] + ': ' + arg;
    }).join(' ');
    return result;
  },

  toJavaScript: function() {
    var result = this.receiver.toJavaScript();
    if (this.receiver.isBinary) result = '(' + result + ')';
    result += '.';
    result += this.toJavaScriptWithoutReceiver();
    return result;
  },

  toJavaScriptWithoutReceiver: function() {
    var result = this.mangleMethodName(this.messageName);
    result += '(';
    result += this.args.collect(function(ea) { return ea.toJavaScript() }).join(',');
    result += ')';
    return result;
  },

});

StSequenceNode.addMethods({

  toSmalltalk: function(indent) {
    indent = Object.isString(indent) ? indent : '';
    if (!this.children || this.children.length == 0) return '';
    return this.children.collect(function(ea) { return indent + ea.toSmalltalk() }).join('.') + '.';
  },

  toJavaScript: function(indent, returnLast) {
    indent = Object.isString(indent) ? indent : '';
    if (!this.children || this.children.length == 0) return '';
    var firsts = this.children.slice(0,this.children.length - 1)
    var last = this.children.last();
    var result = firsts.collect(function(ea) { return indent + ea.toJavaScript() }).join(';');
    if (firsts.length > 0) result += ';';
    result += indent + (returnLast && !last.isCascade ? 'return ' : '') + last.toJavaScript(indent, returnLast);  
    return result;
  },

});

StPropertyNode.addMethods({

  toSmalltalk: function() {
    return (this.isMeta ? '+ ' : '- ') + this.assignment.toSmalltalk() + '.';
  },

  toJavaScript: function() {
    return this.assignment.variable.toJavaScript() + ': ' + this.assignment.value.toJavaScript() + ','
  }

});

StInvokableNode.addMethods({

  methodHeadString: function() {
    var result = this.isMeta ? '+ ' : '- ';
    if (!this.args || this.args.length == 0) return result + this.methodName;
    if (this.args.length == 1) return result + this.methodName + ' ' + this.args.first();
    var methodNameParts = this.methodName.split(':');
    methodNameParts.pop(); // last is nothing
    result += methodNameParts.zip(this.args).collect(function(ea) {
      return ea[0] + ': ' + ea[1]
      }).join(' ');
      return result;
    },

    declaredVarsString: function(indent) {
      indent = Object.isString(indent) ? indent : '';
      if (!this.declaredVars || this.declaredVars.length == 0) return '';
      return indent + Strings.format('| %s |' + indent,
      this.declaredVars.collect(function(ea) {return ea.toSmalltalk()}).join(' '));
    },

    toSmalltalk: function() {
      var result = '';
      if (this.isMethod) {
        result += this.methodHeadString();
        result += this.declaredVarsString('\n\t');
        result += this.sequence.toSmalltalk('\n\t');
        return result;
      }
      result += '[';
      if (this.args && this.args.length > 0)
        result += ':'+ this.args.collect(function(ea) { return ea }).join(' :') + ' | ';
      result += this.declaredVarsString();
      result += ' ';
      result += this.sequence.toSmalltalk();
      result += ']'
      return result;
    },

    toJavaScriptMethodHeader: function() {
      var result = '';
      if (this.isMethod) result += this.mangleMethodName(this.methodName) + ': ';
      result += 'function(';
      if (this.args && this.args.length > 0)
        result += this.args.collect(function(ea) { return ea }).join(',');
      result += ') ';
      return result;
    },

    toJavaScript: function() {
      var result = '';
      if (this.isBlock) result += '(';
      result += this.toJavaScriptMethodHeader();
      result += '{';
      if (this.declaredVars && this.declaredVars.length > 0) {
        result += ' var ';
        result += this.declaredVars.collect(function(ea) {return ea.toJavaScript()}).join(',');
        result += ';';
      }
    result += this.sequence.toJavaScript(' '/*indent*/, !(this.sequence.children.last() instanceof StReturnNode) /*returnLast*/);
    result += ' }';
    if (this.isBlock) result += ')';
    if (this.isMethod) result += ',';
    return result;
  },

});

StPrimitveMethodNode.addMethods({

  toSmalltalk: function() {
    return this.methodHeadString() + ' ' + this.primitiveBody;
  },

  toJavaScript: function() {
    var result = '';
    result += this.toJavaScriptMethodHeader();
    result += "{" + this.primitiveBody.toJavaScript() + "}";
    result += ','
    return result;
  },

});

StClassNode.addMethods({

  toSmalltalk: function() {
    var result = '<' + this.className.value;
    if (this.superclass) result += ':' + this.superclass.toSmalltalk();
    result += '>\n\n';
    if (this.properties.length > 0) {
      result += this.properties.collect(function(ea) { return ea.toSmalltalk() }).join('\n\n');
      result += '\n\n';
    }
    if (this.methods.length > 0) {
      result += this.methods.collect(function(ea) { return ea.toSmalltalk() }).join('\n\n');
    }
    result += '\n\n';
    return result;
  },

  instMethods: function() {
    return this.methods.select(function(ea) { return !ea.isMeta });
  },

  instProperties: function() {
    return this.properties.select(function(ea) { return !ea.isMeta });
  },

  classMethods: function() {
    return this.methods.select(function(ea) { return ea.isMeta });
  },

  classProperties: function() {
    return this.properties.select(function(ea) { return ea.isMeta });
  },

  methodsAndPropertiesToJavaScript: function(methods, properties) {
    var result = '';
    if (properties.length > 0) {
      result += '\n';
      result += properties.collect(function(ea) { return ea.toJavaScript() }).join('\n');
      result += '\n';
    }
    if (methods.length > 0) {
      if (properties.length == 0) result += '\n';
      result += methods.collect(function(ea) { return ea.toJavaScript() }).join('\n\n');
      result += '\n';
    }
    return result;
  },

  toJavaScript: function() {
    var result = this.superclass ? this.superclass.toJavaScript() : 'Object';
    result += '.subclass('
    result += this.className.toJavaScript();
    result += ', {';
    result += this.methodsAndPropertiesToJavaScript(this.instMethods(), this.instProperties());
    result += '});\n';
    var classMethods = this.classMethods(), classProperties = this.classProperties();
    if (classMethods.length == 0 && classProperties.length == 0)
      return result;
    result += 'Object.extend(';
    result += this.className.value;
    result += ', {'
    result += this.methodsAndPropertiesToJavaScript(classMethods, classProperties);
    result += '});\n'
    return result;
  }

});
StFileNode.addMethods({
  toSmalltalk: function() {
    return this.classes.collect(function(ea) { return ea.toSmalltalk() }).join('');
  },
  toJavaScript: function() {
    return this.classes.collect(function(ea) { return ea.toJavaScript() }).join('');
  }
});
StVariableNode.addMethods({

  toSmalltalk: function() {
    return this.name;
  },

  toJavaScript: function() {
    return this.name;
  },
});

StInstanceVariableNode.addMethods({

  toSmalltalk: function() {
    return this.name;
  },

  toJavaScript: function() {
    return 'this.' + this.name.substring(1,this.name.length); // without @
  },

});

StLiteralNode.addMethods({

  toSmalltalk: function() {
    return Object.isString(this.value) ? '\'' + this.value.replace(/'/g, '\'\'') + '\'' : this.value;
  },

  toJavaScript: function() {
    return Object.isString(this.value) ? '\'' + this.value.replace(/''/g, "\\\\'") + '\'' : this.value;
  },

});

StArrayLiteralNode.addMethods({

  toSmalltalk: function() {
    return '#{' + this.sequence.toSmalltalk() + '}';
  },

  toJavaScript: function() {
    return '[' + this.sequence.children.collect(function(ea) { return ea.toJavaScript() }).join(',') + ']';
  }
});

StReturnNode.addMethods({

  toSmalltalk: function() {
    return '^ ' + this.value.toSmalltalk();
  },

  toJavaScript: function() {
    //lively.morphic.World.current().notify('"^" currently not supported ... ');
    //return this.value.toJavaScript();
    return "return " + this.value.toJavaScript() + ";";
  },

});

/* ==============================
   ======= Browser support ======
   ============================== */
StNodeBrowserSupportMixin = {
  startIndex: null,
  stopIndex: null,
  type: null, // fore remembering the grammar rule used for parsing
  directSubElements: function() { throw new Error('Overwrite me!') },
  adoptStateFrom: function() { throw new Error('Overwrite me!') },
  eq: function(other) {
  	if (this == other) return true;
  	if (this.constructor != other.constructor) return false;
  	return this.fileName == other.fileName &&
  		this.stopIndex == other.stopIndex &&
  		this.getSourceCode() == other.getSourceCode();
  },
  subElements: function(depth) {
  if (!depth || depth === 1)
  	return this.directSubElements(); 
  return this.directSubElements().inject([], function(all, ea) { return all.push(ea); all.concat(ea.subElements(depth-1)) });
  },
  flattened: function() {
    return this.directSubElements().inject([this], function(all, ea) { return all.concat(ea.flattened()) });
  },
  reparse: function(newSource) {
    // reparse creates a new ast node but does not replace this with it but just adopt this to
    // its properties
    //dbgOn(true)
    if (!this.type)
      throw dbgOn(new Error('Don\'t know the rule to parse ST source!'));
    var ast = OMetaSupport.matchAllWithGrammar(SmalltalkParser, this.type, newSource, true);
    ast && ast.flattened().forEach(function(ea) {
      ea.sourceControl = this.sourceControl;
      ea.fileName = this.fileName;
    }, this);
		return ast;
  },
  reparseAndCheck: function(newString) {
		var newMe = this.reparse(newString);
		if (!newMe) dbgOn(true);
		if (!newMe || newMe.type !== this.type) {
			var msg = Strings.format('Error occured during parsing.\n%s (%s) was parsed as %s. End line: %s.\nChanges are NOT saved.\nRemove the error and try again.',
				this.name, this.type, newMe.type, newMe.stopLine());
			console.warn(msg);
			lively.morphic.World.current().alert(msg);
			return null;
		}
		return newMe;
	},
  updateIndices: function(newSource, newMe) {    
    this.checkConsistency();
    // started parsing at 0
    var prevStop = this.stopIndex;
    var newStop = this.startIndex + newSource.length - 1; 
    var delta = newStop - prevStop;

    this.stopIndex = newStop;    // self

    var mySubElements = newMe.flattened();
    mySubElements.forEach(function(ea) {
      ea.startIndex += this.startIndex;
      ea.stopIndex += this.startIndex;
    }, this);
    
    this.adoptStateFrom(newMe);
    
    // update fragments which follow after this or where this is a part of
    this.fragmentsOfOwnFile().without(mySubElements).each(function(ea) {
      if (ea.stopIndex < prevStop) return;
      ea.stopIndex += delta;
      if (ea.startIndex <= prevStop) return;
      ea.startIndex += delta;
    });
    
  },
  getSourceControl: lively.ide.FileFragment.prototype.getSourceControl,
  getFileString: lively.ide.FileFragment.prototype.getFileString, // _fallbackSrc
  getSourceCode: lively.ide.FileFragment.prototype.getSourceCode,
  fragmentsOfOwnFile: lively.ide.FileFragment.prototype.fragmentsOfOwnFile,
  findOwnerFragment: lively.ide.FileFragment.prototype.findOwnerFragment,
  checkConsistency: lively.ide.FileFragment.prototype.checkConsistency,
  getSourceCodeWithoutSubElements: lively.ide.FileFragment.prototype.getSourceCodeWithoutSubElements,
  putSourceCode: lively.ide.FileFragment.prototype.putSourceCode,
  buildNewFileString: lively.ide.FileFragment.prototype.buildNewFileString,
  getSourceControl: lively.ide.FileFragment.prototype.getSourceControl,
};
StFileNode.addMethods(StNodeBrowserSupportMixin);
StClassNode.addMethods(StNodeBrowserSupportMixin);
StInvokableNode.addMethods(StNodeBrowserSupportMixin);
StPropertyNode.addMethods(StNodeBrowserSupportMixin);

StNode.addMethods({
  getName: function() {
    return this.toString();
  },
});
StFileNode.addMethods({
  directSubElements: function() {
    return this.classes;
  },
  adoptStateFrom: function(other) {
    console.assert(this.constructor == other.constructor);
    this.classes = other.classes;
  },
});
StClassNode.addMethods({
  directSubElements: function() {
    return this.methods.concat(this.properties);
  },
  adoptStateFrom: function(other) {
    console.assert(this.constructor == other.constructor);
    this.className = other.className;
		this.superclass = other.superclass;	
    this.methods = other.methods;
    this.properties = other.properties;
  },
});
StInvokableNode.addMethods({
  directSubElements: function() { return [] },
  adoptStateFrom: function(other) {
    console.assert(this.constructor == other.constructor);
    this.args = other.args;
		this.sequence = other.sequence;
		this.declaredVars = other.declaredVars;
		this.isMeta = other.isMeta;
		this.methodName = other.methodName;
  },
  simpleName: function() { return this.methodName },
});
StPropertyNode.addMethods({
  directSubElements: function() { return [] },
  adoptStateFrom: function(other) {
    console.assert(this.constructor == other.constructor);
    this.assignment = other.assignment;
		this.isMeta = other.isMeta;
  },
  simpleName: function() { return this.assignment.variable.name },
})


lively.ide.CompleteFileFragmentNode.subclass('StBrowserFileNode', {
	
	childNodes: function() {
		if (!this.target) return [];
		var browser = this.browser;
		return this.target.directSubElements().collect(function(ea) {
			return new StBrowserClassNode(ea, browser);
		});
	},
	
	buttonSpecs: function() {
		return [];
	},
	
	loadModule: function($super) {
		require('lively.SmalltalkParser').toRun(function() { $super() });
	},

	saveSource: function(/*$super,*/newSource, sourceControl) {
		// FIXME ugly hack. Somehow when using super two bound functions are passed in...
		// $super(newSource, sourceControl);
		this.target.putSourceCode(newSource);
		this.savedSource = this.target.getSourceCode();

		var stFilename = this.target.fileName;

		throw dbgOn(new Error('ourceControl.modules changes!!!'));

		var stFileNode = sourceControl.rootFragmentForModule(stFilename);
		if (!stFileNode)
			throw new Error('Couldn\’t find file node for ' + this.asString());
		var jsFilename = stFilename.slice(0, stFilename.lastIndexOf('.'));
		jsFilename += '.js';
		var jsSource = stFileNode.toJavaScript();
		sourceControl.putSourceCodeForFile(jsFilename, jsSource);
		return true;
	},
	
	evalSource: function(newSource) {
		var code = this.target.toJavaScript();
		console.log('Evaluating:');
		console.log(code);
		eval(code);
		return true;
	},

	onSelect: function() { this.browser.currentModuleName = undefiend },
})

lively.ide.CategorizedClassFragmentNode.subclass('StBrowserClassNode', {
  
  isClassNode: true,
  
  childNodes: function() {
    var browser = this.browser;
    var self = this;
    return this.target.directSubElements().collect(function(ea) {
      return new StBrowserMemberNode(ea, browser, self);
    });
  },
  
  menuSpec: function() {
    
  },
  
  saveSource: StBrowserFileNode.prototype.saveSource,
  
  evalSource: function(newSource) {
    var code = this.target.toJavaScript();
    console.log('Evaluating:');
    console.log(code);
    eval(code);
    return true;
  },
      
    asString: function() {
      return this.target.className.value;
    },
});

lively.ide.FileFragmentNode.subclass('StBrowserMemberNode', {

  isMemberNode: true,
  
  asString: function() {
    //FIXME add lines
    return this.target.simpleName();
  },
sourceString: function($super) {
	if (this.browser.viewAs == 'javascript')
		return this.target.toJavaScript();
	return $super();
},

  
  saveSource: StBrowserFileNode.prototype.saveSource,
  
  evalSource: function(newSource) {
    var parent = this.target.findOwnerFragment();
    if (!parent)
      throw new Error('Could not find owner of' + this.asString());
    var code = parent.toJavaScript();
    console.log('Evaluating:');
    console.log(code);
    eval(code);
    return true;
  },
  
  menuSpec: function($super) {
    return [];
  },

});

/* ===================
   ======= Eval ======
   =================== */
lively.morphic.Text.addMethods({
  tryBoundEval: function (str, offset, printIt) {

    var result, self = this;

    function jsEval() {
		self.evalSource = str; // For Dan's Demo September 2
      result = self.boundEval(str);
      if (printIt) printResult();
    };

    function jsCatch(e) {
      offset = offset || 0;
    	if (e.expressionEndOffset) {
    		self.setSelectionRange(e.expressionBeginOffset + offset, e.expressionEndOffset + offset);
    	} else if (e.line) {
    		var lineOffset = self.lineNumberForIndex(offset);
    		var line = self.lines[e.line + lineOffset - 1]
    		if (line.startIndex)
    			self.setSelectionRange(line.startIndex, line.getStopIndex());
    	}
    	self.setStatusMessage("" + e, Color.red); 
    }

    function stEval() {
      var ast = OMetaSupport.matchAllWithGrammar(SmalltalkParser, 'sequence', str, true);
      console.log('Evaluating: ' + ast.toJavaScript());
		self.evalSource = ast.toJavaScript(); // For Dan's Demo September 2
      result = ast.eval();
      if (printIt) printResult();
    };

    function stCatch(e) {
      self.setStatusMessage("Smalltalk exception " + e, Color.red); 
    };

    function printResult() {
      self.setNullSelectionAt(self.selectionRange[1] + 1);
  		var prevSelection = self.selectionRange[0];
  		var replacement = " " + result
  		self.replaceSelectionWith(replacement);
  		self.setSelectionRange(prevSelection, prevSelection + replacement.length);
    }

  	try { jsEval() }
  	catch (e) {
  	  if (Config.suppressSmalltalkEval || !Global['SmalltalkParser']) {
        jsCatch(e);
        return
      }
      try { stEval() } catch(stE) { stCatch(stE) }
  	}
  	return result;
  }
});
/* ============================
   ======= World support ======
   ============================ */
Object.addMethods({
  getVar: function(name) {
    return this[name];
  },
  setVarvalue: function(name, value) {
    return this[name] = value;
  },
});
Morph.addMethods({
  getSubmorphs: function() {
    return this.submorphs;
  },
});

Array.addMethods({
  at: function(index) {
    return this[index];
  },
  atput: function(index, object) {
    return this[index] = object;
  }
});

Function.addMethods({
  value: function(argOrNothing) {
    return this(argOrNothing);
  }
});

});