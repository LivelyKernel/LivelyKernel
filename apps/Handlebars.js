
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FIXME adding an external JS file as a module dependency should be integrated
// into the module system
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
Object.extend(apps.Handlebars, {

    hasPendingRequirements: apps.Handlebars.hasPendingRequirements.wrap(function(proceed) {
        return proceed() || !this.libLoaded();
    }),

    libLoaded: function() { return !!Global.Handlebars; }
});

(function loadHandlebars() {
    var url = URL.codeBase.withFilename('lib/handlebars-1.0.rc.1.js').toString();
    JSLoader.loadJs(url);
    apps.Handlebars.loadTestPolling = Global.setInterval(function() { apps.Handlebars.load(); }, 50);
})();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/*
 * ## Usage
 *
 * Handlebars templates can be used to integrate arbitrary HTML structures
 * into Lively and tie the Lively and HTML world together. Examples:
 *
 * // create a Handlebars morph and assign a simple HTML tree to it
 * m = new lively.morphic.HandlebarsMorph({}, "handlebarsTest");
 * m.openInWorld();
 * apps.Handlebars.set("handlebarsTest", '<h1>test</h1>');
 *
 * // setting a model that is used when rendering
 * // note that when updating the model or the template changes will be
 * // rendered immediately
 * m.model = {heading: 'this is a test', list: ['Foo', 'Bar', 'Baz']}
 * apps.Handlebars.set("handlebarsTest",
 *                     '<h1>{{heading}}</h1>'
 *                   + '<ul>'
 *                   + '  {{#each list}}<li>{{this}}</li>{{/each}}'
 *                   + '</ul>');
 *
 * // bind events to a new method
 * apps.Handlebars.set("handlebarsTest",
 *                     '<h1>A list</h1>'
 *                   + '<ul>'
 *                   + '  {{#each list}}'
 *                   + '  <li {{{bindEvent onclick="sayHello"}}}>{{this}}</li>'
 *                   + '  {{/each}}'
 *                   + '</ul>');
 *
 * m.addScript(function sayHello(evt,el) {
 *     alert(el.textContent);
 * });
 *
 */

module('apps.Handlebars').requires('lively.morphic').toRun(function() {

(function setupHandlebars() {
    Global.clearInterval(apps.Handlebars.loadTestPolling);

    Handlebars.templates = {}

    Handlebars.registerHelper('bindEvent', function(bindSpec) {
        return Properties.forEachOwn(bindSpec.hash, function(domEventHandlerName, methodName) {
            return Strings.format('%s="return $(this).parents(\'.HandlebarsMorph\')'
                                 + '.data(\'morph\')[\'%s\'](event, this);"',
                                  domEventHandlerName, methodName);
        }).join(' ');
    });

})();

Object.extend(apps.Handlebars, {
    loadTemplate: function(path) {
        if (!path.endsWith('.handlebars')) path += '.handlebars';
        var templateName = path.slice(path.lastIndexOf('/')+1, path.lastIndexOf('.')),
            url = URL.root.withFilename(path),
            template = url.asWebResource().get().content;
        return this.set(templateName, template);
    },

    set: function(name, template) {
        return Handlebars.templates[name] = Handlebars.compile(template);
    }
});

lively.morphic.HtmlWrapperMorph.subclass('lively.morphic.HandlebarsMorph',
'settings', {
    defaultExtent: pt(300, 400),
    connections: {templateChanged: {}}
},
'initializing', {
    initialize: function($super, model, templateName) {
        $super(this.defaultExtent);
        this.model = model;
        this.templateName = templateName;
        // model changes have an immediate effect:
        connect(this, 'model', this, 'renderHandleBarsTemplate');
        // template changes also:
        this.connectToHandlebarsTemplateChange();

        // if a template with templateName already exist we use that for
        // rendering right now
        if (Handlebars.templates[templateName]) {
            lively.bindings.signal(Handlebars.templates, templateName,
                                   Handlebars.templates[templateName][templateName]);
        }

        // for binding events / other actions from DOM actions to the morphic
        // world we use the data-morph attribute to point to "this"
        this.jQuery().data("morph", this);

        // FIXME is there a better way to set CSS?
        this.setStyleSheet('.HandlebarsMorph {'
                          + '  background-color: white !important;'
                          + '}');
    },

    connectToHandlebarsTemplateChange: function() {
        connect(Handlebars.templates, this.templateName, this, 'renderHandleBarsTemplate', {
            forceAttributeConnection: true
        });
    }
},
'template processing', {
    renderHandleBarsTemplate: function() {
        // get the compiled template, render it, and assign its results as sub
        // elements
        var template = Handlebars.templates[this.templateName],
            $node = this.jQuery();
        $node.data("morph", this); // for bindEve
        if (!template) return;
        $node.html(template(this.model || {}));
        this.fitToElements.bind(this).delay(0);
        lively.bindings.signal(this, 'templateChanged', this);
    },

    remove: function($super) {
        $super();
        // cleanup when being removed. Since we connect from the global
        // Handlebars.templates object to this we need to remove the
        // connection for garbage collection
        disconnect(Handlebars.templates, this.templateName, this, 'renderHandleBarsTemplate');
        connect(this, 'owner', this, 'connectToHandlebarsTemplateChange', {
            removeAfterUpdate: true
        });
    }
},
'rendering', {
    fitToElements: function() {
        // sets the extent of the morph so that it fits the extent if the
        // elements rendered by the template
        var bounds = this.jQuery().children().bounds({withMargin: true, withPadding: true});
        this.setExtent(pt(bounds.width(), bounds.height()));
    },

    onRenderFinished: function($super, ctx) {
        $super(ctx);
        this.renderHandleBarsTemplate();
    }
});


}); // end of module