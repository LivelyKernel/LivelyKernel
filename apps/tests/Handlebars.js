module('apps.tests.Handlebars').requires('lively.morphic.tests.Helper', 'apps.Handlebars').toRun(function() {

lively.morphic.tests.MorphTests.subclass('apps.tests.Handlebars.Simple',
'running', {
    setUp: function($super) {
        $super();
        this.savedTemplates = Handlebars.templates;
        Handlebars.templates = {};
    },

    tearDown: function($super) {
        $super();
        Handlebars.templates = this.savedTemplates;
    }
},
'testing', {

    test01RenderSimpleTemplate: function() {
        var m = new lively.morphic.HandlebarsMorph({}, "handlebarsTest1");
        apps.Handlebars.set("handlebarsTest1", '<h1>test</h1>');
        this.assertEquals('h1', m.jQuery().children()[0].tagName);
        this.assertEquals('test', m.jQuery().children()[0].textContent);
    },

    test02BindMorphMethod: function() {
        var m = new lively.morphic.HandlebarsMorph({}, "handlebarsTest2");
        this.world.addMorph(m); // need to be in DOM for event handler, grrr
        m.addScript(function testClick(evt) { this.clicked = true });
        apps.Handlebars.set("handlebarsTest2", '<h1 {{{bindEvent onclick="testClick"}}}>test</h1>');
        debugger;
        m.jQuery().find('h1').trigger('click');
        this.assert(m.clicked, 'click binding did not work');
    }

});

}); // end of module
