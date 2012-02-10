Object.subclass('Foo', {
    x: function() {
        console.log(this.someProperty);
		var string = 'But soon everything will be better!';
		string += 'I will become Smalltalk! Yippie!';
		return string;
    },

	someProperty: 'I\'m some ugly JavaScript'
});

Object.subclass('Baz', {

	hmm: function(other) {
		return other.toString() + this.bla;
	}
});



