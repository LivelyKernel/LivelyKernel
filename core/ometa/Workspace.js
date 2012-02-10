module('ometa.Workspace').requires('lively.Text').toRun(function() {

TextMorph.subclass('OmetaWorkspace', {

	style: {borderWidth: 0},

	boundEval: function(str) {
		return OMetaSupport.ometaEval.bind(this)(str)
	},
    
	matchAll: function(grammar, src, rule) {
		return this.callOMetaSupport(grammar, src, rule, 'matchAllWithGrammar')
	},

	match: function(grammar, src, rule) {
		return this.callOMetaSupport(grammar, src, rule , 'matchWithGrammar')
	},

	callOMetaSupport: function(grammar, src, rule, selector) {
		return OMetaSupport[selector](grammar, rule , src,
			function(src, rule, grammar, errorIndex) {
				var msg = OMetaSupport.handleErrorDebug(src, rule, grammar, errorIndex);
				WorldMorph.current().setStatusMessage(msg, Color.red, 8);
				throw new Error(msg)
			});
	},

	replaceTextMorph: function(textmorph) {
		if (textmorph.constructor != TextMorph)
			throw new Error('replaceTextMorph needs a text morph')
		this.setExtent(textmorph.getExtent());
		this.setPosition(textmorph.getPosition());
		var clip = textmorph.owner;
		textmorph.remove()
		clip.addMorph(this);
	},

	open: function(str) {
		var panel = WorldMorph.current().addTextWindow({title: 'OMeta workspace', content: str});
		this.replaceTextMorph(panel.innerMorph());
	},
    
});

/*
 * A sample OMeta Workspace with the simple interpreter from the OMeta-js Tutorial
 */

Object.extend(OmetaWorkspace, {
openOmetaWorkspace: function() {
    var w = new OmetaWorkspace();
	var content = "ometa Calc {  \n\
      digit    = super(#digit):d          -> digitValue(d),\n\
      number   = number:n digit:d         -> (n * 10 + d) \n\
               | digit,\n\
      addExpr  = addExpr:x '+' mulExpr:y  -> (x + y) \n\
               | addExpr:x '-' mulExpr:y  -> (x - y) \n\
               | mulExpr,\n\
      mulExpr  = mulExpr:x '*' primExpr:y -> (x * y)\n\
               | mulExpr:x '/' primExpr:y -> (x / y)\n\
               | primExpr,\n\
      primExpr = '(' expr:x ')'           -> x\n\
               | number,\n\
      expr     = addExpr\n\
    }\n\
    \n\
    Calc.matchAll('6*(4+3)', 'expr')";
	w.open(content);
	return w
},
});

}) // end of module