module('lively.morphic.GlobalLogger').requires('lively.ide.SystemCodeBrowser', 'lively.morphic.ColorChooserDraft').toRun(function() {
Object.subclass('lively.GlobalLogger',
'properties', {
    loggedFunctions: [
        /* 
        ** To log a function called functionName, add functions 'beforeLogFunctionName', 'logFunctionName' and 'afterLogFunctionName', if you need them.
        ** The execution of logFunctionName will not be logged, as well as side functions.
        ** If beforeFunctionName returns a falsee, logFunctionName will not be executed. 
        */
        [lively.morphic.Morph, ['addMorph', 'remove', 'morphicSetter', 'addScript', 'openInWindow', 'lock', 'unlock', 'startStepping', 'stopSteppingScriptNamed', 'stopStepping']],
        [lively.morphic.Shapes.Shape, ['shapeSetter']]
    ],
    silentFunctions: [
        /* 
        ** Add functions of Classes that are not supposed to be logged.
        ** This will create an invisible layered function that prevents logging of this function.
        */
        [lively.morphic.World, ['openInspectorFor', 'openStyleEditorFor', 'openPartsBin', 'openMethodFinderFor', 'prompt', 'openWorkspace', 'setStatusMessage', 'openSystemBrowser']],
        [lively.morphic.Morph, ['showMorphMenu', 'showHalos', 'animatedPathStep']],
        [lively.morphic.Menu, ['initialize', 'openIn', 'remove']],
        [lively.morphic.Text, ['doFind']],
        [lively.morphic.MenuItem, ['initialize']],
        [lively.morphic.Script, ['tick']]
    ],
    silentClasses: [
        /* 
        ** No function of these classes will ever be logged.
        */
        lively.morphic.Menu, lively.morphic.Tree, lively.morphic.PromptDialog, lively.morphic.AwesomeColorField, lively.morphic.List
    ]
},
'initialization', {
    initialize: function () {
        this.stack = [];
        this.counter = 0;
        this.buildLoggerLayer();
        this.enableLogging();
    },
    buildLoggerLayer: function () {
        // Creates a hidden Layer to cover loggable and explicitly unloggable functions
        var self = this;
        cop.create('LoggerLayer');
        LoggerLayer.hide()
        this.initializeLayer();
        LoggerLayer.beGlobal();
    },
    initializeLayer: function () {
        // Covers functions added to silentFunctions, silentClasses and loggedFunctions, also all enableFunction and disable Function for Morphs.
        var self = this
        this.silentFunctions.each(function (extendableClass) {
            extendableClass[0] && self.disableLoggingOfFunctionsFromClass(extendableClass[0], extendableClass[1]);
        })
        this.silentClasses.each(function (eachClass) {
            self.disableLoggingForClass(eachClass);
        })
        this.loggedFunctions.each(function (extendableClass) {
            self.enableLoggingOfFunctionsFromClass(extendableClass[0], extendableClass[1]);
        })
        this.createMorphLoggersForEnablingAndDisabling();
    },
},
'logging', {
    logAction: function(action) {
        /* 
        ** Writes the action to $world.GlobalLogger.stack, if the target of the action is loggable.
        ** Actions that happen at the same time are bundeled, so they can be reverted at once.
        */
        if (!action || !this.shouldLog(action.morph)) return false
        action.time = Date.now();
        if (this.stack.length > this.counter)
            this.stack.splice(this.counter)
        var lastAction = this.stack.last() && this.stack.last().last()
        if (lastAction && !(this.stack.last().isFull) && (action.time - lastAction.time) <= 100) {
            this.stack.last().push(action)
        }
        else {
            this.stack.push([action])
            this.counter ++
        }
        return action
    },
    forceNewSlot: function () {
        // enforces to open a new set of undoable actions
        this.stack.last() && (this.stack.last().isFull = true)
    },
    shouldLog: function(item) {
        // determines whether an item (morph, shape, etc) is supposed to be logged in certain circumstances
        if (!this.loggingEnabled || (item && !item.isLoggable)) return false;
        return true
    }

},
'undoredo', {
    undoLastAction: function () {
        // Reverts the last bulk of actions logged, in reverse order.
        var self = this;
        if (this.counter <= 0) {
            lively.morphic.World.current().alert('Nothing to undo')
            return false
        }
        this.counter --
        this.stack[this.counter] && this.stack[this.counter].reverse().each(function (ea) {
            self.undoAction(ea);
        })
    },
    undoAction: function (action) {
        // Undos an action without logging the side effects of undoing
        this.disableLogging(true)
        action.undo();
        this.enableLogging()
    },
    redoNextAction: function () {
        // re-executes the currently next bulk of actions
        var self = this;
        if (this.counter > this.stack.length) {
            lively.morphic.World.current().alert('Nothing to redo')
            return false
        }
        this.stack[this.counter] && this.stack[this.counter].reverse().each(function (ea) {
            self.redoAction(ea);
        })
        this.counter ++
    },
    redoAction: function (action) {
        // Redos an action without logging the side effects of redoing
        this.disableLogging(true)
        if (action.morph.getLoggability && action.morph.getLoggability()  || !action.morph.getLoggability)
            action.redo()
        this.enableLogging()
    },
}, 
'disable and enable', {
    enableLogging: function () {
        this.loggingEnabled = true
        this.workingOnAction = false
    },
    disableLogging: function (definite) {
        // disables the GlobalLogger temporarily and returns whether it was enabled before, or not.
        var enabled = this.loggingEnabled
        this.loggingEnabled = false
        this.workingOnAction = definite
        return enabled
    },
},
'disable and enable context', {
    enableLoggingOfFunctionsFromClass: function (classObject, functionNames) {
        // Adds a layered function that enables logging of certain functions
        var self = this,
            functionsObject = {};
        functionNames.each(function (functionName) {
            // Pattern to work with functionName: beforeLogFunctionName, logFunctionName, afterLogFunctionName
            var beforeLogFunctionName = 'beforeLog' + functionName.capitalize(),
                logFunctionName = 'log' + functionName.capitalize(),
                afterLogFunctionName = 'afterLog' + functionName.capitalize();
            functionsObject[functionName] = function () {
                // beforeLogFunctionName
                var logCondition = Object.isFunction(this[beforeLogFunctionName]) ? this[beforeLogFunctionName].apply(this, arguments) : true;
                if (logFunctionName && Object.isFunction(this[logFunctionName])) {
                    // logFunctionName
                    var action = this[logFunctionName].apply(this, arguments)
                    action.logString = ('calling '+functionName+' on '+(this.toString && this.toString()));
                    var logResult = self.logAction(action)
                }
                var loggingEnabled = self.disableLogging();
                // functionName
                var returnValue = cop.proceed.apply(cop, arguments);
                if (logResult && afterLogFunctionName && Object.isFunction(this[afterLogFunctionName])) {
                    // afterLogFunctionName
                    this[afterLogFunctionName].apply(this, returnValue) 
                }
                self.loggingEnabled = loggingEnabled;
                return returnValue;
            }
        })
        LoggerLayer.refineClass(classObject, functionsObject);
    },
    disableLoggingOfFunctionsFromClass: function (classObject, functionNames) {
        // Disable logging of certain functions (e.g. Tool functionality)
        var self = this,
            functionsObject = {};
        functionNames.each(function (functionName) {
            functionsObject[functionName] = function () {
                var loggingEnabled = self.disableLogging();
                var returnValue = cop.proceed.apply(cop, arguments)
                self.loggingEnabled = loggingEnabled;
                return returnValue
            }
        })
        LoggerLayer.refineClass(classObject, functionsObject);
    },
    disableLoggingForClass: function (classObject) {
        // Disable every action of a Class (useful e.g. for Halo and HaloItem)
        var loggableClasses = classObject.localFunctionNames()
                                .collect(function (ea) {return ea.toString()})
                                .without('constructor')
        this.disableLoggingOfFunctionsFromClass(classObject, loggableClasses)
    },
}, 'special morphic functions', {
    createActionForAbler: function (functionName) {
        // returns a function that enables logging for functionName
        var functionPieces = functionName.split('able'),
            suffix = functionPieces.splice(1).join('able'),
            counterFunctionName = functionPieces[0] == 'dis'? 'enable'+suffix : 'disable'+suffix;
        return {
            morph: this,
            undo: (function () {
                    try {
                        this[counterFunctionName] && this[counterFunctionName].apply(this)
                    }
                    catch (e) {
                        alert('unable to undo '+ functionName +" with Error"+'\n'+e)
                    }
                }).bind(this),
            redo: (function () {
                    try {
                        this[functionName] && this[functionName].apply(this)
                    }
                    catch (e) {
                        alert('unable to redo ' + functionName +" with Error"+'\n'+e)
                    }
                }).bind(this)
        }
    },
    createMorphLoggersForEnablingAndDisabling: function () {
        // Morph functions that follow the patter enableSomething and disableSomething are always logged
        var functionsObject = {},
            functionNames = lively.morphic.Morph.localFunctionNames(),
            self = this;
        functionNames.each(function (functionName) {
            if (functionName.startsWith('enable')) {
                var suffix = functionName.slice('enable'.length)
                if (!functionNames.include('disable'+suffix)) return
                functionsObject['enable'+suffix] = function () {
                    self.logAction(self.createActionForAbler(functionName))
                    var returnValue = cop.proceed.apply(cop, arguments)
                    return returnValue
                };
                functionsObject['disable'+suffix] = function () {
                    self.logAction(self.createActionForAbler(functionName))
                    var returnValue = cop.proceed.apply(cop, arguments)
                    return returnValue
                }
            }
        })
        LoggerLayer.refineClass(lively.morphic.Morph, functionsObject);
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
    beforeLogOpenInwindow: function (optPos) {
        return (this.isLoggable === true)
    },
    logOpenInWindow: function (optPos) {
        var owner = this.owner,
            pos = this.getPosition(),
            loggable = this.isLoggable,
            self = this;
        return {
            morph: this,
            undo: (function () {
                this.windowMorph = self.owner
                this.insidePosition = self.getPosition()
                owner.addMorph(self)
                self.setPosition(pos)
                this.windowMorph.remove()
                self.isLoggable = loggable
            }),
            redo: (function () {
                if (this.windowMorph) {
                    lively.morphic.World.current().addMorph(this.windowMorph)
                    this.windowMorph.addMorphBack(self)
                    self.setPosition(this.insidePosition)
                    self.setPosition
                }
                else
                    self.openInWindow(optPos)
                self.afterLogOpenInWindow()
            })
        }
    },
    afterLogOpenInWindow: function () {
        this.owner.withAllSubmorphsDo(function (ea) {
            ea.isLoggable = true;
            ea.shape.isLoggable = true;
        })
    },
    logLock: function () {
        return {
            morph: this,
            undo: (function () {
                this.unlock()
            }).bind(this),
            redo: (function () {
                this.lock()
            }).bind(this)
        }
    },
    logUnlock: function () {
        return {
            morph: this,
            undo: (function () {
                this.lock()
            }).bind(this),
            redo: (function () {
                this.unlock()
            }).bind(this)
        }
    },
    beforeLogStartStepping: function(stepTime, scriptName, argIfAny) {
        if (Object.isFunction(this[scriptName]))
            this[scriptName](argIfAny)
        window.setTimeout(stepTime)
        return true
    },

    logStartStepping: function(stepTime, scriptName, argIfAny) {
        return {
            morph: this,
            undo: function () {
                this.stopSteppingScriptNamed(scriptName)
            }.bind(this),
            redo: function () {
                this.startStepping(stepTime, scriptName, argIfAny);
            }.bind(this)
        }
    },
    logStopSteppingScriptNamed: function(selector) {
        var currentScripts = this.scripts.select(function(ea) { return ea.selector === selector });
        return {
            morph: this,
            undo: function () {
                var self = this;
                currentScripts.each(function (eachScript) {
                    self.startStepping.apply(self, [eachScript.tickTime, eachScript.selector].concat(eachScript.args))
                })
            }.bind(this),
            redo: function () {
                this.stopSteppingScriptNamed(selector)
            }.bind(this)
        }
    },
    logStopStepping: function() {
        var self = this,
            currentScripts = Object.clone(this.scripts)
        return {
            morph: this,
            undo: function () {
                currentScripts.each(function (ea) {
                    self.startStepping.apply(self, [ea.tickTime, ea.selector].concat(ea.args))
                })
            }.bind(this),
            redo: function () {
                this.stopStepping()
            }.bind(this)
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

lively.morphic.World.addMethods(
'logging', {
    loadPartItem: function (partName, optPartspaceName) {
        var optPartspaceName = optPartspaceName || 'PartsBin/NewWorld';
        var part = lively.PartsBin.getPart(partName, optPartspaceName);
        if (optPartspaceName && optPartspaceName.include('Tools')) {
            part.isLoggable = false
            part.shape.isLoggable = false
        }
        if (!part)
            return;
        if (part.onCreateFromPartsBin) part.onCreateFromPartsBin();
        return part;
    }
})

}) // end of module