module('lively.morphic.GlobalLogger').requires().toRun(function() {
Object.subclass('lively.GlobalLogger',
'initialization', {
    initialize: function () {
		this.stack = [];
		this.counter = 0;
		this.initializeSilentList();
		this.enableLogging();
    },
	initializeSilentList: function () {
		var self = this;
		this.silentFunctions = [
			[lively.morphic.World, ['openInspectorFor', 'openStyleEditorFor', 'openPartsBin']],
			[lively.morphic.Morph, ['showMorphMenu', 'showHalos']],
			[lively.morphic.Menu, ['initialize', 'openIn', 'remove']],
		]
		this.silentClasses = [lively.morphic.Menu, lively.morphic.MenuItem, lively.morphic.Window/*, lively.morphic.ColorChooser*/] // loadging order
		this.loggedFunctions = [
			[lively.morphic.Morph, ['addMorph', 'remove', 'morphicSetter']],
			[lively.morphic.Shapes.Shape, ['shapeSetter']]
		]
		cop.create('LoggerLayer');
		this.silentFunctions.each(function (extendableClass) {
			extendableClass[0] && self.disableLoggingOfFunctionsFromClass(extendableClass[0], extendableClass[1])
		})
		this.silentClasses.each(function (eachClass) {
			self.disableLoggingForClass(eachClass)
		})
		this.loggedFunctions.each(function (extendableClass) {
			self.enableLoggingOfFunctionsFromClass(extendableClass[0], extendableClass[1])
		})
		LoggerLayer.beGlobal();
	},
},
'logging', {
	logAction: function(action) {
		if (	action
				&& this.loggingEnabled
				&& action.morph.isLoggable
				&& !(action.morph.ownerChain && action.morph.ownerChain().find(function (ea) {return !ea.isLoggable && !ea instanceof lively.morphic.HandMorph}))
		) {
			action.time = (new Date ()).getTime();
			if (this.stack.length > this.counter) {
				this.stack.splice(this.counter)
			}
			// keep changes at a bundle if they happen at the same time
			if (this.stack.last() && this.stack.last().last() && (action.time - this.stack.last().last().time) <= 100) {
				this.stack.last().push(action)
			}
			else {
				this.stack.push([action])
				this.counter ++
			}
		}
		else
			return false
	},
	undoLastAction: function () {
		var self = this;
		if (this.counter <= 0) {
			console.log('Nothing to undo')
			return false
		}
		this.stack[this.counter-1] && this.stack[this.counter-1].reverse().each(function (ea) {
			self.undoAction(ea);
		})
		this.counter --
	},
	undoAction: function (action) {
		this.disableLogging()
		if (action.morph.getLoggability && action.morph.getLoggability() || !action.morph.getLoggability)
			action.undo();
		this.enableLogging()
	},
	redoNextAction: function () {
		var self = this;
		if (this.counter > this.stack.length) {
			console.log('Nothing to redo')
			return false
		}
		this.stack[this.counter] && this.stack[this.counter].reverse().each(function (ea) {
			self.redoAction(ea);
		})
		this.counter ++
	},
	redoAction: function (action) {
		this.disableLogging()
		if (action.morph.getLoggability && action.morph.getLoggability()  || !action.morph.getLoggability)
			action.redo()
		this.enableLogging()
	},
	enableLogging: function () {
		this.loggingEnabled = true
	},
	disableLogging: function () {
		this.loggingEnabled = false
	},
}, 
'logging disable and enable', {
	disableLoggingOfFunctionsFromClass: function (classObject, functionNamesArray) {
		var self = this,
			functionsObject = {};
		functionNamesArray.each(function (functionName) {
			functionsObject[functionName] = function () {
				var loggingEnabled = self.loggingEnabled
				self.disableLogging();
				var returnValue = cop.proceed.apply(cop, arguments)
				self.loggingEnabled = loggingEnabled;
				return returnValue
			}
		})
		LoggerLayer.refineClass(classObject, functionsObject);
	},
	disableLoggingForClass: function (classObject) {
		this.disableLoggingOfFunctionsFromClass(classObject, classObject.localFunctionNames().collect(function (ea) {return ea.toString()}).withoutAll(['constructor']))
	},
	enableLoggingOfFunctionsFromClass: function (classObject, functionNamesArray) {
		var self = this,
			functionsObject = {};
		functionNamesArray.each(function (functionName) {
			var logConditionFunctionName = 'beforeLog' + functionName[0].toUpperCase() + functionName.substring(1),
				logFunctionName = 'log' + functionName[0].toUpperCase() + functionName.substring(1);
			functionsObject[functionName] = function () {
				var logCondition = typeof this[logConditionFunctionName] === 'function' ? this[logConditionFunctionName].apply(this, arguments) : true;
				if (logCondition && typeof this[logFunctionName] === 'function') {
					self.logAction(this[logFunctionName].apply(this, arguments))
				}
				var loggingEnabled = self.loggingEnabled;
				self.disableLogging();
				var returnValue = cop.proceed.apply(cop, arguments);
				self.loggingEnabled = loggingEnabled;
				return returnValue;
			}
		})
		LoggerLayer.refineClass(classObject, functionsObject);
	}
}) // end of GlobalLogger

lively.morphic.Morph.addMethods(
'logging', {
	logMorphicSetter: function(propName, value) {	
        if (this.isLoggable) {
            var before = this['_' + propName],
                after = value,
                string = 'setting property '
					+ propName+' of '
					+ this.toString()
					+ ' from '
					+ this['_' + propName]
					+ ' to '
					+ value;
                return {
                    string: string,
					morph: this,
					type: 'property',
					time: (new Date ()).getTime(),
                    undo: (function () {
							if (propName === 'Position' && before === undefined)
								return false
							this['_' + propName] = before;
							return this.renderContextDispatch('set' + propName, before);
                        }).bind(this),
                    redo: (function () {
							if (propName === 'Position' && after === undefined)
								return false
							this['_' + propName] = after;
							return this.renderContextDispatch('set' + propName, after);
						}).bind(this)
                };
		}
		return false
    },
	beforeLogAddMorph: function (morph, optBeforeMorph) {
		if (morph.isLoggable === false || (!this.isLoggable && !(this instanceof lively.morphic.HandMorph))) {
			morph.withAllSubmorphsDo(function (ea) {
				ea.isLoggable = false
				ea.shape.isLoggable = false
			})
		}
		else if (morph.isLoggable === undefined)
			morph.isLoggable = true
		morph.shape.isLoggable = morph.isLoggable
		return true
	},
	logAddMorph: function (morph, optMorphBefore) {
		// dirty hack next line
		if ($world.GlobalLogger.loggingEnabled && morph.isLoggable && !(morph instanceof lively.morphic.Window)) {
			var string = 'adding Morph '
					+ morph.toString()
					+ ' to '
					+ this.toString(),
				owner = morph.owner

			if (owner && owner.isLoggable) {
				var undoFunc = owner.addMorph.bind(owner, morph, owner.submorphs.find(function (ea) {
					return owner.submorphs[(owner.submorphs.indexOf(ea))-1] === morph
				}))
			}
			else {
				var undoFunc = morph.remove.bind(morph);
			}
			if (!this.isLoggable && !(this instanceof lively.morphic.HandMorph)) {
				return false
			}
			var handPos = $world.firstHand().getPosition()
			return {
				string: string,
				morph: morph,
				type: 'addition',
				time: (new Date ()).getTime(),
				undo: function () {
						undoFunc()
					},
				redo: function () {
						if (owner instanceof lively.morphic.HandMorph)
							morph.setPosition(handPos.subPt(this.getPositionInWorld()))
						if (this.isLoggable)
							this.addMorph(morph, optMorphBefore)
						else
							morph.remove()
					}.bind(this)
			};
		}
		return false
    },
	logRemove: function () {
		// dirty hack next line
		if ($world.GlobalLogger.loggingEnabled && this.isLoggable && !(this instanceof lively.morphic.Window)) {
				var world = lively.morphic.World.current(),
				string = 'removing Morph '
					+ this.toString()
				owner = this.owner;
			if (owner)
				string.concat(' from ' + owner.toString())
			var action = {
				string: string,
				morph: this,
				type: 'removal',
				time: (new Date ()).getTime(),
				redo: function () {
						this.remove()
					}
			}
			if (owner) {
				action.undo = function () {
						if (owner instanceof lively.morphic.HandMorph)
								return
						owner.addMorph(this, owner.submorphs.find(function (ea) {
							return owner.submorphs[(owner.submorphs.indexOf(ea))-1] === this
						}.bind(this)))
					}
			}
			else {
				action.undo = function () {};
			}
			return action;
		}
		return false
	},
})

lively.morphic.Shapes.Shape.addMethods(
'logging', {
	logShapeSetter: function(propName, value) {	
        if (this.isLoggable) {
            var before = this['_' + propName],
                after = value,
                string = 'setting property '
					+ propName+' of '
					+ this.toString()
					+ ' from '
					+ this['_' + propName]
					+ ' to '
					+ value;
                return {
                    string: string,
					morph: this,
					type: 'property',
					time: (new Date ()).getTime(),
                    undo: (function () {
							if (propName === 'Position' && before === undefined)
								return false
							this['_' + propName] = before;
							return this.renderContextDispatch('set' + propName, before);
                        }).bind(this),
                    redo: (function () {
							if (propName === 'Position' && after === undefined)
								return false
							this['_' + propName] = after;
							return this.renderContextDispatch('set' + propName, after);
						}).bind(this)
                };
		}
		return false
    },
})

}) // end of module