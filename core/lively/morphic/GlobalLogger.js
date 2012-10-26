module('lively.morphic.GlobalLogger').requires().toRun(function() {
Object.subclass('lively.GlobalLogger',
'properties', {
    loggedFunctions: [
        [lively.morphic.Morph, ['addMorph', 'remove', 'morphicSetter', 'addScript', 'openInWindow']],
        [lively.morphic.Shapes.Shape, ['shapeSetter']]
    ],
    silentFunctions: [
        [lively.morphic.World, ['openInspectorFor', 'openStyleEditorFor', 'openPartsBin', 'openMethodFinderFor', 'prompt', 'openWorkspace', 'alert', 'alertOK']],
        [lively.morphic.Morph, ['showMorphMenu', 'showHalos']],
        [lively.morphic.Menu, ['initialize', 'openIn', 'remove']],
        [lively.morphic.Text, ['doFind']]
    ],
    silentClasses: [lively.morphic.Menu, lively.morphic.MenuItem, lively.morphic.PromptDialog/*, lively.morphic.ColorChooser*/] // loadging order
},     'initialization', {
    initialize: function () {
        this.stack = [];
        this.counter = 0;
        this.initializeSilentList();
        this.enableLogging();
    },
    initializeSilentList: function () {
        var self = this;
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
},    'logging', {
    logAction: function(action) {
        if (!action || !this.loggingEnabled || (action.morph && !action.morph.isLoggable)) return false;
        var parentWantsNoUndo = action.morph.ownerChain? action.morph.ownerChain().detect(function (ea) { return !ea.isLoggable && !ea.isHand }) : false;
        if (parentWantsNoUndo) return false
        action.time = Date.now();
        if (this.stack.length > this.counter) {
            this.stack.splice(this.counter)
        }
        // keep changes at a bundle if they happen at the same time
        var lastAction = this.stack.last() && this.stack.last().last()
        if ( lastAction && (action.time - lastAction.time) <= 100) {
            this.stack.last().push(action)
        }
        else {
            this.stack.push([action])
            this.counter ++
        }
        return true
    },
    undoLastAction: function () {
        var self = this;
        if (this.counter <= 0) {
            console.log('Nothing to undo')
            return false
        }
        var actionIndex = this.counter-1
        this.stack[actionIndex] && this.stack[actionIndex].reverse().each(function (ea) {
            self.undoAction(ea);
        })
        this.counter --
    },
    undoAction: function (action) {
        this.disableLogging(true)
        if ((action.morph.getLoggability && action.morph.getLoggability()) || !action.morph.getLoggability)
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
        this.disableLogging(true)
        if (action.morph.getLoggability && action.morph.getLoggability()  || !action.morph.getLoggability)
            action.redo()
        this.enableLogging()
    },
}, 
'logging disable and enable', {
    enableLogging: function () {
        this.loggingEnabled = true
        this.workingOnAction = false
    },
    disableLogging: function (definite) {
        this.loggingEnabled = false
        this.workingOnAction = definite
    },
    disableLoggingOfFunctionsFromClass: function (classObject, functionNames) {
        var self = this,
            functionsObject = {};
        functionNames.each(function (functionName) {
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
        var loggableClasses = classObject.localFunctionNames()
                                .collect(function (ea) {return ea.toString()})
                                .without('constructor')
        this.disableLoggingOfFunctionsFromClass(classObject, loggableClasses)
    },
    enableLoggingOfFunctionsFromClass: function (classObject, functionNames) {
        var self = this,
            functionsObject = {};
        functionNames.each(function (functionName) {
            var logConditionFunctionName = 'beforeLog' + functionName[0].toUpperCase() + functionName.substring(1),
                logFunctionName = 'log' + functionName[0].toUpperCase() + functionName.substring(1);
            functionsObject[functionName] = function () {
                var logCondition = typeof this[logConditionFunctionName] === 'function' ? this[logConditionFunctionName].apply(this, arguments) : true;
                if (logFunctionName && Object.isFunction(this[logFunctionName])) {
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
	getLoggability: function () {
        var unloggableParent = this.ownerChain().find(function (ea) {
				return ea.isHand || !ea.isLoggable
			})
		return !unloggableParent
	},
    logMorphicSetter: function(propName, value) {
        if (!(Object.isString(propName) && this.isLoggable))
            return false
        var before = this['_' + propName],
            after = value;
        return {
            morph: this,
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
    },
    beforeLogAddMorph: function (morph, optBeforeMorph) {
        if (morph.isHand)
            return false
        if (!lively.morphic.World.current().GlobalLogger.loggingEnabled && !lively.morphic.World.current().GlobalLogger.workingOnAction && !(this.isHand)) {
            morph.isLoggable = false
        }
        if ((morph.isLoggable === false && !morph.isHand) || (!this.isLoggable && !(this.isHand))) {
            morph.withAllSubmorphsDo(function (ea) {
                ea.isLoggable = false
                ea.shape.isLoggable = false
            })
        }
        else if (morph.isLoggable === undefined)
            morph.isLoggable = true
        morph.shape && (morph.shape.isLoggable = morph.isLoggable)
        return true
    },
    logAddMorph: function (morph, optMorphBefore) {
        var goesToUnloggable = !this.isLoggable && !this.isHand
        if (lively.morphic.World.current().GlobalLogger.loggingEnabled && morph.isLoggable && !goesToUnloggable) {
            var owner = morph.owner
            if (owner && owner.isLoggable) {
                var undoFunc = owner.addMorph.bind(owner, morph, owner.submorphs.find(function (ea) {
                    return owner.submorphs[(owner.submorphs.indexOf(ea))-1] === morph
                }))
            }
            else {
                var undoFunc = morph.remove.bind(morph);
            }
            var curPos = morph.getPositionInWorld();
            return {
                morph: morph,
                undo: function () {
                        undoFunc()
                    },
                redo: function () {
                        if (this.isLoggable) {
                            debugger
                            this.addMorph(morph, optMorphBefore)
                            var ownerOrigin = (this.getPositionInWorld? this.getPositionInWorld() : this.getPosition()).addPt(this.getOrigin());
                            morph.setPosition(curPos.subPt(ownerOrigin).addPt(morph.getOrigin()))
                        }
                        else
                            morph.remove()
                    }.bind(this)
            };
        }
        return false
    },
    logRemove: function () {
        // dirty hack next line
        if (lively.morphic.World.current().GlobalLogger.loggingEnabled && this.isLoggable /*&& !(this instanceof lively.morphic.Window)*/) {
                var world = lively.morphic.World.current(),
                    owner = this.owner,
                    self = this;
            var action = {
                morph: this,
                redo: function () {
                        self.remove()
                    }
            }
            if (owner) {
                action.undo = function () {
                        if (owner.isHand)
                                return
                        owner.addMorph(self, owner.submorphs.find(function (ea) {
                            return owner.submorphs[(owner.submorphs.indexOf(ea))-1] === self
                        }))
                    }
            }
            else {
                action.undo = function () {};
            }
            return action;
        }
        return false
    },
    beforeLogAddScript: function (funcOrString, optName) {
        return funcOrString
    },
    logAddScript: function (funcOrString, optName) {
        return {
            morph: this,
            undo: (function () {
                var func = Function.fromString(funcOrString)
                this.stopSteppingScriptNamed(func.name) //not neccessary
                delete this[func.name]
            }).bind(this),
            redo: (function () {
                this.addScript(funcOrString, optName)
            }).bind(this)
        }
    },
    logOpenInWindow: function (optPos) {
        var owner = this.owner
        return {
            morph: this,
            undo: (function () {
                var windowMorphs = this.owner
                owner.addMorph(this)
                windowMorphs.remove()
            }),
            redo: (function () {
                this.openInWindow()
            }).bind(this)
        }
    }
})

lively.morphic.Shapes.Shape.addMethods(
'logging', {
    logShapeSetter: function(propName, value) {
        if (!(Object.isString(propName) && this.isLoggable))
            return false
        var before = this['_' + propName],
            after = value;
        return {
            morph: this,
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
    },
})

}) // end of module