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
        if (    action
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
        this.disableLogging(true)
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
        }
        return false
    },
    beforeLogAddMorph: function (morph, optBeforeMorph) {
        if (!$world.GlobalLogger.loggingEnabled && !$world.GlobalLogger.workingOnAction && !(this instanceof lively.morphic.HandMorph)) {
            morph.isLoggable = false
        }
        if (morph.isLoggable === false || (!this.isLoggable && !(this instanceof lively.morphic.HandMorph))) {
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
        // dirty hack next line
        if ($world.GlobalLogger.loggingEnabled && morph.isLoggable /*&& !(morph instanceof lively.morphic.Window)*/) {
            var owner = morph.owner

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
            var curPos = morph.getPositionInWorld();
            return {
                morph: morph,
                undo: function () {
                        undoFunc()
                    },
                redo: function () {
                        if (this.isLoggable) {
                            this.addMorph(morph, optMorphBefore)
                            var ownerPos = this.getPositionInWorld? this.getPositionInWorld() : this.getPosition();
                            morph.setPosition(curPos.subPt(ownerPos).addPt(morph.getOrigin()))
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
        if ($world.GlobalLogger.loggingEnabled && this.isLoggable /*&& !(this instanceof lively.morphic.Window)*/) {
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
                        debugger
                        if (owner instanceof lively.morphic.HandMorph)
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
        if (this.isLoggable) {
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
        }
        return false
    },
})

}) // end of module