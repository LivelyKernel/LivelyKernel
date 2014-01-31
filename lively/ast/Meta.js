module('lively.ast.Meta').requires('lively.ast.Parser').toRun(function() {

// Meta-Programming functions for displaying and saving functions
Function.addMethods(
'meta programming interface', {
    toSource: function() {
        if (!this.source) {
            var name = this.methodName || this.name || "anonymous";
            this.source = this.toString()
                .replace(/^function[^\(]*/, "function " + name);
        }
        return this.source;
    },
    browse: function() {
        if (this.sourceModule && this.methodName && this.declaredClass) {
            require('lively.ide.SystemCodeBrowser').toRun(function() {
                return lively.ide.browse(
                    this.declaredClass,
                    this.methodName,
                    this.sourceModule.name());
            }.bind(this));
        }
        //TODO: Add browse implementation for Morphic scripts with ObjectEditor
        throw new Error('Cannot browse anonymous function ' + this);
    },
    updateSource: function(source) {
        var ast = lively.ast.Parser.parse(source, "functionDef"),
            newFun = ast.val.eval();
        newFun.declaredClass = this.declaredClass;
        newFun.methodName = this.methodName;
        newFun.sourceModule = this.sourceModule;
        newFun.source = source;
        newFun.locallyChanged = true;
        // TODO: This should probably use 'addMethods' instead
        this.getClass().prototype[this.methodName] = newFun;
        lively.bindings.signal(this, 'localSource', newFun);
        lively.ast.Meta.ChangeSet.getCurrent().addChange(newFun);
    },
    getClass: function() {
        return lively.Class.forName(this.declaredClass);
    }
});

// Skeleton for ChangeSets support - still work in Progress
Object.subclass('lively.ast.Meta.ChangeSet',
'initializing', {
    initialize: function() {
        this.changes = [];
    }
},
'managing', {
    addChange: function(fun) {
        this.changes.push(fun);
        lively.bindings.signal(this.constructor, 'current', this);
    }
},
'persistence', {
    commit: function() {
        throw new Error('not implemented yet');
    }
},
'merging', {
    mergeWithCurrent: function() {
        throw new Error('not implemented yet');
    }
});

Object.extend(lively.ast.Meta.ChangeSet, {
    current: null,
    getCurrent: function() {
        if (!this.current) {
            this.current = new this();
        }
        return this.current;
    }
});

}) // end of module
