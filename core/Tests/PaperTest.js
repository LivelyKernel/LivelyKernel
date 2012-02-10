module('Tests.PaperTest').requires('apps.paper').toRun(function() {

	TestCase.subclass('Tests.PaperTest.LaTeXTest', {
		setUp: function($super) {
			$super();
			this.sut = new PaperMorph()
		},

		test01CreateSimpleLaTeXOutput: function() {
			var title = this.sut.addTextMorph('LaTeXGenerator').beTitle();
			var abstract = this.sut.addTextMorph('Some abstract...').beAbstract();
			var section1 = this.sut.addTextMorph('This is section 1').beSection();
			var para1 = this.sut.addTextMorph('This is pargraph 1.').beParagraph();
			var subsection1 = this.sut.addTextMorph('This is a subsection').beSubSection();
			var para2 = this.sut.addTextMorph('This is pargraph 2.').beParagraph();

			var result = this.sut.createLaTeXBody();
			var expected =
'\\title{LaTeXGenerator}\n\n\
\\begin{abstract}\nSome abstract...\n\\end{abstract}\n\n\
\\section{This is section 1}\n\
This is pargraph 1.\n\n\
\\subsection{This is a subsection}\n\
This is pargraph 2.\n\n\
'
			this.assertEquals(expected, result);
		},

	});
TestCase.subclass('PaperLayerTextMorphTest',
'default category', {
	testGetHtmlStringBold: function() {

		var sut  = new TextMorph(new Rectangle(0,0,100,100), "Grüß Gott means Hello")
		sut.emphasizeFromTo({style: 'bold'},0,8)	
		sut.setWithLayers([PaperMorphLayer])
		var s = sut.getHTMLString()
		this.assertEquals(s, "<span class=\"strong\">Gr&uuml;&szlig; Gott</span> means Hello")


	},
	testGetHtmlStringWithItalic: function() {
		var sut  = new TextMorph(new Rectangle(0,0,100,100), "Grüß Gott means Hello")
		sut.emphasizeFromTo({style: 'italic'},0,8)	
		sut.setWithLayers([PaperMorphLayer])
		var s = sut.getHTMLString()
		this.assertEquals(s, "<span class=\"emph\">Gr&uuml;&szlig; Gott</span> means Hello")


	},
	testGetTextAnnotations: function() {

		var sut  = new TextMorph(new Rectangle(0,0,100,100), "Grüß Gott means Hello")
		sut.setWithLayers([PaperMorphLayer])
		sut.setWithoutLayers([UndoLayer])
		var a = sut.getTextAnnotations()

		sut.emphasizeFromTo({style: 'bold'},0,8)	
		var a = sut.getTextAnnotations()


	},

});

}) // end of module