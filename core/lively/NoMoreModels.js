module('lively.NoMoreModels').requires('lively.OldModel').toRun(function() {

// somehow we have to port the old code
Object.subclass('DeprecatedView', {
	setModelValue: function(name, value) {
		var varName = name.replace(/set(.*)/, '$1');
		return this['__' + varName] = value;
	},
	getModelValue: function(name) {
		var varName = name.replace(/set(.*)/, '$1');
		return this['__' + varName];
	},
	connectModel: function(model) {
		this.deprecatedModel = model;
		if (model.model) {
			Properties.own(model).forEach(function(name) {
				connect(this, model[name], model.model, name, {
					converter: function(v) { alert(this.toString(v)); return v }})
			}, this)
		} else { alert('connectModel: cannot handle ' + model) }
	},
	disconnectModel: function(model) { alert('disconnectModel: ' + model) },
});

}) // end of module