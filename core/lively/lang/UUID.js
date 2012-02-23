module('lively.lang.UUID').requires().toRun(function() {
    
///////////////////////////////////////////////////////////////////////////////
// Class defintion: UUID
///////////////////////////////////////////////////////////////////////////////

Object.subclass('UUID',
'generation', {
	initialize: function() {
		this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		}).toUpperCase();
	}
});

}); // end of module