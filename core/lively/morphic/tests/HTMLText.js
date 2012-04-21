module('lively.morphic.tests.HTMLText').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HTMLText.TextAttributes',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
        this.text = new lively.morphic.Text(new Rectangle(0,0, 400, 200));
        this.world.addMorph(this.text);
    },
},
'testing', {
    test01RenderingTextShadow: function() {
        this.text.setTextString('eintest');
        this.text.emphasizeAll({textShadow: {offset: pt(1,1), blur: 2, color: Color.red}});
        this.checkChunks([{textString: 'eintest'}]);
        debugger
        this.checkDOM([{
            tagName: 'span',
            textContent: 'eintest',
            style: {textShadow: ['rgb(204,0,0)', '1px', '1px', '2px'].join('')}
        }]);
    }
});

});